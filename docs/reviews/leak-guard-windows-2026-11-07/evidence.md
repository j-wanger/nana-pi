# Windows leak guard fix

## Scope and cause

Feature: FEAT-041. Existing row R-3751 now states given and real-path spellings on Windows; no new IDs or tunables.

Inferred Windows cause: the scanner kept only the given home spelling and only the canonical temp spelling. Native realpath expands short names, so either path could miss a blob written with the other spelling. M7 writes USERPROFILE on Windows inside a canonicalized fixture root; the same mismatch can hide its home hit. No native Windows run was available.

The matcher now imports realPath from the named precedent and unions given and resolved spellings before expanding native, slash and msys forms. One combined regex counts each occurrence once. POSIX behavior stays unchanged. No precedent departure or listed known bug touched. Existing callers in bin/leak-scan.mjs and bin/pi-worker.mjs need no update: the result and error contracts are unchanged.

## Test changes and wrong-code pair

- Added only `M4: Windows given and real spellings each count once` (R-3751). Injects short/long spellings in both directions for home and temp, native/slash/msys forms, CRLF, trailing tab/space and no-final-newline text. Expects exactly one hit.
- Wrong code first: ran this test with the original given-only machine matcher. Exit 1; new M4 failed with zero hits versus one home hit. After the implementation, exit 0 and all ten checks pass.
- Existing test edits: shared FAIL diagnostics now include sanitized actual/expected values, operator, source location and child exit status. M7 includes counts, kinds, outcomes and exits from all runs and checks the home hit without dereferencing a possibly missing hit. Temp hits remain allowed because the fixture home is beneath the temp root. No assertions were inverted or tests deleted.
- Diagnostics omit assertion messages and child output. Machine paths and the injected identity word are redacted. The alias test includes normalized synthetic comparison context.

## Commands and exits before commit

All commands ran at the lane root. Fixtures stayed in OS temp directories. Full suite deferred to CI under AGENTS.md; no model sessions, pushes or CI reads.

| Command | Exit | Result |
| --- | --- | --- |
| `node scripts/code-map.mjs --impact packages/nana-pack/lib/leak-scan.mjs` | 0 | Read caller/callee radius before editing code |
| `node scripts/test.mjs leak-scan --verbose` (wrong-code baseline) | 1 | New alias M4 failed; temporary over-strict M7 assertion also failed on an allowed temp hit, then corrected |
| `node scripts/test.mjs leak-scan --verbose` (final) | 0 | 10 pass, 0 fail; includes end-to-end M7 |
| `node scripts/test.mjs real-path --verbose` | 0 | 2 pass, 0 fail |
| `node scripts/test.mjs requirements-trace --verbose` | 0 | 61 pass, 0 fail; full output in requirements-trace.log |
| `node scripts/code-map.mjs --write` | 0 | Updated only leak-scan metadata and its realPath edge |
| `node scripts/code-map.mjs --check` | 0 | 622 modules, 0 problems |
| `node scripts/readme-check.mjs` | 0 | 1095 claims, 0 problems |
| `node scripts/lane-class.mjs --root . --files packages/nana-pack/lib/leak-scan.mjs,packages/nana-pack/tests/leak-scan.test.mjs,REQUIREMENTS.md` | 0 | ordinary |

Final leak test output is in leak-scan.log. Generated map changes and this evidence accompany the scoped implementation. Native Windows verification remains for the seat's next CI run.
