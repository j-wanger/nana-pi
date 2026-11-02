Feature: FEAT-006 · Launch builders with execution limits

Lane builder-credential-strip. Class: gate. Builder: pi-worker (larger lane). Build session 2. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

The plan of record is `docs/reviews/builder-credential-strip-2026-11-02/plan.md` (revision 2). Review round 1 ran at 3289f566, and its texts are in this folder:
- `r1-reviewer-9891c562.md`: Opus, LAND with 2 SHOULD;
- `r1-land-da2a7d7a.md`: astra land reviewer, SEND-BACK with one MUST;
- `independent-check-3289f566.md`: pi sol, PASS.

This session fixes the MUST, takes both SHOULDs, and records the NOTEs. Change nothing else.

## Findings

1. **MUST (land reviewer, reproduced with a fixture through the real ledger).** `packages/nana-pack/bin/review-ledger.mjs` (the model spawn, around line 169) strips only the spawn environment. The documented `review-ledger run -- claude …` path supplies no sealed Claude settings, unlike claude-review. So a Claude settings `env.GIT_CONFIG_PARAMETERS` that names a credential helper restores credential dispatch.
   - Seal that path's Claude settings the way `claude-review.mjs` does, through `readClaudeBuilderSettings` with `credentialStripEnv`, whenever the ledger's child is Claude Code.
   - Add a regression case to M2 (R-3661). Its ledger fixture applies Claude settings whose `env.GIT_CONFIG_PARAMETERS` names the fixture helper, and the child still gets no fixture password. Red against the current code first, recorded.
2. **SHOULD 1.** Root `README.md:318` (the Tests section) still says "Builders run touched tests, push their last commit and stop". Make it match the new rule: builders do not push, and the seat pushes after verifying, then waits for the pushed tip's CI. Check `npm run readme:check` and any test that pins that sentence.
3. **SHOULD 2.** The gate floor misses these forms:
   - `git credential-osxkeychain get`, with a space;
   - `git credential-manager-core get`;
   - `git credential-store get`;
   - `git credential-wincred get`;
   - `gh auth status --show-token`.

   Add them to `CREDENTIAL_PATTERNS` (R-3667's seal changes with them) and to M4's corpus. Add near-miss negatives that stay allowed: `git credential-store --file x erase` is not a `get`, `gh auth status` without `--show-token`, and `git credential-cache exit`.
4. **NOTEs.** Record each NOTE from both round 1 reviews as one line in `docs/known-bugs/FEAT-006.md`, each naming "(builder-credential-strip, review round 1)". This brief authorizes that edit.

## Constraints

- Edit only:
  - `packages/nana-pack/bin/review-ledger.mjs`, `packages/nana-pack/lib/credential-gate-config.mjs`;
  - `packages/nana-pack/tests/credential-strip.test.mjs`, `packages/nana-pack/tests/credential-gate.test.mjs`;
  - `README.md`, `docs/known-bugs/FEAT-006.md`, `REQUIREMENTS.md` evidence cells;
  - the generated files through their generators (`npm run map`, `node scripts/requirements-tree.mjs --write`);
  - one line in this lane's session entry in `docs/sessions/2026-10.md`;
  - the lane folder.

  Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.
- **Never read, print or use a real stored credential.** Fixtures only: a temporary helper and settings in a temporary HOME. No GitHub API calls.
- **Do not push.** Commit, and report the branch and the tip.
- No committed text names a person or a machine path.

## Show your work

Save each in `docs/reviews/builder-credential-strip-2026-11-02/`:
- `build-2-red.txt` and `build-2-green.txt`;
- the touched tests: `node scripts/test.mjs packages/nana-pack/tests/credential-strip.test.mjs packages/nana-pack/tests/credential-gate.test.mjs packages/nana-pack/tests/gate-corpus.test.mjs`;
- `node packages/nana-setup/bin/install-check.mjs`, with `NANA_WORKTREE_ROOT` cleared, and its exit.

## Done when

- The MUST's regression case fails before the fix and passes after it. M4 covers the new forms and the negatives.
- These are green:
  - every touched test;
  - `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `nana-writing` on the new lines;
  - `node scripts/identity-scan.mjs --root .`.
- Commit explicit paths on `feat/builder-credential-strip`. Do not push.

Report:
- the branch and tip;
- the ledger settings fix;
- the new patterns and negatives;
- the NOTE lines;
- the red and green results;
- the install-check exit;
- each departure from the Precedent.

## Precedent

- `packages/nana-pack/bin/claude-review.mjs`: `readClaudeBuilderSettings` with `credentialStripEnv`, the sealed-settings form the ledger path copies by import.
- `packages/nana-pack/lib/claude-settings-carry.mjs`: the settings carry.
- `packages/nana-pack/bin/review-ledger.mjs`: the model spawn.
- `packages/nana-pack/lib/credential-gate-config.mjs`: `CREDENTIAL_PATTERNS`.
- `packages/nana-pack/tests/credential-strip.test.mjs` and `packages/nana-pack/tests/credential-gate.test.mjs`: the M2 matrix and the M4 corpus.
