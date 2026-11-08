# rules-lessons build record

VERDICT: PARTIAL

Branch: `feat/rules-lessons`. The final response identifies the full tip and the checks rerun on it.

## Commit parts

1. `b16cf595` — requirements first.
   - Files: `REQUIREMENTS.md`, `rows-tests.log` in this folder.
   - Rows: allocate R-3894–R-3904 in M-order; retire R-3012/R-3013; revise R-1140/R-2510.
   - New rows start planned. The retirement markers leave in part 2.
   - Command: `node scripts/test.mjs seat-rule.test.mjs planner-prompt.test.mjs worker-lane.test.mjs`, exit 0.
2. `cade2871` — ask-issue and notes removal.
   - Files: `AGENTS.md`, `templates/_shared/{working-under-nana-pi,HANDOFF}.md`, `packages/nana-pack/{prompts/builder-preamble,rules/nana-rulings}.md`, `packages/nana-setup/claude/rules/nana-seat.md`, generated `docs/code-map.md`.
   - Tests: `packages/nana-pack/tests/{planner-prompt,templates-render,worker-lane,land-clean-merge}.test.mjs`; `packages/nana-setup/tests/{seat-rule,rulings-install}.test.mjs`.
   - Rows: implement R-3894/R-3895/R-3899; record R-3896 as violated, not implemented.
   - Mutation pair: original ask bullets and original notes rules fail the new assertions; removal passes. The authorized M3 surfaces also fail before removal and pass afterward.
   - Commands: path-filtered runner over those six files, exit 1 before text edits; over those files plus `rulings.test.mjs`, exit 0 afterward. See `removal-{red,green}.log`.
   - `npm run map`: 0. Requirements trace: initially 1 for expanded dynamic evidence titles, then 0 after using the literal template title.
3. `ccde49aa` — builder lessons.
   - Files: `packages/nana-pack/prompts/builder-preamble.md`, `packages/nana-pack/tests/worker-lane.test.mjs`, `REQUIREMENTS.md`.
   - Rows: implement R-3897/R-3903; update R-2510's scope and evidence.
   - Mutation pair: the old preamble fails all four M4 cases, M10 and the revised R-2510 assertion; the new preamble passes.
   - Commands: `node scripts/test.mjs worker-lane.test.mjs --verbose`, exit 1 before text edits; `node scripts/test.mjs worker-lane.test.mjs templates-render.test.mjs --verbose`, exit 0 afterward. Requirements trace: 0.
4. The commit containing this record — seat checklist and red-main path.
   - Files: `packages/nana-setup/claude/rules/nana-seat.md`, `packages/nana-setup/tests/seat-rule.test.mjs`, `REQUIREMENTS.md`, generated `docs/requirements-tree.md`, evidence in this folder.
   - Rows: implement R-3898/R-3900/R-3901/R-3902/R-3904; revise R-1140's inventory evidence.
   - Mutation pairs: the guide without the checklist or fix path fails M5, M7, M8, M9 and M11; the new guide passes. Restoring an ask bullet in the source fails M1 and the M7 inventory. No assertion was inverted.
   - Commands: `node scripts/test.mjs seat-rule.test.mjs --verbose`, exit 1 before text edits, 0 afterward, 1 with the source mutation. The final seven-file run exits 0 after restoring the source.

## Existing test edits and retirements

- Retire only the two planner tests named by R-3012/R-3013.
- Update the existing seat inventory: remove its two ask entries, add one brief entry, pin 18 unique bullets, update its title and evidence.
- Re-anchor the existing parallel-build assertion between RULE_9 and retained RULE_10, rather than deleted RULE_11.
- Update the existing R-2510 assertion and title for the session-archives removal, then the narrow known-bug removal permission.
- Update the existing clean-merge M9 ruling literal to remove its notes sentence.
- All other additions are the brief's must-meet assertions. M4 has one assertion per lesson. No test file was added or deleted.
- `removed-text-test-search.log` records literal searches across every tracked test for each removed or changed rule line, sentence, path and file name.

## Precommit seat checks

| Command | Exit | Result |
| --- | --- | --- |
| `npm run map` | 0 | map generated |
| `npm run map:check` | 0 | 523 modules, 0 problems |
| `npm run req:tree` | 0 | 2685 rows, 43 features, 0 problems |
| `npm run readme:check` | 0 | README checks pass |
| `node scripts/component-audit.mjs --check` | 1 | drafting-table and workshop cite FEAT-006, which now has violated R-3896 |
| `node scripts/requirements-trace.mjs` | 0 | 0 rows off EARS form |
| path-filtered touched tests | 0 | 7 files; 333 pass, 0 fail, 0 skip, 0 warn |
| `npm run template:accept` | 0 | rendered native toolchains pass |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | all 13 checks pass |
| `git diff --check` | 0 | no whitespace errors |

Path-filtered command:

```sh
node scripts/test.mjs seat-rule.test.mjs planner-prompt.test.mjs templates-render.test.mjs rulings-install.test.mjs worker-lane.test.mjs land-clean-merge.test.mjs rulings.test.mjs
```

These checks are rerun after the final commit. The final response reports their results on that tip.
No full suite ran: `AGENTS.md` explicitly assigns it to CI. No push or CI read occurred.
No `test-runner` check is required: no test file was added or deleted.

## Writing and precedent

- Run `nana-writing` on every edited rule surface: `AGENTS.md`, both shared files, the builder preamble, seat guide and rulings. All invocations exit 0, as this checker is report-only.
- New builder and checklist sentences have no writing findings and each stays under 25 words.
- Existing long sentences remain outside the requested edits. The retained post-land prohibition retains its passive wording, as the plan explicitly requests.
- Follow the seat inventory and worker preamble literal-pinning patterns. Reuse existing `markerBlock`, `render`, `freshRoots`, `ruleSource` and public `buildBlock`; no helper was copied or moved.
- Keep red-main guidance in its existing paragraph, beside `--post`, rather than adding a second new bullet and breaking M7's inventory.
- No function return or exception contract changed; no callers needed updates.

## Known-bug closures touched

The whole `docs/known-bugs/FEAT-006.md` was read. No known-bug file was edited.

- Planner questions, clarify-questions final review: remove the plan-question posting rule that contradicted HANDOFF-dependent carry.
- Planner questions, clarify-questions final review: retire R-3012/R-3013's misplaced seat-guide tests from the planner test file; pin the replacement in the seat test.

## Not done / open scope conflict

M3 is incomplete. The live `HANDOFF.md` still contains its narrative sentence. The builder's governing scope says never to edit that file, even though A4/M3 request the edit. Its seed, AGENTS narrative wording and preamble session-archives wording were changed. A partial M3 assertion covers only those authorized surfaces and intentionally carries no implemented-row marker. `m3-scope-residual.log` records the full M3 residual check, exit 1.

R-3896 remains violated, with its reason in the row. This makes the component audit fail; no component status was weakened to hide it. The seat needs authority to remove the live HANDOFF sentence, finish the M3 test and change the row's status. No other known bugs were fixed. No GitHub issue, session archive, stored credential, real model run or subagent was used.
