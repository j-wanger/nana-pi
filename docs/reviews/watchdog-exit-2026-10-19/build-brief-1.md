# Lane watchdog-exit — build brief 1 (2026-10-19 · feat/watchdog-exit · tip after the seat's plan commit)

**Builder: Claude Sonnet 5, a subagent in `<worktrees>/watchdog-exit`.** Lane class: gate (pi-watchdog sits behind pi-review and pi-worker, which are the land and review tools). Read `must-meet.md` here first (the adversary's amended plan; `plan-attack.md` holds its reasons). Requirements first: add the rows `must-meet.md` lists as `planned` in the right feature table of `REQUIREMENTS.md`, run `npm run req:tree`, and bump the R-291 leaf-total literal in `packages/nana-pack/tests/requirements-tree.test.mjs` (three spots) by the rows you add; then the tagged tests; then the code; flip each row to `implemented` when its test passes. Run `npm run map` after adding or moving a module and commit the map. Do not run the full suite and do not push; the seat does both. Do not edit `HANDOFF.md` or `docs/sessions/`.

---

# Lane watchdog-exit, build brief 1 (2026-10-19, feat/watchdog-exit)

**Builder:** a Claude Sonnet subagent in <worktrees>/watchdog-exit, branched from main after win-review-paths lands.
**Gate lane.** The must-meet is WE1 to WE6 in `must-meet.md`. Rows R-1390 to R-1395 are already planned in REQUIREMENTS.md, right after R-919.
The seat's plan commit also updated the tree and the R-291 leaf total. Take new IDs only from R-1390 to R-1399.
Flip each row to `implemented`, with its test as evidence, when that test passes.

**Code:** change only `runOnce` in `packages/nana-pack/bin/pi-watchdog.mjs`.
1. Add one `ended` promise per attempt, resolved by the child's `exit` and `error` events. `spawnErr` is still set.
2. Each poll runs `Promise.race([timer, signalWait, ended])`, then `clearTimeout`.
3. The after-loop wait becomes `await ended`.
Keep the order of the checks after a wake. Keep `sleep` for the 1 s after a stall. Leave the interrupted and ceiling waits as they are.
Edit the header only if a tag becomes false.
**README:** add one sentence to the watchdog paragraph of `packages/nana-pack/README.md` (about line 88). It says the watchdog
ends an attempt as soon as pi exits, and that a pi killed by a signal the watchdog did not send is a failed attempt that is retried.

**Tests:** one new file, `packages/nana-pack/tests/watchdog-exit.test.mjs`. It has the six-tag header and puts `// req: R-139x` above each check.
- Temp HOME and USERPROFILE, and PI_CODING_AGENT_DIR set to an empty temp agent dir. Temp git repos with `core.autocrlf false`.
  WE4 and WE6 each get their own repo and their own HOME.
- Fake pi: one Node body. Every mode appends a line to COUNT. Every mode that exits writes `Date.now()` to EXITED just before it ends. FAKE_MODE picks:
  `ok` prints `VERDICT: LAND`. `fail` prints `503 upstream` and exits 1. `release` checks for RELEASE every 50 ms, then prints `VERDICT: LAND`.
  `kill` prints a line, then runs `process.kill(process.pid, "SIGKILL")`. `hang` waits on an idle timer.
- POSIX: `pi` is `#!/bin/sh` plus `exec "<process.execPath>" "<body>" "$@"`. It MUST exec. A sh parent that does not exec turns
  the kill into exit 137, and WE4 and WE6 would then pass on today's code. win32: use `writeFakePi(dir, body)` from `fake-pi.mjs`.
- WE1: pi-review `--item we1 --poll 60 --retries 0`, mode `ok`, spawnSync timeout 90 s. Expect exit 0, VERDICT in `--out`,
  and (time after the call) minus EXITED under 30 s.
- WE2: pi-worker `--poll 60 --retries 2`, mode `fail`, timeout 45 s. Expect exit 1 and COUNT 3. stderr carries, in order:
  `attempt 1/3`, `attempt 1 did not succeed — retrying`, `attempt 2/3`, `attempt 2 did not succeed — retrying`, `attempt 3/3`,
  `attempt 3 did not succeed`, `FAILED after 3 attempt(s)`. No `cpu=` line. Elapsed under 30 s.
- WE3: pi-worker `--poll 4 --stall-secs 100`, mode `release`, started with spawn under a 30 s limit. Write RELEASE right after the
  second `cpu=` line. Expect exit 0. Splitting stderr on `/\r?\n/`, exactly two lines match
  `/^  \[pi-worker a1\] cpu=[\d.]+s flat=\d+\/25$/`. Close time minus EXITED is under 2 s.
- WE4: pi-review `--item we4 --poll 1 --retries 1`, mode `kill`. Expect exit 1 (not 13), COUNT 2, `attempt 2/2`,
  `FAILED after 2 attempts` and no `unsettled`. `git worktree list --porcelain` shows no `nana-review-` entry.
  `<HOME>/.pi/agent/review-ledger.reservations` is empty or absent.
- WE5: pi-worker `--poll 1 --stall-secs 3`, mode `hang`, timeout 60 s. Expect exit 1, a `STALL` line and elapsed of at least 3,000 ms.
- WE6: build the lane fixture the way `worker-lane.test.mjs` does: a worktree on `feat/<lane>`, a brief file, and native real paths on win32.
  Run pi-worker `--lane <lane> --brief <file> --poll 1` with no `--`, mode `kill`. Expect exit 1, `FAILED after 1 attempt(s)`
  and `<git-dir>/nana-lane.lock` absent. Then run the same with mode `ok`: expect exit 0 and VERDICT in `--out`.
- Define each poll, limit and timeout value once at the top of the file, each with `chosen:` and its reason (a limit is half the poll, so a full-poll wait fails).

**Wrong code:** run W1 to W6 from `must-meet.md` against the fixed code. Record which check each one turns red.
**Lane-specific:** run `npm run map` and commit the map. Use the commit prefix `watchdog-exit: ` and push to `origin feat/watchdog-exit`.

**Done:**
- The new file is green on macOS.
- review-ledger, immutable-review and worker-lane pass with the same counts as at the branch point.
- The rows are flipped.
- `npm run map:check`, `node scripts/requirements-trace.mjs` and `npm run readme:check` exit 0.
- `npm run test:locked` is green on the last commit.
After that, the seat runs the pairs, writes `seat-land.md` if the roster prints `land: seat`, opens a draft PR and reads the Windows leg.

**Report** (at most 10 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`):
1. Commits.
2. The new file's macOS line and seconds.
3. Each touched test file's count, before and after.
4. review-ledger seconds, before and after.
5. W1 to W6, with the check each one turned red.
6. Exit codes of the three seat checks.
7. The full-suite line.
8. What macOS cannot prove (Windows timing, and WE4 and WE6 being green on win32 today).
9. The claim most likely wrong.