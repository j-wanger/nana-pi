# Seat checks — knowledge-index-pins build 1, tip b8d414a9 (2026-10-20)

- Build, by a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`; the brief's builder line still names a
  Claude Sonnet subagent): one commit 9c509e25 on the plan commit 51284703 (based on 20debe02), then b8d414a9 merges
  main 385c633f (the hook-deadlines land) with no conflict (`git show --remerge-diff b8d414a9` is empty). Tests and
  REQUIREMENTS.md only: three new checks at the end of `incremental-build.test.mjs` (R-235, R-203, R-236), `// req:`
  markers on existing checks in `incremental-build`, `ledger-parse`, `discovery` and `hook` (R-204, R-882, R-211,
  R-884, R-232), the eight rows flipped untested to implemented, and `builder-mutations.md`. No `lib/`, hook or
  extension change; no code map change. The seat's notes commit adds only this record, the Windows log, the review
  brief, HANDOFF and the session entry.
- Builder process: the builder ran the full suite, though the brief said single test files only (the builder preamble
  asks for a green full suite before the last commit). Recorded once, on HANDOFF's builder-briefs line; no action.
- CI run 39384899535 on draft pull request #110 at b8d414a9 (GitHub's merge commit 2d0ef487 merges b8d414a9 into its
  own ancestor 385c633f, so the tree tested is b8d414a9's); all five jobs succeeded (release skipped):
  - macOS `177 files: 175 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7842 pass, 0 fail, 27 skip`.
  - Ubuntu `177 files: 174 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7781 pass, 0 fail, 45 skip`. The third skipped file
    is `checkout-spelling.test.mjs` (no second spelling on a case-sensitive volume), main's declared skip.
  - Windows `177 files: 160 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6777 pass, 0 fail, 104 skip`
    (`ci-windows-b8d414a9.log`). The 17 skipped files are main's declared set.
  - The lane's four files read the same on every leg: incremental-build `30 pass` (three new), discovery `37 pass`,
    hook `98 pass`, ledger-parse `21 pass, 1 skip` (the older `real DOCTRINE.md not present` skip). On native
    Windows the three new checks print PASS by title:
    ```
    PASS the walker skips a .git folder and a nested raw folder under an articles root
    PASS the walker skips a linked folder under an articles root (a junction on Windows)
    PASS a file whose size and mtime are unchanged is not read: same-length new bytes stay unindexed
    ```
  - install-check: macOS and Windows success.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arises, since GitHub's merge commit holds
    b8d414a9's tree.
- The plan's claim most likely wrong held: on native Windows the walker does not follow a directory junction. The
  check makes the link with type `junction` on win32 (no admin rights needed), and the Windows leg prints `PASS the
  walker skips a linked folder under an articles root (a junction on Windows)` (log line 614). The plan read in libuv's
  source that its Windows listing reports a reparse point as a link before it tests for a folder; the run shows the
  result, not which branch of the walker skipped it (inferred: `isSymbolicLink()` is true there). No `lib/build.ts`
  fix is needed, so the lane stays ordinary.
- Wrong-code pairs: none by the seat (an ordinary lane). The builder's record (`builder-mutations.md`), on this Mac,
  one test file per try, each restored before the next: 17 tries, 16 red on exactly the check the plan named, and the
  link-guard deletion alone green, as the plan predicted (`Dirent.isDirectory()` does not follow a link, so the guard
  is redundant today). The seat did not re-run the tries. Declared: (a) no try ran on Windows; (b) the builder's table
  has no try for must-meet's "[uses: not required" wrong code against "bullet without [uses:] is not a row" (the
  brief's list left it out); the plan adversary's probe reported it red on main 6f07daee.
- Independent check: none (an ordinary lane), so no findings to settle.
- The plan's known limits and dropped rows:
  - Settled by CI: the Windows junction (above).
  - New HANDOFF residuals, one line each: the lock-reclaim row's text says a lock past its time limit is reclaimed,
    while the code keeps a live owner's lock however old (R-894; reword before pinning); the two discover-block rows
    stay untested (R-215's check covers only root kinds and its seed reads the real home folder; R-885's text says
    defaults, the code falls back to an empty parent list, and no check runs a non-array subdir list under valid
    parents); the walker matches skip names and the `.md` suffix in exact letter case, so a `Reviews` folder is walked and
    `G.MD` is dropped (an owner call); a fast path keyed on size alone passes every incremental-build check, because
    R-206's content-change check edits to a new length; a root that is itself a link is followed (an explicit root, or
    a discovered repo's linked docs folder), outside R-203's scope.
  - Recorded here only (test-shape limits, no product bug): a Windows `dir` symlink needs Developer Mode or admin
    rights and is not tested; the link-skip line is redundant today; R-236's check sees re-indexing, not the read;
    R-882's own evidence is parse-level, and the build's use of the ledger parser is pinned under R-204; no check
    places a repo two levels down (R-211); R-884's "articles, and marked" check passes on an empty list and the DIR
    check supplies the non-empty half; R-232 exercises only `build()`, which `--rebuild` and the hook's background
    build both go through. R-200, R-881 and R-209 stay untested, outside the index slice; the rail shows them.
- HANDOFF's knowledge-pull-fail-open-pin residual, that the two walker rows stay untested and a Windows run would make
  their pin lane worth more, is removed: this lane pins both, and the Windows leg ran the junction case.
- Rows: R-235, R-203, R-236, R-204, R-882, R-211, R-884 and R-232 read `implemented` in REQUIREMENTS.md, each Evidence
  cell the backticked file::title list of its markers. No row added; the R-2030 to R-2039 block stays unused. The seat
  helper's re-run at the notes commit: `node scripts/requirements-trace.mjs` reads `1543 total (1285 implemented · 1
  planned · 34 retired · 218 untested · 5 violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check`
  reads 336 modules, 0 problems; `node scripts/requirements-tree.mjs --check` exits 0.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, against the merge base 385c633f):
  ```
  tree movement 385c633..b8d414a: 8 rows in 1 features
  FEAT-003 · Index and connect existing knowledge sources
    R-203 untested -> implemented
    R-204 untested -> implemented
    R-211 untested -> implemented
    R-232 untested -> implemented
    R-235 untested -> implemented
    R-236 untested -> implemented
    R-882 untested -> implemented
    R-884 untested -> implemented
  ```
  The plan and its adversary said requirements-moved reports no tree movement; today's tool reports these eight status
  flips. No row was added, retired or reworded.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite) and a local install check
  (the lane touches no `packages/nana-setup` file or hook).
- Main is 385c633f, the merge base, so no merge of main is due before the land.
