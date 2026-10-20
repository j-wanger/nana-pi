# Build brief 2 · mutation-runner-win-lock (urgent fix; a pi gpt-5.6-sol builder)

Same worktree and branch (tip 0ad43c1d, build 1). Class: ordinary (a seat tool). Rows: R-1960 to R-1969 only. Follow packages/nana-pack/prompts/builder-preamble.md. Single test files only; do not push; do not edit HANDOFF.md or docs/sessions/.

## Build 1 did not fix the Windows failure
The seat ran `mutation-runner.test.mjs` 12 times on hosted Windows at 0ad43c1d (scratch run 39364310814: 6 jobs × 2 runs). 10 of 12 failed R-1776's check (main: 11 of 12). The decoded failure records:

| acquired of 2400 | overlapText | workers SIGKILLed by the test | lockLeft | markerLeft |
|---|---|---|---|---|
| 1991 | 7:227 | 8 of 8 | true | true |
| 2244 | 3:289, 7:252, 7:253 | 5 of 8 | false | true |
| 2190 | 7:260 | 5 of 8 | true | true |
| 2218 | — | 6 of 8 | true | true |
| 2127 | 5:292, 6:245 | 8 of 8 | true | true |
| 2350 | — | 2 of 8 | true | false |
| 1927 | 2:260, 7:233 | 8 of 8 | true | true |
| 2156 | — | 6 of 8 | true | false |
| 1975 | 7:245 | 8 of 8 | true | true |
| 2159 | — | 7 of 8 | true | false |

No worker printed anything. Every failing run had workers SIGKILLed by the test's 30-second per-child timer (`setTimeout(... proc.kill("SIGKILL") ..., 30000)` in the contention block). Overlaps appear only in runs with kills, and almost all come from the highest-numbered workers, the last spawned and so the last killed.

## The seat's reading (inferred; prove or refute it)
The lock is not what fails. On a hosted Windows runner 8 × 300 acquisitions take about 30 to 35 seconds, so the test's own timer kills workers, some while they hold the lock with the marker written. A surviving worker then correctly removes the dead pid's lock, enters, finds the marker, and records an "overlap". lockLeft and markerLeft follow from the kills. The same reading fits main's three records in build brief 1. If you find a record that this reading cannot explain, say so and fix that instead.

## Change
1. **The test's budget, not its strength.** Keep R-1776 as written: 8 children, 2,400 acquisitions, zero overlap, complete ownership, the observer. Change how it ends:
   - Give the contention block a budget that fits a hosted Windows runner with margin. Define it once as a named constant in the test, with its provenance beside it: "measured: 12 hosted Windows runs at 0ad43c1d reached 1,927 to 2,350 of 2,400 acquisitions in 30 s (run 39364310814)". About 120 s is the seat's suggestion; choose and say why.
   - When the budget ends, stop the workers cooperatively first: write a stop file that each worker checks between acquisitions (never inside the critical section), then SIGKILL only the workers still running after a short grace period.
   - Put `timedOut` (and which workers were killed) in the failure record. A run that timed out fails as a timeout. Its overlap list is shown but marked as recorded after a kill, so a timeout is never read as a lock failure.
2. **Build 1's release loop.** Build 1 made release retry transient errors with no limit. The 12 records show no live owner abandoning its lock; every lockLeft run had killed workers. A loop with no limit can hang a seat forever on a lock file that stays undeletable. Keep release from giving up at the acquisition limit, but give it its own limit, a sealed tunable defined beside the other lock values with its provenance (the word `chosen` and why), long enough that Windows' delete-pending state clears (minutes, not seconds). When it ends, report one named line and throw. R-1960 then pins that release outlives the acquisition limit and stops at its own limit, both through the injection hooks. Re-check R-1778's wording against what the code now does.

## Done
`node packages/nana-pack/tests/mutation-runner.test.mjs` green three runs in a row on macOS. Each changed or new check red on wrong code (for example the old 30 s kill with no stop file; release with no limit; release cut at the acquisition limit). Then run trace, `npm run map:check`, `npm run readme:check` and `node scripts/requirements-tree.mjs --check`, all green. The seat then runs the file 12 times on hosted Windows. The lane lands only if all 12 pass.

## Report (≤ 10 lines)
VERDICT; commit; whether the records fit the seat's reading and why; the budget you chose and why; the release limit; new or changed checks with red evidence; what only Windows can prove.
