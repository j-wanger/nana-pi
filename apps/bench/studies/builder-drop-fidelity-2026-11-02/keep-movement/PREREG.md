# Pre-registration: replay fidelity check (2026-11-02)

Fidelity check, not a study: does a control replay now do what the real build did? For keep-movement and
memory-shaper, the control arm runs once each with the build's own recorded model and thinking
(keep-movement: openai-codex gpt-6-luna high; memory-shaper: openai-codex gpt-6.1-sol high), on pi 1.4.0, after the
git, stale-lock and branch fidelity fixes. Compared with the real first build, counts only: minutes, tool calls,
first failure category, first edit call, first targeted test call, whether a full suite ran and how many files
failed, outcome, fail-to-pass checks passed and cost. No verdict on any context kind follows. One run per lane
cannot separate fidelity from run-to-run variation; the check passes for a lane only if the replay edits, runs
targeted tests and ends without an early BLOCKED. Caps: USD 3 (keep-movement) and USD 5 (memory-shaper), USD 8 total.
Replays run alongside other builds on this machine.
