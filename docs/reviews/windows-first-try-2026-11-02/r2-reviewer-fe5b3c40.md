I found no MUST. The merge brings in all of main's changes unaltered, including the lines main deleted, and keeps this lane's checks and rows exactly as round 1 accepted them.

**How I checked the merge**
- **It matches git's own merge.** I ran `git merge-tree --write-tree b85481a1 7c4e7e19` and it reported no conflicts. The only differences between its tree and merge commit 04261a57 are the three new lines in `docs/known-bugs/FEAT-031.md` and the new `merge-checks.txt`. No conflict was resolved by hand, so neither side was dropped or changed.
- **Main's side is complete.** `git diff 7c4e7e19 HEAD` lists only this lane's files: its two test files, its review folder, and the shared files it touches (REQUIREMENTS.md, code-map.md, requirements-tree.md, known-bugs/FEAT-031.md). Every other file, including main's bench work, HANDOFF.md, `docs/sessions/2026-10.md` and FEAT-042's known bugs, is the same as on main. That covers what main deleted, such as its removed lines in `apps/bench/`.
- **The lane's side is unchanged.** `packages/nana-pack/tests/mutation-runner.test.mjs` and `post-edit-status.test.mjs` are byte-identical to b85481a1, so the stagger check (R-3530) and the `timeoutMs 0` check (R-3531) behave as round 1 accepted them. In each shared file, the diff against main is exactly the lane's own earlier diff:
  - the R-3530 and R-3531 rows;
  - the shifted line numbers in the code map;
  - the row counts and IDs in the requirements tree;
  - the reworded mutation-runner line in the known-bugs file.
  
  The only addition is the three known-bug lines.
- **The generated files are current.** I re-ran the checks in read-only mode on HEAD, and every one passed with 0 problems: `map:check`, `requirements-tree --check`, `readme:check`, `requirements-trace`, and `known-bugs`. The worktree stayed clean. This agrees with the builder's record in `merge-checks.txt`, which also shows the two touched test files passing (42 checks, then 32 with 1 skipped).

**The added content**
- **The three known-bug lines match round 1.** They record the round-1 SHOULD (an exported `SEAT_MUTATE_STAGGER_SECS` gives a local FAIL, because `scripts/test.mjs` doesn't remove it) and both NOTE items (a `git worktree add` of 1000 ms or more lets a missing stagger pass; a shard set-up over about 2 s can still fail the check). They follow the file's existing style.
- **The other two new files are fine.** `merge-checks.txt` replaces absolute checkout paths with `<worktree>`, and the identity scan reports 0 findings. `review-brief-2.md` (commit 38d29722) is only this round's brief.

**Harms the review standard lists**
None. The change edits no product code, no install and no hook. Nothing writes outside the worktree, and nothing that works on main stops working.

**NOTE**
- Commit 38d29722 uses the same local-host author address as about 290 of main's last 300 commits. It is existing practice, not a finding about this change.

VERDICT: LAND
