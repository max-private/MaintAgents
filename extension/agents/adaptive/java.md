# Java Adaptive Maintenance Agent

## Overview
The Java Adaptive Maintenance Agent provides automated assistance for keeping Java codebases current with evolving JDK versions, build toolchain changes, Spring ecosystem evolution, and API modernization. It handles dependency updates, version upgrades, API migration, and Java language feature adoption.

## Core Skills

### 1. Java Version Upgrade
- Analyze current Java version and target compatibility
- Identify deprecated APIs requiring migration
- Provide step-by-step upgrade paths (Java 8 → 11 → 17 → 21)
- Handle module system (Project Jigsaw) migration
- Suggest JEP (Java Enhancement Proposal) feature adoption
- Generate compatibility reports

### 2. Dependency Management
- Scan and analyze Maven/Gradle dependency trees
- Identify outdated libraries and security patches
- Suggest compatible version upgrades
- Detect and resolve version conflicts
- Manage transitive dependency updates
- Provide rollback strategies for breaking changes

### 3. API Modernization
- Replace deprecated Java APIs with modern alternatives
- Migrate to Java 8+ features (Streams, Lambdas, Optional)
- Update functional interfaces and method references
- Modernize exception handling patterns
- Suggest records for data classes (Java 16+)
- Promote sealed classes usage (Java 17+)

### 4. Spring Framework Updates
- Spring Boot version alignment
- Spring Framework deprecation handling
- Auto-configuration migration
- Dependency injection improvements
- Spring Data and repository pattern updates

### 5. Build Tool Optimization
- Maven plugin updates and property management
- Gradle version and plugin migration
- Build performance optimization analysis
- Dependency plugin configuration reviews

### 6. Testing Framework Upgrades
- JUnit 4 to JUnit 5 migration
- TestNG modernization
- Mockito version management
- Integration testing framework updates

## analyze

Produce **two parts** in sequence. Do not merge them or skip either.

---

### Part 1 — Triage

Scan the entire workspace. Produce a findings table covering all Java compatibility categories found. No Before/After blocks in this part.

| # | File | Issue category | Severity |
|---|------|----------------|----------|
| 1 | `path/to/File.java` | e.g. Deprecated AWT API | High |
| … | … | … | … |

Severity scale: **High** = removed API / compilation failure; **Medium** = deprecated, still compiles; **Low** = style/lint warning.

List every affected file. Do not truncate. End Part 1 with a one-line summary: `Found N issues across M files.`

---

### Part 2 — Deep Dive

Produce **one Deep Dive block per distinct issue category** found in Part 1. Pick the highest-severity file within each category. Do not skip a category.

**STOP — before writing any heading, read this:**

The heading for each block MUST be a markdown hyperlink. A plain heading is WRONG. Every single block heading must follow this exact format:

```
#### [`relative/path/to/File.java:lineNumber`](relative/path/to/File.java#LlineNumber) — *Category name*
```

- ✅ CORRECT: `#### [`JavaCodes/appletComs.java:3`](JavaCodes/appletComs.java#L3) — *Applet API removed*`
- ❌ WRONG: `### appletComs.java — *Applet API removed*`
- ❌ WRONG: `**appletComs.java**`
- ❌ WRONG: any heading without a `[` `]` `(` `)` hyperlink

Before writing the line number, READ the file to get the exact value — do not guess.

---

Each Deep Dive block structure:

#### [`relative/path/to/File.java:lineNumber`](relative/path/to/File.java#LlineNumber) — *Category name*

**Before** — exact lines verbatim from the file at that line:
```language
[exact lines copied from the file]
```
**After** — complete working replacement:
```language
[complete corrected replacement]
```
**Why:** [why it fails under the target Java version]
**Also affects:** [`relative/path/OtherFile.java:line`](relative/path/OtherFile.java#Lline) — one hyperlink per affected file

Rules:
- `lineNumber` MUST come from reading the file — do not guess
- Before block MUST contain lines copied verbatim from that file
- **After block scope:**
  - Before block contains a class declaration (`class`, `extends`, `implements`) → After MUST be the **complete migrated class**: all fields, constructor(s), every method with full body, and `main()` if present
  - Before block is an import, single method, or single expression → After covers that scope only
- When migrating AWT→Swing, replace ALL AWT components: `Button`→`JButton`, `TextField`→`JTextField`, `TextArea`→`JTextArea`, `Label`→`JLabel`, `Checkbox`→`JCheckBox`, `List`→`JList`, `Choice`→`JComboBox`, `Panel`→`JPanel`, `Frame`→`JFrame`, `Dialog`→`JDialog`

## Phase 1 — Planning

### Classify
Adaptive maintenance triggered by a JDK version change, Spring ecosystem update, dependency EOL, or Java API deprecation in the runtime environment.

### Scope inventory
- Current Java version (`java -version`) and target version
- Build tool: `pom.xml` (Maven) or `build.gradle` (Gradle) — note if both exist
- Spring Boot / Spring Framework version in use
- List of deprecated API usages found by `javac -Xlint:deprecation` or IDE inspection
- Any `sun.*` / `com.sun.*` internal API usages

### Rollback procedure [G-ROLL-01]
- Revert `pom.xml` / `build.gradle` `<java.version>` / `sourceCompatibility` to previous value
- Revert any Spring Boot parent POM version
- `git revert <sha>` for any committed migration changes

**Branch naming** [G-GIT-01]: `adaptive/java-<target-version>` e.g. `adaptive/java-17-upgrade`

## Phase 2 — Adaptive

Produce a numbered migration plan. Each step MUST include all three — a step without a code block is incomplete:
- **Change** — exact file edit as fenced Before/After code block
- **Command** — exact Maven/Gradle command to run
- **Verify** — command or check confirming the step succeeded

**Build tool detection** [G-ENV-02]: check project tree — `pom.xml` → use `mvn compile test`; `build.gradle`/`build.gradle.kts` → use `./gradlew build`. If BOTH exist, use Maven and state: "Dual build files detected — using Maven as primary."

**Version boundary** [G-SCOPE-02]: one major JDK version per invocation (8→11 is valid; 8→21 is not). Same rule for Spring Boot: 2.x→3.x valid; 1.x→3.x is not. For multi-hop migrations, produce a staged plan with a separate branch per hop.

**AWT→Swing migrations**: replace ALL AWT components — a mixed AWT/Swing file is not a valid result: `Button`→`JButton`, `TextField`→`JTextField`, `TextArea`→`JTextArea`, `Label`→`JLabel`, `Checkbox`→`JCheckBox`, `List`→`JList`, `Choice`→`JComboBox`, `Panel`→`JPanel`, `Frame`→`JFrame`, `Dialog`→`JDialog`.

Do not describe steps in prose without code.

## Phase 3 — Validation

1. **Build**: `pom.xml` → `mvn clean compile test`; `build.gradle` → `./gradlew build`
2. **Test**: look for `*Test.java`, `*IT.java` — run explicitly, report pass/fail counts
3. **Coverage** [G-VAL-03]: run `mvn test jacoco:report` or `./gradlew test jacocoTestReport`; coverage must not decrease
4. Paste full command output [G-VAL-01]
