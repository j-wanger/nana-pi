The merge keeps this lane's behaviour and rows as round 3 accepted them, and brings in main's change at 5bb48872 whole. I found no MUST.

**Main's side comes in whole**
- Main's only commit since the merge base (4eda88e2) adds 111 lines across 8 files: `OBJECTIVE.md`, two lines in `docs/known-bugs/FEAT-001.md`, and the `objective-file-2026-11-02` review folder. It deletes no lines, so there was nothing deleted for the merge to lose.
- `git diff 5bb48872 HEAD` is empty for all 8 files: each one matches main exactly.
- No file was changed on both sides, so the merge needed no conflict resolution.

**The lane's side is unchanged**
- Excluding `FEAT-013.md` and the new merge-4 notes, the lane's diff against main at the tip is byte-identical to its diff against the merge base at cead2a80. That covers the code, tests and rows.
- Every file the lane changed matches cead2a80, except `docs/known-bugs/FEAT-013.md`.
- `hook.ts`, `build-busy.test.mjs`, rows R-2403 and R-3590–R-3596, the code map, the requirements tree, the session file and HANDOFF are all as round 3 reviewed them. The tree movement in the brief names the same 8 rows in the same 2 features.

**What the merge adds**
- **`FEAT-013.md`:** compared with main, the lane still removes the old "Windows knowledge hook … no busy timeout" line, which is its own accepted fix. The merge commit adds only the four round-3 lines `build-brief-merge-4.md` authorized. Each names "(knowledge-busy, review round 3)" and matches its round-3 note. The retry-budget line says "around line 211"; the retry checks sit at about lines 205–207 of `hook.ts`, which is close enough.
- **New notes:** four new files in the review folder: `merge-4-report.md`, `merge-4-tests.txt`, `merge-4-checks.txt` and `review-brief-4.md`. None contains a local path or user name.

**Checks I reran on d558c695 (all exit 0, worktree still clean)**
- `npm run map:check`: 591 modules, 0 problems
- `npm run readme:check`: 0 problems
- `node scripts/requirements-trace.mjs --root .`
- `node scripts/requirements-tree.mjs --root .`: 0 problems, 2440 rows
- `node scripts/known-bugs.mjs --root .`
- `node scripts/identity-scan.mjs --root .`: 0 findings
- `git diff --check cead2a80 HEAD`

I didn't rerun the tests. The builder's `merge-4-tests.txt` records 3 files and 52 checks passing, and the merge changed no code.

**Harms under the review standard:** none. The merge changes no code, test, hook or install path, writes nothing outside the worktree, and removes nothing main has.

**NOTE (not blocking):** `docs/reviews/knowledge-busy-2026-11-02/tree-movement.md` still names the range `4eda88e..fe366d6`. Its rows match the current 5bb4887..d558c69 movement exactly. `review-ledger keep` rewrites this file before the final round, so the seat's next keep refreshes it.

VERDICT: LAND
