# apps/bench pre-registration review corpus (2026-09-09)

gpt-6-astra reviewed the reusable bench + the tool-profile study BEFORE any spend, one round per commit:

| round | HEAD reviewed | verdict | headline |
|---|---|---|---|
| 1 | 2734b03 | FIX-FIRST | nested search spend uncounted; pi's default retries on; incomplete streams could pass; decision rule undecidable |
| 2 | (fold, uncommitted) | STOP | own-call contamination + double count in nested usage; timer-freed slots; `.pi` dir symlink; resolveToCwd mismatch |
| 3 | 54c3bc7 | NO-GO | registration probe crashed after the paid call (scope bug); summary-model calls uncounted (pi's Codex transport is WebSocket, not fetch); suite checker forgeable; C adoption bypassed precedence |
| 4 | 79c8d1c | NO-GO | nested detectors + decision procedure PASS; sentinel forged from inside the allowed lines → design change to a nonce-signed trusted evaluator; probe ledger fail-open |

Per-round briefs sit beside the verdicts. Each fold is described in the corresponding commit message.
