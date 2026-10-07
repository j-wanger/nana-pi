---
name: py-init
description: Scaffold the Nana 5-layer Python dev harness. New projects get full scaffold; existing projects go through scan-approve-transform-validate. Use when the user says "init", "scaffold", or "set up a project".
---

Scaffold or retrofit the Nana Dev Kit harness into the current directory. Two modes: **new project** (full scaffold) and **existing project** (feasibility scan → approval → transform → validation).

## Prerequisites

Check that the kit path is available:
```bash
cat ~/.claude/.nana-dev-kit-path
```
If missing, tell the user to run `~/nana-dev-kit/install.sh` first.

## Mode Detection

Detect whether this is a new or existing project:
```bash
test -f pyproject.toml || test -f setup.py || test -f setup.cfg || test -f .pre-commit-config.yaml || test -f CLAUDE.md || test -f .claude/settings.json
```

- **If NONE exist:** New project → go to [New Project Steps](#new-project-steps)
- **If ANY exist:** Existing project → continue to Feasibility Scan below

---

## Feasibility Scan

Read `scanner.md` (in this skill directory) and follow its procedure. Uses tomllib for TOML parsing, grep for pre-commit URLs, find for layout detection. Run all 10 dimension checks. Do NOT modify any files during this phase.

Classifications: **compatible** (works as-is), **upgradeable** (automated changes needed), **blocking** (manual fix required).

After all checks, compile the report table:

```
| # | Dimension          | Status       | Detail                          |
|---|-------------------|--------------|----------------------------------|
| 1 | Build system      | <status>     | <what was detected>              |
| 2 | Source layout      | <status>     | <layout, source_dir, pkg>        |
| 3 | Linter/formatter   | <status>     | <what was detected>              |
| 4 | Type checker       | <status>     | <what was detected>              |
| 5 | Test framework     | <status>     | <what was detected>              |
| 6 | Pre-commit         | <status>     | <what was detected>              |
| 7 | Dependency manager | <status>     | <what was detected>              |
| 8 | Agent config       | <status>     | <what was detected>              |
| 9 | CI workflows       | <status>     | <what was detected>              |
|10 | Git secrets        | <status>     | <what was detected>              |

Layout: <src|flat>  |  source_dir: <src|.>  |  package_name: <detected>
```

### Approval Gate

**If ANY dimension is blocking:** STOP. Tell the user which dimensions are blocking and why. No files are modified. "Fix these manually, then re-run /py-init."

**If ALL dimensions are compatible or upgradeable:** Present the report and ask: "Feasibility scan passed. N upgradeable, M compatible. Proceed with transform? (y/n)"

Wait for explicit approval before proceeding.

---

## Existing Project Transform

Read `transform.md` (in this skill directory) and follow its procedure. Uses `source_dir` and `package_name` from the scan to parameterize all config. Key operations: replace black/isort with ruff in pre-commit, inject missing pyproject.toml sections, merge hooks. Runs Post-Transform Validation and presents summary.

---

## New Project Steps

1. **Initialize git** (if not already a repo):
   ```bash
   git init
   ```

2. **Copy pyproject.toml template** (if no pyproject.toml exists):
   ```bash
   KIT=$(cat ~/.claude/.nana-dev-kit-path)
   cp "$KIT/templates/pyproject.toml" ./pyproject.toml
   ```
   Then replace `{{PACKAGE_NAME}}` and `{{PROJECT_DESCRIPTION}}` placeholders.
   If pyproject.toml already exists, skip this step — do NOT overwrite.

3. **Initialize uv** (if no uv.lock):
   ```bash
   uv sync
   ```

4. **Copy template files** from the kit:
   ```bash
   KIT=$(cat ~/.claude/.nana-dev-kit-path)
   
   # Layer 1: Instruction files
   cp "$KIT/templates/AGENTS.md" ./AGENTS.md
   
   # Layer 1: Identity + workflow instructions
   mkdir -p .github/instructions
   cp "$KIT/templates/.github/instructions/nana.instructions.md" .github/instructions/
   cp "$KIT/templates/.github/instructions/workflow.instructions.md" .github/instructions/
   
   # Layer 2: Skills
   cp -r "$KIT/templates/.claude/skills/" .claude/skills/
   
   # Layer 3: Hooks
   mkdir -p .claude/hooks
   cp "$KIT/templates/.claude/settings.json" .claude/settings.json
   cp "$KIT/templates/.claude/enforce" .claude/enforce   # opt-in marker → scaffold self-enforces
   cp -R "$KIT/templates/.claude/hooks/." .claude/hooks/   # recursive: top-level *.sh + the session-start.d/ curators (sourced by session-start.sh under `set -euo pipefail` — omitting them aborts SessionStart). Recursive so no hook subdir is left behind and so it survives a hooks dir with no .md files.
   find .claude/hooks -name '*.sh' -exec chmod +x {} +
   
   # Layer 3: Identity rule + session state template
   mkdir -p .claude/rules
   cp "$KIT/templates/.claude/rules/"*.md .claude/rules/
   
   # Layer 4: Pre-commit
   cp "$KIT/templates/.pre-commit-config.yaml" .pre-commit-config.yaml
   
   # Layer 5: CI + PR template + CODEOWNERS
   mkdir -p .github/workflows
   cp "$KIT/templates/.github/workflows/ci.yml" .github/workflows/
   cp "$KIT/templates/.github/PULL_REQUEST_TEMPLATE.md" .github/
   cp "$KIT/templates/.github/CODEOWNERS" .github/
   
   # Sync script
   mkdir -p scripts
   cp "$KIT/scripts/sync-rules.sh" scripts/
   chmod +x scripts/sync-rules.sh
   
   # Audit log directory (gitignored)
   mkdir -p .nana
   echo '.nana/' >> .gitignore
   echo '.dev-wiki/enforcement.log' >> .gitignore   # enforcement firing log: runtime state, not source
   ```

5. **Run sync** to generate per-surface copies from AGENTS.md:
   ```bash
   bash scripts/sync-rules.sh . .
   ```

6. **Install pre-commit hooks**:
   ```bash
   uv add --dev pre-commit ruff mypy
   uv run pre-commit install
   ```

7. **Customize AGENTS.md**: Replace `{{PROJECT_NAME}}`, `{{PROJECT_DESCRIPTION}}`, and `{{PACKAGE_NAME}}` placeholders with actual values. Update `.github/CODEOWNERS` with actual team handles.

8. **Re-run sync** after customization:
   ```bash
   bash scripts/sync-rules.sh . .
   ```

## What NOT to do

- Do not modify any files during the feasibility scan phase — scan is read-only.
- Do not proceed past the approval gate if any dimension is blocking.
- Do not modify generated surface copies (CLAUDE.md, copilot-instructions.md) directly — edit AGENTS.md and re-sync.

## After scaffolding

For **new projects**, tell the user:
- "5-layer harness scaffolded. Edit AGENTS.md to customize, then `bash scripts/sync-rules.sh . .` to propagate."
- "Run `/py-test` after writing code, `/py-lint` to check, `/py-review` before committing."
- "Run `/dev-init` to set up development lifecycle tracking (phases, tasks, decisions)."

For **existing projects** (after transform), tell the user:
- "Harness retrofitted. Review the changes, then `bash scripts/sync-rules.sh . .` to propagate."
- "Run `/py-test`, `/py-lint`, `/py-review` as usual — tools read paths from pyproject.toml."
- "Run `/dev-init` to set up development lifecycle tracking if not already configured."
