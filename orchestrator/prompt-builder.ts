import { AgentDefinition, AgentSkill } from './agent-registry';
import { ScoredAgent } from './router';

/**
 * Builds formatted prompts for the LLM that include selected agents and their metadata
 * Creates clear, structured instructions for how to use the selected agents
 */
export class PromptBuilder {
  /**
   * Creates a new prompt builder instance
   */
  constructor() {
    // Intentionally empty - PromptBuilder is stateless
  }

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
  public buildPrompt(userQuery: string, selectedAgents: ScoredAgent[]): string {
    const sections: string[] = [];

    // Section 1: Preamble
    sections.push(this.buildPreamble(userQuery, selectedAgents.length));

    // Section 2: Agent Selection Summary
    if (selectedAgents.length > 0) {
      sections.push(this.buildAgentSelectionSummary(selectedAgents));

      // Section 3: Detailed Agent Instructions
      sections.push(this.buildDetailedAgentInstructions(selectedAgents));

      // Section 4: Execution Framework
      sections.push(this.buildExecutionFramework(selectedAgents));

      // Section 5: Safety Considerations
      const safetySection = this.buildSafetyConsiderations(selectedAgents);
      if (safetySection) {
        sections.push(safetySection);
      }

      // Section 6: Success Criteria
      sections.push(this.buildSuccessCriteria(selectedAgents));
    } else {
      sections.push(this.buildNoAgentsFound());
    }

    return sections.join('\n\n');
  }

  /**
   * Builds the preamble section explaining the user''s intent
   * @param userQuery The user''s original query
   * @param agentCount Number of agents selected
   * @returns Formatted preamble section
   */
  private buildPreamble(userQuery: string, agentCount: number): string {
    const lines: string[] = [];

    lines.push('');
    lines.push('                    MAINTENANCE AGENT SELECTION');
    lines.push('');
    lines.push('');
    lines.push('## User Request');
    lines.push(`**Query:** ${userQuery}`);
    lines.push('');
    lines.push(`**Agents Selected:** ${agentCount} agent${agentCount !== 1 ? 's' : ''}`);
    lines.push('');
    lines.push('**Task:** You are being provided with information about specialized maintenance');
    lines.push("agents that can help address the user's request. Your role is to coordinate");
    lines.push('these agents, understand their capabilities, and recommend appropriate actions');
    lines.push('based on their expertise.');

    return lines.join('\n');
  }

  /**
   * Builds the agent selection summary section
   * @param selectedAgents The selected agents
   * @returns Formatted selection summary
   */
  private buildAgentSelectionSummary(selectedAgents: ScoredAgent[]): string {
    const lines: string[] = [];

    lines.push('');
    lines.push('## Agent Selection Summary');
    lines.push('');
    lines.push('');

    for (let i = 0; i < selectedAgents.length; i++) {
      const scored = selectedAgents[i];
      const rank = i + 1;

      lines.push(`### ${rank}. ${scored.agent.name}`);
      lines.push(`**Score:** ${scored.score.toFixed(0)}/150`);
      lines.push(`**Agent ID:** \`${scored.agent.id}\``);
      lines.push(`**Risk Level:** ${this.formatRiskLevel(scored.agent.risk_level || 'unknown')}`);
      lines.push('');

      // Match details
      const matches = this.formatMatchDetails(scored);
      if (matches) {
        lines.push('**Match Details:**');
        lines.push(matches);
        lines.push('');
      }

      lines.push(`**Estimated Time:** ${scored.agent.estimated_execution_time || 'Not specified'}`);
      lines.push(`**Review Required:** ${scored.agent.requires_review ? ' YES' : ' No'}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Builds detailed instructions for each agent
   * @param selectedAgents The selected agents
   * @returns Formatted detailed instructions
   */
  private buildDetailedAgentInstructions(selectedAgents: ScoredAgent[]): string {
    const lines: string[] = [];

    lines.push('');
    lines.push('## Detailed Agent Information');
    lines.push('');
    lines.push('');

    for (const scored of selectedAgents) {
      const agent = scored.agent;

      lines.push(`### Agent: ${agent.name}`);
      lines.push('');

      if (agent.description) {
        lines.push('**Purpose:**');
        lines.push(agent.description);
        lines.push('');
      }

      // Capabilities
      if (agent.capabilities.length > 0) {
        lines.push('**Capabilities:**');
        agent.capabilities.forEach(cap => {
          lines.push(`- ${this.formatCapability(cap)}`);
        });
        lines.push('');
      }

      // Supported Tools
      if (agent.supported_tools && agent.supported_tools.length > 0) {
        lines.push('**Supported Tools & Frameworks:**');
        agent.supported_tools.forEach(tool => {
          lines.push(`- ${tool}`);
        });
        lines.push('');
      }

      // Skills
      if (agent.skills.length > 0) {
        lines.push('**Core Skills:**');
        agent.skills.forEach((skill, idx) => {
          lines.push(`${idx + 1}. **${skill.name}**`);
          if (skill.description) {
            lines.push(`   ${skill.description}`);
          }
          if (skill.keywords.length > 0) {
            lines.push(`   _Keywords: ${skill.keywords.join(', ')}_`);
          }
        });
        lines.push('');
      }

      // Additional metadata
      if (agent.priority_areas && agent.priority_areas.length > 0) {
        lines.push('**Priority Areas:**');
        agent.priority_areas.forEach(area => {
          lines.push(`- ${area}`);
        });
        lines.push('');
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Builds the execution framework section
   * @param selectedAgents The selected agents
   * @returns Formatted execution framework
   */
  private buildExecutionFramework(selectedAgents: ScoredAgent[]): string {
    const lines: string[] = [];

    lines.push('');
    lines.push('## Execution Framework');
    lines.push('');
    lines.push('');

    lines.push('**How to Use These Agents:**');
    lines.push('');
    lines.push('1. **Analysis Phase:**');
    lines.push("   - Review the user's request in detail");
    lines.push('   - Understand what problem needs to be solved');
    lines.push('   - Identify which aspects each agent can address');
    lines.push('');

    lines.push('2. **Coordination Phase:**');
    lines.push('   - Determine the optimal execution order');
    lines.push('   - Identify dependencies between agents');
    lines.push('   - Plan for sequential or parallel execution');
    lines.push('');

    lines.push('3. **Execution Phase:**');
    lines.push('   - Execute agents according to the plan');
    lines.push('   - Monitor for issues or conflicts');
    lines.push('   - Adapt as needed based on results');
    lines.push('');

    lines.push('4. **Integration Phase:**');
    lines.push('   - Combine results from all agents');
    lines.push('   - Resolve any conflicts or redundancies');
    lines.push('   - Create a comprehensive response');
    lines.push('');

    lines.push('**Available Agents for This Request:**');
    lines.push('');
    for (let i = 0; i < selectedAgents.length; i++) {
      const score = selectedAgents[i];
      lines.push(`${i + 1}. \`${score.agent.id}\` - ${score.agent.name}`);
      lines.push(`   - Relevance Score: ${score.score.toFixed(0)}/150`);
    }

    lines.push('');

    return lines.join('\n');
  }

  /**
   * Builds safety considerations section
   * @param selectedAgents The selected agents
   * @returns Formatted safety section or empty string if no high-risk agents
   */
  private buildSafetyConsiderations(selectedAgents: ScoredAgent[]): string {
    const highRiskAgents = selectedAgents.filter(a =>
      a.agent.risk_level === 'high' || a.agent.risk_level === 'critical'
    );

    if (highRiskAgents.length === 0) {
      return '';
    }

    const lines: string[] = [];

    lines.push('');
    lines.push('##  Safety Considerations');
    lines.push('');
    lines.push('');

    lines.push('The following agents have elevated risk levels and require attention:');
    lines.push('');

    for (const scored of highRiskAgents) {
      const agent = scored.agent;
      const riskWarning = agent.risk_level === 'critical' ? ' CRITICAL' : ' HIGH';

      lines.push(`**${riskWarning}: ${agent.name}**`);
      lines.push(`Risk Level: ${agent.risk_level?.toUpperCase()}`);
      lines.push(`Review Required: ${agent.requires_review ? ' YES - Proceed with Caution' : 'No'}`);
      lines.push('');

      if (agent.risk_level === 'critical') {
        lines.push('**Critical Risk Requirements:**');
        lines.push('- Human review before execution is MANDATORY');
        lines.push('- Changes may affect system stability or security');
        lines.push('- Have a rollback plan ready');
        lines.push('- Test in non-production environment first');
      } else if (agent.risk_level === 'high') {
        lines.push('**High Risk Recommendations:**');
        lines.push('- Review carefully before proceeding');
        lines.push('- Consider backup and rollback strategies');
        lines.push('- Monitor execution closely');
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Builds success criteria section
   * @param selectedAgents The selected agents
   * @returns Formatted success criteria
   */
  private buildSuccessCriteria(selectedAgents: ScoredAgent[]): string {
    const lines: string[] = [];

    lines.push('');
    lines.push('## Success Criteria & Validation');
    lines.push('');
    lines.push('');

    lines.push('**For Successful Execution:**');
    lines.push('');
    lines.push('1. **Completeness:** All applicable agents have been consulted');
    lines.push('2. **Accuracy:** Information from all agents is consistent');
    lines.push('3. **Order:** Agents were executed in the correct logical order');
    lines.push('4. **Coverage:** All aspects of the user request have been addressed');
    lines.push('5. **Safety:** All risk warnings have been considered');
    lines.push('');

    lines.push('**Validation Steps:**');
    lines.push('');
    lines.push("- Verify that each agent's output aligns with its purpose");
    lines.push('- Check for conflicting recommendations');
    lines.push('- Ensure all risk levels have been communicated to the user');
    lines.push('- Confirm that estimated execution times are realistic');
    lines.push('');

    lines.push('');
    lines.push('');
    lines.push('                        END OF AGENT INFORMATION');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Builds the "no agents found" message
   * @returns Formatted message
   */
  private buildNoAgentsFound(): string {
    const lines: string[] = [];

    lines.push(' **No agents found for this request**');
    lines.push('');
    lines.push('Unfortunately, no agents in the registry matched the criteria');
    lines.push("for the user's query. Consider:");
    lines.push('');
    lines.push('1. Broadening the search criteria');
    lines.push('2. Rephrasing the request with different terminology');
    lines.push('3. Checking that agents are properly registered');
    lines.push('4. Providing more specific details about the problem');
    lines.push('');
    lines.push('Please try again with a different query or consult with');
    lines.push('an administrator about available agents.');

    return lines.join('\n');
  }

  /**
   * Formats match details for display
   * @param scored The scored agent
   * @returns Formatted match details or empty string
   */
  private formatMatchDetails(scored: ScoredAgent): string {
    const matches: string[] = [];

    if (scored.matchedTriggers.length > 0) {
      matches.push(` **Triggers:** ${scored.matchedTriggers.join(', ')}`);
    }

    if (scored.matchedCapabilities.length > 0) {
      matches.push(` **Capabilities:** ${scored.matchedCapabilities.join(', ')}`);
    }

    if (scored.matchedPriorityAreas.length > 0) {
      matches.push(` **Priority Areas:** ${scored.matchedPriorityAreas.join(', ')}`);
    }

    if (scored.matchedTools.length > 0) {
      matches.push(` **Tools:** ${scored.matchedTools.join(', ')}`);
    }

    return matches.join('\n');
  }

  /**
   * Formats risk level for display with appropriate styling
   * @param riskLevel The risk level string
   * @returns Formatted risk level with indicator
   */
  private formatRiskLevel(riskLevel: string): string {
    switch (riskLevel.toLowerCase()) {
      case 'critical':
        return ' CRITICAL';
      case 'high':
        return ' HIGH';
      case 'medium':
        return ' MEDIUM';
      case 'low':
        return ' LOW';
      default:
        return ` ${riskLevel.toUpperCase()}`;
    }
  }

  /**
   * Formats a capability name for display
   * @param capability The capability string
   * @returns Formatted capability
   */
  private formatCapability(capability: string): string {
    // Convert hyphenated capability names to title case
    return capability
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Creates a simple skill card representation
   * @param skill The skill to represent
   * @returns Formatted skill card
   */
  private formatSkillCard(skill: AgentSkill): string {
    const lines: string[] = [];

    lines.push(`**${skill.name}**`);
    if (skill.description) {
      lines.push(skill.description);
    }
    if (skill.keywords.length > 0) {
      lines.push(`_Keywords: ${skill.keywords.join(', ')}_`);
    }

    return lines.join('\n');
  }

  /**
   * Exports selected agents and their metadata as JSON for programmatic use
   * @param selectedAgents The selected agents
   * @returns JSON string representation
   */
  public exportAgentsAsJson(selectedAgents: ScoredAgent[]): string {
    const agentData = selectedAgents.map(scored => ({
      id: scored.agent.id,
      name: scored.agent.name,
      score: scored.score,
      riskLevel: scored.agent.risk_level,
      capabilities: scored.agent.capabilities,
      tools: scored.agent.supported_tools,
      estimatedTime: scored.agent.estimated_execution_time,
      matchedTriggers: scored.matchedTriggers,
      matchedCapabilities: scored.matchedCapabilities,
      matchedPriorityAreas: scored.matchedPriorityAreas,
      matchedTools: scored.matchedTools,
      scoreBreakdown: scored.scoreBreakdown,
    }));

    return JSON.stringify(agentData, null, 2);
  }

  /**
   * Creates a CSV export of selected agents
   * @param selectedAgents The selected agents
   * @returns CSV string
   */
  public exportAgentsAsCsv(selectedAgents: ScoredAgent[]): string {
    const headers = ['Agent ID', 'Agent Name', 'Score', 'Risk Level', 'Estimated Time', 'Capabilities', 'Tools'];
    const rows: string[] = [headers.join(',')];

    for (const scored of selectedAgents) {
      const agent = scored.agent;
      const row = [
        `"${agent.id}"`,
        `"${agent.name}"`,
        scored.score.toFixed(0),
        `"${agent.risk_level || 'unknown'}"`,
        `"${agent.estimated_execution_time || 'N/A'}"`,
        `"${agent.capabilities.join('; ')}"`,
        `"${(agent.supported_tools || []).join('; ')}"`,
      ];
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }
}