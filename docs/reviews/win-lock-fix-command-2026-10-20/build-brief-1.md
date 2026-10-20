# win-lock-fix-command: build brief 1
Feature: FEAT-013 · Install and connect harness runtimes. Class: install, hook or gate. Threat model: honest variation in home paths (a space, straight and typographic apostrophes, non-ASCII, `$`, a backtick, brackets) and in the shell (sh, Command Prompt, Windows PowerShell). Forgery is out.
Builder: pi gpt-5.6-sol through pi-worker, working in ~/nana-pi-wt/win-lock-fix-command on feat/win-lock-fix-command. Follow packages/nana-pack/prompts/builder-preamble.md. Run single test files only. Never edit HANDOFF.md or docs/sessions/. Plan of record: docs/reviews/win-lock-fix-command-2026-10-20/must-meet.md.

## Change
1. New packages/nana-setup/lib/settings-lock.mjs, with the six-tag header and @effects disk. It exports:
   - `SETTINGS_LOCK_NAME`, with its provenance: a contract value from the README settings.json section.
   - `settingsLockPath(file)`.
   - `lockHolder(lock)`, today's pid and age read, moved verbatim.
   - `removalCommands(lock, platformName)` → [{shell, command}].
   Off win32 it returns [{shell:"sh", command:`rm ${shq(lock)}`}]; import shq from settings.mjs and never copy it. On win32 it returns [{shell:"Command Prompt", command:`del "<lock>"`}, {shell:"PowerShell", command:`Remove-Item -LiteralPath '<lock>'`}], with each of U+0027, U+2018, U+2019, U+201A and U+201B doubled.
2. steps.mjs `withSettingsLock`: use settingsLockPath and lockHolder, and pass `platform()` from paths.mjs. Replace only the final `  rm ${lock}` line.
   - Off win32 print `  <command>`.
   - On win32 print four lines: `  in Command Prompt:`, `    <del command>`, `  in PowerShell:`, `    <Remove-Item command>`. Never put a label on a command's line.
   - Put the import on its own line directly after the settings.mjs import. Do not touch the header export list or stepPiRegister, which pi-probe-timeout edits.
3. doctor.mjs: add one `settings lock` row right after the "Claude Code hooks floor" note and before the retired-hook loop. Read the lock with lstatSafe.
   - ✓ reads `no leftover lock`.
   - ✗ reads `<lock> is left over (<lockHolder>) — install will not run until it is removed; if no nana-setup is running, remove it: <fix>`.
   - Off win32, `<fix>` is the rm command. On win32 it is `in Command Prompt: <del> — or in PowerShell: <Remove-Item>`.
   - Give the row no installLabel. Put the import on its own line after the hook-health import, and add "the settings lock" to @inputs. Do not touch @effects or the pi probe block (pi-probe-timeout).
4. settings-merge.test.mjs: delete the unmarked "lock: the message prints the exact rm command" check. Replace the R-322 marker and check with R-2080. Change nothing else, because install-cli-pins edits other blocks.
5. REQUIREMENTS.md: on R-322, set status `retired` and Evidence `superseded by R-2080, 2026-10-20`, keeping its text. Add R-2080 to R-2083 after R-322, and R-2084 and R-2085 after R-1997, word for word from the plan. Flip a row to implemented when its check passes; R-2082 and R-2083 stay untested with "written; Windows-leg-only". Edit no Also applies line.
6. packages/nana-setup/README.md:
   - In "A leftover lock is yours to clear", name the forms and the doctor row.
   - Add two limits: a defined %NAME% in Command Prompt, and no Git Bash form.
   - In the settings-merge test-table row, change "the `rm` command" to "the platform's removal commands". Add a `tests/settings-lock.test.mjs` row directly after it.
7. Run npm run map and npm run req:tree. Then run npm run map:check, npm run readme:check, node scripts/requirements-trace.mjs and node packages/nana-pack/tests/requirements-tree.test.mjs.

## Tests
- R-2080 goes in settings-merge's held-lock block and reuses its run `r`. Assert that lockOf(home) holds no quote character, then build the expected lines by hand. On POSIX expect `  rm '<lock>'`. On a win32 host expect the four lines in order and no `  rm ` line. On POSIX hosts, also spawn install with NANA_SETUP_PLATFORM=win32 and expect the four lines. Keep the path, `pid 4242` and age asserts.
- New settings-lock.test.mjs, with the six-tag header, holds R-2081 to R-2085. Each check sits as `check("R-208n: …",` on the line directly under `// req: R-208n`, with titles exactly as in must-meet. Import SETTINGS_LOCK_NAME and never the literal. Copy doctor-fix-line's fixtureHome, cleanEnv and withPiStub run pattern, and run doctor from a neutral temp folder.
- R-2081 to R-2083 use home = temp root + ``nana lock 'q' ’ é $x `b` [1]``. Write the lock and run install (exit 2). Take the whole printed command line by its trimmed start, never stripping a label. Run it with cwd set to a sentinel folder holding `nana`, `lock`, `q`, `é` and `1`. Afterwards the lock is gone, and snapshots of the sentinel folder and the home are otherwise unchanged.
  - sh: `/bin/sh -c <line>`, env `{ PATH: "/usr/bin:/bin" }` only.
  - cmd: ComSpec `/d /v:off /s /c "<line>"` with windowsVerbatimArguments, as win-shims.test.mjs does.
  - PowerShell: powershell.exe `-NoProfile -NonInteractive -EncodedCommand <base64 UTF-16LE line>`, as pwsh-oracle.mjs does.
- R-2084 uses an installed home plus a lock. The doctor row line starts `✗ settings lock` and holds the lock path, `pid 4242`, an `s ago` age and every command install printed for the same home and environment. On POSIX hosts, repeat with NANA_SETUP_PLATFORM=win32 for both install and doctor.
- R-2085 runs on a fresh home and an installed home. Doctor's last line holds `fix by hand as each ✗ line says:`, and its list holds `settings lock`.
- These must stay green: install, uninstall, win32-degrade, relative-agent-dir, doctor-fix-line, stale-copies.

## Wrong code to try (each must turn its check red; revert after; never spell a pi launch as spawn("pi" in any docs/reviews .mjs)
1. `rm ${lock}`: R-2080, R-2081.
2. `rm "${lock}"`: R-2080, R-2081.
3. `'${lock}'` with no escape: R-2081.
4. win32 prints only the del pair: R-2080.
5. PowerShell path in double quotes: R-2080.
6. `-Path`: R-2080.
7. `del <lock>` unquoted: R-2080.
8. Label on the command's line: R-2080.
9. removalCommands given process.platform: R-2080 (forced half).
10. Row removed: R-2084, R-2085.
11. Row WARN: R-2084, R-2085.
12. Row always POSIX: R-2084.
13. Row drops the holder: R-2084.
14. installLabel "settings SessionStart objective": R-2085.
15. Row tests the Claude folder: install.test.mjs "doctor prints no ✗ after install".
16. PowerShell doubles only U+0027: R-2083, Windows CI only. Record it; do not wait for it.

## Done
- On macOS, R-2080, R-2081, R-2084 and R-2085 pass. R-2082 and R-2083 print SKIP with their reason.
- Wrong codes 1 to 15 each turn their check red on macOS.
- The files listed above stay green, and so do map:check, readme:check, trace and the tree test.
- Every new module carries the six-tag header, with no inline tunables.

## Report (≤ 10 lines)
Tip SHA; per-row results; wrong-code results (n/15); the existing files green; map, tree, readme and trace green; the exact install lock lines, native and forced win32; deviations and why; open questions.