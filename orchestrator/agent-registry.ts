import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

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
export class AgentRegistry {
  private agents: Map<string, AgentDefinition> = new Map();
  private capabilityIndex: Map<string, string[]> = new Map();
  private toolIndex: Map<string, string[]> = new Map();
  private priorityAreaIndex: Map<string, string[]> = new Map();
  private riskLevelIndex: Map<string, string[]> = new Map();
  private isInitialized: boolean = false;

  private readonly metadataDir: string;
  private readonly agentsDir: string;

  /**
   * Creates a new agent registry instance
   * @param baseDir The base directory containing metadata and agents subdirectories
   */
  constructor(baseDir: string = path.join(__dirname, '..')) {
    this.metadataDir = path.join(baseDir, 'metadata');
    this.agentsDir = path.join(baseDir, 'agents');
  }

  /**
   * Initializes the registry by loading all agents from YAML and markdown files
   * Must be called before using the registry to query agents
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const metadataFiles = this.getYamlFiles(this.metadataDir);

      for (const filePath of metadataFiles) {
        await this.loadAgent(filePath);
      }

      this.buildIndices();
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize agent registry: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Loads a single agent from its YAML metadata file
   * @param ymlFilePath Path to the YAML metadata file
   */
  private async loadAgent(ymlFilePath: string): Promise<void> {
    try {
      const fileNameWithoutExt = path.parse(ymlFilePath).name;
      const agentId = fileNameWithoutExt;

      // Load and parse YAML metadata
      const ymlContent = fs.readFileSync(ymlFilePath, 'utf-8');
      const metadata = yaml.load(ymlContent) as Record<string, any>;

      if (!metadata || typeof metadata !== 'object') {
        console.warn(`Invalid YAML metadata in ${ymlFilePath}`);
        return;
      }

      // Load corresponding markdown documentation
      const mdFilePath = path.join(this.agentsDir, `${fileNameWithoutExt}.md`);
      const skills = this.extractSkillsFromMarkdown(mdFilePath);

      // Build the complete agent definition
      const agent: AgentDefinition = {
        id: agentId,
        name: metadata.name || agentId,
        version: metadata.version,
        type: this.inferType(agentId),
        language: metadata.language,
        description: this.extractDescription(mdFilePath),
        capabilities: this.normalizeArray(metadata.capabilities || []),
        supported_tools: this.normalizeArray(metadata.supported_tools),
        target_versions: this.normalizeArray(metadata.target_versions),
        target_platforms: this.normalizeArray(metadata.target_platforms),
        priority_areas: this.normalizeArray(metadata.priority_areas),
        trigger_events: this.normalizeArray(metadata.trigger_events),
        vulnerability_types: this.normalizeArray(metadata.vulnerability_types),
        severity_levels: this.normalizeArray(metadata.severity_levels),
        test_types: this.normalizeArray(metadata.test_types),
        issue_categories: this.normalizeArray(metadata.issue_categories),
        risk_level: metadata.risk_level,
        requires_review: metadata.requires_review ?? this.shouldRequireReview(metadata.risk_level),
        estimated_execution_time: metadata.estimated_execution_time,
        skills,
      };

      this.agents.set(agentId, agent);
    } catch (error) {
      console.warn(`Failed to load agent from ${ymlFilePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extracts all skills from a markdown documentation file
   * Looks for ### headers which define skill names
   * @param mdFilePath Path to the markdown file
   * @returns Array of skills found in the documentation
   */
  private extractSkillsFromMarkdown(mdFilePath: string): AgentSkill[] {
    const skills: AgentSkill[] = [];

    if (!fs.existsSync(mdFilePath)) {
      return skills;
    }

    try {
      const content = fs.readFileSync(mdFilePath, 'utf-8');
      const lines = content.split('\n');

      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        
        // Look for ### headers (skill names)
        if (line.startsWith('### ')) {
          const skillName = line.replace(/^###\s+/, '').trim();
          
          // Remove numbering if present (e.g., 1. Java Version Upgrade -> Java Version Upgrade)
          const cleanName = skillName.replace(/^\d+\.\s+/, '');
          
          // Extract description from next few lines
          let description = '';
          let keywords: string[] = [];
          
          for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
            const nextLine = lines[j].trim();
            
            // Skip empty lines and other headers
            if (nextLine === '' || nextLine.startsWith('#')) {
              continue;
            }
            
            // Get first non-header, non-empty line as description
            if (!description && !nextLine.startsWith('-')) {
              description = nextLine;
            }
            
            // Extract keywords from bullet points (first few)
            if (nextLine.startsWith('-') && keywords.length < 3) {
              const bulletText = nextLine.replace(/^-\s+/, '').toLowerCase();
              const words = bulletText.split(/[\s\-\/]+/).filter(w => w.length > 2 && w !== 'and' && w !== 'the');
              keywords.push(...words.slice(0, 2));
            }
            
            if (description && keywords.length > 0) {
              break;
            }
          }
          
          // Add skill name words as keywords
          const nameKeywords = cleanName.toLowerCase().split(/[\s\-\/]+/).filter(w => w.length > 2);
          keywords = [...new Set([...nameKeywords, ...keywords])];
          
          skills.push({
            name: cleanName,
            description,
            keywords,
          });
        }
        
        i++;
      }
    } catch (error) {
      console.warn(`Failed to extract skills from ${mdFilePath}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return skills;
  }

  /**
   * Extracts the overview/description from markdown file
   * @param mdFilePath Path to the markdown file
   * @returns Description text or empty string
   */
  private extractDescription(mdFilePath: string): string {
    if (!fs.existsSync(mdFilePath)) {
      return '';
    }

    try {
      const content = fs.readFileSync(mdFilePath, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('## Overview')) {
          // Get next non-empty lines
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const line = lines[j].trim();
            if (line && !line.startsWith('##')) {
              return line;
            }
          }
        }
      }
    } catch (error) {
      // Silent fail for description extraction
    }

    return '';
  }

  /**
   * Infers the agent type from the agent ID
   * @param agentId The agent identifier
   * @returns Inferred type string
   */
  private inferType(agentId: string): string {
    if (agentId.includes('vulnerability')) return 'security';
    if (agentId.includes('test')) return 'testing';
    if (agentId.includes('sonarqube')) return 'quality';
    if (agentId.includes('os-compatibility')) return 'compatibility';
    return 'maintenance';
  }

  /**
   * Determines if an agent should require review based on risk level
   * @param riskLevel The risk level from metadata
   * @returns True if review should be required
   */
  private shouldRequireReview(riskLevel?: string): boolean {
    if (!riskLevel) return false;
    return riskLevel === 'critical' || riskLevel === 'high';
  }

  /**
   * Normalizes array values from YAML, handling both arrays and null/undefined
   * @param value The value to normalize
   * @returns Normalized array
   */
  private normalizeArray(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => String(v).toLowerCase());
    return [String(value).toLowerCase()];
  }

  /**
   * Gets all YAML files from a directory
   * @param dirPath Directory path to search
   * @returns Array of file paths
   */
  private getYamlFiles(dirPath: string): string[] {
    if (!fs.existsSync(dirPath)) {
      console.warn(`Metadata directory not found: ${dirPath}`);
      return [];
    }

    return fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
      .map(file => path.join(dirPath, file));
  }

  /**
   * Builds lookup indices for efficient agent queries
   */
  private buildIndices(): void {
    for (const [agentId, agent] of this.agents) {
      // Index by capabilities
      for (const capability of agent.capabilities) {
        if (!this.capabilityIndex.has(capability)) {
          this.capabilityIndex.set(capability, []);
        }
        this.capabilityIndex.get(capability)!.push(agentId);
      }

      // Index by tools
      for (const tool of agent.supported_tools || []) {
        const toolLower = tool.toLowerCase();
        if (!this.toolIndex.has(toolLower)) {
          this.toolIndex.set(toolLower, []);
        }
        this.toolIndex.get(toolLower)!.push(agentId);
      }

      // Index by priority areas
      for (const area of agent.priority_areas || []) {
        if (!this.priorityAreaIndex.has(area)) {
          this.priorityAreaIndex.set(area, []);
        }
        this.priorityAreaIndex.get(area)!.push(agentId);
      }

      // Index by risk level
      if (agent.risk_level) {
        if (!this.riskLevelIndex.has(agent.risk_level)) {
          this.riskLevelIndex.set(agent.risk_level, []);
        }
        this.riskLevelIndex.get(agent.risk_level)!.push(agentId);
      }
    }
  }

  /**
   * Gets all registered agents
   * @returns Array of all agent definitions
   */
  public getAllAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  /**
   * Gets a specific agent by ID
   * @param agentId The agent identifier
   * @returns The agent definition or undefined if not found
   */
  public getAgent(agentId: string): AgentDefinition | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Gets agents by capability
   * @param capability The capability name
   * @returns Array of agents with this capability
   */
  public getAgentsByCapability(capability: string): AgentDefinition[] {
    const capLower = capability.toLowerCase();
    const agentIds = this.capabilityIndex.get(capLower) || [];
    return agentIds.map(id => this.agents.get(id)!).filter(Boolean);
  }

  /**
   * Gets agents by supported tool
   * @param tool The tool name
   * @returns Array of agents supporting this tool
   */
  public getAgentsByTool(tool: string): AgentDefinition[] {
    const toolLower = tool.toLowerCase();
    const agentIds = this.toolIndex.get(toolLower) || [];
    return agentIds.map(id => this.agents.get(id)!).filter(Boolean);
  }

  /**
   * Gets agents by risk level
   * @param riskLevel The risk level (low, medium, high, critical)
   * @returns Array of agents with this risk level
   */
  public getAgentsByRiskLevel(riskLevel: string): AgentDefinition[] {
    const agentIds = this.riskLevelIndex.get(riskLevel) || [];
    return agentIds.map(id => this.agents.get(id)!).filter(Boolean);
  }

  /**
   * Gets agents by priority area
   * @param area The priority area
   * @returns Array of agents focusing on this area
   */
  public getAgentsByPriorityArea(area: string): AgentDefinition[] {
    const areaLower = area.toLowerCase();
    const agentIds = this.priorityAreaIndex.get(areaLower) || [];
    return agentIds.map(id => this.agents.get(id)!).filter(Boolean);
  }

  /**
   * Gets agents that match a trigger event
   * @param trigger The trigger event name
   * @returns Array of agents triggered by this event
   */
  public getAgentsByTrigger(trigger: string): AgentDefinition[] {
    const triggerLower = trigger.toLowerCase();
    return this.getAllAgents().filter(agent =>
      agent.trigger_events?.some(t => t.toLowerCase() === triggerLower)
    );
  }

  /**
   * Checks if an agent exists by ID
   * @param agentId The agent identifier
   * @returns True if the agent exists
   */
  public hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * Gets the total number of registered agents
   * @returns Number of agents
   */
  public getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Gets agents that match multiple criteria
   * @param filter Object with optional filter criteria
   * @returns Array of matching agents
   */
  public filterAgents(filter: {
    riskLevel?: string;
    capability?: string;
    tool?: string;
    priorityArea?: string;
    hasSkill?: string;
  }): AgentDefinition[] {
    let results = this.getAllAgents();

    if (filter.riskLevel) {
      results = results.filter(a => a.risk_level === filter.riskLevel);
    }

    if (filter.capability) {
      results = results.filter(a =>
        a.capabilities.some(c => c.toLowerCase() === filter.capability!.toLowerCase())
      );
    }

    if (filter.tool) {
      const toolLower = filter.tool.toLowerCase();
      results = results.filter(a =>
        a.supported_tools?.some(t => t.toLowerCase().includes(toolLower))
      );
    }

    if (filter.priorityArea) {
      const areaLower = filter.priorityArea.toLowerCase();
      results = results.filter(a =>
        a.priority_areas?.some(p => p.toLowerCase() === areaLower)
      );
    }

    if (filter.hasSkill) {
      const skillLower = filter.hasSkill.toLowerCase();
      results = results.filter(a =>
        a.skills.some(s => s.name.toLowerCase().includes(skillLower))
      );
    }

    return results;
  }

  /**
   * Searches for agents matching a keyword
   * @param keyword The search keyword
   * @returns Array of agents matching the keyword
   */
  public searchAgents(keyword: string): AgentDefinition[] {
    const searchLower = keyword.toLowerCase();
    return this.getAllAgents().filter(agent => {
      // Check in name, description, capabilities
      if (agent.name.toLowerCase().includes(searchLower)) return true;
      if (agent.description?.toLowerCase().includes(searchLower)) return true;
      if (agent.capabilities.some(c => c.includes(searchLower))) return true;
      if (agent.supported_tools?.some(t => t.toLowerCase().includes(searchLower))) return true;
      if (agent.skills.some(s => s.name.toLowerCase().includes(searchLower))) return true;
      if (agent.skills.some(s => s.keywords.some(k => k.includes(searchLower)))) return true;
      return false;
    });
  }

  /**
   * Gets all unique capabilities across all agents
   * @returns Array of all capabilities
   */
  public getAllCapabilities(): string[] {
    return Array.from(this.capabilityIndex.keys());
  }

  /**
   * Gets all unique tools across all agents
   * @returns Array of all tools
   */
  public getAllTools(): string[] {
    return Array.from(this.toolIndex.keys());
  }

  /**
   * Gets all unique priority areas across all agents
   * @returns Array of all priority areas
   */
  public getAllPriorityAreas(): string[] {
    return Array.from(this.priorityAreaIndex.keys());
  }

  /**
   * Checks if the registry is initialized
   * @returns True if initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }
}

// Create and export a singleton instance
export const agentRegistry = new AgentRegistry();