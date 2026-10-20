# Build brief — install-link-race (round 1)

Feature: FEAT-013 · Install and connect harness runtimes. Class: install, hook or gate. Builder: simple lane (Claude Sonnet subagent). Worktree: ~/nana-pi-wt/install-link-race, branch feat/install-link-race, based on main.
Read first: docs/reviews/install-link-race-2026-10-20/must-meet.md. It has the design, the rows and the red-today evidence.

## Change
1. packages/nana-setup/lib/steps.mjs, install() only:
   - Move stepSharedMemory, stepPiConfig, stepSubagentConfig, stepReviewerAgent and stepPath into the closure that the one withSettingsLock call runs. They go after stepSettings, in today's order.
   - Call stepKnowledge after the lock is released. The desk step and pi registration follow as today.
   - Take the lock once. The dry run calls the same closure with lockHeld false. Rename the closure if its name no longer fits.
2. Same file, header: @outputs and @errors say the lock is held "through the PATH entries". Touch no other line: checkout-spelling-converge edits linkSkill, and pack-config-utf16 may edit the pi-config reader.
3. packages/nana-setup/README.md, the lock paragraph under "Never half-writes settings.json". It says:
   - the lock is held through the PATH entries, and which steps run while it is held;
   - a second install started then exits 2 and writes nothing;
   - the knowledge build, the desk service and pi registration run after the release, so a Ctrl-C there leaves no lock;
   - the first two must-meet known limits.
   Do not edit "Known limits" or any line another lane edits.
4. REQUIREMENTS.md: add rows R-2260 to R-2263 under FEAT-013 / SUB-014, with text exactly as in must-meet. Each is implemented and cites its check. Then regenerate the requirements tree and the code map.
lib/fsops.mjs does not change.

## Tests
- New packages/nana-setup/tests/install-overlap.test.mjs, with the six-tag header.
- One first install via install(resolveLayout({ home })) into a throwaway home with a tiny knowledge source, as install.test.mjs freshHome builds one.
- Install the wraps described in must-meet inside the try and restore them in finally, as fsops.test.mjs recordingReads does.
- The second install is a real spawnSync of bin/nana-setup.mjs install --home <same home>. It runs after the real lstat returns, with HOME set to the throwaway home.
- Four checks, one per row. Put `// req: R-226x` directly above each `check("R-226x: …", …)` line, with the titles from must-meet.
- Each check's ok also requires that its wrap fired. Print the observed values on FAIL.
- Use made-up names in scratch paths. Add no SKIPS entry; no check skips anywhere.

## Wrong code to try (the adversary probed W1 to W5; each must turn the named check red)
- W1: call stepKnowledge inside the lock → R-2263
- W2: end the lock after stepReviewerAgent and run stepPath after the release → R-2260, R-2261, R-2262
- W3: main's install() unchanged → R-2260, R-2261, R-2262
- W4: run stepPiConfig after the release → R-2262
- W5: two withSettingsLock calls, one for the Claude steps and one for the later file steps → R-2262
- W6: move stepPiRegister inside the lock → expected survivor, because under --home it spawns nothing. Say so in the report.

## Done
- All four checks pass on macOS. Run these single files: install-overlap, settings-merge, install, win32-degrade, rulings-install, settings-lock, uninstall, win-shims, retired-artifacts, doctor-fix-line.
- `npm run map:check` and `npm run readme:check` are green. The requirements-tree test passes.
- Each wrong-code pair was run, and its red check is named.
- No full suite run. The seat runs the full suite, the mutation runner and install-check before nana-land, and closes the HANDOFF lock residual.

## Report (at most 10 lines)
Tip SHA; files changed; four checks PASS/FAIL; the single-file results; the map and readme checks; the wrong-code table (pair → red check, or survivor); any deviation from must-meet, with the reason; open questions.