Feature: FEAT-013 · Install and connect harness runtimes

Lane builder-install-check. Class: install (the seat runs wrong-code pairs after the build; the macOS install check runs before the land). Builder: pi-worker (small lane). Build session 1. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH. The laptop is memory-limited: run test files one at a time, never in parallel, and do not run `install-check.mjs` itself.

Build to the plan of record, `docs/reviews/builder-install-check-2026-11-02/plan.md`. Its "Revision 2" section, written after the pi adversary's `plan-attack.md`, overrides the sections above it. The seat confirmed the cause from both Mac failures (plan section "Seat confirmation"). Build rows R-3713 to R-3715, amend R-1071's seal evidence, and build M1 to M3 exactly as Revision 2 says. Requirements first: rows, then tagged tests, then code.

Why this lane exists: builders running install-check report a false PARTIAL. pi-worker gives builder children `NANA_WORKTREE_ROOT`, and install-check's sandbox does not remove it. So its own pi turn's gate blocks the post-edit fixture write as `write-error`.

Threat model: honest variation in the caller's environment is in scope. A caller that deliberately sets variables to defeat the sandbox is out.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

## Constraints

- Edit only these:
  - `packages/nana-setup/lib/install-check-config.mjs`;
  - `packages/nana-setup/tests/install-check.test.mjs`, or one new test file beside it for M2 and M3;
  - `packages/nana-pack/bin/worker-config.mjs` and `packages/nana-pack/bin/pi-worker.mjs`, only to move the builder child's environment additions into the shared definition (Revision 2), with no change in the values;
  - `REQUIREMENTS.md`;
  - the generated files through their generators (`npm run map`, `node scripts/requirements-tree.mjs --write`);
  - the lane folder, including `env-audit.md`;
  - an export under the standing authorization only.
- `worker-lane.test.mjs` and `worker-claude.test.mjs` must stay green unedited; the builder child's environment must be byte-for-byte the same.
- Never read, print or use a stored credential. No GitHub API calls.
- No committed text names a person or a machine path.

## Show your work

Save each in `docs/reviews/builder-install-check-2026-11-02/`:
- `env-audit.md` (Revision 2);
- `wrong-code.txt`: M1 to M3 against main's code, and M3 against a definition with one unclassified added variable, each failing; then against yours, passing;
- `build-1-green.txt`: `install-check.test.mjs`, any new test file, `worker-lane.test.mjs`, `worker-claude.test.mjs`, `credential-strip.test.mjs` and `test-runner.test.mjs`, one at a time.

## Done when

- M1 to M3 hold. R-3713 to R-3715 are `implemented` with backticked `file::title` evidence.
- These are green:
  - the test files above;
  - `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .` after `git add`.
- `node scripts/lane-class.mjs --root . --base origin/main` prints its line; paste it.
- Commit explicit paths on `feat/builder-install-check`.

Report:
- the rows;
- the shared environment definition and pi-worker's use of it;
- the override and kept lists;
- M2's portable branch on this OS;
- each existing-test edit with its reason;
- each wrong-code run;
- any export made under the standing authorization;
- each departure from the Precedent.

Commit, do not push, and stop. Report the full tip.

## Precedent

- `packages/nana-setup/lib/install-check-config.mjs`: `OVERRIDE_ENV` and its contract comment.
- `packages/nana-setup/lib/install-check.mjs`: `buildEnvironment` and `judgePiPostEdit`.
- `packages/nana-setup/tests/install-check.test.mjs`: the R-1071 checks (78-97).
- `packages/nana-pack/bin/pi-worker.mjs` (95, 397-402) and `packages/nana-pack/bin/worker-config.mjs` (`CLAUDE_BUILDER_CHILD_ENV`).
- `packages/nana-pack/lib/credential-strip.mjs`: `credentialStripEnv`.
- `packages/nana-pack/extensions/nana-gate.ts` (`laneWriteHit`), `packages/nana-pack/lib/gate-temp-roots.ts` (`acceptedTempRoots`) and `packages/nana-pack/extensions/nana-post-edit.ts`. Read only.
