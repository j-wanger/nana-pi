# lifecycle-compaction-reason — build brief 1

Feature: FEAT-023 · Inspect changes and receive useful notices
Class: install, hook or gate (pi extension). Threat model: honest pi variation is in scope: a missing reason, a new reason value, pi's full event shape. Forged events and reasons that are not text are out.
Read must-meet.md beside this brief first. Follow packages/nana-pack/prompts/builder-preamble.md. Work in ~/nana-pi-wt/lifecycle-compaction-reason on feat/lifecycle-compaction-reason. Never edit HANDOFF.md or docs/sessions/.

Change
1. packages/nana-pack/extensions/nana-lifecycle.ts: in the session_before_compact, session_compact and session_compact_failed handlers, rename `_event` to `event`. Call `log(ctx, "<event name>", { reason: (event as any).reason })`, exactly as session_start and session_shutdown do. Use no default, no allow-list, no String() and no spread of `event`. Keep `return undefined` in session_before_compact. Touch nothing else.
2. packages/nana-pack/tests/lifecycle-journal.test.mjs:
   - Fix the CASES comment: pi 1.0.2 types give all five events a reason.
   - Rewrite @purpose as one sentence that also covers the compaction reasons and the compaction line's fields.
   - After the R-2140 check and before the cleanup, add R-2141's check.
   - Then add one helper `fireBatch(subfolder, eventFor)`. It makes a fresh subfolder of TD and fires the three compaction handlers with that folder as ctx.cwd. Wrap each call in try/catch and record throws. Return the throws and the journal lines whose cwd is that folder.
   - Then add the R-2380, R-2381 and R-2382 checks, each on its own subfolder.
3. REQUIREMENTS.md, FEAT-023: R-2141 keeps its text and turns `implemented`, with evidence citing its test. Add R-2380, R-2381 and R-2382 directly after it, with must-meet's text, `implemented`, each citing its test. Then run `npm run req:tree` and `npm run map`.

Tests (LJ)
- The trace scanner needs each `// req:` marker on the line directly above a `check("title", …` call, with `check(` and the title's opening quote on the SAME line. Do not split them.
- R-2141 `check("journal: the three compaction lines carry pi's reason", …`: from the main fixture, before_compact is "threshold", compact is "manual" and compact_failed is "overflow".
- R-2380 `check("journal: a compaction event with no reason leaves one line with no reason field", …`: fire events `{ type }` only. Pass when nothing threw and that cwd has exactly one line per event, none with an own `reason` key.
- R-2381 `check("journal: a compaction reason outside manual, threshold and overflow is journaled unchanged", …`: send reason `future-<type>` per event. Pass when nothing threw and each event has one line whose reason equals what was sent.
- R-2382 `check("journal: a compaction line keeps only ts, event, cwd, pid and reason from pi's full event", …`: fire pi 1.0.2's shapes from types.d.ts.
  - before_compact: preparation, branchEntries, customInstructions, reason, willRetry, signal (`new AbortController().signal`).
  - compact: compactionEntry with a summary, fromExtension, reason, willRetry.
  - compact_failed: reason, errorMessage, aborted, willRetry, fromExtension.
  - Put one marker string in every text field. Keep the allowed line fields in one named test constant.
  - Pass when nothing threw, each event has one line, and every key of each line is one of ts, event, cwd, pid and reason.
- No skips. Every check runs on all three platforms.

Run single test files only, never the full suite (other lanes hold the machine's suite lock). Run `node --experimental-strip-types packages/nana-pack/tests/<file>` for lifecycle-journal, lifecycle-reload, config-handlers-malformed, adoption-producer and product-report. Then run `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --check`, `npm run map:check` and `npm run readme:check`.

Wrong code to try on your fix. Each must turn the named checks red; revert each one.
- compact_failed left unfixed → R-2141, R-2381
- `reason ?? "unknown"` → R-2380; `String(reason)` → R-2380; `reason.trim()` → R-2380
- an allow-list of manual/threshold/overflow → R-2381
- hard-coded "manual" → R-2141, R-2380, R-2381
- `log(ctx, name, event)` (the whole event) → R-2382; reason plus willRetry → R-2382

Done
- The four new checks pass, R-162 and R-2140 still pass, and the five test files exit 0.
- Trace exits 0 with R-2141, R-2380, R-2381 and R-2382 implemented. The tree, map and readme checks are green.
- Only these files changed: the extension, the test, REQUIREMENTS.md, docs/requirements-tree.md and docs/code-map.md.

Report (≤ 10 lines): the commit; files changed; each new check's PASS line; each wrong code and the checks it turned red; trace, tree, map and readme results; anything you could not do.

## Seat amendments (re-check on main 9552afb1)

- Base the lane on main 9552afb1. No landed lane changed the extension, its test, lib/config.ts or the FEAT-023 rows, so every reference in this brief holds there.
- Make each helper subfolder with `fs.mkdirSync(path.join(TD, "<fixed name>"))`. Never call `mkdtempSync` in the test file. The runner's temp source check (R-917, in test-runner.test.mjs) fails any test file that calls it, and none of the five files you run would show that.
- Leave the line `import { tmpDir } from "./tmp-dir.mjs";` exactly as it is. If you need another helper from that module, import it on its own line. The same source check matches that exact text.
- After your change on 9552afb1, the trace should read 1670 total, 1434 implemented and 5 violated, with `ears: 0 rows off form`. Any other count means a row edit went wrong or main moved.
- Before your final commit, merge any newer main and run `npm run req:tree` and `npm run map` again, then their checks. This lane shares only REQUIREMENTS.md, docs/requirements-tree.md and docs/code-map.md with other lanes.
- Use only R-2380, R-2381 and R-2382 as new IDs. The other slate lanes hold R-2340 to R-2432.

## Seat (2026-10-20 ~16:45 EDT, after the re-check)

- Builder: pi-worker --lane lifecycle-compaction-reason --lane-size small (the roster's builder, pi gpt-6-luna). The owner kept pi sol for larger lanes after power mode; ignore any line above that calls the builder an open question or names a Claude builder.
- Reviews: Claude Opus 5.5 is the final reviewer and pi gpt-6-astra the land reviewer; the seat lands when every reviewer says LAND (the owner's standing rule since 2026-10-20).
- Run single test files only, never the full suite: eight other builders share this machine, and the seat runs the locked suite at land.
- Branch: from main 9552afb1. Land order across the slate (each later lane merges main before its final review): knowledge-sources-unparseable, lifecycle-compaction-reason, gate-stop-names-config, review-launch-win-paths, shared-memory-index-cap, project-odd-seeds, verifier-pipe-commit-match, win-hook-variant-loop, claude-config-dir.
- No push; no HANDOFF.md, docs/sessions/ or docs/reviews/ edits; commit with explicit paths.
