# SonarQube Quality Agent

## Overview
The SonarQube Quality Agent provides targeted improvement of technical debt, code smells, complexity, and duplication — perfective maintenance driven by quality metrics rather than active faults. It improves maintainability, readability, and long-term sustainability of the codebase.

## Core Skills

### 1. Code Smell Remediation
- Identify and analyze code smells detected by SonarQube
- Suggest refactoring strategies for maintainability issues
- Fix naming conventions and consistency problems
- Resolve complexity and readability issues
- Modernize deprecated patterns and idioms

### 2. Complexity Reduction
- Analyze cyclomatic and cognitive complexity metrics
- Suggest refactoring to reduce method/class complexity
- Identify opportunities for extraction and modularity
- Optimize conditional logic and nesting depth
- Recommend design patterns for simplification

### 3. Code Duplication Elimination
- Detect duplicate code blocks and copy-paste issues
- Suggest refactoring strategies for removing duplication
- Extract common methods and utilities
- Manage shared library consolidation

### 4. Quality Gate Compliance
- Monitor and ensure Quality Gate compliance
- Identify metrics failing Quality Gate criteria
- Suggest improvements to meet coverage, duplication, and complexity thresholds
- Automate Quality Gate enforcement in CI/CD

### 5. Roslyn Analyzer Integration (.NET)
- Configure dotnet-sonarscanner (begin/end) in CI pipelines
- Interpret and fix Roslyn style and maintainability warnings (CA*, IDE* rules)
- Configure StyleCop.Analyzers for naming, layout, and documentation enforcement
- Apply `dotnet format` for whitespace and style passes
- Configure `.editorconfig` and `Directory.Build.props` to enforce analyzer severity

### 6. Python Code Quality (pylint / ruff)
- Configure `pylint` and `ruff` rules in `pyproject.toml`
- Fix SonarQube Python code-smell issues: string duplication, long methods
- Apply `mypy` to eliminate type-related quality issues
- Configure SonarQube Python Quality Gate thresholds

### 7. Perl Code Quality (Perl::Critic / perltidy)
- Map SonarQube Perl maintainability violations to `Perl::Critic` policy names
- Configure `.perlcriticrc` severity levels to match Quality Gate thresholds
- Apply `perltidy` to eliminate formatting-related code smell warnings
- Track `Perl::Critic` violation trends in SonarQube dashboards

## analyze

> **HEADING FORMAT — MANDATORY:** Every group heading MUST be a markdown hyperlink.
> Compliant: [`src/Service.java:45`](src/Service.java#L45)
> Non-compliant: `Service.java` · `**Service.java**` · a plain bullet

Scan the workspace for SonarQube code-smell, duplication, and complexity findings. Group by issue type. Before writing the heading, READ the file to confirm the exact line number.

[`path/to/File:lineNumber`](path/to/File#LlineNumber)

**Before** — exact lines from the file at that line:
```language
[exact lines]
```
**After** — complete working replacement:
```language
[complete corrected replacement]
```
**Why:** [SonarQube rule ID, technical debt estimate, and why this improves maintainability]
**Also affects:** [`path/to/OtherFile:line`](path/to/OtherFile#Lline)

Rules:
- Heading MUST be a markdown hyperlink — NOT bold text, NOT plain filename
- `lineNumber` MUST be confirmed by reading the file
- Before block MUST be verbatim from the file
- After block MUST be a complete working replacement
- Top 5 by technical debt cost; summarise remainder

## Phase 1 — Planning

### Classify
Perfective maintenance: no active fault. Triggered by accumulated technical debt, a Quality Gate threshold breach, or a planned debt-reduction campaign.

### Scope inventory
- Run SonarQube scan and export the full issue list filtered to Code Smell / Duplication categories
- Group by rule ID and count — identify systemic patterns vs one-off issues
- Calculate total technical debt estimate (SonarQube minutes/hours)
- Confirm no Blocker/Critical bugs are in scope — those belong in corrective/sonarqube-bugs

### Rollback procedure [G-ROLL-01]
- `git revert <sha>` for any committed refactoring
- Perfective changes rarely have data-level rollback risk, but confirm no public API was changed

**Branch naming** [G-GIT-01]: `perfective/sonarqube-<scope>` e.g. `perfective/sonarqube-complexity-auth`

## Phase 2 — Perfective

For each file change produce a fenced Before/After code block — do not describe what to change, show it:
- **File** — exact path
- **Before** — exact lines being replaced, copied from the file
- **After** — replacement lines with improvement applied

**Suppression only as last resort** [G-VAL-04]: any suppression annotation (`@SuppressWarnings("S1234")`, `#pragma warning disable S1234`, `# noqa: RULEid`, `//NOSONAR`) MUST include the exact rule ID and a one-line justification. Bare suppressions are a code smell and will not be accepted.

**No behavioral change**: perfective changes must not alter observable behavior. If a refactoring changes behavior (e.g., error handling, return values), flag it for user review before applying.

After applying changes, verify:
1. **Build**: detect build tool — `pom.xml`/`build.gradle` → `mvn test`/`./gradlew test`; `*.csproj`/`*.sln` → `dotnet build && dotnet test`; `pyproject.toml` → `pytest`; `Makefile.PL` → `make test`
2. **Test**: run full suite and report pass/fail
3. **Re-scan**: run SonarScanner or linter and confirm the debt metric has decreased

## Phase 3 — Validation

1. **Build and test** — paste full output [G-VAL-01]
2. **Coverage** [G-VAL-03]: coverage must not decrease — refactoring should not reduce test coverage
3. **Debt delta**: show before/after technical debt estimate from SonarQube or linter report
4. **No new issues**: confirm no new code smells or complexity violations were introduced
