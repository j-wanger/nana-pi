# Seat checks — config-advice-fixes builds 1 and 2, CI on d22ad0b5 (2026-10-20)

- Builds, by a pi gpt-5.6-sol builder through pi-worker. The plan's adversary and `build-brief-1.md` named a Claude
  Sonnet subagent; the seat launched pi-worker instead, and both pi sessions in the lane worktree ran gpt-5.6-sol.
  - Build 1 (`build-brief-1.md`): d22ad0b5 on main 385c633f, after the plan commit 3a18ea70. In
    `packages/nana-pack/lib/json-text.mjs`, `BACKSLASH_JSON_ERROR` also matches V8's `Bad Unicode escape in JSON`,
    under a contract comment naming R-1971, R-1972, R-2090 and R-2091. `FORWARD_SLASH_ADVICE` now reads "Write paths in
    this file with forward slashes and any other backslash as two, because JSON reads a single backslash as an
    escape." (provenance: chosen; names no key; the doubling clause fixes a regex, R-2092). It and
    `MANUAL_JSON_ADVICE` ("Repair the JSON by hand.", a contract value of R-1971 and R-1972) are now exported. In
    `lib/objective.ts`, `configFailureLine` reads `o?.configFailure`, `produceObjective` accepts a missing settings
    object, and the two advice names are re-exported beside `CONFIG_FAILURE_PREFIX`. objective-golden and
    doctor-detail import the two names in place of their retyped literals. objective-golden gains the R-2090, R-2092,
    R-2093 and R-2094 checks; doctor-detail gains the R-2091 check right after R-1972's. Rows R-2090 and R-2092 to
    R-2094 sit at the end of FEAT-001, R-2091 after R-1974 in FEAT-015. The hook launcher, `bin/nana-objective.mjs`,
    the extension, `config.ts`, `doctor.mjs` and both READMEs are unchanged. The regenerated code map changes only
    json-text's `@outputs` line.
  - Build 2 (`build-brief-2.md`): 434935e3, tests only. Two checks near the top of objective-golden pin the two sealed
    sentences: "R-1971: the manual repair advice is sealed as the README quotes it" (`// req: R-1971`) and "R-2092: the
    forward-slash repair advice is sealed as the config contract defines it" (`// req: R-2092`). They are the only
    places either literal appears in a test.
  - Builder process: by its two pi sessions, each build ran single test files and the repo checks only (trace, tree,
    map, readme), with no full or locked suite, as its brief asked. Neither build pushed or opened a pull request.
    Build 2 tried M14's wrong code in the worktree and reverted it, which its brief allowed.
  - Seat commits between and after the builds add only review files: b2f70350 (the pair table and its build-1
    output), e080b84c (build brief 2) and 425f77a0 (the M14 re-run output; the table's M14 target renamed to the new
    pin). The seat's notes commit adds only this record, the independent check, the Windows log, the two review briefs,
    HANDOFF and the session entry. No code changed after d22ad0b5; build 2's two checks are the only test change.
- CI on build 1, run 39388578351 on draft pull request #113 at d22ad0b5 (GitHub's merge commit 904c5f5b merges
  d22ad0b5 into its own ancestor 385c633f, so the tree tested is d22ad0b5's); all five jobs succeeded:
  - macOS `177 files: 175 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7856 pass, 0 fail, 27 skip`. objective-golden
    `1278 pass`, doctor-detail `71`, fresh-machine `9`, objective-injection `69`, config-normalize `23`,
    config-display-text `38`.
  - Ubuntu `177 files: 174 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7795 pass, 0 fail, 45 skip`. The same six files pass
    with the same counts. The third skipped file is main's checkout-spelling (no second spelling on a case-sensitive
    volume).
  - Windows `177 files: 160 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6791 pass, 0 fail, 104 skip`
    (`ci-windows-d22ad0b5.log`), Node v22.23.3. The 17 skipped files are main's declared set. objective-golden
    `1024 pass, 6 skip`; doctor-detail `67 pass, 1 skip` (the macOS-only desk service); fresh-machine `9`;
    objective-injection `69`; config-normalize `23`; config-display-text `36 pass, 2 skip`. The lane's five checks pass
    natively by title, beside the BYTE-IDENTICAL hook-vs-pi checks for the two Unicode fixtures and the gate fixture:
    ```
    PASS a pasted path with a backslash before u: both runtimes give the forward-slash repair, never file text
    PASS a bad escape in a gate pattern: both runtimes tell the user to write the backslash as two and name no config key
    PASS produceObjective with no settings object returns the internal-error marker, never throws
    PASS an internal producer error keeps the config-failure line before the internal-error marker
    PASS doctor gives the forward-slash repair for a pasted path with a backslash before u, never the file's text
    ```
  - install-check: macOS and Windows success. The workflow sets Node 22 on all three legs.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arises, since GitHub's merge commit holds d22ad0b5's
    tree.
- CI on build 2: the push of 434935e3 triggered run 39390992681 on #113 at 08:06 UTC. At this record's last look, about
  08:27 UTC, it was still running. Its Ubuntu suite had finished: `177 files: 174 PASS, 0 FAIL, 3 SKIP, 0 WARN ·
  checks: 7797 pass, 0 fail, 45 skip`, objective-golden `1280 pass` (build 1's 1278 plus the two pins), doctor-detail
  `71`. The Windows suite was in progress; the macOS suite and both install checks were queued. Build 2 added only two
  checks to one test file.
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS, Node 22.22.2, one
  shard. Declared in the table: (a) every pair runs on macOS with Node 22.22.2, and outside the table Node 24.22.0
  (through npx) gave the same V8 wording for the Unicode, bad escaped, control character, trailing comma and empty-file
  cases; (b) no pair removes the two new exports or the re-export, since a missing export is a crash, not wrong
  behaviour; (c) the files the lane left unchanged get no pair; (d) M9, M12, M13 and M14 probe the line's order in the
  catch branch, one physical line, V8's message in the line, and the contract text.
  - On d22ad0b5 (`seat-mutate-output-d22ad0b5.txt`, committed in b2f70350): 13 of 14 red, each by exactly its named
    titles, 0 with an unnamed red. Baselines: objective-golden 1278, doctor-detail 71, each 0 FAIL. The plan's W0 to
    W7 sit in the table as M1 (W0: R-2090, R-2091, R-2092, R-2093), M2 (W3: R-2090, R-2091), M3 (W6), M4 (W5) and M5
    (W2) (each R-2092), M6 (W7: R-1971, R-1972), M8 (W4: R-2093) and M10 (W1: R-2094). The seat's own: M7 (only the
    Unicode wording) and M11 (no bad escaped wording) each turn R-1971, R-1972 and R-2092 red; M9 (the config line
    after the marker) turns R-2094; M12 (the advice on two physical lines) turns R-1971, R-2090 and R-2092; M13 (V8's
    message in the line) turns R-1971, R-1972, R-2090 and R-2091.
  - Survivor M14: "Repair the JSON by hand." reworded to "Fix the file." turned nothing red. Build 1 rightly made
    R-1971's and R-1972's checks import the sentence, so no check held the sentence itself, though its comment calls it
    a contract value and the pack README quotes it. Build brief 2 sent it back.
  - On 434935e (`seat-mutate-output-434935e-M14.txt`, committed in 425f77a0): M14 alone, its target renamed to the new
    pin: 1 of 1 red, exactly "R-1971: the manual repair advice is sealed as the README quotes it". Baselines:
    objective-golden 1280, doctor-detail 71. M1 to M13 were not re-run on build 2. Adding two checks cannot turn any of
    them green. M3, M4 and M5 would now also turn the new R-2092 pin red, an unnamed red the table does not list
    (inferred from the code, not run).
- Independent check (`independent-check-d22ad0b5.md`): it ran on build 1, d22ad0b5, in a private clone with main
  385c633f beside it, a temp HOME for every probe and Node 22.22.2. HOLDS over 12 probes, no MUST. objective-golden 1278
  PASS and doctor-detail 71 PASS. The Claude Code hook launcher and the producer it runs (`bin/nana-objective.mjs`)
  printed the same output for each fixture it ran through both; pi's side is objective-golden's BYTE-IDENTICAL
  hook-vs-pi checks, which CI ran on all three legs. The new advice showed for an uppercase `C:\Users\…\umbrella` path,
  a lowercase `c:\users` path saved with a BOM and CRLF, a gate pattern and a `D:\logs` journal path. A
  `C:\new\umbrella` path, whose `\u` fails after a valid escape, changed only that one line against main. A valid
  config and a trailing comma gave main's bytes in the full hook output. Doctor's row carried the same detail. Called
  directly, the lane's parse helpers gave the manual advice with no place for an empty file and the new advice for a
  bad `\q` and an uppercase `\U`. The producer returned the internal-error marker for missing settings on darwin and
  forced win32, where main throws. Its two own mutants each turned only the expected checks red. Code map, readme check, tree and trace passed, and its clone left
  the worktree and the main checkout clean. Nobody re-ran it on build 2, which changed tests only. Its findings and how
  each was settled:
  - K1 (record keeping): HANDOFF still listed the four residuals this lane closes, and said a change in Node's wording
    fails two checks loudly. Settled in the seat's notes commit: the four win-config-json-path lines (the internal-error
    block no check forced, now R-2094; the backslash before u, now R-2090 and R-2091; the advice naming only the
    objective path, now R-2092; the throw with no settings, now R-2093) are removed. The Node-wording line now says
    such a change fails two to five checks, by which message changes. The seat counts that from the pairs M2 (2) and
    M11 (3), the control-character fixtures in R-1971 and R-1972, and the four checks that read the place. The new pins
    read our own sentences, not Node's wording, so they do not change that count.
  - K2 (minor): a file cut off inside a `\u` escape gets the forward-slash advice, with the right line and column.
    Recorded as a HANDOFF residual beside the raw-control-character one.
  - K3 (not verified): it did not run Node 24. The Node-wording line keeps it; the seat's table declares Node 24.22.0
    gave the same wording outside the pairs.
  - Note: the untracked `seat-mutate.mjs` it saw is the seat's, committed in b2f70350.
- The plan's known limits, each settled:
  - The gate-pattern check reads the phrase "backslash as two"; a reword that keeps the meaning fails it. HANDOFF
    residual.
  - That check's list of config keys is typed by hand; a key added later is not covered. HANDOFF residual.
  - A pasted path whose escapes are all valid still parses into a wrong path. HANDOFF already carries it; unchanged.
  - A raw control character that no backslash caused still gets the forward-slash advice. HANDOFF residual.
  - R-2093 serves no user today, since both callers always pass settings. Not a bug; no line.
  - Doctor's row carries the new advice only through the shared constant; no check reads doctor's row for a key name
    or the doubling clause. HANDOFF residual.
  - Node 24 went unchecked by the adversary and the independent check. Kept in the Node-wording line.
- HANDOFF: one Landed line. Four win-config-json-path residuals close and are removed; the Node-wording line is
  rewritten in place. New carried lines, each naming this lane: the phrase-bound check; the hand-typed key list; the raw
  control character; the cut-off `\u` escape (K2); doctor's row read only through the constant; the independent check
  on build 1 only, with the pairs on macOS only and only M14 re-run on build 2.
- Rows: R-2090 to R-2094 read `implemented` in REQUIREMENTS.md: R-2090 and R-2092 to R-2094 at the end of FEAT-001,
  R-2091 after R-1974 in FEAT-015. The seat helper's run at 425f77a0: `node scripts/requirements-trace.mjs` reads
  `requirements: 1548 total (1282 implemented · 1 planned · 34 retired · 226 untested · 5 violated); 1282 traced by
  tests` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 336 modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`; it compares against the merge base
  385c633f):
  ```
  tree movement 385c633..425f77a: 5 rows in 2 features
  FEAT-001 · Keep goals and priorities in view
    R-2090 new (implemented)
    R-2092 new (implemented)
    R-2093 new (implemented)
    R-2094 new (implemented)
  FEAT-015 · Diagnose the active environment
    R-2091 new (implemented)
  ```
  CAP-01 moves from 188 to 192 rows and FEAT-001 from 35 to 39; CAP-04 from 443 to 444 and FEAT-015 from 113 to 114.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite on build 1) and the local
  macOS install check, which runs before the land.
- Main was 385c633f when the lane branched. It has since moved to 445f4d5b: ci-suite-timeout and knowledge-index-pins
  landed. Those lands share with this lane only HANDOFF, the session archive, REQUIREMENTS.md and the tree, in other
  lines; none of this lane's code or test files. So the land needs a merge of main and a regenerated tree, and that
  merge needs its own accepted review coverage.
