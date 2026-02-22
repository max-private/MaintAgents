import { AgentRegistry, AgentDefinition } from './agent-registry';
/**
 * Represents an agent that has been selected for a user query with scoring details
 */
export interface ScoredAgent {
    /** The agent definition */
    agent: AgentDefinition;
    /** Overall score for this agent (higher is better) */
    score: number;
    /** List of trigger events that matched in the query */
    matchedTriggers: string[];
    /** List of capabilities that matched in the query */
    matchedCapabilities: string[];
    /** List of priority areas that matched in the query */
    matchedPriorityAreas: string[];
    /** List of tools/frameworks that matched in the query */
    matchedTools: string[];
    /** Breakdown of score components for explanation */
    scoreBreakdown: {
        triggerScore: number;
        keywordScore: number;
        capabilityScore: number;
        priorityAreaScore: number;
        toolScore: number;
        riskScore: number;
    };
}
/**
 * Router that matches user queries to appropriate agents using a scoring algorithm
 * Selects the best agents based on trigger events, keywords, capabilities, and risk level
 */
export declare class AgentRouter {
    private readonly agentRegistry;
    /**
     * Creates a new router instance
     * @param agentRegistry The agent registry to query
     */
    constructor(agentRegistry: AgentRegistry);
    /**
     * Selects the best agents for a user query using multi-factor scoring
     *
     * Scoring Algorithm:
     * - Trigger Event Match: +50 points (exact match with agent trigger_events)
     * - Domain Keywords: +30 points (matches in capabilities, name, description)
     * - Capability Match: +25 points (capability mentioned in query)
     * - Priority Area Match: +20 points (priority area mentioned in query)
     * - Tool/Framework Match: +15 points (supported tool mentioned in query)
     * - Risk Level Adjustment: -10 (critical), -5 (high) - prefer lower risk
     *
     * Results are sorted by score (highest first) and limited to top agents.
     *
     * @param userQuery The user''s query or request
     * @param maxAgents Maximum number of agents to return (default 3)
     * @returns Array of scored agents sorted by score (highest first)
     */
    selectAgentsForQuery(userQuery: string, maxAgents?: number): ScoredAgent[];
    /**
     * Scores a single agent against a user query
     * @param agent The agent to score
     * @param query The user query
     * @returns Scored agent with breakdown
     */
    private scoreAgent;
    /**
     * Extracts keywords from a text query
     * Filters out common words and returns unique keywords
     * @param text The text to extract keywords from
     * @returns Array of keywords
     */
    private extractKeywords;
    /**
     * Extracts all relevant keywords from an agent definition
     * Includes agent name, capabilities, skills, tools, etc.
     * @param agent The agent definition
     * @returns Array of keywords
     */
    private extractAgentKeywords;
    /**
     * Checks if ALL words in a trigger phrase are present in the query keywords.
     * Uses AND logic so "spring-upgrade" only fires when both "spring" and
     * "upgrade" appear — preventing partial matches on unrelated queries.
     * @param trigger The trigger phrase (hyphen-separated words)
     * @param queryKeywords Extracted keywords from the user query
     * @returns True only if every word in the trigger is found in the query
     */
    private isTriggerMatch;
    /**
     * Checks if a target string partially matches any of the keywords
     * Uses intelligent matching for technical terms
     * @param target The target string to check
     * @param keywords Array of keywords to match against
     * @returns True if any keyword matches
     */
    private isPartialMatch;
    /**
     * Gets agents that are specifically triggered by a keyword
     * @param triggerKeyword Keyword to trigger agents
     * @returns Agents matching the trigger
     */
    getAgentsByKeywordTrigger(triggerKeyword: string): AgentDefinition[];
    /**
     * Gets all agents, sorted by risk level (ascending)
     * @returns Agents sorted by risk level
     */
    getAgentsByRiskLevelPreference(): AgentDefinition[];
}
//# sourceMappingURL=router.d.ts.map