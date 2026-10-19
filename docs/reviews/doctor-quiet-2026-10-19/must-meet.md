# doctor-quiet — must-meet

Feature: FEAT-015 · Diagnose the active environment
Class: install, hook or gate (changes `nana-setup doctor` output). Full ladder: final reviewer, land reviewer (or `seat-land.md` when the roster prints `land: seat`), wrong-code pairs, one independent check. Run `node packages/nana-setup/bin/install-check.mjs` locally before `nana-land`.
Threat model: honest variation is in scope: Node versions, platforms (macOS, Linux, Windows), project configs and the caller's environment (`NODE_OPTIONS`, `NODE_NO_WARNINGS`, `--trace-warnings`). Deliberate forgery of a warning's name, code or message is out of scope; a finding there is a residual.

Feature sentence: `nana-setup doctor` writes neither of the two Node warnings its own checks trigger, so its summary line is the last thing it prints, while any other Node warning still prints.

## Today (probed on main dbbba7e, Node 22.22.2, macOS, temp home)
- On every run, `knowledgeIndexState` requires `node:sqlite`. So stderr carries `(node:<pid>) ExperimentalWarning: SQLite is an experimental feature…`.
- When the working folder holds `.pi/nana-pack.json`, the project-trust check requires the pack's `lib/objective.ts`. Its import of `gate-paths.ts` adds a four-line `[MODULE_TYPELESS_PACKAGE_JSON] Warning`, because the pack's package.json declares no module type.
- Node delivers both warnings through the process `warning` event after `runDoctor` returns. So in a terminal they print after the summary line.
- Windows and Linux: inferred, not run. Both warnings come from Node code that is the same on every platform.

## Design
- In `packages/nana-setup/bin/nana-setup.mjs`, `runDoctor` first calls one named function. The function:
  - saves `process.listeners("warning")` and removes them;
  - adds one listener that drops a warning named `ExperimentalWarning` whose message matches /SQLite/, and a warning whose code is `MODULE_TYPELESS_PACKAGE_JSON`;
  - hands every other warning to the saved listeners unchanged. So Node's printer, `--trace-warnings`, `--redirect-warnings` and `--no-warnings` behave as today (the first and last probed).
- The function reads `process` directly, because nothing imports the bin, which runs `main` when loaded.
- The muted set is one named constant. Its provenance comment says: contract values probed 2026-10-19 on Node 22.22.2, rows R-1750 and R-1751. Prior art: the same predicate in `loadSqlite` in `packages/nana-knowledge/lib/db.ts`.
- The filter stays installed until the process exits. Restoring the listeners after `diagnose()` lets both warnings through (probed).
- `lib/doctor.mjs`, its rows, doctor's stdout and its exit codes do not change (probed: stdout byte-identical, exit code unchanged). The other commands keep today's behavior.
- Rejected:
  - `"type": "module"` in the pack's package.json. It changes how pi, the desk and every test load the pack's .ts files, so it needs its own lane.
  - Re-running doctor under `--no-warnings` or `NODE_NO_WARNINGS=1`. That mutes every warning and fails R-1752.
  - Setting `NODE_NO_WARNINGS` at runtime. Node reads it only at startup (probed).

## Must-meet
All three tests live in the new file `packages/nana-setup/tests/doctor-quiet.test.mjs`.
- Each test spawns `process.execPath [Node options] packages/nana-setup/bin/nana-setup.mjs doctor --home <scratch home>` inside `withPiStub`. The working folder is a scratch folder.
- The test deletes `NODE_OPTIONS`, `NODE_NO_WARNINGS` and `NODE_REDIRECT_WARNINGS` from the child's environment.
- "No Node options" means no flag before the script path and no `NODE_OPTIONS`.
- A Node warning line is a stderr line matching `^\(node:\d+\) `.
- Each test also checks that doctor ran. R-1750 and R-1752 look for the `nana-setup doctor` banner on stdout, and R-1751 looks for the `project trust` row. Without this, a crashed doctor would pass the mute tests.

| Row | Requirement | Test | Red today |
|---|---|---|---|
| R-1750 | WHEN `nana-setup doctor` runs with no Node options in a folder with no `.pi/nana-pack.json`, THEN doctor shall write no Node warning line to stderr. | `packages/nana-setup/tests/doctor-quiet.test.mjs::doctor in a folder without project config writes no Node warning` | RED (probed): stderr carried the SQLite ExperimentalWarning. |
| R-1751 | WHEN `nana-setup doctor` runs with no Node options in a folder whose `.pi/nana-pack.json` makes it check project trust, THEN doctor shall write no Node warning line to stderr. | `packages/nana-setup/tests/doctor-quiet.test.mjs::doctor in a folder with project config writes no Node warning` | RED (probed): stderr carried the typeless warning naming gate-paths.ts, plus the SQLite warning. |
| R-1752 | IF a Node warning other than the SQLite ExperimentalWarning or a MODULE_TYPELESS_PACKAGE_JSON warning is emitted while `nana-setup doctor` runs with Node's default warning output, THEN doctor shall write that warning to stderr. | `packages/nana-setup/tests/doctor-quiet.test.mjs::doctor still prints a Node warning it does not mute` | GREEN today by design; it guards against a blanket mute. See the note below the table. |

How the R-1752 test works:
- It passes `--import <file URL of a scratch preload>` as a Node option, not through NODE_OPTIONS.
- The preload wraps `process.stdout.write`. On the first write that contains the plain text `nana-setup doctor`, it emits two warnings: an ExperimentalWarning with a non-SQLite message, and a Warning with code `NANA_DOCTOR_QUIET_PROBE`.
- The test asserts that both messages reach stderr.

Each wrong code turns the named test red. All were probed on a patched temp clone with this test file.
- Restore the listeners in a `finally` after `diagnose()`: R-1750 and R-1751.
- Mute only the SQLite warning: R-1751.
- Call `process.removeAllListeners("warning")` without forwarding: R-1752.
- Drop every `ExperimentalWarning` by name: R-1752.
- Drop by `name === "Warning"` instead of by code: R-1752.
- Set `process.env.NODE_NO_WARNINGS` at runtime: R-1750 and R-1751.

## Known limits (residuals once landed)
- `nana-setup project` and `project --check` still print the typeless warning, naming `config.ts`. A later fix is the same call in `runProject`, or declaring the pack's module type.
- The pack's package.json still declares no module type, so tests and CI logs keep the typeless warning.
- The SQLite predicate exists twice, in the doctor CLI and in the knowledge db module. Sharing it would cross a component boundary.
- The mute drops any MODULE_TYPELESS_PACKAGE_JSON warning during doctor, not only the pack's. Doctor loads no module outside the repo.
- A warning that a preload emits before `runDoctor` starts prints as it does today.
- The rows are pinned on Node 22, which the probe and CI both use. A Node version whose type stripping still warns, inferred to be 23.x and early 24.x, would turn R-1751 red there. Not probed.