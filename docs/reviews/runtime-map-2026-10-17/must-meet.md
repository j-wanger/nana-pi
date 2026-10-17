# runtime-map — the must-meet tests (seat revision 5, feature-first cut, 2026-10-17)

**This file replaces `CHANGE.md` §2, §5 and §7 as the lane's plan of record.** On 2026-10-17 the owner moved nana to
feature-first development: per feature, the seat and one adversarial agent write only the must-meet tests, and the
builder builds to them. Plans get no review round. A reviewer sends back only for a bug that blocks the feature or a
harm-list item: data loss, writes outside the lane's folder, a broken install or hook, or a regression of what main
does today. Every other finding goes on the residual list. `CHANGE.md` §3 stays the design reference for the parts
these tests need. Its 30 rows, 32 titles and 71 pairs, and the seat's 165-case acceptance written for them, are dropped.
The adversary's pass is `adversary.md`; the disposition of each of its points is at the end of this file.

**The feature.** `npm run map:measure` runs the suite once under per-file V8 coverage. It saves, in a file outside the
repository under the clone's git common directory, which tracked files each test file executed, child processes
included, and how long each test file took. `npm run map:impact <file>` then lists, under each named file, the test
files that ran it, longest first, with their seconds. `map:check` never reads the data.

**Lane class: gate.** The lane edits `scripts/test.mjs`, the land gate's suite runner. So the final round has both
reviewers, and the seat runs a few wrong-code pairs and one independent check, both on the runner edit only. The
measure and impact parts get the ordinary bar. Stakes: medium, reversible; the data gates nothing.

## Rows (one per must-meet test; R-1270 to R-1278; R-1279 to R-1299 are not used)

| ID | Feature | Text |
|---|---|---|
| R-1270 | FEAT-031 | WHILE `NANA_COVERAGE_DIR` is unset, the test runner shall print no knob line, write no record or completion file, and pass each test file the caller's `NODE_V8_COVERAGE` and `NODE_OPTIONS` unchanged. |
| R-1271 | FEAT-029 | WHEN a measurement completes, the runtime data shall credit each test file with the tracked files its process and its node child processes executed, a child started with an environment that lacks the coverage variable included, and record the test file's PASS, FAIL or SKIP label and seconds. |
| R-1272 | FEAT-029 | WHEN runtime data exists, the impact command shall print the code-map generator's output byte for byte and then, under each named file, the measured test files that executed it longest first with their seconds and any non-PASS label, a zero line for a file no measured test ran, and a closing line that says what is not counted. |
| R-1273 | FEAT-029 | IF no runtime data exists, THEN the impact command shall print one note naming `npm run map:measure` after the generator's output and exit with the generator's exit code. |
| R-1274 | FEAT-029 | WHEN git tracks a file the runtime data does not hold, the data holds a file git no longer tracks, or a tracked file's content differs from its recorded hash, the impact command shall mark the whole runtime section stale, a section with no measured test included. |
| R-1275 | FEAT-029 | IF the suite exits without a completion record, or with one whose file count differs from the records read, THEN the measure command shall leave any earlier runtime data unchanged and exit non-zero. |
| R-1276 | FEAT-029 | The map check shall give the same output and exit code whatever the runtime data holds. |
| R-1277 | FEAT-029 | WHERE the platform is not Windows, WHEN the measure command receives SIGINT or SIGTERM, once or twice, while the suite runs, it shall end the suite's whole process tree, remove its coverage folder, signal no process outside that tree, and exit non-zero. |
| R-1278 | FEAT-029 | WHEN no data-file override is set, the measure command shall write the runtime data to `nana/runtime-map.json` under the repository's git common directory, creating the `nana` folder, so that a run from a linked worktree is read by the impact command in the main checkout. |

## The must-meet tests (exact titles in `seat-titles.mjs`)

- **MM1 (R-1270; harm: a regression of the land gate's runner).** With the knob unset, the existing runner checks in
  `test-runner.test.mjs` pass with no assertion edited (a fixture may also copy the new config module). A new check
  asserts no output line starts with the knob line, no record or completion file appears, and a test file sees the
  caller's `NODE_V8_COVERAGE` and `NODE_OPTIONS` unchanged, absent or set.
- **MM2 (R-1271).** A fixture repository with two test files: one imports module A; the other spawns a node child that
  runs module B with an explicit `env` lacking the coverage variable. A measurement credits A to the first and B to the
  second, each with its label and seconds, and credits no untracked file. An injected suite start is allowed here.
- **MM3 (R-1272).** With that data, `map:impact A` prints the generator's output byte for byte, then the test files that
  ran A, longest first, with seconds and a `[FAIL]` label where one failed. A file no measured test ran prints the zero
  line, and the closing line carries the not-counted note (temporary copies of a file are not counted).
- **MM4 (R-1273).** With no data file, `map:impact` prints one note naming `npm run map:measure` after the generator's
  output and exits with the generator's code.
- **MM5 (R-1274).** After a tracked file changes, a new file is tracked, or a tracked file is removed, the impact view
  marks the whole runtime section stale, including a section with no measured test.
- **MM6 (R-1275).** A suite that ends without its completion record, or with a count that differs from the records
  read, leaves the earlier data file byte for byte unchanged, and the measure command exits non-zero.
- **MM7 (R-1276).** `map:check` gives the same output and exit code with no data, valid data and garbage data.
- **MM8 (R-1277; harm: a stop kills nothing else).** POSIX only; the check prints SKIP on a win32 host with the reason.
  A fake three-level suite writes a ready file; a fake caller shares the measure command's process group. After the
  ready file appears, send SIGINT twice, 10 ms apart, and separately SIGTERM twice. Within the stop wait plus a margin
  named as a constant, no pid of the tree answers `kill(pid, 0)`, the caller's pid does, the coverage folder is gone,
  and the measure command exits non-zero.
- **MM9 (R-1278).** A fixture clone with one linked worktree and no `NANA_RUNTIME_MAP_FILE`. The real
  `scripts/runtime-measure.mjs` process runs in the worktree, with test-locked pointed at the copied runner through
  its test-command variable, a dummy `npm_execpath`, and its lock folder in temp. Exactly one data file appears at
  `<git common dir>/nana/runtime-map.json`, with `nana/` created on this first run, and the impact command run in the
  main checkout reads it.

Also changing: R-291's leaf total moves by nine; the root README's map paragraph gains two sentences on
`map:measure` and `map:impact`; `docs/code-map.md` and `docs/requirements-tree.md` are regenerated.

## Known limits (recorded, not tested)

Windows: no stop test, and the tree kill there is untested; 8.3 short paths, links and native-path forms of the root;
coverage URLs with a query or fragment; a single unreadable coverage file; an empty or relative `NANA_COVERAGE_DIR`
set by hand; data of another schema version or hand-damaged data; two measuring runs at once; the summary line's exact
wording; per-test-line stale marks.

## The adversary's points and their disposition

1. Every test could pass while the real measure process never writes the default location in a linked worktree:
   **taken**, as MM9 and R-1278.
2. One Ctrl-C reaches the measure command twice (from the terminal and from npm): **taken** into MM8 (each signal sent
   twice).
3. A zero line reads as "no test runs this file" with nothing pinning the note: **taken** into MM3 and R-1272.
4. The empty or relative knob refusal, the unreadable-data and schema notes, and MM8's Windows clause are edge cases:
   **taken**; all moved to known limits.
5. MM1's "prints exactly what it prints today" and MM8's timing were untestable as written: **taken**, rewritten above.
