# win-lock-fix-command: must-meet

Feature: FEAT-013 · Install and connect harness runtimes (R-2084 and R-2085 sit in FEAT-015 · Diagnose the active environment)
Class: install, hook or gate. It changes install's lock message and adds a doctor row. Ladder: final reviewer, land reviewer or seat-land.md, seat wrong-code pairs, one independent check. install-check runs locally on macOS before nana-land.
Threat model: honest variation is in scope. That covers a home path holding a space, a straight or typographic apostrophe, a non-ASCII letter, `$`, a backtick or square brackets; drive letters and 8.3 names; Command Prompt, Windows PowerShell and POSIX sh; a run killed mid-install. Forgery is out, such as a lock planted as a folder or a link.

## Feature
When an interrupted install leaves the settings lock, each removal command install prints sits alone on its line. Pasted as printed, that whole line removes the lock and nothing else: in sh on macOS and Linux, and in Command Prompt or Windows PowerShell on Windows. While the lock exists, doctor marks it ✗ with the same commands and lists it to fix by hand.

## Design
- New `packages/nana-setup/lib/settings-lock.mjs` with the six-tag header. It exports `SETTINGS_LOCK_NAME` (a contract value from the README settings.json section; the literal moves out of steps.mjs), `settingsLockPath(settingsFile)`, `lockHolder(lock)` (today's "pid N, Ns ago" read, moved) and `removalCommands(lock, platformName)` → `[{ shell, command }]`. It is a new module so that pi-probe-timeout's edit to steps.mjs's header export list does not collide.
- Off win32, one line: `  rm <shq(lock)>`. It reuses settings.mjs `shq`.
- On win32, four lines. Each label sits on its own line, so a whole-line paste runs only the command:
  `  in Command Prompt:` / `    del "<lock>"` (a Windows name cannot hold `"`)
  `  in PowerShell:` / `    Remove-Item -LiteralPath '<lock>'`. Each of ' ‘ ’ ‚ ‛ is doubled. -LiteralPath keeps `[` `]` literal, and single quotes keep `$` and the backtick literal.
  Two forms are needed: in PowerShell, `del "…"` breaks on `$` or a backtick, and Windows user names may hold both.
- steps.mjs `withSettingsLock` uses the helpers and `platform()` from paths.mjs, so NANA_SETUP_PLATFORM can force the platform. `uninstall --yes` shares the message.
- doctor.mjs adds one `settings lock` row after the Claude Code settings rows. It reads the lock with lstat.
  - ✓ reads `no leftover lock`.
  - ✗ reads `<lock> is left over (<holder>) — install will not run until it is removed; if no nana-setup is running, remove it: <fix>`.
  - Off win32, `<fix>` is the rm command. On win32 it is `in Command Prompt: <del> — or in PowerShell: <Remove-Item>`. Each label comes first, and the line ends on a command.
  - The row has no installLabel, so the dry run never claims it and doctor's last line lists it to fix by hand.
- REQUIREMENTS.md: retire R-322 with `superseded by R-2080, 2026-10-20`. Add R-2080 to R-2083 after R-322 in SUB-014, and R-2084 and R-2085 after R-1997 in FEAT-015. Leave every Also applies line alone.
- Prototype, an adversary probe in a temp clone of main 385c633f:
  - settings-merge: 217 pass, 2 fail, both the rm checks this lane replaces. win32-degrade passed 87 of 87, uninstall 31 of 31.
  - Its code merged cleanly with pi-probe-timeout, install-cli-pins, project-check-quiet and install-check-review-launch.

## Must-meet
Fixture: one awkward folder name, held as a test constant: ``nana lock 'q' ’ é $x `b` [1]``. Each printed line runs from a sentinel folder holding the files `nana`, `lock`, `q`, `é` and `1`. The sh child gets only PATH=/usr/bin:/bin.

| Row | Test file::title | Red today? |
|---|---|---|
| R-2080 | `packages/nana-setup/tests/settings-merge.test.mjs::R-2080: a held settings lock stops install printing the lock path, the recorded pid, its age and each removal command alone on its line under its shell` | RED, probed. Main prints `  rm <path>` unquoted, natively and under forced win32. |
| R-2081 | `packages/nana-setup/tests/settings-lock.test.mjs::R-2081: on macOS and Linux, the rm line install prints for a held lock, run by /bin/sh, removes the lock under an awkward home path and changes no other file` | RED, probed with the fixture name. Run by /bin/sh, main's line deleted the sentinels `lock`, `q` and `é`, exited 1 and left the lock. The prototype's line removed only the lock. |
| R-2082 | `packages/nana-setup/tests/settings-lock.test.mjs::R-2082: on Windows, the Command Prompt line install prints for a held lock, run by cmd.exe, removes the lock under an awkward home path and changes no other file` | RED, inferred, not run. cmd.exe has no rm, and with Git's rm.exe on PATH the space splits the path. |
| R-2083 | `packages/nana-setup/tests/settings-lock.test.mjs::R-2083: on Windows, the PowerShell line install prints for a held lock, run by Windows PowerShell, removes the lock under an awkward home path and changes no other file` | RED, inferred for 5.1 and probed on PowerShell 7.4.6 (macOS, temp copy, with -Force for the Unix hidden-dotfile rule). Main's unquoted path left the lock. The planned form removed only the lock. ASCII-only doubling, -Path and double quotes each left the lock. |
| R-2084 | `packages/nana-setup/tests/settings-lock.test.mjs::R-2084: while the settings lock exists, doctor marks a settings lock row ✗ naming the lock, its pid and age, and every removal command install prints` | RED, probed. Main prints no lock row and says "all good." on an installed home holding a lock. |
| R-2085 | `packages/nana-setup/tests/settings-lock.test.mjs::R-2085: while the settings lock exists, doctor's last line lists settings lock among the rows to fix by hand, on a fresh home and on an installed one` | RED, probed. Main says "all good." on the installed home and tells a fresh home to run install for the rest, which then refuses. |

Row text is in the rows list. Platforms:
- R-2080, R-2084 and R-2085 run on all three platforms. On POSIX hosts each also runs a forced-win32 half.
- R-2081 prints SKIP on win32, because install prints the Windows lines there.
- R-2082 and R-2083 print SKIP off win32, because cmd.exe and Windows PowerShell exist only on Windows.
- R-2082 and R-2083 stay `untested` ("written; Windows-leg-only") until the lane's Windows CI run passes them. The seat then flips each one citing that run, as R-1330 did.
- The healthy ✓ row stays covered by install.test.mjs "doctor prints no ✗ after install".

## Known limits
- Command Prompt expands a defined `%NAME%` inside double quotes, so that breaks the Command Prompt line. The PowerShell line still works.
- Git Bash on Windows gets no form of its own, and neither does Claude Code's Bash tool there.
- Nothing ran on Windows. The PowerShell check pipes the exact line through -EncodedCommand, which stands in for a console paste.
- Doctor cannot tell a running install's lock from a leftover one. It reads ✗ during an install, and the detail says "if no nana-setup is running".
- The session-start stale line still names install when a lock blocks it (the stale-copies-hooks residual). Fixing it means changing a hook.
- A hidden or read-only lock defeats both Windows lines. A lock that is a folder defeats rm and del. Our tools never make either.
- Seat, at land: update the HANDOFF residuals "Install lock … Doctor does not report a leftover lock" and the leftover-lock example in "Doctor's last line (doctor-fix-line)".