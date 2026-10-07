---
name: scaffold-py
description: Scaffold a new Python project from the nana-pi copier template (uv + ruff + mypy strict + pytest, src layout, nested AGENTS.md, post-edit gates). Use when the user wants to start/init/scaffold a Python project.
---

# Scaffold a Python project

Generate from the nana-pi Python template via copier. The template pins the
opinionated stack: uv, ruff (lint+format, complexity caps), mypy strict, pytest
with an 85% coverage floor, src/ layout, folder-by-feature, lean per-folder
AGENTS.md files, and a `.pi/nana-pack.json` post-edit preset (format+lint on
every edit, 500-line module cap, mypy).

It also ships the **requirements-first** rail: a `REQUIREMENTS.md` with the
standard general-engineering block (`Part G`, G-001 to G-012 — sealed tunables
with provenance, the six-tag module header, named exports, injected resources,
layer direction, the code map, the README contract), the `# req: R-nnn` trace
check in the suite, and `scripts/code_map.py` with `--check` and `--impact`
wired into the post-edit checks (`uv run python scripts/code_map.py --check` / `--impact`).

## Steps

1. Need from the user (ask only for what's missing): destination directory and
   project name. Description is optional; package/distribution names derive
   automatically.
2. The template src is the nana-pi repo,
   `https://github.com/j-wanger/nana-pi.git` — copier clones it at the latest
   v* tag, which is what `_commit` records and `copier update` + the generated
   CI drift job track. (A local checkout path works as src too, for template
   development.)
3. Run:

   ```bash
   uvx copier copy --defaults --data language=python --data project_name="<name>" --data description="<one-liner>" https://github.com/j-wanger/nana-pi.git <destination>
   ```

   (One line on purpose — it must work in PowerShell too, where bash's `\`
   continuation breaks.)

4. Then complete the printed next steps: `git init` + first commit, `uv sync`,
   `uv run pre-commit install`, `uv run pytest` — and confirm the smoke test
   passes before handing over.

5. **The first two project steps**: ratify the seeded `OBJECTIVE.md` (fill the
   date; the DRAFT lines are the owner's to ratify), then trust the folder with
   `nana-setup trust <dir>`.
6. **The first real step after scaffolding is writing the project's first
   requirement rows** — `Part G` arrives filled in, the product rows are empty.
   Use the `requirements` skill: one EARS `shall` row per behaviour the project
   promises, each `planned` until a test with a `req:` marker pins it. Do this
   before the first feature, not after.

## Notes

- The generated project records its template version in `.copier-answers.yml`;
  `uvx copier update` inside the project re-syncs it when the template evolves.
  Never edit that file by hand.
- Don't override the template's tool configs during scaffolding — deviations are
  per-project edits after generation, so `copier update` can surface drift.
