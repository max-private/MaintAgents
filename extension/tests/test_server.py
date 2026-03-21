"""
Maintenance Agents MCP Server — test suite
==========================================

Tests the server.py logic (agent loading, keyword routing, tool dispatch) without
starting the actual stdio MCP transport.

Run:
    cd extension
    pip install mcp pytest
    pytest tests/test_server.py -v

Fixtures (sample reference projects) live under tests/fixtures/ — one project
per ISO 14764 category so each test has realistic file content to reference.
"""

from __future__ import annotations

import importlib
import sys
import types as builtin_types
from pathlib import Path
from unittest.mock import patch

import pytest

# ---------------------------------------------------------------------------
# Bootstrap: point EXTENSION_PATH at our extension directory so server.py
# finds agents/ without being launched via CLI.
# ---------------------------------------------------------------------------

EXTENSION_DIR = Path(__file__).parent.parent          # .../extension/
AGENTS_DIR    = EXTENSION_DIR / "agents"
FIXTURES_DIR  = Path(__file__).parent / "fixtures"


def _load_server():
    """Import server.py with sys.argv patched so bootstrap code succeeds."""
    with patch("sys.argv", ["server.py", str(EXTENSION_DIR)]):
        spec = importlib.util.spec_from_file_location(
            "server",
            EXTENSION_DIR / "mcp-server" / "server.py",
        )
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
    return mod


@pytest.fixture(scope="module")
def srv():
    """Loaded server module (shared across all tests in this file)."""
    return _load_server()


# ---------------------------------------------------------------------------
# 1. Agent loading
# ---------------------------------------------------------------------------


class TestAgentLoading:

    def test_all_four_types_loaded(self, srv):
        types_found = {a["type"] for a in srv.AGENTS}
        assert types_found == {"corrective", "adaptive", "perfective", "preventive"}

    def test_corrective_domains(self, srv):
        domains = {a["domain"] for a in srv.AGENTS if a["type"] == "corrective"}
        assert domains == {"test-fix", "vulnerability-cve", "sonarqube-bugs", "bug-report"}

    def test_adaptive_domains(self, srv):
        domains = {a["domain"] for a in srv.AGENTS if a["type"] == "adaptive"}
        assert domains == {
            "java", "dotnet", "python", "perl",
            "eclipse-rcp", "webservice", "os-compatibility", "autosar",
        }

    def test_perfective_domains(self, srv):
        domains = {a["domain"] for a in srv.AGENTS if a["type"] == "perfective"}
        assert domains == {"sonarqube-quality", "webservice-optimize"}

    def test_preventive_domains(self, srv):
        domains = {a["domain"] for a in srv.AGENTS if a["type"] == "preventive"}
        assert domains == {"dependency-audit", "vulnerability-scan"}

    def test_agent_has_required_fields(self, srv):
        for agent in srv.AGENTS:
            for field in ("id", "type", "domain", "name", "keywords", "tool_name", "md_path"):
                assert field in agent, f"Missing field '{field}' in agent {agent.get('id')}"

    def test_agent_id_format(self, srv):
        for agent in srv.AGENTS:
            assert "/" in agent["id"], f"id should be 'type/domain', got: {agent['id']}"
            type_part, domain_part = agent["id"].split("/", 1)
            assert type_part == agent["type"]
            assert domain_part == agent["domain"]

    def test_process_files_not_loaded_as_agents(self, srv):
        ids = [a["id"] for a in srv.AGENTS]
        assert not any("_process" in aid for aid in ids)

    def test_keywords_are_sets(self, srv):
        for agent in srv.AGENTS:
            assert isinstance(agent["keywords"], set), f"keywords must be a set for {agent['id']}"

    def test_keywords_not_empty(self, srv):
        for agent in srv.AGENTS:
            assert len(agent["keywords"]) > 0, f"Empty keywords for {agent['id']}"

    def test_tool_name_mapping(self, srv):
        expected = {
            "corrective": "maintenance_corrective",
            "adaptive":   "maintenance_adaptive",
            "perfective": "maintenance_perfective",
            "preventive": "maintenance_preventive",
        }
        for agent in srv.AGENTS:
            assert agent["tool_name"] == expected[agent["type"]]


# ---------------------------------------------------------------------------
# 2. Keyword routing  (maintenance_route)
# ---------------------------------------------------------------------------


class TestRouting:

    def test_route_java_query(self, srv):
        results = srv.route_query("migrating from Spring Boot 2 to Spring Boot 3 Java", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "adaptive/java" in ids

    def test_route_cve_query(self, srv):
        results = srv.route_query("CVE-2021-44228 log4j exploit vulnerability", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "corrective/vulnerability-cve" in ids or "preventive/vulnerability-scan" in ids

    def test_route_test_failure_query(self, srv):
        results = srv.route_query("JUnit test failing NullPointerException flaky", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "corrective/test-fix" in ids

    def test_route_sonarqube_quality(self, srv):
        results = srv.route_query("SonarQube code smell cognitive complexity technical debt", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "perfective/sonarqube-quality" in ids

    def test_route_dotnet_upgrade(self, srv):
        results = srv.route_query("migrate .NET 6 to .NET 8 NuGet ASP.NET", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "adaptive/dotnet" in ids

    def test_route_python_deps(self, srv):
        results = srv.route_query("Python pip poetry Django upgrade version", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "adaptive/python" in ids

    def test_route_dependency_audit(self, srv):
        results = srv.route_query("scan PyPI npm Maven dependencies outdated vulnerable packages", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "preventive/dependency-audit" in ids

    def test_route_autosar(self, srv):
        results = srv.route_query("AUTOSAR ARXML schema R4.4 namespace migration", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "adaptive/autosar" in ids

    def test_route_eclipse_rcp(self, srv):
        results = srv.route_query("Eclipse RCP OSGi Tycho plugin target platform", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "adaptive/eclipse-rcp" in ids

    def test_route_perl(self, srv):
        results = srv.route_query("Perl CPAN Moose modernization strict warnings", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "adaptive/perl" in ids

    def test_route_webservice_optimize(self, srv):
        results = srv.route_query("REST API throughput caching microservice performance", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "perfective/webservice-optimize" in ids

    def test_route_top_n_limit(self, srv):
        results = srv.route_query("Java Spring CVE vulnerability", srv.AGENTS, top_n=2)
        assert len(results) <= 2

    def test_route_no_match_returns_empty(self, srv):
        results = srv.route_query("xxxxunknowndomainxxxx", srv.AGENTS)
        assert results == []


# ---------------------------------------------------------------------------
# 3. read_agent_content
# ---------------------------------------------------------------------------


class TestReadAgentContent:

    def _get_agent(self, srv, type_name: str, domain: str) -> dict:
        return next(a for a in srv.AGENTS if a["type"] == type_name and a["domain"] == domain)

    def test_content_contains_query(self, srv):
        agent = self._get_agent(srv, "corrective", "test-fix")
        content = srv.read_agent_content(agent, query="fix failing JUnit test", command="analyze")
        assert "fix failing JUnit test" in content

    def test_content_contains_command(self, srv):
        agent = self._get_agent(srv, "adaptive", "java")
        content = srv.read_agent_content(agent, query="Spring Boot upgrade", command="plan")
        assert "plan" in content

    def test_content_contains_active_task_marker(self, srv):
        agent = self._get_agent(srv, "preventive", "dependency-audit")
        content = srv.read_agent_content(agent, query="scan deps", command="analyze")
        assert "Active Task" in content

    def test_content_contains_agent_markdown(self, srv):
        agent = self._get_agent(srv, "perfective", "sonarqube-quality")
        content = srv.read_agent_content(agent, query="reduce complexity", command="perfective")
        # The agent md should have its title or overview
        assert len(content) > 200  # non-trivial content loaded


# ---------------------------------------------------------------------------
# 4. call_tool dispatch (async)
# ---------------------------------------------------------------------------


import asyncio


class TestCallTool:
    """
    call_tool and list_tools are async functions registered with the MCP server.
    They can be called directly (the MCP decorator does not wrap them).
    """

    def _run(self, coro):
        return asyncio.run(coro)

    def _call(self, srv, name: str, **kwargs):
        return self._run(srv.call_tool(name, kwargs))

    # -- maintenance_route --

    def test_route_tool_matched(self, srv):
        result = self._call(srv, "maintenance_route", query="JUnit test NullPointerException failing")
        assert result
        assert "corrective/test-fix" in result[0].text or "test" in result[0].text.lower()

    def test_route_tool_no_match_message(self, srv):
        result = self._call(srv, "maintenance_route", query="xxnomatchxx")
        assert "Could not determine" in result[0].text

    # -- maintenance_corrective --

    def test_corrective_test_fix_analyze(self, srv):
        result = self._call(
            srv, "maintenance_corrective",
            query="OrderServiceTest is throwing NullPointerException",
            domain="test-fix",
            command="analyze",
        )
        assert result
        assert len(result[0].text) > 100

    def test_corrective_vulnerability_cve(self, srv):
        result = self._call(
            srv, "maintenance_corrective",
            query="CVE-2021-44228 log4j-core 2.14.1 in pom.xml",
            domain="vulnerability-cve",
            command="plan",
        )
        assert result
        assert "CVE" in result[0].text or "vulnerability" in result[0].text.lower()

    def test_corrective_sonarqube_bugs(self, srv):
        result = self._call(
            srv, "maintenance_corrective",
            query="java:S2095 FileInputStream not closed",
            domain="sonarqube-bugs",
            command="corrective",
        )
        assert result
        assert len(result[0].text) > 100

    def test_corrective_unknown_domain_returns_error(self, srv):
        result = self._call(
            srv, "maintenance_corrective",
            query="anything",
            domain="nonexistent",
        )
        assert "Unknown domain" in result[0].text
        assert "nonexistent" in result[0].text

    # -- maintenance_adaptive --

    def test_adaptive_java_plan(self, srv):
        result = self._call(
            srv, "maintenance_adaptive",
            query="migrate Spring Boot 2.7 to 3.2 and javax to jakarta",
            domain="java",
            command="plan",
        )
        assert result
        assert len(result[0].text) > 100

    def test_adaptive_dotnet(self, srv):
        result = self._call(
            srv, "maintenance_adaptive",
            query="upgrade from .NET 6 to .NET 8",
            domain="dotnet",
            command="analyze",
        )
        assert result
        assert len(result[0].text) > 100

    def test_adaptive_python(self, srv):
        result = self._call(
            srv, "maintenance_adaptive",
            query="update Django 3.2 to 4.2 poetry lockfile",
            domain="python",
            command="adaptive",
        )
        assert result
        assert len(result[0].text) > 100

    def test_adaptive_autosar(self, srv):
        result = self._call(
            srv, "maintenance_adaptive",
            query="migrate AUTOSAR ARXML from R4.3 to R4.4 namespace",
            domain="autosar",
            command="analyze",
        )
        assert result
        assert len(result[0].text) > 100

    # -- maintenance_perfective --

    def test_perfective_sonarqube_quality(self, srv):
        result = self._call(
            srv, "maintenance_perfective",
            query="ReportGenerator cognitive complexity 22 exceeds threshold",
            domain="sonarqube-quality",
            command="perfective",
        )
        assert result
        assert len(result[0].text) > 100

    def test_perfective_webservice_optimize(self, srv):
        result = self._call(
            srv, "maintenance_perfective",
            query="REST API latency caching strategy improvement",
            domain="webservice-optimize",
            command="analyze",
        )
        assert result
        assert len(result[0].text) > 100

    # -- maintenance_preventive --

    def test_preventive_dependency_audit(self, srv):
        result = self._call(
            srv, "maintenance_preventive",
            query="scan requirements.txt for vulnerable PyPI packages",
            domain="dependency-audit",
            command="analyze",
        )
        assert result
        assert len(result[0].text) > 100

    def test_preventive_vulnerability_scan(self, srv):
        result = self._call(
            srv, "maintenance_preventive",
            query="SAST scan for hardcoded secrets and command injection in app.py",
            domain="vulnerability-scan",
            command="preventive",
        )
        assert result
        assert len(result[0].text) > 100


# ---------------------------------------------------------------------------
# 5. list_tools schema
# ---------------------------------------------------------------------------


class TestListTools:

    def _run(self, coro):
        return asyncio.run(coro)

    def test_five_tools_registered(self, srv):
        tools = self._run(srv.list_tools())
        names = [t.name for t in tools]
        assert set(names) == {
            "maintenance_corrective",
            "maintenance_adaptive",
            "maintenance_perfective",
            "maintenance_preventive",
            "maintenance_route",
        }

    def test_corrective_domain_enum(self, srv):
        tools = self._run(srv.list_tools())
        corrective = next(t for t in tools if t.name == "maintenance_corrective")
        domains = corrective.inputSchema["properties"]["domain"]["enum"]
        assert set(domains) == {"test-fix", "vulnerability-cve", "sonarqube-bugs", "bug-report"}

    def test_adaptive_domain_enum(self, srv):
        tools = self._run(srv.list_tools())
        adaptive = next(t for t in tools if t.name == "maintenance_adaptive")
        domains = set(adaptive.inputSchema["properties"]["domain"]["enum"])
        assert "java" in domains
        assert "autosar" in domains
        assert len(domains) == 8

    def test_command_enums_present(self, srv):
        tools = self._run(srv.list_tools())
        for tool in tools:
            if tool.name == "maintenance_route":
                continue
            cmds = tool.inputSchema["properties"]["command"]["enum"]
            assert "analyze" in cmds
            assert "validate" in cmds

    def test_route_tool_has_no_domain(self, srv):
        tools = self._run(srv.list_tools())
        route = next(t for t in tools if t.name == "maintenance_route")
        assert "domain" not in route.inputSchema["properties"]

    def test_required_fields(self, srv):
        tools = self._run(srv.list_tools())
        for tool in tools:
            assert "query" in tool.inputSchema["required"]


# ---------------------------------------------------------------------------
# 6. Markdown parser unit tests
# ---------------------------------------------------------------------------


class TestParseMarkdown:

    def test_name_extracted_from_h1(self, srv):
        md = "# Java Maintenance Agent\n\n## Overview\nHandles JDK migrations.\n"
        name, desc, kw = srv._parse_md(md, "fallback")
        assert name == "Java Maintenance Agent"

    def test_description_from_overview(self, srv):
        md = "# Agent\n\n## Overview\nHandles JDK migrations. Second sentence.\n"
        _, desc, _ = srv._parse_md(md, "x")
        assert desc == "Handles JDK migrations"

    def test_keywords_from_h3_headings(self, srv):
        md = "# Agent\n\n### 1. JDK Version Detection\n### 2. Maven Build\n"
        _, _, kw = srv._parse_md(md, "x")
        assert "jdk" in kw or "version" in kw
        assert "maven" in kw or "build" in kw

    def test_stopwords_excluded(self, srv):
        md = "# Agent\n\n### 1. The Migration Fix\n"
        _, _, kw = srv._parse_md(md, "x")
        assert "the" not in kw
        assert "fix" not in kw

    def test_fallback_name_used_when_no_h1(self, srv):
        md = "## Overview\nSome content.\n"
        name, _, _ = srv._parse_md(md, "my-fallback")
        assert name == "my-fallback"

    def test_short_words_excluded(self, srv):
        md = "# A\n\n### 1. Go Up\n"
        _, _, kw = srv._parse_md(md, "x")
        # "go" and "up" are ≤2 chars (well, "go" is 2, "up" is 2)
        assert "go" not in kw
        assert "up" not in kw


# ---------------------------------------------------------------------------
# 7. Chatmode / agent-tools consistency
#    Catches the v3.0.0 bug where agent-tools.ts still listed old tool names
#    while package.json and the MCP server used the new ISO 14764 names.
# ---------------------------------------------------------------------------

EXPECTED_TOOL_NAMES = {
    "maintenance_corrective",
    "maintenance_adaptive",
    "maintenance_perfective",
    "maintenance_preventive",
    "maintenance_route",
}


class TestChatmodeConsistency:

    def _chatmode_tool_names(self) -> set[str]:
        """Parse the tools: [...] frontmatter line from the chatmode template."""
        chatmode = EXTENSION_DIR / "chatmodes" / "maintenance.agent.md"
        for line in chatmode.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("tools:"):
                # extract quoted names: 'foo', 'bar', ...
                import re
                return set(re.findall(r"'([^']+)'", line))
        return set()

    def _package_json_tool_names(self) -> set[str]:
        import json
        pkg = json.loads((EXTENSION_DIR / "package.json").read_text(encoding="utf-8"))
        return {t["name"] for t in pkg.get("contributes", {}).get("languageModelTools", [])}

    def _agent_tools_ts_names(self) -> set[str]:
        """Parse the TOOL_NAMES array from agent-tools.ts without running tsc."""
        import re
        ts = (EXTENSION_DIR / "src" / "agent-tools.ts").read_text(encoding="utf-8")
        return set(re.findall(r"'(maintenance_[^']+)'", ts))

    def test_chatmode_includes_all_mcp_tool_names(self):
        """Every MCP tool name must appear in the chatmode tools: frontmatter."""
        chatmode_tools = self._chatmode_tool_names()
        for name in EXPECTED_TOOL_NAMES:
            assert name in chatmode_tools, (
                f"'{name}' missing from chatmodes/maintenance.agent.md tools: line — "
                "Copilot will not be able to call it"
            )

    def test_package_json_declares_all_mcp_tool_names(self):
        """package.json languageModelTools must declare every expected tool."""
        pkg_tools = self._package_json_tool_names()
        assert pkg_tools == EXPECTED_TOOL_NAMES, (
            f"package.json tool mismatch.\n"
            f"  expected: {sorted(EXPECTED_TOOL_NAMES)}\n"
            f"  actual:   {sorted(pkg_tools)}"
        )

    def test_agent_tools_ts_matches_expected(self):
        """agent-tools.ts TOOL_NAMES must match the canonical set.

        This is the test that would have caught the v3.0.0 bug: agent-tools.ts
        still exported the 11 old names while package.json had the 5 new ones.
        """
        ts_names = self._agent_tools_ts_names()
        assert ts_names == EXPECTED_TOOL_NAMES, (
            f"agent-tools.ts TOOL_NAMES out of sync with expected tool names.\n"
            f"  expected: {sorted(EXPECTED_TOOL_NAMES)}\n"
            f"  actual:   {sorted(ts_names)}\n"
            "installAgentModeFile() uses getAllToolNames() to write the chatmode — "
            "a mismatch here means Copilot will not see the correct tools."
        )

    def test_mcp_server_exposes_same_tool_names(self, srv):
        """MCP server list_tools() must return exactly the expected tool names."""
        import asyncio
        tools = asyncio.run(srv.list_tools())
        server_names = {t.name for t in tools}
        assert server_names == EXPECTED_TOOL_NAMES, (
            f"MCP server tools out of sync.\n"
            f"  expected: {sorted(EXPECTED_TOOL_NAMES)}\n"
            f"  actual:   {sorted(server_names)}"
        )


# ---------------------------------------------------------------------------
# 8. Process context loading and injection
# ---------------------------------------------------------------------------


PROCESS_DIR = EXTENSION_DIR / "agents" / "_process"
PROCESS_FILES = sorted(PROCESS_DIR.glob("*.md")) if PROCESS_DIR.exists() else []


class TestProcessContext:

    def test_process_context_is_loaded(self, srv):
        assert srv.PROCESS_CONTEXT, "PROCESS_CONTEXT must be non-empty"

    def test_process_context_contains_all_files(self, srv):
        """Every _process/*.md title should appear in the combined context."""
        for f in PROCESS_FILES:
            first_line = f.read_text(encoding="utf-8").splitlines()[0].lstrip("# ").strip()
            assert first_line in srv.PROCESS_CONTEXT, (
                f"Content from {f.name} not found in PROCESS_CONTEXT"
            )

    def test_process_context_contains_guardrail_ids(self, srv):
        """02-execution.md defines guardrail IDs — they must be present in context."""
        assert "G-GIT" in srv.PROCESS_CONTEXT or "G-SCOPE" in srv.PROCESS_CONTEXT, (
            "Guardrail IDs (G-GIT-*, G-SCOPE-*) from 02-execution.md not found in PROCESS_CONTEXT"
        )

    def test_tool_response_includes_process_context(self, srv):
        """A regular agent call must embed the process framework content."""
        result = asyncio.run(srv.call_tool(
            "maintenance_adaptive",
            {"query": "migrate to Java 17", "domain": "java", "command": "analyze"},
        ))
        assert result
        # Decision-tree file should be first — its heading must appear
        first_heading = PROCESS_FILES[0].read_text(encoding="utf-8").splitlines()[0].lstrip("# ").strip()
        assert first_heading in result[0].text, (
            "Process framework content not found in tool response"
        )

    def test_corrective_tool_response_includes_process_context(self, srv):
        result = asyncio.run(srv.call_tool(
            "maintenance_corrective",
            {"query": "NPE in OrderService", "domain": "bug-report", "command": "analyze"},
        ))
        assert result
        first_heading = PROCESS_FILES[0].read_text(encoding="utf-8").splitlines()[0].lstrip("# ").strip()
        assert first_heading in result[0].text

    def test_route_no_match_includes_process_context(self, srv):
        """Even the no-match fallback should include the decision-tree context."""
        result = asyncio.run(srv.call_tool(
            "maintenance_route",
            {"query": "xxnomatchxx"},
        ))
        assert result
        assert srv.PROCESS_CONTEXT in result[0].text or "Could not determine" in result[0].text

    def test_process_files_loaded_in_order(self, srv):
        """Files should appear in sorted (00-, 01-, 02-, 03-) order in context."""
        if len(PROCESS_FILES) < 2:
            pytest.skip("Need at least 2 _process files to test order")
        first = PROCESS_FILES[0].read_text(encoding="utf-8").splitlines()[0].lstrip("# ").strip()
        last  = PROCESS_FILES[-1].read_text(encoding="utf-8").splitlines()[0].lstrip("# ").strip()
        assert srv.PROCESS_CONTEXT.index(first) < srv.PROCESS_CONTEXT.index(last), (
            "_process files not concatenated in sorted order"
        )


# ---------------------------------------------------------------------------
# 9. Bug-report domain — agent loading, routing, and dispatch
# ---------------------------------------------------------------------------


class TestBugReportDomain:

    # -- Agent loading --

    def test_bug_report_agent_loaded(self, srv):
        agent = next((a for a in srv.AGENTS if a["type"] == "corrective" and a["domain"] == "bug-report"), None)
        assert agent is not None, "corrective/bug-report agent not loaded"

    def test_corrective_domains_include_bug_report(self, srv):
        domains = {a["domain"] for a in srv.AGENTS if a["type"] == "corrective"}
        assert "bug-report" in domains

    def test_bug_report_keywords_not_empty(self, srv):
        agent = next(a for a in srv.AGENTS if a["type"] == "corrective" and a["domain"] == "bug-report")
        assert len(agent["keywords"]) > 0

    # -- Routing --

    def test_route_stack_trace_query(self, srv):
        results = srv.route_query("NullPointerException stack trace production crash", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "corrective/bug-report" in ids

    def test_route_log_error_query(self, srv):
        results = srv.route_query("log error exception production defect null", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "corrective/bug-report" in ids

    def test_route_user_reported_bug(self, srv):
        results = srv.route_query("user reported wrong calculation data corruption", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "corrective/bug-report" in ids

    def test_route_concurrency_defect(self, srv):
        results = srv.route_query("race condition deadlock concurrency heisenbug", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "corrective/bug-report" in ids

    def test_route_hotfix_query(self, srv):
        results = srv.route_query("production blocking hotfix rollback defect", srv.AGENTS)
        ids = [a["id"] for a in results]
        assert "corrective/bug-report" in ids

    # -- call_tool dispatch --

    def test_call_tool_bug_report_analyze(self, srv):
        result = asyncio.run(srv.call_tool(
            "maintenance_corrective",
            {"query": "NPE in OrderService.calculateTotal line 52 — cart null for expired session",
             "domain": "bug-report", "command": "analyze"}
        ))
        assert result
        assert len(result[0].text) > 100

    def test_call_tool_bug_report_plan(self, srv):
        result = asyncio.run(srv.call_tool(
            "maintenance_corrective",
            {"query": "Plan fix for OrderService NPE on expired cart session — ticket 9821",
             "domain": "bug-report", "command": "plan"}
        ))
        assert result
        assert len(result[0].text) > 100

    def test_call_tool_bug_report_corrective(self, srv):
        result = asyncio.run(srv.call_tool(
            "maintenance_corrective",
            {"query": "Fix NPE in OrderService when CartRepository returns null",
             "domain": "bug-report", "command": "corrective"}
        ))
        assert result
        assert len(result[0].text) > 100

    def test_call_tool_bug_report_content_has_active_task(self, srv):
        result = asyncio.run(srv.call_tool(
            "maintenance_corrective",
            {"query": "trace the stack", "domain": "bug-report", "command": "analyze"}
        ))
        assert "Active Task" in result[0].text

    # -- package.json domain enum --

    def test_package_json_corrective_enum_includes_bug_report(self):
        import json
        pkg = json.loads((EXTENSION_DIR / "package.json").read_text(encoding="utf-8"))
        corrective = next(
            t for t in pkg["contributes"]["languageModelTools"]
            if t["name"] == "maintenance_corrective"
        )
        domains = corrective["inputSchema"]["properties"]["domain"]["enum"]
        assert "bug-report" in domains, (
            "bug-report missing from maintenance_corrective domain enum in package.json"
        )

    # -- chatmode tool selection table --

    def test_chatmode_mentions_bug_report(self):
        chatmode = (EXTENSION_DIR / "chatmodes" / "maintenance.agent.md").read_text(encoding="utf-8")
        assert "bug-report" in chatmode, (
            "bug-report not mentioned in chatmodes/maintenance.agent.md tool selection table"
        )
