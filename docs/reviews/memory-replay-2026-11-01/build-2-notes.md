# Build 2 — replay review fixes

VERDICT: DONE (local verification; the final builder response records the new commit and finished hosted CI).

Feature: FEAT-043 · Measure memory outcomes. Lane: memory-replay, ordinary.
Baseline: c5931f51; starting tip 2402a47d adds only build-brief-2.md. The three replay modules and replay test were identical to c5931f51 before this build.

## Closures

| Item | Files | Rows | Wrong code → correct code |
|---|---|---|---|
| MUST: recorded hook label belongs in the slot | memory-replay-config.mjs, memory-replay.test.mjs | R-3371, R-3385 | Script-only markers leave the historical index in the shared prefix → command and recorded status-label markers put it inside the replaceable slot. |
| SHOULD: compaction refreshes standing hooks | memory-replay-context.mjs, memory-replay.test.mjs | R-3371 | Accumulate every SessionStart output → clear both ordinary and memory hook outputs at each compact_boundary; keep SessionStart:compact outputs after the last boundary. |
| SHOULD: compare judged-draw rates | memory-replay.mjs, memory-replay.test.mjs | R-3374 | Raw counts erase the unequal-denominator case favouring control → compare per-case control repeat rate against treatment repeat-or-stall rate, over each arm's judged draws. Failed draws print next to unclear draws. |
| NOTE: preserve cap-skipped screen cases | memory-replay.mjs, memory-replay.test.mjs | R-3376 | Drop never-screened cases from the plan → retain them as unrun, skip their subsequent calls, and report incompleteness. |

Paths in the table are under packages/nana-pack/lib/ and packages/nana-pack/tests/. REQUIREMENTS.md changed first. No new row IDs or test declarations were added. The pack README declares the updated reconstruction, statistic, effect line and screened-plan behavior.

## Existing test edits

Only packages/nana-pack/tests/memory-replay.test.mjs changed:

- R-3371 uses a synthetic Claude Code 2.1.310 hook_success attachment with hookName SessionStart:compact and command nana: shared memory index. It asserts that treatment removes the historical shared hook, old memory and ordinary hooks disappear after compaction, and both legacy executable markers still work.
- R-3374 adds a six-draw unequal-denominator fixture, with unclear and failed draws, a treatment stall, sensitivity checks, reversed arms and session clustering. It pins per-arm failed counts and the mean paired rate effect.
- R-3376 asserts cap-skipped cases stay unrun in the screened plan and make no calls in a subsequent run. The input plan remains unchanged.
- R-3385 re-pins the marker list including the recorded status label.

The existing awaited per-case deadline harness stays unchanged. Synthetic fixtures remain in OS temp. Existing transcript-reader tests still cover CRLF, trailing space/tab and no final newline. No suite test invokes, imports or copies a seat script.

## Red → green evidence

- `node packages/nana-pack/tests/memory-replay.test.mjs`: baseline code identical to c5931f51, with the changed tests, exits 1. build-2-red.txt records four failing contracts: slot fixture, decision fixture, screened-plan fixture and marker seal.
- After adding only the recorded-label marker, `node packages/nana-pack/tests/memory-replay.test.mjs context` exits 1 on SECRET OLD SHARED HOOK. build-2-compaction-red.txt isolates the stale-hook failure after the MUST is fixed.
- After implementation, `node packages/nana-pack/tests/memory-replay.test.mjs` exits 0 with all 20 checks passing. See build-2-green.txt. Assertions were never inverted; the wrong code was the original implementation.

### Hand calculation

The unequal fixture has judged-denominator differences -1/6, +1/3, +1/3. Treatment's first case has one repeat and one stall among four judged draws, so both failures count. Original control has one repeat among three judged draws. Dropped draws differ by arm: unclear 3/1, failed 6/3.

Scale to sixths: magnitudes 1, 2, 2; observed sum 3. The eight signed sums are -5, -3, -1, -1, 1, 1, 3, 5. Thus p fewer = 2/8 = 0.25 and p more = 7/8 = 0.875. Swapping the non-stalling arms reverses these tails. The mean paired effect is (−1/6 + 1/3 + 1/3)/3 = 1/6, printed as smaller by 0.166667.

The sensitivity arms use the same rates: the lone oracle case has p fewer 1/2; the two ceiling cases have magnitudes 1/6 and 1/3 with observed 1/6, giving p fewer 2/4. Grouping both positive cases into one session gives magnitudes 1/6 and 2/3, observed 1/2: p fewer 2/4 and p more 3/4. The equal-denominator three-draw fixture remains checked at p fewer 1/4 and p more 7/8. The original twelve-case one-draw fixture still pins 0.010742 and 0.999023.

Sign-flip convolution now scales reduced rational differences to a common BigInt integer scale. No rounded floating-point keys enter the distribution. Sensitivity and session tests use the same exported signFlip function, not a copied statistic. Only the displayed mean effect converts fractions to numbers.

## Verification

Every listed command exits 0 unless explicitly marked red above:

- `npm run map:impact -- packages/nana-pack/lib/memory-replay-config.mjs packages/nana-pack/lib/memory-replay-context.mjs packages/nana-pack/lib/memory-replay.mjs` ran before mapped-module edits. The graph and headers did not change, so the code map needs no regeneration.
- `npm run map:check`: 565 modules, zero problems (build-2-map.txt).
- `npm run readme:check`: 1036 claims, zero problems (build-2-readme.txt).
- `NODE_NO_WARNINGS=1 node scripts/requirements-trace.mjs`: 2370 rows, 2116 implemented and traced, zero off-form rows (build-2-trace.txt).
- `NODE_NO_WARNINGS=1 node scripts/requirements-tree.mjs --root .`: zero problems; its deliverables check reports 21 of 22 made and read by code, 21 more parked (build-2-tree.txt).
- `NODE_NO_WARNINGS=1 node scripts/known-bugs.mjs --root .`: names=0 sizes=0 (build-2-bugs.txt).
- `npm run test:locked` ran unfiltered in the foreground under the repository's single machine-wide lock (build-2-full-suite.txt).

```text
253 files: 251 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8927 pass, 0 fail, 44 skip · 743.0s
```

The final-tip map, README, trace, tree/deliverables, known-bugs and identity commands run again after commit. The final response records their exits and hosted CI, including Windows. No local install check applies: no setup, hook, extension or gate code changed.

## Precedent and limits

Read all five named Precedent files completely before design. Followed their existing slot assembly, config seal, fail-closed draws, row-only decisions, private output and awaited synthetic-test patterns.

Two intentional departures from the previous implementation implement the brief: exact rational rather than count differences, and retaining unrun screened-plan cases rather than silently dropping them. Reasons and assertions appear above. The label is sealed beside the existing markers with its source, packages/nana-setup/lib/settings.mjs desiredHooks shared statusMessage, as expressly allowed by this brief. Setup code remains unchanged. No existing helper was copied or moved; the statistic's existing public entry point serves all callers.

Read docs/known-bugs/FEAT-043.md completely. No listed known bug is closed or edited. Session-level rate statistics retain, but do not cure, the clustering limitation. Treatment stalls remain penalized, but agreement bias remains. Correctly replacing the historical index does not implement the live push lane's different slot contract; its confirmatory run still waits for that lane.

No real transcripts, labels, candidates, model calls, model sessions or subagents were used. No protected reference folder, HANDOFF, session archive or known-bug file was written. No GitHub issue was created or changed. No new open implementation question remains. Real-data reruns, paid canaries, blind labelling and the live push comparison remain the seat's work.
