# mutation-runner-win-prune — plan and must-meet tests

Feature: FEAT-031 · Run checks reliably and without contaminating work
Class: ordinary. The runner is a seat tool; no land or review tool calls it. One final reviewer.
Threat model: honest variation is in scope: a Windows file hold, a slow exit after a kill, a shard that dies, shards running git on one repository at once, and git's own refusals. Deliberate forgery and a hostile worktree layout are out; a finding there is a residual.

**Feature.** After a run without SEAT_MUTATE_KEEP=1 (one shard, three shards, or a shard killed outright), `git worktree list` in the lane repository names none of the runner's scratch worktrees, even when git's first remove fails, unless git still refuses after the retries, and then the record names the entry; every entry the runner did not create stays listed.

## What is wrong
`finish()` and `cleanupDeadShard()` in `packages/nana-pack/lib/mutation-runner.mjs` run `git worktree remove --force <wt>`, ignore a failure, then delete the folder. Git keeps the entry as "prunable". Windows CI run 39305895780 failed R-1231's three-shard case this way (`docs/reviews/win-pi-registration-test-2026-10-19/ci-windows-run-1.log`).
Cause: INFERRED. A held file inside the worktree folder does not keep the entry; git deletes the entry anyway. The entry survives when git refuses before deleting anything, or fails on the entry's own files under `.git/worktrees/`. Only the three-shard case failed, so another shard's git call reading those files is the likely Windows trigger.

## Design
One helper serves `finish()` and `cleanupDeadShard()`. The KEEP paths never call it.
1. First remove: today's call, unchanged: `git -c core.hooksPath=<no-hooks> -C <repo> worktree remove --force <wt>`.
2. On a non-zero exit, up to `WORKTREE_REMOVE_RETRIES` times: stop if `git worktree list --porcelain` no longer lists the entry; wait `WORKTREE_REMOVE_RETRY_MS` (synchronously, since `finish()` runs inside a signal handler); delete the `wt` folder; remove again, naming the entry by its unique suffix `<scratch folder base name>/wt`.
3. If the entry is still listed after the last retry, write one line: `seat-mutate: git worktree entry <wt> is still listed after <n> retries`. A shard puts it in its part file; the parent puts a dead shard's line in its notes. It reaches the output once and the record once.
4. Then delete the scratch folder, as today.

Why the suffix. Git documents a worktree's unique trailing path as its name. The suffix needs no real path. On macOS it found the entry although git lists `/private/var/…` for a `/var/…` folder, and it still found it after the scratch parent was gone, where the full path failed ("is not a working tree"). "Listed" means a `worktree ` line whose path, with `\` turned into `/`, ends with `/<suffix>`. No real-path, 8.3 or case folding is needed.
Why delete the folder before the retry: git refuses while the folder lacks its `.git` file, and it removes an entry whose folder is gone (probe: exit 0).
No `git worktree prune`: it acts on every entry in the seat's repository (probe: `prune --expire now` removed a decoy). No `--force --force`: a lock records someone's intent, so the entry stays and the line names it.
Sealed values in `lib/mutation-runner-config.mjs`: `WORKTREE_REMOVE_RETRIES = 3` and `WORKTREE_REMOVE_RETRY_MS = 250`, both chosen and not measured, neither overridable. The pack README's runner section names the line and states the order, the suffix and the no-prune trade.

## Fixture faults (deterministic, real git, every platform)
A pair's own edit sets a new probe mode. `drop-dotgit` deletes its worktree's `.git` file, so git's first remove refuses ("validation failed"). `lock-self` runs `git worktree lock` on its own worktree, so every single-`--force` remove refuses. Each has a `-selfkill` form that then kills its shard. The probe finds its worktree as `path.resolve(process.cwd(), "..")`. T4 counts removes in a `GIT_TRACE` file (lines with `trace: built-in: git worktree remove`) and reads their time stamps. There is no git shim and no timing race.

## Must-meet (`packages/nana-pack/tests/mutation-runner.test.mjs::`)
| T | Row | Test title | Red today (probe) |
|---|---|---|---|
| T1 | R-1770 | `mutation runner: when git's first remove of a scratch worktree fails at a shard's end, at one shard and at three, git worktree list names only the lane repository and no scratch folder is left` | 1 shard: 2 entries ("prunable"); 3 shards: 4 |
| T2 | R-1771 | `mutation runner: when git's first remove of a dead shard's scratch worktree fails, the parent leaves git worktree list naming only the lane repository and no scratch folder` | 2 entries |
| T3 | R-1772 | `mutation runner: a worktree entry the runner did not create, live or with its folder missing, is still listed after a run whose own first remove failed` | GREEN today (nothing prunes); a guard that W3 turns red (probed) |
| T4 | R-1773 | `mutation runner: a scratch worktree entry git keeps refusing to remove is removed again exactly the configured retry count of times, at least the configured delay apart, and one the first retry removes is not removed again` | lock run: 1 remove, want 4; drop-dotgit run: 1, want 2 |
| T5 | R-1774 | `mutation runner: a scratch worktree entry still listed after the last retry, at a shard's end and after a dead shard, is named with its retry count once in the output and once in the record` | no line in either run |
| pin | R-1773 | `mutation runner: sealed cleanup values: the retry count and the retry delay` | the names do not exist |

Probes: macOS, git 2.50.1, Node 22, a temp clone of main at 22ccd849, this fixture run through the real runner. Today's runner was red as listed. A prototype of this design was green on T1 to T5. Its lock run made 4 removes, 300 to 320 ms apart, and wrote the line once to the record at a shard's end and after a dead shard. Two wrong codes were probed. Comparing git's listed path with the raw full path left the entry on macOS (W7). `prune --expire now` removed a decoy (W3).

## Known limits
- Windows is the oracle for this lane's reason: the inferred cause, git's suffix lookup there, and R-1231's three-shard case. The seat reads the Windows leg on the built tip. One green run is weak evidence against an intermittent failure.
- On macOS and Linux a retry by the full path also passes, because the scratch parent still exists. Only Windows or a missing parent tells the two apart.
- R-1231 promises each entry removed. An entry something else locked stays, and the R-1774 line names it. R-1231's row and check stay unchanged; the overlap is a known limit.
- Git does not list an entry that lost its `gitdir` file. Its leftover files under `.git/worktrees/` stay until the owner prunes.
- A folder still held after the last retry stays, as today; R-1231's leftover check covers it.
- Out of scope: the record carrying a red baseline's FAIL lines (a separate one-row lane).
- The lane name says "prune", but the design never prunes.
