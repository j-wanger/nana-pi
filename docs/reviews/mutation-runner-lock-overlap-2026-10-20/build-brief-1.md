# Build brief 1 — mutation-runner-lock-overlap
Feature: FEAT-031 · Run checks reliably and without contaminating work. Class: ordinary (tests only). Rows: none new. R-1776 and R-1777 stay as they are. Follow packages/nana-pack/prompts/builder-preamble.md. Work in ~/nana-pi-wt/mutation-runner-lock-overlap on feat/mutation-runner-lock-overlap, from current main. Run single test files only. Do not push. Do not edit HANDOFF.md, docs/sessions/, REQUIREMENTS.md or the requirements tree.

Why: the lock contention check starts with an unreadable gate lock and a gate marker. It lifts the lock before it removes the marker. A worker that gets in between finds the marker and records an overlap the lock did not cause. CI hit this once as "5:0". The marker adds nothing, because the check's enteredFreshUnreadable read already fails on any entry during the gate.

Change packages/nana-pack/tests/mutation-runner.test.mjs only, in the contention block (the one ending in the check titled "mutation runner: contending child processes observe complete lock ownership and never overlap their critical sections"):
1. Delete `fs.writeFileSync(markerPath, "gate", { flag: "wx" });`, the line after the first `fs.writeFileSync(lockPath, malformedGate);`.
2. Delete `fs.rmSync(markerPath, { force: true });`, the line after the content-checked removal of the gate lock.
3. In the worker script's EEXIST branch, add the generated line `let holder; try { holder = fs.readFileSync(markerPath, "utf8"); } catch { holder = "?"; }`. Then change the overlap append to write `${id}:${i} found ${holder}`.
4. Directly above `const enteredFreshUnreadable = …`, add one comment: no exclusivity marker exists during the gate, because this read catches any entry and a marker would race the lift.
Keep the check title, its `// req: R-1776` and `// req: R-1777` markers and the file header unchanged. Add no test, no constant, no row and no module.

Checks, from packages/nana-pack:
- `node --experimental-strip-types tests/mutation-runner.test.mjs` must pass every check (39 PASS today).
From the repo root:
- `node scripts/requirements-trace.mjs`, `npm run map:check` and `npm run readme:check` must be green.
Do not run load or busy-loop reproductions. They would disturb other lanes on this machine.

Wrong code to try. Apply each one alone in lib/mutation-runner.mjs, run the test file, record the head of the contention check's FAIL detail, then revert:
- W2: on the unreadable-age line, change it to `held = false && now() - …`. Expect the contention check to FAIL with enteredFreshUnreadable true. The transient-retry check may also fail, and that is expected.
- W3: in publishWorktreeLock, change the EEXIST branch so that when Math.random() < 0.01 it removes the lock, links the temp file and returns "acquired". Expect FAIL with overlaps of the form `a:b found c:d`.

Done:
- The test file passes.
- W2 and W3 each turn the contention check red.
- Trace, map and readme checks are green.
- `git diff --stat main` lists only the one test file.
- No lib file differs from main.

Report, 10 lines or fewer:
- the tip sha
- the test file's PASS/FAIL/SKIP counts
- the first 160 characters of the contention check's FAIL detail for W2 and for W3
- the trace, map and readme results
- `git diff --stat main`
- any deviation from this brief