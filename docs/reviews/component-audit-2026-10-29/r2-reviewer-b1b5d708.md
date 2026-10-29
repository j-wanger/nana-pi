The CI failure is not fixed. The R-3103 test will fail again on the reviewed tip, b003b988, on all three systems.

**MUST: the CI failure from round 1 still stands.**
- **Where it comes from.** The CI log says the failing call is `component-audit.test.mjs:89`, not the audit script. The R-3103 test builds `auditedAt` with `run(ROOT, ["rev-parse", "main"])`. A CI checkout has no local `main`, so that git call exits 128 and the test fails.
- **What build 3 changed.** It fixed `scripts/component-audit.mjs`, which now counts activity from HEAD and skips the comparison when `main` is missing. It never touched line 89, so the test still fails before the audit runs.
- **Reproduced.** I cloned the repo into `/tmp` and checked out b003b988 detached, with no local `main` or feature branch. Running `node --test packages/nana-pack/tests/component-audit.test.mjs` failed with the same error: `FAIL R-3103 … fatal: ambiguous argument 'main'`. Nothing else in that file failed. I deleted the clone afterwards.
- **Why the local suite missed it.** The build 3 report says the locked suite passed, but that run had a local `main`. The new no-`main` fixture tests the script, not this test.
- **Fix.** Use `rev-parse HEAD` at line 89, or any commit that exists in a CI checkout.

**Round 1's SHOULD is closed.** The R-3100 test now asserts `real.problems` is empty with no filter, and R-3108 checks the same thing on the tracked audit. `node scripts/component-audit.mjs --check` exits 0 in the worktree. Both tests passed in my no-`main` clone.

**The script change looks correct.**
- `countActivities` now returns counts even without `main`, and it skips the unmerged-branch loop when `main` is missing.
- It hangs the one report line on the returned Map as `reportLines`, and `buildAudit` adds it to `lines`. That works, though it is a little unusual.
- CI checks out with `fetch-depth: 0`, so the HEAD history is complete there.
- NOTE: on a feature branch, activity now includes the branch's own commits. Those commits are also counted as in flight when the branch has an `origin/feat/` ref. The R-3104 row was reworded to match, so this was chosen on purpose.

The CI run for b003b988 (run 40931257125) was still queued when I looked.

VERDICT: SEND-BACK
