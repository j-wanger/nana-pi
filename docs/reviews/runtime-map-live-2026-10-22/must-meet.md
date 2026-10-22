# runtime-map-live · must-meet (seat and plan adversary, 2026-10-22)

Feature: FEAT-029 · Navigate code and investigate impact

Class: install, hook or gate (it changes `nana-land`, a land tool, and a test under `packages/nana-setup/`). Ladder: the final reviewer from another model family, the land reviewer, the seat's wrong-code pairs, one independent check, the macOS install check before the land, and the Windows CI leg. Builder: the roster's larger builder. Threat model: honest variation in scope — a land stopped mid-measure (any signal), a filtered or `--jobs` run, Windows, two worktrees running suites, a test that behaves differently under coverage, a land refused after its suite, a hand measure in a dirty worktree, old data with no tip; deliberate forgery out (a hand-set `NANA_LAND_TIP`, a hand-edited data file).

Rulings: the owner, 2026-10-22: a produced artifact is a feature to maintain, made by runs that already happen and read by real readers; closing that gap is the top priority. Inputs: the planner's draft (`plan-draft.md`) and the adversary's attack (`plan-attack.md`), both at main 08c33d94, and the deliverable audit of 2026-10-22.

## What changes for the user

Today the runtime map is made by hand and was measured twice in five days; builders read it 125 times this week and 71 of those reads were marked stale. After this lane every land measures it on the tip it lands, so main's map matches main after each land. A builder's impact read in a worktree marks stale only the tests that ran a changed file, and names how old the map is and how far main has moved since. The hand measure writes through the same path.

## Seat decisions (not the owner's call; each is reversible)

- **D1 · Scope: `narrow`.** This lane makes the map at each land and shows its freshness. Per-run records of every suite run, CI timing artifacts and the land's ledger line form the next lane, `suite-records` (FEAT-031 and FEAT-008), since they change the runner's R-1270 contract.
- **D2 · How a land measures: `env`.** `nana-land` puts the source tip's full SHA in its suite's environment as `NANA_LAND_TIP`; the locked suite measures when that names HEAD, inside the machine lock. `nana-land` stays generic: any suite command still works, and only the locked suite measures.
- **D3 · Data: `overwrite`.** One file in git's common dir, as today, gaining `tip` and `measuredAt`; schema 1 kept, so older readers ignore the fields and R-1276 holds.
- **D4 · Seconds: `none`.** Each land's coverage run gives both the ran sets and the seconds.
- **D5 · A coverage failure: `rerun-failed` (adversary M1, S2).** If the coverage run fails, the data is still written from it when its completion record matches, with each file's label as measured, so the map shows the failure. Then only the files that failed run once more without coverage, and that run's code decides the land. Each rerun file is printed as a land note. This mirrors the seat rule that a check failing on a time limit is re-run alone before it is called a failure; the note keeps it visible. Reversible: `trust` (the coverage verdict decides) is one constant away.
- **D6 · Land notes (adversary M1).** The locked suite prints every line the seat must see (rerun files, a write failure, Windows, a skipped measure) with one declared prefix, and `nana-land` prints those lines on success too. Today it shows only the push and release lines.
- **D7 · Freshness and per-entry staleness (adversary S1, S6).** Impact prints the measured tip, the UTC time, the age in whole hours and how many tracked files differ; when main is not the tip it says how far main has moved, or that the tip is not on main, and that the next land measures it. Staleness moves from the whole section to each measured test that ran a changed file, reusing the product report's existing rule (R-1513). R-1274 is retired for R-2534.
- **D8 · The hand measure (adversary M4).** `npm run map:measure` runs the locked suite's land path with HEAD as the tip, writes inside the lock, and stamps the dirty-file count, so following impact's advice keeps the freshness line. This also closes FEAT-029's two-at-once write.
- **D9 · Coverage-sensitive test.** `install.test.mjs`'s R-2498 check compares an env object's key count, and Node adds `NODE_V8_COVERAGE` under coverage; the check compares the keys it set instead. A test fix, no new row.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2522 | WHEN the land merge command runs the suite, it shall set `NANA_LAND_TIP` in the suite's environment to the source tip's full SHA. | `packages/nana-pack/tests/land.test.mjs::the land runs its suite with the source tip's full SHA in NANA_LAND_TIP` |
| R-2523 | WHILE `NANA_LAND_TIP` names the checkout's HEAD, WHEN an unfiltered locked run passes under coverage, the locked suite shall write the runtime data with that tip and the measurement time. | `packages/nana-pack/tests/runtime-land.test.mjs::a passing land suite writes runtime data naming the land tip and the time it measured` |
| R-2524 | WHILE `NANA_LAND_TIP` names the checkout's HEAD, IF the coverage run exits non-zero, THEN the locked suite shall write the data from it, rerun only the failed files once without coverage, and exit with the rerun's code. | `packages/nana-pack/tests/runtime-land.test.mjs::a land failing under coverage keeps its data and reruns only the failed files` |
| R-2525 | WHILE `NANA_LAND_TIP` names the checkout's HEAD, IF the coverage run passes and the runtime data cannot be written, THEN the locked suite shall exit 0, keep the earlier data and print one land note naming why. | `packages/nana-pack/tests/runtime-land.test.mjs::a passing land suite whose runtime data cannot be written exits 0, keeps the earlier data and names why` |
| R-2526 | WHERE the platform is Windows, WHILE `NANA_LAND_TIP` is set, the locked suite shall run the suite once without coverage and print one land note saying the runtime map was not measured. | `packages/nana-pack/tests/runtime-land.test.mjs::on Windows a land suite runs once without coverage and says the runtime map was not measured` |
| R-2527 | WHERE the platform is not Windows, WHEN the locked suite receives SIGINT, SIGTERM or SIGHUP during a land's coverage run, it shall remove the coverage folder, keep the earlier runtime data and exit non-zero. | `packages/nana-pack/tests/runtime-land.test.mjs::off Windows, a land suite stopped during its coverage run removes the coverage folder, keeps the earlier data and exits non-zero` |
| R-2528 | WHEN runtime data names a tip and a measurement time, the impact command shall print one line naming the tip's first 8 characters, the UTC time, the age in whole hours and how many tracked files differ from this checkout. | `packages/nana-pack/tests/runtime-map.test.mjs::impact names the measured tip, its UTC time, its age in hours and how many tracked files differ` |
| R-2529 | IF refs/heads/main is not the measured tip, THEN the impact command shall print one line saying how many commits main is past it or that it is not on main, and that the next land measures it. | `packages/nana-pack/tests/runtime-map.test.mjs::impact says how far main is past the measured tip, or that the tip is not on main` |
| R-2530 | WHEN the suite prints a line with the land note prefix, the land merge command shall print that line in its success output. | `packages/nana-pack/tests/land.test.mjs::a passing land shows its suite's land notes` |
| R-2531 | WHEN a land merges with the locked suite, the runtime data shall name main's new tip and match the main checkout's tracked files. | `packages/nana-pack/tests/land.test.mjs::after a land the runtime data names main's tip and is not stale` |
| R-2532 | IF the locked suite runs filtered, with a tip that is not HEAD, or fails with no tip set, THEN it shall start no coverage run, rerun nothing and leave the runtime data unchanged. | `packages/nana-pack/tests/runtime-land.test.mjs::filtered, wrong-tip and unset-tip runs neither measure nor rerun` |
| R-2533 | WHEN the measure command runs, it shall run the locked suite's land path with HEAD as the tip and write the tip, the time and the count of dirty tracked files inside the machine lock. | `packages/nana-pack/tests/runtime-land.test.mjs::a hand measure writes its tip, time and dirty-file count inside the lock` |
| R-2534 | WHEN a tracked file differs from its recorded hash, is untracked in the data, or is gone, the impact command shall mark stale only the measured tests that ran that file. | `packages/nana-pack/tests/runtime-map.test.mjs::impact marks stale only the measured tests that ran a changed file` |

R-1274 (the whole section marked stale) is retired, replaced by R-2534. R-1272 and R-1273 change text only if their tests need the freshness lines.

### What each test does, and why it is red on main

- **R-2522.** The real default runner with a node one-liner suite writing the variable to a temp file; the fixture's tip differs from main's SHA. Red: the variable is absent.
- **R-2523.** A fixture repository, a fake suite through `NANA_SUITE_TEST_COMMAND` writing records and a completion file, a temp lock and data file. Red: the variable is ignored; no data.
- **R-2524.** The fake fails one file only under coverage, then one file always; it logs each start, its knob and its files. Asserts the data written with the FAIL label, one plain start naming only that file, and the exit code of the plain run. Red: one start, no data.
- **R-2525.** Cases: no completion record, a count mismatch, an unwritable data path. Red: no coverage start, no note.
- **R-2526.** Platform injected, so it runs on every leg. Red: no note.
- **R-2527.** The fake records its knob folder, then sleeps; each of the three signals. A start also removes any coverage folder whose owner process is gone. Red: no folder recorded.
- **R-2528.** Clock injected, `measuredAt` five hours back, two files differing, so a constant age or count fails. Red: no line.
- **R-2529.** Three cases: main three commits past, a tip ahead of main (a refused land), a tip absent from the repository (a pruned branch), which reads "not on main", never a git error. Red: absent.
- **R-2530.** The fake prints one note and one other line; only the note appears on success. Red: success shows only push and release lines.
- **R-2531.** End to end in land.test's fixture with the fake suite: after `runLand` merges, the data's `tip` equals `refs/heads/main` and the main checkout shows no drift. Red: no data.
- **R-2532.** Three cases, the data compared byte for byte; the filtered case uses `--jobs=2`, which the locked suite reads as filtered (FEAT-031). Red on a build that measures any of them.
- **R-2533.** The hand measure in a fixture with one dirty file. Red: no tip.
- **R-2534.** A fixture with three tests, one of which ran the edited file. Red: every block marked stale.

## Tunables

- `LAND_TIP_ENV` "NANA_LAND_TIP" — contract (R-2522, R-2523).
- `LAND_NOTE_PREFIX` — contract (R-2530); chosen text.
- `UNMEASURED_PLATFORMS` ["win32"] — contract (R-2526); reason: FEAT-029's Windows path and stop bugs.
- `MAIN_REF` "refs/heads/main" — contract (R-2529).
- `COVERAGE_FAILURE_POLICY` "rerun-failed" — chosen (D5).
- `TIP_DIGITS` 8, the age in whole hours — chosen.
- Data fields `tip`, `measuredAt`, `dirty` — contract (R-2523, R-2528, R-2533); schema 1 kept.

## Known limits (carried to the feature files)

- A land refused after its suite passed leaves the map at an unlanded tip; R-2529 says so until the next land.
- The map's seconds are parallel seconds under load, and coverage adds about 27% to CPU-heavy files (FEAT-031).
- The plain rerun can pass a file that failed once under coverage; each one is printed as a land note.
- Windows lands never measure; Linux lands are untested by hand; CI never measures.
- Old data without a tip prints no freshness line.
- A land needs about 1 GB of temp space; a full disk fails the coverage run, and the rerun decides.
- Only the locked suite measures; a land with `--suite "npm test"` does not.

## Seat steps

- Two build sessions with the larger builder. (1) R-2522 to R-2527, R-2530 to R-2533, the install.test fix, the land path and the hand measure. (2) R-2528, R-2529, R-2534, R-1274's retirement, the README's map paragraph and the pack README's land section, the regenerated map and tree.
- Between sessions the seat runs a scratch land with a fake suite that fails one file only under coverage, and runs each new test with the coverage knob set (lands run them so).
- Wrong-code pairs: R-2522 drop the variable; R-2531 stamp main's old SHA; R-2532 measure a filtered run; R-2524 rerun every file, or rerun under coverage; R-2525 let a write failure exit 1; R-2530 drop the note echo; R-2533 a hand measure writing no tip; R-2528 a constant age; R-2534 mark the whole section.
- A draft PR runs the Windows leg. The notes carry the owner's 2026-10-22 ruling into the rulings file, reorder HANDOFF's queue (artifact lanes first) and close its Open ask on deliverable consumers. Reserve R-2522 to R-2534.

## Amendment after build 2 (the seat, 2026-10-22)

The Windows CI leg at dd9cbc4d failed 9 checks in 3 files (`ci-windows-dd9cbc4d.txt`). Two causes:

- **Test wrappers import a raw drive path.** The runtime-land test writes wrapper scripts that `import` the locked suite and the measure module by an absolute path; on Windows a `D:\…` path is not a valid import URL (ERR_UNSUPPORTED_ESM_URL_SCHEME), so every wrapper case fails. R-2527's check, titled "off Windows", runs on Windows and times out. R-2531's land test expects data that R-2526 says a Windows land never writes.
- **The hand measure stopped measuring on Windows (a regression of R-1278).** The measure command now runs the locked suite with the land tip set, and R-2526's Windows branch then runs the plain suite and writes nothing. On main the hand measure works on Windows (R-1278 passes on that leg), and impact's own advice is to run it. The current priority is nana working on macOS and Windows, so the hand measure must keep measuring there.

R-2526 changes text (the Windows rule applies to a land, not to the measure command):

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2526 | WHERE the platform is Windows, WHILE a land sets `NANA_LAND_TIP` and the measure command's marker is unset, the locked suite shall run the suite once without coverage and print one land note saying the runtime map was not measured. | `packages/nana-pack/tests/runtime-land.test.mjs::on Windows a land suite runs once without coverage and says the runtime map was not measured` (unchanged) |

The measure command sets a declared marker (`land-config.mjs`, contract R-2526 and R-2533), and its run measures on every platform as on main. R-1278 stays as it is and must pass on the Windows leg. R-2533's test gains a case with the platform injected as `win32` that still writes the tip, the time and the dirty count. R-2527's and R-2531's checks skip on Windows with one skip line each naming R-2526, since a Windows land never measures.
