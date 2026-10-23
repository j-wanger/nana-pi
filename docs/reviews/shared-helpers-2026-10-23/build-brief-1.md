Feature: FEAT-033 · Adopt explicit engineering standards. Lane shared-helpers. Class: gate. Builder: pi-worker (larger lane). Build session 1: the whole lane.

Work in the lane worktree on feat/shared-helpers. The spec is `docs/reviews/shared-helpers-2026-10-23/must-meet.md`: read it whole before designing. It holds over `plan-draft.md` where they differ; read the draft for the measured copies (tables A, B and C), the design parts 1 to 8, the tunables and the consumer list. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

What the lane does, in one sentence: one shared process-tree kill (a waiting and a no-wait form) replaces six kill copies, one shared rename retry replaces two rename copies, a scan fails the suite on a new kill copy outside the declared exceptions, and the builder preamble and the shipped rulings tell the next builder to import a helper rather than copy it.

Precedent:
- packages/nana-setup/lib/bounded-spawn-child.mjs — `killTree`'s `ended` result and direct fallback; the waiting form's shape.
- packages/nana-pack/extensions/nana-post-edit.ts — async taskkill with `error` and non-zero `close` fallback; the no-wait form's shape; how an extension imports `../lib/*.mjs`.
- packages/nana-pack/lib/win-command.mjs — a shared nana-pack lib module imported by an extension, bins and nana-setup.
- scripts/runtime-measure.mjs — injected `run` and `kill` seams for a kill helper; stays unchanged.
- packages/nana-setup/lib/project.mjs — `renameWithRetry` with its `rename`, `delay` and `recheck` seams; moves verbatim apart from D1.
- packages/nana-pack/bin/review-round.mjs — `renameReviewText` (the EACCES code) and `complete()`'s options object, where `rename` joins `text`.
- packages/nana-pack/lib/mutation-runner-config.mjs — `TASKKILL_ARGS` with its contract provenance; becomes a re-export.
- packages/nana-pack/tests/win-command.test.mjs — injected-platform unit cases that run on every leg.
- packages/nana-pack/tests/post-edit-hardening.test.mjs — real tree kills, the Windows taskkill case and the taskkill-off-PATH case.
- packages/nana-setup/tests/project-working-region.test.mjs — an injected rename that throws EPERM once, and the delay seam (R-986).
- packages/nana-pack/tests/identity-scan.test.mjs — the scan over `git ls-files` with a sealed allowlist and a frozen-desk entry.
- packages/nana-pack/tests/code-map.test.mjs — the mapped roots and ignore list the scan reuses (from `code-map.config.json`).
- packages/nana-pack/tests/review-ledger.test.mjs — the R-2568 harness (`mod.complete(..., { home, text })`) for R-2660; the R-2568 block is at lines 455 to 496.
- packages/nana-pack/prompts/builder-preamble.md — the R-2582 rule line the new bullet follows.
- packages/nana-pack/tests/worker-lane.test.mjs — `RULE_LINE` and `preambleOnce` (R-2582).
- packages/nana-pack/rules/nana-rulings.md — the dated-bullet shape.
- packages/nana-pack/tests/rulings.test.mjs — the dated-bullet shape checks.
- packages/nana-pack/README.md — the Behavior notes entry for `lib/display.mjs`, at lines 689 to 713.
- packages/nana-pack/tests/review-standard.test.mjs — R-644's per-consumer source check and its lib list, a fixture copy site.

Steps, in order:
1. Rows first: add R-2656 to R-2663 to `REQUIREMENTS.md` as the must-meet places them (R-2656 to R-2659, R-2661 and R-2663 in FEAT-033; R-2660 in FEAT-007; R-2662 in FEAT-006; FEAT-033's Also applies gains R-2660 and R-2662), `untested` until each check passes, then `implemented` with backticked `file::title` evidence.
2. Tests, each with its `// req:` marker directly above and the exact title the must-meet gives, plus the two seal tests. R-2568's check drops its `REVIEW_TEXT_RENAME_*` comparison, the one listed edit to an existing test. Add the new modules to the five fixture copy sites the must-meet's S1 names; never delete a fixture check.
3. Code: `packages/nana-pack/lib/process-tree.mjs` and `packages/nana-pack/lib/rename-retry.mjs`; the six kill consumers and two rename consumers as one-line adapters that keep their names and call sites; `TASKKILL_ARGS` moved with a re-export; the scan as an exported function beside its `TREE_KILL_EXCEPTIONS`. Keep, by name, the four pieces the must-meet's S2 lists: bounded-spawn-child's `passSignal` win32 early return, pi-watchdog's off-Windows `child.kill(signal)` after the group signal, and the `child.kill` fallback closures of bounded-spawn-child's `killTree` and post-edit. `scripts/test.mjs` imports the helper as `from "../packages/nana-pack/lib/process-tree.mjs"`, double-quoted.
4. Docs: the pack README's Behavior notes entry; module headers as the draft's Tunables section lists them; the preamble bullet and the dated ruling. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` (`npm run map`, `npm run req:tree`).
5. Checks before your one commit: the test files the draft's seat step 4 lists, plus suite-records, runtime-map and review-standard; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`. You cannot run Windows here; reason about each win32 branch from the code and say what you could not run.

Seat check: `node docs/reviews/shared-helpers-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: every must-meet test passes, the scan finds no kill copy outside the exceptions, the seat check prints `0 missing`, the full suite is green, and the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; each must-meet title's result; each consumer moved, and each piece kept by name; each departure from the Precedent files or the must-meet, with its reason; the full suite's summary line; map, readme, trace, tree and seat-check status; what you could not run.
