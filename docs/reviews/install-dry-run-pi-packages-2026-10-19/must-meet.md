# install-dry-run-pi-packages: must-meet

Feature: FEAT-013 · Install and connect harness runtimes (SUB-014 · Preserve files and preview installation changes)

The feature in one sentence: `nana-setup install --dry-run` gives the pi packages step the status, detail and exit code that install gives it whenever install decides the step before its first `pi install`, says `would add` otherwise, and never starts `pi install`.

Class: install, hook or gate. The lane changes stepPiRegister in nana-setup install. It gets the land reviewer, the seat's wrong-code pairs and one independent check. The seat runs the macOS install check before nana-land.

Threat model: honest variation is in scope: macOS, Linux and Windows on Node 22; --home test homes; pi missing from PATH; a Windows pi shim or checkout path holding a character the launcher refuses; a pi whose version check fails or cannot start. Deliberate forgery is out, for example a pi built to pass --version and then lie.

## Today (temp clone of main d4423eff, temp HOME, macOS, Node 22, pi 1.0.2)
- Under --home, install prints `– pi packages skipped not registered (--home override in play)`; the dry run prints `+ pi packages created would add per-package entries for …`.
- On a temp real home (HOME set, no --home) with nana unregistered: with no pi on PATH, the dry run says `would add`, exit 0, where install says skipped with the pi install hint. With a pi whose --version exits 2, the dry run says `would add`, exit 0, where install says ✗, exit 1.
- The Idempotence section already promises "`--dry-run` reports the same ✗ and exits 1 with it". This step breaks that.
- Cause: the dry-run return sits above the --home check and every pi check in stepPiRegister.

## Design (3 lines in stepPiRegister)
1. Delete the early dry-run return.
2. In `launch`, right after `if (command.refused) …`, add `if (install && o.dryRun) return { status: 0 };` under a one-line comment: the dry run stops here, before the first `pi install`, after every check install runs.
3. The final return's detail is today's `would add per-package entries for <missing>` under dryRun, else today's `added per-package entries: …`.
The dry run now walks install's own lines: --home, pi lookup, `pi --version`, each package root's launch refusal. It stops where install would spawn `pi install`. One path, so the two cannot drift.
Trade: on the real home with nana unregistered, a dry run now starts `pi --version` (0.16 s here). Doctor already runs that probe. pi's main first does its own housekeeping (a managed-install staging cleanup in pi's install folder; on Windows a self-update quarantine cleanup). That touches pi's folder, never a nana target. Under a temp HOME it wrote nothing.
4. nana-setup README: in Idempotence, after "`install --dry-run` reports the same decisions and writes nothing.", add one sentence: on the real home the dry run's pi packages step runs install's own pi checks, `pi --version` included, and stops before the first `pi install`, so it cannot foresee a `pi install` failure. The `tests/pi-registration.test.mjs` table cell adds the dry-run decisions.
No new tunable, module or header change; the steps.mjs header already names `pi --version` / `pi install`.

## Must-meet (all in packages/nana-setup/tests/pi-registration.test.mjs)
| Row | Requirement | Test title | Red today |
|---|---|---|---|
| R-391 | WHILE --home is in force and an extension directory is unregistered, the pi packages step shall report skipped (--home override in play). (narrowed in place: the old text overclaimed, since a registered --home reports unchanged, as R-323's check pins) | R-391: under --home with an unregistered extension directory, install and install --dry-run both report the pi packages step skipped (--home override in play) | Red: the dry run prints created would add (probed) |
| R-358 | WHILE --home is in force, pi install shall not be run. (verbatim) | R-358: under --home, install and install --dry-run start no pi install while a working pi is first on PATH | Pin: green; W2, W7, W8 red it (probed) |
| R-1930 | IF an extension directory is unregistered, no home override is in force and pi is not on PATH, THEN install --dry-run shall report the pi packages step skipped with the pi install hint that install reports. | R-1930: with pi not on PATH, the dry-run pi packages step reports skipped with the pi install hint, as install does, on darwin and win32 | Red: both platforms say would add (probed) |
| R-1931 | IF install would report the pi packages step ✗ before it starts any pi install, THEN install --dry-run shall report the same ✗ and exit 1. | R-1931: when install would report the pi packages step ✗ before any pi install, the dry run reports the same ✗ and exits 1 | Red: all four cases say created, exit 0 (probed) |
| R-1932 | WHEN pi on PATH answers its version check and an extension directory is unregistered, install --dry-run shall start no pi install. | R-1932: with a working pi on PATH and an unregistered extension directory, the dry-run pi packages step reports would add and starts no pi install | Guard: green; W3, W10 red it (probed) |

How the tests work:
- Two new blocks just before the final R-392 manifest check. A recording pi (record.cjs plus `pi`, or `pi.cmd` on Windows, built as the R-323/R-1690 block builds it) logs argv and prints 1.0.2 for --version. Swap process.env.PATH so it comes first and restore it in finally. Never pass an env copy: on Windows it would carry both Path and PATH.
- R-391 and R-358: run install and install --dry-run through the CLI, each on its own `piHomeWith(null)` --home. R-391 matches the step's row in both stdouts. R-358 needs no logged argv starting with `install` from those runs. It also needs an anchor under the same swap: stepPiRegister with isRealHome forced true and `platform: () => process.platform` reports created and logs an `install` argv, so the pin cannot pass on an unreachable stub.
- R-1930 to R-1932: call stepPiRegister without and with dryRun on an injected real-home layout over a fixture manifest with two package roots, with injected platform, env, exists, manifestRoot and a recording spawn. R-1930 and R-1931 need the dry result JSON-equal to install's and check the status. R-1931 also needs installExitCode(dry) === 1 and no dry spawn carrying `install`.
- Cases: R-1930 darwin ENOENT and win32 with no pi found. R-1931 win32 shim under `C:\%bad`, win32 fixture root whose folder name holds `!`, darwin --version exit 2, darwin EACCES (one case per ✗ line before the loop). R-1932 working pi on darwin and on win32.
- No skip: the unit checks inject the platform, and the CLI block runs natively on every leg.

## Wrong code (each applied alone to the prototype, probed red, restored)
- W2 delete the --home check → R-391, R-358. W3 drop the dry guard in launch → R-1932. W4 dry-run return right after the --home check → R-1930, R-1931. W5 the same after `if (!pi)` → R-1930, R-1931. W6 guard above the refusal check → R-1931. W7 --home check only when dryRun → R-391, R-358. W8 under --home spawn `pi install`, report skipped → R-358. W9 guard on `o.dryRun` alone, so the dry run spawns nothing → R-1930, R-1931. W10 dry-run detail `added …` → R-1932.
- Prototype: pi-registration exits 0 (+0.7 s). install, doctor-runtime, settings-merge, retired-artifacts, relative-agent-dir, desk-service and stale-copies exit 0. Forced NANA_SETUP_PLATFORM=win32 shows only main's existing R-323 FAIL. Trace 0 rows off EARS form; map:check and readme:check exit 0; requirements-moved: no tree movement; code map unchanged.

## Known limits
- The dry run cannot foresee a `pi install` failure; it says would add there.
- The real-home CLI dry run is pinned through injection only; the temp-HOME CLI probe above is macOS evidence, not a test.
- Native Windows is inferred from the injected win32 checks and the R-1690 pi.cmd recorder; the Windows CI leg is the evidence.
- R-313 against R-926 (a held lock: dry run exits 0, install exits 2) stays the owner's call. R-315 and R-383 are the CLI's no-prompt and --yes contract, not this step.
- Seat duties: remove HANDOFF's "Install dry run (install-pins)" residual in the reviewed change; run requirements-moved and carry its output in the final review and the land; write seat-mutate.mjs with W2 to W10; run the macOS install check before nana-land.