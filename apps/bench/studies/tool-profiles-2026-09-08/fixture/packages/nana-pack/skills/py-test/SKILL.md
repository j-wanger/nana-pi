---
name: py-test
description: Run the Python test suite with coverage and report failures concisely. Use whenever asked to run tests, after writing code, or when verifying a change.
---

# Python tests

```bash
uv run pytest
```

Config (paths, coverage floor, warnings-as-errors) comes from `pyproject.toml` —
don't override it on the command line except to narrow scope while iterating
(`uv run pytest tests/<feature> -x`).

- Report: pass/fail counts, then each failure as `test_name — one-line cause`.
  Quote the assertion diff only when it's the fastest way to show the cause.
- Coverage below the floor fails the run; close the gap with tests for the
  uncovered branches — never by lowering `--cov-fail-under`.
- A warning-as-error failure means fix the cause; adding a `filterwarnings`
  entry needs an inline justification.
