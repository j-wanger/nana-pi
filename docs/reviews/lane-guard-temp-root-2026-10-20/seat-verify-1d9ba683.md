# Seat checks — lane-guard-temp-root build 3, tip 1d9ba683 (2026-10-20)

- Round 1 on 9ae497d8: Claude Opus 5.5 (final reviewer) LAND 9/10; pi gpt-6-astra (land reviewer) SEND-BACK with two
  MUSTs — a macOS firmlink spelling of home (`/System/Volumes/Data` + home) still opened home to lane writes
  (reproduced), and R-2272 passed with the feature removed.
- Build 3 is 1d9ba683 (`build-brief-3.md`, sent to the same Claude Sonnet 5 builder as a follow-up message):
  - `isExcludedTempRoot` keeps the root clause, then compares `fs.statSync(…, { bigint: true })` dev and inode of the
    candidate with home and every folder on home's path to the root (each stat once); when a stat fails it falls back
    to the text test `within(t, home)`. It never throws.
  - R-2271's check gains a data-volume sub-case: where `/System/Volumes/Data` + the fixture home exists with the same
    dev and inode, the temp variables name that spelling and a home file outside the lane is refused through both
    spellings while a lane file stays writable; elsewhere it prints `SKIP … (data-volume spelling): …`. Its folder link
    moves into a `tmpDirUnmanaged` root (Opus NOTE 5).
  - R-2272's check keeps its handler-level checks and also calls `acceptedTempRoots` directly: a temp folder inside home
    is kept and home itself dropped. Without the module the import fails, and the file with it.
  - The pack README's sentence says `/tmp` on macOS and Linux is a separate rule that counts regardless (Opus SHOULD 1).
- Seat's own evidence for the two MUSTs: the pairs baseline runs the guard's test file on 1d9ba683, 16 PASS, 0 FAIL;
  P15 restores build 2's text-only test and turns R-2271 red on this Mac, so the data-volume sub-case runs here and
  catches the round-1 finding; P1 (home clause dropped) and P10 (no exclusion) now turn R-2272 red too, so R-2272 no
  longer passes without the feature.
- Seat's macOS pairs on 1d9ba683 (`seat-mutate-output-1d9ba683.txt`, commit 9eba5d11): 13 of 17 red, every red pair
  exactly its named titles. P1 to P4 re-anchored on the new body. P15 (build 2's text-only home test) and P16 (identity
  compared with home only) turn R-2271 red, through the data-volume sub-case. Declared survivors: P5 (exclusion judged
  on unresolved strings) and P9 (home as typed), because a stat reads the same identity through any spelling and the
  text fallback runs only when a stat fails; P11 (string-prefix `within`, a wrong refusal only); P17 (the stat-failure
  fallback dropped), a test gap — no check makes a stat fail.
- CI run 39447368542 on draft pull request #132 at 1d9ba683: one failing check on every leg, R-917's source check
  (`the source check detects direct mkdtemp calls while ignoring only generated leak fixtures`), because build 3 imported
  `tmpDir` and `tmpDirUnmanaged` on one line. Otherwise macOS 187 PASS, 1 FAIL, 2 SKIP of 190 files (7,964 checks
  pass); Ubuntu 186 PASS, 1 FAIL, 3 SKIP (7,903); Windows 171 PASS, 1 FAIL, 18 SKIP (6,890 pass, 113 skip;
  `ci-windows-1d9ba683.log`); install-check passes on macOS and Windows. lane-write-guard passes 16 with 2 skips on
  macOS, 14 with 4 on Ubuntu, and 17 with 1 on Windows, where the one skip is the data-volume sub-case — so build 3's
  identity test ran R-2270's second-drive case and R-2271 to R-2273 on native Windows.
- Build 4 is 13d5bc1a (`build-brief-4.md`, the same builder): it splits that import into two lines and changes nothing
  else. The seat re-ran `test-runner.test.mjs` (45 pass) and `lane-write-guard.test.mjs` (16 pass, 2 skip) on it. CI run
  39450318515 on 13d5bc1a: Ubuntu 189 PASS, 0 FAIL, 3 SKIP of 192 files (7,914 checks pass), test-runner 45 pass; macOS
  and Windows were still running when the round-2 reviews started. The pairs table touches no test import line, so its
  record on 1d9ba683 stands for build 4.
- Not re-run on build 3: the Windows-only pairs (`seat-mutate-win-output-61684fb3.txt`, build 1) and the independent
  check (`independent-check-3cc260b8.md`, run on 350f9ce0).
- The seat merged 5ef07f7f (the objective-path-shapes land tip, now main) at 4f546eff with its merge helper; trace and
  map:check clean after the merge.
