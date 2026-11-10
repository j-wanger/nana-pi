Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 3: win-class

Confirmation round. Review only the change since round 2: `git diff 7d05b0c6...HEAD` on feat/win-class (3ba3173e).

Round 2 confirmed round 1's MUST closed on Windows and sent the lane back for one MUST and two smaller points:
- MUST: `windows-skip-lines.test.mjs` failed on every platform because build 2 removed the Windows guards it registered for `adoption-producer` and `adoption-reader`. Build 4 retires R-1953 and R-1955 and drops their targets and checks.
- SHOULD: the lane-checks preload ran a PowerShell start-time query in every Node process (85 s to 228 s on Windows). Build 4's preload records only pid and role; the test process reads start times in one batch, before any signal.
- NOTE: a failed symlink no longer has its error replaced by the cleanup's unlink.

Builder's validation: the four touched files pass alone; trace, tree check and `check:lane` pass. The seat runs this tip's Windows CI leg, which reports the lane-checks wall time.

Questions:
- Is the MUST closed without dropping a guard that still exists?
- Does the batched start-time read keep the identity check before every signal, on Windows and POSIX?

Threat model: honest variation in scope is in; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
