# report-not-passed: build brief 1

Feature: FEAT-039 · See the product and its decisions in one report. Class: ordinary.
Builder: a Claude Sonnet subagent in its own lane worktree on feat/report-not-passed, based on main.
Plan of record: must-meet.md in this folder. Use row IDs R-1650 to R-1655 only.

## What to change
1. REQUIREMENTS.md: add R-1650 to R-1655, with text from must-meet.md and status planned. Put them directly after R-1515 in FEAT-039. Do not put them after R-1042, because audit-open-questions appends there.
2. Tests: add one new `{ ... }` block in packages/nana-pack/tests/product-report.test.mjs, directly after the R-1515 block. Do not add it at the end of the file or after `cardFor`. Keep every helper inside the block.
   - Build one fixture with `fixture()` and `writeRuntimeFile()`. `setRowEvidence` keeps a row's status, so add a block-local helper that sets both status and evidence.
   - Use fixture-only file names that no real row cites (for example `packages/nana-pack/tests/np-*.test.mjs`).
   - Fixture rows, each with an explicit status:
     - implemented: SKIP; SKIP+SKIP; PASS alone; PASS+SKIP; PASS+unmeasured; FAIL alone; PASS+FAIL; FAIL+unmeasured; unmeasured alone; SKIP+unmeasured;
     - implemented: one SKIP file and one PASS file, each changed after its hash is recorded;
     - untested: SKIP (the control).
   - Build a second fixture with no runtime data.
   - Render `#issues` with `renderHtmlAt`. Find the root child `h3` matching `/^Implemented rows that did not pass in this clone's last measured run: (\d+)$/`. The listed cards are the `article` nodes after it.
   - The R-1655 check asserts the heading number equals the card count and the exact expected listed set. It also asserts that number differs from this fixture's `model.violated.length`.
   - Each exclusion check (R-1652, R-1653) also asserts that the heading exists and that a SKIP-only control row is listed.
   - Put each `// req: R-165x` directly above its `check("R-165x: …",` line, with the call and title on one line. Titles must match must-meet.md exactly.
3. scripts/product-report.mjs:
   - Add a pure module-scope function over the run states of a row's unique cited files. It returns true on any FAIL, or when every file has a run and none is PASS. It returns false with no files. It ignores `changed`.
   - Define the PASS and FAIL label constants once at module scope, with `// contract (R-1650, R-1651)`.
   - Add `model.notPassed`, in ledger order, in the same shape as `violated`.
   - In `renderInto`'s Issues branch, after the violated cards, add: the `h3` with the count (shown even at 0), the note line, then `row(root, item)` per listed row.
   - Declare the heading and note strings inside `renderInto`, with `// contract (R-1655)`.
4. README.md: add one new paragraph between the Product report paragraph and `## Tests`. It says what the list holds and that a changed-since label still counts, with its mark. Leave the existing paragraph alone, because audit-open-questions rewrites it.
5. Once green:
   - Flip R-1650 to R-1655 to implemented, with their test citations.
   - Run `node scripts/requirements-trace.mjs`. Set R-291's leaf total in packages/nana-pack/tests/requirements-tree.test.mjs to the total it prints, in the title and both numbers (1,291 on main 6b3e432).
   - Run `npm run req:tree` and commit docs/requirements-tree.md.
6. Leave the R-1017 checks alone. If they go red, the design is wrong; report it.

## Wrong code to try (each must fail the named check)
- Drop the FAIL short-circuit → R-1651.
- Use `some` instead of `every` for non-PASS → R-1652.
- Treat a missing run as non-PASS → R-1653.
- Skip files marked changed → R-1654.
- Treat a changed label as non-PASS → R-1654.
- Drop the implemented filter → R-1650.
- Take the count from `model.violated` → R-1655.
- Move the heading string to module scope → the file exits 1 with a ReferenceError.

## Run
Run single files only: `node packages/nana-pack/tests/product-report.test.mjs` and `node packages/nana-pack/tests/requirements-tree.test.mjs`. The seat runs the full suite. Never edit HANDOFF.md or docs/sessions/.

## Done
- Both test files exit 0.
- `node scripts/requirements-trace.mjs` reports 0 missing, and its total equals R-291's.
- `npm run map:check` and `npm run readme:check` exit 0, and `npm run req:tree` leaves no diff.
- Seat check: `node scripts/product-report.mjs --out <temp>/r.html` lists the rows the runtime data implies, with an equal heading count. On the 2026-10-17 data those are R-1058, R-1063, R-1064, R-1330 and R-1340.

## Report shape (10 lines or fewer)
Commit SHA; each new check PASS; each wrong-code item and the check it failed; any existing check edited and why; trace total and R-291 value; map, readme and tree check exits; one line on anything that differs from the plan.