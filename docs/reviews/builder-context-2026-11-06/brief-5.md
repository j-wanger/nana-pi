# Brief 5: builder-context, CI suite fix

Feature: FEAT-041 · Shape each agent's context by role

CI on build 1's tip (34649b4e) failed the suite on all three platforms, for two reasons the new test module causes. Both still apply at the current tip.
1. `packages/nana-pack/tests/builder-context.test.mjs`: "0 pass — no check passed and no skip was declared". The repo's runner (`scripts/test.mjs`) counts the PASS/FAIL lines a test file prints. This module uses `node:test` and prints none. Rewrite it in the repo's own style (PASS/FAIL lines per check, nonzero exit on failure), keeping the same seven checks, their `req:` markers and assertions.
2. `test-runner.test.mjs`, "the source check detects direct mkdtemp calls": the module calls `fs.mkdtempSync` directly. Use the shared `tmpDir` helper from `./tmp-dir.mjs` instead.
Run the module through `node scripts/test.mjs builder-context` and through `node scripts/test.mjs test-runner`. Both must pass. Change nothing else.

## Precedent
- `packages/nana-pack/tests/brief-check.test.mjs` — a test module in the repo's style, using `tmpDir` and `writeFakePi`.
- `packages/nana-pack/tests/tmp-dir.mjs` — the shared temp-folder helper.

Report: the tip, and the exit codes of the two runner commands above.
