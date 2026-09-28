All three carries are fixed and committed as `9efad54` on `lane/t2b-review-ledger` (not pushed). `npm test` exits 0: 69 files, 68 pass, 0 fail, 1 skip; 3317 checks pass, 0 fail.

- **Completion race (MUST 1):** `complete()` now works out the tree's revision inside the ledger lock, right before recording (`review-round.mjs`). Test 19 forces the race:
  - The test writes its own live process id into the lock file, so `complete()` in a child process has to wait.
  - After 1.5s it confirms the child is still blocked, edits the tree, then releases the lock.
  - The result is `ok:false`, the round is marked unverified, and there is only a `verdict-unverified` audit entry.
  - With the old ordering put back temporarily, this test FAILs (`{"ok":true,"round":1}`, recorded as valid). With the fix it passes.
- **`--out` inside the reviewed tree (MUST 2):** new `outInTree()`.
  - A tracked `--out` (in HEAD or the index) is refused before the review runs. The tests cover a plain tracked file, a `./sub/../f` spelling, a file tracked in HEAD but removed from the index, and `review-ledger check`. The tracked file is left untouched and no round is reserved.
  - An untracked in-tree `--out` prints `WARNING:` and the review still runs.
  - An ignored in-tree path or a path outside the tree produces no warning.
  - Our own practice (reviewing the worktree, writing output into `~/nana-pi`) passes `check` with exit 0 and no warning.
- **Retry notice (MUST 3):** `pi-review` and `pi-worker` print a one-line notice only when `--retries` is given before `--`. Tests confirm it appears when explicit, not by default, and not when `--retries` appears after `--`. The release note sits in the README beside the `pi-worker` symlink note.
- **`git diff --stat`:** 7 files, +147/−10: `review-round.mjs` +46/−10, test +78, README +15, launchers +18.

**Most likely wrong:** I read "warn for any other in-tree location" as excluding ignored paths, since sol recommends those as the safe place. An ignored in-tree `--out` therefore stays silent. If sol meant every in-tree path, that is a one-line change.

VERDICT: DONE
