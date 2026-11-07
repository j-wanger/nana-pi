# Brief 4: builder-context, round 1 fix

Feature: FEAT-041 · Shape each agent's context by role

Round 1 (r1-reviewer.md beside this brief) found one MUST and two small items to fix with it. Change nothing else.
1. MUST M1: `docs/requirements-tree.md` is stale after R-3747. Run `npm run req:tree` and commit the result. `node scripts/requirements-tree.mjs --check` must exit 0.
2. S1: `AGENTS.md` (nana-pi's own section, "The tree in briefs, reviews and lands") still says pi-worker refuses a brief without a Precedent section. Reword it to say a brief carries one unless it's marked `Card: fix`.
3. NOTE: the R-3747 test title still says "each known caller". Retitle it to match the fresh-read wording.

## Precedent
- `scripts/requirements-tree.mjs` — the generator behind `npm run req:tree`.
- `AGENTS.md` — the project section after the shared markers.

Report: the tip, and the exit codes of the tree check, `npm run map:check`, the readme check and the builder-context tests.
