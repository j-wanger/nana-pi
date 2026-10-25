# Review — land-records confirmation round 2, 2026-10-24 (the land reviewer)

Feature: FEAT-008 · Integrate and clean up reviewed changes

Class: land tool. Threat model: as in round 1 (`review-brief.md`): honest variation in our tools' output in scope, deliberate forgery out.

This is a confirmation round. Review only `git diff 1e77de81..HEAD` on `feat/land-records`: the change since round 1, which you accepted at 1e77de81 (`VERDICT: LAND`), as did the final reviewer.

Why it exists: the draft pull request's Windows suite leg failed R-2813 at 1e77de81 (run 40148405918). On Windows, a land whose `<common>/nana` is a file printed `...land-records.jsonl: ENOENT: ENOENT: no such file or directory...`; the test accepted only `ENOTDIR` or `EEXIST`. Every earlier assertion in that check passed on Windows (exit code 0, the merge, byte-for-byte earlier output, one record line); the check stopped there, so its later cases never ran on Windows.

The change: build brief 4 (eb2d7427, ead9b939); build 4, 1661558e, changes only the two error assertions in the R-2813 check to accept any Node error code after the ledger path (`land-records\.jsonl: E[A-Z]+: `), for the `blocked` and `swapped` cases; no product file, other test or row changed. Its locked full suite: 220 PASS, 0 FAIL, 2 SKIP. The builder dropped the error text from the `not kept:` lines by hand and saw R-2813 turn red under the new pattern. The seat re-judged pairs 14 and 15 (R-2813's) at 1661558e: both red (`seat-mutate-1661558e-pairs14-15.txt`). The seat's notes commit adds build 4 to the session entry and the round 1 reviews' notes, R-2671's and R-2546's Windows CI failures at 1e77de81 as FEAT-008, FEAT-013 and FEAT-031 lines. The pull request's Windows suite leg at 1661558e: see the seat's record below.

The seat's record: every CI leg passed first try at 1661558e (run 40150847184), the Windows suite leg included, with R-2813 green.

Ask: does the widened pattern still make R-2813 fail when the line names no error, and does the change since 1e77de81 alter anything other than those two assertions and the notes?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
