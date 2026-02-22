import { ScoredAgent } from './router';
/**
 * Builds formatted prompts for the LLM that include selected agents and their metadata
 * Creates clear, structured instructions for how to use the selected agents
 */
export declare class PromptBuilder {
    /**
     * Creates a new prompt builder instance
     */
    constructor();
    /**
     * Builds a complete prompt for the LLM with selected agents and instructions
     *
     * The prompt includes:
     * - Preamble explaining the user''s intent
     * - List of selected agents with scores and match reasons
     * - For each agent: name, capabilities, tools, skills, and estimated time
     * - Clear section separators and formatting
     * - Instructions for the LLM on how to use the agents
     * - Safety warnings for high-risk agents
     * - Detailed skill cards with keywords
     *
     * @param userQuery The original user query
     * @param selectedAgents Array of scored agents selected for this query
     * @returns Formatted string suitable for passing to an LLM
     */
    buildPrompt(userQuery: string, selectedAgents: ScoredAgent[]): string;
    /**
     * Builds the preamble section explaining the user''s intent
     * @param userQuery The user''s original query
     * @param agentCount Number of agents selected
     * @returns Formatted preamble section
     */
    private buildPreamble;
    /**
     * Builds the agent selection summary section
     * @param selectedAgents The selected agents
     * @returns Formatted selection summary
     */
    private buildAgentSelectionSummary;
    /**
     * Builds detailed instructions for each agent
     * @param selectedAgents The selected agents
     * @returns Formatted detailed instructions
     */
    private buildDetailedAgentInstructions;
    /**
     * Builds the execution framework section
     * @param selectedAgents The selected agents
     * @returns Formatted execution framework
     */
    private buildExecutionFramework;
    /**
     * Builds safety considerations section
     * @param selectedAgents The selected agents
     * @returns Formatted safety section or empty string if no high-risk agents
     */
    private buildSafetyConsiderations;
    /**
     * Builds success criteria section
     * @param selectedAgents The selected agents
     * @returns Formatted success criteria
     */
    private buildSuccessCriteria;
    /**
     * Builds the "no agents found" message
     * @returns Formatted message
     */
    private buildNoAgentsFound;
    /**
     * Formats match details for display
     * @param scored The scored agent
     * @returns Formatted match details or empty string
     */
    private formatMatchDetails;
    /**
     * Formats risk level for display with appropriate styling
     * @param riskLevel The risk level string
     * @returns Formatted risk level with indicator
     */
    private formatRiskLevel;
    /**
     * Formats a capability name for display
     * @param capability The capability string
     * @returns Formatted capability
     */
    private formatCapability;
    /**
     * Creates a simple skill card representation
     * @param skill The skill to represent
     * @returns Formatted skill card
     */
    private formatSkillCard;
    /**
     * Exports selected agents and their metadata as JSON for programmatic use
     * @param selectedAgents The selected agents
     * @returns JSON string representation
     */
    exportAgentsAsJson(selectedAgents: ScoredAgent[]): string;
    /**
     * Creates a CSV export of selected agents
     * @param selectedAgents The selected agents
     * @returns CSV string
     */
    exportAgentsAsCsv(selectedAgents: ScoredAgent[]): string;
}
//# sourceMappingURL=prompt-builder.d.ts.map