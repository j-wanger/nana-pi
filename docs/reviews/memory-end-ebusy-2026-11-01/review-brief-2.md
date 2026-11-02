Feature: FEAT-040 · Make and keep memory

Lane memory-end-ebusy. Class: ordinary. Urgent fix. Threat model as in `review-brief.md`.

Confirmation round 2, over the merge of main only. Round 1 said LAND at fb9aa97d; main moved to 06287a95 before the land. Build 2 merged main (6b9e03ec). Review only `git diff fb9aa97d..HEAD` on `feat/memory-end-ebusy`.

Question: does the merge keep this lane's two test changes as round 1 accepted them and bring main's changes in whole, with every file the lane did not set out to change equal to main's? Does it cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
