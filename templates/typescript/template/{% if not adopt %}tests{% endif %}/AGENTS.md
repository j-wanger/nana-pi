# tests/ — vitest suite

- `*.test.ts`, mirroring the feature folders of `src/` so a feature's tests are
  findable from its name. Nested folders are fine: the rail and the code map both
  recurse, and a citation keeps the nested path (`tests/billing/caps.test.ts::cap`).
- **Test modules are mapped modules.** `tests/` is a code-map root, so every file
  here opens with the six-tag contract header too, and a missing one fails
  `pnpm map:check`. The test root is `layerExempt`, so a test may import any
  layer — but nothing below may import a test.
- **Rail knobs.** `check(root, { testRoots, callNames })` in `tests/requirements-trace.ts`
  scans other suites and other spellings of a test declaration (default `['tests']` and
  `['test', 'it']`; a helper-driven suite passes e.g. `['test', 'it', 'check']`), and a
  marker binds to the first such call anywhere on the next line.
- **Map knobs.** `code-map.config.json` takes `testRoots` (shorthand for `layerExempt`)
  and `exempt: [{ path, reason }]` for a module whose content is pinned elsewhere — it
  stays in the map and keeps its edges, but it must say why it has no header.
- Assert invariants and failure paths, not implementation details.
- Tests are typechecked (tsconfig includes `tests/`) — keep them as strict as
  the code they exercise.
- **Trace marker.** A test that pins a `REQUIREMENTS.md` row declares it with a
  comment directly above the `test(` / `it(` call — `// req: R-001 G-004`; stacked
  comment lines merge. The suite fails when an `implemented` row carries no marker,
  when an `untested` row does, and when an `implemented` row's evidence names no test
  in this repo. Fix the row or the marker; never silence the rail.

