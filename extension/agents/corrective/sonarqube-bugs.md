# SonarQube Bug Fix Agent

## Overview
The SonarQube Bug Fix Agent provides targeted remediation for SonarQube bug-category and security-hotspot findings — potential null pointer dereferences, logic errors, resource leaks, and security-sensitive code that requires immediate correction.

## Core Skills

### 1. Bug Pattern Fixing
- Identify and fix SonarQube bug-category rule violations (potential null pointer, logic errors, resource leaks)
- Perform static analysis cross-reference to confirm the bug path
- Handle false positives with documented suppression justification
- Fix common SonarQube bug rules: S2259 (null dereference), S2095 (resource leak), S1764 (identical expressions)

### 2. Security Hotspot Remediation
- Identify security hotspots requiring review
- Analyze authentication, encryption, and data validation patterns
- Fix OWASP-mapped SonarQube rules: S2076 (OS injection), S2631 (regex injection), S5144 (SSRF)
- Provide secure coding alternatives for flagged patterns

### 3. Roslyn / dotnet-sonarscanner Bug Rules
- Interpret and fix Roslyn analyzer warnings mapped to SonarQube bug rules (S* rules from SonarAnalyzer.CSharp)
- Map SonarQube rule IDs (e.g. S2259, S4158) to their Roslyn equivalents
- Configure `.editorconfig` and `Directory.Build.props` to enforce analyzer severity

### 4. Python Bug Rules (pylint / ruff / bandit)
- Fix SonarQube Python bug issues: `assert` in production code, string duplication
- Integrate `bandit` and fix B-prefixed security warnings (SQL injection, hardcoded secrets)
- Apply inline `# noqa: RULEid` (never bare `# noqa`) for confirmed false positives

### 5. Perl Bug Rules (Perl::Critic)
- Map SonarQube Perl violations to `Perl::Critic` policy names
- Fix: `ProhibitStringyEval`, `RequireUseStrict`, `ProhibitNoStrict`
- Integrate `Perl::Critic` output into SonarQube via Generic Issue Import format

## analyze

> **HEADING FORMAT — MANDATORY:** Every group heading MUST be a markdown hyperlink.
> Compliant: [`src/Service.java:87`](src/Service.java#L87)
> Non-compliant: `Service.java` · `**Service.java**` · a plain bullet

Scan the workspace for SonarQube bug-category and security-hotspot findings. Group by rule ID. Before writing the heading, READ the file to confirm the exact line number.

[`path/to/File:lineNumber`](path/to/File#LlineNumber)

**Before** — exact lines from the file at that line:
```language
[exact lines]
```
**After** — complete working replacement:
```language
[complete corrected replacement]
```
**Why:** [SonarQube rule ID, CWE/OWASP reference, and why this pattern is a bug]
**Also affects:** [`path/to/OtherFile:line`](path/to/OtherFile#Lline)

Rules:
- Heading MUST be a markdown hyperlink — not bold text, not plain filename
- `lineNumber` MUST be confirmed by reading the file
- Before block MUST be verbatim from the file
- After block MUST be a complete working replacement
- Top 5 by severity (Blocker → Critical → Major); summarise remainder

## Phase 1 — Planning

### Classify
Corrective maintenance triggered by a SonarQube bug-category or security-hotspot finding: a potential runtime error or security-sensitive code path that must be corrected.

### Scope inventory
- List the SonarQube rule IDs and affected files from the Quality Gate report
- Confirm Blocker/Critical issues first — these block the Quality Gate
- Group findings by rule ID to identify systemic patterns

### Rollback procedure [G-ROLL-01]
- `git revert <sha>` for any committed change
- SonarQube: if suppression was added, remove annotation and re-scan to confirm the rule is actually resolved

**Branch naming** [G-GIT-01]: `corrective/sonar-<rule-id>` e.g. `corrective/sonar-S2259`

## Phase 2 — Corrective

For each file change produce a fenced Before/After code block — do not describe what to change, show it:
- **File** — exact path
- **Before** — exact lines being replaced, copied from the file
- **After** — replacement lines with fix applied

**No suppression-as-fix** [G-VAL-04]: any suppression (`@SuppressWarnings("S1234")`, `#pragma warning disable S1234`, `# noqa: E501`, `//NOSONAR`) MUST include the exact rule ID and a one-line comment stating why the suppression is justified. A bare suppression is itself a code smell and will not be accepted.

**Required output for each finding:**
- **Rule** — SonarQube rule ID and severity (Blocker/Critical/Major)
- **Before** — the flagged code, verbatim from file with path and line number
- **After** — corrected replacement
- **Why** — why the original pattern is a bug, not just a style issue

After applying all fixes, verify correctness:
1. **Build**: detect build tool — `pom.xml`/`build.gradle` → `mvn test`/`./gradlew test`; `*.csproj`/`*.sln` → `dotnet build && dotnet test`; `pyproject.toml` → `pytest`; `Makefile.PL` → `make test`
2. **Test**: run test suite and report pass/fail
3. **Re-scan**: run SonarScanner or the relevant linter and confirm the rule no longer fires

## Phase 3 — Validation

1. **Build and test** — paste full output [G-VAL-01]
2. **Coverage** [G-VAL-03] — coverage must not decrease
3. **Re-scan confirmation** — show that the SonarQube rule no longer fires on the fixed file
