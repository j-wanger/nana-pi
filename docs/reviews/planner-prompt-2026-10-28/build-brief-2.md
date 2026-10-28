Feature: FEAT-006 · Launch builders with execution limits

Lane planner-prompt. Class: ordinary. Builder: pi-worker (small lane). Build session 2.

Build 1 stopped after 8 minutes: pi-worker's watchdog killed it at 75 seconds of flat CPU while its locked full suite ran as a separate command with output sent to a file. Its work is uncommitted in this worktree: changes to AGENTS.md, REQUIREMENTS.md, docs/code-map.md, the rulings file, rulings.test.mjs, templates-render.test.mjs and the shared template, and two new files, `packages/nana-pack/prompts/planner.md` and `packages/nana-pack/tests/planner-prompt.test.mjs`. Read them, check them against the plan, and finish the lane from there.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

Everything else stands as build brief 1 says: the plan of record is `docs/reviews/planner-prompt-2026-10-28/plan.md` with `plan-attack.md` beside it; build must-meet 1 to 7 and the "Also in this change" item; rows R-2950 to R-2959, artifact A-083; the same done-when checks and the same report.

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
