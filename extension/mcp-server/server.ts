#!/usr/bin/env node
/**
 * Maintenance Agents MCP Server
 *
 * Exposes each maintenance agent as an MCP tool so Copilot's agent mode
 * can call them natively. The extension path is passed as the first CLI
 * argument so the server knows where to read agent markdown files from.
 *
 * Usage: node server.js <extensionPath>
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const extensionPath = process.argv[2];
if (!extensionPath) {
    process.stderr.write('Usage: node server.js <extensionPath>\n');
    process.exit(1);
}

const metadataDir = path.join(extensionPath, 'metadata');
const agentsDir   = path.join(extensionPath, 'agents');

// ---------------------------------------------------------------------------
// Agent tool map  (agentId → toolName)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Load agents from metadata YAML files
// ---------------------------------------------------------------------------

interface AgentMeta {
    id: string;
    name: string;
    description: string;
    toolName: string;
    mdPath: string;
}

function loadAgents(): AgentMeta[] {
    if (!fs.existsSync(metadataDir)) return [];
    return fs.readdirSync(metadataDir)
        .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
        .map(f => {
            const id = path.parse(f).name;
            const raw = yaml.load(fs.readFileSync(path.join(metadataDir, f), 'utf8')) as Record<string, any>;
            return {
                id,
                name: raw?.name ?? id,
                description: raw?.description ?? '',
                toolName: AGENT_TOOL_MAP[id] ?? `maintenance_${id.replace(/-/g, '_')}`,
                mdPath: path.join(agentsDir, `${id}.md`),
            };
        });
}

// ---------------------------------------------------------------------------
// Orchestrator-style routing (keyword scoring)
// ---------------------------------------------------------------------------

function routeQuery(query: string, agents: AgentMeta[], topN = 3): AgentMeta[] {
    const q = query.toLowerCase();
    const scored = agents.map(a => {
        let score = 0;
        const keywords = [a.id, a.name, a.description].join(' ').toLowerCase().split(/\W+/);
        for (const kw of keywords) {
            if (kw.length > 2 && q.includes(kw)) score++;
        }
        return { agent: a, score };
    });
    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topN)
        .map(s => s.agent);
}

function readAgentContent(agent: AgentMeta): string {
    const md = fs.existsSync(agent.mdPath)
        ? fs.readFileSync(agent.mdPath, 'utf8')
        : `# ${agent.name}\n\nDocumentation not found.`;
    return `# ${agent.name}\n\n${md}`;
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const agents = loadAgents();

const server = new Server(
    { name: 'maintenance-agents', version: '1.6.0' },
    { capabilities: { tools: {} } }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = agents.map(a => ({
        name: a.toolName,
        description: `Maintenance agent: ${a.name}. ${a.description}`,
        inputSchema: {
            type: 'object' as const,
            properties: {
                query:   { type: 'string', description: 'The maintenance question or task' },
                command: { type: 'string', enum: ['fix', 'analyze', 'upgrade', 'security'], description: 'Optional command filter' },
            },
            required: ['query'],
        },
    }));

    // Add router tool
    tools.push({
        name: 'maintenance_route',
        description: 'Routes a maintenance query to the best matching agents and returns combined context. Use when domain is unclear or spans multiple technologies.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                query:   { type: 'string', description: 'The maintenance query to route' },
                command: { type: 'string', enum: ['fix', 'analyze', 'upgrade', 'security'], description: 'Optional command filter' },
            },
            required: ['query'],
        },
    });

    return { tools };
});

// Call tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const query = (args?.query as string) ?? '';

    if (name === 'maintenance_route') {
        const matched = routeQuery(query, agents);
        const selected = matched.length > 0 ? matched : agents.slice(0, 3);
        const content = selected
            .map(a => readAgentContent(a))
            .join('\n\n---\n\n');
        const summary = `Selected agents: ${selected.map(a => a.name).join(', ')}`;
        return {
            content: [{ type: 'text', text: `${summary}\n\n${content}` }],
        };
    }

    const agent = agents.find(a => a.toolName === name);
    if (!agent) {
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }

    return {
        content: [{ type: 'text', text: readAgentContent(agent) }],
    };
});

// Start
const transport = new StdioServerTransport();
server.connect(transport).catch((err: Error) => {
    process.stderr.write(`MCP server error: ${err.message}\n`);
    process.exit(1);
});
