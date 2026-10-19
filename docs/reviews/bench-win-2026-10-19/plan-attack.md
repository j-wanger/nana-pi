# Adversary verdict — bench-win (2026-10-19)

Verdict: AMEND

AMEND. The plan is sound. Three changes made it smaller and sharper, and every claim below was probed in a temp clone of the win-leg-blocking tip b88d62f, with a temp HOME and single files only.
(1) I dropped the spawner row (plan R-1521). It pins a test seam, not user behaviour. Six existing checks already pin the seam: when callJudge ignores `spawn` (W1), R-1520, the four R-537 stub checks and "judge well-formed" all go red (probed: 70 pass, 6 fail). The skip-list row is renumbered R-1522 → R-1521. That leaves 2 rows, and the R-291 leaf-total bump is +2.
(2) R-1520 now sets TMPDIR/TEMP/TMP to a fresh folder for the call and compares realpaths against that folder. The plan's known limit ("passes on today's code when TMPDIR is unset") is gone. Probed: `cwd: "/tmp"` + seam fails under the runner AND in a direct run with TMPDIR unset. `cwd` omitted fails (child in apps/bench). `cwd: os.tmpdir()` passes (76 pass).
(3) The unguarded "judge well-formed" call now becomes a guarded FAIL. Probed: without the guard, on commit 1 and under W1 the file crashes after 5 FAILs. Any new check placed after it never prints, so the plan's "paste the red lines" step could not happen. That same crash hid 6 checks on Windows run 2.
Confirmed as the plan stated:
- R-1521 (skip list) is red on b88d62f (test-runner 43 pass, 1 fail) and passes once the 4 entries are removed (44). R-1380..R-1383 stay green; their `listedPaths.length > 0` still holds with 16 desk entries.
- The argv, usage and agentdir edits pass on macOS: 32 pass + 1 skip, 90, 26.
- Under path.win32, both expected values equal path.resolve's result.
- W5 turns the argv check red and W6 turns the usage check red.
- On CI Windows run 2, catch-ledger had 65 pass and 4 fail, then crashed. "judge missing" already passes there. Corpus paths use "/" there, so the CLI checks are plausible.
Smaller fixes:
- test-runner's `check(n, ok)` takes no extra argument, so offenders must be logged on their own line.
- CI runs only on PRs and main, so the seat needs a draft PR to get Windows evidence (the repo already does this).
- The seat should remove HANDOFF's "Bench tests on Windows (win-leg-blocking)" residual.
- The plan said R-501/R-513/R-514 cite the edited checks. Only R-508 and R-537 cite edited titles, and the titles stay the same anyway.
Class: ordinary is right. No change touches scripts/test.mjs, a hook, an extension, the gate or the land and review tools. Removing skip entries can only make the runner run more files.
Conflicts: verified against every worktree's diff from main. Only win-leg-blocking touches apps/bench, windows-skips-config.mjs and test-runner.test.mjs, so the build must wait for it to land. Every other in-flight lane shares only the regenerated files: REQUIREMENTS.md, the tree, the R-291 literal and the code map.
The plan writes nothing outside the lane worktree.
