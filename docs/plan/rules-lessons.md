# Plan: rules-lessons

Feature: FEAT-006 · Launch builders with execution limits

## Purpose

Two owner picks from 2026-11-07, both text-only:

1. **Cut ask issues and notes** (batch 1, group 3, the last of the three process cuts). The seat no longer posts a plan's questions as an `ask` issue before a build, and a land no longer needs HANDOFF and session notes written into the reviewed change. Questions stay in the plan and the report. Evidence: the seat's removal map (group 3); on 2026-11-07, every reviewer noted the missing notes and no lane wrote them.
2. **Fold brief and builder lessons into the rules** (the owner: "Do 2 and 4 as well", optimization 1). On 2026-11-07 builds stopped or failed for the same seat-brief and builder mistakes again and again: missing ID ranges, Precedent bullets naming files missing from the lane's base, removal briefs without test-retirement authority, `rm -r` blocked by the gate, direct `mkdtemp` calls, tests pinning removed text, builders without CI logs, lanes that shared hot files and re-merged a dozen times. One short list in each place makes those mistakes rarer.

## Assumptions

- A1. Seat guide (`packages/nana-setup/claude/rules/nana-seat.md`): delete the two ask-issue bullets. Add one bullet, "A brief names…", listing the brief checks in one line each: the ID range; Precedent bullets naming files tracked at the lane's current tip; test-retirement and known-bug-line authority for removal lanes; whole-part commits for large lanes; exported CI logs when the builder must read a failure; review brief committed before the first push; serialize lanes that share the hot files (the shared working pattern, the seat guide, `code-map.config.json`, the code-map launch test, `REQUIREMENTS.md`).
- A2. Builder preamble (`packages/nana-pack/prompts/builder-preamble.md`): add to Tests or Before you report: delete tracked files with `git rm -q --`; test files take their temp folder from the shared `tmpDir` helper and never call `mkdtemp`; after adding or deleting a test file run `node scripts/test.mjs test-runner`; before reporting, grep the tests for every sentence, path and file name the change removed or renamed. Drop "or session archives" from the Scope line.
- A3. Land checklist, in `templates/_shared/working-under-nana-pi.md` and AGENTS.md's marker region identically: remove "Put HANDOFF and session notes in the reviewed change before its final round"; keep "nothing is written after a land".
- A4. Minimal `docs/sessions` cut, text only: the "narrative lives in `docs/sessions/`" sentences in `HANDOFF.md`, `templates/_shared/HANDOFF.md` and AGENTS.md. The sessions seeds, adoption criterion and general ask labels stay (separate owner decisions).
- A5. Retire R-3012 and R-3013 (the planner's ask-issue rows); update R-2510 if it pins "session archives". The planner prompt keeps "Questions for the owner".
- A6. Lane IDs R-3880 to R-3884. One reviewer plus CI. Serialized after memory-cuts, which edits the same shared region.

## Open choices

- O1. Builder places each new line where the nearest existing rule sits.

## Questions for the owner

None.

## Threat model

Honest variation in how seats and builders read the rules. Out of scope.

## Precedent

- `packages/nana-setup/claude/rules/nana-seat.md`: the seat guide to edit.
- `packages/nana-pack/prompts/builder-preamble.md`: the builder preamble to edit.
- `packages/nana-setup/tests/seat-rule.test.mjs`: pins the seat guide's lines.
- `packages/nana-pack/tests/planner-prompt.test.mjs`: pins R-3012 and R-3013.
- `templates/_shared/working-under-nana-pi.md`: the shared land checklist.

## Outside precedent

none: in-house rule text.

## Must-meet

- M1 (no ask issues). The seat guide has no instruction to post a plan's questions as an issue or to hold a build for an answer; R-3012 and R-3013 are retired; the planner prompt still has "Questions for the owner".
- M2 (no notes step). The land checklist in the shared pattern and AGENTS.md no longer asks for HANDOFF or session notes before the final round, and still says nothing is written after a land; the two are byte-identical.
- M3 (sessions sentence). HANDOFF.md, the HANDOFF seed and AGENTS.md no longer say the narrative lives in `docs/sessions/`; the builder preamble's Scope line no longer names session archives.
- M4 (builder lessons). The builder preamble carries the four builder lessons in A2, each pinned by one test.
- M5 (brief checklist). The seat guide carries the brief bullet in A1, pinned by one test.
- M6 (adversary 1: every copy of the notes rule). The 2026-11-02 ruling's "Notes go in before the final round" sentence is removed and "nothing is written after a land" kept; the shared pattern, AGENTS marker region, installed Claude rules and pi-injected rulings all agree; both rendered language templates' working region equals the shared bytes; the ruling's pinning test is updated and exits 0.
- M7 (adversary 2: seat-rule inventory). R-1140 and the seat-rule test's inventory reflect exactly two removed ask bullets and one added brief bullet; the parallel-build guidance keeps a valid anchor; restoring an ask bullet or removing the brief bullet fails the test.
- M8 (adversary 3: known-bug authority is consistent). The builder preamble lets a builder remove only the known-bug lines its brief names and forbids every other edit under `docs/known-bugs/`; R-2510 and its test match; the seat guide's brief bullet says the brief names those lines.
