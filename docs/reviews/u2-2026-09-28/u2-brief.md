# Lane U2 — nana-pack's own user-scope resources follow pi's ACTIVE agent dir
(2026-09-28 · repo `~/nana-pi` · worktree `~/nana-pi-wt/u2` · branch `lane/u2-agent-dir`, off `main` `ab01f1a`)

Astra's T2c land ruling filed this as a **separate urgent item**: *"the landed
`packages/nana-pack/lib/config.ts:276` deny-policy inconsistency … can silently discard custom
denies; prioritize a separate cross-consumer fix."* T2c fixed the objective producer and shared
`piAgentDir()` with the gate; the gate's own config was left behind.

## Goal

When `PI_CODING_AGENT_DIR` is set, nana-pack reads its user-scope resources from **pi's active
agent directory**, exactly as pi reads `settings.json`, `auth.json` and `models.json`, and the
gate's policy floor protects the user config **wherever it actually lives**. No configuration
silently resolves to a file that is not the one in force.

## The trace (§1b — done by the seat; verify it, do not take it on faith)

- pi `dist/config.js:421` `getAgentDir()` = `PI_CODING_AGENT_DIR` through `expandTildePath`
  (tilde only — a relative value STAYS relative and each consumer resolves it against its own
  cwd), else `~/.pi/agent`. `:430-446` every user resource hangs off it: themes, `models.json`,
  `auth.json`, `settings.json`, tools, bin.
- `lib/gate-paths.ts:64-70` `piAgentDir()` already mirrors that and resolves the relative case
  against the current process cwd; `piTrustStorePath()` and `altTrustStores()` use it.
- `lib/config.ts:276` `userConfigPath()` hardcodes `~/.pi/agent/nana-pack.json`.
- Consequence A (astra's): with a custom agent dir the user config is simply not found →
  `user.present === false` → `gateLeaves(undefined)` → `extraPatterns` and `protectedPaths`
  silently empty. Fail-open, no warning, no journal line.
- Consequence B (seat found while tracing, worse): `gate-paths.ts` `POLICY_RES` matches the
  user config only by the path SHAPE `.pi/[agent/]nana-pack.json`. With
  `PI_CODING_AGENT_DIR=~/myagent` the file `~/myagent/nana-pack.json` is not a policy file, so the
  gate's floor does not protect it and the agent may edit the policy that constrains it. The trust
  store has `altTrustStores()`; the config has nothing.
- Failure modes to state (the cheap test that a trace happened): env unset · absolute value ·
  relative value (differs per process cwd) · tilde value · value naming a missing directory ·
  value naming a file · symlinked agent dir (realpath) · a stale `nana-pack.json` left in the
  DEFAULT dir while the active dir has none.

## The contract

1. **`userConfigPath()` resolves through `piAgentDir()`** — `<active agent dir>/nana-pack.json`.
   The `lastValidUserGate` map is already keyed by the path, so a dir change is a fresh state,
   which is correct. Update the file header's "Sources" block and the README.
2. **The policy floor covers the active user config.** Add the active-dir config (and its
   realpath) to `gate-paths.ts` the way `altTrustStores()` covers the trust store, so
   `policyFileHit()` and `commandPolicyHit()` both catch it. Keep the existing shape regexes:
   `~/.pi/agent/nana-pack.json` stays protected even when it is not the active file.
3. **A dir mismatch is surfaced, never silent.** When the active dir has no `nana-pack.json` but
   the DEFAULT dir does, emit one journal line + one UI note per session naming both paths (the
   `surface()` / `config_invalid` path already exists; use a distinct event name). Do NOT stop the
   gate for this: absence of a user config is a legitimate state. Do NOT read the default file.
4. **`computeDecided()` (`config.ts:345`)** falls back to the hardcoded default when pi's API has
   no `getAgentDir`. Fall back to `piAgentDir()` instead — one resolution, no second copy.
5. **`journalFile()` (`config.ts:550`) and `receipts.ts:144`** take their defaults from
   `piAgentDir()` too. An explicit configured path still wins.
6. **`bin/review-round.mjs:67` stays on `~/.pi/agent` deliberately** — the round cap is a
   user-scope self-governance device, and keying it to an env-settable dir would let a shell
   variable reset the tally. Add the one-line comment saying so, and a README line. Do not change
   its behaviour.

## Appetite
`--max-budget-usd 12` · advisory ceiling ≤ 8 files / ≤ 250 LOC changed (tests excluded).
If the contract needs more: write a CHECKPOINT paragraph in your report naming what remains and
what it costs, then continue only if the remainder is mechanical.

## doneWhen
From `~/nana-pi-wt/u2`: `npm test` exits 0 with no test removed or weakened, and the new tests
cover — with `PI_CODING_AGENT_DIR` set to an absolute dir, a relative dir and a tilde dir —
(a) the gate enforcing `extraPatterns`/`protectedPaths` written in the ACTIVE dir's config,
(b) `policyFileHit()` and `commandPolicyHit()` refusing an edit and a shell write to that file
    and to its realpath through a symlinked agent dir,
(c) the mismatch note firing exactly once when only the default dir holds a config, and the gate
    still running on defaults,
(d) the round-cap ledger path unchanged under a custom agent dir.

## NOT
- Do not change the round-cap ledger location, its tally format, or anything else in
  `bin/review-round.mjs` beyond the one explanatory comment.
- Do not touch `lib/objective.ts` (T2c landed; it already uses `piAgentDir()`), the trust
  predicate, or the T2c provenance label.
- Do not add migration/auto-copy of an existing config into the active dir.
- Do not change gate semantics, precedence, or the malformed-gate fallback rules.
- No new config keys, no new env vars.

## Allowlist
May edit: `packages/nana-pack/lib/config.ts`, `packages/nana-pack/lib/gate-paths.ts`,
`packages/nana-pack/lib/receipts.ts`, `packages/nana-pack/README.md`, the one comment in
`packages/nana-pack/bin/review-round.mjs`, and tests under `packages/nana-pack/tests/**`.
Must not touch: everything else, in particular `lib/objective.ts`, `lib/nana-gate.ts` semantics,
`apps/**`, and any file under `docs/reviews/**`.
(The seat checked the NOT-list against the allowlist: the only overlap is `review-round.mjs`,
which is allowlisted for a comment and NOT-listed for behaviour. That is deliberate.)

## Constraints
macOS host; win32 must keep working by construction (case-insensitive, slash-agnostic matching is
already in `gate-paths.ts` — do not regress it). Every `gate-paths.ts` function is total: it
returns, it never throws. The gate handler must never throw: a throw there blocks the tool.

## Roles
builder: Opus 5.5 headless · reviewers: scope + adversarial (executed probes) + compatibility ·
land: astra.

## Rules
Foreground only; kill only your own PIDs; commit on the branch, no push; smallest change that
passes doneWhen.

## Report (≤40 lines)
Commits · `npm test` output · before/after for each of the six contract items · the probe you ran
for the policy-floor bypass (B) and its result · residuals · scope check ("nothing outside the
allowlist", `git diff --stat` attached) · the one claim most likely wrong · `VERDICT: DONE`.
