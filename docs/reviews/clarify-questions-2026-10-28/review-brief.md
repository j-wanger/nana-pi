# Review — clarify-questions (plans rank their open questions for the owner), 2026-10-29 (final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: ordinary. `node scripts/lane-class.mjs --root .` prints `ordinary`.

Threat model: honest variation is in scope: a lane with no open question or many; a cheap and a costly wrong guess; a seat and a pi planner; a planner returning readings. Deliberate forgery is out.

Review `git diff main...HEAD` on `feat/clarify-questions`. The plan of record is `docs/reviews/clarify-questions-2026-10-28/plan.md`, after one adversary pass (3 MUST, 4 SHOULD, 3 NOTE, all taken). The owner picked reading 1, keeping reading 2, a page per lane, in mind.

The seat's record:
- **One build** (72cd5cd6). The builder showed each new check fails when its sentence is removed.
- **Main merged twice**, last after issue-watch landed; the seat guide merged cleanly and its tests pass.
- **Locked full suite at the build:** 231 files, 229 pass, 2 skip.
- **Notes before this round:** HANDOFF lanes line, session entry, known bugs in FEAT-006, plus four carried from the code-search and issue-watch reviews (FEAT-029, FEAT-002). The lane's keep wrote `tree-movement.md`.
- **CI** runs on the draft pull request at the reviewed tip. The seat lands only on green.

Ask above all:
- Does a seat or pi planner know exactly what to write, what to post, and when the build waits?
- Does it conflict with the carry rule, the readings ruling or the one-word-default ruling?
- Is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
