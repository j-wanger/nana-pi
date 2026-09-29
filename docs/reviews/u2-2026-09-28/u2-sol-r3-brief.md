# Review brief — lane U2, round 3 (FINAL)

This is the third and last round on the item. After your verdict the seat lands with named
residuals or subtracts; there is no fourth round. Rule on the artifact in front of you.

Worktree `~/nana-pi-wt/u2`, branch `lane/u2-agent-dir`, HEAD `37e77fd`, base `main` `ab01f1a`.
Read `u2-sol-r2.md` (your round 2), then `u2-worker-r3.md`, then `git log -p 624cf8e..HEAD`.

## Your three round-2 MUSTs and how they were ruled

1. **Desk vs spawned sessions (HIGH).** Ruling: **pin, and say so.** When the inherited
   `PI_CODING_AGENT_DIR` is relative, the desk pins its own resolved ABSOLUTE dir into every pi
   child's environment, and tells the user in the settings UI that it did. Confirm the pin covers
   EVERY pi launch (the worker's own most-likely-wrong claim — the seat checked `server.mjs` and
   `apps.mjs` and found the only non-`childEnv` spawns are `git ls-files` and the directory picker;
   verify that independently). Confirm absolute, tilde and unset values reach the child unchanged.
   Then rule on the pin itself: is silently-different better or worse than pinned-and-announced?
2. **`nana-setup` with an ambient relative value (HIGH).** Ruling: **refuse.** `install` exits
   non-zero naming the resolved directory and the remedy; an explicit `--pi-home` is the user's
   decision and still works; `doctor` warns and cannot say healthy. The worker chose exit 1 for
   `doctor` on its own. Say whether the refusal is right, whether the messages name the real
   remedy, and whether `nana-setup project` needs the same treatment (the worker lists it as a
   residual).
3. **Regex vs documentation (MEDIUM).** Ruling: **tighten the regex to the four balanced
   spellings**, keep case-insensitivity and say so in one clause in both documents. Verify nothing
   that blocked for a real path now passes: the four spellings, all separator forms, quoted and
   mixed case, and the literal active-dir and default-dir paths.

## What else to check
- Nothing in the NOT-list moved: active-dir `settings.json`/`auth.json` still outside the floor,
  handoff store, round-cap ledger, desk stage keys, deleted-cwd STOP, no migration, no new keys.
- The parity test now runs the desk, the test process and the spawned session from three different
  cwds. Is it actually testing the split, or does it still share a root somewhere?
- One resolver still holds after the desk change (the worker says it avoided reading
  `process.env.PI_CODING_AGENT_DIR` in `server.mjs` for that reason).
- `env -u NANA_HANDOFF npm test`.

## The ruling this round must produce
One paragraph: **does this land?** If not, the smallest thing that would make it land. Name the
residuals you would have the seat carry, priced by cost-of-error, and say which of your findings
across the three rounds you verified yourself versus read.

## NOT
Read-only: report, never edit. Do not open new scope beyond the agent-dir contract.

## Output
Findings with severity at `file:line`, each marked **executed** or **source-read**. State each
round-2 MUST as FIXED / PARTIAL / OPEN. End with `SCORE: n/10`, `MUST:`, `CARRY:` and
`VERDICT: LAND|BLOCK`.
