Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 2: diet1

Confirmation round. Review only the change since round 1: `git diff f647f44f...HEAD` on feat/diet1 (two commits, 26f76be8 and 3276565a).

Round 1 sent the lane back with one MUST and two SHOULDs:
- MUST: the cut removed main's T21 check and the FIFO case for `requirements-regroup`'s earlier-page removal (R-1171), so the guard on `rmSync` of the user's `--out` path was untested.
- SHOULD: about 100 rows marked `retired` still describe live behaviour; they should read `untested`.
- SHOULD: R-1014, R-1015, R-1511 and R-082 had their text replaced, reusing IDs.
- Notes: the lift HEAD comparison lost its failing case; the rulings line order; the OBJECTIVE wording; known-bug line placement.

Build 2 (26f76be8) restores T21 and the FIFO case, R-1164's mapping guard case, re-marks 94 rows `untested`, keeps six retired, restores the four rows' text and adds R-4008 to R-4011.

Lane CI at f647f44f (run 42841920622) then failed three files. Build 3 (3276565a) fixes them:
- `records-move` M5 (R-3933), all systems: the priority line had grown past the objective reader's 1,500-character line cap. The lane-start sentence is now "A build may start once the previous lane has LAND and green lane CI." (1,484 characters). The red-main rule stays in the rulings line.
- `requirements-lift` R-1164, Windows: the test compared an 8.3 short path; it now compares through `realpathSync.native`.
- `lane-checks` R-3997, Windows: "the fixture must actually start its pipe holder" failed in runs 42826448231 and 42841920622; the check's 1-second budget was shorter than a cold Node start under load. The budget is now a named 10-second constant with its reason.

Seat checks on 26f76be8: trace and tree check pass. The seat made two mutants of `removeEarlierPage` in a scratch tree (unconditional `rmSync`; no regular-file check); the restored regroup test fails on both. The builder reports trace, tree check, `check:lane` and the four touched tests passing alone at 3276565a.

Questions:
- Do the restored tests pin the guards round 1 named, and does anything in builds 2 and 3 weaken another kept test?
- Is each row's status now honest: `untested` where the code still does it, `retired` only where the behaviour left the product, no reused IDs?
- Is the lane-checks budget change a fix of the case's precondition, or does it hide a real relay delay? The run-6 research found that raised timeouts usually fix nothing; judge this case on its own failure line.
- Does the OBJECTIVE sentence say only what the owner decided on 2026-11-10?

Threat model: honest variation in scope is in; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
