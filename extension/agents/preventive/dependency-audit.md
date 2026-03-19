# Dependency Audit Agent

## Overview
The Dependency Audit Agent provides proactive scanning of dependency trees across all supported language ecosystems to detect vulnerable, outdated, or abandoned packages before they become active CVEs. This is preventive maintenance — no fault has been reported yet.

## Core Skills

### 1. Java / Maven / Gradle Dependency Audit
- Run OWASP Dependency-Check Maven plugin (`mvn org.owasp:dependency-check-maven:check`)
- Run `mvn versions:display-dependency-updates` to surface outdated dependencies
- Identify vulnerable transitive dependencies and suggest `<dependencyManagement>` overrides
- Detect EOL libraries and suggest actively maintained alternatives
- Configure Dependabot for automated Maven/Gradle security pull requests

### 2. .NET / NuGet Dependency Audit
- Run `dotnet list package --vulnerable` and `dotnet list package --outdated`
- Use `dotnet-outdated` to cross-reference with MSRC advisories
- Configure GitHub Dependabot for automated NuGet security PRs
- Interpret NuGet audit output (`NuGetAudit` MSBuild property in .NET 8+)
- Apply transitive vulnerability fixes using `<PackageReference>` overrides in `Directory.Packages.props`

### 3. Python / PyPI Dependency Audit
- Run `pip audit` to surface known CVEs in installed packages
- Run `safety check` against the PyUp.io vulnerability database
- Configure GitHub Dependabot for automated PyPI security PRs
- Pin minimum safe versions in `requirements.txt` / `pyproject.toml`
- Map CVEs to PyPI package versions using OSV database and PyPA advisory DB

### 4. Perl / CPAN Dependency Audit
- Run `cpan-audit` to check installed CPAN modules against CPAN Security Advisory database
- Cross-reference module versions with CPANSA feed
- Apply CPAN module upgrades using `cpanm` with pinned versions
- Configure release checks to block releases with known-vulnerable dependencies

### 5. Cross-Ecosystem Audit Coordination
- Generate a unified vulnerability report across all language stacks in a monorepo
- Prioritize findings by CVSS score across ecosystems
- Track audit findings in issue tracker with per-CVE issues
- Configure scheduled CI audit runs (weekly or on dependency file change)

## analyze

> **HEADING FORMAT — MANDATORY:** Every group heading MUST be a markdown hyperlink to the dependency file.
> Compliant: [`pom.xml:34`](pom.xml#L34)
> Non-compliant: `pom.xml` · `**requirements.txt**` · a plain bullet

Scan all dependency files in the workspace. Group findings by severity. Before writing the heading, READ the file to confirm the exact line number of the vulnerable dependency declaration.

[`path/to/dependency-file:lineNumber`](path/to/dependency-file#LlineNumber)

**Before** — exact dependency declaration at that line:
```language
[exact lines]
```
**After** — safe version replacement:
```language
[complete corrected declaration]
```
**Why:** [CVE ID, CVSS score, and affected version range]
**Also affects:** [`path/to/OtherFile:line`](path/to/OtherFile#Lline) — transitive references

Rules:
- Heading MUST be a markdown hyperlink — NOT bold text, NOT plain filename
- `lineNumber` MUST be confirmed by reading the file
- Before block MUST be verbatim from the file
- After block MUST specify the exact safe version (not a range)
- Top 5 by CVSS severity; summarise remainder

## Phase 1 — Planning

### Classify
Preventive maintenance: no active exploit reported. Triggered by a scheduled audit cycle, Dependabot alert, or pre-release security check.

### Scope inventory
- List all dependency files: `pom.xml`, `build.gradle`, `*.csproj`, `requirements.txt`, `pyproject.toml`, `cpanfile`, `package.json`
- Run the appropriate scanner for each ecosystem (see Core Skills)
- Triage findings: CVSS ≥ 7.0 → escalate to corrective/vulnerability-cve for immediate fix; CVSS < 7.0 → address in this preventive cycle

### Rollback procedure [G-ROLL-01]
- Record all current dependency versions before any change
- Restore from `git checkout -- <dependency-file>` and re-lock

**Branch naming** [G-GIT-01]: `preventive/dep-audit-<date>` e.g. `preventive/dep-audit-2025-q1`

## Phase 2 — Preventive

For each dependency update produce a fenced Before/After code block:
- **File** — exact path to the dependency file
- **Before** — exact dependency declaration, copied from the file
- **After** — updated declaration with safe version pinned

**CVSS escalation** [G-SCOPE-03]: if a finding scores CVSS ≥ 7.0, do not fix it here — create a separate issue and handle it in corrective/vulnerability-cve with one-CVE-per-PR discipline.

**Lock files** [G-ENV-03]: never edit lock files by hand. After each dependency version change, run the package manager to regenerate the lock file and commit it atomically with the dependency change.

**Abandoned packages**: if a package has no releases in 24+ months, flag it for replacement — document the alternative in the PR description.

After updating each dependency group:
1. **Build**: run the appropriate build command for the ecosystem
2. **Test**: run the full test suite — dependency updates can introduce subtle behavioral changes

## Phase 3 — Validation

1. **Re-scan**: run the audit scanner again and confirm all addressed findings are resolved
2. **Build and test** — paste full output [G-VAL-01]
3. **Coverage** [G-VAL-03]: coverage must not decrease
4. **Audit report**: attach or paste the clean audit scan output as evidence
