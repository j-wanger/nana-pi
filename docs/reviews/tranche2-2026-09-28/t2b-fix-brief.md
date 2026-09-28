# Worker brief — T2b fix round (Opus 5.5), after sol r1 BLOCK (5 HIGH, 3 MED, 1 LOW)

Worktree `~/nana-pi-wt/t2b`, branch `lane/t2b-review-ledger` (HEAD `d6b6dbd`). Read `t2b-sol-r1.md` whole. Your ledger concept is sound and stays; four areas need redesign, and the first one is a SUBTRACTION.

## SEAT RULING — a round is a REVISION, not a role-cardinality inference (closes HIGH #2, subtracts machinery)
Your role-max formula ("for each revision take the most verdicts any one role gave, sum across revisions") is both too loose and too strict, and sol proved both: ten verdicts under ten caller-chosen role names stayed "round 1/3", while two legitimate sol reviews of different scopes on one revision consumed two rounds.

**Replace it with: a round is a distinct REVISION reviewed for this item.** Dedupe on `{item, revision}`. `--role` becomes audit metadata only and plays no part in the count.

Why this is right rather than merely simpler: in our actual practice a round is one review pass over a state of the work — reviewers look, the work is fixed, reviewers look again. Sol and astra on one revision are one pass. Ten reviewers on one revision are one pass. A fix produces a new commit, so the next pass is a new revision and a new round. The cap exists to stop the fix-review-fix-review treadmill, and revisions are exactly what that treadmill advances. Reviewing one revision repeatedly burns budget (governed by `--max-budget-usd`) but earns no rounds and makes no progress, which is the correct incentive.
**Revision must be derived from the reviewed tree's git HEAD, not taken from the caller,** falling back to an explicit `--revision` only when HEAD cannot be resolved; resolve any explicit value to a canonical commit sha where git can.

## SEAT RULING — `--worker` is deleted from the review command (closes HIGH #3)
sol launched five review-shaped `VERDICT: LAND` outputs under `--worker`: all succeeded, zero verdicts recorded. A caller-controlled exemption on the review command IS the launcher/classification bypass this lane exists to close. **Remove the flag.** A worker launch uses a different entry point that never touches the ledger — either `pi-review`'s existing worker path with no ledger call at all, or a separate `review-ledger worker` subcommand that records nothing and cannot admit a verdict. State which you chose and why. Update the two `~/jev-research` call sites' documented migration accordingly (document only; do not edit that repo).

## Also fix
1. **HIGH #1 identity.** Canonicalize the slug (trim, casefold, collapse internal whitespace, reject path separators and `..`, bound the length — say the bound) and scope it to the repository (stable identity: the git common dir's realpath, or the remote URL when there is one — justify your choice). Two worktrees of one repo must share an item; the same slug in unrelated repos must not collide. Verified positive control from sol: two worktrees already resolve to the same short sha — keep that true.
2. **HIGH #4 rotation resets the cap.** Keep a compact, permanent per-item tally (item → rounds used, and the revisions that earned them) that survives audit-log rotation; rotate only the verbose audit records.
3. **HIGH #5 cross-repo break.** `~/nana-agent-loop/app/scripts/review-round.mjs` re-exports `roundFromOutPath`, and its test imports it; removing the export breaks module linking there. Keep the export as a deprecated no-op-compatible pure function (it may still parse a basename; nothing in the cap consumes it any more) so the forwarder keeps linking, and note the deprecation in the README. Do not edit `~/nana-agent-loop`.
4. **MED #6 reservation ownership.** `complete()` must verify and consume the matching reservation under the lock; an expired-then-replaced reservation must not be completable (sol produced four verdicts and four rounds with no override this way).
5. **MED #7 malformed records fail open.** A malformed ledger line must REFUSE admission with a line-numbered diagnostic, not be silently skipped — skipping lets a corrupted verdict grant a free review.
6. **MED #8 symlinked ledger.** Refuse a non-regular ledger path (no-follow open or an lstat check) — today a symlink appends verdicts to the target file.
7. **LOW #9 `check` mutates.** Make it a locked, non-mutating projection, or subtract the subcommand.
8. **Two unhandled stacks** sol hit: a read-only ledger directory, and a lock path that is a directory (15 s wait then a stack). Both must fail with a clear message, not a stack trace.

## Trust model — document it, do not try to fix it
sol: "three fabricated verdict lines exhaust an item… inherent if the same-user ledger is authoritative." That is true and it is the same shape as the gate being advisory-by-load-path. Write it plainly in the README: **this is a self-governance device against the fix-review treadmill, not a security control.** Anyone who can write the ledger can exhaust or extend an item; the ledger's value is that every such claim is recorded. Name the repair path (delete the item's records, or `--over-cap` with a reason).

## NOT
No new mechanisms beyond the compact tally. No edits to `~/nana-agent-loop` or `~/jev-research`. No change to the stall watchdog or to what a review contains.

## doneWhen
`npm test` exits 0; every sol probe that found a bypass now refuses; two worktrees of one repo share an item while the same slug in two repos does not; ten verdicts on one revision are one round; the rotation boundary no longer resets a cap.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. `--max-budget-usd 20`. **Checkpoint rule applies** — if the redesign exceeds the appetite, write the checkpoint and stop rather than growing.

## Report (≤30 lines)
Commit · the revision-based count rule and what it deleted · where worker launches go now · identity canonicalization + repo scoping with the collision proof · the permanent tally across two rotations · reservation ownership proof · each sol probe re-run with its new verdict · the trust-model paragraph (quote it) · `npm test` summary · `git diff --stat` · residuals · the one claim most likely wrong · `VERDICT: DONE`.
