# build-records: plan attack (adversary, 2026-10-22, main 61ac64f3)

Read against main 61ac64f3 (clean), the installed pi 1.0.2, this machine's pi sessions (read-only), and the other five plan drafts in this folder. Scratch scripts: `../br-attack/*.mjs`. Every number below was measured unless it is marked inferred.

Counts: **M 3 · S 10 · N 13**

## M — must change the plan

**M1. Retiring R-732 turns the suite red through FEAT-007's share.**
- FEAT-007 lists R-732 on its Also applies line (REQUIREMENTS.md:498, `Also applies: R-137, R-732, R-1125`).
- The tree checker reports a retired row on any Also applies line (scripts/requirements-tree.mjs:217, `why = "is retired"`).
- `packages/nana-pack/tests/requirements-tree.test.mjs::R-288: real ledger has no structural problems` requires zero problems. So the retire alone fails the suite.
- D9 and "Docs and rows that change" leave this line out. The outline lines that follow from it (docs/requirements-tree.md:63 and the share table at :376) are left out too.
- Change: on FEAT-007's Also applies line, replace R-732 with R-2603. R-2603 keeps the review-ledger half that FEAT-007 shares it for. List the edit under rows that change, and regenerate the outline. Note that docs/product-report/assessments.json:1281 and :1887 stamp R-732's hash. The product report then marks those assessments stale. That is report-only, and the seat's queued report refresh covers it.

**M2. R-2598 never says where the stub gets its session folder and entry shapes, so the test can agree with a wrong reader.**
- "The stub writes its session into the default folder" names no oracle. Suppose the stub, or the test, builds the folder with the lane's own encoder or a hand copy of it. Then an encoder that leaves `:` in place, skips pi's normalizePath, or encodes the fsReal'd cwd still passes. That holds on Windows too, which is the one place the drive-letter rule matters.
- The usage shapes are the same problem. Across the 605 real builder sessions, 0 tool-result messages carry usage, and so do 0 `usage` entries and 0 branch summaries (measured, `../br-attack/scan.mjs`). pi's code is the only evidence for those shapes (session-manager.js:864-897 and :1187-1199). A hand-written fixture repeats the builder's guess.
- Change: the R-2598 stub writes its session through pi's own `SessionManager` (a root export, dist/index.js:23). It resolves pi with `packages/nana-pack/tests/pi-install.mjs::findPiRoot`, which already has a win32 branch, and calls:
  - `SessionManager.create(process.cwd(), <the env folder or undefined>)`
  - `appendSessionInfo(<the --name it received>)`
  - `appendMessage` for the user message, the assistant messages and a tool result carrying usage
  - `appendUsage`, `appendCompaction(…, usage)` and `branchWithSummary(…, usage)`

  The test then appends the torn last line as raw bytes. Precedent (add both entries): apps/desk/test/pi-087-entries.test.mjs:49-60 writes a session, `appendUsage` included, through pi's own SessionManager. packages/nana-pack/tests/agent-dir-parity.test.mjs pins agent-dir.mjs against pi's own rule. Add a wrong-code pair: "folder encoded from the fsReal'd cwd, or without the `:` replacement". On a Windows runner whose temp folder is a short path, R-2598 must turn red (inferred: the GitHub Windows image's TEMP is an 8.3 path).

**M3. R-2596 is wider than its test, and no test ties pi-worker's real pid and lock to the running or killed rule.**
- R-2596 names about fifteen values. Its test asserts the values of tip, feature and brief only. The others (pid, lock, laneSize, slot, provider, model, thinking, cwd, startedAt) are checked only by "every field", which means presence.
- R-2601 uses hand-made ledgers only. So each of these passes every planned test:
  - `pid: process.ppid`
  - a lock path under the common folder
  - `slot: "builder"` on a `--lane-size larger` launch with a larger builder set
- D3's whole reason for two lines is the hard kill, and no case kills a real pi-worker.
- Change (a): R-2596 asserts each value:
  - pid equals the spawned pi-worker's pid (spawn's `child.pid`)
  - lock equals `<git-dir>/nana-lane.lock`, as the worker-lane harness computes it (worker-lane.test.mjs:38-39)
  - a larger launch with `largerBuilder` set records slot `largerBuilder` and that entry's provider, model and thinking
  - a larger launch with the slot null records `builder`
  - cwd and sessionDir equal the folder the M2 stub actually wrote to
- Change (b): R-2601 adds one real build. The stub sleeps. The test runs build-report and expects `running`. It then SIGKILLs pi-worker (`taskkill /F /PID` on win32), runs the report again, and expects `killed` with the stub's session cost.
- Add pairs: "pid recorded as `process.ppid`" and "slot always `builder`".
- If the seat takes S6's subtraction instead, (b) shrinks to "an unpaired start reads as no end", with the same SIGKILL step.

## S — should change

**S1. The store departs from the precedent it names, with no reason given.**
- The plan calls suite-records "the pattern", but that store writes one file per record: `wx` to a temporary file, then rename (suite-records.mjs:75-101). It needs no lock and has no torn lines.
- The plan instead appends to one JSONL file with no lock. That form brings three reader cases R-2600 has to carry: a torn line, an end line with no start, and the residual in D2.
- Change: either state why in D2 (for example, the end line and report read one file rather than a folder listing), or use per-build files with new names, `<stamp>_<build>.start.json` and `.end.json`. New names avoid a Windows rename-over failure. Default: keep JSONL and state the reason.

**S2. The ledger read has no named cap, and the pack's usual reader would break it in about a month.**
- D10 says the ledger is "read whole". `readBounded` defaults to 1 MiB (bounded-read.mjs:12) and throws `ERR_TOO_LARGE` when the file is larger (:26).
- This repo ran 423 builder sessions in 16 days (measured). At about 1.25 KB per start-plus-end pair (inferred from D6's fields), the ledger grows about 33 KB a day. It passes 1 MiB in about 32 days (inferred).
- Change: name `BUILD_LEDGER_READ_MAX_BYTES` with that growth arithmetic as its provenance, or state "unbounded read" as a decision. Say what the end line and report print when the ledger is over the cap. The build stays unchanged, as R-2599 says.

**S3. The session matcher needs a named head-read size.**
- To match a session, the matcher reads its header cwd and its first `session_info` name. Over 2,482 named sessions on this machine, those two lines end within 356 bytes. The header alone is at most 233 bytes. `session_info` is line 2 in all 605 builder sessions (measured, `../br-attack/head.mjs`).
- Change: name `BUILD_SESSION_HEAD_BYTES` (for example 4 KiB, with that measurement as provenance). Read only the head of each candidate. Read the whole file, under the 64 MiB cap, only for a match.
- Note that `readBounded(file, cap, readLimit)` still refuses a file over `cap` (bounded-read.mjs:26). So the head read passes a large cap and a small read limit. Otherwise one large pi-review session in the folder makes the build's cost unknown.

**S4. On Windows, the plan does not say which cwd spelling the record keeps or the matcher compares.**
- pi stores its raw `process.cwd()` as the header cwd (dist/main.js:464 and session-manager.js:700-703).
- pi-worker's `cwd` is `realpathSync.native` on win32 (pi-worker.mjs:85 and :165). The Windows leg already launches lanes from an 8.3 short path and from a differently cased path (win32-launch.test.mjs:347-374).
- D4 encodes the folder from `process.cwd()`, which is right. But D6's `cwd` field and D4's "header cwd is the worktree" leave the comparison form open.
- Change: record `cwd` as the raw `process.cwd()`. Compare the header cwd after fsReal on both sides, and fall back to a string compare when the worktree is gone.
- Add one R-2598 build launched from the short path on win32. Skip it when the volume keeps no short names, as win32-launch.test.mjs:364-366 does. Add that file to Precedent.

**S5. Normalize `PI_CODING_AGENT_SESSION_DIR` as pi does, and make the new tests hermetic for it.**
- pi reads the variable through `expandTildePath`, which is normalizePath (dist/main.js:548-551, dist/config.js:440-441). It treats an empty value as unset, and `SessionManager.create` normalizes the value again (session-manager.js:1317).
- D4 says only "the folder when set". With a quoted `~/…` value or a relative one, pi writes elsewhere, and the build's cost reads as unknown.
- Change: reuse `piNormalizePath` (agent-dir.mjs:39) and resolve against `process.cwd()`. Treat an empty value as unset. Give R-2598's flat-folder build a `~/…` value. Add the Precedent entry.
- The suite scrubs only NANA_*, PI_CODING_AGENT_DIR and CLAUDE_CONFIG_DIR (scripts/test.mjs:328). So the new harness must delete `PI_CODING_AGENT_SESSION_DIR` itself. Otherwise an ambient value moves every default-folder case. The variable is unset on this machine (measured).

**S6. `killed` can name a build whose pi is still running and spending.**
- pi-watchdog starts pi detached, in its own process group (pi-watchdog.mjs:193). A SIGKILL to pi-worker therefore leaves pi working in the worktree. The report then says `killed` while that pi's minutes and cost keep growing. The lock refusal already warns about live pi groups (pi-worker.mjs:210).
- Change: add a known-limit line. Make the report's word say only that pi-worker is gone, for example `killed (pi may still run)`, or print the age of the session's last entry.
- Alternative, by subtraction: one `no end` state replaces running and killed. That drops the pid liveness rule, the pidIsAlive move, the mutation-runner edit and the pid-reuse residual. The audit's measure, builds per lane, does not need the distinction. Default: keep the plan's two states with the honest label.

**S7. R-2602's test must assert the lane line's outcome breakdown.**
- D8 renders both lines with one function, so an equality check passes when that function is wrong in both places.
- The count "3 builds" also survives the likeliest ordering bug. If the lane line is rendered before this build's end record is appended, this build has no end and the lock is already released (pi-worker.mjs:187). It then shows as `killed`, and the count is still 3.
- Change: assert the literal alpha line, with 2 ok and 1 killed, this build among the ok. Add a wrong-code pair: "lane line rendered before the end record is appended".

**S8. An honest output-write failure after a long build is recorded as `killed`.**
- `--out` is checked for presence only (pi-watchdog.mjs:107-118). A missing folder makes `writeFileSync` throw at pi-worker.mjs:186, after the whole build. The `finally` at :187 releases the lock, and the exception exits.
- If the end append sits after the write, the build reads as `killed`.
- Change: append the end record in that `finally`, before the release. Use outcome `failed` and name the output error, so this case is recorded. Otherwise list it under known limits beside the exception line.

**S9. A cross-lane collision with brief-reader-fixes, planned now in the same feature.**
- That draft edits lib/brief-precedent.mjs, the pack README's lane paragraph (README.md:295), worker-lane tests, FEAT-006's table and docs/known-bugs/FEAT-006.md.
- This plan edits `checkBriefForLaunch`'s ok result, the same README paragraph, FEAT-006's table, the same known-bug file and FEAT-006's line in the outline.
- Change: name that lane in Seat steps and set the order. Default: build-records lands second, merges main, then regenerates the tree and code map.

**S10. Two more rows are wider than their tests.**
- R-2597 names attempts and the duration. The test should assert `attempts` 1 in each of the four cases, and `durationMs` equal to `endedAt − startedAt` and at least 1,000 in the ceiling case.
- R-2599 says the line names the path and the error. The test should assert that the ledger path and the error code (`ENOTDIR`, `EISDIR`) appear in the line, not just one line with the prefix.

## N — notes

**N1. The plan's measurements reproduce.** These match exactly: 605, 564 and 423 sessions, 134 folders, 93 with two or more, 59 with three or more, $623.97, and the sizes 615,003 / 1,498,092 / 2,936,151. Over all 605 builder sessions there are 34,185 assistant messages and 12 compactions, which fits the plan's 564-session subset. All 60 zero-priced assistant messages have `stopReason: error` and 0 tokens, so no "tokens but no price" case exists today.

**N2. The lane class is right.** pi-worker, pi-watchdog (left unchanged), mutation-runner and the bench are not on AGENTS.md's install, hook or gate list. precedent-first classed its change to this same launcher as ordinary (must-meet.md:5).

**N3. The IDs are free.** R-2596 to R-2605 have 0 uses on main. The other planned lanes take R-2586–2595, R-2606–2615, R-2616–2622, R-2623–2628 and R-2631–2638, so none overlaps.

**N4. The Precedent section reads clean.** All 22 Precedent paths are tracked at 61ac64f3. The real `readBrief` parses 22 entries and FEAT-006 from this draft.

**N5. The new line prefix clears existing filters by one letter.** worker-lane.test.mjs:430, :444 and :496 filter on `startsWith("pi-worker: builder")`, with no colon. `pi-worker: build record:` does not match, but only by one letter. Never name the line `builder record`.

**N6. Nested pi runs go uncounted.** A builder's own pi runs, such as a project's e2e or a pi-review it starts, write differently named sessions in the same folder, and the matcher does not count them. Lane folders on this machine hold 220 pi-review sessions and 5 sessions with another name. Add a known-limit line.

**N7. A reused lane name merges into one lane line.** docs/reviews holds one lane name reused across three dates. The merge is rare, but say so in the limits.

**N8. Cents hide the default builder's spend.** The roster's builder (luna) costs $26.78 for 1.85 billion tokens here: 24,812 messages at the catalog's 0.1/0.5/0.01 per million. A luna build prints as a few cents. Consider printing `totalTokens` beside the cost in the lane line.

**N9. Some contract vocabulary is still inline.** Name each of these once with its source:
- the `-a<attempt>-` name infix (pi-watchdog.mjs:180)
- the session file stamp form and `.jsonl` (session-manager.js:712-713)
- the usage-bearing roles and entry types (agent-session.js:3345-3380)
- the minute rounding rule (floor or round)
- the target module for the moved `pidIsAlive`, which is unnamed

**N10. Two cheap fields would help the audit.** Record `out`, the builder's output file. Record a sha256 of the brief: pi-worker already reads it, and the seat commits brief copies under docs/reviews/<lane>/. Both tie a build to its report and brief by code, which is what the audit did by hand.

**N11. Keep review-round out of pi-worker's import graph.** R-2603's regex reads only pi-worker.mjs, so keep lib/build-records.mjs free of review-round imports. Leave `repoKeyOf` in build-report.mjs only.
- `repoKeyOf` returns `git:<path>` (review-round.mjs:188), so strip the prefix or use suite-records' resolver form (suite-records.mjs:36-40).
- Its error text says "admission refused", so catch it and print review-ledger's `--repo is not a git repository` (review-ledger.mjs:103).

**N12. Use exact amounts in R-2598.** The test asserts every bucket "exactly", so use binary-exact amounts, for example multiples of 1/1024. Then a different summing order cannot fail it.

**N13. The plan does not name the line its spend serves.** The 2026-09-16 ruling asks for that line. land-reads-ci names its queue line. This lane traces to the power-mode should-fix ("each build writes a record of seconds, attempts, exit and cost"). That asked for four fields. The plan adds a report command, a running/killed rule, two moves and eight rows. Add the line, and say which added part the audit's measure needs (see S6). HANDOFF's next queued item, "The builder launch in the install check", will run a real lane build. It writes its record in its fixture's own git folder, which needs no change here.
