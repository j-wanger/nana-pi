# Seat checks — doctor-path-row-remedy builds 1 and 2, tip a63d9ecf (2026-10-20)

- Builds, by a Claude Sonnet 5 builder (two builds); the lane branched from main 72abe19a, with the plan at 471df5e0
  (`must-meet.md`, `plan-attack.md`: one adversary, AMEND, six amendments):
  - Build 1 is one commit, 452cd604 (`build-brief-1.md`). `packages/nana-setup/lib/doctor.mjs`, the PATH section's
    two branches: doctor finds `binAt`, the first PATH entry equal to the bin folder (win32: split on `;` with
    findOnPath's trim and quote strip, `path.win32.resolve` on both sides, lowercased; POSIX: split on
    `path.delimiter`, `path.resolve`). `installFixes = !matches && binAt >= 0 &&` no pi-review resolves from the
    entries before `binAt` (POSIX `firstOnPath(name, slice)`; win32 `findOnPath(name, { env: { PATH, PATHEXT } })`,
    with no spread of `process.env`). When it holds, the detail reads `<found | not found>; <bin> is on PATH — run
    \`nana-setup install\` to recreate the launcher` and the row carries installLabel `PATH pi-review`, so install's
    dry run decides the last line; otherwise the row is main's. `nana-setup.mjs`, `steps.mjs` and `fsops.mjs` are
    unchanged. The setup README's dry-run paragraph states the new rule in place of "A row with no install step, such
    as `PATH resolves pi-review`, is listed by hand." `tests/doctor-fix-line.test.mjs` gains `runOnPath` (sets PATH to
    exactly the given entries and spawns the CLI directly, never through `run()` or `withPiStub`), `byHandOf` (R-1993's
    by-hand regex, now shared; R-1993 uses it with the same meaning), `byHand`, `toInstall` (the plain run-install or
    then-run form only, so the refusal and could-not-predict lines fail it) and `pathRowDetail`, and the six checks
    R-2320 to R-2325. Rows R-2320 to R-2325 sit in FEAT-015 after R-1997.
  - 3005686b adds the seat's macOS pairs on 452cd604; ec8254be adds the Windows-only pairs (`seat-mutate-win.mjs`,
    `win-pairs.mjs`, record `seat-mutate-win-output-3005686b.txt`).
  - Build 2 is a63d9ecf, tests only, with no brief file in this folder: CI's first run (39439715494, on 452cd604)
    failed the requirements trace, because each new check's `// req:` marker sat above a `check(` call whose title was
    on the next line. Build 2 moved each of the six titles onto its `check(` line (6 insertions, 12 deletions, one
    file) and changed nothing else.
  - 333767cf merges main 5ef07f7f (the objective-path-shapes land tip, now main). In the lane's files it touched
    `doctor.mjs` only at the `pi objective.path` row and the module header, and the setup README in another paragraph;
    the PATH section and `doctor-fix-line.test.mjs` are as a63d9ecf left them. After 333767cf, the seat's notes commit
    adds only this record, the independent check, the Windows log, the two review briefs, HANDOFF and the session
    entry.
- CI run 39442784960 on draft pull request #133 at a63d9ecf (build 2; GitHub's merge commit b907d33b merges a63d9ecf
  into 72abe19a); the three suite legs and both install-check jobs passed:
  - macOS `190 files: 188 PASS, 0 FAIL, 2 SKIP` (7,968 checks pass).
  - Ubuntu `190 files: 187 PASS, 0 FAIL, 3 SKIP` (7,907 checks pass).
  - Windows `190 files: 172 PASS, 0 FAIL, 18 SKIP, 0 WARN · checks: 6893 pass, 0 fail, 112 skip`
    (`ci-windows-a63d9ecf.log`). The 18 skipped files are main's declared set (desk files are declared skips).
    doctor-fix-line `15 pass`: R-1990 to R-1997 and R-2320 to R-2325 each print PASS, plus `PASS summary: 0
    failures`. So the win32 earlier-entry lookup ran natively there, and the win32 half of R-2324 and R-2325 holds.
    That was the plan's claim most likely wrong.
  - install-check: macOS and Windows success.
  - None of main's known failures showed (Ubuntu's path spelling GP1 and GP2, fixed on main at ca27d86; a pull
    request run's R-291 leaf-total merge artifact).
  - CI has not run on 333767cf or the notes commit. The seat ran `node packages/nana-setup/tests/doctor-fix-line.test.mjs`
    on 333767cf (macOS, Node 22.22.2): 14 checks PASS and `PASS summary: 0 failures`, exit 0, no change left in the
    worktree. The land runs the locked suite on the reviewed tip, and the local macOS install check runs before the
    land.
- The seat's wrong-code pairs:
  - macOS, on 452cd604 (`seat-mutate.mjs`, the shared mutation runner, Node 22.22.2, one shard, merge base 72abe19a;
    record `seat-mutate-output-452cd604.txt`, commit 3005686b): 12 of 12 red, 0 survived; baseline doctor-fix-line
    15 PASS. Every pair turns each of its named checks red; the runner's "12 with an unnamed red" counts only the
    file's closing `FAIL summary: <n> failures` line (declared (c)).
    - POSIX: M1 (the row to install whenever it is wrong) turns R-2322 and R-2324 red; M2 (the bin folder on PATH is
      enough) R-2324; M3 (the bin-folder guard dropped) R-2322; M4 (no pi-review anywhere on PATH instead of none
      before the bin folder) R-2325; M5 (the install label with today's add-to-PATH detail) R-2320; M6 (the row's own
      label, which install's dry run never reports) R-2320, R-2321 and R-2325; M7 (PATH split on the win32 separator)
      R-2320, R-2321 and R-2325.
    - win32, forced on macOS: M8 (exact letter case) R-2323; M9 (the guard dropped) and M10 (the row to install
      whenever it is wrong) R-1993; M11 (the row's own label) R-2323; M12 (the host's separator) R-2323.
    - Declared before the run: (a) four win32 sites cannot go red on macOS, because forced-win32 `findOnPath` never
      finds a file there: the earlier-entry lookup, its env with no `process.env` spread, its `found === null` form
      and the win32 detail text. (b) win32's trim and quote strip of Path entries and POSIX's `path.resolve` compare
      (the plan's trailing-slash known limit) have no test on any platform, so no pair. (c) the closing tally line.
  - Windows, the four declared (a) sites, on a scratch windows-latest CI job (branch `seatmut/doctor-path-row-remedy`,
    commit f192b8c7 = 3005686b plus the table and a Windows-only CI step; run 39441798915; record
    `seat-mutate-win-output-3005686b.txt`, commit ec8254be): 3 of 4 red. W1 (the bin folder on the Path is enough)
    turns R-2324 red; W3 (no pi-review anywhere on the Path) R-2325; W4 (the install label with today's add-to-Path
    detail) R-2320. W2 (the earlier-entry lookup spreads `process.env`) survived, as the table declared before the
    run: it differs only when the environment spells the key `Path`, and the CI environment spells it `PATH`. No check
    sets that spelling: a HANDOFF residual. The table also declared no pair for dropping PATHEXT from the lookup's env,
    because findOnPath's default PATHEXT holds .CMD too. Its baseline reads 16 PASS where CI's file line reads 15:
    `win-pairs.mjs` runs the file through `npm test` and counts the runner's own `PASS  <file>` line as well.
  - Build 2 changed only the check titles' line breaks, and the merge of 5ef07f7f left the PATH section alone, so the
    pairs on 452cd604 still describe the code. The seat did not re-run them.
- Independent check (`independent-check-a63d9ecf.md`, filed under this tip's name): it ran on 452cd604 in a private
  clone, with a baseline clone at 72abe19a, a temp HOME, a stub pi, a controlled PATH and the CLI under `env -i`.
  HOLDS, no MUST, over ten probes (P1 to P10).
  - Must-meet file on 452cd604: R-1990 to R-1997 and R-2320 to R-2325 PASS, `PASS summary: 0 failures`.
    doctor-runtime 21, win-shims 2 and doctor-detail 72 PASS lines, no FAIL; readme-check 724 claims, 0 problems;
    code-map --check 0 problems.
  - The healthy home prints the same as main (P1). With the launcher removed and the bin folder on PATH, the lane's
    advice is right: install prints `+ PATH pi-review  created`, and the next doctor run shows ✓ (P2). A launcher
    linked to another checkout gets the same advice, and install relinks it (P4). The owner's own executable
    `pi-review` in the bin folder is backed up before install links (P5). Forced win32 with a padded, quoted,
    upper-cased, trailing-slash Path entry gives the row to install (P7); a `.local/bin2` entry is not the bin folder
    (P8); an unset PATH prints the by-hand row with no stack (P9); a non-executable earlier pi-review is skipped, as
    zsh and bash skip it (P10).
  - Its findings and how each was settled:
    1. Known bug, in the plan's Known limits: install's PATH check compares exact strings. With a trailing-slash or
       doubled-slash PATH entry, doctor says the bin folder is on PATH and to run install, and install then says it is
       not on this shell's PATH; the launcher is still created (P3). Recorded as a HANDOFF residual.
    2. Known bug, in the plan's Known limits: a PATH entry that reaches the bin folder through a linked parent counts
       as off PATH, so doctor gives today's add-to-PATH advice (P6). Recorded as a HANDOFF residual.
    3. Unverified at the time: the native win32 earlier-entry lookup (the Windows half of R-2324 and R-2325). Settled:
       CI's Windows leg passed both checks on a63d9ecf, and the Windows pairs W1 and W3 turned them red.
  - Its harm check: no data lost, no write outside a temp folder, the gate and land tools untouched, and the healthy
    case unchanged from main. Its stat walk saw only the knowledge index's SQLite side file change, which main's
    doctor also does (an existing HANDOFF line).
- The plan's other known limits, each now a HANDOFF residual naming this lane: an earlier pi-review on PATH still
  gets the add-to-PATH advice; on win32 a pi-review .bat or .exe in the bin folder that PATHEXT finds before .cmd still
  counts as install's repair; on POSIX an intact link to a target that cannot run gets the run-install advice while
  the last line lists the row by hand; the zsh command still names `$HOME/.local/bin` for any bin folder (predates the
  lane); the stale-link case and the trailing-slash compare are unpinned (one line with declared (b)). The Windows-leg
  proof limit is settled by the green Windows leg.
- HANDOFF: one Landed line. doctor-fix-line's residual "it always lists the Path row for pi-review by hand" goes,
  because the lane fixes it. Eight new residuals name this lane. win-path-commands' Path line still holds, since a
  bin folder off the Windows Path stays a fix by hand.
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2320 to R-2325 read `implemented` in REQUIREMENTS.md. At 333767cf (no code or row changed since):
  `node scripts/requirements-trace.mjs` reads `requirements: 1637 total (1400 implemented · 1 planned · 37 retired ·
  193 untested · 6 violated); 1400 traced by tests` and `ears: 0 rows off form (allowance 0)`; `npm run map:check`
  reads 357 modules, 0 problems; `npm run readme:check` reads 725 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base 5ef07f7f`, run at 333767cf):
  ```
  tree movement 5ef07f7..333767c: 6 rows in 1 features
  FEAT-015 · Diagnose the active environment
    R-2320 new (implemented)
    R-2321 new (implemented)
    R-2322 new (implemented)
    R-2323 new (implemented)
    R-2324 new (implemented)
    R-2325 new (implemented)
  ```
  CAP-04 moves from 500 to 506 rows and FEAT-015 from 138 to 144. No existing row's text changed; R-1993's check
  reads its by-hand list through the shared `byHand` helper with the same meaning.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite at a63d9ecf) and the local
  macOS install check, which runs before the land.
- Main moved under this lane: the lane branched from 72abe19a, and CI ran on a63d9ecf against it. The seat merged the
  objective-path-shapes land tip 5ef07f7f at 333767cf; that lane has since landed by fast-forward, so main is 5ef07f7f,
  the merge base and the review base. lane-guard-temp-root and linked-claude-folder-remedy land before this lane; their
  HANDOFF lines reach this branch at its next merge of main, and none says a line this lane adds.
