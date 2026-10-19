# Seat checks — win-stale-copies, builds 1b and 2, tip e99866d (2026-10-19)

- Builds: a pi gpt-5.6-sol builder through pi-worker. Build 1 stalled under pi-worker's 75-second stall watchdog
  before it committed; build 1b (`build-brief-1b.md`) finished it as 642f195. The seat merged main 713d6aa (defdeda).
  Build 2 (`build-brief-2.md`, c29d390) answered CI's red run below; the seat then merged main a1d07f6 (e99866d).
  dacc253 adds only the seat's pair re-run record.
- CI run 39298597308 on draft pull request #55 at defdeda: one file failed on all three legs,
  `adoption-reader.test.mjs`, 41 pass, 2 fail (`c: the hook prints nothing when there is nothing`, `c: the hook prints
  the same block`). The adoption hook now also ran the stale check, and in a temp home where nana-setup never ran it
  listed every rule and skill as stale. Build 1 had not run that file; the independent check had not run it either.
- Build 2: the install record is nana-setup's SessionStart adoption entry in Claude Code's `settings.json`
  (`hasAdoptionInstallRecord`); with no record the checker prints nothing. R-1606 and its check are new; R-1600 now
  reads "for a home that holds a nana-setup install record". `adoption-reader.test.mjs` is unedited and passes 43. Per
  the builder's report, all 19 test files that start the adoption hook pass, 1,242 checks.
- CI run 39304726763 on draft pull request #55 at e99866d (GitHub's merge into a1d07f6): macOS `158 files: 156 PASS,
  0 FAIL, 2 SKIP` (7,563 checks pass); Ubuntu `158 files: 156 PASS, 0 FAIL, 2 SKIP` (7,508 checks pass); Windows
  `158 files: 141 PASS, 0 FAIL, 17 SKIP` (6,490 checks pass, 84 skip; `ci-windows-run-2.log`). stale-copies passes 8
  on macOS and Ubuntu, and 8 with 1 skip (the POSIX fixtures) on Windows; adoption-reader passes 43 on macOS and
  Ubuntu, 41 with 1 skip on Windows. install-check passes on macOS and Windows.
- The seat's wrong-code pairs (`seat-mutate.mjs`): 15 of 15 red on defdeda (`seat-mutate-output-defdeda.txt`); on
  e99866d, with three new pairs (M16 to M18) for build 2, 17 of 18 red (`seat-mutate-output-e99866d.txt`). M3 also
  turned R-1606 red, a title it does not name. M18 survived: it counts any SessionStart entry, not only nana-setup's
  adoption entry, as the install record, and no fixture holds settings with another SessionStart entry and no nana
  install. Benign in use: the stale check runs only inside nana's adoption hook, which runs only when nana-setup
  registered it, so the record is there either way. Recorded as a HANDOFF residual.
- Independent check (`independent-check-e99866d.md`), run on defdeda against base 713d6aa: HOLDS, no MUST, probes P0
  to P11 with commands and output. It predates build 2, so it covers neither the install-record check nor
  adoption-reader; CI and the pairs above cover those. Its findings:
  - K1 (known bug): when a folder nana-setup did not make sits at a skill path, the line names install as the fix;
    install refuses that folder, so the line repeats every session. Nothing is lost. Not fixed; recorded as a HANDOFF
    residual.
  - K2 (note): this Mac lacks both rulings copies, so after the land every Claude Code session here carries one true
    line until install runs. No change; the session entry says so.
- Tree movement (`requirements-moved.mjs --base main`, merge base a1d07f6): FEAT-015 gains R-1600 to R-1606, all
  `implemented`. The trace reads 1,307 rows, 0 off form; `map:check` reads 303 modules, 0 problems.
