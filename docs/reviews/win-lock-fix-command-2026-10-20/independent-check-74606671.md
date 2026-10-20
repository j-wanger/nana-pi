# Independent check — win-lock-fix-command at 74606671 (2026-10-20)

VERDICT: HOLDS

Private copy: <tmp>/win-lock-fix-command-check.qDCtFn/lane at 74606671. Every probe used a temp HOME and a pi stub where doctor ran. The clone's `git status` was clean afterwards.

Must-meet and adjacent files, each run on its own:
- `node packages/nana-setup/tests/settings-lock.test.mjs`: R-2081, R-2084 and R-2085 PASS. R-2082 and R-2083 SKIP off win32. Output was "PASS summary: 0 failures". HOLDS.
- `settings-merge.test.mjs` exit 0 with 219 PASS. `install.test.mjs` exit 0 with 107 PASS, including "doctor prints no ✗ after install". `uninstall` 31/31, `win32-degrade` 87/87, `doctor-quiet` 4/4, `doctor-fix-line` 9/9, `product-report` 71/0. HOLDS, so main's uses still work.
- `code-map.mjs --check` found 0 problems. `readme-check.mjs` checked 719 claims with 0 problems. `requirements-trace.mjs` exited 0. `requirements-moved` reported R-2080 to R-2085 as new. HOLDS.

Probes:
1. Home `Ann O’Brien's $HOME \`x\` [a] é` with a held lock, on native macOS. Ran `nana-setup install --home "$H"`, then the printed line through `zsh -f -c "$LINE"` and `bash --norc -c` from a sentinel folder.
   Output: install exit 2. The line printed was `  rm '…/Ann O’Brien'\''s $HOME \`x\` [a] é/.claude/.settings.json.nana-setup.lock'`. zsh exit 0, bash exit 0. The lock was gone and the sentinels were unchanged (`a BrienHOME é Ann O x`). HOLDS.
2. Same home with `NANA_SETUP_PLATFORM=win32 nana-setup install`, plus direct `removalCommands(...,'win32')` calls on Windows paths.
   Output: four lines, `in Command Prompt:` / `del "…"` / `in PowerShell:` / `Remove-Item -LiteralPath '…O’’Brien''s $HOME \`x\` [a] é…'`, exit 2.
   - `C:\Users\O‘Brien’s $env:x \`n [1]` gave `'C:\Users\O‘‘Brien’’s $env:x \`n [1]…'`.
   - The 8.3 name `JOHNDO~1` and the name `a&b^c!d` stay literal in both forms.
   HOLDS, by reading the rendered text only: no PowerShell is installed here (`pwsh not found`).
3. `doctor --home $H` on an installed home: first healthy, then with an empty lock (a run killed between open and write).
   Output: healthy run exit 0 with `✓ settings lock  no leftover lock` and `all good.`. Locked run exit 1 with `✗ settings lock … is left over (an unrecorded pid, at an unrecorded time) — … remove it: rm '<H>/.claude/.settings.json.nana-setup.lock'`. Last line: `1 missing — fix by hand as each ✗ line says: settings lock`. HOLDS.
4. Recovery from doctor's line. Ran `sh -c "<text after 'remove it: '>"`, then `install`, then `doctor`. Then ran a forced-win32 doctor against a fresh lock.
   Output: sh exit 0. install exit 0 and left no lock. doctor said `all good.`. The forced-win32 row reads `(pid 99, 61s ago) — … remove it: in Command Prompt: del "<H>/…lock" — or in PowerShell: Remove-Item -LiteralPath '<H>/…lock'`, exit 1. HOLDS.
5. `nana-setup uninstall --home $H --yes` with a held lock, native and forced win32.
   Output: native exit 1 with `✗ uninstall preflight problem … locked`. The line `  rm '<H>/.claude/.settings.json.nana-setup.lock'` stands alone. The home hash was unchanged. Forced win32 printed `uninstall is POSIX-only` and left the home unchanged. HOLDS.
6. Locks outside the threat model, checked for crash safety: one with `chmod 000`, one that is a folder, and one that is a dangling symlink.
   Output: chmod 000 gave exit 1 with `(an unrecorded pid, at an unrecorded time)`. The folder gave exit 1 with no stack or EISDIR. The dangling link gave doctor ✗ and exit 1, and install printed one `rm` line. HOLDS, with no crash and no fail-open.
7. Relative `install --home h8` and `doctor --home rel/h8`.
   Output: both print an absolute `rm '<tmp>/…/rel/h8/.claude/.settings.json.nana-setup.lock'`. The line works from any folder. HOLDS.
8. Test hygiene, by reading the code. settings-lock.test uses `tmpDir(os.tmpdir())`, which is removed on exit, and every install runs with `--home`, so `isRealHome` is false. `stepPath` writes only under `layout.binDir` and touches no registry. The forced-win32 spawn in settings-merge passes `--home`, and the lock aborts it before the first write. HOLDS, with no writes outside the temp folder.

Findings (none MUST):
- Known bug, an open risk. R-2082 and R-2083 have never run, because cmd.exe and Windows PowerShell exist only on Windows. If either fails on the Windows CI leg after the land, that leg goes red and it blocks release; nana-land reads no CI result. The plan carries this as `untested`.
- Known bug, wording. The doctor ✗ text says "install will not run until it is removed", but `install --dry-run` still runs under a lock (R-926). It does not mislead the repair.
- Known bug, pre-existing. `docs/product-report/assessments.json` still lists R-322, which is now retired, as `untested`. Its staleness display already shows this, and product-report.test still passes.

Already recorded as plan known limits, not findings: Command Prompt expands a defined `%NAME%`; doctor marks a running install's lock ✗; Git Bash has no form of its own; a hidden or read-only lock defeats both Windows forms; the session-start stale line still names install.