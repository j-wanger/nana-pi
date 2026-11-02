# Plan — issue-watch-cli-limit

## Purpose

A fix that restores agreed behaviour. R-2992's end-to-end check ("R-2992: real opted-in command keeps polling prints an owner answer and ends with restart", `packages/nana-pack/tests/issue-watch.test.mjs` around 158-165) runs the real `nana-issue-watch.mjs` CLI as a child. It has failed twice today on CI with `Error: CLI limit`: on Linux at 5acb760f, and on Windows at main 497c5891 (issue #327). It passes locally. The seat's goal: the check stays a real end-to-end run of the CLI but cannot fail on a slow runner. A timeout is a tunable: it lives on a configuration surface with provenance and a measured basis, or the check waits on the child's own completion signal under a generous bound.

Why the 6 s bound is tight by design:

- The check's preload shrinks `WATCH_INTERVAL_MS` to 50 ms and the run window `WATCH_RUN_MS` to a fixed 3000 ms. So the child cannot exit before 3 s plus its own start-up, plus any gh call still running at stop.
- Each poll spawns a fake `gh`, which is a node child.
- The repository's own measurement (`frontier-summary-config.mjs`, the `ISSUES_READ_LIMIT_MS` provenance from run 40693949252) records cold node-child calls of 1.31 s on macOS and Linux and 6.39 s on Windows. A cold CLI start plus cold gh children on a loaded runner can exceed the 3 s left after the fixed window.
- Laptop measurement, 2026-11-02, Windows 11, under a concurrent builder: 10 runs of that check alone took 3.35-3.41 s, minus about 0.36 s of file overhead. The child ran for about 3.0-3.05 s, almost all of it the fixed window.
- The fixed window also risks a second failure: with slow gh children, fewer than the two polls the check asserts may fit in 3 s.

## Design

1. The run end becomes event-driven. The preload no longer turns the run timer into a fixed 3000 ms. It fires the run's end handler once the fake gh has seen the list poll that follows the owner-answer poll; the polls are sequential, so the answer poll has finished by then. The fake gh's own call count is the signal, read by the preload from the existing count file. The CLI code is unchanged, and the check still exercises the real end path: the restart line printed by the run's own end handler.
2. One generous outer bound replaces both the inline 6000 ms child timer and, for this check, the inline 8000 ms per-case limit. The values live in a test-side timing module, following `packages/nana-pack/tests/launch-wait.mjs`, each with provenance: chosen, with the measured basis above, and comfortably above the 6.39 s cold-Windows call times a small number of calls. The builder picks the values and states the arithmetic.
3. Any other inline per-case limit in `issue-watch.test.mjs` (the `check` helper's 8000, the R-2997 default-runner 3000, R-2996's spawnSync 2000) moves to the same module unchanged in value. They are tunables the same rule covers. This lane changes only R-2992's values.

## Assumptions

- A1: The CI failures are slow-runner timing, not a CLI hang. If the CLI hangs, the event-driven end never fires and the generous bound still fails the check, naming the bound. The new failure message must say which signal was missing: no second poll, no owner answer, or no exit.
- A2: Polling the count file from the preload adds no product behaviour. It runs only inside the test's own child.

## Open choices

- O1: How the preload watches the count file (a short poll timer, or `fs.watch`). Default: a short poll from the timing module. `fs.watch` is uneven across platforms.

## Questions for the owner

None.

## Feature

Feature: FEAT-002 · Resume decisions and next actions

Lane class: `node scripts/lane-class.mjs --root . --files packages/nana-pack/tests/issue-watch.test.mjs,packages/nana-pack/tests/issue-watch-timing.mjs,REQUIREMENTS.md` (the builder pastes its line; a test-only change is expected to print `ordinary`).

## Threat model

In scope: honest variation in runner speed and load. That covers cold node starts, slow child spawns on Windows and Linux CI, and a loaded laptop. Out: a deliberately stalled CLI. That still fails the check, by design.

## Precedent

- `packages/nana-pack/tests/issue-watch.test.mjs`: the R-2992 CLI check (around 158-165), the preload and fake gh it writes, and the `check` helper (52-57).
- `packages/nana-pack/tests/launch-wait.mjs`: a test-side timing module with chosen values and provenance comments; the new module follows its shape.
- `packages/nana-pack/lib/frontier-summary-config.mjs`: `WATCH_INTERVAL_MS`, `WATCH_RUN_MS` and the cold-call measurement in `ISSUES_READ_LIMIT_MS`'s provenance.
- `packages/nana-pack/lib/issue-watch.mjs`: the poll loop and the run end (around 59 and 120). Read it; do not change it.

## Outside precedent

none: a test-harness timing change. The only reference needed is the repo's own measurement.

## Must-meet

Rows R-3703 to R-3705 (FEAT-002).

- M1 (R-3703): the R-2992 CLI check passes when the child is slow. Use a wrapper that delays the fake gh by a sealed test-only amount, so the total time exceeds the old 6 s bound but stays inside the new one. Pins: the check passes and still asserts at least two polls, the owner answer line, and the restart line as the last line. Against main's fixed window and 6 s timer this case fails with `CLI limit`; record it in `wrong-code.txt`.
- M2 (R-3704): a child that never exits fails the check within the outer bound. Inject a hang, for example a fake gh that never answers after the answer poll. Pins: the failure names the missing signal and arrives before the outer bound plus a small margin, and no orphan child is left (the test kills it).
- M3 (R-3705): the issue-watch test's timing values are one sealed set. Pins: the module's exported names and values, under one seal check naming this row. No inline millisecond literal remains in `issue-watch.test.mjs` except fake-clock arithmetic on the product's own config names.

Expected existing-test edits: the R-2992 CLI check, and the `check` helper's limit, which now reads the module. List each.

Seat checks:
- `issue-watch.test.mjs` run 10 times on this laptop, all PASS, with the time spread recorded.
- `issue-watch.test.mjs` run 3 times while a second heavy test file runs alongside it.
- `frontier-summary.test.mjs` and `test-runner.test.mjs`.
- The map, readme, trace, tree and known-bugs checks, and the identity scan.
- The tip's CI on all three suite legs.

## Revision 2 (after `plan-attack.md`: 3 MUST, 2 SHOULD, all taken)

These changes override the sections above wherever they differ.

**Diagnosis, corrected.** Slow gh calls cannot cause `CLI limit`. `issue-watch.mjs` (51-56) aborts pending work at stop, and `gh-runner-async.mjs` kills a call after `ISSUES_READ_LIMIT_MS`, 1.5 s. The adversary's probe added 1.7 s to each gh call: the result was `Issue watch: timeout.`, no owner answer, and a clean exit in 3.15 s. Eight concurrent CPU workers left the check passing in 3.34 s. The remaining cost outside the fixed 3 s window is the child's own start: node start, the `--import` preload and the module graph. Under a parallel CI suite that start must have exceeded about 3 s. That is inferred, not reproduced here. The fix therefore removes the fixed window from the bound and makes the bound generous; it does not claim a measured CI cause.

**Design, revised.**

1. The run end is event-driven. The preload fires the run's end handler once the fake gh has counted three list calls, not two (attack 3). The second call's count is written before its response is consumed, so the third call is the first proof that the answer poll finished. The fixed 3000 ms run window goes.
2. One timeout owner (attack 2). The R-2992 CLI check owns a single child deadline. On expiry it records which signal was missing (third poll, owner answer line, restart line, or exit), kills the child and waits for it to close within a sealed cleanup bound, then rejects with that diagnostic. The case limit for this check is the child deadline plus a sealed margin, so the generic `case limit` never wins. Every serial check's limits together stay well under the suite's 300 s per-file limit (`scripts/test.mjs:92`). The builder states that sum.
3. Cleanup proof (attack 4). The check records the CLI child's pid, waits for close, and asserts the pid is gone. Use `packages/nana-pack/lib/process-tree.mjs` if a tree kill is needed on Windows. The fake gh grandchildren are already killed by the product's own abort at stop.
4. Timing values (attack 5). These real-time harness values move to `packages/nana-pack/tests/issue-watch-timing.mjs`, unchanged in value except R-2992's: the `check` helper's 8000, the R-2992 child deadline and margin, R-2997's 3000, R-2996's 2000 and R-2994's 5000. Fake-clock scenario numbers, such as the 3000 and 1600 ms advances, stay as they are; they are test data, not tunables.

**Must-meet, revised.** Rows R-3703 to R-3705 (FEAT-002), each worded as an observable outcome.

- M1 (R-3703): a slow-starting CLI still passes. The preload blocks synchronously for a sealed start delay before the CLI loads, for example `Atomics.wait`, about 4 s. That pushes main's harness past its 6 s `CLI limit` and keeps the new harness inside its deadline. Pins: the check passes; at least three list calls ran; the owner answer line is present; the restart line is the last line. Record main's harness failing with `CLI limit` under the same delay in `wrong-code.txt`.
- M2 (R-3704): a CLI that never exits fails with its own diagnostic. The preload starts a referenced, never-ending handle after the restart line. Pins: the check's error names "no exit after restart", never `case limit`; it arrives within the child deadline plus the cleanup bound; the child pid is gone afterwards.
- M3 (R-3705): one sealed set of issue-watch harness timings. Pins: the timing module's names and values under one seal check naming this row. The R-2992 CLI check and the `check` helper read those names; no real-time harness literal remains in `issue-watch.test.mjs`.

Expected existing-test edits: the R-2992 CLI check, the `check` helper, and the R-2994, R-2996 and R-2997 checks, which now read names instead of literals. List each.
