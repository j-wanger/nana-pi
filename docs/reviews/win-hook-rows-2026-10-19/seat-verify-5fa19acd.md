# Seat checks — win-hook-rows build 1, tip 5fa19acd (2026-10-19)

- Build, by a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`): one pass, one commit 5fa19acd (rows R-1860
  and R-1861, R-349 narrowed, R-937's evidence trimmed, the two new checks in win32-degrade, the R-1081 pin, stepHooks
  and hookLinkRows returning no rows on win32, the `skipped` field dropped from hook-health's rows, doctor and the
  stale-copy producer reading `ok` only, the pruned win32 doctor note list, the README sentence and test-table cell, the
  title map, the regenerated tree and code map). The brief's header and the adversary's amendment 11 name a Claude
  Sonnet subagent as the builder; the build ran through pi-worker with gpt-5.6-sol (its log names that builder). After 5fa19acd, e1c431f1 adds only the
  seat's pair table and its output, and the seat's notes commit adds only this record, the independent check, the two
  Windows logs, the review briefs, HANDOFF and the session entry. No code or test changed in the lane after 5fa19acd.
- CI run 39347845476 on draft pull request #85 (5fa19acd; GitHub's merge commit 96826422 merges 5fa19acd into its own
  ancestor f0d6da24, so the tree tested is 5fa19acd's):
  - macOS `167 files: 165 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7660 pass, 0 fail, 25 skip`. win32-degrade `87 pass`;
    stale-copies `13 pass`; install `104 pass`; install-check `106 pass`; doctor-quiet `4 pass`; retired-artifacts
    `48 pass`; doctor-detail `68 pass`; hook-producers `10 pass`; settings-merge `217 pass`.
  - Ubuntu `167 files: 165 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7605 pass, 0 fail, 43 skip`. The same nine files
    pass with the same counts.
  - Windows `167 files: 150 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6600 pass, 0 fail, 78 skip`
    (`ci-windows-5fa19acd.log`). The 17 skipped files are the 16 declared desk files and bench's study-tasks, main's
    declared set. win32-degrade `86 pass`; stale-copies `13 pass, 1 skip`; install `88 pass, 5 skip`; install-check
    `106 pass`; hooks-win32-exec `31 pass`; settings-merge `210 pass, 7 skip`. Both must-meet checks and the pin run
    natively there and pass:
    ```
    PASS pin R-1081: the doctor note list
    PASS win32 install prints no row labelled with a Claude Code hook script
    PASS win32 doctor prints no row labelled with a Claude Code hook script
    ```
  - install-check: macOS and Windows success. The Windows job (`ci-install-check-windows-5fa19acd.log`) prints PASS
    for every hook row (hook set, shared memory, roster notice, knowledge pull, verifier pipe for PowerShell and Bash,
    adoption, objective) and `PASS doctor`. Its doctor step fails any note row off the pruned list, so doctor's real
    win32 output carried no hook-file note row.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arises, since GitHub's merge commit holds 5fa19acd's
    tree.
- The seat's wrong-code pairs (`seat-mutate.mjs`, `seat-mutate-output-5fa19acd.txt`, committed in e1c431f1), through
  the shared mutation runner on macOS with win32 forced through `NANA_SETUP_PLATFORM` where the code branches on it:
  7 of 7 red, each by exactly its named titles, 0 survived; one shard on 5fa19acd, Node 22.22.2; baselines
  win32-degrade 87, stale-copies 13, install 104 and install-check 106 PASS. M1 (stepHooks prints main's five skip
  rows) turns R-1860 red. M2 (hookLinkRows returns main's five win32 rows, ok false, while doctor and the producer
  read ok only) turns R-1861, R-937's two doctor checks and stale-copies R-1763 and R-1764 red. M3 (hookLinkRows,
  doctor and the producer all back to main) turns R-1861 red. M4 (doctor keys hook-link rows on the removed field)
  turns install.test's two missing-piece checks and R-1761 red. M5 and M6 (the producer keys hook-link or
  hook-settings rows on the removed field) each turn R-1760 to R-1763 red. M7 (the win32 note list keeps main's five
  hook labels) turns the R-1081 pin red. Declared, no pair: the native proof is CI's Windows suite and install-check
  legs; the removed field has no reader left; the README, the rows and hook-health's header carry no runtime
  behaviour.
- Independent check (`independent-check-5fa19acd.md`, a private clone at 5fa19acd and a baseline clone at f0d6da24,
  a temp HOME or `--home` for every probe, single test files only): HOLDS, no MUST, ten probes. win32-degrade 87 PASS
  with both new checks, stale-copies 13 PASS and install-check with the R-1081 pin, as single files. Forced win32
  install and doctor differ from main only by the five removed hook rows; install's summary goes from 11 skipped to 6,
  six settings rows print, and no hooks folder is made (probes 1, 2). macOS install and doctor are byte-identical to
  main's, and the five hook links still exist (probe 3). The stale-copy line still names a missing hook link on macOS
  and a broken settings entry on forced win32, as main does, and stays silent on a healthy home (probes 4, 5).
  Forced win32 re-install and dry run print no hook-script label and write nothing in the dry run (probe 6). map,
  readme (710 claims), trace and tree movement read clean (probe 7). Six neighbouring files pass (probe 8). Its own
  wrong code: restoring the skip rows turns only R-1860 red, five ok:true hook rows on win32 turn only R-1861 red,
  and a relabel without the file name stays green, as the plan's known limit says (probe 9). Forced-win32 doctor
  prints no hook-file note row (probe 10). Its findings and how each was settled:
  1. Known bug, not MUST: HANDOFF's hooks-on-Windows residual still said doctor's hook-file rows read
     `skipped (win32)` above the settings rows. The plan names its removal as a seat duty. Settled in the seat's notes
     commit: the sentence now says doctor on Windows prints the six settings rows and no hook-file row.
  2. Known bug, not MUST: comments in `lib/settings.mjs` (line 180) and `tests/install.test.mjs` (lines 103, 329 and
     374) still say stepHooks skips the hook entries on win32. The behaviour they describe, no hook file on win32,
     still holds; no user sees them. Recorded as a HANDOFF residual.
  3. Not new: a win32 row relabelled without its file name passes both new checks (the plan's known limit). Recorded
     as a HANDOFF residual; only the Windows install-check note list would catch such a doctor row.
- The plan's other known limits, each a HANDOFF residual unless said: no check runs `install --dry-run`, though it runs
  the same stepHooks (the independent check's probe 6 saw it clean); R-349 stays untested, and a later pin of it must
  not expect hook-file rows; the desk service's own `skipped (win32)` row does not change (not a bug, no line); the
  proof here is forced win32 on macOS, and CI's Windows legs carry the native proof (no line).
- stale-copies-hooks' Fable r1 NOTE 5 (hook-health's win32 hook link rows carried ok:false with skipped:true, so a
  caller reading ok alone would count every win32 hook as broken) is settled by this lane, which removes those rows.
  HANDOFF never carried it, so no line changed.
- Rows: R-1860 and R-1861 read `implemented` in REQUIREMENTS.md, in SUB-015 directly after R-1051. The seat helper's
  re-run at the notes commit: `node scripts/requirements-trace.mjs` reads `1427 total (1142 implemented · 1 planned ·
  29 retired · 250 untested · 5 violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 322
  modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge-base f0d6da24): `f0d6da2..e1c431f:
  3 rows in 1 features`, FEAT-013 · Install and connect harness runtimes: R-349 text changed, R-1860 and R-1861 new
  (implemented). R-937's evidence also changed (the report lists text and status, not evidence). CAP-04 moves from 376
  to 378 rows, FEAT-013 from 126 to 128 and SUB-015 from 35 to 37.
- Not in this record: a locked full-suite run (CI's three legs ran the whole suite) and the local macOS install check,
  which runs before the land.
- Main was f0d6da24 when the lane branched, its merge base. Main has since moved to 4656f646 (the pwsh-lexer-oracle
  land), so the land needs a merge of main, and that merge needs its own accepted review coverage. pwsh-lexer-oracle
  also edited HANDOFF's hooks-on-Windows residual, the end of the Landed list and the end of the residuals.
