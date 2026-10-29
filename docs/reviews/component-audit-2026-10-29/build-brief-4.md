Feature: FEAT-039 · See the product and its decisions in one report

Lane component-audit. Class: ordinary. Builder: pi-worker (small lane). Build session 4, on tip b003b988.

The confirmation reviewer sent round 2 back with one MUST: the CI failure still stands. Build 3 fixed `scripts/component-audit.mjs`, but the R-3103 test in `packages/nana-pack/tests/component-audit.test.mjs` itself sets `auditedAt` with `run(ROOT, ["rev-parse", "main"])` (around line 88). A CI checkout has no local `main`, so the test fails before the audit runs. The reviewer reproduced it in a detached clone of b003b988 with no local branches: `FAIL R-3103 … fatal: ambiguous argument 'main'`.

## The fix

1. Use `HEAD` (or another commit every checkout has) wherever this test file names `main`. Search the whole file and every other test this lane added for a dependency on a local `main` or any named branch.
2. Prove it the way CI runs: clone the repo to a temp folder outside the repo, check out the tip detached, delete every local branch, and run `node scripts/test.mjs packages/nana-pack/tests/component-audit.test.mjs` there. Report its summary line. Delete the clone after.

Numbers that must not move: the frozen contract and fixture sha256 values; rows R-3100 to R-3110; the `--asks` output.

Run the locked full suite as a plain foreground command with its output on screen. Push the tip to pull request 265 and report CI's result on all three systems once it finishes.

## Done when

The detached-clone run passes, the locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green, and CI on pull request 265 passes on all three systems.

## Precedent

- `packages/nana-pack/tests/component-audit.test.mjs`: build 3's R-3104 fixture repo with no `main`.
