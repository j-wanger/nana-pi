# Review — issue-watch (seat sessions hear the owner's issue comments while they run), 2026-10-28 (final reviewer and land reviewer)

Feature: FEAT-002 · Resume decisions and next actions

Class: install, hook or gate. `node scripts/lane-class.mjs` prints `hook: packages/nana-pack/extensions/nana-frontier-summary.ts — pi extension`. The lane adds a watch command, a line in the Claude Code session-start block, a seat-guide rule, a pi extension timer, and one sentence in the carry rule.

Threat model: honest variation is in scope: no gh, gh failing, slow or rate-limited; no network; an org-owned repo; zero comments, a burst, long or multi-line comments; comments from other people; a project with list asks; CRLF; builder and reviewer sessions; Windows; a drifting local clock. Deliberate forgery is out: a forged author, or an outsider with write access.

Review `git diff main...HEAD` on `feat/issue-watch`. The plan of record is `docs/reviews/issue-watch-2026-10-28/plan.md`, after one adversary pass (3 MUST, 7 SHOULD, 4 NOTE). The owner picked reading 2: one pack watch command, run by Claude Code as a background monitor and by pi itself.

The seat's record:
- **Two builds.** The seat's 22 wrong-code pairs at build 1 (`seat-pairs-fefea3b9.md`) found five missed test cases. The one independent check (`independent-check-fefea3b9.md`) found no MUST and three SHOULD points. Build 2 (3ebcf093) fixed all eight. Every seat pair that still applies at build 2 fails as it should; four aimed at cursor code that build 2 rewrote.
- **Live:** the seat ran the watch as its own monitor against this repo for over an hour; each run ended on schedule and resumed from its printed command.
- **Locked full suite at build 2:** 231 files, 229 pass, 2 skip. The local macOS install check passed 18 of 18.
- **Notes before this round:** HANDOFF lanes line, session entry, known bugs in FEAT-002 and FEAT-039. The lane's keep wrote `tree-movement.md`.
- **CI** runs on draft pull request 249 at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all:
- Does a seat in each runtime hear the owner's comment while the session runs, and only the owner's words?
- Can a comment be lost or repeated across a restart, a failure, or clock drift?
- Does any path block pi, change the session-start block for a project that has not opted in, or break the hook's deadline?
- Is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
