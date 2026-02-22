import * as path from 'path';
import { AgentRegistry } from '../../orchestrator/agent-registry';
import { AgentRouter, ScoredAgent } from '../../orchestrator/router';
import { PromptBuilder } from '../../orchestrator/prompt-builder';

/**
 * Information about a maintenance agent
 */
interface AgentInfo {
    name: string;
    description: string;
    score: number;
}

/**
 * Response from processing a query
 */
interface ProcessQueryResponse {
    selectedAgents: AgentInfo[];
    fullPrompt: string;
    agentCount: number;
    summary: string;
}

/**
 * Adapter for integrating with the maintenance agent orchestrator.
 * 
 * This class manages the initialization and querying of maintenance agents,
 * including agent selection based on user queries and command filtering.
 */
export class OrchestratorAdapter {
    private registry?: AgentRegistry;
    private router?: AgentRouter;
    private initialized: boolean = false;

    /**
     * Initializes the orchestrator adapter.
     * 
     * This method sets up the agent registry and router by resolving the
     * correct paths to the metadata and YAML files.
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            console.log('OrchestratorAdapter already initialized');
            return;
        }

        try {
            // Resolve the base directory path
            // From extension/src -> ../../ (MaintenanceAgents root)
            const extensionDir = path.dirname(path.dirname(__dirname));
            const baseDir = path.dirname(extensionDir);

            console.log(`Initializing orchestrator with base directory: ${baseDir}`);

            // Create and initialize the agent registry
            this.registry = new AgentRegistry(baseDir);
            await this.registry.initialize();

            // Create the agent router
            this.router = new AgentRouter(this.registry);

            this.initialized = true;
            console.log('OrchestratorAdapter initialized successfully');
        } catch (error) {
            console.error('Failed to initialize OrchestratorAdapter:', error);
            throw new Error(`Failed to initialize orchestrator: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Processes a user query and selects appropriate maintenance agents.
     * 
     * @param userQuery The user's query or code issue description
     * @param command Optional command to filter agents ('fix', 'analyze', 'upgrade', 'security')
     * @returns Response containing selected agents and analysis
     * @throws Error if the adapter is not initialized
     */
    async processQuery(userQuery: string, command?: string): Promise<ProcessQueryResponse> {
        if (!this.initialized || !this.router || !this.registry) {
            throw new Error('OrchestratorAdapter not initialized. Call initialize() first.');
        }

        try {
            // Select agents based on the query
            const scoredAgents = this.router.selectAgentsForQuery(userQuery, 3);

            // Filter agents by command if specified
            const filteredAgents = command 
                ? this.filterAgentsByCommand(scoredAgents, command)
                : scoredAgents;

            // Build the prompt
            const promptBuilder = new PromptBuilder();
            const fullPrompt = promptBuilder.buildPrompt(userQuery, filteredAgents);

            // Map scored agents to agent info
            const selectedAgents: AgentInfo[] = filteredAgents.map(scored => ({
                name: scored.agent.name,
                description: scored.agent.description,
                score: scored.score
            }));

            // Create summary
            const summary = this.createSummary(selectedAgents, userQuery);

            return {
                selectedAgents,
                fullPrompt,
                agentCount: this.registry.getAgents().length,
                summary
            };
        } catch (error) {
            console.error('Error processing query:', error);
            throw new Error(`Failed to process query: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Filters agents based on the specified command.
     * 
     * @param agents List of scored agents
     * @param command The command to filter by
     * @returns Filtered list of agents
     */
    private filterAgentsByCommand(agents: ScoredAgent[], command: string): ScoredAgent[] {
        switch (command.toLowerCase()) {
            case 'security':
                return agents.filter(a => 
                    a.agent.name.includes('vulnerability') || a.agent.name.includes('test')
                );

            case 'fix':
                return agents.filter(a => 
                    a.agent.name.includes('test') || a.agent.name.includes('sonarqube')
                );

            case 'upgrade':
                return agents.filter(a => 
                    a.agent.name.includes('java') || 
                    a.agent.name.includes('eclipse') || 
                    a.agent.name.includes('webservice') || 
                    a.agent.name.includes('os-compatibility') || 
                    a.agent.name.includes('test')
                );

            case 'analyze':
            default:
                return agents;
        }
    }

    /**
     * Creates a summary of the analysis
     * 
     * @param agents Selected agents
     * @param userQuery The original user query
     * @returns Summary text
     */
    private createSummary(agents: AgentInfo[], userQuery: string): string {
        if (agents.length === 0) {
            return 'No suitable agents found for this query. Please provide more specific details about your issue.';
        }

        const topAgent = agents[0];
        const agentList = agents.map(a => a.name).join(', ');

        return `Based on your query about "${userQuery}", the maintenance system has selected ${agents.length} ` +
               `agent(s) to help: ${agentList}. The top recommendation is **${topAgent.name}** ` +
               `with a ${(topAgent.score * 100).toFixed(1)}% match. These agents will analyze your code and ` +
               `provide targeted recommendations for improvements.`;
    }

    /**
     * Gets the agent registry
     * 
     * @returns The agent registry instance
     * @throws Error if not initialized
     */
    getAgentRegistry(): AgentRegistry {
        if (!this.registry) {
            throw new Error('AgentRegistry not initialized');
        }
        return this.registry;
    }

    /**
     * Gets the agent router
     * 
     * @returns The agent router instance
     * @throws Error if not initialized
     */
    getRouter(): AgentRouter {
        if (!this.router) {
            throw new Error('AgentRouter not initialized');
        }
        return this.router;
    }

    /**
     * Checks if the adapter is initialized
     * 
     * @returns True if initialized, false otherwise
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}