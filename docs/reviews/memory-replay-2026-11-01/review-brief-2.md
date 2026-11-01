Feature: FEAT-043 · Measure memory outcomes

Lane memory-replay. Class: ordinary. Threat model: honest variation in our tools' output is in scope; deliberate forgery, such as planted transcripts or labels, is out.

Confirmation round 2. Review only `git diff c5931f51..HEAD` on `feat/memory-replay`; round 1 reviewed c5931f51 and its text is `r1-reviewer-a012fb39.md` in this folder. Build 2 (`build-brief-2.md`, `build-2-notes.md`, commit d9bf08f2) answers round 1's MUST, both SHOULDs and the screen NOTE. The seat's later commits drop the counts from private labels out of the session note, the FEAT-043 known-bug line, the round-1 brief and the kept round-1 text, per plan step 7.

Seat record: build 2's locked full suite read 253 files, 251 pass, 2 skip, and CI run 41326237714 passed on all three systems.

Question: does build 2 close the MUST, so the shared-memory hook output recorded by Claude Code (its `command` field holds the status label `nana: shared memory index`) lands in the replaceable slot; keep only SessionStart outputs after the last compaction; compare judged rates rather than raw counts and print failed draws; and mark unscreened cases `unrun`? Does the change since c5931f51 cause a harm the review standard lists?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
