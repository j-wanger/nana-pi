# Seat checks — install-dry-run-pi-packages build 1, tip 30a5baf9 (2026-10-19)

- Lane class: install, hook or gate, as planned. `git diff --stat 3d380ba3..30a5baf9` names five files:
  `packages/nana-setup/lib/steps.mjs` (`stepPiRegister` only: the early dry-run return deleted, `if (install &&
  o.dryRun) return { status: 0 };` in `launch` right after the refusal check, the final detail chosen by `o.dryRun`),
  `packages/nana-setup/tests/pi-registration.test.mjs` (two new blocks before the R-392 manifest check), the setup
  README (two sentences), REQUIREMENTS.md and the tree. The code map is unchanged. The lane touches
  `packages/nana-setup/`, so the seat runs `node packages/nana-setup/bin/install-check.mjs` on macOS before nana-land
  (not yet run; CI's macOS and Windows install checks passed).
- Builder: a pi gpt-5.6-sol builder through pi-worker, one build (30a5baf9). Build brief 1's header still names a Claude
  Sonnet subagent, the plan adversary's suggestion; the seat started the pi builder instead.
- One departure from the plan, for the reviewer: must-meet Design 4 put the dry-run sentence in the README's test-table
  cell for `tests/pi-registration.test.mjs`. The build put it in the `pi packages` row of the install table ("`install
  --dry-run` reports decisions made before the first `pi install`, otherwise reports what it would add, and starts no
  `pi install`.") and left the test-table cell unchanged. The Idempotence sentence went in as planned. The readme check
  passes.
- CI run 39360691316 on draft pull request #95 at 30a5baf9. GitHub's merge commit `bbbac35c` puts the tip onto
  `d4423eff`, the lane's base, so the CI tree holds only the lane's change. macOS `168 files: 166 PASS, 0 FAIL, 2 SKIP`
  (7,730 checks pass, 0 fail, 26 skip); Ubuntu `168 files: 166 PASS, 0 FAIL, 2 SKIP` (7,675 pass, 0 fail, 44 skip);
  Windows `168 files: 151 PASS, 0 FAIL, 17 SKIP` (6,670 pass, 0 fail, 78 skip; `ci-windows-30a5baf9.log`). The file
  skips are main's declared ones: hooks-win32-exec and study-tasks off Windows, the 16 desk files and study-tasks on it.
  install-check passes on macOS and Windows. None of main's known failures showed (Ubuntu GP1/GP2 before
  linux-path-spelling's land at ca27d86; the PR merge-commit R-291 leaf total).
- pi-registration.test.mjs reads 70 pass, 3 skip on macOS and Ubuntu, and 73 pass, 2 skip on Windows; 0 fail on every
  leg. On Windows all five checks pass by title, none skipped:
  - `R-391: under --home with an unregistered extension directory, install and install --dry-run both report the pi
    packages step skipped (--home override in play)`
  - `R-358: under --home, install and install --dry-run start no pi install while a working pi is first on PATH`
  - `R-1930: with pi not on PATH, the dry-run pi packages step reports skipped with the pi install hint, as install
    does, on darwin and win32`
  - `R-1931: when install would report the pi packages step ✗ before any pi install, the dry run reports the same ✗
    and exits 1`
  - `R-1932: with a working pi on PATH and an unregistered extension directory, the dry-run pi packages step reports
    would add and starts no pi install`

  So the plan adversary's claim most likely wrong held: the CLI block with its recording `pi.cmd` first on PATH, the
  R-358 anchor and the fixture folder holding `!` all pass natively on Windows.
- Forced win32 on macOS (`NANA_SETUP_PLATFORM=win32 node packages/nana-setup/tests/pi-registration.test.mjs`) fails one
  older check, R-323's `install adds only the missing per-package entry, never a root entry`. The seat reproduced the
  same failure on main d4423eff, so it is an artefact of forcing the platform under a POSIX shell fake; native Windows
  passes it. No lane check fails there.
- The seat's wrong-code pairs (`seat-mutate.mjs`, output `seat-mutate-output-30a5baf9.txt`, commit 497d2807): 10 of 10
  red on 30a5baf9, each red on exactly its named titles, 0 survived; baseline pi-registration 70 PASS, 0 FAIL. W1
  puts back main's three lines in `stepPiRegister` and reds R-391, R-1930 and R-1931. W2 to W10 are the plan's
  wrong-code list: W2 and W7 red R-391 and R-358; W3 and W10 red R-1932; W4, W5 and W9 red R-1930 and R-1931; W6 reds
  R-1931; W8 reds R-358. Declared: every pair runs on macOS with the win32 cases injected; W8 spawns pi by its bare
  name, a POSIX PATH lookup; the README sentence has no pair, since the readme check is its test.
- The independent check (`independent-check-30a5baf9.md`): HOLDS, twelve probes with their commands and outputs, no
  MUST. Probe 3 shows the fix: with a pi whose `--version` exits 2, main's dry run said `created would add`, exit 0,
  where install said ✗, exit 1; the lane's dry run says the same ✗ and exits 1. Probes 2, 4 and 6 leave the temp home
  empty, and probe 5 leaves a pre-written `settings.json` byte-identical. Probe 6 runs the real pi 1.0.2 and finds
  nothing nana owns written.
  Probe 8 matches the dry run and install on five cases beyond the tests. Its two findings, both known bugs, not MUST:
  1. On the real home, the dry run now waits on `pi --version`, which has no timeout; a pi whose version check sleeps
     3 s holds the dry run 3 s, where main's dry run took 0 s (probe 12). Install and doctor make the same call.
     Settled: carried as a HANDOFF residual, not fixed in this lane.
  2. The dry run's detail lists extension folders (`…/extensions`), install's lists package roots (probe 4). Main's
     dry-run text did the same, and the plan kept every detail string. Settled: carried as a HANDOFF residual.

  Probe 10's `trust.test.mjs` exit 1 on main and the lane comes from the checker machine's global npm root; CI passes
  that file 13 of 13 on all three legs.
- The seat on 497d2807 (no code change since 30a5baf9): `node scripts/requirements-trace.mjs` reads 1,462 rows (1,190
  implemented, 1 planned, 34 retired, 232 untested, 5 violated), `ears: 0 rows off form`; `npm run map:check` reads 326
  modules, 0 problems; `npm run readme:check` reads 710 claims, 0 problems. R-358, R-391 and R-1930 to R-1932 read
  `implemented`.
- Main has moved since the base: main is `8a9ff9a3`, the readme-windows-checklist land. It changes the setup README's
  install-check paragraphs, REQUIREMENTS.md, the tree, the code map, HANDOFF and the session archive, but not
  `steps.mjs` or `pi-registration.test.mjs`. A merge of main follows before the land.
- HANDOFF: the install-pins residual on the dry run under `--home` is removed (this lane fixes it); the R-926 against
  R-313 owner call is added to the open questions; five residuals are added (the two findings above and three of the
  plan's known limits).
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main` on 497d2807):

  ```
  tree movement d4423ef..497d280: 5 rows in 1 features
  FEAT-013 · Install and connect harness runtimes
    R-358 untested -> implemented
    R-391 untested -> implemented; text changed
    R-1930 new (implemented)
    R-1931 new (implemented)
    R-1932 new (implemented)
  ```
