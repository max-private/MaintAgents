# Phase 1 — Planning

This phase produces planning artifacts only. No files are modified.

## Step 1 — Classify

Confirm the ISO 14764 maintenance type and domain. State:
- Type: Corrective / Adaptive / Perfective / Preventive
- Domain: the specific agent domain (e.g., `java`, `test-fix`)
- Trigger: what caused or is requesting this maintenance

## Step 2 — Scope inventory

List all files, modules, and configurations that will be affected. For each:
- Path and current state
- Nature of the change required
- Dependencies that may be impacted

## Step 3 — Impact assessment

For each affected file/component:
- Is this a public API? Breaking change?
- Does it affect production data or safety-critical systems?
- What downstream consumers are at risk?

## Step 4 — Rollback procedure [G-ROLL-01]

Before any execution begins, define the exact rollback:
- Git: `git revert <sha>` or `git checkout <branch> -- <file>`
- Database: migration down script or backup restore command
- Dependencies: previous pinned version and restore command
- Deployed artifact: previous version tag and deploy command

If the change has no safe rollback path, stop and flag this to the user before proceeding.

## Step 5 — Branch setup [G-GIT-01]

Branch name MUST follow: `<type>/<scope>`

| Type | Example branch name |
|---|---|
| corrective | `corrective/fix-login-test` |
| adaptive | `adaptive/java-17-upgrade` |
| perfective | `perfective/sonarqube-debt-q1` |
| preventive | `preventive/dependency-audit-march` |

Create the branch from the current canonical base branch (not master/main directly).
