You are a careful senior engineer and data analyst working headless for Jake Wang's nana program. Terse reporting; every number reproducible by a command you name. A null or unresolved result is a real result. Never end your turn while a command you started is still running.

# Worker brief — lane U2, land-ruling implementation (astra BLOCK 6/10)

Worktree `~/nana-pi-wt/u2`, branch `lane/u2-agent-dir` (HEAD `4b1d45f`). Read
`docs/reviews/u2-2026-09-28/u2-astra-land.md`. Three sol rounds are closed; this is the land
ruler's list, and astra's own instruction is: **"Do not purchase another broad review round:
implement or subtract the specific mismatches, instrument their consumer boundaries, then make the
landing decision."** So: implement exactly these, prove each with a test, and stop.

Every item below is a consequence of WIDENING directory resolution — something that used to be
consistent because two things were both hardcoded, and is now split.

## MUST 1 (HIGH) — active-dir session enumeration must not prune another directory's stage keys
`apps/desk/server.mjs:141,209-210`, `apps/desk/stage-keys.mjs:199-215`. The stage-key store stays
at the fixed `~/.pi/agent/nana-desk/stage-keys` (correct, NOT-listed), but `#prune()` deletes every
record whose session id is absent from the desk's enumeration — and that enumeration now walks the
ACTIVE agent dir. astra executed it: a desk on a custom dir deletes keys belonging to live
default-dir sessions, and two desks prune each other.

**Fix: scope the evidence, do not widen the deletion.** Record with each stage-key file the
resolved sessions root the issuing desk enumerated (`sessionsRoot`), and prune a record only when
its `sessionsRoot` equals the current one. A legacy record with no `sessionsRoot` is pruned only
when the current root IS the default `~/.pi/agent/sessions`. Everything else is kept. Keep the
existing empty-enumeration guard. Regression test: two stores over two sessions roots, each
pruning only its own records.

## MUST 2 (MEDIUM) — the installer must not move the knowledge index away from its runtime
`packages/nana-setup/lib/paths.mjs:44` now derives `knowledgeHome` from the relocated `piHome`,
but `packages/nana-knowledge/lib/paths.ts:8` still defaults to the fixed user directory and does
not read `PI_CODING_AGENT_DIR`. astra executed the split: installer `/tmp/…/nana-knowledge`,
runtime `~/.pi/agent/nana-knowledge`.

**Fix: subtract, do not chase.** `knowledgeHome` follows the layout's BASE, never the ambient env
override: `--pi-home` and `--home` still place it (tests depend on that), but when `piHome` came
from `PI_CODING_AGENT_DIR` the knowledge home stays `<base>/.pi/agent/nana-knowledge`, where the
runtime reads. Say why in a comment and in the setup README: moving knowledge storage needs a
deliberate cross-runtime contract, which this lane is not. Test: installer path == the
`nana-knowledge` runtime default under an absolute `PI_CODING_AGENT_DIR`.

## MUST 3 (HIGH) — the installed desk service must get the directory the installer chose
`packages/nana-setup/launchd/com.nana.pi-desk.plist.tmpl` exports only `PATH`, and `stepDesk` does
not serialize `layout.piHome`. A shell environment is not the service manager's configuration: a
custom absolute override installs the pack into that directory while the launchd desk starts on
the default one.

**Fix: propagate.** When the resolved `piHome` is not the default for the layout's base, render
`PI_CODING_AGENT_DIR=<the resolved absolute dir>` into the plist's `EnvironmentVariables`. It is
always absolute by then (`install` refuses an ambient relative value). Test the RENDERED plist, not
a directly launched desk. If the win32/other-platform path has an equivalent service definition,
do the same there or say in the report that none exists.

## MUST 4 (MEDIUM) — finish the declarations
- `apps/desk/README.md` was never updated: it still names default-directory sessions and user
  config and promises terminal-equivalent configuration with no relative-path qualification. Add
  the active-directory contract and the pinning rule.
- **Surface the pin outside Settings.** A user who never opens the settings modal never learns the
  desk pinned a relative value. Put it where a session is created (or another normally encountered
  place) as well.
- `AGENTS.md`: the mismatch warning is conditional (an override can resolve TO the default dir; the
  note needs an absent active config AND an existing stranded default file). Say that precisely.
- `packages/nana-setup/README.md`: document the refusal for `project` and `project --check`, not
  only `install`.
- `packages/nana-pack/lib/receipts.ts`: it claims receipts live outside any source tree; a custom
  active agent dir can be inside one. Correct the claim.

## NOT
- Do not move the stage-key store, the handoff store or the round-cap ledger.
- Do not make `nana-knowledge` read `PI_CODING_AGENT_DIR` — that is the cross-runtime contract this
  lane is not doing.
- Do not add the relocated `settings.json` / `auth.json` to the policy floor (separate urgent item).
- Do not change the deleted-cwd STOP, the desk pin, or the installer refusal — all three are ruled.
- Do not touch the already-generated `AGENTS.md` in other repositories (`~/aml-desk`,
  `~/jev-research`); the seat carries that as a downstream refresh.

## Allowlist
`apps/desk/{stage-keys.mjs,server.mjs,public/app.js,README.md}`,
`packages/nana-setup/lib/{paths.mjs,steps.mjs}`, `packages/nana-setup/launchd/*.tmpl`,
`packages/nana-setup/README.md`, `packages/nana-pack/lib/receipts.ts`, `AGENTS.md`, and tests under
`packages/nana-setup/tests/**`, `packages/nana-pack/tests/**`, `apps/desk/test*/**`.

## Appetite
`--max-budget-usd 12` · ≤ 12 files / ≤ 200 LOC excluding tests. Crossing it: CHECKPOINT paragraph,
then continue only if the remainder is mechanical.

## doneWhen
`env -u NANA_HANDOFF npm test` exits 0, with new tests for MUST 1 (two sessions roots), MUST 2
(installer path equals the knowledge runtime default under an absolute override) and MUST 3 (the
rendered plist carries the directory).

## Report (≤30 lines)
Commit · astra's two executed counterexamples re-run before and after · where the pin is now
surfaced · `env -u NANA_HANDOFF npm test` · `git diff --stat` and the scope statement · residuals ·
the one claim most likely wrong · `VERDICT: DONE`.
