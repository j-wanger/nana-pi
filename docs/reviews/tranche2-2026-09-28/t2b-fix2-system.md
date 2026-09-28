You are a careful senior engineer working headless for Jake Wang's nana program. Terse reporting; every claim backed by a command you ran and its output. Never end your turn while a command you started is still running.

# Worker brief — T2b fix round 2 (Opus 5.5): the dirty-tree hole in the seat's own count rule

Worktree `~/nana-pi-wt/t2b`, branch `lane/t2b-review-ledger` (HEAD `9bce86e`). Your r2 report stands; one ruling.

## SEAT RULING — you were right, and the brief was wrong to forbid it
You flagged: "a dirty tree keeps HEAD's revision. If fixes are never committed, fix-review-fix-review on one HEAD is uncapped", and refused to fix it because the brief said no new mechanisms. Refusing was correct; the brief was wrong. My count rule says a round is a distinct **state of the work reviewed**, and for an uncommitted tree that state is HEAD plus its diff. `~/jev-research/docs/reviews/local-tool-judge-2026-09-19/launch-sol-review.sh` explicitly reviews "working tree or last commits", so this is a live path, not a hypothetical.

**Implement it:** revision = the HEAD sha when the tree is clean; HEAD sha plus a short digest of `git diff HEAD` when it is dirty. Keep it to the ~10 lines you estimated.
- Hash tracked modifications only (`git diff HEAD` already excludes untracked files) — an untracked scratch file must not grant a free round.
- Outside a git repo, behaviour is unchanged (explicit `--revision`).
- Record both parts in the ledger line so an audit can see which state was reviewed.
- Pin it: review a dirty tree → round 1; edit a tracked file → round 2; revert the edit → the original revision is recognised, no new round; touch an untracked file → no new round; commit the change → a new revision, a new round.

## Also
- Document in the README that `~/.local/bin/pi-worker` must be symlinked when this lands (the seat will do it), beside the existing `pi-review` note.
- Your other residuals stand as carried: fresh clone at a new path is a new scope; the dead-pid lock takeover race; the 12-hour expiry losing a legitimately long review's verdict. Leave them.

## NOT
Nothing else. No new mechanisms beyond the digest. `--max-budget-usd 10`.

## doneWhen
`npm test` exits 0; the five dirty-tree cases above each behave as stated.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push.

## Report (≤15 lines)
Commit · the five dirty-tree cases with their verdicts · the ledger line shape · `npm test` summary · `git diff --stat` for this round · the one claim most likely wrong · `VERDICT: DONE`.
