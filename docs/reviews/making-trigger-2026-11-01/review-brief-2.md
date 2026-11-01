Feature: FEAT-040 · Make and keep memory

Lane making-trigger. Class: gate. Confirmation round 2. Threat model as in round 1 (`review-brief.md`).

Review only the change since the round-1 revision: `git diff bb55e311..HEAD` on `feat/making-trigger`.

Round 1: the final reviewer said LAND; the land reviewer sent it back for one MUST (a rebase stopped by a shutdown left the private clone detached, and `makeMemory` fetched before recovering, so every later run failed). Build 5 (`build-brief-5.md`, `build5-report.md`) fixed that MUST, the final reviewer's SHOULD (the review-folder listing past its 1 MiB cap would have skipped every review file silently) and its first NOTE (non-lock failures reported as busy). The seat recorded the final reviewer's other notes as known-bug lines in `docs/known-bugs/FEAT-040.md` and updated the session entry.

The seat's record: locked full suite at 8fd48bb5: 251 files, 249 pass, 2 skip. CI run 41300857622 passed on all three systems and all install legs. Fourteen wrong-code pairs: 14 red, 0 survived. The macOS install check from the seat's shell: exit 0.

Question: are the three fixes correct and complete, with a test that fails without each, and does the change since bb55e311 cause a harm the review standard lists? Check especially that recovery now runs under the lock before anything needs an attached branch, that network steps stay outside the lock, and that an incomplete listing is reported, not counted as zero pending.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
