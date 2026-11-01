# Builder anatomy — build 1 technical record

Verdict: implementation and synthetic checks complete; tip checks and hosted CI are reported in the builder's final report.
No real session was read. No model or subagent was started. The tool spends nothing.

## Scope and requirements

Added FEAT-042 under CAP-08, deliverable R-3270, artifact A-092 and its code reader.
Added R-3270 through R-3278 as planned before tests, then marked each implemented only after its test passed.
Each Evidence cell is backticked. No FEAT-041 IDs were used. Existing requirement sentences were not changed.

| Row | New test in apps/bench/test/anatomy.test.mjs | Red → green pair |
|---|---|---|
| R-3270 | pushed parts and recorded attempts preserve committed context | empty extraction → recorded/committed extraction |
| R-3271 | configured labels and fence-aware spans tile exact input | empty spans → lossless spans/config rules |
| R-3272 | counts shares oversize duplicates sizes and zero supply | empty report → count report |
| R-3273 | all writers refuse unsafe output and all printers keep text private | unconditional success → guarded writers/count printers |
| R-3274 | assembly uses spans and preserves whole cut and staged text | empty parts → span transformations |
| R-3275 | wrapped and dedicated pulls count exact calls chars and functions | no pulls → shell/dedicated extraction |
| R-3276 | blinded seeded sample and three-pair agreement reject unequal ids | empty sample/agreement → imported statistical helpers |
| R-3277 | one complete count row per build sums attempt usage | empty extraction/report → canonical attempt usage/build rows |
| R-3278 | seal oversize threshold is 3000 UTF-16 chars | code value 2999 → code value 3000 |

All nine tests ran against the obvious wrong implementation before production code existed: exit 1, 0/9 passed.
The assertions were not inverted. `wrong-code.txt` records the nine failures; `synthetic-checks.txt` records 9/9 passed.
This was wrong-code-first, not a separate post-implementation mutation campaign.
The harness awaits every case with a 30-second limit; git fixture children also have that limit.
Fixtures cover CRLF, trailing spaces/tabs and no final newline. They live in OS temp, never the checkout.
The production extractor uses the imported torn-line reader. The fixture reader was corrected to use that same public reader.
The fixture timestamp was corrected to pi's existing Z-suffixed filename format so the canonical usage reader could match it.

## Files

- `REQUIREMENTS.md`: feature, nine rows, CAP-08 deliverable/maker/reader, A-092.
- `apps/bench/anatomy.mjs`: thin executable entry.
- `apps/bench/lib/anatomy.mjs`: five commands, private output policy, fixed error diagnostics.
- `apps/bench/lib/anatomy-config.mjs`: all named policy and provenance.
- `apps/bench/lib/anatomy-sessions.mjs`: pi sessions, recorded attempt grouping, committed brief recovery, pushed parts and exclusions.
- `apps/bench/lib/anatomy-spans.mjs`: lossless fence-aware Markdown spans and rule tiers.
- `apps/bench/lib/anatomy-pulls.mjs`: wrapped shell and dedicated reads with target/function mapping.
- `apps/bench/lib/anatomy-measures.mjs`: shares, gaps, repeats, blinded sampling, agreement and assembly.
- `apps/bench/test/anatomy.test.mjs`: only new test file; exactly eight must-meet cases and one seal.
- `apps/bench/README.md`: dependencies, five working commands, private formats, limitations and tests.
- `docs/code-map.md`, `docs/requirements-tree.md`: regenerated.
- `packages/nana-pack/tests/requirements-tree.test.mjs`: two existing assertions changed, no test added or removed.
- This review folder: wrong-code, synthetic CLI, targeted/full-suite and tip-check evidence.

### Existing-test edits

Adding FEAT-042 raises the real heading count from 71 to 72. Two assertions hardcoded that old count:
`R-288: all real headings have non-empty purposes` and
`R-1158: a CRLF ledger gives the same problems and line numbers as its LF copy`.
Only those two literals changed. Their rows and test titles remain unchanged.
The first full suite exposed both failures, plus the source checker rejecting a direct temporary-directory allocation in the new test.
The new test now imports the bench's `tmpDir` helper; the source checker was not changed.

## Values and provenance

All policy definitions are in `apps/bench/lib/anatomy-config.mjs`; no retune requires changing the implementation.

| Names / values | Provenance |
|---|---|
| `OVERSIZE_UNIT_CHARS = 3000` | Sealed R-3278, plan A4: above the 2,000-char knowledge block, below the observed 5.7k/20k units. Chosen, not measured here. |
| `DEFINITIONS`, `FUNCTIONS` | Owner's ten-function hypothesis, 2026-11-01. Config contains all ten meanings. |
| `PART_RULES`, `HEADING_RULES`, `RULES`, `UNSORTED_REASON = no-rule` | Chosen O2 after reading the seat's fifteen units. Part → heading → lead → keyword; first match wins; unmatched prose remains unsorted. |
| `PART_SPLITTERS` | Contract A3/revision M2: skills and toolsAdded stay opaque; other parts use paragraphs, list items and table rows. |
| `SESSION_PREFIX = pi-worker`, `KNOWN_BUG_HEADER` | Contract T1: builder name prefix and fence-independent appended known-bug header matcher. |
| `CONTEXT_FILE = contexts.jsonl` | A-092 artifact contract. |
| `SHEET_FILE = sheet.jsonl`, `MANIFEST_FILE = parts.json`, `STAGED_FILE = staged.txt` | Chosen O3: JSONL sheet/store and numbered replay files with a manifest. |
| `NORMALIZATION`, `NORMAL_TOKENS` | A7: replace cwd/worktree and feat/lane branch with fixed tokens; strip list markers/emphasis and collapse whitespace. Branch form follows pi-worker's enforced feat/lane contract. |
| `READER_VERBS`, `DEDICATED_READERS`, `SHELL_SPLITTERS` | T6/M1: read/grep/find/ls; named shell readers including git show/diff/log -p; quote-aware &&, semicolon and pipe boundaries with bash/sh -lc/-c body recursion. |
| `TARGET_RULES`, `CLASS_FUNCTION` | Chosen O4: precedent→precedent, known-bugs→lessons, tests→output contract, brief→task, docs/source/outside→knowledge, discovery→tools, unclassified-bash→unsorted. |
| shell result char allocation | Chosen T6: equal integer partition across counted segments, remainder on the last. Avoids multiplying one result's chars by the number of pipe segments; segment attribution is approximate. |
| `SHARE_DIGITS = 2`, `SIZE_QUANTILE = 0.9` | Chosen O3 readable percentages; contract T3 nearest-rank p90. Counts remain exact. |
| `STAGE_POINTER` | Chosen O3/T5: fixed line pointing to staged.txt, with no private heading or unit text. Config holds the exact line. |
| `SAMPLE_SIZE = 150`, `SAMPLE_MIN_FUNCTION = 2`, `SAMPLE_MIN_TIER = 1`, `RULE_TIERS` | Chosen T7/N4: small manual batch, per-function/per-tier minima first, remaining draws round-robin by tier through imported seededSample. Minima can exceed requested n. |
| `KAPPA_MIN_COUNT = 10` | Chosen T7/N4: per-function binary kappa reported for functions with at least ten labels in either rater's vector. |
| `REPORT_PARTS` | Chosen O3: known source names print; extra section names aggregate under extra-section. Headings never print. |
| `GIT_LIMIT_MS = 60000`, `GIT_MAX_BUFFER = 64 MiB` | Chosen local read bounds for committed brief history, not model spend. |
| `MILLISECONDS_PER_MINUTE = 60000` | Unit conversion contract; wall minutes retain fractional values. |
| test limit 30000 ms | Chosen test harness bound, matching the bounded-child precedent. Not a production tunable. |

## Precedent and departures

Read every named precedent before writing rules or implementation, including the additional plan precedents and study design/config.

- Followed catch-ledger's hand-run subcommands and structural skip/exclusion accounting; no model labeller or live integration.
- Imported `cohensKappa` and `seededSample` unchanged from `catch-stats.mjs`.
- Imported `entriesIn`, `textFrom`, `privateFolder` and `transcriptFiles` from `claude-transcript.mjs`.
  **Departure from the plan's proposed direct folder walk:** `transcriptFiles` fits pi's project-folder layout when passed an explicit accept-all selector.
  It therefore includes worktree sessions; a small flat-root fallback also supports explicit flat session roots. The build brief explicitly permits this import.
- Followed memory-shaping's injected `run…(argv, {stdout, stderr})`, guarded maker folder and counts-only boundary.
- Imported build ledger paths/readers and `collectBuildUsage`; imported `totalTokens`, never re-derived usage totals.
- Imported land ledger paths/readers for lane land status instead of copying ledger parsing.
- Imported `readBrief` for precedent pull targets.
- Followed markdown-list-sections' fence marker character/length tracking. Its section/list return type cannot tile byte-exact spans, so a separate lossless scanner is needed.
- Followed config-with-provenance and one literal seal assertion. The catch-judge nested norm was not moved or copied; A7's configured multi-step normalization is not that whitespace-only helper.
- Followed the bench test form and its imported temporary-directory helper. **Departure from the forecast of no existing-test edits:** the two stale heading-count assertions above must change when adding a feature.
- **Definition clarification:** the seat's hand-labelled completion sentence is `feedback`, even though the broad definition table also mentions completion under output contract. The explicit fixture wins. Config calls out that choice.
- JSON counts-only reports and JSONL/private replay formats are O3 choices, not departures.
- **Windows correction to literal blob matching:** git may normalize a committed CRLF brief to LF while pi receives CRLF from the worktree. Matching now tries only the original/LF/CRLF/CR line-ending representations, preserves all other whitespace, keeps the committed blob identity, and tiles the exact received text. This departs from byte-verbatim blob matching to meet the plan's honest CRLF threat model; no prompt bytes are normalized in storage or assembly.

No private helper was moved. No existing test was deleted. No known-bug entry was touched; no FEAT-042 known-bug file exists.

## Commands and exits

Long output is committed beside this record; only summary lines belong in the final report.

| Command | Exit / evidence |
|---|---|
| `node apps/bench/test/anatomy.test.mjs` against wrong code | 1; `wrong-code.txt`, 0/9 |
| `node apps/bench/test/anatomy.test.mjs` after implementation | 0; `synthetic-checks.txt`, 9/9 |
| standalone synthetic CLI, all five subcommands plus drop/stage | 0 for every invocation; `synthetic-cli.txt`, counts only |
| `npm test -- packages/nana-pack/tests/requirements-tree.test.mjs packages/nana-pack/tests/test-runner.test.mjs` | 0; `targeted-checks.txt` |
| first `npm run map:measure` | 1; `full-suite-first.txt`; 8835 pass, 3 fail, 44 skip |
| second `npm run map:measure` | 0; `full-suite.txt`; locked full suite in foreground, coverage/runtime map regenerated in the clone-shared git store |
| final `npm run test:locked` | 0; `full-suite-final.txt`; foreground recheck after removing local-path interpreter warnings from the committed tip-check log |
| `npm run map`, `node scripts/requirements-tree.mjs --write` | 0 each; generated tracked maps |
| `npm run map:check`, `npm run readme:check`, requirements trace, tree, known-bugs, identity scan | Tip results recorded separately in `tip-checks.txt` and rerun on the commit |

Final merged full-suite summary: `248 files: 246 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8849 pass, 0 fail, 44 skip`.
Before the prerequisite merge, the green suites had 247 files and 8838 passing checks.

An early readme check found two output filenames interpreted as tracked paths and one layout phrase interpreted as a path; prose was corrected, not the checker.
An early known-bugs invocation omitted `--root .` and exited 2; the corrected check exited 0.
The first post-commit identity scan detected four local-path identifiers echoed by Node warnings in tip-checks.txt.
Those warning lines were removed before any push, and the unpushed build commit was amended; no such path is in the published build history.
The counts-only command results were retained. The identity check was rerun on the amended tip.

## Hosted CI correction (same build, second implementation commit)

Finished run 41266548069 on the first implementation tip: macOS/Linux suites and all four install-check jobs passed; Windows failed only R-3270.
The exact assertion was the committed brief identity. This was not the known R-3104 timeout and was not rerun as a flake.
The synthetic fixture now sets core.autocrlf=true before committing its CRLF brief on every OS.
Against the unchanged extractor it failed R-3270 locally with the same assertion; `windows-wrong-code.txt` records exit 1 and 8/9 passed.
After the line-ending representation fix, the same nine tests passed, exit 0; `synthetic-checks.txt` was refreshed.
This edits one fixture setup line within the existing R-3270 test, not its assertion or title. No new test was added.
The README now states this matching behavior. The new tip's full locked suite is recorded in `full-suite-windows-fix.txt`.
The correction's `npm run map:measure` exited 0: 247 files, 245 PASS, 0 FAIL, 2 SKIP; 8838 checks passed, 44 skipped.
Its finished hosted CI result is reported separately after the push.

## Not done / seat work

The seat's real-session segmentation, 90% recorded-build matching gate, independent labelling, reliability marks and anatomy-counts report are intentionally not run here.
Those need private owner text and are assigned to the seat after build 1. No empirical reliability claim is made from synthetic labels.
No causal replay, paid study, launcher change, model labeller, install check or reviewer session was run.
FEAT-041 landed at 8c665dcd while this build's first hosted CI was running.
The branch now merges that main tip before its final review. The sole textual merge conflict was the generated code map; it was regenerated.
The merged ledger has 73 headings, so the same two existing tree-test assertions advance from 72 to 73.
Requirements and the outline merged without a textual conflict; the outline was regenerated as well.
Protected handoff, known-bug and archive files came only from the already-landed main history; none received a direct builder edit.
The first post-fix push had no CI run because the conflicted PR could not form its test merge; the main merge resolves that condition.
`merge-targeted.txt` records the targeted tests at exit 0. The merged locked `npm run map:measure` exited 0; its output is in `full-suite-merge.txt`.
The merge commit stages only the named manual resolutions and this lane's evidence; all other staged files are git's automatic main merge.
A final reviewer and land are seat operations. Hosted CI and the draft PR are reported on the new tip, not committed through a self-referential follow-up.
