# Build 9 — budget-bounded knowledge retries

VERDICT: PARTIAL

The brief's scoped checks pass. The additional local install check failed its unrelated pi post-edit write check; this build does not repair that surface.
Spend serves the current priority's knowledge-pull work and the shared-toolkit objective.

## Changes and rows

- `REQUIREMENTS.md`: changed existing R-3595 and R-3596 before tests and implementation. No new IDs. R-2402's contract remains unchanged.
- `packages/nana-knowledge/lib/hook.ts`: retries within the remaining pull budget, imports `QUERY_BUSY_TIMEOUT_MS` from the precedent database module, reserves its busy timeout plus 150 ms, and stops at 10 total attempts. Checks again after opening and after the retry pause. Records numeric `attempts` beside `retried` and `failure`.
- `packages/nana-knowledge/tests/build-busy.test.mjs`: adds exactly the two requested behavior checks and one new reserve seal. The success check exercises four BUSY failures then success separately for open and query. The persistent-query check spends each synchronous busy timeout and checks the reserve and elapsed bound. All cases use the existing awaited, bounded harness and OS temporary fixtures.
- Existing tests changed: M6's persistent-failure helper now expects the total attempt ceiling instead of two opens; its title now says persistent failures. Its seal pins 10 attempts instead of one retry. The 50 ms delay seal remains. M2 is byte-identical to the starting tip.
- `packages/nana-knowledge/tests/recover.test.mjs`: the existing R-2402 case no longer insists that the first pull fail. It also accepts a successful first pull with matching hits, because the longer retry window can observe the detached repair finishing. The existing healing and later-pull assertions remain.
- `packages/nana-knowledge/README.md`: updates the existing retry contract and structured log fields. Keeps its existing limit: synchronous filesystem stalls and scheduler suspension cannot be hard-bounded by an in-process timer. The new reserve prevents admitting a known SQLite busy wait at the end of the budget; it does not claim an absolute wall-clock guarantee under arbitrary stalls.
- `docs/code-map.md` and `docs/requirements-tree.md`: regenerated using their generators.
- `docs/reviews/knowledge-busy-2026-11-02/build-9-*`: command output and this record. Machine paths in saved check output use placeholders.

## Merge and precedent

Merged `origin/main` at `f6a475658217bed9cb58b9413dd21f35e8b11673` into the lane. The sole conflict was the generated code map, resolved by regeneration. Non-lane files match main; the preservation check reports zero unexpected differences. Existing lane review records, known-bug deltas and whole archive entries remain inherited. The archive changed only through the automatic merge; no archive or known-bug file was manually edited.

Followed all three precedent files. No helper was copied or moved. The fixed retry count becomes a total-attempt ceiling, as the brief requests. No unrequested precedent departure.

## Wrong-code pairs

- Before implementation: `NK_BUSY_ONLY=M7 node packages/nana-knowledge/tests/build-busy.test.mjs` exited 1 against the unchanged single-retry implementation. The new reserve seal also failed because the export did not exist. `NK_BUSY_ONLY='M6: seal' ...` exited 1 against the old count. Output: `build-9-red.txt`.
- Explicit code mutation: restored the old two-total-attempt ceiling in both loop conditions, leaving the new tunables, record fields and assertions intact. `NK_BUSY_ONLY='M7: repeated' node packages/nana-knowledge/tests/build-busy.test.mjs` exited 1: expected `ok`, got `db-open-failed`. Restored the budget-bounded loop; all three complete contention runs pass. Output: `build-9-single-retry-red.txt`, `build-9-busy-{1,2,3}.txt`.

## Commands and exit codes

- `git fetch origin`: 0.
- `git merge --no-commit origin/main`: 1, generated-map conflict; regenerated and staged that resolution.
- `npm run map:impact -- packages/nana-knowledge/lib/hook.ts`: 0, read before editing.
- M7 targeted green run: 0; M6 targeted green run: 0.
- `node packages/nana-knowledge/tests/build-busy.test.mjs`, three complete runs: 0 each, 14 checks each. Thirty M2 churn pulls returned hits and advanced the index.
- `node packages/nana-knowledge/tests/hook.test.mjs`: 0.
- `node packages/nana-knowledge/tests/incremental-build.test.mjs`: 0.
- `node packages/nana-knowledge/tests/recover.test.mjs`: initially 1 at R-2402; after the necessary existing-test edit, 0, 11 checks.
- `node packages/nana-pack/tests/test-runner.test.mjs`: 0, 53 checks.
- `npm run map`: 0; `npm run req:tree`: 0.
- `npm run map:check`: 0, 600 modules, zero problems.
- `npm run readme:check`: 0, 1086 claims, zero problems.
- `node scripts/requirements-trace.mjs --root .`: 0, 2483 rows, 2226 implemented rows traced, zero rows off form.
- `node scripts/requirements-tree.mjs --root .`: 0, zero problems.
- `node scripts/requirements-tree.mjs --check`: 0.
- `node scripts/known-bugs.mjs --root .`: 0, names=0; one informational size note.
- `git diff --check`: 0 before staging. Full staged whitespace check: 2, from verbatim test output and upstream review records. Lane-source staged check against main: 0. Preserved upstream bytes rather than editing other lanes' records. Output: `build-9-staged-whitespace.txt`.
- `node scripts/lane-class.mjs --root .`: 0, hook.
- Preservation assertions: 0; M2 unchanged and zero non-lane differences.
- `node packages/nana-setup/bin/install-check.mjs`: 1; 18 checks passed, pi post-edit failed with `write-error: write tool result is marked as an error`. The knowledge hook check passed. No install change was attempted. Output: `build-9-install-check.txt`.
- Identity scan after explicit staging: initially 1 for machine paths in saved output; replaced those paths with placeholders and reran before commit.

The final report records the commit, post-commit check exits and push outcome. The merge index contains upstream changes already staged by Git; lane additions are staged by explicit paths. Commit message lives under TMPDIR, not in this checkout.

## Known bugs touched and work not done

The retry-budget bug from review round 3 is addressed by reserving the synchronous busy timeout and finish allowance. The churn misses from rounds 1, 2 and CI round 6 motivate the longer retry window; local passing churn runs do not prove those platform flakes permanently closed. No other known bug is fixed. M2's torn-line parser and its diagnostics remain unchanged.

No locked or unlocked full suite ran: CI covers the suite. No CI run was read or awaited. No seat script ran, no issue operation occurred, and neither prohibited temporary directory was written. No independent reviewer was started. The unrelated install-check failure remains for the seat; this build must not be represented as an entirely green install rehearsal. An absolute wall-clock bound under synchronous filesystem stalls remains the documented pre-existing limitation.
