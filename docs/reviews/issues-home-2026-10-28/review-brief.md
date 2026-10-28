# Review — issues-home (open questions and next items live as GitHub issues), 2026-10-28 (final reviewer and land reviewer)

Feature: FEAT-002 · Resume decisions and next actions

Class: install, hook or gate. `node scripts/lane-class.mjs` prints `hook: packages/nana-pack/bin/nana-frontier-summary.mjs — launched CLI`. The lane:
- changes what the Claude Code SessionStart hook's frontier producer and the pi frontier extension print;
- moves the gh helpers out of nana-land;
- edits a nana-setup rule and the builder preamble.

Threat model: honest variation in our tools' output, files and environment is in scope:
- no network, no gh, or gh not signed in;
- a slow gh, including a Windows cold start;
- `GH_HOST` set to another server;
- zero open issues, or more than the fetch cap;
- long titles;
- an issue opened by someone else or without our labels;
- an org-owned repo;
- a project whose HANDOFF keeps list asks;
- an unparseable pointer;
- CRLF;
- builder and reviewer sessions;
- the Windows CI leg, which has no gh token.

Deliberate forgery is out: a forged author or labels, or an outsider who gains label rights.

Review `git diff 08b04ae5..HEAD` on `feat/issues-home` (main merged at b26e9764). The plan of record is `docs/reviews/issues-home-2026-10-28/plan.md`, after one adversary pass (`plan-attack.md`: 2 MUST, 6 SHOULD, 4 NOTE, all taken). The owner ruled that the open-issue set is a maintained artifact (must-meet 9).

The seat's record:
- **Before the build,** the seat posted the migration: labels, 26 asks, 3 next items and a pinned pointer, issues 212 to 241, each through the name check. It committed this repo's HANDOFF as pointer paragraphs, and timed the pinned read on three systems to seal the 1.5 s limit.
- **Five builds:**
  - Build 1 stopped BLOCKED on an unnamed private-helper move.
  - The seat's six-part check of build 2 (`seat-check-6387aac0.md`) found no MUST. Its SHOULD points went into builds 3 and 4 (`seat-check-03a4475f.md`).
  - The one independent check, at 28aebd48 (`independent-check-28aebd48.md`), found the feature working, with four SHOULD points in the posting loop. Build 5 (3944fcc3) fixed them.
- **Seat wrong-code pairs:** 43 of 46 red by build 4. The three still green are recorded as known bugs.
- **Locked full suite at build 5:** 229 files, 227 pass, 2 skip. The local macOS install check passed 18 of 18 at 03a4475f and again in builds 4 and 5. CI passed on all three systems at 28aebd48.
- **Notes before this round:** the HANDOFF lanes line, a session entry, and known-bug lines in FEAT-002, FEAT-039 (the product page shows "Asks: 0" until page-on-pages) and FEAT-029 (carried from lane-class). The lane's own keep wrote `tree-movement.md`.
- **CI** runs on draft pull request 244 at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all:
- Does a fresh Claude Code or pi session in this repo see the owner's open questions and next items, numbered and in the right order, within the hook's deadline, on every system?
- Does every project that has not opted in get the same block as before, byte for byte, with no gh call?
- Does any path lose the session-start block, or post, echo or leak anything to the public repo?
- Can a seat that follows only the rule post a correct, safe issue?
- Is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
