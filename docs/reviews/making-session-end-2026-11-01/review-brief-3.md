Feature: FEAT-040 · Make and keep memory

Lane making-session-end. Class: hook. Threat model as in `review-brief.md`.

Confirmation round 3, over the owner's decision note and the merge of main. Round 2 reviewed fdd7b60a: the final reviewer said LAND; the land reviewer sent back on the npm `claude.cmd` finding, and the owner decided to land and fix that in its own lane (870df7d3 records it in the session entry, with round 2's texts kept and `build-brief-5.md`). Build 5 merged main at 81b78dfa (1c1d61ad). Review only `git diff fdd7b60a..HEAD` on `feat/making-session-end`.

Question: does the merge keep this lane's behaviour and rows as round 2 accepted them, and bring main's watcher-clock and audit-test-speed changes in whole, including main's deletions, with no resolution that drops or changes either side? Does the session note state the owner's decision truthfully? Does the change cause a harm the review standard lists?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
