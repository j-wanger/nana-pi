# Setup retirement — build 7

## Changes

- `REQUIREMENTS.md`: narrow R-3802 to the predicate's blocked/allowed behavior and the gate's import.
- `packages/nana-pack/tests/setup-retire.test.mjs`: edit only M4; remove runner source assertions and the 13-file discovery list, keep direct predicate assertions, and check the import edge using public code-map functions.
- `docs/code-map.md`: regenerate changed caller/callee links.
- This is a fix card with no Precedent section. No precedent departures, new requirement IDs, test declarations, sealed tunables, or production changes.
- No listed FEAT-013 known bug is touched; the complete known-bug file was read.

## Mutation pairs

Assertions stayed unchanged; both temporary code mutations were restored.

| Code mutation | Command | Wrong exit | Restored exit | Evidence |
| --- | --- | --- | --- | --- |
| Make `verifierPipeReason` return null | `node scripts/test.mjs setup-retire.test` | 1; M4 fails | 0 in combined run | `mutation-wrong.log`, `green.log` |
| Replace gate's predicate import with a local null-returning stub | `node scripts/test.mjs setup-retire.test` | 1; M4 import-edge assertion fails; M7 also detects stale map | 0 in combined run | `import-wrong.log`, `green.log` |

## Validation before commit

All evidence paths below are relative to this directory.

| Command | Exit | Evidence |
| --- | --- | --- |
| `npm run map:impact -- packages/nana-pack/tests/setup-retire.test.mjs` | 0 | inspected before edit; temporary output |
| `npm run map:impact -- packages/nana-pack/lib/pipe-guard.mjs packages/nana-pack/extensions/nana-gate.ts` | 0 | inspected before mutations; temporary output |
| `npm run map` | 0 | regenerated map |
| `node scripts/test.mjs setup-retire.test pipe-guard gate` | 0 | `green.log`: 14 files passed; 858 checks passed, 0 failed, 5 skipped |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run req:tree` | 0 | `tree.log`: 0 problems; 2658 rows; 43 features |
| `npm run readme:check` | 0 | `readme.log` |

The full suite is deferred to CI under AGENTS.md. No push, CI read, model launch, or GitHub operation ran. No install check ran: this revision changes no setup implementation or hook. Windows execution remains with CI.
