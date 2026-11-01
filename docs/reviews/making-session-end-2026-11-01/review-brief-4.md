Feature: FEAT-040 · Make and keep memory

Lane making-session-end. Class: hook. Threat model as in `review-brief.md`.

Confirmation round 4, over the merge of main only. Round 3 said LAND at 90b9c2c1, but main moved to b757e4d0 (memory-replay landed) before the land. The seat wrote `build-brief-6.md`; build 6 merged main (8fd49e04) and recorded the merged-tip mutation run (87cb9713). Review only `git diff 90b9c2c1..HEAD` on `feat/making-session-end`.

Question: does the merge keep this lane's behaviour and rows as round 3 accepted them, and bring main's memory-replay change in whole, including any lines main deleted, with no resolution that drops or changes either side? Does it cause a harm the review standard lists?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
