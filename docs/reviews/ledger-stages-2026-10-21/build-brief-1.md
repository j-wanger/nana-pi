Feature: FEAT-039 · See the product and its decisions in one report. Lane ledger-stages, rows R-2450 to R-2454 (block R-2450 to R-2459). Class: ordinary. Builder: pi-worker (larger lane).

Work in ~/nana-pi-wt/ledger-stages on feat/ledger-stages, based on f6d08f0f (lane cap-kinds's branch; this lane is chained on it). Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. Never edit `scripts/requirements-tree.mjs`, `scripts/requirements-lift.mjs` or `scripts/requirements-moved.mjs`: those belong to cap-kinds. Run single test files only (`node <file>`), never the full suite. No push.

Read `docs/reviews/ledger-stages-2026-10-21/must-meet.md` first: the rows verbatim, the threat model and the build rules. Read `docs/reviews/cap-kinds-2026-10-21/must-meet.md` for the field grammar. A capability heading from `parseLedger` carries `capabilityFields`: `{ Kind, Needs, Binds, Deliverables, Retired }`, each a list of `{ value, line }`. `Deliverables`, `Needs` and `Binds` are empty on a capability with no `Kind:` line. Split a list value on `/,\s*/`, as `scripts/requirements-tree.mjs` does.

Trace rule: put each `// req: R-245x` on the line directly above its `check("R-245x: …", …)` call. The title's opening quote sits on the same line as `check(`. Never split a title onto the next line.

Order: rows first, then the tests, then the code.

1. REQUIREMENTS.md, FEAT-039: add R-2450 to R-2454 at the end of its table, verbatim from the must-meet. Add no heading. Each row starts `untested` and becomes `implemented`, with backticked `file::title` evidence, once its check passes.

2. Tests, in `packages/nana-pack/tests/product-report.test.mjs`, with the must-meet titles exactly.
   - Build each fixture ledger as a small tree written to a fixture repo (REQUIREMENTS.md, a HANDOFF.md with no asks, one git commit), the way `fixture()` builds one; never edit the real ledger.
   - Render every new check through `renderHtmlAt` (or `renderPageAt`) on the page `generateReport` writes, never the imported `renderInto`.
   - Each check covers every case its must-meet row lists, the passing cases included. A check that would pass with its feature removed is a defect.
   - R-2450's second half renders `git show 5548d4c2:REQUIREMENTS.md` (use that fixed revision, never `main` or HEAD) with the real HANDOFF.md, and asserts the cards come in document order and each card's children are exactly h3, Purpose, Outcome, then (feature line, count bar) pairs.
   - R-2451's extra assertion: build the same fixture twice, with and without every capability field line, and compare each feature's `counts`, `shared`, `sharedBy` and `assessmentState` from `buildReport`. Stamp a store on the version without the lines (`makeAssessment`, `writeStore`), commit the version with the lines, and assert `validateStore` returns `[]`.
   - Pin the h3 text `${id} · ${label}` of every kinded card in your fixtures.

3. `scripts/product-report.mjs`.
   - In `buildReport` (the `capabilities` map near the end), add to each capability: `kind` (the value or null), `retired` (true when it has a `Retired:` line), `successors`, `needs`, and the computed `deliverables` and `binds`, with labels for every capability ID you show. A deliverable carries its row ID, status from `readRequirementRows`, `gap` (status is not `implemented`), home feature ID (through its subgroup when it has one) and consumer feature IDs (features whose `Also applies:` lists it, in document order). A bound capability carries its ID, label and the covering row IDs (empty means a gap): implemented rows homed under the constraint capability, listed on `Also applies:` by an `active` or `frozen (…)` feature under the bound capability.
   - Order `model.capabilities` as R-2450 and R-2454 say: live product, live kindless, live constraint, then retired, each in document order. Do the ordering in `buildReport`; `renderInto` keeps iterating the array.
   - In `renderInto`'s product view, after Outcome and before the first feature line, add for a kinded capability: a `Kind: <kind>` paragraph; for a product capability, a `Needs: …` paragraph when it has needs, then the deliverables as a list, one item per deliverable naming the row ID, its status, the word `gap` when it is one, a link to its home feature and links to its consumers (or `none`); for a constraint capability, the bound capabilities as a list, one item per bound capability naming it and its covering row IDs, or `gap` when there are none. For a retired capability, add a `Retired: replaced by …` paragraph naming the successors. Give list items a class (`deliverable`, `bound`) plus ` gap` on a gap, so tests and styles can find them. A capability with no field lines renders exactly as today.
   - In the detail view, add a `Capability: CAP-nn · <label>` paragraph after Purpose, with ` · <kind>` appended only when the capability has a kind.
   - Keep every rule in the must-meet's "Rules for the build". Update the module header if its outputs change.
   - `scripts/product-report/template.html`: add a style for the gap class only if it is needed to read the page; keep it small.

4. Text, written but not pinned: one sentence each in README.md's product report paragraph and in `packages/nana-pack/skills/requirements/SKILL.md`, describing the stage view. Keep every pinned sentence word for word. Write no machine path and no owner name.

5. Run `npm run map`, then `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`. Then run as single files: product-report, requirements-cap-kinds, requirements-tree, templates-render, skill-claims and readme-check, each `.test.mjs` in packages/nana-pack/tests/.

No inline tunables. Never add a typed leaf total.

Wrong code to try. Each must turn its check red; revert after.
- Ignore Kind and keep plain document order: R-2450.
- Put constraint capabilities before kindless ones: R-2450.
- Reference a module-scope constant (for example a gap-status set) from `renderInto`: the renderHtmlAt checks throw.
- Count a share of an untested constraint row as covered: R-2451. Count a share by a feature outside the bound capability: R-2451. Count a shared implemented row homed outside the constraint capability: R-2451. Count a proposed feature's share: R-2451.
- Fold constraint rows into a feature's rows: R-2451's invariance assertion.
- Treat only `untested` and `planned` as gaps (so `violated` is not): R-2452.
- List deliverables in ledger order instead of line order: R-2452.
- Link a subgroup-homed deliverable to the subgroup instead of its feature: R-2452.
- Put a kind badge in the capability h3: R-2450 or R-2452.
- Print the kind on a kindless capability's detail line (`undefined`): R-2453.
- Keep a retired capability in its kind group: R-2454.

Done:
- product-report passes, with every new check red on f6d08f0f.
- Every other file listed in step 5 passes as a single file.
- map:check, readme:check and trace are green, and R-2450 to R-2454 are implemented.
- The work is committed on feat/ledger-stages with explicit paths.

Report (≤ 10 lines): the tip sha; each check's result; red on f6d08f0f per row; each wrong-code result; the other test files; map, readme and trace status; anything left untested.
