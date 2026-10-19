# trust-finds-pi — build brief 1

Feature: FEAT-009 · Decide which project content is trusted
- Lane: trust-finds-pi, ordinary.
- Builder: a Claude Sonnet subagent following packages/nana-pack/prompts/builder-preamble.md.
- Where: the lane worktree on feat/trust-finds-pi.
- Run single test files only. Never edit HANDOFF.md or docs/sessions/.
- The repo is public: no machine paths or owner name in committed text.

## Change
1. REQUIREMENTS.md, FEAT-009 table, directly after R-672:
   - Add R-1800 and R-1801 with the exact text in must-meet.md, status `untested`.
   - Flip each row to `implemented` when its test passes, with its file::title as evidence.
2. packages/nana-setup/tests/trust.test.mjs, before the final rmSync:
   - Import `PI_INSTALL_HINT` from ../lib/steps.mjs, and compare against that name.
   - Add one helper per must-meet "Test mechanics":
     - copy `process.env`, set HOME to the test home and a fresh absolute `PI_CODING_AGENT_DIR`
     - delete every key whose lowercase is `npm_config_prefix`, then set `npm_config_prefix` to a fresh folder
     - expected path: `spawnNpmRoot({ env })` with HOME and USERPROFILE deleted, then the product's `path.join`
     - run `trust <dir> --yes` with no `--home`
   - R-1801 plants `module.exports = {};` at that path.
   - Assert: status 2; exactly one non-empty stderr line (split on /\r?\n/); that line includes the module path and PI_INSTALL_HINT. R-1800 only: no trust.json in the fresh agent dir.
   - Put `// req: R-1800` (or R-1801) directly above a one-line `check("<title>", …`, titles exactly as in must-meet.md.
   - Update the header's @inputs to name the shared install hint.
   - Run the file and confirm both new checks FAIL before step 3.
3. packages/nana-setup/bin/nana-setup.mjs, `runTrust`:
   - Bind the module path to one const.
   - Wrap the dynamic import in try/catch and throw `new SetupError(...)` with that path, `err.code ?? err.name` (never err.stack or err.message) and `PI_INSTALL_HINT`.
   - Then `if (typeof trustModule.ProjectTrustStore !== "function") throw new SetupError(...)` with the path and the hint.
   - Add `PI_INSTALL_HINT` to the existing steps.mjs import.
   - In the header's `@errors`, add that a pi trust store that cannot be loaded from npm's global folder is a usage SetupError (exit 2).
   - No PATH lookup, no new module, no new tunable. lib/npm-root.mjs stays unchanged.
4. packages/nana-setup/README.md, after the `pi -a` sentence in "Trust is yours to decide", add:
   - Trust loads pi's store from the pi package in npm's global folder (`npm root -g`).
   - When it is missing there or has no `ProjectTrustStore`, trust exits 2 with one line naming the path it tried and the pi install command.
   - A pi installed by another package manager is not found there.
   - Name no pi-internal file path.
5. Run `npm run req:tree` and `npm run map`. Then `npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs` must be green.

## Tests to run
- `node packages/nana-setup/tests/trust.test.mjs`: every check PASSes. It needs pi in npm's global folder for its top-level import.
- `node packages/nana-setup/tests/pi-install-pin.test.mjs`
- `node packages/nana-setup/tests/doctor-runtime.test.mjs`

## Wrong code to try (each must turn a new check red; revert after)
- Guard the import but leave `new trustModule.ProjectTrustStore` unguarded. Expect R-1801 red.
- Catch the import error and continue with `{}`. Expect R-1800 red (exit 1, stack).
- Throw a plain Error instead of SetupError. Expect both red.
- Put `err.stack` in the message. Expect both red.
- Drop PI_INSTALL_HINT, or the module path, from the message. Expect both red.

## Done
- Both new checks are red before the code change and green after.
- Every existing trust.test.mjs check passes.
- map:check, readme:check and the requirements trace are green.
- Explicit paths are committed on feat/trust-finds-pi.

## Report (≤ 10 lines)
- Commit hash and rows flipped.
- Red-before: exit code and first stderr line per check. Then green-after.
- Each wrong version and the check it turned red.
- map:check, readme:check and trace results.
- Anything not done or uncertain.