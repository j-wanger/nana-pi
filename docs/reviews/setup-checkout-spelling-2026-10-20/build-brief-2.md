# setup-checkout-spelling — build brief 2

Same worktree and branch (tip 5779dc75: build 1 at 6bf3c850 plus the seat's wrong-code table). Class: install, hook or gate. Rows: R-1980 to R-1989 only. Follow packages/nana-pack/prompts/builder-preamble.md. Single test files only (no full or locked suite); do not push; do not edit HANDOFF.md or docs/sessions/.

## What CI found on 6bf3c850 (run 39372424797; Windows log committed as ci-windows-6bf3c850-build1.log)
macOS: 0 failing of 174 files. The new file's six checks pass on Windows (R-1985 skips there: uninstall is POSIX-only). Two failures are this lane's:

1. **Ubuntu: `checkout-spelling.test.mjs` FAILS as `0 pass, 7 skip — no check passed and no skip was declared`.** The volume is case-sensitive, so the file finds no second spelling and skips every check. scripts/test.mjs fails a file with no passing check unless a skip is declared for the whole file (the `SKIPS` map near line 196, read by the declared-skip function near line 406). Linux must stay unaffected. Declare the file's skip in `SKIPS` with a reason that says no second spelling exists on a case-sensitive volume. Decide it by the same probe the test uses, never by platform name alone, so a case-insensitive Linux volume still runs it. Alternatively give the file one real check that passes there. Choose the smaller change and say why.
2. **Windows: `pi-registration.test.mjs` fails one check** (72 pass, 1 fail):
   `FAIL the throwaway worktree is a linked worktree of the main clone C:\Users\runneradmin\AppData\Local\Temp\nana-test-2516-MSOBeR\nana-setup-wt-MBIiLg vs D:/a/nana-pi/nana-pi`
   The check (pi-registration.test.mjs ~232) compares `fs.realpathSync(wtPaths.repoRoot)` with `fs.realpathSync(wt)`. This lane canonicalised pkgRoot with realPath (native), so on Windows `repoRoot` comes back in a native spelling. The hosted runner's TEMP is `C:\Users\RUNNER~1\…`, a real 8.3 short name. `fs.realpathSync(wt)` keeps the typed spelling, so the two differ on Windows. Main passed this check. Decide whether the product is right and the test compares with the wrong function (then compare through the pack's realPath, as the lane does), or whether repoRoot is wrong for a linked worktree. Show the cause. Do not weaken the check: it must still prove the throwaway worktree is linked and not the main clone.

## Done
checkout-spelling and pi-registration green alone on macOS. Run `NANA_SETUP_PLATFORM=win32` where the tests force it. Make the declared skip's probe testable on macOS, for example a check that the SKIPS function returns null on a case-insensitive volume. Trace, `npm run map:check`, `npm run readme:check` and `node scripts/requirements-tree.mjs --check` exit 0. Do not edit the seat's table. The seat re-runs CI on all three legs.

## Report (≤ 8 lines)
VERDICT; commit; the Linux fix and why; the Windows cause and fix; files changed; what only Windows CI can prove.
