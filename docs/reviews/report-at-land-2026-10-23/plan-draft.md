# report-at-land: plan draft (planner, 2026-10-23, main c273b4de)

Feature: FEAT-039 · See the product and its decisions in one report (checked: the heading is at REQUIREMENTS.md:2484; FEAT-039 sits under CAP-07, whose Deliverables line lists R-1014).

This is one lane that merges two of the slate's candidates, report-at-land and report-ages, as the critic advised. Both edit scripts/product-report.mjs, scripts/deliverables.mjs and the tail of FEAT-039's table.

## Why

The owner's pick, 2026-10-23: "Each land writes the product report locally, and the report shows each deliverable's age (today 7 of 41 show one)."

- No run makes the report today. Only `npm run report` builds it, by hand (package.json:18), into a gitignored folder (.gitignore:2). No land, suite, CI or hook step calls it. (Measured by the slate; this plan re-read the code and agrees.)
- The repo's copy at the default path dates from 2026-10-12, and the published copy from 2026-10-20. (Measured by the slate, not re-measured here.)
- The page built at main shows an age for 7 of 41 deliverables (measured here; list below).
- R-1014, the report itself, is made by hand and read by a person. It is neither parked nor read by code (measured: REQUIREMENTS.md:1995-1996).
- Two stores shared across the clone keep their own timestamps but name no artifact: suite records (R-2547) and build records (R-2597). So both show "no artifact named" (measured).
- Both gaps are already logged as known bugs, at docs/known-bugs/FEAT-039.md:30 and :32 (measured).

What the lane closes:
- The "regenerate" half of HANDOFF Next item 4, for the local page only. The owner's claude.ai copy stays a manual seat publish, because no code can update an artifact (inferred from how artifacts are published).
- R-1014's maker moves from manual to land. Its reader stays a person, and this lane writes a Parked line with the reason.
- Stored ages for R-2547 and R-2597, plus the page's own build commit for R-1014. That takes the count from 7 of 41 to 10 of 41 (measured on a scratch prototype).

## Spend

This serves the current priority: every artifact made automatically by a run that already happens, read by code that acts on it, and showing its age. Within it, it serves appetite clause 2, the product report showing each deliverable's age and real reader.

Cost:
- Two build sessions with the small builder.
- One final review.
- One CI run on the draft PR.
- After the lane lands, each passing land takes about 1.2 s longer (measured on the prototype, macOS). The newest land's suite took 541.5 s (from its suite record), so that is about 0.2%.

## Stakes

The blast is low and reversible, with one higher-blast spot.

- The page and its ages only report. A wrong age misleads a reader but changes no verdict.
- The checker change only removes three notes. It does not change the count rule.
- The higher-blast spot is that the write runs inside every land's locked suite. If an error escaped the guard, it would change the land's exit code. nana-land would then refuse every land until someone reverted the change. R-2742 and wrong-code pair 10 pin the guard.

The claim most likely wrong: that the Windows land write works and costs about a second. Nobody has run a Windows land with it. The Windows CI leg runs the test with the platform injected, natively on Windows. But git spawns are slower on Windows, and the per-land cost there is unmeasured.

## Measured (2026-10-23, this Mac, main c273b4de)

**Report build time at main.**
- Result: 0.82 s, 0.82 s and 1.25 s wall over three runs. The three pages are byte-identical.
- How: `node scripts/product-report.mjs --out <scratch>/report-at-land/main-N.html`, run from the clean main checkout. It writes only to scratch, and `git status` stayed clean.

**Ages at main.**
- 7 of 41 deliverables show an age:
  - R-291: 5 commits, 0 days.
  - R-1272: measured at tip c273b4de.
  - R-509, R-507, R-535: about 2,660 commits, 44 days.
  - R-536: 263 commits, 1 day.
  - R-694: 327 commits, 2 days.
- The other 34 say "no artifact named".
- Count line: `deliverables: 16 of 33 made and read by code, 8 parked`.
- How: read the page's embedded model with `<scratch>/report-at-land/count-ages.mjs`.

**Main's checker on this lane's ledger lines.**
- It prints three notes: `R-2597 artifact "build-records" … is not tracked at HEAD`, and the same note for `product-report` on R-1014 and `suite-runs` on R-2547.
- So the set of exempt artifact names must widen in the same change as the ledger lines.
- How: main's deliverables.mjs run over the edited ledger in a scratch clone.

**Prototype (not the lane's code).**
- About 60 lines across four files, in a `git clone` of main at <scratch>/report-at-land/clone. It is committed there as a2bca9ea, and the diff is at <scratch>/report-at-land/prototype.diff.
- The tree checker prints `0 problems` and `deliverables: 16 of 32 made and read by code, 9 parked`, with no note.
- The page shows 10 of 41 ages: the seven above, plus:
  - R-2547: `newest record at tip c273b4de …, 0 commits and 0 days before HEAD`
  - R-2597: `newest record at tip c3968694 …, 3 commits and 0 days`
  - R-1014: `this page: built from c273b4de committed 2026-10-23T16:53:57-04:00`
- A build takes 0.91 to 1.24 s, and repeated builds are byte-identical.
- How: the scratch clone, with the real stores copied into its own git folder.

**Land write on the prototype.**
- Setup: the Windows branch, forced with an injected `platform: "win32"`, and a fake suite that exits at once.
- A passing land took 1,180 to 1,228 ms, against 28 to 47 ms without the write.
- The page's embedded commit equals HEAD. One note reads `[nana-land] product report: wrote <path> for a2bca9ea`.
- Filtered, wrong-tip, tipless and failing runs wrote nothing.
- When the page path was a folder, the run printed one `product report not written: EISDIR …` note and exited 0.
- A malformed HANDOFF ask gave one note, `product report not written: HANDOFF.md line 24: malformed Open for the owner entry`, with exit 0, in 246 ms.
- How: `<scratch>/report-at-land/run-locked.mjs` against the clone.

**Store reads.**
- 82 suite records (1.6 MB) read in 22 to 32 ms.
- 300 records (5.9 MB, made from copies) read in 44 to 59 ms.
- The build ledger's 33 lines read in 1 to 3 ms.
- How: a microbench, `<scratch>/report-at-land/bench-read.mjs`.

**Store contents.**
- The suite store holds 82 records, from 2026-10-22T09:45Z to 2026-10-23T21:33Z, about 36 hours.
- At that pace, the 300-record cap holds about 5 to 6 days (an inferred projection).
- The newest suite record is the land run for c273b4de.
- The build ledger holds 16 end lines and 17 start lines. One build is running now, for the hard-kill-watcher lane, and its tip is not in main's history.
- How: `ls` and JSON reads of the nana folder in the common git directory.

**Existing tests on the prototype.**
- runtime-land.test.mjs fails one check, R-2525's at line 238, which counts exactly one land note. Its fixtures have no REQUIREMENTS.md, so each passing land now adds a `product report not written` note.
- These pass: product-report.test.mjs (82 PASS, 55 s), suite-records, test-locked (17 PASS), requirements-deliverables and requirements-tree (96 PASS).
- Because requirements-tree passes, docs/requirements-tree.md does not change from the maker-line edits.
- How: each file run alone in the clone, with TMPDIR set inside scratch.

**Note relay.**
- nana-land keeps every line of suite output that starts with `[nana-land]` and prints it on success (nana-land.mjs:34-36, :197). The lane needs no change to nana-land.
- How: code read.

**Hand measure.**
- `npm run map:measure` runs the locked suite with `NANA_LAND_TIP` set to HEAD and `NANA_RUNTIME_HAND_MEASURE=1`, on a tree that may be dirty (runtime-measure.mjs:294).
- How: code read.

**IDs.**
- R-2740 to R-2746 are unused on main, on feat/hard-kill-watcher and in every scratch plan.
- No commit in history mentions R-274x or R-275x (`git log --all -G`).
- R-2720 to R-2739 are reserved for other lanes.
- How: `git grep`, `git log -G`, `grep -r`.

Not measured:
- the wrong-code pairs;
- a Linux or Windows run of the prototype;
- the measured (coverage) land path with the write. The prototype exercised only the Windows branch and the non-land paths.

## Design

- **D1 · When and where the land writes.** scripts/test-locked.mjs writes the page only on a passing land. That means an unfiltered run, `NANA_LAND_TIP` equal to HEAD, no hand-measure variable, and a final exit code of 0.
  - There are three passing exits, and each writes after `finishRecord`:
    - the measured pass (test-locked.mjs:298-302);
    - the path where coverage fails and the plain rerun passes (:292-296, finalCode 0);
    - the Windows branch (:232-238). Today it returns before any map write, so it gets its own write. It also gets the checks for an unfiltered run and a tip equal to HEAD, which it lacks today.
  - The page goes to `nana/product-report.html` under the git common directory, beside runtime-map.json, suite-runs and build-records.jsonl. Every worktree's land overwrites that one page.
  - The write happens inside the machine lock, before `finally` releases it.
  - Because the write comes after the suite record and the map, the land page shows the land's own suite record and runtime map at HEAD.
- **D2 · How it writes.** A small helper in test-locked.mjs does three things:
  1. It imports `./product-report.mjs` dynamically, inside a try block. A run that is not a land never loads the report, and a load failure becomes a note rather than a crash. (Inferred benefit; no test pins it.)
  2. It finds the common directory the way `dataPath` does (runtime-map.mjs:34-42).
  3. It calls `generateReport({ root: cwd, out })`.
  - On success it prints one note: `[nana-land] product report: wrote <path> for <tip8>`.
  - If anything throws, it prints one note, `[nana-land] product report not written: <reason>`, with line breaks in the reason replaced by `; `.
  - It always returns the suite's own exit code.
  - It adds no environment variable and no flag.
- **D3 · Ages for the two record stores.**
  - The age comes from the newest readable record whose tip is in HEAD's history. It reads `newest record at tip <tip8> on <UTC ISO>, <n> commits and <d> days before HEAD`.
  - Why only records in HEAD's history: lane worktrees write to these shared stores, so the newest record overall is often a lane tip that main does not contain. That is measured for the build ledger today, and inferred for suite runs while four lanes build at once.
  - Days count to HEAD's commit time, as R-2545 does, so R-1012's same-output rule still holds.
  - HEAD's history comes from one `git rev-list HEAD` call, about 2,750 commits.
  - Suite records: `readSuiteRecords` drops other schemas and lists newest first by file name. A record needs a tip and a time that parses.
  - Build records: `readBuildLedger(buildRecordsPath(<common dir>))`. Only end records with a tip and a parseable `endedAt` count, read from the end of the file backwards.
  - When no age shows, the reason is one of:
    - `no readable record`
    - `no record names a commit in HEAD's history`
    - `the build ledger cannot be read` (any read error, including the 32 MiB cap)
    - `shallow clone`
    - `git could not read the history`
  - The reasons hold no file path, because the page gets published.
- **D4 · R-1014's own age.**
  - The page shows `this page: built from <tip8> committed <commit date>`, taken from the model's own commit and date.
  - It reads no stored page. A page built at a land cannot read itself, and reading the previous page would show the land before.
  - The page cannot know how far its published copy trails main. The Commit line already shows the same commit.
- **D5 · The set of machine-local artifact names.**
  - scripts/deliverables.mjs gains `MACHINE_LOCAL_ARTIFACTS`, frozen as `["runtime-map", "suite-runs", "build-records", "product-report"]`.
  - The checker drops the not-tracked note for every name in the set (deliverables.mjs:130).
  - `artifactAges` keeps all four out of the git history walk (product-report.mjs:211) and sends each to its own branch.
  - `RUNTIME_MAP_ARTIFACT` stays exported, because R-2537's sealed test pins it.
- **D6 · Ledger lines.**
  - R-1014's two lines become four:
    - `Made by: R-1014 · land: scripts/test-locked.mjs, scripts/product-report.mjs · product-report`
    - `Made by: R-1014 · manual: the seat publishes the land-written page to the owner's claude.ai copy by hand; no code can update that copy`
    - `Read by: R-1014 · person: the owner reads the copy the seat publishes; no code reads the page`
    - `Parked: R-1014 · since <answer date>: only a Claude session can publish the owner's copy, so no code reads or acts on the page; a session-start line naming the land page's commit would be a hook lane`
  - R-2547's maker line gains ` · suite-runs`, and R-2597's gains ` · build-records`.
  - None of the three gets a new `Read by: … · code: scripts/product-report.mjs` line. Showing an age is not acting on the artifact.
  - The count line goes from `16 of 33 …, 8 parked` to `16 of 32 …, 9 parked` (measured on the prototype).
- **D7 · R-1012's condition widens.** It becomes: "WHEN the working tree, the origin remote, the runtime data, the suite records and the build records are unchanged between them, …". Only the text changes; its test stays.
- **D8 · What stays unchanged.**
  - nana-land.
  - `DEFAULT_OUT` and `npm run report`.
  - The template.
  - R-2542's "no artifact named" note, which 31 rows keep.
  - The published copy.

## Dropped

- **Pointing `DEFAULT_OUT` at the land page** (the critic's idea). A hand build at a lane tip would overwrite main's land page with a tip that never landed. See open question 3.
- **"made fresh at each <run>"** for automatic makers with no artifact (report-ages must-meet 4). It is not an age, and a broken hook would still read fresh. See open question 2.
- **A session-start line that reads the land page's commit.** It would make R-1014 read by code, but it is a hook lane. See open question 1.
- **Ages for the review ledger (R-1008) and the journal (R-159).** Both live in pi's agent directory, so the report would have to read the home folder, and the page would differ by user.
- **An age for the CI records (R-2632).** It needs a network read through gh at build time. If the land-reads-ci-records lane keeps those records in the common directory, a fifth name joins the set.
- **Publishing the claude.ai copy from code.** No code can update an artifact.
- **Refreshing the 33 out-of-date assessments.** That needs model spend and a change to assessments.json.
- **A ledger test that the report never counts as a code reader** (the critic's idea). R-1272's existing line, `Read by: R-1272 · code: scripts/product-report.mjs`, would fail it, and park-open-deliverables owns that line. D6 keeps the rule, and the reviewer checks it.
- **Moving R-1014's park line into park-open-deliverables** (the skeptic's idea). The slate assigns it to this lane, so that lane leaves R-1014's lines alone.
- **Also dropped:** a page history per tip, an atomic write through a temp file and rename, a page on failing lands, and a page in CI.

## Class

Ordinary, by the letter of AGENTS.md.

- The lane changes scripts/test-locked.mjs, scripts/product-report.mjs, scripts/deliverables.mjs, three test files, the ledger, two READMEs, the requirements skill text and notes.
- It touches no nana-setup install, uninstall or doctor code, no Claude Code hook, no pi extension and no nana-gate policy.
- It touches none of the land and review tools AGENTS.md lists: nana-land, pi-review, claude-review and review-round.
- test-locked.mjs is not on that list. The suite-records lane changed it and was classed ordinary (docs/reviews/suite-records-2026-10-22/must-meet.md:5). runtime-map-live was an install, hook or gate lane only because it changed nana-land.
- The report path stays out of land-config.mjs, which nana-land imports (see Tunables).
- test-locked does run inside every land. The seat may choose to add the land reviewer; the letter does not require it.

Review ladder:
- the seat's wrong-code pairs;
- then one final reviewer from another model family;
- the Windows CI leg on a draft PR.

No install check is needed, because the lane changes nothing under packages/nana-setup and no hook. Builder: the small builder (`pi-worker --lane-size small`), in two sessions.

## Threat model

Honest variation in our own tools' output is in scope:
- the Windows land branch;
- a land from a linked worktree, where the common directory and the git directory differ;
- a land that nana-land refuses after its suite passed;
- filtered runs, including `--jobs=2` read as a filter;
- a hand measure on a dirty tree;
- a failing suite, and a coverage failure whose plain rerun passes;
- a malformed HANDOFF ask, a ledger with tree problems, or no ledger at all;
- a page path that cannot be written, and an earlier page left by another land;
- two worktrees landing one after the other, which the machine lock serializes;
- a shallow clone;
- suite records from lane worktrees that HEAD does not contain, and records with another schema or a broken format;
- a build still running (a start line with no end), and an end line with no tip;
- a build ledger over its size cap, or one that cannot be read;
- records newer than HEAD's commit time;
- a fresh clone with no stores;
- CRLF line endings in error text.

Deliberate forgery is out of scope: hand-edited records or ledger lines, a hand-set `NANA_LAND_TIP`, or a forged page in the common directory.

Public repo: every committed line says "the owner", never a name, and names nothing about the owner's work. The page path printed at land holds the machine's home path, but it appears only in terminal output.

## Precedent

Precedent:
- scripts/test-locked.mjs:264-269: the runtime-map write that runs only at a land, where a write problem becomes `note()` (:45). The report write copies that guard.
- scripts/test-locked.mjs:181-198: `finishSuiteRecord` with the land prefix (:191). The report write follows it on each passing exit.
- scripts/test-locked.mjs:232-238, :271-297 and :298-302: the three exits D1 names. Lines :240-246 are the non-land path, which stays as it is.
- packages/nana-pack/lib/runtime-map.mjs:34-42: `dataPath`, which finds the common directory relative to the folder git ran in. The page path uses the same rule. See also suite-records.mjs:37-42 (`suiteRecordsDir`).
- scripts/product-report.mjs:692-700: `generateReport({ root, out })`, called unchanged.
- scripts/product-report.mjs:28: `DEFAULT_OUT`. `LAND_REPORT_SUBPATH` joins it as an exported constant with a comment on where its value comes from.
- scripts/product-report.mjs:38-53: the exported age labels and reasons. The new labels join them.
- scripts/product-report.mjs:197-263: `artifactAges`. Its runtime-map branch at :242-261 is the shape for the two store branches: shallow check, history check, `rev-list --count`, `wholeDays`, `unknownAge`.
- scripts/product-report.mjs:630: the claims map that attaches an age. R-1014's own line goes there, because the model's commit and date are known at that point.
- scripts/deliverables.mjs:31 and :130: `RUNTIME_MAP_ARTIFACT` and its exemption, which the frozen set replaces.
- packages/nana-pack/lib/suite-records.mjs:114-131: `readSuiteRecords`. Its `storeSuiteRecord` at :75 seeds test records.
- packages/nana-pack/lib/build-records.mjs:39-41 and :73-101: `buildRecordsPath` and `readBuildLedger`. The size cap is at build-records-config.mjs:39.
- packages/nana-pack/bin/build-report.mjs:39-46: how it finds the common directory and reads the ledger.
- packages/nana-pack/bin/nana-land.mjs:34-36 and :197: the note relay, unchanged.
- packages/nana-pack/tests/runtime-land.test.mjs: R-2740 to R-2742 go in this file. Reuse:
  - :79-100, the fake suite;
  - :142-147, the wrapper with injected options;
  - :168-191, `runCase`;
  - :243-249, R-2526's `platform: "win32"` injection.
- packages/nana-pack/tests/suite-records.test.mjs:76-100: the fake suite's code that writes a runner record. The runtime-land fake gains the same few lines, so its land stores a record.
- packages/nana-pack/tests/product-report.test.mjs:
  - :98-104, `writeRuntimeFile`, which seeds a store in the common directory;
  - :105-147, `productLedger`, `historyFixture`, `commitAt`, `renderedProduct` and `renderedClaims`;
  - :1411-1477, R-2545's cases, including the side-branch tip and the shallow clone. R-2744 to R-2746 copy them.
- packages/nana-pack/tests/requirements-deliverables.test.mjs:80-110 and :159: the artifact paths that pass, and R-2537's sealed values. R-2743 copies them.
- REQUIREMENTS.md:1995-1996, :2007 and :444: the ledger lines D6 edits. The Parked-line format is at deliverables.mjs:154-185.
- Earlier lanes to follow: docs/reviews/runtime-map-live-2026-10-22/, report-deliverables-2026-10-22/, suite-records-2026-10-22/, park-deliverables-2026-10-22/ and deliverable-fields-2026-10-22/.
- docs/reviews/park-deliverables-2026-10-22/seat-mutate.mjs with packages/nana-pack/lib/mutation-runner.mjs: the table of wrong-code pairs to copy.

No private helper moves.

## Must-meet rows (EARS, one shall each), placed in FEAT-039 after R-2545

**R-2740**
- Requirement: WHEN an unfiltered locked run whose land tip names HEAD, other than a hand measure, ends with exit code 0, the locked suite shall write the product report for HEAD to `nana/product-report.html` under the git common directory after storing its suite record and any runtime data, and print one land note naming that page and HEAD's first 8 characters.
- Test: `packages/nana-pack/tests/runtime-land.test.mjs::R-2740: a passing land writes the product report for HEAD under the git common directory after its suite record and runtime data, and names it in one land note`

**R-2741**
- Requirement: WHEN a locked run is filtered, has no land tip, has a land tip that does not name HEAD, is a hand measure, or ends with a non-zero exit code, the locked suite shall leave any earlier product report page byte for byte and print no product report note.
- Test: `packages/nana-pack/tests/runtime-land.test.mjs::R-2741: filtered, tipless, wrong-tip, hand-measure and failing runs leave the earlier product report byte for byte and print no product report note`

**R-2742**
- Requirement: IF a passing land's product report refuses or cannot be written, THEN the locked suite shall print one land note starting `product report not written:` with its reason on that one line and exit with the suite's own exit code.
- Test: `packages/nana-pack/tests/runtime-land.test.mjs::R-2742: a land whose product report refuses or cannot be written prints one product report note on one line and keeps the suite's exit code`

**R-2743**
- Requirement: WHEN a `Made by:` claim's artifact is `runtime-map`, `suite-runs`, `build-records` or `product-report`, the deliverable check shall report no not-tracked note for that artifact.
- Test: `packages/nana-pack/tests/requirements-deliverables.test.mjs::R-2743: the four machine-local artifact names get no not-tracked note, and any other untracked artifact still does`

**R-2744**
- Requirement: WHEN a `Made by:` claim names `suite-runs`, the product report shall show beside it the tip and UTC time of the newest readable suite record whose tip is in HEAD's history, with the commits from that tip to HEAD and the whole days from that time to HEAD's commit time, or say why it cannot.
- Test: `packages/nana-pack/tests/product-report.test.mjs::R-2744: suite-runs shows the newest suite record in HEAD's history with its tip, time, commits and days to HEAD, or says why it cannot`

**R-2745**
- Requirement: WHEN a `Made by:` claim names `build-records`, the product report shall show beside it the tip and UTC end time of the newest readable build end record whose tip is in HEAD's history, with the commits from that tip to HEAD and the whole days from that time to HEAD's commit time, or say why it cannot.
- Test: `packages/nana-pack/tests/product-report.test.mjs::R-2745: build-records shows the newest ended build in HEAD's history with its tip, end time, commits and days to HEAD, or says why it cannot`

**R-2746**
- Requirement: WHEN a `Made by:` claim names `product-report`, the product report shall show beside it the first 8 characters of the page's own commit and that commit's date, without reading any stored page.
- Test: `packages/nana-pack/tests/product-report.test.mjs::R-2746: product-report shows the page's own commit and date and reads no stored page`

Text-only change: R-1012 (see D7). Retired rows: none.

### What each test does, and why it is red on main

**R-2740**
- Fixture: a git repo with a minimal valid ledger in the `productLedger` shape. One product capability lists R-8500, whose maker lines name `runtime-map` and `suite-runs`. It also has a HANDOFF with an empty Open-for-the-owner section, and one tracked code path.
- The runtime-land fake suite gains a runner-record write.
- Cases:
  - a measured pass;
  - a land where coverage fails and the plain rerun passes (exit 0);
  - `platform: "win32"`;
  - a linked worktree of the fixture as the working directory.
- Each case expects:
  - exit 0, and a page at `nana/product-report.html` in the common directory;
  - the page's embedded model has `commit` equal to HEAD;
  - the `suite-runs` claim's age starts `newest record at tip <HEAD8>` and says `0 commits`;
  - in the measured cases, the `runtime-map` claim's age starts `measured at tip <HEAD8>`;
  - stdout holds exactly one line `[nana-land] product report: wrote <page> for <HEAD8>`, with the page path compared through `realpathSync.native`;
  - in the linked-worktree case, nothing appears under the worktree's own git directory.
- Sealed value: `LAND_REPORT_SUBPATH === "nana/product-report.html"`.
- Red on main: main writes no page and prints no such note.

**R-2741**
- Each case first writes an earlier page with fixed bytes.
- Cases:
  - `--jobs=2`;
  - no tip;
  - a tip of forty zeros;
  - the hand-measure variable with the tip at HEAD;
  - a suite that always fails, on the measured path (exit 7);
  - a suite that always fails, under `platform: "win32"`;
  - a coverage failure of the whole run.
- Each case expects the earlier page unchanged, byte for byte, and no stdout line containing `product report`.
- Green on main by design, because main never writes. The test is a guard, and pairs 6 to 9 turn it red. It has its own row because "only when" is a separate shall.

**R-2742**
- Each case first writes an earlier page. Every case has a passing suite.
- Cases:
  - a fixture with no REQUIREMENTS.md (the report refuses);
  - a malformed HANDOFF ask (R-1030's refusal);
  - a ledger with two tree problems, which gives an error several lines long;
  - a page path that is a folder (the write fails);
  - a refusal on the path where coverage fails and the plain rerun passes;
  - a refusal under `platform: "win32"`.
- Each case expects exit 0 and exactly one stdout line starting `[nana-land] product report not written: `.
- That line names its cause: `REQUIREMENTS.md`, `HANDOFF.md line`, `requirements tree checker problems`, or `EISDIR` or `EPERM`.
- In the tree-problems case, both problems sit on that one line.
- In the three refusal cases, the earlier page stays unchanged, byte for byte.
- Red on main: no note.

**R-2743**
- A ledger where R-001 to R-005 each have a reader line and a maker line `Made by: <row> · suite: scripts/make.mjs · <artifact>`. The five artifacts are the four names plus `out/untracked.html`.
- With tracked paths `["scripts/make.mjs"]`, the five rows give exactly one not-tracked note, for `out/untracked.html`.
- Sealed values: `MACHINE_LOCAL_ARTIFACTS` equals the four names in that order, and `RUNTIME_MAP_ARTIFACT` stays `runtime-map`.
- Red on main: main gives four notes, for `suite-runs`, `build-records`, `product-report` and the control.

**R-2744**
- Fixture: `historyFixture` with `["suite-runs"]`. Commit A is dated 2026-11-01, B 11-03 and HEAD 11-04, plus commit S on a side branch.
- Records are seeded with `storeSuiteRecord`.
- Cases:
  - one record at A, recorded 2026-10-31T19:00-05:00, shows `newest record at tip <A8> on 2026-11-01T00:00:00.000Z, 2 commits and 3 days before HEAD`;
  - a newer record at S and a newer file with another schema are both skipped;
  - a record at B, recorded after HEAD's commit time, shows `1 commit and 0 days`;
  - an empty store shows `age unknown: no readable record`;
  - a store with only S records shows `age unknown: no record names a commit in HEAD's history`;
  - a clone of depth 1 shows `age unknown: shallow clone`.
- Sealed exports: `RECORD_AT_TIP_PREFIX`, `NO_READABLE_RECORD`, `NO_RECORD_IN_HISTORY`.
- Red on main: main looks up `suite-runs` in git history and shows `age unknown: not tracked at HEAD`.

**R-2745**
- Fixture: `historyFixture` with `["build-records"]`, using the same commits.
- The ledger file, `nana/build-records.jsonl` in the common directory, holds a start line at A, an end line at A, a later end line with no tip, a later end line at S, and a broken line.
- Cases:
  - that ledger shows `newest record at tip <A8> on <endedAt ISO>, 2 commits and <d> days before HEAD`;
  - no file shows `no readable record`;
  - only start lines show `no readable record`;
  - only end lines at S show `no record names a commit in HEAD's history`;
  - a folder at the ledger path shows `age unknown: the build ledger cannot be read`, and the page is still written.
- Sealed export: `BUILD_LEDGER_UNREADABLE`.
- Red on main: `age unknown: not tracked at HEAD`.

**R-2746**
- Fixture: `historyFixture` with `["product-report"]`, with no nana folder in the common directory.
- The claim's age equals `this page: built from <first 8 characters of model.commit> committed <model.date>`.
- Writing an earlier page with another commit into `nana/product-report.html` changes nothing.
- Sealed export: `THIS_PAGE_PREFIX`.
- Red on main: `age unknown: not tracked at HEAD`.

### Existing tests made false

- **runtime-land.test.mjs:238**, R-2525's check that exactly one land note prints.
  - Measured on the prototype: it fails with `[nana-land] runtime map not written: completion record is missing`, because the fixture's passing land now adds a product-report note.
  - The fix filters the notes to those holding `runtime map` and keeps the assertion. R-2525's text does not change.
  - This is a test fix, not a retune, like runtime-map-live's fix to R-2498.
- No other test is affected. Measured: product-report, suite-records, test-locked, requirements-deliverables and requirements-tree all pass on the prototype. R-2554 still passes because it picks record lines by their prefix.

## Tunables

- **`LAND_REPORT_SUBPATH = "nana/product-report.html"`**
  - Where: exported at the top of scripts/product-report.mjs, beside `DEFAULT_OUT`.
  - Source: chosen, to sit beside runtime-map.json, suite-runs and build-records.jsonl in the common git folder (R-2740).
  - Pinned by R-2740's test.
  - It stays out of land-config.mjs, so the lane touches no file nana-land imports.
- **`MACHINE_LOCAL_ARTIFACTS`**, frozen as `["runtime-map", "suite-runs", "build-records", "product-report"]`
  - Where: scripts/deliverables.mjs.
  - Source: contract (R-2743). The `runtime-map` name comes from lane B. The other three are chosen: each store's own file name without its extension, so a reader can match them to the ledger by eye.
  - Pinned by R-2743's test.
- **Labels in scripts/product-report.mjs.** These are contract text, pinned by their rows' tests the way R-2544's labels are:
  - `RECORD_AT_TIP_PREFIX = "newest record at tip"` (R-2744, R-2745)
  - `NO_READABLE_RECORD = "no readable record"`
  - `NO_RECORD_IN_HISTORY = "no record names a commit in HEAD's history"`
  - `BUILD_LEDGER_UNREADABLE = "the build ledger cannot be read"` (R-2745)
  - `THIS_PAGE_PREFIX = "this page: built from"` (R-2746)
- **Land-note texts.** `product report: wrote` and `product report not written:` stay inline in test-locked.mjs, as its runtime-map notes do (:233, :241, :268-269).
- **Reused unchanged:** `TIP_DIGITS` (8), `SECONDS_PER_DAY`, `BUILD_LEDGER_READ_MAX_BYTES` (32 MiB) and `SUITE_RECORDS_KEEP` (300).
  - On retention, measured: at the pace of 2026-10-22 to 10-23, 300 records last about 5 to 6 days, not the 9 days the comment says.
  - That goes in as a FEAT-031 known-bug line, not a retune.

## Wrong-code pairs (each must turn a named test red)

1. The page is written before `finishRecord`. Caught by R-2740: the suite-runs age names no record at HEAD.
2. The page is written right after the coverage run, before the map write. Caught by R-2740: the runtime-map age is not at HEAD.
3. The code uses `--git-dir` instead of `--git-common-dir`. Caught by R-2740's linked-worktree case.
4. The Windows branch does not write. Caught by R-2740's win32 case.
5. The path where coverage fails and the plain rerun passes does not write. Caught by R-2740's second case.
6. A filtered run writes. Caught by R-2741.
7. A run with no tip or a wrong tip writes, because the Windows branch lacks the HEAD check. Caught by R-2741.
8. A hand measure writes. Caught by R-2741.
9. The write sits in `finally` or ignores the exit code, so failing runs write. Caught by R-2741.
10. The report error is not caught, so the outer catch returns 1. Caught by R-2742: exit 1 instead of 0.
11. The raw error, several lines long, is printed as is. Caught by R-2742's tree-problems case.
12. The note lacks the `[nana-land]` prefix, so nana-land would drop it. Caught by R-2740 and R-2742.
13. Only `runtime-map` is exempt, as on main. Caught by R-2743.
14. Every untracked artifact is exempt. Caught by R-2743's control case.
15. The newest suite record is taken whether or not HEAD contains it. Caught by R-2744's side-branch case.
16. Days count to now instead of HEAD's commit time. Caught by R-2744's fixed dates.
17. The shallow-clone check is skipped. Caught by R-2744's shallow case.
18. The last ledger line is taken whatever its kind or tip. Caught by R-2745.
19. An unreadable ledger throws and stops the page. Caught by R-2745's folder case.
20. product-report reads the stored page's commit. Caught by R-2746's earlier-page case.

The seat runs these pairs before the review, using the shared runner and a copy of park-deliverables' table. They were not run during planning.

## Windows notes

- The Windows land branch (test-locked.mjs:232-238) runs the suite without coverage and returns before any map write. The lane gives it its own write after its record.
- The page then shows the older map's age, or says its tip is not in HEAD's history. That is honest, because Windows lands do not measure the map.
- Today that branch checks neither for a filtered run nor for HEAD. The write adds both checks. The existing note and the plain run stay as they are.
- Tests inject `platform: "win32"`, as R-2526 does, so the branch is also tested on macOS and Linux. The Windows CI leg runs the same file natively.
- Paths: git prints the common directory with forward slashes. Resolve it against the working directory with `path.resolve`, as `dataPath` does.
- Compare page paths in tests through `fs.realpathSync.native`. The Windows runner's temp folder uses a short 8.3 path, a CI gap seen on 2026-10-22.
- Writing onto a folder gives EISDIR on macOS and is expected to on Windows (inferred). The R-2742 test accepts EISDIR or EPERM.
- The reason's line breaks are folded with `\r?\n`, so CRLF is handled.
- A pi builder once unescaped `\n` in test template strings, which passed on macOS and broke on Windows. The seat checks every build's diff for removed escapes.
- Not measured: the per-land cost on Windows, where git spawns are slower.

## Known limits (the seat writes them to docs/known-bugs/FEAT-039.md before the final round)

- Product report at land (report-at-land, plan): the owner's claude.ai copy changes only when the seat publishes the land page. No code can update it.
- Product report at land (report-at-land, plan): if nana-land refuses a land after its suite passed, the page names a tip that never landed, until the next land. The runtime map has the same limit.
- Product report at land (report-at-land, plan): only the locked suite writes the page. A land run with `--suite "npm test"`, a hand measure and CI write none.
- Product report at land (report-at-land, plan): the write is not atomic, so a crash mid-write can leave a partial page. A stop signal during the roughly one-second build releases the lock before the write ends.
- Product report at land (report-at-land, plan): if the report module fails to load, the land prints a note, but no test pins that path.
- Store ages (report-at-land, plan): ages come from this clone's stores, so another clone's page differs.
- Store ages (report-at-land, plan): a newer record whose tip HEAD does not contain is skipped, so a lane's recent run does not show on main's page.
- Store ages (report-at-land, plan): a build that is still running shows nothing until it ends.
- Store ages (report-at-land, plan): the suite store keeps 300 records, about 5 to 6 days at the measured pace. If no record in HEAD's history remains, the page says so.
- Store ages (report-at-land, plan): a store age shows when the maker last ran. It does not show that the record is complete or that a reader read it.
- Product view (report-at-land, plan): R-1014's age is its own build commit, the same as the Commit line. The page cannot show how far its published copy trails main.
- Product view (report-at-land, plan): 31 of 41 deliverables still show no age:
  - 8 parked desk and stage rows;
  - 9 rows made only by hand;
  - 6 session-start, hook and extension lines, made fresh at each run;
  - 2 terminal outputs (the suite's per-file lines and the land's output);
  - 4 outputs made by CI;
  - 2 stores in pi's agent directory (the review ledger and the journal).
- Product view (report-at-land, plan): R-1012's same-output rule now also needs the suite and build stores unchanged. A land or a build between two report runs changes the page.
- In FEAT-039.md:30, replace the sentence "Suite records carry their own time but name no artifact here." with the 31-row line above.
- Delete FEAT-039.md:32 ("git ignores the report page, so the report's own age does not show").

## Docs that change

- **REQUIREMENTS.md, FEAT-039.** Add R-2740 to R-2746 after R-2545, each `planned` until its test passes. Change R-1012's condition as D7 says.
- **REQUIREMENTS.md, CAP-07 and CAP-02.** R-1014's four lines (D6). R-2547's maker line gains ` · suite-runs`, and R-2597's gains ` · build-records`.
- **README.md:61-62.** After "…measures the runtime map on the tip it lands", add: "and, when its suite passes, writes the product report for that tip into the clone's shared git folder".
- **README.md, Product report section (:270).** Add two sentences:
  - "Each passing land through the locked suite also writes the page for the landed tip into the nana folder of the clone's shared git directory and prints a land note naming it; the published copy changes only when a seat republishes that page."
  - "A deliverable whose maker names suite-runs or build-records shows the newest record HEAD contains, and one naming product-report shows the page's own commit."
  - Write the store path in plain prose, not in backticks, because the readme check resolves paths in backticks.
- **packages/nana-pack/README.md:270, the land helper paragraph.** After "Off Windows, the locked suite measures the runtime map; on Windows, it runs once without measuring and prints a land note.", add: "After a passing suite it also writes the product report for the tip and prints a land note naming the page."
- **packages/nana-pack/skills/requirements/SKILL.md:127.** Change "`runtime-map` is also an artifact name" to "`runtime-map`, `suite-runs`, `build-records` and `product-report` are machine-local artifact names, exempt from the HEAD check".
- **packages/nana-pack/skills/requirements/SKILL.md:129.** Add: "`suite-runs` and `build-records` show their newest record that HEAD contains, and `product-report` shows the page's own commit."
- **Module headers.**
  - test-locked.mjs `@purpose`: "…measure eligible land or hand runs and write a passing land's product report inside the same machine lock". Its `@effects` adds the report page.
  - product-report.mjs `@inputs` adds the suite records and the build ledger. Its `@outputs` adds store ages.
  - deliverables.mjs `@outputs` adds the machine-local artifact names.
  - product-report.mjs gains two library imports, so run `npm run map` and commit docs/code-map.md.
- **docs/known-bugs/FEAT-039.md.** The lines in Known limits above. Also one FEAT-031 line on the 300-record retention comment.
- **HANDOFF.md, Next item 4.** Change "Seat work: regenerate and republish the product report in a reviewed change." to "Seat work: publish the land-written product report to the owner's copy after each land." Then run `nana-writing HANDOFF.md`.
- **docs/sessions/2026-10.md.** Add an entry with the count lines before and after, and the age count going from 7 to 10.
- **docs/requirements-tree.md.** Seven rows are new, so regenerate it with `npm run req:tree -- --write`. The maker-line edits alone leave it unchanged (measured).

## Seat steps

1. Cut `feat/report-at-land` at `~/nana-pi-wt/report-at-land` from main. Each build brief carries the Feature line and a Precedent section, and passes `brief-check`.
2. Put the owner's answers to the open questions into build brief 1. The date of the answer goes on R-1014's Parked line.
3. Build 1, with the small builder: R-2743 to R-2746, D5 to D7, the ledger lines and the skill text.
4. Seat check after build 1:
   - If park-open-deliverables has not landed, `node scripts/requirements-tree.mjs --check` should print `deliverables: 16 of 32 made and read by code, 9 parked` and no note.
   - `npm run report` in the worktree should show 10 of 41 ages, counted with a copy of `count-ages.mjs`.
   - Read the CAP-07 and CAP-02 cards on the page.
5. Build 2, with the small builder: R-2740 to R-2742, D1 and D2, the R-2525 test fix, both READMEs, the module headers and the code map.
6. Seat check after build 2:
   - Run the twenty pairs.
   - Run each of these test files whole: runtime-land, suite-records, test-locked, product-report, requirements-deliverables and requirements-tree.
   - Check the build's diff for removed `\n` escapes.
   - Run `npm run test:locked` once, whole.
7. Real-run check before the review, in a scratch clone of the lane tip:
   - Drive `runLocked` with `platform: "win32"` and a passing fake suite, as `<scratch>/report-at-land/run-locked.mjs` does.
   - Open the page and check its commit and its three new ages.
8. Before the final round:
   - Add the known-bug lines, the HANDOFF edit and the session entry.
   - Run `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` and carry its output in the review brief and in the land.
   - That output should list seven new rows, R-1012's text change, R-1014's four lines including the new Parked line, and the R-2547 and R-2597 maker changes.
9. Push a draft PR before the final review, so the Windows leg runs. One final reviewer from another model family reviews the exact tip that lands.
10. The land itself is the first real run. nana-land's success output must carry `[nana-land] product report: wrote <page> for <tip8>`. After the land, the seat publishes that page to the existing artifact link. Publishing is a seat action, not a write to the repo.
11. Other lanes:
    - Tell park-open-deliverables to leave R-1014's lines alone.
    - Both lanes edit CAP-07's lines and HANDOFF. Whichever lands second merges main, re-runs the tree check, updates the count line in its session entry, and takes a confirmation round.
    - If land-reads-ci-records later keeps a store of CI records in the common directory, it adds that store's name to `MACHINE_LOCAL_ARTIFACTS`.

## Open questions (each with a one-word default)

1. Park R-1014's person reader now, rather than add a session-start line that reads the land page's commit? That line would be a hook lane on the full review ladder. Default: **park**.
2. Show "made fresh at each <run>" instead of "no artifact named" for automatic makers that keep no stored artifact (report-ages must-meet 4)? It is not an age, and a broken hook would still read fresh. Default: **no**.
3. Point `npm run report`'s default output at the land page, so only one local copy exists? A hand build at a lane tip would then overwrite main's land page. Default: **no**.