# win-review-paths — the land and review tools treat two spellings of one folder as one folder (W7c of the Windows fixes, 2026-10-18)

**The feature.** A folder can be spelled more than one way: another letter case (macOS and Windows), a Windows 8.3 short
name, a link, a `\\?\` prefix, or (macOS) another Unicode form. Git prints one canonical spelling; the land and review
tools take the other operand from a flag, the cwd or the temp folder through JS `realpathSync`, which keeps the typed
spelling. On Windows CI's short temp path (`RUNNER~1`) this breaks five behaviours, and the same code breaks on macOS
for a wrongly cased typed path (confirmed by probe):
- a tracked `--out` is not refused, and the review overwrites it (R-724);
- one repository gets two ledger keys, so the round cap resets (R-705);
- a non-LAND verdict recorded under the other key is invisible to `nana-land`, which then merges — **a live fail-open
  today** (R-1006);
- a dead review checkout is never reclaimed (R-967);
- `nana-land` refuses a real land because `--tree` and `--main` look like two repositories, and cleanup refuses a real
  worktree (R-1009, R-979).

After this lane each tool compares and keys folders through one canonical-path function, and the fail-open closes.

**Lane class: gate** — it changes `nana-land`, `pi-review`, `review-round` and `review-ledger`. Two final reviewers (the
roster's reviewer and land reviewer), the seat's wrong-code pairs through the shared mutation runner, and one
independent check. Threat model: honest variation in how the OS, git and the user spell a folder is in scope; deliberate
forgery (a hostile link planted to alias two repositories) is out, and any finding there is a residual.

**Design** (the seat's plan, `plan-design.md` and `plan-attack.md` here, amended by the attack):
- New `packages/nana-pack/lib/real-path.mjs` exports `realPath(p, { mustExist = false })`: `fs.realpathSync.native` of
  `path.resolve(p)` on every platform. A missing path canonicalizes its deepest existing folder and appends the rest; any
  other native error falls back to `fs.realpathSync` (today's result). No case folding.
- `gitPathKey(s)`: NFC on darwin, identity elsewhere, applied on both sides of the in-tree `--out` skip and the
  checkout's exclusion compare (APFS stores NFD names that git lists in NFC).
- One key builder, `repoKeyOf`, exported from `review-round.mjs`: `git:` plus `realPath` of
  `git rev-parse --path-format=absolute --git-common-dir` (falling back to the relative form when git rejects the
  flag). The ledger key, `nana-land`'s key and common-dir check, and the report's `--repo` key all call it.
- Every site in `plan-inventory.md` that compares a typed or temp path with a git path goes through `realPath` on both
  sides, including the review root and `pi-review`'s source root; reclaim and the cleanup check keep a fallback to
  `resolve` on an unreadable entry; cleanup removes and prints git's registered path.

## Must-meet tests (one new file, `packages/nana-pack/tests/path-spelling.test.mjs`; one row each)

The test builds each second spelling itself (`otherSpellings`): a letter-case flip (and drive-letter flip on win32),
used only where the volume is case-insensitive, else a printed SKIP; on win32 the 8.3 short name through the
FileSystemObject, used only where one exists, else a printed SKIP; a link (a symlink on POSIX, a junction on win32); on
win32 a `\\?\` prefix (GP1 only); on darwin an NFD-stored folder reached by its NFC spelling and the reverse. Each check
runs every available spelling and prints the kind and both paths.

- **GP1 (R-1350).** WHEN `--out` names a tracked file of the reviewed tree through a second spelling of a folder on its path (another letter case, an 8.3 short name, a link, a `\\?\` prefix or another Unicode form), review-ledger run, review-ledger check and pi-review shall refuse it before the review runs, leaving the file byte-identical and nothing reserved or counted.
- **GP2 (R-1351).** WHEN `--out` names an untracked, non-ignored file inside the reviewed tree through a second spelling of a folder on its path, pi-review and review-ledger run shall warn that it is in the tree, run the review and leave the file out of the review's snapshot and out of pi-review's review checkout, so a tree otherwise equal to HEAD records the bare HEAD sha.
- **GP3 (R-1352).** WHEN one repository is reviewed through two spellings of its folder (the launcher's cwd and `--tree`), review-ledger run, pi-review and review-ledger report `--repo` shall use one repository key, `git:` plus the canonical path of its git common dir, so the round cap counts both spellings as one item and the report prints that item's rounds under either spelling.
- **GP4 (R-1353).** WHEN a registered `nana-review-<pid>-` checkout and the temp folder are spelled differently, pi-review shall reclaim that checkout at startup when its owning pid is dead.
- **GP5 (R-1354).** WHEN pi-review's own review checkout registration remains after its cleanup and git and the temp folder spell that checkout differently (slash direction, a link), pi-review shall report the remaining registration and exit 1. (Setup on every platform: the fake pi locks its own worktree, so removal fails and the registration stays; the test unlocks and prunes afterwards.)
- **GP6 (R-1355).** WHEN `--tree`, `--main` or a cleanup worktree is named through a second spelling of its folder, the land merge and cleanup commands shall treat it as the folder git registered, so merge finds one git common dir and the LAND rounds recorded for that repository, and cleanup matches the worktree to its registration.
- **GP7 (R-1356).** IF a non-LAND verdict for a named reviewed revision, or a review still in flight, was recorded through a second spelling of the repository's folder, THEN the land merge command shall refuse without merging.

## Evidence (no row)

- **GP8.** macOS: every existing test file's PASS/FAIL/SKIP counts equal the counts captured on the base before the
  build; `path-spelling` shows no FAIL. Windows CI with the short temp path kept: `land` passes 51 of 51 (its test-only
  Windows fixes move here from the review-tools lane); every check the review-tools lane left failing for the short
  path in `immutable-review` and `review-ledger` now passes; `path-spelling` passes, each SKIP printing its reason.
  Linux CI: the case spelling skips with its reason; the link spelling runs.

## Known limits

Network and `subst` drives (native and git may spell them differently; inferred fail-closed). An item in flight on a
Windows seat whose key came from a short or wrongly cased main checkout restarts its round count once, and a LAND
recorded under the old key needs a re-review. While an orphaned detached pi holds a dead review checkout on Windows,
reclaim refuses every pi-review on that repo until the orphan exits. A firmlink-typed `--out` on macOS
(`/System/Volumes/Data/...`) stays as today. R-708 on Windows (the exec bit and autocrlf make a clean checkout read
dirty) is the next gate lane's.
