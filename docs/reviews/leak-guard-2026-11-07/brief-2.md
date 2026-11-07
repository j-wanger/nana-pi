# Brief 2: leak-guard, CI suite fix

Feature: FEAT-041 · Shape each agent's context by role

CI on 2f2713d3 failed the suite on all three platforms in one place: `test-runner.test.mjs`, "the source check detects direct mkdtemp calls". That check requires every test file that calls `tmpDir(` to import it with exactly `import { tmpDir } from "./tmp-dir.mjs";` (double quotes). `packages/nana-pack/tests/leak-scan.test.mjs:16` uses single quotes. Change that line to the exact form. Run `node scripts/test.mjs test-runner leak-scan`; both must pass. Regenerate the code map if it changes. Change nothing else.

## Precedent
- `packages/nana-pack/tests/test-runner.test.mjs` — lines 660–672, the source check.

Report: the tip and the runner's exit code.
