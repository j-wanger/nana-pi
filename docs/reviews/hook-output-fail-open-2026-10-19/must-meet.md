# hook-output-fail-open — must-meet

Feature: FEAT-013 · Install and connect harness runtimes. Rows go at the end of SUB-012 · Deliver commands, hooks and workflow resources, after R-1207, beside R-687 and R-1205 to R-1207. No share and no tree move.

Sentence: IF the reader of a nana Claude Code hook's output closes it before the hook writes, THEN the objective, adoption, shared-memory, roster notice and verifier hooks each exit 0 with nothing on stderr.

Class: hook lane, because four Claude Code hook entries change. Full ladder: final reviewer, land reviewer or seat-land, wrong-code pairs, one independent check, mutation runner. Install check on macOS before nana-land. The lane is simple, so a Claude Sonnet subagent builds it.

Threat model: honest variation in how a reader takes hook output is in scope on macOS, Linux and Windows. A reader may close early: a harness abandoning the hook, or a person piping it into `head`. Deliberate forgery is out. A finding outside the model is a residual.

## Scope
- Kept (a). On main d4423eff, four hooks exit 1 with an unhandled `write EPIPE` when their output is closed first. The adoption hook does so only when it has something to write; in a bare home it prints nothing and exits 0 (probed).
- Cut (b), the per-producer deadline, to a residual. Measured: on the pi-seat-live-turn Windows install-check log the adoption hook passed 0.49 s after the hook set started, ten times under the 5 s entry timeout. The owner's 2026-09-16 knowledge-hook ruling makes the harness timeout the outer bound for a synchronous stall. A deadline would add a tunable that must fit two producers under 5 s.
- R-1944, the verifier hook: same bug, same fix, same subgroup, probed red.
- R-1943, the roster notice hook: a pin. It is green today because `process.exit(0)` runs before the stream's error event fires.
- The knowledge pull hook is out. It ends through `process.exit` the same way (read, not probed with output), and knowledge-unreadable-root is editing its CLI.

## Design
- `nana-objective.mjs`, `nana-adoption.mjs`, `nana-shared-memory.mjs` and `verifier-pipe.mjs` each add one `process.stdout.on("error", () => {})` after the imports, with a comment naming the row. The entry owns the process stream.
- The listener ignores every stdout error, not only EPIPE. Nobody reads a closed output, so there is nobody to tell. Windows may report the closed reader as EPIPE or as EOF.
- Each of the four `@errors` header lines gains the closed-output clause.
- `lib/hook-producer.mjs`, `lib/verifier-hook.mjs` and `nana-roster-notice.mjs` stay unchanged. No process-wide handler, no new module, no tunable, no README change.
- One new test file runs each real hook twice in a throwaway home: once with its output read, once with the parent's read end destroyed right after spawn. Each check needs the open run to print, so it cannot pass on a hook with nothing to write.

## Must-meet
| Row | Requirement | Test (`packages/nana-setup/tests/hooks-closed-output.test.mjs::`) | Red today |
|---|---|---|---|
| R-1940 | IF the reader of the objective hook's output closes it before the hook writes to it, THEN the objective hook shall exit 0 and write nothing to stderr. | `objective hook prints with its output open and exits 0 with empty stderr when its output is closed first` | red: closed run exits 1, unhandled `'error'` event (3/3); PASS with the listener |
| R-1941 | IF the reader of the adoption hook's output closes it before the hook writes to it, THEN the adoption hook shall exit 0 and write nothing to stderr. | `adoption hook prints with its output open and exits 0 with empty stderr when its output is closed first` | red: exit 1 (3/3), fixture journal path is a directory so it prints `ADOPTION UNAVAILABLE`; PASS fixed |
| R-1942 | IF the reader of the shared-memory hook's output closes it before the hook writes to it, THEN the shared-memory hook shall exit 0 and write nothing to stderr. | `shared-memory hook prints with its output open and exits 0 with empty stderr when its output is closed first` | red: exit 1 (3/3); PASS fixed |
| R-1943 | IF the reader of the roster notice hook's output closes it before the hook writes to it, THEN the roster notice hook shall exit 0 and write nothing to stderr. | `roster notice hook prints with its output open and exits 0 with empty stderr when its output is closed first` | green today (pin). Wrong code: delete `process.exit(0)` after `await runRosterNoticeHook()`; closed run exits 1 (probed) |
| R-1944 | IF the reader of the verifier hook's output closes it before the hook writes to it, THEN the verifier hook shall exit 0 and write nothing to stderr. | `verifier hook prints its ask line with its output open and exits 0 with empty stderr when its output is closed first` | red: exit 1 (3/3) on a masked-pipe Bash event; PASS fixed |

## Probes
The adversary ran these in a temp clone of d4423eff with a temp home.
- A draft of the file: four FAIL and one PASS on main's hooks in 3 of 3 runs; five PASS with the listener; 0.72 s.
- With the fix, `hook-producers` (10), `shared-memory-hook` (43), `roster-notice-hook` (4) and `verifier-pipe` (29) pass whole.
- With the rows implemented, the trace shows 0 rows off EARS form, the tree test passes and `map:check` reports 0 problems.
- REQUIREMENTS.md with the five rows merged clean against all five in-flight branches.
- Wrong codes: roster exit removed turns R-1943 red. The journal directory dropped turns R-1941 red, because the open run prints nothing. A listener that calls `process.exit(1)` turns R-1940 red. An EPIPE-only listener survives.

## Known limits
- Nobody has seen Claude Code close a hook's output early. The rows name the reader, and a plain parent process stands in for it.
- No check covers a reader that closes partway through the output. The same listener covers it; no test does.
- The "ignore every error" choice is unpinned. An EPIPE-only listener stays green on macOS (probed) and Linux (inferred).
- A closed stderr is out of scope. The verifier still writes its rare diagnostics to stderr unguarded.
- Windows is unprobed. Windows wrong-code pairs need scratch CI.
- A hook still does its work after the close: shared memory still heals the link, and adoption still runs the stale-copy producer.
- The (b) residual stays: neither adoption producer has its own time limit, with about 10x measured margin on Windows.
