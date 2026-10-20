# Review round 2 — lane-guard-temp-root (a temp folder setting that names a drive root, the home folder or a folder above home no longer opens that place to lane writes), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Round 1 reviewed `9ae497d8`. Claude Opus 5.5 (the final reviewer) said LAND 9/10 with SHOULD 1 (the pack README overstated the `/tmp` rule) and NOTE 5 (R-2271's link sat in a recursively deleted fixture). pi gpt-6-astra (the land reviewer) said SEND-BACK with two MUSTs: (1) on macOS, home typed through its data-volume firmlink spelling (`/System/Volumes/Data` + home) still opened home to lane writes, reproduced; (2) R-2272 passed with the feature removed. This round reviews what changed since: `git diff 9ae497d8..HEAD` on `feat/lane-guard-temp-root`.

- `1d9ba683` is build 3 (`build-brief-3.md`, the same Claude Sonnet 5 builder). `isExcludedTempRoot` in `packages/nana-pack/lib/gate-temp-roots.ts` now keeps the root clause, then excludes a candidate whose `stat` dev and inode equal those of home or of any folder on home's path to the root; only when a stat fails does it fall back to the text test `within(t, home)`. It never throws. R-2271's check in `packages/nana-pack/tests/lane-write-guard.test.mjs` gains a data-volume sub-case (runs where that spelling is the same directory as the fixture home, a real SKIP line elsewhere) and its folder link moves into an unmanaged temp root; R-2272's check keeps its handler-level checks and now also calls `acceptedTempRoots` directly (keeps a temp folder inside home, drops home itself). The pack README's sentence now says `/tmp` on macOS and Linux is a separate rule that counts regardless. The code map is regenerated.
- `9eba5d11` is the seat's pairs on 1d9ba683 (`seat-mutate.mjs`, record `seat-mutate-output-1d9ba683.txt`): 13 of 17 red, every red pair exactly its named titles. P1 to P4 are re-anchored on the new body; new P15 (build 2's text-only home test) and P16 (identity compared with home only, not the folders above it) turn R-2271 red. P5, P9, P11 and P17 survive, declared in the table: identity reads the same through any spelling, so P5 (exclusion judged on unresolved strings) and P9 (home as typed) change a decision only when a stat fails; P17 drops the stat-failure fallback, which no check reaches (a carried test gap); P11 as before.
- `4f546eff`, `0e01856e` and `efae8750` merge main as it moved during this round: `5ef07f7f` (objective-path-shapes), `2cc63e65` (linked-claude-folder-remedy) and `edabe12f` (the win-pi-launch-orphan land tip, which carries doctor-path-row-remedy and win-copy-backup-noise; those three lanes land by fast-forward before this one). Review each as `git show --remerge-diff <merge>`; the seat's merge helper kept both sides' HANDOFF and session lines and regenerated the tree and code map. This lane's own change is `git diff edabe12f...HEAD`.
- `ce821731` is build brief 4 and `13d5bc1a` is build 4 (one test import line split in two).
- The seat's notes commit (the commits that add and fill this brief): `build-brief-3.md`, `seat-verify-1d9ba683.md`, HANDOFF (the Landed line covers build 3; the plan's firmlink line goes; the pairs line gains P17; two new final-review lines for `/tmp` and a drive-relative Windows TEMP), the session entry, and these briefs.

CI: run 39447368542 at 1d9ba683 (build 3) failed one check on every leg, R-917's source check in `test-runner.test.mjs`, because build 3 imported `tmpDir` and `tmpDirUnmanaged` on one line; nothing else failed (macOS 187 PASS of 190 files, Ubuntu 186 PASS, Windows 171 PASS with 18 SKIP; `ci-windows-1d9ba683.log`). On Windows lane-write-guard passes 17, its one skip the data-volume sub-case. Build 4 (`13d5bc1a`, `build-brief-4.md`) splits that import into two lines and changes nothing else; CI run 39450318515 on it read Ubuntu 189 PASS, 0 FAIL, 3 SKIP of 192 files when this brief was written, with macOS and Windows still running. The seat's record is `seat-verify-1d9ba683.md`. The land runs the locked suite on the reviewed tip.

The Windows-only pairs and the independent check ran on build 1 (350f9ce0) and were not re-run on build 3. CI's Windows leg did run build 3's identity test: R-2270's second-drive case and R-2271 to R-2273 pass there (`fs.statSync(..., { bigint: true })` gives the volume serial and file index on NTFS).

Tree movement (`node scripts/requirements-moved.mjs --root . --base edabe12f`, at the merged tip):

```
tree movement edabe12..efae875: 6 rows in 1 features
FEAT-006 · Launch builders with execution limits
  R-1430 text changed
  R-1431 text changed
  R-2270 new (implemented)
  R-2271 new (implemented)
  R-2272 new (implemented)
  R-2273 new (implemented)
```

Threat model: honest variation in our tools' output and the OS is in scope (temp variables and their spellings, firmlinks, links, letter case, 8.3 short names, the home location, TEMP and TMP on Windows); deliberate forgery is out. The guard is advisory by load path.
Lane class: install, hook or gate — the pi extension nana-gate's lane write guard, plus the shared `lib/gate-temp-roots.ts`.

Check: (1) round 1's two MUSTs are fixed: home and every folder above it, in any honest spelling including the macOS data-volume one, now open nothing outside the lane, and R-2272 fails with the feature removed; (2) no fail-open in the new identity path: a failed stat, an unreadable folder on home's path, or a stat error never leaves home or a folder above it writable when the text test would have excluded it, and nothing throws; (3) nothing round 1 accepted stopped working: a temp folder inside home (Windows' default), `/tmp` on macOS and Linux, the ordinary layout, temp and lane spellings, and a session with no NANA_WORKTREE_ROOT; (4) the tests write only inside the temp folders and fixtures they own, and the new unmanaged link root is removed without following the link; (5) the README sentence, HANDOFF and the session entry are true about build 3; (6) the three merges of main keep both sides, with nothing lost or doubled; (7) any MUST.

This is a confirmation round on the final tip after fixes to named findings and a merge of current main.
