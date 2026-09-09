---
name: py-lint
description: Run Python linting, formatting, and type checking (ruff + mypy via uv). Use after writing or modifying Python code, before committing, or when asked to lint.
---

# Python lint / format / type-check

Run, in order, from the project root:

```bash
uv run ruff check --fix .
uv run ruff format .
uv run mypy
```

- Report remaining issues concisely: `file:line — rule — message`, grouped by
  file. Fix what's mechanical; surface judgment calls instead of suppressing.
- Never add `# noqa` / `# type: ignore` to silence a finding without saying so
  and giving the reason inline in the marker.
- Complexity findings (C901, PLR too-many-*) mean decompose — extract helpers
  or split the module; don't raise the caps.
- If `uv` is missing, fall back to `python -m ruff` / `python -m mypy` and note
  the degraded mode.
