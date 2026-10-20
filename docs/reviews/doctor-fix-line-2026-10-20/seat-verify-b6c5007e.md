# Seat checks — doctor-fix-line builds 1 and 2, tip b6c5007e (2026-10-19)

- Builds, by a pi gpt-5.6-sol builder through pi-worker. Build 1 (`build-brief-1.md`): one commit 87efebe6 (rows
  R-1990 to R-1996; runDoctor asks install's own dry run which ✗ rows install repairs and prints the four last-line
  forms; diagnose's `add` takes an optional install label, which three rows pass; the setup README's paragraph and
  tests-table row; the new `doctor-fix-line.test.mjs`; the regenerated code map and tree). Build 2
  (`build-brief-2.md`): one commit f44248c7. A dry-run error that is not a SetupError now prints every row and then
  `could not predict nana-setup install repairs (<code>) — <n> missing — run: nana-setup install`, exit 1, no stack;
  R-1997 and its check pin it. The test file now sets `process.exitCode` instead of calling `process.exit`, and
  R-1995's failure detail is bounded. After f44248c7, 76a4ea5d adds only the pair output, and b6c5007e merges main
  bdc65eba (mutation-runner-win-lock's land) with no conflict. The seat's notes commit adds only this record, the
  independent check, the Windows log, the review briefs, HANDOFF and the session entry. No code or test changed in
  the lane after f44248c7 except through that merge.
- CI on build 2, run 39373655522 on draft pull request #102 at b6c5007e (GitHub's merge commit dda56575 merges
  b6c5007e into its own ancestor bdc65eba, so the tree tested is b6c5007e's):
  - macOS `174 files: 172 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7786 pass, 0 fail, 27 skip`. doctor-fix-line
    `9 pass` (the eight checks and the file's closing tally line); doctor-detail `68`; relative-agent-dir `30`;
    doctor-quiet `4`; doctor-runtime `21`; install `107`; stale-copies `13`; win32-degrade `87`.
  - Ubuntu `174 files: 172 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7731 pass, 0 fail, 45 skip`. The same eight files
    pass with the same counts.
  - Windows `174 files: 157 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6722 pass, 0 fail, 103 skip`
    (`ci-windows-b6c5007e.log`). The 17 skipped files are main's declared set. doctor-fix-line `9 pass`, every check
    native and by title:
    ```
    PASS R-1990: when install repairs every ✗ row, the summary reads n missing — run: nana-setup install
    PASS R-1995: doctor on a home install would change leaves every file, folder and link unchanged
    PASS R-1991: when no ✗ row is install's, the summary lists each as a fix by hand and never names install
    PASS R-1992: a refused skill and two missing rules: the summary lists only the skill by hand and gives install the other 2
    PASS R-1993: on win32's real home with its bin folder off the Path, the summary lists PATH resolves pi-review as a fix by hand
    PASS R-1994: when install refuses the home, the summary names the refusal instead of telling the user to run install
    PASS R-1996: with a ! row, both by-hand summary forms still end with the ! count
    PASS R-1997: a non-refusal dry-run error prints every row and bounded fallback advice without a stack
    PASS summary: 0 failures
    ```
    doctor-detail `64 pass, 1 skip`; relative-agent-dir `30`; doctor-quiet `4`; doctor-runtime `9 pass, 2 skip`;
    install `91 pass, 5 skip`; stale-copies `13 pass, 1 skip`; win32-degrade `86 pass, 1 skip`.
  - install-check: macOS and Windows success.
  - So the plan adversary's most likely wrong claim, that native Windows behaves as forced win32 does on macOS, held
    for this lane: R-1991 (`install --home` leaves only pi-subagents ✗) and R-1992 (install refuses the foreign spec
    folder) pass natively on Windows.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arises, since GitHub's merge commit holds b6c5007e's
    tree.
- CI on build 1, run 39371938014 at 87efebe6: macOS `172 PASS, 0 FAIL, 2 SKIP` of 174 files (7,784 checks pass);
  Ubuntu `172 PASS, 0 FAIL, 2 SKIP` (7,729); install-check passed on macOS and Windows. The Windows suite leg was
  cancelled when build 2's push superseded the run.
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS, one shard, Node
  22.22.2; the R-1993 and R-1997 checks force win32 through `NANA_SETUP_PLATFORM`:
  - Build 1 (87efebe6, `seat-mutate-output-87efebe6.txt`, committed in 1d107467): 15 of 18 red, 3 survived (D1, D2,
    D3). W1 to W8, W4b, W4c, W6b and A1 to A4 each turned their named titles red. D1 to D3 named no title; they ran
    to show whether any check covers them. D2 (every dry-run error reads as a refusal) survived because no check made
    the dry run throw anything but a SetupError; it went to build 2 with the independent check's known bug A. Under
    W5 the file's `process.exit` cut piped stdout at 64 KiB, so no check after R-1995 printed; build 2 fixed that.
  - Build 2 (f44248c7, `seat-mutate-output-f44248c.txt`, committed in 76a4ea5d): 18 of 20 red, 2 survived (D1, D3),
    both declared. D2 now turns R-1997 red, and so do the new D4 (the fallback prints today's run-install line without
    the could-not-predict prefix) and D5 (the fallback rethrows every non-SetupError, main's crash). Under W5 the later
    checks now print, and R-1996 also goes red there.
  - D1 (the dry run skips the relative agent folder refusal) survives: no check reads doctor's last line with a
    relative `PI_CODING_AGENT_DIR` and a ✗ row, a gap the plan's known limits name. D3 (the by-hand labels repeat a
    shared label) survives: no check has two ✗ rows with one label. Both are HANDOFF residuals.
  - Every red pair also shows one unnamed red: the file's closing tally line, `FAIL summary: <n> failures` (the
    table's declared (e)). It is not a check, but the runner cannot tell it from one. Several older test files print
    such a line too. Recorded as a HANDOFF residual about the mutation runner.
  - Declared, no pair: the `bad.length` gate on the dry run (with no ✗ row the summary is never printed, so the gate
    changes only cost) and the header and README text.
- Independent check (`independent-check-87efebe6.md`): it ran on build 1, 87efebe6, not on b6c5007e, in a private
  clone, with a temp HOME for every run and single test files only. HOLDS, no MUST, 13 probes. The lane's test file
  passed 7 of 7, and doctor-detail, relative-agent-dir, win32-degrade, stale-copies and doctor-quiet passed 68, 30,
  87, 13 and 3. An empty home, a fresh real home, a relative agent folder, a `.claude` regular file, an unreadable
  settings file, ten odd settings shapes, a forced-win32 home with a deleted and a tampered rule, a `!`-only home, a
  fully installed home and a leftover lock each gave the expected form with no stack trace (probes 1 to 5, 7, 11 to
  13). Probes 2 and 11 compared the home before and after: unchanged, apart from one knowledge index timestamp that
  main's doctor changes too. Its findings and how each was settled:
  1. Known bug A (probe 6): on the forced-win32 copy path, an unreadable rule copy made the dry run throw a
     non-SetupError, so doctor printed a stack trace where main printed `2 missing — run: nana-setup install`. Fixed in
     build 2, f44248c7, with R-1997: the fallback line `could not predict nana-setup install repairs (<code>) — <n>
     missing — run: nana-setup install`. The pairs D2, D4 and D5 turn R-1997 red, and CI passes it on all three legs.
  2. Known bug B (probe 10): when `.claude` is a link, install refuses every skill, so the last line lists those
     skills under "fix by hand as each ✗ line says", while those ✗ lines say to run install. Main's line ("run:
     nana-setup install" for all 33) was no better. Recorded as a HANDOFF residual.
  3. Probe 2: doctor on a fresh temp real home took 0.54 s on the lane against 0.35 s on main, the extra `pi
     --version` the dry run starts, which the plan names. Recorded as a HANDOFF residual.
  4. Probe 8, found on main too: a `nana-pack.json` with `{"objective":{"path":5}}` stops doctor with `TypeError:
     p.startsWith is not a function` inside diagnose, on main and the lane alike. Recorded as a HANDOFF residual.
  5. Probe 9, found on main too and a documented limit: with the shared memory folder replaced by a regular file,
     the last line says to run install, and the real install then fails with EEXIST. Folded into the residual on the
     last line trusting install's prediction.
  6. Probe 3 covered the relative agent folder refusal by hand; no test pins that branch (pair D1 above).
- The plan's other known limits, each a HANDOFF residual: `PATH resolves pi-review` is always listed by hand, even
  when the bin folder is on the Path and only the launcher is missing, which install does fix; the last line trusts
  install's prediction (a leftover settings lock, rules or `.pi` saved as a file, a failed knowledge build or a failed
  `pi install` still get run install); some ✗ lines name no fix (desk service, a corrupt knowledge index, an
  unparseable `nana-pack.json`, a POSIX skill link to another folder); the refusal form shows only the first line;
  on a real home with unregistered pi packages the dry run starts `pi --version` once more. The plan's last limit,
  native Windows not probed, is settled by CI's Windows leg above.
- HANDOFF's "Doctor's skill advice" residual and the win-path-commands residual on the bin folder off the Path now
  say that doctor's last line lists those rows by hand; the rows themselves are unchanged.
- Rows: R-1990 to R-1997 read `implemented` in REQUIREMENTS.md, in FEAT-015 directly after R-1766. The seat helper's
  re-run at the notes commit: `node scripts/requirements-trace.mjs` reads `1515 total (1249 implemented · 1 planned ·
  34 retired · 226 untested · 5 violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 332
  modules, 0 problems; `npm run readme:check` reads 716 claims, 0 problems; `node scripts/requirements-tree.mjs
  --check` exits 0.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base bdc65eba`, the merge base):
  ```
  tree movement bdc65eb..b6c5007: 8 rows in 1 features
  FEAT-015 · Diagnose the active environment
    R-1990 new (implemented)
    R-1991 new (implemented)
    R-1992 new (implemented)
    R-1993 new (implemented)
    R-1994 new (implemented)
    R-1995 new (implemented)
    R-1996 new (implemented)
    R-1997 new (implemented)
  ```
  CAP-04 moves from 416 to 424 rows and FEAT-015 from 96 to 104.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite) and the local macOS install
  check, which runs before the land.
- Main was bdc65eba when the lane merged it at b6c5007e, its merge base. Main has since moved to cdf4b098 (the
  review-test-waits land). That land changes HANDOFF, the session archive, REQUIREMENTS.md, the tree, the code map
  and the review tools' tests, none of the lane's code. So the land needs a merge of main, and that merge needs its
  own accepted review coverage.
