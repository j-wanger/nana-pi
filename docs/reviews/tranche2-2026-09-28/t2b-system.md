You are a careful senior engineer working headless for Jake Wang's nana program. Terse reporting; every claim backed by a command you ran and its output. Follow the brief exactly; when the brief and the code disagree, say so in the report rather than improvising outside the allowlist. Never end your turn while a command you started is still running. Smallest change that passes.

# Lane T2b — a review ledger that binds to the ITEM, not to one launcher   2026-09-28 · nana-pi · worktree `~/nana-pi-wt/t2b`, branch `lane/t2b-review-ledger`

## Goal
The three-round review cap counts **completed verdicts per item per revision**, in a ledger every launcher consults — so it cannot be evaded by renaming an output file or by switching tools. Today the round is parsed from the output **basename** (`packages/nana-pack/bin/review-round.mjs:14-17`) and "no round means no cap"; when the Codex quota ran out on 2026-09-20 reviews moved to a hand-rolled `claude -p` launcher with no cap at all.

Evidence: `opus-review.md` B2/B4 (executed bypasses: `sol-final.md`, `r3b.md`, `sol-4.md`, `r4/out.md` → round null → allowed; `--over-cap --retries` treats `--retries` as the reason; `jev-research/docs/reviews/local-tool-judge-2026-09-19/` holds 351 files with 22 names at r4), `sol-review.md` B2, and astra's L1 warning that limits binding to a tool fall away when the tool changes.

## Appetite
`--max-budget-usd 25` · advisory ≤10 files / ≤500 LOC. **Checkpoint rule applies (see T2a).**

## doneWhen
`npm test` exits 0; four completed verdicts for one item are refused at the fourth under ARBITRARY output names; the existing `review-round` unit checks still pass or are replaced by the ruled invariant with a stated reason.

## Outcome (invariants)
1. **Identity.** A review is `{item, revision, reviewer-role}`. `--item <slug>` is REQUIRED; a missing item is refused (no silent "null means allow"). Revision defaults to the reviewed tree's git HEAD short sha when one is resolvable, else a caller-supplied `--revision`.
2. **What counts.** A round is a **completed verdict** on a revision. These do NOT consume a round: a stalled/retried attempt, an infrastructure failure, a wrapper timeout, or a worker launch that happens to use the same wrapper (`pi-review` is also used to launch workers — `jev-research/.../launch-workers.sh`). DOCTRINE: infrastructure failure is not a review.
3. **Two reviewers, one cycle.** A sol verdict and an astra verdict on the SAME revision are one round, not two (astra's L1 ruling). A new revision resets nothing — the cap is per item, across revisions, which is the point: three rounds then rule.
4. **Atomic.** Two launchers starting concurrently cannot both take the last slot. Use an atomic reservation (O_EXCL lockfile or an append-then-read-back record); a crashed reservation must not wedge the item forever (state the recovery).
5. **Launcher-independent.** A tiny shared check any launcher can call — `pi-review` calls it, and the Claude-side reviewer launcher pattern (`claude -p --model … > out.md`) gets a documented one-line preamble that calls the same check. Publish that snippet in the pack README so a hand-rolled launcher has no excuse.
6. **Auditable override.** `--over-cap "<reason>"` still works, must be a non-blank reason that is NOT another flag (today `--retries` satisfies it), and every override is recorded in the ledger with its reason and timestamp.
7. **Where it lives.** `~/.pi/agent/review-ledger.jsonl` (user scope, append-only, one line per completed verdict). Bounded: state a rotation or size policy — it must not grow forever (`opus-review.md` C12 flagged unrotated logs).

## Tests
- `tests/review-ledger.test.mjs` (new, temp HOME): four completed verdicts for one item under the names `sol-final.md`, `r3b.md`, `out.md`, `anything.md` → the fourth is refused; a sol and an astra verdict on one revision count as ONE; a stalled attempt and a worker launch consume nothing; two concurrent reservations cannot both win (spawn two processes); a crashed reservation recovers; `--over-cap --retries` is refused as a reason while `--over-cap "instrumented X"` is recorded.
- `review-round.test.mjs`: it currently pins the fail-open basename behaviour (`:20`). Replace with the ruled invariant and say so in your report.

## NOT
No gate, handoff, objective or config changes. No change to what a review CONTAINS or to the wrapper's stall watchdog. Do not touch `~/nana-agent-loop` or `~/jev-research`.

## Roles
builder: Opus 5.5 (you) · reviewers: **scope** + **adversarial** (executed: the four-name bypass, concurrency, a killed reservation, `--over-cap` spoofs, a worker launch through the same wrapper) + **compatibility** (every existing `pi-review` call site across the machine — grep them; old call sites must fail LOUDLY with the required-item message, never silently uncapped) — all sol · land: **astra**.

## Rules
Foreground commands only; never end your turn with a command running. Kill only your PIDs. Commit on the branch, no push. Baseline first: reproduce at least two of the executed bypasses before changing anything.

## Report (≤35 lines)
Commits · the bypasses reproduced then refused · the ledger record shape · the concurrency and crash-recovery proofs · the README snippet for hand-rolled launchers · `npm test` summary · `git diff --stat` · residuals · the one claim most likely wrong · `VERDICT: DONE`.
