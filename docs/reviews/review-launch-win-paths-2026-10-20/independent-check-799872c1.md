# Independent check — review-launch-win-paths at 6136c925 (2026-10-20)

VERDICT: FINDINGS (no MUST finding: the code works and causes no harm; one HANDOFF line must change)

Setup: private clone at tip 6136c925, which is based on main 9552afb1. Every probe used a temp HOME and made-up names. The private copy is removed and no process is left running.

Must-meet and regression files, run singly on macOS
- `node packages/nana-pack/tests/review-launch.test.mjs`: "all passed". R-2250 to R-2253, R-2430, R-2431 and R-2255 PASS. R-2432 and R-2254 SKIP ("Windows leg only"). HOLDS.
- `review-ledger.test.mjs` 165 pass, 0 fail. `win-command.test.mjs` 47 pass, 1 skip. `win32-launch.test.mjs` 5 pass, 8 skip. All exit 0. HOLDS.
- `scripts/code-map.mjs --check`: "0 problem(s)". `requirements-moved.mjs --base 9552afb1`: R-2430 and R-2431 new (implemented), R-2432 new (untested). HOLDS.

Probes
1. macOS, real CLI, main against lane. Ran `review-ledger run --tree <tmp>/repo -- ./tools/review.sh` from another folder.
   Both: "verdict recorded for item probe-rel (round 1 …)", exit 0, 1 round. Unchanged. HOLDS.
2. macOS, main against lane, `-- tools/missing.cmd`.
   Both: "cannot start tools/missing.cmd: ENOENT", exit 1. The same line is in --out. 0 reservations, 0 rounds. Unchanged. HOLDS.
3. CLI forced to win32 (`node --import` sets process.platform). Ran `-- "other dir\review.cmd"` from a launcher folder outside the tree.
   Lane: "cannot start other dir\review.cmd: no file at <tmp>\repo\other dir\review.cmd", exit 1. The same line is in --out. res=0, rounds=0.
   Main: "ENOENT" here, because darwin has no cmd.exe. On real Windows, main starts cmd.exe instead.
   The path is resolved against --tree, not the launcher's folder. HOLDS.
4. Same forced CLI with the bare name `nana-absent-xyz`, main against lane.
   Both: "cannot start nana-absent-xyz: not on PATH", exit 1, the line in --out, res=0, rounds=0. Calling the resolver after admission changed no output order or text. HOLDS.
5. Resolver forced to win32, with an injected file check that records each path it checks:
   - `./tools/review.cmd`, cwd `C:\tree`: checks `C:\tree\tools\review.cmd`, then cmd.exe `""./tools/review.cmd" "-p""`. The word is kept as written. HOLDS.
   - `C:/Tools/R.CmD`: "REFUSED no file at C:\Tools\R.CmD". HOLDS.
   - UNC `\\srv\share\r.bat`: "REFUSED no file at \\srv\share\r.bat". HOLDS.
   - `C:\s p\stub.bat` present: cmd.exe `""C:\s p\stub.bat" "-p""`. HOLDS.
   - `..\tree\tools\review.cmd`, cwd `C:\work`: checks `C:\tree\tools\review.cmd` and starts it. HOLDS.
   - `C:\tools\missing.exe` and `C:\tools\codex`: start directly with no file check. Unchanged. HOLDS.
6. The exported file check (`defaultExists`) on edge inputs: a folder named `dir.cmd` gives false, a missing file gives false, and a name with NUL gives false with no throw. So the resolver cannot throw after admission and leave a reservation behind. HOLDS.
7. The R-2432 fixture output: `reviewShaped("VERDICT: LAND\r\n")` = true. The test's expected missing path and the resolver's path both come from the same `--tree` string, so a Windows short-name mismatch cannot occur. I infer that R-2432 passes on the Windows leg; nothing here ran cmd.exe. HOLDS (inferred).

Findings
- known bug: HANDOFF line 488 is untrue on the tip. It says "Review launcher on Windows (review-ledger-run-win-launch, final review): a mistyped .cmd or .bat reviewer path ends as no verdict with an empty output file … A lane to fix it is in planning." This lane fixes that, and HANDOFF.md is not in the lane diff.
  The seat must replace the line before the final round. It must also add a residual for each of the plan's known limits:
  - a .cmd removed between the check and the start still ends as "no verdict";
  - a bare name's relative PATH entries now resolve against the reviewed tree, with no row;
  - R-2432 stays untested until the Windows CI leg passes it.
  A landed line for the lane is also missing.
- known bug, low: an earlier lane's Windows mutation runner (`docs/reviews/review-ledger-run-win-launch-2026-10-20/seat-mutate-win.mjs`) anchors its edits on `const launch = reviewLaunch(child);`. That line no longer exists, so rerunning that old runner would fail to apply. CI does not run it, so nothing breaks today.

Not exercised: real cmd.exe on Windows (R-2432), and a drive-relative `C:review.cmd` when the tree is on another drive (outside the threat model).