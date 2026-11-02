# Lane B build report

VERDICT: PARTIAL

Implementation and local feature checks pass. The named install smoke check still exits 1 on the brief's known builder-environment write-error.

## Commits and files

Implementation: `59bdc64e8327d2098f745dac5dafb8e132dc148a`.
The evidence/provenance-only successor records mutation results, fixed-word provenance and this report; the final worker response supplies its SHA.

- New pack modules: `packages/nana-pack/lib/memory-bundle-config.mjs`, `memory-bundle.mjs`, `memory-render.mjs`, `memory-push.mjs`.
- Changed pack modules: `packages/nana-pack/lib/memory-store.mjs` (shared root selector), `packages/nana-pack/bin/nana-memory.mjs` (imports selector), `packages/nana-pack/lib/profile-sync.mjs` (optional bounded, hidden git spawn).
- Hook: `packages/nana-setup/claude/hooks/nana-shared-memory.mjs`.
- New tests: `packages/nana-pack/tests/memory-bundle.test.mjs`, `packages/nana-setup/tests/shared-memory-push.test.mjs`.
- Existing test edit: only `packages/nana-pack/tests/context-anatomy.test.mjs`, R-3216's copied-hook fixture. The authorized renderer move made its setup-only copy incomplete. It now copies the renderer and its required frontier configuration while deliberately leaving logging absent. Assertions are unchanged.
- Contracts: `REQUIREMENTS.md`, `packages/nana-pack/README.md`, `packages/nana-setup/README.md`; generated `docs/code-map.md`, `docs/requirements-tree.md`.
- Specific brief exception to the general known-bugs ban: created `docs/known-bugs/FEAT-044.md` with exactly the six plan residuals. No existing known-bug file, HANDOFF or session archive was edited.
- Evidence: this folder's `*-check.txt`, generation logs, `touched-tests.txt`, `red-bundle.txt`, `red-push.txt`, `trace.txt`, `mutation-run.txt`, `mutation-record.txt`, `lane-class.txt` and `seat-mutate.mjs`.

Rows R-3412 through R-3421 live under new FEAT-044 with the exact planned purpose. No other row IDs were allocated. FEAT-044 reads A-090 and A-093 through `memory-push.mjs`; R-3417 declares the new A-089 fields. Existing artifact makers remain in their owning features. No new artifact was allocated.

## Requirement → tests → code

The ten rows were written planned, then both tagged test files were written and run before implementation.
Starting code returned exit 1 for each file: all seven bundle/seal cases and all five hook cases failed. Full initial output is in `red-bundle.txt` and `red-push.txt`; machine paths are normalized.
The tests import shared fixture/check helpers. Every async case is awaited under the fixture's 120-second per-case limit, with separately bounded child processes. Fixtures stay in OS temp directories. The index fixture uses CRLF, trailing spaces/tabs and no final newline. No suite test imports, copies or runs the seat mutation script.

Fixture corrections during development: an `undefined` destructuring default accidentally made the intended unscoped record scoped; it now uses an extracted profile-area record with no repository. B3 uses a short index with room for its error note, avoiding a path-length-dependent conflict with the hard total cap. Neither correction changes an assertion or production behavior to make a wrong mutation pass.

## Mutation pairs

Shared runner command: `SEAT_MUTATE_OUT=<record> node docs/reviews/seat-memory-push-2026-11-01/seat-mutate.mjs` → exit 0.
Baseline and all mutations ran in scratch worktrees of the implementation commit. Every mutation changes production code, not an assertion.

| Pair | Wrong production code | Named red case |
|---|---|---|
| B1 | Drop repository isolation | B1 |
| B2 | Drop saved-source priority | B2 |
| B3 | Read under launcher roles | B3; declared B4 collateral |
| B4 | Ignore the timeout at the real git spawn | B4 |
| B5 | Cut on merge stamp instead of evidence day | B5; declared B1 and B6 collateral |
| B6 | Log claim lines | B6 |
| B7-budget | Retune 4000 to 4002 | Push-budget seal |
| B7-parts | Reverse parts | Part/source seal; declared B2 collateral |
| B7-kinds | Swap correction/decision | Kind seal; declared B2 collateral |
| B7-git | Retune 1000 to 1001 | Git-timeout seal |
| id | Retune 12 to 13 | Printed-id seal; declared B2 collateral |
| margin | Retune test margin | Margin seal |

`RESULT: 12/12 red (12 exactly their named titles, 0 with a named title green, 0 with an unnamed red), 0 survived, across 5 shards`

## Commands and exits

- `node scripts/test.mjs memory-bundle.test shared-memory-push.test shared-memory-budget.test shared-memory-hook.test shared-memory-input.test context-anatomy.test memory-run.test memory-run-recovery.test memory-run-seals.test profile-sync.test` → 0.
- `10 files: 10 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 109 pass, 0 fail, 0 skip`.
- Both original shared-memory tests are unchanged.
- `node scripts/test.mjs requirements-deliverables.test requirements-trace.test` → 0 (82 checks).
- `npm run map`, `npm run map:check`, `npm run readme:check` → 0 each.
- `node scripts/requirements-trace.mjs` → 0: 2418 rows, 2163 implemented and traced, zero EARS errors or missing titles.
- `npm run req:tree`, then `node scripts/requirements-tree.mjs --root .` → 0 each: zero problems, 2418 rows, 44 features.
- `node scripts/known-bugs.mjs --root .` → 0: names=0, sizes=0.
- `node scripts/identity-scan.mjs --root .` → 0 after normalizing machine paths in generated output. No allowlist changed.
- `node scripts/lane-class.mjs --root . --files <changed delivery modules and hook>` → 0, class hook.
- `node packages/nana-setup/bin/install-check.mjs` → 1. The only failure is `FAIL pi post-edit — write-error: write tool result is marked as an error`, the brief's known builder-environment failure. All hook legs pass; full output is committed.
- An initial mistyped deliverables script path returned 1; the real deliverables check is the passing suite file above. An initial trace run returned 1 for a missing R-3421 marker on B4; the marker now matches the evidence. Those invocation/annotation errors are closed.

CI is the full suite. No locked full-suite run, model session, subagent or real profile/store read was started by the builder. The requested install checker ran its existing isolated smoke probes.

## Precedent and departures

All brief and plan Precedent files were read before designing. `show` is unchanged. `readMemoryStore` remains the sole combined store reader. `resolveMemoryRepository` is imported by both consumers; the hook's header/fold/shortener moved without algorithm or no-push-byte changes. The push uses `canonicalCwd` for the guard comparison, `profileGit` for subprocesses, the imported shared deadline/output budget, and `appendContextLoad` for private logging. Fixtures reuse the existing profile/memory-run helpers.

Departures and reasons:

1. Error-note cap: if an index already consumes the total cap, appending a note byte-for-byte cannot also preserve 9000 characters. The renderer reserves note space using the unchanged shortener in that error case. Skips stay byte-identical. R-3414 and both READMEs state the tested guarantee honestly.
2. Copied-hook fixture: R-3216 now includes the moved renderer and the imported deadline producer's required frontier config. The logger remains absent to preserve the original test's intent.
3. Git seam: `profileGit` gains an optional third argument for timeout and hidden windows. Existing callers retain their default timeout/window behavior; only this push opts in. This is needed to enforce the planned deadline at the actual process boundary.
4. Hash wording: the README preserves the existing truthful distinction: saved profile ids hash claims; extracted project ids hash evidence plus claim. Both printed ids are 12-hex SHA-256 prefixes. Calling every id a claim hash, as the plan suggested, would be false.
5. CLI error precedence: moving root selection after config parsing preserves selection logic but malformed config now wins if both config and repository roots are invalid. Valid invocations and early CI/role refusals are unchanged.
6. The hook uses the shared renderer's metadata-returning entry point; the exported text-only `renderSeatMemory` delegates to it. This preserves old index logging while giving replay the specified text API. B5 pins exact equality.

## Known bugs touched and remaining work

No existing known bug was fixed in Lane B. The FEAT-040 re-extraction/retraction residual is carried unchanged into FEAT-044, as the plan requests. Damaged profile files still abort store reads; this lane adds the specified fallback note, not profile repair. Skipped damaged project events can still expose an older record, as already recorded under FEAT-040. Other profile/git callers keep their existing Windows window behavior.

Lane A's role refusal and prefix support were already on main and were not reimplemented. The six delivery residuals remain open. The replay adapter, private record/index overlap count, migration follow-up issue, independent review and Windows CI reading belong to later lanes or the seat. The owner questions use the brief's defaults: keep the index, include every live project role. No GitHub issue was created, edited or read for a new decision.

The final response records the pushed branch, full pushed tip, push exit and draft PR. After pushing, the builder does not wait for or inspect CI.
