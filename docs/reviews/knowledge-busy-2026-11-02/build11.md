# Build 11 — retry only SQLite contention

Feature: FEAT-013 · Install and connect harness runtimes
Branch: feat/knowledge-busy

## Change

- `REQUIREMENTS.md`: narrow existing R-3595 to structured primary SQLite errcode 5 or 6; add M8 evidence. No new IDs or tunables.
- `packages/nana-knowledge/lib/hook.ts`: return immediately on other open/query failures, after closing any query handle. Preserve budget guards, attempt ceiling, sanitized causes and numeric attempt records.
- `packages/nana-knowledge/tests/build-busy.test.mjs`: add one tagged M8 check covering non-busy open/query errors, including busy-looking text without a numeric errcode.
- Existing M6 fixture edits: add structured errcodes 5/6 to injected busy/locked errors and expected recorded causes. Those fixtures formerly supplied string codes alone, which no longer qualify for retry. No assertions in R-2402 changed. N-times-busy M7 remains unchanged.
- `docs/code-map.md`: regenerate its launch binding for the new test child.

## Cause comparison

`build11-comparison.log` records complete recovery runs in OS temporary package copies. Each copy used the lane's build and recovery test; only the hook differed. Main's hook came from local main 99fd0d18dc68bc7282e56275efe1ea972e210070. Instrumentation counted opens and reported the first pull's duration/reason and the detached build's spawn event. It did not alter assertions.

| Hook | First pull | Attempts | Heal process starts | R-2402 |
| --- | --- | --- | --- | --- |
| Build 9 retry-everything, as inherited at build 11 | 110 ms, ok | 3 | yes | PASS |
| Main | 2 ms, query-failed | 1 | yes | PASS |

Both complete recovery runs exited 0. The comparison confirms retries on a damaged index and changed pull behavior, but does not reproduce the CI failure or prove delayed/blocked healing. Here repair finished during build 9's retries. The loop closes each query handle before pausing; the claim that a single read handle remains held across retries is not supported by the code. Repeated damaged-index access remains the observed difference, not a proven CI root cause.

## Wrong-code pair

Command: `NK_BUSY_ONLY=M8 node packages/nana-knowledge/tests/build-busy.test.mjs`.

- Inherited retry-everything implementation: exit 1; M8 fails with actual opens 10 versus expected 1.
- Fixed implementation: exit 0; M8 passes.
- Full output: `build11-mutation.log`. Code changed between runs, not assertions.

## Validation

Full output: `build11-tests.log`.

- Every `packages/nana-knowledge/tests/*.test.mjs`: 11 files, each exit 0.
- `recover.test.mjs` ran twice more: three green runs total, each exit 0.
- `node packages/nana-pack/tests/test-runner.test.mjs`: exit 0.
- `npm run map:check`: first exit 1 for the new launch binding; `npm run map` then exit 0; final map check exit 0.
- `node scripts/requirements-trace.mjs --root .`: exit 0; 2236 implemented rows traced, zero EARS problems.
- `node scripts/known-bugs.mjs --root .`: exit 0; names=0 sizes=1 (existing file-size notice).
- `node scripts/identity-scan.mjs --root .` after explicit-path staging: exit 0; findings=0. Final-tip checks repeat the gates after commit.
- `node scripts/lane-class.mjs --root . --files packages/nana-knowledge/lib/hook.ts,packages/nana-knowledge/tests/build-busy.test.mjs,REQUIREMENTS.md`: exit 0, hook.

## Precedent and scope

Read all three named precedent files completely before design. Followed the hook's existing loop, structured sanitized causes and finally-close pattern. Followed the busy test's awaited, deadline-bound temporary fixtures and injected child checks. No helper was copied or moved. No precedent departure.

The generated map and committed validation records are supporting changes beyond the two implementation files and requirement row; the map check and brief require them. No other behavior changed. No line-by-line reader was introduced.

Known-bug context touched: knowledge churn (rounds 1, 2 and CI round 6), hook retry budget (round 3), and build checkpoint waits (round 1) intersect this retry/recovery path. Their existing checks and waits remain unchanged. No closure or CI root-cause proof is claimed for those entries. No known-bug file was edited.

Not done: locked full suite (CI covers it), Windows/Linux execution, CI inspection, push, or land. The seat still owns final review and install-check-before-land.
