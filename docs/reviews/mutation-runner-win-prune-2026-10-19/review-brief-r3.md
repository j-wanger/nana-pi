# Review round 3 — mutation-runner-win-prune, 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-031 · Run checks reliably and without contaminating work (the seat mutation runner). Class: ordinary. Threat model as rounds 1 and 2: honest variation in our tools' output, the OS and shards running git on one repository at once in scope; deliberate forgery out. This is the last round the cap allows.

Round 2 (yours) on `d9955553`: SEND-BACK with M3 (the lock threw EPERM on Windows under contention; CI run 39342973804's Windows leg was red on R-1776), S5 (a lock naming a pid that never dies was held forever), and NOTEs N1 to N3. This round reviews `git diff d9955553..HEAD` on `feat/mutation-runner-win-prune`:

- `a12701de` build brief 4 (your findings, verbatim in substance).
- `c8db77a4` build 4 (a pi gpt-5.6-sol builder): EPERM, EACCES and EBUSY from the lock's read, stat, link, unlink and release count as held and retry, on every platform; a release that keeps failing records one line naming the lock (new R-1778). Any lock naming a live holder makes a waiter stop after the sealed `WORKTREE_LOCK_WAIT_LIMIT_MS` (30,000 ms, chosen), record the lock and holder pid once, and leave the lock in place (new R-1779). A missing lock variable fails with one line naming it (N2). The new checks inject the errors, so they run on macOS too.
- `f5851dc1` merges main f0d6da24. CI run 39347932197 on that tip: macOS 165 PASS, 0 FAIL, 2 SKIP of 167 files; Ubuntu the same; Windows 150 PASS, 0 FAIL, 17 SKIP; install-check passes on both. On Windows R-1775, R-1776, R-1778 and R-1779 pass by title (`ci-windows-run-3.log`).
- `76f75878` merges main 4656f646 (pwsh-lexer-oracle and the lanes before it; no mutation-runner file). Review it as `git show --remerge-diff 76f75878`.
- The commit adding this brief: the seat's record of round 2 and build 4, the HANDOFF line and session entry for builds 3 and 4, the scrubbed Windows log, and the removal of two HANDOFF lines the merge helper had kept (a doubled win-pi-registration-test line, and a knowledge-refresh-pin line main had already removed).

Seat checks on this tip: the requirements trace exits 0 (1445 total, 0 rows off form); `map:check` 0 problems. Tree movement against main (4656f646): FEAT-031 gains R-1770 to R-1779, all new and implemented.

Check: (1) M3 is closed — no lock operation can throw a transient Windows error out of a shard or out of the release, and R-1776 still asserts zero overlap and complete ownership; (2) S5 is closed without stealing a live lock, and the 30,000 ms value is sealed and pinned by one check naming its row; (3) the new checks would fail on d9955553's code (the error injection reaches the real code path, not a copy); (4) nothing main's runner does today stopped working, and the tests stay in temp folders; (5) the rows match their checks, and HANDOFF and the session entry say nothing the record does not; (6) the merges keep both sides with nothing lost or doubled; (7) any MUST.

Answer with the full review as your final message: MUST / SHOULD / NOTE, a score, and as the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
