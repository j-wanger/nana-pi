# Worker brief — T2c fix round 4 (Opus 5.5). Implemented under the round cap (sol r1–r3 spent); astra rules on the land next.

Worktree `~/nana-pi-wt/t2c`, branch `lane/t2c-provenance-label` (HEAD `2fc8e07`). Read `t2c-sol-r3.md`.

sol confirms the r2 HIGH fixed. It found a fourth case — and unlike the previous three this one is a **fail-open**, not just false wording.

## MUST 1 (HIGH) — the label reads the wrong trust store when `PI_CODING_AGENT_DIR` is set
`objective.ts:78,294`: `trustRecord()` always reads `~/.pi/agent/trust.json`. pi honours `PI_CODING_AGENT_DIR` (`dist/config.js:405-425`: `ENV_AGENT_DIR` → `getAgentDir()` → `expandTildePath`). sol's probe: with an affirmative record in the OVERRIDDEN store, `trustRecord()` returned `vouched:false` and named the absent default store. Two consequences:
- `/trust` writes the overridden store, the next session reads the default, and the label persists forever — the remedy fails again;
- **worse, the fail-open direction:** a stale `true` in the DEFAULT store suppresses the label even when the active store records a decline.
My original brief told you to read `~/.pi/agent/trust.json`. That was my error, and it is the fourth specification error in this lane.

**Required:** resolve the active agent directory exactly as pi does — the `PI_CODING_AGENT_DIR` env var when set, with pi's own tilde/relative handling, else the default. **`packages/nana-pack/lib/gate-paths.ts:97-101` already resolves it for the gate** (`altTrustStores()`), so nana-pack is internally inconsistent today; reuse or share that resolution rather than writing a third one. Pin: an affirmative and a declined record in BOTH the default and the overridden store, and the stale-default-suppresses case, asserting the active store decides.

## MUST 2 (MED) — parent failures still name a file that does not exist
When `~/.pi/agent` is a FILE, the non-existent child `trust.json` is reported `unreadable` and the text says to "repair or remove that file", naming the wrong object. Distinguish the parent cases: parent is not a directory · parent or volume not writable · store present but unwritable. Each remediation must name the object that is actually wrong. For foreign ownership and read-only volumes, say the write may need rights the owner does not have rather than promising removal works.

## MUST 3 (LOW) — two overclaims
- The pack README says categorically that pi's write "cannot fix … size"; sol showed a valid oversized store can be compacted below the cap by pi's rewrite. The emitted "not reliably" wording is fine — fix the README's categorical claim.
- `packages/nana-setup/lib/project.mjs:309` says the label always says how to clear it; with the parent cases that is not guaranteed. Soften it to match.
- `AGENTS.md` and the README hard-code the default store path; make them say "pi's active trust store" and mention the override.

## NOT
No predicate change beyond WHICH store is read. No `nana-setup trust <dir>` — sol ruled again it stays a follow-up. `--max-budget-usd 15`.

## doneWhen
`npm test` exits 0; with `PI_CODING_AGENT_DIR` set, an affirmative in the active store clears the label and a decline in the active store labels even when the default store says `true`; no remediation names a file that does not exist.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. Reproduce sol's override probe and the stale-default suppression before fixing.

## Report (≤20 lines)
Commit · both override cases reproduced then fixed (paste the verdicts) · how you shared the gate's resolution · each parent case with its emitted text · the three wording fixes · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
