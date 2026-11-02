Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane land-test-split. Class: ordinary. Threat model as in this folder's first review brief.

Confirmation round 3. Review only `git diff 220e4243 HEAD` on `feat/land-test-split`. Every reviewer said LAND at the previous round (kept in this folder), but main moved to 7c4e7e19. `build-brief-merge-3.md` records a merge-only build.

Question: does the merge keep this lane's behaviour and rows as the previous round accepted them, and bring main's changes in whole, including lines main deleted, with no resolution that drops or changes either side? Does it cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
