import * as vscode from 'vscode';
import { MaintenanceAgentParticipant } from './copilot-participant';
import { OrchestratorAdapter } from './orchestrator-adapter';

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
        orchestratorAdapter = new OrchestratorAdapter();
        await orchestratorAdapter.initialize();

        // Create and register the chat participant
        const participant = new MaintenanceAgentParticipant(orchestratorAdapter);

        const chatParticipant = vscode.chat.createChatParticipant(
            'maintenance',
            async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> => {
                await participant.handleRequest(request, context, stream, token);
            }
        );

        context.subscriptions.push(chatParticipant);

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
 * Deactivates the Maintenance Agents extension.
 */
export function deactivate(): void {
    console.log('Maintenance Agents extension deactivating...');
    orchestratorAdapter = undefined as any;
}