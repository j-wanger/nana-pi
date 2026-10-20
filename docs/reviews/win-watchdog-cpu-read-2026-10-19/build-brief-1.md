# Build brief: win-watchdog-cpu-read, build 1
Feature: FEAT-007 · Review a specific revision independently (SUB-008; FEAT-006 shares the watchdog)
Class: install/hook/gate. Threat model: honest variation in PowerShell and ps output and timing is in scope; a forged reader or process is out.
Rows: R-1890 to R-1893 only, from block R-1890 to R-1899. Row text and red evidence: must-meet.md here. P1 result: probe-p1.log. If P1 says 5.1 ignores the in-process switch, skip M1's check.

## Change
1. REQUIREMENTS.md: add R-1890 to R-1893 to SUB-008's table after R-1395. Add all four to FEAT-006's Also applies.
2. bin/worker-config.mjs: add `WIN_CPU_TICKS_PER_SECOND = 10_000_000` with `// contract: .NET TimeSpan.TicksPerSecond, 100-nanosecond ticks (R-1891)`. Update @purpose and @outputs.
3. bin/pi-watchdog.mjs:
   - Export `parseCpuSample(raw, platform = process.platform)`, which returns seconds or null. win32: trimmed digits only, divided by the constant. Elsewhere: trimmed `[dd-][hh:]mm:ss[.frac]`, with days × 86400. Any other text, empty included, gives null.
   - cpuSeconds: win32 runs `powershell -NoProfile -Command "(Get-Process -Id N).TotalProcessorTime.Ticks"`; elsewhere `ps -o time= -p N`. Both go through execSync by name, as today. Never use execFileSync, because the tests' fake `powershell.cmd` and `ps` must intercept the call. Return parseCpuSample(output); a throw returns null. Export no expression helper.
   - Poll loop, right after the read: `await new Promise((r) => setImmediate(r))`. If exitCode or signalCode is set, break to the normal exit path, with no cpu line. Otherwise a null adds one flat poll, leaves lastCpu unchanged and prints `cpu=unreadable flat=n/m`. A number keeps today's comparison.
   - Header: @inputs and @outputs name the tick read, parseCpuSample and `cpu=unreadable`.
4. packages/nana-pack/README.md, Review runner paragraph only, two sentences: on Windows the CPU read is a whole tick count, so a decimal-comma culture cannot zero it. An unreadable sample prints `cpu=unreadable` and counts as flat, so a dead reader stops each attempt after --stall-secs; a pi that exits during a read ends by its own exit status.
5. New tests/watchdog-cpu.test.mjs with the six-tag header. Put each `// req:` directly above `check("<title>", …` on one line. Make every timing value a named constant marked `chosen` with its reason. A missing export fails only its own checks, by name.
   - Fixture B: a fake pi (writeFakePi on win32; elsewhere a sh wrapper that execs node, as watchdog-exit does). Mode hang has a chosen 30 s bound. Mode release writes an EXITED marker, prints a line and exits 0 once a RELEASE file appears.
   - Fixture B, reader: a fake first on PATH, `ps` (sh wrapper) on POSIX, `powershell.cmd` on win32 (`@echo off`, the node script, `exit /b %errorlevel%`). A counter file cycles it through READER_SEQ:
     - `good` prints `0:00.50` or `5000000`;
     - `na` prints `n/a` and exits 0;
     - `fail` exits 1;
     - `release-good` and `release-fail` write RELEASE, wait for EXITED, then wait until `process.kill(pid, 0)` throws or a chosen 1 s passes, then act as good or fail.
   - M1, win32 only (elsewhere one SKIP line with the reason): fixture A pairs writeFakePi with a body that spins until RELEASE (chosen 120 s cap) with a `powershell.cmd` node wrapper.
     - The wrapper runs `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -Command "& { [System.Threading.Thread]::CurrentThread.CurrentCulture = [System.Globalization.CultureInfo]::GetCultureInfo(1031); <the -Command text> | Out-String }"` and exits with its status.
     - Control: the wrapper prints `1,5` for `[double]1.5`.
     - Spawn pi-worker `--poll 1 --stall-secs 3 -- -p busy` with A first on PATH, and write RELEASE after 4 cpu lines (chosen: one past the 3-poll flat budget). Use a chosen 180 s guard.
     - Assert the control, exit 0, no STALL, and a positive number of seconds on all 4 lines.
   - M2, every leg, pure:
     - win32 digits → seconds via the imported constant: plain, with CRLF, with space or tab around.
     - win32 null: `0,6416708`, `0.6416708`, empty, `-1`, `1E-07`.
     - Elsewhere: `0:00.03` → 0.03, `  1:05.50\n` → 65.5, `00:01:05` → 65, `1-00:00:01` → 86401. `n/a` and empty → null.
     - Seal: `R-1891 seal: WIN_CPU_TICKS_PER_SECOND is 10,000,000`.
   - M3, every leg: pi-worker `--poll 1 --stall-secs 3`, hang pi, READER_SEQ `good,na,good,fail` cycling. Assert exit 1, STALL, exactly 4 cpu lines before it, lines 2 and 4 `cpu=unreadable`, and none `cpu=0s` or NaN.
   - M4, every leg: two runs with the release pi, READER_SEQ `good,good,good,release-good` and then `good,good,good,release-fail`. Each run: exit 0, pi's line in --out, no STALL, 3 cpu lines.
6. Fold, tests/immutable-review.test.mjs only: the stall fake (the win32 body's timer and the sh `exec sleep`) and the stall check's spawnSync guard read chosen constants: fake 180 s, guard 120 s. Change nothing else there.
7. Regenerate docs/code-map.md and docs/requirements-tree.md. The map, README and requirements checks must be green.

## Wrong code first; each must turn the named check red
- W1: the win32 read back to `.CPU` → M1 (Windows only; goes to the seat's pairs).
- W2: the parser turns a comma into a point → M2.
- W3: an unreadable sample gives 0 → M2, M3.
- W4: a null is skipped and the counter left unchanged → M3 (7 lines).
- W5: a null overwrites lastCpu → M3.
- W6: a thrown read gives 0 → M3.
- W7: a literal 1e6 in the parser → M2; the constant changed → seal.
- W8: the days prefix dropped → M2.
- W9: no yield and re-check → M4.
- W10: the re-check runs only after a null → M4's release-good run.

## Rules and Done
- Run single files only: watchdog-cpu, watchdog-exit, immutable-review, win32-launch, review-ledger. Never edit HANDOFF.md or docs/sessions/.
- Leave R-1890 `untested` with "Windows-only; awaits the lane's Windows CI". The seat flips it.
- Done: on macOS, M2, M3, M4 and the seal pass and M1 prints SKIP; the four existing files pass. R-1891 to R-1893 are implemented with their titles. The checks are green. W2 to W10 each ran red.

## Report, at most 10 lines
VERDICT; commits; macOS PASS/FAIL per check; W2–W10 results; files touched; what was not done.