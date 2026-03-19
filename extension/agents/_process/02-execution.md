# Phase 2 — Execution Guardrail Registry

Every guardrail ID used in domain agent files is defined here. Domain agents cite the ID inline — they do not repeat the full text.

## Git Guardrails

**[G-GIT-01]** Never commit directly to `master` or `main`. Branch name must follow `<type>/<scope>` (e.g., `corrective/fix-login-test`, `adaptive/java-21`). Create branch from the canonical base before any file change.

**[G-GIT-02]** Never `--force` push to any shared branch. If force-push appears necessary, stop and explain to the user before proceeding.

**[G-GIT-03]** Every change requires a PR linked to an issue. No direct merges to protected branches.

**[G-GIT-04]** Never skip pre-commit hooks (`--no-verify`). If a hook fails, fix the root cause.

**[G-GIT-05]** Never amend a commit that has already been pushed. Create a new commit.

## Environment Guardrails

**[G-ENV-01]** Never run destructive commands (`DROP TABLE`, `DELETE FROM`, `rm -rf`, `kubectl delete`) against a production environment without explicit user confirmation in the same session.

**[G-ENV-02]** All dependency changes must be applied in a clean, reproducible environment (fresh venv, clean Docker layer, or equivalent).

**[G-ENV-03]** Never edit lock files by hand (`package-lock.json`, `poetry.lock`, `cpanfile.snapshot`, `packages.lock.json`). Use the package manager exclusively.

## Scope Guardrails

**[G-SCOPE-01]** Only modify files inside the workspace root. Never touch `.github/workflows/`, `README.md`, `.gitignore`, or lock files unless the user explicitly asks.

**[G-SCOPE-02]** One major version boundary per adaptive execution (Java 8→11, not 8→21; .NET 6→8, not Framework→8; Python 3.8→3.11, not 2.7→3.12). If a multi-hop migration is needed, produce a staged plan with a separate branch per hop.

**[G-SCOPE-03]** CVSS ≥ 7.0 vulnerabilities: one CVE per PR. Bundling high/critical fixes hides regressions and makes rollback ambiguous.

## Validation Guardrails

**[G-VAL-01]** Phase 3 is mandatory. Never write "done", "fixed", or "complete" without pasting actual build/test command output in the response.

**[G-VAL-02]** A failing test is never resolved by deletion, assertion weakening, or `@Ignore`/`@Skip` without a documented reason. Fix the root cause. If the finding is a false positive, document the compensating control and ask the user to confirm before suppressing.

**[G-VAL-03]** Code coverage must not decrease as a result of any change. If it does, add a test before declaring done.

**[G-VAL-04]** No suppression-as-fix: `@SuppressWarnings`, `// NOSONAR`, `# noqa`, `[SuppressMessage]` are not remediations. Any suppression MUST include the exact rule ID and a one-line justification comment.

## Rollback Guardrail

**[G-ROLL-01]** Every destructive change (file deletion, public API removal, DB migration, dependency downgrade) requires the exact rollback command or procedure documented in Phase 1 before Phase 2 begins.
