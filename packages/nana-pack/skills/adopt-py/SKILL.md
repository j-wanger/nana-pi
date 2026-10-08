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
- Network access to github.com — the template src is
  `https://github.com/j-wanger/nana-pi.git` (a local nana-pi checkout works as
  src too, for offline use or template development).

## Steps

1. **Scan**: existing pyproject/setup.py/setup.cfg/requirements*, layout
   (src/ vs flat), where tests live, existing lint/type/CI config, the import
   package name. Measure the baseline: does the suite pass, at what coverage
   (`pytest --cov` if cheap). You need the coverage number for step 5.
2. **Present the plan and get an OK** — what lands (tool pins, `.pi` post-edit
   preset, CI workflow, root AGENTS.md, answers file, and the requirements rail:
   `REQUIREMENTS.md`, the map and readme-check generators and four tests under `tests/` — see
   step 3), what gets merged (their
   `[project]` metadata + deps into the pinned pyproject, .gitignore union),
   what is never touched (source tree and tests — adopt does not restructure
   code), and the staged-strictness expectations from step 5.
3. **Overlay**:

   ```bash
   uvx copier copy --defaults --overwrite --data language=python --data adopt=true --data project_name="<name>" --data package_name="<import_name>" https://github.com/j-wanger/nana-pi.git .
   ```

   (One line on purpose — it must work in PowerShell too, where bash's `\`
   continuation breaks.)

   Adopt mode emits the configs AND the requirements rail — no source code:

   - configs: pyproject, pre-commit, CI, root AGENTS.md, `.pi/nana-pack.json`,
     `.copier-answers.yml`;
   - `REQUIREMENTS.md` with the standard `Part G` block, every G row
     `untested` and no product rows — the project's own behaviour is step 7's
     work;
   - `code-map.config.json` and the generator `scripts/code_map.py`;
   - a PLACEHOLDER `docs/code-map.md`. The first `--check` reports it stale and
     names the one command that regenerates it (`uv run python
     scripts/code_map.py`, or `python3 scripts/code_map.py` — it needs no deps);
   - four rail tests under `tests/`: `tests/conftest.py`,
     `tests/test_requirements_trace.py`, `tests/test_code_map.py`, and
     `tests/test_readme_check.py`, plus `scripts/readme_check.py`. Their markers
     render as `req-candidate:`, not `req:`, so the rail stays green until a row
     is promoted — rename its marker and cite the test in the row.

Files written by an adopt render into an empty folder:
- `.copier-answers.yml`
- `.github/workflows/ci.yml`
- `.gitignore`
- `.pi/nana-pack.json`
- `.pre-commit-config.yaml`
- `AGENTS.md`
- `HANDOFF.md` (written only when absent)
- `OBJECTIVE.md` (written only when absent)
- `REQUIREMENTS.md` (written only when absent)
- `code-map.config.json`
- `docs/code-map.md`
- `docs/sessions/README.md` (written only when absent)
- `pyproject.toml`
- `scripts/code_map.py`
- `scripts/readme_check.py`
- `tests/conftest.py`
- `tests/test_code_map.py`
- `tests/test_readme_check.py`
- `tests/test_requirements_trace.py`

No README/src/tests starters are emitted.
First two steps:
1. Ratify `OBJECTIVE.md`: ask the owner for one objective line and one current-priority line; write their words over the placeholders and DRAFT suffix, fill `<date>`, and never invent either line.
2. Trust the folder: `nana-setup trust <dir>`.

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
     merge — fold the template's hooks into their pre-commit list, and move the
     gate steps AND the template-drift job into their existing workflow instead
     of keeping a duplicate ci.yml.
   - `.pi/nana-pack.json`: if one existed, merge the postEdit command lists.
   - `AGENTS.md`: fold any existing AGENTS/CLAUDE.md content in, write the
     real Layout section (the template leaves a placeholder comment), keep it
     one screen.
   - **The rail files, if those names were already taken.** `--overwrite` means
     an existing `tests/conftest.py` — or any same-named rail file — was
     REPLACED, not merged. The `git diff` this step already reads is the
     recovery: fold their conftest content (fixtures, plugins, path setup) back
     in alongside the template's plugin, keeping both. A project whose tests do
     not live in `tests/` moves the four rail test files into the real test
     directory and updates citations.
5. **Stage the strictness** — legacy code won't be green day one; pins stay,
   escapes are recorded:
   - Before validation, reconcile the README so the rendered readme check passes: include install/run/test headings and document the code-map and readme-check scripts, or declare a script in `readme-check.config.json` with a reason. Fix the README, never the check.
   - On an adopted project, run `copier update --conflict inline`, never `--conflict rej`; convert decorator markers first.
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
7. **Run the requirements audit mode — BEFORE the gates.** The suite cannot be
   honestly green until this is done: the rail's project-wide self-test fails
   while mapped modules have no contract header, and the first `--check` fails
   while `docs/code-map.md` is still the placeholder. The overlay brings the
   toolchain and a `REQUIREMENTS.md` whose `Part G` rows exist, but the project's
   own behaviour is nowhere in it — and an adopted codebase is exactly where
   nobody knows what it promises. Use the `requirements` skill in audit mode:
   extract EARS rows from the design docs, `HANDOFF.md` and the test suite with
   read-only workers, place the `# req:` markers, then do the conflicts +
   failing-now pass and carry the conflicts in `Open questions` with whose call
   each one is. Generate the real map once (`uv run python scripts/code_map.py`).
   Expect `Part G` rows to land `violated` on a legacy codebase — that is the
   honest state and the ratchet list, same as the mypy overrides.
8. **Validate**: `uv sync`, `uv run pre-commit install`, then all four gates —
   `ruff check .`, `ruff format --check .`, `mypy`, `pytest` — green.
9. **Commit the adoption as one commit** (it must include
   `.copier-answers.yml` — the update relationship needs it git-tracked), then
   prove the relationship: `uvx copier update --pretend --defaults` runs clean.

## Notes

- Every deviation from a template pin (override, lowered floor, ignore) is
  debt with a paper trail: ratchet comment at the site, target in AGENTS.md.
- Never edit `.copier-answers.yml` by hand.
