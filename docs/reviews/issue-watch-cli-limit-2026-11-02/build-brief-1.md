Feature: FEAT-002 · Resume decisions and next actions

Lane issue-watch-cli-limit. Class: ordinary. Builder: pi-worker (small lane). Build session 1. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

Build to the plan of record, `docs/reviews/issue-watch-cli-limit-2026-11-02/plan.md`. Its "Revision 2" section, written after the pi adversary's `plan-attack.md`, overrides the sections above it, including Design and Must-meet. Take O1's default. Build rows R-3703 to R-3705 and must-meet M1 to M3 exactly as Revision 2 says. Requirements first: rows, then tagged tests, then code.

Why this lane exists: R-2992's end-to-end CLI check failed twice today on CI with `Error: CLI limit` and passes locally. Its fixed 3 s run window leaves only about 3 s of a hard 6 s bound for the child's start.

Threat model: honest variation in runner speed and load is in scope. A deliberately stalled CLI is out and must still fail the check, with its own diagnostic.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

## Constraints

- Edit only these:
  - `packages/nana-pack/tests/issue-watch.test.mjs`;
  - `packages/nana-pack/tests/issue-watch-timing.mjs` (new);
  - `REQUIREMENTS.md`;
  - the generated files through their generators (`npm run map`, `node scripts/requirements-tree.mjs --write`);
  - the lane folder;
  - an export under the standing authorization only.
- Do not change product code: `packages/nana-pack/lib/`, `bin/` and `extensions/` stay byte-identical.
- Never call the real `gh` and never touch the network; fake gh scripts only.
- Never read, print or use a stored credential. No GitHub API calls.
- No committed text names a person or a machine path.

## Show your work

Save each in `docs/reviews/issue-watch-cli-limit-2026-11-02/`:
- `wrong-code.txt`: M1 against main's harness (fails with `CLI limit`) and against yours (passes); M2 against a harness whose only bound is the case limit (fails with `case limit`, not the named diagnostic);
- `timing.txt`: `issue-watch.test.mjs` run 10 times alone, with each wall time, and the sum of every check's limits against the 300 s per-file limit;
- `build-1-green.txt`: `node packages/nana-pack/tests/issue-watch.test.mjs`, `node packages/nana-pack/tests/frontier-summary.test.mjs`, `node packages/nana-pack/tests/test-runner.test.mjs`.

## Done when

- M1 to M3 hold. R-3703 to R-3705 are `implemented` with backticked `file::title` evidence.
- These are green:
  - the test files above;
  - `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .` after `git add`.
- `node scripts/lane-class.mjs --root . --base origin/main` prints `ordinary`.
- Commit explicit paths on `feat/issue-watch-cli-limit`.

Report:
- the rows;
- the timing module with each value's provenance and the arithmetic;
- the event-driven end and the timeout owner;
- each existing-test edit with its reason;
- each wrong-code run with its failing message;
- any export made under the standing authorization;
- each departure from the Precedent.

Commit, do not push, and stop. Report the full tip.

## Precedent

- `packages/nana-pack/tests/issue-watch.test.mjs`: the R-2992 CLI check (158-165), the `check` helper (52-57), and the R-2994, R-2996 and R-2997 checks with their real-time limits.
- `packages/nana-pack/tests/launch-wait.mjs`: a test-side timing module with chosen values and provenance comments.
- `packages/nana-pack/lib/frontier-summary-config.mjs`: `WATCH_INTERVAL_MS`, `WATCH_RUN_MS` and `ISSUES_READ_LIMIT_MS` with its cold-call measurement.
- `packages/nana-pack/lib/issue-watch.mjs`: the poll loop, stop and run end (51-60, 120). Read only.
- `packages/nana-pack/lib/process-tree.mjs`: tree kill, if needed for cleanup.
