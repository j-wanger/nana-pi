# Review — install-check-turn-edit-powershell (the install check's live pi turn proves nana-post-edit on every platform, and on Windows nana-gate's block on pi's powershell tool), 2026-10-20 (Opus, the lane's one final reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff cdf4b098..HEAD` on `feat/install-check-turn-edit-powershell` (main was `cdf4b098` when the lane
branched and this brief's base was set; `git merge-base HEAD main` is `cdf4b098`). Main has since moved to `8466795b`,
the doctor-fix-line land, which touches none of the lane's install-check files, so a merge of main and a confirmation
round follow before the land. The plan of record is `docs/reviews/install-check-turn-edit-powershell-2026-10-20/must-meet.md`
(rows R-2000 to R-2004, new in FEAT-015's own table directly after R-1796), with `plan-attack.md` (the adversary's
AMEND, from a real offline turn it ran on macOS) and `build-brief-1.md` beside it. The build is one commit, `c21273a8`,
on the plan commit `8c751009`. The seat's record `seat-verify-c21273a8.md` holds CI run 39377875753 on draft pull
request #106 at c21273a8 (0 failing files on macOS, Ubuntu and Windows; the Windows install-check job prints
`PASS pi turn`, `PASS pi post-edit` and `PASS pi powershell gate`, and the macOS job prints the first two), with both
install-check job logs beside it (`ci-install-check-windows-c21273a8.log`, `ci-install-check-macos-c21273a8.log`).
It also holds the seat's local macOS install check on c21273a8 (16 items, all PASS) and the builder's wrong-code tries
as relayed. No seat pairs and no independent check: an ordinary lane.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main` at c21273a8, against the merge base; the
seat's notes commit changes no row): five rows added, all implemented; none retired, re-statused or reworded.

```
tree movement cdf4b09..c21273a: 5 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-2000 new (implemented)
  R-2001 new (implemented)
  R-2002 new (implemented)
  R-2003 new (implemented)
  R-2004 new (implemented)
```

CAP-04 moves from 416 to 421 rows and FEAT-015 from 96 to 101.

The change under review: `PI_TURN_EDIT` and `PI_TURN_POWERSHELL` in `packages/nana-setup/lib/install-check-config.mjs`
(`PI_TURN` byte-equal); in `install-check.mjs`, the post-edit merge into the temporary home's `nana-pack.json` under a
successful install, the win32 tool list before the turn's sealed arguments, `judgePiPostEdit`, `judgePiPowerShell`
and the `pi post-edit` and `pi powershell gate` lines (a timed-out turn now reports `timeout` and FAIL on all three
turn lines); in the fixture `install-check-turn.mjs`, one assistant message with the bash hit, the sealed write and,
only when pi's active tools hold powershell, the PowerShell verifier sample, plus its header; the setup README's
install-check paragraph; five checks and a pin in `install-check.test.mjs` (with `passingTurnRecord` extended and the
file's header `@effects` now `process`); the regenerated tree and code map.

Judge whether `pi post-edit` proves what R-2000 and R-2002 say for a real fresh install: the merged config holds
exactly one command, its match hits only the sealed file, the command run as nana-post-edit runs it prints the file
and exits with the sealed code on macOS, Linux and through cmd.exe on Windows, every other top-level key survives, and
the judge passes only on a write result not marked as an error with a `- check ` line holding the exit text and the
run token. Judge whether R-2001 leaves a missing, unparseable or non-object file exactly as install left it, so doctor
still judges install's own file. Judge whether `pi powershell gate` proves what R-2003 and R-2004 say: the tool list
reaches pi on win32 through both the direct and the `pi.cmd` launch and on no other platform, and the judge passes
only on an errored powershell result that starts with the gate's block text. Judge whether the fixture's new calls
can pass the judges without nana-post-edit or nana-gate doing the work, and whether a real macOS run could ever print
a `pi powershell gate` line. Judge whether the README paragraph is true, and whether dropping "does not cover the
PowerShell tool" loses a true limit.

Threat model: honest variation in our tools' output and the OS in scope: macOS, Linux and Windows on Node 22; pi
1.0.2's print-mode output and tool results, post-edit's failure-line text, the Windows shell and the `pi.cmd` launch
through cmd.exe, Node install paths, a cold or slow CI runner. Deliberate forgery out (a forged record file, a forged
`nana-pack.json`, a hostile extension). Lane class: ordinary — the lane changes the install check only: its library,
config, test-only fixture extension (loaded only through `-e`, in no pi package manifest, R-1796), test file and README
paragraph; no install, uninstall or doctor code, no Claude Code hook, no shipped pi extension, no gate policy, no land
or review tool. Precedent: pi-seat-live-turn, ordinary for the same fixture. The owner's 2026-10-12 rule applies,
since the lane touches packages/nana-setup: the seat ran the macOS install check before review, CI's Windows
install-check leg passed on the reviewed tip, and the seat runs the macOS install check again on the landing tip.

Check: (1) the must-meet checks are not vacuous: each reds on the wrong code the brief names (for R-2000 a dropped
placeholder, the match `.*`, `{postEdit}` alone, a source that exits 0; for R-2001 an unconditional write or a created
file; for R-2002 a result without the token, one marked as an error, one that says `exited 1`; for R-2003 the tool
list on every platform or none on win32; for R-2004 the line on linux or darwin, or a non-error result), and each row
is no wider than its check; (2) the mocked suite and the real turn agree: nothing in the stubs hides a launch or config
shape that the real pi or nana-post-edit rejects, as the split prompt was hidden in pi-seat-live-turn's first build;
(3) the check and its tests write only inside the temporary home, the fixture project and the temp folders they own,
and a gate that fails to block runs its samples there only; (4) nothing else changed: no install, doctor, hook,
shipped extension or gate code, `PI_TURN` and every existing check unchanged, and the regenerated tree and code map
match a fresh run; (5) the plan's known limits are recorded as HANDOFF residuals, and none of them hides a bug that
stops the feature; (6) HANDOFF and the session entry are true, including the three edited pi-seat-live-turn residuals;
(7) any MUST.
