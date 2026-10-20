# project-check-quiet — must-meet

Feature: FEAT-014 · Create or adopt a project workspace (home: SUB-021 · Check readiness and ratify the objective)
Sentence: `nana-setup project <dir> --check`, run with Node's default warning output, writes no MODULE_TYPELESS_PACKAGE_JSON or SQLite ExperimentalWarning line to stderr, with or without project config. It still writes every other Node warning.
Class: ordinary. The change is in the `project --check` branch of the CLI, plus a comment and the CLI's header. It makes no change to install, uninstall or doctor. It touches no hook, pi extension, gate or land/review tool. The lane touches packages/nana-setup/, so the seat runs install-check on macOS before nana-land.
Threat model: honest variation is in scope: Node 22.x patch levels on macOS, Linux and Windows; folders with and without project config; preloads that emit their own warnings. Deliberate forgery is out of scope. For example, a preload that forges a MODULE_TYPELESS-coded warning is dropped by the mute, the same residual doctor has.

## Problem (probed on main 6f07daee, temp clone, temp home, Node 22.22.2)
- `project <dir> --check` writes `(node:N) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of …/packages/nana-pack/lib/config.ts is not specified …` to stderr.
- This happens in a folder with project config, a folder without it, and a bare folder.
- checkProject imports the pack's config.ts on every run. It also imports objective.ts when `.pi/nana-pack.json` exists.
- Node warns once per package scope, so only config.ts is named.
- The seeding run and `trust` print nothing. The HANDOFF residual's "project command" half does not reproduce.
- All three adopt skills close on this check (R-1670), so every adoption ends on the warning. Seeding writes `.pi/nana-pack.json`, but a folder whose config was omitted on purpose has none.

## Design
- `muteDoctorWarnings();` becomes the first statement of runProject's `if (opts.check)` branch in packages/nana-setup/bin/nana-setup.mjs.
- This reuses the sealed DOCTOR_MUTED_WARNINGS list (R-1750/R-1751 contract values). No new tunable, no filter change, no rename.
- R-2050 is added to the list's provenance comment.
- The CLI header's @outputs and @effects widen from doctor to "doctor and project --check".
- Checks go in doctor-quiet.test.mjs, which already has the sanitized-env spawn, warningLines and the preload pattern. Its @purpose widens to doctor and project --check.
- Why two folder checks: Node delivers the warning only after the check's async chain finishes, so a mute installed anywhere before the event loop yields still silences it. A mute gated on project config therefore passes a with-config check (probed, M6 and M7). Only a folder without config catches it.
- Rejected: declaring `"type": "module"` in the pack's package.json. It changes how every pack file loads, including doctor's `require()` of objective.ts and pi's extension loader, and would make this an extension lane.

## Must-meet tests (all in packages/nana-setup/tests/doctor-quiet.test.mjs)
| Row | Requirement | Test title | Red today? |
|---|---|---|---|
| R-2050 | WHEN `nana-setup project <dir> --check` runs with no Node options on a folder whose `.pi/nana-pack.json` makes it check project trust, THEN the check shall write no Node warning line to stderr. | `project --check in a folder with project config writes no Node warning` | RED, probed: the config.ts warning is on stderr. It passes with the fix. |
| R-2051 | IF a Node warning other than the SQLite ExperimentalWarning or a MODULE_TYPELESS_PACKAGE_JSON warning is emitted while `nana-setup project <dir> --check` runs with Node's default warning output, THEN the check shall write that warning to stderr. | `project --check still prints a Node warning it does not mute` | GREEN by design: nothing is muted today. Red under M2, probed. |
| R-2052 | WHEN `nana-setup project <dir> --check` runs with no Node options on a folder with no `.pi/nana-pack.json`, THEN the check shall write no Node warning line to stderr. | `project --check in a folder without project config writes no Node warning` | RED, probed: the same config.ts warning. It passes with the fix. |

## Wrong code (probed in a temp copy; doctor's three checks stayed green in every case)
- M1, no call (today's code): R-2050 and R-2052 red.
- M2, `process.removeAllListeners("warning")` in place of the call: R-2051 red.
- M3, the call moved to just before `refuseIfDismissed(dir)`: R-2050 and R-2052 red.
- M4, `process.env.NODE_NO_WARNINGS = "1"` at runtime in place of the call: R-2050 and R-2052 red.
- M5, a local listener that drops only the SQLite ExperimentalWarning: R-2050 and R-2052 red.
- M6, the call made only when `<dir>/.pi/nana-pack.json` exists: only R-2052 red.
- M7, no CLI call, plus a MODULE_TYPELESS-only listener added inside lib/project.mjs's `if (pack.ok)` trust branch: only R-2052 red.
- Not wrong code: the call placed after `await checkProject(...)` stays quiet, because of the late delivery. Probed.

Cross-platform: no skip. The CI Windows suite leg (Node 22.23.3) prints the same coded warning for the pack's .ts modules, and doctor-quiet passes there with no skip. That this exact command is red then green on Windows is inferred; the lane tip's Windows leg confirms it.
win-config-json-path overlay: its config.ts, json-text.mjs and objective.ts were placed on the unfixed CLI. R-2050 stays red without the fix and green with it (probed).

Full-change probe (fix, three rows, header, README, tree and map regenerated):
- doctor-quiet: 6 checks pass.
- trace: 0 EARS rows off form.
- requirements-tree test passes; map:check and readme:check report 0 problems.
- project (123), entry-guidance and relative-agent-dir pass.

## Known limits
- The root cause stays. The pack declares no module type, so test runs, CI logs and other entry points still print the warning. This is the existing HANDOFF residual.
- During --check the mute drops every MODULE_TYPELESS warning, not only the pack's. config.ts also starts a background import of pi's package. In a checkout that import fails and is caught, because pi is installed globally only. If a machine made pi's package resolvable, any warning it emitted outside the two muted kinds would print.
- The shared mute's listener caveats carry over unchanged. A once-listener fires on every warning, and saved listeners run without `process` as `this`. A warning a preload emits before the check starts still prints.
- No row pins the seeding run. It is quiet today, and only an added .ts import would turn a pin red.
- No row stops the mute from spreading to other commands. That would change install, doctor or trust and belongs in another lane.
- Pinned on Node 22 only. The same Node 23 and early-24 inference applies as for doctor.
- The seat rewrites the HANDOFF residual "the project command and its check still print…" in the reviewed change.