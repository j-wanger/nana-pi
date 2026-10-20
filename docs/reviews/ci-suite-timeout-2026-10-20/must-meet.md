# ci-suite-timeout — must-meet

Feature: FEAT-019 · Release usable templates and report support

Sentence: every root CI suite leg (macOS, Linux, Windows) carries one job-level time limit of 90 minutes, so GitHub cancels a hung leg within 90 minutes of its start instead of at its 360-minute default.

Class: ordinary. The lane changes the root CI workflow, one pack test file and the requirement files. It touches no install, uninstall, doctor, hook, pi extension, gate policy or land/review tool. It gets one final reviewer and no install check before land.

Threat model: honest variation is in scope. That covers runner speed, suite growth, a hung setup step (npm, uv, pnpm, pi install) and a runner that the 5-minute per-file kill does not end, on any OS. Deliberate forgery of the workflow is out.

## Design
- ci.yml, suite job: directly after `    runs-on: ${{ matrix.os }}`, add the five-line, four-space comment below, then `    timeout-minutes: 90`. One value covers every leg; a per-OS expression does not earn its complexity.
- This placement keeps R-597's `^  suite:\n    strategy:` match. Existing checks find `npm test`, `pi --version`, `continue-on-error:`, `timeout-minutes:`, `uses:` and `run:` by first occurrence, so the comment holds none of them. Probe: all 13 existing checks pass.
- The release and install-check jobs are unchanged. `timeout-minutes` is set per job. GitHub's docs: "The maximum number of minutes to let a job run before GitHub automatically cancels it. Default: 360".
- No README edit. The sentence restated CI configuration, carried a claim no row pins and traced to no row.
- The test names `GITHUB_DEFAULT_JOB_TIMEOUT_MINUTES = 360` as a contract value (GitHub's documented default), not as one of our tunables.

## Provenance (chosen 2026-10-20, R-2061)
- Source: the GitHub jobs API, 409 ci runs created 2026-10-16T00:08Z to 2026-10-20T06:42Z. Wall time is started_at to completed_at, setup included.
- Slowest finished leg per OS: Windows 34.5 min (run 39298256239, success), macOS 18.7 (a failure run), Linux 14.5.
- Windows maximum by day: 13.2 (10-16), 15.6, 23.3, 34.5 (10-19), 32.0 (10-20).
- The jump to 10-19 was mostly red files turning green, but growth continued afterwards. Successful Windows legs gained 4.8 min/day (fit over 129 runs in 16.5 hours, largest residual +9.8) while test files on main went from 174 to 196.
- At 60 the limit is 1.7 times the slowest leg, about 5 days of growth. At 90 it is 2.6 times, about 10 days, and the hang window still shrinks 75%. No hang occurred in 400 suite runs, while a false time-out stops release.

Comment (public repo; no machine paths):
```
    # chosen 2026-10-20 (R-2061): 90 minutes, not GitHub's 360-minute default, so a hung leg stops
    # within 90 minutes. Measured job wall times, every CI run from 2026-10-16 to 2026-10-20: slowest
    # finished Windows leg 34.5 min (run 39298256239), macOS 18.7, Linux 14.5. Windows grew about
    # 5 minutes a day on 2026-10-19 and 2026-10-20 as tests landed. About 2.6 times the slowest leg,
    # so suite growth and runner variance do not cancel an honest leg; a false time-out blocks release.
```

## Must-meet tests (packages/nana-pack/tests/ci-workflow.test.mjs)
| Row | Requirement (EARS) | Test (file::title) | Red today |
|---|---|---|---|
| R-2060 | The root CI suite job shall set exactly one job-level `timeout-minutes`, a plain integer above 0 and below GitHub's 360-minute default, that applies to every matrix leg. | `packages/nana-pack/tests/ci-workflow.test.mjs::R-2060: the suite job sets one job-level time limit below GitHub's six-hour default for every leg` | Probe on main 1c539a0e: FAIL `the suite job must hold exactly one job-level timeout-minutes line 0 !== 1` |
| R-2061 | The root CI suite job's job-level `timeout-minutes` shall be the sealed value 90, with the word `chosen` in the comment lines directly above it. | `packages/nana-pack/tests/ci-workflow.test.mjs::R-2061: the suite job's time limit is sealed at 90 minutes with a chosen comment directly above it` | Same probe: FAIL `undefined !== '    timeout-minutes: 90'` |

R-2061 is the only sealed-value pin; R-2060 never names 90. Both checks are static reads that run on all three legs with no skip. There is no CRLF case, because R-1320 pins an LF checkout of the workflow.

## Wrong code probed (temp clone of main 1c539a0e, CI_WORKFLOW_PATH)
| Wrong code | Red |
|---|---|
| W1 no limit (today) | R-2060, R-2061 |
| W2 `timeout-minutes: 360` | R-2060, R-2061 |
| W3 `${{ matrix.os == 'windows-latest' && 90 \|\| 30 }}` | R-2060, R-2061 |
| W4 limit only on the Windows test step (after its `if:`) | R-2060, R-2061 |
| W5 limit only on the release job | R-2060, R-2061 |
| W6 `timeout-minutes: 60` | R-2061 |
| W7 comment says "picked", not "chosen" | R-2061 |
| W8 blank line between the comment and the limit | R-2061 |
| W9 two job-level limit lines | R-2060 |

On the good variant all 15 checks in the file pass. The requirements-trace script exits 0 with 0 rows off EARS form. The requirements-trace, requirements-tree and line-endings tests and the tree check exit 0. map:check reports 0 problems.

## Known limits
- Static check only. No test proves that GitHub cancels a job at the limit; that is GitHub's documented behaviour.
- Inferred from the docs: a timed-out job is cancelled, and continue-on-error covers only failures. A hung Linux leg cancelled at 90 would then stop release, although R-1531 lets a failed Linux leg through. The same is true today at 360, and the slowest Linux leg took 14.5 minutes.
- Inferred: the limit counts from job start, so queue waits still delay release.
- The release job keeps the 360 default and holds the template-release concurrency group. Residual.
- install-check's 20 carries no provenance comment (R-1078). Residual.
- CI runs the suite serially, so Windows time grows with the test count. Re-measure when a Windows leg passes 60 minutes. A lane that runs CI with `--jobs` would remove the pressure. Carry.
- The suite slice is all text between `suite:` and `release:` (an existing HANDOFF residual), so a job added between them would be misread.
