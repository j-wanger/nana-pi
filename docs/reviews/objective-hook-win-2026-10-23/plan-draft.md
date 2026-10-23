# objective-hook-win · plan draft (planner, 2026-10-23, main dbb98cbb)

Feature: FEAT-013 · Install and connect harness runtimes (SUB-012 · Deliver commands, hooks and workflow resources)

Spend line: the owner's 2026-10-23 pick, "Objective hook on Windows". It serves the 10-24 line "every hook working on Windows". It closes FEAT-002's known bug on the objective hook's two missed 1,500 ms limits.

Stakes: medium blast, reversible. Every Claude Code session start on every machine runs the changed launcher. No settings entry, install step, doctor row or stored format changes. A revert restores main.

I mark every claim below as measured or inferred. Raw data and scripts: scratchpad `ohw-plan/` (`jobs.json`, `logs/all/`, `ic.json`, `suite.json`, `out-*.txt`; `fetch.mjs`, `extract.mjs`, `time.mjs`, `phases.mjs`, `scenarios.mjs`, `patch.py`, `pivis.mjs`; prototype and variant trees in `trees/`).

## What I measured, and what I corrected

Method (measured): every `ci.yml` run since 2026-10-21 00:00 UTC, all branches and attempts: 139 runs, 928 jobs. I pulled the logs of every finished Windows suite leg, every install-check leg on both systems, and 25 macOS suite legs: 457 logs. For each install check I took the time from its `hook set` line to each hook row. For each suite leg I took the file lines of the hook test files. A commit counts as "with frontier" when `git merge-base --is-ancestor c3cf37db <sha>` holds.

**Correction 1: neither failure had the frontier producer**. The install-check failure ran at 61ac64f3 (run 39840123612, attempt 1). The suite failure ran at 16c902c2 (run 39896736166, attempt 1). Neither commit contains c3cf37db, the commit that added the frontier producer. Measured. At 61ac64f3 the hook ran the objective producer alone (`git show 61ac64f3:packages/nana-setup/claude/hooks/nana-objective.mjs`). So the frontier block did not cause either miss.

**Correction 2: the install-check miss was a whole-runner stall, not the hook**. The install check starts every hook row at once (`packages/nana-setup/lib/install-check.mjs:443-490`, `Promise.all`). In the failing attempt (job 120038628289) every row ran 5 to 7 times its median over 145 Windows install checks. Measured:

| Row (Windows install check) | Median ms (n=145) | p90 | Failing attempt | Ratio |
|---|---|---|---|---|
| hook shared memory (one process) | 222 | 342 | 1,358 | 6.1 |
| hook roster notice | 231 | 358 | 1,553 | 6.7 |
| hook verifier pipe (PowerShell) | 387 | 473 | 1,918 | 5.0 |
| hook verifier pipe (Bash) | 384 | 488 | 2,157 | 5.6 |
| hook knowledge pull | 381 | 480 | 2,230 | 5.9 |
| hook adoption (two producers) | 488 | 555 | 2,785 | 5.7 |
| hook objective (FAIL) | 471 | 571 | 2,921 | 6.2 |

The same attempt also ran slow outside the hooks. pi-review (cmd) took 15.3 s against a 3.3 s median. pi-review (sh) took 16.1 s against 2.9 s. Doctor took 4.4 s against 0.8 s. Measured. The stall lasted at least 40 seconds. Its cause is unknown. Attempt 2 of the same run passed, with the objective row at 439 ms. Measured.

**Correction 3: the objective producer died at its own 1,500 ms limit, after a slow hook start**. The row's code was "unexpected", so stdout was not empty but failed the check (`install-check.mjs:470`). The objective row ended at 2,921 ms. The slowest one-process hook in the same attempt ended at 1,358 ms. 1,358 + 1,500 + about 60 ms matches 2,921. Inferred: the hook took about 1.36 s to start, then the launcher killed the producer at 1,500 ms. The adoption hook, two plain producers in a row, passed in the same stall at 2,785 ms (measured). So each of its producers stayed under 1,500 ms, and the objective producer did not (inferred).

**Correction 4: the suite miss is one of about 18,000 hook runs**. objective-golden runs the real hook through the real launcher 130 times per file (`packages/nana-pack/tests/objective-golden.test.mjs:119-131`; 130 "hook exits 0" lines in the log, measured). In run 39896736166 one case, T2c "untrusted folder, no trust.json", got `OBJECTIVE UNAVAILABLE: producer failed (D:\a\nana-pi\nana-pi\packages\nana-pack\bin\nana-objective.mjs)`. The file still took a normal 57.7 s (1,021 pass, 5 fail). Measured. So the stall was short. Which files ran beside it cannot be read from the log, because the runner prints files in order.

Rates since 2026-10-21 (measured):
- Windows install check, objective row: 1 failure in 145 attempts.
- Windows suite, objective-golden: 1 failing file in 138 legs, each with 130 hook runs.
- Only 1 of the 457 logs holds an `UNAVAILABLE: producer failed` line.
- Frontier producer: 0 failures in 23 Windows install checks and 22 Windows suite legs since it landed.

What the frontier producer costs (measured unless marked):
- Windows install check, objective row median: 466 ms without it (n=122), 537 ms with it (n=23). macOS: 281 to 327 ms.
- Windows objective-golden median: 42.4 s one file at a time (n=80), and 66.5 s four at once (n=36). Four at once with the frontier producer: 82.0 s (n=22). The 15.5 s rise over 130 hook runs is about 120 ms per extra producer start on a loaded runner (inferred).
- On all 14 local HANDOFF files (1.4 to 57 KB) the frontier producer takes 46 to 54 ms. Synthetic files: 500 items 65 ms, 2,000 items 157 ms, 5,000 items 542 ms. The square-of-items cost (FEAT-002 known bug) matters only far above real sizes.

Timings on this Mac (Apple M1 Max, Node 22.22.2, temp HOME, 20 runs each, medians; measured):

| Process | Median ms |
|---|---|
| `node -e ''` | 28 |
| objective producer | 87 |
| frontier producer | 45 |
| adoption producer | 36 |
| stale-copies checker | 49 |
| shared-memory hook | 35 |
| adoption hook (two producers) | 118 |
| objective hook (two producers) | 164 |

Where the objective producer's time goes (in-process marks, 3 runs; measured): Node is ready at about 16 ms. The `config.ts` and `objective.ts` imports end at 60 to 75 ms. The producer's own work takes about 2 ms. One tiny `.ts` file costs about 21 ms to import against 1 ms for `.mjs`, which is Node's TypeScript stripping. Node's compile cache does not help (42 to 49 ms without, 42 to 44 ms with). So the objective producer costs about twice a plain producer, and it is the first to cross a fixed limit.

Inferred Windows shape: the objective producer takes about 471 − 222 = 250 ms of its row. The frontier producer takes about 70 to 120 ms. At a uniform slowdown of k times, today's objective producer crosses 1,500 ms near k = 6. The one stall seen was 6.2.

**The real cause**. A stalled Windows runner slowed every process about 6 times. The objective producer is the heaviest producer, and its fixed 1,500 ms limit ignores how long the hook itself took to start. The limit could not simply rise: R-2013's arithmetic needs two producers in a row plus the hook's start under Claude Code's 5 s. Since 2026-10-22 both session-start hooks run two producers in a row. So the frontier producer used up the room a plain raise would need, but it did not cause either miss.

Other findings (measured):
- `packages/nana-pack/lib/config.ts:388` starts `import("@earendil-works/pi-coding-agent")` when the module loads. The objective producer imports `config.ts`. With pi unresolvable, as on CI and this machine, that costs 1 to 2 ms. With pi resolvable from a `node_modules` folder above the checkout, the producer took 463 to 758 ms. Without it, 84 to 91 ms. The output was identical.
- Node's clock starts about 13 ms after spawn here. A 1,500 ms `--import` preload shows as 1,517 to 1,519 ms of `performance.now()` when the main module runs.
- `spawnSync` with `timeout: 0` runs with no limit (a 2.5 s child ran 2,533 ms). A negative or fractional timeout throws `ERR_OUT_OF_RANGE`.
- `stale-copies.test.mjs:361` calls the launcher in-process late in an 8.6 s file, for R-1603. A deadline read from the calling process's clock by default would skip its injected run and print the marker anyway. The check would then pass for the wrong reason.

## Design

The hook gets one deadline from its own process start. Each producer gets the smaller of a raised cap and the time left. Two lines change in each hook, about eight in the launcher.

1. **Launcher: a limit from a deadline (`packages/nana-setup/lib/hook-producer.mjs:51-59`)**. `runHookProducer` gains two options, `deadlineMs` (default none) and `clock` (default `() => performance.now()`). It computes `limit = Math.min(HOOK_PRODUCER_TIMEOUT_MS, Math.floor(deadlineMs - clock()))`. When `limit` is 0 or less, it prints the marker and starts nothing. Otherwise it passes `timeout: limit` to `spawnSync`. Subtraction test: without the deadline, any cap above about 1,800 ms lets two hung producers pass Claude Code's 5 s. Variant v1 took 7,566 to 7,569 ms after a slow start. Without `Math.floor`, a fractional limit throws and the next producer prints its marker (v6). Without the skip, a zero limit means no limit (v3). Each line stays.
2. **Both hooks pass the deadline (`packages/nana-setup/claude/hooks/nana-objective.mjs:17-18`, `nana-adoption.mjs:17-18`)**. Each `runHookProducer` call adds `deadlineMs: HOOK_DEADLINE_MS`. The clock is Node's own, so the hook's start counts against it. Subtraction test: a deadline on by default would make in-process callers older than 4 s skip their injected run (R-1603 above). So only the two hook processes opt in.
3. **The cap rises from 1,500 to 2,500 ms**. Subtraction test: with the deadline alone, a healthy 2-second producer still dies at 1,500 ms (variant v5 fails R-2671). It stays.

The prototype (`ohw-plan/trees/proto`, macOS, 3 runs each; measured):

| Case | main | prototype |
|---|---|---|
| objective takes 2,000 ms, then a live frontier line | 0/3 (marker at about 1,570 ms) | 3/3, 2,099 ms |
| adoption takes 2,000 ms, then a live stale-copies line | 0/3 | 3/3, 2,098 ms |
| objective hook starts 2,500 ms late, both producers hung | 0/3, 5,543 to 5,575 ms | 3/3, 4,043 to 4,044 ms |
| adoption hook starts 2,500 ms late, both hung | 0/3, 5,548 to 5,574 ms | 3/3, 4,029 to 4,035 ms |
| R-2010 adoption hung, stale-copies live | 3/3, about 1.6 s | 3/3, about 2.6 s |
| R-2011 adoption both hung | 3/3, about 3.05 s | 3/3, 4,021 to 4,030 ms |
| R-2012 objective hung | 3/3, about 1.58 s | 3/3, about 2.57 s |
| R-2613 objective and frontier both hung | 3/3, about 3.05 s | 3/3, 4,018 to 4,040 ms |

The checkout's own `hook-deadlines.test.mjs`, run against the prototype tree, passes 4 of 4. Its `hook-producers.test.mjs` passes except R-2013's seal, as planned. Measured.

Inferred effect: in the observed stall the hook started in about 1.36 s. The objective producer would get 2,500 ms, needing about 1.5 s. The frontier producer would then get about 1.1 s, needing about 0.5 s. Both blocks print up to a slowdown of about 7 times, and the objective block alone up to about 8.5 times. Today the objective block fails near 6 times.

Dropped:
- **Run the producers side by side**. The frontier producer's `--max` needs the objective's length (R-2613's shared budget). An async launcher rewrites the R-687 test seam. It gives the objective producer no more time unless the cap rises too.
- **One process, the objective lib run inside the hook**. A synchronous hang cannot be cut without a child or a worker, so R-2012's marker is lost.
- **A per-platform limit**. Windows is exactly where two producers in a row must fit in 5 s. A larger Windows cap without a deadline fails R-2011 there.
- **Raise the installed `timeout: 5`**. That is an install change. Old installs keep 5 s, and a hook tuned for 10 s would lose all its output there.
- **Make the objective producer plain JavaScript**. It would save about 40 ms here. But `config.ts`, `objective.ts` and `gate-paths.ts` hold 1,595 lines with 37 importers, including pi's gate. The blast is far larger than the gain.
- **Stop the early pi import in `config.ts`**. It moves when pi's trust module loads for the gate's trust decisions. That is a gate lane (Open question 2).
- **Fix the frontier producer's square-of-items cost**. It costs 0 to 6 ms at every real size.
- **A "timed out" marker**. It changes R-687's byte-exact markers for diagnosis only.

## Class

Hook lane. It changes two Claude Code hooks and their launcher. The ladder:
- the roster's final reviewer (Opus) and the land reviewer (astra);
- the seat's wrong-code pairs and one independent check;
- the install check on macOS before `nana-land`;
- CI's Windows leg on the draft PR.

Builder: the small builder (`pi-worker --lane-size small`). The change is about ten product lines and two test files.

## Threat model

Honest variation in our tools' output and machine state is in scope:
- a hosted Windows runner whose every process runs 5 to 7 times slower for 40 seconds or more (seen once);
- four test files at once, and four session-start hooks at once in a real Claude Code start;
- a hook process that takes over a second to start (1,358 ms seen);
- a producer that is slow but healthy, or hangs in a wait a signal can end;
- two producers in a row in one hook;
- a test process older than the deadline that calls the launcher in-process;
- Windows 8.3 temp paths inside markers;
- pi resolvable from a folder above the checkout (measured; the fix is out of this lane).

Deliberate forgery is out:
- a producer that traps signals on purpose;
- a forged clock or preload in a real Claude Code start;
- a hand-edited `timeout` in settings.json.

A finding outside the model is a residual. The public repo carries no owner name and nothing about the owner's work. The plan counts sibling projects and never names them.

## Precedent

Precedent:
- docs/reviews/hook-deadlines-2026-10-20/must-meet.md — the 1,500 ms limit's design, its two-producers arithmetic, the copied-tree test shape and rows R-2010 to R-2013.
- packages/nana-setup/lib/hook-producer.mjs — `runHookProducer` with its injected `run` and `stdout`, and `HOOK_PRODUCER_TIMEOUT_MS` with provenance beside it (`:18-23`).
- packages/nana-knowledge/lib/hook.ts — the knowledge hook's own budget: `BUDGET_MS` (`:27`) and the injected `clock` and `budgetMs` options (`:134-138`). Follow its option names.
- packages/nana-setup/claude/hooks/nana-objective.mjs and nana-adoption.mjs — the two call sites; the objective hook already spreads `hookProducerConfig` and adds options (`:18`).
- packages/nana-setup/tests/hook-deadlines.test.mjs — copied hooks and libs, hung and live stubs, `installedLimit()` from `desiredHooks` (`:51-54`), the watchdog, the R-2613 case (`:106-121`).
- packages/nana-setup/tests/hook-producers.test.mjs — R-2013's injected runner reading `options.timeout` (`:22-33`).
- packages/nana-pack/tests/test-runner.test.mjs — `runForced` (`:671-680`): a preload passed with `--import` as a file URL, the pattern for the slow-start preload.
- docs/reviews/win-flake-hardening-2026-10-23/plan-draft.md — an injected slow schedule that fails main's code every run, and tunables with provenance.
- packages/nana-setup/lib/settings.mjs — the installed `timeout: 5` (`:202-203`), read in tests through `desiredHooks`.

Departures, each named:
- The cap rises although the hook-deadlines lane chose 1,500 ms. Its own arithmetic is kept and made exact by the deadline.
- The lane retires R-2013 rather than editing it. Its text names the old value and only three producers.

## Must-meet rows (FEAT-013, SUB-012)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2671 | WHEN a session-start producer exits 0 with output before its producer cap and its hook's deadline, the objective and adoption hooks shall print that output in place of the producer's unavailable marker. | `packages/nana-setup/tests/hook-deadlines.test.mjs::R-2671: the objective and adoption hooks print a producer's output when it takes 2 seconds, and the next producer's output after it` |
| R-2672 | IF a session-start hook takes LATE_START_MS to start and neither of its producers exits, THEN the hook shall print both producers' unavailable markers and exit 0 before its installed limit. | `packages/nana-setup/tests/hook-deadlines.test.mjs::R-2672: the objective and adoption hooks print both markers before their installed limit when they start 2.5 seconds late and both producers hang` |
| R-2673 | IF no whole millisecond is left before the caller's deadline when the launcher would start a producer, THEN the launcher shall print that producer's unavailable marker without starting it. | `packages/nana-setup/tests/hook-producers.test.mjs::R-2673: with no whole millisecond left before the deadline, the launcher prints the marker and starts no producer` |
| R-2674 | The hook producer launcher shall start each producer with a time limit of HOOK_PRODUCER_TIMEOUT_MS, or the whole milliseconds left before the caller's deadline when fewer. | `packages/nana-setup/tests/hook-producers.test.mjs::R-2674: each producer's limit is the cap, or the whole milliseconds left before the deadline when fewer, and the cap when no deadline is given` |

The seal test names R-2674 and R-2672. Its title: `packages/nana-setup/tests/hook-producers.test.mjs::seal: the producer cap is 2,500 ms and the hook deadline 4,000 ms, 1,000 ms under the installed limit`.

R-2013 becomes `retired` with `superseded by R-2674, 2026-10-23`. Rows go in SUB-012 directly after R-2015, each `untested` first, then `implemented` with backticked `file::title` evidence when its check passes. Add no heading. R-2010, R-2011, R-2012 and R-2613 keep their text and titles. R-2675 to R-2680 stay free.

### What each test does, and why it is red on main

Every case runs under `hook-deadlines`' or `hook-producers`' existing temp HOME, watchdog and copied tree. Each timing case prints one `note:` line with its elapsed ms, so CI's Windows legs record the margin.

- **R-2671**. Objective case: the objective stub waits `SLOW_PRODUCER_MS` on a timer, then prints a tagged live line. The frontier stub prints a live line at once. Adoption case: the adoption stub waits the same, and the stale-copies stub prints its live line. Assert exit 0 and stdout equal to both live lines, in order. A guard check asserts `SLOW_PRODUCER_MS < HOOK_PRODUCER_TIMEOUT_MS`, imported. Red on main: 0 of 3 for each hook; the marker prints at about 1,570 ms (measured with a busy-wait stub).
- **R-2672**. Run each hook with `--import <preload>`, as `runForced` does. The preload blocks for `LATE_START_MS` with `Atomics.wait`, so the hook's module starts late without a busy loop. Both stubs hang. Assert exit 0, stdout equal to both markers from the checkout's `hookProducerConfig`, and elapsed under `installedLimit()`. A guard asserts `LATE_START_MS < HOOK_DEADLINE_MS`. Red on main: 0 of 3 for each hook, 5,543 to 5,579 ms (measured).
- **R-2673**. Call `runHookProducer` with `deadlineMs: HOOK_DEADLINE_MS` and a clock reading `HOOK_DEADLINE_MS`, then `HOOK_DEADLINE_MS - 0.4`. The injected runner records any call. Assert no call and output equal to the marker. Red on main: main ignores both options and calls the runner with 1,500 (measured, U1).
- **R-2674**. The injected runner captures `options.timeout`. Cases: no deadline with a clock at 1e9 gives the cap. A deadline with the clock at 0 gives the cap, for each of the objective, frontier, adoption and stale-copies configs. A deadline with the clock at `HOOK_DEADLINE_MS - 1000.7` gives 1,000. Red on main: 1,500 in every case (measured, U2).

Existing tests the change touches (listed edits, not new tests):
- `hook-producers.test.mjs`: the seal and R-2674 replace R-2013's check (`:22-33`).
- `hook-deadlines.test.mjs`: R-2010, R-2011, R-2012 and R-2613 keep their checks; their elapsed rises about 1 s.
- `stale-copies.test.mjs` R-1603 and `objective-golden.test.mjs` do not change. The builder confirms both stay green.

## Tunables

| Name | Value | Where | Provenance |
|---|---|---|---|
| `HOOK_PRODUCER_TIMEOUT_MS` | 2500 (was 1500) | `packages/nana-setup/lib/hook-producer.mjs` | chosen 2026-10-23 (R-2674): the one measured Windows stall ran every hook about 6 times its median, and the objective producer then needed about 1.5 s (inferred, run 39840123612). 2,500 is about 1.7 times that. When the first producer hangs, the second still gets about 1.5 s minus the hook's start (R-2010 kept, measured 2.6 s). Sealed. |
| `HOOK_DEADLINE_MS` | 4000 | same | contract and chosen 2026-10-23 (R-2672): Claude Code's installed `timeout: 5` (`settings.mjs:202`) minus a chosen 1,000 ms. The 1,000 covers process creation before Node's clock (13 ms here), the kill of a hung producer, the marker writes and exit. Hooks ended 16 to 44 ms after the deadline on this Mac (measured). Sealed, with its 1,000 ms gap to the installed limit. |
| `SLOW_PRODUCER_MS` | 2000 | `packages/nana-setup/tests/hook-deadlines.test.mjs` | chosen 2026-10-23: above main's 1,500 ms and 500 ms under the cap, so main fails every run (measured). Fixture constant, not sealed. |
| `LATE_START_MS` | 2500 | same | chosen 2026-10-23: main's two hung producers then end past 5 s every run (5,543 to 5,579 ms, measured). It is under `HOOK_DEADLINE_MS`, so the hook still starts its first producer. About 1.8 times the slowest hook start on CI (1,358 ms). Not sealed. |

Module headers to update:
- `hook-producer.mjs`: `@inputs` names the deadline and the clock. `@errors` names no time left.
- Both hooks: `@inputs` names the hook deadline.
- The two test files: `@purpose`, and `@effects` for the preload.

## Wrong-code pairs (the seat runs each; each must turn its test red every run)

All nine ran on this Mac, 3 runs each, against variant trees in `ohw-plan/trees/` (measured):

1. The hooks pass no deadline, so the 2,500 ms cap stands alone → R-2672 (7,542 to 7,569 ms, 0 of 3 per hook). It also turns R-2011 (5,042 to 5,044 ms) and R-2613 (5,050 to 5,077 ms) red.
2. No cap, only the deadline → R-2010 (0 of 3: the stale-copies line is lost) and R-2674. R-2012 also goes red: the frontier producer gets no time.
3. The limit clamped to 0 and passed through → R-2673 (the producer starts with timeout 0, so no limit). R-2672 also fails: 0 of 3, cut by the 15 s watchdog.
4. The deadline counted from a clock read when the launcher module loads → R-2672 (6,530 to 6,566 ms, 0 of 3 per hook).
5. The cap left at 1,500 → R-2671 (0 of 3 per hook) and R-2674.
6. No `Math.floor` on the limit → R-2671 (0 of 3: the second producer prints its marker), R-2673 and R-2674. R-2010 and R-2012 go red too.
7. The launcher's default deadline is `HOOK_DEADLINE_MS` instead of none → R-2674's no-deadline case (no producer starts).
8. The objective hook passes the deadline to its first producer only → R-2672 (6,530 to 6,543 ms, 0 of 3).
9. Either value changed → the seal.

No pair is Windows-only. Pair 1's R-2011 and R-2613 margins are about 50 ms, so R-2672 is that pair's real guard. The Windows leg runs every new check, and its `note:` lines give the real margin.

## Windows notes

- `spawnSync`'s time limit ends the direct child with TerminateProcess on Windows. R-2011's Windows passes since 2026-10-20 show it works for these producers (measured: 0 failures in 138 legs).
- Node's clock starts after process creation. On Windows that gap is not measured. The 1,000 ms reserve covers it.
- The preload goes in as a file URL, as `runForced` does on every leg; a bare Windows path is not a valid `--import` specifier.
- `Atomics.wait` blocks the preload without spinning a CPU on a four-file runner.

## Known limits (the seat writes them to the named known-bug files before the final round)

- FEAT-013: tolerance, not immunity. A stall above about 7 times still loses the frontier block, and above about 8.5 times the objective block (inferred). One stall of 6.2 times was seen in 145 Windows install checks.
- FEAT-013: a hung producer now holds a session start longer: one hung producer about 2.5 s (was 1.5), two about 4.0 s (was 3.0).
- FEAT-013: a hook's second producer gets only the time left. After a 2.5 s hang, that is about 1.5 s minus the hook's start.
- FEAT-013: the both-hung checks' margin to the installed 5 s falls from about 2 s to about 1 s (4,018 to 4,044 ms here). `hook-deadlines` is not on the run-alone list (Open question 1).
- FEAT-013: the deadline is not tied to the installed timeout by name. `settings.mjs` writes `timeout: 5` as an inline literal that also marks nana's entries. The seal pins the 1,000 ms gap instead.
- FEAT-001: the objective producer pays Node's TypeScript stripping on every start, about half its time here.
- FEAT-001: with pi resolvable from a folder above the checkout, the objective producer loads all of pi before it exits (`config.ts:388`). It then took 463 to 758 ms here, against 84 to 91 ms. CI and this machine do not resolve pi (Open question 2).
- FEAT-001: objective-golden's comment at `:127` still says the hook has a 10 s child timeout. It is cosmetic.
- FEAT-013: the existing line "a producer stopped at the limit prints the same failed line as one that crashed" stays.
- CI re-runs cannot prove the rate fell. The proof is the injected slow producer, the late start and the pairs.

## Not verified

- The stall's cause. Every step of that install check ran about 5 times slower for 40 seconds or more.
- The objective producer's own time on Windows. The 250 ms figure subtracts two install-check medians.
- That the launcher killed the producer at the limit, rather than the producer crashing. The install check does not print the hook's stdout. The timing fits a kill.
- Node's spawn-to-clock gap and the post-deadline cost on Windows.
- Any prototype case on Windows. Every probe ran on this Mac.

## Docs that change

- `packages/nana-setup/README.md:34`: each session-start producer runs at most 2,500 ms. A hook's producers end 4,000 ms after the hook starts, under Claude Code's 5 s limit. The sentence on waits no signal ends stays.
- `REQUIREMENTS.md`: R-2671 to R-2674 in FEAT-013 SUB-012 after R-2015; R-2013 retired.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated.
- Known bugs, in the reviewed change before the final round:
  - FEAT-002: close line 53, the objective hook's two missed limits. In line 48, "cuts it at 1.5 s" becomes "cuts it at the launcher's limit".
  - FEAT-013: line 93 ("the limit is 1.5 seconds per producer…") takes the new numbers. So does line 96 ("the hook ends in about 3 seconds…"). Add the FEAT-013 known limits above.
  - FEAT-001: add its three known limits above.
- HANDOFF Landed line and the session entry.
- Unchanged: settings entries, install, uninstall, doctor, the install check, every producer, objective-golden, the frontier block, R-687's markers.

## Seat steps

1. Cut `feat/objective-hook-win` from main. It shares no file with win-flake-hardening. A lane that edits the hook launcher or `hook-deadlines` merges main after whichever lands first.
2. Run one adversary pass on this draft. Commit the must-meet of record and build brief 1. The brief carries `Feature: FEAT-013 · Install and connect harness runtimes` and a Precedent section. Run `brief-check.mjs` on it.
3. Build with the small builder: `pi-worker --lane objective-hook-win --brief … --out … --lane-size small`.
4. Seat checks on the build tip:
   - the touched and nearby files: `hook-producers`, `hook-deadlines`, `stale-copies`, `frontier-hook`, `hooks-closed-output` and `objective-golden`;
   - `npm run test:locked`, `map:check`, the readme check and the trace;
   - `node scripts/requirements-moved.mjs --root . --base main`, carried into the review brief and the land.
5. Run pairs 1 to 9 through the mutation runner.
6. The independent check, then `node packages/nana-setup/bin/install-check.mjs` on macOS.
7. Push a draft PR. Read the Windows leg's `note:` lines for R-2011, R-2613 and R-2672. If any ends past 4,500 ms, take Open question 1's other branch.
8. Write the notes before the final round. Run the final reviewer and the land reviewer on the exact tip.

## Open questions to the owner

1. **Put `hook-deadlines` on the run-alone list?** The both-hung margin falls to about 1 s. Run alone, the file costs about 20 s more per leg (inferred: 10.5 s today plus about 10 s of new cases). Default: **no**, unless the draft PR's Windows `note:` lines pass 4,500 ms.
2. **The early pi import in `config.ts`**. It costs 1 to 2 ms today, but about 5 times the producer's time when pi resolves from a folder above the checkout. The fix moves when pi's trust module loads for the gate, so it is a gate lane. Default: **later**.
