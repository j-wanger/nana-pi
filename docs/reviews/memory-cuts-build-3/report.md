# Memory-cuts build 3

## Closure

Removed M5's five whole-repository checker subprocesses and unused spawn import. Kept every other assertion: a nonempty checked-deliverables set, retirement of A-044/A-095/A-097, and no deliverable check notes. Narrowed R-3864 and renamed its existing tagged test to describe exactly those assertions. No new tests or requirement IDs; no production behavior changes.

Files: REQUIREMENTS.md, packages/nana-pack/tests/memory-cut-checks.test.mjs, generated docs/code-map.md, and this evidence directory. The requirements tree regeneration produced no diff.

## Wrong-code pair

After narrowing the row and test, temporarily changed scripts/deliverables.mjs to exclude A-044 from retired artifact recognition. The narrowed test failed with `false !== true`, naming A-044 (exit 1, M5-wrong.log). Restored the production code exactly; the touched runner passed one check (exit 0, M5-green.log). No assertion was inverted and no mutation remains.

## Other new test files

spawn-scan.log records the grep of all six lane-added test files. No other sub-60-second whole-repository checker spawn exists. Remaining bounded children are git inventory, explicit knowledge CLI build/query against a temporary index, copier against temporary projects, and the retired hook's no-op check. The offline turn uses 60 seconds. None requires removing a duplicate checker loop. No model sessions were launched during this fix.

## Validation before commit

All commands exited 0 unless noted:

- `node packages/nana-pack/tests/memory-cut-checks.test.mjs` with wrong production code: 1.
- `node scripts/test.mjs memory-cut-checks.test`: 0; 1 file PASS, 1 check pass.
- `node scripts/code-map.mjs --write`: 0.
- `npm run map:check`: 0.
- `npm run req:tree`: 0.
- `npm run readme:check`: 0.
- `node scripts/requirements-trace.mjs`: 0.
- Spawn grep: 0.

Logs sit beside this report. Absolute home paths were normalized before committing.

## Boundaries

CI covers the full suite per AGENTS.md; no local full suite, push, or CI read. No setup/hook changes in this fix, so no install check. No listed FEAT-043 known bug was touched. No Precedent section was supplied for this fix card; existing parser, deliverable report and bounded awaited harness remain imported unchanged. No helper, tunable, function return, or caller contract changed. No open questions.

The builder reruns all five named seat checks on the committed tip and reports their results separately.
