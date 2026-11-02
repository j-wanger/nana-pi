# Build 1 technical record

VERDICT: PARTIAL

## Changes

- `REQUIREMENTS.md`: added implemented R-3590 through R-3594, with exact backticked test-title evidence; amended R-2403 to distinguish a lock held longer than `BUILD_BUSY_TIMEOUT_MS`.
- `packages/nana-knowledge/lib/db.ts`: exported `BUILD_BUSY_TIMEOUT_MS = 5000` and `QUERY_BUSY_TIMEOUT_MS = 100`, each with chosen provenance. Added optional `busyTimeoutMs` and installed its PRAGMA before all other statements. Create opens default to the build value; other opens default to the query value.
- `packages/nana-knowledge/lib/build.ts`: both buildLocked opens explicitly import and use the build value, including the sources-problem probe. Recovery's explicit zero stays. `DAMAGE_CODES` remains {1, 11, 26}, excluding busy/locked primary codes 5 and 6 and their extensions.
- `packages/nana-knowledge/tests/build-busy.test.mjs`: five tagged checks cover M1's existing and initial-WAL cases, M2's ten pulls/rebuilds, M3's locked hook and timeout readback, and the two M4 seals. Every direct child has a watchdog and finally cleanup. Fixtures use OS temp homes. No suite test imports, executes or copies a seat script.
- `docs/code-map.md`, `docs/requirements-tree.md`: regenerated.
- `docs/sessions/2026-11.md`: new current-month entry, newest first.
- Evidence: `build-1-red.txt`, `build-1-green.txt`, `m5-win32.txt`, `checks.txt` in this folder. Outputs replace machine paths with placeholders.

## Wrong code and green results

Requirement diff preceded tests, which preceded implementation. The initial obvious wrong implementation was the unchanged lane base's main code: no busy handler. The final red run exited 1. Both M1 cases failed with database-is-locked errors; M2 missed 4/10 pulls and 3/10 rebuilds. The readback and seals also failed because the exports did not exist. The green run exited 0 with all five new checks passing and 10/10 pulls/rebuilds.

The seat owns the remaining mutation pairs. No post-implementation mutation pairs were run by this builder. The baseline red/green pair covers R-3590 and R-3591; missing exports also made the two seal checks red before implementation.

No existing test was edited. Repository-wide tracked test/checker literal search found only recovery's existing timeout and explicit zero. Its 30-second case deadline already covers the new five-second build wait. Recovery's assertions and limits stay unchanged.

## M5 and incomplete work

- Touched knowledge command: `node scripts/test.mjs packages/nana-knowledge/tests/build-busy.test.mjs packages/nana-knowledge/tests/recover.test.mjs packages/nana-knowledge/tests/hook.test.mjs`; exit 0. Final summary: 3 files: 3 PASS, 0 FAIL, 0 SKIP, 0 WARN; checks: 113 pass, 0 fail, 1 skip.
- Stress command: ten consecutive invocations of `node scripts/test.mjs packages/nana-setup/tests/hooks-win32-exec.test.mjs`, with 80 CPU-bound `node -e "for(;;){}"` children, four per each of 20 logical cores. Runs 1-8 failed (4, 3, 5, 7, 2, 4, 3, 4 checks respectively). The 900-second worker watchdog then expired. Runs 9-10 passed without load and do not count. All 80 workers were stopped and awaited. Overall exit 1. Ten consecutive loaded passes were NOT achieved; no unrelated hook code was changed to conceal this.
- Churn command: `node --no-warnings docs/reviews/knowledge-busy-2026-11-02/hook-churn-probe.mjs . 20`; final exit 0, noPull=0, noRebuild=0, pull/rebuilt=20. The first attempt inherited the builder role and returned no pulls; the combined command exceeded its 1200-second watchdog. The successful retry cleared `NANA_ROLE`. A later process inspection found no remaining probe/churn process.
- Install command: `node packages/nana-setup/bin/install-check.mjs`; exit 1. `pi post-edit` reported write-error; 22 other items passed. The retained temporary install home was removed afterwards. This check uses its fixture provider, not a live model task.
- The local full suite was not run: CI owns it. No push was made: the brief assigns the push to the seat.
- `git log origin/main --oneline --grep='#317'` and a search for `windows-first-try-2` found no landing. The busy-timeout known-bug line is not present in this base's complete FEAT-013 file; that file was not edited. Related Windows stale-index rebuild and hook deadline context remains unchanged.

## Checks

- `npm run map`: exit 0; 585 modules.
- `npm run map:check`: exit 0; 0 problems.
- `npm run readme:check`: exit 0; 1064 claims, 0 problems.
- `node scripts/requirements-trace.mjs`: final exit 0; 2426 rows, 2170 implemented and traced, 0 off-form rows. The first run exited 1 because the new helper was named runCase; renaming it to check made the existing trace grammar recognize the awaited declarations.
- `node scripts/requirements-tree.mjs --write` and `--check`: each exit 0; 0 problems, 2426 rows, 43 features.
- `node scripts/known-bugs.mjs --root .`: exit 0; names=0, sizes=0.
- `node packages/nana-pack/bin/nana-writing.mjs docs/sessions/2026-11.md`: exit 0; over=0, passive=0, banned=0, identifiers=0.
- `node scripts/identity-scan.mjs --root .`: exit 0; 0 findings.
- `node scripts/lane-class.mjs --root . --base origin/main`: exit 0; hook class, build.ts directly imported by the CLI.

## Precedent and departures

Read all six brief precedent files and the plan's additional seat-mutation precedent before design. Imported the existing openDb/getMeta functions, hook constants, and both new timeout constants rather than copying helpers. Kept the recovery zero, damage classification, lock ownership and hook budget unchanged. The test turns the churn scenario into an independently implemented scoped harness, not an import or copy of the seat probe script. M1 uses build.lock as its holder-side barrier and releases after 500 ms.

No production-code departure from precedent. Session departure: created a November current-month file instead of editing the October file labelled as an archive, respecting the instruction never to edit session archives. Evidence departure: the loaded run cannot satisfy M5; its watchdog ended load before the last two runs. The failed loaded checks and install check remain open for the seat, rather than broadening this fix.
