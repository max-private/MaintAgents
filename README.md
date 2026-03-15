# Maintenance Agents

A VS Code extension that provides AI-powered maintenance assistance for **Java, .NET, Python, Perl, and more**. Works as a Copilot **Set Agent** — select it from the agent picker and Copilot calls the right specialist tool automatically.

---

## Agents

| Agent | Domain |
|-------|--------|
| **Java Maintenance** | Java version upgrades (8→11→17→21), Spring Framework, Maven/Gradle |
| **.NET Maintenance** | .NET Framework → .NET 8 migration, C# modernization, NuGet |
| **Python Maintenance** | Python 2→3 migration, pip/Poetry/conda, async modernization |
| **Perl Maintenance** | Perl modernization, CPAN dependency management, syntax updates |
| **Test Fix** | JUnit/Mockito/TestNG/pytest/NUnit failures, flaky tests, coverage |
| **Vulnerability Fix** | CVE detection, OWASP/Snyk scanning, dependency patching |
| **SonarQube Fix** | Code smells, quality gates, SpotBugs, complexity reduction |
| **Web Service** | REST/SOAP migration, Spring Boot 3, microservice modernization |
| **OS Compatibility** | Windows/Linux compatibility, path handling, native libraries |
| **Eclipse RCP** | OSGi bundles, Tycho builds, RCP version upgrades |
| **AUTOSAR** | Classic R4.x ARXML schema migration, ETAS ISOLAR-A/RTA-BSW, Artop validation |

---

## Architecture

```
User query (Copilot Set Agent mode)
            │
            ▼
   Copilot selects tool based on query
            │
            ▼
   Python MCP server (server.py)
            │
            ├── reads agents/*.md          ← agent skill instructions
            └── returns agent context + active task block
                        │
                        ▼
            Copilot scans workspace, applies fix,
            runs build/test verification
```

On activation the VS Code extension writes two files into each workspace folder:
- `.vscode/mcp.json` — points VS Code at the Python MCP server
- `.github/agents/maintenance.agent.md` — registers the Set Agent in the Copilot picker

---

## Usage

1. Open Copilot Chat (`Ctrl+Alt+I`)
2. Click **Set Agent** → select **Maintenance Agents**
3. Type your query — Copilot picks the right agent automatically

### Commands

| Command | Description |
|---------|-------------|
| `analyze` | Scan workspace for issues, grouped by fix pattern with Before/After code |
| `fix` | Apply fixes with Before/After shown; runs build verification after |
| `upgrade` | Numbered migration plan with code changes, commands, and verify steps |
| `security` | Vulnerability findings with CVE refs and hardened replacements |

### Example queries

```
analyze java 21 compatibility
fix the applet migration issues
upgrade from Spring Boot 2.7 to 3.2
security scan for CVE vulnerabilities in my dependencies
```

---

## Prerequisites

- VS Code 1.93+ with GitHub Copilot
- Python 3.8+ with MCP packages:

```bash
pip install mcp pyyaml
```

---

## Project Structure

```
MaintAgents/
└── extension/
    ├── agents/           # Agent skill instructions (Markdown)
    ├── chatmodes/        # Set Agent mode file template
    ├── mcp-server/       # Python MCP server
    │   └── server.py
    ├── metadata/         # Agent metadata (YAML)
    ├── src/              # VS Code extension (TypeScript)
    │   ├── extension.ts  # Activation: writes mcp.json + agent mode file
    │   └── agent-tools.ts
    └── package.json
```

---

## Development

### Install dependencies

```bash
cd extension
npm install
```

### Build and package

```bash
cd extension
npm run build       # compile TypeScript
npm run package     # produces maintenance-agents-x.x.x.vsix
```

### Install the VSIX

**Command line:**
```bash
code --install-extension extension/maintenance-agents-2.0.1.vsix
```

**VS Code UI:**
1. Extensions (`Ctrl+Shift+X`) → `...` menu → **Install from VSIX...**
2. Select the `.vsix` file and reload

### Adding a new agent

1. Create `extension/agents/<agent-id>.md` with skill documentation
2. Create `extension/metadata/<agent-id>.yml` with capabilities and risk level
3. Add the tool name mapping to `extension/src/agent-tools.ts`
4. Register the tool in `extension/package.json` under `contributes.languageModelTools`
5. Add a tool handler in `extension/mcp-server/server.py`

---

## License

MIT — see [LICENSE](LICENSE)
