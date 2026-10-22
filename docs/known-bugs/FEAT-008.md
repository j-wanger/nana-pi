# FEAT-008 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Land rule: the helper checks that every recorded verdict is LAND, not who reviewed; the round records are a plain file; a narrow review counts for everything up to its revision; a direct commit to main bypasses it (the working pattern forbids that). Every revision reviewed before the land rule needs a fresh review.
- Lane cleanup (deliverable-fields land): when the lane branch's pushed copy lags its tip, cleanup removes the worktree, then git refuses to delete the branch as not fully merged. A rerun then refuses for lack of a worktree. The seat pushed the branch and deleted it with `git branch -d`.
- Land record (audit re-check, 2026-10-22): a land writes no ledger line of its own; only the locked suite's land record in the clone shows it.
