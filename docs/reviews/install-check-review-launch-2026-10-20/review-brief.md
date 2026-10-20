# Review — install-check-review-launch (the install check runs one offline review through each installed pi-review launcher), 2026-10-20 (Opus, the lane's one final reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff 385c633f..HEAD` on `feat/install-check-review-launch` (main was `385c633f` when this brief was written;
`git merge-base HEAD main` is `385c633f`). The plan of record is
`docs/reviews/install-check-review-launch-2026-10-20/must-meet.md` (rows R-2070 to R-2076, new in FEAT-015's own table
directly after R-2004), with `plan-attack.md` (the adversary's AMEND, from a real offline review it ran on macOS) and
`build-brief-1.md` beside it. The build is one commit, `b234816e`, on the plan commit `d9117b91`; `2c5c747c` then merges
main `385c633f` (the hook-deadlines land), whose one conflict was the generated tree. The seat's notes commit after
`2c5c747c` changes no code, test or row. The seat's record `seat-verify-2c5c747c.md` holds CI run 39385972281 on draft
pull request #111 at 2c5c747c (0 failing files on macOS, Ubuntu and Windows; the Windows install-check job prints
`PASS pi-review (cmd)` and `PASS pi-review (sh)`, and the macOS job prints `PASS pi-review`), with both install-check job
logs beside it (`ci-install-check-windows-2c5c747c.log`, `ci-install-check-macos-2c5c747c.log`). It also records that
the seat ran the local macOS install check before review, and the builder's wrong-code tries as relayed. No seat pairs
and no independent check: an ordinary lane.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main` at 2c5c747c, against the merge base; the
seat's notes commit changes no row): seven rows added, all implemented; none retired, re-statused or reworded.

```
tree movement 385c633..2c5c747: 7 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-2070 new (implemented)
  R-2071 new (implemented)
  R-2072 new (implemented)
  R-2073 new (implemented)
  R-2074 new (implemented)
  R-2075 new (implemented)
  R-2076 new (implemented)
```

CAP-04 moves from 443 to 450 rows and FEAT-015 from 113 to 120.

The change under review: `PI_REVIEW` and `SPAWN_TIMEOUT_MS.review` (180000) in
`packages/nana-setup/lib/install-check-config.mjs` (every other export unchanged); the new faux fixture
`packages/nana-setup/lib/install-check-review.mjs`; in `install-check.mjs`, after the turn's lines and before `hook set`,
the review repository built through git commands led by the sealed options, the per-run record removal, launch, reads,
the exported pure `judgePiReview` and the `pi-review` result lines; the setup README's Install check section; seven
checks and a pin in `install-check.test.mjs`, plus the shared harness (the install stub writes the home's launchers; on
win32 a Git `cmd` folder on Path and an `exists` that accepts the home's `pi-review.cmd`, git.exe and bash.exe) and the
one allowed edit to R-1072's checklist check (its written-file list gains the review fixture file, outputs, record and
tally, and the stub's `.local/bin/pi-review` launchers count as install's); the regenerated tree and code map.

Judge whether each `pi-review` line proves what R-2071 to R-2075 say for a real fresh install: off win32 the review
starts by the path of the temporary home's bin link, not the checkout's script or the link's target; on win32 the
`.cmd` launcher starts under cmd and Git Bash runs a command naming `pi-review` bare, each once, from the review
repository, with its own item and an output outside that repository; the line is PASS only on exit 0 within the sealed
timeout, a last non-blank output line of exactly `VERDICT: LAND`, exactly one LAND round for the run's item in the
temporary home's tally, and a record written during that run holding the whole review standard, the run token and the
reviewer role. Judge whether the cmd run's record or tally line can pass the sh run. Judge whether R-2070's check proves
the commit succeeds where a runner gives no identity or requires signing, and whether the repository stays outside the
fixture project. Judge whether the review, its ledger and its record stay inside the temporary home, so no run touches
the caller's real review ledger. Judge whether the README section is true, and whether the stubs hide a launch shape the
real pi-review, cmd or Git Bash rejects, as the split prompt was hidden in pi-seat-live-turn's first build.

Threat model: honest variation in our tools' output and the OS in scope: macOS, Linux and Windows on Node 22; pi 1.0.2's
print-mode output; pi-review's output file, exit status and ledger lines; the three launcher forms and Git Bash's
argument handling; git identity and signing config on a runner; temp paths; a cold or slow CI runner. Deliberate forgery
out (a forged review file, ledger line or fixture record, a hostile extension). Lane class: ordinary — the lane changes
the install check only: its library, config, a test-only fixture extension (loaded only through `-e`, in no pi package
manifest, R-2076), its test file and the setup README's Install check section. It runs pi-review and the installed
launchers but changes no review tool (pi-review, pi-watchdog, review-round, the Windows launchers), no install,
uninstall or doctor code, no Claude Code hook, no shipped pi extension and no gate policy. Precedent: pi-seat-live-turn
and install-check-turn-edit-powershell, ordinary for the same kind of fixture. The owner's 2026-10-12 rule applies,
since the lane touches packages/nana-setup: the seat ran the macOS install check before review, and CI's Windows
install-check leg passed on the reviewed tip.

Check: (1) the must-meet checks are not vacuous: each reds on the wrong code the brief names (for R-2070 no identity
options, no signing option, or a repository inside the fixture project; for R-2071 the checkout's pi-review.mjs, the
link's real path, `pi-review` by name, the fixture project as cwd, or an output inside the review repository; for
R-2072 the cmd form only, the sh launcher by its full path, or the `.cmd` without cmd; for R-2073 exit 1 accepted, an
output ending `VERDICT: SEND-BACK`, or the first non-blank line read; for R-2074 two round lines, a null verdict, or
another item's line; for R-2075 no record removal before a run, a record without the standard, or without the role; for
R-2076 a fixture inside a pack's extension folder), and each row is no wider than its check; (2) the mocked suite and
the real runs agree: nothing in the stubs or the shared harness hides a launch or argument shape that the real
pi-review, cmd or Git Bash rejects; (3) the check and its tests write only inside the temporary home and the temp
folders they own, and no run reads or writes the caller's review ledger; (4) nothing else changed: no review tool,
install, doctor, hook, shipped extension or gate code, every existing check unchanged but the one allowed R-1072 edit,
and the regenerated tree and code map match a fresh run; (5) the plan's known limits are recorded as HANDOFF residuals,
and none of them hides a bug that stops the feature; (6) HANDOFF and the session entry are true, including the narrowed
Roster residual and the edited checklist-title residual; (7) any MUST.
