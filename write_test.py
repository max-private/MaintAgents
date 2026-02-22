import os
import sys

base_path = r"c:\Agents\MaintenanceAgents"

# Simple test
try:
    test_file = os.path.join(base_path, "agents", "test.txt")
    with open(test_file, 'w') as f:
        f.write("Test")
    print("✓ Test file created")
    os.remove(test_file)
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

# File contents
java_md = """# Java Maintenance Agent

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
"""

java_yml = """name: Java Maintenance Agent
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
"""

files_to_create = [
    ("agents/java-maintenance.md", java_md),
    ("metadata/java-maintenance.yml", java_yml),
]

# Try to create files
for filepath, content in files_to_create:
    try:
        full_path = os.path.join(base_path, filepath)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        size = os.path.getsize(full_path)
        print(f"✓ {filepath} ({size} bytes)")
    except Exception as e:
        print(f"✗ {filepath}: {e}")

print("Done!")
