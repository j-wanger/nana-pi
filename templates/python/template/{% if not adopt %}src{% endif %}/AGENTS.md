# src/ — package code

src layout: this directory is NOT importable in place; the package installs via
`uv sync` and imports by its package name (never relative imports across features).

- One folder per feature. A feature folder holds everything that changes
  together: logic, models, helpers. Shared utilities earn a folder only after a
  second consumer exists.
- Public surface goes in the feature's `__init__.py`; keep it explicit and small.
- Module cap 500 lines, mccabe complexity 10 — split before suppressing.
