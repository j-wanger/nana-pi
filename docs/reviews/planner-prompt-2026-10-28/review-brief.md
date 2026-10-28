# Review — planner-prompt (planners get one reviewed prompt), 2026-10-28 (the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: ordinary. The lane adds a tracked prompt file, a ruling, one sentence in the shared Plans bullet and its AGENTS.md copy, requirement rows, an artifact line and tests. It changes no install, uninstall or doctor code, no hook or extension code, no gate policy and no land or review tool. Threat model: honest variation in our tools' output, files and environment is in scope (a planner run as a Claude Code workflow agent or a pi session; a request with or without an agreed reading; another project where pack files exist only under `$HOME/nana-pi/`; CRLF; a plan copied into a pi-worker brief); deliberate forgery is out.

Review `git diff 877b123d..HEAD` on `feat/planner-prompt`. The plan of record is `docs/reviews/planner-prompt-2026-10-28/plan.md`, after one adversary pass (`plan-attack.md`; 1 MUST, 7 SHOULD, 4 NOTE, all taken). It is the first plan in a deliberately light form: purpose, assumptions, open choices, threat model, precedent, must-meet tests and a test forecast, with no list of allowed edits and no seat wrong-code pairs. That lightness is the lane's point, not a gap.

The seat's record:
- Build 1 stopped after 8 minutes when pi-worker's watchdog killed it while its locked suite ran detached; build 2 (af1b9f94) continued from its uncommitted work. Locked full suite: 225 files pass, 2 skip.
- The seat ran map:check, readme:check, the requirements trace, the tree check (`deliverables: 21 of 21 made and read by code, 21 more parked`), the known-bugs check, the identity scan and `nana-writing HANDOFF.md`; all clean, frontier at 1188 of 1200 words.
- Notes before this round (ca084dd1): HANDOFF Next rewritten for the new priority; a session entry; one FEAT-006 known-bug line for the watchdog.
- The lane's own keep wrote `tree-movement.md`.
- CI runs on the draft pull request at the reviewed tip, the Windows leg included; the seat lands only on green.

Ask above all: would a planner who reads only this prompt and its named sources write a plan that starts from an agreed intent, keeps assumptions and open choices visible, and carries no copied format, no list of allowed edits and no seat pairs in an ordinary lane? Can a fresh seat, Claude Code or pi, find what planners are told, where each instruction came from and which wins a conflict? Does any pinned check pass on a prompt that says the opposite? Is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
