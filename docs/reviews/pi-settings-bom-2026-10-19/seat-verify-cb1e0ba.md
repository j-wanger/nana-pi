# Seat checks — pi-settings-bom build 1, tip cb1e0ba (2026-10-19)

- Build, by a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`): one pass, verdict DONE, one commit
  cb1e0ba2 (rows R-1810 to R-1812, their three checks, the two parse sites, the live-machine check's reader, the
  regenerated tree and code map). The plan and the brief name a Claude Sonnet subagent as the builder; the build ran
  through pi-worker instead. Per the builder's report, not re-run by the seat: R-1810 and R-1811 failed before the fix;
  R-1812 passed there by design and turned red under its wrong codes; its six wrong-code tries each turned the named
  check red on macOS — parsing at doctor's site only (R-1810 and R-1811), at the shared steps site only (R-1810), and
  `.trim()`, removing every mark, removing a leading run of marks, and reporting a file that does not parse as present
  (R-1812 each); one existing check changed, the live-machine settings reader in pi-registration.test.mjs, which the
  brief names; the install check passed; the locked suite read 166 files, 0 FAIL. After cb1e0ba2, 51ac579d adds only
  the seat's pair table and its output, and the seat's notes commit adds only this record, the review briefs, the
  Windows log, HANDOFF and the session entry. No code or test changed in the lane after cb1e0ba2.
- CI run 39334448538 on draft pull request #80 (cb1e0ba2; GitHub's merge commit 20684fbf merges cb1e0ba2 into its own
  ancestor 22ccd849, so the tree tested is cb1e0ba2's):
  - macOS `166 files: 164 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7653 pass, 0 fail, 18 skip`. doctor-package-source
    `10 pass`; pi-registration `65 pass, 3 skip`; doctor-detail `68 pass`; install `104 pass`; doctor-runtime `21 pass`.
  - Ubuntu `166 files: 164 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7598 pass, 0 fail, 36 skip`. The same five files pass
    with the same counts.
  - Windows `166 files: 149 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6592 pass, 0 fail, 79 skip`
    (`ci-windows-run-1.log`). The 17 skipped files are the 16 declared desk files and bench's study-tasks.
    doctor-package-source `10 pass`; pi-registration `68 pass, 2 skip`; doctor-detail `64 pass, 1 skip`; install
    `94 pass, 6 skip`. All three must-meet checks run natively there and pass:
    ```
    PASS doctor prints the pi packages and pi package source rows for a pi settings.json saved with a byte-order mark as for the same file without one
    PASS two leading marks, a mark inside the object or malformed text after one mark leave pi's settings with no package entries for doctor and install
    PASS install reports a pi settings.json saved with a byte-order mark as registered and starts no pi
    ```
  - install-check: macOS and Windows success. None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2
    were fixed on main at ca27d86, and no R-291 merge artifact arises, since GitHub's merge commit holds cb1e0ba2's tree.
  - The live-machine check in pi-registration skips on every leg (`no ~/.pi/agent/settings.json on this machine`), so CI
    does not run its changed reader. The plan's probe A3 and the independent check's probe 6 ran it under a temp HOME.
- The seat's wrong-code pairs on macOS (`seat-mutate.mjs`, `seat-mutate-output-cb1e0ba2.txt`, committed in 51ac579d),
  through the shared mutation runner: 4 of 4 red, each by exactly its named titles, 0 survived; one shard on cb1e0ba2,
  macOS, Node 22.22.2; baselines doctor-package-source 10 PASS and pi-registration 65 PASS. M1 puts main's plain
  `JSON.parse` back at doctor's package-source read (R-1810 red). M2 does the same at `packageCoverage`, the shared read
  behind install's pi packages step and doctor's pi packages row (R-1810 and R-1811 red). M3 removes every mark at
  doctor's read and M4 removes a leading run of marks at `packageCoverage`; they are the only pairs that turn R-1812
  red. Declared, no pair: doctor.mjs's added import line (M1 leaves it in place, unused), and the test-side
  live-machine reader, which is test code.
- Independent check (`independent-check-cb1e0ba.md`, a private clone at cb1e0ba2 and main 22ccd849 beside it, a temp
  HOME or `--home` for every probe): HOLDS, no MUST, ten probes. doctor-package-source 10 PASS and pi-registration 65
  PASS as single files, with no write outside temp. The real doctor CLI on mark+CRLF settings goes from `· pi packages …
  not covered` with no source row on main to ✓ on both rows, as for the unmarked file (P1). A real install starts no pi
  where main ran `pi --version` and two `pi install` calls, and leaves the file's bytes and mark (P2). Forced win32 gives
  `unchanged`, 0 spawns, where main gives `created`, 3 spawns (P3). Four entry shapes read the same marked and unmarked
  (P4). UTF-16LE, a mark after whitespace, a mark alone, an empty file and a mark then `[]` read as on main, with no
  throw; a mark, then CRLF and spaces before the object, now reads as registered, as pi reads it (P5). The live
  check crashes on main and passes on the lane (P6). pi 1.0.2's own reader removes one leading mark, the same rule (P7).
  Its own wrong code at the steps site turns R-1810 and R-1811 red (P8). map, readme (709 claims) and the tree movement
  read clean (P9). Its findings and how each was settled:
  1. Known bug, not MUST (P10): a pi settings file holding a mark then `null` read as not covered on main and now
     crashes doctor and `install --dry-run` with a TypeError, as an unmarked `null` already did on main. pi always
     writes an object, so the input is outside honest variation. Recorded as a HANDOFF residual, beside a new residual
     for the plan's known limit 3 (bare `null`); one fix, reading packages only from an object, covers both.
  2. Not a finding: the seat's pair table and output were untracked in the worktree when the check ran. Settled:
     51ac579d commits both, and the final review covers the tip that includes them.
- The plan's other known limits: the frozen desk still reads pi's settings file with plain `JSON.parse` (HANDOFF
  residual, naming this lane); a UTF-16 settings file stays unreadable, as it does to pi itself, so doctor's view
  matches pi's and HANDOFF gets no line for it; R-1811 is install behaviour homed in FEAT-015, and whether the install
  feature shares it joins HANDOFF's open byte-order-mark question for the owner; pi drops the mark on its next settings
  write, so the bug shows only for a short window. The seat removed HANDOFF's bom-pack-config residual that said doctor
  and install still read pi's own settings file without removing a leading mark (plan known limit 6).
- A note on the plan's text: the adversary's amendment 3 says every mark in the docs is now the escape, but
  `must-meet.md`, `plan-attack.md` and `build-brief-1.md` each still hold two lines with a literal U+FEFF where the
  escape `\uFEFF` was meant. The test source holds only the escape, so the build is unaffected; the plan of record
  stays as written.
- Rows: R-1810 to R-1812 read `implemented` in REQUIREMENTS.md, directly after R-1586 in FEAT-015. The seat helper's
  re-run at 51ac579d: `node scripts/requirements-trace.mjs` reads `1399 total (1115 implemented · 1 planned · 24
  retired · 254 untested · 5 violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 319
  modules, 0 problems; `npm run readme:check` reads 709 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge-base 22ccd849): `22ccd84..51ac579:
  3 rows in 1 features`, FEAT-015 · Diagnose the active environment, R-1810, R-1811 and R-1812 new (implemented).
  CAP-04 moves from 354 to 357 rows and FEAT-015 from 76 to 79.
- Not yet run: the seat's local macOS install check, which runs before the land.
- Main was 22ccd849 when the lane branched, its merge base. Main has since moved to f497c5ad (the review-ledger-run-
  reviewer, adopt-structure-markers and stale-copies-hooks lands), so the land needs a merge of main, and that merge
  needs its own accepted review coverage.
