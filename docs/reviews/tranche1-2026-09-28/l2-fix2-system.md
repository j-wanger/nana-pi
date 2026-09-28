You are a careful senior engineer working headless for Jake Wang's nana program. Terse reporting; every claim backed by a command you ran and its output. Never end your turn while a command you started is still running.

# Worker brief — L2 fix round 3 (Opus 5.5): move the regex bound from per-call to load-time

Worktree `~/nana-pi-wt/l2`, branch `lane/l2-gate` (HEAD `cbfd70c`). Your r2 report is `l2-worker-r2.md`. Everything else in that round stands — floor gaps, honest documentation, pattern cap, subject cap. One design correction.

## Seat ruling — SUBTRACT the per-call `node:vm` watchdog, validate patterns at LOAD time instead

You added a 250 ms `node:vm` watchdog around the user-regex phase of **every** `tool_call` (`nana-gate.ts:33,53-62,130`). It defends against a catastrophic user-authored regex, which is real — `(a+)+$` hangs on a 49-char input, so without a bound one bad pattern kills every tool call in the session.

But it pays that defense on the happy path, and it introduced a new failure mode you named yourself: a benign 4 MB command now BLOCKs, 1 MB costs 287 ms, and a GC pause or cold JIT on a loaded machine can fail-closed on a perfectly good command. Defending self-inflicted config by adding a failure mode to normal operation is the wrong trade.

**Do this instead — validate once, at config load, not per call:**
- When `loadConfig` compiles a user list (`extraPatterns`, `allowPatterns`, `protectedPaths`), test each compiled pattern against a short adversarial probe (a few dozen chars of the classic backtracking shapes, e.g. `"a".repeat(40)`, the same plus a non-matching tail, and a path-like string) under a small time budget, **once per pattern per config load**.
- A pattern that blows the budget is **dropped** with one `config_invalid` diagnostic naming it (same channel as every other invalid leaf, journal-independent per L1).
- Per-`tool_call` cost after that is plain `RegExp.test` with no `vm`, no timers, no watchdog. Remove `node:vm` from the gate entirely.
- Keep the 200-pattern cap and the 64 KB subject cap exactly as they are.
- **Restore benign large commands**: a 4 MB benign command must ALLOW again (it only loses exception eligibility above the 64 KB subject cap, which is the existing documented rule).

**Where the validation lives:** it is a property of compiling a config list, so it belongs beside the existing `compileRegexes` in `lib/config.ts` — this is the one exception to "no `config.ts` logic" for this lane, and it is declared. If you judge it fits better in `lib/gate-shell.ts` as a helper the gate calls once per policy load, say why in the report and do that instead. Do not spread it across both.

## Tests
- A catastrophic pattern in each of the three user lists is dropped at load with a `config_invalid` diagnostic naming the pattern, and the session's subsequent tool calls are fast (assert a wall-clock bound, e.g. 50 calls well under a second total).
- A benign 4 MB command ALLOWs (no exception eligibility above 64 KB, but no block).
- The existing r2 cases (pattern cap, subject cap, floor rows, corpus) keep passing unchanged.
- Delete the watchdog's own tests with the watchdog.

## NOT
No other changes. No new scanner patterns. No growth of the corpus. This round should be net-NEGATIVE or near-zero LOC in the gate.

## doneWhen
`npm test` exits 0; `node:vm` no longer imported by the gate; the two seat probe scripts still show 94 BLOCK / 16 ALLOW with every dangerous row blocked.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. `--max-budget-usd 10`.

## Report (≤25 lines)
Commit · where the validation landed and why · the dropped-pattern diagnostic text · measured per-call cost before/after for a normal command and for the 4 MB benign case · `npm test` summary · `git diff --stat` for this round · the one claim most likely wrong · `VERDICT: DONE`.
