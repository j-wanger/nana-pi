# Independent check — win-path-commands, run at f7c5db53 (build 1), filed with the seat record at 03f1faf (2026-10-19)

VERDICT: HOLDS

Checked in a private clone at f7c5db53 (P=<tmp>/win-path-commands-check.Ts7Qe5). Every probe used a temp HOME and `--home`. The worktree and the real ~/.local/bin, ~/.claude and ~/.pi are unchanged. The one untracked file in the worktree, seat-mutate.mjs, is the seat's, not mine.

Must-meet and changed test files (single files):
- `node packages/nana-setup/tests/win-shims.test.mjs`: R-1611 and R-1617 PASS. "SKIP R-1612/1613/1614/1616 Windows leg only."
- `node packages/nana-setup/tests/win32-degrade.test.mjs`: 93 PASS, 0 FAIL, including the R-1610 and R-1615 titles.
- install-check.test 106 PASS, state-manifest.test 20 PASS, install.test 104 PASS, templates-render.test 168 PASS. All exit 0.
- `node scripts/code-map.mjs --check`: "0 problem(s)". `node scripts/readme-check.mjs`: "705 claims checked; 0 problem(s)".
- CI run 39322810029 at f7c5db53: install-check (windows-latest) and install-check (macos-latest) both success. The Windows suite leg was still in_progress, so R-1612/1613/1614/1616 are unverified here.

Probes:
1. macOS install and doctor in a base clone (d5000084) vs the lane, host platform. Same four `created` symlink rows, same PATH check line, no .cmd files, same four ✓ PATH rows in doctor. Verdict: main's POSIX behavior unchanged.
2. `node p2.mjs`: sh shim from renderWinShims, bin inside the folder `it's $HOME & 100% (x) é \`y\``, run under /bin/sh. The 12 arguments covered spaces, both quote kinds, `$HOME`, backticks, `*`, an empty string, a newline, `@/…/my brief.md`, `--`, `% & ^ ! ( ) | < >` and `\`. Output "status 9 args round-trip true count 12". With a `node.js` in the caller's folder: `["x"] 9`. Verdict: holds.
3. Forced win32 (`NANA_SETUP_PLATFORM=win32`):
   - `install --dry-run`: "sh: would write; .cmd: would write", and the bin folder held 0 files afterwards.
   - Then pi-review.cmd made a symlink to outside.txt and nana-land made a directory. Install printed ".cmd: replaced a symlink and wrote bytes (the link's target was not written through)" and "backed up nana-land -> nana-land.bak-20261019". outside.txt still read "outside-secret" and the directory's content was kept.
   - Doctor then read four ✓ rows, plus "· PATH resolves pi-review … not found on PATH; add … to the user Path in Environment Variables" (a note under --home).
   - Verdict: no write-through, no loss.
4. A pi-worker.cmd rendered for another checkout made doctor exit 1 with "✗ PATH pi-worker missing or stale: …pi-worker.cmd — run `nana-setup install`". Install then backed it up to pi-worker.cmd.bak-20261019 and rewrote it. Verdict: holds.
5. CRLF-converted sh shim: doctor read "✗ PATH pi-review missing or stale". Install backed it up and restored the LF bytes (cmp equal). Verdict: holds.
6. `node p5.mjs`, the .cmd target for four realistic paths:
   - same drive, user folder with a space: `"%dp0%\..\..\nana-pi\…\pi-review.mjs" %*`
   - other drive: `"D:\src\100%% & (x)\nana-pi\…"`, with `%` doubled and the path quoted
   - `c:` vs `C:` is treated as the same drive and gets the relative form
   - UNC: `"%dp0%\..\..\..\nana-pi\…"`
   - No bare LF in any of them. Verdict: holds.
7. `node p9.mjs`, the "PATH resolves pi-review" predicate on Windows PATH variants:
   - `C:/Users/jo/.local/bin/` resolves to `…\.local\bin\pi-review.cmd`: OK
   - a quoted, upper-case `"C:\Users\JO\.local\bin"`: OK
   - npm's folder listed first: resolves to `…\npm\pi-review.cmd`: FAIL/NOTE
   - neither folder: null
   - The extensionless sh file is never chosen. Verdict: holds.
8. Uninstall:
   - `uninstall --dry-run`, base vs lane on macOS: 32 lines each, identical after path normalization. Shim rows (kind "shim") are not removable.
   - Forced win32 `uninstall --yes`: "uninstall is POSIX-only", exit 2, 10 files left.
   - `state` lists the four "bin shim *.cmd" rows as present.
   - Verdict: holds.
9. `node p12.mjs`, linkFile copy path (now a call to writeBytesWithBackup), base vs lane, against a symlink, an edited file and a new target. Statuses, backups and "outside=outside" are identical. Only one dry-run wording changed: "would replace a symlink with a copy" became "would replace a symlink and copy". Verdict: the refactor keeps behavior.

Findings (none MUST):
- Known bug, read but not run (needs cmd.exe): when PATH has no node.exe, the .cmd shim runs `ECHO nana PATH shim: node.exe was not found on PATH 1^>^&2`. The carets escape the redirect, so the message goes to stdout with a literal "1>&2" at the end. EXIT /b 1 still returns status 1. No test covers this path. The fix is an unescaped `1>&2` (packages/nana-setup/lib/win-shims.mjs, the IF NOT DEFINED block).
- Known bug, cosmetic: on a repeat win32 install, an unchanged row reads "unchanged  sh: write; .cmd: write", which names a write that did not happen. Nothing pins this text, and the same goes for the dry-run wording change in probe 9.
- Note, not a bug: on win32 with the real home, doctor now exits 1 ("PATH resolves pi-review" ✗) until ~/.local/bin is on the user Path. Main's win32 doctor printed notes there instead. The plan intends this as the win32 twin of R-953, and the README says so. Windows users who run doctor will see red until they add the folder.

The claim I'd most expect to be wrong is that the .cmd shim works for real on cmd.exe and PowerShell. That rests on the Windows suite leg, which was still running when I checked.
