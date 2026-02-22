"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRegistry = exports.AgentRegistry = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
/**
 * Registry that loads and manages all available agents from YAML metadata and markdown docs
 */
class AgentRegistry {
    /**
     * Creates a new agent registry instance
     * @param baseDir The base directory containing metadata and agents subdirectories
     */
    constructor(baseDir = path.join(__dirname, '..')) {
        this.agents = new Map();
        this.capabilityIndex = new Map();
        this.toolIndex = new Map();
        this.priorityAreaIndex = new Map();
        this.riskLevelIndex = new Map();
        this.isInitialized = false;
        this.metadataDir = path.join(baseDir, 'metadata');
        this.agentsDir = path.join(baseDir, 'agents');
    }
    /**
     * Initializes the registry by loading all agents from YAML and markdown files
     * Must be called before using the registry to query agents
     */
    async initialize() {
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
        }
        catch (error) {
            throw new Error(`Failed to initialize agent registry: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Loads a single agent from its YAML metadata file
     * @param ymlFilePath Path to the YAML metadata file
     */
    async loadAgent(ymlFilePath) {
        try {
            const fileNameWithoutExt = path.parse(ymlFilePath).name;
            const agentId = fileNameWithoutExt;
            // Load and parse YAML metadata
            const ymlContent = fs.readFileSync(ymlFilePath, 'utf-8');
            const metadata = yaml.load(ymlContent);
            if (!metadata || typeof metadata !== 'object') {
                console.warn(`Invalid YAML metadata in ${ymlFilePath}`);
                return;
            }
            // Load corresponding markdown documentation
            const mdFilePath = path.join(this.agentsDir, `${fileNameWithoutExt}.md`);
            const skills = this.extractSkillsFromMarkdown(mdFilePath);
            // Build the complete agent definition
            const agent = {
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
        }
        catch (error) {
            console.warn(`Failed to load agent from ${ymlFilePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Extracts all skills from a markdown documentation file
     * Looks for ### headers which define skill names
     * @param mdFilePath Path to the markdown file
     * @returns Array of skills found in the documentation
     */
    extractSkillsFromMarkdown(mdFilePath) {
        const skills = [];
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
                    let keywords = [];
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
        }
        catch (error) {
            console.warn(`Failed to extract skills from ${mdFilePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
        return skills;
    }
    /**
     * Extracts the overview/description from markdown file
     * @param mdFilePath Path to the markdown file
     * @returns Description text or empty string
     */
    extractDescription(mdFilePath) {
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
        }
        catch (error) {
            // Silent fail for description extraction
        }
        return '';
    }
    /**
     * Infers the agent type from the agent ID
     * @param agentId The agent identifier
     * @returns Inferred type string
     */
    inferType(agentId) {
        if (agentId.includes('vulnerability'))
            return 'security';
        if (agentId.includes('test'))
            return 'testing';
        if (agentId.includes('sonarqube'))
            return 'quality';
        if (agentId.includes('os-compatibility'))
            return 'compatibility';
        return 'maintenance';
    }
    /**
     * Determines if an agent should require review based on risk level
     * @param riskLevel The risk level from metadata
     * @returns True if review should be required
     */
    shouldRequireReview(riskLevel) {
        if (!riskLevel)
            return false;
        return riskLevel === 'critical' || riskLevel === 'high';
    }
    /**
     * Normalizes array values from YAML, handling both arrays and null/undefined
     * @param value The value to normalize
     * @returns Normalized array
     */
    normalizeArray(value) {
        if (!value)
            return [];
        if (Array.isArray(value))
            return value.map(v => String(v).toLowerCase());
        return [String(value).toLowerCase()];
    }
    /**
     * Gets all YAML files from a directory
     * @param dirPath Directory path to search
     * @returns Array of file paths
     */
    getYamlFiles(dirPath) {
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
    buildIndices() {
        for (const [agentId, agent] of this.agents) {
            // Index by capabilities
            for (const capability of agent.capabilities) {
                if (!this.capabilityIndex.has(capability)) {
                    this.capabilityIndex.set(capability, []);
                }
                this.capabilityIndex.get(capability).push(agentId);
            }
            // Index by tools
            for (const tool of agent.supported_tools || []) {
                const toolLower = tool.toLowerCase();
                if (!this.toolIndex.has(toolLower)) {
                    this.toolIndex.set(toolLower, []);
                }
                this.toolIndex.get(toolLower).push(agentId);
            }
            // Index by priority areas
            for (const area of agent.priority_areas || []) {
                if (!this.priorityAreaIndex.has(area)) {
                    this.priorityAreaIndex.set(area, []);
                }
                this.priorityAreaIndex.get(area).push(agentId);
            }
            // Index by risk level
            if (agent.risk_level) {
                if (!this.riskLevelIndex.has(agent.risk_level)) {
                    this.riskLevelIndex.set(agent.risk_level, []);
                }
                this.riskLevelIndex.get(agent.risk_level).push(agentId);
            }
        }
    }
    /**
     * Gets all registered agents
     * @returns Array of all agent definitions
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Gets a specific agent by ID
     * @param agentId The agent identifier
     * @returns The agent definition or undefined if not found
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * Gets agents by capability
     * @param capability The capability name
     * @returns Array of agents with this capability
     */
    getAgentsByCapability(capability) {
        const capLower = capability.toLowerCase();
        const agentIds = this.capabilityIndex.get(capLower) || [];
        return agentIds.map(id => this.agents.get(id)).filter(Boolean);
    }
    /**
     * Gets agents by supported tool
     * @param tool The tool name
     * @returns Array of agents supporting this tool
     */
    getAgentsByTool(tool) {
        const toolLower = tool.toLowerCase();
        const agentIds = this.toolIndex.get(toolLower) || [];
        return agentIds.map(id => this.agents.get(id)).filter(Boolean);
    }
    /**
     * Gets agents by risk level
     * @param riskLevel The risk level (low, medium, high, critical)
     * @returns Array of agents with this risk level
     */
    getAgentsByRiskLevel(riskLevel) {
        const agentIds = this.riskLevelIndex.get(riskLevel) || [];
        return agentIds.map(id => this.agents.get(id)).filter(Boolean);
    }
    /**
     * Gets agents by priority area
     * @param area The priority area
     * @returns Array of agents focusing on this area
     */
    getAgentsByPriorityArea(area) {
        const areaLower = area.toLowerCase();
        const agentIds = this.priorityAreaIndex.get(areaLower) || [];
        return agentIds.map(id => this.agents.get(id)).filter(Boolean);
    }
    /**
     * Gets agents that match a trigger event
     * @param trigger The trigger event name
     * @returns Array of agents triggered by this event
     */
    getAgentsByTrigger(trigger) {
        const triggerLower = trigger.toLowerCase();
        return this.getAllAgents().filter(agent => agent.trigger_events?.some(t => t.toLowerCase() === triggerLower));
    }
    /**
     * Checks if an agent exists by ID
     * @param agentId The agent identifier
     * @returns True if the agent exists
     */
    hasAgent(agentId) {
        return this.agents.has(agentId);
    }
    /**
     * Gets the total number of registered agents
     * @returns Number of agents
     */
    getAgentCount() {
        return this.agents.size;
    }
    /**
     * Gets agents that match multiple criteria
     * @param filter Object with optional filter criteria
     * @returns Array of matching agents
     */
    filterAgents(filter) {
        let results = this.getAllAgents();
        if (filter.riskLevel) {
            results = results.filter(a => a.risk_level === filter.riskLevel);
        }
        if (filter.capability) {
            results = results.filter(a => a.capabilities.some(c => c.toLowerCase() === filter.capability.toLowerCase()));
        }
        if (filter.tool) {
            const toolLower = filter.tool.toLowerCase();
            results = results.filter(a => a.supported_tools?.some(t => t.toLowerCase().includes(toolLower)));
        }
        if (filter.priorityArea) {
            const areaLower = filter.priorityArea.toLowerCase();
            results = results.filter(a => a.priority_areas?.some(p => p.toLowerCase() === areaLower));
        }
        if (filter.hasSkill) {
            const skillLower = filter.hasSkill.toLowerCase();
            results = results.filter(a => a.skills.some(s => s.name.toLowerCase().includes(skillLower)));
        }
        return results;
    }
    /**
     * Searches for agents matching a keyword
     * @param keyword The search keyword
     * @returns Array of agents matching the keyword
     */
    searchAgents(keyword) {
        const searchLower = keyword.toLowerCase();
        return this.getAllAgents().filter(agent => {
            // Check in name, description, capabilities
            if (agent.name.toLowerCase().includes(searchLower))
                return true;
            if (agent.description?.toLowerCase().includes(searchLower))
                return true;
            if (agent.capabilities.some(c => c.includes(searchLower)))
                return true;
            if (agent.supported_tools?.some(t => t.toLowerCase().includes(searchLower)))
                return true;
            if (agent.skills.some(s => s.name.toLowerCase().includes(searchLower)))
                return true;
            if (agent.skills.some(s => s.keywords.some(k => k.includes(searchLower))))
                return true;
            return false;
        });
    }
    /**
     * Gets all unique capabilities across all agents
     * @returns Array of all capabilities
     */
    getAllCapabilities() {
        return Array.from(this.capabilityIndex.keys());
    }
    /**
     * Gets all unique tools across all agents
     * @returns Array of all tools
     */
    getAllTools() {
        return Array.from(this.toolIndex.keys());
    }
    /**
     * Gets all unique priority areas across all agents
     * @returns Array of all priority areas
     */
    getAllPriorityAreas() {
        return Array.from(this.priorityAreaIndex.keys());
    }
    /**
     * Checks if the registry is initialized
     * @returns True if initialized
     */
    isReady() {
        return this.isInitialized;
    }
}
exports.AgentRegistry = AgentRegistry;
// Create and export a singleton instance
exports.agentRegistry = new AgentRegistry();
//# sourceMappingURL=agent-registry.js.map