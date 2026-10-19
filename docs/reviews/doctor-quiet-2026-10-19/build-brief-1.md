# doctor-quiet — build brief 1

Feature: FEAT-015 · Diagnose the active environment
Lane class: install, hook or gate. Work in worktree `~/nana-pi-wt/doctor-quiet` on branch `feat/doctor-quiet`, from main. Must-meet: `docs/reviews/doctor-quiet-2026-10-19/must-meet.md`.

## Change
1. In REQUIREMENTS.md, add R-1750, R-1751 and R-1752 at the end of the FEAT-015 table.
   - Copy the text exactly from the must-meet. Set status `untested` and evidence to the test id.
   - Flip each row to `implemented` when its test passes. Then run `npm run req:tree`.
2. Create `packages/nana-setup/tests/doctor-quiet.test.mjs`.
   - Give it the six-tag header, and use the sibling tests' `check` and SUMMARY pattern.
   - Put `// req: R-175x` directly above each `check("<title>", …`, and keep that call on one line.
   - Spawn `process.execPath`, then any Node options, then the CLI path, then `doctor --home <scratch home>`. Use a scratch folder from `tmpDir` as the working folder.
   - Run each spawn inside `withPiStub`. Build the env inside the callback, deleting `NODE_OPTIONS`, `NODE_NO_WARNINGS` and `NODE_REDIRECT_WARNINGS`.
   - A warning line is a stderr line, split on `\r?\n`, that matches `^\(node:\d+\) `.
   - R-1750 and R-1752 also assert that stdout contains `nana-setup doctor`.
   - R-1751's folder holds `.pi/nana-pack.json` containing `{}`. It also asserts that stdout contains `project trust`.
   - R-1752 writes a `.mjs` preload into its scratch folder. It passes `--import <pathToFileURL(preload).href>` as a Node option, not through NODE_OPTIONS.
   - The preload wraps `process.stdout.write`. On the first write containing `nana-setup doctor`, it emits one ExperimentalWarning with a non-SQLite message, and one warning with code `NANA_DOCTOR_QUIET_PROBE`. The test asserts that both messages are in stderr.
   - Add no platform skip.
3. Before touching code, confirm that R-1750 and R-1751 are red and R-1752 is green.
4. In `packages/nana-setup/bin/nana-setup.mjs`:
   - Add one named constant for the muted set. Its provenance comment: contract values probed 2026-10-19 on Node 22.22.2, rows R-1750 and R-1751; prior art `loadSqlite` in `packages/nana-knowledge/lib/db.ts`.
   - Add one named function. It saves `process.listeners("warning")` and removes them. Its one listener drops a muted warning and calls every saved listener with any other warning.
   - The function reads `process` directly and takes no injection parameter.
   - `runDoctor` calls it first and never restores the listeners.
   - Update the header: @outputs adds that doctor's stderr carries no muted warning; @effects adds process (replaces the warning listeners for doctor).
5. In `packages/nana-setup/README.md`, make three edits:
   - Where doctor's output is described, add one sentence: doctor mutes exactly these two Node warnings and prints every other.
   - Add a Known limits bullet: `project` still prints the typeless warning.
   - Add a Tests table row for the new file.
6. If `packages/nana-pack/tests/requirements-tree.test.mjs` still holds a leaf-total number (1,315 on main today), set it to the total that `node scripts/requirements-trace.mjs` prints.
7. Run `npm run map`.
Do not touch `packages/nana-setup/lib/doctor.mjs`, `packages/nana-pack/package.json` or the knowledge package.

## Tests to run (single files, from the repo root)
- The new test.
- From `packages/nana-setup/tests/`: `install.test.mjs`, `win32-degrade.test.mjs`, `relative-agent-dir.test.mjs`, `doctor-memory-links.test.mjs`, `retired-artifacts.test.mjs`.
- `packages/nana-pack/tests/requirements-tree.test.mjs`.
- `node scripts/requirements-trace.mjs`, `npm run map:check` and `npm run readme:check`.

## Wrong code to try (each must turn the named test red; revert after)
- Restore the saved listeners in a `finally` after `diagnose()`: R-1750 and R-1751.
- Mute only the SQLite warning: R-1751.
- Call `process.removeAllListeners("warning")` without forwarding: R-1752.
- Drop every `ExperimentalWarning` by name: R-1752.
- Drop by `name === "Warning"` instead of by code: R-1752.
- Set `process.env.NODE_NO_WARNINGS = "1"` inside runDoctor: R-1750 and R-1751.

## Done
- All three rows are `implemented` and traced.
- Each of the six wrong codes turned its named test red.
- The listed files pass, and the trace, map:check and readme:check pass.
- Doctor's stdout is byte-identical to main's and its exit code is unchanged, for the same scratch home and folder (diff them).

## Report (at most 10 lines)
Commit hash; red-before lines for R-1750 and R-1751; pass lines for all three tests; one line per wrong code; the stdout diff result; the trace total; the map and README check results; anything left open.