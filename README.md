# Maintenance Agents

A VS Code extension that provides AI-powered software maintenance assistance aligned to **ISO 14764**. Works as a Copilot **Set Agent** — select it from the agent picker and describe your task in plain language.

---

## ISO 14764 Maintenance Types

| Type | When to use | Domains |
|---|---|---|
| **Corrective** | Something is broken | test-fix, vulnerability-cve, sonarqube-bugs |
| **Adaptive** | Environment changed | java, dotnet, python, perl, eclipse-rcp, webservice, os-compatibility, autosar |
| **Perfective** | Improve quality or performance | sonarqube-quality, webservice-optimize |
| **Preventive** | Pre-empt future faults | dependency-audit, vulnerability-scan |

---

## Usage

1. Open Copilot Chat (`Ctrl+Alt+I`)
2. Click **Set Agent** → select **Maintenance Agents**
3. Describe your task — the agent picks the right type and domain automatically

### Process phases

Every task follows a four-phase lifecycle:

```
analyze  →  plan  →  execute  →  validate
```

| Command | What it does |
|---|---|
| `analyze` | Scans the workspace; groups findings by severity with Before/After code blocks |
| `plan` | Scopes a specific target — branch name, files to change, rollback procedure |
| `execute` | Applies changes (corrective / adaptive / perfective / preventive) |
| `validate` | Runs build + tests, checks coverage, produces PR checklist |

### Example queries

```
analyze Java 21 compatibility
plan Calculator-project
adaptive java
validate

analyze python dependency vulnerabilities
plan
preventive dependency-audit

analyze sonarqube code smells
perfective sonarqube-quality
```

---

## Architecture

```
User query (Copilot Set Agent mode)
            │
            ▼
   maintenance.agent.md  ← chatmode: selects tool based on ISO 14764 type + domain
            │
            ▼
   5 MCP tools  (maintenance_corrective / adaptive / perfective / preventive / route)
            │
            ▼
   Python MCP server (server.py)
            │
            ├── agents/<type>/<domain>.md   ← domain knowledge + phase instructions
            └── agents/_process/            ← shared framework (guardrails, decision tree)
                        │
                        ▼
            Copilot scans workspace, applies fix,
            runs build/test verification
```

On activation the extension writes two files into each workspace folder:
- `.vscode/mcp.json` — starts the Python MCP server
- `.github/agents/maintenance.agent.md` — registers the Set Agent in the Copilot picker

---

## Agent directory

```
extension/agents/
├── _process/
│   ├── 00-decision-tree.md      # ISO 14764 classification flowchart
│   ├── 01-planning.md           # Phase 1 planning template
│   ├── 02-execution.md          # Guardrail registry (G-GIT-*, G-SCOPE-*, G-VAL-*, G-ROLL-*)
│   └── 03-validation.md         # Phase 3 gate specs
├── corrective/
│   ├── test-fix.md              # Failing/flaky tests (JUnit, pytest, xUnit)
│   ├── vulnerability-cve.md     # Active CVE remediation
│   └── sonarqube-bugs.md        # SonarQube bug-category and security-hotspot rules
├── adaptive/
│   ├── java.md                  # JDK, Maven, Gradle, Spring Boot version migration
│   ├── dotnet.md                # .NET, NuGet, ASP.NET, Entity Framework upgrades
│   ├── python.md                # Python, pip, poetry, Django, FastAPI updates
│   ├── perl.md                  # Perl, CPAN, Moose modernization
│   ├── eclipse-rcp.md           # Eclipse platform, OSGi, Tycho migration
│   ├── webservice.md            # REST/SOAP framework, Spring Boot API updates
│   ├── os-compatibility.md      # Cross-platform, JNI, P/Invoke, Docker
│   └── autosar.md               # AUTOSAR Classic R4.x ARXML schema migration
├── perfective/
│   ├── sonarqube-quality.md     # Code smells, complexity, duplication, tech debt
│   └── webservice-optimize.md   # API throughput, caching, microservice design
└── preventive/
    ├── dependency-audit.md      # Proactive dep vulnerability scanning (Maven/NuGet/PyPI/CPAN)
    └── vulnerability-scan.md    # SAST, secret detection, OWASP/CWE compliance
```

---

## Prerequisites

- VS Code 1.93+ with GitHub Copilot
- Python 3.8+ with the MCP package:

```bash
pip install mcp
```

---

## Installation

**VS Code UI:**
1. Extensions (`Ctrl+Shift+X`) → `...` menu → **Install from VSIX...**
2. Select `maintenance-agents-x.x.x.vsix` and reload

**Command line:**
```bash
code --install-extension extension/maintenance-agents-3.0.1.vsix
```

After install, **reload the VS Code window** (`Ctrl+Shift+P` → `Developer: Reload Window`). The extension will write `mcp.json` and the agent mode file into your workspace on first activation.

---

## Development

### Build

```bash
cd extension
npm install
npm run compile          # TypeScript → dist/
npx vsce package --no-dependencies   # produces maintenance-agents-x.x.x.vsix
```

### Test

```bash
cd extension
pip install mcp pytest
pytest tests/test_server.py -v       # 58 tests
```

### Adding a domain

1. Create `extension/agents/<type>/<domain>.md` following the phase structure in an existing agent
2. Add `<domain>` to the appropriate tool's `domain` enum in `extension/package.json`
3. Run `pytest tests/test_server.py` — the consistency tests will catch any mismatch

> The MCP server discovers agents dynamically from the directory structure. No changes to `server.py` or `agent-tools.ts` are needed for new domains.

---

## Guardrails

Key guardrails enforced across all agents (full definitions in `_process/02-execution.md`):

| ID | Rule |
|---|---|
| G-GIT-01 | Never commit to `master`/`main` — branch must follow `<type>/<scope>` |
| G-SCOPE-01 | Never touch `.github/workflows/`, `README.md`, `.gitignore`, or lock files unless explicitly asked |
| G-SCOPE-02 | One major version boundary per adaptive execution |
| G-SCOPE-03 | CVSS ≥ 7.0: one CVE per PR |
| G-VAL-01 | Never declare done without pasting build/test output |
| G-VAL-02 | Never delete tests or weaken assertions to make a test pass |
| G-VAL-03 | Coverage must not decrease |
| G-VAL-04 | No suppression-as-fix |
| G-ROLL-01 | Rollback procedure required for every destructive change |

---

## License

MIT — see [LICENSE](LICENSE)
