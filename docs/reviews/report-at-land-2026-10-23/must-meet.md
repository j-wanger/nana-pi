# report-at-land · must-meet of record (seat, 2026-10-23)

Feature: FEAT-039 · See the product and its decisions in one report

Written by the seat from the planner's draft (`plan-draft.md`) and one adversary pass (`plan-attack.md`), both kept in this folder. Plans get no review round. Where this file and the draft differ, this file holds. The planner's prototype under the scratch folder is evidence, not the design: the attack measured two faults in it (M1, M2) that this lane forbids.

The owner's decision, 2026-10-23, from the seat's artifact slate: "Report at each land (Recommended)": "Each land writes the product report locally, and the report shows each deliverable's age (today 7 of 41 show one)."

Spend line: the current priority (since 2026-10-23), appetite clause 2: the product report showing each deliverable's age and real reader.

Stakes: low blast, reversible, with one higher-blast spot. The write runs inside every land's locked suite; an error that escaped its guard would change the land's exit code, and nana-land would refuse every land until a revert. R-2742 and pairs 10 and 11 pin the guard.

## Seat decisions on the attack

- **M1 adopted.** A run is a land for the page by the suite record's own test: no filters, no hand-measure variable, the land tip equal to HEAD. Today's inline trigger in `finishSuiteRecord` lifts into one exported predicate in scripts/test-locked.mjs; the suite record's trigger and the page write both call it (the 2026-10-22 rule that a second caller imports). The page writes only when that predicate holds and the deciding exit code is 0. A hand measure never writes the page, on any platform.
- **M2 adopted.** No `product-report` artifact name and no self-provenance age. R-1014's land maker line names no artifact, so the page shows "no artifact named" for it. R-2746 and the `THIS_PAGE_PREFIX` label drop. Ages go from 7 of 41 to 9 of 41 (the draft's 10 less R-1014).
- **S1 adopted.** The R-2525 test in runtime-land.test.mjs counts only `runtime map` notes. A missing REQUIREMENTS.md is never skipped silently: it is a refusal with its note (R-2742).
- **S2 adopted.** scripts/deliverables.mjs gains a frozen machine-local artifact map from each name to its maker kind and its writer path: `runtime-map` → `land`, `scripts/runtime-measure.mjs`; `suite-runs` → `suite`, `scripts/test-locked.mjs`; `build-records` → `build`, `packages/nana-pack/lib/build-records.mjs`. A `Made by:` claim naming one of these names gets no not-tracked note only when its kind matches and its code paths include the writer path; otherwise it gets one note. The report reads ages for exactly the names in the map. `RUNTIME_MAP_ARTIFACT` stays exported (R-2537 seals it). The land-ci-timings lane adds its own entry.
- **S3 adopted as option (a).** A seat step: before publishing, the seat checks that the page's embedded commit equals main's. The refused-land case is a known limit.
- **S4 adopted.** R-2740's test includes a land from a linked worktree and asserts the common-directory path.
- **S5 adopted.** Rows say "the Windows path (injected)", not "on Windows"; the page makes no claim about why a Windows land skipped the map; R-2741's check carries a passing-land control and both failing shapes (always-fail and whole-run-fail); R-2740 names the deciding exit code, so a coverage failure whose plain rerun passes writes; the age reasons are only those the readers can tell apart.
- **S6 adopted.** The common-directory resolution inside suite-records.mjs's `suiteRecordsDir` lifts into an exported `gitCommonDir(root, { runGit })` in the same module; `suiteRecordsDir`, the page write and the build-records age import it. The two store ages are one function keyed by the S2 map, so a later store adds one entry, not a branch.
- **N3 adopted.** After the report build the locked suite re-checks its stop flag, so a stop signal during the build never turns into exit 0.
- **N6 adopted.** The page is written to a temporary file in the same folder, then renamed over the page, as the runtime map's write in scripts/runtime-measure.mjs does. A failed write leaves the earlier page whole.
- **N1, N2, N4, N5 declared** as known limits. **N7:** no test pins a count. **N8:** docs as listed below.
- **Open question 1, decided by the seat: park.** R-1014's person reader stays; a session-start reader would be a hook lane. **Question 2: no** ("made fresh" is not an age). **Question 3: no** (`npm run report` keeps its own output path).
- **Class: ordinary**, by AGENTS.md's letter: no nana-land, hook, extension, install or gate file changes, and test-locked is not a listed land tool (the suite-records lane, ordinary, changed it). Because the write runs inside every land, the seat runs its pairs and a real-run check. One final reviewer (Opus). **Builder: the larger builder, one session**, because the attack's additions (the predicate, the map, the helper lift, the worktree case) make it the riskier shape.

## Must-meet rows (FEAT-039, after R-2545)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2740 | WHEN a locked run is a land (no filters, no hand-measure variable, a land tip naming HEAD) and its deciding exit code is 0, the locked suite shall write the product report for HEAD to `nana/product-report.html` under the git common directory after storing its suite record and any runtime data, and print one land note naming that page and HEAD's first 8 characters. | `packages/nana-pack/tests/runtime-land.test.mjs::R-2740: a passing land writes the product report for HEAD under the git common directory after its suite record and runtime data, and names it in one land note` |
| R-2741 | WHEN a locked run is filtered, has no land tip, has a land tip that does not name HEAD, is a hand measure, or has a non-zero deciding exit code, the locked suite shall leave an earlier product report page byte for byte and print no product report note. | `packages/nana-pack/tests/runtime-land.test.mjs::R-2741: filtered, tipless, wrong-tip, hand-measure and failing runs leave the earlier product report byte for byte and print no product report note` |
| R-2742 | IF a land's product report refuses or its page cannot be written, THEN the locked suite shall print one land note starting `product report not written:` with its reason on that one line and exit with the suite's own exit code. | `packages/nana-pack/tests/runtime-land.test.mjs::R-2742: a land whose product report refuses or cannot be written prints one product report note on one line and keeps the suite's exit code` |
| R-2743 | WHEN a `Made by:` claim names an artifact in the machine-local artifact map, the deliverable check shall report no not-tracked note for it only when the claim's maker kind and one of its code paths match that artifact's map entry, and one note naming the row and the artifact otherwise. | `packages/nana-pack/tests/requirements-deliverables.test.mjs::R-2743: a machine-local artifact passes only under its own maker kind and writer path, and any other untracked artifact still gets a note` |
| R-2744 | WHEN a `Made by:` claim names `suite-runs`, the product report shall show beside it the tip and UTC time of the newest readable suite record whose tip is in HEAD's history, with the commits from that tip to HEAD and the whole days from that time to HEAD's commit time, or a reason the reader can tell apart. | `packages/nana-pack/tests/product-report.test.mjs::R-2744: suite-runs shows the newest suite record in HEAD's history with its tip, time, commits and days to HEAD, or says why it cannot` |
| R-2745 | WHEN a `Made by:` claim names `build-records`, the product report shall show beside it the tip and UTC end time of the newest readable build end record whose tip is in HEAD's history, with the commits from that tip to HEAD and the whole days from that time to HEAD's commit time, or a reason the reader can tell apart. | `packages/nana-pack/tests/product-report.test.mjs::R-2745: build-records shows the newest ended build in HEAD's history with its tip, end time, commits and days to HEAD, or says why it cannot` |

Each row goes in `untested`, then `implemented` when its check passes. Text-only change: R-1012's condition becomes "WHEN the working tree, the origin remote, the runtime data, the suite records and the build records are unchanged between them, …" (its test stays). R-2746 to R-2749 stay free.

### What each test does

- **R-2740** (runtime-land, reusing the fake suite, `runCase`, the injected-options wrapper and R-2526's `platform: "win32"`; the fake suite also writes a runner record, as suite-records.test.mjs's fake does). Cases: the measured pass; a coverage failure whose plain rerun passes; the Windows path (injected); a land from a `git worktree add` worktree (the page lands under the clone's common directory, never the worktree's private git folder); a land whose runtime-map write is refused (the page is still written). Each asserts: the page exists, its embedded commit equals HEAD, its `suite-runs` age names HEAD with 0 commits, and exactly one prefixed note names the page (compared through `fs.realpathSync.native`) and HEAD's first 8 characters. The measured case also asserts the `runtime-map` age names HEAD with 0 commits. Red on main: main writes no page.
- **R-2741** (runtime-land). A seeded page; then a filtered run, a tipless run, a wrong-tip run, a hand measure (R-2533's `HAND_WRAPPER`), an always-fail suite and a whole-run-fail suite, on the measured path and, for the filtered and wrong-tip runs, on the Windows path (injected). Each leaves the seeded page byte for byte and prints no `product report` note. In the same check, a passing-land control replaces the seeded page. Red on main: the control fails.
- **R-2742** (runtime-land). A passing land in a fixture with no REQUIREMENTS.md (the report refuses; a seeded earlier page stays byte for byte); one whose ledger has tree problems (a multi-line reason folds onto one line); one whose page path is a folder (EISDIR or EPERM). Each prints exactly one `[nana-land] product report not written: ` line with no line break in its reason, and exits 0, the suite's own code. Red on main: no such note.
- **R-2743** (requirements-deliverables). The repository's three real lines (R-1272's `runtime-map`, R-2547's `suite-runs`, R-2597's `build-records`) draw no note. Fixture lines each draw exactly one note: `suite-runs` under a CI maker; `build-records` under a manual maker; `runtime-map` under a land maker whose paths omit the writer; and a control naming `not-a-real-store`, which gets the ordinary not-tracked note. Red on main: main notes `suite-runs` and `build-records` as not tracked.
- **R-2744 and R-2745** (product-report, copying R-2545's cases: `historyFixture`, `commitAt`, fixed `GIT_COMMITTER_DATE`). For each store: the newest record in HEAD's history with its tip, UTC time, commits and whole days to HEAD's commit time; a newer record on a side branch HEAD does not contain is skipped; no readable record; no record in HEAD's history; a shallow clone. R-2745 adds: a start line with no end is skipped; an end line with no tip is skipped; an unreadable ledger (a folder in its place) gives its reason and the page still builds. Red on main: main shows "no artifact named" for both.

The assertions import every label and constant by name; none pins a count line.

## Tunables

- `LAND_REPORT_SUBPATH = "nana/product-report.html"`: exported beside `DEFAULT_OUT` in scripts/product-report.mjs; chosen, beside the other machine-local stores; pinned by R-2740's test. It stays out of land-config.mjs.
- The machine-local artifact map: frozen in scripts/deliverables.mjs; contract (R-2743); `runtime-map` from the runtime-map lane, the other two chosen as each store's file name without its extension; pinned by R-2743's test.
- Age labels and reasons: exported beside R-2544's in scripts/product-report.mjs, contract text pinned by R-2744 and R-2745: `newest record at tip`, `no readable record`, `no record names a commit in HEAD's history`, `the build ledger cannot be read`; the existing shallow-clone and history reasons are reused.
- The two land-note texts stay inline in test-locked.mjs, as its runtime-map notes do.
- Reused unchanged: `TIP_DIGITS`, `SECONDS_PER_DAY`, `BUILD_LEDGER_READ_MAX_BYTES`, `SUITE_RECORDS_KEEP`.

## Wrong-code pairs (each must turn a named test red)

The draft's pairs 1 to 19 (pair 20 drops with R-2746), plus: (21) the guard without the hand-measure check, caught by R-2741; (22) `path.join(cwd, ".git", …)` for the page path, caught by R-2740's worktree case; (23) the map exempts every name in it whatever the maker, caught by R-2743; (24) a plain `writeFile` with no rename, declared non-pair (no honest test can interrupt a write); (25) the newest suite record by time rather than in HEAD's history, caught by R-2744's side-branch case.

## Known limits (the seat writes them before the final round)

The draft's list, without the R-1014 own-age line and the non-atomic line, with: the refused-land page (S3, the seat's publish check); inner test runs rely on the runner's scrub of NANA_* variables (N1); about 1 to 2.6 seconds per land on macOS, unmeasured on Windows (N2); no time cap on the report build (N4); "Working tree: dirty" when the lane worktree has untracked files (N5); 32 of 41 deliverables show no age; and the FEAT-031 line on the 300-record retention.

## Docs and lines that change

As the draft's list, with: R-1014's land line without ` · product-report`; the R-1014 park line dated 2026-10-23 with the reason "only a Claude session can publish the owner's copy, and no code reads or acts on the page; a session-start line that reads the land page deletes this line"; the README and skill text naming `suite-runs` and `build-records` only; the README sentence on ages without the `product-report` clause; HANDOFF's queue line saying the seat publishes the land-written page after each land.

## Seat steps

1. Cut `feat/report-at-land` from main; commit this file, the draft, the attack, seat titles and build brief 1; brief-check; draft PR.
2. Build 1 with the larger builder: the whole lane.
3. Seat checks: escape check; seat titles; pairs; the six test files each alone; `npm run report` in the worktree shows 9 of 41 ages; tree check with no note; map, readme, trace, `requirements-moved --base main`.
4. Real-run check in a scratch clone of the tip: drive `runLocked` on the Windows path (injected) and on a linked worktree with a passing fake suite; open the page and check its commit and the two new ages.
5. Merge main after park-honestly lands (R-2730 then gates this lane's ledger lines); notes before the final round; CI on the draft PR; Opus on the exact tip; land. The land is the first real run: its output must carry `[nana-land] product report: wrote <page> for <tip8>`. The seat checks the page's commit against main and then publishes it.
