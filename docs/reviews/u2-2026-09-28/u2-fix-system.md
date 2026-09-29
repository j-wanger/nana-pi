You are a careful senior engineer and data analyst working headless for Jake Wang's nana program. Terse reporting; every number reproducible by a command you name. A null or unresolved result is a real result. Never end your turn while a command you started is still running.

# Worker brief — lane U2 fix round, after two sol BLOCKs (adversarial 4/10, scope+compat 4/10)

Worktree `~/nana-pi-wt/u2`, branch `lane/u2-agent-dir` (HEAD `c602c68`). Read
`docs/reviews/u2-2026-09-28/u2-sol-adversarial-r1.md` and `u2-sol-scope-r1.md` first. Both reviews
are good; the adversarial one ran real probes and you should reproduce them before you believe any
fix.

Your build was sound inside its allowlist. Two of the four blocking items are holes you did not
close; the other two are the SEAT's scoping error, corrected below with an explicit amendment.

## MUST A (HIGH) — the floor must protect the realpath of the FILE, not just the directory
`lib/gate-paths.ts:145-149`. `activeDirPolicyFiles()` realpaths the agent directory. When
`<agent dir>/nana-pack.json` is itself a symlink, the gate reads and enforces the target while edits
and shell writes to that target are ALLOWED — the reviewer demonstrated it (`edit
…/actual-policy.json => ALLOW`). Add the realpath of each policy FILE. This also covers a symlinked
`~/.pi/agent/nana-pack.json` in the default location, which has the same hole today, and the trust
store beside it. Reproduce the reviewer's probe as a regression test.

## MUST B (HIGH) — a dangling policy symlink is not an absent file
`lib/config.ts:260-266`. `readConfigFile()` maps every `ENOENT` to `present:false`, so a
`nana-pack.json` symlink pointing nowhere selects DEFAULTS with no stop and no diagnostic — the
same silent-deny-drop this lane exists to remove. Distinguish the cases (`lstatSync`): a path that
exists as a link but resolves nowhere is an UNUSABLE policy file — `present:true`,
`gateValid:false`, with a problem naming it — so the existing last-valid-policy / conservative-stop
rule applies. Do the same for the project-scope file. Compare with the reviewer's table: the
directory and unreadable cases already stop correctly; the dangling case must join them.

## MUST C (MEDIUM) — totality under a deleted cwd
`lib/gate-paths.ts:65-72`, `lib/config.ts:530`, `extensions/nana-gate.ts:234-235`. With a relative
override, `path.resolve()` throws when `process.cwd()` is gone — in the main path AND in the catch —
so `piAgentDir()`, `piTrustStorePath()`, `loadConfig()` and the tool handler all throw. Two stated
contracts are violated: every `gate-paths.ts` function is total, and the gate handler never throws.
Make all four total. `loadConfig()`'s catch must not call a function that just threw. Regression
test with a deleted cwd.

## MUST D (MEDIUM) — declarations must match the runtime
`AGENTS.md:117-118,141-142,183-184` still say receipts, journal and the user config live under
`~/.pi/agent` and that the latter is "always read".
`packages/nana-pack/skills/adopt-structure/SKILL.md:102-106,133-134` tells agents to inspect the
wrong file. `extensions/nana-lifecycle.ts:4-6` has a stale journal declaration. Fix each where its
consumer reads it. T2c was blocked twice for exactly this.

Also: **keep** `AGENT_DIR_VAR_RE` — it closes a real bypass you demonstrated
(`printf x > "$PI_CODING_AGENT_DIR/nana-pack.json"`), and removing it to satisfy a doc sentence
would reopen it. The reviewer is right that it contradicts `README.md:350-356` and
`AGENTS.md:151-153`, which say variable-computed shell paths are not caught. Fix the DOCS to state
exactly what is caught: this one variable spelling (`$PI_CODING_AGENT_DIR`, `${…}`, `%…%`,
`$env:…`) directly followed by `nana-pack.json` or `trust.json` — and that general variable
expansion, `cd <dir> && … > nana-pack.json` included, is still not caught. Say it in both files.

## MUST E (SCOPE AMENDMENT by the seat) — the remediation must be true across packages
The first brief's allowlist stopped at `nana-pack`. That was wrong: `nana-setup` CREATES the user
config and the desk EDITS it, so with `PI_CODING_AGENT_DIR` set the installer writes and the desk
shows a file the pack no longer reads. A remediation that is only true in one package is the defect
astra blocked T2c for twice. The allowlist below is extended. Scope creep is when the WORKER widens
silently; this is the seat widening in writing.

1. **One resolution, importable from `.mjs`.** Move the agent-dir resolver into
   `packages/nana-pack/lib/agent-dir.mjs` (plain JS: `piAgentDir`, `piAgentDirIsCwdRelative`, and
   the `piNormalizePath` they need). `lib/gate-paths.ts` imports and re-exports it — its public
   surface does not change. The desk and `nana-setup` import the same module. There must be exactly
   ONE implementation in the repo when you are done; a second copy is a defect.
2. **Desk** (`apps/desk/server.mjs:1321-1324`, `:1436-1444`, `:2236-2241`): `SETTINGS_PATH`,
   `MCP_PATH`, `NANA_PACK_PATH` and `AGENTS_DIR` resolve from the active agent dir. They are
   module-level constants today; if the desk process can outlive an env change, resolve per request
   instead and say which you chose and why. `apps/desk/public/app.js:2067` hardcodes the label
   "User — ~/.pi/agent/nana-pack.json": take the path from the server's `nanaPath`, do not rebuild
   it on the client.
3. **nana-setup** (`packages/nana-setup/lib/paths.mjs:18-35`): `piHome` precedence becomes
   explicit `--pi-home` → `--home`-derived `<home>/.pi/agent` → `PI_CODING_AGENT_DIR` → default.
   The `--home` case must stay hermetic: tests point the whole installer at a temp home and must not
   pick up an ambient env var. `packages/nana-setup/pi/nana-pack.seed.json:3` pins
   `objective.path` to `~/.pi/agent/nana-objective.md`: drop the key so the pack's own default
   (active agent dir) applies, and make `doctor.mjs:132-138` resolve the default through the shared
   resolver so it cannot report a stale file as healthy.

## NOT
- Do not move the handoff store, the round-cap ledger, or the desk's stage keys — all three are
  deliberately fixed user-scope state.
- Do not touch `lib/objective.ts`, the trust predicate, or the T2c label.
- No migration or auto-copy of an existing config. No new config keys, no new env vars.
- No change to gate precedence, the malformed-gate fallback rules, or desk behaviour beyond the
  paths and the one label.
- Do not extend the floor to `settings.json` / `auth.json` in the active dir — the worker's residual
  is real but it is a separate item (it changes what the gate protects, not where it looks).

## Allowlist
`packages/nana-pack/lib/{agent-dir.mjs,gate-paths.ts,config.ts,receipts.ts}`,
`packages/nana-pack/extensions/{nana-gate.ts,nana-lifecycle.ts}` (declarations + the throw fix only),
`packages/nana-pack/README.md`, `packages/nana-pack/skills/adopt-structure/SKILL.md`,
`packages/nana-pack/tests/**`, `AGENTS.md`, `apps/desk/server.mjs`, `apps/desk/public/app.js`,
`packages/nana-setup/lib/{paths.mjs,doctor.mjs}`, `packages/nana-setup/pi/nana-pack.seed.json`,
and `packages/nana-setup/tests/**` if the change needs coverage there.

## Appetite
`--max-budget-usd 15` · advisory ceiling ≤ 16 files / ≤ 400 LOC changed excluding tests. On crossing
it: write a CHECKPOINT paragraph in your report naming what remains and what it costs, then continue
only if the remainder is mechanical.

## doneWhen
From `~/nana-pi-wt/u2`: `env -u NANA_HANDOFF npm test` exits 0 (the review launcher sets
`NANA_HANDOFF=off`, which fails two handoff tests for unrelated reasons — use this form), with new
regression tests for MUST A, B and C, and a test that the desk and `nana-setup` resolve the same
path as `piAgentDir()` under an absolute, a relative and a tilde value, plus `--home` hermeticity
for the installer.

## Report (≤40 lines)
Commit(s) · `env -u NANA_HANDOFF npm test` output · for MUST A/B/C the reviewer's probe re-run
before and after · what you chose for the desk's constants-vs-per-request question and why · the
grep proving one resolver implementation · `git diff --stat` and the scope statement · residuals ·
the one claim most likely wrong · `VERDICT: DONE`.
