Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane windows-local-suite. Class: ordinary. Threat model as in `review-brief.md`.

Confirmation round 2, over the merge of main only. Round 1 said LAND at eda55e5b; main moved to 151c7099 before the land. Build 2 merged main (ed8835ae) and regenerated the code map and requirements tree. Review only `git diff eda55e5b..HEAD` on `feat/windows-local-suite`.

Question: does the merge keep this lane's tests, helper and rows as round 1 accepted them, and bring main's changes in whole, including main's `profile-fixture.mjs` retries and any lines main deleted? Every file this lane did not set out to change should equal main's. Does it cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
