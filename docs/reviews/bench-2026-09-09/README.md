# apps/bench pre-registration review corpus (2026-09-09)

gpt-6-astra reviewed the reusable bench + the tool-profile study BEFORE any spend, one round per commit:

| round | HEAD reviewed | verdict | headline |
|---|---|---|---|
| 1 | 2734b03 | FIX-FIRST | nested search spend uncounted; pi's default retries on; incomplete streams could pass; decision rule undecidable |
| 2 | (fold, uncommitted) | STOP | own-call contamination + double count in nested usage; timer-freed slots; `.pi` dir symlink; resolveToCwd mismatch |
| 3 | 54c3bc7 | NO-GO | registration probe crashed after the paid call (scope bug); summary-model calls uncounted (pi's Codex transport is WebSocket, not fetch); suite checker forgeable; C adoption bypassed precedence |
| 4 | 79c8d1c | NO-GO | nested detectors + decision procedure PASS; sentinel forged from inside the allowed lines → design change to a nonce-signed trusted evaluator; probe ledger fail-open |
| 5 | 9784d58 | NO-GO | pricing wiring PASS; evaluator leaves the nonce on disk + prototype-dependent verdict; two NEW regressions (undeclared `onBuffer` in loadProbe; c8 stopped running the new test against the fixed source) → fold handed to a fresh worker with a mandatory stub-driven test of every orchestration path. Note: the first attempt at this brief was content-filtered by the Codex backend for adversarial phrasing; rephrased to verification register (loops/FRICTIONS.md in nana-agent-loop). |

Per-round briefs sit beside the verdicts. Each fold is described in the corresponding commit message.
| 6 | 09e6f4b | NO-GO (Fable) | astra content-filtered twice (the filter reacts to the evaluator source, not the brief) → Fable subagent reviewed: the nonce passed as a STRING reaches a writable `Buffer.from` (3-line fix: build the key as a Buffer pre-import); interrupt drain race can record a killed run with numeric cost; executeRun tests never use a real fixture. |
| 7 | efa8c3f | GO (Fable) | fold of round 6: Buffer-keyed signing + post-import sweep test; interrupt yields to salvage with an APPENDING mark; real-fixture executeRun test exposed workspace.diff taken against the pristine fixture (fixed) |
