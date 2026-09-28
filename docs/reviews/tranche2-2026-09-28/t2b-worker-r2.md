All five HIGH, three MED and one LOW findings from sol r1 are fixed. Every sol probe that found a bypass is now refused, and `npm test` exits 0.

- **Commit:** `9bce86e` on `lane/t2b-review-ledger` (not pushed).
- **Count rule:** a round is now one distinct revision per item. Ten verdicts under ten roles on one revision make one round (1 line in the round count, 10 verdicts in the audit log), and two sol reviews of one revision are one round. The revision is the reviewed tree's git HEAD as a full sha. `--revision` is used only when there is no HEAD; inside git it must resolve to HEAD or it is refused, so `HEAD` and the short sha now count as the same revision. **Deleted:** the role-max formula; `--role` is now audit metadata only.
- **Worker launches:** the watchdog code moved unchanged into `bin/pi-watchdog.mjs`. A new `bin/pi-worker.mjs` uses it and never imports the ledger, so it records nothing and refuses `--item`, `--role`, `--revision` and `--over-cap`. I chose a separate bin over a `review-ledger worker` subcommand because the jev workers need the stall watchdog, and a mode switch on `pi-review` is the exemption being deleted. The README documents the migration: jev-research's `launch-workers.sh:11` and `launch-wp-h-after-primary.sh:7` change `pi-review` to `pi-worker`; `launch-sol-review.sh:8` adds `--item … --role sol`.
- **Identity:** the item name is normalised (NFKC, trimmed, lower-cased, internal whitespace collapsed) and rejected if it contains `/`, `\`, `..` or a control character, or exceeds 128 characters. The repository is identified by the realpath of the git common dir. I chose it over the remote URL because every repo has one, it needs no URL normalisation, and `git remote set-url` can't change it. Proof: two worktrees record one repo identity, a second worktree at a 4th revision is refused, and at an already-counted revision it is admitted with no new round. The same name in an unrelated repo B is admitted as a separate item.
- **Permanent tally:** a new file, `review-ledger.rounds.jsonl`, holds one line per round earned and is never rotated; the cap reads only it plus live reservations. After two rotations of the audit log (which drop the item's old verdicts), the item's 4th revision is still refused with "3 round(s) used".
- **Reservation ownership:** `complete()` checks and consumes its own live reservation under the lock. Reproducing sol's case (expired reservation A, replacement B): `complete(A)` is refused with "NOT recorded" and the item ends at 3 rounds, not 4. Completing B twice, a forged id, and a future-dated reservation are all refused or treated as stale.
- **Probes, before → after (d6b6dbd → 9bce86e):**
  - Case and whitespace variants of an item name: ADMITTED → REFUSED.
  - `../item`, `a/b`, `..`, 50,000 characters: ADMITTED → REFUSED.
  - Same name in an unrelated repo: collided (REFUSED) → ADMITTED as its own item.
  - HEAD vs short sha: 2 rounds → 1.
  - Unresolvable revision: ADMITTED → REFUSED.
  - `pi-review --worker` ×5: exit 00000 → 11111.
  - After two rotations: ADMITTED → REFUSED.
  - Malformed record: ADMITTED → REFUSED with `rounds.jsonl:N`.
  - Symlinked ledger or round file: appended to the target → REFUSED before the review runs.
  - `check`: wrote a reservation (a read-only reservations directory made it crash with a stack trace) → exit 0, writes nothing.
  - Read-only ledger directory: stack trace → a clear message.
  - Lock path is a directory: 15.1 s then a stack trace → refused in 0.1 s with a message.
  - `roundFromOutPath` is exported again. A copy of nana-agent-loop's forwarder links against the lane module, and all of its test's assertions hold.
- **Trust model** (quoted from the README): "**This is a self-governance device against the fix-review treadmill, not a security control.** … Anyone who can write it can exhaust an item (three fabricated round lines) or extend one (delete lines) … What the ledger buys is that every admitted review, every round and every override is **recorded** … **Repair:** delete its lines from `review-ledger.rounds.jsonl` … or run with `--over-cap "<what changed>"`, which is recorded."
- **`npm test`:** 69 files, 68 PASS, 0 FAIL, 1 SKIP; 3260 checks pass. `review-ledger.test.mjs` has 70/70 checks passing.
- **`git diff --stat`:** 9 files, +839 −353. `README` 93, `pi-review` 145 (mostly moved out), `pi-watchdog` +112, `pi-worker` +32, `review-ledger` 37, `review-round` 401, `package.json` 1, tests 334 and 37.

**Residuals:**
- The biggest one: a dirty tree keeps HEAD's revision. If fixes are never committed, fix-review-fix-review on one HEAD is uncapped. jev's `launch-sol-review.sh` explicitly reviews "working tree or last commits". A fix would be to add a hash of `git diff HEAD` to the revision, about 10 lines; I left it out because the brief said no new mechanisms. It needs a seat ruling.
- A fresh clone at a new path is a new scope.
- Taking over a lock from a dead pid checks the inode, but a small race remains.
- `~/.local/bin/pi-worker` must be symlinked when this lands.
- The "12 h expiry refuses completion" rule means a legitimate review running longer than 12 hours loses its verdict.

**Most likely wrong:** that revision-as-round closes the treadmill. It only does if fixes get committed, which is the dirty-tree gap above.

VERDICT: DONE
