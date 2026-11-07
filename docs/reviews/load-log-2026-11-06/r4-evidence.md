# Brief 4: deadline timing investigation

## Cause

The absolute 4500 ms assertion included launcher preparation, git checkout (review), fake executable startup, watchdog polling and cleanup. It did not isolate measurement time. The production timeout handler already kills without awaiting exit, destroys the pipe, unreferences the child and resolves immediately. No production change was needed.

A controlled slow-runner experiment temporarily added a 4000 ms blocking delay before the recording executable completed. This affected both baseline and stalled launches identically; measurement code was unchanged. The experiment was removed afterward.

| Launcher | Baseline ms | Stalled ms | Added ms | Old absolute bound ms |
|---|---:|---:|---:|---:|
| pi-worker | 4608 | 7353 | 2744 | 4500 |
| pi-review | 5125 | 7890 | 2764 | 4500 |

Both launches exceeded the old bound despite adding less than the sealed 3000 ms measurement deadline. The paired test passed and verified that both measurement children died. This reproduces the reported failure mechanism without relying on hosted runner speed; hosted CI was not accessed.

## Change

Only the existing R-3732 stalled-measurement test changed. It first runs the same launcher and fixture with a non-stalled package export, then replaces that export with the existing stall. It compares elapsed times using a monotonic clock. The 1500 ms scheduling margin is unchanged. Each subprocess has a 20000 ms safety limit, within the existing 90000 ms case limit. Both launches must complete, and the stalled result must still report timeout and kill the measurement pid.

Requirement R-3732 is unchanged: this repairs its timing evidence rather than changing the contract. No new rows, tests, tunables or production changes. Both named precedents were read; no helper was copied and no production pattern departed from. None of the supplied known bugs is touched. The seat's redacted logs were not changed.

## Mutation pairs and commands

All commands ran from the lane root.

- `CONTEXT_CASE='R-3732: stalled' node packages/nana-pack/tests/context-anatomy.test.mjs` with a temporary 6000 ms deferred finish: exit 1, timeout metadata assertion failed because close won the race. Mutation removed.
- Same command with a temporary 6000 ms blocking cleanup before the kill: exit 1, timing assertion failed (baseline 534 ms, stalled 9282 ms, added 8748 ms). Mutation removed. This proves the timing assertion rejects waiting past the deadline.
- `HOLD=1 CONTEXT_CASE='R-3732: stalled' node packages/nana-pack/tests/context-anatomy.test.mjs`: exit 1; the existing HOLD fixture intentionally emits no success output. Replaced this unsuitable experiment with the controlled completion delay above.
- Same filtered command with the controlled 4000 ms executable delay: exit 0; timings in the table above. Delay removed.
- `node packages/nana-pack/tests/context-anatomy.test.mjs`: exit 0, 21 checks passed. Sanitized output: `r4-tests.log`.

- `node scripts/code-map.mjs --check`: initially exit 1 for shifted test line numbers; regenerated with `node scripts/code-map.mjs` (exit 0), then check exit 0. Only generated launch line numbers changed.
- `node scripts/identity-scan.mjs --root .`: exit 0, 6951 files, 0 findings.
- `git diff --check`: exit 0.

The mutation/experiment edits did not survive in the diff. No stored credentials, model sessions, seat scripts, GitHub operations or CI reads were used.

## Limits

Native Windows and hosted CI were not available here. Per AGENTS.md, CI covers the full suite; the seat must push and verify it. No seat check was named in Brief 4. The final report records the committed tip and its repeated targeted run.
