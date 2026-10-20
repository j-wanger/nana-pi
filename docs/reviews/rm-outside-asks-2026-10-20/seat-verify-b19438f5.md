# Seat checks — rm-outside-asks builds 1 and 2, tip b19438f5 (2026-10-20)

- Builds, by a pi gpt-5.6-sol builder through pi-worker (two builds). The plan is 142f1d91 (`must-meet.md`,
  `plan-attack.md`: one adversary, AMEND; `build-brief-1.md`), with 504d39fa's note on the shared `within`'s argument
  order. The lane merged main cd2d580e (the lane-guard-temp-root land tip) at 20786dea before build 1.
  - Build 1 is 3d8e2d22. `lib/gate-shell.ts` exports `commandIndex`, `base` and `PS_REMOVE`, with no behaviour change.
    New `lib/gate-rm-outside.ts` exports `rmOutsideTargets(segments, cwd, tool, { home, tempRoots, segmentable })`: a Map
    from segment to the full path of its first target outside `realPath(cwd)` and every temp root, read through the
    target's real parent plus its last name, containment by the shared `within(parent, child)` from
    `lib/gate-temp-roots.ts`. `commandHit` in `extensions/nana-gate.ts` runs it over the exec segments and, for an
    unsegmentable command, over the detection segments; a hit segment with no danger gets the non-floor reason
    `rm outside the working folder: <path>`. Rows R-2330 to R-2337 sit in FEAT-010 after R-2243, with eight checks in
    `tests/gate-rm-outside.test.mjs`. The pack README gains the rule's gate bullet and drops the "separate lane"
    sentence. The code map and the tree are regenerated.
  - Build 2 is b19438f5 (`build-brief-2.md`, a8505ed2), after the independent check's MUST. One helper in
    `nana-gate.ts`, `gateTempRoots()`, returns `acceptedTempRoots(...)` plus `/tmp` resolved through `real`
    (`path.resolve` if that throws) on macOS and Linux, never win32. `laneWriteHit` now calls it in place of its inline
    list and its local resolve helper (no behaviour change), and `commandHit` passes it as `tempRoots`. New row R-2338
    (directly after R-2337) and its check `plain rm under /tmp stays unasked on macOS and Linux` run through the real
    gate, typed as `/tmp` and through its real path; the check creates nothing under `/tmp` and prints a real SKIP on
    win32. Handler cases close the three pair survivors,
    rows unchanged: `echo $(rm <outside>)` asks (R-2330's check), `rm ~/x` and `rm -f $HOME/x` ask (R-2331's check), and
    `(cd sub/deep && true); rm ../../x` asks (R-2335's check). The README's rule names `/tmp` on macOS and Linux.
  - 70843436 adds the seat's pairs record on build 1; 490bb78b moves the table to build 2 and adds its record.
- The builder ran the full suite in build 1 against its brief, which said single test files only: `test:locked`, 194
  files, 192 PASS, 2 SKIP. Nothing else held the machine lock then.
- CI on draft pull request #140:
  - Run 39457512319 at 3d8e2d22 (build 1) was cancelled as superseded.
  - Run 39460770013 at 490bb78b (build 2 plus the seat's pairs table and record, no code change). Still running when the reviews started (13:05 EDT); the seat reads its Windows leg before the land, as the plan says.
  - Main's own known failures: Ubuntu's path-spelling GP1 and GP2 until linux-path-spelling landed (main ca27d86); a
    pull-request run's R-291 leaf-total failure, a merge artifact of GitHub's merge commit. Windows main reads 0 FAIL
    since 4be0b79 (desk files are declared skips). A failure in that set is main's, not the lane's.
  - The plan's ladder has the seat read the Windows leg on the reviewed tip before the land, because the PowerShell
    and junction cases serve Windows first.
- The seat's wrong-code pairs on macOS (`seat-mutate.mjs`, the shared mutation runner, Node 22.22.2, one shard, merge
  base cd2d580e):
  - Build 1 (record `seat-mutate-output-3d8e2d22.txt`, commit 70843436): 27 of 30 red, 25 exactly their named titles,
    2 with an unnamed red as well. Baseline: gate-rm-outside 8 PASS, gate-corpus 227 PASS, gate-rm-inside 11 PASS.
    Survived: G2 (no outside check over the detection segments), G5 (the working folder passed as home) and G6 (every
    command told it is segmentable), because no handler check reached the detection pass, a home spelling or a cd
    inside a subshell; the eight checks reached those inputs only through the test's own module calls.
  - Build 2 (record `seat-mutate-output-b19438f5.txt`, commit 490bb78b): the table moved to b19438f5. G2, G5 and G6 name
    build 2's new handler cases; G4 (no temp roots) re-anchors on `gateTempRoots()`; new G7 is build 1's form, the gate's
    temp roots without `/tmp`. Result: 31 of 31 red, 0 survived; 25 exactly their named titles and 6 with an unnamed red
    as well. Baseline: gate-rm-outside 9 PASS, gate-corpus 227, gate-rm-inside 11, lane-write-guard 16, each 0 FAIL. G7
    turns `plain rm under /tmp stays unasked on macOS and Linux` and lane-write-guard's `/tmp is a temporary root on
    macOS and Linux and not on Windows` red.
  - Declared without a pair: no pair adds `/tmp` on win32, since that branch changes nothing off Windows and R-2338
    prints SKIP there. The record's declared (b) lists the rest: gate-shell's three exports, markOutside's `=== null`
    guard, strictWithin's `child !== parent`, PowerShell parameter prefixes, comma lists and filter values, popd and a
    cd to a variable-led folder, the re-anchoring after an unreadable cd, placedTarget's glob or variable branch, and
    the catch fallbacks.
- Independent check (`independent-check-b19438f5.md`, filed under this tip's name): it ran on 3d8e2d22 (build 1) in a
  private clone, with a temp HOME and TMPDIR as siblings. FINDINGS, one MUST, over twelve probes, the last a replay of
  recorded calls.
  - Held: the must-meet file and the neighbouring gate files pass; the `/var` and real spellings of the temp folder
    match; quoted and home spellings outside ask and name the path; a working folder typed through a link works; an
    `allowPatterns` entry still lets a call through; recursive, `sudo`, `find -exec rm`, `xargs rm` and `git rm` keep
    main's verdict; PowerShell comma lists ask; a `$(git rev-parse --git-dir)` lock path runs.
  - Its findings and how each was settled:
    1. MUST: on macOS a plain rm under `/tmp`, or `/tmp` typed through its real path, blocked headless, where main runs
       it. The module's temp roots came only from `acceptedTempRoots`, which on macOS holds only the OS temp folder.
       Its replay of 332 recorded rm-shaped pi calls (280 reviewer, 47 builder, 5 other) blocked 73 more reviewer calls
       than main: 67 under `/tmp`, 5 under its real path and 1 `/config`. A compound call lost its whole command.
       Nothing main blocks ran on the lane. Fixed by build 2 (b19438f5): `gateTempRoots()` and R-2338 with its check.
       The seat re-ran the check's own replay against build 2: 1 new block versus main, a reviewer's `rm /config`, the
       one case the plan expected. Its counts line: reviewer 280 calls, 1 new block, 0 newly open; builder 47, 0, 0;
       other 5, 0, 0. The per-call output stays in the seat's scratch folder, because it quotes recorded commands. The independent check itself did not re-run on build 2.
    2. Known bug: a commit message in a heredoc with a line starting `rm ../x` blocks headless. The plan's known limit 6
       declares it. Builders commit with `-F "$msg"`, so it is rare. Recorded as a HANDOFF residual.
    3. Not probed: win32 path handling, because the module uses the native `path` functions with no platform
       injection. It rests on the Windows leg of the CI run above. Recorded as a HANDOFF residual, with the
       macOS-only pairs and the plan adversary's note that no Windows command history was replayed.
- The plan's known limits 1 to 8 are each a HANDOFF residual naming this lane; limit 6's heredoc part shares a line
  with finding 2. The limit 3 line adds one seat sentence, read from the code and not run: on macOS and Linux `/tmp`
  counts even when home sits inside it, so a plain rm in such a home runs unasked, as on main.
- HANDOFF: one Landed line. lane-guard-temp-root's helper-order residual now says this lane's module uses the shared
  helper and its checks fail if the order flips. Ten new residuals name this lane. The seat items from other lanes add
  twelve residuals (objective-path-shapes 3, linked-claude-folder-remedy 2, win-copy-backup-noise 3,
  doctor-path-row-remedy 1, lane-guard-temp-root 3), correct the Windows rulings-copy backup line, and make the
  win-copy-backup-noise and lane-guard-temp-root Landed lines carry their late CI results.
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2330 to R-2338 read `implemented` in REQUIREMENTS.md. At the notes commit (no code or row changed since
  b19438f5): `node scripts/requirements-trace.mjs` reads `requirements: 1667 total (1430 implemented · 1 planned · 37
  retired · 193 untested · 6 violated); 1430 traced by tests` and `ears: 0 rows off form (allowance 0)`; `npm run
  map:check` reads 364 modules, 0 problems; `npm run readme:check` reads 727 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base cd2d580e, run at 490bb78b):
  ```
  tree movement cd2d580..490bb78: 9 rows in 1 features
  FEAT-010 · Guard risky commands and protected resources
    R-2330 new (implemented)
    R-2331 new (implemented)
    R-2332 new (implemented)
    R-2333 new (implemented)
    R-2334 new (implemented)
    R-2335 new (implemented)
    R-2336 new (implemented)
    R-2337 new (implemented)
    R-2338 new (implemented)
  ```
  CAP-03 moves from 157 to 166 rows and FEAT-010 from 67 to 76.
- Not in this record: a seat-run locked full suite (the land runs it on the reviewed tip) and a local install check.
  The plan does not rule on the install check; the seat runs it or rules it out before the land.
- Main has not moved under this lane: main is cd2d580e, the merge base and the review base.
