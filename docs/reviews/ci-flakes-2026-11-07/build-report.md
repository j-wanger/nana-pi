# ci-flakes build record

Feature: FEAT-031. Branch: feat/ci-flakes.

## Files and rows

- `REQUIREMENTS.md`: R-3808–R-3814, one per M1–M7, in order; no other new IDs.
- `packages/nana-pack/lib/pi-context-load.mjs`: optional `schedule` and `cancel` boundaries; production defaults and the 3000 ms deadline remain unchanged.
- `packages/nana-pack/tests/context-anatomy.test.mjs`: choice check, stalled-launch check, controlled deadline check.
- `packages/nana-pack/tests/worker-lane.test.mjs`: timer-completion event replaces the wall-clock lower bound.
- `packages/nana-pack/tests/templates-update.test.mjs`: matched uvx toolchain, checked generation status, retained-map corruption control.
- `docs/code-map.md`, `docs/requirements-tree.md`: regenerated.
- This folder: sanitized local evidence. Exported CI logs were read only; none were copied here.

## Must-meet proof and mutation pairs

| Must-meet / row | Positive | Wrong code or artifact | Result |
|---|---|---|---|
| M1 / R-3808 | Real installed pi measurement, injected 3500 ms child startup delay; exact AGENTS path and counts | Measurement reports CLAUDE instead of AGENTS | wrong exit 1; restored exit 0 |
| M2 / R-3809 | Both launchers, 3000 ms unrelated launch slowdown, unchanged delivery, timed-out status and dead measurement child | Remove both tree and direct kills | wrong exit 1, child survived; restored exit 0 |
| M3 / R-3810 | Timer fires with an injected one-second callback delay; no sampler startup or default-PATH leak | Poll at 0.1 s; separately leak sampler PATH into another launch | both wrong runs exit 1; restored exit 0 |
| M4 / R-3811 | Generate and check with uvx Python, full retained pytest exit 0, exact six-cell line | Missing map generator executable | wrong exit 1; restored exit 0 |
| M5 / R-3812 | Original behavioral assertions retained, with deadline proof separated from delivery | Pairs above and below | all rejected |
| M6 / R-3813 | Controlled time: pending at 2999, kill and unavailable at 3000 | Double scheduled deadline in code | wrong exit 1; restored exit 0 |
| M7 / R-3814 | Unchanged full retained pytest run, exact six-cell drift line | Corrupt generated map; run retained map test | corrupt child exit 1, clean full suite exit 0 |

See `initial-red.log`, `context-pairs.log`, `worker-pairs.log` and `touched-tests.log`.
Mutation assertions were never inverted. Mutation copies and fixtures stayed under `$TMPDIR`; surviving measurement children from the omitted-kill mutation were explicitly killed.

## Existing test edits and counts

- R-3727: inject startup delay; suppress only its measurement timer through the injected boundary. The existing awaited 90-second case limit still applies. Path, version, lengths and unavailable assertions remain.
- R-3732 stalled measurement: replace the paired elapsed comparison with normalized delivery equality. Keep timed-out metadata, both launcher outcomes and actual child-death checks. Inject a three-second fake-child delay. Timing output is diagnostic only. The new controlled test retains exact deadline proof.
- R-2883: require the completion event written inside the scheduled callback instead of requiring Date.now() subtraction to reach 1000. Keep launch status, slow-sampler resolution, no-start marker and no-leak checks. Inject one second of callback scheduling delay.
- Python earlier-tag checks: change the fixture generator/check toolchain and include generation failure in mapExit; retain both original result assertions and the complete pytest invocation.
- Two additional checks, both required by the brief: controlled timer (M6) and corrupt retained map (M7). No collected test files added or deleted. Touched checks: context 23→24, worker 68→68, templates 34→35; total 125→127.
- No README, rule or prompt sentence changed. No new sealed tunable or enlarged margin.

## CI cause evidence

These are only the relevant lines from the seat's supplied logs; machine paths are omitted or replaced by placeholders.

- `hive-win-a1.log`, run 42394103110 attempt 1, Windows:
  - `part g: 6 cells in REQUIREMENTS.md differ from REQUIREMENTS-general.md (the file governs): G-001, G-003, G-005, G-007, G-008, G-012`
  - `E         docs/code-map.md is stale against the code; run 'uv run python scripts/code_map.py'`
  - `FAILED tests/test_code_map.py::test_this_project_headers_and_map_are_current`
- The drift line already existed in the failing output. This was a stale generated map, not missing drift reporting or a timing failure. Generation/checking used python3 while pytest used uvx. The generator status was discarded. Both now use `uvx --with pytest python`, and generator failure cannot be masked by a successful check.
- `older-win.log`, run 42357127624: `PASS Python earlier-tag update prints Part G drift`; `PASS python earlier-tag copier update leaves REQUIREMENTS.md unchanged and its rail clean`. Its failure concerned build-busy, outside this lane; no fix made there.
- `onerev-win-a1.log`, run 42395377231: `null !== '1.4.0'`. Startup/deadline exposure is inferred; the original diagnostic did not record the unavailable reason.
- `hive-win-a2.log`, run 42394103110 attempt 2: `TIMING pi-review: baseline 4046 ms, stalled 8846 ms, added 4799 ms`; `launch exceeded baseline plus deadline and 1500 ms margin`.
- `bench-mac-a1.log`, run 42396098104: `"status":0`, `"elapsedMs":1549`, `"hold":{"heldMs":999}`, `"samplerStarted":false`, `"stubHasSampler":false`. A scheduled timer's completion was rejected by a wall-clock subtraction one millisecond short.

## Precedent and callers

All four precedent files were read completely. Existing fixtures, fake pi, tmpDir, sampler helpers, metadata reader and awaited case harness remain in use. No helper was copied or moved. No RUN_ALONE addition was needed. No precedent departure.

Repository-wide caller search found the two production piContextLoad callers in pi-worker and pi-review, plus context-anatomy tests. Production callers need no changes: return/throw behavior and defaults are unchanged. Only context-anatomy's delayed-choice and controlled-timer callers use the new optional boundary.

## Known bugs touched

The whole `docs/known-bugs/FEAT-031.md` was read. This change addresses only the brief's context-choice, stalled-launch, worker sampler-check and Python earlier-tag failures. It does not address the recorded worker process-group ceiling flake, adopt update issue, other pid probes, or other runner timing problems. No known-bug file was edited.

## Commands and results before commit

- `npm run map:impact -- <four changed modules>`: exit 0 before edits.
- `node scripts/test.mjs --verbose packages/nana-pack/tests/context-anatomy.test.mjs packages/nana-pack/tests/worker-lane.test.mjs packages/nana-pack/tests/templates-update.test.mjs`: exit 0; 127 pass, 0 fail, 0 skip.
- `node scripts/test.mjs test-runner`: exit 0; 64 pass, 0 fail, 0 skip. Repeated after test edits.
- `npm run map`, then `npm run map:check`: exit 0 each.
- `npm run req:tree`: exit 0.
- `npm run readme:check`: exit 0.
- `node scripts/test.mjs requirements-trace`: exit 0.
- `git diff --check`: exit 0.

An initial map run rejected the dynamic injected command. Making the test's Node executable and measurement path explicit fixed its launch trace without changing map config.

## Not done

No full local suite: AGENTS.md assigns it to CI. No native Windows run was available in this macOS builder session; the retained pytest and corruption controls run on Windows without a platform skip. Native Windows confirmation remains for the seat's CI. No push, CI lookup, model session, issue change, install check, README change or unrelated fix.

The final chat report supplies the full commit SHA and results of rerunning every named seat check on that commit.
