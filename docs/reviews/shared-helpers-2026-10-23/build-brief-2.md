Feature: FEAT-033 · Adopt explicit engineering standards. Lane shared-helpers. Class: gate. Builder: pi-worker (small lane). Build session 2: the scan leaves the runtime kill module.

Work in the lane worktree on feat/shared-helpers (main, with win-flake-hardening, is merged in at bb5c1d09). The spec is still `docs/reviews/shared-helpers-2026-10-23/must-meet.md`. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

Finding F1 (seat read, departure from the must-meet): build 1 put `scanTreeKillCopies` and `TREE_KILL_EXCEPTIONS` in `packages/nana-pack/lib/process-tree.mjs`, the runtime kill module that post-edit loads in every pi session and every launcher loads. The must-meet's N9 says `TREE_KILL_EXCEPTIONS` "lives beside the scan, as identity-scan keeps its allowlist, not in the runtime kill module", and its Tunables section repeats it. The module's `@purpose` now names two purposes, and its `@effects` says "process" though the scan reads files and runs git. The build report listed no departure.

Move the scan and its exception list into one new module of their own (for example `packages/nana-pack/lib/tree-kill-scan.mjs`), with its own six-tag header (`@effects` naming the disk reads and the git process). `process-tree.mjs` keeps only the kill policy and its constants (`TASKKILL_COMMAND`, `TASKKILL_ARGS`, `DEFAULT_KILL_SIGNAL`), and its header says only that. The new module must not trip its own scan, and stays out of the exception list unless a line in it truly spells a kill; say which in the report.

Precedent:
- scripts/identity-scan.mjs — a repository scan whose sealed allowlist lives beside it.
- packages/nana-pack/lib/process-tree.mjs — the scan and exception list as build 1 wrote them.
- packages/nana-pack/tests/process-tree.test.mjs — R-2661's planted-tree and repository cases and the seal that pins the exceptions.

1. Move the code as above. Keep every title and `// req:` marker; the tests import each name from its new home. R-2661's evidence keeps its title; update its row only if the file it names changes.
2. Update the README entry this lane added and the code map (`npm run map`) for the new module.
3. Checks before your one commit: process-tree, rename-retry, review-ledger, worker-lane, rulings, post-edit-hardening, test-runner, test-runner-parallel, mutation-runner, watchdog-exit and code-map test files; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`.

Seat check: `node docs/reviews/shared-helpers-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: the scan and its exceptions live in their own module; `process-tree.mjs` holds only the kill policy with an accurate header; the repository scan still finds no copy; the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; what moved where; whether the new module needed an exception, and why; each departure with its reason; the full suite's summary line; map, readme, trace, tree and seat-check status.
