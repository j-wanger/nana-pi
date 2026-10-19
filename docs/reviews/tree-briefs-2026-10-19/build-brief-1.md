# Lane tree-briefs — build brief 1 (2026-10-19 · feat/tree-briefs · tip after the seat's plan commit)

**Builder: Claude Sonnet 5, a subagent in `<worktrees>/tree-briefs`.** Lane class: ordinary. Read `must-meet.md` here first (the adversary's amended plan; `plan-attack.md` holds its reasons). Requirements first: add the rows `must-meet.md` lists as `planned` in the right feature table of `REQUIREMENTS.md`, run `npm run req:tree`, and bump the R-291 leaf-total literal in `packages/nana-pack/tests/requirements-tree.test.mjs` (three spots) by the rows you add; then the tagged tests; then the code; flip each row to `implemented` when its test passes. Run `npm run map` after adding or moving a module and commit the map. Do not run the full suite and do not push; the seat does both. Do not edit `HANDOFF.md` or `docs/sessions/`.

---

# Lane tree-briefs: build brief 1 (2026-10-19 · feat/tree-briefs · <worktrees>/tree-briefs)

Read `must-meet.md` here first. Feature: FEAT-028 · Maintain requirement identity and trace links.

The seat's plan commit added rows R-1460 to R-1463 to REQUIREMENTS.md as `planned` under FEAT-028. That commit also regenerated the outline and set the leaf total in requirements-tree.test.mjs to 1,219. Take no other ID.

## What to change
1. **`scripts/requirements-moved.mjs` (new).** Build it exactly as must-meet's Design says.
   - Use the six-tag header, with `@effects process (runs read-only git commands)`.
   - Reuse `parseLedger` and `readRequirementRows` from `scripts/requirements-tree.mjs`. Do not write a second parser.
   - Inject the git runner. Make the maxBuffer a named constant with a provenance comment.
   - Exit codes: 0 for a report, 1 for a read failure, 2 for usage. Add no `--feature` flag.
2. **`packages/nana-pack/tests/requirements-moved.test.mjs` (new).**
   - Give it the six-tag header, with a `check` helper shaped like requirements-tree.test.mjs.
   - Build the must-meet fixture in `tmpDir(join(tmpdir(), "req-moved-"))`. Never touch the repository.
   - Copy requirements-lift.test.mjs's git setup:
     - an env with every `GIT_*` variable removed;
     - `git -c user.name=… -c user.email=… -c commit.gpgsign=false -c core.autocrlf=false`;
     - `init -q -b main`.
   - Run the CLI as `spawnSync(process.execPath, [CLI, "--root", dir, "--base", "main"], {encoding: "utf8", env})`.
   - A row line sits under the nearest preceding unindented stdout line. Assert on stdout. Never assert stderr is empty, because Node may print a module-type warning.
   - Write four checks, MT1 to MT4, with the exact titles from must-meet. Put `// req: R-146x` directly above each `check(`.
3. **Flip the rows.** Set R-1460 to R-1463 to `implemented`, each citing `packages/nana-pack/tests/requirements-moved.test.mjs::<title>`. Run `npm run req:tree` and `npm run map`, then commit `docs/requirements-tree.md` and `docs/code-map.md`.
4. **Docs.** No row covers these. Every flag you name must exist in the script.
   - `README.md`: add one sentence after the `requirements-tree.mjs` sentences. The readme check fails on a shipped script the README never names.
   - `packages/nana-pack/skills/requirements/SKILL.md`: add one paragraph after "Check the tree with …". It says:
     - a lane brief names its feature as `Feature: FEAT-nnn · <label>`;
     - before the final review and before the land, run `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main`;
     - the review brief and the land report carry that output;
     - the reviewer reads every feature the output names.
   - `AGENTS.md`: add a local section `### The tree in briefs, reviews and lands` (at most 3 lines) after "Install check before a land", outside the marker region.

## Not in this lane
Do not touch:
- nana-land, pi-review, review-round, review-ledger or pi-worker;
- `prompts/builder-preamble.md`;
- `templates/`, including the shared working section;
- HANDOFF and the session archives.

Edit no existing test.

## Wrong code to try
Break the code, never the assertion. Each break must turn its check red; restore the code after each one.
- Diff against `<rev>` instead of the merge base. MT2 should go red.
- Group a subgroup's rows under the subgroup instead of its feature. MT1 should go red.
- Count Evidence-only edits as changes. MT1 should go red.
- Drop removed rows. MT1 should go red.
- Omit the shares. MT4 should go red.
- Ignore a change of feature. MT3 should go red.

## Done
- `node packages/nana-pack/tests/requirements-moved.test.mjs` passes 4 of 4 checks.
- `node packages/nana-pack/tests/requirements-tree.test.mjs` and `node packages/nana-pack/tests/skill-claims.test.mjs` are green.
- `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --check`, `npm run map:check` and `npm run readme:check` are all clean.
- Seat check: `node scripts/requirements-moved.mjs --root . --base main` exits 0. It lists exactly R-1460 to R-1463 as `new (implemented)` under `FEAT-028 · Maintain requirement identity and trace links`, and nothing else.
- The full suite passes with `npm run test:locked` on the last commit. Do not push.

## Report (at most 10 lines)
- First line: `VERDICT: DONE | PARTIAL | BLOCKED`.
- Commits.
- Files touched.
- Each wrong-code pair and the check it turned red.
- The seat-check output.
- The suite line with its check count.
- What was not done.