# FEAT-043 — known bugs

*One line per known bug in this feature. A review finding that does not block a land goes here as one line.*

- Outcome meter (outcome-meter, seat baseline run): about one in six decision items comes back unjudged because their judge calls fail closed, and the run prints no reason for the rejection.
- Outcome meter (outcome-meter, seat baseline run): two meter runs over the two shaper runs found repeats in different items and agreed on none, so a repeat count below a handful is noise, not a signal.
- Outcome meter (outcome-meter, plan residual): the meter sees only this machine's Claude Code transcripts; the second machine and pi sessions are not counted.
- Outcome meter (seat, scored against the 2026-11-01 private labels): the meter misses most correction and decision repeats the labels find, so its low repeat counts are mostly misses; the counts stay private.
- Outcome meter (outcome-meter, final review): batches split at every change of kind, so alternating items make one call each and re-send the lookback; cost rises, counts do not change.
- Outcome meter (outcome-meter, final review): the load-log size check runs after the judge calls and leaves an empty rows file, so that output folder cannot be reused.
- Outcome meter (outcome-meter, final review): pooled denominators include unjudged items, and for decisions unprompted ones, so pooled shares read low.
- Outcome meter (outcome-meter, final review): an exact match against a parallel item skips the judge even when a deliverable paraphrase is inside the lookback, and the judge names one earlier id, so a parallel pick can hide a deliverable one.
- Outcome meter (outcome-meter, final review): `pasted` counts trivial replies such as yes or go.
- Outcome meter (outcome-meter, final review): a judge reply that names an earlier id with relation none rejects the whole call, a likely cause of the unjudged decisions.
- Outcome meter (outcome-meter, final review): the lane folder's synthetic commands and build report describe the windows before build 3's warm-up fix.
- Outcome meter (outcome-meter, final review): the meter command's main-module check fails through a symlinked checkout, so the command exits 0 and does nothing.
- Memory replay (memory-replay, plan residual): the rebuilt moment has no Claude Code system prompt, no tool loop after the first reply and a JSON-wrapped reply, so a mistake that appears only after real tool results may not reproduce.
- Memory replay (memory-replay, plan residual): the control arm cannot open memory files, so the bias favours the bundle; the run prints a count of it.
- Memory replay (memory-replay, plan residual): the cases sit in five sessions, so the case-level test overstates power; the session-level line is a check, not a fix.
- Memory replay (memory-replay, plan residual): knowledge-pull output can carry memory-like text into both arms, diluting the contrast.
- Memory replay (memory-replay, plan residual): shaper batching can word an earlier claim with sight of a later unit, which the leak check does not see.
- Memory replay (memory-replay, plan residual): a bundle that makes the seat agree more reads as fewer corrections; the stalls verdict catches only part of it.
- Memory replay (seat, seat-memory-push plan): the treatment arm swaps the whole memory slot while the live push swaps only the hook output, so the confirmatory run on the push maker waits for that lane's hook and a replay change.
