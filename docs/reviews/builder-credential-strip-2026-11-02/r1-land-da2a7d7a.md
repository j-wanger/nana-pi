**MUST — Direct ledger launches leave Claude settings unsealed.**  
`packages/nana-pack/bin/review-ledger.mjs:169` strips only the spawn environment. The documented `review-ledger run -- claude ...` path supplies no sealed settings, unlike `claude-review`.

An existing Claude settings `env.GIT_CONFIG_PARAMETERS` containing a credential helper can therefore restore git credential dispatch. No deliberate variable removal is needed.

A temporary fixture through the actual ledger, simulating Claude’s settings merge, reproduced:
- Spawn environment: no password.
- After settings application: fixture password returned.
- Ledger exit: 0.

Seal this path’s Claude settings too, and add a regression test. The current ledger fixture never applies Claude settings.

**NOTE — Other reviewed controls passed.** Both credential test files pass on macOS. The floor excludes the seat; push ownership and ruling wording agree. Recorded Windows mutations and macOS install evidence are green. No additional listed harm found.

VERDICT: SEND-BACK
