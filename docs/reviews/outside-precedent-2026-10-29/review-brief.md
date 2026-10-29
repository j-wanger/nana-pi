# Review — outside-precedent (every plan names one outside project or says where it looked), 2026-10-29 (final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: ordinary. `node scripts/lane-class.mjs --root .` prints `ordinary`.

Threat model: honest variation is in scope: a lane with an obvious outside project, a lane with none, a licence we cannot use or do not know, a seat and a pi planner. Deliberate forgery is out.

Review `git diff main...HEAD` on `feat/outside-precedent`. The plan of record is `docs/reviews/outside-precedent-2026-10-29/plan.md`, after one adversary pass (no MUST, 3 SHOULD, 3 NOTE, all taken). The owner picked reading 1 of his idea; the user-test step is not in this lane.

The seat's record: one build (01d67c30); each new check fails when its sentence is removed; locked full suite 232 files, 230 pass, 2 skip. Notes before this round: HANDOFF lanes line, session entry, known bugs in FEAT-006, plus carries in FEAT-002 and FEAT-003. CI runs on the draft pull request; the seat lands only on green.

Ask above all: does a planner know exactly what to write under Outside precedent, and does the change keep every existing planner-prompt pin true? Is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
