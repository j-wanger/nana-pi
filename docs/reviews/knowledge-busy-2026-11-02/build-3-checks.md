# Build 3 — mechanical review closures

Feature: FEAT-013 · Install and connect harness runtimes

## Closures

1. Regenerated `docs/code-map.md`: 585 modules, zero problems. No config change needed.
2. Moved build 1's entry word for word to the top of `docs/sessions/2026-10.md`, followed by one line for builds 2 and 3. Deleted `docs/sessions/2026-11.md`; no named check requires it.
3. Corrected P5 to the recovery fail-fast title (R-3592) and P6 to the sources-problem probe title (R-3590). Every expected title now fails under its mutation.

## Files and rows

Changed the generated map, the two session paths, the mutation table and its Windows record. Added this record and `build-3-tests.txt`. No product code, test, requirement row or known-bug entry changed.

Existing rows exercised: R-3590 to R-3594 and R-2403. No new rows or sealed tunables. No new or edited tests, so no new-test wrong-code-first cycle applies. The existing eight pairs mutate code, never assertions.

## Commands and exits

| Command | Exit | Result |
| --- | --- | --- |
| `npm run map` | 0 | 585 modules; generated map only |
| `npm run map:check` | 0 | 0 problems |
| `npm run readme:check` | 0 | 1064 claims, 0 problems |
| `node scripts/requirements-trace.mjs` | 0 | 2426 rows, 2170 traced; 0 off form |
| `node scripts/requirements-tree.mjs --check` | 0 | 0 problems; 43 features |
| `node scripts/known-bugs.mjs --root .` | 0 | names=0 sizes=0 |
| `node scripts/identity-scan.mjs --root .` | 0 | findings=0 |
| moved entry piped to `nana-writing` | 0 | 19 sentences; over=0 passive=0 banned=0 |
| `npm test -- packages/nana-knowledge/tests/build-busy.test.mjs packages/nana-knowledge/tests/recover.test.mjs` | 0 | 17 pass, 0 fail, 1 skip |
| `SEAT_MUTATE_SHARDS=2 SEAT_MUTATE_OUT=docs/reviews/knowledge-busy-2026-11-02/seat-mutate-win32.txt node docs/reviews/knowledge-busy-2026-11-02/seat-mutate.mjs` | 0 | 8/8 red; every named title red |
| `node scripts/lane-class.mjs --root .` | 0 | hook |
| `git diff --check` | 0 | no whitespace errors |

The mutation runner still reports that npm could not give four configuration keys. Both baselines pass and all pairs run. The result is not a title-check failure.

## Precedent and scope

Followed the archive's newest-first layout and the mutation table's shared-runner pattern. The table now selects HEAD rather than a historical SHA so a final-tip rerun checks the final commit. No helper copied and no other precedent departure.

Read the complete FEAT-013 known-bug file. This mechanical build changes no known-bug behavior and closes no known-bug line. Build 1's load and install-check failures remain unchanged.

AGENTS.md delegates the full suite to CI. This brief explicitly forbids a push, so neither a local full suite nor a push runs here. No model session, issue operation, install check or platform review runs in this build.
