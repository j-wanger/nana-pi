# Retirement inventory

Base: 42bf0800. Retired rows (83): R-1712, R-233, R-234, R-895, R-896, R-3195, R-3350, R-3351, R-3352, R-3353, R-3355, R-3358, R-3359, R-3360, R-3297, R-3310, R-3311, R-3312, R-3313, R-3314, R-3315, R-3316, R-3317, R-3318, R-3319, R-3320, R-3321, R-3322, R-3323, R-3324, R-3325, R-3326, R-3327, R-3328, R-3329, R-3330, R-3331, R-3332, R-3333, R-3334, R-3335, R-3336, R-3370, R-3371, R-3372, R-3373, R-3374, R-3375, R-3376, R-3377, R-3378, R-3379, R-3380, R-3381, R-3382, R-3383, R-3384, R-3385, R-3386, R-3387, R-3388, R-3389, R-649, R-1550, R-1551, R-1552, R-1553, R-1554, R-1555, R-1556, R-1557, R-1632, R-2516, R-2521, R-2661, R-691, R-692, R-693, R-694, R-695, R-696, R-697, R-698.

## Deleted paths

- `packages/nana-knowledge/extensions/nana-knowledge.ts`
- `packages/nana-knowledge/tests/extension.test.mjs`
- `packages/nana-pack/lib/blast-radius-config.mjs`
- `packages/nana-pack/lib/memory-replay-config.mjs`
- `packages/nana-pack/lib/memory-replay-context.mjs`
- `packages/nana-pack/lib/memory-replay.mjs`
- `packages/nana-pack/lib/memory-score.mjs`
- `packages/nana-pack/lib/outcome-meter-config.mjs`
- `packages/nana-pack/lib/outcome-meter.mjs`
- `packages/nana-pack/lib/outcome-score.mjs`
- `packages/nana-pack/lib/tree-kill-scan.mjs`
- `packages/nana-pack/lib/writing-trial-extractor.mjs`
- `packages/nana-pack/tests/blast-radius.test.mjs`
- `packages/nana-pack/tests/memory-replay.test.mjs`
- `packages/nana-pack/tests/outcome-meter.test.mjs`
- `packages/nana-pack/tests/requirement-rows.test.mjs`
- `packages/nana-pack/tests/writing-trial-extractor.test.mjs`
- `packages/nana-setup/claude/hooks/nana-memory-end.mjs`
- `packages/nana-setup/tests/memory-end-hook.test.mjs`
- `packages/nana-setup/tests/memory-end-wiring.test.mjs`
- `scripts/blast-radius.mjs`
- `scripts/memory-replay.mjs`
- `scripts/memory-score.mjs`
- `scripts/outcome-compare.mjs`
- `scripts/outcome-meter.mjs`
- `scripts/outcome-score.mjs`
- `scripts/requirement-rows.mjs`

## Deleted test files and removed declarations

### packages/nana-knowledge/tests/extension.test.mjs

- registers exactly one before_agent_start handler — req: R-233
- 1: customType is nana-knowledge — req: R-233
- 1: display is true (the owner sees what the agent sees) — req: R-233
- 1: content is the untrusted-pointers block — req: R-233
- 1: no systemPrompt mutation — req: R-233
- 2: pull.log carries the pi session id — req: R-896
- 2: pull.log carries source "pi" — req: R-896
- 3: same prompt, same session → undefined — req: R-896
- 4: a different session id pulls again — req: R-896
- R-234: a pi pull child that exits non-zero, prints nothing, outlives the deadline or is missing injects nothing — req: R-234
- R-895: a pi pull child that exits non-zero, prints nothing, outlives the deadline or is missing throws nothing out of the handler — req: R-895
- 5b: a child whose callback never fires still yields null — req: R-234
- 8: tokens past the cap do not drive the query — req: R-227
- 9: ...and node:sqlite never loaded in the extension's process — req: R-233
- R-1712: pi on an index older than one hour injects only that index's pull block while a background build rebuilds the index — req: R-1712
- 1: a real prompt returns a message — req: unmarked (retired file self-check/control)
- 2: pull.log carries the cwd the extension was given — req: unmarked (retired file self-check/control)
- 4: and it is logged under THAT session id — req: unmarked (retired file self-check/control)
- 5: a hung child yields null — req: unmarked (retired file self-check/control)
- 5: and the deadline actually fires (${ms} ms) — req: unmarked (retired file self-check/control)
- 5b: ...near the deadline, on the handler's OWN timer (${ms} ms) — req: unmarked (retired file self-check/control)
- 5b: the kill is attempted after resolving, with SIGKILL — req: unmarked (retired file self-check/control)
- 6: a missing bin does not throw — req: unmarked (retired file self-check/control)
- 6: a missing bin yields null — req: unmarked (retired file self-check/control)
- 7: a sessionManager without getSessionId does not throw — req: unmarked (retired file self-check/control)
- 7: ...and injects nothing — req: unmarked (retired file self-check/control)
- 8: the child receives exactly PROMPT_MAX_CHARS (${len}) — req: unmarked (retired file self-check/control)
- 9: a real pull happened in the probe (${out}) — req: unmarked (retired file self-check/control)
- 9: control — the index path DOES load node:sqlite (${controlOut}) — req: unmarked (retired file self-check/control)
- 10: ${label} prompt does not throw — req: unmarked (retired file self-check/control)
- 10: ${label} prompt injects nothing — req: unmarked (retired file self-check/control)
- 11: an empty prompt is PASSED to the child — req: unmarked (retired file self-check/control)
- 11: an empty prompt does not throw — req: unmarked (retired file self-check/control)
- 11: ...and injects nothing (the producer skips it) — req: unmarked (retired file self-check/control)

### packages/nana-pack/tests/blast-radius.test.mjs

- R-1550: the page draws one node for each changed mapped module and each transitive caller and callee, and no other module — req: R-1550
- R-1551: nodes sit in four columns, tests, upstream, changed, downstream, left to right, with changed first and a caller never downstream — req: R-1551
- R-1552: the drawn edges are exactly the map's imports between drawn nodes, importer to imported — req: R-1552
- R-1553: changed means differing from the merge base in the working tree, uncommitted and untracked included, base-only changes and git-ignored files excluded — req: R-1553
- R-1554: the page lists exactly the changed module-extension files the map does not hold — req: R-1554
- R-1555: exactly the changed modules outside the test roots that no test imports carry the no-linked-test label — req: R-1555
- R-1556: two copies of one checkout in different folders give byte-identical pages with no folder path and no date — req: R-1556
- R-1557: the page carries no script and references no file outside itself — req: R-1557

### packages/nana-pack/tests/context-anatomy.test.mjs

- R-3729: real review loads count by source cwd and name context statuses — req: R-3729, R-3315, R-3336

### packages/nana-pack/tests/linked-launch.test.mjs

- R-1632: requirement-rows started through a linked checkout folder refuses a run with no file and exits 1 as it does by its real path — req: R-1632

### packages/nana-pack/tests/memory-making.test.mjs

- scoring prints exact counts over all candidates — req: R-3195

### packages/nana-pack/tests/memory-replay.test.mjs

- plan stratifies corrections without spend — req: R-3370
- context preserves past and replaces only memory slot — req: R-3371
- bundle uses pre-cut candidates and one oracle record — req: R-3372
- judge is isolated blind and fail-closed — req: R-3373
- decision reports paired statistics attrition and confirmation — req: R-3374
- caps stop at case boundaries and expose incomplete spend — req: R-3375
- screen selects repeats but run uses fresh draws — req: R-3376
- private commands and sealed Claude runners — req: R-3377
- seal: runners — req: R-3378
- seal: replay model and effort — req: R-3379
- seal: judge model and effort — req: R-3380
- seal: draws and screen rule — req: R-3381
- seal: dollar caps — req: R-3382
- seal: context and reply caps — req: R-3383
- seal: bundle budget — req: R-3384
- seal: slot markers and kept types — req: R-3385
- seal: statistic and blind bars — req: R-3386
- seal: prompt hashes — req: R-3387
- seal: citation and capture — req: R-3388
- seal: output and fixed words — req: R-3389

### packages/nana-pack/tests/memory-run.test.mjs

- R-3297: land starts making only after the final merge and cannot alter its verdict — req: R-3297

### packages/nana-pack/tests/outcome-meter.test.mjs

- counts interaction windows and pooled outcomes — req: R-3310
- repeats need earlier in-scope nonparallel sessions — req: R-3311
- decisions require prompting and same settlement — req: R-3312
- judge sees full lookback and rejects bad calls — req: R-3313
- spend cap and unknown usage remain visible — req: R-3314
- context loads split by window role launcher and part — req: R-3315
- commands stay private and Claude options stay isolated — req: R-3316
- scorer and comparison measure valid item agreement — req: R-3317
- seal: judge runner — req: R-3318
- seal: judge model — req: R-3319
- seal: judge effort — req: R-3320
- seal: dollar cap — req: R-3321
- seal: token cap — req: R-3322
- seal: batch size — req: R-3323
- seal: interaction sizes — req: R-3324
- seal: claim cap — req: R-3325
- seal: timeout — req: R-3326
- seal: buffer — req: R-3327
- seal: log cap — req: R-3328
- seal: minimum loads — req: R-3329
- seal: minimum repeats — req: R-3330
- seal: kind precision bar — req: R-3331
- seal: repeat precision bar — req: R-3332
- seal: repeat recall bar — req: R-3333
- seal: interval and power — req: R-3334
- seal: system prompt hash — req: R-3335
- seal: output words — req: R-3336

### packages/nana-pack/tests/process-tree.test.mjs

- seal: taskkill, SIGKILL by default, and the four declared tree-kill exceptions — req: R-2656, R-2657, R-2661
- R-2661: the tree-kill scan names each planted taskkill or negative-pid line outside the exceptions, and finds none in the repository — req: R-2661

### packages/nana-pack/tests/requirement-rows.test.mjs

- direct and transitive tiers contain the right marked rows and are disjoint — req: R-649
- each file output carries the incomplete and inexact label with the untested count — req: R-649
- files without marked test callers print unknown, including an unmapped file — req: R-649
- objective.ts lists R-001 through R-019 across the tiers and carries the uncertainty label — req: R-649
- CLI reports a file with no marked test caller as unknown — req: R-649

### packages/nana-pack/tests/writing-trial-extractor.test.mjs

- seal: the extractor's owner word digest — req: R-2521
- a rule attached under any Writing for title counts as attached — req: R-2516
- scope excludes worktree/private projects and windows by first entry — req: R-691
- baseline chooses last qualifying main-thread assistant message — req: R-692
- after includes only report-sized messages after canonical rule attachment, including pre-window sessions — req: R-693, R-697
- scoring reports strict and former first-sentence lenient totals together — req: R-694
- preservation writes normalized private text and matching session hash manifest — req: R-695
- preservation refuses a symlink destination without changing its target — req: R-695
- preservation rejects a symlinked output directory without writing externally — req: R-695
- private corpus input verifies hashes and scores the exact preserved text — req: R-696
- after reports obey their own date boundary and repeated attachments retain post-first-attachment calls — req: R-697
- after JSON labels checker invocations and exposes session verdict separately from message audit — req: R-694, R-697
- after cutoff is inclusive at the exact message timestamp — req: R-697
- redacted decision golden corpus groups boundaries and preserves ordered rubric parts — req: R-698
- a decision naming the owner by name or by role scores its fifth part — req: R-2521

### packages/nana-setup/tests/install-check.test.mjs

- pi turn: a nonzero exit or a missing record, run token, rulings heading, writing section or knowledge message each fails the pi turn line, and a full record passes — req: R-1070, R-1791

### packages/nana-setup/tests/memory-end-hook.test.mjs

- R-3350: session and land share one quiet hidden starter — req: R-3350
- R-3351: guards deadline errors and open stdin stay quiet — req: R-3351
- R-3352: broken checkout exits silently — req: R-3352
- R-3355: run survives hook exit and timeout descendant kill — req: R-3355
- R-3358: seal entry timeout — req: R-3358
- R-3359: seal stdin deadline — req: R-3359
- R-3360: seal hook identity — req: R-3360

### packages/nana-setup/tests/memory-end-wiring.test.mjs

- R-3353: SessionEnd install repair remove and check preserve foreign hooks — req: R-3353

### packages/nana-setup/tests/seat-pull-off.test.mjs

- R-3743: install-check omits the Claude knowledge hook and still checks pi knowledge — req: R-3743

### packages/nana-setup/tests/settings-merge.test.mjs

- forced-win32 removeInstallerHooks removes exactly the six entries — req: R-1050

### packages/nana-setup/tests/win32-hook-repair.test.mjs

- win32 install: a second install over the repaired home reports all six settings rows unchanged — req: R-1883
- win32 doctor: all six settings rows read ✓ after one install over the carried home — req: R-1884

