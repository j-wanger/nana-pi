Feature: FEAT-006 · Launch builders with execution limits

Lane builder-credential-strip. Class: gate. Threat model as in this folder's first review brief.

Confirmation round 4. Review only `git diff 3dbb388b HEAD` on `feat/builder-credential-strip`. Every reviewer said LAND at the previous round (kept in this folder), but main moved to 68a616bc. `build-brief-merge-4.md` records a merge-only build.

Question: does the merge keep this lane's behaviour and rows as the previous round accepted them, and bring main's changes in whole, including lines main deleted, with no resolution that drops or changes either side? Does it cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
