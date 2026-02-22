#!/usr/bin/env python3
import os

base_path = r"c:\Agents\MaintenanceAgents"

files_content = {
    "agents/java-maintenance.md": """# Java Maintenance Agent

## Overview
The Java Maintenance Agent provides automated assistance for keeping Java codebases current, secure, and compliant with best practices. It handles dependency updates, version upgrades, API modernization, and Java language feature adoption.

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
- CI/CD integration suggestions

### 6. Testing Framework Upgrades
- JUnit 4 to JUnit 5 migration
- TestNG modernization
- Mockito version management
- Integration testing framework updates
- Test execution efficiency analysis

## Maintenance Scenarios

### Scheduled Updates
- Quarterly LTS version assessments
- Monthly security patch reviews
- Weekly critical vulnerability scans

### Reactive Maintenance
- End-of-life (EOL) framework handling
- Emergency security patches
- Critical bug fixes
- Performance degradation investigation

### Proactive Improvements
- Technical debt reduction
- Code smell elimination
- Performance optimization recommendations
- Monitoring and observability enhancements

## Output Formats

- Automated change proposals with diffs
- Migration guides with code examples
- Risk assessment and rollback plans
- Detailed compatibility matrices
- Performance impact analysis

## Integration Points

- Maven/Gradle build systems
- Git repositories for change tracking
- Issue tracking systems for progress
- CI/CD pipelines for automated testing
- Code review workflows

## Safety Measures

- Comprehensive test suite validation
- Staged rollout recommendations
- Backup and rollback procedures
- Change impact analysis
- Team review checkpoints
""",

    "metadata/java-maintenance.yml": """name: Java Maintenance Agent
version: 1.0.0
type: maintenance
language: Java
description: Automated Java dependency management, version upgrades, and API modernization

capabilities:
  - java-version-upgrade
  - dependency-update
  - api-modernization
  - spring-framework-updates
  - build-tool-optimization
  - testing-framework-upgrades

supported_tools:
  - Maven
  - Gradle
  - Spring Boot
  - JUnit
  - Mockito
  - TestNG

target_versions:
  - java8
  - java11
  - java17
  - java21

priority_areas:
  - security
  - performance
  - code-quality
  - compatibility
  - maintainability

trigger_events:
  - security-vulnerability
  - dependency-outdated
  - version-eol
  - compatibility-issue
  - performance-degradation

risk_level: medium
requires_review: true
estimated_execution_time: 15-60 minutes
""",

    "agents/eclipse-rcp.md": """# Eclipse RCP Maintenance Agent

## Overview
The Eclipse RCP (Rich Client Platform) Maintenance Agent specializes in updating and maintaining Eclipse-based applications. It handles IDE plugin updates, bundle management, UI framework evolution, and platform compatibility.

## Core Skills

### 1. Eclipse Platform Version Updates
- Analyze current Eclipse version and migration paths
- Handle breaking changes across major releases
- Manage bundle version alignment
- Update feature definitions and configurations
- Provide compatibility matrices
- OSGi framework version management

### 2. Plugin/Bundle Management
- Scan plugin dependencies and version conflicts
- Identify deprecated OSGi APIs
- Update MANIFEST.MF configurations
- Manage Import-Package and Require-Bundle declarations
- Version range optimization
- Bundle activation policies

### 3. UI Framework Modernization
- SWT (Standard Widget Toolkit) API updates
- JFace framework enhancements
- Workbench UI improvements
- Data binding framework updates
- Dialog and wizard pattern modernization
- Preference and property page refactoring

### 4. RCP Application Updates
- richclient.os configuration updates
- Application model migration (from extension to ApplicationModel)
- Perspective and view definition upgrades
- Command and key binding modernization
- Handler and listener pattern updates
- Splash screen and branding updates

### 5. Dependency Resolution
- P2 (Provisioning) update site management
- Feature patch creation and deployment
- Automated component update detection
- Target platform definition updates
- Build feature compatibility analysis

### 6. Plugin Development Tooling
- PDE (Plugin Development Environment) project structure updates
- Build.properties and manifest synchronization
- Tycho build system optimization
- Source feature and repository management
- IDE plugin API usage modernization

## Maintenance Scenarios

### Version Upgrade Paths
- Eclipse 2021-12 → 2023-12 → 2024-12
- Oxygen → Photon → 2019 → Latest LTS
- OSGi R4 → R5 → R6 → R7/R8

### Plugin Updates
- Third-party plugin compatibility checks
- Custom plugin API adaptation
- Extension point migration
- Deprecated extension handling

### Tooling Improvements
- Workspace modernization
- Target platform updates
- Build process optimization
- Continuous integration setup

## Output Formats

- Plugin manifest update proposals
- Migration guides with code examples
- Compatibility check reports
- Build configuration updates
- Deployment package generation

## Safety Measures

- Plugin load order analysis
- Circular dependency detection
- API compatibility verification
- Workspace integrity checks
- Staged deployment recommendations

## Integration Points

- Git repositories for version control
- Maven/Tycho for build automation
- Jenkins/Hudson for CI/CD
- Bugzilla for issue tracking
- Eclipse Marketplace for plugin discovery
""",

    "metadata/eclipse-rcp.yml": """name: Eclipse RCP Maintenance Agent
version: 1.0.0
type: maintenance
framework: Eclipse RCP
description: Eclipse-based application updates, plugin management, and RCP platform maintenance

capabilities:
  - eclipse-version-upgrade
  - plugin-bundle-management
  - ui-framework-modernization
  - rcp-application-updates
  - dependency-resolution
  - pde-tooling-updates

supported_frameworks:
  - SWT
  - JFace
  - RCP
  - OSGi
  - P2
  - Tycho

target_versions:
  - eclipse-2024-12
  - eclipse-2023-12
  - eclipse-2022-12
  - eclipse-2021-12

priority_areas:
  - platform-compatibility
  - plugin-stability
  - ui-modernization
  - build-efficiency
  - security

trigger_events:
  - eclipse-release
  - plugin-incompatibility
  - osgi-deprecation
  - ui-framework-change
  - build-failure

risk_level: high
requires_review: true
estimated_execution_time: 30-120 minutes
specialized_knowledge_required: true
""",

    "agents/webservice-maintenance.md": """# Web Service Maintenance Agent

## Overview
The Web Service Maintenance Agent handles the update and maintenance of Java-based web services, including REST APIs, SOAP services, and microservices architectures. It focuses on framework versions, security protocols, and performance optimization.

## Core Skills

### 1. REST Framework Updates
- Spring Boot REST API modernization
- JAX-RS (Jersey, RESTEasy) updates
- Spring Web MVC to WebFlux migration
- Servlet specification version upgrades
- HTTP client library updates
- OpenAPI/Swagger documentation synchronization

### 2. Web Framework Upgrades
- Spring Framework version management
- Quarkus framework updates
- Vert.x version migration
- Tomcat/Jetty server updates
- Servlet container configuration improvements
- Async/reactive programming adoption

### 3. Security Updates
- HTTPS/TLS version enforcement
- SSL certificate management
- Spring Security configuration updates
- OAuth 2.0/OIDC implementation
- JWT token handling improvements
- CORS policy modernization
- Security headers (CSP, HSTS, X-Frame-Options)

### 4. API Contract Management
- OpenAPI 3.0+ specification updates
- Swagger to OpenAPI migration
- API versioning strategy improvements
- Backward compatibility analysis
- Breaking change detection
- Consumer-driven contract testing

### 5. Database Connectivity
- JDBC driver updates
- ORM framework management (Hibernate, JPA)
- Connection pooling optimization (HikariCP, Tomcat)
- Database migration tool updates
- Schema version alignment
- Data access pattern modernization

### 6. Performance & Monitoring
- Caching strategy updates (Redis, Memcached)
- Compression and serialization optimization
- Request/response logging improvements
- Distributed tracing setup (OpenTelemetry, Jaeger)
- Metrics collection and monitoring
- Load testing framework updates

## Maintenance Scenarios

### Deployment Steps
- Service health checks before update
- Blue-green deployment configuration
- Database schema migration execution
- API contract verification
- Rollback procedure activation if needed

### Critical Issues
- Service outages and restarts
- Resource exhaustion handling
- Connection pool saturation
- Database deadlock resolution
- Memory leak investigation

### Scheduled Maintenance
- Framework version updates
- Security patch application
- Dependency vulnerability scans
- Performance optimization
- Log cleanup and archival

## Interaction Patterns

### Synchronous Services
- Request/response timeout configuration
- Error handling and retries
- Circuit breaker pattern implementation
- Bulkhead isolation

### Asynchronous Services
- Message queue updates (RabbitMQ, Kafka)
- Event-driven architecture modernization
- Async processing framework upgrading
- Dead letter queue management

## Output Formats

- Service update deployment plans
- API compatibility reports
- Security configuration audits
- Performance optimization recommendations
- Monitoring dashboard setup guides

## Safety Measures

- Canary deployment strategies
- Feature flag implementation
- Graceful shutdown procedures
- Database transaction management
- API versioning for backward compatibility

## Integration Points

- Docker/Kubernetes orchestration
- CI/CD pipeline automation
- API gateway configuration
- Service mesh (Istio, Linkerd)
- Monitoring systems (Prometheus, ELK)
- API marketplaces
""",

    "metadata/webservice-maintenance.yml": """name: Web Service Maintenance Agent
version: 1.0.0
type: maintenance
focus: Java Web Services
description: REST APIs, microservices, and Java web application maintenance and updates

capabilities:
  - rest-framework-updates
  - web-framework-upgrades
  - security-updates
  - api-contract-management
  - database-connectivity
  - performance-monitoring

supported_frameworks:
  - Spring Boot
  - Spring MVC
  - JAX-RS
  - Quarkus
  - Vert.x
  - Micronaut

supported_technologies:
  - OpenAPI/Swagger
  - OAuth 2.0/OIDC
  - JWT
  - Docker
  - Kubernetes
  - Kafka
  - RabbitMQ

priority_areas:
  - security
  - performance
  - availability
  - api-compatibility
  - scalability

trigger_events:
  - framework-update-available
  - security-vulnerability
  - performance-degradation
  - api-breaking-change
  - database-issue

risk_level: high
requires_review: true
estimated_execution_time: 45-180 minutes
requires_downtime: conditional
""",

    "agents/os-compatibility.md": """# OS Compatibility Maintenance Agent

## Overview
The OS Compatibility Maintenance Agent ensures Java applications run seamlessly across Windows and Linux environments. It handles platform-specific code, system dependencies, and environment configuration differences.

## Core Skills

### 1. Windows Compatibility
- Windows API integration updates (JNI/JNA)
- Registry access and configuration management
- File path normalization and handling
- Windows Defender/Security compatibility
- UAC (User Access Control) requirement handling
- Windows service installation and updates
- Batch script and PowerShell integration
- Windows-specific environment variables
- Character encoding (UTF-8 vs system default)
- DLL dependency management

### 2. Linux Compatibility
- Linux system library dependencies (glibc, OpenSSL)
- File permission and ownership handling
- systemd service integration
- Shell script compatibility (bash, sh)
- Linux-specific environment variables
- X11 and Wayland display server support
- Package manager support (apt, yum, dnf, pacman)
- Security module (SELinux, AppArmor) handling
- Container/Docker optimization
- Process management and signals

### 3. Cross-Platform File Handling
- Path separator normalization (\ vs /)
- Symbolic link support
- File encoding detection and conversion
- Locale-specific character handling
- Temporary directory management
- Home directory discovery
- XDG Base Directory compliance (Linux)

### 4. Dependency Resolution
- OpenJDK vs OracleJDK detection
- Native library version alignment
- SSL/TLS library compatibility
- Graphics library support (headless mode)
- Audio system compatibility
- Font rendering differences

### 5. Build System Optimization
- Maven/Gradle profile management
- OS-specific build profiles
- Conditional plugin execution
- Platform-specific resource handling
- Native image compilation (GraalVM)
- Container image optimization

### 6. Environment Configuration
- System property detection and adaptation
- JVM arguments optimization per OS
- Memory configuration auto-tuning
- Thread pool sizing based on CPU count
- Time zone and locale handling
- Hostname and network detection

## Maintenance Scenarios

### Development Environment Setup
- IDE configuration for Windows/Linux development
- Build tool setup validation
- JDK installation verification
- Required system libraries installation
- Development environment documentation

### Production Deployment
- OS-specific installation packages
- Service startup scripts
- Monitoring agent compatibility
- Backup and recovery procedures
- Log file location configuration

### Issue Resolution
- OS-specific error handling
- System resource constraints
- Permission-related failures
- Locale-specific issues
- Time synchronization problems
- Network interface configuration

## Platform-Specific Fixes

### Windows Issues
- Path length limitations (260 character limit)
- Line ending differences (CRLF vs LF)
- Driver requirements for specific hardware
- Group Policy restrictions
- Windows Firewall configuration

### Linux Issues
- Library version mismatches
- SELinux/AppArmor policy conflicts
- User privilege separation
- Resource limits (file descriptors, memory)
- Kernel module dependencies

## Output Formats

- Cross-platform compatibility reports
- OS-specific build configuration updates
- System requirement documentation
- Installation and setup guides per platform
- Testing recommendations for each OS
- Troubleshooting guides

## Testing Strategy

- Multi-platform CI/CD pipelines
- Windows Server and Desktop validation
- Ubuntu, CentOS, Debian, Alpine testing
- Docker container compatibility verification
- Virtual machine environment validation

## Integration Points

- Build automation systems (Maven, Gradle)
- CI/CD platforms (Jenkins, GitHub Actions, GitLab CI)
- Container registries (Docker Hub, ECR)
- Package managers (Chocolatey, Homebrew, apt, yum)
- System monitoring tools
""",

    "metadata/os-compatibility.yml": """name: OS Compatibility Maintenance Agent
version: 1.0.0
type: maintenance
focus: Cross-Platform Java Applications
description: Windows and Linux compatibility management for Java applications

capabilities:
  - windows-compatibility
  - linux-compatibility
  - cross-platform-file-handling
  - dependency-resolution
  - build-system-optimization
  - environment-configuration

supported_platforms:
  - Windows 10
  - Windows 11
  - Windows Server 2019
  - Windows Server 2022
  - Ubuntu 20.04 LTS
  - Ubuntu 22.04 LTS
  - CentOS 7/8
  - RHEL 7/8/9
  - Debian 10/11/12
  - Alpine Linux

supported_architectures:
  - x86_64
  - arm64
  - armv7

priority_areas:
  - compatibility
  - portability
  - performance
  - security
  - deployment

trigger_events:
  - new-platform-requirement
  - os-version-update
  - library-incompatibility
  - deployment-failure
  - performance-issue

risk_level: medium
requires_review: true
estimated_execution_time: 20-90 minutes
requires_testing_on_multiple_os: true
""",

    "agents/vulnerability-fix.md": """# Vulnerability Fix Maintenance Agent

## Overview
The Vulnerability Fix Maintenance Agent proactively identifies, analyzes, and remediates security vulnerabilities in Java applications. It monitors CVE databases, performs security scanning, and implements fixes with minimal disruption.

## Core Skills

### 1. Vulnerability Detection & Analysis
- CVE (Common Vulnerabilities and Exposures) database scanning
- Dependency vulnerability scanning (using OWASP Dependency-Check, Snyk)
- Software Composition Analysis (SCA)
- Known vulnerability pattern matching
- Zero-day vulnerability assessment
- Risk severity scoring and prioritization
- Affected component identification
- Transitive dependency vulnerability detection

### 2. Common Java Vulnerabilities
- **Injection Attacks**: SQL injection, LDAP injection, command injection
- **Authentication & Session Management**: Session fixation, weak password storage
- **XSS (Cross-Site Scripting)**: Reflected and stored XSS prevention
- **CSRF (Cross-Site Request Forgery)**: Token-based protection
- **Insecure Deserialization**: Java serialization vulnerabilities
- **Broken Access Control**: Authorization bypass patterns
- **Cryptographic Failures**: Weak algorithms, improper key management
- **Security Misconfiguration**: Default credentials, exposed endpoints
- **Dependency Vulnerabilities**: Outdated libraries and frameworks
- **Log Injection**: Log poisoning and information disclosure

### 3. Dependency Update Strategy
- Safe version upgrade paths identification
- Breaking change impact assessment
- Compatibility matrix generation
- Gradual rollout planning
- Rollback procedure definition
- Zero-downtime update strategies

### 4. Code-Level Fixes
- Input validation and sanitization
- SQL parameterized query migration
- XSS prevention filter implementation
- CSRF token integration
- Secure deserialization patterns
- Password hashing algorithm upgrades
- SSL/TLS configuration hardening
- Security header implementation

### 5. Configuration Hardening
- Spring Security best practices
- Authentication mechanism modernization
- Authorization policy implementation
- Encryption algorithm standardization
- Key management solutions
- Secret management (Spring Cloud Config, Vault, AWS Secrets Manager)

### 6. Compliance & Audit
- Security vulnerability reporting
- Audit trail logging
- Compliance framework alignment (PCI-DSS, HIPAA, GDPR)
- Security certification tracking
- Patch management automation
- Vulnerability remediation tracking

## Vulnerability Categories

### Critical
- Remote Code Execution (RCE)
- Authentication bypass
- Elevation of privilege
- Data exfiltration paths
- Zero-day exploits

### High
- Significant SQL injection
- Cross-site scripting (XSS)
- Insecure deserialization
- Weak cryptographic implementations
- Information disclosure

### Medium
- Configuration weaknesses
- Missing security headers
- Insecure direct object references
- Inadequate logging
- Session management issues

### Low
- Best practice violations
- Outdated API usage
- Code quality issues
- Documentation gaps

## Remediation Process

1. **Detection**: Identify vulnerability via scanning or alert
2. **Analysis**: Assess impact, severity, and affected components
3. **Planning**: Develop fix strategy with minimal disruption
4. **Implementation**: Apply patches and code changes
5. **Testing**: Security testing and vulnerability re-scanning
6. **Validation**: Confirm fix effectiveness
7. **Deployment**: Release with monitoring
8. **Documentation**: Record fix and lessons learned

## Output Formats

- Vulnerability assessment reports with remediation plans
- Patch update recommendations with priority levels
- Security code review findings with fix suggestions
- Compliance checklist verifications
- Automated threat modeling documentation
- Security testing recommendations

## Safety Measures

- Staged patch deployment (dev → staging → production)
- Automated regression testing
- Security testing validation
- Performance impact analysis
- Rollback procedures
- Change approval workflows
- Impact assessment documentation

## Integration Points

- Vulnerability scanners (Snyk, OWASP Dependency-Check)
- SIEM systems (Splunk, ELK Stack)
- Ticketing systems (Jira, Azure DevOps)
- CI/CD pipelines (automated security checks)
- Container registries (image scanning)
- Secret management systems (Vault, AWS Secrets Manager)
- Code repositories (security policy enforcement)

## Continuous Monitoring

- Real-time vulnerability feeds
- Automated patch notification
- Scheduled vulnerability scans
- Log analysis for exploitation attempts
- Security metrics dashboards
- Incident response automation
""",

    "metadata/vulnerability-fix.yml": """name: Vulnerability Fix Maintenance Agent
version: 1.0.0
type: maintenance
focus: Security & Vulnerability Management
description: Security vulnerability detection, analysis, and remediation for Java applications

capabilities:
  - vulnerability-detection
  - cve-analysis
  - dependency-scanning
  - code-security-fixes
  - configuration-hardening
  - compliance-automation

supported_scanners:
  - OWASP Dependency-Check
  - Snyk
  - SonarQube Security
  - GitHub Advanced Security
  - Checkmarx
  - Fortify

vulnerability_types:
  - injection-attacks
  - authentication-flaws
  - cross-site-scripting
  - csrf-vulnerability
  - insecure-deserialization
  - access-control-issues
  - cryptographic-failures
  - security-misconfiguration
  - dependency-vulnerabilities
  - log-injection

severity_levels:
  - critical
  - high
  - medium
  - low

priority_areas:
  - security
  - compliance
  - risk-mitigation
  - data-protection
  - privacy

trigger_events:
  - vulnerability-detected
  - cve-released
  - zero-day-threat
  - security-audit
  - compliance-requirement

risk_level: critical
requires_review: true
requires_security_approval: true
estimated_execution_time: 30-240 minutes
estimated_deployment_impact: critical
""",

    "agents/test-fix.md": """# Test Fix Maintenance Agent

## Overview
The Test Fix Maintenance Agent automatically detects, analyzes, and fixes failing tests in Java applications. It maintains test suite quality, improves test coverage, and ensures robust validation across codebase changes.

## Core Skills

### 1. Test Failure Detection & Analysis
- Automatic test failure capture and logging
- Failure pattern recognition and categorization
- Root cause analysis automation
- Flaky test identification
- Test dependency mapping
- Test execution time analysis
- Failure frequency tracking

### 2. Common Test Failure Types

#### Unit Test Failures
- Assertion failures (expected vs. actual)
- NullPointerException in test setup
- Mocking/stubbing issues
- Test data inconsistency
- Timeout failures
- Resource cleanup issues

#### Integration Test Failures
- Database state issues
- External service mocking failures
- Transaction management problems
- Async test timing issues
- Container/environment setup failures

#### API Test Failures
- Endpoint response contract changes
- Authentication/authorization issues
- Request/response serialization problems
- Status code mismatches
- Security header validation failures

### 3. Test Framework Upgrades
- JUnit 4 → JUnit 5 migration
- Mockito version updates and API changes
- TestNG modernization
- AssertJ assertion library updates
- REST-assured API updates
- Selenium WebDriver version management
- Cucumber/BDD framework updates

### 4. Flaky Test Resolution
- Timing and race condition elimination
- Resource contention handling
- Environment-dependent test isolation
- Non-deterministic behavior identification
- Test retry strategies
- Timeout value optimization
- Test execution order analysis

### 5. Test Coverage Optimization
- Coverage gap identification
- Critical path testing analysis
- Code coverage metric improvement
- Dead code detection
- Edge case identification
- Coverage report generation

### 6. Test Environment Management
- Mock and stub configuration fixes
- Test database initialization
- Environment variable configuration
- External service mock setup
- Concurrent test execution optimization
- Test data factory patterns

## Failure Categories & Responses

### Setup Failures
- Fixture initialization issues
- Database migration problems
- Container startup failures
- Dependency injection misconfiguration

### Execution Failures
- Assertion errors
- Exceptions during test
- Timeout issues
- Resource exhaustion

### Verification Failures
- Mock expectation mismatches
- Spy verification failures
- Argument matcher issues
- Call sequence violations

### Teardown Failures
- Resource cleanup issues
- Temporary file handling
- Database cleanup problems
- Mock/spy reset failures

## Automated Fixes

### Code-Level Repairs
- Update deprecated assertion methods
- Fix mock and stub creation patterns
- Correct test fixture initialization
- Fix resource management (try-with-resources)
- Update parameter patterns (ArgumentMatchers)
- Correct async test handling

### Configuration Fixes
- JUnit 5 annotation updates (@Test, @BeforeEach, etc.)
- Test execution order specification
- Timeout configuration adjustments
- Parallel test execution setup
- Test data initialization

### Framework Migration
- JUnit 4 → JUnit 5 automated conversion
- Mockito API updates
- AssertJ migration suggestions
- Test listener/extension updates

## Maintenance Workflows

### Daily/Continuous
- Automated test execution monitoring
- Failure alert generation
- Quick fix recommendations
- Test results trending

### Weekly
- Flaky test investigation
- Coverage analysis and reporting
- Test suite optimization
- Deprecated API identification

### Quarterly
- Test framework version updates
- Test infrastructure scaling
- Coverage improvement initiatives
- Performance baseline updates

## Output Formats

- Test failure analysis reports
- Automated fix proposals with diffs
- Flaky test identification reports
- Test coverage improvement recommendations
- Framework upgrade migration guides
- Test execution performance reports

## Safety Measures

- Automated test validation before commit
- Code review integration
- Staged fix rollout
- Test result verification
- Regression detection
- Performance impact analysis

## Integration Points

- CI/CD systems (Jenkins, GitHub Actions, GitLab CI)
- Test frameworks (JUnit 5, Mockito, TestNG)
- Build tools (Maven, Gradle)
- Repository hosting (GitHub, GitLab, Bitbucket)
- Code quality gates (SonarQube)
- Issue tracking (Jira, Azure DevOps)
- Slack/Teams for notifications

## Advanced Capabilities

- Machine learning for failure prediction
- Test path optimization
- Resource leak detection
- Test timing regression analysis
- Cross-platform test compatibility
- Mobile and web UI test maintenance
""",

    "metadata/test-fix.yml": """name: Test Fix Maintenance Agent
version: 1.0.0
type: maintenance
focus: Test Suite Quality & Maintenance
description: Automatic test failure detection, analysis, and repair for Java applications

capabilities:
  - test-failure-detection
  - test-failure-analysis
  - test-framework-upgrades
  - flaky-test-resolution
  - coverage-optimization
  - test-environment-management

supported_frameworks:
  - JUnit 5
  - JUnit 4
  - TestNG
  - Mockito
  - AssertJ
  - REST-Assured
  - Selenium WebDriver
  - Cucumber
  - Jacoco

test_types:
  - unit-tests
  - integration-tests
  - api-tests
  - ui-tests
  - performance-tests
  - security-tests

failure_categories:
  - setup-failures
  - execution-failures
  - verification-failures
  - async-failures
  - timeout-failures
  - resource-management-failures

priority_areas:
  - test-reliability
  - code-coverage
  - performance
  - maintainability
  - test-speed

trigger_events:
  - test-failure
  - framework-update
  - coverage-drop
  - flaky-test-detected
  - timeout-threshold-exceeded

risk_level: low
requires_review: false
estimated_execution_time: 5-45 minutes
can_auto_commit: true
""",

    "agents/sonarqube-fix.md": """# SonarQube Fix Maintenance Agent

## Overview
The SonarQube Fix Maintenance Agent automatically addresses code quality issues identified by SonarQube. It handles code smells, bugs, vulnerabilities, and technical debt, improving overall code maintainability and reliability.

## Core Skills

### 1. Code Smell Detection & Remediation
- **Complexity Issues**
  - Cyclomatic complexity reduction (break down complex methods)
  - Method length optimization (split into smaller methods)
  - Cognitive complexity simplification
  - Deep nesting elimination
  - Duplicate code consolidation

- **Naming Issues**
  - Variable naming convention enforcement
  - Method naming clarity improvement
  - Class naming alignment
  - Constant naming standardization
  - Magic number elimination

- **Code Organization**
  - Unused variable removal
  - Dead code elimination
  - Import statement cleanup
  - Method ordering optimization
  - Class structure improvement

### 2. Bug Fix Patterns
- **Logic Errors**
  - Null pointer dereference prevention
  - Resource leak detection and fixing
  - Incorrect boolean logic
  - Array indexing errors
  - Type casting issues

- **Exception Handling**
  - Empty catch block elimination
  - Exception swallowing prevention
  - Resource cleanup in finally blocks
  - Try-with-resources pattern adoption
  - Exception type specificity

- **Concurrency Issues**
  - Race condition identification
  - Thread-safe access patterns
  - Synchronization issues
  - Volatile field usage
  - Immutability patterns

### 3. Vulnerability Fixes
- SQL injection prevention (parameterized queries)
- Cross-site scripting (XSS) prevention
- Cross-site request forgery (CSRF) protection
- Insecure deserialization handling
- Weak cryptography algorithm replacement
- Hardcoded credential removal
- Security header implementation

### 4. Code Style & Standards
- Java coding conventions enforcement
- Google/Oracle style guide alignment
- Checkstyle rule compliance
- Formatter configuration application
- Annotation usage standardization
- Java 8+ feature adoption

### 5. Testing & Coverage
- Test coverage gap analysis
- Untested code path identification
- Test quality improvement suggestions
- Branch coverage optimization
- Missing assertion detection
- Test code smell elimination

### 6. Dependency Management
- Outdated library identification
- Dependency vulnerability scanning
- Unused dependency removal
- Dependency version alignment
- API deprecated usage replacement

## Issue Categories & Actions

### Blocker Issues
- Potential runtime errors
- Security vulnerabilities
- Logical errors impacting functionality
- Memory leaks
- Infinite loops

### Critical Issues
- Code that is very likely incorrect
- Major security flaws
- Significant performance impacts
- Architectural violations

### Major Issues
- Code logic issues
- Test coverage gaps
- Standards violations
- Maintainability problems

### Minor Issues
- Standards formatting
- Naming inconsistencies
- Code duplication
- Trivial best practice violations

### Info
- Documentation gaps
- Best practice suggestions
- Code quality trends

## Automated Remediation Patterns

### Simplification
Convert if-else boolean returns to direct return statements

### Null Safety
Replace null checks with Optional for cleaner Java 8+ style

### Resource Management
Migrate to try-with-resources for automatic resource closing

### String Concatenation
Replace + concatenation with String.format() for better readability

## Analysis & Reporting

### Code Quality Metrics
- Technical debt calculation
- Issue density analysis
- Trend tracking over time
- Priority-based issue organization
- Team performance metrics

### Quality Gates
- Issue threshold monitoring
- Coverage targets validation
- Duplication limits enforcement
- Standards compliance tracking
- Regression detection

### Reporting
- Executive summaries
- Issue categorization
- Fix recommendations
- Estimated effort for remediation
- Progress tracking dashboards

## Maintenance Workflows

### Continuous Integration
- Automated quality check on commits
- Real-time issue detection
- Pull request quality validation
- Merge blocking on critical issues

### Scheduled Analysis
- Daily quality scans
- Weekly trend analysis
- Monthly improvement reviews
- Quarterly strategic planning

### Issue Management
- Automatic issue creation in tracking system
- Priority-based workflows
- Fix verification and closure
- Metrics collection and trending

## Integration with Development

### IDE Integration
- Real-time SonarQube issue highlighting
- Quick fix suggestions
- Issue navigation
- Project configuration

### Build System Integration
- Maven/Gradle plugin configuration
- Automated quality gate enforcement
- Build failure on quality violations
- Detailed quality reports

### CI/CD Integration
- Automated code analysis in pipelines
- Quality gate enforcement
- Artifact quality tracking
- Deployment approval based on quality

## Output Formats

- Quality analysis reports with remediation suggestions
- Automated code repair diffs
- Technical debt assessment
- Coverage improvement plans
- Standards compliance reports
- Issue trend dashboards

## Safety Measures

- Conservative fix strategies for complex issues
- Code review integration for automated changes
- Regression detection through test suite
- Gradual rollout of fixes
- Rollback capabilities
- Impact analysis before changes

## Advanced Features

- AI-assisted code optimization
- Bug pattern learning from codebase
- Predictive quality analytics
- Performance impact analysis
- Architecture violation detection
""",

    "metadata/sonarqube-fix.yml": """name: SonarQube Fix Maintenance Agent
version: 1.0.0
type: maintenance
focus: Code Quality & Technical Debt
description: Automated code quality improvement, bug fixes, and code smell remediation via SonarQube

capabilities:
  - code-smell-detection
  - bug-fix-automation
  - vulnerability-remediation
  - code-style-enforcement
  - test-coverage-optimization
  - technical-debt-reduction

analysis_engines:
  - SonarQube
  - SonarCloud
  - SpotBugs
  - Checkstyle
  - PMD

issue_types:
  - code-smells
  - bugs
  - vulnerabilities
  - code-duplication
  - unused-code
  - style-violations
  - test-coverage-gaps
  - complexity-issues

severity_levels:
  - blocker
  - critical
  - major
  - minor
  - info

priority_areas:
  - code-quality
  - maintainability
  - reliability
  - security
  - test-coverage

trigger_events:
  - quality-gate-failure
  - new-issue-detected
  - coverage-drop
  - issue-threshold-exceeded
  - standards-violation
  - critical-bug-found

risk_level: medium
requires_review: false
can_auto_commit: true
estimated_execution_time: 10-60 minutes
integration_strategy: continuous
"""
}

for file_path, content in files_content.items():
    full_path = os.path.join(base_path, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ {file_path}")

print("\n✅ All maintenance agent files successfully created!")
