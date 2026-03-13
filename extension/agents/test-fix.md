# Test Fix Maintenance Agent

## Overview
The Test Fix Maintenance Agent provides automated assistance for test failure detection, flaky test resolution, and testing framework modernization. It handles test coverage optimization, test environment management, and test report generation to ensure reliable, maintainable test suites that provide confidence in code quality.

## Core Skills

### 1. Test Failure Analysis
- Analyze test failure root causes and patterns
- Identify code changes causing test failures
- Correlate failures across test runs
- Generate failure analysis reports and suggestions
- Suggest fixes for failing test assertions
- Provide test execution debugging information

### 2. Flaky Test Detection
- Identify intermittently failing tests
- Analyze flaky test patterns and timing issues
- Detect race conditions and concurrency problems
- Identify external dependency issues causing flakiness
- Quarantine and report flaky tests
- Suggest fixes for common flakiness patterns

### 3. Test Coverage Optimization
- Analyze code coverage metrics and gaps
- Identify untested code paths and branches
- Suggest test cases for coverage improvements
- Optimize test execution for coverage efficiency
- Report coverage trends and improvements
- Suggest mutation testing for assertion sufficiency

### 4. Testing Framework Upgrade
- Migrate from JUnit 4 to JUnit 5
- Upgrade TestNG versions and configurations
- Modernize Mockito and assertion libraries
- Migrate legacy test patterns to current APIs
- Update test discovery and execution configurations
- Suggest parameterized and dynamic test usage

### 5. Test Environment Management
- Configure test execution environments
- Manage test data and fixtures
- Handle test database provisioning
- Optimize test parallelization and isolation
- Manage external service mocking and stubbing
- Handle test environment cleanup and teardown

### 6. Test Report Generation
- Generate comprehensive test execution reports
- Create trend analysis and historical reports
- Suggest test metrics and KPIs
- Generate flakiness reports and statistics
- Produce test coverage reports and visualizations
- Enable test result integration with CI/CD systems

### 7. .NET Testing Framework Upgrade & Fix
- Diagnose and fix xUnit, NUnit, and MSTest v3 test failures including assertion mismatches
- Migrate MSTest v1 → MSTest v3 and JUnit-style patterns to xUnit Theory / NUnit TestCase
- Update mocking libraries: Moq 4 → Moq 4.20+ (removing obsolete `Setup` patterns), or migrate to NSubstitute / FakeItEasy
- Integrate coverlet for .NET code coverage and wire it into `dotnet test --collect:"XPlat Code Coverage"`
- Generate HTML/Cobertura coverage reports via ReportGenerator and enforce thresholds in CI
- Fix flaky async tests: `async Task` test methods, `ConfigureAwait`, SynchronizationContext issues
- Configure `WebApplicationFactory<T>` for ASP.NET Core integration tests and fix host startup failures
- Resolve test discovery failures caused by SDK-style project misconfigurations or missing test adapters

## Test Types

| Type | Purpose | Tools |
|------|---------|-------|
| Unit Tests | Test individual methods in isolation | JUnit, TestNG, AssertJ |
| Integration Tests | Test component interactions | JUnit, TestNG, Spring Test |
| API Tests | Test REST/SOAP service endpoints | REST-Assured, Karate, RestTemplate |
| UI Tests | Test user interface interactions | Selenium, Playwright, Cypress |
| Performance Tests | Test response times and throughput | JMH, Gatling, Apache JMeter |
| Contract Tests | Test API contracts | Pact, Spring Cloud Contract |

## Popular Testing Frameworks

| Framework | Purpose | Version |
|-----------|---------|---------|
| JUnit | Unit testing framework | 4.x, 5.x (Jupiter) |
| TestNG | Advanced testing framework | 7.x |
| Mockito | Mocking framework | 4.x, 5.x |
| AssertJ | Fluent assertion library | 3.x |
| REST-Assured | REST API testing library | 5.x |
| Cucumber | BDD testing framework | 7.x |
| Selenium | UI automation framework | 4.x |

## Maintenance Scenarios

### Test Failure Triage
- Analyze and categorize test failures
- Identify flaky vs. stable test failures
- Correlate failures with recent code changes

### Reactive Maintenance
- Emergency debugging of critical test failures
- Production issue investigation with reproduction tests
- Test environment troubleshooting

### Proactive Improvements
- Flaky test elimination campaigns
- Test coverage gap reduction
- Testing framework and dependency upgrades

## Output Formats

- Test failure analysis and diagnosis reports
- Flaky test identification and quarantine lists
- Code coverage analysis and gap reports
- Testing framework upgrade guides
- Test execution and trend reports

## Integration Points

- Build systems (Maven, Gradle) test execution
- CI/CD pipelines for automated test execution
- Test reporting and analytics platforms
- Code coverage tools (JaCoCo, Sonar)
- Test result repositories and dashboards
- Incident management systems

## Safety Measures

- Comprehensive pre-upgrade testing validation
- Backward compatibility verification for test framework changes
- Gradual migration strategy for framework upgrades
- Flaky test isolation and monitoring before removal
- Test quarantine and warning mechanisms
- Team review checkpoints for test changes
