# Review — claude-code-builder-parity (pi-worker starts a Claude Code larger-lane builder itself), 2026-10-23 (the land reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: gate (pi-worker's lane launch and pi-watchdog's `runOnce`, which every pi-review round also runs; no hook, extension or nana-setup file changes). Threat model as the final reviewer's brief, `review-brief.md` in this folder: honest variation in rosters, claude installs, user settings (proxy, CA, key and login helpers included), briefs, machine state and Windows paths; deliberate forgery out.

Review `git diff 5c47155f..HEAD` on `feat/claude-code-builder-parity`. Main is 5c47155f (ci-timing-records, just landed). `review-brief.md` lists the lane's commits, its plan of record (`must-meet.md`, with the 2026-10-23 settings carry the owner's proxy constraint required), the seat's record (35 of 35 macOS pairs and three Windows pairs red, the smoke, the independent check, three Windows findings fixed) and the tree movement. Read it first.

As the land reviewer, ask what this change does to every launch beside it once it is on main:
- every pi lane build and every pi-review round now runs the changed `runOnce`, whose `detached` comes from the launch when the launch sets it;
- a Windows `.cmd` Claude builder now runs not detached, so its stop relies on `taskkill /T` and the console it shares;
- the AGENTS working section's Larger lanes bullet changes in the shared template, so every project's marker region differs until `nana-setup project` refreshes it, and the drift notice reports that;
- the settings file and prompt file sit in a temporary folder that must be gone after every exit the lane's tests name.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else.
