import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { OrchestratorAdapter } from './orchestrator-adapter';

interface AgentToolInput {
    query: string;
    command?: string;
}

const AGENT_TOOL_MAP: Record<string, string> = {
    'java-maintenance':       'maintenance_java',
    'dotnet-maintenance':     'maintenance_dotnet',
    'python-maintenance':     'maintenance_python',
    'perl-maintenance':       'maintenance_perl',
    'eclipse-rcp':            'maintenance_eclipse_rcp',
    'webservice-maintenance': 'maintenance_webservice',
    'os-compatibility':       'maintenance_os_compat',
    'vulnerability-fix':      'maintenance_vulnerability',
    'test-fix':               'maintenance_test_fix',
    'sonarqube-fix':          'maintenance_sonarqube',
};

export function agentIdToToolName(agentId: string): string {
    return AGENT_TOOL_MAP[agentId] ?? `maintenance_${agentId.replace(/-/g, '_')}`;
}

export function registerAgentTools(
    adapter: OrchestratorAdapter,
    context: vscode.ExtensionContext
): string[] {
    const registeredNames: string[] = [];
    const registry = adapter.getAgentRegistry();

    for (const agent of registry.getAllAgents()) {
        const toolName = agentIdToToolName(agent.id);
        const agentMdPath = path.join(context.extensionPath, 'agents', `${agent.id}.md`);

        try {
            const disposable = vscode.lm.registerTool<AgentToolInput>(toolName, {
                async invoke(options, _token) {
                    const mdContent = fs.existsSync(agentMdPath)
                        ? fs.readFileSync(agentMdPath, 'utf8')
                        : `Agent ${agent.name}: documentation not found.`;

                    const header = [
                        `# ${agent.name}`,
                        agent.description ? `**Overview:** ${agent.description}` : '',
                        agent.capabilities.length
                            ? `**Capabilities:** ${agent.capabilities.join(', ')}`
                            : '',
                        agent.risk_level
                            ? `**Risk Level:** ${agent.risk_level}`
                            : '',
                        agent.estimated_execution_time
                            ? `**Estimated Time:** ${agent.estimated_execution_time}`
                            : '',
                        '',
                    ].filter(Boolean).join('\n');

                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(header + mdContent)
                    ]);
                },
                async prepareInvocation(_options, _token) {
                    return {
                        invocationMessage: `Loading ${agent.name} context...`
                    };
                }
            });
            context.subscriptions.push(disposable);
            registeredNames.push(toolName);
        } catch (err) {
            console.warn(`Failed to register tool ${toolName}:`, err);
        }
    }

    // Orchestrator routing tool — scores all agents and returns combined prompt
    try {
        const routeDisposable = vscode.lm.registerTool<AgentToolInput>('maintenance_route', {
            async invoke(options, _token) {
                const { query, command } = options.input;
                const response = await adapter.processQuery(query, command);
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response.fullPrompt)
                ]);
            },
            async prepareInvocation(_options, _token) {
                return {
                    invocationMessage: 'Routing query to best maintenance agents...'
                };
            }
        });
        context.subscriptions.push(routeDisposable);
        registeredNames.push('maintenance_route');
    } catch (err) {
        console.warn('Failed to register tool maintenance_route:', err);
    }

    console.log(`Maintenance Agents: registered ${registeredNames.length} LM tools`);
    return registeredNames;
}
