Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane land-test-split. Class: ordinary. Threat model as in `review-brief.md`.

Confirmation round 2. Review only `git diff ecac83aa HEAD` on `feat/land-test-split`. The round 1 reviewer said LAND (kept as `r1-*.md`). `build-brief-2.md` records a notes-only build that added round 1's notes as known-bug lines.

Question: are the new known-bug lines accurate to round 1, and did this change touch anything else or cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
