# Change declaration — runtime-map: measured test files and seconds under the code map's impact command

*Lane `runtime-map` · `feat/runtime-map` · `~/nana-pi-wt/runtime-map`, from current `main`, third in the owner's 2026-10-16 order once the regroup lands: the seat-rule lane,
then the shared split mutation runner (`mutate-runner`), then this lane; under the seat rule's new cap, two lanes in build and a third in planning (the owner's answers
2 and 3, §6) · cites at `2dbc817` · 2026-10-16 · seat revision 3 (change log at the end), before any plan review. Features: FEAT-031 (runner rows), FEAT-029 (measure and
impact rows); evidence only on R-618 (FEAT-031); test literal only in FEAT-028 (R-291's leaf total). Class GATE and FORMAT: the lane edits `scripts/test.mjs`, whose exit code
is the land gate (inert unless a new knob is set), and adds a data file with a schema version: two plan-review rounds. Builder: the larger-lane builder (many files, the
land-gate runner). It touches no `packages/nana-setup/` file and no hook, so no install check. Stakes: medium, reversible — the data is advisory and gates nothing, but a
runner bug stops or skews every suite run until a revert. Evidence beside this file: `research.md` (the notes this plan is built on), `design-critique.md`, `factcheck.md`,
`probe.mjs`, `probe-1.json` to `probe-3.json`, `times-1011.txt`, `forms/`, `probe-knob/` (a 12-line scratch patch of the runner, run against fixture files), `r2/probe/`
(revision 2's probes: `envprop.mjs` with `envprop.out`, `url.out`, `link.out`, `uncalled.out`, `ids.out`) and `r3/probe/` (revision 3's ID re-check: `ids.out`, `refs.txt`). Sibling plans: `../seat-rule/CHANGE.md` and
`../parallel-seat/CHANGE.md` (the mutate-runner lane). "Ran" = run on this Mac in a scratch copy made with `git archive 2dbc817` (Node v22.22.2); "Read" = read at
`2dbc817`, not run; INFERRED = neither. The owner is "the owner" throughout, with no name and no word-for-word quote, so this file can enter a public review corpus unchanged.*

## 1. Why

On 2026-10-16 the owner asked for code runtime evaluation built into the code map, and for parallel work as the seat's default. The owner then settled what the map holds
(answer 1, §6): per test file, the repository code it executes, children included, and its run time, with no per-function profile; the data is kept on the measuring
machine, never in the repository, and `map:check` ignores it. This plan builds that. The parallel half is the seat-rule and mutate-runner plans; one
later lane there reads this lane's seconds (§6, later lane b).
- **The map sees only import text.** Edges come from four regexes over raw source (`templates/typescript/template/scripts/code-map.mjs:393-411`). A spawned process makes no
  edge, as R-861's untraced-test line (`…code-map.mjs:672`) and the `req:rows` note (`scripts/requirement-rows.mjs:61`) say; a computed import path makes none either, which
  open question 10 records (`REQUIREMENTS.md:1758`). Ran (`r2/probe/uncalled.out`, a walk over `repoGraph()` from the six test roots): 30 of 115 non-test modules have no
  test caller in the map — 11 of the 16 `bin/` modules, 3 of the 9 extensions, all 4 Claude Code hooks, the desk server and `apps/desk/apps.mjs`, 4 desk browser files,
  3 bench modules, and `scripts/test.mjs`, `scripts/test-locked.mjs` and `scripts/ts-syntax-check.mjs`. `templates/` is outside the map (`code-map.config.json:33`), so the
  generator itself has no caller at all.
- **Three consumers want per-file facts nobody records.** The seat's mutation runner names each pair's test files by hand, in every hand copy
  (`docs/reviews/regroup-shares-2026-10-15/seat-mutate.mjs:5`, `:18-22`) and in the shared runner's table (a `tests` field, Read: `../parallel-seat/CHANGE.md:154`). The
  mutate-runner plan's later `test-jobs` lane orders files by this lane's per-file seconds (Read: `../parallel-seat/CHANGE.md:465-466`); the only per-file list today is the
  2026-10-11 run's output (133 files; 144 now, Ran). A builder who wants only the affected tests has nothing to ask.
- **Measuring is cheap and catches children.** Ran (`research.md` §3, 8 test files, `probe.mjs`): V8 coverage costs -2% to +5% wall time, within run-to-run noise; Node
  hands `NODE_V8_COVERAGE` to every child, even one spawned with its own `env` (Ran again in `probe-knob/` and `r2/probe/envprop.out`); the lift test's 257 lift runs show
  up. Those 8 files give a measured test file to 8 of the 30 modules above, and show the template generator running under the code-map test.

**Threat model.** In scope, honest variation in our tools' output and this repo's files: timing noise (machine load, the coverage cost, other work outside the suite lock); a
flaky, failing or timed-out test file (the runner kills its tree); a child ended by SIGTERM or SIGKILL, which writes no coverage (Ran); a detached grandchild that outlives
its test file and writes its coverage late, possibly while it is read; a copy of a repo module run from a temporary folder (the runner test and the code-map test do this,
Ran); coverage entries that are `node:` built-ins, `[eval]`, `evalmachine.<anonymous>`, a file URL naming no file (`[eval1]`, Ran), a URL with a `?query` or `#fragment`
(Ran), a file under the repo's own `node_modules/` (Ran: `ls`) or outside the root (Ran: 1,419 such entries in one desk test, `probe-3.json`); a repo root reached through a
link (Ran: `/tmp` and `/var` on macOS, `r2/probe/link.out`), a Windows drive letter in another case, a Windows 8.3 short name (INFERRED from CI logs) and CRLF checkouts
(Read: `.gitattributes` holds no line-ending rule); a tracked file deleted in a dirty tree, a recorded file deleted before an impact call, a test file git does not track;
data that is missing, unreadable, of another schema version, measured at another commit, on a dirty tree, before test files were added, or by another worktree of the same
clone; two measuring runs at once; a measuring run that is interrupted, stopped by a signal sent to the measure command alone, or whose completion record and records
disagree; a measuring run started with node instead of npm, or outside a git checkout; a nested runner inside the runner's own tests; an ambient `NODE_V8_COVERAGE`,
`NANA_COVERAGE_DIR` or `NANA_TEST_SELFTEST` in the caller's shell. Out: deliberate forgery — a hand-edited data or record file, code that detects coverage and behaves
differently, a test that hides its children on purpose, a test that writes a fake record. A finding outside the model is a residual. **Selection safety:** the measured list
never gates a land; the full suite on the reviewed tip stays the gate.

## 2. Requirement delta

IDs R-1270 to R-1296, from the range R-1270 to R-1299 the seat assigned this lane on 2026-10-16. Ran again in revision 3 (`r3/probe/ids.out`): no hit for R-1270 to R-1299
on any of the 38 local and remote branch refs (revision 2 saw 39; the local `feat/regroup` ref is gone since), at `2dbc817`, or in the `REQUIREMENTS.md` of the main
checkout and the two remaining worktrees; a control grep finds R-1183 on 6 refs. Taken elsewhere: R-1170 to R-1187 (regroup), R-1190 to R-1215 (roster-notice), R-1220 to
R-1229 (the seat-rule lane's reserve; it adds no row, Read: `../seat-rule/CHANGE.md:45-46`) and R-1230 to R-1269 (mutate-runner: 39 rows R-1230 to R-1268, R-1269 left
free, Read: `../parallel-seat/CHANGE.md:5`, `:67-71`, its S1 at `:563`). Neither sibling plan names an ID from R-1270 to R-1299 (Ran: `r3/probe/ids.out`).
One `shall` per row, EARS form. A new row enters `planned` and flips to `implemented`, with its evidence cell, in the commit whose code turns its marked checks green; in
between the trace rail is red, because it fails a `planned` row that a marker traces (`templates/typescript/template/tests/requirements-trace.ts:17`). Rows are placed by
feature ID, never by line, because the regroup moves lines (FEAT-029 and FEAT-031 both survive it, Ran: `git show feat/regroup:REQUIREMENTS.md`).

| ID | Change | Text |
|---|---|---|
| R-1270 | added, FEAT-031 | WHEN `NANA_COVERAGE_DIR` is set, the test runner shall run each collected test file with `NODE_V8_COVERAGE` set to a folder of that file's own under that directory. |
| R-1271 | added, FEAT-031 | WHEN `NANA_COVERAGE_DIR` is set, the test runner shall write into each collected test file's folder a record of the file's repository path, its PASS, FAIL or SKIP label and its seconds. |
| R-1272 | added, FEAT-031 | WHEN `NANA_COVERAGE_DIR` is set and every collected test file has run, the test runner shall write into that directory a completion record holding the number of files it collected. |
| R-1273 | added, FEAT-031 | WHILE `NANA_COVERAGE_DIR` is set, the test runner shall print one line naming it and its folder before the first test file's line. |
| R-1274 | added, FEAT-031 | WHILE `NANA_COVERAGE_DIR` is unset, the test runner shall pass each test file the caller's `NODE_V8_COVERAGE` unchanged. |
| R-1275 | added, FEAT-029 | The runtime data path shall be the file `NANA_RUNTIME_MAP_FILE` names where that is set, and otherwise `nana/runtime-map.json` under the repository's git common directory. |
| R-1276 | added, FEAT-029 | The runtime content hash of a file shall be the SHA-256 of its text with each CRLF read as LF, or the missing mark when the file cannot be read. |
| R-1277 | added, FEAT-029 | IF the measure command starts without `npm_execpath` in its environment or outside a git work tree, THEN it shall refuse before starting the suite, naming the cause. |
| R-1278 | added, FEAT-029 | The measure command shall start the suite as `scripts/test-locked.mjs` with no filter argument and with `NANA_COVERAGE_DIR` set to a new folder under the OS temp folder. |
| R-1279 | added, FEAT-029 | WHEN the measure command reads a coverage entry whose URL is a file URL, it shall drop the URL's query and fragment before it maps the path. |
| R-1280 | added, FEAT-029 | WHERE the measuring platform is Windows, the measure command shall map a coverage path to a repository path under Windows path rules, a drive letter in either case included. |
| R-1281 | added, FEAT-029 | The measure command shall map a coverage path under the repository root resolved through links to the same repository path as one under the root as given. |
| R-1282 | added, FEAT-029 | WHERE a coverage entry's URL is not a file URL or its repository path is not a file git tracks, the measure command shall leave the entry out of the runtime data. |
| R-1283 | added, FEAT-029 | IF a coverage file in a test file's folder cannot be read or parsed as JSON, THEN the measure command shall leave that file out and count it. |
| R-1284 | added, FEAT-029 | WHEN the suite has exited, the measure command shall print one line giving the records read, the coverage files read and their total size, and the coverage files it left out as unreadable. |
| R-1285 | added, FEAT-029 | WHEN the suite has exited and its completion record names as many files as the records read, the measure command shall write the runtime data: the schema version, the commit, whether tracked files matched it, the platform, the Node version, the content hash of each test file and executed file, and per test file its label, seconds and executed files. |
| R-1286 | added, FEAT-029 | IF the suite exits without a completion record, or with one that names a different number of files from the records read, THEN the measure command shall leave any earlier runtime data unchanged and exit non-zero. |
| R-1287 | added, FEAT-029 | WHEN the measure command has written the runtime data, it shall exit with the suite's exit code. |
| R-1288 | added, FEAT-029 | WHEN the measure command receives SIGINT, SIGTERM or SIGHUP while the suite runs, it shall send the same signal to the suite. |
| R-1289 | added, FEAT-029 | The measure command shall remove its coverage folder before it exits, once the suite has exited or, after a forwarded signal, once the configured wait has passed. |
| R-1290 | added, FEAT-029 | The impact command shall print the code-map generator's impact output byte for byte before any runtime line. |
| R-1291 | added, FEAT-029 | WHEN runtime data exists, the impact command shall list under each named file every measured test file that executed it, longest first and ties by path, with its measured seconds and, when its label was not PASS, that label. |
| R-1292 | added, FEAT-029 | WHEN a named file's current content hash differs from its recorded hash, or the data records none, the impact command shall mark every measured test line under that file stale. |
| R-1293 | added, FEAT-029 | WHEN a listed test file's current content hash differs from its recorded hash, or the data records none, the impact command shall mark that test file's line stale. |
| R-1294 | added, FEAT-029 | WHEN runtime data exists, the impact command shall end with one line naming the measured commit, whether tracked files matched it, the platform, the Node version, the count of recorded files whose content changed since, the count of current test files the data does not hold, and that copies run from a temporary folder and children stopped by a signal are not counted. |
| R-1295 | added, FEAT-029 | IF the runtime data is missing, unreadable or of another schema version, THEN the impact command shall print one note naming the cause in place of the runtime lines and exit with the generator's exit code. |
| R-1296 | added, FEAT-029 | The map check shall give the same output and exit code whatever the runtime data holds. |
| R-618 | evidence only (FEAT-031) | Text unchanged: the coverage knob is a runner knob outside `NANA_TEST_` on purpose, so R-618's existing scrub already withholds it from every test file. Its cell gains the new check `R-618: the coverage knob reaches no test file's environment` (C6) and one clause saying the name is outside `NANA_TEST_` on purpose, so nobody "fixes" it. |

27 rows added (R-1270 to R-1296), none reworded, none retired; R-618 changes its evidence cell only; R-1297 to R-1299 stay free. No FEAT-029 note: the reasons live in this
corpus. Leaf total on main 1,139 (`requirements-tree.test.mjs:40`; the regroup tip says 1,152 and the roster-notice tip 1,165, Ran by the fact-check with `git show`); the
lane adds 27 to whatever main holds at its base, after the regroup, roster-notice, seat-rule and mutate-runner lanes.

## 3. Design

**3.1 The runner knob (R-1270 to R-1274).** `scripts/test.mjs` imports `COVERAGE_ENV`, `RECORD_FILE`, `COMPLETION_FILE` and `KNOB_LINE` from the config (§3.6). When the
knob names a folder:
- the runner prints `KNOB_LINE` and the folder once, after collecting files and before the first file's line (R-1273), so a knob left set in a shell shows on every run;
- each collected file gets `<knob folder>/<run position, four digits>` as its own `NODE_V8_COVERAGE`, set on that file's env beside HOME and TMP (`:362`) (R-1270);
- after the label is known (`:382`), and in the SKIP branch (`:352-357`) with 0 seconds, the runner creates the folder if needed and writes `{path, label, seconds}` there,
  `path` being the posix repo path `rel(file)` (`:62`) and `seconds` the number it prints (`:369`) (R-1271);
- after the loop, just before the totals line (`:413-415`), it writes `{files: files.length}` as the completion record at the knob folder's top (R-1272). A runner stopped
  by a signal, or one that crashes, writes none.

The runner never sets `NODE_V8_COVERAGE` on its own process, and doing so would change nothing: Node reads the variable only at start (Ran by the critique: setting it in a
running process wrote no coverage). The runner's own coverage exists only when its caller starts it with the variable, and §3.2's measure command never does. Ran
(`probe-knob/`, 12 added lines against `:52-399`): a SKIP, a PASS that spawns a child, a PASS and a FAIL file each got one folder with its record; the PASS-with-child folder
held the test's and the child's coverage. The folder is named by run position because the record names the path, so no module rebuilds a path-to-name rule. With the knob
unset none of the new lines run (R-1274). **The name sits outside `NANA_TEST_` on purpose:** R-618's scrub (`:279`) then keeps it from every test file, so a nested runner in
the runner's own tests never writes into the measuring folder (Ran: `probe-knob/`, the test file and its child both saw no knob). The runner's header and comment (`:5-7`, `:11-12`,
`:22-24`) gain one clause saying so. **The runner gains its first non-built-in import.** Today the runner test copies `scripts/test.mjs` alone into each fixture root and
relies on its node-only imports (`scripts/test.mjs:45-50`; `packages/nana-pack/tests/test-runner.test.mjs:12-16`, `:47-58`); `mkRoot` now also copies the config to the same
relative path, and its comment says so. The config imports nothing, so that one file is all `mkRoot` adds. A broken config stops every suite run loudly (fail closed). The
mutate-runner plan's later `test-jobs` lane moves the runner's per-file spawn into a pack library (Read: `../parallel-seat/CHANGE.md:465`), so the node-only property ends
either way, and R-1270 to R-1274 move with it as its contract.

**3.2 The measure command (R-1275 to R-1289).** New `scripts/runtime-measure.mjs`, run as `npm run map:measure`.
- **Before the suite (R-1276, R-1277).** Refuse, naming the cause, when `npm_execpath` is absent (test-locked would start `node undefined test`,
  `scripts/test-locked.mjs:112`, which fails with `MODULE_NOT_FOUND` and exit 1, Ran by the fact-check) or when `git rev-parse --show-toplevel` fails. Then take, before
  anything runs: the commit (`git rev-parse HEAD`), the clean flag (`git status --porcelain --untracked-files=no` is empty), the tracked list (`git ls-files -z`) and every
  tracked file's content hash, `MISSING_HASH` for one that cannot be read. Taking them first means the data describes the tree that was measured, even if someone edits
  during the run.
- **The suite (R-1278).** `mkdtempSync(path.join(os.tmpdir(), COVERAGE_PREFIX))`, the runner's own form (`scripts/test.mjs:292`), then spawn `node scripts/test-locked.mjs`
  with no argument (it takes the machine-wide lock only without a filter, `scripts/test-locked.mjs:20`, `:168`), stdio inherited, and the caller's env plus the knob;
  `npm_execpath` passes through, so test-locked runs `npm test` as every locked run does (`:103-115`). The measure command parses no output: the completion record (R-1272)
  tells a complete run from an interrupted one, so a later rewording of the totals line breaks nothing here. It never sets `NODE_V8_COVERAGE`; an ambient one only makes
  npm, the lock and the runner write into the caller's folder, which nothing reads, because the runner's per-file value replaces it for every test file.
- **Signals (R-1288, R-1289).** On SIGINT, SIGTERM or SIGHUP the measure command sends the same signal to test-locked, which already sends it to npm's process group, kills
  that group 500 ms later and frees the lock (`scripts/test-locked.mjs:139-163`); the runner kills the active test file's tree on SIGINT and SIGTERM (`scripts/test.mjs:108-114`).
  The measure command then waits for test-locked to exit, at most `STOP_WAIT_MS`, and goes on to the after-suite step; when the wait passes first, it removes its folder and
  exits non-zero without reading. Without this step, a stop sent to the measure command alone would leave test-locked, npm and the runner running, and with inherited output
  nothing breaks their pipe, so the suite would run to its end holding the machine-wide lock (INFERRED from the critique's orphan probe, which used a pipe). The signal source
  is injected, so the checks drive it on both platforms.
- **After the suite (R-1283 to R-1287).** Read the completion record and every run-position folder once: the record, every `coverage-*.json`, every `result[].url`, mapped by
  `repoFileOf` (R-1279 to R-1282) and merged into that test file's executed set. A coverage file that cannot be read or parsed (a late writer, §1) is left out and counted,
  never thrown (R-1283). Print one summary line, `runtime map: <r> records, <c> coverage files (<mb> MB), <u> unreadable left out` (R-1284); its size is the run's disk total,
  which the acceptance records. If the completion record exists and its count equals the records read, write the data to a temporary file beside the data path and rename it
  over the old one, then exit with the suite's exit code (R-1285, R-1287); otherwise write nothing and exit non-zero, the suite's code or 1 if it was 0 (R-1286). The
  coverage folder is removed before every exit (R-1289).
- **Read once, not per line.** Draft 1 read and deleted each folder as the suite's output went by, to keep disk near one file's coverage. Cut (critique S3): the total is
  INFERRED at hundreds of MB to over 1 GB, against 200 GiB free on this Mac (Ran: `df -h`), and per-line reading cost a timing check and three failure paths (a half-written
  file, a failed delete that doubles a count, a record written after its line). The summary line now measures the total on every run; per-file reading comes back only if a
  measured total passes 5 GB (seat decision S10).
- **Mapping (R-1279 to R-1282).** `fileURLToPath(url, { windows })`, with `windows` true under the win32 path API, drops the query and fragment (Ran: `r2/probe/url.out`; a
  mapper that slices `file://` off the string keeps `?v=1`). Then `relative` under the platform's rules (`path.win32` ignores drive-letter case, Ran) against the root as
  given and as resolved through links (`realpathSync`, `realpathSync.native`). Keep the entry only when the relative path, with `/` separators, is in the tracked list. That
  one test drops `node:` and eval entries, `[eval1]`, the repo's own `node_modules/`, every file outside the root and every untracked file. Ran (`probe-1.json` to
  `probe-3.json`, `probe-knob/`): every repo entry the probes saw had a top-level run count of 1; the probe kept the maximum over processes (`probe.mjs:80`), so a
  per-process count of 0 would not have shown, and that a listed entry is a module that ran is INFERRED.

**3.3 The data file (the owner's answer 1).** `nana/runtime-map.json` under `git rev-parse --git-common-dir`, run in the root and resolved against the folder git ran in (it
prints `.git` from the main checkout, `../.git` from a subfolder and an absolute path from a linked worktree; all name one folder, Ran by the fact-check). Every worktree of
the clone shares one file, and the last measurement wins: a lane tip's measurement replaces main's, and the stale marks and the closing line's changed count show it
(residual 7). Nothing is committed, so no review round per refresh and no merge conflict; the map check never reads it (R-1296). `NANA_RUNTIME_MAP_FILE` overrides the path
(R-1275), which is how every new check points the real CLI at fixture data. Shape (schema 1; about 2,000 test-to-file pairs, INFERRED at about 100 KB):

```json
{ "schema": 1, "commit": "<40 hex>", "clean": true, "platform": "darwin", "node": "v22.22.2",
  "hashes": { "<repo path>": "<sha256 hex, or the missing mark>" },
  "tests": { "<test path>": { "label": "PASS", "seconds": 10.2, "ran": ["<repo path>", "..."] } } }
```

`hashes` holds every test file and every executed file. No timestamp: the commit and the hashes say how old the data is.

**3.4 The impact lines (R-1290 to R-1295).** `scripts/code-map.mjs` still calls the generator's `main` (`:49-51`), so the static output stays byte for byte (R-1290), and it
exits with `main`'s code (R-1295; `--impact` returns 0 today, `templates/typescript/template/scripts/code-map.mjs:851-862`). For `--impact` only, it then prints a blank line
and, from `formatRuntime`, one block per named file and one closing line. Shape, with placeholder numbers:

```
measured tests for packages/nana-pack/bin/pi-worker.mjs (2):
  <s>s  packages/nana-pack/tests/review-ledger.test.mjs  [stale]
  <s>s  packages/nana-pack/tests/worker-lane.test.mjs
runtime map: measured at <commit7> (clean) on darwin, node v22.22.2; <n> recorded files changed since; <m> test files not measured; copies run from a temporary folder and children stopped by a signal are not counted
```

- A file no measured test ran reads `measured tests for <path> (0): —`; the closing line's last clause says once why a zero is not "no test" (residual 2). Lines sort longest
  first, ties by path (R-1291). A non-PASS label follows the seconds (`[FAIL]`).
- Every line under a named file is stale when that file's current hash differs from its recorded one or none is recorded (R-1292); one line is stale when its own test file's
  does (R-1293). A deleted file hashes to `MISSING_HASH`, so it reads as changed. The closing line's changed count hashes every recorded file (R-1294).
- The current test files are the map's own: direct `*.test.mjs` children of its `layerExempt` roots (Ran: that set is the runner's set, 144 files each, no difference).
- A path argument becomes a repo path by the runner's rule, `relative` to the root and then `/` separators (`scripts/test.mjs:62`). That is not the generator's rule: the
  generator keeps `posix.normalize(relative(…))`, and the raw argument for a path that neither exists nor is a module (`…code-map.mjs:854-859`), so on Windows a nested path
  keeps its backslashes there and the static part can miss a module the runtime part finds (Read; not run on Windows; residual 13). A path outside the map, such as the
  template generator, is looked up the same way.
- With no data, unreadable data, another schema version or no git, one `runtime map:` note naming the cause replaces the block (R-1295). `--check`, `--write` and `--render`
  never reach this code (R-1296); the map file and its byte-exact check stay free of anything machine-dependent (the renderer's promise and the compare,
  `templates/typescript/template/scripts/code-map.mjs:682-686`, `:815`).

**3.5 Modules.** Each opens with the six-tag header. All imports point down or sideways: scripts may import packages, never the reverse (`code-map.config.json:39-52`).

| Module | Purpose (one sentence) | Effects |
|---|---|---|
| `packages/nana-pack/lib/runtime-map-config.mjs` (new) | Declare the runtime layer's tunables with their provenance. | none; imports nothing |
| `packages/nana-pack/lib/runtime-map.mjs` (new) | Read the runtime data and say which measured test files executed given files, marking stale ones. | process (one `git rev-parse` through an injected runner), disk (reads the data and the named files) |
| `scripts/runtime-measure.mjs` (new) | Run the suite once under per-file V8 coverage and write the runtime data. | process (git, the locked suite, forwarded signals), disk (a temp coverage folder, the data file) |
| `scripts/code-map.mjs` (edited) | Purpose gains ", adding the measured test files to `--impact`". | effect text grows (reads git and the data file); disk and process are already declared (`:7`) |
| `scripts/test.mjs` (edited) | Inputs gain the knob; outputs gain the knob line. | effect text grows ("a folder and a record per file, and a completion record, under the knob's folder"); process and disk are already declared (`:11-14`) |

Named exports. `runtime-map.mjs`: `dataPath(dir, {env, git})`, `hashFile(file, {readText})` (R-1276; never throws), `loadRuntime(file, {readText})` (returns the data or a
problem naming the cause, never throws), `formatRuntime(data, paths, {hashOf, currentTests})`. `runtime-measure.mjs`: `suiteCommand(root, env)`,
`repoFileOf(url, roots, {pathApi, tracked})`, `readFolders(dir, roots, tracked, io)`, `measure({root, env, start, onSignal, stopWaitMs, io})`; `start` defaults to spawning
`suiteCommand`, `onSignal` to `process.on` for each of `STOP_SIGNALS`, and `stopWaitMs` to `STOP_WAIT_MS`, so a check can inject the copied runner, a fake suite, a signal
and a short wait. **Placement:** the reader and config live in the pack's `lib/`, not `scripts/`, because this plan's later lanes a, c and f (§6) read them from pack code —
the shared mutation runner lives in the pack's `lib/` (Read: `../parallel-seat/CHANGE.md`, its S3) — and a package may not import a script. Neither sibling plan names an
import of this reader today (the fact-check found none). Prior art for a script importing a pack module: `scripts/template-release.mjs:12`.

**3.6 Config, read by name** (`packages/nana-pack/lib/runtime-map-config.mjs`). V1 (§5.1) alone holds the contract literals; every other check imports names.

| Name | Value | Provenance |
|---|---|---|
| `RUNTIME_SCHEMA` | `1` | contract (R-1295) |
| `COVERAGE_ENV` | `"NANA_COVERAGE_DIR"` | contract (R-1270); chosen name: outside `NANA_TEST_`, so R-618's scrub keeps it from every test file with no new code (Ran: `probe-knob/`) |
| `RECORD_FILE` | `"runner-record.json"` | contract (R-1271); chosen: Node names its own files `coverage-<n>-<n>-<n>.json` (Ran: `probe-knob/`), so none can take this name |
| `COMPLETION_FILE` | `"runner-done.json"` | contract (R-1272); chosen: it sits at the knob folder's top, where only run-position folders and this file live |
| `KNOB_LINE` | `"[runner] coverage on:"` | contract (R-1273); chosen: the runner's own `[runner]` prefix (`scripts/test.mjs:110`, `:243`, `:248`) |
| `DATA_FILE_ENV` | `"NANA_RUNTIME_MAP_FILE"` | contract (R-1275); chosen: the override shape of `NANA_SUITE_LOCK_DIR` (`scripts/test-locked.mjs:17`); a `NANA_` name, so R-618 keeps a developer's setting out of every test file |
| `DATA_SUBPATH` | `"nana/runtime-map.json"` | contract (R-1275); the owner's answer 1 (local, outside the repository); one git common dir per clone, shared by every worktree (Ran) |
| `MISSING_HASH` | `"missing"` | contract (R-1276); chosen: not 64 hex digits, so it never equals a real hash |
| `STOP_SIGNALS` | `["SIGINT", "SIGTERM", "SIGHUP"]` | contract (R-1288): the three test-locked forwards (`scripts/test-locked.mjs:156`) |
| `STALE_MARK` | `"[stale]"` | contract (R-1292, R-1293) |
| `NOTE_PREFIX` | `"runtime map:"` | contract (R-1294, R-1295) |
| `NOT_COUNTED` | `"copies run from a temporary folder and children stopped by a signal are not counted"` | contract (R-1294) |
| `COVERAGE_PREFIX` | `"nana-runtime-"` | chosen: a leftover temp folder names its owner, as the runner's `nana-test-runner-` does (`scripts/test.mjs:292`) |
| `SECONDS_DIGITS` | `1` | chosen: the runner's own printed precision (`scripts/test.mjs:369`) |
| `STOP_WAIT_MS` | `5000` | chosen: ten times test-locked's 500 ms kill escalation (`scripts/test-locked.mjs:152`), so a POSIX stop ends well inside it |

Other parts: `package.json` gains `"map:measure": "node scripts/runtime-measure.mjs"` beside `:11-13`. The root README's map paragraph (`README.md:55-61`) gains two
sentences, about: "`npm run map:measure` (`scripts/runtime-measure.mjs`) runs the suite once under per-file coverage and saves, in a file inside the clone's shared git folder
and outside the repository, which code each test file ran and how long it took; `npm run map:impact` then lists those test files under each named file. Copies run from a
temporary folder and children stopped by a signal are not counted." The README names the data's place in prose only: the README checker reads a backticked token with a
slash as a repo path that must exist (`templates/typescript/template/scripts/readme-check.mjs:305-319`, `:490-495`), and the file exists only after a measurement in a main
checkout. Its "thin shims" sentence notes that the code-map shim adds the measured lines. `docs/code-map.md` and `docs/requirements-tree.md` are regenerated; HANDOFF and
the session notes go into the reviewed change and paraphrase the owner.

**3.7 Cross-platform.** The mapper takes the path API as an argument, so the win32 cases run on darwin; `fileURLToPath(url, { windows })` gives the matching form (Ran:
`r2/probe/url.out`, `C:\Repo\…` with the option, `/C:/Repo/…` without). Folders and records use `path.join`; the folder name is digits only. `npm_execpath` makes npm run
through its JS entry on Windows, never `npm.cmd` (`scripts/test-locked.mjs:111-112`). The coverage folder sits under `os.tmpdir()` (an 8.3 short path on Windows CI, Read:
`docs/reviews/windows-ci-2026-10-11/ci-run-1-windows.log`) and is never compared with the repo root. R-1281's link check uses a directory symlink on POSIX and a junction on
win32, which needs no privilege (INFERRED that `realpathSync` resolves it); on macOS `os.tmpdir()` itself sits under the `/var` link while coverage URLs name `/private/var`
(Ran: `r2/probe/link.out`), so the fixture measurement F1 exercises it there. Signals: the signal source is injected, so M14 and M15 run on both platforms; on Windows the
measure command's `kill` ends test-locked at once with no handler (INFERRED from Node's documented Windows behaviour), and test-locked's own forwarding ends only npm
(`scripts/test-locked.mjs:132-133`), so a Windows stop can leave the runner and its test file running (residual 12). CI's Windows leg runs M11's real fixture measurement
(§5.1), the first Windows coverage URLs anyone reads, so the corpus records them; that leg is non-blocking (`.github/workflows/ci.yml:44-70`).

**3.8 What NOT to do.** No change to either template generator, `templates/`, the map file's format, `map:check`, `req:rows`, `scripts/test-locked.mjs`, the shared mutation
runner or any hand-copied seat runner, the builder preamble, CI, or the skill text. No affected-tests command, no `--json`, no line ranges, no timing threshold anywhere, no
timing in any committed file, no `NODE_V8_COVERAGE` on the runner's own process, no outside-the-repo count, no output parsing in the measure command.

**3.9 Subtraction test.**

| Part | Earns it because | Cut or kept smaller |
|---|---|---|
| Runner knob, per-file folder | without it the measure command copies the runner's discovery, env scrub and cwd rules, and copies drift (the seat's runners drift 22 to 138 lines per copy, `../parallel-seat/research.md` §1.2) | inert while unset |
| Knob outside `NANA_TEST_` | R-618's scrub already withholds it from tests and nested runners | no strip code, no R-618 rewording |
| Record per folder | the measure command reads path, label and seconds without parsing the padded line or knowing the folder name | three fields; folder named by run position |
| Completion record | tells a complete run from an interrupted one without reading output, so the totals line can change and stdio is inherited | one write; replaces draft 1's totals pattern and line echo |
| Knob line | a knob left set in a shell would make every run, land runs included, write coverage without a word | one line, only while set |
| Runner imports the config | one definition per name | `mkRoot` copies one file that imports nothing |
| Read once after the suite | no timing check, no half-read file inside a line handler, no doubled count | draft 1's per-line read cut; back only above 5 GB measured |
| Unreadable file left out and counted | one late writer must not abort a 12- to 16-minute run | one try, one count |
| Summary line | states the disk total on every run and shows the unreadable count | one line |
| Tracked-file filter | drops the repo's `node_modules/`, eval names and untracked files with one test, and defines which files get hashes | the `git ls-files` list taken before the run |
| Content hashes, CRLF folded, missing mark | staleness without git history, for a dirty tree and an untracked test file too; a line-ending change is not a content change | sha256, one replace, one constant; `git diff` weighed and not taken (S13) |
| Commit, clean, platform, Node | says what the data describes | no timestamp |
| Data override | the only way a check drives the real CLI on fixture data without a fixture clone | one env name |
| Exit with the suite's code | a red suite during a measurement stays visible | — |
| `npm_execpath` refusal | turns test-locked's `MODULE_NOT_FOUND` into a named cause | — |
| Signal forwarding | a stop sent to the measure command alone would leave the suite running and holding the machine-wide lock | test-locked does the group kill; one handler, one bounded wait |
| Not-counted clause | a zero line must not read as "no test" | one clause on the closing line |
| Outside-the-repo count | cut: no reader, and outside entries would swamp it (Ran: 1,419 in one desk test) | lane e measures copies with `probe.mjs` |
| "Loaded only" mark (the research's option C2) | cut: a script whose work is all at top level shows 0 calls (`research.md` §5) | — |
| Line ranges (the research's option C3), affected-tests command, `--json` | deferred to later lanes (§6) | consumers import `runtime-map.mjs` |
| Map-check integration, timing thresholds, timings in `docs/code-map.md` | cut: the check is a deterministic land gate, and the owner's answer 1 keeps the data out of it | R-1296 pins it |
| Template changes | deferred: measuring depends on each runner (vitest in TS, pytest in Python, `research.md` §4) | lane d (D2, parked) |

## 4. Scope

**In.** New: `packages/nana-pack/lib/runtime-map.mjs`, `packages/nana-pack/lib/runtime-map-config.mjs`, `scripts/runtime-measure.mjs`,
`packages/nana-pack/tests/runtime-map.test.mjs`. Changed: `scripts/test.mjs` (the knob, its header and comment), `scripts/code-map.mjs` (the runtime lines and its header),
`packages/nana-pack/tests/test-runner.test.mjs` (six checks, `mkRoot` copies the config, the header comment), `package.json` (one script), `README.md` (the map paragraph),
`REQUIREMENTS.md` (27 rows, R-618's cell), the regenerated `docs/code-map.md` and `docs/requirements-tree.md`, `requirements-tree.test.mjs` (the leaf total), `HANDOFF.md`
(§6's lines), `docs/sessions/2026-10.md`, and the review corpus `docs/reviews/runtime-map-<date>/` (this file, `seat-titles.mjs`, the seat's mutation table). **NOT.** §3.8.
**Overlap.** Three lanes land before this one builds, and it rebases onto main after them and cites rows by ID: the regroup rewrites `REQUIREMENTS.md`, the tree and the
map; the seat-rule lane rewords R-1140 and edits the seat guide, the shared working pattern, `AGENTS.md` and the setup README; the mutate-runner lane adds FEAT-031 rows and
pack modules. Each of them also edits `REQUIREMENTS.md`, `docs/requirements-tree.md`, the leaf literal in `requirements-tree.test.mjs`, `docs/code-map.md`, `HANDOFF.md` and
`docs/sessions/2026-10.md`, as this lane does; only the new modules do not overlap (fact-check W4). `feat/roster-notice` adds two pack lib modules, an extension, a hook and
two test files, and edits `README.md` and `package.json`, two files this lane edits (fact-check W15). The later `test-jobs` lane moves the runner's per-file spawn into a pack
library, and R-1270 to R-1274 move with it as its contract. `feat/t3-land-b` has no worktree.

## 5. Verification

Exact titles under `// req:` lines, red before the code, frozen in `seat-titles.mjs` (DONE = `0 missing`). Tunables imported by name; only V1 holds the contract literals.
Every new check that runs the impact CLI or `measure` sets `NANA_RUNTIME_MAP_FILE` (to a fixture, a missing file or a broken one), so no check reads or writes this clone's
real data. C5's absent case deletes `NODE_V8_COVERAGE` from its own process environment before it spawns the copied runner: Node copies a parent's value into any child env
that lacks the key, and deleting it from the parent stops that (Ran: `r2/probe/envprop.out`), so the case holds inside a measuring run, where the outer runner sets it. M3 and
M4 inject `start` and use fixture roots with no real `scripts/test-locked.mjs`, so no wrong-code pair starts a nested suite. INFERRED: the two test files add 5 to 15 s to the
suite; the builder reports the measured figure.

**5.1 New checks (29 titles).**
- **`packages/nana-pack/tests/test-runner.test.mjs`** (copied runner and config in a fixture root):
  C1 `// req: R-1270` `R-1270: with the coverage knob set, each test file's own folder holds the coverage of its process and of its spawned child`.
  C2 `// req: R-1271` `R-1271: with the coverage knob set, each test file's folder holds a record of its path, label and seconds, a FAIL and a SKIP file included` (the SKIP
  is a fixture at `apps/bench/test/study-tasks.test.mjs` in a root with no `apps/bench/.ext/pi-web-access`, a declared skip that fires on every platform,
  `scripts/test.mjs:161-162`).
  C3 `// req: R-1272` `R-1272: with the coverage knob set, the runner writes one completion record naming every collected file, a FAIL and a SKIP file included`.
  C4 `// req: R-1273` `R-1273: with the coverage knob set, the runner prints one line naming the knob and its folder before the first test file's line`.
  C5 `// req: R-1274` `R-1274: with the coverage knob unset, a test file sees the caller's NODE_V8_COVERAGE unchanged, absent or set`.
  C6 `// req: R-618` `R-618: the coverage knob reaches no test file's environment`.
- **`packages/nana-pack/tests/runtime-map.test.mjs`** (new). Fixture F1: a temp git repo, its root as `os.tmpdir()` gives it, holding the copied runner and config, two PASS
  files (one spawns a fixture module), one FAIL file and one SKIP file (as in C2), all committed; `measure` runs once with `start` injected as the copied runner, and M11 and
  M13 read that one run. M9, M10, M12, M14 and M15 inject a small fake suite instead.
  M1 `// req: R-1275` `R-1275: the runtime data path is nana/runtime-map.json under the git common directory, the same from a linked worktree and from a subfolder, and the override file when the override is set`.
  M2 `// req: R-1276` `R-1276: a CRLF copy of a file hashes as its LF form, and a missing file hashes to the missing mark`.
  M3 `// req: R-1277` `R-1277: without npm_execpath, or outside a git work tree, the measure command refuses before starting the suite and names the cause`.
  M4 `// req: R-1278` `R-1278: the measure command starts scripts/test-locked.mjs with no filter argument and the coverage knob set to a new folder under the OS temp folder`.
  M5 `// req: R-1279` `R-1279: a coverage URL with a query or a fragment maps to its repository file`.
  M6 `// req: R-1280` `R-1280: under Windows path rules, a coverage URL maps to its repository file when its drive letter's case differs from the root's`.
  M7 `// req: R-1281` `R-1281: a coverage URL under the root's link target maps to its repository file`.
  M8 `// req: R-1282` `R-1282: node built-ins, eval entries, a file URL naming no file, an untracked file inside the root and a file outside the root are left out`.
  M9 `// req: R-1283` `R-1283: a coverage file cut short or not JSON is left out, and the measurement still writes the runtime data`.
  M10 `// req: R-1284` `R-1284: after the suite exits, the measure command prints one line with the records read, the coverage files read and their size, and the unreadable files left out`.
  M11 `// req: R-1285` `R-1285: a fixture measurement records the schema, commit, clean flag, platform, Node version, every hash, and each test file's label, seconds and executed files, the test file itself and its spawned child's module included`.
  M12 `// req: R-1286` `R-1286: a run with no completion record, or with one whose count differs from the records read, leaves earlier runtime data unchanged and exits non-zero`.
  M13 `// req: R-1287` `R-1287: with a failing test file, the measure command writes the runtime data and exits with the suite's exit code`.
  M14 `// req: R-1288` `R-1288: a stop signal the measure command receives while a fake suite runs is sent on to the suite, which then exits`.
  M15 `// req: R-1289` `R-1289: the coverage folder is gone after a complete run, an incomplete run and a stop whose wait ran out, and a forwarded stop removes it only after the suite has exited, a file the suite wrote after the signal included`
  (both stop cases inject the same short wait. In the forwarded-stop case the fake suite, on the signal, waits a fixture delay shorter than that wait, writes one valid
  coverage file with an empty `result` into a run-position folder under its knob folder, creating the folders as Node does (`research.md` §3), and exits; the case asserts
  the folder is gone and the fake suite had exited when `measure` returned. The wait case's fake suite ignores SIGTERM on POSIX. M15 sends SIGKILL to any fake suite still
  running at its end. On Windows the kill is forced, so the fake suite writes no late file and exits, and both cases still hold; the ordering clause is pinned on POSIX,
  where the pairs run).
  I1 `// req: R-1290` `R-1290: with runtime data, impact prints the generator's output byte for byte before any runtime line` (it compares the prefix only).
  I2 `// req: R-1291` `R-1291: impact lists the measured test files that executed a file, longest first and ties by path, with seconds and a non-PASS label, a test the import graph does not link included`.
  I3 `// req: R-1292` `R-1292: when the named file changed or has no recorded hash, impact marks every line under it stale`.
  I4 `// req: R-1293` `R-1293: when one listed test file changed or has no recorded hash, impact marks that line stale and no other`.
  I5 `// req: R-1294` `R-1294: impact's closing line names the commit, the clean flag, the platform, the Node version, the changed-file count with a deleted file counted, the unmeasured test count and what is not counted`.
  I6 `// req: R-1295` `R-1295: with no data, unreadable data or another schema version, impact prints one note naming the cause after its static output and exits with the generator's code`.
  I7 `// req: R-1296` `R-1296: the map check's output and exit code are the same with no runtime data, unreadable data, valid data and data with a stale entry`.
  V1 `// req: R-1270 R-1271 R-1272 R-1273 R-1275 R-1276 R-1288 R-1292 R-1293 R-1294 R-1295` `seal: the coverage knob, record and completion files, knob line, data override and path, missing mark, stop signals, schema version, stale mark, note prefix and not-counted note`.
- I1 to I7 spawn `node scripts/code-map.mjs` on this checkout (I7 four times with `--check`; each run takes about 0.07 s, Ran by the critique and the fact-check). Their
  fixture data carries real repo paths and hashes computed with `hashFile`, so staleness is exact; only I5's fixture names a recorded file that no longer exists.

**5.2 Census of existing checks that change** (Read at `2dbc817`; re-read in `factcheck.md`; none was run).

| Check | Row | Change |
|---|---|---|
| `code-map.test.mjs:39` the repo's code map is current and every module has a contract header | G-004, G-009, G-010 | red until `npm run map`: three new modules, one new test module, two edited headers, and new edges — the runner and the measure command to the config, the measure command and the shim to the reader, the reader to the config, the new test to all three |
| `code-map.test.mjs:235` scripts/code-map.mjs --check exits 0 on a clean repo | — (no marker) | red until `npm run map`, same cause |
| `requirements-tree.test.mjs:36` committed outline equals a fresh render; `:38` outline fields and row IDs match; `:76` parent row counts aggregate descendants; `:85` feature outline carries status and shared IDs | R-291 | red until `npm run req:tree` |
| `requirements-tree.test.mjs:40` leaf counts total 1,139 | R-291 | red; the total at the base plus 27 (title and literal) |
| `requirements-trace.test.mjs:61` REQUIREMENTS.md and the markers the suite carries agree | — | red while a marker traces a `planned` row; green once the rows flip and R-618's cell names C6 |
| `readme-check.test.mjs:36` every README this repo ships holds its claims; `:50` scripts/readme-check.mjs --check exits 0 (no marker) | G-012 | red until a README names both `map:measure` and `runtime-measure.mjs`: the checker wants every `package.json` script and every file under `scripts/` named in some README (`templates/typescript/template/scripts/readme-check.mjs:456-463`, `:531-547`; Ran by the fact-check). A backticked data location would also red it (§3.6); the README names the place in prose |
| every existing `test-runner.test.mjs` check | R-600 to R-618, R-648, R-910 to R-912, R-915 to R-918 | green: `mkRoot` copies the config, and every new runner line sits behind the knob; the header comment at `:12-16` is reworded |
| `code-map.test.mjs:225` --impact's output carries the untraced-test line | R-861 | green: it calls the generator's `formatImpact`, which the lane does not touch |
| `templates-render.test.mjs:633-639` --impact prints the untraced-test count for a fresh scaffold | R-862 | green: the template generator is untouched |
| `product-report.test.mjs` (checks over the copied real HANDOFF, such as `:60`) | — | green while every ask line the lane adds keeps the `[optional, since …]` form; the report throws on a malformed one (`packages/nana-pack/tests/product-report.test.mjs:32`; `scripts/product-report.mjs:211-215`) |

Green with no edit: `test-locked.test.mjs` (the lock script is untouched); `requirement-rows.test.mjs` (it imports the shim's `impact` and `repoGraph`, which are unchanged;
no existing test spawns the shim with `--impact`, Ran by the fact-check). The product report shows FEAT-029's and FEAT-031's assessments out of date until refreshed; no check
fails on it (Read by the fact-check: `validateStore` compares stamps with the ledger at the stamped commit, `scripts/product-report.mjs:166-200`).

**5.3 Wrong code first.** Each pair edits code, never an assertion, and must red exactly the named checks in the shared mutation runner (the mutate-runner lane's, landed
before this one) on macOS. 55 pairs.

| # | Wrong code | Reds |
|---|---|---|
| 1 | each test file's `NODE_V8_COVERAGE` points at the knob folder itself, while records still go to their own folders | C1, M11 |
| 2 | the runner writes no record for a SKIP file | C2, M11, M13 |
| 3 | the runner writes no record for a FAIL file | C2, M11, M13 |
| 4 | the record holds the printed seconds string, not a number | C2, M11 |
| 5 | the completion record counts only PASS files | C3, M11, M13 |
| 6 | the runner writes no completion record when a file FAILs | C3, M11, M13 |
| 7 | the knob line prints after the first test file's line | C4 |
| 8 | with the knob unset, the runner sets `NODE_V8_COVERAGE` to a temp folder | C5 |
| 9 | with the knob unset, the runner sets each test file's `NODE_V8_COVERAGE` to an empty string | C5 |
| 10 | `SCRUB` keeps the coverage knob, as it keeps `NANA_TEST_` knobs | C6 |
| 11 | `dataPath` asks for `--git-dir`, not `--git-common-dir` | M1 |
| 12 | `dataPath` resolves git's answer against the process's folder, not the folder git ran in | M1 |
| 13 | `dataPath` ignores the override | M1, M9, M11, M13, I2, I3, I4, I5, I6 |
| 14 | `hashFile` hashes raw bytes, so a CRLF copy reads as changed | M2 |
| 15 | `hashFile` throws on a missing file | M2, I5 |
| 16 | the measure command runs without `npm_execpath` | M3 |
| 17 | the measure command runs outside a git work tree | M3 |
| 18 | the measure command passes a filter argument to the lock script | M4 |
| 19 | the measure command makes its coverage folder inside the repository | M4 |
| 20 | the mapper slices `file://` off the URL instead of calling `fileURLToPath` | M5 |
| 21 | the mapper uses `path.posix` for a Windows URL | M6 |
| 22 | the mapper compares the root by a case-sensitive string prefix | M6 |
| 23 | the mapper compares against the root as given only | M7, M11 |
| 24 | the mapper credits every path inside the root, tracked or not | M8 |
| 25 | the mapper credits a file outside the root by its absolute path | M8 |
| 26 | a coverage file that fails to parse throws | M9, M10 |
| 27 | the summary line leaves out the unreadable count | M10 |
| 28 | the measure command reads only the first coverage file in a folder | M11 |
| 29 | the data leaves out the clean flag | M11 |
| 30 | the measure command writes data when there is no completion record | M12 |
| 31 | the measure command ignores the completion record's count | M12 |
| 32 | the measure command exits 0 after writing data | M13 |
| 33 | the measure command forwards no signal to the suite | M14, M15 |
| 34 | on a signal, the measure command removes its folder at once, before the suite exits, and not again at its exit | M15 |
| 35 | after a forwarded signal, the measure command waits for the suite with no bound | M15 |
| 36 | the coverage folder stays after an incomplete run | M15 |
| 37 | the runtime block prints before the static output | I1 |
| 38 | measured tests sort by name | I2 |
| 39 | tied seconds keep the data's order, not path order | I2 |
| 40 | the seconds are left out | I2 |
| 41 | the block lists only the static test callers | I2 |
| 42 | a FAIL label is left out | I2 |
| 43 | a line goes stale only when its own test file changed | I3 |
| 44 | every line goes stale when any recorded file changed | I4 |
| 45 | a test file with no recorded hash reads as unchanged | I4 |
| 46 | the closing line leaves out the unmeasured test count | I5 |
| 47 | the changed count covers only the named files | I5 |
| 48 | the closing line leaves out the not-counted clause | I5 |
| 49 | unreadable data throws and exits 1 | I6 |
| 50 | data of another schema version is read anyway | I6 |
| 51 | the map check warns when the runtime data holds a stale entry | I7 |
| 52 | `RUNTIME_SCHEMA` changed in the config | V1 |
| 53 | `COVERAGE_ENV` changed in the config | V1 |
| 54 | `DATA_SUBPATH` changed in the config | V1 |
| 55 | `STALE_MARK` changed in the config | V1 |

Recount: runner 1-10 (10), data path and hash 11-15 (5), measure start 16-19 (4), mapping 20-25 (6), reading and writing 26-32 (7), signals 33-36 (4), impact 37-51 (15),
seal 52-55 (4); 10 + 5 + 4 + 6 + 7 + 4 + 15 + 4 = 55, numbered 1 to 55 with no gap. Every new check has at least one pair, all run on macOS: C1 1; C2 2-4; C3 5, 6; C4 7;
C5 8, 9; C6 10; M1 11-13; M2 14, 15; M3 16, 17; M4 18, 19; M5 20; M6 21, 22; M7 23; M8 24, 25; M9 13, 26; M10 26, 27; M11 1-6, 13, 23, 28, 29; M12 30, 31; M13 2, 3, 5,
6, 13, 32; M14 33; M15 33-36; I1 37; I2 13, 38-42; I3 13, 43; I4 13, 44, 45; I5 13, 15, 46-48; I6 13, 49, 50; I7 51; V1 52-55. Notes on six reds: pair 33 reds M15
through the forwarded-stop case's exit check, because the fake suite gets no signal and is still running when `measure` returns after the wait; pair 34 reds M15 because
the fake suite's late file, written after the early removal, is still there when `measure` returns (both INFERRED, not run; the build's mutation run is the proof); pair 13 reds I6 on
any clone, because I6 asserts the note's cause and the clone's own data, present or absent, never gives all three causes; pair 23 reds M11 because F1's root sits under
the `/var` link (Ran: `r2/probe/link.out`); pair 20 reds M5 only, because a sliced Windows URL still maps (Ran: `r2/probe/url.out`); V1 asserts every sealed value, and the
four seal pairs sample one value per consumer (runner, data path, data format, impact).

**Seat acceptance** (seen failing at the base: `npm run map:measure` is not a script, and `map:impact` prints no runtime lines). On the tip, on this Mac:
1. `npm run map:measure` prints the knob line, the suite and the summary line. Record the summary line: its MB is the run's disk total; above 5 GB the seat reopens per-file
   reading (S10). No `nana-runtime-` folder remains under the temp folder.
2. Start `npm run map:measure` again and send SIGTERM to the measure command alone after 20 s. It exits non-zero; no `nana-runtime-` folder, no suite lock and no runner
   process (`pgrep -f scripts/test.mjs`) remain; the data file is byte-equal to run 1's.
3. `npm run map:impact -- packages/nana-pack/bin/pi-worker.mjs` lists `worker-lane.test.mjs`; the template generator lists `code-map.test.mjs`; `scripts/test.mjs` lists
   none, and the closing line says copies are not counted (residual 2).
4. Compare run 1 with a plain `npm run test:locked` on the same tip: every label must match. Record each file's seconds side by side and report the largest ratio; nothing
   passes or fails on seconds.
5. Then `npm run test:locked`, `map:check`, `readme:check`, the tree check and the trace rail.

Windows: CI's Windows leg (non-blocking; it runs on a pull request and on the push of main that carries the lane, `.github/workflows/ci.yml:2-5`, `:44-70`) passes C1 to C6,
M1 to M15 and I1 to I7; the seat copies M11's coverage URLs from that leg's log into the corpus, if the check prints them, as the first read of the Windows form.

**The claim most likely wrong:** that every test file behaves under coverage as it does without it. Ran for 8 of 144 files (same verdicts and check counts, -2% to +5%
time); the other 136 were never run with coverage. If wrong, a file FAILs or times out only during measurement; the data records that label, and acceptance step 4 compares
labels against a plain run. Next most likely: the Windows coverage URL form (INFERRED from stack traces; M11 on the Windows leg is the first real read), and then that a
Windows stop leaves the suite running (residual 12).

## 6. Decisions and residuals

**The owner's answers (2026-10-16), binding on this plan and its two siblings.**
1. Reading and storage. For each test file, the map holds the repository code that file executes, its spawned children's code included, and the file's run time; a
   profile of single functions is out. Nothing is kept in the repository: the data lives on the machine that measured it, and `map:check` does not look at it. This settles
   draft 1's D1 (storage: local, under the git common dir, §3.3) and the reading the critique wanted put to the owner as D0 (§1, R-1296); both asks are dropped.
2. Lane limit. A small lane writes a rule into the seat guide that makes running independent work at the same time the default, and it changes the cap from two lanes in
   flight (`HANDOFF.md:81`, `packages/nana-setup/claude/rules/nana-seat.md:11`) to two lanes in build and a third in planning. That is the seat-rule lane; this plan is
   planned under that cap.
3. Order once the regroup has landed: the seat-rule lane first, the shared split mutation runner second, this lane third; feature-oriented development comes after all three.
   This settles draft 1's D4 (queue slot), which is dropped.

**Open owner calls (none blocking).**
- **D3 [optional] When to measure.** What was tested: one measuring run is a full suite run, and the 2026-10-11 plain run took 661 s (Read: its totals line), so a
  measurement is INFERRED at 12 to 16 minutes with today's slower lift test. The options in plain numbers: (a) on demand, 0 extra minutes until a reader exists, and the
  closing line's counts show how old the data is; (b) the seat's full suite run before each land is the measuring run, 0 extra minutes and fresh data at every land, but the
  land gate's run then carries coverage, the claim most likely wrong for 136 of 144 files; (c) after each land, 12 to 16 extra machine minutes per land; (d) nightly through
  launchd, macOS only. The trade: fresh data against machine time or a change to the gate run. Recommended: (a) until later lane a, b or c reads the data; revisit (b) once
  acceptance step 4 has matched every label against a plain run. Your call because it spends machine time or changes what the land gate's run carries. It is optional:
  this lane's code is the same under every answer.
- **D2 [parked until lane d is planned] Core feature or nana-pi tool.** This lane is nana-pi only. Making it a feature of every project is later lane d (both templates, two
  runners to probe). It sets lane d's place in the queue, not this lane.
- **D5 [parked until lane a is planned] Builder practice.** Should briefs tell builders to run only the affected tests in their loop (later lane a)? The full suite on the
  reviewed tip stays the land gate either way. It changes what every builder does, not this lane.

**Seat decisions (declared, not asked).**
- S1 IDs R-1270 to R-1296 from the range the seat assigned (R-1270 to R-1299); R-1297 to R-1299 stay free. No cross-plan action: the mutate-runner plan already holds
  R-1230 to R-1268 inside its own range R-1230 to R-1269 (Read: `../parallel-seat/CHANGE.md:5`, its S1 at `:563`).
- S2 The reader and config live in the pack's `lib/` (§3.5). S3 The knob is `NANA_COVERAGE_DIR`, outside `NANA_TEST_`, and the runner header says why (§3.1). S4 A record
  per folder, folders named by run position. S5 The runner imports the config, which imports nothing; `mkRoot` copies it. S6 The tracked-file filter replaces "an existing
  file inside the root", and the outside-the-repo count is cut (§3.9). S7 The measure command goes through npm and refuses without it, rather than borrowing test-locked's
  fixture override `NANA_SUITE_TEST_COMMAND` (`scripts/test-locked.mjs:5`, `:21`), so a later change to the `test` script reaches measurements too. S8 Class GATE and
  FORMAT, two plan rounds, the larger-lane builder. S9 No FEAT-029 note in the ledger.
- S10 Read every folder once after the suite exits (critique S3). The summary line measures the total; per-file reading returns only above 5 GB (chosen: about five times
  the research's high estimate, and 2.5% of this Mac's 200 GiB free, Ran `df -h`).
- S11 A completion record replaces parsing the totals line (critique N1), so the measure command reads no output and inherits stdio.
- S12 The runner prints one line while the knob is set (critique N2).
- S13 Content hashes stay (critique N12, weighed once). `git diff --name-only <commit>` with a dirty-tree refusal would cut the CRLF rule, the missing mark, the clean flag
  and the hash map, but it cannot judge a test file git does not track, depends on the measured commit staying in the object store, and refuses the dirty tree a lane
  worktree often has mid-lane. The hashes cost one function, two constants and one check.
- S14 The measure command forwards stop signals and waits, bounded (critique S4).
- S15 A path argument maps by the runner's `rel` rule, not the generator's (critique N5, fact-check W8; residual 13).
- S16 HANDOFF at the land (critique S10): the Landed line, the queue line, one residual line pointing at the README's not-counted sentence and this corpus, and the D3 ask
  only if it is still open, as `[optional, since 2026-10-16]`. Seat decisions, residuals and later lanes stay in this corpus.

**Residuals (kept in this corpus; HANDOFF carries one line).** 1. A child ended by SIGTERM or SIGKILL writes no coverage (Ran), so a test that stops a server that way
under-reports it; a test file that times out loses its children the same way. 2. A copy run from a temporary folder is not credited (Ran): `scripts/test.mjs` gets no
measured test file, and the code-map test's copies of the generator are dropped (the generator is still credited through its direct import, Ran); the closing line says so
once. 3. The data describes one run on one machine: a platform-only branch (the Windows-only hook test SKIPs on darwin, `scripts/test.mjs:166-167`) is absent from a darwin
measurement. 4. Seconds are taken under coverage (-2% to +5% in the sample, Ran) and under whatever else the machine runs. 5. The Windows URL form is INFERRED until the
Windows leg's M11 runs. 6. A line is stale only when the named file or that test file changed; an edit elsewhere can change what a test runs, and only the closing line's
changed count shows it. 7. Every worktree of the clone shares one data file, and the last measurement wins: a lane tip's measurement replaces main's, which the stale marks
show. Two measuring runs at once: the lock serializes the suites and the last rename wins; on Windows a rename over a file another process holds open may fail (INFERRED),
and that measurement then exits non-zero and keeps the old data. 8. A SIGKILL of the measure command leaves its temp folder. After a forwarded SIGHUP, which the runner does
not handle (`scripts/test.mjs:114` takes SIGINT and SIGTERM only), or after any stop on Windows, a test file cut off from its runner runs to its next failed write or its end,
and Node re-creates its coverage folder when it exits (`research.md` §3, `:151`): up to one file's coverage, 65 MB for the lift test, left under a `nana-runtime-` name.
9. The impact command's current-test set is the map's; it equals the runner's today (Ran: 144 and 144, no difference), but the two rules are separate, so a later change to
the runner's discovery can drift the unmeasured count. 10. Any check that runs the real impact CLI without the override reads this clone's data; every new check sets it.
11. A test that imports a path in the wrong case on a case-insensitive disk records that spelling, which `git ls-files` does not hold, so the entry is left out. 12. A
Windows stop: the measure command's `kill` ends test-locked at once (INFERRED), and test-locked's own forwarding ends only npm (`scripts/test-locked.mjs:132-133`), so the
runner and its test file can run on; M14 proves the forwarding call, not the Windows tree. 13. On Windows the generator's `--impact` keeps backslashes in a nested path
argument (`…code-map.mjs:854-859`, Read), so its static part can show no module where the runtime part shows measured tests (INFERRED; not run on Windows; later lane h).
14. A test file git does not track at measure time has no recorded hash, so its line reads stale until it is tracked and measured again. 15. A coverage file still being
written when it is read is left out and counted in the summary line (R-1283), so a late child can be missing from the data. 16. A measuring run with `NANA_TEST_SELFTEST`
set runs the runner's self-test fixtures too: it exits non-zero by design, and the data gains entries for fixture paths outside the repository, which no repository file
lists.

**Later lanes** (each planned on its own; this plan's ideas unless named otherwise).
- (a) Affected tests: one command runs the union of the static test callers, the measured tests and every unmeasured or stale test file. A file with neither a static nor a
  measured test reads as "unknown", and the full suite runs (critique S11). The builder brief points at it once D5 is answered.
- (b) The mutate-runner plan's `test-jobs` lane (its lane 4, Read: `../parallel-seat/CHANGE.md:465-466`) reads the recorded seconds, longest first, file order with no data;
  on the 2026-10-11 times, 4 workers take 165 s longest first against 236 s round-robin and 458 s in contiguous chunks (Ran: arithmetic only, `research.md` §7). Carry: once
  files run in parallel, the measuring run must still run them one at a time, or the seconds are taken under parallel load (critique N8).
- (c) Line ranges per test file from V8's block counts, so the shared mutation runner can pick each pair's tests by the mutated line. The mutate-runner plan does not ask
  for this (fact-check W5).
- (d) The template lift (D2): the data format and the reader move into both generators with paired TS and Python rows (as R-861 and R-862 pair); TS measures through
  per-file vitest runs or process attribution, Python through coverage.py per-test contexts (both to be probed).
- (e) Copies and signals, only if a measured count warrants it: credit temp-folder copies by matching function layouts; a preload that saves coverage before a signal (it
  changes the code under test, so it needs its own risk read).
- (f) A third tier in `req:rows`: rows marked by measured test files beside the direct and transitive tiers (`scripts/requirement-rows.mjs:44-58`).
- (g) A lane-overlap signal for the seat rule's parallel default: two lanes whose changed files share measured test files should not build at the same time. No sibling
  plan names it (fact-check W5).
- (h) The generator's Windows path argument (residual 13), in a template lane.

**INFERRED.** That a test file run under coverage behaves as without it, beyond the 8 Ran; the Windows coverage URL form and the 8.3 short-name case; that `realpathSync`
resolves a win32 junction; the full-run disk total (the summary line will measure it); the 12- to 16-minute measurement; the data file's size; that git leaves unknown files
in its common dir alone; that a rename over an open file can fail on Windows; that a Windows `kill` ends test-locked with no handler; that an orphaned suite with inherited
output runs to its end; that the generator's static part misses a nested path on Windows; that a listed coverage entry is a module that ran (the probe kept the maximum
count); that the two new test files add 5 to 15 s to the suite.

## Seat revision 2 (2026-10-16)

Each item of `design-critique.md` and each WRONG item of `factcheck.md` that still applied, re-verified at `2dbc817`, as applied:
1. The owner's answers (2026-10-16) are recorded in §1, §3.3 and §6. Answer 1 settles the reading and the storage, so draft 1's D1 and the critique's proposed D0 (S1) are
   dropped. Answer 3 settles the order, so D4 is dropped and the header says third in order. Answer 2 sets the lane limit the header names.
2. Critique M1 (five blocking asks against the trial's limit of three, `HANDOFF.md:79`): no blocking ask remains. D3 is optional with its default; D2 and D5 are parked
   until later lanes d and a.
3. Rows renumbered into R-1270 to R-1299 (critique S2, fact-check W3): draft 1's ID fallback is deleted; 27 rows R-1270 to R-1296 (Ran: `r2/probe/ids.out`); the
   mutate-runner draft's overlapping reservation is seat item S1 (wrong when written; see revision 3, item 1).
4. Critique S3: draft 1's R-1228 (read and delete per output line), its check and its pair are cut; the folders are read once after the suite exits (§3.2). New R-1283 (an
   unreadable coverage file is left out and counted) and R-1284 (the summary line, which measures the disk total) with M9, M10 and pairs 26 and 27; S10 sets the 5 GB
   reopen point; the acceptance's `du` watch becomes the summary line.
5. Critique S4: new R-1288 (forward SIGINT, SIGTERM and SIGHUP), and R-1289 narrows draft 1's R-1232 to "once the suite has exited or the wait has passed".
   `STOP_SIGNALS` and `STOP_WAIT_MS` join the config; the signal source and the wait are injected; M14, M15 and pairs 33 to 36; residuals 8 and 12; acceptance step 2.
6. Critique S5 and fact-check W11: draft 1's pair 1 (the runner sets `NODE_V8_COVERAGE` on its own process) is dropped as a survivor, C1 no longer claims "no folder holds
   the runner's", and §3.1 says why. Pair 39's survivor risk is closed by I7's fourth state, data with a stale entry (now pair 51). M11 checks both the test file and its
   child's module, so pair 28 does not rest on listing order.
7. Critique S6, fact-check W12 and the README census gap: the README names `scripts/runtime-measure.mjs` beside `npm run map:measure` and names the data's place in prose,
   never as a backticked path; §5.2's README row gives both causes and adds `readme-check.test.mjs:50`.
8. Critique S7: D3 recommends on demand until a reader exists; the pre-land run is option (b) with its trade.
9. Critique S8: one missing-file rule. `MISSING_HASH` (R-1276) for an unreadable file, and a file with no recorded hash reads as changed (R-1292, R-1293); M2, I3, I4 and
   I5 hold the cases; pairs 15 and 45.
10. Critique S9: draft 1's R-1223 becomes R-1275, the path itself, which M11 and I2 also exercise through the override; R-1226 splits into R-1279, R-1280 and R-1281 with
    M5, M6 and M7; R-1232 narrows into R-1289; R-1235 splits into R-1292 (every line under a changed named file) and R-1293 (one test file's line); M8's timing title
    went with item 4.
11. Critique S10: S16 says what HANDOFF carries; §6's heading no longer says each line becomes a HANDOFF line.
12. Critique S11: the closing line says once that copies and signal-stopped children are not counted (R-1294, `NOT_COUNTED`, pair 48); later lane a carries the "unknown"
    rule.
13. Critique S12: §3.3 and residual 7 say every worktree shares one file and the last measurement wins.
14. Critique S13: acceptance step 4 requires matching labels and records seconds side by side with the largest ratio, passing or failing nothing on seconds.
15. Critique notes. N1 taken: completion record R-1272, C3, pairs 5 and 6; the totals pattern and output echo are gone, stdio is inherited (S11). N2 taken: knob line
    R-1273, C4, pair 7 (S12). N3: the runner header and R-618's cell say the knob is outside `NANA_TEST_` on purpose. N4: the config imports nothing. N5 with W8: S15 and
    residual 13. N6: M3 and M4 inject `start` and use fixture roots without test-locked. N7: V1 asserts every sealed value; the four seal pairs sample one per consumer. N8:
    carried in later lane b. N9: the suite-time cost is INFERRED at 5 to 15 s, and the builder reports it. N10: ties by path (R-1291, pair 39). N11: "the generator's exit
    code" (R-1295). N12: weighed and kept (S13).
16. Fact-check WRONG items: W1, §1's list of the 30 modules (re-Ran: `r2/probe/uncalled.out`). W2, §1 says open question 10 covers computed imports and names R-861's line
    and the `req:rows` note for spawns. W3, item 3. W4, §4 names the files every earlier lane shares. W5, §1 and later lanes b, c and g: the sibling reads only the
    seconds, c and g are this plan's ideas, and `test-jobs` is the sibling's lane 4. W6, `MODULE_NOT_FOUND` and exit 1, dropped from the INFERRED list. W7,
    `mkdtempSync(path.join(os.tmpdir(), COVERAGE_PREFIX))`. W8, item 15. W9, the renderer-promise and compare cites name the template generator. W10, C5 deletes the
    variable from its own process environment (Ran: `r2/probe/envprop.out`). W11, item 6. W12, item 7. W13, §3.5 says the effect text grows and no kind is added. W14,
    §5.2 names R-648, R-910 to R-912 and R-915 to R-918. W15, §4 says roster-notice also edits `README.md` and `package.json` and adds pack modules.
17. Fact-check census gaps: `code-map.test.mjs:235`, `requirements-tree.test.mjs:76` and `:85`, `readme-check.test.mjs:50`, the README path-claim cause and
    `product-report.test.mjs` join §5.2; the `code-map.test.mjs:39` row names the new edges.
18. Fact-check notes: `fileURLToPath` drops the query and fragment, so pair 20 is a string-slicing mapper (Ran: `r2/probe/url.out`); the seal check is now V1 and the
    research's options carry the research's names, so "S1", "C2" and "C3" each name one thing; M1 adds the subfolder case; §3.2 says the probe kept the maximum count.
19. New in this revision, Ran: `fileURLToPath(url, { windows: true })` gives the `C:\…` form on darwin, and `path.win32.relative` maps both forms
    (`r2/probe/url.out`); `os.tmpdir()` sits under the `/var` link while coverage URLs name `/private/var` (`r2/probe/link.out`), so F1 exercises R-1281 and pair 23 also
    reds M11.
20. Recount: 27 rows added (R-1270 to R-1296), none reworded, R-618 evidence only; 29 new titles; 55 pairs, numbered 1 to 55 with no gap; the tree total is the base plus
    27; residuals 1 to 16; owner calls: D3 optional, D2 and D5 parked, none blocking.

## Seat revision 3 (2026-10-16)

The two MUST findings of `factcheck-r2.md`, re-verified at `2dbc817` and against the sibling plans as saved, both applied:
1. MUST-1 (§2's "Taken elsewhere", §6 S1, revision 2's item 3). Right. Ran (`stat`): the mutate-runner plan was saved at 21:59:41 and this plan at 22:01:31. Read: that
   plan already declared 39 rows, R-1230 to R-1268, inside its range R-1230 to R-1269 with R-1269 free (`../parallel-seat/CHANGE.md:5`, `:67-71`, its S1 at `:563`), and it
   names no ID from R-1270 up. So "rows from R-1240", "draft 1 still reserves up to R-1279 (`:60`)" and S1's cross-plan action were wrong when written. §2 now lists
   R-1230 to R-1269 for the mutate-runner lane and drops the overlap sentence; S1 drops its action; revision 2's item 3 points here. The seat-rule cite moves from `:40-41`
   to `:45-46`, because that plan was saved again at 22:13. Ran again (`r3/probe/ids.out`, `r3/probe/refs.txt`): R-1270 to R-1299 has no hit on 38 branch refs, at
   `2dbc817`, in the `REQUIREMENTS.md` of the main checkout and two worktrees, or in either sibling plan. Revision 2 counted 39 refs; the local `feat/regroup` ref has gone
   since, and `main` now points at the regroup tip `c514964`.
2. MUST-2 (§5.1 M15, §5.3 pairs 33 and 34). Right. Read at `2dbc817`: the runner takes SIGINT and SIGTERM, kills the active test's tree and exits
   (`scripts/test.mjs:108-114`), so nothing in the suite writes into the folder after a forwarded stop. M15's title asserted only "is gone", so pair 34 left it green, and
   pair 33 left it green once the injected wait ran out; R-1289's ordering clause was unpinned. Fix (a) taken over (b): it adds no check and no title, and it models the
   real late writer, a test file cut off from its runner that re-creates its coverage folder as it ends (residual 8; `research.md` §3). M15's forwarded-stop case now has
   its fake suite write one valid coverage file into a run-position folder after the signal, after a fixture delay shorter than the case's wait, so the write cannot beat
   an early removal; the case asserts the fake suite had exited when `measure` returned; the title names the ordering clause. Pair 33 now reds M15 through that exit
   check and pair 34 through the late file; pair 34's text adds "and not again at its exit", so the wrong code is one removal at the signal. M15 sends SIGKILL to any
   fake suite still running at its end, because under pair 33 the forwarded-stop suite outlives `measure`. On Windows the forced kill leaves no late write, so the
   ordering clause is pinned on POSIX, where the pairs run. INFERRED, not run; the build's mutation run is the proof.
3. Left for the seat, outside these two findings: `design-critique-r2.md` S1's timer race for pair 35 (fact-check r2 note 3: pair 35 hangs M15's wait case until the
   per-file limit), and fact-check r2 notes 2 and 4.
4. Recount, unchanged in number: 27 rows added (R-1270 to R-1296), none reworded, R-618 evidence only, R-1297 to R-1299 free; 29 titles (M15 retitled); 55 pairs,
   numbered 1 to 55 with no gap; M15's pairs stay 33 to 36, each with a named path to red; residuals 1 to 16; owner calls D3 optional, D2 and D5 parked, none blocking.
