# Lane clean-revision — build brief 2 (2026-10-19 · feat/clean-revision · on 57e542b)

**Builder: Claude Sonnet 5, a subagent in `<worktrees>/clean-revision`.** The same rules as brief 1: single test files only, in the foreground, each under 9 minutes; no full suite; no push; no `HANDOFF.md` or `docs/sessions/`.

The seat's wrong-code pairs (`seat-mutate-output-57e542b.txt`, 16 of 16 red, 0 survived) and one independent check ran on 57e542b. One MUST and two known bugs with one-line fixes come back. All three sit in the scratch `git` commands of `workingState` in `packages/nana-pack/bin/review-round.mjs`.

## 1. MUST — a clean checkout under `core.safecrlf=true` is refused (new row R-1378)

Probe P6 of the independent check: `core.autocrlf=true` plus `core.safecrlf=true`, a clean checkout (`git status` prints nothing) holding a tracked file with LF endings on disk. Main derives plain HEAD. The lane throws `git add -A -- :/ failed … fatal: LF would be replaced by CRLF in a — admission refused`. The scratch index has no stat data, so git re-converts every file and its safecrlf check fires; git's own add skips a file whose stat matches.

Fix: pin `core.safecrlf=false` on the scratch commands (the same overlay the other scratch settings use). That setting only gates the check; it does not change the stored blob. The probe with it pinned gives `snapshot=null`.

Requirements first: add `R-1378` beside R-1370–R-1377 in the same feature table: `WHEN core.autocrlf is true and core.safecrlf is true and the working tree is clean, the revision shall be the plain HEAD sha.` (status `proposed`, then `implemented` when its test passes). Bump the R-291 leaf-total literal in `packages/nana-pack/tests/requirements-tree.test.mjs` by one (three spots) and run `npm run req:tree`. Add one check in `review-ledger.test.mjs` with `// req: R-1378` directly above its `check(` call: a fresh repo with `core.autocrlf=true` and `core.safecrlf=true`, a committed text file whose working copy has LF endings, a clean `git status`, and the derived revision equals HEAD. Show it red on 57e542b and green after the fix.

## 2. Known bugs fixed in passing — the real `.git` and hooks stay untouched

- F2: under `core.splitIndex=true`, each derivation of a distinct dirty state leaves a `sharedindex.<sha>` file in the real `.git` (probe P7: count 1 → 5). Pin `core.splitIndex=false` on the scratch commands.
- F3: derivation runs the repository's `post-index-change` hook three times per call (probe P8); main ran none. Pin `core.hooksPath` to an empty folder inside the scratch folder for the scratch commands.

Extend the existing R-1375 check (`snapshot derivation leaves git metadata unchanged`) with both cases rather than adding a check: a repo with `core.splitIndex=true`, and a repo with a `post-index-change` hook that appends to a log outside `.git`. The git folder keeps every entry's size, mode and mtime, and the log stays empty. Reword R-1375's text to cover the hook: `…every entry under the repository's git folder shall keep its size, mode and mtime, and no repository hook shall run.` Show each case red with its pin removed, then restore.

## Not in this build

F4 (a SIGKILL during derivation leaves a `nana-snapshot-*` folder in the OS temp folder) and F5 (inferred: on Windows the scratch `rmSync` may throw EBUSY under antivirus) stay known bugs; the seat records them. The Windows CI leg after this build is the evidence for F5 and for R-1377's alternates on Windows.

## Report

First line `VERDICT: DONE | PARTIAL | BLOCKED`. Then the commits, every command you ran with its exit code, and the red-then-green evidence for R-1378 and for each R-1375 case.
