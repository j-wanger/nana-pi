# Lane roster-set — build brief 1 (2026-10-19 · feat/roster-set · tip after the seat's plan commit)

**Builder: Claude Sonnet 5, a subagent in `<worktrees>/roster-set`.** Lane class: ordinary. Read `must-meet.md` here first (the adversary's amended plan; `plan-attack.md` holds its reasons). Requirements first: add the rows `must-meet.md` lists as `planned` in the right feature table of `REQUIREMENTS.md`, run `npm run req:tree`, and bump the R-291 leaf-total literal in `packages/nana-pack/tests/requirements-tree.test.mjs` (three spots) by the rows you add; then the tagged tests; then the code; flip each row to `implemented` when its test passes. Run `npm run map` after adding or moving a module and commit the map. Do not run the full suite and do not push; the seat does both. Do not edit `HANDOFF.md` or `docs/sessions/`.

---

# roster-set: build brief 1

**Setup.** Worktree `<worktrees>/roster-set`, branch `feat/roster-set` from main b3f6ec2. Class: ordinary. The must-meet is `docs/reviews/roster-set-2026-10-19/must-meet.md`; build to its Design and table. New row IDs come from R-1400 to R-1409 only.

**What to change.**
1. `REQUIREMENTS.md`: add R-1400 to R-1407 to the FEAT-006 table, verbatim, each `untested`; flip each to `implemented` with its file::title once its check passes.
   - In R-1123's and R-1192's WHEN clause, add "and its first argument is not `set`". Change no test for them.
   - Run `npm run req:tree`. In `packages/nana-pack/tests/requirements-tree.test.mjs`, raise the leaf total by 8, from 1,215 (b3f6ec2) to 1,223, in the title and the value.
2. `packages/nana-pack/bin/worker-config.mjs`, exports only:
   - `PI_MODEL_SHELL_ENV = 'PI_SESSION_ID'`. Provenance: contract, pi 1.0.2 `dist/core/tools/bash.js:135-157` and `docs/environment-variables.md` "Shell Tool Session Environment", read 2026-10-19; set for the model's bash and powershell commands only.
   - The print's null token per slot (`scout` and `largerBuilder`: `none`; `land`: `seat`) and the `default` thinking token. Provenance: contract, R-1123.
   - Update `@outputs`; `@purpose` stays one sentence. Change no existing export.
3. `packages/nana-pack/bin/nana-roster.mjs`:
   - `formatRosterLines` reads those tokens; its output stays byte-identical.
   - In `main()`, when argv[2] is `set`, run `await import('../lib/roster-set.mjs')`, print as Design says, and exit.
   - Leave `resolveRoster`, `validateRosterShape`, `orderedRoster` and the static imports alone: the hook, the extension and pi-worker load this file. `@effects` names the write `set` makes.
4. New `packages/nana-pack/lib/roster-set.mjs` with the six-tag header.
   - Export `setRosterSlot(agentDir, args, { env = process.env, writeTemp, rename } = {})`, returning `{ok:true, file, roster, previousTokens}` or `{ok:false, problem}`. Follow Design's ten steps in order.
   - Strip one trailing `:` from the slot. 3 tokens make a pi entry (`default` becomes null); 2 tokens led by `claude-code` make a Claude Code entry; 1 token becomes null only when it equals that slot's print token. Anything else refuses, naming the slot.
   - Let `validateRosterShape` produce every entry refusal.
   - Copy the file to `nana-pack.json.bak` in the agent dir after the temp is synced and before the rename. On any throw, remove the temp and refuse, naming the file.
5. New `packages/nana-pack/tests/nana-roster-set.test.mjs` with exactly the eight checks in the table, `// req: R-140x` directly above each.
   - Spawn `process.execPath` with an env copy: temp HOME, USERPROFILE and `PI_CODING_AGENT_DIR`, and `PI_SESSION_ID` deleted except in the R-1404 check.
   - The R-1404 check pins the literal `PI_SESSION_ID`; every other check imports names.
   - Compare folders by `fs.realpathSync.native` on both sides. The R-1406 check tries `symlinkSync` first and logs SKIP when it fails.
6. `packages/nana-pack/README.md`, Machine roster: replace the hand-edit paragraph with `node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs" set <slot> <tokens>`, the `was:` line, the `.bak` and how to restore it, the three refusals (pi model shell, malformed input, refused file), and known limits 1 to 4, 6 and 11. Keep `--json`. Then run `npm run map`.

**Wrong code to try.** Each must turn the named check red:
- write straight to the file (R-1405); put the temp in `os.tmpdir()` (R-1405);
- rename onto the link path, not its target (R-1406);
- drop the guard (R-1404); run the guard after `resolveRoster` (R-1404, malformed case);
- write `{roster}` alone (R-1401); skip `validateRosterShape` (R-1402); accept `none` for land (R-1402);
- fall back to the default on a refused file (R-1403);
- skip the colon strip (R-1400); keep `default` as a literal thinking (R-1400);
- skip the `.bak`, or copy it after the rename (R-1407).

**Done.**
- The eight checks pass. `node` on `nana-roster.test.mjs`, `roster-notice.test.mjs`, `worker-lane.test.mjs` and `requirements-tree.test.mjs` passes.
- `npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs` are clean.
- The full suite through `npm run test:locked` is green on your last commit. Do not push; the seat pushes.

**Report** (10 lines or fewer): the tip SHA; PASS or FAIL per check; each wrong-code try and the check it turned red; the files changed; the suite summary line with its check count; anything left unpinned; any row reworded and why.