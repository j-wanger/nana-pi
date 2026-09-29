# Review brief — lane U2, roles: SCOPE + COMPATIBILITY

Lane U2: nana-pack's user-scope resources follow pi's ACTIVE agent directory
(`PI_CODING_AGENT_DIR`). Lane brief `docs/reviews/u2-2026-09-28/u2-brief.md`; worker report
`u2-worker-r1.md`. Worktree `~/nana-pi-wt/u2`, branch `lane/u2-agent-dir`, base `main` `ab01f1a`.
Read `git diff ab01f1a..HEAD` in full.

## SCOPE — did the lane stay inside its contract?
- **Allowlist respected?** The brief permits `lib/config.ts`, `lib/gate-paths.ts`,
  `lib/receipts.ts`, `README.md`, ONE comment in `bin/review-round.mjs`, and `tests/**`. Anything
  else changed is a scope defect, not initiative. Check `git diff --stat` yourself.
- **NOT-list untouched?** No change to the round-cap ledger's location, tally format or behaviour;
  nothing in `lib/objective.ts`, the trust predicate or the T2c label; no migration/auto-copy of an
  existing config; no change to gate semantics, precedence or the malformed-gate fallback; no new
  config keys or env vars.
- **Smallest change.** Could a smaller diff pass the brief's `doneWhen`? Name it if so. In
  particular: is there now more than one place that resolves the agent dir? The point of the lane is
  ONE resolution (`piAgentDir()`), so a second copy anywhere is a defect.
- **Appetite.** ≤ 8 files / ≤ 250 LOC excluding tests. If it was crossed, is there a CHECKPOINT
  paragraph in the report, and was the overrun earned?
- **Subtraction test** on anything new the lane introduced (a helper, an event name, a code path):
  does it earn its complexity, or would deleting it change nothing a test catches?

## COMPATIBILITY — what else speaks the old contract?
- **Everything that reads `~/.pi/agent` by hand.** Sweep the repo (`rg '\.pi./agent'` and
  `homedir()`), and say for EACH hit whether it should follow the active dir or stay fixed, and
  whether the lane's answer matches. The seat ruled the round-cap ledger stays fixed on purpose.
  Named consumers at base: `config.ts` (user config, trust fallback, journal), `receipts.ts`,
  `bin/review-round.mjs`, `lib/objective.ts` (already on `piAgentDir()` from T2c).
- **The Claude-hook runtime.** `bin/nana-objective.mjs` and `loadUserObjective()` must read the same
  settings as the pi runtime after this change. Check both, not one.
- **Documented behaviour that just changed.** Anyone with `PI_CODING_AGENT_DIR` set and a config in
  `~/.pi/agent` gets different behaviour after upgrading. Is it documented where the consumer reads
  it (README, AGENTS.md), and is the mismatch note enough for them to notice?
- **win32.** Case-insensitive, slash-agnostic policy matching must survive; the tilde and
  `%USERPROFILE%` spellings must still be caught.
- **AGENTS.md / README declarations** vs what the code now guarantees — T2c was blocked twice for
  declarations that outran the implementation. Check every sentence you find about where config
  lives.

## Output
Findings with severity at `file:line`. End with `SCORE: n/10`, `MUST:`, `CARRY:` and
`VERDICT: LAND|BLOCK`.
