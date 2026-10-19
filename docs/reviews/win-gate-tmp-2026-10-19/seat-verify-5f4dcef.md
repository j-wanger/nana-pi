# Seat checks — win-gate-tmp builds 1 to 3, tip 5f4dcef (2026-10-19)

This is the seat's record at the final tip. `seat-verify-ba0c960.md` stays as the earlier record, written when R-1430's
Windows check skipped on CI; its build 1 detail, CI run 1 and independent-check notes are not repeated here.

- Builds, all by Claude Sonnet 5:
  1. `build-brief-1.md`: 83a4785 (the four checks, red), cb44616 (two test bugs fixed, still red), 297ce13 (the fix,
     green). No CI ran on the red tests alone.
  2. `build-brief-2.md`: 204ffcc, one line in `packages/nana-pack/tests/lane-write-guard.test.mjs`. The test's
     `contained()` helper now carries the `!path.isAbsolute(rel)` guard the gate's own `within()` has, so a path on
     another drive reads as outside. Tests only. Its macOS evidence (commit message): the old helper reads a `C:` lane
     and `D:\tmp` as contained, the fixed one as not; under a forced win32 platform the R-1430 Windows half passes on
     the lane's gate and goes red with the gate's `tempRoots` line reverted. The lane then merged main b8ace0b
     (a350d3b).
  3. `build-brief-3.md`: e1e97f6 merges main a0e0a69. Main's linux-lane-guard lane also changed
     `lane-write-guard.test.mjs` (the outside folder picked from several parents, the SKIP-aware `check()`); the
     builder kept both lanes' fixtures: `homeFixture` as its own declaration, and this lane's guarded `contained()`
     feeding main's outside-folder search. The builder's macOS run of the file: 13 PASS, 0 FAIL, 1 SKIP; the
     forced-win32 probe again passes on the lane's gate and goes red with `tempRoots` reverted.
  - 5f4dcef adds only the seat's pairs record and moves `seat-mutate.mjs` to the new tip.
    `packages/nana-pack/extensions/nana-gate.ts` has no change from 297ce13
    to the tip; `git diff a0e0a69..HEAD -- packages/` touches the gate, the pack README's lane paragraph,
    `lane-write-guard.test.mjs` and the tree test's leaf total.
- CI run 39254810413 on a350d3b (build 2 with main b8ace0b; GitHub merged it onto b8ace0b as a4587f7):
  - macOS: `152 files: 150 PASS, 0 FAIL, 2 SKIP` · 7,479 checks pass. lane-write-guard `13 pass, 1 skip`.
  - Ubuntu: `152 files: 148 PASS, 2 FAIL, 2 SKIP`. Both failing files are main's at b8ace0b: lane-write-guard
    (`FAIL symlink escape outside lane is blocked`, fixed by linux-lane-guard in a0e0a69) and path-spelling (GP1, GP2).
  - Windows: `152 files: 131 PASS, 20 FAIL, 1 SKIP`; lane-write-guard `13 pass`, with
    `PASS /tmp is a temporary root on macOS and Linux and not on Windows`. The 20 are 16 desk and 4 bench files, the
    same list as run 3.
  - install-check: macOS and Windows success.
- CI run 39258781118 on e1e97f6 (build 3; GitHub merged it onto a0e0a69 as 7dc21b6):
  - macOS: `152 files: 150 PASS, 0 FAIL, 2 SKIP` · 7,479 checks pass. lane-write-guard `13 pass, 1 skip`.
  - Ubuntu: `152 files: 149 PASS, 1 FAIL, 2 SKIP` · 7,424 checks pass, 2 fail. lane-write-guard now passes:
    `11 pass, 2 skip`. A passing file's log prints no check lines, so which two skip is not shown; R-1431 and R-1432
    skipping on their sibling-folder control, as on run 1, is inferred. The one failing file is path-spelling
    (`FAIL GP1`, `FAIL GP2`), main's Linux regression, fixed by the linux-path-spelling lane, which awaits its land.
  - Windows (`ci-windows-run-3.log`): `152 files: 131 PASS, 20 FAIL, 1 SKIP` · 6,477 checks pass, 14 fail. The 20 are
    16 desk and 4 bench files. The lane's own file:
    ```
    PASS parent traversal outside lane is blocked
    PASS symlink escape outside lane is blocked
    PASS dangling in-lane symlink to missing outside target is blocked
    PASS symlink loop is blocked
    PASS temporary output remains allowed
    PASS bash writes stay explicitly outside this gate guard
    PASS /tmp is a temporary root on macOS and Linux and not on Windows
    PASS a temp file named through another spelling of the temp folder is allowed
    PASS a lane file named through another spelling of the lane folder is allowed
    PASS home, at-sign and file URL targets are judged where pi writes them
    PASS empty worktree root changes no existing path decision
    PASS unset worktree root leaves outside edit behavior unchanged
    PASS ordinary sessions leave an unresolvable symlink target unchanged
    PASS  packages/nana-pack/tests/lane-write-guard.test.mjs              13 pass  0.4s
    ```
  - install-check: macOS and Windows success.
  - Main's own CI at a0e0a69 (run 39256966857) fails the same 20 Windows files and the same Ubuntu file
    (path-spelling GP1, GP2). The seat helper compared the Windows failing-file lists: identical.
- **The seat's open finding on ba0c960 is closed.** R-1430's Windows check runs and passes on the real runner in runs 2
  and 3. The lane checks on Windows are 13 of 13 PASS, against 12 PASS and 1 SKIP on run 1. One limit stays: no
  Windows run has shown that check red on main's gate. The red side rests on the builders' forced-win32 probes on macOS
  (builds 2 and 3) and on the code.
- The seat's wrong-code pairs (`seat-mutate.mjs`), re-run on e1e97f6: 6 of 6 red, 0 survived, unsplit (one shard), on
  macOS (`seat-mutate-output-e1e97f6.txt`; merge-base a0e0a69, baseline 13 PASS, 0 FAIL). Each pair turns exactly its
  named checks red. The three declared limits are unchanged: the Windows halves exist only on the Windows leg; M5
  inverts the platform test since main's form is red only on Windows; the native-to-plain fallback has no test, so M6
  tries a fail-open fallback instead. The run on 297ce13 (`seat-mutate-output-297ce13.txt`, 5 shards) stays as the
  earlier record.
- Independent check (`independent-check-ba0c960.md`): HOLDS, no MUST. It ran on 297ce13 and was not re-run. The gate
  code is unchanged since; the test file changed by build 2's helper line and build 3's merge. Its findings 1 to 3 stay
  residuals in HANDOFF. Its finding 4, R-1430's Windows half, is settled by runs 2 and 3.
- Rows R-1430 to R-1433 read `implemented`. Tree movement a0e0a69..5f4dcef: four new rows under FEAT-006 (CAP-02 130
  to 134 rows, FEAT-006 27 to 31, leaf total 1,226 to 1,230). `node scripts/requirements-trace.mjs`: 1,230 total,
  943 implemented, 943 traced, 0 rows off form. `npm run map:check`: 289 modules, 0 problems.
- Main has moved on since a0e0a69 (06a874a when this was written). The land needs another merge of main and a
  confirmation round on the merged tip.
