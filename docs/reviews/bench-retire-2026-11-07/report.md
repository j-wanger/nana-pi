# bench-retire — technical record

Feature: FEAT-034 · Define reproducible comparisons
Branch: `feat/bench-retire`
Base: `a562ff9a6a7eda7b06a75a5b58dac18bf977a25c`

## Result

M1–M8 pass. Study execution, grading, aggregation and catch-ledger extraction are retired.
Anatomy and memory shaping retain their live helpers. No study path changed.
The shared AGENTS working-pattern region, seat guide, review tools, HANDOFF, known-bug files and session archives were not edited.

## Requirements first

Added exactly R-3783–R-3790 under FEAT-034, in M-order, initially planned and then implemented after the tests passed.
Retired 85 rows, without deleting or renumbering any row:

- R-500–R-538, R-541–R-543, R-545–R-576.
- R-1095, R-1500–R-1504, R-1520, R-2517, R-2770–R-2772.

R-539, R-540 and R-577 remain: these constrain interpretation and adoption of the preserved results, rather than implement a runner.
R-544 remains: the surviving bench tests still make zero model calls.
Writing-trial rows R-691–R-698 remain unchanged.
G-004's evidence now names the zero-header-exemption test.
R-607's evidence now names the live prerequisite tests rather than the removed study-extension prerequisite.
FEAT-035–FEAT-037 are frozen records: the tree forbids a retired feature holding even retired rows, and rows cannot move in this lane.
Removed the five retired deliverables and their maker, reader and park lines from CAP-08.
A-039–A-043 and A-074–A-078 remain registered historical artifacts, with historical manual makers and human readers.
No artifact ID was reused or deleted.

## Cut inventory and precedent

All A1 file cuts were verified against imports and fixture-copy readers, then deleted:

- `apps/bench/run.mjs`, `aggregate.mjs`, `catch-ledger.mjs`.
- `apps/bench/ext/bench-nested-usage.ts`.
- `apps/bench/lib/{nested,pi-exports,profiles,catch-extract,eval-module,fixture,agentdir,plan,checkers,catch-stats}.mjs`.
- Their 14 runner-only test files: agentdir, aggregate, argv, catch-ledger, checkers, evaluator-hardening, integration, nested, ops, orchestration-paths, plan, study-tasks, timeout and usage.

The challenged cuts were real:
`plan.mjs` had an anatomy reader, now using `lib/jsonl.mjs`;
`fixture.mjs` and `checkers.mjs` were copied by requirements-tree/regroup fixtures, now copying `scripts/glob-match.mjs`;
`eval-module.mjs` was needed only by the removed grading stack and its tests.
No A1 file cut was kept.

Retained exceptions and reasons:

- `apps/bench/lib/usage.mjs`: keeps parseStream, used by the pi memory-shaping adapter. Removed study record-cost helpers, incompleteReason and unused re-exports.
- `apps/bench/lib/catch-judge.mjs`: keeps callJudge, used by the Claude memory-shaping adapter and anatomy through createRunner. Removed catch-specific prompts, vocabularies, schemas, hashes and validation.
- Every anatomy module, including seat and slots, stays. Only helper imports changed.
- Study trees, test stream fixtures and their bytes stay. Remaining anatomy tests still use their existing temp helper.
- `docs/reviews/scrub-records-2026-10-21/rekey.mjs` remains a dead historical importer, as A5 requires.

Read all five helper precedent files completely. The one-reviewer plan was absent in this checkout;
read its full committed version at `37edb726:docs/plan/one-reviewer.md` before designing.
Followed its retirement shape and one-reviewer-plus-CI assumption; no process-rule edits were needed.
O1 placements: globMatch beside both report consumers; kappa/sample beside anatomy; JSONL beside its anatomy reader.
No helper was copied into a second live implementation. No private import was introduced.
`helper-moves.txt` proves all six surviving public function bodies are byte-identical to the base.
There are no behavioral departures from the helper precedents.

## Tests and wrong-code pairs

Only one new suite file, `apps/bench/test/retire.test.mjs`, contains exactly the eight must-meet cases.
Its harness awaits each case under a limit. Fixtures live in OS temp. No new test starts a model session or runs a seat script.
The JSONL move includes CRLF, trailing space/tab and complete records without a final newline.

Initial run: `node scripts/test.mjs apps/bench/test/retire.test.mjs`, exit 1 (`tests-first.txt`).
Two test-authoring mistakes were corrected before the implementation: table separation and importing loadRequirements from its actual public module.
The pre-code wrong implementation ran in a temp clone and failed every new case (`pre-code-red.txt` contains top-level failure excerpts).
A second source-mutation experiment over the completed implementation also failed all eight; assertions stayed unchanged:

| Row / must-meet | Wrong implementation in OS-temp clone | Red / green |
|---|---|---|
| R-3783 / M1 | Restore a study entry point | FAIL / PASS |
| R-3784 / M2 | globMatch always returns false | FAIL / PASS |
| R-3785 / M3 | callJudge throws before invoking the injected child | FAIL / PASS |
| R-3786 / M4 | Anatomy CLI exits 17 after its normal subcommand | FAIL / PASS |
| R-3787 / M5 | README advertises the retired runner | FAIL / PASS |
| R-3788 / M6 | Restore the old fixture-copy source | FAIL / PASS |
| R-3789 / M7 | Remove the relocated helper from page-shaping paths | FAIL / PASS |
| R-3790 / M8 | Change a study record in the clone, never this checkout | FAIL / PASS |

`node <temp-clone>/apps/bench/test/retire.test.mjs`: correct source exit 0 (`pairs-green.txt`), wrong source exit 1 (`pairs-red.txt`).
M2 uses the original glob function with the current repository inputs and both real report consumers;
deliverables serialization and the generated HTML are byte-equal. Issue reads are injected offline.
M4 runs all six CLI commands and compares stdout, stderr, status and written files with the existing library entry point on synthetic fixtures.
M3 runs the unchanged memory-shaping suite and the anatomy-labeller suite (only its import path changed).

### Existing test edits, and why each old assertion became false

- `apps/bench/test/anatomy.test.mjs`, `anatomy-labels.test.mjs`: only catch-stats import paths moved; all assertions stayed unchanged.
- `packages/nana-pack/tests/requirements-tree.test.mjs`: fixture module-copy list names glob-match; removed the unnecessary bench-copy folder. All assertions stayed unchanged.
- `packages/nana-pack/tests/requirements-regroup.test.mjs`: fixture-copy list names glob-match. All assertions stayed unchanged.
- `packages/nana-pack/tests/first-look.test.mjs`: sealed page-input list names the relocated helper.
- `packages/nana-pack/tests/code-map.test.mjs`: expects zero header exemptions, not three removed modules.
- `packages/nana-pack/tests/code-map-launch.test.mjs`: records named losses for precisely the retired source modules and relocated report edges; every other fixed-base edge remains checked.
- `packages/nana-pack/tests/readme-check.test.mjs`: no longer requires external install declarations for the removed extension.
- `packages/nana-pack/tests/test-runner.test.mjs`: replaces the deleted study prerequisite fixtures with a normal bench fixture and the live pgrep prerequisite; updates resulting tallies and recorded labels. Keeps both skip/run assertions.
- `packages/nana-pack/tests/test-runner-parallel.test.mjs`: replaces the deleted study skip with the live Windows-only precondition; keeps serial/parallel comparison assertions.
- `packages/nana-pack/tests/agent-dir-parity.test.mjs`: removes the obsolete pi-exports resolver exception.

No other existing test was deleted or edited.

## Checks

All following commands exited 0 after the fixes; full output is committed beside this report:

- `npm run map` — `map.txt`.
- `npm run map:check` — `map-check.txt`; 598 modules, zero header gaps or problems.
- `npm run req:tree` — `tree.txt`; includes the green deliverables report, without notes.
- `npm run readme:check` — `readme.txt`; zero problems.
- `node scripts/component-audit.mjs --check` — `component-audit.txt`; existing staleness and unclaimed coverage remain report-only. The relocated standalone glob helper is reported unclaimed, like other report support modules.
- `node scripts/requirements-trace.mjs` — `trace.txt`; zero status/form problems.
- `git diff --exit-code a562ff9a6a7eda7b06a75a5b58dac18bf977a25c -- apps/bench/studies` — exit 0.
- `git diff --check` — exit 0.

Path-filtered touched/dependency regression run, exit 0 (`touched-tests.txt`):

```text
node scripts/test.mjs apps/bench/test/ packages/nana-pack/tests/memory-shaping.test.mjs packages/nana-pack/tests/memory-replay.test.mjs packages/nana-pack/tests/outcome-meter.test.mjs packages/nana-pack/tests/claude-launch.test.mjs packages/nana-pack/tests/first-look.test.mjs packages/nana-pack/tests/requirements- packages/nana-pack/tests/requirement-rows.test.mjs packages/nana-pack/tests/code-map packages/nana-pack/tests/readme-check.test.mjs packages/nana-pack/tests/test-runner packages/nana-pack/tests/product- packages/nana-pack/tests/component-audit.test.mjs packages/nana-pack/tests/agent-dir-parity.test.mjs
28 files: 28 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 800 pass, 0 fail, 2 skip
```

The standalone `node scripts/test.mjs test-runner` also exited 0 after the test-file additions/deletions (`test-runner.txt`): two files, 64 passing checks.
The full suite belongs to CI under AGENTS.md; no local full-suite claim is made.
No lint/type scripts exist in root package.json. Map, README and targeted tests are the README checks applicable here.

## Removed-text pins

`removed-pins.txt` records the all-test scan for removed prose and paths.
The remaining references are the explicit historical edge-loss declarations in code-map-launch, plus the absence list and original-function lookup in the new retirement regression.
They explain removals rather than require the removed machinery. No stale execution or fixture-copy pin remains.
Frozen study fixtures were scanned but not changed.

## Known-bug closures

- The suite can no longer delete shipped code-bugfix evidence: its runner orchestration test and runner are removed.
- The absent-folder false pass no longer stands in for preservation: M8 compares every tracked study path with the fixed base.
- The catch-ledger reproduction test no longer rewrites a shipped study; the CLI and reproduction test are removed.
- The shipped-study diff exception no longer bypasses its listing assertion: that orchestration path is removed and M8 is independent of it.

No missing evidence was recreated or claimed restored. Known-bug files were not edited, as instructed.

## Not done

No push, CI read, GitHub operation, paid/model session, full local suite or native Windows run.
CI must supply native Windows and full-suite coverage after the seat pushes.
No reviewer was launched. No open owner question was discovered.
