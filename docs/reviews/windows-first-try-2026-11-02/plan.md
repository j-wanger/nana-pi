# windows-first-try — plan (revision 2)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane class (`node scripts/lane-class.mjs --root . --files packages/nana-pack/tests/mutation-runner.test.mjs,packages/nana-pack/tests/post-edit-status.test.mjs,REQUIREMENTS.md,docs/known-bugs/FEAT-031.md,docs/requirements-tree.md`): `ordinary`. Editing `packages/nana-pack/lib/profile-sync.mjs` would make a lane `install` (`doctor.mjs` imports it). This lane does not touch it.

Revision 2 takes every MUST and SHOULD in `plan-attack.md`. The adversary corrected both flakes' causes (MUST 1 and 3). The seat then checked the profile-sync run (MUST 5): it ran before the 420 s lock wait existed, so that failure is already fixed.

## Purpose

Issue #213: "Since 2026-10-22, flaky tests failed 32 of 171 first Windows runs, about 18%." The seat's words for this lane (2026-11-02): "lower the rate of Windows CI suite legs that fail on their first try. Plan from evidence … fix the top one or two flakes in their tests only (no product change unless a test proves a product bug)." The seat approved this scope on 2026-11-02: the mutation-runner stagger check and the post-edit-status `timeoutMs 0` check, test-only.

This is a fix. It restores the FEAT-031 contract that the suite judges behaviour, not machine load. That covers R-1238's stagger check and R-1702's no-deadline check on hosted runners. R-1702 belongs to FEAT-030. R-3531 still goes in FEAT-031, because it pins the check's reliability, not post-edit behaviour, as the windows-local-suite rows R-3450 to R-3455 did.

### Evidence

`ci-windows-failures.tsv` in this folder lists every failed `suite (windows-latest)` job on main and `feat/*` since 2026-10-22, every attempt: 116 jobs from 472 ci runs, pulled by the seat with gh on 2026-11-02. The seat also pulled the FAIL lines for the runs named below. Ranked by failures since 2026-10-28:

| File | All | Since 10-28 | Read |
|---|---|---|---|
| component-audit | 17 | 17 | **Already fixed.** All 17 ran on commits without 354acb80 (audit-test-speed). 68 ci runs since 2026-11-01 15:00Z contain it, with no failure. |
| identity-scan | 8 | 8 | **Not a flake.** Every failure is the content check "no tracked file outside the allowlist carries an identity word". A lane had committed a log holding an identity word, and each lane removed it before landing. |
| mutation-runner | 6 | 3 | **Flake, fixed here (M1).** Two of the four pulled failures are the stagger check, on 2026-11-01 and 2026-11-02. |
| profile-sync | 4 | 4 | **Already fixed.** One EBUSY (fixed on main by 151c7099); one branch bug; one "profile refused: locked" on 3923f3bd, whose `PROFILE_LOCK_WAIT_MS` was still 5000, so a wait timed out on a loaded runner. a4bf0dd1 raised the wait to 420 s, and 3923f3bd does not contain it. |
| memory-run, requirements-tree, issue-watch | 3-4 each | 3-4 | Branch failures fixed before land, per the seat. |
| post-edit-status | 3 | 3 | **Flake, fixed here (M2).** The no-deadline check failed on main twice (40694488894; 41002620531 on both attempts). |
| worker-claude, memory-end-hook | 11, 4 | 2, 4 | Already fixed on main (signal-test-race, memory-end-ebusy). |
| hooks-win32-exec | 5 | 2 | Two failures on two branches on 2026-11-01. The next candidate, not in this lane. |

The stagger check's own detail, from the FAIL lines:
- run 41372383280: `gap: 148`;
- run 41299044352: `gap: 118`.

In both, wt1 equals wt3 and wt2 differs, as round-robin expects. The PR 244 macOS failure was gap 147. Only the gap fell short.

Expected effect: these two checks caused 5 of the failed Windows jobs since 2026-10-28 (2 stagger, 3 no-deadline), plus one macOS stagger failure. This lane lowers the first-try rate, but it does not close #213; hooks-win32-exec, objective-golden and worker-lane remain.

## Assumptions

- A1 (corrected by attack MUST 1): shards share one worktree-operation lock (`mutation-runner.mjs:288`, handed to each shard at :700 and :718, polled every 25 ms). Each shard logs its header with the timestamp only after its `git worktree add` under that lock (`mutation-runner.mjs:556-559`). The parent starts shard k at `(k-1) * staggerMs` (:728).
  - If shard 1's set-up span, from its node start to its add's end, outlasts the stagger, shard 2 waits for the lock. The gap is then shard 2's own add plus up to 25 ms.
  - The adversary measured that add at 99 to 115 ms on the idle laptop. That matches CI's 118 and 148 ms.
  - So the check fails whenever shard 1's set-up span exceeds the 300 ms stagger.
- A2 (corrected by attack MUST 3): the no-deadline check fails when either side is false.
  - `controlOk`: the control check, with a 300 ms deadline, is not hung, and exactly one timer of 300 is armed.
  - `zeroOk`: the `timeoutMs: 0` check is not hung, no timer is armed, and the status reads "✓ 1 check".
  - Starting node through the shell took 99 to 123 ms on the idle laptop. On a loaded runner the control's `SLOW_PASS_CMD` (a 100 ms sleep) can outlast 300 ms. Its deadline then fires and arms the 2000 ms kill grace, so the recorded timers are `[300, 2000]` and `controlOk` is false.
  - Inferred, because the log prints only the bare FAIL line. A 5 s hang of either case is the less likely side.
- A3: neither check's subject changes. R-1238 still means shards start a stagger apart and run at the same time in different worktrees. R-1702 still means no deadline is armed for `timeoutMs: 0`.

## Open choices

- O1: the stagger check's margin. Default: a named test constant replaces the inline `300` and is set to 2000 ms. The threshold stays `gap >= staggerMs / 2`, computed from that constant, never from the environment value.
  - 2000 ms is far above shard 1's set-up span: about 110 ms idle, and a few hundred ms under load, inferred from the CI gaps.
  - The check's `run()` call passes `NANA_TEST_WAIT_MS` as the existing `CONTEND_WAIT_MS` (30 s), so the rendezvous pairs still meet (attack MUST 2). Today that call passes no wait, and the probe's default is 4000 ms.
  - The cost is about 2 s more test time.
- O2: the no-deadline check's control deadline. Default: a named test constant far above a node start, 10000 ms, replaces the control's `300`. The control asserts exactly one timer of that value. The `SLOW_PASS_CMD` sleep stays at 100 ms. Both cases call `settle` with a named watchdog of 30000 ms. Other cases keep 5000 ms.
- O3: failure detail. The seat asked that the next failure say which side failed.
  - The stagger check's `why` already prints JSON. Add each shard's header time relative to the parent's start (attack MUST 1).
  - The no-deadline check prints one line right after its FAIL line, as JSON: `controlHung`, `controlRecorded`, `controlStatus`, `zeroHung`, `zeroRecorded`, `zeroStatus`.
  - Both checks keep their titles, and their PASS lines stay byte-identical, so name lists and evidence cells do not move.

## Questions for the owner

None.

## Threat model

In scope: honest variation in machine and load. That covers:
- hosted Windows and macOS runners in a four-job pool;
- the reference Windows laptop;
- slow `git worktree add` and slow node start-up.

A check must judge its requirement on all of them, and must still fail when its behaviour is broken: no stagger, or a deadline armed for `timeoutMs: 0`.

Out of scope: deliberate forgery, such as a runner that fakes its header timestamps.

Residuals:
- A machine where one `git worktree add` takes 1000 ms or more would let a missing stagger pass the check (attack SHOULD 6). The serialized add alone would then exceed the threshold.
- A runner whose shard set-up spans more than about 2000 ms could still fail the stagger check.
- `withProfileLock` (`packages/nana-pack/lib/profile-sync.mjs:29-31`) refuses at once on any lock-create error other than `EEXIST`. A transient Windows sharing error would therefore read as "locked" instead of waiting. This is inferred from the code only: no failure in the evidence shows it, and a delete-pending probe did not reproduce it on Windows 11. It is not recorded as a known bug. Fixing it would make a lane `install`.
- Other first-try failures (hooks-win32-exec, objective-golden, worker-lane) stay for a later lane.

## Precedent

- `docs/reviews/windows-local-suite-2026-11-01/plan.md` — the last test-only Windows reliability lane: evidence first, test changes that keep every assertion, a mutated run proving a check can still fail.
- `packages/nana-pack/tests/mutation-runner.test.mjs` — the file itself:
  - `CONTEND_WAIT_MS` (line 1348) is a named wait passed through `NANA_TEST_WAIT_MS`, reused for the stagger check;
  - `check(name, ok, why)` already prints a `why` detail on failure.
- `packages/nana-pack/lib/mutation-runner.mjs` — the worktree lock (:288, :700, :718), the header after set-up (:556-559), and the parent's stagger (:728). Read only, unchanged.
- `packages/nana-pack/tests/post-edit-status.test.mjs` — `settle(promise, limitMs = 5000)` (line 40) already takes a limit.
- `packages/nana-pack/extensions/nana-post-edit.ts` — the deadline code R-1702 pins; line 244 is `timeoutMs > 0`. Read only, unchanged.
- `docs/known-bugs/FEAT-031.md` — line 5 says the stagger check "may fail on a loaded machine". This lane removes that clause and keeps the rest of the line.

## Outside precedent

- Node.js `child_process` and timers documentation (MIT): **borrow** only the fact that spawn and timer delays are lower bounds under load, so a test must not treat a short wall-clock gap or deadline as exact. No code is taken.

## Must-meet

Rows R-3530 and R-3531 go in the FEAT-031 table in `REQUIREMENTS.md` first. Each is tagged `// req:` on its check, appended to that check's existing req line. The FEAT-031 line 5 clause is removed. Every other check in both files stays byte-identical.

- **M1 · R-3530** — The mutation runner's stagger check shall use a 2000 ms stagger from a named constant. Its rendezvous wait shall be `CONTEND_WAIT_MS`. It shall keep every assertion: exit 0, wt1 equal to wt3, wt2 different, GREEN 1 and GREEN 2, and `gap >= staggerMs / 2` taken from the constant. Proves: shard 1's set-up no longer fails it, and it still catches a missing stagger. Pins:
  - the check passes on the reference laptop alone, and in the full suite;
  - a mutated run with `SEAT_MUTATE_STAGGER_SECS=0` and the threshold unchanged makes the check FAIL, showing the gap and the shard header times. Recorded in the lane folder (`m1-mutation-win32.txt`);
  - a run under load passes: the file runs while four CPU-bound node processes hold every core. Recorded (`m1-load-win32.txt`).
- **M2 · R-3531** — The post-edit `timeoutMs 0` check shall give its control a 10000 ms deadline from a named constant, and both cases a 30000 ms watchdog. It shall keep every assertion: control not hung with exactly one timer of the control deadline; zero case not hung, no timer armed, "✓ 1 check". On failure it shall print O3's detail line. Proves: a slow node start no longer fails it, it still catches a deadline armed for `timeoutMs: 0`, and the next failure names its side. Pins:
  - the check passes on the reference laptop;
  - **product mutation:** in an uncommitted copy, `nana-post-edit.ts:244` changes `timeoutMs > 0` to `timeoutMs >= 0`. The check FAILs, and the detail shows `zeroRecorded` holding one timer. Recorded (`m2-mutation-win32.txt`), and the file restored;
  - **CI reproduction:** with the control deadline constant set to 1 ms in an uncommitted copy, the check FAILs. The detail shows `controlRecorded` as `[1, 2000]`. Recorded in the same file, and restored;
  - a run under load passes, as in M1 (`m2-load-win32.txt`);
  - the check title is unchanged, and its PASS line is byte-identical.
- **M3 (evidence)** — The locked full suite passes on the reference laptop apart from the known no-Python and no-uv failures.

Expected changes (a forecast, not a limit):
- `packages/nana-pack/tests/mutation-runner.test.mjs` and `packages/nana-pack/tests/post-edit-status.test.mjs`;
- `REQUIREMENTS.md`, `docs/requirements-tree.md` and `docs/known-bugs/FEAT-031.md`.
