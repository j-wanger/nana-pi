# Seat audit of build 1 — win-review-paths at 4c4afa5 (2026-10-18)

Three read-only lens audits (fail-open, must-meet strength, macOS regression) and one critic. The critic's confirmed list counts.

## text

VERDICT: DONE

Commit 4c4afa5 pushed to origin/feat/win-review-paths: new `packages/nana-pack/lib/real-path.mjs`, fixes in `review-round.mjs`, `nana-land.mjs`, `review-ledger.mjs`, `pi-review.mjs`, new `tests/path-spelling.test.mjs`, edits to `tests/land.test.mjs`.
New file: path-spelling.test.mjs 9/9 pass macOS; ran against unchanged code first — all 9 checks failed for the intended bug (output saved under the OS temp dir) — then green after the fix.
macOS counts, baseline -> now (all unchanged): land 51->51, immutable-review 17->17, review-ledger 155->155, review-round 33->33, worker-lane 52->52.
Sites changed: review-round.mjs treeScope/repoKeyOf/realOut/workingState's --out skip; nana-land.mjs N1/N2 key+compare, N3 cleanup compare, runCleanup's git-worktree-remove argument; review-ledger.mjs report --repo key; pi-review.mjs sourceRoot, reclaim, cleanup check (tempRootReal), realOut for outputRelative/copySnapshot exclude plus gitPathKey.
land.test.mjs: moved the review-tools-lane's Windows-portability fixes here (core.autocrlf false, fileURLToPath repo-root, quoted suite/node-e strings) and updated the one cleanup assertion the new registered-path behavior makes false.
Flipped R-1350 through R-1356 planned -> implemented in REQUIREMENTS.md with the GP tests as evidence; README's item-key paragraph updated to name the native real path; map, map:check, requirements-trace and readme-check all exit 0 (requirement-rows.test.mjs re-verified 5/5 after the flip).
Not provable on macOS: the `\\?\` prefix leg, the 8.3 short-name leg, and win32 drive-letter case — all win32-only paths in the test, each gated with a printed SKIP reason.
Claim most likely wrong on Windows: that `git rev-parse --path-format=absolute` always prints the drive letter in the same case native realpath does — inferred, carried as the design's own residual.
Not done (per the brief, the seat's next step): wrong-code pairs, the independent check, a draft PR, and reading the Windows CI leg.

## text

MUST: 2

MUST 1. GP7 (R-1356) stays green when the fix is removed. The fail-open it was written to pin is still unpinned.
- Where: packages/nana-pack/tests/path-spelling.test.mjs:408 (`otherSpellings(canonicalFeature, "GP7")`), and the two `admit(... --tree spelled ...)` legs below it.
- Cause: the test spells the LINKED feature worktree. From a linked worktree, git prints the common dir as an absolute path in its own spelling, whatever the cwd's spelling is. So the old code already builds the same key, and the check cannot tell the two versions apart. The plan (plan-design §3 GP7, plan-attack SHOULD 4) spells the MAIN checkout, detached at the tip, where git prints a relative `.git`.
- Probe 1, the git output:
  - `<tmp>/GP-PROBE-x/FEAT` prints `--git-common-dir` as `/…/gp-probe-x/m/.git`.
  - `<tmp>/GP-PROBE-x/M` prints `.git`.
- Probe 2, the new test file run against the old code (the four changed bins replaced by their fe03b6e versions, in a copy under $TMPDIR):
  - with every spelling kind: `PASS GP7 …` (8 FAILED, GP7 the only PASS);
  - with only the case kind: `PASS GP7`;
  - with only the link kind: `PASS GP7`.
  - This contradicts the builder's "all 9 checks failed" on the unchanged code.
- Probe 3, GP7 as the plan wrote it (`gp7-main-probe.mjs`: main checkout detached at the tip, then admit through a spelling of it):
  - old code, case: `case/non-LAND … land code=0 main moved=true` and `case/in-flight … land code=0 main moved=true`. That is the live fail-open.
  - new code: all four legs give `land code=1 main moved=false`, with "non-LAND verdict" or "review in flight".
  - The code fix is correct. Only the test misses it.
- Fix: in both legs, record the SEND-BACK and the in-flight admission through a second spelling of the main checkout, as the plan says.

MUST 2. Spelling kinds that R-1350 and the must-meet require are missing, and the builder's report says otherwise.
- Where: path-spelling.test.mjs:102-117. `otherSpellings` builds only "case" (:107) and "link" (:115).
- Missing:
  - no 8.3 short-name kind, which must-meet and build brief 1 require on win32 for every GP;
  - no `\\?\` kind for GP1, which the design leaves to measure its unverified "libuv strips `\\?\`" claim;
  - no NFD kind in GP1, though R-1350's text names "another Unicode form".
- The builder's report says these legs are "each gated with a printed SKIP reason". A grep for `8.3|short|\\?\|SKIP` finds only the case and link SKIP lines and the header comment. No such legs exist.
- Why it matters: the 8.3 name (RUNNER~1) is the bug this lane exists to fix, and on Windows the remaining kinds cannot replace it.
  - `path.win32.relative` ignores case (probe: `relative("C:\\Users\\RUNNER~1\\T\\repo", "c:\\users\\runner~1\\t\\REPO\\x.md")` gives `"x.md"`). A case flip therefore cannot turn relUnder or reclaim red on the old code.
  - A junction is resolved by JS realpathSync too (inferred).
  - So on Windows, GP1, GP2's ledger half and GP4 have no spelling kind that fails on the old code (inferred).
- R-1350 claims coverage of the 8.3 name, the `\\?\` prefix and the Unicode form, which the test never runs. The row is wider than its test.
- Fix: add the 8.3 kind through FileSystemObject, as win32-launch.test.mjs:310-337 does, plus the GP1 `\\?\` kind. Or narrow R-1350 and record the 8.3 and `\\?\` legs as violated residuals on Windows.

Per GP: old code red? Which kinds ran on macOS?
Method: the new file and a per-kind filtered copy, run against a $TMPDIR copy of the pack with the four bins reverted to fe03b6e. Logs are in /var/folders/lg/h9m6nvvd2_9d7s3hyjvdlqxr0000gn/T/gp-audit-35058/.
- New code, all kinds: 9/9 PASS in 3:19, no SKIP.

| Check | Row | Red on old code | Kinds run on macOS | Which kinds turn the old code red |
|---|---|---|---|---|
| GP1 | R-1350 | yes | case, link | case only |
| GP2 | R-1351 | yes | case, link, nfd-via-nfc, nfc-via-nfd | case, link (pi-review half, +snap), nfc-via-nfd; nfd-via-nfc passes on old code (expected: it guards the native-realpath regression) |
| GP3 | R-1352 | yes | case, link | case only |
| GP4 | R-1353 | yes | case, link | case only |
| GP5 | R-1354 | yes | case, link | link only |
| GP6(i) | R-1355 | yes | case, link | case only |
| GP6(ii) | R-1355 | yes | case, link | case only |
| GP6(iii) | R-1355 | yes | main case+feature case, main link+feature case | case; a link-spelled worktree never runs |
| GP7 | R-1356 | NO | case, link | none (MUST 1) |

Every check has its `req:` marker directly above the `check(` call (lines 129, 180, 227, 268, 298, 338, 359, 376, 409).

GP5 does hold a locked registration on every platform, with no Windows skip.
- The fake pi runs `git worktree lock` on its own cwd: a sh stub on POSIX, `writeFakePi` on win32. pi-watchdog spawns pi with `cwd: tempRoot`.
- The check pins "worktree registration remains" with exit 1.
- If the lock silently fails, the check goes red, not vacuous.

SHOULD
1. Every check passes on the old code when no spelling kind is available. path-spelling.test.mjs has no `spellings.length > 0` guard.
   - Probe: ONLY_KIND=none on the old code gives 9/9 PASS, "all passed", exit 0.
   - On Linux, only the link kind runs (inferred from the macOS link-only run). There GP1, GP3, GP4, GP6(i), GP6(ii), GP6(iii) and GP7 all pass on the old code; only GP2 and GP5 have power.
2. GP6(iii) (:385-390) uses the first worktree spelling and then `break`s. On macOS and Windows, a link-spelled cleanup worktree is never run, so the check does not run every available kind.
3. plan-attack §3 asked for a darwin firmlink kind in GP3 (`/System/Volumes/Data` + path). It was not added, so GP3's power on the old code rests on the case kind alone.

NOTE
1. `repoKeyOf` (review-round.mjs:157-161) falls back only when git exits nonzero. Inferred: git older than 2.31 echoes the unknown `--path-format=absolute` and exits 0. The stdout would then be `--path-format=absolute\n.git`, `realPath(mustExist)` throws, and every admission is refused (fails closed). nana-setup steps.mjs:841 has the same pattern. git here is 2.50.1, so this is not verified.
2. `runLand` now builds the repo key with `repoKeyOf`, which calls spawnSync directly. The injected `runGit` no longer sees the common-dir calls. No current test depends on that, and land.test still passes 51.
3. GP6(iii) checks that the worktree folder is gone but not that the branch was deleted, which the plan named.
4. GP1's NFD case works on both the old and new code (probe `gp1-nfd-probe.mjs`: typed NFC and typed NFD are both refused with "TRACKED file"). The missing kind is coverage only, not a regression.
5. The land.test.mjs cleanup assertion moved from `feature` to `realpathSync.native(feature)`. This pins the new remove-by-registered-path behaviour; it is not a weakening.
6. The worktree is untouched (`git status` is clean). The probe copies were deleted; only the logs and the two probe scripts remain in the temp folder above.

## text

MUST: 1

MUST 1. A tracked `--out` is now overwritten when its on-disk letter case differs from git's index. The base refuses the same command.
- Where: `packages/nana-pack/bin/review-round.mjs:267` (`realOut` now calls the native `realPath`), which feeds `outInTree` at `review-round.mjs:538-540`.
  - `relGit` now carries the on-disk case.
  - It is matched case-sensitively against the index with `git --literal-pathspecs ls-files/ls-tree -- relGit`.
  - Before, JS `realpathSync` kept the typed spelling, so an `--out` typed the way git lists it matched the index and was refused.
  - Now no spelling of that path is refused.
- Who hits it: `review-ledger run` overwrites the file. `review-ledger check` reports the review as admissible with exit 0. `pi-review` still refuses, but only by accident: it fails with "dirty snapshot could not be reproduced", and the file is untouched.
- Why it is in scope: the case mismatch comes from an ordinary macOS branch switch, which is honest variation. The same class applies on Windows NTFS, where native resolution returns the on-disk case.
- Harms: a tracked file is overwritten (R-724), and this is something main refuses today.
- Probe (OS temp; script `.../scratchpad/fo/p1c.sh`):
  - Setup: repo with `Docs/review.md` committed and `.DS_Store` ignored. A branch does `git mv Docs tmpd; git mv tmpd docs`. Then `echo x > docs/.DS_Store; git checkout -q main`.
  - State: on disk `docs/`, index `Docs/review.md`, `git status` clean.
  - Command: `--out "$R/$(git ls-files Docs/review.md)"`, typed exactly as git lists it.
  - Results:
    ```
    base: TRACKED file   run exit=1   content: KEEP           status after: []
    new:  review written to   run exit=1   content: VERDICT: LAND   status after: [ M Docs/review.md]
    ```
  - A synthetic case divergence of the folder or of the file (`p1.sh`) gives the same result. For check, the base exits 1 with TRACKED; the new code exits 0 with "next review … would be round 1/3" and a WARNING.
  - Same setup through pi-review (`p1b.sh`): base refuses with TRACKED; new refuses with "dirty snapshot could not be reproduced"; the file stays KEEP.
- Test gap: GP1 changes the spelling of the repository folder only. No leg covers a case mismatch between the disk and the index inside the tree, so the new file stays green.
- Fix options, verified on this Mac:
  - `git ls-files -- ':(icase,literal)docs/review.md'` returns `Docs/review.md`.
  - `ls-tree` rejects the icase magic, and `--literal-pathspecs` cannot be combined with `--icase-pathspecs`.
  - So: either compare file identity (dev/ino of the realOut target against lstat of each tracked path, as `inTreeRedirect` does), or also refuse when today's typed-spelling `relGit` is tracked.

SHOULD / NOTE
1. NOTE: no persisted ledger key changes for a path taken from the cwd on this Mac (computed only; `~/.pi` was read, never written).
   - The old formula and `repoKeyOf` give the same key for all 28 repositories under the home folder. They also agree from subfolders and from the three linked worktrees.
   - The real ledger holds only canonical keys for this Mac's repositories (`git:~/{five repositories}/.git`). Each recomputes SAME. One stale `git:` row points at an old scratch repo in the temp folder; it was not recomputed.
   - A key changes only for a `--tree` of a main checkout typed in the wrong case (`~/NANA-PI`) or through the firmlink (`/System/Volumes/Data/...`). The old key was the split one; the new key is canonical.
   - A linked worktree typed in the wrong case was already SAME on the base.
2. NOTE: on a case-sensitive APFS image (hdiutil, in temp), `Repo` and `repo` keep separate keys. Base and new behave the same:
   - `nana-land --tree Repo-wt --main repo` refuses with "must share one git repository".
   - A LAND recorded in the lowercase clone for the same tip does not authorize the land in `Repo` ("no verified version-2 LAND").
   - A `--main` typed `REPO` (missing) refuses.
   - Separate NFC and NFD folders cannot be created on case-sensitive APFS or on macOS exFAT (EEXIST). So `gitPathKey`'s NFC fold merges no two distinct folders on local macOS volumes.
3. NOTE: links into another repository behave the same on base and new (`p4.sh`, `p5.mjs`):
   - `--tree` in repo A with `--main` linked to B, and the reverse, are refused.
   - A LAND recorded in clone B does not authorize A.
   - A tracked `--out` in A reached through a link inside B is refused as TRACKED.
   - An `--out` into B's tracked file, directly or through a link inside A, is allowed and overwrites it in both versions. This was already true before the lane and is outside R-724, which covers only the reviewed tree.
4. NOTE: tracked files in an NFD-stored folder are still refused in both typed forms, on base and new (`p7.mjs`). Git's precompose handles the pathspec.
5. NOTE: `realPath` with `mustExist: true` returns the unresolved path on a non-missing error such as ELOOP or EACCES (`lib/real-path.mjs:58`) instead of throwing, as the old code did.
   - Probe: `--out repo/loop/x.md`, where `loop` links to itself. The base refused with ELOOP. The new code still refuses, but through a git `check-ignore` fatal error. No harm, but the message is less clear.
   - `runCleanup`'s "missing or unavailable" branch has the same gap and is backstopped by git.
6. NOTE: `runLand`'s repository check now calls `repoKeyOf`, which spawns git directly instead of using the injected `runGit`. A test that injects `runGit` can no longer simulate that check. This is behavior-neutral in production.
7. NOTE: the new reclaim and registration checks only widen matching to the same folder. I found no case where a live checkout or another repository's worktree is reclaimed: the pid check and the `git worktree list` of the source repository bound it.
8. Writes: the path-spelling test passed 9 of 9 under a fake HOME, and the fake HOME stayed empty. Every write goes under its tmpDir root, and in-process `admit`/`complete`/`runLand` pass an isolated home. The land test changes write only in temp. The worktree is clean at 4c4afa5 after all probes. Both disk images were detached.

Probe scripts and output are in `<seat-scratch>/fo/` (base and new pack copies were extracted with `git archive`).

## text

MUST: 2

MUST 1. An existing test file now fails. The full suite goes red, so the land is blocked, and R-1106's evidence no longer runs.
- Where: packages/nana-pack/tests/review-standard.test.mjs:69. The test copies `bin/` plus a fixed list of three lib files into a pack copy. pi-review.mjs:33 and review-round.mjs now also import `../lib/real-path.mjs`, which is not on that list.
- Probe: `npm test -- packages/nana-pack/tests/review-standard.test.mjs`
  - Result: `FAIL ... 3 pass, 4 fail`. Baseline: `7 pass`.
  - Error: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../review-standard-GbywEi/pack-copy/lib/real-path.mjs' imported from .../pack-copy/bin/pi-review.mjs`
- Checks that fail: the control check, plus the three R-1106 evidence checks: missing, directory and blank review standard refused before admission.
- The builder's GP8 claim does not hold. They compared only five files with the baseline, not every existing file.
- Fix: add `"real-path.mjs"` to the list at :69, and to the `@inputs` header at :4.

MUST 2. The must-meet's 8.3 short-name spelling and `\\?\` spelling are missing from the new test. The builder's report says both are there behind SKIP lines; neither is.
- Where: packages/nana-pack/tests/path-spelling.test.mjs:102-117. `otherSpellings` builds only a case flip (plus a drive-letter flip on win32) and a link. `grep -i "8\.3\|FileSystemObject\|namespaced"` finds the 8.3 wording only in the header at :4, and the only SKIP lines are for case and link (:108, :116).
- What required them:
  - must-meet.md:38: the 8.3 name on win32 through FileSystemObject, else a printed SKIP; `\\?\` on win32 for GP1.
  - plan-design.md:95-99 and the build brief.
- :28 resolves the test's own temp root to its long name. So on Windows CI the RUNNER~1 short path, which this lane exists to fix, never reaches any check.
- Effect on Windows (inferred, not run):
  - plan-design §4 says the 8.3 spelling is what turns M7, M8, M9 and M11 red on Windows. `path.win32.relative` ignores case, and JS realpathSync follows junctions.
  - So GP1, GP2 and GP4 would likely pass on Windows with those sites reverted.
  - The `\\?\` leg is the design's only measure of its no-strip decision (plan-design:27, :227), so that decision can never be checked.
- Status problem: R-1350 (REQUIREMENTS.md:472) is now `implemented` and names 8.3, `\\?\` and Unicode-form spellings. GP1 runs none of them; the NFD kinds are only in GP2. The row is wider than its test.
- My probe shows head does refuse a tracked `--out` typed in NFC or NFD under an NFD-stored folder, for both review-ledger run and pi-review, and the file stays `keep\n`. So the Unicode claim holds on macOS, but no test pins it.

SHOULD / NOTE

- SHOULD: pi-review now crashes with a stack trace on an ENOTDIR `--out`. Before, it refused cleanly.
  - Where: bin/pi-review.mjs:71 calls `treeScope(sourceTree, {exclude:[outPath]})` at top level, outside the try. workingState now calls `realOut(x)` (review-round.mjs:223), which throws ENOTDIR.
  - Probe with `--out <repo>/base.txt/out.md`:
    - base: `pi-review: ENOTDIR: not a directory, lstat ...`, exit 1.
    - head: an uncaught `node:fs:2853 return binding.realpath(` stack through `workingState ... pi-review.mjs:71:21`, exit 1.
  - No reservation either way, so nothing is lost.

- SHOULD: real-path.mjs:58 (and :32) differs from the design.
  - The design says that on any other native error, realPath returns `fs.realpathSync(abs)`, today's result, which throws.
  - The code catches that throw and returns `abs`. With `mustExist`, ELOOP and EACCES no longer throw from `realOut`.
  - Probe with an untracked symlink-loop `--out` in the tree:
    - base: review-ledger run refused before admission with `ELOOP`.
    - head: `admitted as round 1/3`, ran the review command, then `cannot write ... ELOOP ... reservation returned`. The reviewer ran and its output was dropped.
  - pi-review still refuses on head, through the nested-repo lstat.
  - This needs a symlink loop at the `--out` path, so it is an edge case.

- SHOULD: land.test.mjs:491/:499 will likely fail on Windows, which breaks GP8's "land 51 of 51" there.
  - The new assertion compares git's `worktree remove` argument with `realpathSync.native(feature)`, which uses backslashes on win32.
  - runCleanup passes git's registered path. Windows CI logs in docs/reviews show porcelain prints forward slashes (`worktree C:/Users/runneradmin/AppData/Local/Temp/...`).
  - The code itself is fine on Windows; only the assertion is wrong. Capture the registered path from `git worktree list --porcelain` instead. Inferred; not run on Windows.

- SHOULD: the firmlink spelling from the attack's amended §3 is not in GP3, so `--path-format=absolute` in `repoKeyOf` has no test.
  - Mutation: I reduced review-round.mjs:158 to `[['--git-common-dir']]` in a scratch copy of the pack. All 9 path-spelling checks still PASS.
  - Key probe on this machine: `--tree /System/Volumes/Data<repo>` gives `git:/System/Volumes/Data/.../.git` on base and `git:<repo>/.git` on head. The fix is real but nothing guards it.

- SHOULD: a check passes even when it runs no spelling.
  - If `otherSpellings` returns nothing (case-sensitive volume and link creation failed), each GP check loops zero times and prints PASS. It should SKIP.
  - Also, GP6(iii) uses only the first feature spelling, because of the `break`. On macOS the cleanup worktree is never named through the link.

- SHOULD: the README does not declare the Windows upgrade cost where the reader looks for it.
  - The cost: an item whose key came from a short or wrong-case main checkout restarts its round count once, and a LAND under the old key needs a re-review.
  - It appears only in must-meet.md and plan-design. AGENTS.md says contract changes go in the pack README.
  - The firmlink-typed `--out` residual is also unstated. My probe shows head and base both overwrite tracked.md and exit 0 for pi-review there, so this is not a regression.

- NOTE: README and readme check are fine.
  - The new "native real path ... two spellings of one folder share the item" sentence (README:99-101) does not contradict any other README claim.
  - `npm run readme:check`: 686 claims, 0 problems. `map:check`: 0 problems. Requirements trace: 1220 rows, 0 problems.
  - The REQUIREMENTS diff only changes status and evidence; no row wording changed.

- NOTE: for an in-tree untracked symlink `--out` pointing outside the tree, pi-review's revision changes.
  - base: bare HEAD, and the link is not in the checkout.
  - head: `+snap`, and the review checkout contains `out-link.md`.
  - head now matches review-ledger run, which was already `+snap` on base. A land naming the bare SHA would refuse, so this fails closed.

- NOTE: runLand's repo check (nana-land.mjs:70-71) now runs git directly through `repoKeyOf`, so the injected `runGit` no longer covers it. land.test still passes.
  - Two smaller points: `repoKeyOf`'s error drops git's stderr, while the README says "refuses admission with git's error", and nana-land refusals now say "admission refused".

- NOTE: site table versus the diff. Every named site changed, and nothing beyond the table and the attack's additions changed.
  - Named in the table: R2, R3, realOut, N1/N2, N3, L1, P3 (try/catch kept), P5 (fallbacks), P6/P7.
  - Attack additions: R1 :161 and P2 :72 now use realPath; gitPathKey sits on both sides of the skip and copySnapshot compares; runCleanup removes and prints the registered path.
  - The only unlisted change is an implementation detail: treeScope dropped `--git-common-dir` from its rev-parse call.
  - real-path.mjs exports two functions with different purposes (realPath, gitPathKey), which strains the one-purpose rule.

- NOTE: land.test's Windows fixes are all present.
  - autocrlf false is set in `repo()` before the first commit (:27). :499 uses `fileURLToPath`.
  - No single-quoted `node -e` is left. Every executed `suite: "true"` is replaced, which is more sites than the three the cut list named; this is harmless. The three left at :555-557 are parse-only.
  - No existing test's temp root was resolved to its long name. `realpathSync.native` appears only as the expected value at :491, and tmp-dir.mjs is unchanged.

- NOTE: path-spelling runs about 200s on macOS against the 300s per-file cap. By check: GP2 65s, GP3 33s, GP4 63s, GP5 32s; pi-review runs take about 16s each.
  - Windows runs fewer GP2 spellings, and review-ledger ran 1.2 to 1.5 times slower there. Expect roughly 190-290s. Inferred; read the timing on the first Windows run.

- macOS counts on head equal the baseline for every file I ran except review-standard:
  - land 51, immutable-review 17, review-round 33, review-ledger 155, worker-lane 52, path-spelling 9 (new)
  - agent-dir-config 98, code-map 47, handoff-artifact 7, handoff-writer-role 7, readme-check 11, requirement-rows 5, requirements-trace 61, runtime-map 8, skill-claims 30, win32-launch 5 pass and 6 skip
  - mutation-runner 27, templates-render 162, writing-check 46, line-endings 1, agent-dir-parity 55
  - nana-setup: state-manifest 20, doctor-runtime 21, install 101, uninstall 31, restore 14, settings-merge 216, win32-degrade 98, install-check 105, fresh-machine 4
  - Ledger keys for the main checkout and this worktree are the same on base and head. They differ only for a wrong-case or firmlink spelling, which is the intended fix.
  - The worktree is still clean and no review-checkout registrations were left behind.

Probe scripts and the base pack copy are in <seat-scratch>/ (probe.mjs, fl.mjs, keys.mjs, base/, mut/).

## text

MUST: 4

MUST 1. A tracked `--out` is overwritten when its folder's on-disk letter case differs from git's index. CONFIRMED.
- Where: `packages/nana-pack/bin/review-round.mjs:267`. `realOut` now calls the native `realPath`, so `relGit` at `:538` carries the case on disk. `:540` then matches it case-sensitively with `git --literal-pathspecs ls-files/ls-tree`.
- My probe (`scratchpad/critic/fo1.sh`):
  - Setup: commit `Docs/review.md`, then rename the folder on disk to `docs/`. `git status` stays clean.
  - Command: `review-ledger run --out "$R/Docs/review.md"`, typed the way git lists it.
  - Base: refused with "TRACKED file", exit 1, file still `KEEP`.
  - Head: admitted as round 1/3, warned "inside the reviewed tree" and wrote the file. Status after is ` M Docs/review.md`. The round was consumed ("tree changed during the review").
- pi-review on head: exit 1, file still KEEP. It refuses only by accident, through "dirty snapshot could not be reproduced", and never prints TRACKED.
- The same root cause hits the snapshot skip at `review-round.mjs:223` and the copySnapshot compare at `pi-review.mjs:131`. Disk-case `docs/review.md` never equals index-case `Docs/review.md` there either.
- Untracked files are not affected. `git ls-files --others` lists the on-disk case (`docs/new-review.md`), so head records the bare HEAD sha where base got `+snap` (probe `d1.sh`).
- Fix options I verified:
  - `git ls-files -- ':(icase,literal)docs/review.md'` returns `Docs/review.md`. `ls-tree` rejects the `icase` magic with a fatal error.
  - Or compare dev/ino with each tracked path, as `inTreeRedirect` does.
  - Or also refuse when the typed-spelling `relGit` is tracked.

MUST 2. GP7 (R-1356) passes on the old code, so the fail-open it should pin is not pinned. CONFIRMED.
- Where: `packages/nana-pack/tests/path-spelling.test.mjs:408`. The test spells the LINKED feature worktree.
- Why it cannot tell old from new: git prints a linked worktree's common dir as an absolute canonical path, but a main checkout's as a relative `.git`.
  - From `<T upper>/FEAT`: `/private/var/.../m/.git`.
  - From `<T upper>/M`: `.git`.
- Test run: the new test file against a copy with the four bins reverted to fe03b6e (`scratchpad/critic/mixed-run.txt`). Result: 8 FAILED, and GP7 is the only PASS.
- Probe of the plan's version (`gp7main.mjs`): main checkout detached at the tip, SEND-BACK or in-flight recorded through a case-flipped `GP7MAIN`.
  - Base: both legs `land code=0 moved=true`. The split keys were `.../GP7MAIN/.git` and `.../gp7main/.git`. This is the live fail-open.
  - Head: both legs `code=1 moved=false`, refused with "non-LAND verdict" or "review in flight".
- The code fix is right; only the test misses it. Both legs should admit through a second spelling of the MAIN checkout.

MUST 3. An existing test file now fails, so the full suite is red and R-1106's evidence no longer runs. CONFIRMED.
- Where: `packages/nana-pack/tests/review-standard.test.mjs:69`. The pack-copy lib list lacks `real-path.mjs`, which `pi-review.mjs:33` and `review-round.mjs:66` now import. The `@inputs` header at `:4` needs it too.
- My run on copies of the pack:
  - Base: 7 PASS.
  - Head: 3 PASS, 4 FAIL, all with `ERR_MODULE_NOT_FOUND .../pack-copy/lib/real-path.mjs`.
  - The failing checks are the control check and the three R-1106 checks at `:121`, `:127` and `:133`.
- No other test copies `bin/` with a fixed lib list. `package.json` has no `files` whitelist.

MUST 4. The must-meet's 8.3, `\\?\` and Unicode spellings are missing from GP1. R-1350 is `implemented` but names spellings its test never runs. CONFIRMED.
- Where: `otherSpellings` at `path-spelling.test.mjs:102-117` builds only a case flip (plus a drive flip on win32) and a link.
  - A grep for `8.3`, `FileSystemObject` or `\\?\` hits only the header at `:4`.
  - NFD exists only in GP2 (`:171-178`).
  - The only SKIP lines are for case and link (`:108`, `:116`).
- Required by `must-meet.md:36-38` and `build-brief-1.md:36-37`. Prior art for 8.3 exists at `win32-launch.test.mjs:324`.
- `:28` resolves `tmpRoot` to its long name, so the RUNNER~1 short path never reaches any check.
- `path.win32.relative("C:\\Users\\RUNNER~1\\T\\repo", "c:\\users\\runner~1\\t\\REPO\\x.md")` gives `"x.md"`, so a case flip cannot turn the relUnder or reclaim sites red on Windows.
- Inferred, not run on Windows: GP1, GP2's ledger half and GP4 have no kind that fails on the old code there.
- `plan-design.md:27` and `:227` make the `\\?\` leg the only measure of the no-strip decision, so that decision is never checked.
- Fix: add the 8.3 kind (FileSystemObject) and the GP1 `\\?\` kind. Otherwise narrow R-1350 and record those legs as violated residuals on Windows.

SHOULD
1. `repoKeyOf`'s fallback at `review-round.mjs:158-161` is dead code. `git rev-parse --bogus-flag --git-common-dir` echoes `--bogus-flag` and exits 0 (checked here).
   - On a git without `--path-format` (inferred: older than 2.31), stdout becomes `--path-format=absolute\n.git`.
   - `realPath(mustExist)` then throws, so every admission and every land is refused. It fails closed.
   - `nana-setup/lib/steps.mjs:841` has the same pattern.
2. A check with no spelling available passes vacuously, because nothing guards an empty `spellings`. On Linux only the link kind runs.
3. GP6(iii) at `:385-390` stops after the first worktree spelling, so on macOS and Windows a link-spelled cleanup worktree is never run.
4. GP3 has no firmlink kind, so `--path-format=absolute` is untested. The regression lens's mutation to the plain flag left 9/9 PASS.
5. pi-review now crashes with a stack trace on an `--out` under a file (ENOTDIR). The call at `pi-review.mjs:71` sits outside the try, and `workingState` now calls `realOut`. I confirmed it: base prints a clean ENOTDIR line, head prints `node:fs:2853 return binding.realpath(`, both exit 1.
6. `real-path.mjs:58` returns `abs` on ELOOP or EACCES even with `mustExist`, where the design said it throws. The regression lens shows a symlink-loop `--out` admitted and the reviewer's output dropped. This is an edge case.
7. `land.test.mjs:491/:499` likely fails on Windows (inferred). It expects `realpathSync.native(feature)`, which uses backslashes, but `runCleanup` passes git's porcelain path, which uses forward slashes (`nana-land.mjs:142`).
8. The pack README does not declare the Windows key-restart cost or the firmlink-typed `--out` limit, which `must-meet.md` lists under known limits. AGENTS.md says contract changes go in the pack README.

NOTE
1. Missed by all three: no check runs `realPath`'s non-missing native-error fallback (`real-path.mjs:30-31`, `:58`). On Windows that is the volume-type case (inferred), so it has no pin on any platform.
2. Missed by all three: GP4 and GP1 have no power on Windows. JS `realpathSync` follows junctions there and `path.win32.relative` ignores case, so only the missing 8.3 kind could turn them red (inferred).
3. The P3 and P7 `isAbsolute` gap at `pi-review.mjs:93` and `:171` is a declared residual (`plan-design.md:232`), not missed.
4. The JS realpath at `review-round.mjs:242` (nested repo root) is not compared with any git path, so it is harmless. The N4 guard at `nana-land.mjs:167` matches the inventory.
5. Every must-meet row has its `req:` marker directly above its check (R-1350 to R-1356, GP6 three times).
6. HANDOFF.md and the session notes are not in the change yet. The land checklist needs them before the final round.
7. The worktree is clean at 4c4afa5, with no review-checkout registrations and no `crit-*` temp folders left. Probes and logs are in `<seat-scratch>/critic/`.