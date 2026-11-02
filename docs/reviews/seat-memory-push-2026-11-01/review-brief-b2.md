Feature: FEAT-044 · Deliver memory to each role

Lane seat-memory-push (Lane B). Class: hook. Threat model: honest variation in our tools' output is in scope (missing pointer or marker, damaged profile JSON, slow git, linked worktrees, any `NANA_ROLE`, `CI`, the `memoryPush: false` switch, records of every trust, source and kind); deliberate forgery is out.

Confirmation round 2. Review only `git diff 4d9b97f8 HEAD` on `feat/seat-memory-push`. Both round 1 reviewers said LAND (kept as `r1-reviewer-637c5e3d.md` and `r1-land-15d54af1.md`). Main then moved to d4285b6c. `build-brief-b3.md` records a build that merged main, regenerated the code map and requirements tree, and recorded round 1's notes as known bugs.

Question: did the merge keep main's content intact, including lines main deleted, and keep this lane's changes; are the new known-bug lines accurate to round 1; did the build cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
