# Memory-cuts build record

Feature: FEAT-043 · Measure memory outcomes
Branch: `feat/memory-cuts`. Base: `42bf0800`.

The final response supplies the full committed tip and the checks rerun on it.
No push, CI read, model call, owner-memory read or GitHub operation occurred.
Offline faux-provider turns, the required install-check review/build fixtures and synthetic tests made no real model calls.

## Commits and scope

| Part | Commit | Files and rows | Proof / commands |
|---|---|---|---|
| 1. Requirements | `43bd007d` | `REQUIREMENTS.md`: declare R-3860–R-3867 in M-order, planned before tests/code | `node scripts/requirements-trace.mjs`, `node scripts/test.mjs requirements-trace`: exit 0 |
| 2. Knowledge pull | `9904272a` | Root and knowledge manifests/READMEs; delete knowledge extension and its test; runner registration, template runtime inventory, map and ledger. Retire R-233, R-234, R-895, R-896, R-1712. R-227 keeps its surviving hook-library evidence. | M1 wrong producer: exit 1; cut producer: exit 0. Knowledge and template tests, trace, README, map, runner: exit 0. |
| 3. Memory triggers | `656d91e2` | `packages/nana-pack/bin/nana-land.mjs`, its memory-run test; setup settings, steps, doctor, retired links, uninstall, state manifest, install-check/config; two replacement setup test files; setup/pack READMEs and false setup fixtures/counts. Retire R-3297, R-3350–R-3353, R-3355, R-3358–R-3360. Narrow R-1073, R-1791, R-3743 and the active-hook count in R-1055. | Old land/session wiring and old knowledge judgment: M2/M3/M6/M7 exit 1. New behavior: exit 0. All affected land/memory tests passed. Setup tests passed after selecting the supported installed npm prefix and correcting stale fixtures. Runner, trace, map, README: exit 0. |
| 4. Finished instruments | `ee401fc8` | Delete the 22 experiment modules/adapters/tests listed in `retirements.md`; update root/pack READMEs, manifest, component registry, map config and generated outputs. Move surviving anatomy readers, title prefix and runner assertions. Mixed test changes listed below. Retire 69 experiment rows, A-044, A-095 and A-097. | M4 with old npm commands: exit 1; removal: exit 0. Touched memory/anatomy/process/launch/runtime tests, runner, tree, trace, README, map and component audit: exit 0. |
| 5. Guidance and complete proofs | This report's commit | `AGENTS.md`, shared working guidance, root/setup README, ledger/artifact claims, map/outline; M5/M8 tests; template and front-door assertions; named code-map history losses. Preserve custom Claude-home retirement through settings/steps and M3/M6 fixtures. Remove the retired hook's unused stdin deadline. Make the new offline-turn launch portable through existing pi-invocation/findPi helpers. | M5 with stale map and M8 with old rendered guidance: exit 1. Both after update: exit 0. Custom-home ownership regression: exit 1, then exit 0. Pre-commit map/check, tree, trace, README, audit, repaired tests and macOS install-check: exit 0. Native template acceptance and 173 template checks passed on a temporary committed copy of the exact working sources before this commit. |

Exact retirement IDs, every deleted file and removed tagged/unmarked declaration are in `retirements.md`.
Long command output, including failed baselines and subsequent green runs, is in `check-output.md`.
Every remaining test was searched for each removed path/basename and removed prose sentence; `reference-scan.md` records 275 test sources, 27 paths, 300 sentences and zero sentence matches.
The launch-map history-loss table deliberately retains the old extension-test basename. Knowledge CLI tests share the deleted extension's basename. Retirement tests deliberately name the retired session-end hook. None imports a deleted module.

## Must-meets and wrong-code pairs

| Must-meet | Row and test | Wrong implementation → observed failure | Correct implementation → observed result |
|---|---|---|---|
| M1 | R-3860, `packages/nana-knowledge/tests/pull-cut.test.mjs` | Registered original pointer producer → knowledge producer assertion fails | No registered knowledge producer; same exact query pointer bytes → pass |
| M2 | R-3861, `packages/nana-pack/tests/memory-run.test.mjs` | Original post-land callback → nonzero starter-call count | Real fixture lands, no callback or memory line, explicit manual make still classifies/stores → pass |
| M3 | R-3862, `packages/nana-setup/tests/memory-pause.test.mjs` | Original hook wiring → no retired-hook doctor failure | Doctor names hook and install remedy; install removes released shell/exec entries and dangling managed link; active check table has no memory leg → pass |
| M4 | R-3863, `packages/nana-pack/tests/experiment-cut.test.mjs` | Old npm commands/modules → command-presence assertion fails | No removed command/module/live reference outside history/retired declarations → pass |
| M5 | R-3864, `packages/nana-pack/tests/memory-cut-checks.test.mjs` | Unregenerated map → actual map checker fails | Actual map, README, tree, trace and audit commands plus deliverableReport all pass; no deliverable notes → pass |
| M6 | R-3865, `packages/nana-setup/tests/memory-pause.test.mjs` | Original uninstall leaves exec memory entry → settings comparison fails | Direct pre-cut uninstall removes both released forms and dangling managed link, preserves foreign hook → pass |
| M7 | R-3866, `packages/nana-setup/tests/pull-cut-turn.test.mjs` | Old judge requires a knowledge message → missing-knowledge | Real offline turn has no knowledge message and passes; independently missing rulings, seat guide, writing and gate evidence give their own failures → pass |
| M8 | R-3867, `packages/nana-pack/tests/memory-cut-guidance.test.mjs` | Original scaffold includes automatic extension cell → exact search-cell comparison fails | Both languages, scaffold/adopt, and existing-project managed-region refresh teach explicit search; unrelated runtime cells retain their fixed hash and unmanaged bytes remain exact → pass |

These pairs change or remove implementation, registration or generated artifacts; no assertion was inverted.
M3/M6 additionally failed on the custom-home variant before ownership received the selected hooks directory, then passed after the fix.
New line-walking proofs cover CRLF, trailing spaces/tabs and no final newline. The moved anatomy corrections reader retains its existing CRLF/trailing-whitespace/no-final-newline fixture.
Every new case uses the existing awaited, per-case-limited check harness. Child commands have their own limits. Fixtures stay in OS temp.

## Existing test edits and preserved assertions

- `templates-render.test.mjs`: remove the deleted extension directory from runtime inventory; change only the knowledge header/cells in the exact runtime-table oracle.
- `memory-run.test.mjs`: replace only the retired land-trigger case with M2; keep starter guards/spawn assertions and add explicit manual make to the same case. Other library cases remain unchanged.
- `seat-pull-off.test.mjs`: active hooks become five; the install-check knowledge case no longer expects missing-knowledge. Explicit query, foreign-entry preservation and retired Claude knowledge ownership cases remain.
- `install-check.test.mjs`: active hook table loses the memory row; hook dispatch count becomes six including verifier hit/miss; remove only the two knowledge-message rejection inputs and rename their mixed case. All other judges remain.
- `pi-launch-limits.test.mjs`: the fallback launch count becomes four because knowledge no longer needs extension registration; preserve command, argv and timeout assertions.
- `settings-merge.test.mjs`: change only five-hook counts, their titles and the independent POSIX fixture's retired memory row.
- `uninstall.test.mjs`: dry-run inventory names the retired hook instead of an active installed hook.
- `win32-degrade.test.mjs`: discovered active hook-file count becomes five.
- `win32-hook-repair.test.mjs`: remove the retired memory sample/path from active dead-entry repair; retain all other hook repair/foreign-entry assertions; describe five active settings rows.
- `memory-making.test.mjs`: remove only the scorer case R-3195 and its import.
- `memory-shaping.test.mjs`: replace calls to the deleted scorer with exact independent evidence/kind pair assertions; move the surviving default Claude-runner checks from the meter case with R-3316.
- `anatomy-seat.test.mjs`: move the surviving recorded memory-slot marker seal with R-3385; other cases stay unchanged.
- `context-anatomy.test.mjs`: remove only the meter integration case carrying R-3729/R-3315/R-3336. The separate R-3729 real review-load case remains.
- `process-tree.test.mjs`: remove only duplicate-scan fixtures/R-2661 and the exception-list part of the mixed seal. Preserve R-2656/R-2657 runtime/default-signal assertions.
- `linked-launch.test.mjs`: remove only the retired rows-command case R-1632 and its header input.
- `runtime-map.test.mjs`: replace the deleted impact-page test path with surviving code-search as its unchanged-test fixture.
- `writing-rule.test.mjs`: move RULE_TITLE to its sole surviving reader; keep the same rule-content assertion.
- `readme-check.test.mjs`: replace retired hook-trigger words with explicit search and both runtime names; keep every extension-function assertion.
- `code-map-launch.test.mjs`: add named retirement reasons for fixed-base losses, including the removed duplicate-scan fixtures; keep the edge-preservation assertion.

No unrelated test was deleted. No new sealed behavior value was introduced. The recorded-slot constants and their seal moved together without retuning.

## Precedent and departures

All six brief precedent files were read before design, together with the complete lane plan and bench-retire plan.

- Followed bench retirement: `git rm -q --`, stable retired IDs, artifact maker/reader updates, preserved historical records and removal-only test authority.
- Followed seat-pull-off: recognize complete released shell/exec objects, preserve foreign entries/groups, diagnose remaining wiring with the install remedy, and preserve direct uninstall.
- O1 chooses deletion over a no-op extension: an empty knowledge extension manifest leaves no stale runtime producer in the reader graph.
- Retained the legacy knowledge hook CLI and its libraries/tests unwired. The plan cuts automatic delivery; deleting its independent manual compatibility surface was unnecessary for M1 and would widen the change. Index/build/status/query and the safe renderer are unchanged.
- The inventory missed two live anatomy dependencies. Move the corrections-file reader into its surviving reader (`anatomy-slots.mjs`) and recorded-slot configuration into its sole surviving runtime reader (`anatomy-seat.mjs`). No new shared module or private cross-module import was introduced. This reader-local configuration departure avoids an unbriefed shared-module move and preserves historical transcript interpretation.
- RULE_TITLE moves into the surviving writing-rule test, its only remaining reader, rather than creating a module for one constant.
- `retired.mjs` lists the retired hook file and exports one link-ownership predicate, imported by steps and uninstall. Settings ownership stays beside the existing retired knowledge ownership logic. This separates settings entries from filesystem provenance.
- Root README and some package documentation changed in the removal commits, not only part 5, so every stop left README path checks green.
- Template tests need a committed copier source. Pre-commit proof used a disposable committed checkout containing the exact working sources; the required final-tip commands are rerun on the lane commit.

## Known-bug scope

`docs/known-bugs/` remains untouched, as required by the builder's scope rule.
The removed meter closes its runtime exposure to all twelve listed meter issues: unjudged-call silence, repeat-count noise, one-machine coverage, private-label misses, alternating batching cost, late load-log cap, pooled denominators, hidden deliverable parallels, trivial pasted replies, relation-none rejection, obsolete synthetic-window documentation and symlinked entry-point no-op.
The old synthetic-window documentation remains historical evidence, not a corrected study.
The seven replay issues concern reconstruction fidelity, disabled control reads, session clustering, pull contamination, shaper lookahead, agreement bias and treatment/live-slot mismatch. The replay command no longer exposes those paths.
This does not fix the surviving shaper's batching/lookahead behavior or revalidate any old empirical result.
No current store, private labels or paid model output was read.

## Checks and limits

Pre-commit checks are captured with individual exit codes in `check-output.md`.
The broad touched run initially exposed three stale removal assumptions; all three have subsequent green repaired runs. One template render transiently failed under concurrent load; the unchanged render passed on retry, and native template acceptance passed both times.
The supported global pi install for setup tests was selected with `npm_config_prefix=~/.local`; the default npm prefix points at a different install missing pi's trust-manager module. No installation or machine configuration was changed.

CI covers the repository's full suite under AGENTS.md. No local full-suite fallback ran, no CI was read, and no push occurred. Path-filtered tests use no full-suite lock.
Native Windows execution remains for the seat's CI. The macOS install-check passed with all its remaining legs and no memory-making leg.
Nothing changed HANDOFF, session archives, frozen study files or known-bug files.
