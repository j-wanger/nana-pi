# Brief 2: seat-pull-off, CI suite fix

Feature: FEAT-013 · Install and connect harness runtimes

CI on 5c45c930 failed the suite on all three platforms in one place: `test-runner.test.mjs`, "the source check detects direct mkdtemp calls". `packages/nana-setup/tests/seat-pull-off.test.mjs` calls `fs.mkdtempSync` directly. Use the shared `tmpDir` helper (nana-setup's tests import it from `./tmp-dir.mjs`). Run `node scripts/test.mjs seat-pull-off test-runner`; both must pass. If the code map records this file's check count, regenerate it with `npm run map`. Change nothing else.

## Precedent
- `packages/nana-setup/tests/retired-artifacts.test.mjs` — imports `tmpDir` from `./tmp-dir.mjs`.

Report: the tip, and the exit codes of the runner command and `npm run map:check`.
