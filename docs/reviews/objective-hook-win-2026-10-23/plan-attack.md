# objective-hook-win · plan attack (adversary, 2026-10-23, main dbb98cbb)

Read-only pass over `plan-draft.md`. Scratch work: `scratchpad/ohw-attack/` (copies of the planner's `main` and `proto` trees, two wrong variants `vonce` and `vbudget`, probes `r2671.mjs`, `r2672.mjs`, `latelive.mjs`, `over.mjs`, `late.mjs`, `hog.mjs`, and a copy of the planner's `scenarios.mjs` run against `trees/vonce`). Every claim is marked measured or inferred. No git fetch, no model calls, no writes outside the scratchpad; hooks ran with a temp HOME and stub producers.

## Summary

The cause analysis holds. I re-derived the rates from the planner's logs: the Windows install-check objective row failed 1 of 145 times, macOS 0 of 146. One log holds the `OBJECTIVE UNAVAILABLE: producer failed` line, and its 5 FAIL lines are all case T2c. Measured. The install check prints each hook row as it finishes (`install-check.mjs:454-492`, `report` inside each row's promise at `:490`), so the row times are real finish times. Measured from the code.

The pairs are sound. Each of pairs 1 to 9 turns its named test red by a fixed lower bound (a timer that cannot fire early, an injected runner, or a seal), not by a load margin. Inferred from the variant timings in `out-pairs.txt`; I re-ran the prototype cases and got the same shape.

One thing must change. A plausible wrong build passes every planned check while it drops both blocks for any hook that starts late, which main does not do (M-1). Six should-changes follow. The biggest are a fixture margin that load can eat (S-1), a kept row whose text the change makes false (S-2), and a 1,000 ms reserve that nobody has measured on Windows (S-4).

## Findings

### M-1 · A hook that counts its start twice passes every planned check

- The variant `vonce` computes `const deadline = HOOK_DEADLINE_MS - performance.now()` once at the top of each hook and passes that as the deadline. So the start delay is subtracted twice. It is the mistake a builder makes by mixing this plan's absolute deadline with the precedent's relative budget (`hook.ts:134-138`: `budgetMs` from `t0 = clock()` at call time).
- Measured, 3 runs each, the planner's `scenarios.mjs` against `trees/vonce`: U1 (R-2673) PASS, U2 (R-2674) PASS, S1 and S1b (R-2671) 3/3, S2 and S2b (R-2672) 3/3, R-2010 3/3, R-2011 3/3, R-2012 3/3, R-2613 3/3. The launcher is unchanged in that variant, so the seal also passes.
- Measured, `latelive.mjs`: with the hook started 2,500 ms late and live producers, `vonce` prints both markers in 0 of 3 runs (about 2,545 ms). The prototype prints both live lines 3 of 3 (about 2,610 ms). Main prints them 3 of 3 (about 2,612 ms).
- So the wrong build regresses something main does today: a late-started hook with healthy producers prints nothing but markers. In the observed stall the hook start was about 1.36 s; under `vonce` that leaves about 1.3 s for both producers instead of about 2.6 s. Inferred.
- R-2671's row already covers this case ("exits 0 with output before its producer cap and its hook's deadline"). Its test starts the hook on time, so the row is wider than its test, and the gap is exactly where this wrong build hides.
- Change: add one case to R-2671's check (or widen its title): each hook started `LATE_START_MS` late, both stubs live, stdout equal to both live lines. That case is green on main, so the check stays red on main through its slow-producer half. Add pair 10: "each hook computes `HOOK_DEADLINE_MS - performance.now()` once and passes it as the deadline → R-2671 red". Name in the brief that `deadlineMs` is a point on the process clock, not a budget.

### S-1 · R-2671's slow-producer margin sits on the side that load eats

- Red on main is fixed: the stub cannot print before its timer, so main kills it by at least `SLOW_PRODUCER_MS` − 1,500 every run. Green on the new code is 2,500 − `SLOW_PRODUCER_MS` minus the stub's start and exit, and load decides that part.
- Measured on Windows suite legs (exec-form hook lines in `hooks-win32-exec`, 138 legs): a one-process hook takes median 73 ms, p99 150 ms. One adoption hook run took 1,261 ms while the same leg's objective hook took 173 ms (job 120176909824, run 39880637633). So a single run can stall about 1 s with no whole-leg stall.
- Measured on this Mac under 60 CPU hogs: the 2,000 ms timer stub's hook ended at up to 2,375 ms (8 runs), against 2,110 to 2,131 ms idle.
- With 2,000 ms the green margin is about 500 ms minus the stub's start. A 1 s spike, or the plan's own 6× stall (about 450 ms per start, inferred from 73 ms × 6), fails the new check. That is the stall this lane says it tolerates.
- Change: set `SLOW_PRODUCER_MS` to 1,700. Measured: main 0 of 3 (marker at about 1,570 ms), prototype 3 of 3 (about 1,800 ms). Red margin stays fixed at 200 ms or more, and the green margin grows to about 800 ms. Optional: schedule the stub from its own clock (`setTimeout(print, SLOW_PRODUCER_MS - performance.now())`), so a slow stub start is absorbed; red on main is unchanged.

### S-2 · R-2010's kept text becomes false for a late start

- R-2010 says the adoption hook prints the marker "then the stale-copy checker's output" (`REQUIREMENTS.md:1080`). The plan keeps that text.
- With the new split, the first producer may take the whole 2,500 ms cap. The checker then gets 1,500 ms minus the hook's start. Under the plan's own threat model (a hook start of 1,358 ms), a hung adoption reader leaves the checker about 140 ms. A stalled Windows checker needs more than that, so its marker prints. Inferred.
- Main gives the checker its own 1,500 ms whatever the start, so main prints the line there. The plan discloses the trade as a known limit, but the row still claims the old behaviour, and its test runs only with an on-time start.
- Change: narrow R-2010's text to "while time is left before the hook's deadline", or retire it and add a narrowed row. Check R-2012 and R-2613 the same way; I found both still true.

### S-3 · The known limits misstate the stall trade

- The draft says "a stall above about 7 times still loses the frontier block". "Still" is wrong.
- By the plan's own model (start 219k ms, objective 250k, frontier about 100k), main keeps the frontier block until about 11×: 219k + 1,500 + 100k stays under 5,000 ms. Inferred.
- In the new design, once the objective is cut at the deadline (above about 8.5×), the frontier producer gets no time. So from 8.5× to 11× main prints the frontier block and the new design prints two markers. Inferred.
- The same holds for one hung first producer: main gives the second producer 1,500 ms, the new design 1,500 ms minus the start.
- Change: write the trade as it is. The new design wins the objective block from 6× to 8.5× and loses the frontier block from 8.5× to 11×. An optional design fix: keep a floor for the second producer (first limit = min(cap, time left − a sealed floor)). That is the seat's call; the objective block matters more.

### S-4 · The 1,000 ms reserve has no Windows number, and step 7's fallback does not test it

- The deadline counts from Node's clock. Two things fall outside it: process creation before that clock, and the kill, reap, writes and exit after the deadline. The reserve covers both. On this Mac they are small: the planner measured 16 to 44 ms after the deadline. I measured spawnSync ending 2 to 10 ms past its limit, and 4,017 to 4,028 ms for both-hung hooks under 60 CPU hogs.
- On Windows neither part is measured. In the observed stall, the objective row spent about 1,421 ms outside the producer's 1,500 ms (2,921 − 1,500). Part of that is before Node's clock. Measured total, inferred split.
- A `node` shim adds a process before Node's clock: Volta or scoop on Windows, asdf on macOS. Inferred; the threat model does not list it.
- The both-hung worst case now ends about 1 s later than on main (measured: 4,018 to 4,044 ms against 3,05x to 3,07x ms). When it passes Claude Code's 5 s, Claude Code drops the hook's whole output (`packages/nana-setup/README.md:34`). The session then gets neither the objective nor its unavailable line.
- Step 7 reads the Windows `note:` lines, and its fallback is the run-alone list. That moves a test; it does not change the product's reserve.
- Change: the R-2672 preload writes `performance.timeOrigin` to a file in the temp tree before it waits. The test then prints two numbers on its note line: the time before Node's clock (child origin minus the parent's spawn time) and the time after the deadline (elapsed minus both). In step 7, if either number on any Windows leg passes about 300 ms, lower `HOOK_DEADLINE_MS` (for example 3,500) instead of only moving the file. Add the shim and cold-start gap to the FEAT-013 known limit.

### S-5 · R-2672's row and the README sentence promise more than Node's clock can see

- The row says "IF a session-start hook takes `LATE_START_MS` to start". The preload delays only time after Node's clock starts. Slow process creation is neither tested nor visible to the deadline.
- The README draft says a hook's producers end 4,000 ms after the hook starts, under Claude Code's 5 s limit. That is true only from Node's clock, and "under 5 s" holds only while S-4's reserve holds.
- Change: word the row "...when its first producer would start `LATE_START_MS` after the hook's process clock starts". Word the README "by 4,000 ms on the hook's own clock, leaving 1,000 ms for process start and exit within Claude Code's 5 s limit".

### S-6 · Provenance lines overstate what was measured

- `HOOK_PRODUCER_TIMEOUT_MS`: "the objective producer then needed about 1.5 s". It was cut at 1.5 s, so 1.5 s is a lower bound. Write "at least 1.5 s (it was stopped there)".
- `HOOK_DEADLINE_MS`: "hooks ended 16 to 44 ms after the deadline on this Mac". Add "Windows not measured" beside it until S-4's note lines give a number.
- "The hook took about 1.36 s to start" uses the shared-memory hook's whole run (its start, its work and its exit). It is an upper bound on the start.

## Notes

- N-1. R-2673's test reads the clock at the deadline and 0.4 ms before it. It never reads a clock past the deadline, so a `limit === 0` skip passes. With the real spawnSync a negative limit throws and the marker prints, so the result is the same. Add one reading at `HOOK_DEADLINE_MS + 1`.
- N-2. The option names differ: the plan says `deadlineMs` and `clock`, the prototype uses `deadline` and `now`, and the precedent uses `budgetMs` with `clock` defaulting to `Date.now`. Name the departure: this deadline is a point on the process clock. A builder who copies `Date.now` as the default turns every limit negative; R-2671 catches that.
- N-3. Open question 1's cost is low. From the prototype timings, the file's cases sum to about 26 s on this Mac (2.6 + 4.0 + 2.6 + 4.2 + 2 × 2.1 + 2 × 4.0), not about 20 s.
- N-4. `docs/known-bugs/FEAT-015.md:41` still says the launcher stops each producer at 1.5 seconds. Add it to "Docs that change".
- N-5. No test file prints `note:` lines today. The nearest precedent prints elapsed ms in the check's own detail (`hooks-win32-exec.test.mjs:134`, `detail(r)`). Name it, or follow it.
- N-6. The two guard checks (`SLOW_PRODUCER_MS < HOOK_PRODUCER_TIMEOUT_MS`, `LATE_START_MS < HOOK_DEADLINE_MS`) should sit inside their must-meet check's condition, not print their own PASS lines. The standard allows no other new test.
- N-7. Checked, no finding: Windows entries are exec form with no shell (`settings.mjs:182-203`). Only the two hooks call the launcher, so no other caller loses protection. The skip path prints the marker once. Output stays far under the cap. Settings, install, doctor and the install check do not change. Windows' coarse timer can fire the kill up to about 16 ms late, which the reserve absorbs. `Atomics.wait` in an `--import` preload moves `performance.now()` as planned (measured: 2,527 to 2,534 ms for a 2,500 ms wait).
- N-8. The next miss still cannot be classed as a timeout or a crash: the install check prints no hook stdout and the marker is the same. That is an install-check change for a later lane.
- N-9. IDs R-2671 to R-2674 are free. install-check-builder holds R-2681 to R-2690, and shared-helpers holds R-2656 to R-2663. Measured from the branches.
