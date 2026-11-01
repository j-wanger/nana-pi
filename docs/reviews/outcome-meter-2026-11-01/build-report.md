# Outcome meter — build 2 technical record

Build session 2, branch `feat/outcome-meter`, based on `8c665dcd`. No real transcript, home snapshot, real context log, owner record or model was read or called. All run counts in this folder are synthetic or repository-test counts.

## Changes and rows

- Measurement: `packages/nana-pack/lib/outcome-meter.mjs`, `outcome-meter-config.mjs`, `scripts/outcome-meter.mjs`, and the new `packages/nana-pack/tests/outcome-meter.test.mjs`. R-3310–R-3316 implement the interaction, scope, prompting, full-lookback judge, spend, context and privacy contracts. R-3318–R-3336 seal the runner, limits, statistical choices, prompt hash and output vocabulary. One private item/window JSONL file implements the plan's O3 choice.
- Accuracy and noise comparison: `packages/nana-pack/lib/outcome-score.mjs`, `scripts/outcome-score.mjs`, `scripts/outcome-compare.mjs`. R-3317 implements validity-corrected baseline accuracy and owner-turn repeat-set agreement. The scorer and comparison share one module, the plan's O4 choice.
- Authorized helpers: `scripts/memory-shape-runners.mjs` accepts explicit Claude options and rejects those options with pi. `packages/nana-pack/lib/memory-making.mjs` adds the optional once-per-entry observer; `unitsIn` remains private, leaving the parallel lane's export simple. No existing maker or shaper test was changed.
- Consumer surfaces: `package.json`, both READMEs, `REQUIREMENTS.md`, `docs/requirements-tree.md`, and `docs/code-map.md`. FEAT-043 sits under CAP-01 after FEAT-040. All 27 new rows are implemented with backticked test evidence. A-095 has a code reader; the feature reads A-088, A-089 and A-091. The A-089 park line was removed because the meter is its reader.

## Wrong code → correct code

All assertions stayed in their intended direction; mutations changed code, never assertions.

| Rows | Wrong implementation / mutation | Wrong command result | Correct result |
|---|---|---|---|
| R-3310–R-3317 | Empty measurement rows/lines, successful no-op command boundaries and a nonworking runner | `node packages/nana-pack/tests/outcome-meter.test.mjs`: exit 1; all eight contract cases failed (`wrong-first.txt`) | Same command: exit 0; all eight cases pass |
| R-3318–R-3336 | Changed each frozen value in the config, including the output filename and prompt | `node packages/nana-pack/tests/outcome-meter.test.mjs 'seal:'`: exit 1; all nineteen seals failed (`wrong-seals.txt`) | Same command: exit 0; nineteen seals pass |
| R-3313 | Input lacking per-item permitted earlier-id lists, which would invite self/future matches inside a chunk | `node packages/nana-pack/tests/outcome-meter.test.mjs 'judge sees'`: exit 1 (`wrong-item-scope.txt`) | Exit 0 with complete lookback plus per-item id lists |
| R-3335 | Previous prompt lacking the per-item scope instruction | `node packages/nana-pack/tests/outcome-meter.test.mjs 'system prompt hash'`: exit 1 (`wrong-prompt.txt`) | Exit 0 with final SHA-256 `b522dbca4d472999b811304a5a8c1fa166f835e756c328c7b4c196dca048712a` |

An injected-spawn probe temporarily selected pi in the shaper config and still observed exactly one Claude spawn from the meter, exit 0 (`runner-independence.txt`). The shaper config was restored byte-for-byte. No model ran. `createRunner()` default options and every forbidden pi override are also pinned in R-3316.

## Tests and commands

Each new async case is awaited under its own deadline. Fixtures use the shared temp-directory helper and synthetic text only. Line readers see CRLF, trailing spaces/tabs and no-final-newline inputs. The new module has exactly eight must-meets and nineteen seal tests; no other new test was added.

- `npm test -- outcome-meter memory-making memory-shaping requirements-tree.test test-runner.test`: exit 0; **5 files: 5 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 221 pass, 0 fail, 0 skip** (`focused-tests.txt`). The unchanged maker and shaper suites contribute 24 and 20 checks.
- First foreground `npm run test:locked`: exit 1, three checks failed (`full-suite-first.txt`). Two tree assertions expected the old heading count. The third required fixtures to use the shared temp helper.
- Final foreground `npm run test:locked`: exit 0, one machine-wide lock, **248 files: 246 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8867 pass, 0 fail, 44 skip** (`full-suite.txt`).
- `npm run map`, `npm run req:tree`, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --root .`, `node scripts/known-bugs.mjs --root .`, `node scripts/identity-scan.mjs --root .`: each exit 0. Corresponding `*-check.txt` files hold their output. Before commit, tree/deliverable notes correctly say the new reader paths are not yet tracked at HEAD; the final-tip checks are rerun after commit.
- `node scripts/lane-class.mjs --root . --files <changed code and contract paths>`: exit 0, `ordinary` (`lane-class.txt`).
- Each of `npm --silent run memory:meter`, `memory:meter-score`, `memory:meter-compare` ran on explicit OS-temp synthetic inputs, exit 0 each. The meter needed zero calls, zero tokens and zero cost. Counts-only output is `synthetic-commands.txt`; the demonstration's exact pair was parallel, not a repeat. Initial invocations without npm's silent flag also exited 0; the retained output removes npm's path-bearing prelude by using a fresh silent run.
- Map impact was read before helper changes; the additional existing test's impact is retained in `tree-test-impact.txt`.

## Existing tests edited

Only `packages/nana-pack/tests/requirements-tree.test.mjs` changed: the R-288 real-heading assertion and the R-1158 real-ledger CRLF assertion now expect 73 headings instead of 72. Adding FEAT-043 made both old assertions false. No assertion or test was deleted. The test-runner test itself stayed unchanged; the new fixture was corrected to import `tmpDir`.

## Precedent and interpretation notes

Every named precedent was read in full before design. The meter imports the shared transcript unit walk, private-folder policy, argument/repository helpers, candidate vocabulary, prompting pattern, usage accounting, context-log filename, active agent directory and ledger reader. It follows the shaper's call-local, fail-closed accounting and exclusive-output pattern; the scorer's private boundaries; and the catch judge's equivalence and per-row id-list pattern. Pack code imports no app. Reply validation and score-file validation are new because their schemas differ from the private precedent validators.

Authorized departures from the plan's original unchanged-import forecast are only the two helper changes in build brief 2. The observer makes direct imports of `streamEntriesIn` and `edtDay` unnecessary: the unit walk already uses both. `resolveEvidence` is imported in the prompting fixture, not called by the meter, because re-resolving each pointer would violate the one-pass rule. Unknown load-log role, launcher and part names get separate numbered aliases, preserving grouping without sending arbitrary log strings to stdout; known names are sealed with the output vocabulary.

The implementation follows the formal consecutive-W-window rule. The plan's field-sizing paragraph instead assumes a B-sized warm-up prefix when claiming B + 2W interactions yield two closed baseline windows. Those are inconsistent: consecutive W-sized windows require three complete windows to include two non-warm-up windows. No real-data count was computed here. The seat should use the formal rule when interpreting its private baseline, or resolve that sizing sentence before changing the contract.

## Closures and remaining work

Closed: the build-1 helper blocker, all eight meter must-meets, nineteen seals, the two newly stale tree-count assertions, and the new fixture's temp-helper violation. No known-bug entry was edited or fixed; no findings-count or replay code was built.

The seat still owns the real-run canary, prompt/value freeze in `sealed.txt`, private baseline, labels, owner check and four-run noise comparison. No session or subagent was started. No GitHub issue was changed. Hosted CI and the final-tip seat checks are reported after push in the worker's final report, including the Windows suite leg. The draft PR is opened from this build because build 1 left no PR.
