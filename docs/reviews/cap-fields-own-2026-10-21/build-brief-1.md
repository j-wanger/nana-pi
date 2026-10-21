Feature: FEAT-028 · Maintain requirement identity and trace links. Lane cap-fields-own, row R-2460 (block R-2460 to R-2469). Class: ordinary. Builder: pi-worker (small lane).

Work in ~/nana-pi-wt/cap-fields-own on feat/cap-fields-own, based on main c51bfcd8. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. Change no file under `scripts/`. Run single test files only (`node <file>`), never the full suite. No push.

Read `docs/reviews/cap-fields-own-2026-10-21/must-meet.md` first: the field lines for each capability, the row verbatim and the threat model. The field grammar is in `docs/reviews/cap-kinds-2026-10-21/must-meet.md`.

Trace rule: put `// req: R-2460` on the line directly above its `check("R-2460: …", …)` call. The title's opening quote sits on the same line as `check(`. Never split a title onto the next line.

Order: the row first, then the test, then the ledger lines.

1. REQUIREMENTS.md, FEAT-028: add R-2460 after R-2447, verbatim from the must-meet, `untested` until its check passes, then `implemented` with backticked `file::title` evidence.

2. `packages/nana-pack/tests/requirements-cap-kinds.test.mjs`: add the R-2460 check with the must-meet title exactly. It reads this repository's REQUIREMENTS.md (from the repo root the file already resolves), parses it with `parseLedger`, and asserts that every capability with no `Retired:` line has exactly one `Kind:` line, and every such `Kind: product` capability has a `Deliverables:` line. On failure, name each capability that falls short. Update the file's `@outputs` header and its closing "all … checks passed" count from 7 to 8.

3. REQUIREMENTS.md: in each of CAP-01 to CAP-08, insert that capability's lines from the must-meet table directly after its `Outcome:` line, one field per line, exactly as written (for example `Kind: product`, then `Deliverables: R-001, R-108, R-873, R-201, R-217, R-749`). Change nothing else in the ledger: no row, no heading, no `Also applies:` line, no purpose or outcome.

4. Run `node scripts/requirements-tree.mjs --write` (or the npm script that regenerates `docs/requirements-tree.md`), then `npm run req:tree`, `npm run map`, `npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs`. Then run as single files: requirements-cap-kinds, requirements-tree, requirements-lift, requirements-regroup, requirements-moved, product-report, templates-render and skill-claims, each `.test.mjs` in packages/nana-pack/tests/. If any of them fails because it reads this repository's ledger and now meets the new lines, stop and report which check and why; do not change that check.

Wrong code to try. Each must turn R-2460 red; revert after.
- Delete CAP-05's `Kind:` line.
- Delete CAP-08's `Deliverables:` line.
- Make the check accept a capability whose kind is missing when it carries a `Deliverables:` line.

Done:
- requirements-cap-kinds passes 8/8, with R-2460 red on c51bfcd8 and the three wrong-code results red.
- `npm run req:tree` reports 0 problems, the outline lists the new field lines after each capability's Parent line, and every file in step 4 passes.
- map:check, readme:check and trace are green, and R-2460 is implemented.
- The work is committed on feat/cap-fields-own with explicit paths.

Report (≤ 8 lines): the tip sha; the check's result; red on c51bfcd8; each wrong-code result; the other test files; map, readme and trace status.
