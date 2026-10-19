# Adversary verdict — study-stop (2026-10-19)

Verdict: AMEND

AMEND. I probed every claim on 2026-10-19 in a temp copy at 0f2e0ca (<tmp>/plan.Td5gqT), with a temp HOME, stub children and no network. The plan is sound in direction: Jake's 2026-10-10 ruling ("a study stops when it cannot write its evidence", docs/sessions/2026-10.md) is confirmed, the lane class is ordinary, and R-1500, R-1501 and R-1502 are red today (4 of 4 spawned, no error, 4 rows). Seven defects follow, each probed.

1. The plan's R-1501 check passes the wrong fix that forwards only Node's message, on macOS and Linux. Node's POSIX ENOTDIR text already holds the full folder, so only the non-blocking Windows leg would catch it. The fix strips every copy of the reference mkdir's message before looking for the folder. That turns the message-only fix red on macOS, and the intended fix stays green.
2. An asset-copy fault after a paid child leaves no evidence folder at all. With an interleaved healthy task the study never stops: 4 of 4 children start, today and under the plan's narrow fix. That is the same harm the ruling targets. The replacement design sets a flag after writeEvidence and stops when the child ran but the flag is unset. It covers this case at the same code cost. New R-1503: red today, red on the narrow fix, green on the flag fix.
3. A fix that stops on every paid grader error passed all four of the plan's checks and every existing bench test. New R-1504 pins the boundary: a checker grader error with its evidence on disk does not stop the study. It is green today, green on the flag fix, and red on the over-broad fix.
4. The plan's file list omits packages/nana-pack/tests/requirements-tree.test.mjs. That test pins the leaf total at 1,234 and fails when rows are added. Every in-flight row-adding lane edits the same line.
5. The plan's known limit says other post-processing failures keep the three-failure stop. That is wrong: an interleaved decided run resets the streak every time (probed).
6. Throwing before releaseInflight is not caught by the file's final check, because section 9's Ctrl-C test clears the leaked hook first. It is harmless in production, because main exits at once, so I dropped it from the wrong-code list.
7. The Done list's brace command `node {a,b}.test.mjs` runs only the first file. The brief now lists each file as its own command.

Dry run of the amended lane in the temp copy:
- orchestration-paths: 91 pass. Integration 48, ops 48 and plan 57 pass, unchanged.
- requirements-trace: 1,239 rows, 0 off EARS form, R-542 implemented.
- requirements-tree --check, the tree test, code-map --check, the code-map test and readme-check all exit 0, run in a git-initialised copy.
- Every wrong-code item in the brief turned its named check red.

Most likely wrong: that the new checks pass on Windows. The stripped-message check, the asset case and the grader-error case were probed only on macOS. The Windows ENOTDIR shape is inferred from CI run 2, integration test 8 ("mkdir '...\run-throws\raw'"), and the Windows leg is non-blocking.
