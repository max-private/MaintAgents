import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MaintenanceAgentParticipant } from './copilot-participant';
import { OrchestratorAdapter } from './orchestrator-adapter';
import { SessionMemory } from './session-memory';
import { registerAgentTools, agentIdToToolName } from './agent-tools';

let orchestratorAdapter: OrchestratorAdapter;

/**
 * Activates the Maintenance Agents extension.
 * 
 * Initializes the orchestrator adapter and registers the chat participant
 * for handling maintenance agent requests.
 * 
 * @param context The extension context
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('Maintenance Agents extension activating...');

    try {
        // Initialize the orchestrator adapter
        // context.extensionPath is the root of the installed extension,
        // where metadata/ and agents/ are bundled alongside the source.
        orchestratorAdapter = new OrchestratorAdapter(context.extensionPath);
        await orchestratorAdapter.initialize();

        // Register each agent as an LM tool for native Set Agent mode support
        const toolNames = registerAgentTools(orchestratorAdapter, context);

        // Create and register the chat participant
        const sessionMemory = new SessionMemory(context);
        const participant = new MaintenanceAgentParticipant(orchestratorAdapter, sessionMemory);

        const chatParticipant = vscode.chat.createChatParticipant(
            'MaintenanceAgents.maintenance',
            async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<vscode.ChatResult> => {
                return participant.handleRequest(request, context, stream, token);
            }
        );

        context.subscriptions.push(chatParticipant);

        // Write the .agent.md file to each workspace folder so the
        // Maintenance agent appears in the "Set Agent" dropdown.
        await installAgentModeFile(context, toolNames);

        console.log('Maintenance Agents extension activated successfully');
    } catch (error) {
        console.error('Failed to activate Maintenance Agents extension:', error);
        vscode.window.showErrorMessage(
            'Failed to activate Maintenance Agents extension. Check the output console for details.'
        );
        throw error;
    }
}

/**
 * Writes maintenance.agent.md to .github/agents/ in each workspace folder
 * so the agent appears in the VS Code "Set Agent" dropdown.
 */
async function installAgentModeFile(
    context: vscode.ExtensionContext,
    toolNames: string[]
): Promise<void> {
    const templatePath = path.join(context.extensionPath, 'chatmodes', 'maintenance.agent.md');
    if (!fs.existsSync(templatePath)) {
        return;
    }

    const builtinTools = ['changes', 'codebase', 'editFiles', 'problems', 'runCommands', 'search', 'terminal'];
    const allTools = [...builtinTools, ...toolNames];
    const toolsLine = `tools: [${allTools.map(t => `'${t}'`).join(', ')}]`;

    const template = fs.readFileSync(templatePath, 'utf8');
    // Replace the tools: line in the YAML frontmatter with the full merged list
    const content = template.replace(/^tools:.*$/m, toolsLine);

    for (const folder of vscode.workspace.workspaceFolders ?? []) {
        const agentsDir = path.join(folder.uri.fsPath, '.github', 'agents');
        const destFile = path.join(agentsDir, 'maintenance.agent.md');
        fs.mkdirSync(agentsDir, { recursive: true });
        fs.writeFileSync(destFile, content, 'utf8');
        console.log(`Maintenance Agents: installed agent mode file at ${destFile}`);
    }
}

/**
 * Deactivates the Maintenance Agents extension.
 */
export function deactivate(): void {
    console.log('Maintenance Agents extension deactivating...');
    orchestratorAdapter = undefined as any;
}