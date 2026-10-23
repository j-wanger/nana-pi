MATERIAL: none
# objective-hook-win independent check · tip 49196066 against main 09181956

Setup. Trees extracted read-only with `git -C <lane worktree> archive 49196066 | tar -x -C <scratch>/ohw-indep/lane` and `git -C <main checkout> archive 09181956 | tar -x -C <scratch>/ohw-indep/main`. Every run set HOME, USERPROFILE and TMPDIR to folders under `<scratch>/ohw-indep/`. The harness `<scratch>/ohw-indep/harness.mjs` follows `hook-deadlines.test.mjs`: it copies `packages/nana-setup/claude/hooks`, `packages/nana-setup/lib`, `packages/nana-pack/lib` and `packages/nana-pack/bin` into a throwaway run tree, writes stub producers at the four producer paths, and spawns `node [--import <late-start preload>] <hook>` with `CLAUDE_PROJECT_DIR` set to the run tree. The late-start preload writes `performance.timeOrigin` and then runs `Atomics.wait` for N ms. Elapsed time runs from the parent's spawn to the child's close. Machine: macOS, 10 CPUs, Node 22.22.2. The full suite was not run.

Lane change, as read: the two hooks pass `deadlineMs: HOOK_DEADLINE_MS` (4,000). `runHookProducer` uses `limit = Math.min(2500, Math.floor(deadlineMs - performance.now()))` and starts the producer only when `limit > 0`. Only these two hooks call the launcher (grep over `packages`, `apps` and `scripts`).

## a. Both producers hung, late hook start

Command: `node a.mjs lane` and `node a.mjs main`. Hung stub: prints `PARTIAL`, then waits 30 s. Late starts: 0, 1,000, 2,000, 3,000 and 3,900 ms.

| late start (ms) | lane objective | lane adoption | main objective | main adoption |
|---|---|---|---|---|
| 0 | 4,021 | 4,019 | 3,047 | 3,047 |
| 1,000 | 4,023 | 4,019 | 4,054 | 4,054 |
| 2,000 | 4,019 | 4,019 | 5,059 (over) | 5,049 (over) |
| 3,000 | 4,018 | 4,018 | 6,049 (over) | 6,057 (over) |
| 3,900 | 4,020 | 4,020 | 6,959 (over) | 6,952 (over) |

Lane: all 10 runs exit 0 and print exactly both markers, and all end under 5,000 ms (max 4,023). The time before Node's clock was 12 to 15 ms. Main passes 5 s from a 2,000 ms late start on.

Note: on an on-time start with both producers hung, the lane holds session start about 1 s longer than main (4.02 s against 3.05 s). The plan's known limits state this.

## b. CPU load, 2,500 ms late start, 5 runs

Command: `node b.mjs lane 5 2500`, which runs 20 busy loops (2 × 10 CPUs) for the whole run. Load average reached 18.5.

- Lane, 10 runs (5 per hook): every run exits 0 with both markers. Elapsed 4,018 to 4,038 ms, **max 4,038 ms**. Time before Node's clock was at most 24 ms.
- Lane under 60 busy loops (6 × CPUs), 3 runs per hook: max 4,029 ms, all with both markers.
- Main, 20 busy loops, 2 runs per hook: max 5,597 ms, over the limit.

macOS's scheduler kept the hook near its deadline under this load. A Windows busy CPU was not tested (inferred to be harsher).

## c. First producer slow (prints at 1,700 and 2,400 ms), second live

Command: `node c.mjs lane none,500,1000,1500` and `node c.mjs main none`. The slow stub prints `SLOW 1700` and `SLOW 2400` at those points on its own clock, then exits. The second producer prints one line at once. Three runs per hook.

- Lane, on-time start: all 6 runs print `SLOW 1700`, `SLOW 2400` and the second line, in 2,488 to 2,515 ms.
- Lane, 500 and 1,000 ms late: all 12 runs print both outputs, in 2,992 to 3,560 ms.
- Lane, 1,500 ms late: 5 of 6 runs print both. One adoption run printed the stale-copy marker. The first producer ended near 3,920 ms on the clock, which left the second about 80 ms. That is the deadline doing its job.
- Main, on-time start: all 6 runs print the first producer's marker plus the second line, in 1,569 to 1,576 ms. Main loses the first producer's output and the lane keeps it.

## d. First producer hung, second live, on-time start

Command: `node d.mjs lane none,300,1000` and `node d.mjs main none,300,1000`. A probe stub stands in as the second producer and writes a timestamp every 10 ms. That gives its start time and how long it lived before the kill. Then stubs that print after a delay of 1,000 to 1,500 ms find the cutoff.

| case | second starts after hook spawn | second lived | delays kept | delays lost |
|---|---|---|---|---|
| lane objective, on time | 2,591 ms | 1,423 ms | up to 1,400 | 1,450 and up |
| lane adoption, on time | 2,564 ms | 1,447 ms | up to 1,400 | 1,450 and up |
| main objective, on time | 1,565 ms | 1,463 ms | up to 1,450 | 1,500 |
| main adoption, on time | 1,579 ms | 1,459 ms | up to 1,400 | 1,450 and up |
| lane, 300 ms late | about 2,870 ms | 1,132 to 1,136 ms | 1,000 | 1,200 and up |
| main, 300 ms late | about 1,890 ms | 1,442 to 1,472 ms | up to 1,400 or 1,450 | 1,450 or 1,500 |
| lane, 1,000 ms late | about 3,580 ms | 424 to 436 ms | none | 1,000 and up |
| main, 1,000 ms late | about 2,620 ms | 1,441 to 1,446 ms | up to 1,450 | 1,500 |

On time, the second producer's share is about the same as main's: 1,423 to 1,447 ms against 1,459 to 1,463 ms. The share falls one for one with the hook's start: 1,500 ms minus the start, minus about 50 ms of overhead. That matches the must-meet's known limit, "1,500 ms minus the hook's start". In main the share stays about 1,450 ms. At a 1,000 ms late start, main still ended under 5 s (4.07 to 4.10 s) and kept a second producer that needed up to 1,450 ms. The lane lost it. That is the stated trade, so it is not a finding.

Trade check (S-3) with a uniform-stall model, inferred. Command: `node g3.mjs` and `node g3b.mjs 6,7,8.5,10,11,12 0.1 46`. It uses the plan's bases: hook start 219k ms, objective 250k, frontier 100k. A pre-exec `sleep` adds the share of the start before Node's clock. The preload waits for the rest, and an exit handler waits a cost per stall factor.
- All of the start on Node's clock, exit cost 20k: the lane keeps the objective block at 6 to 8× (main gives its marker from 6×). The lane loses the frontier block from 7× and both blocks from 8.5×. Main keeps the frontier block to 9× and passes 5 s from 10×. This matches the stated trade.
- 10% of the start before the clock and a 46k exit cost (Windows-measured, see g): the lane never passes 5 s up to 12× (max 4,879 ms). Main passes 5 s from 10×. The lane keeps both blocks to 7× and the objective block to 8.5×.
- 45% of the start before the clock and a 20k exit cost (a macOS-like split; Windows does not measure this high): the lane passes 5 s at 8.5 to 9× (5,078 and 5,120 ms). Claude Code then drops the whole output. In that band main printed the objective marker and the frontier block (4,545 and 4,715 ms). Both pass 5 s from 10×.
Note: the stated trade holds when little of the start falls before Node's clock, which is what Windows CI measured. Above about 8.5×, the S-3 wording ("loses the frontier block") would understate a large share before the clock: the loss would be the whole output, markers included. This is beyond the one 6.2× stall seen, so it is a note.

## e. Producers that exit nonzero, die by a signal, print nothing or print a lot

Command: `node e.mjs`. Each case runs as the first and as the second producer in both hooks, on the lane and on main. Outputs were compared byte for byte by SHA-256 after normalizing the run-tree path. Cases: exit 3 after printing; SIGKILL self after printing; empty; a thrown error; 500,000 characters; 2,000,000 characters (over spawnSync's 1 MiB maxBuffer); trailing blank lines.

Result: all 28 comparisons are byte-identical between lane and main, and every hook exits 0. A failure prints its marker, and the other producer's output follows unchanged. Empty prints nothing. 500 k prints whole. 2 M gives the marker (ENOBUFS), as on main. Trailing newlines collapse to one, as on main. Elapsed time was 92 to 105 ms on both trees.

## f. Real producers in a temporary home, lane tree

Command: `node f.mjs`, with `CLAUDE_PROJECT_DIR` set to the extracted tree and HOME at `<scratch>/ohw-indep/fhome`. That home holds one user-scope `.pi/agent/nana-objective.md` with two test lines; without it the objective producer prints its own "file not found" line. Five runs per hook per tree.

- Lane objective hook: exit 0. Elapsed 163, 167, 168, 168 and 183 ms. Output is the objective block (`governing:` plus both lines) followed by the frontier block from the tree's HANDOFF, 2,598 characters. It has no launcher marker.
- Lane adoption hook: exit 0, 114 to 123 ms. Output is empty, because the temporary home has no journal and no stale copies. A launcher failure would have printed a marker instead.
- Main: 164 to 173 ms and 114 to 126 ms. Outputs hash the same as the lane's (`c85298ae51cd` for objective, the empty-string hash for adoption).
- Real producers with late starts (`node f2.mjs`). Lane and main both print both blocks at 2,500, 3,500 and 3,700 ms late. At 3,800 ms late the lane lost the frontier block in 1 of 2 runs. At 3,900 ms late the lane printed both markers in 4,017 to 4,019 ms. Main printed both blocks in 4,111 to 4,117 ms, under 5 s.
Note: with healthy producers, a start of about 3.75 to 4.8 s on Node's clock makes the lane print markers where main kept both blocks under 5 s. That needs a start about three times the worst seen (1.36 s) with producers that are not slowed at all. It is outside a realistic stall, so it is a note (inferred).

## g. Code reading and Windows-specific checks

- Clock source: `performance.now()` is monotonic from `performance.timeOrigin` (QueryPerformanceCounter through libuv on Windows). The probe `startup-probe.mjs` puts the origin 12 to 14 ms after spawn on macOS, and a first JS line at 13 to 17 ms on that clock. So the clock starts near process start.
- Windows numbers. The lane's draft-PR CI Windows suite leg (run 39971883805) passed `hook-deadlines` 6 of 6. Its note line reads: objective 4,041 ms, 18.7 ms before Node's clock, 22.3 ms after the deadline; adoption 4,068 ms, 21.8 ms before, 46.2 ms after. Both readings are far under the seat's 300 ms trigger. The Windows install-check leg passed, with the adoption and objective hooks reported 0.37 to 0.40 s after the hook set line.
- Edge arithmetic, checked with an injected clock and runner (`g2.mjs`). The clock at 0, 1,499.9 or 1,500 passes 2,500. The clock at 3,998.2 or 3,999 passes 1. The clock at 3,999.01, 3,999.99, 4,000, 4,000.4, 4,001 or 1e9 starts nothing and prints the marker. A NaN clock prints the marker, because `NaN > 0` is false. With no deadline the cap is 2,500. A timeout of 0 never reaches spawnSync; in libuv, 0 would mean no time limit. A negative timeout throws ERR_OUT_OF_RANGE, but the `limit > 0` guard means it never reaches spawnSync either. A real spawnSync with a 1 ms limit gives `ETIMEDOUT` and SIGTERM, which prints the marker.
- spawnSync timeout on Windows: the kill path and `killSignal` are the same as main's (TerminateProcess on Windows). Producers run through `process.execPath`, so no shim sits between the hook and a producer. A producer in a wait no signal ends is unchanged from main, and the README keeps that sentence.
- Margin before the clock (simulated with `sh -c 'sleep N; exec node …'`, `g.mjs`). With both hung, the lane passes 5 s at 1,056 ms before the clock (5,074 ms) and holds at 954 ms (4,964 ms). Main holds both up to at least 1,044 ms (4,091 ms). With the first producer live and the second hung, the deadline never binds: the lane ended at 3,645 ms with 1,061 ms before the clock. So the lane passes 5 s only when its producers run to the deadline and the time before the clock plus the exit cost reaches about 1,000 ms. At the Windows-measured 41 to 68 ms on a healthy runner, a uniform stall would need about 15× or more (inferred). That is beyond main's own overrun near 10×.
- Note: the 300 ms trigger in S-4 is looser than the reserve's real bound. The reserve holds through a k-times stall only while k × (time before the clock + time after the deadline) stays under about 1,000 ms. That is about 118 ms at the claimed 8.5×. The measured 41 to 68 ms is under it, so this needs no action now. A cold start, antivirus or a `node` shim on a real Windows desktop are still unmeasured, as the known limits say.
- Note: at this tip, the known-bug lines still give the old numbers: FEAT-013 lines 93 and 96, FEAT-015 line 41 and FEAT-002 line 53 say 1.5 s or about 3 s. The new FEAT-013 known limits (the S-3 trade, the second producer's share) are not written yet. The must-meet's seat steps put these in the reviewed change before the final round.
- No leftover processes: after all runs, no stub or busy loop from the scratch folder was running.

The claim most likely to be wrong: the stall-model bands in d and g. They rest on the plan's inferred base times and on one healthy Windows CI reading of the time before Node's clock.
