# tests/ — pytest suite

- Discovery: `test_*.py` files, `test_*` functions. Mirror the feature folders
  of `src/` so a feature's tests are findable from its name. Nested folders are
  fine: the rail and the code map both recurse, and a citation keeps the nested
  path (`tests/billing/test_caps.py::test_cap`).
- **Test modules are mapped modules.** `tests/` is a code-map root, so every file
  here opens with the six-tag contract header docstring too, and a missing one
  fails `uv run python scripts/code_map.py --check`. The test root is
  `layerExempt`, so a test may import any layer — but nothing below may import a
  test.
- **Rail knobs.** `check(root, test_roots, call_names)` in `conftest.py` scans other
  suites and other spellings of a test declaration (default `("tests",)` and
  `("test", "it", "check")`), and a marker binds either to a `def test_...` or to the
  first such call anywhere on the next line — which is what a table-driven suite looks
  like.
- **Map knobs.** `code-map.config.json` takes `testRoots` (shorthand for `layerExempt`)
  and `exempt: [{path, reason}]` for a module whose content is pinned elsewhere — it
  stays in the map and keeps its edges, but it must say why it has no header.
- Assert invariants and failure paths, not implementation details.
- Coverage floor is 85% (`--cov-fail-under`); warnings are errors — fix causes.
- Shared fixtures live in `conftest.py`; keep fixtures local to a feature's test
  module until a second module needs them.
- **Trace marker.** A test that pins a `REQUIREMENTS.md` row declares it with a
  comment directly above its `def test_...` line (decorators may sit in between) —
  `# req: R-001 G-004`; stacked comment lines merge. A full run fails when an
  `implemented` row carries no marker, when an `untested` row does, and when an
  `implemented` row's evidence names no test in this repo. Fix the row or the
  marker; never silence the rail.

