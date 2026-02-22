/**
 * Represents a skill that an agent can perform
 */
export interface AgentSkill {
    /** Name of the skill */
    name: string;
    /** Description of what the skill does */
    description: string;
    /** Keywords extracted from skill name and documentation */
    keywords: string[];
}
/**
 * Represents the complete definition of an agent loaded from YAML and markdown files
 */
export interface AgentDefinition {
    /** Unique identifier for the agent (derived from filename) */
    id: string;
    /** Display name of the agent */
    name: string;
    /** Version of the agent specification */
    version?: string;
    /** Type of agent (e.g., maintenance, fix, upgrade) */
    type?: string;
    /** Primary programming language or platform */
    language?: string;
    /** Description of the agent's purpose */
    description?: string;
    /** Capabilities this agent can perform */
    capabilities: string[];
    /** Tools and frameworks this agent works with */
    supported_tools?: string[];
    /** Target versions of technologies (e.g., Java versions, Eclipse versions) */
    target_versions?: string[];
    /** Target platforms the agent supports */
    target_platforms?: string[];
    /** Priority areas the agent focuses on */
    priority_areas?: string[];
    /** Events that trigger this agent */
    trigger_events?: string[];
    /** Types of vulnerabilities this agent can handle */
    vulnerability_types?: string[];
    /** Severity levels this agent addresses */
    severity_levels?: string[];
    /** Types of tests this agent works with */
    test_types?: string[];
    /** Categories of issues this agent can fix */
    issue_categories?: string[];
    /** Risk level when executing this agent (low, medium, high, critical) */
    risk_level?: string;
    /** Whether this agent requires human review before execution */
    requires_review?: boolean;
    /** Estimated time to execute (e.g., 30-90 minutes) */
    estimated_execution_time?: string;
    /** Skills this agent possesses */
    skills: AgentSkill[];
}
/**
 * Registry that loads and manages all available agents from YAML metadata and markdown docs
 */
export declare class AgentRegistry {
    private agents;
    private capabilityIndex;
    private toolIndex;
    private priorityAreaIndex;
    private riskLevelIndex;
    private isInitialized;
    private readonly metadataDir;
    private readonly agentsDir;
    /**
     * Creates a new agent registry instance
     * @param baseDir The base directory containing metadata and agents subdirectories
     */
    constructor(baseDir?: string);
    /**
     * Initializes the registry by loading all agents from YAML and markdown files
     * Must be called before using the registry to query agents
     */
    initialize(): Promise<void>;
    /**
     * Loads a single agent from its YAML metadata file
     * @param ymlFilePath Path to the YAML metadata file
     */
    private loadAgent;
    /**
     * Extracts all skills from a markdown documentation file
     * Looks for ### headers which define skill names
     * @param mdFilePath Path to the markdown file
     * @returns Array of skills found in the documentation
     */
    private extractSkillsFromMarkdown;
    /**
     * Extracts the overview/description from markdown file
     * @param mdFilePath Path to the markdown file
     * @returns Description text or empty string
     */
    private extractDescription;
    /**
     * Infers the agent type from the agent ID
     * @param agentId The agent identifier
     * @returns Inferred type string
     */
    private inferType;
    /**
     * Determines if an agent should require review based on risk level
     * @param riskLevel The risk level from metadata
     * @returns True if review should be required
     */
    private shouldRequireReview;
    /**
     * Normalizes array values from YAML, handling both arrays and null/undefined
     * @param value The value to normalize
     * @returns Normalized array
     */
    private normalizeArray;
    /**
     * Gets all YAML files from a directory
     * @param dirPath Directory path to search
     * @returns Array of file paths
     */
    private getYamlFiles;
    /**
     * Builds lookup indices for efficient agent queries
     */
    private buildIndices;
    /**
     * Gets all registered agents
     * @returns Array of all agent definitions
     */
    getAllAgents(): AgentDefinition[];
    /**
     * Gets a specific agent by ID
     * @param agentId The agent identifier
     * @returns The agent definition or undefined if not found
     */
    getAgent(agentId: string): AgentDefinition | undefined;
    /**
     * Gets agents by capability
     * @param capability The capability name
     * @returns Array of agents with this capability
     */
    getAgentsByCapability(capability: string): AgentDefinition[];
    /**
     * Gets agents by supported tool
     * @param tool The tool name
     * @returns Array of agents supporting this tool
     */
    getAgentsByTool(tool: string): AgentDefinition[];
    /**
     * Gets agents by risk level
     * @param riskLevel The risk level (low, medium, high, critical)
     * @returns Array of agents with this risk level
     */
    getAgentsByRiskLevel(riskLevel: string): AgentDefinition[];
    /**
     * Gets agents by priority area
     * @param area The priority area
     * @returns Array of agents focusing on this area
     */
    getAgentsByPriorityArea(area: string): AgentDefinition[];
    /**
     * Gets agents that match a trigger event
     * @param trigger The trigger event name
     * @returns Array of agents triggered by this event
     */
    getAgentsByTrigger(trigger: string): AgentDefinition[];
    /**
     * Checks if an agent exists by ID
     * @param agentId The agent identifier
     * @returns True if the agent exists
     */
    hasAgent(agentId: string): boolean;
    /**
     * Gets the total number of registered agents
     * @returns Number of agents
     */
    getAgentCount(): number;
    /**
     * Gets agents that match multiple criteria
     * @param filter Object with optional filter criteria
     * @returns Array of matching agents
     */
    filterAgents(filter: {
        riskLevel?: string;
        capability?: string;
        tool?: string;
        priorityArea?: string;
        hasSkill?: string;
    }): AgentDefinition[];
    /**
     * Searches for agents matching a keyword
     * @param keyword The search keyword
     * @returns Array of agents matching the keyword
     */
    searchAgents(keyword: string): AgentDefinition[];
    /**
     * Gets all unique capabilities across all agents
     * @returns Array of all capabilities
     */
    getAllCapabilities(): string[];
    /**
     * Gets all unique tools across all agents
     * @returns Array of all tools
     */
    getAllTools(): string[];
    /**
     * Gets all unique priority areas across all agents
     * @returns Array of all priority areas
     */
    getAllPriorityAreas(): string[];
    /**
     * Checks if the registry is initialized
     * @returns True if initialized
     */
    isReady(): boolean;
}
export declare const agentRegistry: AgentRegistry;
//# sourceMappingURL=agent-registry.d.ts.map