Feature: FEAT-006 · Launch builders with execution limits

Lane planner-prompt. Class: ordinary. Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/planner-prompt, based on main at 877b123d. The plan of record is `docs/reviews/planner-prompt-2026-10-28/plan.md`. Read it whole, and read `plan-attack.md` beside it for the reasons behind each must-meet. The plan has no list of allowed edits; its test forecast is a forecast, not a limit.

What the lane does, in one sentence: one reviewed planner prompt in the pack tells every planner what a plan holds and where each instruction comes from, the shared Plans bullet points to it, and the rulings file gains the owner's 2026-10-28 readings ruling.

Build the plan's must-meet 1 to 7 and its "Also in this change" item. New requirement rows take IDs R-2950 to R-2959; the new artifact takes A-083. Write the prompt's text yourself within the plan's pinned meanings; it is read by planners, so keep it short and plain, and keep it free of any earlier lane's name or path.

Done when each row is `implemented` with backticked `file::title` evidence, and the locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check and the known-bugs check are green.

Report: each must-meet's test title; the prompt's Sources section as written; each departure from the Precedent below with its reason; every existing test you changed and whether the forecast named it.

## Precedent

- `packages/nana-pack/prompts/builder-preamble.md`, loaded at `packages/nana-pack/bin/pi-worker.mjs:155-156`: a tracked prompt in the pack.
- `packages/nana-pack/prompts/review-standard.md` with `packages/nana-pack/tests/review-standard.test.mjs:22-40`: a tracked prompt whose required sentences are pinned exactly. The new prompt's pins follow this, not phrase-absence checks.
- `templates/_shared/working-under-nana-pi.md:33`, the Seat guide bullet: a pack file named from the shared pattern by its `$HOME/nana-pi/...` path.
- `templates/_shared/working-under-nana-pi.md:27` and its AGENTS.md copy at `AGENTS.md:95`: the Plans bullet this lane extends. `packages/nana-pack/tests/templates-render.test.mjs:597-621` pins it. R-2584, R-1100, R-1300, R-1102 and R-1103 each pin a phrase the bullet keeps.
- `packages/nana-pack/lib/brief-precedent.mjs:30-62` and `packages/nana-pack/lib/brief-config.mjs`: pi-worker's brief parser. A Precedent entry must open with a tracked path or `none: <reason>`, and the Feature line must open a line.
- `packages/nana-pack/rules/nana-rulings.md` with `packages/nana-pack/tests/rulings.test.mjs:225-234`: the R-2663 pin of one ruling's exact line is the form for pinning the new ruling.
- `REQUIREMENTS.md:489`: A-079, a manual tracked prompt artifact.
- `packages/nana-pack/skills/spec/SKILL.md:22-24`: questions before drafting, and an Assumptions section.
- `scripts/code-map.mjs:158`: `--impact` prints callers, tests and artifact readers for a code file. The prompt points planners to it.
- `packages/nana-pack/tests/rulings.test.mjs:215` and `:238-240`: the rulings file is checked for owner words, work projects and model ids. The new prompt is public too and gets the same check.
- `packages/nana-setup/tests/project-stale.test.mjs`: a change to the shared working pattern makes every adopted project print a stale line until `nana-setup project` runs there.
