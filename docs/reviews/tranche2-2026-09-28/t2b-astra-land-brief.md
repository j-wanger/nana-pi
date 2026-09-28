# Astra land ruling — lane T2b: per-item review ledger (governance mechanism + subprocess lifecycle)

Read-only. Decide whether this merges to nana-pi main and what it changes upstream. Installed pi 0.87.1. Tranche 1 is on main; T2a (objective producer) is in its own land ruling in parallel.

Read in order: `t2b-brief.md` (contract) → `t2b-worker-r1.md` → `t2b-sol-r1.md` (5 HIGH, 3 MED, 1 LOW) → `t2b-fix-brief.md` (seat rulings) → `t2b-worker-r2.md` → `t2b-fix2-brief.md` → `t2b-worker-r3.md` → `t2b-sol-r2.md` (3 HIGH, 2 MED) → `t2b-fix3-brief.md` → `t2b-worker-r4.md` → `t2b-sol-r3.md` (**LAND**, 2 MED + 2 LOW carried) → `t2b-fix4-brief.md` → `t2b-worker-r5.md` → clean diff `t2b-r5.patch` → the code (`bin/review-round.mjs`, `bin/review-ledger.mjs`, `bin/pi-review.mjs`, `bin/pi-worker.mjs`, `bin/pi-watchdog.mjs`, `bin/review-shape.mjs`, `tests/review-ledger.test.mjs`).

**Why this lane exists:** the three-round cap was parsed from the output BASENAME and "no round means no cap", so `sol-final.md` or `out.md` sailed through; when the Codex quota ran out on 2026-09-20 reviews moved to a `claude -p` launcher with no cap at all. Limits bound to a tool fall away when the tool changes.

**Review history: sol's three rounds are spent (r1 BLOCK, r2 BLOCK, r3 LAND).** One fix round after r3 was IMPLEMENTED under the round-cap rule. Your ruling is the independent check.

**Seat rulings to judge as rulings:**
1. **The role-max count formula was SUBTRACTED, not patched.** A round is one distinct REVISION per item; `--role` is audit metadata. Rationale: a round is one review pass over a state of the work, so many reviewers on one commit are one pass, and a fix produces the next state. Reviewing one state repeatedly burns budget (governed by `--max-budget-usd`) and earns no rounds.
2. **`--worker` was DELETED from the review command** after sol launched five review-shaped outputs under it with zero verdicts recorded — a caller-controlled exemption is the bypass class this lane closes. Workers use `bin/pi-worker.mjs`, which never imports the ledger.
3. **The worker found the hole in ruling 1 and refused to fix it without a ruling** (a dirty tree keeps HEAD's revision, so uncommitted fix-review cycles were uncapped). Ruled and implemented.
4. **My first shape for that fix was wrong** — I said hash `git diff HEAD`; sol showed rendered diff text collapses distinct states and splits identical ones. Now a deterministic content snapshot (full sha-256) independent of index state and diff config.
5. **sol ruled two open questions in r3** and both were adopted: keep raw-byte identity over git's notion of clean; refuse a tracked `--out`, warn for other in-tree locations.

**Seat-verified:** `npm test` → 69 files, 3317 checks, exit 0. The completion-race test forces the race by holding the lock with its own pid, confirming the child is blocked, then mutating — and FAILS against the old ordering.

Rule on:
A. **Contract satisfied?** Identity (canonical, repo-scoped), what counts as a round, atomic reservation, launcher independence, auditable override, bounded storage. Name any invariant only asserted.
B. **Is the governance claim honest?** The README documents this as "a self-governance device against the fix-review treadmill, not a security control" — anyone who can write the ledger can exhaust or extend an item. Is that framing correct and sufficiently prominent, and does anything else in the docs overclaim?
C. **Harm if merged:** every existing call site breaks loudly without `--item` (intended) — `~/nana-agent-loop/app/scripts/pi-review.mjs` forwards unchanged, and three `~/jev-research` scripts need `--item`/`--worker`; `~/.local/bin/pi-worker` must be symlinked on the day it lands; `--retries N` changed meaning for explicit callers. Is the migration adequately published, and is the loud failure genuinely diagnosable?
D. **The snapshot definition.** sol ruled raw-byte identity correct over git's clean notion. Residuals the worker names: a repo using LFS or `autocrlf` never reads as clean (costing one round); a force-added ignored file counts only while staged; `core.excludesFile` changes what counts; non-UTF-8 paths refuse admission; every admission reads every relevant file (685 files ≈ 0.16 s). Price these.
E. **Seat conduct:** a ruling of mine corrected by sol, a hole in my own rule found by the worker, one fix round implemented past the sol cap. Any finding adopted without verification, any assertion weakened?
F. **Coupling to T2a** (landing in parallel): both touch `lib/config.ts`. Name the conflict risk and what to re-run on the merged tree.

End with `SCORE: n/10`, MUST (empty if none), CARRY priced by cost of error, the upstream-contract declaration, and `VERDICT: LAND` or `VERDICT: BLOCK`. ≤70 lines.
