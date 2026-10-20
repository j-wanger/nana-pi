# Independent check — win-watchdog-cpu-read at 3e998bf2 (2026-10-19)

VERDICT: HOLDS

Scope: private clone at tip 62627846, macOS only. P=<tmp>/win-watchdog-cpu-read-check.fJJozW. Every probe ran with HOME=$P/home and TMPDIR under $P. No repository was edited.

Must-meet tests
- Command: `node packages/nana-pack/tests/watchdog-cpu.test.mjs`
- Output: R-1890 skipped (Windows only). R-1891, the R-1891 seal, R-1892 and R-1893 passed, in 16 s.
- Verdict: these pass on macOS. R-1890 cannot run here.

Probe 1: the parser on real ps output and realistic Windows text
- Command: `node -e '...parseCpuSample(...)'`, fed live output of `ps -o time= -p 1` and of its own pid.
- Output: `"468:49.20\n"`→28129.2 · `"  0:00.03\n"`→0.03 · `"12-03:04:05\n"`→1047845 · win32 `"187500000\r\n\r\n"`→18.75 · win32 with a leading BOM→18.75 · win32 `"1,875"` / `"1.875"` / `"1 875"` / `""`→null · darwin `"0:00,50"`→null.
- Verdict: OK. macOS ps prints minutes past 59, and the parser reads them correctly.

Probe 2: does macOS ps use a decimal comma in another locale?
- Command: `LC_ALL=de_DE.UTF-8 ps -o time= -p $$`, and the same for fr_FR and C.
- Output: `0:00.01` in every locale.
- Verdict: OK. The new "unreadable counts as flat" rule cannot stall a German or French macOS user.

Probe 3: a busy fake pi with the real ps
- Command: `FAKE_MODE=busy FAKE_SECS=6 pi-worker --poll 1 --stall-secs 3 -- -p x`
- Output: `cpu=0.76s` rising to `cpu=5.46s`, all `flat=0/3`, then `SUCCESS on attempt 1`, exit 0.
- Verdict: OK. The main use is intact.

Probe 4: an idle fake pi with the real ps
- Command: `FAKE_MODE=idle FAKE_SECS=30 ...`
- Output: `cpu=0.03s` from `flat=0/3` to `flat=3/3`, then `STALL`, exit 1 after 5 s. No fake pi process was left running.
- Verdict: OK. Stall detection still works.

Probe 5: a busy pi that exits with code 3
- Command: `FAKE_MODE=busy FAKE_SECS=2 FAKE_CODE=3 ...`
- Output: two cpu lines, `attempt 1 did not succeed`, exit 1, no STALL.
- Verdict: OK.

Probe 6: ps missing from PATH
- Command: `PATH=$F node pi-worker ... ` with a 10 s busy pi.
- Output: `ps: command not found`, then `cpu=unreadable flat=1/3` up to `3/3`, then `STALL`, exit 1.
- Verdict: OK, as designed. It fails closed. Main also stalls here, one poll later, because it read `cpu=0s`.

Probe 7: the Windows tick read forced on, in a second copy
- Setup: in that copy only, the win32 branch of `cpuSeconds` and its `parseCpuSample(raw,'win32')` call were forced on. A fake `powershell` turns real ps time into ticks followed by CRLF.
- Output, busy 6 s: the logged command was `-NoProfile -Command (Get-Process -Id 55993).TotalProcessorTime.Ticks`, and readings rose from `cpu=1.02s` to `5.15s`, then SUCCESS, exit 0.
- Output, idle: `0.03s` up to `flat=3/3`, then STALL, exit 1.
- Verdict: OK. The product sends the tick expression, and it parses through execSync and the shell.

Probe 8: pi exits during a real ps read
- Setup: a `ps` wrapper sleeps 1.2 s on the second read, then runs `/bin/ps` against the exited child, which has not yet been reaped.
- Command: busy 2.5 s, then exit 0 or exit 5, with `--stall-secs 1`.
- Output: the wrapper logged `zombie read: [  0:00.00] rc=0`. Exit 0 gave SUCCESS with one cpu line. Exit 5 gave `did not succeed`, exit 1. No STALL in either case.
- Verdict: OK. The yield-and-recheck drops the read taken after pi exited and keeps pi's own exit status.

Probe 9: neighbouring test files, run one at a time
- Command: `node packages/nana-pack/tests/<f>.test.mjs`
- Output: immutable-review 18/0 · worker-lane 52/0 · watchdog-exit 6/0 · review-ledger 165/0 · handoff-writer-role 7/0 · review-standard 7/0 · win32-launch 5 pass, 8 skip, 0 fail.
- Verdict: OK. Nothing regressed on macOS.

Probe 10: map, README and main containment
- Command: `node scripts/code-map.mjs --check`, `node scripts/readme-check.mjs`, `git merge-base --is-ancestor d4423eff 62627846`
- Output: `0 problem(s)`, `710 claims checked; 0 problem(s)`, and main d4423eff is contained in the tip.
- Verdict: OK.

Probe 11: temp leftovers
- Command: each test run with its own empty TMPDIR, then `ls`.
- Output: only immutable-review leaves an empty `pi-review-XXXXXX/out.txt`. A clone of main d4423eff leaves the same folder (`pi-review-Ffc58e`). Nothing was written outside temp.
- Verdict: OK. This was already on main and is not caused by the lane.

Findings
- None at MUST level. I found no lost data, no writes outside temp, no broken install or hook, no fail-open, and no main use that stopped working on macOS.
- Status note (no severity): I could not check the Windows-only claims from this machine.
  - R-1890: the decimal-comma read under Windows PowerShell 5.1.
  - The one setImmediate yield noticing a Windows exit, which is R-1893 on win32.
  - The review folder has P1 only as the pre-build probe on main. I found no post-build P1 re-run or Windows CI run on 62627846.
  - R-1890 is correctly marked `untested`. That Windows run is still a land step for the seat.
- Known bug (pre-existing, not from this lane): immutable-review.test.mjs leaves one empty `pi-review-*` capture folder in temp. Main does the same.
