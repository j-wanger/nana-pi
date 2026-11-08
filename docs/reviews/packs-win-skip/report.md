# packs-win-skip technical record

## Changes

- `packages/nana-pack/lib/windows-skips-config.mjs`: declare the hostile file's whole-file win32 skip using section C's existing reason. Keep the existing desk reasons unchanged.
- `packages/nana-pack/tests/agent-dir-hostile.test.mjs`: remove only the unused `canLink` probe. Section C's checks and requirement markers remain byte-identical.
- `packages/nana-pack/tests/test-runner.test.mjs`: update the existing R-1383 inventory assertion and title to admit collected package tests, excluding fixtures.
- `REQUIREMENTS.md`: broaden existing R-1383's collection locations and update its evidence title. No new IDs.
- `docs/code-map.md`: regenerate the deleted probe's shifted launch line.

Precedent: the existing frozen Windows skip map and provenance comment. Departure: the new entry uses its file's own reason directly, not the desk-only reason wrapper, because it is not a desk test.

## Sweep

Every unique source and destination in `docs/reviews/ci-packs/moves.json` was checked for platform/precondition guards.

| Source file | Windows verdict |
| --- | --- |
| `packages/nana-pack/tests/leak-scan.test.mjs` | Runs; unconditional scanner checks. |
| `packages/nana-pack/tests/identity-scan.test.mjs` | Runs; no platform skip guard. |
| `packages/nana-pack/tests/worker-lane.test.mjs` | Runs; only the extensionless git-wrapper case skips. |
| `packages/nana-pack/tests/objective-golden.test.mjs` | Runs; permission/ownership/FIFO/lock cases skip, other golden cases remain. |
| `packages/nana-pack/tests/win32-launch.test.mjs` | Runs; native Windows cases remain, and skip only off Windows. |
| `packages/nana-pack/tests/claude-review.test.mjs` | Runs; prompt/outcome checks remain, plus a native Windows case. |
| `packages/nana-pack/tests/agent-dir-hostile.test.mjs` | All remaining checks skip; declare whole-file skip. |
| `packages/nana-pack/tests/agent-dir-parity.test.mjs` | Runs; only desk legs skip, resolver/setup checks remain. |
| `packages/nana-setup/tests/doctor-detail.test.mjs` | Runs; only launchd service diagnostics skip. |
| `packages/nana-setup/tests/win-shims.test.mjs` | Runs; native Windows cases remain. |
| `packages/nana-pack/tests/code-map.test.mjs` | Runs; no platform skip guard. |
| `packages/nana-pack/tests/templates-render.test.mjs` | Runs; unconditional source checks remain, rendering depends on tools rather than platform. |

| Destination file | Windows verdict |
| --- | --- |
| `packages/nana-pack/tests/leak-scan-cli.test.mjs` | Runs; unconditional CLI case. |
| `packages/nana-pack/tests/identity-tree.test.mjs` | Runs; unconditional inventory and seal checks. |
| `packages/nana-pack/tests/worker-refusal.test.mjs` | Runs; unconditional refusal checks with platform-specific fake pi. |
| `packages/nana-pack/tests/objective-smoke.test.mjs` | Runs; unconditional smoke cases. |
| `packages/nana-pack/tests/win32-forced.test.mjs` | Runs; injected win32 cases run on every host. |
| `packages/nana-pack/tests/claude-review-launch.test.mjs` | Runs; unconditional launch/refusal checks with platform-specific fake Claude. |
| `packages/nana-pack/tests/agent-dir-policy.test.mjs` | Runs when symlinks are available; `canLink` is a capability guard, not a win32 exclusion. No unconditional Windows skip added. |
| `packages/nana-pack/tests/agent-dir-resolver.test.mjs` | Runs; unconditional resolver inventory check. |
| `packages/nana-setup/tests/doctor-floor.test.mjs` | Runs; unconditional floor checks. |
| `packages/nana-setup/tests/win-shims-sh.test.mjs` | Runs; both cases target all hosts, using Git Bash on Windows. |
| `packages/nana-pack/tests/code-map-land.test.mjs` | Runs; unconditional map checks. |
| `packages/nana-pack/tests/templates-working.test.mjs` | Runs; unconditional shared-guidance checks when invoked as a test. |

## Verification before commit

- `node scripts/test.mjs agent-dir test-runner test-packs`: exit 0; 14 files, 352 passing checks.
- `npm test -- --pack=land --jobs=4`: first exit 1 because removing the probe shifted a generated map line. Regenerated the map; rerun exit 0; 71 files, 2413 passing checks, 6 skipped checks.
- `npm run map:check`: exit 0.
- `npm run readme:check`: exit 0.
- `node scripts/requirements-trace.mjs`: exit 0.
- No new test or sealed tunable; no new-test wrong-code or mutation pairs apply. Existing runner cases R-1380/R-1381 exercise skip/no-launch behavior under forced win32 and execution under forced Linux.
- Existing test edits: remove the dead probe; broaden R-1383's inventory assertion and rename its title. No assertions were inverted.
- Removed-text grep: the old R-1383 title has no remaining test reference. The probe names and skip sentence remain legitimately in the policy test and other symlink tests.
- Read all of `docs/known-bugs/FEAT-031.md`. No named known bug is closed or edited; skip-list automatic retirement and desk limitations remain unchanged.
- Full suite deferred to CI under `AGENTS.md`; no push, CI read, credential access, issue changes, or model sessions.

Long command output is in sibling `.log` files. Seat checks are rerun on the committed tip and their exits reported separately.
