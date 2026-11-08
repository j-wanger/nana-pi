# ci-flakes-3 build evidence

Feature: FEAT-031 · Run checks reliably and without contaminating work

## Changes and rows

Requirements were changed before the tests. Six new rows occupy R-3905–R-3910 in M-order under FEAT-031, with no new shares.

- M1 / R-3905, M3 / R-3907, M4 / R-3908: implemented by the retained R-2694 case in `packages/nana-pack/tests/worker-claude.test.mjs`. The test waits for the selected read's readiness, not a fixed delay after the precedent line. Every subcase retains exact `{code: null, signal: "SIGTERM"}`, zero builder calls, no fake builder marker, an empty temporary directory and no lane lock.
- M2 / R-3906, M5 / R-3909, M6 / R-3910: conditional contracts retired under M5's no-runtime-caller alternative. The original R-3591 row is retired, not deleted or reused. Only its M2 case was deleted from `packages/nana-knowledge/tests/build-busy.test.mjs`; its now-unused STALE_MS import was removed. Other cases and production code are unchanged.
- `docs/code-map.md` and `docs/requirements-tree.md`: regenerated module line locations and requirement inventory.

No production budget, production deadline, test deadline or other tunable changed. No new tunable or test file was added. No file was deleted or renamed. No other requirement was retired.

## Exported failure audit

The supplied `r2694-42449374856.log` identifies the failing startup subcase as HEAD: `precedent=true`, `blocked=false`, signal SIGTERM, no artifacts, no lock and no builder calls. Both other reads passed. The old test slept 500 ms after a precedent diagnostic that precedes the trust subprocess and settings read. That diagnostic does not establish that git's HEAD subprocess has started. On this run the HEAD shim had not written its marker when the test signalled the worker. The worker correctly terminated, but the test failed its readiness precondition. Waiting for that shim's marker addresses the observed race without increasing a margin.

The old settings precondition only required the worker to be alive. The revised fixture opens a nonblocking FIFO writer only when that particular settings reader is opening its FIFO. It holds the writer open without sending data, so the settings read cannot finish before SIGTERM. The trust fixture retains its read-specific preload marker immediately before its deliberately blocking open; unlike settings, it must not open a writer during readiness, because trust rejects a FIFO after open returns. The HEAD fixture retains its read-specific hanging git subprocess marker. Every marker wait uses the existing bounded readiness allowance; SIGTERM is sent only after readiness succeeds.

The supplied `m2-42509102509.log` reports run 1 with `ms=2302`, `reason=budget`, `code=0`, empty stdout and `rebuild=true`; `noPull=1`, `noRebuild=0`. This is budget exhaustion, not a failed background build. A bounded fail-open hook is allowed to emit nothing after its budget expires; the retired unconditional ten-pull assertion treated that permitted outcome as failure under runner load.

Limitation: the plan also names startup run 42445916333. Its log was not among the two exports supplied in the brief. This lane establishes the cause in 42449374856 and the unsafe shared readiness assumption, but cannot independently attribute 42445916333 from an absent log. No GitHub access was attempted.

## Caller search supporting M5 retirement

Searches covered repository source, scripts, manifests and setup wiring, excluding tests for the initial caller inventory:

```
rg -n 'runHook|lib/hook|nana-knowledge.*hook' packages scripts --glob '!**/tests/**'
rg -n 'runHook|nana-knowledge.ts.*hook|nana-knowledge hook' --glob '!docs/**' --glob '!REQUIREMENTS*' --glob '!**/tests/**' --glob '!**/test/**'
```

The only production import/call of knowledge `runHook` is `packages/nana-knowledge/bin/nana-knowledge.ts`'s legacy `cmdHook`, explicitly selected by the compatibility `hook` CLI verb. No registered automatic runtime producer invokes that CLI path:

- `packages/nana-knowledge/package.json` registers `pi.extensions: []`. The root manifest registers only nana-pack extensions; searching their source finds no knowledge-pull producer.
- `packages/nana-setup/lib/settings.mjs`'s `retiredKnowledgeHook` is expressly an ownership/uninstall descriptor, never installation. Its matching and health code recognizes historical wiring; it does not invoke a pull.
- `packages/nana-setup/lib/steps.mjs` removes retired knowledge entries before merging the active desired hooks. The setup knowledge subprocess is `build`, not `hook`.
- `packages/nana-setup/claude/hooks/` contains no knowledge dispatch. Its `runHookProducer` references are unrelated objective and adoption producers.
- `packages/nana-knowledge/README.md` explicitly calls the legacy CLI unwired compatibility, not a runtime producer. Its automatic Claude and pi delivery sections both state retirement.
- Research and archived prose describe historical behavior, not live callers. Owner-customized old wiring can remain foreign; it is not registered or installed automatic delivery.

Existing retirement checks were read and run, not modified: `pull-cut.test.mjs` and `seat-pull-off.test.mjs`. They passed nine checks, including no pi prompt producer, fresh POSIX/win32 installs without knowledge entries, removal of old managed wiring, no install-check dispatch and retained explicit query. See `caller-tests.log`.

M5 therefore selects retirement rather than production budget widening. Its ten fresh Windows pulls, budget-exhaustion seam and M6 churn adversaries are inapplicable. The retained legacy hook's other tests remain intact.

## Wrong-code-first mutation pairs

After updating the tagged startup test, production code was deliberately broken, then restored byte-for-byte. Assertions were never inverted. Each command was `node scripts/test.mjs worker-claude.test`.

| Pair | Wrong production change in pi-worker.mjs | Red result | Restored result |
|---|---|---|---|
| Trust | Move the existing no-op signal-listener loop from after HEAD to immediately before `trusted(cwd)` | exit 1; trust readiness true, termination TIMEOUT; later reads also fail | exit 0; retained startup check passes |
| Settings | Move that loop immediately before `readClaudeBuilderSettings` | exit 1; trust passes, settings readiness true and termination TIMEOUT; HEAD also fails | exit 0; retained startup check passes |
| HEAD | Move that loop immediately before `git('rev-parse', 'HEAD')` | exit 1; trust and settings pass, HEAD readiness true and termination TIMEOUT | exit 0; retained startup check passes |

Logs: `wrong-trust.log`, `wrong-settings.log`, `wrong-head.log`, and restored `green.log`. All final red runs used the final readiness harness. Production code has no committed diff. Retired M2 has no mutation pair because M5 explicitly removes that proof obligation when automatic delivery has no runtime caller.

## Existing test edits and precedent

All three precedent files were read completely before design.

- `worker-claude.test.mjs`: the existing R-2694 readiness/fixture logic changed because a precedent diagnostic plus elapsed time did not imply the selected read had started. Its title and behavioral assertions remain unchanged; R-3905, R-3907 and R-3908 were added to its marker. The obsolete settle constant was removed.
- `build-busy.test.mjs`: only the brief-named M2 test was removed, with its unused import. This is the M5-authorized departure from retaining the precedent's churn test, supported by the caller audit above.
- `pi-launch-limits.test.mjs`: followed its principle of observing the resource's identity/state rather than elapsed startup time. No helper was copied or needed: its socket lifetime probe cannot identify these blocked reads; existing FIFO and shim fixtures supply read-specific readiness instead. This is a mechanism difference, not a timing-margin substitute.

No new suite test imports or executes a seat script or a whole-repository checker. All fixtures stay in OS temporary directories through the shared tmpDir helpers. The changed code adds no line-by-line text reader.

## Checks before commit

Each exit code was read independently. Long output is committed beside this record with fixture/home paths sanitized.

| Command | Exit | Result |
|---|---|---|
| `npm run map:impact -- packages/nana-pack/tests/worker-claude.test.mjs packages/nana-knowledge/tests/build-busy.test.mjs` | 0 | 0 upstream, 79 downstream modules |
| `node scripts/test.mjs worker-claude.test build-busy.test` | 0 | 38 pass, 0 fail, 3 skip; `green.log` |
| `node scripts/test.mjs pull-cut.test seat-pull-off.test` | 0 | 9 pass; `caller-tests.log` |
| `npm run map` | 0 | `map.log` |
| `npm run map:check` | 0 | 523 modules, 0 problems; `map-check.log` |
| `npm run req:tree` | 0 | 2691 rows, 43 features, 0 problems; `req-tree.log` |
| `node scripts/requirements-trace.mjs` | 0 | 2007 traced, 0 EARS errors; `trace.log` |
| `npm run readme:check` | 0 | 781 claims, 0 problems; `readme.log` |
| `git diff --check` | 0 | clean |

An initial trace run exited 1 because the new implemented R-3907 evidence cell formatted this record as a test citation. Removing that non-test citation fixed it; the tagged test citation remains. No new test file was added or deleted, so the collection-change test-runner command was not required. No root lint or type-check script exists. AGENTS.md assigns the full suite to CI; no local full suite was run. No setup or hook source changed, so no install check was required.

The final-tip report separately records the required three consecutive touched-test runs and every seat check on the commit. No push, model session, subagent, GitHub call or issue change was made.

## Removed-reference and known-bug audit

`removed-reference-audit.log` searches every removed nonempty test-source line across package and app test folders. The retired test title has no surviving test reference. No path or filename was removed or renamed.

The entire `docs/known-bugs/FEAT-031.md` was read. No known-bug line names these two exported failures, and no known-bug file was changed. The listed R-2720 lock-release flake, bare-PID checks, startup-limit gaps and general runner-load limits remain open and are not claimed as closures.
