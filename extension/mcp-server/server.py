#!/usr/bin/env python3
"""
Maintenance Agents MCP Server — Python implementation

Exposes each maintenance agent as an MCP tool so Copilot's agent mode
can call them natively.  The extension path is passed as the first CLI
argument so the server knows where to read agent Markdown files from.

Usage:
    python server.py <extensionPath>

Dependencies (pip install):
    mcp>=1.0.0
"""

import re
import sys
import asyncio
from pathlib import Path

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
    "autosar-maintenance":    "maintenance_autosar",
}

# Words too generic to distinguish agents from one another
_STOPWORDS = {
    "the", "and", "for", "with", "from", "that", "this", "are", "its",
    "has", "have", "not", "all", "can", "use", "used", "via", "per",
    "how", "when", "what", "after", "into", "each", "also", "both",
    "maintenance", "agent", "provides", "automated", "assistance",
    "keeping", "current", "well", "modern", "handles", "existing",
    "between", "across", "including", "using", "based", "common",
    "fix", "fixes", "update", "updates", "upgrade", "upgrades",
    "manage", "management", "support", "analysis", "migration",
}

# ---------------------------------------------------------------------------
# Load agents from markdown files
# ---------------------------------------------------------------------------

def _parse_md(text: str, fallback_name: str) -> tuple[str, str, set[str]]:
    """Extract name, one-sentence description, and routing keywords from markdown."""
    lines = text.splitlines()
    name = fallback_name
    description = ""
    keywords: set[str] = set()
    in_overview = False
    overview_text = ""

    for line in lines:
        s = line.strip()

        # Agent name from the top-level heading
        if s.startswith("# ") and name == fallback_name:
            name = s[2:].strip()
            continue

        # Overview section boundaries
        if s == "## Overview":
            in_overview = True
            continue
        if s.startswith("## ") and in_overview:
            in_overview = False

        # Capture first non-empty overview line for description
        if in_overview and s and not overview_text:
            overview_text = s

        # Skill headings are the richest source of domain-specific terms.
        # e.g. "### 3. Spring Boot / Quarkus Migration" → spring, boot, quarkus
        if s.startswith("### "):
            heading = re.sub(r"^###\s+\d+\.\s*", "", s)
            for w in re.split(r"[\W/]+", heading):
                w = w.lower()
                if len(w) > 2 and w not in _STOPWORDS:
                    keywords.add(w)

    # Trim description to first sentence, max 200 chars
    if overview_text:
        first_sentence = re.split(r"\.\s", overview_text)[0]
        description = first_sentence[:200]

    # Supplement keywords with significant words from the agent name/id
    for w in re.split(r"[\W\-]+", name.lower()):
        if len(w) > 2 and w not in _STOPWORDS:
            keywords.add(w)

    return name, description, keywords


def load_agents() -> list[dict]:
    agents: list[dict] = []
    if not AGENTS_DIR.exists():
        return agents
    for f in sorted(AGENTS_DIR.glob("*.md")):
        agent_id = f.stem
        tool_name = AGENT_TOOL_MAP.get(
            agent_id,
            f"maintenance_{agent_id.replace('-', '_')}",
        )
        text = f.read_text(encoding="utf-8")
        name, description, keywords = _parse_md(text, agent_id)
        agents.append({
            "id":        agent_id,
            "name":      name,
            "description": description,
            "keywords":  keywords,
            "tool_name": tool_name,
            "md_path":   f,
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
    """
    Whole-word keyword router. Splits the query into tokens and counts how many
    of each agent's domain keywords appear as whole words — avoiding the
    substring false-positives of the previous `kw in q` approach.
    """
    query_words = set(re.split(r"[\W/]+", query.lower())) - {""}
    scored: list[tuple[int, dict]] = []
    for a in agents:
        score = len(a["keywords"] & query_words)
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
        matched = route_query(query, AGENTS)
        if not matched:
            return [types.TextContent(
                type="text",
                text=(
                    "Could not determine the maintenance domain from the query. "
                    "Please specify the technology stack (e.g. Java, .NET, Python, "
                    "Perl, AUTOSAR) or call the relevant agent tool directly."
                ),
            )]
        content = "\n\n---\n\n".join(read_agent_content(a, query, command) for a in matched)
        summary = f"Selected agents: {', '.join(a['name'] for a in matched)}"
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
                server_version="2.0.5",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )


if __name__ == "__main__":
    asyncio.run(main())
