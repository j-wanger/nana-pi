Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 2: win-class

Confirmation round. Review only the change since round 1: `git diff c39e7bbe...HEAD` on feat/win-class (0d48fbe0 and e25caf7a).

Round 1 sent the lane back with one MUST (the pipe-holder readiness gate never engaged on Windows, because npm's arguments arrive packed into one cmd.exe string) and four SHOULDs (direct runs failing, R-640's alias checks testing nothing, machines without 8.3 names failing, rows that overstated the code), plus a NOTE that removing the recorded-process wait might bring back Windows EBUSY.

Build 2 (0d48fbe0) closes those: the readiness match accepts the packed form (the builder printed the probe), the elapsed bound widened, the descendant waits are back with start-time checks, temp paths resolve once in the shared temp helper, the adoption checks use explicit aliases, the 8.3 precondition fails only under CI, and R-4006 and R-916 are retired with R-4022 to R-4024 added.

Two Windows results arrived after build 2 started; build 3 (e25caf7a) addresses them:
- Lane CI run 42890023483: `hooks-win32-exec` could not add a worktree of the repository under the long temp spelling (inferred: the 260-character path limit). Build 3 adds `core.longpaths=true` to every test that checks out the real repository and prints git's stderr.
- A Windows probe running five files ten times each: the pipe-holder case failed 10 of 10 (round 1's MUST); `lane-checks`' crash-and-deadline case hit EBUSY on its lane folder 2 of 10; `build-records` 1 of 10. Build 3 waits for the hard-killed builder's exit in `build-records` and records descendants before querying identity in `lane-checks`.

The seat is rerunning the same Windows probe on this tip.

Questions:
- Is round 1's MUST closed on Windows, and do the restored waits signal only processes the case started?
- Does any change hide a real product defect behind a test-only accommodation (long paths, readiness, aliases)?
- Are the rows honest after builds 2 and 3, with no reused text?

Threat model: honest variation in scope is in; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
