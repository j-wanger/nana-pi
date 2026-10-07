---
parent: py-init
referenced_at: "referenced (step unknown)"
---

# Existing Project Transform

Apply changes using `source_dir` and `package_name` from scan. Follow this order — later steps depend on earlier ones.

## Step 1: pyproject.toml — Section Inject/Upgrade

**If missing:** Copy template, replace `{{PACKAGE_NAME}}`/`{{PROJECT_DESCRIPTION}}`, adjust all path references to use `source_dir`.

**If exists:** Read with tomllib to detect existing `[tool.*]` sections:
```bash
python3 -c "
import tomllib
with open('pyproject.toml', 'rb') as f: data = tomllib.load(f)
tool = data.get('tool', {})
for k in ['ruff','mypy','pytest','coverage']: print(f'{k}:', 'EXISTS' if k in tool else 'MISSING')
print('ruff.lint:', 'EXISTS' if 'lint' in tool.get('ruff', {}) else 'MISSING')
"
```

For each **missing** section, append template values parameterized by `source_dir`:
- `[tool.ruff]`: `src = ["<source_dir>"]`, `target-version = "py312"`, `line-length = 120`
- `[tool.ruff.lint]`: full `select` list from template
- `[tool.mypy]`: `strict = true`, `python_version = "3.12"`, full template config
- `[tool.pytest.ini_options]`: `testpaths = ["tests"]`, `addopts = "-x --cov=<source_dir> --cov-report=term-missing --cov-fail-under=85"`
- `[tool.coverage.run]`: `source = ["<source_dir>"]`, `branch = true`
- `[tool.coverage.report]`: template's `exclude_lines`, `fail_under = 85`

For **existing** `[tool.ruff]`: add `src` key if missing. Do NOT overwrite existing lint rules.
For other existing sections: leave as-is (user config takes precedence).

Ensure dev deps: `uv add --dev pytest pytest-cov mypy ruff pre-commit` (only missing ones).

## Step 2: Pre-commit Config — Repo Add/Replace

**If missing:** Copy template. **If exists:**
1. Replace black/isort repos with ruff-pre-commit (`https://github.com/astral-sh/ruff-pre-commit`, rev `v0.11.13`, hooks: `ruff --fix --exit-non-zero-on-fix` + `ruff-format`)
2. Add missing repos (by URL match): mirrors-mypy, gitleaks, validate-pyproject
3. Add sync-rules local hook if absent
4. Leave existing repos with same URL as-is (keep user's pinned rev)

## Step 3: .claude/settings.json — Hook Merge

**If missing:** Copy template. **If exists:** For each lifecycle point (SessionStart, PreToolUse, PostToolUse, Stop): append template hooks not already present (match by `command` path). Never remove existing hooks.

## Step 4: AGENTS.md / CLAUDE.md

- **Neither exists:** Copy AGENTS.md template, replace placeholders, customize Project Structure for detected layout (flat: remove `src/` wrapper from tree). Set `mypy`/`pytest` to bare `uv run` commands.
- **CLAUDE.md exists (no AGENTS.md):** Skip copy. Tell user to merge manually from template.
- **AGENTS.md exists:** Leave as-is.

## Step 5: Identity, Skills, Hooks, Scripts — Copy if Absent

```bash
KIT=$(cat ~/.claude/.nana-dev-kit-path)
mkdir -p .github/instructions .claude/skills .claude/hooks .claude/rules scripts .github/workflows .nana
[ -f .github/instructions/nana.instructions.md ] || cp "$KIT/templates/.github/instructions/nana.instructions.md" .github/instructions/
[ -f .github/instructions/workflow.instructions.md ] || cp "$KIT/templates/.github/instructions/workflow.instructions.md" .github/instructions/
for d in "$KIT/templates/.claude/skills/"*/; do n=$(basename "$d"); [ -d ".claude/skills/$n" ] || cp -r "$d" ".claude/skills/$n"; done
for f in "$KIT/templates/.claude/hooks/"*; do n=$(basename "$f"); [ -e ".claude/hooks/$n" ] || cp -r "$f" ".claude/hooks/$n"; done   # cp -r + -e: also copies the session-start.d/ subdir (sourced by session-start.sh under set -euo pipefail)
chmod +x .claude/hooks/*.sh .claude/hooks/session-start.d/*.sh 2>/dev/null
for f in "$KIT/templates/.claude/rules/"*.md; do n=$(basename "$f"); [ -f ".claude/rules/$n" ] || cp "$f" ".claude/rules/$n"; done
[ -f scripts/sync-rules.sh ] || cp "$KIT/scripts/sync-rules.sh" scripts/ && chmod +x scripts/sync-rules.sh
[ -f .github/workflows/ci.yml ] || cp "$KIT/templates/.github/workflows/ci.yml" .github/workflows/
[ -f .github/PULL_REQUEST_TEMPLATE.md ] || cp "$KIT/templates/.github/PULL_REQUEST_TEMPLATE.md" .github/
[ -f .github/CODEOWNERS ] || cp "$KIT/templates/.github/CODEOWNERS" .github/
grep -q '.nana/' .gitignore 2>/dev/null || echo '.nana/' >> .gitignore
grep -q 'enforcement.log' .gitignore 2>/dev/null || echo '.dev-wiki/enforcement.log' >> .gitignore
grep -q '.memory/' .gitignore 2>/dev/null || echo '.memory/*.db*' >> .gitignore   # per-project memory MCP store (binary; never commit)
```

## Step 6: Sync and Install

```bash
[ -f AGENTS.md ] && bash scripts/sync-rules.sh . .
[ -f uv.lock ] || uv sync
uv run pre-commit install
```

## Post-Transform Validation

Run and report each result (failures are informational, not blocking):
```bash
uv run ruff check . 2>&1 || true
uv run ruff format --check . 2>&1 || true
uv run mypy 2>&1 || true
uv run pytest --co -q 2>&1 || echo "No tests collected"
uv run pre-commit run --all-files 2>&1 || true
```

Present as summary table: Check | Result | Notes. Failures expected for some dimensions (e.g., mypy strict on untyped code).

## Merge Strategy Reference

| File | Missing | Exists |
|------|---------|--------|
| pyproject.toml | Copy template (parameterized) | Section-level inject: add missing `[tool.*]`, leave existing |
| .pre-commit-config.yaml | Copy template | Repo-level merge: add missing, replace black→ruff, keep revs |
| .claude/settings.json | Copy template | Hook union by command path, never remove |
| AGENTS.md | Copy (if no CLAUDE.md) | Leave as-is |
| All other template files | Copy | Skip existing |
