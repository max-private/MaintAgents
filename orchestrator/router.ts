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
export class AgentRouter {
  private readonly agentRegistry: AgentRegistry;

  /**
   * Creates a new router instance
   * @param agentRegistry The agent registry to query
   */
  constructor(agentRegistry: AgentRegistry) {
    this.agentRegistry = agentRegistry;
  }

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
  public selectAgentsForQuery(userQuery: string, maxAgents: number = 3): ScoredAgent[] {
    if (!userQuery || userQuery.trim() === '') {
      return [];
    }

    const allAgents = this.agentRegistry.getAllAgents();
    if (allAgents.length === 0) {
      return [];
    }

    const scoredAgents: ScoredAgent[] = [];

    for (const agent of allAgents) {
      const scored = this.scoreAgent(agent, userQuery);
      if (scored.score > 0) {
        scoredAgents.push(scored);
      }
    }

    // Sort by score (highest first), then by specificity signals, then by name
    scoredAgents.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // More trigger matches = stronger intent signal (prefer over alphabetical)
      if (b.matchedTriggers.length !== a.matchedTriggers.length) {
        return b.matchedTriggers.length - a.matchedTriggers.length;
      }
      // More capability matches = more specialized for this query
      if (b.matchedCapabilities.length !== a.matchedCapabilities.length) {
        return b.matchedCapabilities.length - a.matchedCapabilities.length;
      }
      return a.agent.name.localeCompare(b.agent.name);
    });

    // Return top N agents
    return scoredAgents.slice(0, maxAgents);
  }

  /**
   * Scores a single agent against a user query
   * @param agent The agent to score
   * @param query The user query
   * @returns Scored agent with breakdown
   */
  private scoreAgent(agent: AgentDefinition, query: string): ScoredAgent {
    const queryLower = query.toLowerCase();
    const queryKeywords = this.extractKeywords(query);

    const scoreBreakdown = {
      triggerScore: 0,
      keywordScore: 0,
      capabilityScore: 0,
      priorityAreaScore: 0,
      toolScore: 0,
      riskScore: 0,
    };

    const matchedTriggers: string[] = [];
    const matchedCapabilities: string[] = [];
    const matchedPriorityAreas: string[] = [];
    const matchedTools: string[] = [];

    // 1. Score trigger event matching (+50)
    if (agent.trigger_events && agent.trigger_events.length > 0) {
      for (const trigger of agent.trigger_events) {
        if (queryLower.includes(trigger) || this.isTriggerMatch(trigger, queryKeywords)) {
          scoreBreakdown.triggerScore += 50;
          matchedTriggers.push(trigger);
          break; // Each trigger type counts once
        }
      }
    }

    // 2. Score domain keyword matching (+30)
    const agentKeywords = this.extractAgentKeywords(agent);
    const matchedKeywords = queryKeywords.filter(k => agentKeywords.includes(k));
    if (matchedKeywords.length > 0) {
      scoreBreakdown.keywordScore = Math.min(30, matchedKeywords.length * 10);
    }

    // 3. Score capability matching (+25)
    for (const capability of agent.capabilities) {
      if (this.isPartialMatch(capability, queryKeywords)) {
        scoreBreakdown.capabilityScore += 25;
        matchedCapabilities.push(capability);
        break; // Count once
      }
    }

    // 4. Score priority area matching (+20)
    if (agent.priority_areas) {
      for (const area of agent.priority_areas) {
        if (this.isPartialMatch(area, queryKeywords)) {
          scoreBreakdown.priorityAreaScore += 20;
          matchedPriorityAreas.push(area);
          break; // Count once
        }
      }
    }

    // 5. Score tool/framework matching (+15)
    if (agent.supported_tools) {
      for (const tool of agent.supported_tools) {
        if (this.isPartialMatch(tool, queryKeywords)) {
          scoreBreakdown.toolScore += 15;
          matchedTools.push(tool);
          break; // Count once
        }
      }
    }

    // 6. Risk level adjustment
    // Soft preference for lower risk agents; kept small so domain expertise dominates
    if (agent.risk_level === 'critical') {
      scoreBreakdown.riskScore = -5;
    } else if (agent.risk_level === 'high') {
      scoreBreakdown.riskScore = -2;
    }

    const totalScore = Object.values(scoreBreakdown).reduce((sum, val) => sum + val, 0);

    return {
      agent,
      score: Math.max(0, totalScore),
      matchedTriggers,
      matchedCapabilities,
      matchedPriorityAreas,
      matchedTools,
      scoreBreakdown,
    };
  }

  /**
   * Extracts keywords from a text query
   * Filters out common words and returns unique keywords
   * @param text The text to extract keywords from
   * @returns Array of keywords
   */
  private extractKeywords(text: string): string[] {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'we',
      'my', 'our', 'your', 'his', 'her', 'its', 'this', 'that', 'these', 'those', 'what',
      'how', 'help', 'fix', 'need', 'want', 'please', 'thank', 'hello',
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .split(/\s+/)
      .filter(w => w.length > 2 && !commonWords.has(w));

    // Return unique keywords
    return Array.from(new Set(words));
  }

  /**
   * Extracts all relevant keywords from an agent definition
   * Includes agent name, capabilities, skills, tools, etc.
   * @param agent The agent definition
   * @returns Array of keywords
   */
  private extractAgentKeywords(agent: AgentDefinition): string[] {
    const keywords = new Set<string>();

    // Extract from name
    agent.name.toLowerCase().split(/[\s\-\/]+/).forEach(w => {
      if (w.length > 2) keywords.add(w);
    });

    // Extract from capabilities
    agent.capabilities.forEach(cap => {
      cap.split(/[\s\-\/]+/).forEach(w => {
        if (w.length > 2) keywords.add(w);
      });
    });

    // Extract from tools
    agent.supported_tools?.forEach(tool => {
      tool.toLowerCase().split(/[\s\-\/]+/).forEach(w => {
        if (w.length > 2) keywords.add(w);
      });
    });

    // Extract from skills
    agent.skills.forEach(skill => {
      skill.keywords.forEach(k => keywords.add(k));
    });

    // Extract from skill names
    agent.skills.forEach(skill => {
      skill.name.toLowerCase().split(/[\s\-\/]+/).forEach(w => {
        if (w.length > 2) keywords.add(w);
      });
    });

    return Array.from(keywords);
  }

  /**
   * Checks if ALL words in a trigger phrase are present in the query keywords.
   * Uses AND logic so "spring-upgrade" only fires when both "spring" and
   * "upgrade" appear — preventing partial matches on unrelated queries.
   * @param trigger The trigger phrase (hyphen-separated words)
   * @param queryKeywords Extracted keywords from the user query
   * @returns True only if every word in the trigger is found in the query
   */
  private isTriggerMatch(trigger: string, queryKeywords: string[]): boolean {
    const triggerWords = trigger.toLowerCase().split(/[-\s]+/).filter(w => w.length > 1);
    return triggerWords.every(word =>
      queryKeywords.some(k => k === word || k.includes(word) || word.includes(k))
    );
  }

  /**
   * Checks if a target string partially matches any of the keywords
   * Uses intelligent matching for technical terms
   * @param target The target string to check
   * @param keywords Array of keywords to match against
   * @returns True if any keyword matches
   */
  private isPartialMatch(target: string, keywords: string[]): boolean {
    const targetLower = target.toLowerCase();
    
    // Split target into words for comparison
    const targetWords = targetLower.split(/[\s\-\/]+/);

    for (const keyword of keywords) {
      // Exact match of any target word
      if (targetWords.includes(keyword)) {
        return true;
      }

      // Substring match (e.g., "junit" matches "junit5")
      if (targetLower.includes(keyword) && keyword.length > 2) {
        return true;
      }

      // Reverse check: does target contain keyword as substring
      if (keyword.includes(targetLower) && targetLower.length > 2) {
        return true;
      }
    }

    return false;
  }

  /**
   * Gets agents that are specifically triggered by a keyword
   * @param triggerKeyword Keyword to trigger agents
   * @returns Agents matching the trigger
   */
  public getAgentsByKeywordTrigger(triggerKeyword: string): AgentDefinition[] {
    const triggerLower = triggerKeyword.toLowerCase();
    
    return this.agentRegistry.getAllAgents().filter(agent => {
      // Check if trigger keyword matches agent trigger_events
      if (agent.trigger_events?.some(t => t.toLowerCase() === triggerLower)) {
        return true;
      }

      // Check if it matches capability or specialized field
      if (agent.capabilities.some(c => c.toLowerCase().includes(triggerLower))) {
        return true;
      }

      return false;
    });
  }

  /**
   * Gets all agents, sorted by risk level (ascending)
   * @returns Agents sorted by risk level
   */
  public getAgentsByRiskLevelPreference(): AgentDefinition[] {
    const riskOrder = { 'low': 0, 'medium': 1, 'high': 2, 'critical': 3 };

    return this.agentRegistry.getAllAgents().sort((a, b) => {
      const aRisk = riskOrder[a.risk_level as keyof typeof riskOrder] ?? 99;
      const bRisk = riskOrder[b.risk_level as keyof typeof riskOrder] ?? 99;
      return aRisk - bRisk;
    });
  }
}