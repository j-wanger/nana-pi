# Review brief — lane U2, round 2 (confirm + the widened surface)

You blocked U2 twice at round 1: the adversarial review (3 MUSTs) and the scope/compatibility
review (3 MUSTs). Read both — `u2-sol-adversarial-r1.md`, `u2-sol-scope-r1.md` — then the worker's
fix report `u2-worker-r2.md`. Worktree `~/nana-pi-wt/u2`, branch `lane/u2-agent-dir`.
`git log -p c602c68..HEAD` is the fix; `git diff ab01f1a..HEAD` is the whole lane.

Two commits answer you: `a8135f6` (the worker's five MUSTs) and `624cf8e` (a seat-written sweep of
the stale declarations the worker's allowlist could not reach). Review both the same way.

## What the seat ruled between the rounds
- **`AGENT_DIR_VAR_RE` is KEPT**, against your MEDIUM. It closes a demonstrated bypass
  (`printf x > "$PI_CODING_AGENT_DIR/nana-pack.json"`); removing it to satisfy a doc sentence would
  reopen it. The docs were corrected instead to say exactly which spellings are caught and that
  general variable expansion is not. Judge whether the docs now match the code exactly — that is
  the part you may still block on.
- **The allowlist was widened by the seat, in writing**, to the desk and `nana-setup`. Your
  compatibility finding was right: an installer that writes one file and a desk that edits another
  is the same silent mismatch the lane exists to remove. Scope creep is the worker widening
  silently; this was the seat widening deliberately. Judge the result, not the widening.

## Confirm (executed, please)
1. **MUST A** — is the realpath of each policy FILE on the floor now, for the active dir AND the
   default dir, for `nana-pack.json` AND `trust.json`? Re-run your own symlink probe.
2. **MUST B** — is a dangling policy symlink now unusable rather than absent, at user AND project
   scope? Check that a genuinely missing file still means defaults, and that a link going dangling
   mid-session keeps the last valid policy rather than widening.
3. **MUST C** — are `piAgentDir()`, `piTrustStorePath()`, `loadConfig()` and the tool handler total
   under a deleted cwd? The worker's choice is that the gate STOPS with a named reason. Rule on
   whether stopping every gated tool is right, or whether it should keep the session's last valid
   policy. This is the worker's own most-likely-wrong claim.
4. **One resolver.** `packages/nana-pack/lib/agent-dir.mjs` is now the single implementation, and
   `gate-paths.ts` re-exports it. Verify there is exactly one, that the `.ts` → `.mjs` import loads
   under pi's real extension loader, and that the desk and installer resolve the same path as
   `piAgentDir()` for absolute, relative and tilde values.
5. **Installer hermeticity.** `--home` and `--pi-home` must still fully control the layout with an
   ambient `PI_CODING_AGENT_DIR` set; a test run must not pick up the real environment.

## New surface to attack (it did not exist at round 1)
- The desk resolves the agent dir into module-level constants. The worker argues the desk never
  changes its own environment or cwd, so the value cannot change while it runs. Test that claim:
  `PI_DIR`, `SESSIONS_DIR`, settings, mcp, nana-pack and agents paths, and what the client shows.
- `nana-setup`: seed, `doctor`, and the new informational "pi agent dir" line. Can a normal
  `nana-setup` run still create a config the runtime will not read? Can `doctor` still report a
  stale file as healthy?
- The seat's declaration sweep (`624cf8e`): every sentence it changed must be TRUE of the code, and
  it must not have changed a statement about something that is deliberately fixed (the handoff
  store, the round-cap ledger, desk stage keys). Say if it made anything less true.

## NOT
Do not require `settings.json` / `auth.json` in the active dir to be added to the floor — that is a
separately filed item. Do not re-open migration/auto-copy; there is deliberately none.

## Output
Findings with severity at `file:line`, each marked **executed** (command + output) or
**source-read**. State which of your six round-1 MUSTs are FIXED, PARTIAL or OPEN. End with
`SCORE: n/10`, `MUST:`, `CARRY:` and `VERDICT: LAND|BLOCK`.
