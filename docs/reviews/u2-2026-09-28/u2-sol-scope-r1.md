## Findings

- **HIGH — The desk still edits and displays the inactive config.** `apps/desk/server.mjs:1321-1324`, `apps/desk/server.mjs:1436-1444`, `apps/desk/server.mjs:2236-2241`, `apps/desk/public/app.js:2067` hardcode `~/.pi/agent`, including the user `nana-pack.json`. With `PI_CODING_AGENT_DIR` set, the desk shows and writes a file the pack no longer reads. This recreates the exact silent policy mismatch U2 is intended to eliminate and can lead users to believe gate changes are active when they are not.

- **HIGH — `nana-setup` installs and diagnoses the old location by default.** `packages/nana-setup/lib/paths.mjs:18-35` ignores `PI_CODING_AGENT_DIR`, while `packages/nana-setup/lib/doctor.mjs:132-138` can report the stale default config and objective as healthy. A normal setup invocation can therefore create `~/.pi/agent/nana-pack.json` while the runtime reads another directory. Explicit `--pi-home` works, but the default no longer follows pi’s active contract. Additionally, `packages/nana-setup/pi/nana-pack.seed.json:3` pins the objective back to `~/.pi/agent`, even when the config itself is placed elsewhere.

- **MEDIUM — Repository declarations now contradict runtime behavior.** `AGENTS.md:117-118`, `AGENTS.md:141-142`, and especially `AGENTS.md:183-184` still state that receipts, journal, and user config live under `~/.pi/agent`, with the latter “always read.” The generated guidance in `packages/nana-pack/skills/adopt-structure/SKILL.md:102-106` and `:133-134` also instructs agents to inspect the wrong user config. `packages/nana-pack/extensions/nana-lifecycle.ts:4-6` retains the stale journal declaration. The pack README’s mismatch note is good, but it does not repair these authoritative or workflow-facing declarations.

- **MEDIUM — The new shell-variable special case exceeds the lane contract and contradicts the documented gate model.** `packages/nana-pack/lib/gate-paths.ts:164-178` adds `AGENT_DIR_VAR_RE`, changing gate semantics to recognize selected computed-variable paths. The brief required active-path and realpath protection, prohibited gate-semantics changes, and the doneWhen cases pass using resolved literal paths without this helper. Removing the helper and its self-authored variable assertions would produce a smaller compliant diff. It also conflicts with `packages/nana-pack/README.md:350-356` and `AGENTS.md:151-153`, which say variable-computed shell paths are not caught.

## Scope and compatibility accounting

The allowlist is mechanically respected: 7 changed files, all permitted; `lib/objective.ts`, trust logic, T2c labeling, ledger behavior, precedence, malformed-gate fallback, keys, and environment variables are untouched. Non-test appetite is within limits, so no CHECKPOINT was required.

Relevant fixed-path consumers:

- `lib/config.ts`: user config, trust fallback, and journal correctly use `piAgentDir()`.
- `lib/receipts.ts`: correctly uses `piAgentDir()`.
- `lib/objective.ts`: already correctly uses the shared resolver.
- `bin/review-round.mjs`: correctly remains fixed by explicit ruling.
- `extensions/nana-handoff.ts`: remains fixed; U2 did not authorize moving this store.
- `extensions/nana-post-edit.ts`: `homedir()` is only home/tilde path normalization, so it should remain.
- `extensions/nana-lifecycle.ts`: implementation follows `journalFile()`, but its declaration is stale.
- Desk and nana-setup: should follow the active directory for pi/user nana configuration; they do not.
- Desk stage-key storage and unrelated home-relative app/test paths are separate application state and may remain fixed.

`bin/nana-objective.mjs` calls `loadUserObjective()`, while pi calls `loadConfig()`, so both runtime producers now read objective settings from the same active config. The setup seed remains a cross-package caveat because its explicit objective path points back to the default directory.

The case-insensitive/slash-agnostic matching remains intact. Tilde, `$HOME`, `$env:USERPROFILE`, and `%USERPROFILE%` forms remain covered. The focused U2 test passes 101/101. The full suite run in this review environment reported two handoff failures because the review launcher sets `NANA_HANDOFF=off`; both tests pass when that role flag is removed, so this is not attributed to U2.

SCORE: 4/10  
MUST: Make the desk and nana-setup honor the active agent directory, update authoritative AGENTS/skill declarations, and remove or separately authorize/document the `AGENT_DIR_VAR_RE` semantics expansion.  
CARRY: Handoff, round ledger, desk stage keys, and unrelated home-relative resources remain deliberately fixed; consider centralizing active-agent-dir resolution across packages in a separately scoped compatibility lane.  
VERDICT: BLOCK
