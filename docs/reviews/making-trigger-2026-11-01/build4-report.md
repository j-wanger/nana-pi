VERDICT: DONE

# Making trigger — build 4 technical record

## Commits

- `55b9a499`: fix M1, S1 and S2; retain requirements-first changes, tagged tests, red/green evidence and the expanded mutation table.
- The following evidence-only commit retains the locked full suite, mutation result, install rehearsal and this report. Its hash and finished CI result belong in the final worker response.
- The code commit followed a green focused run: 12 files, 210 checks, exit 0. Its amendment redacted local home prefixes before any push and followed the green full suite.
- The evidence commit follows the green locked full suite. No code changed after the successful focused run.

## Closures

### M1 — torn project JSON no longer blocks saving or loops spend

Files: `packages/nana-pack/lib/profile-store.mjs`, `lib/memory-store.mjs`, `lib/memory-run.mjs`, `lib/memory-run-config.mjs`, `bin/nana-memory.mjs`, and `tests/memory-run-recovery.test.mjs`.

Rows: R-3291 now states damage recovery and merge-error classification. R-3294 now states atomic, never-overwritten publication. R-3341 keeps the existing fixed-vocabulary contract. No new requirement ID was allocated.

- `exclusiveJson` delegates to the new public `exclusiveJsonAt`: write and fsync a same-directory temporary file, link it exclusively to the final name, then remove the temporary name. Repository metadata uses the same helper.
- An interrupted write can leave only an ignored `.tmp` file, never partial bytes at a final JSON name. An existing final name still raises EEXIST.
- Project readers import `readProfileJson`, skip only JSON syntax errors, and count damage across project records, events, seen files, evidence copies and run files. I/O errors remain errors. Root profile reads remain strict.
- Status ends with the fixed word `unparseable` and its count. The tests each plant exactly one damaged file and assert `unparseable 1`.
- A real merge-phase error reports `memory: merge failed`. Only clone-lock refusal maps to busy; repository collisions retain their fixed outcome.
- The torn-record test also interrupts a synthetic writer after partial bytes, checks never-overwrite, and injects a merge Git failure without exposing its private error text.

Red command: `node packages/nana-pack/tests/memory-run-recovery.test.mjs`, exit 1 on build-3 implementation, before code changes. Torn records failed at seat save with `profile refused: git failed`; empty seen files failed the later run. Green: the same command, exit 0. Each recovery case saves, completes a later unit, retries without resending either done unit, and checks the damage count.

Mutation pairs: `torn-file` makes parsing strict again, turning both damage cases red; `merge-outcome` relabels merge failure as busy; `never-overwrite` replaces exclusive publication with overwrite-capable copying. Each pair turns its named case red.

### S1 — reserve the entire model timeout

Files: `packages/nana-pack/lib/memory-run.mjs`, `tests/memory-run-recovery.test.mjs`; row R-3303.

`beforeCall` now requires elapsed time plus imported `TIMEOUT_MS` to fit within `MAX_RUN_MS`. The injected-clock test checks one millisecond below, exactly at, and one millisecond above the admission boundary. The old implementation sent at the forbidden boundary; the fixed code sends only within it.

Red and green: recovery command above, exits 1 then 0. Mutation pair `timeout-headroom` restores the old comparison and turns R-3303 red. No new tunable.

### S2 — brief local merge-lock wait

Files: `packages/nana-pack/lib/memory-run-config.mjs`, `lib/memory-run.mjs`, `tests/memory-run-recovery.test.mjs`, `tests/memory-run-seals.test.mjs`; row R-3294.

The second local-only clone-lock attempt waits at most `MERGE_LOCK_WAIT_MS=1000`. Provenance beside the definition records the chosen date and reason. The first, pre-spend attempt still fails fast. Fetch, model calls and push remain outside clone ownership.

The new behavioral case holds the lock during a synthetic model call. A worker thread releases it after 100 milliseconds, so the synchronous lock waiter cannot prevent release. The run completes and a later run sends nothing again. A separate new seal test pins 1000 exactly.

Red commands: recovery command above and `node packages/nana-pack/tests/memory-run-seals.test.mjs`, both exit 1. Green: the same commands, both exit 0. Mutation pair `merge-wait` restores zero wait and turns the behavioral case red.

## Existing tests edited

Only the R-3341 fixed-word assertion in `packages/nana-pack/tests/memory-run-seals.test.mjs` changed because the vocabulary gained `mergeFailed` and `unparseable`. The same file gained the required new wait seal. No existing assertion was weakened, no existing case was deleted, and no other existing test changed.

The new recovery module has four awaited cases under the precedent's per-case limit. Fixtures use OS temporary directories, synthetic transcripts, local bare remotes and injected model replies. No suite test imports, runs or copies the seat mutation script. This change adds no line-oriented reader; the existing CRLF, trailing whitespace and no-final-newline coverage stays green.

## Mutation runner

Command: `SEAT_MUTATE_OUT=docs/reviews/making-trigger-2026-11-01/build4-mutation-result.txt node docs/reviews/making-trigger-2026-11-01/seat-mutate.mjs`, exit 0, on `55b9a499`.

The five existing pairs remain: `8-isolation`, `8-placement`, `2-split`, `3-unknown`, `4-start`. The five new pairs are listed above. Every shard passed both baselines before breaking code. Assertions were never inverted.

`RESULT: 10/10 red (10 exactly their named titles, 0 with a named title green, 0 with an unnamed red), 0 survived, across 5 shards`

## Verification

Long output is retained beside this report in `build4-*.txt` and `build4-tree-movement.md`.

- `npm test -- memory-run profile-store profile-sync memory-making memory-shaping outcome-meter land`: exit 0; 12 files, 210 checks. An initial tool deadline interrupted the first attempt; the complete rerun used a sufficient outer limit.
- `npm run test:locked`, foreground with one machine lock: exit 0. Two earlier runs failed only the identity scan because retained output contained local home prefixes. The final run passed after redaction; both failed logs remain as evidence.
- `npm run map`, `npm run map:check`: exits 0; 552 modules.
- `npm run readme:check`: exit 0; 999 claims, zero problems. The pack README declares atomic publication, damaged-file counts, merge outcomes, timeout headroom and the short wait.
- `node --experimental-strip-types scripts/requirements-trace.mjs`: exit 0; 2341 rows, 2087 implemented and traced, zero EARS problems.
- `npm run req:tree`, `node scripts/requirements-tree.mjs --root .`: exits 0; zero problems, 42 features; 21 of 21 deliverables made and read by code, 21 more parked. The generated tree is unchanged.
- `node scripts/known-bugs.mjs --root .`: exit 0; names=0, sizes=0.
- `npm test -- requirements-deliverables`: exit 0; 21 checks.
- `node scripts/requirements-moved.mjs --root . --base origin/main`: exit 0; FEAT-040, 23 lane rows and A-093 only. Build 4 changes existing R-3291, R-3294 and R-3303, not the tree placement.
- `node scripts/lane-class.mjs --root . --base origin/main`: exit 0; gate, inherited land-tool change.
- `node scripts/identity-scan.mjs --root .`: exit 0 after redaction, zero findings. Required seat checks repeat on the final commit before reporting.
- `node packages/nana-setup/bin/install-check.mjs`: exit 1, only `FAIL pi post-edit — write-error: write tool result is marked as an error`. Every other rehearsal check passed. This is the brief's known builder-environment exception. Local home prefixes in retained output are redacted.

Suite summary: `251 files: 249 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8895 pass, 0 fail, 44 skip · 670.7s`.

## Precedent and known-bug scope

All four named precedent files were read before design. Existing callers continue importing profile-store publication and reading helpers. `memory-store` remains the shared merge path for making and seat saves; `memory-run` keeps the existing reservation and lock lifecycle; `profile-sync` supplies the unchanged clone-lock and Git helpers.

Required departures from prior behavior: direct exclusive writes become atomic publication; only project reads gain syntax-error tolerance and counting; merge failures gain their own word; model admission reserves full timeout; only the second clone-lock attempt gains a short wait. Each departure addresses M1, S1 or S2. The new public `exclusiveJsonAt` factors the new publication operation for repository metadata; no private helper was moved or copied. The private mutable-ledger `atomicJson` remains unchanged because its replacement semantics cannot satisfy never-overwrite.

No listed known-bug entry is fixed. Exact normalized-repeat matching, detached-child survival, account rate limits and fork-shared identity remain unchanged. The profile save's long wait and inherited poll interval remain unchanged; S2 changes only the maker's second acquisition budget. No known-bug file was edited.

## Not done

No session-end hook, setup wiring, doctor change, real profile read, real transcript read, model classification call, independent reviewer session or land. No forbidden directory, HANDOFF or session archive changed. No GitHub issue was created, edited, commented on or closed. No open design question remains.

The branch push and the finished CI run for the final tip, including Windows, are reported in the final worker response. The known local install-check exception remains.
