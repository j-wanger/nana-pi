# Plan: ci-flakes

Feature: FEAT-031 · Run checks reliably and without contaminating work

## Purpose

The owner, 2026-11-07: "Start now" (the seat's proposal to fix the timing tests first). On 2026-11-07 four CI attempts failed only on tests that then passed on a re-run, costing about two hours of waiting: on Windows, context-anatomy R-3727 ("installed pi chooses AGENTS over CLAUDE in the same directory") and R-3732 ("stalled measurement is killed and both launchers proceed within the deadline", launch exceeded baseline plus deadline and 1500 ms margin), and templates-update's two Python earlier-tag cases; on macOS, worker-lane R-2883 (fake pi holding one second, elapsed 1549 ms). This lane makes each one pass or fail on the behaviour it pins, not on runner speed.

## Assumptions

- A1. Each case keeps proving its requirement. A fix replaces a wall-clock comparison with an event or ordering check, or a measured paired baseline, never by deleting the assertion or widening a margin without provenance.
- A2. A margin that must stay is a sealed tunable in the test's config surface, with a measured provenance (the CI runs above) and one test naming its row.
- A3. If a case cannot be made deterministic, the builder reports why and proposes running it alone (the runner's RUN_ALONE list) instead of guessing.
- A4. The templates-update failures may not be timing: the builder reads the failing CI logs (runs 42394103110 attempt 1 and 42357127624) first and fixes the real cause.
- A5. One reviewer plus CI.

## Open choices

- O1. Builder picks the deterministic signal per case, following the nearest existing event-based test.

## Questions for the owner

None.

## Threat model

Honest variation in runner speed, load and filesystem timing on hosted macOS, Windows and Linux runners. Forgery out.

## Precedent

- `packages/nana-pack/tests/context-anatomy.test.mjs`: the two Windows cases.
- `packages/nana-pack/tests/worker-lane.test.mjs`: R-2883.
- `packages/nana-pack/tests/templates-update.test.mjs`: the Python earlier-tag cases.
- `packages/nana-pack/lib/test-runner-config.mjs`: the RUN_ALONE list, if needed.

## Outside precedent

none: in-house test fixes.

## Must-meet

- M1 (R-3727 deterministic). The case passes or fails only on which context file pi chooses; a slowed child (an injected delay longer than the old margin) does not fail it, and swapping the two files does.
- M2 (R-3732 deterministic). The case passes when the stalled measurement is killed and both launchers proceed, and fails when the kill is removed; an injected 3 s launch slowdown with the kill intact does not fail it.
- M3 (R-2883 deterministic). The case fails when a sampler slower than the child limit starts or another launch finds it, and passes under an injected one-second scheduling delay.
- M4 (templates-update). The Python earlier-tag cases pass or fail on the update's result; the builder names the cause of the 2026-11-07 failures from the CI logs and the fix addresses that cause.
- M5 (no lost proof). Each changed case still fails against a wrong implementation (a mutation pair per case, recorded in the build report), and the suite's file and check counts are unchanged apart from cases the builder explains.
- M6 (adversary 1: deadline proof kept). With controlled timers, no timeout at 2999 ms, and a kill plus `unavailable (timed out)` at 3000 ms; doubling the timer delay fails the case.
- M7 (adversary 2: the real templates-update cause). The 2026-11-07 Windows failure was `tests/test_code_map.py::test_this_project_headers_and_map_are_current` (generation uses python3 while pytest uses uvx). On native Windows the updated fixture's map is regenerated, the complete retained pytest suite runs unchanged and exits 0 with the exact six-cell drift line; corrupting that map makes the retained map test fail.
