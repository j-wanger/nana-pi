# Seat checks — win-gate-tmp build 1, tip ba0c960 (2026-10-19)

- Build 1 by Claude Sonnet 5: 83a4785 (the four checks, red), cb44616 (two test bugs fixed, still red, tests only),
  297ce13 (the fix, green). ba0c960 adds only the seat's pairs record; no lane code changed after 297ce13.
- No CI run exists on the tests-only commit cb44616 (`gh run list --branch feat/win-gate-tmp` lists one run), so the
  plan's Windows run 1 on the red tests never happened. The Windows reds before the fix were never seen, and the
  adversary's "claim most likely wrong" (plain JS realpath keeps `RUNNER~1`) stays unmeasured.
- CI on draft pull request #33, run 39248931880 on 297ce13 (GitHub merged it onto main 1e3bf1f):
  - macOS: `150 files: 148 PASS, 0 FAIL, 2 SKIP` · 7,464 checks pass. lane-write-guard `13 pass, 1 skip`;
    requirements-tree `89 pass`.
  - Ubuntu: `150 files: 147 PASS, 1 FAIL, 2 SKIP`. The one failing file is lane-write-guard (`10 pass, 1 fail, 3 skip`):
    `FAIL symlink escape outside lane is blocked`, main's red, fixed by linux-lane-guard (not yet on main). The R-1431 and
    R-1432 checks skip on their sibling-folder control there, as the plan says.
  - Windows (`ci-windows-run-1.log`): `150 files: 126 PASS, 23 FAIL, 1 SKIP` · 6,391 checks pass, 84 fail. The 23 are
    main's set at 1e3bf1f: immutable-review, land and review-ledger (fixed since by win-review-paths, now on main),
    16 desk files and 4 bench files. The lane's own files:
    ```
    PASS parent traversal outside lane is blocked
    PASS symlink escape outside lane is blocked
    PASS dangling in-lane symlink to missing outside target is blocked
    PASS symlink loop is blocked
    PASS temporary output remains allowed
    PASS bash writes stay explicitly outside this gate guard
    SKIP /tmp is a temporary root on macOS and Linux and not on Windows: \tmp on the current drive lies inside the lane or OS temp root
    PASS a temp file named through another spelling of the temp folder is allowed
    PASS a lane file named through another spelling of the lane folder is allowed
    PASS home, at-sign and file URL targets are judged where pi writes them
    PASS empty worktree root changes no existing path decision
    PASS unset worktree root leaves outside edit behavior unchanged
    PASS ordinary sessions leave an unresolvable symlink target unchanged
    PASS  packages/nana-pack/tests/lane-write-guard.test.mjs              12 pass, 1 skip  0.4s
    PASS  packages/nana-pack/tests/requirements-tree.test.mjs             89 pass  2.1s
    ```
  - install-check: macOS and Windows success.
- **Open seat finding: R-1430's Windows check skipped on CI.** The test's `contained(parent, child)` helper lacks the
  `path.isAbsolute(relative)` test that the gate's own `within()` has. On the runner the lane and the OS temp folder sit
  on `C:` (`C:\Users\RUNNER~1\AppData\Local\Temp\...` in the log) and the suite runs the file from the package folder on
  `D:`, so `\tmp` is `D:\tmp`. `path.win32.relative("C:\\...", "D:\\tmp")` returns `D:\tmp`, which the helper reads as
  inside, so the check printed SKIP. The SKIP line is observed. The cause is inferred from the code and the log's drive
  letters; the helper run with `path.win32` on macOS on those two drives returns inside, as above. Effect: nothing on Windows shows the gate refusing `\tmp`; that half rests on the code and on the
  independent check's forced-platform probe (probe 5, macOS path module). With the Windows half of the fix removed, the
  check would still skip there. Open for the seat: send it back in a build brief 2 (the helper treats a path on another
  drive as outside, then a Windows run), or keep it as a residual. HANDOFF carries it as a residual until then.
- The seat's wrong-code pairs (`seat-mutate.mjs`): 6 of 6 red on 297ce13, 0 survived, in 5 shards on macOS
  (`seat-mutate-output-297ce13.txt`). Three declared limits: the Windows halves exist only on the Windows leg; M5 inverts
  the platform test since main's form is red only on Windows; the native-to-plain fallback has no test, so M6 tries a
  fail-open fallback instead (the existing dangling-link and loop checks catch it).
- Independent check (`independent-check-ba0c960.md`): HOLDS, no MUST. It ran on 297ce13 (same code as ba0c960), with
  temp HOME and TMPDIR, and recorded eight probes with commands and a main-versus-tip table. Its findings and how each
  was settled:
  1. The pack README overstates the TMP gap: on Windows Node reads TMP when TEMP is unset. Residual (HANDOFF).
  2. A macOS firmlink spelling of the lane (`/System/Volumes/Data/...`) is refused, as on main. Residual (HANDOFF).
  3. A stray build folder in the real home (`<home>/lane-guard-home-n3xGF6/TempCase-28797`). It no longer existed when
     the seat helper checked before this commit. The test still builds its home fixture under `os.homedir()`, which is
     the real home when the file runs outside the suite; cause not established. Residual (HANDOFF).
  4. Windows not verified by the check: CI run 39248931880 settles R-1431, R-1432 and R-1433 at the tip (pass there).
     R-1430's Windows half stays open (finding above); the red-before on Windows was never observed.
- Rows R-1430 to R-1433 read `implemented`. `node scripts/requirements-trace.mjs`: 1,219 total, 932 implemented,
  932 traced, 0 rows off form. `npm run map:check`: 285 modules, 0 problems.
