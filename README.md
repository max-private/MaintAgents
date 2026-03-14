# Maintenance Agents

A VS Code extension that provides AI-powered, multi-agent assistance for **Java, .NET, Python, Perl, and more**. Use it as a Copilot agent (selectable via **Set Agent**) or via `@maintenance` in VS Code Chat — the system intelligently routes your request to the most relevant specialized agent(s).

---

## Agents

| Agent | Domain | Risk |
|-------|--------|------|
| **Java Maintenance** | Java version upgrades (8→11→17→21), Spring Framework, Maven/Gradle | Medium |
| **.NET Maintenance** | .NET Framework → .NET 8 migration, C# modernization, NuGet | Medium |
| **Python Maintenance** | Python 2→3 migration, pip/Poetry/conda, async modernization | Medium |
| **Perl Maintenance** | Perl modernization, CPAN dependency management, syntax updates | Medium |
| **Test Fix** | JUnit/Mockito/TestNG/pytest/NUnit failures, flaky tests, coverage | Low |
| **Vulnerability Fix** | CVE detection, OWASP/Snyk scanning, dependency patching | Critical |
| **SonarQube Fix** | Code smells, quality gates, SpotBugs, complexity reduction | Medium |
| **Web Service** | REST/SOAP migration, Spring Boot 3, microservice modernization | Medium |
| **OS Compatibility** | Windows/Linux compatibility, JNI/JNA, native libraries | High |
| **Eclipse RCP** | OSGi bundles, Tycho builds, RCP version upgrades | Medium |

---

## Architecture

```
Copilot "Set Agent" picker  ──or──  VS Code Chat (@maintenance)
                    │
                    ▼
      copilot-participant.ts        ← agent handler (ChatResult + metadata)
                    │
                    ▼
      orchestrator-adapter.ts       ← bridges extension ↔ orchestration
                    │
                    ├── AgentRegistry       ← loads YAML + Markdown, builds indices
                    ├── AgentRouter         ← multi-factor scoring, selects top agents
                    └── PromptBuilder       ← constructs structured LLM prompt
                                │
                                ▼
                        metadata/*.yml      ← agent config (capabilities, tools, risk)
                        agents/*.md         ← agent skill documentation
```

### Conversation History

Each response returns a `ChatResult` with `metadata: { agents, command }`. On subsequent turns, `appendChatHistory` replays prior turns with the agents note (`[Agents: java-maintenance, ...]`) stripped of routing-table noise, giving the model clean, annotated context. Cross-session history (previous VS Code sessions) is separately persisted via `SessionMemory`.

### Routing Algorithm

Each query is scored against all agents using weighted factors:

| Factor | Points | Description |
|--------|--------|-------------|
| Trigger Event Match | +50 | Domain-specific trigger words (strongest signal) |
| Domain Keywords | +30 | Keyword overlap between query and agent profile |
| Capability Match | +25 | Explicit capability mentioned in query |
| Priority Area Match | +20 | Agent's focus area matches query intent |
| Tool/Framework Match | +15 | Specific tool (Spring, JUnit, etc.) mentioned |
| Risk Penalty | −2 to −5 | Soft preference for lower-risk agents |

The top 3 scoring agents are selected and assembled into a detailed LLM prompt.

---

## Usage

### Option 1 — Set Agent (Copilot agent mode)

1. Open Copilot Chat (`Ctrl+Alt+I`)
2. Click **Set Agent** → select **Maintenance Agents**
3. Type your query directly — no `@maintenance` prefix needed
4. Conversation history is retained for the full thread

### Option 2 — @mention in Chat

```
@maintenance my JUnit tests are failing after upgrading to Spring Boot 3
@maintenance /security scan for CVE vulnerabilities in my dependencies
@maintenance /upgrade migrate from Java 8 to Java 17
@maintenance /analyze SonarQube quality gate is failing
```

### Available Commands

| Command | Description |
|---------|-------------|
| _(none)_ | General query — all agents considered |
| `/fix` | Fix code issues (test-fix + sonarqube agents) |
| `/analyze` | Analyse code for issues (default) |
| `/upgrade` | Upgrade frameworks and language versions |
| `/security` | Security vulnerability scanning |

---

## Project Structure

```
MaintenanceAgents/
├── agents/           # Agent skill documentation (Markdown)
├── metadata/         # Agent configuration (YAML)
├── orchestrator/     # Routing & prompt-building logic (TypeScript)
│   ├── agent-registry.ts
│   ├── router.ts
│   └── prompt-builder.ts
├── extension/        # VS Code extension
│   └── src/
│       ├── extension.ts
│       ├── copilot-participant.ts
│       └── orchestrator-adapter.ts
└── test-orchestration.js   # Orchestration test suite (41 tests)
```

---

## Development

### Prerequisites

- Node.js 18+
- VS Code 1.93+ with GitHub Copilot

### Install dependencies

```bash
cd extension
npm install
```

### Build the extension

```bash
cd extension
npm run build
```

### Package the extension (.vsix)

Install the VS Code Extension CLI if you haven't already:

```bash
npm install -g @vscode/vsce
```

Then package from the `extension/` directory:

```bash
cd extension
npm run build       # compile TypeScript first
npm run package     # produces maintenance-agents-1.4.0.vsix
```

### Install the packaged extension

**Option 1 — Command line:**

```bash
code --install-extension extension/maintenance-agents-1.4.0.vsix
```

**Option 2 — VS Code UI:**

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Click the `...` menu → **Install from VSIX...**
4. Select `extension/maintenance-agents-1.4.0.vsix`
5. Reload VS Code when prompted

Once installed, either select **Maintenance Agents** from the Copilot **Set Agent** picker, or type `@maintenance` in any chat panel.

### Run orchestration tests

```bash
NODE_PATH=extension/node_modules node test-orchestration.js
```

All 41 tests should pass, covering agent loading, index queries, routing accuracy, score breakdowns, edge cases, and prompt generation.

### Adding a new agent

1. Create `metadata/<agent-id>.yml` with capabilities, tools, trigger_events, and risk_level
2. Create `agents/<agent-id>.md` with skill documentation (use `###` headers for skills)
3. The `AgentRegistry` picks it up automatically on next initialization — no code changes needed

---

## License

MIT — see [LICENSE](LICENSE)
