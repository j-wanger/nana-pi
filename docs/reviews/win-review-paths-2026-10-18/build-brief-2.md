# Lane win-review-paths — build brief 2 (2026-10-18 · feat/win-review-paths · tip after 4c4afa5)

**Builder: Claude Sonnet 5**, the same worktree and rules as brief 1. The seat's audit of build 1 (`seat-audit-1.md`:
three lens audits and a critic) confirmed four MUSTs. Fix them, plus the SHOULDs listed after them. Prove each fix the
way brief 1 asked: the check FAILS on the code without the fix, then passes.

**MUST 1 — a regression: a tracked `--out` is overwritten when the folder's case on disk differs from git's index.**
After a case-only folder rename (`git mv Docs tmp; git mv tmp docs`, then a branch switch), git's index says
`Docs/review.md` while the disk says `docs/`. `realOut` now returns the disk case, so `outInTree`'s case-sensitive
`git --literal-pathspecs ls-files/ls-tree -- relGit` misses the tracked file; base refuses it with TRACKED. Fix
`outInTree` (`review-round.mjs` around :538-540) so a tracked file is found whatever case either side carries — compare
file identity (dev and ino of the `--out` target against each candidate tracked path, as `inTreeRedirect` does), or
also refuse when the typed-spelling path is tracked; `git ls-files -- ':(icase,literal)<path>'` works where `ls-tree`
rejects `icase`. Check the same root cause at the snapshot skip (`review-round.mjs` :223) and the checkout's exclusion
compare (`pi-review.mjs` :131), so an in-tree untracked `--out` under a case-diverged folder is still excluded. Pin it:
add a leg to GP1 (R-1350) that builds the case divergence between disk and index inside the tree, and a matching leg to
GP2 (R-1351). Both legs must fail on 4c4afa5.

**MUST 2 — GP7 (R-1356) passes on the old code.** It spells the LINKED feature worktree, whose common dir git already
prints absolute and canonical. Admit both legs (the non-LAND verdict and the review in flight) through a second spelling
of the MAIN checkout, detached at the tip, as the critic's probe did: base lands (`code=0`, main moves); the fix refuses.
The check must fail on fe03b6e's tools.

**MUST 3 — `review-standard.test.mjs` now fails.** Its pack copy (around :69) lists three lib files and lacks
`real-path.mjs`, which `pi-review.mjs` and `review-round.mjs` now import; add it to the list and to the `@inputs` header.
Then search every test for another fixed list of copied pack files.

**MUST 4 — GP1 never builds the 8.3 or `\\?\` spellings, though R-1350 names them.** Add both kinds to
`otherSpellings` on win32: the 8.3 short name through the FileSystemObject, as `win32-launch.test.mjs:310-337` does
(SKIP with its reason when the volume has none), and `\\?\` plus the canonical path for GP1. Do not resolve the test's
temp root to its long name (`path-spelling.test.mjs:28` does today): on Windows CI the runner's short temp path is the
natural second spelling, and a case flip alone cannot turn the relUnder or reclaim sites red there, since
`path.win32.relative` ignores case. If the `\\?\` leg fails on Windows, add the one-line strip in `realPath` and let that
leg pin it.

**SHOULDs to take now:**
1. `repoKeyOf`'s fallback is dead: an unknown flag is echoed, not rejected. Detect the echo (stdout starting with
   `--path-format`) and fall back then.
2. Guard every check against an empty spelling list: no spelling available is a printed SKIP, never a vacuous PASS.
3. GP6(iii): run every cleanup-worktree spelling, not only the first.
4. pi-review now prints a stack trace for an `--out` under a regular file (ENOTDIR), where base printed a clean line;
   restore the clean refusal.
5. `realPath` with `mustExist` returns the unresolved path on ELOOP or EACCES; throw there, as the design says.
6. `land.test.mjs` around :491/:499 expects backslashes from `realpathSync.native(feature)` while `runCleanup` prints
   git's forward-slash path; compare both through `realPath` so it holds on Windows.
7. `packages/nana-pack/README.md`: declare the known limits `must-meet.md` lists (the one-time Windows key restart, the
   firmlink-typed `--out`).

Every touched existing file's macOS count still equals `macos-baseline.txt` (or rises only by the checks you add to
`path-spelling`). Do not touch `HANDOFF.md`, `docs/sessions/` or the seat's files.

## Done
`path-spelling`, `review-standard`, `land`, `immutable-review`, `review-ledger`, `review-round` and `worker-lane` green on
macOS; each new leg proven red on 4c4afa5 (MUST 1, 4) or fe03b6e (MUST 2); the code-map, trace and README checks.

## Report
≤ 12 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each fix and its red-then-green proof; each file's
macOS line; the one claim most likely wrong on Windows.
