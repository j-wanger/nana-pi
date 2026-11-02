# Build record

Verdict: DONE.

## Scope

- Row R-3601 now keeps unlabelled units above the sealed oversize bound during label cuts and refuses every other missing model label. Its evidence adds the new tagged check. No new row.
- `apps/bench/lib/replay-context.mjs` keeps missing-label oversize units outside the removal set, preserving their headings and table glue.
- `apps/bench/lib/anatomy-measures.mjs` exports its existing `oversize` predicate in place. Authorized precedent departure: a private helper becomes public for its second consumer; no copy or move.
- The renderer imports the shared predicate rather than directly importing the bound. This reconciles the brief's constant-import wording with its explicit predicate-reuse requirement without an unused import or duplicated comparison. The predicate already imports the constant; the new test imports it directly.
- `apps/bench/test/replay.test.mjs` adds exactly one tagged check, looping over system and instruction locations. Existing assertions are unchanged; its module header no longer promises eight cases.
- `docs/code-map.md` was regenerated. The requirements-tree generator produced no diff.
- No listed known bug is fixed. Heading/table behavior is exercised only to ensure retained oversize units prevent removal; unrelated anatomy assembly defects remain untouched.

## Evidence

`wrong-code.txt` records the unchanged new check failing on the branch-base implementation (exit 1, missing-model-label error), then passing on the fix (exit 0).

`checks.txt` records local command output. All required commands exited 0:

- `node apps/bench/test/replay.test.mjs`: 7/7 passed, 2 pre-existing platform skips.
- `node apps/bench/test/anatomy.test.mjs`: 9/9 passed.
- `node packages/nana-pack/tests/test-runner.test.mjs`: all checks passed.
- `npm run map:check`: 0 problems.
- `npm run readme:check`: 1109 claims, 0 problems.
- `node scripts/requirements-trace.mjs`: 2206 implemented rows traced; 0 EARS exceptions.
- `node scripts/requirements-tree.mjs --check`: 0 problems.
- `node scripts/known-bugs.mjs --root .`: names=0, sizes=1 (existing report-only size note).
- `node scripts/identity-scan.mjs --root .`: 0 findings after staging.

Lane classification: ordinary. No new sealed tunable. Fixtures are synthetic and use the existing awaited per-case harness.

## Not done

No full suite: AGENTS.md explicitly delegates it to CI. No push or CI inspection, per lane instructions. No model sessions, real context reads, credential access or issue operations. The pre-existing untracked build brief remains outside this commit. The stale installed rulings were reported, not repaired.

Initial log redirection failed because TMPDIR was unset; rerunning with TMPDIR set to the OS temp directory produced the recorded wrong-code result. Non-fatal module-type warning paths were omitted from committed output. Raw test-runner PASS lines retain their emitted trailing spaces.
