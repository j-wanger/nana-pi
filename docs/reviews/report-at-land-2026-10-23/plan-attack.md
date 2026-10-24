M1 · A hand measure (`npm run map:measure`) writes the land page from a dirty, unreviewed tree, and prints it with the land prefix. Measured.
M2 · R-1014's `product-report` "age" is only the page's own commit. Nothing ever shows the land maker as dead, and the age count goes from the slate's 9 of 41 to 10. Measured.
S1 · The prototype turns R-2525's existing runtime-land test red (`2 !== 1`). Measured.
S2 · The widened set exempts names, not makers. A misplaced `suite-runs`, `build-records` or `product-report` gets the wrong store's age with no note, and park-honestly's R-2730 then makes this check the suite gate. Measured.
S3 · A land refused after its suite has already replaced the page with an unlanded tip, and the refusal hides the note. Inferred.
S4 · The tests need a linked-worktree case. Real lands always run from one, and the `.git/...` and `--git-dir` wrong implementations pass main-checkout fixtures. Measured.
S5 · Four sketched rows claim more than their tests can check: "on macOS, Linux and Windows", "on Windows the page says why", a negative test that also passes on main, and reasons the readers cannot tell apart. Rerun-pass also belongs in row 1. Partly measured.
S6 · Reuse: the prototype copies git-common-dir resolution a third and fourth time. The age code should be one function the ci-runs lane can extend. Measured.

The attack file was not written. The Write tool refuses report files from subagents, so the full attack text is below. The plan draft also never existed: I checked from 20:46 to 21:08 EDT with a 2-second poller. So this attack targets the planner's prototype, `<scratch>/report-at-land/prototype.diff` (20:42), plus the slate's report-at-land and report-ages entries. If the draft already fixes an item, mark it resolved.

---

# report-at-land · plan attack (the one adversary, 2026-10-23)

Feature: FEAT-039 · See the product and its decisions in one report. Main at c273b4de.

## Basis and method

- I made a read-only `git clone --no-hardlinks` of main at `<scratch>/report-at-land/attack/full`.
- The prototype is applied there on branch `proto` (ae585021). A linked worktree sits at `attack/wt-lane`.
- The clone's `.git/nana` holds copies of the real stores: 83 suite records, the build ledger and the runtime map.
- TMPDIR and NANA_SUITE_LOCK_DIR pointed into scratch.
- Nothing was written in the repo, any lane worktree, ~/.claude, ~/.pi or ~/.nana. I made no model calls.
- The repo is still clean at c273b4de.
- Outputs: `attack/proto-*.out`, `attack/main-*.out`, `attack/page-*.html`, `attack/drive.mjs`, `attack/ages.mjs`.

## MUST

**M1 · A hand measure writes the land page, from a dirty tree, with the land prefix.**

- **What I did:** drove the prototype's `runLocked` the way `npm run map:measure` does. runtime-measure.mjs:294 sets `NANA_LAND_TIP=HEAD` and `NANA_RUNTIME_HAND_MEASURE=1`. I used a passing fake suite and a dirty README on darwin.
- **What happened (measured):**
  - Exit 0, and the run printed `[nana-land] product report: wrote <clone>/.git/nana/product-report.html for ae585021`.
  - The page's provenance says `"clean":false`.
  - The prototype's coverage-path guards (`coverageCode === 0`, `finalCode === 0`) never check HAND_MEASURE_ENV. Only the Windows branch excludes hand measures (test-locked.mjs:232), and a win32 hand measure falls through to the coverage path anyway.
  - The planner's bench (`run-locked.mjs`) deletes the hand-measure variable, so it never tried this case.
- **Why it matters:**
  - `npm run map:measure` is a documented command (README "Product report" paragraph; R-2533).
  - Run in a lane worktree, it overwrites the one stable page the seat publishes after each land. That page then shows an unreviewed tip and "Working tree: dirty".
  - This breaks the slate's own sentence: "a filtered, non-land or failing run writes nothing".
- **Change:**
  - Write only when the run is a land by the suite record's own test: no filters, `HAND_MEASURE_ENV` unset, `tip === HEAD`, deciding code 0.
  - Lift today's inline trigger in `finishSuiteRecord` (test-locked.mjs:186) into one exported predicate. The record trigger and the report write both call it, per the 2026-10-22 rule that a second caller imports.
  - Add a hand-measure case to the negative test through R-2533's `HAND_WRAPPER` precedent, asserting the seeded page stays byte-identical.

**M2 · The `product-report` artifact's age is the page's own provenance, so R-1014's land maker can never show as dead, and the count is inflated.**

- **Measured counts:** main shows 7 of 41 deliverables with an age. The prototype shows 10 of 41.
  - Two of the three new ones come from real records: R-2547 (newest suite record) and R-2597 (newest build end line).
  - The third is R-1014's `this page: built from ae585021 committed …`. A special case in `buildReport` (`artifact === "product-report"`) prints it from the page's own `commit` and `date`, the same values as the page header. No record is read.
  - The slate claimed "9 of 41".
- **Why it matters:**
  - The checker exempts the name, and the age comes from the page being built. Neither can ever report that the land write stopped.
  - If a later change breaks the write, R-1014 keeps `land: … · product-report`, the page still says "built from", and R-2730 stays green.
  - That makes an unmeasured age read as covered, which is a status-honesty harm.
- **Change:**
  - Drop `· product-report` from R-1014's land line, from the set and from the age code.
  - R-1014 keeps "no artifact named", and the plan claims 9 of 41.
  - A real age later would read the stored land page at `<git common dir>/nana/product-report.html` from a hand `npm run report`. That is a follow-up.

## SHOULD

**S1 · R-2525's test breaks.**

- **Measured:** runtime-land.test.mjs passes every check on main. On the prototype it fails "a passing land suite whose runtime data cannot be written … names why" with `2 !== 1`.
- The cause is a second note: `product report not written: ENOENT … REQUIREMENTS.md`, from a fixture that has no ledger.
- test-locked and suite-records tests stay green on the prototype (measured).
- **Change:** the plan names the test edit (count only `runtime map` notes). It forbids the wrong fix of skipping the report silently when REQUIREMENTS.md is missing.

**S2 · The exemption works by name, not by maker.**

- **What I did:** added three lines to the prototype ledger:
  - `Made by: R-2632 · CI: .github/workflows/ci.yml, scripts/test.mjs · suite-runs`
  - `Made by: R-1460 · manual: … · product-report`
  - `Made by: R-1239 · manual: … · build-records`
  - plus a control line naming `not-a-real-store`
- **What happened (measured):**
  - The tree check printed one note, for the control only.
  - The page gave R-2632 the local suite store's age, though CI records never enter suite-runs.
  - It gave R-1460 "this page: built from…", and gave R-1239 the build ledger's age.
- **Context:**
  - The same hole exists today for `runtime-map` (deliverables.mjs:130), and the prototype triples it.
  - Park-honestly's R-2730 turns this check into a suite gate.
  - The CI copy error is a likely honest mistake: CI writes the same record schema, and land-ci-timings plans a `ci-runs` store (its D10).
- **Change:** replace the frozen list with a frozen map from each name to its maker run and writer path.
  - `runtime-map` → land, scripts/runtime-measure.mjs
  - `suite-runs` → suite, scripts/test-locked.mjs
  - `build-records` → build, packages/nana-pack/lib/build-records.mjs
  - The ci-runs lane adds its own entry.
  - The checker notes any mismatch, and the report reads ages from the same map (T6).

**S3 · A land refused after its suite has already replaced the page (inferred from nana-land.mjs:163-189, not reproduced).**

- **Order today:** the suite, and with it the page write, runs before the second review check, the "main HEAD changed during suite" check, the "source tip changed" check and the merge.
- A refusal returns only `refused: …` (:200), so the seat never sees the page note.
- **Power-mode sequence:**
  1. B's nana-land captures main.
  2. B waits on the machine lock while A lands.
  3. B's suite writes B's page.
  4. B is refused because main moved.
- The slate concedes this risk by pointing to the runtime map, but this page goes to the owner.
- **Change, either:**
  - **(a)** add a seat step: before publishing, check that the page's embedded commit equals `git rev-parse main`. Declare the limit in FEAT-039's known-bugs file.
  - **(b)** write `<common>/nana/product-report/<tip>.html` with a keep cap, and have the success note name that exact file.

**S4 · Add a linked-worktree case.**

- **Measured:** from `wt-lane` the prototype correctly writes `<clone>/.git/nana/product-report.html`. In that worktree, `--git-dir` is `<clone>/.git/worktrees/wt-lane`.
- Two wrong implementations pass main-checkout fixtures but fail every real land:
  - `path.join(cwd, ".git", …)` hits ENOTDIR, because `.git` is a file in a linked worktree. The land then only prints a note.
  - `--git-dir` writes into the worktree's private folder, which `nana-land cleanup` deletes.
- **Change:** T1 includes a run from `git worktree add` and asserts the common-dir path. Precedent: R-1278.

**S5 · The sketched rows claim more than their tests can check.**

1. "On macOS, Linux and Windows": tests can only inject `platform`. Say "on the measured path and the Windows path (injected)".
2. "On Windows … the page says why": the report cannot know the land skipped the map. It prints the stored map's own age or "no runtime data" (product-report.mjs:242-260). Drop the clause or restate it.
3. The negative row passes on main. Put a passing-land control in the same check (R-2532 precedent), and add the hand measure plus both failing shapes: `always-fail` and `whole-run-fail`.
4. Row 1 must name the deciding code. Rerun-pass (finalCode 0, :280-296) must write; this is skeptic correction 4.
5. report-ages lists "no records" and "unreadable folder" as separate reasons. `readSuiteRecords` returns `[]` for both (suite-records.mjs:114-129, read from the code). Narrow the reasons to what the readers can tell apart, or change the reader and add a row.

**S6 · Reuse.**

- `writeLandReport` and the build-records branch are the third and fourth copies of `--git-common-dir` resolution, after `dataPath` and `suiteRecordsDir`. Import one helper, and name the move under Precedent.
- In the build-records branch, a failed rev-parse resolves to the worktree root, so the code reads `<worktree>/nana/build-records.jsonl`.
- land-ci-timings D10 plans `readSuiteRecords({ root, subpath })`. Make the age code one function keyed by the S2 map, so the ci-runs lane adds one entry instead of a third branch.

## NOTE

- **N1 · Inner test runs.** Safety rests on the runner's NANA_* scrub.
  - Measured: run directly with `NANA_LAND_TIP=HEAD`, test-locked.test.mjs's inner runs (`cwd: REPO`) wrote the real page, and the file took 22 s instead of 11 s on main.
  - Through `node scripts/test.mjs`, which scrubs every NANA_* variable, there was no write and the file took 5.5 s.
  - Real lands go through the runner. Declare this dependence.
- **N2 · Cost** (measured on idle macOS, inside the machine lock):

  | Case | Main | Prototype |
  |---|---|---|
  | 83 suite records | 1.10–1.24 s | 1.38–1.60 s |
  | 332 suite records (just over the 300 keep cap) | 0.83–0.89 s | 1.82–2.64 s |

  The prototype parses every record. A walk over file names newest first could parse only the first record in HEAD's history.
- **N3 · SIGTERM.** A SIGTERM during the report build becomes exit 0 (inferred: the prototype returns the suite code without re-checking `stopping`).
- **N4 · No time cap.** The report runs in-process with no cap, and nana-land's suite spawn has none either, so a hung git call hangs the land. Thrown errors are caught (measured via the ENOENT note).
- **N5 · "Dirty" flag.** The land page says "Working tree: dirty" whenever the lane worktree has untracked files.
  - Measured: park-honestly has two untracked files with tracked files clean, and nana-land accepts that.
  - The report uses `--untracked-files=normal` (:526).
- **N6 · Non-atomic write.** `generateReport` uses a plain `writeFile` (:698). The precedents use a temporary file then rename. "Earlier page byte-identical" needs that pattern.
- **N7 · Counts move.** After park-honestly lands, its count is `18 of 23, 18 parked`, and R-1014's park makes it `18 of 22, 19 parked`. The prototype over main gives `16 of 32, 9 parked` with 0 notes (measured). Pin no count from main.
  - The build age skips unlanded builds (measured: newest end 521016cc skipped). Name that rule in the row.
- **N8 · Docs.** The README's Product report paragraph needs a sentence on the land page. HANDOFF item 4 shrinks to "republish after each land". DEFAULT_OUT stays a second, hand-made copy. Every report run, main included, prints a harmless MODULE_TYPELESS warning to stderr (measured).

## Wrong implementations → catching test

"Slate" says whether the slate's five tests would catch it (inferred from their wording).

| # | Wrong implementation | Caught by | Slate |
|---|---|---|---|
| W1 | Guard without the hand-measure check (the prototype) | T2 | no |
| W2 | Writes only on plain coverage pass, not rerun pass | T1 | no |
| W3 | Writes only on the coverage path, not the Windows branch | T1 | yes |
| W4 | Writes on a failing suite | T2 always-fail and whole-run-fail | partly |
| W5 | `cwd/.git/nana/…` | T1 worktree case | no |
| W6 | `--git-dir` instead of `--git-common-dir` | T1 worktree case | no |
| W7 | Report error changes the exit code or escapes as a rejection | T3 | yes |
| W8 | Report error swallowed with no note | T3 | yes |
| W9 | Note without the prefix | T4 (relay already pinned by land.test.mjs) | yes |
| W10 | Page built before the map or before `finishRecord` | T7 | partly |
| W11 | Oldest record taken | T5 | no |
| W12 | No history check (measured: `rev-list --count <lane tip>..main` gives 0; 3 of 72 real record tips, including the newest, are outside main) | T5 side-branch record | no |
| W13 | Build age from start lines | T5 | no |
| W14 | Days from `Date.now()` instead of HEAD's commit time | T5 fixed GIT_COMMITTER_DATE | no |
| W15 | Exemption by name only (the prototype) | T6 | no |
| W16 | Self-provenance as R-1014's age (the prototype) | M2 removes it; T5 asserts "no artifact named" | no |

## Proposed must-meet set (seven, one row each)

- **T1** · A land with deciding code 0 writes the page for HEAD at `<git common dir>/nana/product-report.html`. One check covers coverage pass, rerun pass, the win32 branch, a linked worktree, and a refused map write.
- **T2** · Filtered, no-tip, wrong-tip, hand-measure, always-fail and whole-run-fail runs leave a seeded page byte-identical. The same check holds a passing-land control.
- **T3** · If the report refuses (no ledger) or the write fails (the target is a directory), exactly one `[nana-land] product report not written: <reason>` line prints and the exit code is the suite's own.
- **T4** · On success, exactly one prefixed line names the absolute path and HEAD's first TIP_DIGITS characters.
- **T5** · `suite-runs` and `build-records` show the newest record in HEAD's history: tip, time, commits to HEAD, and whole days to HEAD's commit time. Otherwise they give a reason the reader can tell apart. R-1014 shows no age.
- **T6** · A machine-local name draws a note unless the maker run and a code path match. The R-1272, R-2547 and R-2597 lines draw none.
- **T7** · A measured land's page shows the map at HEAD with 0 commits and the suite store's newest record at HEAD.

## What main does today, against the prototype (measured)

| Check | Result on the prototype |
|---|---|
| Tree check | 0 problems, `16 of 32 made and read by code, 9 parked`, 0 notes |
| Readme check | 0 problems |
| product-report tests (planner's run) | 82 PASS, 0 FAIL |
| requirements-tree tests (planner's run) | 96 PASS, 0 FAIL |
| test-locked tests | pass |
| suite-records tests | pass |
| runtime-land tests | R-2525 FAIL (S1) |
| Map check | stale, as expected |
| Land suite record and map write | unchanged; the page is written after both |
| `npm run report` | still writes DEFAULT_OUT |

**Claim most likely wrong:** S3's back-to-back land sequence. I inferred it from reading the code and did not reproduce it.