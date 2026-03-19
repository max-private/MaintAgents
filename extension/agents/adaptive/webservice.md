# Web Service Adaptive Maintenance Agent

## Overview
The Web Service Adaptive Maintenance Agent provides automated assistance for maintaining Java web services through framework version migrations, API evolution, Spring Boot updates, and authentication scheme upgrades triggered by environment or dependency changes.

## Core Skills

### 1. REST API Upgrade
- Analyze current REST API implementations and frameworks
- Upgrade from older to modern REST frameworks
- Migrate from JAX-RS to Spring MVC/WebFlux
- Handle API versioning strategies (URL, header, media type)
- Generate API documentation and OpenAPI specifications

### 2. SOAP Service Migration
- Modernize legacy SOAP web services
- Migrate SOAP to REST API alternatives
- Update SOAP stubs and client generation
- Handle WSDL evolution and versioning
- Manage namespace and schema updates

### 3. Spring Boot Updates
- Spring Boot version migration (2.7, 3.0, 3.1, 3.2)
- Spring Framework 6 upgrade and migration
- Auto-configuration analysis and optimization
- Dependency management and property updates
- Reactive stack adoption (Spring WebFlux)

### 4. API Contract Versioning
- Manage API versioning strategies
- Handle schema evolution and backward compatibility
- Implement graceful deprecation of API versions
- Manage API gateway versioning
- Document API contract changes and breaking changes

### 5. Authentication Scheme Upgrade
- Implement OAuth2 and JWT authentication
- Migrate from Basic Auth to Bearer/OAuth2
- Implement API key management and rotation
- Enable CORS, HTTPS, and TLS configurations

### 6. HTTP Client Library Migration
- Migrate from RestTemplate to WebClient (Spring)
- Update Apache HttpClient versions
- Migrate legacy SOAP clients to modern stubs

## analyze

> **HEADING FORMAT — MANDATORY:** Every group heading MUST be a markdown hyperlink.
> Compliant: [`src/api/UserController.java:34`](src/api/UserController.java#L34)
> Non-compliant: `UserController.java` · `**UserController.java**` · a plain bullet

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
**Why:** [why it fails under the target framework version]
**Also affects:** [`path/to/OtherFile.java:line`](path/to/OtherFile.java#Lline)

Rules:
- Heading MUST be a markdown hyperlink — NOT bold text, NOT plain filename
- `lineNumber` MUST be confirmed by reading the file
- Before block MUST be verbatim from the file
- After block MUST be a complete working replacement
- Top 5 by severity; summarise remainder

## Phase 1 — Planning

### Classify
Adaptive maintenance triggered by a REST/SOAP framework version change, Spring Boot upgrade, API gateway evolution, or authentication library update.

### Scope inventory
- Current Spring Boot / JAX-RS / CXF version
- List all REST endpoints (URL paths) — these must not change without explicit user confirmation
- List authentication schemes in use
- Check for deprecated `@RequestMapping` variants or Spring Security config patterns

### Rollback procedure [G-ROLL-01]
- Revert Spring Boot parent POM version
- Restore previous endpoint annotations if path changed
- `git revert <sha>` for committed changes

**Branch naming** [G-GIT-01]: `adaptive/webservice-<scope>` e.g. `adaptive/webservice-spring-boot-3`

## Phase 2 — Adaptive

Produce a numbered migration plan. Each step MUST include all three — a step without a code block is incomplete:
- **Change** — exact file edit as fenced Before/After code block
- **Command** — exact Maven/Gradle command to run
- **Verify** — command or check confirming the step succeeded

**REST path immutability**: never change the URL path of an existing REST endpoint. If a path must change, add the new versioned path and annotate the old one as deprecated (`@Deprecated`). Removing an existing path is a breaking change and requires explicit user confirmation.

**Auth scheme protection**: never downgrade an `Authorization` scheme from `Bearer`/OAuth2 to `Basic` — flag this as a security regression and stop.

**Version boundary** [G-SCOPE-02]: one Spring Boot major version per invocation (2.7→3.x is valid; 1.x→3.x is not).

Do not describe steps in prose without code.

## Phase 3 — Validation

1. **Build**: `pom.xml` → `mvn clean compile test`; `build.gradle` → `./gradlew build`
2. **Test**: look for `*Test.java`, `*IT.java` — run explicitly, report pass/fail counts
3. **Endpoint verification**: confirm all existing REST paths still resolve (curl or integration test)
4. **Coverage** [G-VAL-03]: coverage must not decrease
5. Paste full command output [G-VAL-01]
