All five fixes are in, committed as `4dc67cb` on `lane/t2b-review-ledger` (not pushed). `npm test` exits 0.

**MUST 1 — worker retry**
- **Before:** a stub worker that printed `Implemented the change; edited src/a.ts.` (no review words) ran 3 times, then `FAILED after 3 attempts`, exit 1.
- **After:** the same stub gives `attempt 1/1`, `SUCCESS on attempt 1`, exit 0, and ran once.
- The review check moved into its own file, `bin/review-shape.mjs`. `pi-review` passes it to the watchdog; the watchdog imports no ledger or review code, and a test checks that.
- `pi-worker` now succeeds on exit 0 plus non-empty output and defaults to `--retries 0`. Asking for retries prints a warning that a retry repeats file changes, and the README says so.
- `--retries N` now means re-attempts after the first try. `pi-review` defaults to 2, so it still makes 3 attempts by default, but an explicit `--retries N` now gives N+1.

**MUST 3 — the snapshot hash**
- A clean tree's revision is still the bare HEAD sha. A changed tree's is `<HEAD>+snap:<full sha256>`, with ledger fields `head` and `snapshot`.
- It covers every path in HEAD's tree, the index, and untracked files that `.gitignore` does not ignore, in byte order. Each path is hashed as mode on disk plus sha256 of its raw bytes. Symlinks hash their target, and a submodule contributes its own revision, worked out the same way.
- No diff is ever rendered. The review's own `--out` file is left out. "Clean" means the same entries match `git ls-tree -r HEAD` by git object id.
- A clean clone of this repo (685 files) hashes in 0.16s.

Every case sol listed behaves as required, and each is pinned in the test file:
- **Now distinct** (each of these gave identical `git diff` text before):
  - an untracked file
  - CRLF vs LF under `text=auto`
  - `chmod +x` with `core.fileMode=false`
  - two contents that a clean filter maps to the same blob
  - two different dirty submodule contents
  - the digest is the full 64 hex characters
- **Now one revision:**
  - unstaged, `add -N` and fully staged versions of the same content
  - `diff.noprefix`, `diff.mnemonicPrefix`, `color.ui`, `core.quotePath` and `diff.renames` all set
  - an ignored file added or edited
  - a file whose mtime was touched with no content change
  - `git rm --cached`, which still gives the clean sha
  - a clean submodule gives the clean sha

**MUST 2 — git failure:** on a repo with a corrupt index, the old code recorded the dirty tree as the clean sha (`diff:null`). The new code refuses with `git ls-files -z --stage failed … index file smaller than expected — admission refused`. Any git error other than "not a git repository" now refuses.

**MUST 4 — completion check:** `complete()` works out the revision again. If the tree changed during the review, it refuses the verdict and exits 1, but the round still counts against the revision that was admitted (the tally line gets `unverified: true` plus the new revision). I chose this because a tree edited mid-review wasn't read in any single state, so no state can honestly own the verdict. Counting nothing instead would let anyone get free reviews by editing during them. My own heartbeat test first tripped this check by accidentally changing the tree mid-review, which was the right outcome.

**MUST 5 — heartbeat:** the launcher renews its reservation every 2 minutes (`review-ledger run` now runs the review asynchronously so renewal can happen). A reservation is dropped only if its owner is dead, it hasn't been renewed for 10 minutes, or it is dated in the future; there is no fixed lifetime any more. Tested with the window shortened to 1s:
- a renewing review stayed held at 2.5× the window and was recorded;
- a live owner that never renews was reclaimed, and its late completion recorded nothing;
- a reservation dated 13 hours back came back to life after one renewal.

**Tests:** `review-ledger.test.mjs` 113/113; whole suite 69 files: 68 pass, 1 skipped, 0 fail; 3303 checks pass, 6 skipped.

**Diff:** 8 files, +449 / −110 — README 50, `pi-review` 11, `pi-watchdog` 35, `pi-worker` 16, `review-ledger` 16, `review-round` 231, `review-shape` (new) 8, `review-ledger.test` 192.

**Residuals:**
- If git filters or line-ending conversion change files at checkout (LFS, `autocrlf`), a fresh checkout never reads as clean. It stays one consistent revision, but costs one round over the bare sha.
- An ignored file that was force-added is counted only while it is staged.
- A user's global excludes file (`core.excludesFile`) changes which files count.
- Paths that aren't valid UTF-8 refuse admission.
- Every admission and completion reads every relevant file in full.
- Review outputs written into the reviewed tree under a different `--out` name, e.g. `sol-r1.md` sitting there when the next review runs, make a new state.
- Old ledger lines with `+diff:` never match new revisions, so an item already in progress can get one extra round.
- Setting `NANA_REVIEW_RES_STALE_MS` changes the stale window (minimum 500 ms).

**Most likely wrong:** that "raw bytes against the HEAD tree" is the right definition of clean. It matches git on plain repos and in the tests, but under the filter and line-ending setups above it disagrees with `git status`. That is deliberate, but it's the claim sol is most likely to challenge.

VERDICT: DONE
