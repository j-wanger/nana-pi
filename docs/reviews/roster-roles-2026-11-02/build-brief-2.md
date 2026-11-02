Feature: FEAT-041 · Shape each agent's context by role

Lane roster-roles. Class: hook. Builder: pi-worker (larger lane). Build session 2. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

The plan of record is `plan.md` in this folder (revision 2). Build 1 is committed and pushed (bc4a53dc, draft PR #321): its verdict was DONE, with 9 of 9 seat pairs red. Since then machine-lane-limits has landed on main. It adds a top-level `lanes` member beside `roster` and a `lanes:` line in the roster output. Build brief 1 said: "If machine-lane-limits has landed when you start, merge `origin/main` first and order the roster output as the plan says (slot lines, then `lanes:`, then `source:`)." It had not landed then. This session does that merge.

## Build

1. `git merge origin/main`. A trial merge conflicts in nine files:
   - `REQUIREMENTS.md`, `docs/code-map.md`, `docs/sessions/2026-10.md`;
   - `packages/nana-pack/README.md`, `packages/nana-pack/lib/roster-notice.mjs`;
   - `packages/nana-pack/tests/nana-roster-set.test.mjs`, `packages/nana-pack/tests/nana-roster.test.mjs`, `packages/nana-pack/tests/roster-notice.test.mjs`;
   - `packages/nana-setup/tests/seat-rule.test.mjs`.

   Resolve each so that both features hold. Keep main's `lanes` behaviour, rows and tests, and this lane's role slots, rows and tests.
2. Roster output order: every slot line (scout, builder, largerBuilder, planner, adversary, checker, reviewer, land, in this lane's order), then `lanes:`, then `source:`. Apply that order to the roster notice as well, wherever both features print.
3. Regenerate the generated files with their generators: `npm run map`, and `node scripts/requirements-tree.mjs --write`. Keep both lanes' session entries, newest first.
4. Keep every requirement row from both sides. If a row's ID was taken on both sides, renumber this lane's row to the next free ID and name it in the report.
5. Re-run:
   - every test file touched by either side;
   - the seat pairs: `SEAT_MUTATE_SHARDS=2 SEAT_MUTATE_OUT=docs/reviews/roster-roles-2026-11-02/seat-mutate-win32.txt node docs/reviews/roster-roles-2026-11-02/seat-mutate.mjs`. Fix only anchors the merge moved; every pair must be red.
   - `node packages/nana-setup/bin/install-check.mjs`.

## Constraints

- Never edit the real `~/.pi/agent/nana-pack.json`; tests use a temp agent dir.
- Do not weaken any assertion from either side to make the merge pass.
- No committed text names a person or a machine path.
- Never read, print or use a stored credential: no `git credential fill`, and no GitHub API calls. The seat handles the PR.

## Done when

- The merge commit is made, and every touched test file passes.
- The seat pairs are all red.
- `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --check`, `node scripts/known-bugs.mjs --root .`, `nana-writing` on the session entries, and `node scripts/identity-scan.mjs --root .` are green.
- Report the install-check exit.
- Commit by explicit path on `feat/roster-roles`. Do not push; the seat pushes.

Report:
- each conflict and how it was resolved;
- any renumbered row;
- the roster output, printed from a temp agent dir that holds every slot and `lanes`;
- the test, mutation and install-check results;
- each departure from the Precedent.

## Precedent

- `packages/nana-pack/bin/nana-roster.mjs`: both features' output code.
- `packages/nana-pack/lib/roster-notice.mjs`: both features' notice code.
- `packages/nana-pack/bin/worker-config.mjs`: the roster schema, including `lanes` from main.
- `packages/nana-pack/README.md`: the `lanes` member paragraph and this lane's role-slot paragraphs.
- `docs/reviews/roster-roles-2026-11-02/seat-mutate.mjs`: the seat pairs.
