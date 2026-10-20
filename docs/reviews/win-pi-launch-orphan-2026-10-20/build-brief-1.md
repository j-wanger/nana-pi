# win-pi-launch-orphan: build brief 1 (BRANCH 1)

Feature: FEAT-013 · Install and connect harness runtimes. Class: install, hook or gate. Builder: pi-worker. Threat model and rows: must-meet.md.
Probe answer: BRANCH 1, CI run 39437686060 (`win-orphan-probe-output.txt`): today's Command Prompt route leaves pi and its child alive 5 s after install or the relay is killed; the direct Node route ends relay, pi and child within about 50 ms in every phase. R-2303 holds. This brief holds only for BRANCH 1; for another branch the seat writes a new one. If the probe said the relay kill leaves pi, drop R-2303 and its test.

## Change
1. New `packages/nana-setup/lib/pi-invocation.mjs` with the six-tag header. Export `piInvocation(pi, args, { win32, env, cwd, exists, isFile, readText })`, which returns `{ command, args, options }` or `{ refused }`.
   - Off win32: `{ command: pi, args, options: {} }`.
   - On win32: `piLaunch(args, { platform: "win32", env, cwd, exists, isFile, readText })` from `../../nana-pack/bin/pi-watchdog.mjs`. A command comes back with `options: {}`.
   - On any piLaunch refusal: return `winCommand(pi, args, { comspec })` exactly as today, with ComSpec's key matched case-insensitively. Never surface piLaunch's refusal.
   - Do not move or change piLaunch (review-launch.mjs imports it from pi-watchdog).
2. `lib/steps.mjs` stepPiRegister launches through piInvocation and adds `isFile` and `readText` beside `exists`. Keep its rows, limits, agent-folder env and the dry run's stop.
3. `lib/doctor.mjs`: the pi block launches through piInvocation and drops its inline ComSpec block; `opts.pi` gains `isFile` and `readText`.
4. Do not change `bounded-spawn.mjs` or `bounded-spawn-child.mjs`.
5. REQUIREMENTS.md: add R-2300 to R-2303 after R-2133 in must-meet's text. R-2300 and R-2303 read `untested` (written; Windows leg only). Reword R-1034, R-1035 and R-1690 as must-meet gives, each with a note naming this lane. Run `npm run req:tree`.
6. Setup README: in the Windows lookup paragraph, an npm `pi.cmd` starts its package's Node entry and any other `.cmd` or `.bat` runs through ComSpec. In Idempotence, on Windows an npm pi also ends when install is killed. Add must-meet's list to Known limits.
7. Update the steps.mjs and doctor.mjs headers (@inputs gain pi's npm package.json). Run `npm run map`.

## Tests (pi-launch-limits.test.mjs only; header check count from 13 to 17)
- R-2301 and R-2302 follow R-2024's recorder pattern: install, the dry run, then doctor. Use platform win32, PATH `C:\npm`, ComSpec set, an injected `exists` for `C:\npm\pi.cmd`, and injected `readText` and `isFile`. Build the package path from `PI_PACKAGE` and `PI_BIN_NAME` (worker-config.mjs), with no literals.
  - R-2301: every call's command is process.execPath, args[0] is the entry with the pi arguments after it, and there is no `windowsVerbatimArguments`. Timeouts are `PI_LAUNCH_LIMITS_MS`, and each pi install carries install's `PI_CODING_AGENT_DIR`.
  - R-2301, one more install run: pass `manifestRoot` = a temp folder whose name holds `%` and `!`, with a package.json listing `pi.extensions`. It must read created, and its pi install argument must equal that folder's package path unchanged.
  - R-2302 has three cases: no package; a package.json naming another package; the pi package whose entry `isFile` denies. Every call goes to ComSpec with `/d /v:off /s /c`.
- R-2300: give `makeFixture` an `npm` option. On win32 it writes `bin\node_modules\<PI_PACKAGE>\package.json` (name PI_PACKAGE, bin `{ [PI_BIN_NAME]: "cli.js" }`), a `cli.js` holding the hang body, and `bin\pi.cmd` running `"<process.execPath>" "%~dp0node_modules\<package>\cli.js" %*`. Let `observeParentKill` take that option and run it with `group: false`. Off win32, return `{ skip }`. Marker: `// req-candidate: R-2300 (Windows only; becomes req: when the Windows CI leg passes it)`.
- R-2303: the same fixture. Kill the recorded pi's parent (the relay), then wait for pi and its child to end within `PARENT_KILL_BOUND_MS`. Off win32, skip. Use the same marker form.
- Leave every existing check and fixture as it is. Put each check title on the line directly under its marker.

## Wrong code to try (revert each; report red or green)
1. piInvocation always takes the ComSpec route: R-2301.
2. A piLaunch refusal is returned as a refusal: R-2302.
3. The direct route drops `timeout`: R-2301.
4. The direct route drops install's `PI_CODING_AGENT_DIR`: R-2301.
5. Doctor keeps its own ComSpec block: R-2301.
6. The direct route keeps `windowsVerbatimArguments`: R-2301.
7. piInvocation applies winCommand's character refusal before piLaunch: R-2301.
8. The fallback returns piLaunch's entry-file refusal instead of falling back: R-2302.
The seat runs two more on the Windows leg: the relay starts pi detached on win32 (R-2300, R-2303), and install starts the relay detached on win32 (R-2300).

## Done
On this Mac, pi-launch-limits shows R-2301 and R-2302 PASS and R-2300 and R-2303 SKIP. Every existing check passes, R-2130, R-2131 and R-2133 included. pi-registration, doctor-runtime, win-command and win32-launch pass. map:check, readme:check and the trace rail are green.

## Report (10 lines or fewer)
VERDICT: BUILT or BLOCKED · commit sha · per-file PASS/SKIP/FAIL counts · wrong code n/8 red, survivors named · row statuses and rewordings · map, readme and trace results · README sections touched · anything unverified.
