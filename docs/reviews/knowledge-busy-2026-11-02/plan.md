# knowledge-busy — plan (revision 2)

Feature: FEAT-013 · Install and connect harness runtimes

Lane class (`node scripts/lane-class.mjs --root . --files packages/nana-knowledge/lib/db.ts,packages/nana-knowledge/lib/build.ts,packages/nana-knowledge/lib/hook.ts,packages/nana-knowledge/tests/build-busy.test.mjs,REQUIREMENTS.md,docs/known-bugs/FEAT-013.md,docs/requirements-tree.md,docs/code-map.md`): `hook: packages/nana-knowledge/lib/build.ts — directly imported by packages/nana-knowledge/bin/nana-knowledge.ts`. This is a hook lane: the seat's wrong-code pairs, a draft branch at build 1, then the macOS install check, the land reviewer and the independent check, which the Mac seat runs.

Revision 2 takes the pi adversary's attack (`plan-attack.md`, gpt-6-astra, 3 MUST and 3 SHOULD). It also takes a new probe the seat ran to answer MUST 3, `hook-churn-probe.txt`. That probe widens the fix from the build to the hook's own query.

## Purpose

The seat's words (2026-11-02): "Goal: openDb sets a busy timeout so the background index build no longer dies on 'database is locked' while another connection opens or closes; must-meet: a build run against an active read-write reader completes (your probe as the test), plus R-1713 green under the probe's contention."

This is a fix. It restores R-1713: "WHERE the platform is Windows, WHEN the installed knowledge hook command uses an index older than one hour, it shall print the existing index's matching pull block while a background build rebuilds the index." It also fixes the FEAT-013 known bug that windows-first-try-2 (PR #317) records: `openDb` sets no busy timeout.

### Evidence

- `openDb` (`packages/nana-knowledge/lib/db.ts:112-128`) sets no busy timeout, and node:sqlite's default is 0. The build path runs `PRAGMA journal_mode=WAL` at once (`db.ts:120`).
- **Build alone:** a real `nana-knowledge build` against a second process that opens, reads and closes read-write connections exited 1 with "database is locked" at `db.ts:120`. That happened in 3 of 15 builds (windows-first-try-2's adversary) and 2 of 8 (seat re-run).
- **Hook and build together, the seat's probe:** `hook-churn-probe.txt` in this folder. The real stale-index hook ran 20 times against a churning read-write reader on main's code, twice:
  - Run 1: no pull block 4/20, rebuild failed 5/20.
  - Run 2: no pull block 5/20, rebuild failed 5/20.

  Every no-pull hook returned in about 200 ms with empty output. So the hook's own query open fails busy at once, too. A build-only timeout would not make R-1713 green under contention.
- R-1713 failed on all 5 failing Windows CI legs of `hooks-win32-exec.test.mjs` since 2026-10-23 (`ci-fail-lines.txt` on PR #317).

## Assumptions

- A1: a busy error is not index damage. `indexDamage` (`db.ts`) returns damage only for `DAMAGE_CODES`. Its `errcode & 0xff` mask means extended busy codes (5 and its extensions) are excluded too. The builder confirms `DAMAGE_CODES` holds neither 5 nor 6. So a busy build fails, and recovery's delete never runs.
- A2: `PRAGMA busy_timeout=<ms>` works on every Node 22 in use. The `timeout` constructor option may not exist on older 22.x releases.
- A3: the hook may wait only briefly. `armDeadline` bounds asynchronous stalls only, so a synchronous SQLite wait blocks the event loop (`bin/nana-knowledge.ts:86-91`, `BUDGET_MS` 1500 in `hook.ts:28`). The query wait must therefore be a small fraction of the budget. A hook runs a handful of statements, each of which could wait once.
- A4: recovery keeps failing fast. `assertRecoveryDeleteSafe` sets `PRAGMA busy_timeout=0` explicitly before `BEGIN IMMEDIATE` (`build.ts:251-253`), and that explicit 0 stays.

## Open choices

- O1: the timeouts, in `db.ts` beside `openDb`.
  - `BUILD_BUSY_TIMEOUT_MS = 5000` (chosen). Far longer than a hook connection's open, query, checkpoint and close, which take milliseconds; far shorter than `LOCK_TTL_MS` (10 minutes). The build runs detached, so its wait never delays a prompt.
  - `QUERY_BUSY_TIMEOUT_MS = 100` (chosen). Long enough to wait out another connection's close or checkpoint, which take milliseconds. Small enough that several waits stay well inside `BUDGET_MS`.
- O2: who gets which.
  - `openDb` takes an optional `busyTimeoutMs`, and runs `PRAGMA busy_timeout` first, before any other statement.
  - Its default is `BUILD_BUSY_TIMEOUT_MS` when `create` is true, otherwise `QUERY_BUSY_TIMEOUT_MS`.
  - `buildLocked` passes `BUILD_BUSY_TIMEOUT_MS` to both its opens, the problem-probe at `build.ts:327` and the build open at 331. A build with a sources problem and an existing index therefore waits too (attack SHOULD 5).
  - Recovery keeps its explicit 0.
  - The hook, `status` and `search` take the query default.

## Questions for the owner

None.

## Threat model

In scope: honest variation in machines and load. That covers:
- a hook, a background build and other readers meeting on one index, on Windows and macOS, under CPU load;
- the first build, when WAL is set up, and later builds;
- Node 22 point releases.

Out of scope: deliberate forgery, such as another program holding a write lock on the index on purpose.

Residuals:
- A writer that holds the index longer than 5 s still makes a build fail. That is R-2403, amended below.
- A hook that meets a lock lasting longer than 100 ms still returns no pull for that prompt, failing open as today.
- The CI run with no pull block after a 2444 ms hook (40062423521) may be slow start-up rather than locking. This lane does not change hook start-up.

## Precedent

- `packages/nana-knowledge/lib/db.ts` — `openDb` (112-128), `indexDamage` and `DAMAGE_CODES`.
- `packages/nana-knowledge/lib/build.ts` — `assertRecoveryDeleteSafe` (245-289), whose explicit `PRAGMA busy_timeout=0` is the house form; `build` (297-317) and `buildLocked` (321-338); `LOCK_TTL_MS` (25); `acquireBuildLock`, which writes `build.lock` before the build opens the index (the barrier M1 uses).
- `packages/nana-knowledge/lib/hook.ts` — `BUDGET_MS` (28) and the query open (180).
- `packages/nana-knowledge/tests/recover.test.mjs` — the R-2403 checks (385-388), a second process holding a write lock (around 207-260), and busy detection (146).
- `packages/nana-knowledge/tests/hook.test.mjs` — `seal: STDIN_MAX_BYTES` (346), the seal form.
- `docs/reviews/knowledge-busy-2026-11-02/hook-churn-probe.mjs` — the seat's probe, which M2 turns into a test.
- `docs/reviews/writing-adoption-2026-10-21/seat-mutate.mjs` — the seat wrong-code pair table on the shared mutation runner.

## Outside precedent

- SQLite, `busy_timeout` and WAL (public domain): **adopt** `PRAGMA busy_timeout`, the documented fix for SQLITE_BUSY between connections. No code is taken.

## Must-meet

Rows R-3590 to R-3594 go in the FEAT-013 table in `REQUIREMENTS.md` first, each tagged `// req:` on its check, in a new file, `packages/nana-knowledge/tests/build-busy.test.mjs`.

R-2403 is amended (attack MUST 1). It now reads: "IF another connection holds a write lock on index.db for longer than `BUILD_BUSY_TIMEOUT_MS`, THEN the knowledge build shall fail and keep every committed row of the index." Its two recovery checks keep their assertions; their case limits may need the 5 s wait added. The tree movement is FEAT-013 only.

The FEAT-013 known-bug line on the missing busy timeout is removed if PR #317 has landed by build time; otherwise the builder says so. New-behaviour checks (M1, M2) are red on main's code, recorded in the lane folder. Preservation checks (M3) and seals (M4) are not expected to be red (attack SHOULD 6).

- **M1 · R-3590** — WHEN a knowledge build opens the index while another connection holds a write lock that it releases within `BUILD_BUSY_TIMEOUT_MS`, the build shall wait, complete with exit 0, and advance `built_at`. Proves: the build fix, deterministically. Pins:
  - A child process holds `BEGIN EXCLUSIVE` on `index.db` and prints `ready`.
  - The test then starts a real `nana-knowledge build`, and waits until `build.lock` exists. That proves the build is past its lock, with the index open next.
  - The child releases 500 ms after that.
  - The build exits 0, and `built_at` is newer than before. On main's code it exits 1 with "database is locked" (red, recorded).
  - Two cases: an index that already exists, and the first build, where WAL is set up (attack SHOULD 5).
  - Every child has a watchdog and is ended in `finally`.
- **M2 · R-3591** — WHILE another process opens, reads and closes read-write connections on the index, the installed knowledge hook on a stale index shall print the matching pull block, and its background build shall advance `built_at`, on every one of 10 runs. Proves: R-1713 holds under the probe's contention, as the seat asked. Pins:
  - The seat's probe as a test: a churn child, then 10 runs of the real `nana-knowledge hook`. Each run checks the pull block and that `built_at` advanced within 15 s.
  - Each failure detail names the run, the hook's time and stdout head, and `built_at`.
  - On main's code, `hook-churn-probe.txt` shows 4 to 5 of 20 runs failing each half. Record the red count from a run of the test on main's code.
- **M3 · R-3592** — The hook's wait for a locked index shall stay inside its budget, and recovery shall still refuse at once. Proves: the timeouts did not break the hook budget or recovery's fail-fast (attack SHOULD 4). Pins:
  - With a child holding `BEGIN EXCLUSIVE` for 3000 ms, the real hook on that index exits 0 within `BUDGET_MS` plus 1000 ms, printing no pull.
  - The existing R-2403 recovery checks pass, with their assertions unedited.
  - `PRAGMA busy_timeout`, read back, is `QUERY_BUSY_TIMEOUT_MS` on a default open and `BUILD_BUSY_TIMEOUT_MS` on a `create` open. Supporting evidence only.
- **M4 · R-3593 and R-3594** — seals:
  - R-3593: "The knowledge build's busy timeout shall be 5000 ms."
  - R-3594: "The knowledge query's busy timeout shall be 100 ms."
  Each value is pinned by one check; every other assertion imports the name.
- **M5 (evidence)** — on the reference Windows laptop:
  - `hooks-win32-exec.test.mjs` passes 10 runs in a row with four CPU-bound processes on every core;
  - `hook-churn-probe.mjs` on the built code shows 0 of 20 failing in each half;
  - every touched knowledge test passes;
  - `node packages/nana-setup/bin/install-check.mjs` runs, and its exit is reported.
  The Windows and macOS CI legs are the suite.

Expected changes (a forecast, not a limit):
- `packages/nana-knowledge/lib/db.ts` and `packages/nana-knowledge/lib/build.ts`;
- the new `packages/nana-knowledge/tests/build-busy.test.mjs`, and `recover.test.mjs` case limits if needed;
- `REQUIREMENTS.md`, `docs/requirements-tree.md`, the code map if needed, and `docs/known-bugs/FEAT-013.md`;
- one session entry in the current `docs/sessions/` file, newest first.
