# Seat checks — lane-guard-temp-root builds 1 and 2, tip 3cc260b8 (2026-10-20)

- Builds, by a Claude Sonnet 5 builder (two builds); the lane branched from main 72abe19a, with the plan at 18736dc9
  (`must-meet.md`, `plan-attack.md`: one adversary, AMEND; `build-brief-1.md`, with the seat's amendment for one shared
  temp-root module):
  - Build 1 is 350f9ce0. New `packages/nana-pack/lib/gate-temp-roots.ts` exports `acceptedTempRoots({ platform, env,
    home, tmpdir })` (the OS temp folder, plus `TMP` on win32, each resolved through `lib/real-path`'s `realPath`, minus
    a drive or filesystem root, home and a folder above home), `isExcludedTempRoot` and `within(parent, child)`.
    `laneWriteHit` in `extensions/nana-gate.ts` calls it; `/tmp` stays a separate rule on macOS and Linux. Four checks
    in `tests/lane-write-guard.test.mjs` (R-2270 to R-2273; R-2273 behind a `req-candidate` marker, a real SKIP off
    Windows), and the file's import-time HOME and USERPROFILE move from the worktree to `homeFixture`. R-1430 and
    R-1431 get narrowed text; the pack README's lane-launch paragraph names the rule and drops the TMP "known gap"
    sentence; the code map and the tree are regenerated.
  - Build 2 is 3cc260b8: R-2273's marker reads `// req: R-2273` and its row `implemented`, after the seat's Windows pair
    run passed it on the Windows leg. It changes only that marker and that row. No `build-brief-2.md` is in this folder.
  - 61684fb3 adds the seat's macOS pairs on 350f9ce0; e65d48ad adds the Windows-only pairs.
- CI run 39439600129 on draft pull request #132 at 350f9ce0 (build 1; GitHub's merge commit 5af064d2 merges 350f9ce0
  into its own base 72abe19a, so the tree tested is 350f9ce0's):
  - macOS 188 PASS, 0 FAIL, 2 SKIP of 190 files (7,965 checks pass).
  - Ubuntu 187 PASS, 0 FAIL, 3 SKIP of 190 files (7,904 checks pass).
  - Windows `190 files: 172 PASS, 0 FAIL, 18 SKIP, 0 WARN · checks: 6891 pass, 0 fail, 112 skip`
    (`ci-windows-350f9ce0.log`). lane-write-guard passes 17 there, among them the four new checks; R-2273 prints `PASS
    on Windows a differing TMP counts as a temp folder under the same rule as TEMP`. R-2270 prints no second-drive
    SKIP line, so its second-drive part ran.
  - install-check passes on macOS and Windows.
  - None of main's known failures showed.
  - CI has not run on 3cc260b8. Build 2 changes only R-2273's marker and row, and the seat's records; the land runs the
    locked suite on the reviewed tip. The plan rules the install check not required, because it never sets
    NANA_WORKTREE_ROOT; CI's install check passed anyway.
- The seat's wrong-code pairs on macOS (`seat-mutate.mjs`, the shared mutation runner, Node 22.22.2, one shard, merge
  base 72abe19a; record `seat-mutate-output-350f9ce0.txt`, commit 61684fb3): 11 of 14 red, each exactly on its named
  titles; baseline lane-write-guard 16 PASS, 0 FAIL.
  - Red: P1 (home clause dropped), P3 and P3b (home tested both ways, or inverted), P4 (home by equality), P5 and P5b
    (exclusion judged before resolving, or no resolving), P8 (the worktree-ancestor clause), P10 (no exclusion in
    `acceptedTempRoots`), P12 (main's form), P13 and P14 (`/tmp` dropped, or unresolved).
  - Survived: P2 (root clause dropped): on macOS and Linux `/` holds home, so the home clause covers it; only R-2270's
    Windows second-drive part catches it (a plan known limit). P9 (home compared as typed, not resolved): a test gap,
    because every check sets HOME already resolved; the independent check's probe 5 (HOME a link, TMPDIR its real
    target) shows the lane refuses correctly. P11 (a string-prefix `within`): it differs only for a temp path that is a
    text prefix of home without holding it, a wrong refusal (the safe direction); no check sets one.
  - Declared without a pair: P6 and P7 change only the win32 TMP branch (R-2273 SKIPs off Windows); no pair for
    `acceptedTempRoots`' catch, whose body cannot throw on strings.
- The seat's Windows-only pairs (`seat-mutate-win.mjs`, `win-pairs.mjs`), run in place on a scratch windows-latest CI job
  (run 39441786500, commit 4cc76ea8 = lane tip 61684fb3 plus the table and a Windows-only step; record
  `seat-mutate-win-output-61684fb3.txt`, commit e65d48ad): 4 of 4 red; the baseline passes the file, R-2273 included.
  P2 (root clause dropped) turns R-2270's second-drive case red; P6 (TMP never read) turns R-2273 red; P7 (TMP added
  without the exclusions) turns R-2270, R-2271 and R-2273 red; P9 (home compared as typed: the runner's 8.3 short name)
  turns R-2271 and R-2273 red. So the two macOS survivors P2 and P9 are caught on Windows. The record's baseline line
  reads 18 PASS because the table counts the file's own PASS summary line; CI's runner line reads 17 pass.
- Independent check (`independent-check-3cc260b8.md`, filed under this tip's name): it ran on 350f9ce0 (build 1) in a
  private clone, with a temp HOME for every probe. HOLDS, no MUST, over eleven probes (0 to 10).
  - The new checks are red on main's gate (R-2270 and R-2271 FAIL, R-2272 PASS) and green on the lane (16 PASS, 2 SKIP
    under the suite's layout).
  - The default layout gives the same four decisions as main. TMPDIR naming home through another spelling, `/`, a link
    to a folder above home, the real target of a linked HOME, or home or a `..` path above it with the lane worktree
    inside home each now refuses the write main allowed, while the lane file stays writable. A simulated Windows rule keeps the default TEMP, drops `C:\`,
    `D:\`, a UNC share root and a case variant above home, and keeps a good TEMP or TMP beside a bad one. Empty HOME
    fails closed, as on main. code map 0 problems, README 724 claims and 0 problems; no write outside temp folders.
  - Its findings and how each was settled:
    1. Known bug, not a MUST: a HOME inside the OS temp folder turns off OS-temp lane output on macOS and Windows,
       because that temp folder then holds home (probe 9). It fails closed, and `/tmp` still works on macOS and Linux.
       Run alone with HOME under TMPDIR, lane-write-guard turns R-962 "temporary output remains allowed" and R-1431
       red; the suite stays green because `scripts/test.mjs` puts HOME and TMPDIR in sibling folders. Recorded as a
       HANDOFF residual.
    2. Known bug, a maintenance trap with no effect today: `lib/gate-temp-roots.ts`'s `within(parent, child)` takes its
       arguments in the opposite order to `nana-gate.ts`'s private `within(target, root)`, and `nana-gate.ts`
       re-declares a `resolve` helper the module already has. Recorded as a HANDOFF residual; rm-outside-asks's brief
       warns its builder.
- The plan's other known limits, each now a HANDOFF residual naming this lane: a broad temp folder such as a mount
  point still counts; on macOS and Linux the guard counts only the temp folder Node picks; on macOS a temp variable
  typed through home's data-volume firmlink path is not read as home (inferred); the refusal reason does not say a temp
  folder was set aside. A pairs line records P9 (macOS and Linux) and P11. The plan's Linux spelling SKIP and bash
  writes were already residuals.
- HANDOFF: one Landed line. The win-gate-tmp line (a differing TMP never counts; a temp variable set to a drive root
  opens the whole drive) goes, because the lane fixes both and the README no longer carries the known-gap sentence.
  Seven new residuals name this lane. The seat items from other lanes add the owner's 2026-10-20 rulings line (and
  remove the three answered open asks to the owner), two review-ledger-run-win-launch lines and one builder full-suite
  line.
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2270 to R-2273 read `implemented` in REQUIREMENTS.md; R-2273's evidence says Windows-leg-only. At the notes
  commit (no code or row changed since 3cc260b8): `node scripts/requirements-trace.mjs` reads `requirements: 1629
  total (1392 implemented · 1 planned · 37 retired · 193 untested · 6 violated); 1392 traced by tests` and `ears: 0
  rows off form (allowance 0)`; `npm run map:check` reads 356 modules, 0 problems; `npm run readme:check` reads 724
  claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 72abe19a, run at 3cc260b8):
  ```
  tree movement 72abe19..3cc260b: 6 rows in 1 features
  FEAT-006 · Launch builders with execution limits
    R-1430 text changed
    R-1431 text changed
    R-2270 new (implemented)
    R-2271 new (implemented)
    R-2272 new (implemented)
    R-2273 new (implemented)
  ```
  CAP-02 moves from 190 to 194 rows and FEAT-006 from 41 to 45.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite at 350f9ce0) and a local
  install check (the plan rules it not required).
- Main has not moved under this lane: main is 72abe19a, the merge base and the review base.
