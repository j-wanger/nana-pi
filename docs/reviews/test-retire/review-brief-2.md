Feature: FEAT-031 · Run checks reliably and without contaminating work
Card: fix

# Review brief 2: test-retire (confirmation round)

Round 1 (tip e83ba269, `docs/reviews/test-retire/review-1.md`) sent the lane back for one MUST: `requirements-trace.test.mjs` had moved from `land` to `main`.

Review only `git diff e83ba269 HEAD`: commit c8375390 returns the file to `land`, restores its M6 core-guard entry in `test-packs-core.test.mjs` and R-3855's wording, and records the review's SHOULD and NOTE findings in `docs/known-bugs/FEAT-031.md`.

Check: the MUST is resolved; R-3855 matches main's wording; the known-bug lines are one line each and accurate.

Threat model: honest timing and platform variation in our tools' output is in scope; deliberate forgery is out.
