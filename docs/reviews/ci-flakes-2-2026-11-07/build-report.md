# ci-flakes-2 build record

Feature: FEAT-041 · Shape each agent's context by role

## Changes

Requirements were added first as R-3835–R-3839, in M1–M5 order. No shares changed.

- M1 / R-3835: `packages/nana-pack/tests/leak-scan.test.mjs` calls the production spelling matcher directly for the platform/alias matrix. The default-temp integration checks remain. `packages/nana-pack/lib/leak-scan.mjs` now exports `machineCount`; its existing scanner caller is unchanged. No matching algorithm changed.
- M2 / R-3836: `packages/nana-setup/tests/pi-launch-limits.test.mjs` gives each fixture process a private loopback endpoint and random lifetime identity. The judge probes that identity, not PID occupancy. Its original two-second wait and self-exit exclusion remain. A controlled-clock test accepts a slow exit inside that wait and rejects a survivor.
- M3 / R-3837: both changed cases retain their assertions and fail with broken production code; mutation pairs appear below.
- M4 / R-3838: the judge accepts a replacement identity at the same recorded PID, but rejects the original live identity. The controlled test injects identity lookup, clock and pause, following the controlled deadline precedent.
- M5 / R-3839: native Windows runs all four timeout scenarios twice, with `npm: false` and `npm: true`. Other platforms retain four scenarios. The asynchronous case budget is the existing per-scenario bound times the scenario count, not a wider launch or exit margin.

## Exported CI log diagnosis

The exported logs were read only; none was copied into the repository.

All three leak failures have `operator: "==", actual: false, expected: true`, with the stack at `check`, after the last git child exited zero. The matcher assertions use equality, whereas the harness uses `assert.ok(Date.now()-started<=60000)`. Therefore these are the harness's elapsed-time assertion, not root-count failures. The case created 54 separate git repositories and committed each before checking it. Directly exercising the production matcher removes 48 such setups, leaving six default-temp integration fixtures. The 60-second harness limit stays unchanged.

The launch log's fourth scenario reports a completed version PID as alive while the install PID and its child are gone. All are gone at the later self-exit observation. PID reuse is consistent with this log, but the log cannot prove reuse or distinguish it from delayed exit: it records only PIDs. The fix measures fixture lifetime identity, accepts exit inside the existing wait, and keeps rejecting a surviving original process. It does not assume the logged PID was necessarily reused.

## Wrong-code-first and mutation pairs

Commands below use the path-filtered repository runner; logs are in `build-evidence.log`.

| Case | Wrong code | Wrong exit | Restored exit |
|---|---|---:|---:|
| M1 root matrix | `machineCount` returns zero | 1 | 0 |
| M1 root matrix | production matcher doubles each count | 1 | 0 |
| M2 slow exit, M4 reuse | original PID-only judge ignores identity and controlled-clock seams | 1; both new tests fail | 0 |
| R-2023 cleanup | relay `killTree` kills only its direct child, omitting tree cleanup | 1; R-2023 reports original fixture processes alive | 0 |

The cleanup mutation was run on macOS against the same relay cleanup call used by both Windows launch paths. Native Windows execution and path-specific Windows mutation runs were not available locally; main's CI owns Windows execution under the plan. The mutation was restored; `bounded-spawn-child.mjs` has no final diff.

## Existing test edits

- Leak-scan M4 machine-root case: replace repeated git setup with calls to the production matcher; retain default-temp scanner integration and exact-one assertions.
- R-2023: await identity-aware judgment, require identity records and an actual child record, and enumerate both Windows fixture types.
- R-2890, R-2891, R-2892: await the now-asynchronous judge. Their assertions are unchanged. The invalid-record array uses `Promise.all`.
- No test was deleted. The only new test declarations are M2 and M4 from the brief. No new sealed tunable was introduced.
- The harness accepts a case-specific bound so it can actually await all four or eight timeout scenarios. The previous synchronous case prevented its timer from firing during those launches.

## Precedent and departures

All three named precedent files were read in full before design.

- Leak-scan precedent retained: same matcher, same root matrix, same default-temp integration, same bounded harness. Departure: make the existing private matcher public in its original module and import it through the existing module loader. Reason: git subprocess scheduling is not part of spelling correctness. No helper was copied or moved.
- Launch-limit precedent retained: fake pi tree, original launch limits, original exit wait, self-exit exclusion, observational judge and no judge cleanup. Departure: loopback lifetime identity instead of PID-only probes for these fixtures. Reason: an occupied PID cannot distinguish the original process from a replacement. Existing probe-error tests continue exercising the injected kill seam.
- Context-anatomy precedent retained: separate semantic proof from elapsed wall time; use injected time and process boundaries for deterministic timing cases.

## Validation before commit

| Command | Exit | Result |
|---|---:|---|
| `npm run map:impact -- packages/nana-pack/lib/leak-scan.mjs packages/nana-setup/tests/pi-launch-limits.test.mjs packages/nana-pack/tests/leak-scan.test.mjs` | 0 | inspected before changes |
| `npm run map:impact -- packages/nana-setup/lib/bounded-spawn-child.mjs` | 0 | inspected before temporary mutation |
| `npm run map` | 0 | regenerated map |
| `npm run map:check` | 0 | map valid |
| `npm run req:tree` | 0 | 0 problems |
| `npm run readme:check` | 0 | README checks pass |
| `node scripts/test.mjs packages/nana-pack/tests/leak-scan.test.mjs packages/nana-setup/tests/pi-launch-limits.test.mjs` | 0 | 36 pass, 0 fail, 2 Windows-only skips |
| `node scripts/test.mjs test-runner` | 0 | 64 pass, 0 fail |
| `node scripts/requirements-trace.mjs` | 0 | 0 rows off EARS form; trace valid |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | all install checks pass |

CI covers the full suite per `AGENTS.md`; no local full-suite run, push, CI read, issue operation or review session was performed. None of the supplied FEAT-041 known bugs was changed. No Windows result is claimed.
