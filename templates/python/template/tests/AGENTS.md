# tests/ — pytest suite

- Discovery: `test_*.py` files, `test_*` functions. Mirror the feature folders
  of `src/` so a feature's tests are findable from its name.
- Assert invariants and failure paths, not implementation details.
- Coverage floor is 85% (`--cov-fail-under`); warnings are errors — fix causes.
- Shared fixtures live in `conftest.py`; keep fixtures local to a feature's test
  module until a second module needs them.
