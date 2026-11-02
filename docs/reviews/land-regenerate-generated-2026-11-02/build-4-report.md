# Build 4 — merge origin/main

VERDICT: DONE

## Scope and starting state

- Branch: `feat/land-regenerate-generated`.
- Actual starting tip: `067be3d3b56f0ecbdab9e7f5f70c83fc3fcb9471` (the brief commit following `a60abaa8`). Clean worktree at startup.
- Merge parent: `origin/main` at `69727fbf6c87b407b208b5c52c721364bf2e3ae0`. No fetch, credentials, GitHub API, push or CI read.
- `git merge --no-commit --no-ff origin/main`: exit 1, the six expected conflicted paths.
- Requirement resolution precedes the test run and code integration. No new rows or tests.

## Conflict inventory and resolutions

Line ranges identify the original conflict-marker presentation, before resolution.

1. `REQUIREMENTS.md:1187–1193`: main's R-3690 verbatim (including M10/M11 evidence); lane's amended R-3691. The generated-conflict exception overrides only the two named outputs; all other refusals remain.
2. `REQUIREMENTS.md:1198–1211`: lane's amended R-3696 and R-3706–R-3712; main's R-3697 verbatim, including generated-path policy and M11 evidence. No IDs allocated.
3. `docs/code-map.md:13–17`: main's coverage summary, then generator output; no hand merge.
4. `docs/code-map.md:4431–4435`: main's profile-fixture caller list, then generator output; no hand merge.
5. `docs/requirements-tree.md:96–100`: main's CAP-02 summary, then generator output; no hand merge.
6. `packages/nana-pack/README.md:701–709`: combined. Main's contained-tip refusal, rename-aware attribute checks and clean separate-hunk generated-path refusal stay. Lane's generated-only conflict exception and full private-index regeneration contract stay. Removed main's now-false blanket statement that the helper never regenerates, but also accidentally dropped two unrelated sections that had merged without conflict.
   Build 5 restored `## Memory curation` and `#### Builder and reviewer credentials` verbatim from `origin/main` in their original positions because build 4 had deleted existing usage, privacy and credential guidance.
7. `packages/nana-pack/bin/nana-land.mjs:23–28`: both imports. Main's `CLEAN_MERGE_GENERATED_PATHS` plus lane's generator contract, timeout and reasons.
8. `packages/nana-pack/rules/nana-rulings.md:32–38`: main's builder-no-push ruling verbatim; main's independent-review ruling plus the lane's one generated-conflict clause.

## Automatic merge integration

The text merge retained main's rename-aware `cleanMergeTree` attribute scan and contained-tip guard. It also retained the lane's private `regenerateTree`, configuration guard, generator injection and success line. Moved the overlapping-generated-path refusal after conflict handling: generated-only conflicts regenerate, while main's clean separate-hunk M11 still refuses unchanged. Non-contract conflicts, changed attributes, merge drivers, proof changes, malformed git output and all CI/review/lock checks keep main's behaviour.

Main's clean-merge tests are unchanged except the pre-existing lane extension to M9, which supplies M7/R-3712. Main's shared fixture changes merge automatically; this build made no fixture or test edits.

## Precedent and known bugs

Read both clean-merge contracts and the regeneration tests before design. Keep both existing helpers in their module, without copying or moving a private helper. No departure from this build's precedent.

Read the whole `docs/known-bugs/FEAT-008.md`. This integration touches the clean-merge A7 CI-snapshot gap, A8 lock-sharing race, A9 post-land exposure and M8 semantic-breakage policy; none is fixed or widened. The existing regeneration crash-temp-directory and outside-tree-write residuals remain documented in the README and plan Revision 2. No known-bug file is edited.

## Evidence

Logs below are committed here because the brief permits no separate output files. Captured PASS stdout retains its trailing spaces. The scoped staged whitespace check exits 2 only for those verbatim log lines; no source or generated-file whitespace finding remains. The unstaged whitespace check exits 0.


### Wrong-code baseline: unconditional main generated-path refusal

Command: `node packages/nana-pack/tests/land-regenerate.test.mjs`; exit 1.

```text
FAIL M1: generated-only conflicts land actual generator bytes and preserve the merged sources AssertionError [ERR_ASSERTION]: refused: unsupported merge semantics: generated path docs/code-map.md changed on both sides; merge main into the lane, then review and CI that tip
[nana-land] land record: refused, stage preflight, 0 min total, - suite, - CI wait; no lane


1 !== 0

    at file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-regenerate.test.mjs:38:42
    at async check (file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/profile-fixture.mjs:62:8)
    at async file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-regenerate.test.mjs:35:1
FAIL M2: non-contract and rename conflicts refuse while contract modify-delete regenerates AssertionError [ERR_ASSERTION]: The input did not match the regular expression /merge conflict.*base.txt/. Input:

'refused: unsupported merge semantics: generated path docs/code-map.md changed on both sides; merge main into the lane, then review and CI that tip\n' +
  '[nana-land] land record: refused, stage preflight, 0 min total, - suite, - CI wait; no lane\n'

    at refuse (file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-regenerate.test.mjs:22:44)
    at file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-regenerate.test.mjs:55:3
    at async check (file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/profile-fixture.mjs:62:8)
    at async file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-regenerate.test.mjs:51:1
FAIL M3: failed timed-out and post-write checks refuse and remove only owned temporary state AssertionError [ERR_ASSERTION]: The input did not match the regular expression /generatorFailed/. Input:

'refused: unsupported merge semantics: generated path docs/code-map.md changed on both sides; merge main into the lane, then review and CI that tip\n' +
  '[nana-land] land record: refused, stage preflight, 0 min total, - suite, - CI wait; no lane\n'

    at refuse (file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-regenerate.test.mjs:22:44)
    at file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-regenerate.test.mjs:77:3
    at async check (file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/profile-fixture.mjs:62:8)
    at async file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-regenerate.test.mjs:71:1
FAIL M4: scope guard catches tracked index-only untracked ignored and configured escapes AssertionError [ERR_ASSERTION]: The input did not match the regular expression /generatorScope/. Input:

'refused: unsupported merge semantics: generated path docs/code-map.md changed on both sides; merge main into the lane, then review and CI that tip\n' +
  '[nana-land] land record: refused, stage preflight, 0 min total, - suite, - CI wait; no lane\n'

    at refuse (file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-regenerate.test.mjs:22:44)
    at file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-regenerate.test.mjs:99:13
    at async check (file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/profile-fixture.mjs:62:8)
    at async file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-regenerate.test.mjs:83:1
FAIL M5: sealed Node argv ignores npm scripts and replaces decoys across line transports AssertionError [ERR_ASSERTION]: refused: unsupported merge semantics: generated path docs/code-map.md changed on both sides; merge main into the lane, then review and CI that tip
[nana-land] land record: refused, stage preflight, 0 min total, - suite, - CI wait; no lane


1 !== 0

    at file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-regenerate.test.mjs:119:10
    at async check (file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/profile-fixture.mjs:62:8)
    at async file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-regenerate.test.mjs:106:1
PASS M6: generator contract argv timeout and refusal vocabulary are sealed
```

### `npm run map` — exit 0

```text

> nana-pi@0.5.0 map
> node scripts/code-map.mjs --write

docs/code-map.md: 610 modules
```

### `node scripts/requirements-tree.mjs --write` — exit 0

```text
requirements tree: 0 problems; rows 2521; features 43
deliverables: 21 of 23 made and read by code, 21 more parked
deliverable note: A-093 Artifact: writer path "packages/nana-pack/bin/nana-curate.mjs" is not a tracked file at HEAD
deliverable note: line 496: Read by: A-100 reader path "packages/nana-pack/lib/memory-curation.mjs" is not a tracked file at HEAD
deliverable note: A-100 has no declared reader
```

### `node packages/nana-pack/tests/land-clean-merge.test.mjs` — exit 0

```text
PASS M1: clean moved-main merge lands using only accepted-tip CI and review
PASS M2: clean merge content matches literals and an independent ordinary merge
PASS M3: unsupported attributes and malformed or failing merge-tree refuse unchanged
PASS M10: rename destination merge driver refuses before merge-tree unchanged
PASS M11: generated paths changed in separate hunks refuse unchanged
PASS M12: descendant main already containing the accepted tip refuses unchanged
PASS M4: conflict names paths and the merge-review-CI remedy before any CI read
PASS M5: merge eligibility requires applicable CI, suite proof and unchanged proof paths on both sides
PASS M6: uncovered lane commits including a lane-authored merge remain refused
PASS M8: accepted policy limit lands a textually clean but semantically broken merge
PASS M9: shared guidance, rendered region, README and ruling agree on the exemption
PASS seal: clean-merge vocabulary and conflict-name cap are declared once
```

### `node packages/nana-pack/tests/land-regenerate.test.mjs` — exit 0

```text
PASS M1: generated-only conflicts land actual generator bytes and preserve the merged sources
PASS M2: non-contract and rename conflicts refuse while contract modify-delete regenerates
PASS M3: failed timed-out and post-write checks refuse and remove only owned temporary state
PASS M4: scope guard catches tracked index-only untracked ignored and configured escapes
PASS M5: sealed Node argv ignores npm scripts and replaces decoys across line transports
PASS M6: generator contract argv timeout and refusal vocabulary are sealed
```

### `node packages/nana-pack/tests/rulings.test.mjs` — exit 0

```text
PASS pi seat receives the complete installed guide under its fixed heading 
PASS stale guide installation notice names the pi seat guide and nana-setup install 
PASS pi builder and reviewer omit the guide while retaining the rulings section 
PASS missing, empty, oversized and invalid-UTF-8 seat guides yield one user-facing install marker without throwing 
PASS seat guide unavailable prefix is distinct from the rulings prefix 
PASS seal: SEAT_GUIDE_READ_CAP is 8192 
PASS an installed rulings file reaches the nana-rulings section on every session_start reason 
PASS an installed rulings file reaches the nana-rulings section on every session_start reason 
PASS seal: RULINGS_READ_CAP is 8192 
PASS a missing, empty, directory, FIFO, over-cap or invalid-UTF-8 rulings file yields the one-line unavailable marker, never a throw or a hang 
PASS boundary: a file of exactly RULINGS_READ_CAP bytes injects whole and RULINGS_READ_CAP + 1 bytes gets the marker 
PASS no fixture text leaks into the unavailable marker 
PASS planner prompt names no owner or work project 
PASS the rulings file names no owner and no work project 
PASS R-2969: nana-pi project section gives planners the lane-class command and build instruction 
PASS every ruling is one bullet that opens with its date 
PASS R-2956: the rulings file carries the 2026-10-28 readings ruling 
PASS R-2663: the rulings file carries one dated ruling that a helper's second caller imports it and the plan names any move 
PASS planner prompt names no model id 
PASS the rulings file names no model, leaving the lineup to the roster 
PASS the rulings file opens with the scope sentence for builders and reviewers 
PASS R-3437: the CI ruling and project-specific coverage govern the shared land checklist 
PASS R-3525: the final ruling points each machine to its roster limit and replaces the fixed cap 
```

### `npm run -s map:check` — exit 0

```text
code map: 610 modules over scripts, apps/desk, apps/bench, apps/hive, packages/nana-pack/lib, packages/nana-pack/bin, packages/nana-pack/extensions, packages/nana-knowledge/lib, packages/nana-knowledge/bin, packages/nana-knowledge/extensions, packages/nana-stage/lib, packages/nana-stage/extensions, packages/nana-setup/lib, packages/nana-setup/bin, packages/nana-setup/claude/hooks, packages/nana-pack/tests, packages/nana-knowledge/tests, packages/nana-stage/tests, packages/nana-setup/tests, apps/desk/test, apps/bench/test; 0 without a usable contract header; 3 exempt; 0 problem(s)
```

### `node scripts/requirements-trace.mjs` — exit 0

```text
requirements: 2521 total (2264 implemented · 7 planned · 55 retired · 190 untested · 5 violated); 2264 traced by tests
ears: 0 rows off form (allowance 0)
(node:79615) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file://~/nana-pi-wt/land-regenerate-generated/templates/typescript/template/tests/requirements-trace.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to ~/nana-pi-wt/land-regenerate-generated/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
```

### `node scripts/requirements-tree.mjs --check` — exit 0

```text
requirements tree: 0 problems; rows 2521; features 43
deliverables: 21 of 23 made and read by code, 21 more parked
deliverable note: A-093 Artifact: writer path "packages/nana-pack/bin/nana-curate.mjs" is not a tracked file at HEAD
deliverable note: line 496: Read by: A-100 reader path "packages/nana-pack/lib/memory-curation.mjs" is not a tracked file at HEAD
deliverable note: A-100 has no declared reader
```

### `npm run -s readme:check` — exit 0

```text
readme: 1081 claims checked; 0 problem(s)
```

## Preservation verification

All main requirement rows remain byte-identical except the two brief-authorized amendments, R-3691 and R-3696. R-3688, R-3690 and R-3697 keep main's new text and evidence. R-3706–R-3712 match the lane parent.
Main's M10, M11 and M12 cases remain unchanged and pass. The only clean-merge test difference against main is the lane's existing M9/R-3712 extension; this build edits no test. Other merged paths, including main's setup, known-bug and archive changes, are inherited automatically and were not edited by this builder.

## Additional mutation and regression evidence

### `node packages/nana-pack/tests/land-clean-merge.test.mjs (disabled generated-path refusal)` — exit 1

```text
PASS M1: clean moved-main merge lands using only accepted-tip CI and review
PASS M2: clean merge content matches literals and an independent ordinary merge
PASS M3: unsupported attributes and malformed or failing merge-tree refuse unchanged
PASS M10: rename destination merge driver refuses before merge-tree unchanged
FAIL M11: generated paths changed in separate hunks refuse unchanged AssertionError [ERR_ASSERTION]: review text relied on: acff8d612246e101e023e7cd67db5470c3972a44d4648095520df8887a965af7.md
ci: ci run 101 attempt 1 (pull_request) success at 5f1298b6
merged main: 4d2242f5fed57d45e96277f7eaf33f51d9469501 into 5f1298b6550bc57e2c0b7afcc03eb7529327bb73 as 9aa69a05c4a1c587e442ddb577de644e6180b1e1
suite: ci run 101 attempt 1 platform darwin
push command: git push
release status: ready
[nana-land] land record: landed, stage -, 0 min total, suite ci, - CI wait; no lane


0 !== 1

    at unchanged (file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-clean-merge.test.mjs:19:9)
    at refused (file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-clean-merge.test.mjs:25:2)
    at file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-clean-merge.test.mjs:130:15
    at async check (file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/profile-fixture.mjs:62:8)
    at async file://~/nana-pi-wt/land-regenerate-generated/packages/nana-pack/tests/land-clean-merge.test.mjs:124:1
PASS M12: descendant main already containing the accepted tip refuses unchanged
PASS M4: conflict names paths and the merge-review-CI remedy before any CI read
PASS M5: merge eligibility requires applicable CI, suite proof and unchanged proof paths on both sides
PASS M6: uncovered lane commits including a lane-authored merge remain refused
PASS M8: accepted policy limit lands a textually clean but semantically broken merge
PASS M9: shared guidance, rendered region, README and ruling agree on the exemption
PASS seal: clean-merge vocabulary and conflict-name cap are declared once
```

### `node packages/nana-pack/tests/land-clean-merge.test.mjs (restored)` — exit 0

```text
PASS M1: clean moved-main merge lands using only accepted-tip CI and review
PASS M2: clean merge content matches literals and an independent ordinary merge
PASS M3: unsupported attributes and malformed or failing merge-tree refuse unchanged
PASS M10: rename destination merge driver refuses before merge-tree unchanged
PASS M11: generated paths changed in separate hunks refuse unchanged
PASS M12: descendant main already containing the accepted tip refuses unchanged
PASS M4: conflict names paths and the merge-review-CI remedy before any CI read
PASS M5: merge eligibility requires applicable CI, suite proof and unchanged proof paths on both sides
PASS M6: uncovered lane commits including a lane-authored merge remain refused
PASS M8: accepted policy limit lands a textually clean but semantically broken merge
PASS M9: shared guidance, rendered region, README and ruling agree on the exemption
PASS seal: clean-merge vocabulary and conflict-name cap are declared once
```

### `node packages/nana-pack/tests/land-clean-merge-race.test.mjs` — exit 0

```text
PASS M7: checkout and CI races refuse, cooperating lands serialize and rerun safely
```

### `node packages/nana-pack/tests/land.test.mjs` — exit 0

```text
PASS merge preflight refuses a non-main checkout
PASS tracked main changes refuse before running the suite
PASS tracked source changes refuse before running the suite
PASS suite-time main branch switch refuses before merge
PASS suite-time main tracked changes refuse before merge
PASS suite-time source tracked changes refuse before merge
PASS final review reading, rechecks and ff-only merge run inside one ledger lock
PASS a verified SEND-BACK written by the suite refuses before merge
PASS suite-time source revision change refuses before merge
PASS suite-time main divergence refuses before merge
PASS non-fast-forward source tip without CI refuses before running the suite
PASS a reviewed SHA must be ancestor of the source tip and match a LAND record
PASS a matching-item LAND round for a different revision cannot authorize a merge
PASS drifted LAND round cannot authorize a merge
PASS uncovered integration commits are refused and named
PASS main commits outside the reviewed ancestry are not reported as unreviewed
PASS a LAND round for another item does not authorize this item
PASS a LAND commit outside the source tip ancestry is refused
PASS annotated tag object IDs are not accepted as reviewed commits (R-976)
PASS snapshot review revisions are never accepted as plain reviewed commits
PASS runLand requires verified reviews
PASS an in-flight review of the reviewed tip refuses without merging
PASS an in-flight snapshot review of the reviewed tip refuses without merging
PASS an in-flight review of a different commit does not block land
PASS a verified SEND-BACK for another item at the commit refuses land
PASS a verified SEND-BACK at a working-state snapshot refuses land
PASS an explicit empty verdict beside LAND refuses land
PASS a legacy round without verdict does not block a version-2 LAND
PASS an unverified SEND-BACK beside LAND does not block land
PASS a version-1 LAND alone refuses on the first tally reading
PASS a version-1-only second tally reading refuses after the suite
```

### `node packages/nana-pack/tests/land-merge.test.mjs` — exit 0

```text
PASS R-2571: the land refuses a revision whose matching LAND records all have missing or altered kept texts
PASS R-2572: a land's success report names the kept review texts
PASS R-2576: a land notes each earlier kept review text missing from the tip
PASS successful land updates main checkout files and leaves tracked state clean
PASS untracked collision refuses land without changing main
PASS branch switch at merge invocation refuses without a success report
PASS main advancing during suite refuses before merge
PASS the land runs its suite with the source tip's full SHA in NANA_LAND_TIP
PASS a passing land shows its suite's land notes
PASS after a land the runtime data names main's tip and is not stale
PASS suite command runs in the source tree
PASS suite failure leaves main unchanged and prints no success report
PASS a suite killed by signal refuses and names a nonzero exit
PASS cleanup refuses a contained branch when checkout is not on main
PASS cleanup refuses a branch not contained by main
PASS cleanup refuses untracked dirt in a contained worktree
PASS cleanup refuses a branch checked out in multiple worktrees
PASS cleanup reports a lane branch deleted before cleanup
PASS cleanup removes a contained feat branch without force
PASS README and AGENTS describe the land helper
PASS successful merge prints post-merge release status and divergence
PASS release status failure after merge keeps success code and output
PASS successful merge without copier reports only the origin release clause
PASS unknown land options, including either exemption placement, are named before git runs
PASS successful land output keeps push and release status but has no archive stubs
PASS a separate clone is refused before reviewed-SHA resolution or ledger reading
PASS normalized checkout review lands its exact tip
```

### `node packages/nana-pack/tests/land-records.test.mjs` — exit 0

```text
PASS R-2810: a land attempt appends one start record under the main clone's git common folder before it compares the checkouts
PASS R-2811: each way a land ends appends one end record naming its start, with a null suite time when the suite never ran
PASS R-2812: a CI-passed land records the longest judged run span as its CI wait, and a run without times still lands with a null wait
PASS R-2813: an unwritable land ledger leaves the land's verdict, merge and output unchanged and names why in one last line
PASS R-2814: every ended land attempt's last line names it and its lane's land line exactly as the build report prints it
PASS R-2816: the ledger lists the land records as a CAP-02 deliverable read by code at the store's own path
PASS seal: land records live at nana/land-records.jsonl in schema 1, are read up to 32 MiB, and their line starts [nana-land] land record:

all checks passed
```

### `node packages/nana-pack/tests/test-runner.test.mjs` — exit 0

```text
PASS collects every test file directly under a package tests dir 
PASS collection does not recurse and takes only .test.mjs files 
PASS a path segment named fixtures is never collected 
PASS each file runs with --experimental-strip-types from its package dir 
PASS each file gets a fresh temp HOME and USERPROFILE, not the real one 
PASS the temp HOME is per file, not shared between files 
PASS every child disables git auto gc without replacing caller git config entries 
PASS a failing file's TMPDIR and leaked contents are removed 
PASS a file that exits non-zero is FAIL and the run exits 1 
PASS a file killed by a signal is FAIL, naming the signal 
PASS a FAIL line from an exit-0 file is a WARN and does not flip the verdict 
PASS an exit-0 file that printed only SKIP lines is FAIL without a declared precondition 
PASS a silent exit-0 file is FAIL without a declared precondition 
PASS without --verbose a passing file's output is hidden and a failing file's diagnostic lines are shown 
PASS in non-verbose mode a failing file prints its first 20 failing check lines 
PASS one line per file, then a totals line with both tallies, exiting 1 on a failure 
PASS each test gets a unique TMPDIR and the runner removes leaked temp contents 
PASS ambient NANA_ vars are scrubbed from the child env and NANA_TEST_ knobs are kept 
PASS PI_CODING_AGENT_DIR is scrubbed too and the rest of PI_ is left alone 
PASS CLAUDE_CONFIG_DIR is scrubbed from the child env 
PASS a file declared unrunnable on this platform SKIPs with its reason printed 
PASS study tasks SKIP only when their declared extension prerequisite is absent 
PASS study tasks run when their declared extension prerequisite exists 
PASS R-1986: checkout spelling skips exactly when the temporary volume has no second letter-case spelling 
PASS a substring argument runs only the files whose repo-relative path contains it 
PASS --verbose streams a passing file's own output 
PASS no match says so, exits 1, and still removes its scratch dir 
PASS NANA_TEST_TIMEOUT_MS sets the per-file timeout and a timed-out file is FAIL 
PASS the timeout kill takes the child's whole process tree with it 
PASS the scratch dir is removed after the run 
PASS a timed-out file's TMPDIR and leaked contents are removed 
PASS tracked mutation fails naming the tracked file while untracked files do not appear 
PASS tracked mutation is detected when the file was already dirty before the run 
PASS staging an already-dirty tracked file is detected without a working-tree change 
PASS after a child exits the runner waits only a bounded drain for stdio to close 
PASS termination cleans the active process tree and runner temp roots (external signals on POSIX; handler trigger on Windows) 
PASS --self-test adds the runner's own fixtures, each gets its expected verdict, and the run exits non-zero 
PASS NANA_TEST_SELFTEST=1 is the same as --self-test 
PASS R-1270: with the coverage knob unset, the runner prints no knob line, writes no record or completion file, and passes the caller's NODE_V8_COVERAGE and NODE_OPTIONS unchanged, absent or set 
PASS R-2546: with the record knob set, the runner writes one run record with every file's label, seconds and cause, each unnamed failure, the exit code, wall seconds, job count, platform and coverage 
PASS R-2753: the run record names the default per-file time limit the runner applied 
PASS R-3433: whole-run records carry the actual path filters, empty for an unfiltered run 
PASS R-2880: a record-fixture file that passes after 1 second is labelled PASS with no cause, and the file that outlives the record limit is labelled FAIL timed out, serial and parallel 
PASS seal: the record fixture's per-file limit is 5 seconds, its slow file passes after 1 second and its timing-out file ends itself after 25 seconds 
PASS the source check detects direct mkdtemp calls while ignoring only generated leak fixtures 
PASS the shared temp helper removes its registered root when the process exits 
PASS R-2666: a finished file whose temp folder stays busy gets one FAIL line naming the file, the folder and the code, counts as one failure, and every other file still runs, serial and parallel 
PASS seal: a finished file's temp folder removal retries 5 times on a 100 ms step 
PASS R-1380: win32 SKIPs each file on the declared Windows skip list with its reason and never starts it 
PASS R-1381: off win32 each file on the declared Windows skip list runs 
PASS R-1382: win32 still runs each desk and bench file off the declared Windows skip list 
PASS R-1383: the declared Windows skip list names only collected desk and bench test files 
PASS R-1521: the declared Windows skip list names no bench test file 

all checks passed
```

### `node packages/nana-pack/tests/known-bugs.test.mjs` — exit 0

```text
PASS R-2505: this repository's HANDOFF.md points to the known-bugs folder from a Known bugs section with no list item and has no Carried residuals heading 
PASS R-2506: a known-bug entry named for a missing, proposed or retired feature, or not named for a feature, is reported 
PASS R-2507: a known-bug file over the read window in bytes or in lines is reported with its counts 
PASS R-2508: this repository's known-bugs folder holds feature files and gets no name finding 
SIZE FEAT-013.md bytes=53008 lines=214
(node:45366) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file://~/nana-pi-wt/land-regenerate-generated/templates/typescript/template/tests/requirements-trace.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to ~/nana-pi-wt/land-regenerate-generated/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
```

### `node scripts/lane-class.mjs --root . --files <six conflicted paths>` — exit 0

```text
gate: packages/nana-pack/bin/nana-land.mjs — land tool
```

## Mutation pairs

- Unconditional main generated-path refusal → regeneration M1–M5 red (exit 1); restrict that refusal to clean generated edits after conflict handling → all six regeneration tests green (exit 0). M6 stayed green in the wrong implementation.
- Disable the retained clean generated-path refusal in production code → main M11 red (exit 1); restore the refusal → all 12 clean-merge cases green (exit 0). Assertions and fixtures were never altered.

## Completion and exclusions

All seven checks named in build 4 passed before the merge commit; the same seven will be run again on the committed tip and their standalone exit codes reported to the seat. The additional five plan-listed land/runner regression modules and known-bugs check also passed. M7 is the extended clean-merge M9, not an extra regeneration-file case. No title-check command is named in build 4.

CI covers the full suite under AGENTS.md; no local full suite ran, so no machine-wide full-suite lock was needed. No install check or fresh Windows run was requested for this merge-only build. The seat retains push, CI and review ownership. No seat mutation script or model session was run; earlier builds already retain their seven seat pairs. No open questions, new tests, tunables, new known-bug fixes, or precedent departures.

Manual edits are restricted to the six conflicted files and this report. Git auto-merged the remaining main changes. Stage the seven explicit paths and commit the merge using a message file under TMPDIR; Git merge commits include the already-staged auto-merged paths and do not accept partial pathspec commits. The final response supplies the merge tip SHA.

### `node scripts/identity-scan.mjs --root .` — exit 0

```text
summary files=6841 findings=0 totals=5,0,0,4
```
