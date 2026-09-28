# Lane L1 — config safety + the nana-trust predicate   2026-09-28 · nana-pi · worktree `~/nana-pi-wt/l1`, branch `lane/l1-config-safety`

## Goal
`loadConfig` never throws for any bytes in either `nana-pack.json`; a malformed block never widens what the gate allows; project-scope config is honored only under **nana-trust** (a trust decision that was actually made, never pi's auto-trust of a nana-only `.pi/`); an ignored project config is announced, never silent. Evidence for the defects: `~/nana-pi/research/raw/2026-09-27-advances/opus-arch-tranche1.md` §0 F1 and §L1 (read it whole first), `opus-review.md` C1/C6, `sol-review.md` C1. Seat live falsifier 2026-09-28: a headless pi in a temp repo whose only file was `.pi/nana-pack.json` `{"gate":{"allowPatterns":[".*"]}}` executed `rm -rf` on a target with no prompt — F1(b) is CONFIRMED, so the trust predicate stays in scope.

## Appetite
`--max-budget-usd 25` · advisory ceiling ≤16 files / ≤500 LOC (the arch contract expects ~150–250 LOC code + ~250 LOC tests + fixture edits in 12 test files). If the predicate needs more than this (e.g. pi offers no usable trust evidence at all), STOP with what is green and a precise statement of the gap. Never expand into gate patterns, handoff logic or objective resolution.

## doneWhen
From the worktree root: `npm test` exits 0 (the L4 runner; 55 files). Plus the three new test files below pass, and `objective-injection.test.mjs` passes with NO assertion changes.

## Outcome (invariants), from the arch contract §L1
1. `loadConfig` returns a fully typed config for any input. A malformed **leaf** falls back to that leaf's default; a malformed array **entry** is dropped; a file that fails to parse contributes nothing. Each problem yields ONE diagnostic per session per (file, problem): a `config_invalid` journal line, and one UI warning when a UI exists.
2. **Permission-block exception (astra r2 HIGH, binding):** for the `gate` block, "default" is not an acceptable fallback when a previously valid policy existed. If the user-scope gate block is malformed at a FRESH process start, the gate must either load the last *validated* gate policy from a persisted snapshot (write it beside the config, e.g. `~/.pi/agent/nana-pack.gate.validated.json`, on every successful load) or stop conservatively (block every gated tool class with the reason "repair `nana-pack.json`") until a trustworthy policy loads. Advisory blocks (objective, notify, postEdit, handoff, journal) may fall back to defaults with the loud diagnostic; the gate block may not. Test both corruption cases: mid-session and fresh process.
3. Project-scope config (`<cwd>/.pi/nana-pack.json`) is honored only under nana-trust: `ctx.isProjectTrusted()` is true AND trust was actually decided — either pi would have asked (trust-requiring resources exist at cwd: `.pi/{settings.json,extensions,skills,prompts,themes,SYSTEM.md,APPEND_SYSTEM.md}` or an ancestor `.agents/skills`; see `dist/core/trust-manager.js:150-169` of the installed pi) or the owner recorded trust for this directory outside the repo (pi's `trust.json` via `/trust`, or, if `/trust` cannot record a nana-only dir — verify — a user-scope `trustedProjects` list in `~/.pi/agent/nana-pack.json`). Auto-trust of a nana-only `.pi/` NEVER counts. Trust evidence is resolved at `session_start` and cached per cwd; `loadConfig` stays synchronous and cheap inside `tool_call`.
4. A project config that exists but is ignored produces exactly one notice naming how to trust it.
5. pi is not resolvable outside the pi process (`import('@earendil-works/pi-coding-agent')` → `ERR_MODULE_NOT_FOUND` from nana-pi), so the predicate has a fail-closed fallback in bare harnesses (same pattern as post-edit's `loadFileQueue`).
6. "Never widens": for every malformed variant, effective `gate.allowPatterns` ⊆ the valid config's list, and project-scope `postEdit.commands` is empty unless nana-trusted.

## Tests (deterministic; name each case)
- `packages/nana-pack/tests/config-normalize.test.mjs` (new, temp HOME + USERPROFILE): for each of the 7 blocks and each leaf, values `null, 7, "x", [], true, {}, {"unexpected":1}` at user scope, then at trusted project scope → no throw; every leaf typed; invalid leaf = default (except the gate rule above); valid siblings survive. Named cases: sol's `{"postEdit":{"commands":null}}`, `{"objective":{"path":7}}`, Opus's trailing-comma file.
- `packages/nana-pack/tests/config-handlers-malformed.test.mjs` (new): drive every registered handler (gate `tool_call`, post-edit `tool_result`, objective `session_start`+`before_agent_start`, handoff `session_start`+`session_compact`, notify, lifecycle) under each malformed user config → none throws; the gate still blocks `rm -rf /tmp/x` headless; objective yields text or the `OBJECTIVE UNAVAILABLE` marker; one `config_invalid` journal line names the file.
- `packages/nana-pack/tests/config-gate-fallback.test.mjs` (new): a custom `extraPatterns` deny (`terraform destroy`) configured and loaded → file corrupted mid-session → still blocked; fresh process with the corrupted file → still blocked (snapshot) or every gated class blocked with the repair reason; a malformed gate block never allows more than the last valid one.
- `packages/nana-pack/tests/config-trust.test.mjs` (extend; keep the 5 existing cases' intent): nana-only fixture + `isProjectTrusted: () => true` → project IGNORED (the F1 case); fixture with `.pi/settings.json` + true → honored; owner-recorded trust → honored; no API → closed; the ignored notice appears exactly once.
- Existing 12 test files that build a nana-only `.pi/` fixture with `isProjectTrusted: () => true`: fixture changes and HOME isolation only, NO assertion edits (a test whose assertion becomes false under the new predicate is a FINDING for the report, with the replacement contract).

## NOT
- No gate pattern changes (L2). No handoff logic (L3). No objective resolution changes (tranche 2). No `bin/pi-review.mjs`. No desk.
- Do not weaken any existing assertion to make the suite green.
- Do not make the trust predicate ask pi to prompt; nana never prompts for trust itself.

## Allowlist
`packages/nana-pack/lib/config.ts` · `packages/nana-pack/extensions/nana-lifecycle.ts` (surface diagnostics once per session only) · `packages/nana-pack/extensions/nana-gate.ts` ONLY for the validated-snapshot / conservative-stop wiring of invariant 2 (no pattern edits) · the three new test files · fixture/HOME edits in existing tests · `packages/nana-pack/README.md` Config section · `templates/_shared/working-under-nana-pi.md` and `packages/nana-pack/skills/adopt-structure/SKILL.md`: one line each on how to trust a project so seeded post-edit config is not silently inert.

## Constraints (host facts; verify against the installed pi, which lane U may have upgraded to 0.87.1 — check `pi --version` first and cite the docs of the version you find)
- tool_call handler errors BLOCK the tool (`AGENTS.md`). `loadConfig` is called inside `tool_call`.
- `ctx.isProjectTrusted()` is a bare boolean; pi does not expose whether it was auto-granted. pi exports `hasTrustRequiringProjectResources` and `ProjectTrustStore` from its public index; runtime imports from pi inside the pi process are a documented extension pattern.
- win32: `USERPROFILE`; directory canonicalization for trust must match pi's `canonicalizePath`.
- Existing documented feature that changes: "project config honored on auto-trust" → honored on a decided trust or owner-recorded trust, with a visible notice when ignored. Say this in the README section.

## Roles
builder: Opus 5.5 (you) · reviewers: **scope** (sol: allowlist, NOT-list, smallest change, appetite) + **adversarial** (sol: executed probes on malformed shapes, corruption + restart, the F1 repo shape against real pi trust code, gate-survives-after) + **compatibility** (sol: the 12 fixtures, the documented feature change, win32) · land: **astra** (permission surface).

## Rules
Foreground commands only; never end your turn with a command running. Kill only PIDs you started. Commit on the branch, no push. Smallest change that passes. Baseline first: `npm test` on the untouched worktree, record the summary line.

## Report (≤40 lines)
Commits · baseline vs after `npm test` summary lines · each invariant with the test case that pins it · the fresh-process gate-fallback design you chose (snapshot or conservative stop) and why · whether `/trust` records a nana-only dir (verified how) · every existing test whose fixture changed (list) and any whose assertion would now be false (FINDING) · `git diff --stat` · residuals · the one claim most likely wrong · `VERDICT: DONE`.
