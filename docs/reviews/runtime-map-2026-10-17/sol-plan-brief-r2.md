# Plan review — runtime-map, 2026-10-17 (gate and format lane: round 2 of 2)

Review `CHANGE.md` in this folder on `feat/runtime-map` (main `61c5748`), now at seat revision 4. Round 1 sent it back with four MUST, five SHOULD and one NOTE; the
"Seat revision 4" section at the end of `CHANGE.md` names each change. What changed since round 1:
- MUST 1 rested on a premise Node 22 does not have: that a child started with an explicit environment lacking `NODE_V8_COVERAGE` gets no coverage variable. Node copies
  its own value into such an environment. The seat's probe (§3.1, §3.9, S18; Node v22.22.2, darwin): `roster-notice.test.mjs`'s five replaced-environment hook runs at
  `:406` and `:445` all wrote coverage with no preload, and a preload the seat had drafted added nothing on today's repo. So no preload ships. R-1297 now states Node's
  copy as a measured guarantee with no code of its own, and M17 pins it on the fixture measurement F1, whose test starts a node child with `env: { PATH }`. M17 has no
  pair of its own, because there is no code to break (§5.4). Residual 17 names the gap Node leaves: a child whose environment sets the variable empty or `undefined` is
  not credited. Judge whether M17 answers your MUST 1.
- MUST 2: a tracked file added, removed or changed since the measurement marks every block stale, zero-result blocks included (R-1292); the data holds every tracked
  file's hash (R-1285, R-1294; I3 to I5).
- MUST 3: a stop ends the suite's whole process tree (R-1298, M16): groups listed before the signal off Windows, `taskkill /T /F` on Windows; R-1288 and R-1289
  reworded; residual 12 shrinks to what CI cannot prove. MUST 4: D3's option (b) is gone; a measurement run never stands in for the ordinary locked suite before a land.
- SHOULDs and NOTE: knob refusal (R-1299, C7), dirty-tree case (M11), no-git note (R-1295, I6), pair 35's own timer (M15), 8.3 short path (R-1281; M7 forced, M11
  CI-only); probe cites named as the seat's scratch; leaf total 1,178. Counts: 30 rows (6 in FEAT-031, 24 in FEAT-029), 32 titles, 69 pairs, residuals 1 to 17.

The owner's reading stays binding: per test file, which code it actually runs (spawned children included) and how long it takes; the data stays on the machine, outside
the repo, and the map check never reads it. Threat model unchanged: honest variation in our tools' output and users' files in scope; deliberate forgery out. Lane class:
gate and format. The review standard pi-review appends governs the bar and the verdict line. Review the plan as a whole, and especially the change since round 1. Check:
(1) the suite's pass and fail are unchanged with the measure setting off, and a measure run can never turn a land green or red; (2) the data says which tests ran which
files and how long, and marks itself stale honestly; (3) one "shall" and a pinning check per row; (4) macOS and Windows; (5) whether M17 answers round-1 MUST 1;
(6) any MUST.
