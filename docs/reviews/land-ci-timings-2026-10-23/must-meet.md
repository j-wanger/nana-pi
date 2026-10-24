# land-ci-timings · must-meet of record (seat, 2026-10-23)

Feature: FEAT-008 · Integrate and clean up reviewed changes

Written by the seat from the planner's draft (`plan-draft.md`) and one adversary pass (`plan-attack.md`), both kept in this folder. Plans get no review round. Where this file and the draft differ, this file holds.

The owner's decision, 2026-10-23, from the seat's artifact slate: "Land keeps CI timings (Recommended)": after a CI-checked land, nana-land reads the tip's CI suite records, keeps them beyond GitHub's 90-day retention, and acts on slow files. It reverses the CI-records half of HANDOFF's former "Two planned-lane defaults" ask, whose remaining half park-honestly renamed "A copier project's drift line".

Spend line: the current priority (since 2026-10-23), appetite clause 3: suite and CI timings kept; and R-2632's reader moving from a person to code (clause 1).

Stakes: medium blast, reversible. The step runs inside every CI-checked land, after the merge. A throw that escaped its guard would print `refused:` for a land that already merged; an unbounded gh call would hang a land. R-2755 and R-2756 pin both.

## Seat decisions on the attack

- **M1 adopted.** The CI-record reader downloads with a host-qualified repository (`github.com/<owner>/<repo>`), as nana-land's CI read already pins `--hostname github.com`. R-2750's test presets `GH_HOST` to another host, and its stub fails any download whose repository lacks the `github.com/` host while `GH_HOST` is set (measured gh behaviour). ci-records.test.mjs's fake learns the host-qualified form, with one reader-level assertion on the download arguments.
- **M2 adopted.** No `Made by: R-2632 · land:` line and no `ci-runs` artifact name: the land copies CI's upload, it does not make it. R-2632's reader becomes code (nana-land and the new lib, which judge every file against its limit). The store is recorded honestly as a FEAT-008 known-bug line: no code reads its history yet. This lane no longer depends on report-at-land's machine-local artifact map; listing the store as its own deliverable is a later, small lane.
- **S1 adopted.** A call starts only while at least 1 ms of the budget remains; its limit is `Math.min(CI_READ_TIMEOUT_MS, Math.ceil(remaining))`. nana-land's default gh runner raises an error for a per-call limit that is not a positive integer, never "no limit". R-2756 gains an equality case and a fractional case and asserts every limit is an integer of at least 1; one cross-platform case drives the default runner with a fractional limit and an empty PATH and expects an error result, not a throw.
- **S2 adopted.** R-2750's test logs the git calls and an injected release-status read and asserts the containment check and the release-status read both come before the first records call. A negative case: a CI-green land whose suite fails makes exactly one gh call.
- **S3 adopted, with N1.** The store name passes `${run}-${leg}-${attempt}` through `storeSuiteRecord`'s existing `pid` option (no new suffix option); the only new store option is the folder. R-2751's state holds four artifacts (two macOS attempts, two legs sharing one creation second), asserts each exact name, and runs the second keep under another pid.
- **S4 adopted, by the spy route.** One land injects a `keepLandCiRecords` spy and asserts it receives `CI_RECORDS_KEEP`, `CI_RECORDS_BUDGET_MS` and `CI_SLOW_SHARE` by name; the lib's prune is tested directly with a small keep.
- **S5 adopted.** The one `CI records` note names the budget when the read stopped at it. nana-land guards both the call and the formatting of its result: a malformed result is one note (case f). Each record is stored under its own guard and failures aggregate into one note (`CI records not kept: <k> of <n>: <reason>`); a case with one of three artifacts at an unparseable time keeps two.
- **S6 adopted.** Test boundaries derive from the imported names (`CI_SLOW_SHARE` times the record's limit, `CI_READ_TIMEOUT_MS`, the injected budget); only the seal test names the values.
- **S7 adopted.** R-2755 is narrowed to what prints a note: no record read, a storing failure, a spent budget, a throw or a malformed result. A partial download failure prints the reader's lines and no note (a known limit).
- **N2 adopted** (the note drops the reader's own `ci record:` prefix). **N5 adopted** (R-2753 names the default per-file limit). **N7 adopted** (the cap case puts the slowest files last in record order). **N8 adopted** (the store name stays in prose in READMEs). **N3, N4, N6, N9** become known limits or brief notes; the deliverable claim is marked inferred from R-2547's precedent.
- **Open question 1, decided by the seat: 4,000.** About 100 days at the measured rate, past GitHub's 90 days, about 78 MB in the clone's git folder (inferred). It is a sealed, chosen tunable the owner can retune; it is not the owner's call because it costs only local disk and changes no behaviour he sees. **Question 2:** moot after M2. **Question 3: split.** The new tests go in `packages/nana-pack/tests/land-ci-records.test.mjs`; land.test.mjs's fixture helpers move to `packages/nana-pack/tests/land-fixtures.mjs`, imported back. **Question 4: FEAT-031** for R-2753.
- **Class: a land tool** (nana-land changes): the final reviewer (Opus), the land reviewer (astra), the seat's pairs and one independent check. No local install check (no nana-setup or hook file changes). **Builder: the larger builder, one session.**

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2750 | WHEN CI applies to a land and the land's post-merge containment check and release-status read have finished, nana-land shall read the source tip's CI suite records through the CI-record reader, after the review-ledger lock is released, with every gh call in the land's colour-safe gh environment and naming github.com as its host, and print each line the reader returns in its success output. | `packages/nana-pack/tests/land-ci-records.test.mjs::R-2750: after the merge, its containment check and outside the ledger lock, the land reads the tip's CI records from github.com in its gh environment and prints the reader's lines` |
| R-2751 | WHEN nana-land reads a CI suite record, it shall store that record, with the source tip, run id, attempt, leg, event and artifact creation time added, in the `CI_STORE_SUBPATH` store under the clone's git common directory, under a name that one artifact always maps to, and never in the local suite-record store. | `packages/nana-pack/tests/land-ci-records.test.mjs::R-2751: each CI record read at a land is kept once in the clone's ci-runs store with its tip, run, attempt, leg, event and time, never among local suite records` |
| R-2752 | WHEN nana-land stores a CI suite record, the CI record store shall keep only the newest `CI_RECORDS_KEEP` records by artifact creation time. | `packages/nana-pack/tests/land-ci-records.test.mjs::R-2752: the ci-runs store keeps only the newest CI_RECORDS_KEEP records` |
| R-2753 | WHILE `NANA_SUITE_RECORD_FILE` names a file, the test runner's run record shall carry the default per-file time limit, in milliseconds, that the runner applied. | `packages/nana-pack/tests/test-runner.test.mjs::R-2753: the run record names the default per-file time limit the runner applied` |
| R-2754 | IF a CI suite record that nana-land reads lists a non-SKIP file whose seconds reach `CI_SLOW_SHARE` of that record's per-file time limit, THEN nana-land shall print one land note naming the file, its seconds, the record's platform, leg, run id and attempt, and its share of the limit, at most `SLOWEST_LIST_MAX` notes per record, slowest first. | `packages/nana-pack/tests/land-ci-records.test.mjs::R-2754: a land notes each CI file at or above its share of the record's own per-file limit, slowest first and capped` |
| R-2755 | IF the CI-record reader reads no record, storing a record fails, the read stops at its budget, or the step throws or returns a malformed result, THEN nana-land shall print exactly one land note starting `CI records` naming the cause and still report the land with exit 0. | `packages/nana-pack/tests/land-ci-records.test.mjs::R-2755: a CI-record failure after the merge is one land note and the land still succeeds` |
| R-2756 | WHILE nana-land reads a landed tip's CI records, it shall start no gh call once less than 1 ms of `CI_RECORDS_BUDGET_MS` remains since the read's first gh call, and give each call it starts a whole-millisecond time limit of at least 1 and at most the smaller of `CI_READ_TIMEOUT_MS` and the budget's remainder. | `packages/nana-pack/tests/land-ci-records.test.mjs::R-2756: the CI-record read starts no gh call past its budget and gives each call a whole-millisecond limit within the time left` |

Plus one seal test with no row of its own, naming R-2751, R-2752, R-2754 and R-2756: `packages/nana-pack/tests/land-ci-records.test.mjs::seal: CI records are kept in nana/ci-runs up to 4000, files are noted at half their limit, and the read stops after 60 seconds`.

Rows R-2750 to R-2752 and R-2754 to R-2756 go in FEAT-008; R-2753 in FEAT-031 beside R-2546. Each goes in `untested`, then `implemented` when its check passes. R-2757 to R-2759 stay free.

### What each test does

The draft's "What each test does" holds, with these changes: R-2750 presets `GH_HOST` and asserts the order against the containment call and the release-status read, plus the failing-suite negative (S2, M1); R-2751 holds four artifacts and asserts exact names and a second keep under another pid (S3); R-2752 uses the spy and a direct small-keep case (S4); R-2753 expects the fixture's `NANA_TEST_TIMEOUT_MS` value as a number (N5); R-2754 derives its boundaries from `CI_SLOW_SHARE` and puts the slowest files last for the cap case (S6, N7); R-2755 gains case f (a malformed result) and the unparseable-time case (S5), each asserting exactly one `[nana-land] note: CI records` line; R-2756 derives limits from `CI_READ_TIMEOUT_MS` and the injected budget, adds the equality and fractional cases, asserts one note naming the budget, and adds the default runner's fractional-limit case (S1).

### Existing tests made false

R-2588's one-gh-call assertion, R-2590's tip-only count and R-2591's `calls.length === 1` count every gh call in a green land. Narrow each to the calls made before the suite, keeping each row's text and title; R-2591's POSIX fake gh appends its records so its case asserts the first call. The seat checks with `requirements-moved` that no title changed. Existing CI-green land fixtures take the "no CI run" path after this lane (their runs carry no workflow path); the new file covers the success path.

## Tunables

As the draft's, with `CI_RECORDS_KEEP` 4,000 decided by the seat (above). Every tunable carries its provenance beside its definition and is sealed by the seal test.

## Wrong-code pairs

The draft's pairs 1 to 18 and the attack's 19 to 30, with pair 7 now fully caught (S3) and pair 25 caught by the spy (S4).

## Known limits (the seat writes them before the final round)

The draft's list, with: the store has no code reader of its history (M2); a partial download failure prints reader lines and no note (S7); a scaffolded project on GitHub whose workflow uploads no record gets one `CI records not read` note on every land (N3); the slow-file note is advice, and counting it as a code reader is inferred from R-2547's precedent (N4); a rename over an open file on Windows becomes one "not kept" note (N9).

## Docs and lines that change

As the draft's list, with: no `Made by: R-2632 · land:` line; `Read by: R-2632 · code: packages/nana-pack/bin/nana-land.mjs, packages/nana-pack/lib/land-ci-records.mjs` replaces the person line; no HANDOFF ask edit (park-honestly already renamed it); the store name in prose in both READMEs.

## Seat steps

1. Cut `feat/land-ci-timings` from main after park-honestly lands; commit this file, the draft, the attack, seat titles and build brief 1; brief-check; draft PR.
2. Build 1 with the larger builder.
3. Seat checks: escape check; seat titles; pairs 1 to 30; the land-ci-records, land, ci-records, suite-records and test-runner test files each alone; tree check with no note; map, readme, trace; `requirements-moved --base main`.
4. Independent check: run `keepLandCiRecords` against one real tip from a scratch copy, with `GH_HOST` set and unset, and compare the stored files with `node scripts/ci-records.mjs <tip>`.
5. Notes before the final round; CI on the draft PR; Opus and astra on the exact tip; land with the worktree's own nana-land (its first real read is this lane's own pull-request run). Record the read's real time, the kept count and any notes in the land report.
