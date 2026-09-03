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

## Steps

1. Need from the user (ask only for what's missing): destination directory and
   project name. Description is optional; package/distribution names derive
   automatically.
2. The template src is the nana-pi repo root, `~/nana-pi` (copier needs the
   git root to version the copy — that's what makes `copier update` work). If
   that checkout doesn't exist on this machine, ask where nana-pi lives.
3. Run:

   ```bash
   uvx copier copy --defaults --data language=python \
     --data project_name="<name>" --data description="<one-liner>" \
     ~/nana-pi <destination>
   ```

4. Then complete the printed next steps: `git init` + first commit, `uv sync`,
   `uv run pre-commit install`, `uv run pytest` — and confirm the smoke test
   passes before handing over.

## Notes

- The generated project records its template version in `.copier-answers.yml`;
  `uvx copier update` inside the project re-syncs it when the template evolves.
  Never edit that file by hand.
- Don't override the template's tool configs during scaffolding — deviations are
  per-project edits after generation, so `copier update` can surface drift.
