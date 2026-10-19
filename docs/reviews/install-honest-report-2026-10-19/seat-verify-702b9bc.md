# Seat checks — install-honest-report build 1b, tip 702b9bc (2026-10-19)

- Builds: a pi gpt-5.6-sol builder through `pi-worker --lane-size larger`. Build 1 (`build-brief-1.md`) stopped under
  the watchdog's 75-second stall limit before it committed. Build 1b (`build-brief-1b.md`) judged its uncommitted
  changes, finished them and committed 6d8908d. The seat merged main 713d6aa at cc2c4ed. 702b9bc changes only R-291's
  leaf-total literal in `packages/nana-pack/tests/requirements-tree.test.mjs`, 1,298 to 1,302 in its three places.
  1244b00 adds only the seat's pair table and record.
- CI on draft pull request #54, run 39300131590 on 702b9bc. The runner tested b8f75b2, GitHub's merge of 702b9bc into
  713d6aa; 702b9bc already contains 713d6aa, so the tree is 702b9bc's.
  - macOS `157 files: 155 PASS, 0 FAIL, 2 SKIP` (7,557 checks pass, 0 fail).
  - Ubuntu `157 files: 155 PASS, 0 FAIL, 2 SKIP` (7,502 checks pass, 0 fail).
  - Windows `157 files: 140 PASS, 0 FAIL, 17 SKIP` (6,484 checks pass, 0 fail; `ci-windows-run-2.log`). The four
    must-meet checks pass natively there: `PASS lock: a held lock stops install before its first write`,
    `PASS second install prints no retired row for a skill it linked`,
    `PASS second install reports no more skipped rows than the first`, and
    `PASS a link at a retired skill name install does not link is still reported unrecognized`, the check behind the
    plan's most-doubted claim (a junction read as a link on real Windows). `lock: --dry-run is not blocked by a lock`,
    `lock: a normal install leaves no lock file` and `full install: no temp or lock left behind` pass there too, and
    R-291's leaf-total check reads 1,302 and passes.
  - install-check passed on macOS and on Windows.
  - The earlier run 39298347456 on cc2c4ed failed one check on every leg, R-291's leaf total of 1,298 (macOS and Ubuntu
    154 PASS, 1 FAIL; Windows 139 PASS, 1 FAIL): the independent check's F1 below. install-check passed on both there.
- The seat's wrong-code pairs (`seat-mutate.mjs`, `seat-mutate-output-cc2c4ed.txt`, committed at 1244b00): 8 of 9 red on
  cc2c4ed, 6 on exactly their named titles. M4 and M7 also turned unnamed checks red (26 and 5), the expected spread.
  One declared survivor:
  - M9, install checks for the lock before its first write but takes it only at the settings step. The plan's known
    limits and the table declare it. It shows only when two runs race between that check and the settings step, which
    no test can produce. The review must catch it by reading `install()`.
  - The pairs still hold at 702b9bc: cc2c4ed and 702b9bc differ only in the leaf-total literal, which no pair touches.
- Independent check (`independent-check-702b9bc.md`): FINDINGS, one MUST. It ran on cc2c4ed with 14 probes, 13 HOLDS.
  The feature holds: a held lock left a 46-entry home byte-equal, on POSIX and under forced win32; a re-run dropped the
  four retired skill rows and went from 6 skipped rows to 2; foreign and dangling links kept their ✗ rows; a throw
  released the lock; in 30 simultaneous pairs of installs the second run either stopped with exit 2 and no rows or
  both succeeded. Its findings:
  - F1 (MUST): R-291's leaf total read 1,298 at cc2c4ed while the rows make 1,302, so requirements-tree failed at the
    exact tip. The seat's merge helper had staged the fix but not committed it; a clean auto-merge commits itself.
    Fixed in 702b9bc (that literal only); run 39300131590 passes the check on all three legs. The seat fixed its helper.
  - F2 (known bug, the plan's known limit): the lock ends at the settings step. A second run that starts in the later
    steps can still crash with EEXIST at the pi-review link: 1 of 40 staggered pairs, and a third run then printed
    nothing to do. Main crashes the same way more often, 2 of 12 simultaneous pairs, in the Claude-home steps. Not a
    regression; recorded as a residual.
- Rows R-1590 to R-1593 read `implemented`, and R-926 moved from untested to implemented. Tree movement
  713d6aa..1244b00: 5 rows in FEAT-013. `node scripts/requirements-trace.mjs`: 1,302 total, 0 rows off form.
  `npm run map:check`: 0 problems.
- Not in this record: the locked full suite on the final tip, and `node packages/nana-setup/bin/install-check.mjs` run
  locally on macOS before `nana-land` (install lane). The independent check ran install-check on cc2c4ed in its own
  clone: exit 0, 13 PASS.
