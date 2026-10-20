# Build brief 1 · mutation-runner-takeover-race (pi gpt-5.6-sol builder)

Feature: FEAT-031 · Run checks reliably and without contaminating work. Class: ordinary. Rows: R-2170 to R-2172 only, from the block R-2170 to R-2179.
- Follow packages/nana-pack/prompts/builder-preamble.md.
- Work in ~/nana-pi-wt/mutation-runner-takeover-race on feat/mutation-runner-takeover-race, from current main.
- Run single test files only, never the full suite. Do not push. Do not edit HANDOFF.md or docs/sessions/.
- Read must-meet.md (same folder) first.

## What is wrong (verify it; do not trust it)
`withWorktreeOperationLock` in packages/nana-pack/lib/mutation-runner.mjs takes over a dead owner's lock by reading it, comparing it and unlinking it (`removeWorktreeLockIfOwned`). A waiter that stalls between that read and its unlink removes a faster waiter's fresh lock, and both enter.

## Change
1. **Config.** In lib/mutation-runner-config.mjs, add the breaker suffix (".break" is suggested). Give it a `chosen:` provenance comment naming R-2170 and list it in @outputs. It is not sealed, gets no pin test (precedent: LOCK_SUFFIX) and does not go in OVERRIDABLE.
2. **Shared helpers.** In mutation-runner.mjs, extract two helpers that both the lock and the breaker use:
   - the judgement: read, parse, pid alive, unreadable age;
   - the release loop, with the R-1960 limit.
3. **Takeover.** Publish the breaker with `publishWorktreeLock`.
   - If acquired: re-read the lock, remove it only if it still equals what you judged dead, then release the breaker. Release it on every exit path, before any wait or throw.
   - If a live holder has it: use `waitOrFail`.
   - If the breaker is dead, or old and unreadable: remove it with the plain compare-then-remove and retry at once.
   - Every breaker file operation goes through the injected `io`.
4. **Unchanged.** Keep the R-1775, R-1777, R-1778, R-1779 and R-1960 values and behaviour. Keep both six-tag headers accurate.
5. **README.** In packages/nana-pack/README.md, in the Limits paragraph after "Shards share one operation lock", add two plain sentences. One says only one waiter at a time removes a dead shard's lock. The other says a waiter killed while removing one, plus a later dead shard, can still let two in.

## Tests first (new file packages/nana-pack/tests/mutation-runner-takeover.test.mjs)
Write R-2170, R-2171 and R-2172 exactly as must-meet.md describes, with titles exactly as it names them. Put `// req: R-217n` directly above each `check("R-217n: …", ok, why)` call, with the call and its title on one line. Show R-2170 red on today's code before you change the lib.
- Give the file its own six-tag header.
- Write your own quote-joined import-line helper for child scripts, copying the pattern in mutation-runner.test.mjs (it is not exported). Never put a literal fixture import in this file's source.
- Put fixtures under `tmpDir()` and give every child a safety kill.
- Name every bound once, with `chosen` and a reason. That includes the dead pid 2147483647, which the R-1778 check also uses.
- Start fake clocks at `Date.now()`.
- Read every lock value from mutation-runner-config.mjs by name, never as a literal.
- Use no skip: every case runs on darwin, linux and win32.
- Do not edit packages/nana-pack/tests/mutation-runner.test.mjs, because another lane is changing it.

## Wrong code to try (each must turn the named check red)
- W1, today's code: R-2170 (before-removal schedule).
- W2, remove under the breaker without the re-check: R-2170 (after-read schedule, dead pid).
- W3, write the breaker by plain overwrite: R-2170.
- W4, never remove a dead breaker: R-2171.
- W5, keep the breaker when the lock removal hits a transient error: R-2172.
- W6, give up on a transient breaker release: R-2172.
- W7, never release the breaker: R-2172.
- W8, keep the breaker when a separate re-read under it hits a transient error: R-2172.

## Done
- The new file is green three runs in a row on macOS, with each run's time noted.
- `node packages/nana-pack/tests/mutation-runner.test.mjs` is green once, with 39 or more PASS and 0 FAIL.
- W1 to W8 are each red.
- The three rows are appended to the FEAT-031 table in REQUIREMENTS.md after R-1960, as implemented, with the evidence filled.
- docs/code-map.md and docs/requirements-tree.md are regenerated.
- requirements-trace, `npm run map:check`, `npm run readme:check` and `node scripts/requirements-tree.mjs --check` are all green.
- After the build, the seat runs both mutation-runner test files on the Windows CI leg.

## Report (at most 10 lines)
VERDICT; commit; R-2170's red-before output; the takeover as built, in one sentence; W1 to W8, each with the check that went red; the existing file's PASS/FAIL count; the new file's three run times; anything you could not prove without Windows.