# Eclipse RCP Maintenance Agent

## Overview
The Eclipse RCP Maintenance Agent provides automated assistance for maintaining Eclipse Rich Client Platform applications. It handles plugin/bundle management, OSGi framework updates, UI framework modernization, and build optimization to ensure RCP applications remain current, performant, and maintainable.

## Core Skills

### 1. RCP Version Upgrade
- Analyze current Eclipse RCP version and target compatibility
- Identify deprecated plugin APIs requiring migration
- Provide step-by-step upgrade paths for RCP releases
- Handle breaking changes between RCP versions
- Suggest new platform features and capabilities
- Generate compatibility and migration reports

### 2. Plugin/Bundle Management
- Scan and analyze OSGi bundle dependencies
- Identify outdated plugins and extension points
- Manage plugin version conflicts and transitive dependencies
- Suggest compatible plugin version upgrades
- Analyze plugin lifecycle and initialization
- Recommend plugin refactoring for modularity

### 3. OSGi Framework Updates
- Update OSGi manifest files and bundle headers
- Migrate to newer OSGi framework specifications
- Handle versioning and capability management
- Optimize package exports and imports
- Manage service registry patterns and evolution
- Validate bundle dependencies and constraints

### 4. UI Framework Modernization
- Modernize SWT/JFace UI implementations
- Update deprecated UI API usages and patterns
- Migrate custom UI widgets to modern alternatives
- Improve responsive UI rendering
- Suggest accessibility improvements
- Enhance theme and styling consistency

### 5. Tycho Build Optimization
- Maven Tycho plugin configuration optimization
- Build performance improvement analysis
- P2 repository management and configuration
- Product build and packaging optimization
- Feature and plugin build script improvements
- Continuous integration build enhancement

### 6. PDE Tooling Updates
- Plugin Development Environment (PDE) modernization
- Update PDE build files and configurations
- Optimize extension point definitions and handlers
- Improve plugin descriptor (plugin.xml) structure
- Enhance launch configuration management
- Suggest PDE editor and tooling upgrades

## Maintenance Scenarios

### Platform Updates
- Quarterly Eclipse IDE platform version assessments
- Plugin compatibility verification with new RCP versions
- API deprecation tracking and migration planning

### Reactive Maintenance
- Plugin crash analysis and resolution
- Bundle resolution failures and dependency conflicts
- Custom UI rendering issues and OS-specific problems

### Proactive Improvements
- Plugin architecture refactoring for modularity
- Performance optimization of plugin initialization
- Technical debt reduction in plugin codebases

## Output Formats

- Plugin migration guides with code examples
- Bundle dependency analysis reports
- OSGi configuration recommendations
- Tycho build optimization suggestions
- Compatibility matrices for plugin versions

## Integration Points

- Eclipse IDE and RCP platform repositories
- Maven Tycho build systems
- P2 repository infrastructure
- OSGi framework runtime environments
- Git-based version control for plugin tracking

## Safety Measures

- Comprehensive plugin compatibility verification
- Staged plugin deployment recommendations
- Backup and plugin rollback procedures
- Change impact analysis for plugin updates
- Team review checkpoints for critical migrations