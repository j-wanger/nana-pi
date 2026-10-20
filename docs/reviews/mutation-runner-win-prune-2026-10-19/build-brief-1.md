# Build brief 1 — mutation-runner-win-prune

Feature: FEAT-031 · Run checks reliably and without contaminating work. Class: ordinary.
Read `must-meet.md` beside this brief first: the rows, the titles (T1 to T5 and the pin), the design and the fixture faults.
Work in `~/nana-pi-wt/mutation-runner-win-prune` on `feat/mutation-runner-win-prune`, from main, under `packages/nana-pack/prompts/builder-preamble.md`. Run single test files only.

## Change
1. `packages/nana-pack/lib/mutation-runner-config.mjs`: add `WORKTREE_REMOVE_RETRIES = 3` and `WORKTREE_REMOVE_RETRY_MS = 250`, each with a `chosen` comment: not measured; a Windows hold on a scratch entry's files should clear within a second; retune if a record shows the still-listed line. Add both to `@outputs`. Keep both out of OVERRIDABLE.
2. `packages/nana-pack/lib/mutation-runner.mjs`: write one helper. `finish()` calls it when not KEEP. `cleanupDeadShard()` calls it when not KEEP, whether or not `wt` still exists. Follow design steps 1 to 4.
   - The first remove is today's call by the full `wt` path. Each retry names the entry `${path.basename(scratchDir)}/wt`, always with a forward slash, never through `path.join`.
   - Listed: a `worktree ` line of `git worktree list --porcelain` whose path, with `\` turned into `/`, ends with `/` plus that suffix. A failed list counts as listed.
   - Each retry: stop if not listed; wait synchronously (`Atomics.wait`); `fs.rmSync(wt)` inside a try; remove by the suffix; stop on exit 0.
   - Shard: push the line to `lines` and write the part file again. Dead shard: return the line; the parent adds it to `notes` only, so it prints once.
   - Never run `git worktree prune`. Never pass `--force` twice. Leave the KEEP paths untouched. Delete the scratch folder after the helper.
3. `packages/nana-pack/tests/mutation-runner.test.mjs`:
   - Add probe modes to `buildFixtureRepo`: `drop-dotgit`, `drop-dotgit-selfkill`, `lock-self`, `lock-self-selfkill`. Find the worktree as `path.resolve(process.cwd(), "..")`. Kill the shard as the existing `selfkill` mode does. Build every import with `importLine`.
   - Add the five checks and the pin, titled exactly as in must-meet.md. Put each `// req:` directly above a one-line `check("<title>", …`. Add no skip.
   - T1: one `drop-dotgit` pair per shard, at one shard and at three. T3: add one live decoy and one whose folder the test deletes, then make a `drop-dotgit` run.
   - T4: pass `GIT_TRACE=<a file in the check's temp folder>` to the run. Count lines containing `trace: built-in: git worktree remove`. The lock run makes 1 + `CFG.WORKTREE_REMOVE_RETRIES`, each gap at least `CFG.WORKTREE_REMOVE_RETRY_MS` by the `HH:MM:SS.ffffff` stamps (add a day when a gap is negative). A one-shard `drop-dotgit` run makes exactly 2.
   - T5 may reuse T4's lock run; add a `lock-self-selfkill` run. Assert exactly one still-listed line naming the scratch `wt` and the retry count, in `r.text` and in the record.
   - Only the pin holds the literals 3 and 250. Leave every existing check byte-identical.
4. `REQUIREMENTS.md`: add R-1770 to R-1774 at the end of FEAT-031, `implemented`, with the test refs. Run `npm run req:tree` and `npm run map`.
5. `packages/nana-pack/README.md`, runner section: add the still-listed line to the record words. In Limits, state the retry order, the suffix name, why the runner never prunes, and that a locked scratch entry stays and is named.

## Wrong code to try (each must turn the named check red; restore it afterwards)
- W1: today's cleanup with no retry → T1, T2, T4 and T5.
- W2: every retry runs, whatever the listing or the remove's exit → T4 (the `drop-dotgit` run makes 4 removes).
- W3: `git worktree prune --expire now` in place of the retry's remove → T3.
- W4: one retry, or no wait → T4.
- W5: the dead-shard line goes to the console only → T5.
- W6: the helper also runs under SEAT_MUTATE_KEEP=1 → R-1231's check.
- W7: "listed" compares git's path with the full `wt` path as raw strings → T1 on macOS (probed).

## Done
- `npm test -- packages/nana-pack/tests/mutation-runner.test.mjs` passes whole on macOS: T1 to T5, the pin and every existing check PASS.
- W1 to W7 each turn red as named.
- `npm run map:check` and `npm run readme:check` exit 0. The requirements-trace, requirements-tree and requirement-rows test files pass in filtered runs.
- No inline tunable. Do not push; the seat reads the Windows leg.

## Report (at most 10 lines)
Commit SHA. Each new check's PASS or FAIL. For W1 to W7, which check went red. Map, readme and rail results. Anything left undone. The one claim you would most expect to be wrong.
