# Spec: builder lane-check repair

## Objective
Let a pi builder repair its own lane-check failure once (R-4003–R-4006).

## Context
Builder-stop checks already compare named failures against the starting commit.
The finished-session print-mode resume was probed on pi 1.4.0; stdin must close.

## Scope
In scope: committed-tree checks, one same-session repair, both check results in
build records, and signal cleanup during checks.
Out of scope: replacement sessions, Claude Code resume, retries for base-red or
runner errors, changing check selection, and model-backed validation in this lane.

## Approach
Keep lane-check classification and report lines in `lib/lane-checks.mjs`.
Run check children asynchronously so the worker can handle stop signals. Reuse
`killProcessTree` and `reviewLaunch`; retain bounded diagnostic tails.
A stop waits for the relay's exit before cleanup and the end record, bounded by
`RELAY_SIGNAL_GRACE_MS + RELAY_BACKSTOP_MS` from the shared bounded-spawn module.
An expired exit bound becomes `laneChecks.relayExitError` in the end record and a
stderr diagnostic. Early relay results send SIGTERM before any forced relay kill.
Extend the existing watchdog session path with an explicit continuation and retain
the original wall-clock start. Keep temporary prompts until repair and checks end.
The leak scan stays after the final tip is known, covering repair commits too.

## Constraints
Never resume on `red-on-base` or `error`. Never retry the repair. Never install
dependencies in the base checkout or move the lane's branch. Close builder stdin.
Preserve credential stripping, launch validation, process limits and lane locking.

## Success vision
A fake builder commits a failing tip, receives one repair prompt in its original
session, commits the fix and leaves a clean tree with a passing check line.
An unsuccessful repair ends failed; a check-phase stop ends stopped without a base
checkout or running check descendants.

## Exit criteria
- `node packages/nana-pack/tests/lane-checks.test.mjs` passes the fake-builder paths.
- Every test file naming pi-worker, pi-watchdog, lane-checks or build-records passes alone.
- `node scripts/requirements-trace.mjs` and `npm run -s check:lane` pass on the last commit.
- `npm run -s map:check` and `npm run -s readme:check` pass before committing.

## Checkpoints
Run the existing lane-check tests before implementation, then the extended tests,
then the named checks and individual caller tests. Leave the real-builder probe to
the seat; no model sessions run in this lane.

## Assumptions
- The seat's finished-session probe applies to the attempt session file.
- CI covers the full suite, as declared in `AGENTS.md`.
- A Claude Code builder has no pi attempt session file; its existing reporting stays.
