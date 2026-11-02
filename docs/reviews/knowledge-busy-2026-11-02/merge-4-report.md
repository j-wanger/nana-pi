# Merge build 4

VERDICT: DONE

## Change

Merged origin/main at 5bb488728ba22d496406a7c79aa489e09dadd6eb into feat/knowledge-busy.
The merge restored main's objective file, objective review folder and unrelated known-bug lines.
Every file outside the lane's original changed-path set matches origin/main.
All 256 main session entries remain whole, in their original order; the lane's newer entry stays first.
No session archive edit was needed. No precedent departure.

Regenerated docs/code-map.md and docs/requirements-tree.md using their generators.
Added four review-round-3 lines to docs/known-bugs/FEAT-013.md: retry budget overrun, missing second cause, torn-log parse replacing failure detail, and the P9 comment overclaim.
Existing known-bug lines stay unchanged from the previous lane tip.
No behavior, requirement row, README, test or mutation pair changed in this build.
Preserved lane rows R-2403 and R-3590–R-3596 and all previous review evidence.
No new wrong-code run applies to this merge-only build; previous 11-pair evidence remains in seat-mutate-darwin.txt and seat-mutate-win32.txt.

## Commands and exits

- npm run map: 0
- npm run req:tree: 0
- npm test -- packages/nana-knowledge/tests/build-busy.test.mjs packages/nana-knowledge/tests/incremental-build.test.mjs packages/nana-knowledge/tests/recover.test.mjs: 0; 3 files pass, 52 checks pass.
- npm run map:check: 0
- npm run readme:check: 0
- node scripts/requirements-trace.mjs --root .: 0
- node scripts/requirements-tree.mjs --root .: 0
- node scripts/known-bugs.mjs --root .: 0; names=0, informational sizes=1.
- node scripts/identity-scan.mjs --root .: 0
- node scripts/lane-class.mjs --root .: 0; hook.
- git diff --check: 0

Full outputs: merge-4-tests.txt and merge-4-checks.txt; local checkout prefixes in warnings replaced with <repo>.
An initial test command named nonexistent build.test.mjs; the runner selected two files and passed. The corrected command above selected all three intended files.

## Not done

No full suite, model session, new test, mutation run or independent review: this brief changes no behavior and CI covers the suite.
No install check rerun: the previous seat's passing install check remains in seat-install-check-r3.txt; this build changes no hook code.
No GitHub issue operation. No writes to the prohibited temporary folders.
The builder pushes the final merge commit and stops without reading CI.
