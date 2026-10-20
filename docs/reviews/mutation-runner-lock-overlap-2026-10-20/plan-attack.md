# mutation-runner-lock-overlap — plan attack (one adversary)

Verdict: AMEND

AMEND. The planner found the right cause, but the design fails the subtraction test. The gate marker is the only thing that races the lift, and it is redundant. The check's `enteredFreshUnreadable` read already catches any worker that gets in while the starting lock exists (W2 below proves this with no marker present). So the amendment deletes the gate marker and its later removal, and keeps the planner's "found <holder>" diagnostic. The plan's pause, its new GATE_LIFT_PAUSE_MS tunable and its R-2120 row all exist only to guard the order of that redundant marker. Once the marker is gone there is no order left to get wrong. R-2120 also pinned the test's own steps, not anything the runner promises its user. The lane now adds no row, makes no REQUIREMENTS.md or tree edit, and touches one file.

Probes, all in a temp clone at 445f4d5b with a temp HOME:
- I built a standalone copy of the check's gate and worker phase and ran it 8 copies at a time beside 12 busy loops on a 10-core Mac.
- Today's order: 2 of 40 runs overlapped. The lines were `5:0 found gate` (the exact CI signature) and `2:0 found gate`, `2:1 found gate`. Two acquisitions under one gate show the parent stalled between its two removals.
- No gate marker: 0 of 200 runs overlapped. All 200 reached 2,400 acquisitions, and none entered the fresh unreadable lock.
- Plan's W1 (lift, pause, then marker): every run was red with `n:i found gate`, which confirms the planner's mechanism.
- Real test file with the amendment: 39 PASS, 0 FAIL.
- W2 (`held = false && …` on the unreadable-age line): the contention check FAILs with enteredFreshUnreadable true. The transient-retry check also turns red.
- W3 (1 in 100 contended publications steal the lock): FAILs with overlapText starting `2:49 found 1:25\n5:48 found 3:40`.
- code-map --check: 0 problems. requirements-trace: exit 0. readme-check: 718 claims, 0 problems.

Files the build will touch: packages/nana-pack/tests/mutation-runner.test.mjs only.

Conflicts:
- No in-flight branch touches the mutation-runner lib, config or test. I checked config-advice-fixes, handoff-pins, install-check-review-launch, install-cli-pins, pack-config-agent-dir-pins, pi-probe-timeout, project-check-quiet and win-lock-fix-command against their merge bases.
- No slate lane touches it either. notify-lifecycle-pins works in the lifecycle-journal and notify-dispatch tests, as a sibling's probe commit showed.
- Dropping the row removes the plan's CAP-07 tree-line clash with post-edit-timeout-name.

Lane class: ordinary. The change is tests only, with no product, install, hook, gate or land/review-tool code. It is simple, so a Claude Sonnet subagent builds it.

Incident for the seat: sibling planner agents share this session's scratchpad folder. A sibling overwrote my scratchpad file that recorded my temp-folder path. My first B, W2 and W3 runs therefore ran in that sibling's temp clone (the notify-lifecycle-pins planner). My test-file edit and lib wrong codes sat in its working tree for about 5 minutes. I reverted the test file with git checkout and removed my stray files. Its lane does not touch those files, and its HEAD commit holds none of my edits. I re-ran everything cleanly in my own clone, and the results above come from my clone. No real repository or home was touched. Fix for the seat: give each planner's scratch files unique names.

Most likely wrong: that the CI "5:0" came from the gate-lift gap. This is still inferred, because the CI record has no marker content. The load reproduction produced the identical `5:0 found gate`. The new diagnostic proves the cause on the next failure either way.
