import * as vscode from 'vscode';
import { OrchestratorAdapter } from './orchestrator-adapter';
import { SessionMemory } from './session-memory';

/**
 * Information about a selected maintenance agent
 */
interface AgentInfo {
    name: string;
    description: string;
    score: number;
}

/**
 * Response from the orchestrator
 */
interface OrchestratorResponse {
    selectedAgents: AgentInfo[];
    fullPrompt: string;
    agentCount: number;
    summary: string;
}

/**
 * Chat participant for handling maintenance agent requests.
 *
 * Routes the user query through the orchestrator, then sends the resulting
 * agent-context prompt plus workspace information to the model the user
 * has already selected in the Copilot Chat picker.
 */
export class MaintenanceAgentParticipant {
    constructor(private adapter: OrchestratorAdapter, private memory: SessionMemory) {}

    /**
     * Handles incoming chat requests.
     *
     * @param request  The chat request — carries prompt, command, and the
     *                 model the user selected in the Copilot Chat picker
     * @param context  Chat context — carries prior conversation history
     * @param stream   Response stream for sending replies
     * @param token    Cancellation token
     */
    async handleRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        try {
            const userQuery = request.prompt;
            const command = this.extractCommand(request.command);

            // Step 1 — use the model the user already selected in the Copilot Chat picker
            const model = request.model;

            // Route the query and build agent-context prompt
            stream.progress('Selecting agents...');
            const response = await this.adapter.processQuery(userQuery, command);

            // Step 2 — show compact routing summary card (replaces raw prompt dump)
            this.showRoutingSummary(response.selectedAgents, stream);

            // Step 3 — build the message array
            const messages: vscode.LanguageModelChatMessage[] = [];

            // 3a: agent context — fullPrompt becomes the LLM's knowledge frame,
            //     not shown to the user. Prepend prior session history if available.
            const sessionContext = this.memory.getRecentContext(3);
            const systemContent = (sessionContext ? sessionContext + '\n\n' : '') +
                response.fullPrompt +
                '\n\n---\n' +
                'Using the agent expertise above, answer the following with specific, actionable advice:';
            messages.push(vscode.LanguageModelChatMessage.User(systemContent));
            messages.push(vscode.LanguageModelChatMessage.Assistant(
                "Understood. I'll provide specific, actionable guidance based on the selected maintenance agents."
            ));

            // 3b: chat history — prior turns of this @maintenance conversation
            //     so the user can refer back to earlier answers
            this.appendChatHistory(context, messages);

            // 3c + 3d: workspace context (active file, build file, diagnostics)
            //           prepended to the current user question as the final message
            stream.progress('Reading workspace context...');
            const userMessage = await this.buildUserMessage(userQuery);
            messages.push(vscode.LanguageModelChatMessage.User(userMessage));

            // Step 4 — stream the LLM response
            const lmResponse = await model.sendRequest(messages, {}, token);
            for await (const chunk of lmResponse.text) {
                stream.markdown(chunk);
            }

            // Step 5 — persist this query to session history
            this.memory.save(
                userQuery,
                response.selectedAgents.map(a => a.name),
                command
            );

        } catch (error) {
            // Step 5 — handle cancellation silently; surface unexpected errors
            if (error instanceof vscode.LanguageModelError) {
                return;
            }
            const msg = error instanceof Error ? error.message : String(error);
            stream.markdown(`⚠️ Error processing your request: ${msg}`);
        }
    }

    // -------------------------------------------------------------------------
    // Step 2 — Routing summary card
    // -------------------------------------------------------------------------

    /**
     * Streams a compact table showing which agents were selected and their scores.
     * Replaces the previous behaviour of dumping the raw system prompt to the user.
     */
    private showRoutingSummary(agents: AgentInfo[], stream: vscode.ChatResponseStream): void {
        if (agents.length === 0) {
            stream.markdown('_No agents matched your query. Try rephrasing with more specific terms._\n\n');
            return;
        }

        stream.markdown(`**Routing — ${agents.length} agent${agents.length !== 1 ? 's' : ''} selected**\n\n`);
        stream.markdown('| Agent | Score |\n|-------|-------|\n');
        for (const agent of agents) {
            stream.markdown(`| ${agent.name} | ${agent.score}/140 |\n`);
        }
        stream.markdown('\n---\n\n');
    }

    // -------------------------------------------------------------------------
    // Step 3b — Chat history
    // -------------------------------------------------------------------------

    /**
     * Appends the prior @maintenance conversation turns to the message array
     * so the model can follow up on earlier answers.
     * Capped at the last 10 turns to avoid token overflow.
     */
    private appendChatHistory(
        context: vscode.ChatContext,
        messages: vscode.LanguageModelChatMessage[]
    ): void {
        const recentHistory = context.history.slice(-10);

        for (const turn of recentHistory) {
            if (turn instanceof vscode.ChatRequestTurn) {
                messages.push(vscode.LanguageModelChatMessage.User(turn.prompt));
            } else if (turn instanceof vscode.ChatResponseTurn) {
                const text = turn.response
                    .filter(p => p instanceof vscode.ChatResponseMarkdownPart)
                    .map(p => (p as vscode.ChatResponseMarkdownPart).value.value)
                    .join('');
                if (text.trim()) {
                    messages.push(vscode.LanguageModelChatMessage.Assistant(text));
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // Step 3c + 3d — Workspace context + user question
    // -------------------------------------------------------------------------

    /**
     * Builds the final user message, prepending available workspace context:
     * - Active file content (or selected code if a selection exists)
     * - Diagnostics (errors/warnings) for the active file
     * - pom.xml or build.gradle (first 80 lines)
     *
     * If no context is available the raw userQuery is returned unchanged.
     */
    private async buildUserMessage(userQuery: string): Promise<string> {
        const contextParts: string[] = [];
        const editor = vscode.window.activeTextEditor;

        // Active file or current selection
        if (editor) {
            const fileName = vscode.workspace.asRelativePath(editor.document.uri);
            const lang = editor.document.languageId;

            if (!editor.selection.isEmpty) {
                const selected = editor.document.getText(editor.selection);
                contextParts.push(
                    `Selected code in ${fileName}:\n\`\`\`${lang}\n${selected}\n\`\`\``
                );
            } else {
                const lines = editor.document.getText().split('\n');
                const preview = lines.slice(0, 150).join('\n');
                const suffix = lines.length > 150 ? '\n... (truncated at 150 lines)' : '';
                contextParts.push(
                    `Active file (${fileName}):\n\`\`\`${lang}\n${preview}${suffix}\n\`\`\``
                );
            }

            // Diagnostics for the active file only (errors and warnings)
            const diagnostics = vscode.languages.getDiagnostics(editor.document.uri)
                .filter(d => d.severity <= vscode.DiagnosticSeverity.Warning)
                .slice(0, 10);

            if (diagnostics.length > 0) {
                const lines = diagnostics.map(d => {
                    const sev = d.severity === vscode.DiagnosticSeverity.Error ? 'ERROR' : 'WARN';
                    return `  ${sev} [line ${d.range.start.line + 1}] ${d.message}`;
                });
                contextParts.push(`Problems in ${fileName}:\n${lines.join('\n')}`);
            }
        }

        // Build file — pom.xml or build.gradle
        const buildFiles = await vscode.workspace.findFiles(
            '{**/pom.xml,**/build.gradle,**/build.gradle.kts}',
            '**/node_modules/**',
            1
        );
        if (buildFiles.length > 0) {
            const doc = await vscode.workspace.openTextDocument(buildFiles[0]);
            const preview = doc.getText().split('\n').slice(0, 80).join('\n');
            const name = vscode.workspace.asRelativePath(buildFiles[0]);
            contextParts.push(`Build file (${name}):\n\`\`\`xml\n${preview}\n\`\`\``);
        }

        if (contextParts.length === 0) {
            return userQuery;
        }

        return [
            '[WORKSPACE CONTEXT]',
            ...contextParts,
            '[END WORKSPACE CONTEXT]',
            '',
            `User question: ${userQuery}`
        ].join('\n\n');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Normalises the slash-command name from the request.
     */
    private extractCommand(commandName?: string): string {
        if (!commandName) {
            return 'analyze';
        }
        const normalized = commandName.toLowerCase().trim();
        const validCommands = ['fix', 'analyze', 'upgrade', 'security'];
        return validCommands.includes(normalized) ? normalized : 'analyze';
    }
}
