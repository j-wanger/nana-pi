# Review — code-search (planners get a code search over an improved code map), 2026-10-28 (final reviewer)

Feature: FEAT-029 · Navigate code and investigate impact

Class: ordinary. `node scripts/lane-class.mjs --root .` prints `ordinary`.

Threat model: honest variation is in scope: a need worded loosely or in other words than the headers; a module with a vague header; shared helpers every lane imports; tests in the map; a module missing from the map; a large map; a shallow clone. Deliberate forgery is out.

Review `git diff main...HEAD` on `feat/code-search`. The plan of record is `docs/reviews/code-search-2026-10-28/plan.md`, after one adversary pass (2 MUST, 3 SHOULD, 4 NOTE, all taken). The trial behind it is under `trial/`. The owner picked a planner command running on an improved code map (issue 248).

The seat's record:
- **Four builds.** Build 1 stopped BLOCKED on the seat's brief. Build 2 delivered. Builds 3 and 4 restored two header edits that changed the lane's class.
- **Quality:** on the ten trial needs at their base commits, the search finds 0.78 of the reused code; the floor is 0.75. The seat ran it on a fresh need and it named the issue reader and the gh helper first.
- **Locked full suite at build 4:** 231 files, 229 pass, 2 skip.
- **Notes before this round:** HANDOFF lanes line, session entry, FEAT-029 known bugs. The lane's keep wrote `tree-movement.md`.
- **CI** runs on the draft pull request at the reviewed tip. The seat lands only on green.

Ask above all:
- Does the search give a planner useful precedent it might have missed, without replacing the planner's judgment?
- Are the launch links right, and does `map:check` stay green and stable?
- Is the quality floor a sound test, not tuned to its own fixture?
- Is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
