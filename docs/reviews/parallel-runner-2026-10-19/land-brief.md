# Review — parallel-runner (the locked land suite runs four test files at once), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Review `git diff b8616fb..HEAD` on `feat/parallel-runner` (the lane branched from main at `4be0b79` and last merged main
at `b8616fb`, in `1932efe`; `git merge-base HEAD main` is `b8616fb`, and main has since moved to `6b3e432`). The plan of
record is `docs/reviews/parallel-runner-2026-10-19/must-meet.md`: R-1470 to R-1477, with the adversary's amendments
inside; `plan-attack.md` holds its reasons, and `build-brief-1.md` and `build-brief-2.md` the two builds. The seat's
record is `seat-verify-1932efe.md`: CI on all three legs (`ci-windows-run-1.log` beside it), the seat's parallel full
locked run (154 files, 0 failing, 269.3 s), the wrong-code pairs (`seat-mutate.mjs`, 26 of 27 red on 5782c50; M16 a
declared survivor) and the independent check (`independent-check-1932efe.md`, run on d50de2f: HOLDS, no MUST; its
finding 1, a summary lost through a pipe, fixed in build 2). The final reviewer's brief is `review-brief.md`, with the
tree movement: 8 rows new in FEAT-031, R-1470 to R-1477, all `implemented`.

The code under review: `scripts/test.mjs` (the `--jobs=N` pool and its exit), `scripts/test-locked.mjs` (an unfiltered
run passes `--jobs=`) and the new `packages/nana-pack/lib/test-runner-config.mjs`. Judge whether the lane fails open: a
land suite that exits 0 with a red, timed-out or killed file; a bad job count that runs part of the suite; a lost or
reordered summary, `failed:` list or self-test verdict that lets a red run read green; an unfiltered locked run that no
longer holds the machine-wide lock. Judge whether it leaves a harm the review standard lists (data lost or corrupted; a
test, build step or seat script writing outside the lane worktree or the temp folder; a process tree or temp root left
behind after a stop; a broken install or hook), and whether anything main does today stopped working: `npm test` and
CI's serial legs, filtered locked runs, `map:measure`, the runner's self-test, and a stop by Ctrl-C, on macOS, Linux
and Windows. The seat's probe found one change on the serial path: a parent that starts the runner with an IPC channel
now waits until it disconnects; judge whether any caller does that.

Threat model: honest variation in our tools' output and the OS is in scope (test timing under load; darwin, linux and
win32; core count; how signals arrive; how npm passes arguments); deliberate forgery is out. Lane class: gate (the
suite every nana-land runs).

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, and no CI file failed on this
run; (4) HANDOFF and the session entry are true; (5) any MUST.
