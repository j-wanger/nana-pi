I'm sending this back. The change does stop a missed attempt at once, and R-2693's assertion is no weaker. But removing the hold file reopens the exact race this lane set out to close. Separately, the CI log contradicts the cause the builder gave for the macOS kill.

## Answers to the brief

**1. Is a missed attempt stopped promptly, without weakening R-2693's assertion?** Yes. A miss now gets SIGTERM straight away (`packages/nana-pack/tests/worker-claude.test.mjs:602-603`), so it no longer waits 10 s for the ceiling.
- A miss still can't pass the check. The assertion at `:619` still needs, for all four cases, temp files present, the builder not yet started, the right exit code and an abort line naming that signal.
- A miss fails the first two of those, so a missed attempt can only fail R-2693. A passing result still means a delivered signal.

**2. Does removing the hold file reopen the race?** Yes. See the MUST below.

**3. Does it cause a harm the review standard lists?** The change touches only the test and docs. It writes nothing outside the temp folder and changes no product code.

## MUST

**Without the hold file, the small-lane case is back to main's race, and main has already failed on it.**
- **The race:** with `WC_HOLD_FILE` gone, the small fake `pi` writes its start marker and exits at once (`:141`). The test can see "no marker", send the signal, and then `pi` exits before pi-worker handles that signal.
  - pi-worker installs do-nothing signal handlers at startup (`pi-worker.mjs:173`).
  - The watchdog's real stop handlers are removed when its run ends (`pi-watchdog.mjs:303`).
  - If pi-worker handles `pi`'s exit first, its run returns success and removes the stop handlers. The waiting SIGTERM then reaches only the do-nothing handler, and pi-worker exits 0.
- **The realistic input:** a loaded hosted macOS runner. Main's run 41362285370 recorded exactly this case: `{"laneSize":"small","attempt":1,"hasTempFile":true,"startedBeforeSignal":false,"ended":{"code":0},"abort":false}`.
- **Why the tip is back to main's behaviour:** `WC_HOLD_FILE` now appears only in the two fake-`pi` definitions (`:138`, `:141`), and nothing sets it. Against main, R-2693's only remaining changes are a constant equal to the old default and the SIGTERM on a miss.
- **The consequence:** R-2693 fails on macOS CI again, and `nana-land` refuses. The session entry still says "the small fake builder is held until signalled", which is no longer true.
- **The hold was not needed to fix the slow misses.** SIGTERM on a miss is enough on its own: pi-worker's stop handler kills the held `pi`'s whole process group. The fix is to keep the new SIGTERM-on-miss and put `WC_HOLD_FILE: holdFile` back in `startupSignalCase`'s env.

## SHOULD

**The macOS kill's cause is misdiagnosed, and its likely real cause is still present.**
- **The log puts the kill before R-2693.** Run 41367446804 printed R-2803 through R-2691 ("11 pass, 1 skip") but never printed R-2692, whose check runs at `:590`, before any R-2693 case starts. I checked on this Mac that lines a Node process prints before a SIGKILL still reach the pipe, so R-2692's line was not lost in a buffer. The kill therefore happened in R-2692's cleanup cases, not in R-2693.
- **A hold-file wait could not cause this result.** `startWorker`'s timer SIGKILLs only the pi-worker child (`:216`). The runner's own timeout would report "timed out after", not "exit SIGKILL".
- **A likely cause is `stopFixtureBuilder` reading an empty pid file** (`:257-261`).
  - `Number("")` is 0, so the call becomes `process.kill(-0, "SIGKILL")`. That is kill(0), which hits the caller's own process group. I confirmed in an isolated process group that it SIGKILLs the caller.
  - R-2692's SIGTERM case (`:567-571`) signals as soon as `claude.pid` exists. The fake Claude creates that file before writing the pid into it, so on a loaded runner pi-worker can kill the fake Claude between those two steps and leave the file empty.
- **This is on main too, but this change adds one more trigger.** A larger-lane miss now sends SIGTERM at the moment `claude.pid` exists, which may also be mid-write.
- **The fix is a test-only guard:** in `stopFixtureBuilder`, return unless the pid is a safe positive integer.
- **The builder's ruling on suspect (a) is wrong.** `build-4-load.txt` says no group kill can reach the test process, but the pid-0 path does.
- **The load runs prove nothing.** Before the fix, ten runs under load passed with no failures, so the probe never reproduced the kill. Matching before and after counts show nothing about whether the change fixed it.

## NOTE

- The new sentence in the session entry, saying build 4's kill came from missed retries waiting on the hold file, is contradicted by the CI log. The earlier sentence about holding the small builder is now false too.
- The `WC_HOLD_FILE` branches in both fake-`pi` fixtures are now dead code, unless the hold goes back in as the MUST asks.

## What I ran

- I read `git diff cf2d4290 HEAD`, and the test file's whole diff against `origin/main`.
- I read pi-worker's startup signal listeners and pi-watchdog's stop handling.
- I read both CI logs, 41367446804 and 41362285370.
- I ran two small Node probes: one for `process.kill(-0)`, one for whether stdout reaches the pipe before a SIGKILL.
- I did not run the full test file. Neither failure is likely to show up in one local run.

VERDICT: SEND-BACK
