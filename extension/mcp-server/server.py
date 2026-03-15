#!/usr/bin/env python3
"""
Maintenance Agents MCP Server — Python implementation

Exposes each maintenance agent as an MCP tool so Copilot's agent mode
can call them natively.  The extension path is passed as the first CLI
argument so the server knows where to read agent YAML / Markdown files from.

Usage:
    python server.py <extensionPath>

Dependencies (pip install):
    mcp>=1.0.0
    pyyaml>=6.0
"""

import sys
import asyncio
from pathlib import Path

import yaml
import mcp.types as types
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

if len(sys.argv) < 2:
    print("Usage: python server.py <extensionPath>", file=sys.stderr)
    sys.exit(1)

EXTENSION_PATH = Path(sys.argv[1])
METADATA_DIR   = EXTENSION_PATH / "metadata"
AGENTS_DIR     = EXTENSION_PATH / "agents"

# ---------------------------------------------------------------------------
# Agent tool map  (agentId → toolName)
# ---------------------------------------------------------------------------

AGENT_TOOL_MAP: dict[str, str] = {
    "java-maintenance":       "maintenance_java",
    "dotnet-maintenance":     "maintenance_dotnet",
    "python-maintenance":     "maintenance_python",
    "perl-maintenance":       "maintenance_perl",
    "eclipse-rcp":            "maintenance_eclipse_rcp",
    "webservice-maintenance": "maintenance_webservice",
    "os-compatibility":       "maintenance_os_compat",
    "vulnerability-fix":      "maintenance_vulnerability",
    "test-fix":               "maintenance_test_fix",
    "sonarqube-fix":          "maintenance_sonarqube",
}

# ---------------------------------------------------------------------------
# Load agents from metadata YAML files
# ---------------------------------------------------------------------------

def load_agents() -> list[dict]:
    agents: list[dict] = []
    if not METADATA_DIR.exists():
        return agents
    for f in sorted(METADATA_DIR.iterdir()):
        if f.suffix not in (".yml", ".yaml"):
            continue
        agent_id = f.stem
        with open(f, "r", encoding="utf-8") as fp:
            raw: dict = yaml.safe_load(fp) or {}
        tool_name = AGENT_TOOL_MAP.get(
            agent_id,
            f"maintenance_{agent_id.replace('-', '_')}",
        )
        agents.append({
            "id":          agent_id,
            "name":        raw.get("name", agent_id),
            "description": raw.get("description", ""),
            "tool_name":   tool_name,
            "md_path":     AGENTS_DIR / f"{agent_id}.md",
        })
    return agents


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def read_agent_content(agent: dict, query: str = "", command: str = "") -> str:
    md_path: Path = agent["md_path"]
    md = md_path.read_text(encoding="utf-8") if md_path.exists() \
        else f"# {agent['name']}\n\nDocumentation not found."

    task_lines = [
        "---",
        "## Active Task",
        f"Query: {query}" if query else "",
        f"Command: {command}" if command else "",
        "",
        "Follow the Core Skills and Output Formats defined above.",
        "Apply the relevant skill(s) directly to the query.",
        "Produce concrete output: code diffs, migration steps, or fix recommendations — not a summary of what could be done.",
    ]
    task_block = "\n".join(line for line in task_lines if line is not None)

    return f"{md}\n\n{task_block}"


def route_query(query: str, agents: list[dict], top_n: int = 3) -> list[dict]:
    """Keyword-scoring router — returns up to top_n best-matching agents."""
    q = query.lower()
    scored: list[tuple[int, dict]] = []
    for a in agents:
        keywords = set(" ".join([a["id"], a["name"], a["description"]]).lower().split())
        score = sum(1 for kw in keywords if len(kw) > 2 and kw in q)
        if score > 0:
            scored.append((score, a))
    scored.sort(key=lambda x: -x[0])
    return [a for _, a in scored[:top_n]]


# ---------------------------------------------------------------------------
# MCP Server
# ---------------------------------------------------------------------------

AGENTS = load_agents()
server = Server("maintenance-agents")


@server.list_tools()
async def list_tools() -> list[types.Tool]:
    tools: list[types.Tool] = []

    for a in AGENTS:
        tools.append(types.Tool(
            name=a["tool_name"],
            description=f"Maintenance agent: {a['name']}. {a['description']}",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The maintenance question or task",
                    },
                    "command": {
                        "type": "string",
                        "enum": ["fix", "analyze", "upgrade", "security"],
                        "description": "Optional command filter",
                    },
                },
                "required": ["query"],
            },
        ))

    # Router tool — use when domain spans multiple technologies
    tools.append(types.Tool(
        name="maintenance_route",
        description=(
            "Routes a maintenance query to the best matching agents and returns "
            "combined context. Use when domain is unclear or spans multiple technologies."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The maintenance query to route",
                },
                "command": {
                    "type": "string",
                    "enum": ["fix", "analyze", "upgrade", "security"],
                    "description": "Optional command filter",
                },
            },
            "required": ["query"],
        },
    ))

    return tools


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    query: str = arguments.get("query", "")

    command: str = arguments.get("command", "")

    if name == "maintenance_route":
        matched  = route_query(query, AGENTS)
        selected = matched if matched else AGENTS[:3]
        content  = "\n\n---\n\n".join(read_agent_content(a, query, command) for a in selected)
        summary  = f"Selected agents: {', '.join(a['name'] for a in selected)}"
        return [types.TextContent(type="text", text=f"{summary}\n\n{content}")]

    agent = next((a for a in AGENTS if a["tool_name"] == name), None)
    if not agent:
        return [types.TextContent(type="text", text=f"Unknown tool: {name}")]

    return [types.TextContent(type="text", text=read_agent_content(agent, query, command))]


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def main() -> None:
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="maintenance-agents",
                server_version="1.7.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )


if __name__ == "__main__":
    asyncio.run(main())
