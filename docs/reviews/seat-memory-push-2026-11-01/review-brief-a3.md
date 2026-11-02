Feature: FEAT-040 · Make and keep memory

Lane seat-memory-push-a. Class: ordinary. Threat model as in `review-brief-a1.md`.

Confirmation round 3, over the merge of main only. Round 2 said LAND; main moved to 57585563, where windows-local-suite split `profile-store.test.mjs` into itself and `profile-store-guards.test.mjs`. Build 4 merged main (7b863472) and moved this lane's two must-meet tests and the uppercase-prefix case into `profile-store-guards.test.mjs`. Review only the diff from round 2's tip to HEAD on `feat/seat-memory-push-a` (`git log` shows round 2's brief commit).

Question: does the merge keep this lane's behaviour, rows and tests as round 2 accepted them, with no main check lost from either profile test file, and bring main's changes in whole? Every file this lane did not set out to change should equal main's. Does it cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
