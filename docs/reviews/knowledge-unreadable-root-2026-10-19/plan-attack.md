# knowledge-unreadable-root — plan attack (one adversary)

Verdict: AMEND

AMEND. I probed the plan in a temp clone of current main 32d6aa8b, with a temp HOME, on macOS with Node 22.22.2. The core holds. On today's code, `chmod 000` on a root and on a subfolder gives "removed 3", status still says "ok", and no output line names either path. The four new checks fail on today's code and pass on a sketch fix of about 20 lines. Changes:

(1) Cut the R-203, R-235 and R-236 pins and the README junction line.
- Nine rows broke the cap of eight.
- None of the three is this feature: symlink skipping, .git/raw skipping and the size+mtime fast path.
- R-203 depends on how Windows types a junction, which nobody has run. A red there would turn a pin into a fix halfway through a hook-class lane, where every round pays for the land reviewer, the pairs and the independent check.
- Six rows remain: R-1910 to R-1913, plus the R-207 and R-883 pins. Those two are exactly what the purge-loop and print-line edits could break.

(2) Cut the ENOENT/ENOTDIR "gone" error-code set. Any listing failure now records the path as UNREADABLE.
- The set protected only one case: a folder deleted during a build would be purged one build earlier.
- It cost a constant and a guess about Windows error codes.
- Its wrong-code pair W4 could never be shown red on macOS.

(3) Tightened the precondition probe to "statSync succeeds AND readdirSync throws", which is exactly "exists but cannot be listed". Suppose a Windows deny rule also blocks stat. Then the four denial checks print a declared SKIP instead of a false red. The rows would be kept anyway, because the root would read as MISSING.

(4) Renamed the test file to `unreadable-root.test.mjs`, and the CLI path now goes through `fileURLToPath`.

(5) waitFor is now none. Main already holds pi-seat-live-turn, win-hook-rows and mutation-runner-win-prune. install-pins and review-records-pin change only the CAP-02, CAP-04, FEAT-007 and FEAT-013 lines of the requirements tree. Nothing in flight touches packages/nana-knowledge or FEAT-003.

(6) Added a probed residual. A discover parent that cannot be listed drops its discovered roots, and their rows are purged: "removed 1" both today and with the sketch.

Class stays hook. The CLI is the Claude Code hook command and the pi extension's child, and lib/build.ts is the hook's detached build. Both knowledge pin plans from 10-19 named a change here hook-class.

Probes behind the amended plan:
- The draft test fails R-1910 to R-1913 and passes R-883 on today's code. All five pass on the sketch.
- incremental-build 27, discovery 37, hook 98 and extension 38 pass, each file run alone.
- The trace exits 0 with 0 rows off EARS form. req:tree moves only the CAP-01 and FEAT-003 lines. The README check reports 0 problems.
- Each wrong-code variant failed the check it names: W1, W2, W3, W5, W6, W12, W13 on the new file; W15, W16, W17 on the incremental-build checks.
- The repo was left untouched and the temp folder was removed.
