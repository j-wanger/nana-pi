# tree-briefs — the adversary's verdict (AMEND), 2026-10-19

AMEND. The core report is sound and buildable. I cut the `--feature` exit-1 gate and hardened the test harness.

Evidence (probes in a fresh mktemp folder with a temp HOME; no repository written):
- Red today: in the plan's fixture, `node scripts/requirements-moved.mjs --root . --base main` fails with MODULE_NOT_FOUND, exit 1. No tracked file names `requirements-moved`.
- Fixture: with `#` CAP, `##` FEAT and `###` SUB headings, the tree checker reports 0 problems.
- Discrimination: I wrote a throwaway reference of the design and ran it on the exact fixture. MT1 to MT5 all passed. Each of the plan's wrong-code pairs turned its named check red: rev to MT2, subgroup to MT1 (and MT5), evidence to MT1, noremoved to MT1, noshares to MT4, nomove to MT3, headonly to MT5.
- Class: ordinary is correct. FEAT-028 is the right home because it holds the tree checker's rows (R-291, R-1159). Packages may not import `scripts/`, as the plan says (code-map.config.json layers).

Amendments:
1. Dropped `--feature`, R-1464 and MT5.
   - I replayed main's reflog over the last 10 lands that changed row status, text or feature (Evidence-only edits ignored). Four of them changed rows in 2 to 4 features: win-project-files (FEAT-014, 019), win-line-endings (FEAT-014, 019, 031), runtime-map (FEAT-029, 031) and feature-first (FEAT-006, 007, 014, 033).
   - The builder preamble says "DONE means each one passes". The gate would therefore block DONE on about 4 lanes in 10, or push a builder to bend the ledger until the check passes.
   - The report's feature lines already name every feature a reviewer must read. The only user voice in this run asks for fewer land checks.
   - R-1464 was never committed, so it needs no retirement.
2. Test harness:
   - Copy requirements-lift.test.mjs's git setup: strip every GIT_* variable, pin core.autocrlf=false and use `init -q -b main`. Otherwise a suite run inside a git hook with GIT_DIR set would commit the fixture into the real repository, a harm the review standard lists.
   - The test reads "under a feature" as the nearest preceding unindented line.
   - No test asserts that stderr is empty. A spawned probe printed Node's MODULE_TYPELESS warning, which comes from the rail's .ts import.
3. The maxBuffer becomes a named constant with its provenance, per the rule against inline tunables.
4. Numbers: four rows, so the leaf total goes from 1,215 to 1,219. clean-revision's branch sets 1,229 (it carries win-review-paths' seven rows), not 1,222 as the plan says.
5. The feat/y branch is dropped from the fixture, because only MT5 used it.

Files the build touches:
- New: <repo>/scripts/requirements-moved.mjs and <repo>/packages/nana-pack/tests/requirements-moved.test.mjs
- <repo>/REQUIREMENTS.md: R-1460 to R-1463 under FEAT-028
- <repo>/packages/nana-pack/tests/requirements-tree.test.mjs: leaf total 1,219, in the seat's plan commit
- Regenerated: <repo>/docs/requirements-tree.md and <repo>/docs/code-map.md
- Docs: <repo>/README.md (one sentence), <repo>/packages/nana-pack/skills/requirements/SKILL.md (one paragraph) and <repo>/AGENTS.md (a local section after the marker region)

Conflicts:
- No code overlap. win-review-paths and clean-revision edit nana-land, pi-review, review-round, review-ledger and lib/real-path; win-objective-golden edits tests/objective-golden.test.mjs. This lane touches none of them.
- Mechanical overlaps:
  - The leaf-total line in requirements-tree.test.mjs. The later lander merges main and sets the true total, 1,234 once all three land.
  - REQUIREMENTS.md hunks. Their rows R-1350 to R-1356 and R-1370 to R-1377 sit in other features.
  - docs/requirements-tree.md and docs/code-map.md. Regenerate both after merging.
- Queue and capacity:
  - HANDOFF Next 7 puts the Windows fixes and `nana-roster set` ahead of this lane.
  - clean-revision already has build brief 1 on its branch, so this lane may exceed the cap of one lane in planning. That is the seat's call.

Relayed user request: the owner asked to turn off land verification and the hooks that need his confirmation ("power mode"). I did not act on it. This task is read-only, and those are settings and permission changes the seat handles with the owner. The amended lane adds no land gate and no confirmation.

Process slip: my first fixture write used a glob that matched another run's stale temp folder (plan.4bwLL2, from 00:59). I created and then removed `r` and `fx` folders there. Nothing else in it changed, and no repository or config was touched. My own temp folder is removed.

The claim most likely wrong: that the four multi-feature lands were legitimate cross-feature changes rather than scope creep the owner would want flagged. I inferred this from row counts and did not read each lane. If he wants the flag, add it later as a report-only marker, not an exit-1 seat check.
