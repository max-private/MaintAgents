import * as vscode from 'vscode';
import { OrchestratorAdapter } from './orchestrator-adapter';

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
 * This class processes user requests and routes them to appropriate
 * maintenance agents for analysis, fixing, and upgrades.
 */
export class MaintenanceAgentParticipant {
    /**
     * Creates a new MaintenanceAgentParticipant instance
     * 
     * @param adapter The orchestrator adapter for querying agents
     */
    constructor(private adapter: OrchestratorAdapter) {}

    /**
     * Handles incoming chat requests
     * 
     * @param request The chat request from the user
     * @param context The chat context
     * @param stream The response stream for sending replies
     * @param token Cancellation token
     */
    async handleRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        try {
            // Extract user query and command
            const userQuery = request.prompt;
            const command = this.extractCommand(request.command?.name);

            // Process the query with the orchestrator
            const response = await this.adapter.processQuery(userQuery, command);

            // Stream the response to the user
            if (response.selectedAgents.length > 0) {
                stream.markdown(`## Selected Maintenance Agents\n\n`);
                for (const agent of response.selectedAgents) {
                    const scorePercentage = (agent.score * 100).toFixed(1);
                    stream.markdown(`- **${agent.name}** (${scorePercentage}%): ${agent.description}\n`);
                }
                stream.markdown(`\n`);
            }

            // Show the full analysis
            stream.markdown(`## Analysis\n\n${response.fullPrompt}\n\n`);

            // Show summary
            stream.markdown(`## Summary\n\n${response.summary}\n\n`);

            // Show available commands
            stream.markdown(`### Available Commands\n`);
            stream.markdown(`- \`@maintenance fix\` - Fix code issues and bugs\n`);
            stream.markdown(`- \`@maintenance analyze\` - Analyze code for issues\n`);
            stream.markdown(`- \`@maintenance upgrade\` - Upgrade code to newer versions\n`);
            stream.markdown(`- \`@maintenance security\` - Check for security vulnerabilities\n`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error handling chat request:', error);
            stream.markdown(
                `⚠️ Error processing your request: ${errorMessage}\n\n` +
                `Please check the extension output for detailed error information.`
            );
        }
    }

    /**
     * Extracts and normalizes the command name
     * 
     * @param commandName The command name from the request
     * @returns The normalized command name or 'analyze' as default
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