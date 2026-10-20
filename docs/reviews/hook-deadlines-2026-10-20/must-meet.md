# hook-deadlines — must-meet

Feature: FEAT-013 · Install and connect harness runtimes (SUB-012 · Deliver commands, hooks and workflow resources)

Falsifiable sentence: when a session-start producer has not exited at the launcher's 1500 ms limit, the nana Claude Code hook that runs it prints that producer's unavailable marker in place of its partial text, keeps the other producer's output, and exits 0 inside the 5 s limit the installer writes; the verifier hook with a closed stderr and the knowledge pull hook with a closed stdout still exit 0.

Class: install, hook or gate (the Claude Code hook launcher and the verifier hook). Full ladder: final reviewer, land reviewer or seat-land, the seat's wrong-code pairs and one independent check. The seat runs the install check on macOS before nana-land. Simple build: two product lines plus tests.

Threat model: honest variation is in scope — a producer that loops, or stalls on a slow file read in a wait a signal can end; a hook reader that closes its end of a pipe; pipe and process behaviour on macOS, Linux and Windows. Deliberate forgery is out, such as a producer that traps signals on purpose. A finding outside the model is a residual.

## Design
- `runHookProducer` in `packages/nana-setup/lib/hook-producer.mjs` passes `timeout: HOOK_PRODUCER_TIMEOUT_MS` to its spawnSync. When the limit passes, spawnSync signals the child, closes its pipes and returns `error.code === "ETIMEDOUT"`. The existing failure branch then prints the marker, never the partial stdout. The R-687 markers do not change.
- `HOOK_PRODUCER_TIMEOUT_MS = 1500` is exported from that module and sealed by R-2013. Provenance (chosen 2026-10-20, R-2013): the adoption hook runs two producers in a row, so twice the limit plus the hook's start must stay under the installer's `timeout: 5`; 2000 ms would leave about 0.5 s. Measured healthy runs: macOS objective 108 ms, adoption 59 ms, stale-copies 67 ms (temp home); a hosted Windows install check ended the adoption hook, both producers, 0.34 s after it started beside six other hooks.
- `packages/nana-setup/claude/hooks/verifier-pipe.mjs` gets `process.stderr.on("error", () => {})` beside its stdout guard.
- The knowledge pull hook needs no change: its final `process.exit(code)` runs before the deferred EPIPE error event. A new check pins that.
- `nana-adoption.mjs` and `nana-objective.mjs` do not change; the launcher change covers both.

## Must-meet tests
| Row | Requirement (EARS) | Test (file::title) | Red today |
|---|---|---|---|
| R-2010 | IF the adoption producer has not exited when the producer time limit passes, THEN the adoption hook shall print the adoption unavailable marker in place of any text that producer wrote, then the stale-copy checker's output, and exit 0. | `packages/nana-setup/tests/hook-deadlines.test.mjs::adoption hook prints its marker and the stale-copy output when the adoption producer hangs` | Probe in a temp clone with stub producers: today's hook printed nothing and was still running when killed at 8 s. With the limit: exact marker plus the stub line, exit 0, 1.57–1.59 s. Printing the partial stdout on ETIMEDOUT gave `PARTIAL` (red). |
| R-2011 | IF neither the adoption producer nor the stale-copy checker has exited when its producer time limit passes, THEN the adoption hook shall print the adoption unavailable marker and then the stale-copy unavailable marker, and exit 0 within the time limit the installer writes for that hook. | `packages/nana-setup/tests/hook-deadlines.test.mjs::adoption hook prints both markers before its installed limit when both producers hang` | Today: hung at 8 s. With 1500 ms: both markers exact in 3.04–3.06 s. A 3000 ms limit took 6.04 s (red). |
| R-2012 | IF the objective producer has not exited when the producer time limit passes, THEN the objective hook shall print the objective unavailable marker in place of any text that producer wrote, and exit 0 within the time limit the installer writes for that hook. | `packages/nana-setup/tests/hook-deadlines.test.mjs::objective hook prints its marker before its installed limit when its producer hangs` | Today: hung at 8 s. With the limit: exact marker in 1.54 s. Printing the partial stdout gave `PARTIAL` (red). |
| R-2013 | The hook producer launcher shall start each of the objective, adoption and stale-copy producers with a 1500 ms time limit. | `packages/nana-setup/tests/hook-producers.test.mjs::launcher starts the objective, adoption and stale-copy producers with a 1500 ms time limit` | An injected runner sees `options.timeout` undefined today. This is the seal test for the tunable. |
| R-2014 | WHEN the verifier hook writes a diagnostic to a stderr whose reader has closed it, the verifier hook shall exit 0. | `packages/nana-setup/tests/hooks-closed-output.test.mjs::verifier hook ignores a closed stderr and exits 0` | Today: exit 1 in 4 of 4 runs (3 on `not json`, 1 on `{}`); the open run printed the diagnostic. With the listener: exit 0 in 3 of 3. |
| R-2015 | WHEN the knowledge pull hook writes its pointer block to a stdout whose reader has closed it, the knowledge pull hook shall exit 0 and write nothing to stderr. | `packages/nana-setup/tests/hooks-closed-output.test.mjs::knowledge pull hook ignores a closed stdout and exits 0` | Green today (pin): exit 0 and empty stderr in 3 of 3; the pull log shows the closed session got its pointer. Wrong code: the CLI's last line as `process.exitCode = code` gave exit 1 with an unhandled EPIPE in 3 of 3. |

Every test runs on all three CI legs with no skip; each case can happen on every platform. Regression probe: with both product changes, hook-producers (10), hooks-closed-output (5), stale-copies (13), adoption-reader (44) and objective-golden (1236 checks) pass on macOS.

## Test shape
- hook-deadlines builds a tree under `fs.realpathSync.native(tmpDir(...))` (on macOS the temp folder is a link, and the marker paths must match) and copies the checkout's `packages/nana-setup/claude/hooks` and `packages/nana-setup/lib` into it. It writes stubs at `packages/nana-pack/bin/nana-adoption.mjs`, `packages/nana-setup/bin/stale-copies.mjs` and `packages/nana-pack/bin/nana-objective.mjs`. A hung stub writes `PARTIAL` and waits on a timer.
- Expected text comes from the checkout's `hookProducerConfig(name, treeRoot).marker`; the installed limit from the checkout's `desiredHooks(...)` entry `timeout` × 1000. Elapsed time runs from spawn to close.
- The knowledge case needs a built index in a temp `NANA_KNOWLEDGE_HOME` whose `sources.json` names one folder with one markdown file. The open and closed runs need their own `session_id`, because a repeated pointer prints nothing, and `NANA_ROLE` must be absent from that child's env.

## Known limits
- spawnSync signals the child and then waits for it to exit. A producer in a wait no signal ends (a hard network or FUSE mount on macOS, maybe a Windows cloud-file read) is not stopped, and Claude Code's 5 s limit still drops the hook's output, as today. A true deadline needs an async launcher that exits without waiting; that would rewrite the R-687 test seam, so this lane does not.
- A producer stopped by the limit prints the same "failed" marker as one that crashed.
- The limit is per producer. A healthy producer slower than 1500 ms, such as a cold start on a slow Windows machine, prints its unavailable marker for that session.
- R-2014 and R-2015 have no wrong-code run on Windows unless the seat runs Windows pairs, so the Windows pass does not show that Windows raised the error.
- R-2011's margin is about 2 s on macOS (3.0 s against 5 s), and the file is not on the run-alone list.
- The shared-memory and roster-notice hooks have no deadline of their own; the knowledge budget bounds only asynchronous stalls (R-225).
