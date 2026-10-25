Feature: FEAT-003 · Index and connect existing knowledge sources. Lane knowledge-freeze-notice. Class: hook. Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/knowledge-freeze-notice. The spec is `docs/reviews/knowledge-freeze-notice-2026-10-25/must-meet.md`; read it whole. `plan-draft.md` and `plan-attack.md` beside it are its inputs; where they differ, the must-meet holds. Do not edit HANDOFF.md, `docs/sessions/`, `docs/known-bugs/`, `scripts/product-report.mjs`, `docs/product-report/`, any file in a review folder, `packages/nana-knowledge/lib/build.ts`, `packages/nana-knowledge/extensions/nana-knowledge.ts`, `packages/nana-pack/lib/json-text.mjs`, `packages/nana-setup/lib/steps.mjs`, anything under `templates/`, A-052's `Artifact:` line, or the `Made by:` lines of R-217 and R-341. Change no existing check in any test file; you add checks only.

Precedent:
- packages/nana-knowledge/lib/sources.ts — `loadSources`' read, ENOENT split and parse (lines 165-189) become `readSourcesFile(file)` minus the seed; `formatSourcesProblem` and its two markers (lines 151-163) move unchanged.
- packages/nana-pack/lib/json-text.mjs — `configFailureDetail` (lines 51-57), the form for `frozenNotice(problem)`; `FORWARD_SLASH_ADVICE` and `MANUAL_JSON_ADVICE`, imported by name.
- packages/nana-knowledge/lib/hook.ts — `HEADER`, `finish` and `none` (lines 141-158), and the role, input and skip returns (lines 159-168) that stay first.
- packages/nana-setup/lib/doctor.mjs — `knowledgeIndexState` and its `DatabaseSync` seam (lines 70-79), `projectFileState`'s return shape (lines 123-133), the mcp.json note row (lines 597-598), the knowledge index row (lines 644-647), and the restated-rule comment (lines 116-121) for the declared departure.
- packages/nana-knowledge/bin/nana-knowledge.ts — status's `built_at` read and `built ${ageH}h ago` wording (lines 134 and 145-146).
- packages/nana-setup/lib/steps.mjs — `KNOWLEDGE_CLI` (line 96), the path in doctor's rescan command; read only.
- packages/nana-knowledge/tests/sources-file.test.mjs — F1 to F4, `fixture`, `run`, the byte-mark list built from numeric codes, the folder stand-in, R-2373's exact marker.
- packages/nana-knowledge/tests/recover.test.mjs — in-process `runHook` and `activate`, with `NANA_ROLE` deleted.
- packages/nana-knowledge/tests/hook.test.mjs — `payload`, `noSpawn` and the pre-retrieval budget case (`budgetMs: -1`); read only.
- packages/nana-setup/tests/doctor-knowledge.test.mjs — R-675's fixture and `ProbeDatabase`.
- packages/nana-pack/lib/bounded-read.mjs — declined: keep `readFileSync`, so the build, status, the pull and doctor classify the file through one read.

One private helper moves to a shared module, as the must-meet says: `loadSources`' read-and-classify step, `formatSourcesProblem` and its markers, into `packages/nana-knowledge/lib/sources-file.mjs`. Move nothing else.

The task:
1. Rows R-2860 to R-2863 under FEAT-003, right after R-2409, worded as in the must-meet, `implemented` once their tests pass, and the seal test. R-225 and R-217 gain the amendment clauses the must-meet gives, with no test change.
2. New `packages/nana-knowledge/lib/sources-file.mjs` with the six-tag header and the must-meet's purpose sentence. It holds `readSourcesFile(file)` (absent on ENOENT only, a parsed value, or a safe problem; it never writes and never throws), `formatSourcesProblem` and the two markers, `SOURCES_FROZEN_CLAUSE` with its provenance, and `frozenNotice(problem)`. It imports only `node:fs` and `../../nana-pack/lib/json-text.mjs`. `loadSources` calls `readSourcesFile(paths.sources)` and seeds only on absent; `bin/nana-knowledge.ts` imports `formatSourcesProblem` from the new module.
3. `hook.ts`: read the file after the skip check and before `ensureFreshIndex`; carry the notice through `finish` so every later return prints it as the first line; leave `renderBlock` and pull.log's keys and reasons unchanged.
4. `doctor.mjs`: export `knowledgeSourcesState(file)` beside `knowledgeIndexState`, returning `{ status, detail }`; add the `knowledge sources` row right after the `knowledge index` row; give `knowledgeIndexState` a third parameter `now` and the age wording R-2863 names.
5. The two `Reads: A-052` lines, the header edits and the README passages the must-meet names. Then run `npm run map` and `npm run req:tree`.
6. Tests: R-2860, R-2861 and the seal in `sources-file.test.mjs`; R-2862 and R-2863 in `doctor-knowledge.test.mjs`. Delete `NANA_ROLE` before the in-process pulls, and remove it from the hook command's environment, because pi-worker sets it. Run the hook command over a fresh index and pass the payload as `input`. Reuse F1 to F4 by name. In new string and template literals, write no backslash escape: build CRLF and byte marks from numeric codes, as the byte-mark list does. The seal's title holds double quotes, so write it in single quotes; the R-2862 and R-2863 titles hold an apostrophe, so write them in double quotes.

Try each must-meet row's red cases by hand, see the named check turn red, restore, and say so in your report; do not commit them.

Checks before your one commit: `node packages/nana-knowledge/tests/sources-file.test.mjs` alone; `node packages/nana-setup/tests/doctor-knowledge.test.mjs` alone; `node packages/nana-knowledge/tests/hook.test.mjs` and `node packages/nana-knowledge/tests/recover.test.mjs`, each alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`. Demo: in a scratch folder outside the worktree, build an index over one article with `NANA_KNOWLEDGE_HOME` set to `<scratch>/.pi/agent/nana-knowledge`, then write a sources.json with a missing comma. Pipe a hook payload into `node packages/nana-knowledge/bin/nana-knowledge.ts hook` with `NANA_ROLE` unset, and confirm the notice is stdout's first line. Run `node packages/nana-setup/bin/nana-setup.mjs doctor --home <scratch>` and confirm the ✗ `knowledge sources` row and the index row's age. Repair the file and confirm the next pull prints no notice. Then `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing.

Seat check: `node docs/reviews/knowledge-freeze-notice-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Done: the four rows, their tests and the seal exist and pass; a pull with a broken sources.json prints the notice first and a good or absent file prints none; doctor shows the sources row and the index age; the map, readme, trace and tree checks are green; the full suite is green; the seat check prints `0 missing`; `git status --short` is empty; and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the rows; each red case's hand check; the demo's notice line and both doctor rows; a notice pull's `ms` in pull.log beside the same pull with a good file; the full suite's summary line; map, readme, trace, tree and seat-check status; any departure from the must-meet or the precedent, with its reason.
