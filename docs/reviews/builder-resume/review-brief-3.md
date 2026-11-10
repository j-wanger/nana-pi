Feature: FEAT-006 · Launch builders with execution limits

# Review brief 3: builder-resume (confirmation round)

Review only `git diff c534329c..46e99c73` on feat/builder-resume. Round 2 sent the lane back on one finding: R-4006 failed on Windows CI (run 42788701571) with `EBUSY ... rmdir '...\lane'`, possibly masking an earlier assertion.

Build 4, a class fix for the Windows stop path:
- `bounded-spawn.mjs`: on a stop, the async entry waits for the relay's exit within the relay's existing signal grace plus backstop, and its backstop sends SIGTERM before forced termination.
- `lane-checks.mjs`: a relay that outlives the bound is reported in the diagnostics and the end record.
- `lane-checks.test.mjs`: the fixture keeps the action's own error when cleanup also fails; R-4006 asserts every visible member of the check tree is gone (check, child, and on Windows the npm `node`, `cmd.exe` and relay parents) before cleanup, and covers a delayed and an over-bound relay exit.

Seat re-ran on 46e99c73: the macOS install check passes; `lane-checks` passes 12 cases; the trace passes. Windows evidence comes from this tip's CI leg, which runs alongside this review.

Questions:
- Is review 2's MUST closed by this change, on Windows as well as POSIX, or does the change only move the failure?
- Does waiting for the relay's exit add a way for pi-worker to hang past its bounds on a stop?
- Does the new fixture error handling ever hide a failure?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
