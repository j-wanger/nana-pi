# Independent check — parallel-runner at 1932efe (2026-10-19)

VERDICT: HOLDS

Checked tip d50de2f in a private clone with a temp HOME and TMPDIR, plus two small temp fixture repos. Nothing was written to any repository, and the private copy is deleted. No leftover probe processes remain.

P0 must-meet tests: `node packages/nana-pack/tests/test-runner-parallel.test.mjs` (also test-locked.test.mjs and test-runner.test.mjs)
  Output: R-1470 through R-1475 and R-1477 PASS ("all checks passed", 25.9 s). test-locked: 17 PASS, 0 FAIL. test-runner: 43 PASS. Temp dirs empty afterwards. Verdict: holds.
P1 eight real nana-pack files, serial vs parallel: `node scripts/test.mjs [--jobs=4] line-endings path-spelling nana-pack/tests/frontier writing-check bounded-read config-normalize readme-check release-status`
  Output: both runs "8 files: 8 PASS ... checks: 148 pass", wall time 46.0 s serial and 38.1 s parallel. The two outputs match after sorting, with timings removed. bounded-read (on the run-alone list) printed last. No nana-test temp roots left. Verdict: holds.
P2 self-test five times in parallel: `node scripts/test.mjs --self-test --jobs=4 readme-check`
  Output: runs 1-5 all exit 1, "stdio still open" note present 5 of 5, "self-test: every fixture got its expected verdict". No pipe holder left. Verdict: holds.
P3 main runner (4be0b79) vs lane serial vs lane --jobs=4: `--self-test readme-check config-normalize bounded-read study-tasks`
  Output: "MAIN == LANE-SERIAL (exact order)" and "MAIN == LANE-JOBS4 (sorted)". All three print "7 files: 4 PASS, 2 FAIL, 1 SKIP, 1 WARN". The serial path is unchanged. Verdict: holds.
P4 real npm, bad job count: `NANA_SUITE_JOBS=abc npm run test:locked`
  Output: "> node scripts/test.mjs --jobs=abc" then "[runner] bad --jobs argument: --jobs=abc", exit 1, lock released. Fails closed. Verdict: holds.
P5 Ctrl-C through the real chain (temp repo, six 60 s files, signal to the npm group after 4 s):
  Before the signal: 4 grandchild sleepers and 5 temp roots (4 file roots plus the runner's scratch). After: "[runner] SIGINT: killing the active test's process tree", npm exit 130, 0 sleepers, 0 temp roots, lock released. SIGTERM gave the same result with exit 143. Verdict: holds.
P6 forced win32: `node --import win.mjs scripts/test.mjs [--jobs=3] apps/desk/test readme-check config-normalize bounded-read` (win.mjs sets process.platform to win32)
  Output: both runs "20 files: 4 PASS, 0 FAIL, 16 SKIP", 16 Windows-skip SKIP lines, identical after sorting. Verdict: holds.
P7 coverage records: `NANA_COVERAGE_DIR=... node scripts/test.mjs --jobs=1|4` on 8 files including study-tasks
  Output: the path and label in each 0000-0007 record match between the two runs. bounded-read sits at 0000 though it ran last. study-tasks is 0007 SKIP. Completion record {"files":8}. Verdict: holds.
P8 runner error mid-pool: `NANA_COVERAGE_DIR=<a regular file> node scripts/test.mjs --jobs=3 ...`
  Output: "Error: ENOTDIR ... covfile/0001", exit 1, 0 temp roots left. Serial: same error, exit 1. Not fail-open. Verdict: holds.
P9 odd spellings: `node scripts/test.mjs <arg> zzz-no-such-file`
  Refused with "[runner] bad --jobs argument": `--jobs=+4`, `--jobs=4abc`, `--jobs=-1`, `--jobs= 4`, `--jobsx`, `--jobs=1e3`, `--jobs=99999999999999999999`, `--jobs=٤`.
  `--jobs=04` was accepted as 4. `--JOBS=4` was silently ignored, like any other unknown flag. Verdict: holds.
P10 repo-reading files together: `node scripts/test.mjs [--jobs=4] nana-pack/tests/code-map readme-check requirements-trace ci-workflow skill-claims review-standard requirement-rows line-endings`
  Output: both runs "8 files: 8 PASS ... 175 pass" (24.3 s serial, 16.7 s parallel), identical after sorting. Clone `git status` clean. Verdict: holds.
P11 test-locked arguments (npm_execpath set to a capture script):
  NANA_SUITE_JOBS unset → ["test","--","--jobs=4"], lock held: true
  NANA_SUITE_JOBS=6 → --jobs=6, lock held: true
  NANA_SUITE_JOBS empty → --jobs=4, lock held: true
  NANA_SUITE_JOBS=abc → --jobs=abc, lock held: true
  argument `--jobs=6` → ["test","--","--jobs=6"], **lock held: false** (see finding 2). Verdict: holds as designed.
P12 a large block written last on a pipe: temp repo with a 0.8 s red file printing 20 FAIL lines of 4 KB each, plus an instant passing file; command `node scripts/test.mjs [--jobs=2] zred small | wc`
  Serial: 80837 bytes, last line "failed: packages/x/tests/zred.test.mjs".
  --jobs=2: 65588 bytes, last line "| FAIL check 16 detail zzz…". The result line, totals line and failed list are missing. Exit code is still 1.
  With `--verbose`, a 125 KB file gives the same cut at 65599 bytes. Verdict: finding 1.

Findings:
1. Known bug (not MUST) at <worktrees>/parallel-runner/scripts/test.mjs:526 and :584. With --jobs above 1, each file's block goes out in one `process.stdout.write`. If the last block before the summary is over 64 KB, a macOS pipe reader gets only 65536 bytes. The code runs synchronously from that write to `process.exit`, so the rest of the block, the totals line, the WARN lines, `failed:` and the self-test verdict are lost. The serial path writes the same output complete.
   The exit code stays correct, so the gate fails closed. In the land suite the last block is test-locked.test.mjs's result line, so the cut needs that file red with an excerpt over 64 KB. The biggest real file I measured printed 11702 bytes (gate-corpus). A filtered `--jobs --verbose` run read through a pipe can hit it.
   Fix direction: wait for stdout to drain before the summary, or set `process.exitCode` instead of calling `process.exit`.
2. Known bug, an existing pattern that now has a new way in: <worktrees>/parallel-runner/scripts/test-locked.mjs:174 treats any argument as a filter. So `npm run test:locked -- --jobs=6` runs the whole suite in parallel without the machine-wide lock. Main does the same for `-- --verbose`; I probed main and got "lock held: false". The README sends users to NANA_SUITE_JOBS instead. The risk is load-induced red runs, which fail closed. No data is lost.

No MUST findings. Nothing wrote outside a worktree or temp folder, and no gate or land tool fails open. Main's serial path gives byte-identical output (P3). `npm test` and CI stay serial.
