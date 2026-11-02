# Build 5 technical record

Feature: FEAT-013 · Install and connect harness runtimes

## Contract and code

- R-3595 adds one open-and-query retry after a failed open or search. R-3596 seals the delay at 50 ms and count at 1. QUERY_BUSY_TIMEOUT_MS remains 100.
- `packages/nana-knowledge/lib/hook.ts`: `runHook` takes optional `openDbFn` and `searchFn` alongside `spawnFn`. Each attempt closes its returned handle in `finally`. Failure records use `retried` for the first cause and `failure` for the second. Budget checks before and after the delay prevent a retry after budget exhaustion. Recovery and build code remain unchanged.
- Error details carry only bounded structured codes and integer SQLite error numbers; unstructured exceptions use `unknown-error`. Raw messages cannot leak a path or prompt into these fields.
- `packages/nana-knowledge/tests/build-busy.test.mjs`: three R-3595 checks cover first-open recovery, first-query recovery, repeated failures at both stages, handle closure and exhausted budget. One R-3596 check pins both constants.
- The existing M2 title, pass condition and assertion operands remain unchanged. Its assertion messages now list every missed run's elapsed hook time, log reason, retry field and rebuild state. No R-3592 check changed. No other existing test changed.
- `packages/nana-knowledge/README.md` describes the retry. `REQUIREMENTS.md` carries the two new rows. Generated map and tree reflect the change.
- The requested known-bug line records the unproven churn cause; the earlier round-one churn line remains. The hook retry and M2 detail respond to that bug, not a proven root cause. No other known bug was fixed. The session entry gains one build-five line.

## Evidence

- `build-5-red.txt`: M6 on the pre-change hook, exit 1; all four checks fail. No assertion was inverted.
- Additional code mutations: delay 50 to 0 makes the seal red, exit 1; retry count 1 to 0 makes all four M6 checks red, exit 1. Constants restored afterwards.
- `build-5-green.txt`: M6 exit 0; touched test command exit 0, repeated after restoring mutations. Four files pass, 150 checks pass, one skips.
- `build-5-churn.txt`: ten consecutive full build-busy runs, exits 0 each; M2 succeeds in all 100 constituent churn pulls and rebuilds.
- `SEAT_MUTATE_SHARDS=2 SEAT_MUTATE_OUT=docs/reviews/knowledge-busy-2026-11-02/seat-mutate-win32.txt node docs/reviews/knowledge-busy-2026-11-02/seat-mutate.mjs` exits 0. P1–P8 are red; all named titles match; none survives. The saved record reports 8/8 red across two shards. The three pairs with extra failures still fail their named checks. The runner reports unavailable npm configuration, but both baselines pass.
- Touched command: `node scripts/test.mjs packages/nana-knowledge/tests/build-busy.test.mjs packages/nana-knowledge/tests/hook.test.mjs packages/nana-knowledge/tests/recover.test.mjs packages/nana-setup/tests/hooks-win32-exec.test.mjs`.
- `build-5-gates.txt`: `npm run map`, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-tree.mjs --write`, `node scripts/requirements-tree.mjs --check`, `node scripts/known-bugs.mjs --root .`, `node scripts/identity-scan.mjs --root .`, and the lane-class command exit 0. Final `node scripts/requirements-trace.mjs` exits 0. Initial trace exit 1 prompted the row wording correction below.
- `nana-writing` on added documentation lines exits 0 with no findings after rewording the known-bug cause sentence. Earlier diagnostic output remains in the gate record.
- Full suite deferred to CI under AGENTS.md. No CI run will be read. The macOS pre-land install check belongs to the seat, not this Windows build.

## Precedent and departures

The implementation follows `runHook`, `finish`/`appendLog`, the `spawnFn` injection pattern and `over()`. Tests follow the awaited, deadline-bounded build-busy child harness and hook log assertions. Existing seat pairs remain unchanged.

- The requested R-3595 sentence contained two occurrences of “shall”; the trace checker rejected it. The final row uses one “shall” governing both retry and log clauses, without changing meaning.
- The brief's open/query seams use two optional functions, rather than a single combined seam, to retain the imported functions' types and distinguish failures by stage.
- The brief's example allows a message head. This build logs structured codes only, with a safe fallback, because an arbitrary message can contain private text.
- The brief specifically authorizes one known-bug line and one archive line; those narrow edits follow that instruction despite the generic lane prohibition on those files.
- Map impact printed the graph but returned 1 because runtime measurement data was absent. Map generation and map checks pass.

## Not done

No timeout sweep result is treated as a reproduced cause. No recovery/build change, credential access, GitHub API call, model session or subagent was used. No local full suite or macOS install check ran.
