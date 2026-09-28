**T2b fix round 2 is committed as `d5b6e86` on `lane/t2b-review-ledger`, not pushed.** A dirty tree's revision is now the HEAD sha plus a 16-hex digest of `git diff HEAD`. All five dirty-tree cases behave as stated and `npm test` exits 0.

| Case | Result |
|---|---|
| Review a dirty tree | round 1 — PASS |
| Edit a tracked file | round 2, new digest — PASS |
| Revert the edit | round 1 "already counted", no new round — PASS |
| Touch an untracked file | "already counted", no new round — PASS |
| Commit the change | new clean sha, `diff: null`, round 3 — PASS |

I also added a sixth test: `--revision HEAD` on a dirty tree keeps the digest, so a fourth state is refused (PASS).

- **Ledger line shape:** `{"v":1,"ts":…,"kind":"round","repo":…,"item":…,"revision":"<sha>+diff:<16hex>","head":"<sha>","diff":"<16hex>"|null,"role":…,"launcher":…}`. Verdict lines in the audit log carry `head` and `diff` too.
- **Digest:** the first 16 hex of a sha256 over `git diff HEAD --binary --no-color --no-ext-diff --no-textconv`. Outside a git repo nothing changes (explicit `--revision`).
- **README:** the dirty-tree rule and the note that `~/.local/bin/pi-worker` must be symlinked when this lands, placed beside the `pi-review` note.
- **`npm test`:** 69 files — 68 pass, 0 fail, 1 skip; 3266 checks pass, 0 fail, 6 skip.
- **`git diff --stat`:** `README.md` +8/−2, `bin/review-round.mjs` +29/−8, `tests/review-ledger.test.mjs` +32 — 69 insertions, 10 deletions across 3 files.

**Claim most likely wrong:** "untracked grants nothing" is only half true. A new file that has been `git add`ed is tracked, so it changes the digest and earns a new round. Also, if `git diff` fails, the tree is treated as clean. That includes a diff over the 1 GiB buffer, so a failed diff lets the review through instead of refusing it.

VERDICT: DONE
