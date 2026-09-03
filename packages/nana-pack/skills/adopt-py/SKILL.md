---
name: adopt-py
description: Retrofit the nana-pi Python stack (uv + ruff + mypy strict + pytest, post-edit gates, copier drift tracking) onto an EXISTING Python project. Use when the user wants to adopt/retrofit/apply the nana standards to a project that already has code.
---

# Adopt the Python stack in an existing project

Overlay the nana-pi Python template onto a real project so it gains the pinned
toolchain AND the template-update relationship (`uvx copier update` works from
then on). The overlay is deliberately blunt (`--overwrite`); git is the
reconciliation surface — nothing is lost because the tree starts clean.

## Preconditions (stop and fix before anything else)

- The project is a git repo with a CLEAN working tree — commit or stash first.
  The reconcile step reads the pre-adoption state from git; a dirty tree makes
  that unrecoverable.
- NO existing `.copier-answers.yml` — one means the project is already managed
  by some template, and the overlay would sever that relationship. Stop,
  surface it, and proceed only on the user's explicit call.
- uv is installed. Deps in requirements.txt/Poetry get migrated during
  reconcile.
- nana-pi checkout at `~/nana-pi` (the repo root is the copier src; ask where
  nana-pi lives if not).

## Steps

1. **Scan**: existing pyproject/setup.py/setup.cfg/requirements*, layout
   (src/ vs flat), where tests live, existing lint/type/CI config, the import
   package name. Measure the baseline: does the suite pass, at what coverage
   (`pytest --cov` if cheap). You need the coverage number for step 5.
2. **Present the plan and get an OK** — what lands (tool pins, `.pi` post-edit
   preset, CI workflow, root AGENTS.md, answers file), what gets merged (their
   `[project]` metadata + deps into the pinned pyproject, .gitignore union),
   what is never touched (source tree and tests — adopt does not restructure
   code), and the staged-strictness expectations from step 5.
3. **Overlay**:

   ```bash
   uvx copier copy --defaults --overwrite --data language=python \
     --data adopt=true \
     --data project_name="<name>" --data package_name="<import_name>" \
     ~/nana-pi .
   ```

   Adopt mode emits configs only: pyproject, pre-commit, CI, root AGENTS.md,
   `.pi/nana-pack.json`, `.copier-answers.yml`. No README/src/tests starters.
4. **Reconcile from `git diff`** — merge THEIR content into OUR structure,
   file by file:
   - `pyproject.toml`: restore their `[project]` table (name, version, deps,
     scripts, urls) and build backend if they had one; keep the template's
     `[tool.*]` pins. Migrate requirements.txt/Poetry deps into
     `[project.dependencies]`. Flat layout: fix hatch `packages`, ruff `src`,
     mypy `files`, and `--cov=` to the real package path. Match ruff
     `target-version` and mypy `python_version` to THEIR `requires-python`
     floor — adoption never bumps the runtime.
   - `.gitignore`: union of theirs and the template's.
   - `.pre-commit-config.yaml` and CI: if they already had hooks or workflows,
     merge — fold the template's hooks into their pre-commit list, and add the
     gate steps to their existing workflow instead of keeping a duplicate
     ci.yml.
   - `.pi/nana-pack.json`: if one existed, merge the postEdit command lists.
   - `AGENTS.md`: fold any existing AGENTS/CLAUDE.md content in, write the
     real Layout section (the template leaves a placeholder comment), keep it
     one screen.
5. **Stage the strictness** — legacy code won't be green day one; pins stay,
   escapes are recorded:
   - `uv run ruff format .`, then `ruff check --fix`; fix the cheap remainder,
     per-file-ignores with a `# ratchet:` comment for the rest.
   - mypy: keep `strict = true`; add `[[tool.mypy.overrides]]` with relaxed
     flags for failing LEGACY modules only — new code stays strict. Two traps:
     strict's `disallow_untyped_calls` fires at CALL SITES, so callers of
     legacy modules (tests included) need that flag relaxed too; and override
     patterns must be fully-qualified module names — loose test files with no
     `tests/__init__.py` are named by basename (`test_core`, not
     `tests.test_core`), and partial wildcards like `test_*` are invalid.
   - Coverage: re-measure UNDER THE TEMPLATE'S coverage config (it pins
     `branch = true`, which reads lower than a statement-only baseline) and
     set `--cov-fail-under` to that number rounded down — not the template's
     85, not the step-1 baseline; note the ratchet target in AGENTS.md.
6. **Per-folder AGENTS.md**: author a lean one (one screen max) for each major
   source folder whose purpose isn't obvious from its name.
7. **Validate**: `uv sync`, `uv run pre-commit install`, then all four gates —
   `ruff check .`, `ruff format --check .`, `mypy`, `pytest` — green.
8. **Commit the adoption as one commit** (it must include
   `.copier-answers.yml` — the update relationship needs it git-tracked), then
   prove the relationship: `uvx copier update --pretend` runs clean.

## Notes

- Every deviation from a template pin (override, lowered floor, ignore) is
  debt with a paper trail: ratchet comment at the site, target in AGENTS.md.
- Never edit `.copier-answers.yml` by hand.
