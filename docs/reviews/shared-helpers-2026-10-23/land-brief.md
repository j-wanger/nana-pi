# Review — shared-helpers (one shared process-tree kill and one shared rename retry), 2026-10-23 (the land reviewer)

Feature: FEAT-033 · Adopt explicit engineering standards

Class: gate (post-edit, review-round, pi-watchdog and install's pi launch relay). Threat model as the final reviewer's brief, `review-brief.md` in this folder: honest variation in platforms, pids, signals, taskkill outcomes, filesystem holds and builders' source spellings; deliberate forgery out.

Review `git diff dbb98cbb..HEAD` on `feat/shared-helpers`. Main is dbb98cbb (win-flake-hardening, just landed). `review-brief.md` lists the lane's commits, its plan of record (`must-meet.md`), the seat's record (26 of 26 pairs on main's runner, the Windows pair, the macOS install check, the independent check, CI on every leg) and the tree movement. Read it first.

As the land reviewer, ask what this change does to every run beside it once it is on main:
- every suite run, every mutation pair run, every pi-review and pi-worker stop, every post-edit check in every pi session and every install's pi launch now goes through one kill module, so one bug there reaches all of them at once;
- pi-watchdog's Windows kill now starts taskkill directly instead of through a shell, and the bench's taskkill gains `/T /F /PID` in that order;
- the review-text store now retries EPERM, EBUSY and EACCES on macOS and Linux too, adding at most about 40 ms before the same failure;
- the suite now fails on a new kill copy in mapped production code, so the next lane that honestly needs a different kill must declare an exception;
- the builder preamble and the shipped rulings gain a reuse rule that reaches every builder and every seat at the next install.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else.
