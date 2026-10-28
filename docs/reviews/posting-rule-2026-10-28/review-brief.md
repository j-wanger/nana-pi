# Review — posting-rule (open items go only to issues where the HANDOFF points to them), 2026-10-28 (final reviewer)

Feature: FEAT-002 · Resume decisions and next actions

Class: ordinary. `node scripts/lane-class.mjs` prints `ordinary`. The lane edits a nana-setup rule, the shared template, AGENTS.md's marker region, R-682's text and check, and two FEAT-002 known-bug lines.

Threat model: honest variation is in scope:
- a seat in a project whose HANDOFF points to its issues;
- a seat in a project that keeps list asks;
- a seat whose post fails (no gh, a failing name check);
- a Claude Code seat and a pi seat;
- a builder or reviewer session.

Deliberate forgery is out.

Review `git diff cb7832da..HEAD` on `feat/posting-rule`. The plan of record is `docs/reviews/posting-rule-2026-10-28/plan.md`, after one adversary pass (`plan-attack.md`: 2 MUST and 2 SHOULD, all taken). The lane restores agreed behaviour: both final reviewers of issues-home found the rule could read as "write a HANDOFF line and also post an issue".

The seat's record:
- **One build** (60430a36). The diff matches the plan's four sentences, in all three copies.
- **The seat re-ran R-682's check** on a scratch copy holding the old sentences beside the new ones: the check fails. On the build it passes.
- **Locked full suite at the build:** 229 files, 227 pass, 2 skip.
- **Local macOS install check:** the seat's run outside pi passed 18 of 18. The builder's run inside pi-worker failed at pi post-edit, a known FEAT-015 bug.
- **Notes before this round:** the HANDOFF lanes line and a session entry. The lane's own keep wrote `tree-movement.md`.
- **CI** runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all:
- Does a seat in each situation above know exactly what to do with an open item?
- Does anything issues-home added to the rule go missing?
- Does R-682's check fail on the old wording and on old plus new?
- Is R-682 no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
