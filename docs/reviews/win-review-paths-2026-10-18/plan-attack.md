MUST: 2

**MUST 1. The new native path function breaks a case that works today, through Unicode normalization (confirmed on this Mac).**
- **Mechanism:** with `core.precomposeunicode=true` (the macOS default), git lists paths in NFC, even when the folder on disk is stored in NFD. Native realpath returns the stored NFD form. Without the fix, JS realpath keeps the typed NFC form, which matches git.
- **Where it breaks:** the prototype's workingState skip (`relUnder(root, realOut(x))`) misses the out file, and so does copySnapshot's `resolve(from) === outReal`.
- **Probe:** a repo with a subfolder `docs/Réviews` created in NFD, and an untracked `out.md` in it. The `--out` is typed in NFC, as a terminal types it.
  - Base: pi-review exits 0. review-ledger run records a verified LAND at the bare HEAD.
  - Prototype: pi-review exits 1 with "dirty snapshot could not be reproduced". review-ledger run exits 1, and its tally row is `+snap`, `unverified:true`. A round is spent and the verdict does not count.
  - An `--out` typed in NFD fails in base too (it gets `+snap`). The fix below repairs both forms.
- **Plan claim this disproves:** "typing a name in NFC while the disk holds NFD is fixed by the same native call". It is not fixed for any folder inside the repo.
- **Fix, prototyped as `adv/pack2`:**
  - Add `gitPathKey = (s) => process.platform === 'darwin' ? s.normalize('NFC') : s`. APFS and HFS+ treat both forms as one name, and Linux and Windows are unchanged.
  - Apply it to both sides of the workingState skip and of the copySnapshot exclusion compare.
  - With it, the base behaviour comes back in both typed forms.
- **New wrong-code pairs, both confirmed:**
  - M14 removes it from the skip: review-ledger run ends unverified and pi-review refuses.
  - M15 removes it from copySnapshot: the review checkout lists `out.md`.
- **Probes:** `nfd.mjs` (git prints NFD for the top folder and NFC for ls-files), `nfd2.mjs`, `nfd3.mjs`, `nfd3b.mjs`, `nfd3c.mjs`, `m15.mjs`.

**MUST 2. GP5 is skipped on Windows, which is the one platform where the cleanup check (P5) always passes without checking anything. A test setup without a git shim exists and works.**
- **Why Windows matters:** git prints `/` and tempRoot uses `\`, so `includes()` never matches on any Windows run (inventory, slash-direction class). The plan still marks R-967 implemented on Windows while its only check for that row is skipped there.
- **The setup:** the fake pi body runs `git worktree lock --reason test <its cwd>`. Then:
  - `worktree remove --force` fails, because a locked worktree needs `-f -f`;
  - pi-review deletes the folder with rmSync;
  - `prune --expire now` keeps the locked registration;
  - the check must report it.
- **Shape:** the fake pi body is plain Node, so it works with `writeFakePi` on win32 and needs no extensionless git shim.
- **Probe (`lock.mjs`):**
  - Base exits 0 with the leftover still listed, both under the default macOS TMPDIR and under a symlinked TMPDIR.
  - The prototype exits 1 with "worktree registration remains".
  - M13 still turns it red, because the folder is gone and the fallback is needed.
- **Test cleanup:** the test must run `worktree unlock` and `prune` afterwards. Otherwise the next pi-review on that repo hits a locked, dead checkout and fails with "cannot reclaim stale review worktree".

**SHOULD**
1. **The firmlink spelling is a seventh class, and native realpath does not fix it (confirmed on this Mac).**
   - `realpathSync.native("/System/Volumes/Data/Users/…/.git")` returns the same `/System/Volumes/Data/…` spelling, while git prints `/Users/…`.
   - `git rev-parse --path-format=absolute --git-common-dir` returns the canonical path for case, symlink and firmlink spellings alike (`adv/` shell probe).
   - Build the key from that output, then apply `realPath`. Prior art is `nana-setup/lib/steps.mjs:841`, with its fallback to the relative form.
   - The main-checkout key then has the same producer as pi-review's linked-worktree key.
   - All the land test runners pass git calls through unchanged, so nothing breaks there.
   - An `--out` typed through the firmlink spelling stays a residual that exists today.
2. **Use one path function on both sides of each compare.** R1 (`review-round:161`, root) and P2 (`pi-review:72`) stay on JS realpath while realOut moves to native.
   - If git's top ever differs from native (a subst or mapped drive), relUnder reads a tracked `--out` as outside, and the review overwrites it. That would be a new fail-open.
   - Inferred: I believe Git for Windows' `mingw_getcwd` uses GetFinalPathNameByHandle, so the two would agree. I have not verified this.
   - Routing both sites through `realPath(…, {mustExist:true})` changes nothing on macOS (git's top already equals native), and it removes the dependence on git's spelling.
3. **Keep the fallback in P3.**
   - The prototype's `canonicalPath = realPath(path)` drops the try/catch. Any registered worktree whose path fails with EACCES or ELOOP then makes every pi-review refuse; today it falls back to `resolve`.
   - Guard P5's per-line `realPath` the same way.
4. **GP7 should add a leg for a review still in flight.** Admit with `--tree <S of M>` and do not complete; runLand should then refuse with `/review in flight/`. This is R-1006's land wrongly allowed under a split key (inventory N2(b)). M1 and M6 turn it red.
5. **R-1352 says "under either spelling".** The test checks only `--repo <S>`. Add `--repo <canonical>`, which should print 3 lines, or narrow the row.
6. **GP2 does not give R-725 a test.** It runs only the other spellings and carries the R-1351 marker. Either add a canonical leg with an R-725 marker or drop the claim.
7. **Fix a wrong claim in §4:** it says the case flip turns M10 red on Windows, but GP5 is skipped there. MUST 2 fixes this.
8. **runCleanup should pass `registeredPath` to `git worktree remove`** and print that path. Otherwise an 8.3 or case-flipped argument that git fails to match on Windows refuses after the equality check has passed. This also fixes the cosmetic residual.
9. **The prototype and the plan disagree.** `gpprobe/pack/lib/real-path.mjs` has no fallback to JS realpath on other native errors. The brief should say which version is wanted.

**Amended plan**

§1. Keep `realPath` (native, with a fallback for missing folders). Build the key as `git:` + `realPath(git rev-parse --path-format=absolute --git-common-dir)`, falling back to the relative form when git rejects the flag. Use it in treeScope, nana-land (both sides) and the report. Add `gitPathKey`, which applies NFC on darwin only. R1 and P2 go through `realPath` too, so no compare mixes two path functions. Correct the README text and the Unicode limit.

§2. The sites table as written, plus four changes:
- R1 :161 and P2 :72 move to `realPath`.
- `gitPathKey` goes on both sides of the workingState skip and of the copySnapshot compare.
- P3 and P5 keep a try/catch that falls back to `resolve`.
- runCleanup removes and prints `registeredPath`.

§3. Add a darwin `nfd` kind to `otherSpellings`: a subfolder created in NFD, reached by the NFC-typed path, and the reverse. GP2 runs it for pi-review and review-ledger run. Add a darwin firmlink kind to GP3, used when `/System/Volumes/Data` + the path exists. GP5 uses the lock setup on every platform and drops the git shim and the Windows skip; widen R-1354 to "spelled differently (slash direction, a link)". Also add GP7's in-flight leg, GP3's canonical report check, and GP2's canonical leg with the R-725 marker (or drop that claim).

§4. Add M14 (skip without `gitPathKey`, so GP2-nfd turns red) and M15 (copySnapshot without `gitPathKey`, so the checkout listing turns red); both are confirmed. M1, M5 and M6 also turn the GP3 firmlink leg red on darwin. M10 is now measured on Windows through slash direction. R1 and P2 get no wrong-code pair: on macOS the change is invisible, so they are recorded as a hedge.

§5. Remove the Unicode limit claim, which this attack disproves. Add as residuals:
- the firmlink-typed `--out` (a residual that exists today);
- the locked dead checkout that blocks reclaim (exists today);
- whether Git for Windows' getcwd uses GetFinalPathNameByHandle (inferred; it decides whether SHOULD 2 is a fix or a hedge).

Probes are in `<seat-scratch>/adv/`. The nana-pi tree is unchanged and clean at 2eb0cb8.