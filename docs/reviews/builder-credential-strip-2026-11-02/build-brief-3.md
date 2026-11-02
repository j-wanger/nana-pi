Feature: FEAT-006 · Launch builders with execution limits

Lane builder-credential-strip. Class: gate. Builder: pi-worker (small lane). Build session 3, on branch tip after round 2. Round 2 (`r2-reviewer-4d2a1d6e.md`, `r2-land-4d2a1d6e.md` in this folder): the land reviewer said LAND; the final reviewer sent back one MUST: the suite fails on every CI leg on two checks that pass on main, both from build 1.

## Precedent

- `packages/nana-pack/tests/test-runner.test.mjs` (R-917's source check, around line 669: the exact double-quoted `tmpDir` import line)
- `packages/nana-pack/tests/context-anatomy.test.mjs` (R-3211's expected claude-review settings env, around line 118)
- `packages/nana-pack/lib/nana-gate-policy.ts` or wherever build 2 put `CREDENTIAL_PATTERNS`

Report each departure.

## Build

1. MUST: in `credential-gate.test.mjs` and `credential-strip.test.mjs`, import `tmpDir` with the exact double-quoted line R-917's check expects.
2. MUST: R-3211's expected claude-review settings env gains exactly the credential controls this lane adds on purpose (`GIT_CONFIG_*`, `GIT_ASKPASS`, `SSH_ASKPASS`, `GIT_TERMINAL_PROMPT`, `GCM_INTERACTIVE`, as the code sets them), read from the lane's exported names where they exist, never retyped literals. Keep the comparison exact.
3. SHOULD, take it: the gate floor also refuses `git credential-store --file x get`, `gh auth status -t` and `git credential-cache get`, with one gate-corpus case each and the existing negatives still allowed.
4. Record the round 2 NOTEs as FEAT-006 known-bug lines naming "(builder-credential-strip, review round 2)": the ledger spots Claude only by command name (`npx claude`, `node …/cli.js`, an `env` prefix, or args after `--` skip sealing); the pack README does not state that direct `review-ledger run -- claude` reviewers now get the ancestor excludes and auto-memory off; M5's banned phrase lacks backticks.

Change nothing else. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: `test-runner.test.mjs`, `context-anatomy.test.mjs`, every test file this lane touched, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, and `node scripts/identity-scan.mjs --root .` after `git add`. Re-run `seat-mutate.mjs` in this folder; every pair must still be red. Do not run the locked full suite; CI is the suite. Commit, do not push, and report the full tip.
