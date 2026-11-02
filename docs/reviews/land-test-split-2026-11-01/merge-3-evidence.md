# Merge build 3 evidence

Merged main 6ad0b67c7b2ed3270332552db4b960228b726265 into the reviewed lane, starting at 220e4243. Main advanced from the brief's 7c4e7e19 during the first check run; that uncommitted merge was aborted, then the newer main was merged and every check repeated.

No behavior, test assertion, requirement wording, or sealed tunable changed. No new tests or mutation pairs were added or run. Existing R-3490 and R-3491 and the split-test evidence paths remain unchanged. Both generated documents were regenerated, not hand-merged; the only conflict was the requirements outline.

Scope proof before commit: 34 existing lane files differ from main; zero unrelated files differ. The session archive and HANDOFF are identical to main. The incoming lane had no separate session entry or README change to preserve. No precedent departure; existing session entries remain whole and in main's order.

## Commands

All final merge checks exited 0; logs are sibling `merge-3-*.txt` files. The trace and known-bugs logs were regenerated with NODE_NO_WARNINGS=1 after staging exposed home paths in Node's module-type warnings to the identity scan (exit 1). No product output was changed.

- `npm run map`: 588 modules.
- `npm run req:tree`: 2429 rows, 43 features, zero problems.
- `npm test -- packages/nana-pack/tests/land.test.mjs packages/nana-pack/tests/land-merge.test.mjs packages/nana-pack/tests/land-ci-read.test.mjs packages/nana-pack/tests/land-ci-edge.test.mjs`: four files, 66 checks, zero failures.
- `npm run map:check`
- `npm run readme:check`
- `node --experimental-strip-types scripts/requirements-trace.mjs`
- `node scripts/requirements-tree.mjs --check`
- `node scripts/known-bugs.mjs --root .`
- `node scripts/identity-scan.mjs --root .`

The optional `git diff --cached --check` exited 2 on whitespace already present in incoming main's review logs; those unrelated files remain byte-identical to main. Its output is `merge-3-inherited-whitespace.txt`.

The full suite is delegated to CI. No model session, subagent, install, issue operation or seat script was run.

## Known bugs preserved

No known-bug file was manually edited. The lane's removal of the Windows land-test timeout line remains. Its profile-store-guards timing residual and the FEAT-008 R-3490 timing-evidence residual remain unchanged. This merge fixes no additional known bug.
