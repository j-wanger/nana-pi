- **MUST — POSIX cancellation can kill the caller’s process group.** The measure command spawns `test-locked` without a stated separate process group, then records every descendant group and sends `SIGKILL` to each. Normally, `test-locked`, the measure command, npm, and the invoking shell share a foreground process group. Cancelling a measurement can therefore kill the caller and interrupt cleanup, rather than only ending the suite tree. M16 hides this by placing every fake-tree level in its own group. Start `test-locked` in a dedicated group, or exclude groups containing non-tree processes, and pin the real shared-caller shape.

The other round-one MUSTs are closed. M17 tests the exact replacement-environment shape and adequately answers MUST 1. Whole-map staleness, Windows tree termination, and the ordinary pre-land suite requirement close MUSTs 2–4.

VERDICT: SEND-BACK
