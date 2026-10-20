# ci-suite-timeout — plan attack (one adversary)

Verdict: AMEND

AMEND, for three probed reasons. Everything else in the plan holds.

1. The sealed value goes from 60 to 90. The plan's riskiest claim (that most Windows growth came from red files turning green) is true only up to 10-19. I pulled 409 ci runs created between 2026-10-16 and 2026-10-20 through the GitHub jobs API. After the Windows leg turned green, its successful legs still grow by about 4.8 minutes a day (linear fit over 129 runs in 16.5 hours, largest residual +9.8 minutes). Over the same period the test files on main went from 174 to 196. The slowest finished Windows leg was 34.5 minutes (run 39298256239, confirmed). At 60, the trend plus noise reaches the limit in about 5 days. At 90 (2.6 times the slowest leg) it takes about 10 days, and the hang window still drops 75%. Not one of 400 suite runs hung. A false time-out cancels a blocking leg, which stops release and breaks the seat's "CI 0 failing" evidence. The cost of error therefore favours headroom.

2. R-2061 was wider than its test. It said "a comment block that says `chosen` and why", but no test can check the "why". It now says "with the word `chosen` in the comment lines directly above it".

3. The README sentence is dropped. It restated CI configuration and carried a claim no row pins (queue time, plus the inferred cancel behaviour of the Linux leg). It traces to no row. The plan also wrongly said no in-flight lane edits the root README: win-config-json-path did, and it landed as 1c539a0e during this review. Dropping the edit removes that overlap.

Provenance corrections. I could not reproduce "285 runs": I count 409 runs, 400 of them with a suite job. macOS's slowest finished leg is 18.7 (a failure run), not 18.1. The comment now drops the run count and uses 18.7.

Probes, all in a temp clone of main 1c539a0e:
- Both new checks are red today. R-2060 fails with "0 !== 1". R-2061 fails with "undefined !== '    timeout-minutes: 90'".
- Each of W1 to W9 is red on exactly its named check, and the 13 existing checks stay green.
- On the good variant all 15 checks pass. The requirements-trace script exits 0 with 0 rows off EARS form.
- The requirements-tree and line-endings tests, and the tree check, exit 0. The requirements-trace test file also passes. map:check reports 0 problems.

Other findings:
- The other readers of ci.yml (pi-pin.mjs, the bench usage test, fresh-machine.test.mjs) parse only the env block, so they are unaffected.
- GitHub's docs source confirms the default of 360 and that a job over its limit is cancelled ("automatically cancels it"). continue-on-error covers jobs that fail. A cancelled Linux leg would therefore likely stop release. That is inferred, and it is no regression: the same happens today at 360.
- The class is right: ordinary.
- The tests are static reads of an LF-checked-out file (R-1320), so they need no skip on Windows or Linux.
- Every step writes only in the lane worktree or a temp folder.

Files the build touches: .github/workflows/ci.yml, packages/nana-pack/tests/ci-workflow.test.mjs, REQUIREMENTS.md, docs/requirements-tree.md.

Conflicts:
- No in-flight lane touches ci.yml or ci-workflow.test.mjs. The mrwl-base and wwcr-p1 scratch branches rewrite ci.yml but are never merged.
- In REQUIREMENTS.md the new rows go after R-1531 in FEAT-019. hook-deadlines adds rows near line 840, pi-probe-timeout near lines 864 and 1118, and install-check-turn-edit-powershell near line 1150, so there is no textual clash.
- docs/requirements-tree.md is generated. Its CAP-04 IDs line (line 106) is shared with the R-2000s, R-2010s and R-2020s lanes. Merge main, then run `npm run req:tree`.
- Slate: only install-check-review-launch (R-2070s) might also append checks before `if (failures)` in ci-workflow.test.mjs, or edit the install-check job. That would be an adjacent-hunk merge, not a reason to wait. The other three slate lanes share only the requirement files.

Claim most likely wrong: that 90 leaves about 10 days of honest headroom. The growth rate comes from 16.5 hours of power-mode lanes. If Windows keeps adding about 5 minutes a day, honest legs reach 90 within two weeks. The real fix is a later lane that runs CI with --jobs. Second, unverified: that a Linux leg cancelled at the limit stops release.

Probe data and scripts are in the temp folder from `mktemp -d` (plan.y3YI3o under $TMPDIR).
