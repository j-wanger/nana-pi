# build-records · must-meet (seat, 2026-10-22, after one adversary pass)

Feature: FEAT-006 · Launch builders with execution limits

Spend line: the owner's 2026-10-22 slate of open audit items, under the objective (build products with agents, with nana-pi as the shared toolkit). It closes the artifact audit's item 4: pi-worker keeps no wall time, attempts, exit or cost. The precedent audit's measure, builds per lane (82 of 156 lanes with two or more by hand), becomes a line code prints.

Class: ordinary (pi-worker, a new pack lib, its config and one report command run through node from the checkout, the bench's usage-sum helpers moved into a pack lib, docs and rows; nothing on the install, hook or gate list). Ladder: the seat's wrong-code pairs and one final reviewer from another model family. Builder: the larger builder. Stakes: medium blast, reversible. Every lane launch on every machine runs the new start and end paths. A records bug must never stop a build or change its exit code (R-2599). The records are report-only: no gate, land or review reads them.

Threat model: honest variation in our own tools' output. Two lanes of one clone appending in the same instant; a pi-worker killed hard (SIGKILL, a closed terminal, a stopped background command); a pi that stalls, exits non-zero or writes no session; a session folder holding pi-review and older pi-worker sessions; `PI_CODING_AGENT_SESSION_DIR` set to a flat folder, a `~/…` value or an empty value; a session with a torn last line or over the read cap; an unwritable ledger (`.git/nana` is a file, the ledger is a folder); a torn or other-schema ledger line; a brief inside or outside the worktree; a worktree removed after its build; one lane built many times; Windows drive-letter, 8.3 short and differently cased paths. Deliberate forgery is out: an edited ledger or session file, or a builder writing the ledger through bash, changes the report and nothing else. Public repo: no owner name, nothing about the owner's work.

The planner's draft (`plan-draft.md`) holds the measurements and the contract notes on pi 1.0.2; the adversary's attack (`plan-attack.md`, M 3, S 10, N 13) changed the plan as the decisions below say. Where they disagree with this file, this file wins.

## Precedent

Precedent:
- packages/nana-pack/bin/pi-worker.mjs — the lane's facts already in hand: `dirs` (`dirs[1]` the common folder), `cwd` and `branch`, the roster entry and label, the lock path, `git()`; the lock is taken by `acquireLaneLock`, and the output write and lock release share one `finally`.
- packages/nana-pack/bin/pi-watchdog.mjs — read only, unchanged: the result shape `{ok, attempt, ceiling, signal, validationFailed}` maps to the outcome, and the per-attempt session name `${tag}-a${attempt}-…` is how a build's session is found.
- packages/nana-pack/lib/suite-records.mjs — the store pattern: a clone-shared record under the git common folder whose failures are named and never change the run's exit code (R-2553).
- packages/nana-pack/lib/suite-records-config.mjs — the config module form: schema number, store subpath, provenance per value.
- packages/nana-pack/lib/runtime-map-config.mjs — `DATA_SUBPATH`, the sibling path the ledger sits beside.
- packages/nana-pack/bin/review-round.mjs — one JSON line per record with `v`; the field names `startedAt`, `endedAt`, `attempts`, `durationMs`, `provider`, `model`; `repoKeyOf`, the repo-key builder the report imports.
- packages/nana-pack/bin/review-ledger.mjs — the `report` subcommand: `--repo` through `repoKeyOf`, one ` | `-joined line per record, and its `--repo is not a git repository` message.
- packages/nana-pack/bin/brief-check.mjs — a pack command run through node from the checkout, so nana-setup and PATH stay untouched.
- apps/bench/lib/usage.mjs — `emptyUsage`, `addUsage`, `totalTokens`, `costTotal` and their helpers: pi's own Usage field names and a field-wise sum. MOVE them to `packages/nana-pack/lib/pi-usage.mjs`; usage.mjs imports them back and re-exports the four public names.
- apps/bench/lib/pi-exports.mjs — why no pi package is imported at run time: the bench takes pi's stored cost for a run's own spend.
- packages/nana-pack/lib/agent-dir.mjs — `piAgentDir()` and `piNormalizePath`, pi's active agent folder and path rule.
- packages/nana-pack/lib/bounded-read.mjs — `readBounded` for the capped head, session and ledger reads.
- packages/nana-pack/lib/brief-precedent.mjs — `readBrief` parses the first `Feature:` line; `checkBriefForLaunch` adds `feature` to its ok result.
- scripts/deliverables.mjs — `MAKER_RUNS` already holds `build`, so the new deliverable's `Made by:` line needs no checker change.
- packages/nana-pack/tests/worker-lane.test.mjs — the lane harness: fixture repo and worktree, stub pi, HOME and `PI_CODING_AGENT_DIR` isolation, the spawn marker and lock path.
- packages/nana-pack/tests/fake-pi.mjs — the Windows stub pi.
- packages/nana-pack/tests/pi-install.mjs — `findPiRoot`, which resolves the installed pi on every platform.
- apps/desk/test/pi-087-entries.test.mjs — writes a session, `appendUsage` included, through pi's own `SessionManager`: the pattern for the stub's session.
- packages/nana-pack/tests/agent-dir-parity.test.mjs — pins agent-dir.mjs against pi's own rule.
- packages/nana-pack/tests/win32-launch.test.mjs — lane launches from an 8.3 short path and a differently cased path, skipped when the volume keeps no short names.
- packages/nana-pack/tests/watchdog-exit.test.mjs — own-repo-and-HOME lane runs with a lock check, the pattern for the ceiling and signal cases.
- packages/nana-pack/tests/suite-records.test.mjs — R-2553's unwritable-record case, the pattern for R-2599.
- packages/nana-pack/tests/review-ledger.test.mjs — R-732's three checks, re-marked to R-2603.

## Seat decisions

- **D1 · The ledger is `<git common folder>/nana/build-records.jsonl`** (draft D1). Every worktree of a clone shares it, lane cleanup keeps it, the report runs from any checkout, and a fixture's builds land in the fixture's own `.git`.
- **D2 · One JSONL file, no lock** (draft D2; adversary S1). Each record is one line written with one append call. Chosen over suite records' one-file-per-record form: the end line and the report read one file, not a folder listing, and the start and end lines pair by build id whatever their order. A torn line is skipped and counted.
- **D3 · Two lines per build, and an unpaired start reads as `no end`** (draft D3; adversary S6, the subtraction taken). The start line goes after the lock is taken, before pi starts; a refused launch writes nothing. The end line goes on every handled exit: success, failure, the ceiling, and SIGINT, SIGTERM or SIGHUP (outcome `stopped`, with the signal). A start with no end is `no end` in the report: still running, killed hard, or crashed by an exception. The running/killed split, the pid liveness rule, the pid helper move and the pid-reuse residual are dropped; the audit's measure does not need them. Build id: `crypto.randomUUID()` (chosen).
- **D4 · The session is found by name and time, not by a pi argument** (draft D4; adversary S3, S4, S5). The start record keeps the folder pi will write to: `PI_CODING_AGENT_SESSION_DIR` normalized with `piNormalizePath` and resolved against `process.cwd()` when it is set and not empty, else `piAgentDir()/sessions/--<encoded process.cwd()>--/` by pi's rule. The record's `cwd` is the raw `process.cwd()`. At end, the build's sessions are the `.jsonl` files there whose name stamp is at or after the start, whose header `cwd` matches the worktree (real paths compared on both sides, a string compare when one is gone), and whose first `session_info` name starts `<WORKER_TAG>-a`. The matcher reads only the first `BUILD_SESSION_HEAD_BYTES` of each candidate, and reads a match whole under `BUILD_SESSION_READ_MAX_BYTES`; the head read passes a large cap and a small read limit, so a large pi-review session in the folder does not make the cost unknown.
- **D5 · Tokens and cost are pi's own numbers, summed** (draft D5). The end record sums every pi-ai Usage in the matched sessions with the moved `addUsage`: assistant and tool-result messages, and usage, compaction and branch-summary entries, the roles and types named once in config with their pi source. `calculateCost` is not called. No matched session, an unreadable one, or one over the cap gives `cost: null` with a reason naming the folder.
- **D6 · Fields.** Start: `v`, `kind: "start"`, `build`, `lane`, `brief` (worktree-relative with `/` inside the worktree, else the real absolute path), `feature`, `tip` (HEAD's full id), `startedAt`, `pid`, `lock`, `laneSize`, `slot` (`builder` or `largerBuilder`), `provider`, `model`, `thinking`, `cwd`, `sessionDir`, `out` (the builder's output path; adversary N10). End: `v`, `kind: "end"`, `build`, `endedAt`, `durationMs`, `attempts`, `exit`, `outcome`, `signal`, `tip` (or null with `tipError`), `usage`, `cost`, `costReason`, `sessions`, `sessionBadLines`, `outputError` (null unless the output write failed). The brief's hash is not recorded (briefs are committed under the lane's review folder).
- **D7 · Records never change a build** (draft D7; adversary S8). Every record step runs in its own try/catch. The end record is appended in the `finally` that releases the lock, before the release; when the output write threw, the outcome is `failed` and `outputError` names it. A failed append prints one `pi-worker: build record: not kept: <path>: <error code and message>` line; pi still starts, and the exit code and the output file are what they would be with a writable ledger. After a failed start append, no end record or end line follows.
- **D8 · Two code readers** (draft D8; adversary S2, S7, N8, N11). `node packages/nana-pack/bin/build-report.mjs [--repo <path>] [--lane <name>]` reads `--repo`'s ledger (default the cwd) through `repoKeyOf` with its `git:` prefix stripped; a non-git `--repo` exits 1 with review-ledger's message, not repoKeyOf's admission text. It prints one line per build in start order, one line per lane counting builds by outcome with summed minutes, tokens and cost, and one total line counting builds, lanes, lanes with two or more builds, minutes, cost, unpriced builds and unreadable lines. A `no end` build's minutes and cost come from its sessions with the window ending at the next start in that folder. pi-worker's last stderr line is `pi-worker: build record: <outcome>, exit <n>, <m> min, <$cost | cost unknown: reason>; ` followed by the report's lane line for this lane, rendered by the same function after this build's end record is appended. The ledger read is capped at `BUILD_LEDGER_READ_MAX_BYTES`; over the cap, the report exits 1 naming the cap and the end line ends `; lane line unavailable: ledger over <cap>`. Minutes round down (chosen); cost prints in cents.
- **D9 · R-732 is retired for a narrower R-2603** (draft D9; adversary M1). R-2603 keeps no review-round import and no review-ledger file. FEAT-007's Also applies line swaps R-732 for R-2603. The three tests keep their titles and move their markers. The README Workers paragraph changes from "records nothing" to "records no review round". `lib/build-records.mjs` and its config import nothing from review-round; only build-report.mjs imports `repoKeyOf`. New pi-worker text holds none of `admit`, `complete` or `review-ledger.rounds` outside `//` comments (R-2603's source check). The new line prefix must not start `pi-worker: builder` (adversary N5).
- **D10 · Left out** (draft D10, the planner's four defaults): no stall outcome (a stall records as `failed`); no back-fill of earlier sessions; no record for Claude Code subagent builds (the planned Claude Code builder lane); no Builds section in review-timeline; no retention.
- **D11 · Order with brief-reader-fixes** (adversary S9). Both lanes edit FEAT-006's table, the pack README's lane paragraph, brief-precedent.mjs and the FEAT-006 known-bug file. Whichever lands second merges main and regenerates the tree and code map.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2596 | WHEN pi-worker lane mode has taken the worktree lock, it shall append, before starting pi, one start record to `nana/build-records.jsonl` under the lane's git common directory holding a new build id, the lane, the brief path, the brief's feature, HEAD's full commit id, the start time, its pid, the lock path, the lane size, the builder slot and its provider, model and thinking, the worktree path, the session folder pi will write to and the output path. | `packages/nana-pack/tests/build-records.test.mjs::R-2596: a lane build appends one start record under the clone's git folder before pi starts` |
| R-2597 | WHEN a lane build ends by success, failure, the wall-clock ceiling or a SIGINT, SIGTERM or SIGHUP stop, pi-worker shall append one end record carrying the start record's build id, the end time, the duration in milliseconds, attempts, its exit code, the outcome `ok`, `failed`, `ceiling` or `stopped` with the signal, and HEAD's full commit id. | `packages/nana-pack/tests/build-records.test.mjs::R-2597: a lane build that succeeds, fails, reaches the ceiling or is stopped appends one end record naming its start` |
| R-2598 | WHEN pi-worker appends an end record, it shall add the field-wise sum of every pi-ai Usage in the build's session files, or a null cost with a reason naming the session folder when no such file is found or one cannot be read within the cap. | `packages/nana-pack/tests/build-records.test.mjs::R-2598: the end record sums every usage pi wrote in the build's session file, or names why the cost is unknown` |
| R-2599 | IF the build ledger cannot be appended, THEN pi-worker shall print one stderr line starting `pi-worker: build record:` naming the path and the error, and start pi and exit with the same code as with a writable ledger. | `packages/nana-pack/tests/build-records.test.mjs::R-2599: an unwritable build ledger leaves the build's launch and exit code unchanged and names why in one line` |
| R-2600 | WHEN the build report runs on a repository, it shall print one line per build in start order, one line per lane counting its builds by outcome with summed minutes, tokens and cost, and a total line counting builds, lanes, lanes with two or more builds and unreadable ledger lines. | `packages/nana-pack/tests/build-report.test.mjs::R-2600: the build report prints each build, one line per lane and a total counting lanes with two or more builds` |
| R-2601 | WHEN the build report reads a start record with no end record, it shall list that build as `no end`, with minutes and cost summed from its session files when they are found. | `packages/nana-pack/tests/build-report.test.mjs::R-2601: the build report lists a start with no end as no end, with its session cost` |
| R-2602 | WHEN pi-worker appends an end record, it shall print, after its SUCCESS, FAILED or aborted line, one stderr line starting `pi-worker: build record:` with this build's outcome, exit code, minutes and cost followed by the lane line the build report prints for this lane. | `packages/nana-pack/tests/build-records.test.mjs::R-2602: the last stderr line names this build's outcome, minutes and cost and its lane's builds so far` |
| R-2603 | pi-worker shall run a worker under the same watchdog while importing no review-round module and touching no review-ledger file. | the three R-732 checks in `packages/nana-pack/tests/review-ledger.test.mjs`, markers moved, titles unchanged |

R-732 is retired: "R-2603 narrows it to the review ledger; lane builds keep build records, R-2596". One seal test names R-2596, R-2599 and R-2602: `packages/nana-pack/tests/build-records.test.mjs::seal: build records live at nana/build-records.jsonl in schema 1 and their stderr lines start pi-worker: build record:`. R-2604 and R-2605 stay free.

### What each test does, and why it is red on main

The new test files use the worker-lane harness pattern with their own fixture repo, HOME, USERPROFILE and `PI_CODING_AGENT_DIR`, delete `PI_CODING_AGENT_SESSION_DIR` from the child environment unless a case sets it, use a Node stub on every platform, and give every case a time limit that fails rather than hangs. Usage amounts are binary-exact (multiples of 1/1024).

- **The stub's session (adversary M2).** The stub writes its session through pi's own `SessionManager`, resolved with `findPiRoot`: `SessionManager.create(process.cwd(), <the env folder or undefined>)`, `appendSessionInfo(<the --name it received>)`, `appendMessage` for a user message, the assistant messages and a tool result carrying usage, then `appendUsage`, a compaction with usage and a branch summary with usage. The test appends a torn last line as raw bytes. The test never builds the session folder itself.
- **R-2596.** The stub copies the ledger to a snapshot when it starts; the snapshot holds exactly one start line. Each value is asserted: tip the full 40-hex HEAD; feature FEAT-006 from the brief; brief relative inside the worktree and absolute outside; pid equals the spawned pi-worker's `child.pid`; lock equals `<git-dir>/nana-lane.lock` as the harness computes it; a larger launch with `largerBuilder` set records slot `largerBuilder` and that entry's provider, model and thinking, and with the slot null records `builder`; cwd and sessionDir equal the folder the stub actually wrote to; out equals the `--out` path. A lock-refused and a precedent-refused launch add no line. Nothing named `build-records` appears under the fixture HOME. Red on main: no ledger.
- **R-2597.** Four builds: a stub that commits and exits 0 (`ok`, exit 0, end tip differs from start tip); one that exits 1 (`failed`); a sleeping stub under `--max-secs 1` (`ceiling`, `durationMs` equal to `endedAt − startedAt` and at least 1,000); a sleeping stub sent SIGTERM once the spawn marker exists (`stopped`, `SIGTERM`, exit 143; skipped on win32). `attempts` is 1 in each. Each end line pairs with exactly one start line by build id. Red on main: no end record.
- **R-2598.** The stub's session holds two assistant messages, a tool-result message with usage, a usage entry, a compaction and a branch summary with usage, each with distinct amounts, and the torn line: every bucket, `totalTokens` and `cost` exact, `sessionBadLines` 1. The same folder holds a `pi-review-a1-…` session from the same moment and a `pi-worker-a1-…` session stamped before the start; neither counts. A second build sets `PI_CODING_AGENT_SESSION_DIR` to `~/<flat folder>` under the fixture HOME, which also holds another worktree's pi-worker session; only this worktree's counts. A third build's stub writes no session: `cost` null, the reason names the folder. On win32, one build launches from the 8.3 short path (skipped when the volume keeps no short names). Lib-level cases: a session over an injected tiny cap, and a folder in place of the session file: `cost` null with the reason; a large non-matching session beside a matching one leaves the cost known. Red on main: no end record.
- **R-2599.** Case one: `<common>/nana` is a regular file, so the start append fails; the spawn marker exists, the output file equals a writable run's, and the exit code matches for a passing and a failing stub; exactly one `build record:` line appears and it holds the ledger path and `ENOTDIR`. Case two: the stub swaps the ledger file for a folder mid-build, so the end append fails; the exit code is unchanged and one `not kept` line holding the path and `EISDIR` replaces the end line. Red on main: no such line.
- **R-2600.** A fixture ledger holds lane alpha with three builds (ok, failed, ok; one unpriced) and lane beta with one, plus a torn line, a schema-2 line and an end line whose start is missing. The report runs from a linked worktree and from the main checkout with identical output: exact build lines, exact lane lines, and a total of 4 builds, 2 lanes, 1 lane with two or more, the summed minutes, tokens and cents with 1 unpriced, and 3 unreadable lines. `--lane beta` prints only beta and a total over beta. A non-git `--repo` exits 1 with `--repo is not a git repository`. A ledger over an injected tiny cap exits 1 naming the cap. Red on main: the command does not exist.
- **R-2601.** Two hand-made unpaired starts: one with a session in its folder (`no end`, minutes to the session's last entry, the session's cost) and one with none (`no end`, untimed, unpriced). Two starts in one folder: the first's window ends at the second's start, so no session counts twice. One real build: the stub sleeps; the test SIGKILLs pi-worker (`taskkill /F /PID` on win32), runs the report and sees `no end` with the stub's session cost; the test then stops the stub by the pid it wrote. Red on main: the command does not exist.
- **R-2602.** The ledger is seeded with an earlier ended alpha build, an unpaired alpha start and a beta build; one alpha build runs. The last stderr line names `ok`, `exit 0` and the cost from its session, and its lane part is the literal alpha line with 3 builds, 2 ok and 1 no end, and equals what `build-report --lane alpha` prints right after. Red on main: no such line.

Existing tests made false (listed edits, not new tests): the three `req: R-732` markers in review-ledger.test.mjs become `req: R-2603`.

## Tunables (`packages/nana-pack/lib/build-records-config.mjs` unless noted)

- `BUILD_RECORDS_SUBPATH` = `nana/build-records.jsonl` — chosen: beside `nana/runtime-map.json` and `nana/suite-runs/` (D1). Sealed.
- `BUILD_RECORD_SCHEMA` = 1 — contract (R-2596, R-2600). Sealed.
- `BUILD_RECORD_KINDS` = `start`, `end` — contract (R-2596, R-2597).
- `BUILD_OUTCOMES` = `ok`, `failed`, `ceiling`, `stopped` (written) and `no end` (report only) — contract (R-2597, R-2601).
- `BUILD_RECORD_LINE_PREFIX` = `pi-worker: build record:` — contract (R-2599, R-2602). Sealed.
- `WORKER_TAG` = `pi-worker` — contract: the tag pi-worker passes to `runWatchdog`, which names each session `${tag}-a${attempt}-…`; pi-worker passes this name and the matcher builds its prefix from it. The `-a` infix is named beside it with pi-watchdog as its source.
- The session file suffix `.jsonl`, its name stamp form, and the usage-bearing message roles and entry types — contract, each named once with its pi 1.0.2 source (session-manager.js, agent-session.js `getSessionStats`).
- `BUILD_SESSION_HEAD_BYTES` = 4 KiB — measured: the header and first `session_info` end within 356 bytes over 2,482 named sessions, and `session_info` is line 2 in all 605 builder sessions (this Mac, 2026-10-22).
- `BUILD_SESSION_READ_MAX_BYTES` = 64 MiB — chosen: about 22 times the largest builder session measured (2,936,151 bytes of 605, this Mac, 2026-10-22).
- `BUILD_LEDGER_READ_MAX_BYTES` = 32 MiB — chosen: at about 33 KB a day (423 builds in 16 days at about 1.25 KB a pair, inferred), about two and a half years.
- `REPORT_COST_DIGITS` = 2, minutes rounded down — chosen: the grain a lane decision uses.
- Moved unchanged: `emptyUsage`, `addUsage`, `totalTokens`, `costTotal` to `packages/nana-pack/lib/pi-usage.mjs`.

## Known limits (the seat writes them to the FEAT-006 known-bug file before the final round)

- Per clone: deleting or re-cloning a repository loses its build records; the same lane name in two clones is two ledgers.
- Lane mode only: a plain pi-worker run, a Claude Code subagent builder and a build by hand keep no record.
- A stall is recorded as `failed`; the STALL line on stderr is the only sign of it.
- `no end` covers a build still running, one killed hard and one ended by an exception; the report cannot tell them apart. After a hard kill pi may still be working and spending.
- The cost is pi's list-price figure from its model catalog, not what a subscription bills (inferred).
- pi-worker follows `PI_CODING_AGENT_SESSION_DIR` and pi's default folder only; a `sessionDir` in pi settings leaves the cost unknown, with the folder named.
- A builder's nested pi runs (a pi-review it starts, a project's e2e) write differently named sessions and are not counted.
- No lock: two appends in the same instant could tear a line (inferred never on a local disk); the reader skips and counts it.
- A reused lane name merges into one lane line.
- The review item is not recorded; joining builds to review rounds by lane name matches 96 of 154 lane worktree folders here (measured 2026-10-22).
- Builds before this lane are not in the ledger.
- pi-review.mjs and review-round.mjs still say pi-worker records nothing; they mean no review round.
- Over 32 MiB the ledger is not read; the report and end line say so.

## Wrong-code pairs (the seat runs each; it must turn its test red)

1. The start record written only at the end, or after pi starts (R-2596).
2. The start record written before the lock (R-2596).
3. The ledger under `~/.pi/agent` or under the worktree's own git folder instead of the common folder (R-2596, R-2600).
4. HEAD's short id instead of the full id (R-2596, R-2597).
5. pid recorded as `process.ppid` (R-2596).
6. slot always `builder` (R-2596).
7. An end record only on success (R-2597).
8. The end record without the build id, or pairing by lane (R-2597, R-2600).
9. Usage summed from assistant messages only (R-2598).
10. Cost recomputed from tokens, or `totalTokens` as input plus output (R-2598).
11. A missing session recorded as cost 0 (R-2598).
12. Sessions matched without the cwd, name or start-time filter (R-2598).
13. The session folder encoded from the real-path cwd, or without the `:` replacement (R-2598; red on a Windows runner).
14. `PI_CODING_AGENT_SESSION_DIR` used without pi's normalization (R-2598).
15. A ledger append failure that throws, skips pi or changes the exit code (R-2599).
16. The report counting end lines as builds (R-2600).
17. The report stopping at a torn or other-schema line (R-2600).
18. An unpaired start counted as ok, or dropped (R-2601).
19. The lane line rendered before this build's end record is appended (R-2602).

## Docs and rows that change

- packages/nana-pack/README.md: the Workers paragraph ("records no review round"), the lane-mode paragraph (the start and end records and the end line), and a new Build records paragraph: the ledger path, the two kinds, `no end`, the cost source and `node "$HOME/nana-pi/packages/nana-pack/bin/build-report.mjs" [--repo <path>] [--lane <name>]`.
- apps/bench/README.md and apps/bench/lib/pi-exports.mjs: the field-wise sum now lives in the pack lib and is re-exported.
- REQUIREMENTS.md: rows R-2596 to R-2603 in FEAT-006; R-732 retired; FEAT-007's Also applies swaps R-732 for R-2603. FEAT-006's Purpose gains "and keep one record of each build". CAP-02's `Deliverables:` gains R-2597, with `Made by: R-2597 · build: packages/nana-pack/bin/pi-worker.mjs, packages/nana-pack/lib/build-records.mjs` and `Read by: R-2597 · code: packages/nana-pack/bin/build-report.mjs, packages/nana-pack/bin/pi-worker.mjs`.
- docs/requirements-tree.md and docs/code-map.md regenerated.
- Unchanged: nana-setup, every hook and extension, AGENTS.md's marker region, the builder preamble, pi-watchdog, pi-review, review-round, review-ledger, nana-land.

## Seat steps

- Build with the larger builder; the build brief carries a Precedent section and passes brief-check.
- Run the nineteen pairs, then one final reviewer from another model family on the exact tip that lands.
- CI on the draft PR, the Windows leg included.
- `requirements-moved.mjs --base main` output goes in the final review brief and the land.
