# Must-meet · readme-windows-checklist

Feature: FEAT-015 · Diagnose the active environment
Subject: the root README gains a Windows fresh-machine checklist for Command Prompt. The install check rehearses it on Windows, as it already rehearses the macOS one.
Falsifiable sentence: on win32 the install check prints PASS `readme checklist` only after it runs the README's Windows checklist commands through cmd.exe from a new temporary home and doctor prints `all good`.

Class: ordinary. The lane changes both READMEs, the install check's rehearsal, its sealed config and their tests. It changes no install, uninstall or doctor code, no hook, no extension, no gate policy and no land or review tool (precedent: readme-install). It touches packages/nana-setup/, so the seat runs the install check locally before the land.
Threat model: in scope is honest variation: the Path key's letter case, npm's Windows prefix layout, a user folder with spaces or on another drive, CRLF checkouts, our tools' output. A forged README, launcher or cmd.exe is out.
Rows: R-1850 to R-1852 extend FEAT-013 SUB-011 after R-1546, beside the macOS rows R-950, R-951, R-1111 and R-1546 (readme-install precedent). R-1853 to R-1855 go in FEAT-015 after R-1545. R-1856 to R-1859 stay unused.

## Design
- README.md: `### Fresh machine (Windows), in order` after the macOS list's closing `uv` line, with the macOS list's HTML comment. Eight steps:
  1 Install Node ≥ 22.19 and Git for Windows, then open Command Prompt.
  2 Run the CI-pinned `npm i -g --ignore-scripts …@1.0.2 --before=…`, then `pi --version`.
  3 Run `git clone https://github.com/j-wanger/nana-pi "%USERPROFILE%\nana-pi"`; keep the clone.
  4 Run `cd /d "%USERPROFILE%\nana-pi"`, then `node packages/nana-setup/bin/nana-setup.mjs install`.
  5 Add `%USERPROFILE%\.local\bin` to the user Path in Environment Variables (doctor's own remedy words), then open a new Command Prompt. No Run span.
  6 Run `pi install npm:pi-subagents@0.75.0`.
  7 The objective files, as macOS step 7, with `%USERPROFILE%\.pi\agent\…` paths.
  8 Run `cd /d "%USERPROFILE%\nana-pi"`, then `nana-setup trust "%USERPROFILE%\nana-pi"` (it asks before it records), then `nana-setup doctor`; expect `all good`.
  Prerequisites links both lists; "(untested there)" narrows to commands outside the Windows list. PowerShell is out: npm's .ps1 launchers meet the default script policy, and `%USERPROFILE%` does not expand there.
- README_REHEARSAL: `platforms` ["darwin","win32"]. `heading`, `shell`, `shellArgs` become {darwin, win32} maps (the HOOKS `form` precedent). The win32 shell is the sealed bare "cmd.exe", the program step 1 opens, with ["/d","/v:off","/s","/c"] (winCommand precedent). New `npmPrefixBin` {darwin:"bin", win32:""}: npm puts Windows global launchers in the prefix itself. New `binOnPath` {darwin:false, win32:true}.
- readme-rehearsal.mjs: `parseChecklist(text, platformName)` and `runReadmeRehearsal({…, platformName})` take the platform explicitly, never process.platform, because the Windows suite leg runs the darwin tests. On win32 the step environment has one Path key in any letter case, holding prefix folder;bin folder;caller's Path, joined with ";", the bin folder from `resolveLayout({home}).binDir`. It spawns cmd.exe with last argument `"<joined>"` and windowsVerbatimArguments. darwin's call and environment stay byte-identical.
- install-check.mjs passes platformName to the rehearsal: one line.
- Step-5 stand-in: step 5 writes the registry, so the rehearsal puts the home's bin folder on each step's Path, as the main check already does for its own home. Without it doctor reads ✗ "PATH resolves pi-review": to doctor the rehearsal home is the real home.
- Existing rows: R-1542 gains "WHERE the platform is darwin,". R-951, R-1111 and R-1546 say "the macOS fresh-machine checklist", since their tests read only that list. R-1540's test drops win32 from its "print none" half; its evidence cell takes the new title.
- Out of scope: the skills' "not on PATH, as on Windows" and the shared working text's "(Windows)" stay. The win-path-commands plan judged that fallback still true; changing it touches a global rule and every project's AGENTS region.

## Must-meet
| Row | Requirement | Test | Red today |
|---|---|---|---|
| R-1850 | The root README shall carry one numbered Windows fresh-machine checklist, written for Command Prompt, whose steps name Node at the declared Node floor with Git for Windows, the CI-pinned pi install, this repository's clone, nana-setup install, the install's bin folder on the user Path in a step with no rehearsal command, pi-subagents at doctor's floor, the machine objective files, and trust then doctor, in that order. | `packages/nana-setup/tests/fresh-machine.test.mjs::Windows checklist has eight ordered actions for Command Prompt at the declared versions, with no command in the user Path step` | probe 1 |
| R-1851 | The Windows fresh-machine checklist's last step shall run `cd /d "%USERPROFILE%\nana-pi"`, then `nana-setup trust "%USERPROFILE%\nana-pi"`, then `nana-setup doctor` as rehearsal commands, and expect `all good`. | `packages/nana-setup/tests/fresh-machine.test.mjs::Windows last step runs cd /d to the clone, trust and doctor as commands and expects all good` | probe 1: today's parser returns the macOS step 8 |
| R-1852 | Every rehearsal command in the Windows fresh-machine checklist shall write each path under the user folder as a double-quoted path that starts with `%USERPROFILE%`. | `packages/nana-setup/tests/fresh-machine.test.mjs::every Windows checklist command names user-folder paths only as double-quoted %USERPROFILE% paths, and at least three exist` | probe 1: the macOS commands use `~` and hold no such path |
| R-1853 | WHERE the platform is win32, the install check shall print one `readme checklist` result line from rehearsing the root README's Windows fresh-machine checklist in a new `readme-home` folder inside its temporary home. | `packages/nana-setup/tests/install-check.test.mjs::readme gate: win32 prints one readme checklist result line from cmd.exe runs in a second home, ending on the Windows checklist's last step` | platforms is ["darwin"]; today's R-1540 test asserts win32 prints none |
| R-1854 | WHERE the platform is win32, the rehearsal shall run each step that has commands as one verbatim `cmd.exe /d /v:off /s /c` call from the rehearsal home whose last argument is the step's commands joined with ` && ` inside one pair of double quotes. | `packages/nana-setup/tests/readme-rehearsal.test.mjs::run on win32: each command step is one verbatim cmd.exe /d /v:off /s /c call from the rehearsal home with the joined commands in one pair of quotes` | probe 2 |
| R-1855 | WHERE the platform is win32, the rehearsal shall give each step the rehearsal home's base environment minus `ZDOTDIR`, with exactly one Path variable in any letter case holding the home npm prefix folder, the home's bin folder and the caller's Path in that order joined with `;`, plus only the npm prefix setting, the git redirect of the package.json repository URL to the checkout and file-only git transport. | `packages/nana-setup/tests/readme-rehearsal.test.mjs::run on win32: one Path key in any letter case holds the home npm prefix folder, the home's bin folder and the caller's Path in that order, with only the npm prefix and clone redirect added` | probe 2 |
Pin (not must-meet): `readme-rehearsal.test.mjs::pin R-1542 R-1543 R-1544 R-1545 R-1853 R-1854 R-1855: the sealed README_REHEARSAL contract`. All tests use stubs and run on all three platforms with no skip.

## Probes (macOS, temporary clone of main f0d6da24, temporary HOME, 2026-10-19)
1. Main's README has no Windows heading. Today's `parseChecklist(readme, "win32")` ignores the platform and returns the macOS step 8 [`cd ~/nana-pi`, …].
2. Today's `runReadmeRehearsal({platformName:"win32"})`: a Windows-only README returns no-expectation and spawns nothing. With both headings it spawns `/bin/zsh -l -c "mac one"` with no verbatim flag, and its env holds `Path=C:\caller` beside `PATH=<home>/.npm-global/bin:`. Node documents that on Windows the first key in sorted order wins (`PATH`), so the caller's Path would be lost (documented, not run on Windows).
3. A draft Windows section in that clone: readme:check read 714 claims with 0 problems (main reads 710). The fresh-machine and readme-rehearsal tests stayed green.
4. CI run 39325219659: the Windows global pi install took 2m06s cold; the Windows install-check step took 12 s; macOS printed PASS readme checklist.
5. Doctor prints `all good` with · note rows present, so the Windows notes do not block step 8.

## Known limits
- Step 5 never runs. Only R-1850's order check and a real Windows machine cover it.
- Only CI's Windows install-check leg proves cmd quoting of a joined line with inner quotes, the git redirect to a drive-letter checkout, npm's Windows prefix layout, .cmd shims chained with `&&`, trust through the shim, and doctor's `all good` from the clone. None has run on Windows yet. A real defect found there is recorded, never loosened.
- A CI runner is not a fresh machine: the caller's Path already holds pi and Node.
- The rehearsal home sits on the runner's temp drive with no space, so `cd /d` and a spaced user folder rest on R-1851 and R-1852's static checks.
- Step 2 took 2m06s cold on CI against the shared 300 s step cap; a slow runner could fail the blocking job (inferred).
- Nothing tests PowerShell. Linux prints no readme checklist line.