# Review brief — objective injection + knowledge pull, ROUND 3 of 3 (FINAL — the cap)

Read your rounds first: `/Users/jwang/nana-pi/docs/reviews/objective-knowledge-2026-09-16/sol-r1.md`, `sol-r2.md`; briefs `brief-r1.md`, `brief-r2.md`. Read-only. This is the last round the cap allows: after it the owner lands with residuals or subtracts. So: a finding is BLOCK only if shipping it would cause harm (wrong text in a system prompt, an unbounded/blocking hook, index corruption, a security hole); everything else is a RESIDUAL to record, not a reason to block.

## What was folded since round 2 (nana-pi main `7c6e4f4`; nana-agent-loop working tree for F)

- B: contract wording only — README, `bin/nana-knowledge.ts` comment, and the test comment now say the 1500 ms timer bounds ASYNC stalls (hung stdin, spawn); a synchronous stall inside one SQLite/fs call is bounded only by the harness hook timeout; the guarantee is fail-open, not fail-fast. Judge the wording, not the absence of a worker (owner's decision).
- C: the fold worker REJECTED the owner's rename-aside prescription after measuring it (32 processes × 25 races: remove-then-create 3 double-winners, rename-aside 12, landed mechanism 0). Landed: the whole reclaim (re-check staleness + remove + create) runs under a second single-purpose `wx` lock `build.lock.reclaim`; an orphaned reclaim lock is swept after 30 s on a path that never grants the build lock; staleness = dead owner pid (`kill(pid,0)` ESRCH) OR 10-min TTL; pid-owner-only release. `lib/build.ts:64-111`.
- H: 16 real node processes racing one stale lock → exactly one WON (`tests/hook.test.mjs:190-283`), plus deterministic gates: second reclaimer loses while the reclaim lock is held and leaves the stale lock alone; orphaned reclaim lock swept without granting; dead-pid lock reclaimed with fresh mtime.
- NEW (missing roots): rows purge only if their root was scanned or left sources.json; configured-but-missing roots' rows are preserved (`lib/build.ts:242-258`, `tests/incremental-build.test.mjs:95-118`).
- F: `/Users/jwang/nana-agent-loop/app/scripts/review-round.mjs` regex now `(?![a-z0-9])` on the trailing side; tests add `report-r4beta.md` and `round-4k-notes.md` → null.

## Files to read
`packages/nana-knowledge/lib/build.ts`, `bin/nana-knowledge.ts`, `lib/hook.ts`, `tests/hook.test.mjs`, `tests/incremental-build.test.mjs`, `README.md`; nana-agent-loop `app/scripts/review-round.mjs`, `app/tests/review-round.test.ts`.

## Output
Per open item B, C, F, H, NEW: CLOSED / RESIDUAL (record it in one line) / BLOCK (harm named concretely). Any NEW item: same three-way grading. End with `VERDICT: LAND` or `VERDICT: BLOCK` and one line.
