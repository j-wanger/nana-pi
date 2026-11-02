Feature: FEAT-042 · Measure what builders see

Lane anatomy-label-check. Class: ordinary. Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Confirmation round 3. Review only `git diff fb9e41c0 HEAD` on `feat/anatomy-label-check`. Round 2 (kept as `r2-*.md`) said LAND, but main moved to d4285b6c. `build-brief-5.md` records a merge-only build.

Question: did the merge keep main's content intact, including lines main deleted, and keep this lane's changes; did it cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
