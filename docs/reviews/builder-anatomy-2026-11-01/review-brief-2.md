Feature: FEAT-042 · Measure what a builder's context is for

Lane builder-anatomy. Class: ordinary. Confirmation round 2. Threat model as in round 1 (`review-brief.md`).

Review only the change since the round-1 revision: `git diff 6b02bbb7..HEAD` on `feat/builder-anatomy`. Two merges of main (outcome-meter and making-trigger landed) are in that range; read the merge commits only for whether they keep both sides, not the landed lanes' own code.

Round 1 sent the lane back for one MUST: `drawSample` ignored its seed after the minimum picks, so the sample came from a handful of builds. Build 2 (`build-brief-2.md`, `build-2-record.md`) made `seededSample` return seed order on request, used it in `drawSample`, strengthened the R-3276 test (two seeds differ beyond the minimum picks; a tier spans many builds), and took the SHOULD (an attempt field in `parts.json`). Builds 3 to 5 merged main. The seat drew a new sample on build 2's sampler, relabelled it with both labellers, rewrote `anatomy-counts.md`, the session entry and HANDOFF, and recorded six known bugs in `docs/known-bugs/FEAT-042.md`, including round 1's three assembly NOTEs.

The seat's record: locked full suite at f7d56500: 252 files, 250 pass, 2 skip. CI run 41307970688 passed on all three systems. On the corrected sample the labellers agree at κ 0.86; the rules agree with their consensus at 0.36, so rule shares stay unreported and a model labeller is the next lane.

Question: is the round-1 MUST closed, with a test that fails without the fix, and does the change since 6b02bbb7 cause a harm the review standard lists? Check especially that the catch-ledger callers of `seededSample` are unchanged, that `anatomy-counts.md` holds counts only and reports only the second draw, and that the merges kept every landed ID.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
