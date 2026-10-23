# Review — lane-temp-cleanup (no carried Claude settings left in the temp folder), 2026-10-23 (the land reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: gate ladder, on the owner's word (pi-worker only). Threat model as the final reviewer's brief, `review-brief.md` in this folder: honest variation in platforms, exits, signals, pipes and the caller's environment; a pi seat's group SIGKILL in scope but not closed; deliberate forgery out.

Review `git diff f2b27357..HEAD` on `feat/lane-temp-cleanup`. Main is f2b27357. `review-brief.md` lists the lane's commits, its plan of record (`must-meet.md`), the seat's record (18 of 18 pairs, the probes, the independent check, CI on every leg) and the tree movement. Read it first.

As the land reviewer, ask what this change does to every run beside it once it is on main:
- every lane build on every machine, from both seats and from CI's install check, now passes the moved review-option check first and registers start-up signal listeners for its whole life;
- a non-lane `pi-worker` call with a review option now prints the review-option line before any other refusal, such as usage;
- a start-up step that hangs, such as the trust check, now ignores a stop signal sent to pi-worker's own process; a group signal still stops it;
- a closed standard-error pipe no longer crashes pi-worker, so a build whose reader went away now runs to its end;
- the Claude builder tests now clear `CLAUDE_CONFIG_DIR`, so they pass on a machine that exports it.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else.
