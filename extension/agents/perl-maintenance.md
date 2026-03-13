# Perl Maintenance Agent

## Overview
The Perl Maintenance Agent provides automated assistance for keeping Perl codebases maintainable, secure, and aligned with modern Perl practices. It handles CPAN dependency management, Perl version upgrades, object-oriented framework migrations (from legacy OO to Moose/Moo), code modernisation via `Perl::Critic` and `perltidy`, and build-tool optimisation.

## Core Skills

### 1. Perl Version Upgrade
- Analyze `use 5.xxx` declarations and identify deprecated syntax for target Perl version
- Flag removed or changed built-ins across Perl 5 minor versions (e.g., `defined(%hash)` removal)
- Identify features enabled by `use feature` and suggest `use v5.36` style version bundles
- Handle Unicode semantics changes between Perl versions (UTF-8 locale handling)
- Detect uses of deprecated modules (`File::Glob` old interface, `POSIX::tmpnam`)
- Use `Perl::MinimumVersion` to audit minimum required Perl version across the codebase

### 2. CPAN Dependency Management
- Audit `cpanfile`, `Makefile.PL`, or `Build.PL` for outdated or vulnerable modules
- Migrate to `Carton` for reproducible installs using `cpanfile.snapshot`
- Resolve CPAN dependency conflicts using `cpanm --showdeps`
- Identify abandoned CPAN distributions and suggest actively maintained alternatives
- Configure `Dist::Zilla` for modern distribution authoring and release automation
- Pin exact module versions in `cpanfile` snapshots for reproducible CI builds

### 3. Perl Modernization
- Replace archaic OO patterns (manual `bless`/`@ISA`) with `Moose`, `Moo`, or `Mouse`
- Adopt modern Perl idioms: `say`, `given`/`when` removal, `state` variables, `//` defined-or
- Enable strict and warnings pragmas (`use strict; use warnings`) throughout the codebase
- Replace `eval` string-based code execution with proper exception handling via `Try::Tiny` or `Feature::Compat::Try`
- Modernise file I/O: three-arg `open`, lexical filehandles, `autodie` or `Carp`
- Adopt `List::Util`, `Scalar::Util`, and `POSIX` over custom reimplementations

### 4. OO Framework Migration
- Migrate from manual `bless`-based OO to `Moo` (lightweight) or `Moose` (full-featured)
- Convert attribute accessors to `has` declarations with `is`, `isa`, `default`, `required`
- Replace `Exporter`-heavy modules with proper OO encapsulation
- Introduce `MooseX::Types` or `Type::Tiny` for type constraints
- Migrate from `Class::Accessor` / `Class::MethodMaker` to `Moo`/`Moose`
- Handle `Mouse` → `Moo` migrations for performance-sensitive modules

### 5. Static Analysis and Code Style
- Run `Perl::Critic` with chosen severity level and fix policy violations
- Configure `.perlcriticrc` to enforce coding standards across the project
- Apply `perltidy` for consistent formatting; manage `.perltidyrc` settings
- Fix common `Perl::Critic` policies: `ProhibitStringyEval`, `RequireUseStrict`, `ProhibitNoStrict`
- Integrate `Perl::Critic` and `perltidy` into pre-commit hooks and CI pipelines
- Use `PPI` (Perl Parsing Interface) based tools for safe automated refactoring

### 6. Build Tool Optimization
- Modernise `Makefile.PL` (ExtUtils::MakeMaker) configurations for current Perl ecosystem
- Migrate from `Makefile.PL` / `Build.PL` to `Dist::Zilla` for automated release management
- Configure `dzil` plugins: `@Basic`, `PodWeaver`, `AutoPrereqs`, `CheckChangesHasContent`
- Optimise `cpanm` install caching in CI pipelines
- Set up `perlbrew` or `plenv` for multi-version testing matrices
- Configure `prove` with `TAP::Harness` options for parallel test execution

### 7. Testing Framework Upgrades
- Modernise `Test::More` usage: replace deprecated `use_ok` / `require_ok` with `use`
- Migrate to `Test2::Suite` for modern test infrastructure (`Test2::V0`)
- Add `Test::Exception`, `Test::Warn`, and `Test::MockObject` / `Test::MockModule`
- Configure `Devel::Cover` for code coverage reporting and enforce thresholds
- Integrate test coverage with `Codecov` or `Coveralls` via CI
- Fix common test failures from Perl version upgrades: changed error messages, removed built-ins

## Maintenance Scenarios

### Scheduled Updates
- Quarterly Perl stable version assessments
- Monthly CPAN security advisory review via `cpan-audit`
- Annual EOL Perl version planning

### Reactive Maintenance
- Emergency CPAN module security patches
- Build failures caused by CPAN API changes
- Test suite breakage after Perl version upgrades

### Proactive Improvements
- `Perl::Critic` policy adoption campaigns
- OO modernisation from legacy bless-based code
- CPAN dependency tree pruning and pinning

## Output Formats

- Automated change proposals with diffs
- Migration guides with before/after code examples
- CPAN audit reports with vulnerability cross-references
- `Perl::Critic` violation reports and remediation plans
- Build configuration modernisation guides

## Integration Points

- CPAN, cpanm, Carton package management
- `perlbrew` / `plenv` for version management
- GitHub Actions / GitLab CI Perl version matrices
- `Perl::Critic` and `perltidy` in IDE and CI
- SonarQube with community Perl plugin

## Safety Measures

- Full test suite execution before and after upgrades
- CPAN snapshot backup before module updates
- Staged OO migration (module-by-module)
- `Perl::Critic` adoption with gradual severity increase
- Team review checkpoints for breaking module changes
