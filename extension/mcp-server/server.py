#!/usr/bin/env python3
"""
Maintenance Agents MCP Server — v3.0.2

ISO 14764 process-oriented architecture. Exposes four type-level MCP tools
(corrective, adaptive, perfective, preventive) each accepting a domain parameter,
plus a router tool for unknown/multi-domain queries.

Usage:
    python server.py <extensionPath>

Dependencies (pip install):
    mcp>=1.0.0
"""

import re
import sys
import asyncio
from pathlib import Path
from collections import defaultdict

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

# ISO 14764 process type directories (excludes _process/ framework files)
TYPE_DIRS = ["corrective", "adaptive", "perfective", "preventive"]
PROCESS_DIR = AGENTS_DIR / "_process"

TYPE_TOOL_MAP: dict[str, str] = {
    "corrective": "maintenance_corrective",
    "adaptive":   "maintenance_adaptive",
    "perfective": "maintenance_perfective",
    "preventive": "maintenance_preventive",
}

# Commands available per type (analyze/plan/validate universal; execution cmd matches type name)
TYPE_COMMANDS: dict[str, list[str]] = {
    "corrective": ["analyze", "plan", "corrective", "validate"],
    "adaptive":   ["analyze", "plan", "adaptive",   "validate"],
    "perfective": ["analyze", "plan", "perfective", "validate"],
    "preventive": ["analyze", "plan", "preventive", "validate"],
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
    "adaptive", "corrective", "perfective", "preventive",
}

# ---------------------------------------------------------------------------
# Markdown parsing
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

        if s.startswith("# ") and name == fallback_name:
            name = s[2:].strip()
            continue

        if s == "## Overview":
            in_overview = True
            continue
        if s.startswith("## ") and in_overview:
            in_overview = False

        if in_overview and s and not overview_text:
            overview_text = s

        # Skill headings are the richest source of domain-specific routing terms
        if s.startswith("### "):
            heading = re.sub(r"^###\s+\d+\.\s*", "", s)
            for w in re.split(r"[\W/]+", heading):
                w = w.lower()
                if len(w) > 2 and w not in _STOPWORDS:
                    keywords.add(w)

    if overview_text:
        first_sentence = re.split(r"\.\s", overview_text)[0]
        description = first_sentence[:200]

    for w in re.split(r"[\W\-]+", name.lower()):
        if len(w) > 2 and w not in _STOPWORDS:
            keywords.add(w)

    return name, description, keywords


# ---------------------------------------------------------------------------
# Agent loading
# ---------------------------------------------------------------------------

def load_agents() -> list[dict]:
    agents: list[dict] = []
    if not AGENTS_DIR.exists():
        return agents

    for type_name in TYPE_DIRS:
        type_path = AGENTS_DIR / type_name
        if not type_path.exists():
            continue
        for f in sorted(type_path.glob("*.md")):
            domain = f.stem
            tool_name = TYPE_TOOL_MAP[type_name]
            text = f.read_text(encoding="utf-8")
            name, description, keywords = _parse_md(text, domain)
            agents.append({
                "id":          f"{type_name}/{domain}",
                "type":        type_name,
                "domain":      domain,
                "name":        name,
                "description": description,
                "keywords":    keywords,
                "tool_name":   tool_name,
                "md_path":     f,
            })

    return agents


# ---------------------------------------------------------------------------
# Process framework loading
# ---------------------------------------------------------------------------

def load_process_context() -> str:
    """
    Load _process/*.md files in sorted order and concatenate into a single
    framework context block that is injected into every tool response.
    """
    if not PROCESS_DIR.exists():
        return ""
    parts: list[str] = []
    for f in sorted(PROCESS_DIR.glob("*.md")):
        parts.append(f.read_text(encoding="utf-8"))
    return "\n\n---\n\n".join(parts)


# ---------------------------------------------------------------------------
# Next-step suggestions
# ---------------------------------------------------------------------------

_NEXT_PHASE_DESC: dict[str, str] = {
    "plan":     "scope the changes, define rollback procedure, and set up the branch",
    "validate": "run Phase 3 gates — build, test, and coverage verification",
}

_EXECUTION_DESC = "execute Phase 2 and apply the changes"

_VALIDATE_END = (
    "Phase complete. Open a PR linked to the issue and request review.\n"
    "If dependencies or security-sensitive code was changed, consider:\n"
    "`maintenance_preventive(domain=\"dependency-audit\")`"
)


def suggest_next(agent: dict, command: str) -> str:
    """Return a Suggested Next Step block based on current command + agent type."""
    if not command:
        return ""
    type_name = agent["type"]
    domain    = agent["domain"]
    tool_name = TYPE_TOOL_MAP[type_name]

    if command == "analyze":
        desc = _NEXT_PHASE_DESC["plan"]
        return f'## Suggested Next Step\n`{tool_name}(domain="{domain}", command="plan")` — {desc}.'

    if command == "plan":
        return f'## Suggested Next Step\n`{tool_name}(domain="{domain}", command="{type_name}")` — {_EXECUTION_DESC}.'

    if command == type_name:  # execution phase name matches ISO 14764 type
        desc = _NEXT_PHASE_DESC["validate"]
        return f'## Suggested Next Step\n`{tool_name}(domain="{domain}", command="validate")` — {desc}.'

    if command == "validate":
        return f"## Suggested Next Step\n{_VALIDATE_END}"

    return ""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def read_agent_content(agent: dict, query: str = "", command: str = "") -> str:
    md_path: Path = agent["md_path"]
    md = md_path.read_text(encoding="utf-8") if md_path.exists() \
        else f"# {agent['name']}\n\nDocumentation not found."

    suggestion = suggest_next(agent, command)

    task_lines = [
        "---",
        "## Active Task",
        f"Query: {query}" if query else "",
        f"Command: {command}" if command else "",
        "",
        "Follow the process phases defined above.",
        "Apply the relevant phase directly to the query.",
        "Produce concrete output: code diffs, migration steps, or fix recommendations — not a summary of what could be done.",
    ]
    if suggestion:
        task_lines += [
            "",
            "IMPORTANT: After your analysis, end your response with exactly this block verbatim:",
            "",
            "---",
            suggestion,
        ]
    task_block = "\n".join(line for line in task_lines if line is not None)

    if PROCESS_CONTEXT:
        return f"{md}\n\n---\n\n{PROCESS_CONTEXT}\n\n{task_block}"
    return f"{md}\n\n{task_block}"


def route_query(query: str, agents: list[dict], top_n: int = 3) -> list[dict]:
    """
    Whole-word keyword router. Splits the query into tokens and counts how many
    of each agent's domain keywords appear as whole words.
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

AGENTS          = load_agents()
PROCESS_CONTEXT = load_process_context()
server = Server("maintenance-agents")


@server.list_tools()
async def list_tools() -> list[types.Tool]:
    tools: list[types.Tool] = []

    # Group agents by type to build domain enums
    type_agent_map: dict[str, list[dict]] = defaultdict(list)
    for a in AGENTS:
        type_agent_map[a["type"]].append(a)

    for type_name, tool_name in TYPE_TOOL_MAP.items():
        agents_of_type = type_agent_map.get(type_name, [])
        domains = [a["domain"] for a in agents_of_type]
        commands = TYPE_COMMANDS[type_name]

        agent_summaries = "; ".join(
            f"{a['domain']}: {a['description']}" for a in agents_of_type if a["description"]
        )
        model_desc = (
            f"ISO 14764 {type_name.capitalize()} maintenance. "
            f"Domains: {', '.join(domains)}. "
            f"{agent_summaries}"
        )

        schema: dict = {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The maintenance question or task",
                },
                "command": {
                    "type": "string",
                    "enum": commands,
                    "description": (
                        f"analyze=workspace scan, plan=Phase 1 artifacts, "
                        f"{type_name}=Phase 2 execution, validate=Phase 3 verification"
                    ),
                },
            },
            "required": ["query"],
        }

        if domains:
            schema["properties"]["domain"] = {
                "type": "string",
                "enum": domains,
                "description": f"The {type_name} maintenance domain",
            }
            schema["required"] = ["query", "domain"]

        tools.append(types.Tool(
            name=tool_name,
            description=model_desc,
            inputSchema=schema,
        ))

    # Router tool
    tools.append(types.Tool(
        name="maintenance_route",
        description=(
            "Routes a maintenance query to the best matching ISO 14764 agents. "
            "Use when the maintenance type or domain is unclear, or spans multiple technologies. "
            "Consult _process/00-decision-tree.md to classify the request first."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The maintenance query to route",
                },
            },
            "required": ["query"],
        },
    ))

    return tools


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    query: str   = arguments.get("query", "")
    domain: str  = arguments.get("domain", "")
    command: str = arguments.get("command", "")

    if name == "maintenance_route":
        matched = route_query(query, AGENTS)
        if not matched:
            fallback = (
                "Could not determine the maintenance domain from the query. "
                "Use the decision tree below to classify the request, "
                "or specify the technology stack and maintenance type explicitly "
                "(e.g. corrective/test-fix, adaptive/java, preventive/dependency-audit)."
            )
            body = f"{fallback}\n\n---\n\n{PROCESS_CONTEXT}" if PROCESS_CONTEXT else fallback
            return [types.TextContent(type="text", text=body)]
        content = "\n\n---\n\n".join(read_agent_content(a, query, command) for a in matched)
        summary = f"Selected agents: {', '.join(a['id'] for a in matched)}"
        top = matched[0]
        route_suggestion = (
            f"## Suggested Next Step\n"
            f"`{top['tool_name']}(domain=\"{top['domain']}\", command=\"analyze\")` — "
            f"run the top matched agent directly with the full analyze phase."
        )
        directive = (
            f"\n\nIMPORTANT: End your response with exactly this block verbatim:\n\n"
            f"---\n{route_suggestion}"
        )
        return [types.TextContent(type="text", text=f"{summary}\n\n{content}{directive}")]

    # Type-level tool: find agent by (type, domain)
    type_name = name.replace("maintenance_", "")
    agent = next(
        (a for a in AGENTS if a["type"] == type_name and a["domain"] == domain),
        None,
    )
    if not agent:
        available = [a["domain"] for a in AGENTS if a["type"] == type_name]
        return [types.TextContent(
            type="text",
            text=(
                f"Unknown domain '{domain}' for tool '{name}'. "
                f"Available domains: {', '.join(available) if available else 'none loaded'}."
            ),
        )]

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
                server_version="3.0.6",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )


if __name__ == "__main__":
    asyncio.run(main())
