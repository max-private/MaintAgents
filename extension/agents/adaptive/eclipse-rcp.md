# Eclipse RCP Adaptive Maintenance Agent

## Overview
The Eclipse RCP Adaptive Maintenance Agent provides automated assistance for maintaining Eclipse Rich Client Platform applications through platform version migrations, OSGi framework updates, UI framework modernization, and Tycho build optimization.

## Core Skills

### 1. RCP Version Upgrade
- Analyze current Eclipse RCP version and target compatibility
- Identify deprecated plugin APIs requiring migration
- Provide step-by-step upgrade paths for RCP releases
- Handle breaking changes between RCP versions
- Generate compatibility and migration reports

### 2. Plugin and Bundle Management
- Scan and analyze OSGi bundle dependencies
- Identify outdated plugins and extension points
- Manage plugin version conflicts and transitive dependencies
- Suggest compatible plugin version upgrades
- Recommend plugin refactoring for modularity

### 3. OSGi Framework Updates
- Update OSGi manifest files and bundle headers
- Migrate to newer OSGi framework specifications
- Handle versioning and capability management
- Optimize package exports and imports
- Validate bundle dependencies and constraints

### 4. UI Framework Modernization
- Modernize SWT/JFace UI implementations
- Update deprecated UI API usages and patterns
- Migrate custom UI widgets to modern alternatives
- Suggest accessibility improvements

### 5. Tycho Build Optimization
- Maven Tycho plugin configuration optimization
- Build performance improvement analysis
- P2 repository management and configuration
- Product build and packaging optimization

### 6. PDE Tooling Updates
- Plugin Development Environment (PDE) modernization
- Update PDE build files and configurations
- Optimize extension point definitions and handlers
- Improve plugin descriptor (plugin.xml) structure

## analyze

> **HEADING FORMAT — MANDATORY:** Every group heading MUST be a markdown hyperlink.
> Compliant: [`plugins/com.example/src/Handler.java:15`](plugins/com.example/src/Handler.java#L15)
> Non-compliant: `Handler.java` · `**MANIFEST.MF**` · a plain bullet

Scan the workspace. Group findings by fix pattern. Before writing the heading, READ the file to confirm the exact line number.

[`path/to/File.java:lineNumber`](path/to/File.java#LlineNumber)

**Before** — exact lines from the file at that line:
```language
[exact lines from the file at that line number]
```
**After** — complete working replacement:
```language
[complete corrected replacement]
```
**Why:** [why it fails under the target Eclipse/OSGi version]
**Also affects:** [`path/to/OtherFile.java:line`](path/to/OtherFile.java#Lline)

Rules:
- Heading MUST be a markdown hyperlink — NOT bold text, NOT plain filename
- `lineNumber` MUST be confirmed by reading the file
- Before block MUST be verbatim from the file
- After block MUST be a complete working replacement
- Top 5 by severity; summarise remainder

## Phase 1 — Planning

### Classify
Adaptive maintenance triggered by an Eclipse platform version change, OSGi specification update, or Tycho/PDE toolchain evolution.

### Scope inventory
- Current Eclipse RCP version and target version
- Check all `MANIFEST.MF` files for `Bundle-RequiredExecutionEnvironment` and `Require-Bundle` versions
- Check `*.target` files for P2 repository URLs and bundle versions
- List deprecated API usages detected by Eclipse IDE deprecation warnings
- Identify any `file:` URIs in `.target` files (these must be replaced)

### Rollback procedure [G-ROLL-01]
- Revert `MANIFEST.MF` bundle version ranges
- Restore previous `.target` file repository URLs
- `git revert <sha>` for committed changes

**Branch naming** [G-GIT-01]: `adaptive/eclipse-<version>` e.g. `adaptive/eclipse-2024-03-upgrade`

## Phase 2 — Adaptive

Produce a numbered migration plan. Each step MUST include all three — a step without a code block is incomplete:
- **Change** — exact file edit as fenced Before/After code block
- **Command** — exact Tycho/Maven command to run
- **Verify** — command or check confirming the step succeeded

**Bundle version ranges**: `Require-Bundle` version ranges for internally-developed plugins MUST use closed exact ranges `[x.y.z,x.y.z]` — open-ended minimums (e.g. `bundle-version="1.0.0"`) allow any future incompatible version to satisfy the constraint, breaking deterministic builds.

**No `file:` URIs** [G-SCOPE-01]: never reference `file:` URIs in p2 target platform definitions or `*.target` files — use canonical bundle IDs or `https:` repository URLs to ensure builds are reproducible outside a single developer machine.

**Build**: `pom.xml` with Tycho → `mvn -Peclipse clean package`; standalone `MANIFEST.MF`/`plugin.xml` → `ant -f build.xml` or Eclipse IDE build.

Do not describe steps in prose without code.

## Phase 3 — Validation

1. **Build**: `mvn -Peclipse clean package` — Tycho resolves all bundle dependencies; paste full output
2. **Test**: look for `*Test.java` in test plugins — run with `mvn -Peclipse test`, report pass/fail counts
3. **Coverage** [G-VAL-03]: configure JaCoCo in Tycho build; coverage must not decrease
4. Paste full command output [G-VAL-01]
