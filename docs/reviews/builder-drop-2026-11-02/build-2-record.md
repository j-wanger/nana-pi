# Builder replay — build 2 record

VERDICT: DONE

This completes the harness draft, not a paid study or a causal verdict.
The commit containing this record is the build revision; the worker report supplies its full SHA and draft PR.

## Files and rows

- `REQUIREMENTS.md`: FEAT-045, R-3600–R-3607 implemented; A-101 and the CAP-08 maker/reader declarations.
- `apps/bench/replay.mjs`, `apps/bench/lib/replay*.mjs`, `apps/bench/ext/replay-context.ts`: private replay, isolation, context cuts, frozen grading, spend journal, error taxonomy and optional supplementary reviewer.
- `apps/bench/lib/anatomy-sessions.mjs`: export `buildNumberFromBrief`, unchanged parser behavior; both anatomy callers retain their behavior. Replay imports it instead of parsing session attempt names.
- `apps/bench/run.mjs`: optional child spawn/output hooks and opt-in descendant cleanup; existing bench behavior remains the default.
- `scripts/test-locked.mjs`: export the existing machine lock location.
- `apps/bench/test/replay.test.mjs`: exactly eight new bounded, awaited requirement cases; no existing test file changed or deleted.
- `apps/bench/README.md`, `docs/code-map.md`, `docs/requirements-tree.md`: consumer contract and regenerated maps.
- `docs/sessions/2026-11-02-builder-drop.md`: new session entry; no archive changed.
- This folder: synthetic red/green evidence, command outputs and the retained build-1 stop report.

No study value or new sealed tunable was added. Operational defaults have provenance in replay-config.

## Wrong-code / green pairs

`wrong-code-first.txt` is build 1's eight-case red baseline. `build-2-main-red.txt` repeats the completed test file against a temporary archive of main: exit 1, all eight cases red.
`build-2-green.txt` is the corresponding completed implementation: exit 0, all eight cases green.
No assertion was inverted. The wrong implementation was main's absent harness.

Additional wrong-implementation observations during build 2:

| Row | Wrong implementation observed red before correction | Correct implementation |
|---|---|---|
| R-3601 | The draft used forceSystemPrompt, which pi does not persist; it also left instruction-labelled lessons intact. | Custom-preamble fallback preserves recorded system bytes; label cuts cover the first instruction too. |
| R-3603 | The draft did not route the Claude adapter through the injected spawn; it ignored known priced spend when nested spend was unknown; recovered rows lost pulls/errors. | The actual shared Claude adapter is exercised with an unpaid stub, priced lower bounds stop builders, and recovery retains measures. |
| R-3605 | Busy-aborted rows had an empty checks array. | Every manifest check remains present as not-run. |
| R-3607 | The draft lacked the exported parser and grouped by session attempt. | Shared brief parser and build-record provenance group independent session summaries. |

The initial run of build 1's later path-canonicalization fix passed all eight cases (`build-2-initial.txt`, exit 0).
The completed suite also pins resume across previously nonexistent OS-aliased sandbox paths.

## Commands and exits

| Command | Exit | Evidence |
|---|---:|---|
| `node --experimental-strip-types apps/bench/test/replay.test.mjs` against main's temporary archive | 1, expected | `build-2-main-red.txt`: 0/8 |
| `node --experimental-strip-types apps/bench/test/replay.test.mjs` | 0 | `build-2-green.txt`: 8/8 |
| `npm test -- apps/bench packages/nana-pack/tests/test-locked.test.mjs` | 0 | `touched-tests.txt`: 18 files; 17 PASS, 1 optional-extension SKIP; 830 passing checks |
| Actual installed pi 1.4.0 system-prompt renderer with the replay extension, no session or model | 0 | `pi-renderer-check.txt`; warning paths replaced with lane placeholders |
| `npm run map` / `npm run map:check` | 0 / 0 | `map-write.txt`, `map-check.txt` |
| `npm run readme:check` | 0 | `readme-check.txt` |
| `node scripts/requirements-trace.mjs` | 0 | `trace-check.txt` |
| `npm run req:tree` / `node scripts/requirements-tree.mjs --root .` | 0 / 0 | `tree-write.txt`, `tree-check.txt` |
| `node scripts/known-bugs.mjs --root .` | 0 | `known-bugs-check.txt` |
| `nana-writing docs/sessions/2026-11-02-builder-drop.md` | 0 | `session-writing.txt` |
| `node scripts/identity-scan.mjs --root .` after staging | 0 | `identity-check.txt` |
| `node scripts/lane-class.mjs --root . --files <changed-code-paths>` | 0 | `lane-class.txt`: ordinary |

Final map, README, trace, tree, known-bugs, writing and staged identity checks are repeated on the committed tip before push.
CI covers the full suite. No locked full-suite run or coverage measurement ran locally.
The code map and requirements tree were regenerated; runtime coverage data was not fabricated or refreshed without a suite.

## Precedent and departures

Every file named in both briefs' Precedent sections was read before this build changed the design.
Shared bench schedule/fingerprint/JSONL/usage helpers, agent preparation, anatomy labels/normalization/pulls, build-record readers, private-folder guard, process helpers and Claude runner are imported rather than copied.
The parser's export is the explicit build-2 authorization, not a copied replacement.

- The renderer consumes stored segmented contexts, not a fresh extraction from real transcripts. This keeps private data out of the build and takes attempt zero only.
- pi 1.4.0 rejects a custom preamble section and does not persist forceSystemPrompt. The extension uses the plan's custom-preamble fallback through systemPromptOptions rather than a command-line prompt file. The actual installed renderer verified exact bytes without starting a session.
- The public child runner gained optional hooks and opt-in cleanup instead of duplicating its private signal helper. Existing child-runner tests remain green.
- Start-tree materialization uses git archive plus system tar, not the bench fixture copier: the source is a historical git tree, not a materialized fixture. The README declares tar.
- Dry-run exact argv is private; stdout prints counts, hashes and reservation totals rather than prompts.
- Baseline errors need build-record provenance. The optional errors `--repo` selects its ledger; absent matches stay unknown, never inferred from an attempt name. Old pre-ledger builds therefore remain unknown in this slice.
- Error counts exclude successful wrappers around expected-red tests. They do not infer a failed command's intent from its text; an unwrapped expected-red nonzero tool call still counts. The row and README state this limit rather than claiming causal classification.
- The optional reviewer retains createRunner's schema/model/cost checks, with a Read-only tool adapter and a per-run sandbox. A real invocation requires an explicit native Claude entry and independent credential input where needed; missing authentication or malformed output stays missing, not zero findings. Tests use its real adapter with an unpaid spawn stub.
- The October session file is an archive, and the lane prohibits editing archives. The session entry is a new dated file instead. No HANDOFF or known-bug record changed.

## Known bugs touched

Only the FEAT-042 empty-heading and table-header cases named by the plan are addressed in the new replay renderer.
Anatomy's assembleParts remains unchanged, so its known-bug entries remain accurate.
No other known bug was fixed or edited.

## Not done / residuals

- No paid model call, real pi builder, subagent, real transcript read/copy, private-store copy, issue operation or forbidden-folder write.
- No study registration values, pilot, statistical verdict or production-context claim; those belong to the study lane.
- No seat-only real-session error baseline or live-pi startup probe; the builder used synthetic stores and the actual prompt renderer only.
- No October archive edit; the new session entry is the documented substitute.
- No full suite or runtime coverage refresh; CI is the suite under AGENTS.md. Push and draft PR details are in the final worker report, with no CI wait or read.
- The sandbox is macOS-only. Network routes outside the command audit remain a residual. Credentials are read-only, so renewal requiring an external write can fail.
- Busy exclusion is polling, not a mutual lane lock. Supplementary Claude review uses the shared bounded synchronous runner and checks busy before admission, not while that runner blocks.
- Recovery refuses a still-live saved builder pid rather than risk reusing its tuple or killing an unrelated recycled pid. An operator must resolve that interrupted process.

No open implementation question requires an issue.
