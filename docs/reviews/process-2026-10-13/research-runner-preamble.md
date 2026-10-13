# Research: suite runner and builder preamble (lane `process`, 2026-10-13)

Stakes read: the preamble is low-blast and reversible (a prompt file plus one test file). The parallel runner is
high-blast: its exit code is the land gate (`packages/nana-pack/bin/nana-land.mjs:104-106` runs `--suite` and refuses
on non-zero) and the release gate (`.github/workflows/ci.yml:70`, `:73`). If a scheduler bug loses a file's result,
the gate fails open.

Everything below was gathered read-only. The measurements ran from the main checkout under the runner's own
hermetic env. The seat machine is a 10-core M1 Max with load average 58-104 from other projects (vitest workers and
a node process at ~400% CPU) during these runs, so the absolute times are inflated.

---

## Part 1: the suite runner

### 1.1 How it runs now

- `scripts/test.mjs:350-399` is a `for … await runFile()` loop: one file at a time. `active` and `activeFileTmp` are
  single slots (`:72-74`), and `cleanup()` kills only that one tree (`:93-106`).
- Each file gets its own temp HOME and USERPROFILE (`:361-362`) and its own TMPDIR (`:359`). NANA_* and
  PI_CODING_AGENT_DIR are scrubbed (`:279-288`), and every child gets gc.auto=0 (`:283-286`, R-648).
- The tracked-file snapshot runs before and after the whole run (`:293-325`, `:404-412`, R-918). It is per run, so
  parallelism does not affect it.
- `scripts/test-locked.mjs:168`: only an unfiltered run takes the machine lock (`~/.nana/suite.lock`, `:17`).
  Filtered runs never wait (R-627).
- `README.md:249-250` and `scripts/test.mjs:20-22` both claim "one file at a time". A parallel runner changes both
  claims, so readme:check is affected.

### 1.2 Measurements

| Run | When | Files | Wall | Longest file |
|---|---|---|---|---|
| main after land-rule (scratch `main-suite-after-land.log`) | 10-10 16:22 | 133 | 579.7 s | review-ledger 96.3 s |
| cc-hooks-windows land (`cch-land.log`) | 10-13 07:43 | 137 | 725.0 s | review-ledger 156.1 s |
| install-check final (`ic-suite-final.txt`) | 10-13 10:10 | 138 | 880.0 s | review-ledger 199.6 s |
| CI macOS, a907b45 (job 115335596114) | 10-13 | 137 | 745.9 s | review-ledger 137.2 s |
| CI Ubuntu, same run (job 115335596395) | 10-13 | 137 | 450.5 s (1 FAIL: lane-write-guard) | review-ledger 69.0 s |
| CI Windows, same run (job 115335595608) | 10-13 | 137 | 437.1 s (67 FAIL, non-blocking) | n/a |
| This research: 4-file filtered run, load 73→101 (`measure-filtered.log`) | 10-13 | 4 | 338.7 s wall, **156 s CPU** (103 user + 53 sys) | review-ledger 202.8 s |
| This research: review-ledger alone under a process probe (`count/`) | 10-13 | 1 | 201.4 s wall, **101 s CPU** | n/a |

- The suite grew from 580 s to 880 s (+52%) in three days.
  - review-ledger roughly doubled (96 s to 200 s; 901 to 1,052 lines).
  - land.test went from 13.6 s to 72.8 s (389 to 581 lines).
  - templates-update did not change (287 lines) yet ran 49 to 121 s. That spread is load, not code.
- The top four files are 53% of the serial time (624 of 879 s in `ic-suite-sorted.txt`). The other 108 files take
  less than 5 s each, 100 s in total.
- CPU is about 0.46 to 0.5 of one core per wall second. The suite mostly waits on process start-up and
  subprocess latency. It is not CPU-bound.

### 1.3 Why it takes this long

1. **Serial execution of subprocess-heavy files.** The probe counted every node process review-ledger spawned:
   - 213 `review-ledger.mjs` CLI runs: 101 s.
   - 33 `pi-review.mjs` runs: 60 s.
   - 11 `pi-worker.mjs` runs: 8 s.
   - 169 `node -e` runs: 11 s.

   That is 180 of the 201 s, before counting the git processes. Process start-up latency rises with machine load.
2. **The watchdog's poll floor.** The loop at `pi-watchdog.mjs:124-125` sleeps a full `--poll` before it checks
   whether the child exited (`:135`). Every test pi-review run at `--poll 1` therefore costs at least 1 s
   (`review-ledger.test.mjs:82`, `:1036-1047`); 22 of 33 runs took 1 s or more. Moving these test calls to
   `--poll 0.1`, as `immutable-review` already does, would save about 30 s of review-ledger. That figure is
   inferred, not measured.
3. **Copier renders clone the repository** at a ref (`templates-update.test.mjs:193-275`). Each file's temp HOME
   also starts uv with a cold cache. Measured here: `uvx copier --version` took 4.1 s cold and 0.5 s warm. That is a
   per-file and network-dependent cost, and parallelism does not change it.

### 1.4 Simulated parallel schedule (no contention modelled; `simulate.mjs`)

| N workers | ic run (879 s serial) | cch run (725 s) | CI macOS (745 s) |
|---|---|---|---|
| 2 | 441 s | 364 s | 375 s |
| 3 | 295 s | 245 s | 253 s |
| 4 | 260 s (longest-first 220 s) | 199 s (181 s) | 196 s (186 s) |
| 6 | 224 s (200 s) | 178 s (156 s) | 168 s (137 s) |

The floor is the single longest file, review-ledger (137-200 s). Past four workers, splitting or speeding up
review-ledger gains more than adding workers. With collection order, review-ledger starts late (alphabetical
order), and that costs about 40 s at N=4 compared with longest-first.

### 1.5 Files that need serial treatment or care before parallel runs

| Concern | Files (file:line) | Verdict |
|---|---|---|
| **Fixed port** | `apps/desk/test/origin-rule.test.mjs:17`: `DESK_TEST_PORT \|\| 4391`, in the default set | Fix first. This contradicts builder-brief rule 4's claim that no `npm test` file binds a fixed port since t1-flake, the premise for unlocked filtered runs. It is a single instance within one run, but two worktrees running it unlocked collide. The fix pattern exists: `DESK_PORT=0` and read the bound port (`host-rule.test.mjs:154-170`). |
| Probe-then-bind ephemeral ports (time-of-check race) | `freePort()` in `buffer-caps:41-51`, `crash-paths:45-55`, `host-rule:26-36`, `prompt-detach:47-55`, `spawn-and-persist:54-63`, `changes-endpoint:617-625`, `teardown-invariants:36` | Low odds. The race window grows with jobs. A later fix is to move to `DESK_PORT=0`. |
| Wall-clock upper bounds | `nana-knowledge/tests/hook.test.mjs:200` (<1500 ms), `:339` (<1800 ms on a 1500 ms deadline: 230 ms headroom), `test-locked.test.mjs:103` (<1200 ms), `bounded-read.test.mjs:37` (<1000 ms), `review-ledger.test.mjs:614` (<3000 ms) | Most likely false reds under self-contention. Either run them in a serial set or widen the bounds, each with provenance. |
| CPU-flat stall detection in 1 s windows | `review-ledger.test.mjs:82`, `:1036-1047` (`--poll 1 --stall-secs 1`); two `--stall-secs` <3 sites in `immutable-review.test.mjs` | A CPU-starved stub can read as flat and produce a false STALL. Inferred; not observed. |
| Machine-wide process scan | `post-edit-hardening.test.mjs:101` (`pgrep -f`) | Safe: the marker is pid plus random (`:94`). |
| Real `~/.pi` or dotfiles | none: temp HOME and scrub (`test.mjs:279-288`, `:361-362`) | Safe. The global pi install is read-only (pi-087-entries, pi-session-parity, agent-dir-parity). |
| Global suite lock | `test-locked.test.mjs:32` (temp `NANA_SUITE_LOCK_DIR`), `:145` (temp HOME) | Safe. |
| launchctl | `desk-service.test.mjs:117-123` (stub on PATH) | Safe. |
| Repository reads (clones, `git ls-files`) | template-acceptance, templates-render, templates-update, code-map, readme-check | Read-only. gc.auto=0 removes the 10-07 `gc.pid` race (R-648). |
| Runner self-tests | `test-runner.test.mjs` (39 checks; the termination check assumes one active tree) | These must keep jobs=1, or be rewritten. |

### 1.6 Size and risk of a parallel runner

It is its own lane, not a small change.

- **Code.** It changes about 100 to 150 lines of a 419-line runner:
  - a worker pool;
  - `active` and `activeFileTmp` become sets, and SIGINT, SIGTERM and timeout kill every tree;
  - each file's output is buffered and printed in collection order, so logs stay diffable;
  - `--verbose` falls back to one job;
  - a declared serial set;
  - a closing check that every collected file reported exactly once.
- **Rows touched.** R-609, R-610, R-613, R-616, R-912, R-915 and R-917, plus the README claim. New rows cover:
  - the jobs default and the `NANA_TEST_JOBS` override (a tunable with provenance; the existing scrub keeps
    `NANA_TEST_*`);
  - collection-order output;
  - killing every active tree;
  - each file reported exactly once;
  - the serial set;
  - verbose running serially.

  That is about six IDs.
- **Tests.**
  - Concurrency is proved with a deterministic rendezvous, not timing: fixture A waits for a file that fixture B
    writes, so a serial run times out and a parallel run passes.
  - A lost-result fixture proves the run fails closed.
  - The termination check covers two live trees.
- **Risks.**
  1. A fail-open in the land gate: a worker's failure is dropped and the run exits 0.
  2. False reds from the timing bounds in 1.5. Per builder-brief rules 4 and 6, false reds across worktrees have
     already cost lanes days.
  3. The shared machine already runs at load 60-100. Four jobs at about 0.5 core each add about 2 cores of demand,
     so the real gain is below the simulation.
  4. CI defaults. Public-repo runners have 3 vCPU on macOS and 4 on Ubuntu and Windows (GitHub's published specs;
     not measured here). The macOS leg is the blocking one.
  5. Two locked full runs still serialize. The lock stays: two parallel suites would double the load.
- **Class.** It is a gate lane: two plan rounds, Sonnet 5.5 builder.

**Recommendation: split.** Keep the process lane to working-pattern text, the pi-review last-line instruction, the
`--over-cap` refusal, checklist step 8 and the preamble. Run the parallel runner as the next lane. Put its
preconditions first in that lane:
- origin-rule on port 0;
- the five wall-clock bounds;
- the review-ledger `--poll` change.

Then seal a jobs default measured on a quiet seat machine and on CI macOS.

---

## Part 2: the builder preamble

### 2.1 How it reaches a builder

- In lane mode only, `pi-worker.mjs:92-97` reads `prompts/builder-preamble.md` and replaces `{{WORKTREE}}` and
  `{{BRANCH}}`. It writes the result to a temp file and passes it as the FIRST `--append-system-prompt`, with the
  brief second (`:98`). The temp dir is removed after the run (`:135-137`).
- Non-lane `pi-worker` runs, such as sol verification, get no preamble.
- **Sonnet 5.5 builds as a seat-spawned Claude subagent** (shared memory `reference_roster.md:22`), so it never
  receives the preamble. Under the 10-13 builder split, the larger lanes go to the builder that sees none of these
  rules unless the seat pastes them. Proposal: the working pattern says a Claude builder's brief starts with the
  rendered preamble. Mechanizing this would mean new launcher code; leave it out of this lane.
- Existing pins:
  - `worker-lane.test.mjs:80` (R-961): order, and "on branch feat/alpha";
  - `:86` (R-628): the package-manager sentence, verbatim.

  Both checks read `prompt-1`, the RENDERED file the stub pi received. That is the right surface for new pins too.
- The file has not changed since `df6372f` (2026-10-08). It has 18 lines and 201 words.

### 2.2 Which rules recur

There are 68 build briefs across 13 lanes in `docs/reviews/*/build-brief*.md`. The table counts how many lanes
re-paste each rule.

| Rule (`feedback_builder_brief_rules.md`) | Lanes re-pasting it | Builder-side? | In the proposal |
|---|---|---|---|
| 7 wrong code first | 6 | yes | yes |
| 8 fix the class | 6 | yes | yes |
| 9 title check `0 missing` (seat-titles) | 9 (any seat check) | yes, the DONE condition | yes ("seat checks before DONE") |
| 10/12 verbatim output to a committed file, paste only the tail | 10 | yes | yes |
| 10b independent parser for generated output | 1 | yes | no: it has not recurred |
| 11 CRLF, trailing whitespace, no final newline | 4 | yes | yes |
| 13 no suite test runs a seat script; report the check count; no silent deletions | 5 | yes | yes |
| 14 harness awaits async cases; the boolean helper refuses a function | 2 lanes, 2 incidents | yes | yes |
| 15 corpus from every repo | plan-time | no (seat) | no |
| 16 IDs from the lane's range | 3 | yes | yes |
| 17 a mutation pair for each "stays" clause | plan-time | no (seat writes §5) | no |
| 18 differential lexer test | plan-time | no | no |
| 9 three items per session; 4 `--stall-secs` | n/a | no (seat sizing and launch) | no |
| Seat queue: suite green before commit | n/a | yes | yes, reconciled (see 2.4) |
| Seat queue: committed seat checks before DONE | n/a | yes | yes |
| Seat queue: report after reading CI | luna and Sonnet briefs both ask for CI (e.g. `ci-pi-pin/build-brief-1.md` "Done") | yes | yes |

Rules 1, 2, 3 and 5, the no-pipe rule and the package-manager rule are already in the preamble and stay.

### 2.3 Proposed text

The proposal is in `builder-preamble.proposed.md`: 33 lines, 434 words, three headed groups (Scope, Tests, Before you
report). It keeps every sentence the current tests pin:
- "on branch {{BRANCH}}";
- the R-628 package-manager sentence, byte for byte;
- the `VERDICT:` first line.

The report shape adds "the suite summary line with its check count" and "each seat check's result".

### 2.4 Conflicts to settle before freezing the text

1. **"Suite green before commit" conflicts with the seat's 10-11 change** "impact-selected tests per round, full
   locked suite once before external review" (`feedback_lane_process_2026_10_11.md:17`). Taken literally, the first
   rule means a 12-15 minute locked suite before every builder commit, plus a queue on the lock. The draft settles
   it this way: touched tests pass before each commit, and the full suite passes before the last commit, which is
   DONE. This is a seat call; it is not Jake's.
2. **Rule 4 ("no npm test file binds a fixed port") is false today** (`origin-rule.test.mjs:17`). Fix the test or
   correct the memory line.
3. **The memory file's "How to apply" is stale.** It says "the canonical preamble … must carry all six", and there
   are now 18 rules. Rule 12 also sits after rule 18.

### 2.5 How a test pins it

- **Rows.** The lane draft allocates IDs from R-1100 to R-1119; it can take these from that range.
  - (a) One row: "The canonical builder preamble shall state each of these rules: …". It names about eleven rules.
    It is one shall, and the row is the weakest of its rules.
  - (b) Optional: "The canonical builder preamble shall stay within PREAMBLE_MAX_LINES lines." The value is declared
    once beside the sealed lane values in `bin/worker-config.mjs`, as "chosen: a builder reads it every session;
    the 2026-10-13 refresh is 33 lines". One test seals it.
- **Checks.** Add them to `worker-lane.test.mjs` after the `good` run. Each reads the captured `prompt-1`, so one
  check proves delivery and content together.
  - Write one `check()` call per rule with a literal title, for example `lane preamble carries: wrong code first`,
    each with its own `// req:` line directly above. Do not use a loop. The trace rail cites `file::title`, and luna
    needs exact titles for the title check.
  - Each check asserts its key phrase occurs exactly once after whitespace normalisation. A duplicated or deleted
    line then fails by name.
  - Keep the existing R-628 and R-961 checks as they are.
- **Mutation pairs** (the seat's runner):
  - Delete each rule's line from `builder-preamble.md`; exactly that title goes red. That gives N of N pairs.
  - One pair duplicates a line, and the exactly-once check catches it.
  - If (b) is taken, one pair adds lines past the cap.
- **Not a pin.** That a builder obeys a rule is not testable. The test pins only that the rule reaches the builder.

---

## Claim most likely wrong

The parallel speedup in 1.4 assumes files do not slow each other down. The CPU measurement (about 0.5 core per wall
second) supports near-linear gains on an idle machine, but the seat machine is rarely idle (load 60-104 during this
research). The real N=4 figure on the seat could be closer to 2x than 3.5x. Measure it at a quiet time before
sealing a default.

## Artifacts (this folder)

- `ic-suite-sorted.txt`: per-file timings of the 880 s run, sorted.
- `ci-macos-a907b45.log`, `ci-115335596395.log`, `ci-115335595608.log`: the three CI suite legs.
- `measure-filtered.log`: the 4-file run with `/usr/bin/time -l`.
- `count/probe.log`, `count/preload.cjs`: per-process wall times for review-ledger.
- `simulate.mjs`: the schedule simulation.
- `builder-preamble.proposed.md`, `builder-preamble.diff`: the proposed text and its diff.
