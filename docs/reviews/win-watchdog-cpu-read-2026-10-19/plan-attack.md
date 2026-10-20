# win-watchdog-cpu-read — plan attack (one adversary)

Verdict: AMEND

AMEND. The lane is worth building. On a Windows machine whose culture writes a decimal comma, today's `.CPU` read turns into 0. So pi-review and pi-worker kill every attempt after about six polls, and real reviews never finish. Four changes, each from a probe in a temp copy:

1. M1 now tests the product's own read, not an exported expression. The plan's M1 ran `winCpuExpression(pid)` in its own PowerShell. Probe: with the Windows read forced on and pwsh 7.6.7 behind a `powershell` wrapper that sets the thread culture to de-DE:
   - main stalled a busy pi: `cpu=0s` four times, STALL, exit 1;
   - the tick read went from 1.88 s to 8.10 s and passed;
   - wrong code that keeps a Ticks helper but reads `.CPU` in the product stalled. The plan's M1 stays green on that wrong code.
   The export `winCpuExpression` is no longer needed and is dropped. The busy pi now spins until it is released after 4 cpu lines, so a slow runner cannot mask a regression. Run 39348142806 showed one Windows PowerShell read taking most of 30 s.
2. New row R-1893 fixes a regression the plan only listed as a known limit. In the probe, a pi that exits 0 during an unreadable read, one poll short of the budget, became STALL and exit 1 under the plan's design. Today that run passes. pi-worker defaults to no retry, so it would lose a finished lane. Main also stalls when the read after exit repeats the last time; Linux keeps an exited child's time until the parent reaps it.
   - Fix: after each read, yield once with setImmediate, and end the attempt if pi has exited.
   - Probe: both cases gave exit 0 with 3 cpu lines.
   - On that copy, watchdog-exit passed 6/6, review-ledger 165/165 and immutable-review 18/18 (macOS).
   - macOS ps prints `0:00.00` for an exited child the watchdog has not reaped yet (probed), so macOS was never hit.
3. R-1892 now covers only a running pi, so it does not contradict R-1893.
4. P1 now includes a `[double]1.5` control. Its fallback branches match the new M1.

Kept as the plan has them:
- the tick read;
- the unreadable-counts-as-flat ruling (re-probed: main never stalls on a cycling reader; the rule stalls after 4 lines);
- the parser rows and the seal;
- the lane class;
- the immutable-review fold. Run 39348142806's Windows leg printed one cpu line in 30 s, so the 30 s fake and guard explain that failure.

Main moved to 27fb9d3c during planning. pi-seat-live-turn, win-hook-rows, mutation-runner-win-prune and install-pins have all landed, and none touched this lane's files. Nothing in flight touches them either. The claim most likely wrong: that Windows PowerShell 5.1 honours the in-process culture switch inside one -Command script block. It is proven only on pwsh 7, and P1 step 1 settles it. Next most likely: that one setImmediate yield sees a Windows exit. libuv 1.51 in Node 22 handles completed requests before the check phase, but this was probed on macOS only, and M4 on Windows CI settles it.
