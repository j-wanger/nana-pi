# Lane report-test-details: build brief 1 (2026-10-19 · feat/report-test-details · ~/nana-pi-wt/report-test-details)

**Builder:** a Claude Sonnet subagent in the lane worktree. **Class:** ordinary. **Feature:** FEAT-039 · See the product and its decisions in one report.

Read `must-meet.md` here first. Run single test files only (`npm test -- <file substring>`). Never run the full suite, `npm run test:locked` or `npm run map:measure` (it runs the full suite and rewrites the clone's shared runtime data). Do not push. Do not edit HANDOFF.md or docs/sessions/. Take no ID outside R-1510 to R-1515.

## What to change
1. **REQUIREMENTS.md, FEAT-039 table.** Add R-1510 to R-1515 as `planned` with must-meet's exact text. Replace R-1012's text with the amended text. Run `npm run req:tree`. Raise the leaf total in `packages/nana-pack/tests/requirements-tree.test.mjs` from 1,234 by 6, in all three spots.
2. **Tests, in `packages/nana-pack/tests/product-report.test.mjs`.**
   - Add one helper: from the HTML `generateReport` wrote, take the renderer source (`const renderInto = (…);`, match `\r?\n`) and the `report-data` JSON; evaluate the source in `vm.runInNewContext`; render a hash into a stub DOM. Every new check renders through it.
   - Add the six checks with must-meet's exact titles, `// req: R-151x` directly above each `check(`.
   - Fixtures: the file's own `fixture()`, then edit the ledger copy's evidence cells (TypeScript, Python, `<repo>:` and prose citations) and commit. Origins via `git remote add` / `set-url`. Runtime data: schema-1 JSON at `<fixture>/.git/nana/runtime-map.json`, hashing bytes you wrote. For R-1512, commit the cited files plus a `.gitattributes` of `* -text` (Windows CI checks out with autocrlf; this check passes there today, 57 of 57), then `git worktree add` and build from the worktree.
   - Widen the R-1012 check's fixture with an origin and runtime data.
3. **Code, in `scripts/product-report.mjs`**, as must-meet's Design says. Update the header's `@inputs`. Import `dataPath`, `loadRuntime`, `hashFile` from `packages/nana-pack/lib/runtime-map.mjs` and `NOT_COUNTED` from `packages/nana-pack/lib/runtime-map-config.mjs`, by name. The GitHub prefix is one named constant with provenance R-1511. Add small `.row-tests` CSS in `scripts/product-report/template.html`.
4. **Flip the rows** to `implemented`, citing their tests. Run `npm run req:tree` and `npm run map`; commit `docs/requirements-tree.md` and `docs/code-map.md`.
5. **README.md, "Product report".** One or two sentences: rows list their cited tests with GitHub links and each test file's label from the clone's last `npm run map:measure`, marked when changed, or "no recorded run".

## Traps
- `renderInto` ships as source. Inside it, read only its arguments and globals: no imported or module constant (`NOT_COUNTED`, the prefix). Put text and hrefs in the model.
- The renderer must still render a model without `files` or `runtime`: the R-1019 text-node check renders one.
- R-1041's check counts exactly three `ul` in the detail view: render tests as `ol`. R-1016's check counts one `article` per row. R-1017's check needs `violated` rows to carry `tests` (no "undefined").
- `dataPath` calls its git hook with `{cwd}` only; the report's runner passes options through, so wrap it to add `encoding: "utf8"`. A missing origin is not an error. The all-git-fails check must still refuse.
- R-1019: text nodes only; build the href only from the matched owner and repo, the 40-hex commit and encoded segments.

## Wrong code to try (confirm red, then revert)
- Whole evidence string as one item (R-1510). Tests only in the detail view, not #requirements (R-1510).
- `path.join` for the href, keep `.git`, link a `..` path, or drop `target` (R-1511).
- Reference `NOT_COUNTED` inside `renderInto` (every new check).
- Unwrapped runner, `dataPath(process.cwd())`, or `path.join(root, ".git/nana/runtime-map.json")` (R-1512).
- Drop "file" from the label wording (R-1512).
- Hash only the test file, treat a missing file as unchanged, or mark every label changed (R-1513).
- Default an absent entry to PASS (R-1514). Omit the none line, or print it on every row (R-1515).

## Done
- Green: `product-report.test`, `requirements-trace.test`, `requirements-tree.test`, `code-map.test`, `readme-check.test`. Every mutation above went red.
- `npm run report` writes the real page. Rendered through the same helper, R-1058's card shows its file as SKIP, and one FEAT-039 test links to `https://github.com/j-wanger/nana-pi/blob/<HEAD>/packages/nana-pack/tests/product-report.test.mjs`.

## Report (10 lines or fewer)
1. DONE or BLOCKED, with the tip SHA. 2. Rows flipped and the new leaf total. 3. Per test: green, plus the mutation that turned it red. 4. Single-file runs and exit codes. 5. What the real page showed for R-1058 and one FEAT-039 link. 6. Files changed. 7. Residuals and any deviation from must-meet.