# nana-setup — review adjudication (2026-09-18)

Ladder: one Opus 4.8 builder in a worktree; three gpt-5.6-sol rounds via `pi-review` (the runner itself moved to nana-pack the same day, so this was its first use from PATH); the seat verified every fold by running the suites and a dry run against the real home before each round.

| Round | Verdict | Real findings | Fold |
|---|---|---|---|
| r1 | BLOCK | 3 HIGH (duplicate `pi install` from a worktree; non-atomic settings write; win32 copy destroyed a rule) + 4 MEDIUM (hooks-shape crash mid-install; unquoted paths; long-key glob could pick another project; substring hook matching) | all seven, plus the seat's own catch (objective seed created when config points elsewhere) |
| r2 | BLOCK | settings write PARTIAL (compare before temp write); 2 MEDIUM (a command that mentions an invocation matched; any URL containing the repo path counted as registered) | lock + post-write recheck; parsed argv matching; anchored remote match |
| r3 (cap) | BLOCK | 1 HIGH: stale-lock **reclaim** raced (two reclaimers, one unlinks the other's fresh lock); 2 MEDIUM (trailing `&&` still matched; `file://` scheme accepted) | **subtracted** the reclaim path (a one-shot installer earns no second lock: stale lock aborts with the `rm` line); operators reject a command; scheme allowlist |

**Landed without r4 per the OBJECTIVE.md cap.** Every r3 item was implemented, not carried; the HIGH was closed by removing the mechanism rather than hardening it. Residual, documented in the package README: the POSIX floor between the final compare and `rename(2)` for a writer that ignores the lock.

Seat-side catch after merge: `pi-registration.test.mjs` asserted the environment it ran in (a linked worktree) instead of building one — green in the worktree, red on main. Fixed by the seat (the test now creates its own throwaway repo + worktree).
