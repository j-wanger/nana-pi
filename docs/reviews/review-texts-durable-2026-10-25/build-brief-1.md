Feature: FEAT-017 · Inspect durable state and follow restoration steps. Lane review-texts-durable. Class: ordinary. Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/review-texts-durable. The spec is `docs/reviews/review-texts-durable-2026-10-25/must-meet.md`; read it whole. `plan-draft.md` and `plan-attack.md` beside it are its inputs; where they differ, the must-meet holds. In particular the must-meet narrows R-2870 to its tuple and moves the path and count cases to R-2871. Do not edit HANDOFF.md, `docs/sessions/`, `docs/known-bugs/` (the seat edits FEAT-017's line), `scripts/product-report.mjs`, `docs/product-report/`, or any file in a review folder. Also do not edit `packages/nana-pack/bin/review-round.mjs`, `packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-setup/lib/uninstall.mjs`, `packages/nana-setup/lib/doctor.mjs`, `packages/nana-setup/bin/install-check.mjs`, anything under `apps/desk/` or `templates/`, FEAT-017's `Artifact:` and `Reads:` lines, or any existing check other than R-955's second one.

Precedent:
- packages/nana-setup/lib/state-manifest.mjs — lines 45 to 48: three explicit `durable(..., undefined, modules.pack)` ledger rows from `ledger = ledgerPaths(layout.base)`; `durable()` at line 35 takes the restore text fifth and the source sixth.
- packages/nana-setup/tests/state-manifest.test.mjs — the `tuple` helper (line 28) and the R-954 tuple pins (lines 30 and 34) for R-2870; the declared-container derivation (lines 36 to 39) for R-2871, which replaces lines 40 to 42; the `ledgerPaths` import path (line 17).
- packages/nana-setup/lib/paths.mjs — `resolveLayout` options `home`, `piHome`, `claudeHome` (lines 47 to 60) for R-2871's custom-roots case.
- packages/nana-setup/tests/restore.test.mjs — ledger fixtures before the listing (lines 78 to 82), listing and archive (114 to 119), forward-slash names (137), extraction (152), byte-equal loop (172 to 178).
- packages/nana-pack/bin/review-round.mjs — `reviewTextPath` and `reviewTextEvidence` (lines 407 to 427) and `REVIEW_TEXT_HASH` (line 83), imported, never copied; `reviewTextRef` stays private.
- packages/nana-pack/bin/nana-land.mjs — line 130, the same evidence call R-2872 makes on the restored home.
- packages/nana-pack/tests/land.test.mjs — line 20, the named-import style for the review-round API.
- packages/nana-setup/README.md — line 106, the state table's ledger cell.

No private helper moves.

The task:
1. Rows R-2870 to R-2872 under FEAT-017, worded as in the must-meet, `implemented` once their tests pass. R-955's new wording, with its evidence cut to its first test.
2. The `review ledger texts` row in packages/nana-setup/lib/state-manifest.mjs, after the three durable ledger rows, as one explicit `durable(...)` call naming `ledger.texts`, with `undefined, modules.pack` as its last two arguments. Do not loop over `ledgerPaths` and do not default a class.
3. R-2870's and R-2871's checks in state-manifest.test.mjs; remove R-955's second check. R-2870 finds the row by path, compares its class with `STATE_CLASSES.DURABLE`, and reads the expected source and restore text from the tally row. R-2871 reads its expected paths from `Object.entries(ledgerPaths(home))` minus a declared container list holding only `dir`, for the sample layout and for a custom-roots layout.
4. R-2872's check in restore.test.mjs. Write the fixture after the fixture loop (lines 83 to 87) and before the listing (line 114). Do not add the texts store to the ledger list at line 78. Compare the listed name after `.split(path.sep).join("/")`, as line 137 does. Build the fixture text from one plain double-quoted string with no backslash, no `secret:` marker and no home path. Do not change any existing string in either test file; the seat diff-checks the build for removed escapes. Name the kept-text API in the file's `@inputs`.
5. The README cell at packages/nana-setup/README.md line 106 becomes "Review-ledger tally, audit and rotated files, and kept review texts".
6. Regenerate `docs/requirements-tree.md` (`npm run req:tree`; FEAT-017 goes from six rows to nine) and `docs/code-map.md` (`npm run map`; restore.test.mjs now imports review-round). Three sibling lanes build beside this one; do not hand-merge either file.

Try each must-meet row's red cases by hand, see the named check turn red, restore, and say so in your report; do not commit them. R-2871's iterating-manifest case is the seat's pair, not yours.

Do not run `nana-setup state` or `state --paths` on your real home; the seat makes that count.

Checks before your one commit: state-manifest.test.mjs, restore.test.mjs and uninstall.test.mjs (all in packages/nana-setup/tests/), each alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; the local install check `node packages/nana-setup/bin/install-check.mjs`; the demo `node packages/nana-setup/bin/nana-setup.mjs state --home <a new empty folder under the OS temp folder>` with PI_CODING_AGENT_DIR and CLAUDE_CONFIG_DIR unset, which must print exactly one line starting with the store name `review ledger texts` followed by `durable` and `nana-pack` (report only that count, never the listing); `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing.

Seat check: `node docs/reviews/review-texts-durable-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Done: the three rows and their tests exist and pass; R-955 is narrowed with one evidence test; the manifest holds one explicit durable texts row; the README cell names the kept review texts; the tree and map are regenerated; the map, readme, trace and tree checks are green; the install check and the full suite are green; the seat check prints `0 missing`; `git status --short` is empty; and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the rows; each red case's hand check; the demo's count; the install check's verdict line; the full suite's summary line; map, readme, trace, tree and seat-check status; any departure from the must-meet, with its reason.
