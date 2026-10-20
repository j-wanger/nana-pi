# knowledge-index-recover — build brief 2

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/knowledge-index-recover`, on top of the current tip (the seat committed its pairs record; the branch merged main fed7d7f9 at ad3ae5d6, no knowledge file changed). Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main. `import { tmpDir } from "./tmp-dir.mjs";` on its own line in any new test file; never call mkdtempSync.

## Why
The seat's gate checks on de48bcdb: pairs 21/22 red (`seat-mutate-output-de48bcdb.txt`); the independent check's verdict is FINDINGS with one MUST.

**MUST — a healthy index under a sources problem no longer refreshes its age or prunes shown/.** `buildLocked` now opens the index read-only for every sources problem (`openDb(paths.db, { create: !problem, readonly: !!problem })`), and `buildOpen` returns before `setMeta(built_at)`, the checkpoint and `pruneShown()`. R-2407 asks for a byte-for-byte keep only for a damaged index; the lane applied it to a healthy one too. Probes against base 63aca2fb, with a trailing-comma sources.json over a healthy index whose mtime is 32 h old and a 49-day-old shown/ file: base moves the mtime (age 0.0 h) and prunes the shown file; the tip leaves the age at 32.2 h and the file in place. Five pulls through `runHook` start 1 background build on base and 5 on the tip. R-210 (shown/ pruning) breaks in that state.

**Known bug — a broken sources file with no index.db no longer creates an empty index.** Base creates an empty index.db; the tip leaves none but still prints its db path, so nana-setup's install step reports `skipped | build failed, the pull just stays quiet: exit 0` for a build that exited 0, and every pull starts a build. This is also the pairs survivor B7: no check builds with an unparseable sources.json and no index.db.

## Do, nothing else
1. Under a sources problem, check the existing index read-only first. If it is damaged, keep it exactly as now (R-2407: byte for byte, the not-rebuilt line). If it is healthy, open it read-write and finish as main does: no root scan, every row kept, but `built_at` refreshed, the checkpoint run and shown/ pruned.
2. Under a sources problem with no index.db, create an empty index as main does, so the age is fresh and nana-setup's install step reports the build as created, not failed.
3. Two new rows in FEAT-003 after R-2407, with one check each in recover.test.mjs (title prefixed by the row id, `// req:` directly above `check(`):
   - R-2408: WHILE sources.json exists but does not parse, WHEN index.db is healthy and older than the stale age, `nana-knowledge build` shall keep every row, refresh the index age and remove shown/ files older than the shown-file age, as it does today. (Check: trailing-comma sources.json over a healthy index with its mtime set back; after `build`, the row count is unchanged, the status age reads under the stale age, and a shown/ file older than the prune age is gone.)
   - R-2409: WHILE sources.json exists but does not parse, IF index.db does not exist, THEN `nana-knowledge build` shall exit 0, print the UNPARSEABLE line and leave an empty index.db. (Check: trailing-comma sources.json, no index.db; exit 0, the line, index.db exists with 0 rows.)
   Read every age and limit by its existing name, never a literal.
4. Show R-2408 and R-2409 red on de48bcdb and green on the tip; keep recover.test.mjs's eight checks and every other knowledge file green.
5. Run alone: `npm test -- packages/nana-knowledge/tests/recover.test.mjs`, `incremental-build.test.mjs`, `unreadable-root.test.mjs`, `discovery.test.mjs`, `hook.test.mjs`, `extension.test.mjs`, `sources-file.test.mjs`; `npm test -- packages/nana-setup/tests/install.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map`, `npm run -s req:tree`, `npm run -s map:check`, `npm run -s readme:check`.
6. Commit with explicit paths.

**Report** (6 lines or fewer, VERDICT first): commit; each command's result; R-2408 and R-2409 red on de48bcdb and green now; that R-2407's eight fixtures still keep index.db byte for byte.
