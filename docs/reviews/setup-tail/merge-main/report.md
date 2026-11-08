# setup-tail: merge current main

VERDICT: DONE

## Revision

Branch: `feat/setup-tail`.
Merge parents: lane `be61fd48c8fc07dfe87a9bcae09ca2ffdd09673d` and main `19cb9c940c0034616dc4586b4f01aaccbfdb8994`.
The merge commit containing this record is the reported tip; no rebase occurred.

## Conflict resolutions

| File / original conflict hunk | Resolution |
|---|---|
| `docs/code-map.md` 1: module count | Regenerated with `npm run map`: 524 modules. |
| `docs/code-map.md` 2: doctor callers, callees and launch locations | Regenerated from both lanes' merged source. |
| `docs/code-map.md` 3: paths callers | Regenerated, retaining setup-tail and memory-pause consumers. |
| `docs/code-map.md` 4: project callers, callees and launch locations | Regenerated from the merged project implementation. |
| `docs/code-map.md` 5: steps callers, callees and launch locations | Regenerated with retired memory wiring and the shared retirement helper. |
| `docs/code-map.md` 6: install-check test launch locations | Regenerated from merged test source. |
| `docs/code-map.md` 7: rulings-install test callees | Regenerated, keeping main's added rulings checks. |
| `docs/code-map.md` 8: stub-pi callers | Regenerated, retaining setup-tail and memory-pause consumers. |
| `docs/code-map.md` 9: tmp-dir callers | Regenerated, retaining new consumers and dropping main's deleted tests. |
| `packages/nana-setup/README.md` 1: project artifacts table | Kept lane's no-config-seeding row and main's explicit-search wording for the knowledge build. Other corrections merged automatically. |
| `packages/nana-setup/lib/steps.mjs` 1: retired-link ownership call | Used main's public `retired.mjs` helper with the checkout hook directory. Kept both retired hook lists, including memory and verifier. |
| `packages/nana-setup/lib/uninstall.mjs` 1: removable inventory | Kept the retired verifier row and main's retired memory rows. Tagged each retired row for exact ownership handling. |
| `packages/nana-setup/lib/uninstall.mjs` 2: retired-link removal | Kept exact-name/parent ownership and foreign-link preservation. Both retired hooks support dangling targets, dry run and repeat uninstall. |
| `packages/nana-setup/tests/uninstall.test.mjs` 1: expected dry-run labels | Kept `retired verifier link` and changed the memory label to `retired hook nana-memory-end.mjs`. |

Also resolved an automatic semantic collision: both parents exported the same ownership helper from different modules.
Removed the lane's duplicate definition from `steps.mjs`; both install and uninstall import main's public helper from `retired.mjs`.
Updated all live callers: `stepRetiredArtifacts`, uninstall inventory anchoring and uninstall removal.
The uninstall inventory recognizes an owned retired hook as a valid checkout anchor; foreign retired links cannot anchor it.
No helper was copied or moved into a new module.

## Requirements and tests

`REQUIREMENTS.md` merged without conflict. Every row ID from both parents remains, including R-3885–R-3893 and R-3860–R-3867.
Main's retirement/status changes stand. No new ID, row contract, tunable or test was authored for this merge.
Relevant preserved contracts: R-3862 and R-3865 (memory retirement), R-3889 and R-3893 (verifier ownership and uninstall).
The sole manually edited existing assertion is uninstall's dry-run label list, described above; the merged behavior makes its old memory label false.
Main's test additions/deletions stand; the test-runner checks ran after the merge.
Mutation pairs: none new; this brief requests merge preservation, not new must-meet tests.
Existing verifier and memory retirement tests exercised both behaviors without changing their assertions.

## Commands and results

Full normalized output is in the sibling `.log` files.

| Command | Exit | Result |
|---|---:|---|
| `git merge --no-commit --no-ff main` | 1 | Expected five conflict files; all resolved as listed. |
| `npm run map:impact -- packages/nana-setup/lib/steps.mjs packages/nana-setup/lib/uninstall.mjs` | 0 | Read before resolving mapped source. |
| `npm run map` | 0 | Generated merged map. |
| `node scripts/test.mjs setup-tail.test uninstall.test install.test memory-pause.test` | 0 | 6 files PASS; 164 checks pass, no failures or skips. |
| `node scripts/test.mjs test-runner` | 0 | 2 files PASS; 64 checks pass. |
| `npm run map:check` | 0 | 524 modules, zero header/map problems. |
| `npm run req:tree` | 0 | Regenerated tree; 2694 rows, 43 features, zero problems. |
| `npm run readme:check` | 0 | 781 claims, zero problems. |
| `node scripts/requirements-trace.mjs` | 0 | 2008 traced rows, zero EARS problems. |
| `node scripts/component-audit.mjs --check` | 0 | Pass; existing staleness and 16 unclaimed modules remain report-only. |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | macOS; all 13 PASS result lines. |
| `git diff --check` before staging resolutions | 0 | No whitespace errors in unstaged resolutions. |
| `git diff --cached --check` before merge commit | 2 | Inherited trailing whitespace in main's rules-lessons evidence logs; left unchanged. |

Every brief-named seat check is rerun on the merge commit before reporting.
CI covers the repository's full suite under `AGENTS.md`; no local full-suite fallback ran.
No independent lint/types command exists in this repository's root scripts; README/map/trace checks above cover the declared local rails.

## Preservation and searches

`preservation.log` verifies both parents' requirement ID sets and all 26 main deletions.
`resolution-grep.log` records the removed memory-label and ownership-helper search across test sources.
`removed-text-search.log` searches 3570 removed-line/path/basename patterns across 356 existing test files.
This includes every nonempty removed line outside generated/history docs and the ledger; matches include intentional negative assertions and shared syntax.
Two combined grep attempts exceeded their limits, and system grep exhausted memory on the combined pattern file.
A completed literal search replaced that broad grep; the focused resolution grep exited 0.
No deleted file was restored. No known-bug file was edited.
`HANDOFF.md` changed only through main's automatic merge; no manual edit was made.

## Precedent, known bugs and remaining work

This is a `Card: fix` brief without a Precedent section. No precedent departure applies.
Main already supplies the retirement helper; importing it avoids duplicate ownership logic.
The entire FEAT-013 known-bug file was read. No known bug is claimed closed.
Touched context: the pi-seat automatic-pull entry is superseded by main's pull retirement, not separately repaired here.
Windows uninstall and its retained `.cmd` shims remain unsupported and unchanged.
The install/uninstall concurrency gap remains untested and unchanged.

Not done: push, CI reads, native Windows/Linux runs, independent review and land; these remain seat/CI work.
No GitHub issue or credential operation occurred. No model session or subagent was started by the builder.
No open implementation question remains.
