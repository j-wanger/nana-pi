MATERIAL: none
# lane-temp-cleanup independent check · tip a3293dc4 against main 8c24e357

Run 2026-10-23 on macOS (Darwin 25.2), node v22.22.2, git 2.50.1. Read-only toward both checkouts. `git status --porcelain` stayed empty in the main checkout and the lane worktree, and the lane worktree's HEAD stayed a3293dc4.

## Setup

- Trees: `git -C <lane worktree> archive a3293dc4 | tar -x -C <scratch>/ltc-indep/lane` and `git -C <main checkout> archive 8c24e357 | tar -x -C <scratch>/ltc-indep/main`.
- Harness: `<scratch>/ltc-indep/harness.mjs`. It follows the worker-claude.test.mjs fixture:
  - a repo under `<scratch>/ltc-indep/fx/repo` with a linked worktree `fx/lanewt` on `feat/alpha`;
  - a brief with `Feature: FEAT-006` and `Precedent:` listing a tracked file;
  - a roster in `fx/agent/nana-pack.json` with a pi `builder` and a `claude-code` `largerBuilder`;
  - user settings `fx/home/.claude/settings.json` holding `apiKeyHelper` and a marker `ANTHROPIC_API_KEY`;
  - fake `claude` and fake `pi` on PATH that write their pid, sleep `IC_SLEEP_MS` and print a report. No model call ran.
- Every run set HOME, USERPROFILE, TMPDIR, TEMP and TMP inside the scratch folder, a fresh TMPDIR per run. It cleared `NANA_*`, `CLAUDE_CONFIG_DIR` and `NODE_OPTIONS` unless a case set them.
- pi-worker ran detached, in its own process group, so pid signals and group signals could be told apart.
- Two stubs set up the hang and slow moments:
  - a `git` wrapper (`fx/gitstub/git`) that forwards to the real git and sleeps on the Nth call with given arguments;
  - a `NODE_OPTIONS --require` preload (`fx/hang-trust.cjs`) that blocks only the trust-check child, which it finds by `--input-type=module` plus `trustRecord` in its execArgv.
- A read tracer preload (`<scratch>/ltc-indep/trace-reads.cjs`) logs reads of the settings file, the roster and the brief, and every `mkdtempSync`.
- The git call order of a lane build, measured: show-toplevel, branch, git-dir, `rev-parse --short HEAD`, ls-tree, then `rev-parse HEAD` (start record, lock held). Then the three validateLane calls run inside runWatchdog. The last call is `rev-parse HEAD` for the end record.
- Every process the runs started was gone at the end (`ps`, measured). The harness kills each run's leftovers by recorded pid, and lists them as `stray`.

## (a) Review options, both modes, with and without a value, before and after other bad arguments

Command: `node <scratch>/ltc-indep/a.mjs` (raw: `a.out`). It covered 66 case pairs (main, lane) with the read tracer on.

- Lane mode, each of `--item`, `--role`, `--revision`, `--over-cap`, `--worker`, with and without a value, first or last (20 cases):
  - main: exit 1. The first line is the builder line. It read the brief, the roster and the settings and ran mkdtemp. It left `nana-lane-preamble-*/` with `builder-prompt.md`, `preamble.md` and `builder-settings.json` holding the key, mode 600.
  - lane: exit 1. The first line is `pi-worker: --X is a review option — …`. It made no read of brief, roster or settings, no mkdtemp, and left an empty temp folder.
- Non-lane mode, the same 10 option forms: main and lane are identical (exit 1, review-option line, no reads, empty temp folder).
- Before and after another bad argument, for `--item x` and `--worker`: missing brief, `--retries 2`, `--stall-secs abc`, bad lane name, duplicate `--out`, `--lane` without a value, and a run from the main checkout.
  - main prints that argument's refusal.
  - lane always prints the review-option line, with no reads and no temp. That is the intended order change.
  - main's `--stall-secs abc` case read the settings and ran mkdtemp, then removed the folder.
- Non-lane `--item x` with no `--out`, or after `--stall-secs abc`: main printed usage or the stall error, and lane printed the review-option line. That is intended ("either mode").
- A review option after `--`:
  - lane mode: both trees refuse with `caller pi arguments are refused` after reading the brief, with no temp.
  - non-lane: both pass it to pi and exit 0. Unchanged.
- Notes, not findings:
  - `--item=x` (equals form) is refused by neither tree. Both run a full build and exit 0. This was there before the lane.
  - The lane scans raw argv, so a review flag given as another option's value now wins. With `--brief --worker`, main prints `--brief requires a value` and lane prints the review-option line. Harmless.

## (b) A normal pi build and a normal Claude build

Command: `node <scratch>/ltc-indep/b.mjs` (fake builder sleeps 600 ms).

| Builder | Tree | Exit | Output file | Records | Lock after | Temp after |
|---|---|---|---|---|---|---|
| pi (small) | main | 0 | `fake pi report` | start, end ok exit 0 | no | empty |
| pi (small) | lane | 0 | `fake pi report` | start, end ok exit 0 | no | empty |
| Claude (larger) | main | 0 | `fake claude report` | start, end ok exit 0 | no | empty |
| Claude (larger) | lane | 0 | `fake claude report` | start, end ok exit 0 | no | empty |

The stderr is the same line for line between main and lane, cpu poll lines and timings left out. Only the `--out` path and the lane's running build count differ: builder line, precedent line, carry line (Claude only), trust line, attempt line, SUCCESS line, build-record line.

## (c) SIGINT, SIGTERM, SIGHUP at six moments (Claude builder; pi builder and group SIGINT spot checks)

Command: `node <scratch>/ltc-indep/c.mjs all larger` (raw `c1.out`), `… small SIGTERM` (`c2.out`), `… larger SIGINT group` (`c3.out`). Each signal went to pi-worker's pid unless marked group. The table shows the same result for all three signals. Exit codes map SIGINT 130, SIGTERM 143, SIGHUP 129.

| Moment | main | lane |
|---|---|---|
| M1 before the temp folder (git stub sleeps 1.5 s on the first show-toplevel) | killed by the signal within 5 ms; no temp, no lock | same as main |
| M2 start-up window, temp folder made, lock not yet taken (trust check held 1.5 s) | killed within 2 ms; temp folder left (4 entries, key file mode 600); trust child orphaned | stop code and `[pi-worker] aborted by SIGx` after about 1.55 s (when the trust check returned); records start plus end `stopped`; no lock; temp empty |
| M3 start-up window, lock held (git stub sleeps 1.5 s on the start record's `rev-parse HEAD`) | killed within 2 ms; temp folder left with key; lock left; no record | stop code and abort line after about 1.53 s; records start plus end `stopped`; no lock; temp empty |
| M4 validateLane git call inside runWatchdog | stop code and abort line after about 1.51 s; clean | same as main |
| M5 during the build | stop code and abort line within about 25 ms; builder killed; clean | same as main |
| M6 final record write (git stub sleeps 1.5 s on the end record's `rev-parse HEAD`) | killed by the signal within 4 ms; output written; only a start record; lock left | signal not acted on: `SUCCESS`, exit 0, records start plus end `ok`, lock released, temp empty |

- pi builder, SIGTERM at M2, M3 and M6: the same pattern. Main left `preamble.md` (2 entries, no key) and, at M3, the lock. Lane stopped with 143 and left nothing. At M6 lane exited 0 with SUCCESS.
- Group SIGINT (terminal Ctrl-C) at M2 and M3: the signal also ends the trust child or the git stub. So lane stops within about 89 ms with 130, the abort line and nothing left. Main is killed and leaves the key file, plus the lock at M3.
- Builder spawn after a queued start-up signal (`c4.mjs`, `claude` replaced by an sh shim that logs before exec): the `[pi-worker] attempt 1/1` line prints, so the watchdog starts the builder. But the shim never reached its first line in 3 of 3 runs. The group SIGKILL lands first.
- Swallowed stops: none during the build or before it. M6 is the only moment where main honoured a signal and lane did not. There the builder had already ended, the output was complete, and lane exited on its own right after the record write: 1.45 s with the stub's 1.5 s sleep, a few ms with real git (inferred). No build runs on. Note, not material: the exit code is 0 instead of 1xx, and main's handling at that moment left a stale lock and no end record.

## (d) A closed stderr, a closed stdout, and `| head -1` on stderr

Command: `node <scratch>/ltc-indep/d.mjs` (raw `d.out`; builder sleeps 1.5 s; both builders; pipes closed once the builder pid file exists).

| Case | main | lane |
|---|---|---|
| stderr pipe closed mid-build | exit 1 at about 0.7 s; only a start record; lock left; temp left (Claude: 6 entries with key; pi: 4); builder still running after pi-worker exits | exit 0 at about 1.83 s; output written; records start plus end ok; no lock; temp empty; builder ended |
| stdout pipe closed mid-build | exit 0, clean | exit 0, clean (pi-worker writes nothing to stdout) |
| `( pi-worker … ) 2>&1 >/dev/null \| head -1` | exit 1 at about 0.27 s; lock and temp left (key for Claude); builder still running | exit 0; head printed the builder line; clean |
| `… 2>&1 >/dev/null \| true` (reader gone before start) | exit 1; lock and temp left; builder still running | exit 0; clean |

The last row covers writes made before the `process.stderr.on('error')` line. The builder and precedent lines are written before it. Lane still survives, because the EPIPE `error` event is emitted after the synchronous set-up has registered the listener (measured; cause by reading).

## (e) A hung trust check or git call in the start-up window

Commands: `node <scratch>/ltc-indep/e.mjs` (pid signals) and `e2.mjs` (group SIGTERM). The trust preload blocks forever, or the git stub sleeps 1000 s on the start record's `rev-parse HEAD`.

| Hang | Signal | main | lane |
|---|---|---|---|
| trust check (before lock) | SIGTERM to pid | ended within 5 s check (killed by SIGTERM); temp left with key; trust child orphaned | still alive 5 s after SIGTERM, and 2 s after another SIGTERM plus SIGINT plus SIGHUP; SIGKILL ends it and leaves the temp folder with key; trust child orphaned |
| git `rev-parse HEAD` (lock held) | SIGTERM to pid | killed; temp left with key; lock left; git stub orphaned | alive after 5 s and after the second round; SIGKILL leaves temp with key, the lock and the orphaned git stub |
| trust check | group SIGTERM | killed in 8 ms; temp left with key | exit 143 in 103 ms, abort line, records start plus end stopped, nothing left |
| git `rev-parse HEAD` | group SIGTERM | killed in 6 ms; temp with key and lock left | exit 143 in 106 ms, nothing left |

The trade, in numbers:
- A pid-directed stop cannot end lane pi-worker while a start-up helper hangs. It needs SIGKILL, and SIGKILL leaves exactly what main's SIGTERM left.
- A group signal ends the helper too, so lane stops cleanly in about 0.1 s where main left the key file.
- A healthy start-up window lasts 134 to 145 ms on this machine (5 Claude and 5 pi runs, from the temp folder's appearance to the capture folder's).
- Neither helper is expected to hang under honest variation: the trust reader opens its store O_NONBLOCK and refuses non-regular files (by reading), and `git rev-parse HEAD` takes no lock (inferred). Note, not material.

## (f) worker-claude.test.mjs and build-records.test.mjs with CLAUDE_CONFIG_DIR exported

Commands: `<scratch>/ltc-indep/f/run.sh` and `f/run-main.sh`. The decoy `f/cfg/settings.json` held `apiKeyHelper` and an `env` block (`HTTPS_PROXY`, `ANTHROPIC_API_KEY`, `NANA_ROLE`).

| Tree | CLAUDE_CONFIG_DIR | worker-claude | build-records |
|---|---|---|---|
| lane | exported to the decoy | 13 PASS, 1 SKIP (Windows-only R-2650), exit 0, 15 s | 7 PASS, exit 0, 13 s |
| lane | exported empty | all passed, exit 0 | exit 0 |
| lane | unset | all passed, exit 0 | exit 0 |
| main | exported to the decoy | 3 FAILED (R-2655, R-2664, R-2665), exit 1 | exit 0 |

So the lane's clearing fixes a real failure in worker-claude. In build-records it guards nothing that fails today (measured on main).

## (g) Code read for other changes to a healthy build

The diff to `pi-worker.mjs` touches 14 lines.
- The review check moved to the top over raw argv. That changes only first lines for doubly-bad invocations ((a)).
- Three no-op signal listeners are registered once per lane run, just before mkdtemp, and kept. `process.stderr.on('error')` is added in lane mode only. Non-lane mode is unchanged.
- `pi-watchdog.mjs` is byte-identical to main.
- Healthy builds: same exit, output, records, lock release and stderr ((b)).

Notes, none material:
1. Signals after runWatchdog returns are not acted on (M6 above). The remaining work is synchronous: output write, end record (git rev-parse HEAD, session usage scan, ledger append), lane line. Then pi-worker exits with the build's code.
2. A start-up signal is queued until runWatchdog's first await. That await comes after the builder is spawned, so a builder process is started and SIGKILLed within ms, and the ledger records a `stopped` build with one attempt (measured, (c)).
3. A terminal Ctrl-C during the trust check also ends the trust child. `trusted()` then returns false, and pi-worker prints `trust: none …` before it aborts, even for a trusted worktree (inferred by reading; the fixture worktree is untrusted, so the line was printed either way).
4. Unchanged and outside the lane, measured identical on both trees: an unreadable known-bug file (mode 000) crashes pi-worker with an uncaught EACCES after the temp folder exists. It leaves `preamble.md` only, no settings file, no lock (`g.mjs`).
5. Unchanged and outside the lane: SIGQUIT has no listener in either tree, nor SIGBREAK on Windows. A launch refusal on Windows leaves a queued signal undispatched (plan-attack N-9; not re-run).
6. Not run: Windows. By reading, `process.on` for SIGINT, SIGTERM and SIGHUP is supported there. A stderr EPIPE reaches the `error` event, not a throw (inferred).
