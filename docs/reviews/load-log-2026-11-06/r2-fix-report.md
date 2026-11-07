# Load-log round 1 fix record

VERDICT: DONE

## Closures

- Checker MUST: package lookup, import and loader now run in a disposable Node child under a sealed 3000 ms deadline. Expiry kills the child and returns `context files: unavailable (timed out)` without blocking the real launch.
- Reviewer MUST: pi-review logs the reviewed source root as `cwd`, the immutable checkout as `childCwd`, and measures context from that checkout. A real launcher-to-meter regression test counts that load.
- Reviewer SHOULD: the meter names context-file and disabled parts and folds all unavailable reasons into one named alias.
- Reviewer SHOULD: the README explains that windows spanning the load-log land compare two different total measures.

## Files and rows

- `REQUIREMENTS.md`: reworded R-3729, R-3732 and R-3336 before tests and implementation. No new IDs were allocated; this brief allocates no range.
- `packages/nana-pack/lib/pi-context-load.mjs`: bounded subprocess wrapper, metadata validation, diagnostic isolation and temporary cancellation handlers.
- `packages/nana-pack/lib/pi-context-measure.mjs`: moved the existing locator/import/loader logic into the disposable child. Only metadata crosses stdout; loader output is suppressed and stderr is discarded.
- `packages/nana-pack/bin/worker-config.mjs`: `PI_CONTEXT_TIMEOUT_MS = 3000`, chosen above the measured 0.4-second import, pinned under R-3732.
- `packages/nana-pack/bin/pi-review.mjs`: source/child cwd fields and cancellation propagation.
- `packages/nana-pack/bin/pi-worker.mjs`: cancellation propagation during the new asynchronous measurement phase.
- `packages/nana-pack/lib/outcome-meter-config.mjs` and `packages/nana-pack/lib/outcome-meter.mjs`: vocabulary and unavailable-reason aliasing; R-3315's test-load classification remains unchanged.
- `packages/nana-pack/tests/context-anatomy.test.mjs`: two requested tests and one seal test. The timeout test covers a stalled import in pi-worker and stalled loader in pi-review, requires launch within 3000 ms plus a 1500 ms margin, and checks measurement-child death.
- `packages/nana-pack/tests/outcome-meter.test.mjs`: updated the existing frozen-vocabulary oracle.
- `packages/nana-pack/README.md`: total-measure warning, cwd contract and bounded-child behavior.
- `docs/code-map.md`: regenerated. Other `r2-*.log` files beside this record contain command output.

## Existing test edits

1. R-3729's existing checkout-context test now asserts source-root `cwd` and checkout `childCwd`; its old cwd assertion became false by design.
2. R-3336's existing output-word seal includes the three new vocabulary entries; its old expected array became false by design.

No other existing test was edited or deleted. All new cases use the existing awaited, per-case-limited harness and OS-temp fixtures. The timeout case additionally uses an asynchronous launcher with a 10-second SIGKILL harness guard.

## Wrong-code / right-code pairs

Each requested new test ran against the old implementation before implementation work. Assertions were never inverted.

| Test | Wrong code | Wrong exit / log | Right exit / log |
|---|---|---|---|
| R-3732: stalled measurement is killed and both launchers proceed within the deadline | Original unbounded in-process import; the harness kills the launcher after 10 seconds without any real child launch | 1, `r2-wrong-timeout.log` | 0, `r2-right-timeout.log`; also green in the final touched run |
| R-3732: context measurement deadline seal is 3000 ms | Original missing seal, then actual constant mutated from 3000 to 3001 | 1, `r2-wrong-seal.log` and `r2-mutant-seal.log` | 0, `r2-right-seal.log` |
| R-3729: real review loads count by source cwd and name context statuses | Original checkout `cwd`: meter reports four test loads instead of zero | 1, `r2-wrong-meter.log` | 0, `r2-right-meter.log` |
| Same R-3729 regression case, alias clause | Removed unavailable-reason normalization from code | 1, `r2-mutant-alias.log` | 0, `r2-right-meter.log` |

Filtered commands use `CONTEXT_CASE='<test-title prefix>' node packages/nana-pack/tests/context-anatomy.test.mjs`.

An initial synchronous wrong-code probe exceeded the shell's 70-second guard because the old launcher's signal handlers swallowed spawnSync's timeout signal. That probe produced no accepted pair; the asynchronous SIGKILL harness above replaced it. No implementation test was weakened.

## Commands and exit codes

- `node scripts/code-map.mjs --impact packages/nana-pack/lib/pi-context-load.mjs packages/nana-pack/lib/outcome-meter.mjs packages/nana-pack/lib/outcome-meter-config.mjs packages/nana-pack/bin/pi-review.mjs`: 0; `r2-impact.log`.
- `node scripts/code-map.mjs --write`: 0; `r2-map-write.log`.
- `node scripts/test.mjs context-anatomy outcome-meter memory-replay worker-lane worker-claude win32-launch watchdog-exit watchdog-cpu agent-dir- immutable-review review-ledger-launch seat-rule`: initially 1; `r2-tests.log`. The existing R-2693 startup-signal case caught a signal arriving during the new asynchronous measurement interval.
- Same touched-test command after cancellation propagation: 0; `r2-tests-green.log`.
- Final touched summary: **16 files: 16 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 507 pass, 0 fail, 12 skip**. Installed-pi R-3727 ran without skipping.
- `node scripts/test.mjs outcome-meter memory-replay` after restoring the alias mutation: 0; `r2-meter-final.log`.
- `node scripts/readme-check.mjs`: 0; 1092 claims, zero problems; `r2-readme.log`.
- `node scripts/requirements-trace.mjs`: 0; 2541 rows, 2284 implemented and traced, zero EARS exceptions; `r2-trace.log`. Node emitted the existing template module-type warning.
- `node scripts/requirements-tree.mjs --root .`: 0; zero problems; `r2-tree.log`.
- `node scripts/code-map.mjs --check`: 0; 616 modules, zero problems; `r2-map-check.log`.
- `node scripts/lane-class.mjs --root . --files <changed-runtime-paths>`: 0; `r2-lane-class.log`.
- `git diff --check`: 0.

## Precedent and departures

All four named precedent files and the meter config were read before design.

- The loader logic moved rather than being reimplemented. It still imports `locatePiPackage`, `piAgentDir` and `contextPart`; no private precedent helper was copied.
- Child spawning retains the watchdog's detached process-tree pattern. Departure: deadline cleanup imports the shared `killProcessTreeNoWait` rather than waiting for the watchdog's synchronous tree kill and close. This keeps Windows taskkill latency outside the launch deadline; a direct SIGKILL also stops the measurement process immediately.
- The wrapper temporarily handles cancellation and both launchers propagate it through their existing stopped-result paths. This small lifecycle addition preserves the unchanged R-2693 test after measurement became asynchronous.
- Tests retain the lane harness and fixtures. The meter regression uses a real recording pi-review launch, with an injected temporary classification root to distinguish its checkout from its source fixture.

## Not done and limits

- No listed FEAT-041 known bug was changed. Claude Code context discovery, concurrent log writers and all other listed residuals remain unchanged.
- No HANDOFF, known-bug file, session archive or GitHub issue was edited.
- No model session or subagent was started. No push or CI read was performed.
- The local full suite was not run: AGENTS.md explicitly assigns it to CI. The seat must push and verify CI.
- Native Windows execution was unavailable; the touched run includes eight Windows-launch skips and four other platform skips. The seat's CI provides native Windows verification.
- No seat checks are explicitly named in Brief 3. The final chat reports map, README, requirements trace and tree checks rerun on the committed tip, plus the full SHA and branch.
