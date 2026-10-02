# src/ — package code

src layout: this directory is NOT importable in place; the package installs via
`uv sync` and imports by its package name (never relative imports across features).

- One folder per feature. A feature folder holds everything that changes
  together: logic, models, helpers. Shared utilities earn a folder only after a
  second consumer exists.
- Public surface goes in the feature's `__init__.py`; keep it explicit and small.
- Module cap 500 lines, mccabe complexity 10 — split before suppressing.
- **Contract header, every module.** The module docstring opens with the six tags in
  order: `@module @purpose @inputs @outputs @effects @errors`, then a blank line and
  any prose. `@effects` is one of `none | disk | database | network | process`
  (optional parenthetical). `docs/code-map.md` is generated from these —
  `uv run python scripts/code_map.py --check` fails on a missing or malformed one,
  and on a stale map.
- **One purpose per module; split before the header needs two sentences.** A
  `@purpose` with a second sentence in it is the module telling you it is two
  modules.
- Before changing a mapped module, read its blast radius:
  `uv run python scripts/code_map.py --impact src/<pkg>/<file>.py`.

