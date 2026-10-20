# pi-probe-timeout — build brief
Feature: FEAT-013 · Install and connect harness runtimes. Class: install, hook or gate. Threat model: honest hangs, shims, slow starts, cmd.exe and Ctrl-C are in scope. A pi that escapes its process group is out.
Builder: pi gpt-5.6-sol through pi-worker (larger lane). Work in ~/nana-pi-wt/pi-probe-timeout on feat/pi-probe-timeout. Follow packages/nana-pack/prompts/builder-preamble.md. Run single test files only. Never edit HANDOFF.md or docs/sessions/. Plan of record: docs/reviews/pi-probe-timeout-2026-10-20/must-meet.md.

## Change
1. New packages/nana-setup/lib/bounded-spawn.mjs, with the six-tag header. Export boundedSpawnSync(command, args, options), which returns the spawnSync shape and ETIMEDOUT when options.timeout passes. Send the spec on stdin. Pass env: options.env ?? process.env. Pass NO windowsHide. Set the outer timeout to the limit + RELAY_BACKSTOP_MS. Parse the last stdout line. A failed or non-JSON relay returns an error with a code and never throws. Export the chosen tunables RELAY_SETTLE_MS = 1_000 and RELAY_BACKSTOP_MS = 5_000, each with a provenance comment.
2. New packages/nana-setup/lib/bounded-spawn-child.mjs, with the six-tag header. Spawn detached on POSIX, with stdio ignore/pipe/pipe and NO windowsHide, and pass windowsVerbatimArguments through. Relay {status, signal, stdout, stderr, error:{code,message}} as one JSON line, then call process.exit. At the deadline: SIGKILL `-pid` on POSIX; on win32 run taskkill with windowsHide and TASKKILL_ARGS from nana-pack/lib/mutation-runner-config.mjs; fall back to child.kill. Report ETIMEDOUT after the pipes close or RELAY_SETTLE_MS. The ETIMEDOUT message names no limit, like spawnSync's own. On SIGINT, SIGTERM or SIGHUP, end the tree and exit.
3. steps.mjs: add PI_LAUNCH_LIMITS_MS directly above stepPiRegister, with the provenance in must-meet. The default spawn becomes boundedSpawnSync. Add the `limits` injection, a timeout per launch and the two ETIMEDOUT rows. Update @effects. Put the import on its own line beside the win-command import. Do not touch the realpath lines (setup-checkout-spelling edits them).
4. doctor.mjs: change the pi probe block only, plus @effects. Put the new imports on their OWN lines and leave the long steps.mjs import line alone (win-config-json-path edits it).
5. packages/nana-setup/README.md has two edits. First, add one sentence to the Idempotence paragraph that starts "Re-running install". It says install, its dry run and doctor stop waiting at the limits PI_LAUNCH_LIMITS_MS sets in `lib/steps.mjs` and end the pi process tree (taskkill on Windows; without taskkill only cmd.exe ends). It also says they print ✗ naming the command and the limit. Second, add one test-table row for `tests/pi-launch-limits.test.mjs` directly after the pi-registration row. Leave Known limits alone, since setup-checkout-spelling appends there. Leave the doctor pi-executable paragraph alone, since doctor-fix-line inserts below it.
6. REQUIREMENTS.md: add R-2020 and R-2022 to R-2026 after R-1036 (FEAT-013 SUB-013), and R-2021 after R-952 (FEAT-015). Add R-2023 and R-2024 to FEAT-015's Also applies line. Rows start untested and flip to implemented with file::title evidence once green.
7. Run npm run map and npm run req:tree. Then run npm run map:check, npm run readme:check, node scripts/requirements-trace.mjs and node packages/nana-pack/tests/requirements-tree.test.mjs.

## Tests: new packages/nana-setup/tests/pi-launch-limits.test.mjs
- Fixture: on POSIX the pi is a `#!/bin/sh` script that runs `node hang.cjs "$@"`, then `exit $?` on the next line, so no shell can exec node. On win32 it is pi.cmd `@"<node>" "%~dp0hang.cjs" %*`. hang.cjs appends its pid and ppid to a pids file and answers --version with 1.0.2. In its hanging mode it starts one child node with stdio inherit that records its own pid; both then sleep HANG_MS, as post-edit-hardening's tree fixture does. Named at the top: LIMIT_MS 3000, HANG_MS 12000, BOUND_MS 9000, PID_POLL_MS 2000. Set and restore PATH as the R-358 check does. Use the layout {...resolveLayout({home}), isRealHome: true} and the platform () => process.platform.
- Seven checks, titles exactly as in must-meet. Each `check("R-20nn: …", …` sits on the line directly under its `// req: R-20nn`. Every check except R-2024 imports names and never states the literals.
- R-2022 builds the expected folder from paths.mjs's repoRoot, never from the test file's location.
- R-2023 covers four stops: install, the dry run and doctor on a hung --version, and install on a hung pi install. It fails unless the wrapper or cmd.exe, pi and pi's child each recorded a pid and the step reported the stop row.
- R-2024 uses a recording spawn with no limits injected. R-2025 uses a recorder that logs PI_CODING_AGENT_DIR, with the ambient value deleted. R-2026 runs stepPiRegister in a detached wrapper node and sends SIGINT, SIGTERM and SIGHUP to its group, one per run. On win32 it prints SKIP with its reason.
- These must stay green: pi-registration.test.mjs and doctor-runtime.test.mjs.

## Wrong code to try (each must turn the named check red; revert after; never spell a pi launch as spawn("pi" in any docs/reviews .mjs)
1. Relay replaced by spawnSync({timeout, killSignal:"SIGKILL"}): R-2023.
2. Child spawned non-detached: R-2023 on POSIX.
3. ETIMEDOUT branch dropped in stepPiRegister: R-2020 and R-2022. Dropped in diagnose: R-2021.
4. Dry run launches without a timeout: R-2020.
5. Install uses limits.version, or version is set to 60_000: R-2024.
6. Relay's spawnSync omits env: R-2025.
7. SIGHUP handler removed, SIGINT and SIGTERM kept: R-2026. All handlers removed: R-2026.
8. Relay drops error.code: doctor-runtime's "install missing-pi detail imports the same hint and never reaches install".
9. Relay drops stdout: doctor-runtime's "pi executable reports a dotted version".
10. win32 taskkill replaced by child.kill: R-2023, on the Windows CI leg only.

## Done
All seven checks pass on macOS. Wrong codes 1 to 9 each turn their check red on macOS. The two existing files stay green. map:check, readme:check, requirements-trace and the requirements-tree test are green. The new modules carry the six-tag header. No inline tunables.

## Report (≤ 10 lines)
Tip SHA. Seven checks pass/fail. Wrong-code results (n/9 red on macOS). Existing files green. map, tree, readme and trace green. Relay overhead in ms per launch. Any deviation from this brief and why. Open questions.