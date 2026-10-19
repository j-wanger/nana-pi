# Seat checks — win-post-edit-utf8 build 1, tip a05d269 (2026-10-19)

- Build, by a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`): one pass, commit a05d2699, verdict DONE.
  Per the builder's report, not re-run by the seat: R-1740 to R-1743 implemented; no existing test edited; single
  test files only, as briefed; eight wrong-code tries each red on macOS — no change (R-1740, R-1741), the switch on
  win32 only (R-1740, R-1741), the switch only when `=== undefined` (R-1740), PYTHONIOENCODING=utf-8 in place of the
  switch (R-1741, R-1743), the switch always overriding the owner's PYTHONUTF8 (R-1742), PYTHONIOENCODING=utf-8 beside
  the switch (R-1743), LC_ALL=en_US.UTF-8 (R-1743), LANG=C.UTF-8 (R-1743). d0f8d384 adds only the seat's pair table
  and its output; no code or test changed after a05d269.
- CI run 39315128937 on draft pull request #65 (a05d2699; GitHub's merge onto 4fe70c53, merge commit b552f43f; a05d269
  already holds 4fe70c53, so the merge's tree should be a05d269's, inferred):
  - macOS `165 files: 163 PASS, 0 FAIL, 2 SKIP`.
  - Ubuntu `165 files: 163 PASS, 0 FAIL, 2 SKIP`. post-edit-utf8 `2 pass, 2 skip`: R-1742 and R-1743 PASS; R-1740
    and R-1741 SKIP with the reason, as the plan's Verification expects.
  - Windows `165 files: 148 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6566 pass, 0 fail, 84 skip`
    (`ci-windows-run-1.log`). post-edit-utf8 `4 pass` with no skip, under the runner's
    `Python: 3.12.10 C:\hostedtoolcache\windows\Python\3.12.10\x64\python3.exe`; all four print PASS on win32:
    ```
    PASS a failing Python check with PYTHONUTF8 unset or empty shows the model its non-ASCII output as printed
    PASS a failing Python check shows the model its own Python child's non-ASCII output as printed
    PASS PYTHONUTF8, PYTHONIOENCODING, LANG, LC_ALL and LC_CTYPE values from pi reach the check unchanged
    PASS PYTHONIOENCODING, LANG, LC_ALL and LC_CTYPE that pi leaves unset stay unset for the check
    ```
    R-1740 and R-1741 ran rather than skipped, so the control run saw the runner's Python write non-UTF-8 bytes to a
    pipe. That settles the green half of the adversary's "claim most likely wrong". post-edit-hardening `17 pass`; its
    path checks d, e, g, h and i, which guard NANA_PI_FILE on win32, still pass. post-edit-status `33 pass, 1 skip`;
    post-edit-file-queue `3 pass, 1 skip`.
  - install-check: macOS and Windows success. None of main's known failures showed.
- The plan's Windows scratch run (the lane's test file against main's extension, where R-1740 and R-1741 must FAIL on
  the Windows leg; seat scratch pull request #69, branch `seatmut/win-post-edit-utf8`, commit 54850c6f, never merged):
  pending; the seat adds the result before the review starts.
- The seat's wrong-code pairs (`seat-mutate.mjs`, `seat-mutate-output-a05d269.txt`, committed in d0f8d384): 9 of 9 red,
  each by exactly its named titles, 0 survived; one shard on a05d269, macOS, Node 22.22.2, Python 3.14.6 under the
  test's forced Latin-1 locale; baseline post-edit-utf8 4 PASS. P1 (main's env), S1 to S6 (the must-meet's wrong forms
  of the switch line) and K1 and K2 (the named value as PYTHONIOENCODING=utf-8, or as PYTHONUTF8=0). Declared, no pair:
  (a) every pair runs on macOS, so a host whose default already writes UTF-8 would pass R-1740 and R-1741 without the
  change; (b) no pair drops the NANA_PI_FILE line, since only the hardening path checks d, e, g, h and i reach it, on
  the Windows leg, all passing on the lane tip; (c) no pair reads the switch from the spread copy instead of pi's
  environment (they differ only in key case on Windows); (d) no pair uses pi's own environment as the check's
  environment (no must-meet check reads pi's environment after a check). (a), (c) and (d) are a HANDOFF residual.
- Independent check (`independent-check-a05d269.md`, run on a05d269 in a private clone under a temp HOME): HOLDS, no
  MUST. The new file prints 4 PASS on the lane tip; against the base extension R-1740 and R-1741 FAIL
  (`� \\u2014 \\u03bb`, `child said: � \\u2014 \\u03bb`) and R-1742 and R-1743 PASS. hardening 22 PASS / 1 SKIP, status
  32 PASS / 1 SKIP and file-queue 5 PASS on base and lane alike. pi's own environment is `{}` before and after a check.
  The owner's PYTHONUTF8=0 and PYTHONIOENCODING=latin-1 keep deciding the output; the C locale and a node checker are
  unchanged; the forced win32 path keeps NANA_PI_FILE and gets the fix; a non-ASCII edited path prints where base
  crashed. map:check 0 problems; readme:check 708 claims, 0 problems. Findings and how each was settled:
  1. Known bug, not MUST, documentation scope: the file-open trade also applies on macOS or Linux under a non-UTF-8
     locale such as Latin-1. Probe 9: a Python check that opens a Latin-1 file without naming an encoding passed on
     base and now raises UnicodeDecodeError under post-edit. The pack README and the plan's known limits state the
     trade for Windows only. Not fixed; recorded as a HANDOFF carried residual, merged with the plan's Windows trade.
  Its two unverified items: a real cmd.exe run, which CI's Windows leg covers (4 pass above), and Linux, where CI's
  Ubuntu leg shows the expected two SKIPs.
- Rows: R-1740 to R-1743 read `implemented` in REQUIREMENTS.md. The seat helper's re-run at d0f8d384:
  `node scripts/requirements-trace.mjs` reads `1377 total (1091 implemented · 1 planned · 22 retired · 258 untested · 5
  violated)` and `ears: 0 rows off form (allowance 0)`, exit 0; `npm run map:check` reads 317 modules, 0 problems;
  `npm run readme:check` reads 708 claims, 0 problems. The R-291 leaf-total literal is gone (leaf-total-drop), so no
  existing test changed.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge-base f8d20142): 4 rows in FEAT-030 —
  R-1740, R-1741, R-1742 and R-1743 new (implemented).
- HANDOFF: the readme-check-cp1252 residual about post-edit reading a Python checker's cp1252 output as UTF-8 now says
  post-edit gives Python checks UTF-8 output on every platform, and keeps the unfixed part (non-Python checkers that
  write in a Windows code page). The plan's known limits stay open, and HANDOFF carries each as a win-post-edit-utf8
  residual: the file-open trade (with the independent check's POSIX finding), Python before 3.7 and the owner's own
  settings, the model's bash tool, the tests' skips and Python discovery, and the pair gaps.
- Main was f8d20142 when this record was written, the lane's merge base. If main moves before the land, that merge
  needs its own accepted review coverage.
