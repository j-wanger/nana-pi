# shared-helpers · plan attack (adversary, 2026-10-22, main 3bbb0662)

Read-only pass over `shared-helpers-plan-draft.md`. Scratch probes live in `scratchpad/shp-attack/`. No tracked file was edited and no suite was run. Every claim below says whether I measured it or inferred it.

## Summary

I found no material finding. The kill-helper contract matches all six copies it replaces, line for line, apart from the changes the plan already names (C1a, C1b, C2, C4, C5). The layer rule allows the chosen home. The extension can import the helper the same way it already imports three `../lib/*.mjs` modules. The install relay and the Windows shims run from the checkout, so a new import cannot strand an installed copy. The row range is free everywhere, and every precedent path is tracked.

The plan has gaps the builder will hit. None of them breaks the feature:

- Four more existing tests go red on the new imports, and the plan lists only R-2568's check. These are test-runner, suite-records, runtime-map and review-standard. Each copies a fixed list of lib files into a fixture.
- Two behaviours stay unpinned: pi-watchdog's extra off-Windows signal and the relay's direct-child fallback. The plan's own adapter rule ("no platform branch, no kill call") tells the builder to remove them.
- R-2661 has no positive control. A broken regex still passes at a clean tip.
- Pair 21 expects R-2582 to go red, but R-2582's check is a substring match and stays green.
- The plan never says how to run pairs "on main's runner". The runner finds its repository from the table file's own location.
- The new preamble line lets a builder move a private helper out of any file. That includes a gate-class file in an ordinary lane, the frozen desk, and the content-pinned bench modules.
- The plan's Windows pins are partly wrong. R-2300 and R-2303 never run the relay's taskkill; R-2023 does. R-963 would turn red at 15 s, not hang.

## Findings

### M (material)

None.

### S (should change)

**S1. Four more tests break on the new imports. The plan names only R-2568's check.** (measured by reading; the mechanism is probed)
- `packages/nana-pack/tests/test-runner.test.mjs:55-66` (`mkRoot`) copies `scripts/test.mjs` plus five named lib files.
- `packages/nana-pack/tests/suite-records.test.mjs:453-462` (`runnerFixture`) copies the same five.
- `packages/nana-pack/tests/runtime-map.test.mjs:69-75` (MM2) and `:510-522` (MM9) write the runner and a fixed lib list into fixture repos. These fixtures pin R-1271 and R-1278.
- `packages/nana-pack/tests/review-standard.test.mjs:64-68` copies `bin/` whole but only five lib files. It then runs `pi-review.mjs` from that copy. pi-review imports pi-watchdog (B5) and review-round (A2), and both gain a lib import.
- `test-runner-parallel.test.mjs:32-35` builds its list from the runner's double-quoted `from "../packages/nana-pack/lib/X.mjs"` imports. So that test keeps working only if the new import uses exactly that form.
- `claude-review.test.mjs:279`, `post-edit-values-named.test.mjs:43`, `post-edit-default-timeout.test.mjs:47` and the nana-setup checkout tests copy whole directories. They are unaffected.
- Probe: I copied `scripts/test.mjs` with one added import of `../packages/nana-pack/lib/process-tree.mjs`, plus test-runner's five lib files, into `shp-attack/root`. Output: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../root/packages/nana-pack/lib/process-tree.mjs' imported from .../root/scripts/test.mjs`.
- Fix: list all five copy sites under "Existing test the change makes false", and require the double-quoted import form in `scripts/test.mjs`. These tests are R-912/R-915's home and the MM2/MM9 runtime-map rows. The builder must add the new module to the copy lists, not delete fixture checks.

**S2. The adapter rule contradicts three of the six adapters, and the behaviours it would drop are unpinned.** (measured by reading)
- Design says: "An adapter holds no platform branch, no `kill` call and no taskkill."
- But B5 keeps `child.kill(signal)` off Windows (`pi-watchdog.mjs:168-170`). B1b keeps its win32 return (`bounded-spawn-child.mjs:96`). B1 and B2 pass a `child.kill` closure as the fallback.
- Known limits admit that no test pins B5's extra signal or B1's fallback. A builder who follows the general sentence instead of the per-consumer bullets removes them, and nothing goes red. That is the same "simplify a kill" failure that runtime-map-live builds 5 and 6 hit (`docs/reviews/runtime-map-live-2026-10-22/build-brief-6.md:7`).
- Consequences, inferred:
  - Without B5's direct signal, a failed group kill leaves `runOnce` waiting on `child.once('close')` at `pi-watchdog.mjs:233` and `:240`.
  - Without B1's fallback, a denied Windows taskkill leaves pi running past install's limit.
- Fix:
  - Reword the rule to "an adapter holds no taskkill and no group signal". Name the three kept pieces explicitly.
  - Add a wrong-code pair per kept piece, with expectRed empty and declared as kept by reading. Or add a unit seam, as R-644 does for post-edit (see S11).

**S3. R-2661 has no positive control and none of the line-reading cases the preamble requires.** (measured by reading)
- The test scans the real repository only. At a clean tip it passes vacuously if the regex regresses. Pairs 17 to 19 prove the regex once, at one tip, and never again.
- The named precedent works differently. identity-scan runs `scanTree({ root, config })` on temporary git trees with planted hits (`identity-scan.test.mjs:25-30`, `:85-90`).
- The builder preamble also requires CRLF, trailing-whitespace and no-final-newline cases for any change that reads text line by line (`builder-preamble.md`, Tests).
- Fix: make the scan a function. Run it on a planted temp tree first, then on the repo. The planted tree holds:
  - a `spawn("taskkill"` line, a `` `taskkill `` template line and a `kill(-pid` line;
  - a `.ts` file;
  - comment lines that must be skipped;
  - a CRLF file and a file with no final newline;
  - an exception path.
- Add a pair: the regex matches nothing. The planted case must then go red.

**S4. Pair 21 names the wrong test.** (measured by reading)
- `preambleOnce` is `preambleText.includes(line)` with a count of one (`worker-lane.test.mjs:363`).
- If the builder merges the new sentence onto the end of R-2582's line, `RULE_LINE.precedentFirst` is still a substring, so R-2582 stays green.
- R-2662 goes red only if `RULE_LINE.reuseNotCopy` starts with the `- ` bullet prefix.
- Fix: expectRed is R-2662 alone, and the plan states that the new RULE_LINE carries the `- ` prefix. Otherwise the pair reports a mismatch that the seat cannot read.

**S5. The procedure for running pairs on main's runner is missing.** (measured by reading)
- `runMutations` takes its repository from `git rev-parse --show-toplevel` in the table file's own folder (`mutation-runner.mjs:147-150`, `:800-801`).
- Seat tables import the runner relatively (`docs/reviews/runtime-map-live-2026-10-22/seat-mutate.mjs:7`). Run from the lane worktree, the committed table loads the lane's runner and the lane's `killPid`.
- Putting the table in `~/nana-pi` dirties main's checkout, and nana-land refuses a dirty main.
- Fix: name the step. One way, inferred to work: make a detached worktree of main, put an untracked copy of the table at the same relative path, and run it with `SEAT_MUTATE_TIP=<lane tip>`. The tip resolves because worktrees share one object store. Record which runner judged in the table header.

**S6. The reuse line widens a builder's scope with no limit.** (inferred)
- "If it is private, move it to a shared module that both callers import" lets a builder edit a Precedent file the brief never named. Three bad outcomes follow:
  - An ordinary lane can silently become an install, hook or gate lane, because AGENTS sets the class by the files changed. The ladder, pairs and install check are then picked for the wrong class.
  - Moving a helper out of `apps/desk/server.mjs` breaks the desk freeze (ruling 2026-10-10).
  - Moving one out of `apps/bench/lib/nested.mjs`, `eval-module.mjs` or `ext/bench-nested-usage.ts` changes a closed study's `pinnedSha`. The runner then "refuses to spend if either hash moves" (`apps/bench/studies/tool-profiles-2026-09-08/study.json:29-35`, `:117`).
- The review standard's MUST list does not include this, so it is S. But it is the lane's own deliverable.
- Fix:
  - Builder line: "import it; never copy it; when it is private and the brief does not name the move, report the departure and stop."
  - Ruling: "the plan names the move in its Precedent section."
  - Moving a helper then stays a planning decision, and the class is chosen with it.

**S7. The plan names the wrong Windows pins.** (measured by reading; Windows outcomes inferred)
- R-2300 and R-2303 (`pi-launch-limits.test.mjs:449-487`) kill install, or the relay itself, with SIGKILL. The tree ends through Windows' kill-on-close job, and the relay's `killTree` never runs.
- B1's Windows taskkill runs through R-2023 instead (`:274-283`): the relay deadline calls `killTree` at `bounded-spawn-child.mjs:160-164`. R-2023 has no win32 skip, and the file shows 13 pass and 5 skip on the Windows leg of CI run 39889605742.
- The plan's expected-wrong claim, tested: R-963 does not hang. `run` uses `spawnSync(..., { timeout: 15000 })` (`worker-lane.test.mjs:72-74`). The stub's grandchild lives 30 s (`:645`). A broken taskkill therefore gives `status === null` and a live descendant at 15 s, so both R-963 kill checks go red.
- worker-lane runs on the Windows leg: 64 pass, 1 skip, and the skip is the git-wrapper case (measured from the CI log).
- So R-963 does pin C2 on Windows, as a red check.
- Fix: put R-2023 in the Windows list. Describe R-2300 and R-2303 as job-object pins. Change "would hang" to "goes red at 15 s".

**S8. The pid guard accepts 1, and `kill(-1)` signals every process the user owns.** (measured: `node -e` shows `kill(-0, 0)` reaches the caller's own group; POSIX gives -1 the same meaning for all permitted processes)
- The plan guards against 0 on exactly this reasoning, but a raw-pid caller can also pass 1. B4 reads `running.pid` at `mutation-runner.mjs:402-404`.
- No caller ever owns pid 1. B4 has the same exposure today, so this is not a regression.
- Fix: a shared helper should require pid > 1. R-2658 adds 1 to its bad-pid list, and a pair accepts 1.

**S9. "Never throws" must cover the fallback inside the no-wait listeners.** (inferred)
- The plan's B2 adapter passes `(s) => child.kill(s)` with no try.
- Today post-edit wraps `direct()` in try/catch (`nana-post-edit.ts:118-124`).
- If the helper calls the fallback bare inside its `error` or `close` listener, any throw becomes an uncaught exception in pi's process, not a blocked tool.
- A throw from `child.kill` is unlikely with constant signals, so this is S.
- Fix: the helper wraps every fallback call in both forms. R-2657 adds a fallback that throws in the `close` path and expects no uncaught exception.

**S10. Three must-meet cases are narrower than their rows or the plan's own text.** (measured by reading)
- R-2656's test injects only one form ("The pid 4321 call records..."), but the row covers "the shared tree kill". The no-wait form's POSIX branch is post-edit's and the bench's path. Run both forms.
- R-2657's real Windows case asserts only that both pids are gone afterwards. Add the precondition R-1700 uses (`post-edit-hardening.test.mjs:258-265`): both pids were alive before the kill. Otherwise a parent that never started its child passes.
- R-2659 never passes `delay: undefined` explicitly. `refreshWorkingRegion` forwards an undefined `delay` (`project.mjs:242` signature, `:315-317` call). The only R-986 case injects a delay (`project-working-region.test.mjs:228-238`). If the helper does not default on an explicit `undefined`, every real Windows retry becomes a TypeError, and the refresh reports skipped. Add the case.

**S11. The planner missed the nearest precedent for a consumer wiring check.** (measured)
- R-644 (`post-edit-hardening.test.mjs:497-501`) checks that post-edit "imports the shared resolver and defines no local resolver". It is a per-consumer source check: the import is present and no local copy is defined.
- That shape pins consumer wiring more tightly than the repo-wide regex. It is the natural home for the S2 pins.
- Name it in Precedent beside identity-scan.

**S12. The Precedent list is about 515 KB, roughly 130k tokens.** (measured with `cat ... | wc -c` over the 19 named files; the token count is inferred)
- The preamble says "read every file ... before designing".
- `packages/nana-pack/README.md` (122 KB) is named for one Behavior-notes entry. `review-ledger.test.mjs` (103 KB) is named for the R-2568 block at about `:460-495`.
- Fix: the brief names line ranges, so the builder's context holds the brief rather than the corpus.

**S13. The owner's numbers versus what the lane delivers.** (measured by reading the plan)
- The owner's pick says "replace 3 and 8 copies". The lane replaces 2 rename copies, because the third is a lock-wait classifier, and 6 of 8 kill copies, keeping the frozen desk and runtime-measure's walk.
- The reasons are sound: the desk freeze is a ruling, and R-1277 and R-2527 guard B7.
- The plan of record and the report should state "2 of 3, 6 of 8, and why" in their first lines, so the owner reads it as a correction rather than a shortfall.

### N (notes)

- **N1. The row range is free.** (measured) R-2644 to R-2664 appear nowhere on main, in any local or remote branch (`git grep` per ref), in any `~/nana-pi-wt/*/REQUIREMENTS.md`, or in any other plan draft in `scratchpad/lanes/`. The highest IDs: main R-2628, ci-timing-records R-2638, park-deliverables R-2643. The parity must-meet uses R-2646 to R-2654 and leaves R-2655 free.
- **N2. Every precedent path is tracked at main.** (measured) All 20 paths pass `git ls-files --error-unmatch`.
- **N3. The layer rule and load path hold.** (measured)
  - `code-map.config.json` has two layers. `apps/` and `scripts/` may import `packages/`, and imports inside `packages/` are free.
  - The bench already imports `packages/nana-setup/lib/pi-pin.mjs` (`apps/bench/lib/pi-exports.mjs:49`).
  - 14 nana-setup modules import `nana-pack/lib/*`, and 7 extensions import `../lib/*.mjs`. post-edit itself imports three (`nana-post-edit.ts:33-42`).
  - A static relative import needs no `pathToFileURL`. That lesson applies to dynamic `import()` of a raw Windows path, so it matters only if the new tests import modules by path.
- **N4. Install-path copies are safe.** (measured)
  - The relay runs from the checkout (`bounded-spawn.mjs:23`).
  - Windows PATH shims `exec node <checkout file>` (`win-shims.mjs:33-55`).
  - Only skills are copied rather than linked (`steps.mjs:305-311`, `copyInstead`).
  - nana-setup imports pi-watchdog through `pi-invocation.mjs:9`, so install loads `process-tree.mjs` from the checkout too.
- **N5. Windows coverage of each changed call.** (CI run 39889605742, Windows suite job; counts measured, case-level mapping inferred from skip guards)

  | Changed call | Windows-leg test that runs it |
  |---|---|
  | B1 `killTree` | R-2023 |
  | B1b | none, by design |
  | B2 | R-1700, R-1820, R-1701 (post-edit-hardening: 17 pass, 6 skip; the skips are POSIX-only cases) |
  | B3 | test-runner's IPC cases R-912 and R-915 (47 pass) and every Windows suite timeout |
  | B4 | R-1233 (runs on Windows; R-1234 is POSIX-only) |
  | B5 | R-963 (above) and the watchdog-exit and watchdog-cpu interrupt paths |
  | B6 | bench `timeout.test.mjs` (12 pass) |
  | A1, A2 | injected cases on every leg, plus R-2568's real rename |

- **N6. taskkill without cmd.exe.** (measured indirectly)
  - B1, B3 and B4 already call `spawnSync("taskkill", …)` with no shell and pass on Windows CI.
  - R-1701 shows that `spawnSync("taskkill", ["/?"])` with PATH set to node's folder gives ENOENT on Windows (`post-edit-hardening.test.mjs:292-298`; the check passes on CI). So the lookup reads PATH and does not fall back to SystemRoot.
  - The repo's own note says Node's Windows lookup tries `.com`/`.exe` only (`worker-lane.test.mjs:604-606`).
  - cmd.exe also needs System32 on PATH, and no test stubs taskkill with a `.cmd` (grep of tests).
  - Inferred: C2 changes nothing about what the environment needs.
- **N7. C4 confirmed on macOS.** (measured) `spawn` of a missing command emits `error:ENOENT` then `close:-2` (`shp-attack/spawn-missing.mjs`, Node v22.22.2). So post-edit's fallback fires twice today, and the lane's once-only fallback is harmless.
- **N8. The scan prototype output matches the plan.** (measured) `node <scratch>/shp-plan/scan-proto.mjs <repo>` lists exactly nine files: bench `run.mjs`, desk `server.mjs`, pi-watchdog, post-edit, mutation-runner, bounded-spawn-child, runtime-measure, test-locked and test.mjs.
  - `apps/desk/test` and `apps/bench/test` sit under app roots but are dropped as `layerExempt`. Without that filter, `ops.test.mjs:71`, `changes-endpoint.test.mjs:681-683` and `prompt-detach.test.mjs:109-111` would trip the scan.
  - Today nothing outside the nine files trips it. One honest false positive to add to known limits: a group liveness probe written `process.kill(-pid, 0)`.
- **N9. One value pinned twice.** After the move, `TASKKILL_ARGS` is pinned by R-1244's check (`mutation-runner.test.mjs:1162`) and by the new seal. The standard says one pin. `TREE_KILL_EXCEPTIONS` is test policy, yet the plan puts it in a production kill module. A test-local constant or a root config, as identity-scan does, keeps the helper runtime-only.
- **N10. R-2662's "on its own line" is wider than an `includes` test.** This copies R-2582's existing pattern. Carrying the `- ` prefix in the RULE_LINE (S4) narrows the gap.
- **N11. The rulings cap holds.** (measured) The rulings file is 3,313 bytes against `RULINGS_READ_CAP` 8,192 (`rulings.test.mjs:122`). One more line cannot hit the over-cap marker.
- **N12. Overlap with lanes in flight.** (measured with `git diff --name-only main...<branch>`)
  - feat/build-records edits `review-ledger.test.mjs`, the home of R-2660.
  - session-start-frontier edits `hook-deadlines.test.mjs`, which does not matter here.
  - The parity overlap on pi-watchdog and worker-lane is already ordered in the plan.
- **N13. Split.** One lane is right. The ordinary half still contains the mutation runner, which judges its own pairs, and `project.mjs`, which needs the install check. Lane 1 would also ship the fallback mode with no caller.
  - The cheapest de-risking is the pins in S2, S3 and S10, not a second ladder.
  - The rule lines could land alone first. They also touch `worker-lane.test.mjs`, which parity edits, so they wait for parity either way.
- **N14. Kill sites the plan left out.** (measured) `project.mjs:470-476`, the knowledge extension at `:129`, `install-check.mjs:148`, and desk `apps.mjs` and `changes.mjs` kill only a direct child. They are not tree kills, so leaving them out is right.

## Class

Install, hook or gate. The class is correct by AGENTS' definition:
- `nana-post-edit.ts` is a pi extension.
- `review-round.mjs` is a named review tool.
- `bounded-spawn-child.mjs` is install's and doctor's pi launch relay, and nana-setup also imports pi-watchdog.
- The lane touches `packages/nana-setup/`, so the macOS install check is required.

The ladder in the plan is the right one: final reviewer, land reviewer, wrong-code pairs, one independent check, macOS install check, Windows CI leg.

Two exposures go beyond the usual gate lane:
- The lane changes the suite runner's own kill (B3). Every `npm run test:locked` on the lane tip runs the lane's kill on the seat's machine, so a broken B3 leaks processes there. The runner's self-test (R-912) is the guard, inferred.
- The lane changes the pair runner's own kill (B4). S5's procedure is what keeps the pairs judged by main's runner.

## Plan sections I would change

1. **"Existing test the change makes false"**: add test-runner `mkRoot`, suite-records `runnerFixture`, runtime-map MM2 and MM9, and review-standard's lib list. Require the double-quoted `from "../packages/nana-pack/lib/…"` form in `scripts/test.mjs` (S1).
2. **Design §Parts 1**: guard pid > 1 (S8). Wrap every fallback call, listeners included (S9). Pin `stdio: "ignore"` to match B1 to B4.
3. **Design, adapter sentence**: "no taskkill and no group signal". List B1b's win32 return, B5's off-Windows `child.kill` and the B1 and B2 fallback closures as kept by name (S2).
4. **Must-meet tests**:
   - R-2656 exercises both forms.
   - R-2657's real case gets an alive-before precondition and a throwing-fallback case.
   - R-2658 adds pid 1.
   - R-2659 adds an explicit `delay: undefined`.
   - R-2661 becomes a scan function run on a planted temp tree (S3, S8, S9, S10).
5. **Wrong-code pairs**:
   - Pair 21's expectRed becomes R-2662 only, with the `- ` prefix stated (S4).
   - Add: a regex that matches nothing, which reddens the planted tree; the guard accepting 1; a fallback throw escaping a no-wait listener.
   - Declare the S2 pieces as kept by reading, or pin them R-644-style.
6. **Wrong-code pairs, run line**: say how to run on main's runner. Use a detached main worktree holding an untracked table copy, and record the runner in the table header (S5).
7. **Windows**: R-2023 is B1's pin. R-2300 and R-2303 are job-object pins. R-963 goes red at 15 s and does not hang (S7).
8. **Design §7 (rule)**: the builder line forbids copying and stops on an unnamed move. The ruling puts the move in the plan's Precedent section (S6).
9. **Precedent**: add R-644 (`post-edit-hardening.test.mjs:497-501`). Give line ranges for the README entry and the R-2568 block (S11, S12).
10. **Spend line and report**: say "2 of 3 rename copies and 6 of 8 kill copies, with reasons" first (S13).
11. **Known limits**: add the group liveness probe false positive (N8). Add that `TASKKILL_ARGS` is pinned in two places until R-1244's check drops it (N9).
