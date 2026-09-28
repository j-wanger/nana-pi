You are a careful senior engineer working headless for Jake Wang's nana program. Terse reporting; every claim backed by a command you ran and its output. Never end your turn while a command you started is still running.

# Worker brief — T2b fix round 4 (Opus 5.5). sol LANDed (r1–r3 spent); these are its carried MEDs, implemented before the astra land ruling.

Worktree `~/nana-pi-wt/t2b`, branch `lane/t2b-review-ledger` (HEAD `4dc67cb`). Read `t2b-sol-r3.md`.

Sol ruled LAND and settled both open questions in your favour: **raw-byte identity is correct** (a review identity should represent the bytes the reviewer could observe, not git's normalized equivalence), and **previous outputs do not grant unlimited rounds** (they waste distinct-revision slots, but the permanent per-item cap still stops at three). Four carries to close.

## MUST 1 (MED) — completion TOCTOU
`review-round.mjs:469-471`: the revision is derived BEFORE the ledger lock is acquired, so an edit during the wait can still receive a valid verdict. Move the final derivation inside the lock, immediately before recording. Pin it with a test that mutates the tree while a completion waits on the lock and asserts the verdict is marked unverified.

## MUST 2 (MED/LOW) — `--out` inside the reviewed tree
Sol's ruling: **refuse** when `--out` resolves to a TRACKED path (excluding it from the snapshot can mask its overwrite — a data-loss risk), and **warn** for any other location inside the reviewed tree, recommending an external or ignored path. Implement exactly that split. Our own practice writes outputs to a different working tree, so nothing in this repo should trip the refusal — confirm that.

## MUST 3 (LOW) — announce the changed retry contract
`--retries N` now means N re-attempts after the first, so an explicit `--retries 2` performs 3 attempts where it previously performed 2. No call site in this repo passes it, but external callers change silently. Add a release/migration note in the README beside the `pi-worker` symlink note, and make `pi-review`/`pi-worker` print a one-line notice when `--retries` is passed explicitly.

## NOT
Nothing else. `--max-budget-usd 10`.

## doneWhen
`npm test` exits 0; a completion whose tree changed while waiting on the lock is recorded unverified; a tracked `--out` is refused and an untracked in-tree `--out` warns; the retry notice appears only when the flag is explicit.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push.

## Report (≤15 lines)
Commit · the TOCTOU test and how you forced the race · the tracked/untracked `--out` behaviours · the retry notice · `npm test` summary · `git diff --stat` · the one claim most likely wrong · `VERDICT: DONE`.
