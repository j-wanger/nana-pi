Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane ci-wait-ready. Class: gate (it changes `nana-land`; the seat runs wrong-code pairs after the build). Builder: pi-worker (larger lane). Build session 1, on `feat/ci-wait-ready`, based on `feat/land-clean-merge` at 69727fbf. Every reviewer has accepted that lane's code; the seat merges main once it lands. This lane was handed from the Windows laptop to the Mac seat on 2026-11-02, because the laptop ran short of memory; two Windows attempts produced no commit (`build-1-blocked.md` in this folder records the first). Run test files one at a time.

Build to the plan of record, `docs/reviews/ci-wait-ready-2026-11-02/plan.md` (in this folder, uncommitted; commit it with your work). Its "Revision 2" section, written after the pi adversary's `plan-attack.md` and with the seat's decision on O1, overrides the sections above it. Build:
- rows R-3720 to R-3725;
- must-meet M1 to M6 as Revision 2 amends them;
- `packages/nana-pack/lib/ci-wait.mjs` (`ciReadiness`, `classifyRun`, `waitForCi`);
- the CLI `packages/nana-pack/bin/nana-ci-wait.mjs`;
- nana-land's no-run diagnosis and capacity-cancelled wording with the remedy `nana-ci-wait --tip <tip>`.

nana-land stays a one-read gate. It makes no polling and no gh write call. Requirements first: rows, then tagged tests, then code.

Why this lane exists: on 2026-11-02, tips waited hours for CI that GitHub never started, because there was no PR or the PR conflicted. GitHub also cancelled macOS jobs for capacity, and those read as red tips.

Threat model: honest variation in GitHub's responses is in scope, as Revision 2 lists it. A forged API response is out.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

## Constraints

- Edit only these:
  - the new `ci-wait.mjs`, `nana-ci-wait.mjs` and `packages/nana-pack/tests/ci-wait.test.mjs`;
  - `packages/nana-pack/bin/nana-land.mjs`, its CI read and refusal wording only;
  - `packages/nana-pack/lib/land-ci.mjs` and `packages/nana-pack/lib/land-config.mjs`;
  - `packages/nana-pack/tests/land-ci-read.test.mjs` and `land-ci-edge.test.mjs`, only where Revision 2 forecasts an edit, each listed;
  - one new check in `packages/nana-pack/tests/land-clean-merge-race.test.mjs` for Revision 2's land-clean-merge interaction;
  - the pack README's CI paragraph;
  - `REQUIREMENTS.md`;
  - `docs/known-bugs/FEAT-008.md`, appending exactly one line: "- CI wait (ci-wait-ready, plan): a run cancelled by hand looks like a capacity cancellation, so nana-ci-wait re-runs its cancelled jobs up to twice.";
  - `docs/known-bugs/FEAT-006.md`, appending exactly one line: "- Builder preamble (ci-wait-ready, build 1): the preamble's rule to stop when `gh` is missing fires on lanes whose subject is gh, though they need no real gh; the workaround is a brief line saying gh is not needed.";
  - the bin shim wiring if the pack registers bins (follow `nana-main-ci.mjs`);
  - the generated files through their generators (`npm run map`, `node scripts/requirements-tree.mjs --write`);
  - the lane folder, including `gh-evidence.md`;
  - an export under the standing authorization only.
- Never call the real `gh` or the GitHub API. Every test uses an injected Node fake gh.
- `gh` is not installed on this laptop, and that is expected. No step of this lane needs the real `gh` or a credential, so the preamble's "`gh` is missing, report it and stop" does not apply here. Do not stop for it. For `gh-evidence.md`, quote GitHub's published manual text for `gh run rerun --failed` and `gh pr list --json` fields, cited by URL, instead of running `gh --help`.
- Never read, print or use a stored credential.
- No committed text names a person or a machine path.

## Show your work

Save each in `docs/reviews/ci-wait-ready-2026-11-02/`:
- `gh-evidence.md` (Revision 2, evidence limits);
- `wrong-code.txt`: each new check against the branch base's code and against yours;
- `build-1-green.txt`, each run one at a time: `ci-wait.test.mjs`, `land.test.mjs`, `land-ci-read.test.mjs`, `land-ci-edge.test.mjs`, `land-clean-merge.test.mjs`, `land-clean-merge-race.test.mjs`, `main-ci.test.mjs` and `test-runner.test.mjs`.

## Done when

- M1 to M6 hold. R-3720 to R-3725 are `implemented` with backticked `file::title` evidence.
- These are green:
  - the test files above;
  - `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .` after `git add`.
- `node scripts/lane-class.mjs --root . --base origin/feat/land-clean-merge` prints its line; paste it.
- Commit explicit paths on `feat/ci-wait-ready`.

Report:
- the rows;
- the three functions, the CLI and nana-land's change;
- the classification rule against the real workflow;
- each existing-test edit with its reason;
- each wrong-code run;
- any export made under the standing authorization;
- each departure from the Precedent.

Commit, do not push, and stop. Report the full tip.

## Precedent

- `packages/nana-pack/lib/land-ci.mjs`: `judgeRuns` and `ciScope`.
- `packages/nana-pack/lib/main-ci.mjs` and `packages/nana-pack/bin/nana-main-ci.mjs`: a CI reader with an injected gh runner, and its CLI.
- `packages/nana-pack/lib/gh-runner.mjs`: `ghDefault`, `ghResult` and `ghEnvironment`.
- `packages/nana-pack/lib/land-config.mjs`: the `CI_*` values.
- `packages/nana-pack/bin/nana-land.mjs`: `runLandCore`'s CI read and land-clean-merge's CI re-read.
- `packages/nana-pack/tests/land-ci-read.test.mjs` and `packages/nana-pack/tests/main-ci.test.mjs`: fake-gh patterns.
- `.github/workflows/ci.yml`: the jobs, the triggers and the Linux leg's `continue-on-error`.
