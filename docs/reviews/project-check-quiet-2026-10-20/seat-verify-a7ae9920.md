# Seat checks — project-check-quiet build 1, tip a7ae9920 (2026-10-20)

- Build, by a Claude Sonnet 5 subagent (`build-brief-1.md`): one commit 31634589 on the plan commit e84357b3 (based on
  20debe02), then a7ae9920 merges main 385c633f with no conflict. The build changes six files: `muteDoctorWarnings();`
  as the first statement of runProject's `if (opts.check)` branch in `packages/nana-setup/bin/nana-setup.mjs`, R-2050
  in the `DOCTOR_MUTED_WARNINGS` provenance comment and "doctor and project --check" in the header's @outputs and
  @effects; `runProjectCheck` and three checks in `doctor-quiet.test.mjs`, with its @purpose widened; one setup README
  sentence and its Tests-table row; rows R-2050 to R-2052; the regenerated tree and code map. No tunable, filter or
  name changed. The seat's notes commit adds only this record, the Windows log, the review brief, HANDOFF and the
  session entry. No code or test changed after 31634589.
- CI run 39384750051 on draft pull request #109 at a7ae9920 (GitHub's merge commit d1497ed3 merges a7ae9920 into its
  own ancestor 385c633f, so the tree tested is a7ae9920's):
  - macOS `177 files: 175 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7842 pass, 0 fail, 27 skip`.
  - Ubuntu `177 files: 174 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7781 pass, 0 fail, 45 skip`. Its third skipped file
    is checkout-spelling (no second spelling on a case-sensitive volume), main's declared skip.
  - Windows `177 files: 160 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6777 pass, 0 fail, 104 skip`
    (`ci-windows-a7ae9920.log`, Node v22.23.3). The 17 skipped files are main's declared set: 16 desk files and
    study-tasks.
  - `doctor-quiet.test.mjs` prints 7 PASS lines on every leg: the six named checks and its summary. On native Windows
    the three new checks pass by title:
    ```
    PASS project --check in a folder without project config writes no Node warning
    PASS project --check in a folder with project config writes no Node warning
    PASS project --check still prints a Node warning it does not mute
    ```
  - `project.test.mjs` passes 123 on Windows, as in the plan's probe.
  - Both CI install-check jobs succeed, on macOS and Windows.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arises, since GitHub's merge commit holds a7ae9920's
    tree.
- Windows before the fix: nobody ran the unfixed command on Windows. That R-2050 and R-2052 fail there without the
  fix is inferred, from the plan's reading of an earlier Windows log and from this run's log, which carries 13
  MODULE_TYPELESS_PACKAGE_JSON lines for other tests' loads of the pack's and the template's .ts modules. CI proves
  only that the fixed command is quiet on Windows.
- The builder's report, as relayed to the seat (the seat did not re-run the tries): R-2050 and R-2052 failed before
  the fix, each with the MODULE_TYPELESS_PACKAGE_JSON warning naming the pack's config module as its first stderr
  line; R-2051 passed there by design. M1 to M6 each turned red exactly the checks the brief names. The plan's M7 (a
  MODULE_TYPELESS-only listener on the trust branch in lib/project.mjs) was probed by the plan adversary, not the
  builder: only R-2052 went red.
- No wrong-code pairs from the seat and no independent check: an ordinary lane, so no findings to settle.
- Lane class: ordinary, as the plan and its adversary decided. The lane calls doctor's mute from the project check's
  branch but changes neither the mute nor install, uninstall or doctor, and touches no hook, extension, gate or land
  or review tool. It touches packages/nana-setup, so the owner's 2026-10-12 rule applies: the seat's local macOS install
  check runs before nana-land. It is not in this record. CI's install-check passed on macOS and Windows at a7ae9920.
- The seat helper's re-run at the notes commit, macOS, Node 22.22.2, from the lane worktree:
  `node packages/nana-setup/tests/doctor-quiet.test.mjs` with no NODE_OPTIONS prints 7 PASS lines, `PASS summary: 0
  failures`; `node scripts/requirements-trace.mjs` reads `1546 total (1280 implemented · 1 planned · 34 retired · 226
  untested · 5 violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 336 modules, 0
  problems; `npm run readme:check` reads 718 claims, 0 problems; `node scripts/requirements-tree.mjs --check` exits 0.
- Rows: R-2050, R-2051 and R-2052 read `implemented` in REQUIREMENTS.md, in SUB-021's table directly after R-1670.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base 385c633f`, the merge base):
  ```
  tree movement 385c633..a7ae992: 3 rows in 1 features
  FEAT-014 · Create or adopt a project workspace
    R-2050 new (implemented)
    R-2051 new (implemented)
    R-2052 new (implemented)
  ```
  CAP-04 moves from 443 to 446 rows, FEAT-014 from 91 to 94 and SUB-021 from 7 to 10. No existing row changed.
- The plan's known limits:
  - Fixed and dropped from HANDOFF: doctor-quiet's residual that the project command and its check print the module
    type warning. The check is now quiet, and the plan's probe found the seeding run and trust already quiet.
  - Already on HANDOFF: the pack still declares no module type, so test runs and CI logs keep printing the warning.
  - New HANDOFF residuals, one line each: during the check the mute drops any module type warning, not only the pack's,
    and a warning from pi's package, where it resolves, would print; doctor's listener limits now apply to the check;
    the checks pin Node 22 only; no check pins the quiet seeding run, and none stops the mute spreading to other
    commands.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite).
- Main is 385c633f, the merge base, so the land needs no merge of main unless main moves first.
