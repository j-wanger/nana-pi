The round cap is now counted per item from a shared ledger, so output names and launcher choice no longer matter. The four-name bypass and the `--over-cap --retries` spoof both reproduced on the old code and are refused on the new code. `npm test` exits 0.

**Commit:** `d6b6dbd` on `lane/t2b-review-ledger`, not pushed.

**Bypasses, before and after** (stub `pi`, temp HOME):
- **Before:** `sol-final.md`, `r3b.md`, `sol-4.md` and `r4/out.md` all exited 0 with no cap. `--over-cap --retries 1` printed `override: --retries` and exited 0.
- **After:** the same four names with `--item demo` were admitted as rounds 1/3, 2/3 and 3/3, and the fourth was refused: "this would be round 4, over the cap of 3". A call with no `--item` is refused with "--item <slug> is REQUIRED…". `--over-cap --retries` is refused with "--over-cap needs a value, got "--retries"", exit 1.

**Ledger record** (`~/.pi/agent/review-ledger.jsonl`), one line per verdict:
`{"v":1,"ts":"2026-09-28T18:51:33.815Z","kind":"verdict","item":"demo","revision":"1553c80","role":"sol","out":"…/sol-final.md","launcher":"pi-review"}`
- An override gets its own line: `kind:"override"` plus `reason`, `round` and `ts`. A `--worker` launch is logged as `kind:"worker"` and consumes nothing.
- **How rounds are counted:** for each revision, take the most verdicts any one role gave; the item's rounds are the sum across revisions. So sol and astra on one revision are one round, the same role twice is two, and a new revision resets nothing.
- **Size limit:** past 1 MiB the file is renamed to `.jsonl.1`, replacing the previous one. Counting reads both files.

**Concurrency and crash proofs** (`tests/review-ledger.test.mjs`, real processes):
- **Concurrency:** with 2 rounds already used, I started two `review-ledger run` processes at once in 3 trials. Each time exactly one won and there were 3 verdicts. Sensitivity check: with the lock removed and the window widened, 2 of the 3 trials had both launchers winning. The code was then restored (`cmp` identical).
- **Crash recovery:** I SIGKILLed a launcher mid-review while it held the last slot, and planted a lock file with a dead pid. The next review was admitted, the stale reservation was deleted, the lock was released, and no round was consumed. A reservation is dropped when its pid is dead or it is over 12 h old; a lock is taken over when its pid is dead or it is over 30 s old.
- **Nothing consumed:** an infra failure, a stall killed by the watchdog, and 4 `--worker` launches left 0 verdicts, and the item still had all 3 rounds.

**README snippet for hand-rolled launchers:**
`node ~/nana-pi/packages/nana-pack/bin/review-ledger.mjs run --item <slug> --role opus --out out.md -- claude -p --model <model> "$(cat brief.md)"`
There is also `review-ledger check --item <slug>`, which answers "would the next review be admitted?" with exit 0/1 and reserves nothing.

**`review-round.test.mjs` replaced:** it pinned the old behaviour where a file name without a round meant no cap (`:20`). That behaviour is the bypass, so the name-based round parsing is gone. The file now checks the new rules: how rounds are counted, when a verdict is allowed or refused, and that a flag or blank is rejected as a reason (16 checks, all passing).

**`npm test`:** 69 files, 68 PASS, 0 FAIL, 1 SKIP; 3204 checks pass. The first run failed in `handoff-writer-role.test.mjs`. That was an old `pi-review` call site without `--item`, failing loudly as intended. I added `--item` and a temp HOME to its call; the handoff logic is unchanged.

**`git diff --stat`:** 8 files, 471 insertions, 77 deletions. That is about 548 changed lines against the advisory 500. **Checkpoint:** tests account for about 150 lines of that; the rest of the overrun was mechanical, so I finished.

**Residuals:**
- Old call sites in `~/jev-research` (`launch-workers.sh`, `experiments/launch-wp-h-after-primary.sh`) will now fail with the required-item message. I didn't touch them (out of scope); they need `--item`, plus `--worker` for the worker launches.
- The live `~/.local/bin/pi-review` points at `~/nana-pi` main, so nothing changes on the machine until this branch lands.
- Nothing stops a caller from lying about `--role`, `--revision` or `--worker`. Every such claim is written to the ledger, so it is visible in an audit.
- The takeover of a stale lock has a small check-then-delete race.
- A malformed ledger line is skipped rather than counted.
- I did not grep `~/nana-agent-loop` call sites beyond the file list. Its `pi-review.mjs` forwarder is untested here.

**The claim most likely wrong:** "same role twice on one revision = two rounds". I chose that to stop free re-reviews of an unchanged tree. If the reviewer lineup puts two sol roles under the same `--role` name in one cycle, they will be charged two rounds.

VERDICT: DONE
