# Seat checks — install-link-race build 1, tip f52a33fe (2026-10-20)

- Build, by a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`, one build), 8bdd8375. The brief named the
  simple-lane Claude Sonnet builder; the seat ran the pi builder instead.
  - `packages/nana-setup/lib/steps.mjs`, `install()` only: the closure the one `withSettingsLock` call runs, renamed
    from `claudeSteps` to `fileSteps`, now also runs `stepSharedMemory`, `stepPiConfig`, `stepSubagentConfig`,
    `stepReviewerAgent` and `stepPath` after `stepSettings`, in main's order. `stepKnowledge` runs after the release,
    then `stepDesk` (when asked) and `stepPiRegister`, as before. The lock is taken once and released once. The dry run
    calls `fileSteps(false)` and takes no lock (R-926). The header's `@outputs` and `@errors` now say the lock is held
    "through the PATH entries". `lib/fsops.mjs` is unchanged.
  - The setup README's lock paragraph names every step run under the lock, says a second install started then exits 2
    and writes nothing, says the knowledge build, desk service and pi registration run after the release, and states
    the plan's first two known limits.
  - The new `packages/nana-setup/tests/install-overlap.test.mjs` runs one first install in-process into a temp home
    with a tiny knowledge source. It wraps `require("fs")` and `require("child_process")`, syncs them with
    `syncBuiltinESMExports` and restores them in `finally`. At the first lstat of `<bin>/pi-review`, after the real
    lstat returns, a real second `nana-setup install --home <same home>` runs through `spawnSync`. Every lstat of the
    ten later targets records whether the lock exists, and the lock's opens are counted. The knowledge CLI's spawn
    records the lock state. Four checks, one per row, each also requiring that its wrap fired.
  - Rows R-2260 to R-2263 join FEAT-013 / SUB-014 after R-1590, all `implemented`. The tree and code map are
    regenerated.
  - Commits: 0198e140 (plan and build brief 1, branched from main a112fd30, the mutation-runner-takeover-race land
    tip), 8bdd8375 (build 1), f52a33fe (the seat's merge of main c203f485, the handoff-cap-surrogate land tip, which
    touches no lane file) and fba92156 (the seat's pair table and its output). The seat's notes commit adds only this
    record, the independent check, the Windows log, the two review briefs, HANDOFF and the session entry. No product
    code changed after 8bdd8375.
- CI on build 1 plus the merge, run 39413207254 on draft pull request #126 at f52a33fe (GitHub's merge commit 7afbe8cc
  merges f52a33fe into its own ancestor c203f485, so the tree tested is f52a33fe's); all five jobs succeeded:
  - macOS `184 files: 182 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7929 pass, 0 fail, 29 skip`. install-overlap
    `4 pass`; settings-merge 221; install 109; win32-degrade 88; rulings-install 8; settings-lock `6 pass, 2 skip`;
    uninstall 31; win-shims `2 pass, 5 skip`; retired-artifacts 47; doctor-fix-line 9; fresh-machine 9;
    readme-rehearsal 8; skills-and-standards 88.
  - Ubuntu `184 files: 181 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7868 pass, 0 fail, 47 skip`. The same files pass
    with the same counts. The macOS and Ubuntu numbers are the seat's reading of the job logs; no log is kept here.
  - Windows `184 files: 167 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6860 pass, 0 fail, 110 skip`
    (`ci-windows-f52a33fe.log`). The 17 skipped files are main's declared set (16 desk files and the bench's
    study-tasks). install-overlap `4 pass` in 0.6 s on native win32, where the PATH step writes the extensionless sh
    shims, all four by title:
    ```
    PASS R-2260: a second install started at the first install's PATH step exits 2 naming the held settings lock
    PASS R-2261: the first install finishes with no problem row and all four PATH rows created when a second install starts at its PATH step
    PASS R-2262: the settings lock, taken once, is present at every look of a shared memory, pi config, subagent, reviewer or PATH target
    PASS R-2263: the settings lock is gone when install starts the knowledge build
    PASS  packages/nana-setup/tests/install-overlap.test.mjs              4 pass  0.6s
    ```
    Neighbours: settings-merge `214 pass, 7 skip`; install `93 pass, 5 skip`; win32-degrade `87 pass, 1 skip`;
    rulings-install `5 pass, 3 skip`; settings-lock `7 pass, 1 skip`; uninstall `2 pass, 2 skip`; win-shims 7;
    retired-artifacts `47 pass, 1 skip`; doctor-fix-line 9; fresh-machine 9; readme-rehearsal 8; install-check 129;
    fsops 17; skills-and-standards `63 pass, 4 skip`.
  - install-check: macOS and Windows success.
  - So the plan adversary's two claims most likely wrong both held. Nothing reads the knowledge row's place: the files
    it did not run (fresh-machine, readme-rehearsal, install-check, skills-and-standards and the doctor files) pass on
    all three legs. The staged overlap behaves the same on the Windows leg: R-2260 to R-2263 pass there natively.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arose, since GitHub's merge commit holds f52a33fe's
    tree.
- The seat's wrong-code pairs (`seat-mutate.mjs`, record `seat-mutate-output-f52a33fe.txt`, commit fba92156), through
  the shared mutation runner on macOS, one shard, Node 22.22.2. Baselines: install-overlap 4 PASS and settings-merge
  221 PASS. Result: 9 of 9 red, each exactly on its named titles, 0 with a named title green and 0 with an unnamed
  red; 0 survived.
  - M1 (main's `install()`: the lock ends after the settings step, the knowledge build runs before PATH) turned R-2260,
    R-2261 and R-2262 red.
  - M2 (the knowledge build inside the lock; builder W1) turned R-2263 red.
  - M3 (the PATH step after the release; builder W2) turned all four red.
  - M4 to M7 (shared memory, pi config (builder W4), subagent config, reviewer agent, each after the release) each
    turned R-2262 red.
  - M8 (two lock calls, one for the Claude steps and one for the later file steps; builder W5) turned R-2262 red.
  - M9 (the dry run takes the lock like a real run) turned settings-merge's `lock: --dry-run is not blocked by a lock`
    and `lock: --dry-run reports what it would add` red.
  - Declared, no pair: (a) every pair ran on macOS; the win32 shim branch is CI's Windows leg and the seat's
    forced-win32 probe. (b) No pair moves `stepPiRegister` or `stepDesk` inside the lock: the lane did not change
    them, and under `--home` pi registration spawns nothing, so the builder's W6 survived, as its brief expected.
    (c) No pair for the header lines, which are documentation.
- The seat's real-process probe on macOS. A preload paused the first install at its first look at the PATH entry and
  started a second install on the same home.
  - On main the second install wrote the four bin links, and the first crashed with EEXIST at pi-review.
  - On the lane the second install refused with the lock line and left the home byte-identical. The first finished
    with no ✗ row.
  - Forced win32: main did not crash, but both runs wrote the shims, and the last writer won. The lane refused the
    second run.
  - Row sets match main on macOS (38 rows) and forced win32 (33). Only the knowledge index row moves, from before the
    four PATH rows to after them.
  - A kill at the PATH step leaves a stale lock, and the next run prints the removal line. The span where a kill
    leaves a lock now runs from shared memory through PATH. The lock is held a median 15 ms on the lane against 18 ms
    on main (the independent check's probe 8).
- Independent check (`independent-check-f52a33fe.md`): it ran on f52a33fe in a private clone of the lane, under a fresh
  temp HOME for every probe, Node 22.22.2 on macOS, leaving the worktree, the main checkout and the real homes
  untouched. HOLDS, no MUST. The must-meet file passes 4 of 4 on POSIX and with forced win32, and copied into a
  c203f485 clone it fails R-2260, R-2261 and R-2262, with R-2263 green there by design. Nine probes follow:
  free-running and close-start install pairs on POSIX and forced win32, a plain install with a stub pi, a Ctrl-C to the
  whole process group during a 6,000-file knowledge build, the lock's hold time, a dry run and a real run under a held
  lock, a step that fails inside the lock, and a folder sitting at a PATH entry. Fifteen more single test files pass,
  with the code map at 0 problems and the README check at 720 claims and 0 problems. Its findings and how each was
  settled:
  1. MUST: none.
  2. Probe 4, free-running pairs: 140 pairs on the lane (60 at 0–240 ms, 80 at 60–140 ms) gave 0 crashes. In the first
     sweep 116 runs exited 0 and 4 exited 2 with the lock message, with 0 EEXIST, 0 locks left and a clean third
     install. Main crashed once in each sweep, with EEXIST at nana-land and then at pi-review, both at a delay of
     88 ms. Settled: the lane removes the crash main reproduces.
  3. Probe 6: with no `--home` and a stub pi, pi registration ran after the lock was released. No existing test checks
     this. Recorded as a HANDOFF residual, with the desk step.
  4. Probe 8: the lock is held a median 15 ms (14–25) on the lane and 18 ms (13–23) on main, over 15 installs each.
     Settled: holding the lock through five more steps does not measurably widen the window where a kill leaves a
     lock. The wider span itself is a HANDOFF residual, on the killed-run line.
  5. Probe 14: `skills-and-standards.test.mjs` exits 6 on both the lane and main in the check's homes, where doctor
     reports pi-subagents not installed. Settled as the check's setup, not the lane: CI passes the file on all three
     legs. No residual.
  6. The plan's untested limits (two different `--claude-home` values over one pi home, an install racing an
     uninstall) are unchanged and were not tested. Each is a HANDOFF residual.
  7. The worktree held two untracked seat files when the check ran; fba92156 committed both, so the source is clean for
     the land.
- The plan's known limits, each settled:
  - The lock lives in the Claude home, so two installs with different `--claude-home` values over one pi home and bin
    folder are not kept apart. The README says so. A HANDOFF residual.
  - A second install started after the release runs beside the first run's knowledge build, desk step and pi
    registration. Two pi registrations at once rely on pi's own settings lock, unprobed. The README says so. HANDOFF's
    install-honest-report line now carries it.
  - No check sees that pi registration and the desk step run outside the lock. The independent check's probe 6 saw pi
    registration do so. A HANDOFF residual.
  - The test stages the overlap at one point. The independent check's free-running pairs cover the rest (finding 2).
    No residual.
  - `lib/fsops.mjs` keeps its look-then-act gaps. Only a writer that ignores the lock reaches them, outside the threat
    model. A HANDOFF residual.
  - An uninstall running beside an install is not covered. A HANDOFF residual.
- HANDOFF edits: one Landed line, which names the row-order change. install-honest-report's "the lock ends after the
  settings step" residual drops its crash and its unpinned lock span, which this lane closes, and keeps only the
  overlap after the release. The lock-acquisition pin and the dry-run-under-a-lock question already stand as their own
  install-honest-report lines and are unchanged; the dry-run question stays the owner's open ask. The killed-run line
  (install-honest-report, win-lock-fix-command) now says the lock spans the steps through the PATH entries. New lines:
  pi registration and the desk step after the release, two Claude homes over one pi home, an uninstall beside an
  install, and fsops' look-then-act gaps.
- Rows: R-2260 to R-2263 read `implemented` in REQUIREMENTS.md. The seat helper's re-run at the notes commit:
  `node scripts/requirements-trace.mjs` reads `1590 total (1353 implemented · 1 planned · 37 retired · 193 untested ·
  6 violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 348 modules, 0 problems;
  `npm run readme:check` reads 720 claims, 0 problems; `node scripts/requirements-tree.mjs --check` exits 0.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base
  c203f485):
  ```
  tree movement c203f48..fba9215: 4 rows in 1 features
  FEAT-013 · Install and connect harness runtimes
    R-2260 new (implemented)
    R-2261 new (implemented)
    R-2262 new (implemented)
    R-2263 new (implemented)
  ```
  CAP-04 moves from 474 to 478 rows, FEAT-013 from 180 to 184 and SUB-014 from 37 to 41. No existing row changed.
- Reviewers: Claude Opus 5.5 (the final reviewer, through review-ledger) and pi gpt-6-astra (the land reviewer,
  through pi-review; the owner moved the land review from Fable to astra on 2026-10-20). The roster sets a land model,
  so there is no `seat-land.md`.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite on f52a33fe) and the local
  macOS install check, which runs before the land, since the lane touches `packages/nana-setup/`.
- Main was c203f485 when the lane merged it at f52a33fe. It is now 0305bc8d, after two lands: realpath-strict-fallback
  (215cd600) and post-edit-values-named (0305bc8d). Neither touches `install()`, the lane's test or the README's lock
  paragraph; realpath-strict-fallback adds one known-limits line and one test-table line to the setup README, apart
  from this lane's hunk. A trial merge conflicts only in the generated code map and tree; HANDOFF, REQUIREMENTS.md and
  the session file are shared too. So the land needs a merge of main and a confirmation round on the merged tip.
