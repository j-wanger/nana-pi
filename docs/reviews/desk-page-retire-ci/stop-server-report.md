# Build brief 5 — Windows fixture shutdown

## Scope and requirement diff

- Feature: FEAT-016; branch: `feat/desk-page-retire`.
- Updated R-3798's evidence note before changing code. No requirement text or status changed; no new IDs allocated.
- Closed the named Windows race: a host exiting between the initial guard and taskkill no longer makes cleanup fail solely on taskkill's not-found status.
- Also replaced the two named fixtures' plain process stops with tree-aware shutdown.
- No other known bugs were addressed.

## Files and callers

- `apps/desk/test/stop-server.mjs`: extracted the existing app-listener helper; accepts taskkill status 128 or a failed taskkill followed by an absent pid. Other taskkill errors still reject for a live pid. A live pid after completed shutdown also rejects. Shutdown still waits for closed stdio and retains the existing bounded timeout.
- Imports existing public `pidAlive` from `packages/nana-pack/lib/process-tree.mjs`; no copied liveness implementation.
- `apps/desk/test/app-listener.test.mjs`: imports the helper for both existing stop calls.
- `apps/desk/test/page-retire.test.mjs`: replaces fixture cleanup with the helper.
- `apps/desk/test/stage-key-persistence.test.mjs`: its existing local stop wrapper delegates to the helper, covering restarts and final cleanup.
- `docs/code-map.md`: regenerated import graph.
- Existing test assertions and titles were not edited. No new tests were added because this fix brief names no new must-meet tests. Mutation pairs: none; there are no new tests requiring wrong-code-first runs.
- No direct temporary-directory creation was added; fixtures retain `tmpDir`.

## Precedent

This fix card has no Precedent section. The existing app-listener stop helper supplies the pattern. The helper now lives in a shared test utility so the other two fixtures can import it without importing an executable test module. This extraction is necessary to fulfill the brief's request for the same helper across all three files; it is the only structural departure.

## Commands and results before commit

All commands below exited 0. Full output is in the adjacent `stop-server-*.log` files.

| Command | Result |
| --- | --- |
| `node scripts/code-map.mjs --impact apps/desk/test/app-listener.test.mjs apps/desk/test/page-retire.test.mjs apps/desk/test/stage-key-persistence.test.mjs` | 0 upstream, 12 downstream |
| `node scripts/code-map.mjs --write` | map regenerated |
| `node apps/desk/test/app-listener.test.mjs` | 76 PASS lines |
| `node apps/desk/test/page-retire.test.mjs` | 4 pass, 0 fail, 2 browser-tooling skips |
| `node apps/desk/test/stage-key-persistence.test.mjs` | 2 pass, 0 fail |
| `node scripts/test.mjs test-runner` | 2 files: 2 PASS, 0 FAIL, 0 SKIP, 0 WARN; checks: 64 pass, 0 fail, 0 skip |
| `node scripts/code-map.mjs --check` | pass |
| `node scripts/readme-check.mjs` | pass |
| `node scripts/requirements-tree.mjs` | pass |

## Not done

Native Windows execution and browser cases were not observed locally. Windows remains the seat's CI check. The repository's AGENTS.md delegates the full suite to CI; no local full suite ran. No push or CI read occurred. No session archive, HANDOFF, known-bug file or issue was changed.
