# objective-hook-win · must-meet of record (seat, 2026-10-23)

Feature: FEAT-013 · Install and connect harness runtimes (SUB-012 · Deliver commands, hooks and workflow resources)

Written by the seat from the planner's draft (`plan-draft.md`) and one adversary pass (`plan-attack.md`), both kept in this folder. Plans get no review round. Where this file and the draft differ, this file holds.

Spend line: the owner's 2026-10-23 pick, "Objective hook on Windows". It serves the 10-24 line "every hook working on Windows".

Stakes: medium blast, reversible. Every Claude Code session start on every machine runs the changed launcher. No settings entry, install step, doctor row or stored format changes. A revert restores main.

Cause, as measured: neither Windows failure involved the frontier producer (both failing commits predate it). A stalled Windows runner made every hook 5 to 7 times slower than its median for at least 40 s; the objective producer, the heaviest, was cut at its fixed 1,500 ms after its hook took up to about 1.36 s to start. Rates: 1 of 145 Windows install checks, 0 of 146 on macOS.

## Seat decisions on the attack

- **Design as the draft.** Each session-start hook passes one deadline on its own process clock, `HOOK_DEADLINE_MS` = 4,000; each producer's limit is the smaller of `HOOK_PRODUCER_TIMEOUT_MS` = 2,500 (was 1,500) and the whole milliseconds left; with none left the launcher prints the marker and starts nothing. The deadline is an option only the two hooks pass.
- **M-1 adopted.** R-2671's check adds a case: each hook started `LATE_START_MS` late, both producers live, stdout equal to both live lines (green on main, so the check stays red on main through its slow-producer half). Pair 10 added. The brief says `deadlineMs` is a point on the process clock, not a budget.
- **S-1 adopted.** `SLOW_PRODUCER_MS` is 1,700, and the slow stub schedules its print from its own clock (`SLOW_PRODUCER_MS - performance.now()`), so a slow stub start is absorbed.
- **S-2 adopted.** R-2010's text narrows to print the stale-copy checker's output "while time is left before the hook's deadline"; its test and title stay. R-2012 and R-2613 stay true as written.
- **S-3 adopted: no floor for the second producer.** The objective block matters more. The known limit states the trade as it is: the new design keeps the objective block from about 6× to 8.5× slowdown and loses the frontier block from about 8.5× to 11×, where main kept it.
- **S-4 adopted.** The R-2672 preload writes `performance.timeOrigin` to a file before it waits; the check's detail and one log line give the time before Node's clock and the time after the deadline. The seat reads them on Windows (seat step 7); if either passes about 300 ms on any Windows run, the seat lowers `HOOK_DEADLINE_MS` (for example to 3,500) in a build round instead of only moving the file to the run-alone list. A `node` shim and cold start join the FEAT-013 known limit.
- **S-5 adopted.** R-2672's row and the README speak of the hook's own process clock and the 1,000 ms left for process start and exit.
- **S-6 adopted.** Provenance: the objective producer needed "at least 1.5 s (it was stopped there)"; the deadline's 16 to 44 ms past-deadline cost is "macOS only; Windows not measured"; the 1.36 s hook start is an upper bound.
- **N-1 adopted.** R-2673's check adds a clock reading at `HOOK_DEADLINE_MS + 1`.
- **N-2 adopted.** The options are `deadlineMs` and `clock`, the clock defaulting to `performance.now()`; the departure from the knowledge hook's relative `budgetMs` and `Date.now` is named.
- **N-4 adopted.** `docs/known-bugs/FEAT-015.md`'s 1.5-second line joins Docs that change.
- **N-6 adopted.** The two fixture guards sit inside their must-meet check's condition; no other new check prints.
- **Class: hook lane.** Opus final reviewer, astra land reviewer, the seat's pairs, one independent check, the macOS install check, CI's Windows leg. Builder: the larger builder (the timing fixtures are the risk).
- **Open questions: both take their defaults, decided by the seat.** `hook-deadlines` stays off the run-alone list unless the Windows readings pass 4,500 ms total; the early pi import in `config.ts` stays for a gate lane (known limit).

## Must-meet rows (FEAT-013 SUB-012, after R-2015)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2671 | WHEN a session-start producer exits 0 with output before its producer cap and its hook's deadline, the objective and adoption hooks shall print that output in place of the producer's unavailable marker. | `packages/nana-setup/tests/hook-deadlines.test.mjs::R-2671: the objective and adoption hooks print a producer's output when it takes 1.7 seconds, and the next producer's output after it, also when the hook starts 2.5 seconds late` |
| R-2672 | IF a session-start hook's first producer would start LATE_START_MS after the hook's process clock starts and neither of its producers exits, THEN the hook shall print both producers' unavailable markers and exit 0 before its installed limit. | `packages/nana-setup/tests/hook-deadlines.test.mjs::R-2672: the objective and adoption hooks print both markers before their installed limit when they start 2.5 seconds late and both producers hang` |
| R-2673 | IF no whole millisecond is left before the caller's deadline when the launcher would start a producer, THEN the launcher shall print that producer's unavailable marker without starting it. | `packages/nana-setup/tests/hook-producers.test.mjs::R-2673: with no whole millisecond left before the deadline, the launcher prints the marker and starts no producer` |
| R-2674 | The hook producer launcher shall start each producer with a time limit of HOOK_PRODUCER_TIMEOUT_MS, or the whole milliseconds left before the caller's deadline when fewer. | `packages/nana-setup/tests/hook-producers.test.mjs::R-2674: each producer's limit is the cap, or the whole milliseconds left before the deadline when fewer, and the cap when no deadline is given` |

Seal test: `packages/nana-setup/tests/hook-producers.test.mjs::seal: the producer cap is 2,500 ms and the hook deadline 4,000 ms, 1,000 ms under the installed limit` names R-2674 and R-2672.

R-2013 becomes `retired` ("superseded by R-2674, 2026-10-23"). R-2010's text narrows (S-2). R-2011, R-2012 and R-2613 keep their text and titles. R-2675 to R-2680 stay free.

## What each test does

As the draft's "What each test does", with: R-2671's late-start live case (M-1) and `SLOW_PRODUCER_MS` at 1,700 scheduled from the stub's own clock (S-1); R-2672's preload writing its `timeOrigin` and the check's detail giving the before-clock and after-deadline times (S-4); R-2673's extra reading past the deadline (N-1); the guards inside the checks (N-6). Every new check is red on main.

## Tunables

As the draft's table, with: `SLOW_PRODUCER_MS` = 1,700 (chosen 2026-10-23: main kills it by at least 200 ms every run; about 800 ms of room under the cap, S-1); the provenance wording of S-6.

## Wrong-code pairs (each must turn its test red every run)

The draft's pairs 1 to 9, plus:
10. Each hook computes `HOOK_DEADLINE_MS - performance.now()` once and passes that as the deadline (the start counted twice) → R-2671's late-start case.
11. The R-2673 skip tests only `limit === 0` → R-2673's past-deadline reading. (With the real spawnSync a negative limit throws and the marker prints, so if this pair stays green the seat records it as equivalent.)
None is Windows-only.

## Known limits (the seat writes them to the named files before the final round)

The draft's list, with the S-3 trade stated as above, the second producer's share after a hung first producer (1,500 ms minus the hook's start), a `node` shim and cold process start before Node's clock unmeasured on Windows (S-4), and the early pi import as a FEAT-001 line.

## Docs that change

As the draft's list, with the README wording of S-5 and `docs/known-bugs/FEAT-015.md`'s 1.5-second line (N-4).

## Seat steps

1. Cut `feat/objective-hook-win` from main. Commit this file, the draft, the attack, seat titles and build brief 1; run brief-check.
2. Build with the roster's larger builder.
3. Seat checks: `hook-producers`, `hook-deadlines`, `stale-copies`, `frontier-hook`, `hooks-closed-output`, `objective-golden`; `npm run test:locked`, map, readme, trace; `requirements-moved --base main`.
4. Pairs 1 to 11 through the mutation runner.
5. The independent check, then the macOS install check.
6. Draft PR CI, the Windows leg included.
7. Run `hook-deadlines.test.mjs` verbosely on a scratch Windows CI branch and read the before-clock and after-deadline times (S-4).
8. Notes before the final round; Opus and astra on the exact tip.
