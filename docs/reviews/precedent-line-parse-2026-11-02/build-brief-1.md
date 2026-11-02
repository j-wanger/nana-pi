Feature: FEAT-006 · Launch builders with execution limits

Lane precedent-line-parse. Class: ordinary. Builder: pi-worker (small lane). Build session 1. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH. The laptop is memory-limited: run test files one at a time, never in parallel.

Build to the plan of record, `docs/reviews/precedent-line-parse-2026-11-02/plan.md`. Its "Revision 2" section, written after the pi adversary's `plan-attack.md` and with the seat's "keep" on A1, overrides the sections above it, including the selection order and Must-meet. Build rows R-3716 to R-3719, amend R-2579's evidence, and build M1 to M4 exactly as Revision 2 says. Requirements first: rows, then tagged tests, then code.

Why this lane exists: pi-worker refused a brief on the word "the" because it takes a Precedent bullet's first word as its path. Bullets that start with prose and name their path in backticks must launch. Every refusal must quote the bullet and state the rule.

Threat model: honest variation in how seats write Precedent bullets is in scope. A brief that names a tracked path while relying on a different file is out.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

## Constraints

- Edit only these:
  - `packages/nana-pack/lib/brief-precedent.mjs`;
  - `packages/nana-pack/lib/brief-config.mjs`;
  - `packages/nana-pack/tests/brief-check.test.mjs`;
  - `packages/nana-pack/tests/worker-lane.test.mjs`, the R-2580 bare `tracked` fixture only;
  - `packages/nana-pack/prompts/planner.md` (32) and `packages/nana-pack/tests/planner-prompt.test.mjs` (R-2954);
  - `packages/nana-pack/README.md`, the Precedent rule sentence only;
  - `REQUIREMENTS.md`;
  - the generated files through their generators (`npm run map`, `node scripts/requirements-tree.mjs --write`);
  - the lane folder, including `corpus.txt`;
  - an export under the standing authorization only.
- Never read, print or use a stored credential. No GitHub API calls.
- No committed text names a person or a machine path.

## Show your work

Save each in `docs/reviews/precedent-line-parse-2026-11-02/`:
- `corpus.txt`: every Precedent bullet in `docs/reviews/**/*{brief,plan}*.md` parsed by main's parser and by yours, with counts of changed values and changed accept/refuse outcomes by kind. The 219 bare-path-first bullets must show 0 changed outcomes. List every changed outcome.
- `wrong-code.txt`: M1 to M3 against main's parser, and against a parser that only takes the first backticked span with no bare fallback, each failing; then against yours, passing.
- `build-1-green.txt`, each run one at a time: `brief-check.test.mjs`, `worker-lane.test.mjs`, `planner-prompt.test.mjs`, `test-runner.test.mjs`, and the tests covering `known-bug-digest.mjs` and `apps/bench/lib/anatomy-sessions.mjs` (find them with the map's impact command).

## Done when

- M1 to M4 hold. R-3716 to R-3719 are `implemented` with backticked `file::title` evidence.
- These are green:
  - the test files above;
  - `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .` after `git add`.
- `node packages/nana-pack/bin/brief-check.mjs docs/reviews/precedent-line-parse-2026-11-02/build-brief-1.md` (or its documented form) passes.
- `node scripts/lane-class.mjs --root . --base origin/main` prints its line; paste it.
- Commit explicit paths on `feat/precedent-line-parse`.

Report:
- the rows;
- the selection and refusal code;
- `corpus.txt`'s counts;
- each existing-test edit with its reason;
- each wrong-code run;
- any export made under the standing authorization;
- each departure from the Precedent.

Commit, do not push, and stop. Report the full tip.

## Precedent

- `packages/nana-pack/lib/brief-precedent.mjs`: `entryText`, `normalizeEntry`, `checkPrecedent` and `checkBriefForLaunch`.
- `packages/nana-pack/lib/brief-config.mjs`: the `PRECEDENT_*` values.
- `packages/nana-pack/lib/markdown-list-sections.mjs`: how bullets and wrapped lines become entries. Read only.
- `packages/nana-pack/tests/brief-check.test.mjs` and `packages/nana-pack/tests/worker-lane.test.mjs`: the R-2578 to R-2580 and R-2616 checks.
- `packages/nana-pack/prompts/planner.md` and `packages/nana-pack/tests/planner-prompt.test.mjs`.
