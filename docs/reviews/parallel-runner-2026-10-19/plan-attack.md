# Adversary verdict — parallel-runner (2026-10-19)

Verdict: AMEND

AMEND. Build it now. The design holds, but four test gaps would let wrong code through or make good code flake. One scheduling fact changed while I worked.

1. win-leg-blocking landed during this review. Main fast-forwarded to its tip 4be0b79, the branch was deleted, and main's scripts/test.mjs now carries the WINDOWS_SKIPS fallback. The build waits on nothing, so the old wait is removed.

2. The R-1470 check could not catch batching. Probe in a temp clone: a batching prototype (start N, wait for all N) reached exactly N overlap at --jobs=2 and --jobs=3, so the plan's "max overlap equals N" check passed it. With a 2000 ms file first at --jobs=2, the batch prototype's third file started after the first ended; a pool prototype's started before. The test now adds that case, and wrong-code W5 is "batches of N". The old W5 (an excerpt written after an await) is dropped: whether it turns a check red depends on timing.

3. The self-test pipe-holder reap races in a pool. Probe: a pool prototype that kept today's `if (fx) reapPipeHolder()` lost the hang fixture's "stdio still open" note in 5 of 6 runs at --jobs=3. R-1471's serial-against-parallel comparison would flake on otherwise correct code. Reaping only after the hang fixture ends kept the note 6 of 6. That fix is now a design line and a brief step.

4. R-1471 was green today and could not reliably catch wrong code. Its fixtures now sleep 500 ms, and the parallel run must overlap. That makes the check red today and makes W9 (shared buffer) and W10 (dropped SKIPs) turn it red every time. Its row and check now include the failed-file list and the self-test verdict. WARN lines and `failed:` are compared exactly, and the design prints them in collection order. The declared SKIP is study-tasks with no .ext, which skips on every platform.

5. Smaller fixes:
- R-1472's test adds a plain-mode case: two overlapping red files whose excerpts must each stay in one block. Without it the row was wider than its test.
- R-1475's row names "the runner's scratch directory"; "its" was ambiguous.
- R-1476 treats an empty NANA_SUITE_JOBS as unset, matching how NANA_SUITE_TEST_COMMAND is read. Its test deletes the variable for the unset case, so a builder's own env cannot leak in. It uses SUITE_JOBS + 1 rather than a literal, and a 10 s timeout.
- Overlap fixtures sleep 1 s or more, for start-up skew on the Windows CI leg, which is now blocking.
- The new test's mkRoot copies whatever lib modules the runner imports.
- SUITE_JOBS provenance is corrected from "6 and 8 gain nothing" to: 6 simulates 15-35 s faster but adds load beside other lanes' builders; 8 is slower.

6. Kept as planned:
- Class gate: win-leg-blocking and runtime-map classed runner edits the same way.
- nana-land reads only the suite's exit code, so the parallel output order cannot break a land.
- R-1477 is stronger than the plan said. Probe: `--jobs 4` with a space ran only the file whose path held "4" and passed, a green result from part of the suite.
- R-1470 red today confirmed: four 800 ms files at --jobs=2 ran one at a time, max overlap 1, 3.3 s.
- No shared state found that would collide when files run at once: no real-repo git writes outside the Windows-only hooks-win32-exec, no shared fixed paths, and one fixed port (origin-rule 4391).
- The timing scan found no file under 2 s beyond the four seeds. Next tightest: review-ledger 3 s, post-edit-hardening 6 s, agent-dir-hostile 10 s.
- The serial baseline matches: roster-set's land suite took 814.5 s for 151 files.

Files the build touches, all inside the lane worktree:
- scripts/test.mjs and scripts/test-locked.mjs
- packages/nana-pack/lib/test-runner-config.mjs (new) and packages/nana-pack/tests/test-runner-parallel.test.mjs (new)
- packages/nana-pack/tests/test-locked.test.mjs, test-runner.test.mjs (mkRoot), runtime-map.test.mjs (MM2 and MM9) and requirements-tree.test.mjs (R-291 total +8)
- REQUIREMENTS.md (FEAT-031), docs/requirements-tree.md, docs/code-map.md and README.md (the Tests section)
- The seat alone writes docs/reviews/parallel-runner-2026-10-19/, HANDOFF.md and docs/sessions/2026-10.md.

Conflicts: none blocking. Merge-time only: every in-flight lane adds REQUIREMENTS rows, bumps the R-291 total, and regenerates the requirements tree and code map. rulings-file edits README's extension-count lines, not Tests. No other in-flight lane touches either runner script or the new files. No ID collisions: other lanes use R-708/709 and R-1370 to R-1433.

Probes ran only in a mktemp folder with a temp HOME, deleted afterwards. No repository was written.

Most likely wrong: that only the four seeded files need to run alone. Desk free-port races, mutation-runner's stagger checks and agent-dir-hostile's 50,000-file disk churn have never run beside three other files. The seat's three parallel full runs are the first real test.
