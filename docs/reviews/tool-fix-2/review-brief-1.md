Feature: FEAT-008 · Integrate and clean up reviewed changes

# Review brief 1: tool-fix-2

Review `git diff main...HEAD` on feat/tool-fix-2 (one commit, ace0be9c; 9 files, +115 / -44).

The card closes the SHOULDs and NOTEs of two LAND reviews (tool-fix round 1 on ed9cf885, lane-checks-win round 1 on 8ea0c140), under the owner's 2026-11-09 decisions (one rerun per red main leg; flakes recorded per file and fixed in source) and the privacy safety line on profile diagnostics (R-4002):
1. Profile git detail on Windows: the home folder is redacted without regard to case, against its native long path and 8.3 short names, and in the Git Bash `/c/...` form; query values whose key names a token, key, secret or password are removed; an empty home no longer scrambles the line. The one privacy test now covers each spelling.
2. A restarted main wait on a run at attempt 2 or later reads the attempt-1 failed jobs and records their flakes (R-3995).
3. `effort` is refused on every roster slot except the reviewer (R-4001).
4. R-4000 (an UNKNOWN mergeability read keeps the capacity rerun) gets its test.
5. The lane-check test teardown compares a process's start time before signalling it (reusing `lib/lane-watcher.mjs`'s start-time check, now exported) and polls on a timer; the pack README no longer says the stop test is skipped on Windows.
New row R-4007 (marked untested).

Seat re-ran on ace0be9c: `profile-store-guards`, `lane-checks`, `lane-watcher` and `ci-wait` pass alone; the privacy test diff includes the lowercase, 8.3, `/c/` and `access_token` cases and the empty-home case.

Questions:
- Can the profile detail still print a home path or a secret in a spelling the test does not cover, on Windows or POSIX?
- Can the restart recovery record a flake for a run the wait did not rerun, or record one twice?
- Does exporting the lane-watcher start-time helper change the watcher's own behaviour?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
