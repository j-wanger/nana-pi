# Build brief 2 · win-watchdog-cpu-read (a pi gpt-5.6-sol builder)

Same worktree and branch (tip a45bf37d; build 1 is 59340ee7, merged with main d4423eff at 62627846). Class: install, hook or gate (pi-watchdog behind the review and land tools). Rows: R-1890 to R-1899 only. Follow packages/nana-pack/prompts/builder-preamble.md. Single test files only; do not push; do not edit HANDOFF.md or docs/sessions/.

## The fix works; R-1890's fixture does not stage the comma on an English runner
- The seat re-ran probe P1 on 62627846 with the runner's user culture set to de-DE (`probe-p1-tip-62627846.log`, run 39358595464): win32-launch's "Windows: a busy pi is not stopped as stalled" PASS (main failed it there) and watchdog-cpu 5/5, R-1890 included.
- But on the lane's own CI (run 39358574887, an en-US runner; `ci-windows-62627846-build1.log`) R-1890 FAILS: `control.stdout` is `"1.5\r\n"`, not `"1,5"`, so the check's own precondition fails, although the run itself is right (cpu 1.44 s → 6.11 s, SUCCESS, no STALL).
- P1 step 1 (`probe-p1.log`, run 39355882657, en-US runner, BEFORE Set-Culture) printed `1,5` from `powershell -NoProfile -Command '& { [System.Threading.Thread]::CurrentThread.CurrentCulture = [System.Globalization.CultureInfo]::GetCultureInfo(1031); [double]1.5 | Out-String; ... }'` run from bash. So the in-process switch works in Windows PowerShell 5.1 when the whole script block reaches PowerShell as one -Command string. The test's fixture (watchdog-cpu.test.mjs ~162) is a `powershell.cmd` wrapper that splices `%~3` into that script block through cmd.exe; find why the control's expression comes out with a point there (how the control calls the wrapper, what `%~3` holds, cmd's handling of the brackets and quotes, or the value being a string not a double), and fix the fixture so the control prints `1,5` on an en-US Windows runner. Do NOT weaken the check: it must still require the control's comma, the run's success, no STALL and four rising positive cpu lines.
- Keep R-1890 `untested` with its req-candidate marker until the seat sees it PASS on the lane's Windows CI; the seat promotes it in the notes commit.

## Pairs survivor H1 (cheap; do it)
No ps case in R-1891's parser check has a non-zero hours field (`00:01:05`, `1-00:00:01`), so a parser that ignores hours survives. Add `01:00:00` → 3600 (and one with days and hours) to R-1891's cases; show the check red with `const hours = 0`.

Done: watchdog-cpu, watchdog-exit, win32-launch, immutable-review single files green on macOS (R-1890 SKIPs there); R-1891 red under the hours wrong code; trace, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-tree.mjs --check` green.
Report (≤ 10 lines): VERDICT; commit; the cause you found for the control's point and the fixture change; the H1 case and its red evidence; what only Windows CI can prove.
