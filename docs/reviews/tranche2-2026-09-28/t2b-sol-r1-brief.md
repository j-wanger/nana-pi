# Review brief — lane T2b: per-item review ledger (gpt-5.6-sol, round 1 of 3) — roles: scope · adversarial · compatibility

Read-only except probes under a temp HOME (scratch only under /tmp; never modify a worktree). Worktree `~/nana-pi-wt/t2b`, branch `lane/t2b-review-ledger`, commit `d6b6dbd` on main `1553c80`. Diff: `t2b-r1.patch`. Report: `t2b-worker-r1.md`. Contract: `t2b-brief.md`.

The defect this closes: the cap was parsed from the output BASENAME and "no round means no cap", so `sol-final.md` / `out.md` sailed through, and when the Codex quota ran out on 2026-09-20 reviews moved to a `claude -p` launcher with no cap at all.

Seat-verified: `npm test` → 69 files, 3204 checks, exit 0 (one rerun needed: `apps/desk/test/stage-key-persistence.test.mjs` failed once under the runner and passed 5/5 standalone and on rerun — a known intermittent, filed in HANDOFF 0b, NOT caused by this lane).

**Scope role**
S1. 8 files, +471/−77 ≈ 548 against a 500 guide. The worker used the new CHECKPOINT rule correctly (declared the overrun, said ~150 lines are tests, judged the remainder mechanical, continued). Was that judgment right, or is there machinery a smaller design avoids? Subtraction-test the lock, the reservation, the rotation and the `check` subcommand.
S2. `review-round.test.mjs` was REPLACED (it pinned the fail-open basename behaviour, which is the bypass). Verify the replacement pins the ruled invariant and that no other assertion was weakened.

**Adversarial role** — executed probes. The worker's own proofs are strong; your job is to break what it did not try.
A1. Reproduce the refusals yourself, then attack the IDENTITY: two items whose slugs differ only by case or whitespace; a slug with a path separator or `..`; an empty slug; a very long slug; the same item reviewed from two different worktrees of the same repo (different absolute paths, same revision); a revision that git cannot resolve.
A2. Attack the COUNT rule: the worker charges "same role twice on one revision = two rounds" (its own most-doubted claim). Probe whether a legitimate workflow gets over-charged — e.g. a reviewer that crashes after writing its verdict and is re-run, or two sol reviews of genuinely different scopes in one cycle.
A3. Attack the LEDGER: a hand-edited ledger line that fabricates verdicts to exhaust an item (denial of service on your own reviews); a ledger file that is a symlink; a read-only ledger directory; the rotation boundary (write across 1 MiB and confirm counting still spans both files); a malformed line among valid ones.
A4. Attack the RESERVATION: the worker proved two-process concurrency with a negative control. Try three or more; kill one mid-window; make the lock file a directory; set the clock-skew case (a reservation timestamped in the future).
A5. `--worker` consumes nothing — can a reviewer simply pass `--worker` to review for free? Is that acceptable given the ledger records the claim? Rule on it.

**Compatibility role**
C1. **Every call site on this machine breaks loudly without `--item`** (intended). Enumerate them and say what each needs: `~/nana-agent-loop/app/scripts/pi-review.mjs` (a forwarder), `~/nana-agent-loop/app/scripts/launch-loop.mjs`, `~/jev-research/docs/reviews/local-tool-judge-2026-09-19/launch-workers.sh`, `~/jev-research/experiments/launch-wp-h-after-primary.sh`, and any doc that publishes the old invocation. The worker changed none of them (out of scope) — confirm the failure is loud and diagnosable, not silent.
C2. The README snippet for hand-rolled launchers: does it actually work? Run it with a stub.
C3. `~/.local/bin/pi-review` currently points at nana-pi main, so nothing changes until this lands — confirm, and state what the owner must do on the day it lands.

End with findings severity-sorted, `file:line`, role tag per finding; residuals; `VERDICT: LAND` or `VERDICT: BLOCK`.
