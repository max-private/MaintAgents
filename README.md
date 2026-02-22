# Maintenance Agents

A VS Code extension that provides AI-powered, multi-agent assistance for **Java application maintenance and modernization**. Interact via `@maintenance` in VS Code Chat — the system intelligently routes your request to the most relevant specialized agent(s).

---

## Agents

| Agent | Domain | Risk |
|-------|--------|------|
| **Java Maintenance** | Java version upgrades (8→11→17→21), Spring Framework, Maven/Gradle | Medium |
| **Test Fix** | JUnit/Mockito/TestNG failures, flaky tests, coverage optimization | Low |
| **Vulnerability Fix** | CVE detection, OWASP/Snyk scanning, dependency patching | Critical |
| **SonarQube Fix** | Code smells, quality gates, SpotBugs, complexity reduction | Medium |
| **Web Service** | REST/SOAP migration, Spring Boot 3, microservice modernization | Medium |
| **OS Compatibility** | Windows/Linux compatibility, JNI/JNA, native libraries | High |
| **Eclipse RCP** | OSGi bundles, Tycho builds, RCP version upgrades | Medium |

---

## Architecture

```
VS Code Chat (@maintenance)
        │
        ▼
  copilot-participant.ts        ← chat participant handler
        │
        ▼
  orchestrator-adapter.ts       ← bridges extension ↔ orchestration
        │
        ├── AgentRegistry       ← loads YAML + Markdown, builds indices
        ├── AgentRouter         ← multi-factor scoring, selects top agents
        └── PromptBuilder       ← constructs structured LLM prompt
                │
                ▼
        metadata/*.yml          ← agent configuration (capabilities, tools, risk)
        agents/*.md             ← agent skill documentation
```

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

### In VS Code Chat

```
@maintenance my JUnit tests are failing after upgrading to Spring Boot 3
@maintenance /security scan for CVE vulnerabilities in my dependencies
@maintenance /upgrade migrate from Java 8 to Java 17
@maintenance /analyze SonarQube quality gate is failing
```

### Available Commands

| Command | Description |
|---------|-------------|
| `@maintenance` | General query — all agents considered |
| `@maintenance /fix` | Fix code issues (test-fix + sonarqube agents) |
| `@maintenance /analyze` | Analyse code for issues |
| `@maintenance /upgrade` | Upgrade frameworks and Java versions |
| `@maintenance /security` | Security vulnerability scanning |

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
- VS Code 1.85+

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
