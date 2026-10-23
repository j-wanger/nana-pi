# Review — linked-folder-advice (advice that works under a linked Claude folder), 2026-10-23 (the land reviewer)

Feature: FEAT-015 · Diagnose the active environment

Class: install (doctor's two legacy rows, and one refusal first in install). Threat model as the final reviewer's brief, `review-brief.md` in this folder: honest variation in dotfiles layouts, link kinds, platforms and the Claude folder option; deliberate forgery out.

Review `git diff 8c24e357..HEAD` on `feat/linked-folder-advice`. Main is 8c24e357. `review-brief.md` lists the lane's commits, its plan of record (`must-meet.md`), the seat's record (21 of 21 pairs, the macOS install check, the independent check, CI on every leg) and the tree movement. Read it first.

As the land reviewer, ask what this change does to every run beside it once it is on main:
- every install and every doctor run on every machine now passes the new refusal first; a false refusal would block installs everywhere, including the install check and CI;
- `install --dry-run` and doctor's dry run now exit 2 under a broken Claude folder link, where main printed rows and exited 1;
- doctor's legacy rows change text only in a home whose Claude or skills folder is a link; every other home reads byte for byte as before;
- R-2294's text narrows, so a reader of the requirements sees a condition that main did not have;
- the session-start stale-copy line still names install for a broken hooks or rules link, and install now refuses there.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else.
