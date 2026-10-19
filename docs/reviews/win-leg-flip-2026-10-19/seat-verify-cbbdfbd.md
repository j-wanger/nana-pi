# Seat checks — win-leg-flip build 1, tip cbbdfbd (2026-10-19)

- CI on the draft pull request at cbbdfbd (run 39288283431, the lane merged with main b8616fb), running the lane's own
  flipped `ci.yml`: the suite job's `continue-on-error` is `${{ matrix.os == 'ubuntu-latest' }}`, so the Windows leg
  blocks. macOS `156 files: 154 PASS, 0 FAIL, 2 SKIP` (7,531 checks); Ubuntu `156 files: 154 PASS, 0 FAIL, 2 SKIP`
  (7,478 checks); Windows `156 files: 139 PASS, 0 FAIL, 17 SKIP` (6,457 checks; the 16 declared desk files and
  study-tasks) (`ci-windows-run-1.log`). install-check passes on macOS and Windows; release is skipped, as on every pull
  request run.
- The lane's checks on each leg: `PASS packages/nana-pack/tests/ci-workflow.test.mjs 13 pass` on macOS, Ubuntu and
  Windows; `PASS packages/nana-pack/tests/templates-render.test.mjs 168 pass` on macOS and Ubuntu, `167 pass, 2 skip` on
  Windows.
- The ruling's trigger held before the build. Main's Windows leg: 39265333844 (4be0b79) `153 files: 132 PASS, 0 FAIL,
  21 SKIP`; 39268388415 (06a874a) `154 files: 133 PASS, 0 FAIL, 21 SKIP`. Since then: 39271247545 (2a96090) and
  39273651224 (ca27d86) `154 files: 133 PASS, 0 FAIL, 21 SKIP`; 39276267655 (ab5c3e8) `154 files: 137 PASS, 0 FAIL,
  17 SKIP`; 39278411820 (ed38cb4), 39284775024 (b7df8d8), 39286669021 (b8616fb) and 39289458940 (f29827a) `156 files:
  139 PASS, 0 FAIL, 17 SKIP`, release success on b8616fb and f29827a. Main run 39291480621 (6b3e432, the latest) was
  still running its Windows leg when this was written; the plan lands only on a green latest main Windows leg.
- Main's Ubuntu leg read 0 failing on all five main runs from ca27d86 to b8616fb (`154 files: 152 PASS` at ca27d86,
  `156 files: 154 PASS` at b8616fb), so the plan's two-run bar for the Linux question is already met. That stays an owner
  question.
- The builder (Claude Sonnet 5), red then green: ci-workflow 12 of 13 on the unflipped file with R-1530 failing, then 13
  of 13; templates-render 1 FAIL with the new canonical line over the old docs, then green. Its nine wrong forms on temp
  copies of `ci.yml` (through `CI_WORKFLOW_PATH`) each turned R-1530 or R-1531 red: keep `!= 'macos-latest'`; `true`;
  the line deleted; a step-level `continue-on-error` on the Windows test step; release `if: always() && …`; `if:
  !cancelled() && …`; `needs: [install-check]`; Windows dropped from the matrix; a compound `&&` expression.
- The seat re-ran ci-workflow (13 pass), templates-render (168 pass) and the three requirement test files on cbbdfbd;
  map and README checks are clean. The install check runs locally before the land (the lane touches
  `packages/nana-setup/`); it has not run yet.
- No wrong-code pairs and no independent check: an ordinary lane (CI config, its tests and docs). No findings to settle.
- Tree movement (`requirements-moved --base b8616fb`): FEAT-019 — R-684 text changed; R-1032 implemented → retired;
  R-1530 and R-1531 new (implemented). The leaf total moves from 1,273 to 1,275.
