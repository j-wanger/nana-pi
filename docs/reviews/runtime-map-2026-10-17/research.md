# Runtime layer for the code map — research notes

Repository at main 2dbc817. Read-only research; probes ran in a scratch copy made with
`git archive 2dbc817` (called `<scratch>` below). Claims carry "file:line at 2dbc817",
"Ran: <command>" or INFERRED.

Stakes read: medium blast, reversible. The layer itself is advisory data, but the first lane
touches the suite runner, which is the land gate, so that one change must stay inert unless
asked for.

Scope note: the request had two parts — this runtime layer, and parallel work as a default for
the seat. These notes cover the first part. They name only what the runtime data hands the
second part (section 7); a separate plan owns it.

---

## 1. How the code map works today

**One generator, a thin shim.** nana-pi runs the template's TypeScript generator through
`scripts/code-map.mjs`, which only passes the CLI through (scripts/code-map.mjs:10-13, :49-51 at
2dbc817). `npm run map`, `map:check`, `map:impact` call it (package.json:11-13 at 2dbc817).

**Edges come from regexes over raw source.** Four patterns: static `from`, bare `import`,
`import('<literal>')`, and `import(new URL('<literal>', import.meta.url))`
(templates/typescript/template/scripts/code-map.mjs:393-411 at 2dbc817). Anything built at
runtime — a template-string path, a variable, a spawned process — makes no edge. The TS
generator stays silent on these, and the ledger records about 56 such sites as an open
question (REQUIREMENTS.md:1758 at 2dbc817).

**The impact walk.** `impact()` does a breadth-first walk over `callers` and `callees` per path
(code-map.mjs:604-636 at 2dbc817). `formatImpact()` prints the two lists, a blast-radius line
for several paths, and the untraced-test count, which counts test-root modules that import no
mapped module (code-map.mjs:643-675; rows R-861 and R-862 at REQUIREMENTS.md:1414-1415 at
2dbc817). A path the map does not cover prints `[NOT A MAPPED MODULE]` (code-map.mjs:655 at
2dbc817). `templates/` is ignored by nana-pi's map (code-map.config.json:33 at 2dbc817), so the
generator itself is never a mapped module here.

**The map check is deterministic and byte-exact.** `checkRepo()` re-renders the map and fails on
any difference from `docs/code-map.md` (code-map.mjs:789-828, the compare at :815 at 2dbc817).
The renderer promises "no timestamps and nothing machine-dependent" (code-map.mjs:682-686 at
2dbc817). Any measured timing written into the map would break that promise and make the check
flaky.

**Who reads the walk.** `npm run req:rows` lists candidate rows from the static test callers
only, and says that process-only tests are not linked (scripts/requirement-rows.mjs:44-45, :61 at
2dbc817).

### What the static walk misses, measured

Ran: a node one-liner over `repoGraph()` in `<scratch>`:
- 4 of 144 `*.test.mjs` files import no mapped module (`--impact` reports 11 of 152 test-root
  modules, helpers included; Ran: `node scripts/code-map.mjs --impact …` in `<scratch>`).
- **30 of 115 non-test modules have no transitive test caller at all.** They are the entry
  points tests start as processes: every `bin/` CLI, the four Claude Code hooks, the desk
  server, the extensions run under pi, `scripts/test.mjs` and `scripts/test-locked.mjs`.

On the in-flight regroup branch, the regroup script both imports the lift and spawns it
(feat/regroup:scripts/requirements-regroup.mjs:15, :21, read with `git show`). The import edge
shows. What the static map cannot show is which tests run the lift's command-line path.

---

## 2. How the test runner works today

- It collects the `*.test.mjs` files directly under each package's `tests/`, `apps/desk/test`
  and `apps/bench/test`. It skips e2e files, study trees and fixture folders
  (scripts/test.mjs:123-147 at 2dbc817).
- It runs one file at a time, as `node --experimental-strip-types <file>`. Each file gets its own
  process group, its package folder as the working folder, and a fresh HOME, USERPROFILE and
  TMP (scripts/test.mjs:204-212, :359-366 at 2dbc817).
- The child environment copies `process.env`, minus every `NANA_*` except `NANA_TEST_*`, and
  minus `PI_CODING_AGENT_DIR` (scripts/test.mjs:279-288 at 2dbc817). So a `NANA_TEST_*` knob
  reaches the runner and its children unchanged.
- The runner times each file with `Date.now()` and prints seconds to one decimal:
  `PASS  <path>  <n> pass  <s>s` (scripts/test.mjs:367-384 at 2dbc817).
- Before and after the run, it hashes every tracked file to catch a test that edits the repo
  (scripts/test.mjs:293-325, :404-412 at 2dbc817). Ran: in `<scratch>` (1,963 tracked files),
  `node scripts/test.mjs packages/nana-pack/tests/code-map.test.mjs` takes 0.71-0.73 s of wall
  time for a 0.5 s file. That is about 0.2 s of runner overhead per run.
- The suite lock: `scripts/test-locked.mjs` takes the machine-wide lock only when it gets no
  filter arguments (scripts/test-locked.mjs:20, :167 at 2dbc817). It runs
  `node $npm_execpath test`, or the command in `NANA_SUITE_TEST_COMMAND`
  (scripts/test-locked.mjs:103-115 at 2dbc817). So it needs `npm run`, or that variable, to
  start.

**Recorded timings.** From docs/reviews/verdict-position-2026-10-11/test-locked-output.txt at
2dbc817 (133 files, 661 s):
- review-ledger takes 117 s, templates-update 103 s and immutable-review 70 s. These three are
  44% of the suite.
- 72 files take under 1 s, 46 take 1-5 s, and 14 take 20 s or more.

---

## 3. Probes of NODE_V8_COVERAGE

The probe script and its raw JSON output are in this folder (`probe.mjs`, `probe-1.json`,
`probe-2.json`, `probe-3.json`). It runs a test file the way the runner does, once plain and once
with `NODE_V8_COVERAGE`. Then it maps every coverage URL back to a repo path. Node v22.22.2 on
darwin.

Ran: `node probe.mjs <scratch>/src <runs> <test files…>`

| Test file | Plain run (ms) | Coverage run (ms) | Overhead | Processes captured | Coverage size |
|---|---|---|---|---|---|
| nana-pack code-map | 530-553 | 565-589 | +5% | 5 | 0.8 MB |
| nana-pack agent-dir-hostile | 8593-8814 | 8515-8683 | -2% | 2 | 0.4 MB |
| nana-pack requirements-lift | 49375-52020 | 50808-54067 | +4% | 259 | 64.9 MB |
| nana-pack test-runner | 16095-16139 | 16290-16294 | +1% | 37 | 6.0 MB |
| desk app-listener | 6658 | 6542 | -2% | 8 | 3.0 MB |
| nana-pack worker-lane | 9792 | 10151 | +4% | 60 | 10.4 MB |
| nana-setup verifier-pipe | 1731 | 1734 | 0% | 20 | 2.5 MB |
| nana-pack test-locked | 4483 | 4588 | +2% | 27 | 4.5 MB |

Every file passed in both modes, with the same check counts.

**Overhead is within run-to-run noise: -2% to +5%.** So durations taken in the coverage run are
fit for balancing work. They are advisory, never a gate.

**Child processes are captured.**
- requirements-lift spawns the lift 257 times, and all 257 show up.
- The test for worker-lane shows `pi-worker.mjs`, `pi-watchdog.mjs` and `nana-roster.mjs`.
- The test for verifier-pipe shows the hook `verifier-pipe.mjs` and `nana-setup.mjs`.
- The test for test-locked shows `scripts/test-locked.mjs`.
- The test for app-listener shows `apps/desk/server.mjs` and `apps/desk/apps.mjs`.

**These 8 files alone give a measured test caller to 8 of the 30 modules that have no static
test caller:** server, apps, pi-worker, pi-watchdog, the verifier-pipe hook, nana-setup, the
knowledge CLI and test-locked. The probe also shows the template generator running under the
code-map test. The static map cannot show that, because `templates/` is ignored.

**Node forwards NODE_V8_COVERAGE even when a test passes its own `env`.** In a tiny scratch
program (`forms/a.mjs`), a child spawned with `env: { PATH }` still wrote coverage. Ran:
`NODE_V8_COVERAGE=<dir> node a.mjs` in `<scratch>/forms`. Tests that build their own child env do
not hide their children.

**URL forms.** Ran: the same scratch program, plus the runner and the code map run under
coverage.
- An ES module, a `require`d `.cjs` file and a stripped `.ts` file all appear as `file:///…`
  URLs. Path mapping with `fileURLToPath` works for all three.
- A cache-busting import keeps its suffix in the URL: `c.mjs?v=1` and `c.mjs#frag`. The reader
  must drop the query and the fragment.
- `node -e` appears as `[eval]` (not a file URL). Something in a code-map run also produced
  `file:///<cwd>/[eval1]`, a file URL that names no file. The reader must check that the file
  exists.
- `node:` built-ins appear as about 200 entries per process. They are most of each file's bytes.
- A worker thread writes its own coverage file.
- A child that calls `process.exit(3)` writes coverage.
- **A child ended by SIGTERM or SIGKILL writes nothing.** So a server that a test stops with a
  signal leaves no record. In app-listener the desk server was captured, so that test stops it
  in a way that lets it write.
- Node creates the coverage folder, nested folders included, if it is missing. Ran:
  `NODE_V8_COVERAGE=<dir>/a/b node -e 1`.

**The runner's own process.** Ran: `NODE_V8_COVERAGE=<dir> node scripts/test.mjs <one file>` in
`<scratch>`. The runner writes its own coverage file, which names `scripts/test.mjs`. If the
coverage variable is set on the runner, that file would credit the runner to every test.
Setting the variable per test file, inside the runner, avoids this.

**Copies run outside the repo are lost.**
- The test for the runner copies `scripts/test.mjs` into a temporary root and runs the copy
  (packages/nana-pack/tests/test-runner.test.mjs:47-56 at 2dbc817). All 36 of its children's
  files map outside the repo.
- The code-map test likewise runs copies of the generator from a temporary `.map/` folder.

**Symlinked roots.** Ran: the code map run from a path that goes through a link (`/tmp` links to
`/private/tmp` on macOS). The coverage URLs name the resolved path. The reader must compare
against the root as resolved through links.

**Windows forms (not run on Windows):**
- Windows CI stack traces name modules as `file:///D:/a/nana-pi/nana-pi/...`: upper-case drive,
  forward slashes (docs/reviews/windows-ci-2026-10-11/ci-run-1-windows.log at 2dbc817).
- The same log shows temporary paths with 8.3 short user-folder names under `AppData\Local\Temp`.
- Ran on darwin: `fileURLToPath("file:///c%3A/Users/a%20b/x.mjs", {windows:true})` gives
  `c:\Users\a b\x.mjs`.
- Ran: `path.win32.relative("C:\\Repo\\nana-pi", "c:\\repo\\nana-pi\\scripts\\x.mjs")` gives
  `scripts\x.mjs`. It ignores case, and a path on another drive comes back absolute (so it
  counts as outside).
- INFERRED: the coverage URL on Windows is the same URL as in the stack traces, because it is
  one V8 script name on macOS too.
- INFERRED: an 8.3 short name in the repo root itself would not match the long form the loader
  uses. Trying the root as given, as resolved, and as resolved natively covers it.

**Size.** The 8 files wrote 91 MB over 418 processes, about 220 KB each.
- INFERRED: a full run writes some hundreds of MB to over 1 GB, depending on the total process
  count, which was not measured.
- Reducing each file's folder as soon as that file finishes keeps the peak near the largest
  single file (65 MB in the sample).

---

## 4. The templates

- **TypeScript template:** the suite is vitest (`"test": "vitest --run"`,
  templates/typescript/template/package.json.jinja:14 at 2dbc817). There is no per-file runner,
  so per-file coverage needs either a vitest run per file or attribution by process.
  INFERRED: vitest's process pool reuses or isolates processes depending on its settings, so a
  template lane needs its own probe.
- **Python template:** pytest with pytest-cov already in the dev group, and every test run
  already measures `src` (templates/python/template/pyproject.toml.jinja:12, :59 at 2dbc817).
  INFERRED: coverage.py's per-test contexts (`--cov-context=test`) give per-test attribution
  without a per-file runner. That would also cover the Python map's blind spot for
  `sys.path`-style imports (REQUIREMENTS.md:1759 at 2dbc817).
- Both generators print the same impact and untraced lines (code_map.py:604-661 at 2dbc817 is
  the same walk as the TS one).

**Conclusion:** the measuring step depends on each runner, so the template does not get it
first. The data format and the impact reader are language-neutral, so a later lane can move
them into both generators. That lane would add paired TS and Python rows, as R-861 and R-862
pair today.

---

## 5. Options

### A. Where the data lives

| Option | For | Against |
|---|---|---|
| A1: committed `docs/runtime-map.json` | Every clone and reviewer sees it; it matches "stored with the commit it was measured at" | The timings change on every measurement, so two lanes in flight that both refresh conflict on every merge. Each refresh is a commit to main and so needs a reviewed round (the land rule), for numbers no reviewer can check. macOS and Windows timings would overwrite each other. With CRLF checkouts, a byte hash marks every file stale on Windows unless line endings are folded. |
| A2: local, at `<git common dir>/nana/runtime-map.json` | Every worktree of the repo on one machine shares it (builders run in worktrees of the same repo). It is never committed, so it needs no review and causes no conflict. Timings stay per machine. | A fresh clone or another machine has none until it measures (about 12-16 min, INFERRED from 661 s on 2026-10-11 plus the slower lift test today). CI never sees it. INFERRED: git leaves unknown files in its folder alone. |
| A3: CI artifact | No local cost | Needs the network and a fetch step; CI reports only after a land; Windows and macOS legs differ |

The record still names the commit it was measured at, in both A1 and A2. Staleness comes from
content hashes, not from git history, so a shallow clone works. (A shallow clone already breaks
one suite check, per HANDOFF.md:67 at 2dbc817.)

### B. How the measuring run gets per-file coverage

| Option | For | Against |
|---|---|---|
| B1: a runner knob, `NANA_TEST_COVERAGE_DIR` | About 6 lines in scripts/test.mjs. It sets `NODE_V8_COVERAGE` per file to that file's own folder and writes a small record of path, label and seconds. The run goes through `test-locked`, so it takes the lock with no filter and runs exactly like a real suite run. `NANA_TEST_*` already passes the scrub. | It touches the land-gate runner, although it does nothing unless the knob is set. |
| B2: a separate measuring runner | No runner change | It copies the runner's discovery, env scrub and cwd rules, and the copies drift. The seat's mutation runner already carries one such copy (docs/reviews/regroup-shares-2026-10-15/seat-mutate.mjs:7-10 at 2dbc817). |
| B3: one runner call per file, with the variable on the runner | No runner change | Needs a file list the runner does not export. Each filtered call skips the lock. The runner's own coverage must be told apart by its process id. It adds 0.2 s per file. |
| B4: one suite run, with files told apart by coverage timestamps | No runner change | Fragile: the runner prints seconds, not start and end times. |

A CLI flag cannot replace the knob. `test-locked` treats every argument as a filter, and a
filtered run skips the lock (scripts/test-locked.mjs:20, :167 at 2dbc817).

### C. How fine the data is

- C1: per test file, the set of repo files it ran (top level evaluated). Small: about 2,000
  pairs, roughly 100 KB (INFERRED).
- C2: C1 plus a "loaded only" mark. Subtracted: a script whose work is all at top level shows
  0 functions called (`verifier-pipe.mjs called=0/0` in probe-3), so the mark would mislabel
  command-line scripts.
- C3: line ranges each test ran, from V8's block counts. This is what the mutation runner needs
  to pick tests per mutated line. It belongs in a later lane.

### D. How the map check treats the data

- D1: the check never reads it. The data is machine-local and its timings vary, while the
  check is a deterministic land gate.
- D2: the check validates only the form of a committed file. This applies only with A1.
- D3: timing thresholds in the check. Rejected: this is exactly "fail a land on timing noise".

Recommended: D1, pinned by a test showing the check gives the same result whatever the data
holds.

---

## 6. Recommended first lane: `runtime-map` (nana-pi only; A2 + B1 + C1 + D1)

**What it does:**
- `npm run map:measure` runs the whole suite once, under the suite lock, with per-file V8
  coverage.
- It writes, per test file: the runner's label and seconds, the repo files its processes ran
  (children included), and a count of files it ran outside the repo.
- It also writes the commit, whether the working tree was clean, the platform, the Node
  version, and a content hash of every file it names, with line endings folded.
- `npm run map:impact -- <file>` keeps its static output byte for byte. Under it, it adds the
  measured test files that ran each named file, longest first, with seconds. A line is marked
  stale when that test file or the named file changed since the measurement. One summary line
  follows.
- It also answers for paths outside the map, such as the template generator.

**Lane class:** a medium lane. It touches the suite runner with a change that does nothing
unless the knob is set. That is arguably gate-adjacent, so the seat decides one or two
plan-review rounds. It needs the larger-lane builder on the roster.

**Queue:** after the regroup lands. Both lanes touch REQUIREMENTS.md, the code map, HANDOFF.md
and the session notes, and regroup is building now (main...feat/regroup diff stat, read only).
It goes before the parallel test runner (HANDOFF.md:85 at 2dbc817), which consumes the seconds.

### 6.1 Requirement rows

In FEAT-029 (REQUIREMENTS.md:1355 at 2dbc817). Each row has one "shall", in EARS form, with new
IDs.

| ID | Requirement |
|---|---|
| R-1220 | WHEN `NANA_TEST_COVERAGE_DIR` is set, the test runner shall run each collected test file with `NODE_V8_COVERAGE` set to a folder of its own under that directory, named from the file's repository path. |
| R-1221 | WHEN `NANA_TEST_COVERAGE_DIR` is set, the test runner shall write into each test file's folder, after the file ends, a record of its repository path, its PASS, FAIL or SKIP label and its seconds. |
| R-1222 | The test runner shall remove `NANA_TEST_COVERAGE_DIR` from every test file's environment. |
| R-1223 | WHEN the measure command reads a coverage entry, it shall map a file URL to a repository path after dropping the URL's query and fragment, using the platform's path rules, against the repository root as given and as resolved through links. |
| R-1224 | WHERE a coverage entry is not a file URL, or its path names no existing file, the measure command shall leave the entry out of the record. |
| R-1225 | WHERE a coverage entry names an existing file outside the repository root, the measure command shall add it to the test file's outside count and not to its executed files. |
| R-1226 | WHEN a measuring run ends with the runner's totals line, the measure command shall write the runtime data: the commit, whether the working tree was clean, the platform, the Node version, a line-ending-blind content hash of each test file and each executed file, and per test file its label, seconds, executed files and outside count. |
| R-1227 | IF a measuring run ends without the runner's totals line, THEN the measure command shall leave any earlier runtime data unchanged and exit non-zero. |
| R-1228 | The measure command shall start the suite through the suite lock with no filter. |
| R-1229 | WHEN `map:impact` names a file and runtime data exists, the impact command shall list each measured test file that executed that file, with its measured seconds, longest first. |
| R-1230 | WHEN the named file's or a listed test file's current content hash differs from the recorded hash, the impact command shall mark that test file's line stale. |
| R-1231 | WHEN runtime data exists, the impact command shall print one line naming the measured commit, the count of recorded files whose content changed since, and the count of current test files the data does not cover. |
| R-1232 | IF the runtime data is missing, unreadable or of another schema version, THEN the impact command shall print one line saying so and keep its static output and exit code unchanged. |
| R-1233 | The map check shall give the same output and exit code whatever the runtime data holds. |

### 6.2 Tests

Exact titles, each under its `// req:` marker.

`packages/nana-pack/tests/test-runner.test.mjs` already builds fixture roots with a copied
runner (:47-56 at 2dbc817), so it gets these:

```
// req: R-1220
"R-1220: with NANA_TEST_COVERAGE_DIR set, each test file's folder holds coverage for its own process and its spawned child, and no folder holds the runner's own"
// req: R-1221
"R-1221: each test file's folder holds a record of its path, label and seconds, a FAIL and a SKIP file included"
// req: R-1222
"R-1222: a test file's environment carries no NANA_TEST_COVERAGE_DIR"
```

A new file, `packages/nana-pack/tests/runtime-map.test.mjs`. Its pure parts use fixture coverage
JSON and inject `path.win32`. The fixture measuring run uses a copied runner and an injected
start command.

```
// req: R-1223
"R-1223: a coverage URL with a query or a fragment maps to its repository file"
// req: R-1223
"R-1223: a Windows coverage URL maps to its repository file when the drive letter's case differs from the root's"
// req: R-1223
"R-1223: a coverage URL under the root's link target maps to its repository file"
// req: R-1224
"R-1224: node entries, eval entries and a file URL naming no existing file are left out"
// req: R-1225
"R-1225: an existing file outside the root counts as outside and is not an executed file"
// req: R-1226
"R-1226: a fixture measurement records the commit, the clean flag, the platform, the Node version, every hash, and each test file's label, seconds, executed files and outside count"
// req: R-1226
"R-1226: a CRLF copy of a file hashes the same as its LF form"
// req: R-1227
"R-1227: a run with no totals line leaves earlier runtime data unchanged and exits non-zero"
// req: R-1228
"R-1228: the measure command starts the suite lock command with no filter argument"
// req: R-1229
"R-1229: impact lists the measured test files that executed a file, longest first, with seconds, a test the import graph does not link included"
// req: R-1230
"R-1230: impact marks a test line stale when the named file or that test file changed, and no other line"
// req: R-1231
"R-1231: impact prints the measured commit, the changed-file count and the unmeasured test count"
// req: R-1232
"R-1232: with no data, unreadable data or another schema version, impact prints one note, its static output byte-identical, and exits 0"
// req: R-1233
"R-1233: map check's output and exit code are the same with no runtime data and with unreadable runtime data"
// req: R-1232
"seal: RUNTIME_SCHEMA is 1 (R-1232)"
```

A Windows note: R-1223's link test creates a symlink. On win32 it declares a SKIP when the link
cannot be made, which is how the suite's other link tests behave.

### 6.3 Modules

Each module opens with the six-tag header.

| Module | Purpose (one sentence) | Effects |
|---|---|---|
| `scripts/runtime-map-config.mjs` (new) | Declare the runtime layer's tunables with their provenance. | none |
| `scripts/runtime-map.mjs` (new) | Read the runtime data and say which measured test files executed given files, marking changed entries stale. | disk (reads the data and the named files) |
| `scripts/runtime-measure.mjs` (new) | Run the suite once under per-file V8 coverage and write which repository files each test file executed and how long it took. | process (starts the locked suite), disk (coverage folders under the OS temp folder, the data file) |
| `scripts/code-map.mjs` (shim, edited) | Its purpose gains "and add the measured test files to `--impact`". | adds disk |
| `scripts/test.mjs` (edited) | The knob: about 6 lines. | unchanged |

**Named exports.**
- `runtime-map.mjs`: `dataPath(root)`, `loadRuntime(file)`, `contentHash(text)`,
  `testsFor(data, paths, hashOf)`, `formatRuntime(data, paths, hashOf, currentTests)`.
- `runtime-measure.mjs`: `repoFileOf(url, roots, {pathApi, exists})`,
  `reduceProcesses(entries, roots, io)`, `measure({root, start, io})`.
- The measure command imports `contentHash` and `dataPath` from `runtime-map.mjs`, so nothing is
  copied.
- All modules sit in the scripts layer, so no layer change is needed.

**Config values.**

| Name | Value | Provenance |
|---|---|---|
| `RUNTIME_SCHEMA` | `1` | contract (R-1232) |
| `COVERAGE_ENV` | `"NANA_TEST_COVERAGE_DIR"` | contract (R-1220) |
| `RECORD_FILE` | `"runner-record.json"` | chosen: a name no coverage file can take, since Node names its files `coverage-*.json` |
| `DATA_SUBPATH` | `"nana/runtime-map.json"` under the git common dir | chosen: every worktree of the repo shares it and git never tracks it (option A2) |
| `SECONDS_DIGITS` | `1` | chosen: the runner's own printed precision (scripts/test.mjs:369 at 2dbc817) |

Other parts:
- The runner imports `COVERAGE_ENV` and `RECORD_FILE` by name.
- package.json gets `"map:measure": "node scripts/runtime-measure.mjs"`.
- The README's map paragraph (README.md:57-59 at 2dbc817) gets one sentence. The README check
  holds every named command.
- docs/code-map.md is regenerated, and the HANDOFF and session notes are added in the reviewed
  change.

**Starting the lock.** The measure command is run as `npm run map:measure`. It starts
`scripts/test-locked.mjs` with the knob set and `npm_execpath` inherited, so on Windows npm runs
through its JS entry, not `npm.cmd`. Run directly with node, it refuses and names
`npm run map:measure`. The measure command never sets `NODE_V8_COVERAGE` itself, so npm, the
lock command and the runner write no coverage.

**Bounded disk.** The measure command reads the runner's output as it streams. Each time a
PASS, FAIL or SKIP line appears, it reduces every folder that holds a record, then deletes it.
It removes the coverage root on every exit path.

### 6.4 Threat model

**In scope: honest variation in our tools' output.**
- Timing noise: machine load, other suites, the 1-5% coverage overhead. Seconds are advisory and
  gate nothing, and the lock keeps other suite runs out during measuring.
- Flaky verdicts: the label is recorded.
- Children ended by a signal leave no coverage, and copies run from a temporary root are not
  credited. Both are residuals: the copies show as an outside count, and the signal loss is a
  named residual.
- Junk entries: `node:` built-ins, eval entries, file URLs that name no file, and query or
  fragment suffixes.
- Path forms: roots reached through a link, Windows drive-letter case, short folder names and
  CRLF checkouts.
- Stale data after edits, test files added since the measurement, and data that is missing,
  unreadable or of an old schema.
- A nested runner inside the runner's own tests (R-1222), and a measuring run interrupted part
  way (R-1227).

**Out of scope (forgery).**
- A hand-edited data file.
- Code that detects `NODE_V8_COVERAGE` and behaves differently.
- A test that hides its children on purpose with an empty-environment launcher.
  INFERRED: no such launcher in the suite. Node forwards the variable even with an explicit
  `env`, and that was Ran.

**Selection safety.** The measured list is never the land gate; the full suite on the reviewed
tip stays the gate. A later "affected tests" command must join the static test callers, the
measured tests, and every unmeasured or stale test.

### 6.5 Subtraction test, per part

| Part | Does it earn its place? |
|---|---|
| Runner knob (B1) | Yes. Without it, the measure command copies discovery and env rules (B2), and the copies drift, as the seat's copied mutation runner shows. |
| Record file per folder | Yes. It is a machine interface. Parsing the padded human line would couple to the runner's display. |
| Reduce per file while the run streams | Yes, cheaply: a few lines. It keeps the temporary disk use near the largest file's coverage, 65 MB in the sample, instead of the sum, which is INFERRED at hundreds of MB to over 1 GB. |
| Content hashes | Yes. Staleness without git history works on a shallow clone and from any worktree. |
| Commit and clean flag | Yes, cheaply. The request asked for the commit, and it tells a reader how old the data is. |
| Outside count | Yes. It makes the copy gap visible, the way the untraced count does for imports. |
| "Loaded only" mark (C2) | Subtracted: it mislabels top-level scripts. |
| Line ranges (C3) | Deferred to the mutation lane. |
| Map-check integration (D2, D3) | Subtracted. |
| Timings in docs/code-map.md | Subtracted: they break the check's byte-exact determinism. |
| A `--json` flag or an affected-tests command | Deferred. Lane 1's consumers can import `testsFor`, and the affected-tests command is lane 2. |
| Template changes | Deferred. The measuring step depends on each runner (section 4). |

### 6.6 Wrong code first

Each row lists the wrong code a builder might write and the test that turns red.

| Row | Plausible wrong code | Red test |
|---|---|---|
| R-1220 | Sets `NODE_V8_COVERAGE` once on the runner's own environment | R-1220 title: the runner's own coverage appears in a folder |
| R-1220 | Names a folder by list position instead of by path | R-1220 title: the folder for a file is not found under its path name |
| R-1221 | Writes no record for a SKIP or FAIL file | R-1221 title |
| R-1222 | Keeps the knob in the child environment (as other `NANA_TEST_*` knobs are kept) | R-1222 title |
| R-1223 | Leaves `?v=1` on the path, or uses `path.posix` on win32, or compares case-sensitively | the three R-1223 titles |
| R-1224 | Keeps `[eval1]` because it is a `file:` URL | R-1224 title |
| R-1225 | Drops outside files silently, or credits them to the repo | R-1225 title |
| R-1226 | Hashes raw bytes, so a CRLF copy reads as changed | R-1226 CRLF title |
| R-1226 | Leaves out the clean flag or the Node version | R-1226 record title |
| R-1227 | Writes partial data after an interrupted run | R-1227 title |
| R-1228 | Passes a filter, or calls `scripts/test.mjs` directly, so no lock is taken | R-1228 title |
| R-1229 | Sorts by name, drops seconds, or reads only static callers | R-1229 title |
| R-1230 | Checks only the named file, or marks every line stale | R-1230 title |
| R-1231 | Leaves out the count of test files the data does not cover | R-1231 title |
| R-1232 | Throws on a broken file, or changes the static lines or the exit code | R-1232 title |
| R-1233 | The check reads the data file (for example, to warn when it is stale) | R-1233 title |
| R-1232 | `RUNTIME_SCHEMA` written inline | the seal test |

### 6.7 Cross-platform

- Paths: `path.win32` and `path.posix` rules are injected into the pure mapper and tested on
  darwin.
- Records and folders use `path.join`, and the folder name is made from the repo path with
  separators replaced.
- `npm_execpath` gives a node-run npm on Windows.
- Coverage folders sit under `os.tmpdir()`, which is an 8.3 short path on Windows CI. It is
  never compared against the repo root.
- The Windows CI leg is non-blocking. Before relying on Windows data, a real Windows
  measurement should be read, because the coverage URL form there is INFERRED.

---

## 7. Later lanes

1. **Affected tests.** One command (for example `npm test -- --affected <file...>`) runs the
   union of the static test callers, the measured tests, and every unmeasured or stale test file.
   The builder brief line points at it. It lowers the builder's loop cost; the land gate stays
   the full suite.
2. **Time-balanced parallel runner** (already queued, HANDOFF.md:85 at 2dbc817). It schedules
   longest first from the measured seconds and falls back to file order with no data. On the
   2026-10-11 timings, the scheduling arithmetic alone gives these slowest-worker times (Ran:
   node over test-locked-output.txt; contention is ignored, so real runs are INFERRED to be
   slower):

   | Workers | Longest first | Round-robin | Contiguous chunks |
   |---|---|---|---|
   | 2 | 331 s | 386 s | 497 s |
   | 4 | 165 s | 236 s | 458 s |

   With 4 workers, longest first reaches its lower bound of 661/4 = 165 s. With 6 workers the
   floor is the 117 s review-ledger file.
3. **Line-level runtime and a shared mutation runner.** Executed line ranges per test file and
   repo file come from V8's block counts. The seat's mutation runner then picks each pair's
   tests by the mutated line and splits pairs across workers by time. Today each lane copies its
   runner and declares its test sets by hand
   (docs/reviews/regroup-shares-2026-10-15/seat-mutate.mjs:5, :16-21 at 2dbc817), and the 36
   pairs ran serially at about 50 s each against the lift test.
4. **Template lift.** The data format and the impact reader move into both generators, with
   paired TS and Python rows. The Python side measures through coverage.py per-test contexts
   (INFERRED, to be probed). The TS side measures through per-file vitest runs or process
   attribution (to be probed).
5. **Copies and signals, only if measured counts warrant it.**
   - Credit copies run outside the repo by matching function-range layouts against repo
     modules. The runner test and the code-map test run copies.
   - A preload that calls `v8.takeCoverage()` for children stopped by a signal. It changes the
     code under test (an added module and timer), so it needs its own risk read.
6. **`req:rows` third tier.** Add rows marked by measured test files to the direct and
   transitive tiers (scripts/requirement-rows.mjs:44-49 at 2dbc817).
7. **The seat's parallel default (the sibling plan).** The same data answers two questions.
   First, how to split one suite across workers (item 2). Second, whether two lanes' changed
   files are run by overlapping test sets, which is a signal that they should not run together.

---

## 8. Open owner calls

1. **Storage.** Recommended: local and per machine, in the git common dir (A2), which avoids
   merge conflicts and a review round per refresh. The other choice is a committed data file
   (A1).
2. **nana-pi first, template later.** Is the runtime layer a core nana feature for every
   project (template lane 4), or a nana-pi seat tool? This changes the queue weight, not lane 1.
3. **Refresh cadence.** Each measurement costs about 12-16 min of machine time (INFERRED). The
   choices:
   - on demand, with the stale counts telling the seat when to refresh;
   - after each land on main;
   - nightly (launchd is macOS only).

   Recommended: on demand, and always before a mutation run.
4. **Queue position.** The request is from 2026-10-16. It was not in the 2026-10-11 queue.
   Recommended: right after the regroup lands, ahead of the parallel test runner it feeds.
   Two lanes are in flight now (regroup and roster notice), so it waits for a slot.
5. **Builder practice (lane 1 of the later list).** Should briefs tell builders to run the
   affected tests in their loop? The full suite stays the land gate either way.

---

## 9. Residuals lane 1 would carry

- Children ended by a signal leave no record (Ran). Tests that stop servers that way
  under-report.
- Copies run from temporary roots are not credited (Ran: the runner's own test and the
  code-map test). They show only as an outside count. So `scripts/test.mjs` itself gets no
  measured test caller.
- A test file that times out leaves its children unrecorded, because the runner kills the tree.
- The data describes one run on one machine. Platform-only branches (for example the
  Windows-only hook test, which SKIPs on darwin) are absent from a darwin measurement.
- Seconds are taken under coverage, 1-5% above plain in the sample (Ran, 8 files).
- The Windows URL form is INFERRED from stack traces, not from a Windows coverage run.

**The claim I would most expect to be wrong:** the full-run temporary disk estimate, and with
it whether reducing per file during the run is needed. The suite's total process count was not
measured. The lift test alone spawns 259 processes and writes 65 MB.
