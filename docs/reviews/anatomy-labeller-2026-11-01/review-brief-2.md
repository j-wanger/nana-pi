Feature: FEAT-042 · Measure builder context

Lane anatomy-labeller (Part 1). Class: ordinary. Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Confirmation round 2, over the merge of main only. Round 1 said LAND at dda8d9e2 (kept in this folder). Since then the seat kept that text and wrote `build-brief-2.md` (bd69f15e), and build 2 merged main at 81b78dfa (034ba2b4). Review only `git diff dda8d9e2..HEAD` on `feat/anatomy-labeller`.

Question: does the merge keep this lane's behaviour and rows as round 1 accepted them, and bring main's watcher-clock and audit-test-speed changes in whole, with no conflict resolution that drops or changes either side? Does it cause a harm the review standard lists?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
