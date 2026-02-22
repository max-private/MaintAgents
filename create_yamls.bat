@echo off
cd /d "c:\Agents\MaintenanceAgents\metadata"

REM Write all YAML files using echo and redirection

(
  echo name: Java Maintenance Agent
  echo version: 1.0.0
  echo type: maintenance
  echo language: Java
  echo description: Automated Java dependency management, version upgrades, and API modernization
  echo.
  echo capabilities:
  echo   - java-version-upgrade
  echo   - dependency-update
  echo   - api-modernization
  echo   - spring-framework-updates
  echo   - build-tool-optimization
  echo   - testing-framework-upgrades
  echo.
  echo supported_tools:
  echo   - Maven
  echo   - Gradle
  echo   - Spring Boot
  echo   - JUnit
  echo   - Mockito
  echo   - TestNG
  echo.
  echo target_versions:
  echo   -java8
  echo   - java11
  echo   - java17
  echo   - java21
  echo.
  echo priority_areas:
  echo   - security
  echo   - performance
  echo   - code-quality
  echo   - compatibility
  echo   - maintainability
  echo.
  echo trigger_events:
  echo   - security-vulnerability
  echo   - dependency-outdated
  echo   - version-eol
  echo   - compatibility-issue
  echo   - performance-degradation
  echo.
  echo risk_level: medium
  echo requires_review: true
  echo estimated_execution_time: 15-60 minutes
) > java-maintenance.yml

echo Files created successfully
dir *.yml
