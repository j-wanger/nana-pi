# win-watchdog-cpu-read — must-meet

Feature: FEAT-007 · Review a specific revision independently (SUB-008 · Run and stop an isolated reviewer; FEAT-006 builders share the watchdog)
Class: install/hook/gate (pi-watchdog, behind pi-review and pi-worker). Ladder: reviewer, land reviewer, the seat's wrong-code pairs on macOS and Windows, one independent check, the mutation runner.
Build: complex; the larger-lane builder runs it through pi-worker.
Threat model: honest variation in PowerShell and ps output is in scope. That covers the user's culture, Windows PowerShell 5.1 against 7, a slow start, a read that fails or prints nothing, and a pi that exits mid-read. A forged reader or process is out.

Feature: on a Windows machine whose culture writes a decimal comma, pi-review and pi-worker read a busy pi's CPU time as growing seconds and do not stop it as stalled. A sample the watchdog cannot read prints `cpu=unreadable` and counts toward the stall budget, never as 0. A pi that exits during a read ends by its own exit status.

## Step 0: seat probe P1, before the build (scratch Windows-only CI job, bash steps; commit as probe-p1.log)
1. `powershell -NoProfile -Command '& { [System.Threading.Thread]::CurrentThread.CurrentCulture = [System.Globalization.CultureInfo]::GetCultureInfo(1031); [double]1.5 | Out-String; (Get-Process -Id $PID).CPU | Out-String; (Get-Process -Id $PID).TotalProcessorTime.Ticks | Out-String }'`
2. `powershell -NoProfile -Command 'Set-Culture de-DE'`
3. `powershell -NoProfile -Command '(Get-Culture).Name; $PSVersionTable.PSVersion.ToString(); (Get-Process -Id $PID).CPU; (Get-Process -Id $PID).TotalProcessorTime.Ticks'`
4. `npm test -- win32-launch --verbose` (main)
Expected if the bug is real: (1) `1,5`, a comma value, digits only. (3) de-DE, 5.1.…, a comma value, digits. (4) FAIL `Windows: a busy pi is not stopped as stalled`, with `cpu=0s` lines and STALL.
Decision:
- (1) prints `1,5`: build as written.
- (3) prints a comma but (1) prints `1.5`: 5.1 ignores the in-process switch. Skip M1's check, leave R-1890 untested, and cite P1 as its evidence.
- (3) prints a point: the read is culture-proof. Narrow to the fold, as an ordinary tests-only lane. Record the unreadable and exit-mid-read cases as residuals.
After the build: re-run steps 2–4 on the lane tip, plus `npm test -- watchdog-cpu --verbose`. Both pass under de-DE. This is end-to-end evidence, not a pin.

## Design
- pi-watchdog.mjs exports `parseCpuSample(raw, platform = process.platform)`, which returns seconds or null.
  - win32: trimmed text of digits only, divided by `WIN_CPU_TICKS_PER_SECOND` (worker-config.mjs; contract: .NET TimeSpan.TicksPerSecond).
  - elsewhere: trimmed `[dd-][hh:]mm:ss[.frac]`.
  - Anything else gives null.
- The win32 read runs `(Get-Process -Id N).TotalProcessorTime.Ticks`, an Int64 that prints as digits in every culture. Today's `.CPU` is a double that prints with the culture's decimal mark. Nothing exports the expression, because M1 runs the product's own read.
- Reads stay `execSync` by name through the shell. A thrown read gives null.
- After each read the loop yields once (setImmediate). If pi has exited, the attempt ends by pi's exit and prints no cpu line. Otherwise a null sample adds a flat poll, keeps the last readable time and prints `cpu=unreadable flat=n/m`.
- Ruling: an unreadable sample counts as flat.
  - Rejected "no sample": a dead reader would switch stall detection off, and pi-review has no wall-clock ceiling.
  - Rejected "N unreadable in a row": it adds an unmeasured tunable.
  - The exit re-check keeps the ruling from failing a finished pi.
- Fold, test fixture only: immutable-review's stall check gets a fake lifetime of a chosen 180 s and a guard of a chosen 120 s. Both were 30 s, and run 39348142806's Windows leg printed one cpu line in 30 s.

## Must-meet
| # | Row | Requirement | Test (packages/nana-pack/tests/watchdog-cpu.test.mjs::title) |
|---|---|---|---|
| M1 | R-1890 | WHERE the platform is win32, WHEN Windows PowerShell writes numbers with a decimal comma, the watchdog shall let a busy pi run until pi exits, without stopping it as stalled. | `R-1890: on Windows a busy pi runs to its exit when PowerShell writes a decimal comma`. SKIP on macOS and Linux: the Windows read runs Windows PowerShell 5.1, which exists only on Windows. |
| M2 | R-1891 | WHEN the watchdog's CPU sample parser reads a CPU read's output, it shall return seconds for a whole count of 100-nanosecond ticks on win32 or a ps time of the form [dd-][hh:]mm:ss[.fraction] elsewhere, ignoring surrounding whitespace, and no number for any other text. | `R-1891: the CPU sample parser reads whole Windows ticks and ps times, and no number from comma, point or empty text`, plus the seal `R-1891 seal: WIN_CPU_TICKS_PER_SECOND is 10,000,000` |
| M3 | R-1892 | IF a CPU read of a running pi fails or prints text the CPU sample parser returns no number for, THEN the watchdog shall print `cpu=unreadable` in that poll's line and count that poll as flat against the last CPU time it read. | `R-1892: unreadable CPU samples print unreadable and count as flat against the last readable time` |
| M4 | R-1893 | IF pi exits while the watchdog reads its CPU time, THEN the watchdog shall end that attempt by pi's own exit status, printing no STALL line. | `R-1893: a pi that exits during a CPU read ends by its own exit status, whether the read fails or repeats the last time` |

## Red today (probes in a temp copy of main, macOS)
- M1: pwsh 7.6.7 sat behind a `powershell` wrapper that sets the thread culture to de-DE (LCID 1031), with main's Windows read forced on.
  - A busy pi through pi-worker (`--poll 1 --stall-secs 3`) read `cpu=0s` 0/3 to 3/3, then STALL and exit 1.
  - The tick read went from 1.88 s to 8.10 s and passed.
  - Wrong code that reads `.CPU` in the product while a Ticks helper exists also stalled. A check on an exported expression alone stays green on it.
  - The wrapper printed `1,5` for `[double]1.5`.
- M2: main has no parser. Its inline parse turns `0,6416708` into 0 and `n/a` into NaN.
- M3: main ran with a cycling fake `ps` (`0:00.50`, `n/a`, `0:00.50`, exit 1). It printed 0.5s, NaNs, 0.5s, 0s, and flat never rose above 0/3. The rule gives 4 lines, then STALL at 5 s.
- M4: a fake `ps` released pi on the 4th read and waited for its exit.
  - When the read then printed the last time, main gave STALL and exit 1.
  - When the read failed instead, the plan's no-re-check design gave STALL and exit 1; main passes that case.
  - With the yield and re-check, both runs exited 0 with 3 cpu lines.
  - On that copy, watchdog-exit passed 6/6, review-ledger 165/165 and immutable-review 18/18.

## Known limits
- No suite test changes a real user culture. M1 sets a thread culture in a wrapper around the real PowerShell 5.1. The P1 run after the build is the user-culture evidence.
- The exit re-check yields once. If the OS has not reported pi's exit by then, that read still counts, and it can still end as STALL. This is inferred and rare. macOS ps prints `0:00.00` for an exited child the watchdog has not reaped yet (probed), so macOS never hit this case.
- Each Windows read still starts PowerShell. That takes about 1 s, and tens of seconds on a loaded runner. Reads still find `powershell` and `ps` by name on PATH.
- These stay for a separate test lane: the reclaim check's wait and the EBUSY at immutable-review's final cleanup, review-ledger.test.mjs:649's wait, and the stale "Until W7c" comments.