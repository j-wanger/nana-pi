# tests/ — vitest suite

- `*.test.ts`, mirroring the feature folders of `src/` so a feature's tests are
  findable from its name.
- Assert invariants and failure paths, not implementation details.
- Tests are typechecked (tsconfig includes `tests/`) — keep them as strict as
  the code they exercise.
