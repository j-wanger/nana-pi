# win-pi-launch-orphan: must-meet

Feature: FEAT-013 · Install and connect harness runtimes
Class: install, hook or gate (changes how nana-setup install, its dry run and doctor launch pi). Under BRANCH 3 it shrinks to a tests-only pin, which is ordinary.
Sentence: on Windows, if install alone is killed while it waits on a launch of an npm-installed pi, every process that launch started ends within the relay's parent-check interval plus its signal grace, well before the launch limit.
Threat model: honest process deaths are in scope: Task Manager's end task, a parent tool's or CI's kill of install, and install's backstop kill of an overrunning relay. npm, pnpm, Volta and pi.dev layouts, and checkout paths holding `%` or `!`, are in scope. A pi that deliberately leaves its job (`start`, a detached child, job breakaway) is out.

## Step one: the seat's Windows probe, before any build
The seat commits `win-orphan-probe.mjs` to this folder on a scratch branch and runs `node <it>` from the repo root on a scratch windows-latest CI job (Node 22; no pi needed). It starts install's relay as `stepPiRegister` does, then kills install alone, or the relay alone, under today's Command Prompt route (relay, cmd.exe, pi, pi's child) and a direct Node route (relay, pi, pi's child). It prints when each process died within a 5-second watch. Its last line names the branch:
- BRANCH 1 (expected): the relay dies with install, and the direct route ends pi and its child. Build design (a). If the line says the relay kill leaves pi, drop R-2303.
- BRANCH 2: the relay outlives install. Build only a win32 parent check in the relay: on ESRCH from `process.kill(parentPid, 0)`, take its SIGINT path, which ends in taskkill /T /F. Rows: R-2300 only, reworded for every pi.
- BRANCH 3: today's route already ends everything. Tests only (ordinary). Pin R-2300 on today's code.
- BRANCH 0 or 4: stop and return to the seat.
On macOS the probe's direct-route phases ran clean (2026-10-20). Its Windows phases have not run.

## Why design (a) should work (read in libuv's Windows process code, not yet run)
- Node puts each non-detached child, spawnSync's included, into a kill-on-close job. It also adds the spawning process to that job, so the relay's job nests inside install's.
- That job allows silent breakaway, so a process that cmd.exe starts joins no job. Today a kill of install ends the relay and cmd.exe at once. The pi cmd.exe started runs on with no limit, because no relay is left to stop it.
- A pi the relay starts itself joins the relay's job; pi's own Node children join pi's job. All of them nest in install's job, so they end when install or the relay dies.

## Design (a), BRANCH 1
A new `packages/nana-setup/lib/pi-invocation.mjs` picks the launch. Off win32 it starts pi by name, as today. On win32 it calls pi-watchdog's `piLaunch` (R-1125), imported, not moved: review-launch.mjs imports it from pi-watchdog. When the npm package resolves, the launch is `<running node> <entry> <args>`, with no ComSpec. Any piLaunch refusal falls back to today's ComSpec route through `winCommand` (R-1034/R-1035); the fallback never adds a refusal. `steps.mjs` and `doctor.mjs` both call the new module, so doctor's duplicate ComSpec block goes. Injection gains `isFile` and `readText` beside `exists`. The relay files do not change.
Reworded rows (carry requirements-moved output):
- R-1034: "WHERE the platform is win32, WHEN the installer or doctor runs a located `.cmd` or `.bat` pi through ComSpec that R-1035 does not refuse, it shall pass `/d /v:off /s /c` and one quoted command line wrapping the pi path and every argument separately."
- R-1035: "IF win32 would run a `.cmd` or `.bat` pi through ComSpec while its path or an argument contains a double quote, `%`, `!`, CR, LF or NUL, or an argument ends in backslash, THEN" + the rest unchanged.
- R-1690: insert "with no npm package beside it" after "a `.cmd` pi"; the rest unchanged.
Their tests stay green unchanged: no fixture they use has the pi npm package beside its shim, so each takes the fallback.

## Must-meet (all in packages/nana-setup/tests/pi-launch-limits.test.mjs)
| Row | Requirement | Test title | Red today |
|---|---|---|---|
| R-2300 | WHERE the platform is win32, IF install alone is killed while it waits on a pi launch that R-2301 describes, THEN every process that launch started shall end within the relay's parent-check interval plus its signal grace. | R-2300: on Windows, a kill of install alone ends the npm pi launch it waits on within the parent check and the signal grace | Inferred, Windows only: today pi and its child outlive the kill. Probe phases A and A2 settle it. `req-candidate`; SKIP off Windows. |
| R-2301 | WHERE the platform is win32, WHEN install, install --dry-run or doctor launches a located `.cmd` pi whose npm package resolves as R-1125 describes, it shall start that package's pi bin entry with the Node running it, the pi arguments unchanged and that launch's time limit and environment, without ComSpec. | R-2301: on win32, install, its dry run and doctor start an npm pi.cmd's package entry with the running Node, its limit, install's agent folder and a checkout path holding % and ! unchanged, never through ComSpec | Yes. Adversary probe, temp folder, 2026-10-20: install's three launches, the dry run's one and doctor's one all went to cmd.exe with `/d /v:off /s /c`; with a `%`/`!` checkout path, install read "pi install refused: refused character %". |
| R-2302 | WHERE the platform is win32, IF a located `.cmd` pi has no npm package that resolves as R-1125 describes, THEN install, install --dry-run and doctor shall launch that pi through ComSpec as R-1034 and R-1035 describe. | R-2302: on win32, a pi.cmd with no npm package beside it, another package there, or the package's entry missing still runs through ComSpec in install, its dry run and doctor | No: it pins today's fallback. Wrong code 2 and 8 turn it red. |
| R-2303 | WHERE the platform is win32, IF the pi launch relay alone is killed while it runs a pi that R-2301 starts, THEN that pi and every process it started shall end within the relay's parent-check interval plus its signal grace. | R-2303: on Windows, a kill of the pi launch relay alone ends the npm pi it runs and pi's child within the parent check and the signal grace | Inferred, Windows only: today the kill reaches cmd.exe and pi lives on. Probe phases C and D settle it. `req-candidate`; SKIP off Windows. Closes the relay-overrun residual for npm pi. |
Regression guard, no new row: POSIX R-2130, R-2131, R-2133 and every existing check pass unchanged. On win32 those checks keep their Command Prompt fixture, so they now pin the fallback with real processes.
Platform skips: R-2300 and R-2303 cannot run off Windows; the job rule and the npm Node-entry route exist only there.
Seat check before land: the Windows install-check job on the lane tip reads pi packages ✓ and doctor's pi executable ✓. That job runs a real npm pi 1.0.2 through the direct route for the first time.

## Known limits (README Known limits and HANDOFF)
- A pi.cmd with no resolvable npm package (pi.dev installer, pnpm, Volta) keeps the Command Prompt route. A kill of install alone, or of the relay alone, still leaves that pi running.
- Ctrl-C on Windows: install has no Ctrl-C handler, so an npm pi now ends with install and its own cleanup can be cut short. Inferred, not run. pi holds its settings lock only around a write, and treats a leftover lock as stale after about 10 seconds. No Ctrl-C row (R-2026, R-2027, R-2133) covers Windows.
- pi runs on the Node that runs install, as the launchers do (R-1125), not on a node.exe beside the shim.
- A process that pi starts through Command Prompt (npm, for a registry package) leaves the job chain. A local folder install starts none.
- Doctor gets the same route, but no check kills doctor alone.
- On macOS and Linux, a kill of the relay alone still leaves pi running. This lane does not change that.
- R-2300 and R-2303 stay untested until the seat sees them pass on the Windows CI leg.
