# Review — objective-hook-win (session-start hooks share one deadline), 2026-10-23 (the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Class: hook (the producer launcher both Claude Code session-start hooks call, and the two hooks). Threat model as the final reviewer's brief, `review-brief.md` in this folder: honest variation in machines, start delays and producers on macOS and Windows; deliberate forgery out.

Review `git diff 00617983..HEAD` on `feat/objective-hook-win`. Main is 00617983 (install-check-builder, just landed). `review-brief.md` lists the lane's commits, its plan of record (`must-meet.md`), the seat's record (12 of 12 pairs, the Windows readings, the macOS install check, the independent check, CI on every leg) and the tree movement. Read it first.

As the land reviewer, ask what this change does to every run beside it once it is on main:
- every Claude Code session start on every machine runs the changed launcher through the objective and adoption hooks, at the owner's next install or from the checkout on Windows;
- a hung producer now holds a session start about 1 s longer (one hung about 2.5 s, two about 4.0 s), and the both-hung margin to Claude Code's 5 s falls from about 2 s to about 1 s;
- a hook's second producer now gets only the time its first producer left, so the frontier block and the stale-copy line can print their markers where main printed them;
- the deadline counts from Node's clock, so process creation before it, a `node` shim and a cold start sit in the 1,000 ms reserve;
- the timing tests take longer, and the both-hung checks keep about a 1 s margin on a loaded runner.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else.
