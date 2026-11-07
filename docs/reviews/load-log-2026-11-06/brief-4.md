# Brief 4: load-log, CI fixes on tip fee996bc (now 3e793169)

Feature: FEAT-041 · Shape each agent's context by role

CI failed the suite on ubuntu, macOS and Windows for two reasons.
1. The identity scan found the owner's home path in six committed `r2-*.log` files. The seat has redacted them in place (commit 3e793169 replaces fee996bc with the same code). Never commit a log that holds an absolute home or temp path; write paths relative to the repo, or as `~` and `$TMPDIR`, before committing evidence.
2. `R-3732: stalled measurement is killed and both launchers proceed within the deadline` failed on CI with "launch exceeded deadline plus 1500 ms margin". It passes locally. Find out whether the launcher really waits past the deadline on a loaded runner (the kill isn't prompt, or the spawn waits on the killed child's exit), or whether the margin is just too tight for a loaded runner. If it's the code, fix the code so a launch never waits on the measuring child after the deadline. If it's only the margin, measure the launch against a baseline launch with no stalled entry in the same test, so runner speed cancels out, rather than widening an absolute margin. Say which it was, with evidence.

Change nothing else.

## Precedent
- `packages/nana-pack/lib/pi-context-load.mjs` — the bounded child measurement.
- `packages/nana-pack/tests/context-anatomy.test.mjs` — R-3732's test.

Report: the tip, the cause you found with evidence, and the touched tests run.
