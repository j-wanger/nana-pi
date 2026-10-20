# install-link-race — plan attack (one adversary)

Verdict: AMEND

AMEND. I replaced the planner's fsops hardening with a change to how long install holds its lock. All probes ran in a throwaway clone of main 6f0098a8 on macOS with Node 22.22.2 and a temporary HOME. No probe process remains, the probe folder is deleted, the real ~/.claude has no lock, and the repo is clean.

Root cause, reproduced with a real second process:
- install() releases the settings lock right after the settings step, so shared memory, pi config, subagent, reviewer, knowledge and PATH all run unlocked.
- I wrapped lstat of <bin>/pi-review and started a real `nana-setup install --home <same>` just after the look returned.
- Today the lock was gone at the look, the second install exited 0, and the first threw EEXIST (symlink). That is the install-honest-report independent check's residual (1 of 40 staggered pairs).

Candidate fix, eight changed lines in install(): run those file steps inside the one withSettingsLock call and move stepKnowledge after PATH, outside the lock. Results:
- The second install exits 2 with today's "locked by another nana-setup run … Nothing was written" message.
- The first install exits 0 with all four PATH rows created.
- The lock is absent when the knowledge build starts, so the prior lane's promise holds: a Ctrl-C during a slow step leaves no lock.
- The same results hold with the platform forced to win32 (shim branch).
- Nine install-adjacent files pass on the candidate: settings-merge 221, install 109, win32-degrade 88, rulings-install 8, settings-lock 6, uninstall 31, win-shims 2, retired-artifacts 47, doctor-fix-line 9.
- Five wrong versions were probed. Each turns at least one of the four checks red (table in the brief).
- I also started a second install at the first's knowledge-build spawn, after the release. Both runs exited 0.

Why the planner's plan loses the subtraction test:
1. It adds a settle protocol, hard-link backups, a bigint identity compare, two contract code sets, a hard-link fallback and a change to the PATH-row fold. The amendment is an eight-line move.
2. It changes the everyday Windows backup path (link plus unlink instead of rename) for every install, to fix a crash that only a race causes. The planner named that NTFS behavior as its own most likely wrong claim, and a Mac cannot prove it.
3. It leaves seed files last-writer-wins. The lock covers them.
4. Its R-2266 fold bug can only happen once writeBytesWithBackup returns PROBLEM, which only the plan's new code would make it do. Dropped.
5. Its tests stage the race by faking lstat inside one process. The amended test starts a real second install.
6. "No backup replaces another backup" now holds by construction, because two installs never run file steps at the same time.

Rows: there are four. R-2264 to R-2269 stay unused. All IDs are free on main and in every worktree.

Lane class: install, hook or gate, because it changes nana-setup install code. The builder can be the simple-lane Claude Sonnet subagent.

Files the build touches:
- <repo>/packages/nana-setup/lib/steps.mjs (install() and two header lines)
- <repo>/packages/nana-setup/tests/install-overlap.test.mjs (new)
- <repo>/packages/nana-setup/README.md (lock paragraph, main lines 309-316)
- <repo>/REQUIREMENTS.md
- <repo>/docs/code-map.md
- <repo>/docs/requirements-tree.md
- <repo>/docs/reviews/install-link-race-2026-10-20/ (seat)

lib/fsops.mjs is not touched. The seat closes the HANDOFF residual "Install lock (install-honest-report): the lock ends after the settings step…" in the reviewed change.

Conflicts. None needs a wait.
- checkout-spelling-converge edits steps.mjs linkSkill (main 297-310) and README lines 282-292 and 476. This lane edits install() (main 1101-1125), header lines 13-14 and 25-27, and README 309-316. The hunks are separate.
- realpath-strict-fallback edits README lines 283 and 476. Separate.
- pack-config-utf16 (this slate) may edit the pi-config reader (around 676) and the header @inputs (lines 4-10). Its hunks only clash with this lane if they reach header lines 11-14. Check its brief.
- mutation-runner-takeover-race changes the runner the seat uses for this lane's pairs. The seat can use main's runner.
- gate-rm-bare-repo, review-ledger-run-win-launch, notify-lifecycle-pins, handoff-cap-surrogate and post-edit-values-named have no overlap.
- REQUIREMENTS.md and the generated tree and map: merge current main and regenerate before the final round.

The claim most likely wrong: that nothing reads the order of the knowledge index row against the PATH rows. I grepped tests, install-check and the README, and ran nine install files green. I did not run fresh-machine, readme-rehearsal, install-check.test, skills-and-standards or the doctor-* files. Second most likely: that the staged overlap behaves the same on the Windows leg. That is inferred; only the CI leg can show it.
