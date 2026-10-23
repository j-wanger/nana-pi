# lane-temp-cleanup · must-meet of record (seat, 2026-10-23)

Feature: FEAT-006 · Launch builders with execution limits

Written by the seat from the planner's draft (`plan-draft.md`) and one adversary pass (`plan-attack.md`), both kept in this folder. Plans get no review round. Where this file and the draft differ, this file holds.

Spend line: the owner's 2026-10-23 pick, "Lane temp cleanup". It serves the current priority's line that nana works the same for both seats.

Stakes: low to medium blast, reversible. Every lane build on every machine runs the changed pi-worker. A wrong order of checks could refuse every build; CI's install check now runs a real pi-worker lane build on macOS and Windows, so that would show before a land. No stored format changes. A revert restores main.

Cause, as measured: in lane mode pi-worker reads the user Claude settings and writes them, key included, into a temp folder before it refuses a review option, and leaves the folder (FEAT-006's "a review-only option … in lane mode exits without removing the temp folder" line). A signal in the first tenth of a second after the folder appears leaves it too, and once the lane lock. worker-claude.test.mjs reads a caller's exported `CLAUDE_CONFIG_DIR` (FEAT-006's "`worker-claude.test.mjs` spreads `process.env`" line); three checks then fail on such a machine.

## Seat decisions on the attack

- **Design as the draft**, parts 1 to 3: review options refused first, in both modes; no-op start-up listeners for SIGINT, SIGTERM and SIGHUP before the temp folder, kept for the life of the process; the tests clear `CLAUDE_CONFIG_DIR`, pinned by a decoy.
- **M-1 adopted as a premise fix, not a scope change.** A pi seat's ordinary stop of its foreground build (Esc, a closed terminal, a desk stop, a bash timeout) is a process-group SIGKILL off Windows and `taskkill /F /T` on Windows. It leaves the key file, the capture folder and the lane lock, and the builder keeps running, on main and on this lane. The threat model moves it into honest variation, marked not closed; only a deliberate `kill -9` by hand stays under forgery. The known limit, the pack README sentence and FEAT-006's "pi may still be working and spending" line say so for the Claude Code builder too. The reaper fix the attack names (a detached process that polls pi-worker's pid, as `bounded-spawn-child.mjs` polls its parent) is not in this lane; the seat puts it to the owner as its own lane. Seat step 5 adds the pi-seat stop probe, kept as the known limit's evidence.
- **S-1 adopted.** Lane mode adds `process.stderr.on("error", () => {})` beside part 2's listeners. R-2692 gains one case off Windows: close pi-worker's stderr pipe once the fake builder's pid file exists, wait for the close, and assert exit 0 and an empty temp folder. pi-review's same exit gets a FEAT-007 known-bug line.
- **S-2 adopted.** R-2691's row says "before it reads the brief", and its test adds one run: `--item x` with a brief path that does not exist must exit 1 with the review-option line. Pair V2 added.
- **S-3 adopted.** R-2693's test adds one pi-roster run (`--lane-size small`, the fixture's fake pi): SIGTERM at the temp folder's first entry, then exit 143, the abort line, an empty temp folder and no lock. Pair V3 added.
- **S-4 adopted.** The removal of the leftover fixture folders on the planning machine, if the owner says yes, goes by the names recorded at planning, after re-reading that each folder's `preamble.md` names a test fixture worktree; never by pattern. The seat does it outside the lane, only on the owner's yes.
- **N-1 adopted.** Pair V1: listeners registered before the folder and removed before `runWatchdog`, as pi-review's precedent might be copied → R-2693.
- **N-2 adopted.** R-919's empty-temp check in `review-ledger.test.mjs` joins the Precedent list.
- **N-3 noted.** CI's install-check `PASS pi-worker (cmd)` and `PASS pi-worker (sh)` rows are the Windows lane-mode evidence. The install-check config's dated pi-worker line citations stay.
- **N-4 in the brief.** R-2603 fails if pi-worker's source holds `admit` or `complete` outside a column-zero comment.
- **N-5, N-9 known limits:** a Windows console close gives about 10 s and the CPU sampler can hold a signal longer; SIGQUIT and SIGBREAK have no listener; a signal queued before a refused builder launch is never dispatched.
- **N-6 in Not verified:** a Claude Code session that exits while a background build runs, and a foreground Claude Code Bash call that times out.
- **N-7 noted.** The held lock, the bad stall option, SIGTERM and the closed stderr carry R-2692's new pins; the other cases stay because they are cheap.
- **N-8 adopted.** The bad stall option's witness is its error line, `pi-worker: --stall-secs and --poll must be positive numbers`; no carry line is required, so a later lane may move watchdog checks ahead of the carry.
- **Class: gate ladder, on the owner's word.** By AGENTS.md's letter the lane is ordinary (pi-worker is not a land or review tool, hook, extension, gate policy or nana-setup). Opus final reviewer, astra land reviewer, the seat's pairs, one independent check, CI's Windows leg. No install check: no nana-setup or hook file changes. Builder: the larger builder (the signal timing is the risk).
- **Open questions:** 1 (the start-up signal gap) is included, decided by the seat. 2 (hard kills) goes to the owner restated with M-1's facts, as a separate reaper lane; default no for this lane. 3 (the leftover folders) goes to the owner with S-4's rule; default remove.

## Must-meet rows (FEAT-006, after R-2665)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2691 | IF pi-worker lane mode receives a review option (`--item`, `--role`, `--revision`, `--over-cap` or `--worker`), THEN it shall exit 1 with the review-option line before it reads the brief or the user Claude settings file, or writes any file in the OS temp folder. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2691: in lane mode each review option exits 1 with the review-option line before the brief or the user Claude settings are read or any temp file is written` |
| R-2692 | WHEN pi-worker lane mode ends after writing its temp files, by a finished build, a held-lock refusal, an invalid `--stall-secs`, an output file it cannot write, the wall-clock ceiling or, off win32, a SIGTERM stop or a closed standard-error pipe, it shall leave no file or folder of its own in the OS temp folder. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2692: a finished build, a held lock, a bad stall option, an unwritable output, the ceiling and, off Windows, SIGTERM and a closed stderr each leave the temp folder empty` |
| R-2693 | WHERE the platform is not win32, WHEN pi-worker lane mode receives SIGINT, SIGTERM or SIGHUP after it has written its temp files and before its builder starts, it shall exit with the code and abort line of a stop during the build and leave no temp file and no lane lock. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2693: off Windows, SIGINT, SIGTERM or SIGHUP sent once the temp files exist and before the builder starts stops a Claude or pi build with the stop exit code and abort line and leaves no temp file and no lane lock` |

Each row starts `untested`, then becomes `implemented` with its backticked `file::title` when its check passes. R-2692 is green on main except its closed-stderr case; the draft's note on it stands. Part 3 adds no row; its pin is the decoy. R-733, R-2647, R-2651, R-2655, R-2664 and R-2665 keep their text and titles. R-2694 to R-2699 stay free.

## What each test does

As the draft's "What each test does", with: R-2691's missing-brief run (S-2); R-2692's closed-stderr case off Windows (S-1) and the bad stall option witnessed by its error line (N-8); R-2693's pi-roster run (S-3).

## Tunables

None new, as the draft says.

## Wrong-code pairs (each must turn its test red every run)

The draft's pairs 1 to 14, plus:
- V1. Start-up listeners removed before `runWatchdog` → R-2693 (the signal is dropped and the build runs on).
- V2. The lane-mode review check placed late in the lane block, just before the temp folder → R-2691 (the missing-brief run).
- V3. Start-up listeners registered only for a Claude builder → R-2693 (the pi run).
- V4. No stderr error listener → R-2692 (the closed-stderr case).
None is Windows-only; pairs 9 to 12, V1, V3 and V4 turn red only off Windows, where their cases run, and the mutation runner runs on macOS.

## Known limits (the seat writes them to the named files before the final round)

The draft's list, with M-1's correction (the pi seat's ordinary stop is the common hard kill; the builder keeps running; FEAT-006's "pi may still be working" line extended to the Claude Code builder), N-5 and N-9, and pi-review's closed-stderr exit as a FEAT-007 line (S-1).

## Docs that change

As the draft's list, with the README hard-kill sentence naming the pi seat's stop (M-1), and the two FEAT-006 lines this lane closes cited by their opening words.

## Seat steps

1. Cut `feat/lane-temp-cleanup` from main. Commit this file, the draft, the attack, seat titles and build brief 1; run brief-check.
2. Build with the roster's larger builder.
3. Seat checks as the draft's step 4, including the run with a decoy `CLAUDE_CONFIG_DIR` and a scratch TMPDIR, and the removed-escape diff check.
4. Pairs 1 to 14 and V1 to V4 through the mutation runner.
5. Probes on the tip, macOS, scratch HOME and TMPDIR, fake claude: each review option, a background-task stop, SIGKILL, and the pi-seat stop (`bash -c` in its own group, killed with a group SIGKILL). Keep the outputs in this folder.
6. The independent check.
7. Draft PR CI; the Windows leg must show R-2691 and R-2692 PASS and R-2693 SKIP; read R-2692's Windows detail for foreign temp entries.
8. Notes before the final round; Opus and astra on the exact tip.
