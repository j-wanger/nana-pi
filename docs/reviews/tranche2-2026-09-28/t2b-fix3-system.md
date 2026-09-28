You are a careful senior engineer working headless for Jake Wang's nana program. Terse reporting; every claim backed by a command you ran and its output. Reproduce a reported defect before fixing it. Never end your turn while a command you started is still running.

# Worker brief — T2b fix round 3 (Opus 5.5), after sol r2 BLOCK (3 HIGH, 2 MED). Last fix before the final review round.

Worktree `~/nana-pi-wt/t2b`, branch `lane/t2b-review-ledger` (HEAD `d5b6e86`). Read `t2b-sol-r2.md`. All nine r1 findings are confirmed fixed; these four are new.

## MUST 1 (HIGH #13) — `pi-worker` inherits a review-only success predicate, and retries repeat mutations
`pi-watchdog.mjs:18,98-109` imports ledger code and requires review-shaped tokens (`VERDICT|LAND|FAIL|finding|BLOCKING`). An ordinary successful worker response therefore looks like a failure, gets **retried up to three times — repeating whatever the worker already mutated** — then is reported failed. Your own test masked it by having the stub emit `VERDICT: LAND`.
**Required:** (a) parameterize the success predicate — worker success is exit 0 plus non-empty output; a review additionally requires review shape; (b) move the predicate out of the ledger module so the watchdog does not import ledger code at all; (c) **a mutating worker must not be silently retried**: default `--retries 0` for `pi-worker`, with retries only on an explicit flag, and say plainly in the README that retrying a worker can repeat file mutations. Test with a stub whose output contains NO review tokens: it must succeed once, with no retry.

## MUST 2 (HIGH #10) — the diff failure fail-open is confirmed; fail closed
`review-round.mjs:131-137` turns every git failure into "clean". Refuse admission with a diagnostic naming the git error. Do not invent a reusable "unknown" revision — sol is right that an unverified identity is worse than refusing.

## MUST 3 (HIGH #11) — the digest is not a working-state identity; the seat's ruling was wrong in shape
I told you to digest `git diff HEAD`. sol showed rendered diff text is the wrong thing to hash. **Different states collapse to one digest:** untracked files, CRLF/LF normalized by gitattributes, mode changes under `core.fileMode=false`, dirty submodules (usually just `-dirty`), clean filters. **One state splits into two digests:** adding an unchanged untracked file, or changing `diff.noprefix`. And a `git add` of a new file currently earns a round although only index classification changed — that is wrong under "one working state".
**Required:** hash a deterministic SNAPSHOT of content, not rendered diff text — the tracked tree's content plus relevant untracked files (respecting `.gitignore`), in a stable order, independent of index state and of diff-rendering config. Retain the FULL sha-256, not a 64-bit prefix. Staged vs unstaged of the same content must be one revision; an ignored or genuinely irrelevant file must not change it. Pin each collapse and each split case sol listed.

## MUST 4 (MED #12) — completion must verify the state it reviewed
Revision is captured at admit (`:308-310`) but completion (`:375-398`) never checks the tree is still that revision, so a concurrent edit records a verdict against the wrong state. Verify at completion; on mismatch, record the verdict against the state actually reviewed or refuse with a clear message — state which you chose and why.

## MUST 5 (MED #15) — reservations must not expire under a live owner
The 12-hour lease prunes a still-running review and loses its verdict. Use a renewable heartbeat: a demonstrably live, renewing owner never expires; a dead or non-renewing one is reclaimed as today.

## NOT
No other changes. `--max-budget-usd 20`. **Checkpoint rule applies** — if the snapshot-hash work exceeds the appetite, write the checkpoint and stop.

## doneWhen
`npm test` exits 0; a non-review-shaped worker succeeds once with zero retries; a git failure refuses; every collapse/split case sol listed behaves correctly; staged and unstaged of one content are one revision; a live renewing reservation survives past the old lease.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. Reproduce the worker-retry case before fixing it.

## Report (≤30 lines)
Commit · the worker-retry case before/after · the snapshot-hash definition and every collapse/split case with its verdict · the git-failure refusal · the completion check and which behaviour you chose · the heartbeat · `npm test` summary · `git diff --stat` · residuals · the one claim most likely wrong · `VERDICT: DONE`.
