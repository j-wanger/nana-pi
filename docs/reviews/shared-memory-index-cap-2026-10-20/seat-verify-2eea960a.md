# Seat checks — shared-memory-index-cap builds 1 and 2, tip 2eea960a (2026-10-20)

- Builds: two, by a pi gpt-5.6-sol builder through pi-worker (the roster's larger-lane builder), on main 9552afb1. The
  plan is 82da3b2a (`must-meet.md`; `plan-attack.md`: one adversary, AMEND; `build-brief-1.md` with the seat's
  amendments at its end). `build-brief-1.md` still names a Claude Sonnet builder in its head; its seat section moved
  the build to pi sol.
  - Build 1 (e5b95409): new `packages/nana-setup/lib/shared-memory-config.mjs` (six-tag header, @effects none) seals
    `SHARED_MEMORY_OUTPUT_BUDGET = 9000` (the hooks doc's 10,000-character cap, read 2026-10-20, less a chosen 1,000;
    JS string length) and `SHARED_MEMORY_TRIM_MARK = "…"`. `claude/hooks/nana-shared-memory.mjs` replaces only its
    output block: under budget it writes main's exact text; over budget it keeps every `- [title](link)` head whole,
    binary-searches the longest common description length that fits with the fold line reserved, backs a cut off a
    high surrogate, drops whole trailing entries only when every description cut to nothing still overflows, and ends
    with the fold line (`… <s> of <n> entries shortened, <d> left out; full index: <idx>`). Self-heal, the folder
    resolution, fail-open and closed-stdout handling are unchanged. Rows R-2340 to R-2346 sit in FEAT-003 after
    R-872, with seven checks in new `tests/shared-memory-budget.test.mjs`. The setup README gains one auto-memory
    bullet and one Tests-table row. The code map and the tree are regenerated.
  - Build 2 (4641a6f2, `build-brief-2.md`, tests only): R-2340's check, title and row unchanged, now also holds the
    output to the budget on fixture B (the drop path), a new fixture F (60-character titles that fit at length 0
    without the fold line but not with it) and a new fixture G (an over-budget index printed with the self-heal note,
    through a linked projects folder). Each count comes from the imported budget and a measured header.
  - 4b86e4b3 and 2eea960a add the seat's pairs records; e581f1af adds build brief 2.
- CI on draft pull request #142 at 2eea960a. CI run 39499268786 on draft pull request #142 at 2eea960a (build 2 plus the
  seat's pairs record) reads 0 failing on all three legs: macOS 193 PASS, 0 FAIL, 2 SKIP of 195 files (8,007 checks
  pass, 35 skip); Ubuntu 192 PASS, 0 FAIL, 3 SKIP of 195 files (7,946 checks pass, 55 skip); Windows 177 PASS, 0 FAIL,
  18 SKIP of 195 files (6,935 checks pass, 114 skip). The install check passes on macOS and Windows. On Windows all
  seven new checks pass by title, and shared-memory-hook (42 pass, 1 skip), shared-memory-input (3) and
  hooks-closed-output (7) pass. The Windows leg's log is ci-windows-2eea960a.log in this folder. Build 1's run
  (39496030305 at e5b95409) was cancelled as superseded.
  - Main's own known failures: Ubuntu's path-spelling GP1 and GP2 until linux-path-spelling landed (main ca27d86); a
    pull-request run's R-291 leaf-total failure, a merge artifact of GitHub's merge commit. Windows main reads 0 FAIL
    since 4be0b79 (desk files are declared skips). A failure in that set is main's, not the lane's. None showed here.
  - Scrub note: the log's darwin skip title, which names the macOS temp folder's real-path spelling, reads
    `/tmp → <tmp>` in the copy (earlier lanes' copies kept it), and the
    project-key titles read `<home>` and `<repo>`; every other line is the job's own text.
- The seat's wrong-code pairs on macOS (`seat-mutate.mjs`, the shared mutation runner, Node 22.22.2, merge base
  9552afb1; table 1b2724bd unchanged between the two runs). Every pair edits the hook or the config module and runs the
  lane's new test file only; the hook's existing test files pin the unchanged parts. Baseline both times:
  shared-memory-budget 7 PASS, 0 FAIL.
  - Build 1 (e5b95409, one shard; record `seat-mutate-output-e5b95409.txt`, commit 4b86e4b3): 20 of 23 red, each
    exactly its named titles. H7 (the fit-at-zero test reserves no fold room), H16 (the drop loop reserves no fold
    room) and H22 (the self-heal note printed outside the budget) survived: R-2340's budget check ran only on fixture
    A, the description-cut path, so breaking the budget at the fit-at-zero boundary, on the drop path or with the note
    passed. The seat's brief measured 9,049 to 9,131 characters (H7), 9,224 (H16) and 9,062 (H22).
  - Build 2 (4641a6f2, five shards; record `seat-mutate-output-4641a6f2.txt`, commit 2eea960a): 23 of 23 red, 0
    survived; 22 exactly their named titles, and H14 (the drop path keeps every entry) turns its named R-2343 check
    red plus R-2340's, which now reads fixture B.
  - The pairs: H1 main's unbounded form; H2 a cut at the budget mid-line; H3 `<` for `<=`; H4 fold room always
    reserved; H5 the whole line as head; H6 the head stopping after the title; H7, H8 and H16 the fold reservation
    missing at the boundary, everywhere or in the drop loop; H9 the shortest description as the search's top; H10
    half the longest length; H11 titles only; H12 no surrogate back-off; H13 no trim mark; H14 and H15 the drop path
    keeping every entry or the trailing ones; H17 to H21 the fold line's counts, order, path and place; H22 the note
    outside the budget; C1 the budget at the platform's 10,000.
  - Declared without a pair (in both records): `<=` against `<` in the shorten test (no fixture's length equals a
    description's), `Math.ceil` against `Math.floor` (a hang, not a wrong output), the `end > 0` guard (equivalent at
    0), the import line and the @outputs text, and the trim mark (a retune the tests read by name). The builder's W6
    (one proportional cut) replaces the whole search; the builder saw it red on R-2341.
- Independent check (`independent-check-2eea960a.md`, filed under this tip's name; it ran on build 1, e5b95409, in a
  private clone with a temp HOME for every probe and made-up names). HOLDS over eleven probes (Probe 0 to Probe 10), no
  MUST. Build 2 changed tests only, and nobody re-ran the check on it.
  - Held: the lane's own checks and five related hook files pass, with map, README and tree clean; on a temp copy of
    the live index (62 entries) main printed 12,752 characters and the lane 8,942, all 62 entries, 60 cut to one length
    of 66; under budget, with and without the note, the output matches main byte for byte; an over-budget index with
    the note prints 8,998; a `]` title prints whole; a 200-entry index prints 121 entries and leaves 79 out; a reader
    that closes early still gets exit 0 and no stderr; the hook runs through install's link and still heals the
    `shared` link; a CLAUDE_CONFIG_DIR of 883 characters prints 8,979; one line at budget + 1 prints 9,000 with the
    fold line; 500 entries of 1,000 characters run in 74 ms against main's 80.
  - Not run by the check: win32. CI's Windows leg ran the lane's tests at 2eea960a and passed all seven new checks.
  - Its findings and how each was settled:
    1. F1, known bug: a link holding `)` gets a partial head ending at its first `)`, so when descriptions are cut to
       nothing the trim mark lands inside the link (`- [Fig notes](fig_(draft)…`, probe 5). The plan's known limit 2
       said such a line is never shortened, only dropped whole; that holds for a `]` in a title, not for a `)` in a
       link. Not fixed; a new HANDOFF residual with the corrected wording. Today's memory file names hold no
       parentheses.
    2. F2, HANDOFF carried nothing for the lane at the tip. Settled by this notes commit: one Landed line and the
       residuals below.
- The plan's known limits, each a new HANDOFF residual: (1) a header plus note longer than the budget is not trimmed
  (an index path of about 4,400 characters); (2) a `]` in a title makes the whole line its head, so that line is only
  ever dropped whole (the `)` half is F1); (3) if Claude Code counted bytes rather than UTF-16 units, an astral-heavy
  index could pass its cap; (4) when the entries overflow even with every description cut away, the trailing (newest)
  entries drop, from about 125 entries at today's title length. A further residual says the independent check ran on
  build 1 only and the pairs on macOS only.
- HANDOFF: one Landed line; six lane residuals (the four limits, F1, the build-1-only check); five late review notes
  from lanes that already landed (lifecycle-compaction-reason, gate-stop-names-config twice,
  knowledge-sources-unparseable, project-odd-seeds), each a residual line. No existing line becomes untrue (the check
  read lines on closed hook output, the hook's missing time limit and the stale-copy scope as still true).
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2340 to R-2346 read `implemented` in REQUIREMENTS.md, each naming its check title in the new test file; the
  row text is the must-meet table's. At the notes commit (no code or row changed since 4641a6f2): `node
  scripts/requirements-trace.mjs` reads `requirements: 1674 total (1437 implemented · 1 planned · 37 retired · 193
  untested · 6 violated); 1437 traced by tests` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads
  366 modules, 0 problems; `npm run readme:check` reads 729 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 9552afb1, run at 2eea960a):
  ```
  tree movement 9552afb..2eea960: 7 rows in 1 features
  FEAT-003 · Index and connect existing knowledge sources
    R-2340 new (implemented)
    R-2341 new (implemented)
    R-2342 new (implemented)
    R-2343 new (implemented)
    R-2344 new (implemented)
    R-2345 new (implemented)
    R-2346 new (implemented)
  ```
  CAP-01 moves from 196 to 203 rows and FEAT-003 from 41 to 48.
- Not in this record: a seat-run locked full suite (the land runs it on the reviewed tip) and the local macOS install
  check, which this hook lane runs before nana-land (CI's install check passes on macOS and Windows).
- Main has moved under this lane: the review base and merge base are 9552afb1, and main has since landed
  lifecycle-compaction-reason, gate-stop-names-config, knowledge-sources-unparseable and project-odd-seeds. None of
  them touches the hook, its config module or its test files. project-odd-seeds edits the setup README in other hunks
  (its Tests-table row sits at the table's end). Before the land, the merge of main needs `npm run map` and `npm run
  req:tree` again, with HANDOFF and the session file merged by hand.
