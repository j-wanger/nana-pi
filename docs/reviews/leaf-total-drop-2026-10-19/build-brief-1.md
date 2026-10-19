# leaf-total-drop: build brief
Feature: FEAT-028 · Maintain requirement identity and trace links
Class: ordinary. Builder: a Claude Sonnet subagent in ~/nana-pi-wt/leaf-total-drop on feat/leaf-total-drop, based on current main. Follow packages/nana-pack/prompts/builder-preamble.md. Run single test files only. Do not edit HANDOFF.md or docs/sessions/. This lane removes the R-291 total, so do not set it to the trace total.

## Change
1. REQUIREMENTS.md: add R-1640 to R-1643 (text as in the must-meet) to FEAT-028's table, after R-1463, as `untested`, with evidence `—`.
2. packages/nana-pack/tests/requirements-tree.test.mjs:
   - Import `requirementRowId` next to `ID` from scripts/requirements-trace.mjs.
   - Replace the R-291 "leaf counts total N" IIFE with a test-local `treeAccounting(parsed, outline)` that returns a list of problems. Keep `isDescendant`; it is hoisted.
     - (a) Per heading: expand the outline IDs on the line at offset 4 (FEAT) or 2 (other). They must equal the heading's rows plus its descendants' rows, compared on length and on the sorted list. Otherwise report "<heading>: committed IDs differ from its rows".
     - (b) Per-ID tally with Maps, not Sets. `lines` counts each parsed.lines entry that `requirementRowId` recognises. `tree` counts every heading's `rows`, leaf or not. If `tree > 1`, report "<ID> is read N times by the tree". If `lines > tree`, report "<ID> has a requirement row line the tree does not read".
     - Above the function, add a comment naming R-1640 to R-1643. It says the expected rows come from the trace rail's row reader, so adding a row changes no number.
   - Real check: put `// req: R-291` on its own line. Directly under it, on one line: `check("R-291: every real heading's committed IDs survive expansion and the tree reads every row line once", accounting.length === 0, accounting.join("; "));`
   - Add four checks. Each has its `// req:` marker directly above a one-line `check("<title>", …` with the titles exactly as in the must-meet. Each check runs `treeAccounting(p, renderOutline(p))` on its own parse `p`.
   - `const fixture` is declared further down the file. Calling it from the old check's position throws at startup. Either write the fixture ledgers inline, as the R-287 tests do, or place the four checks after `fixture`.
     - R-1640: insert `| R-9999 | The added row shall be read. | untested | — |` after the real `row("R-291")` line. Assert all four: R-291's row was found, R-9999 was absent before, a parsed heading's rows hold it, and the problems are empty.
     - R-1641: CAP-01 > FEAT-001, whose table holds R-001, then a blank line, then R-002. The problems name R-002 and not R-001.
     - R-1642: CAP-01 holding FEAT-001 and FEAT-002, each table holding R-001. A problem names R-001.
     - R-1643: FEAT-001's own table holds R-001, then SUB-001's table holds R-002. FEAT-001's rows include R-001, and there are no problems.
   - Leave no row or leaf total in the file. The R-288 `=== 68` heading count stays.
3. When the four checks pass, flip R-1640 to R-1643 to `implemented`, with the four file::titles as evidence.
4. Run `node scripts/requirements-tree.mjs --write` to regenerate docs/requirements-tree.md.
Do not touch scripts/requirements-tree.mjs, templates/ or the requirements skill.

## Wrong code to try
Each change must turn the named check red. Revert each one after.
- W1: a typed total inside treeAccounting. R-1640 and R-1643 turn red.
- W2: tree counts only leaf headings' rows. R-1643 turns red.
- W3: expected rows from parsed.tables. R-1641 turns red.
- W4: drop the "read N times" problem, or tally with Sets. R-1642 turns red.
- W5: a bare total mismatch with no ID. R-1641 turns red.
- W6: count `lines` only where parsed.rowsInTables holds the line. R-1641 turns red.
- W7: treeAccounting returns []. R-1641 and R-1642 turn red.

## Done
- `node packages/nana-pack/tests/requirements-tree.test.mjs` prints "all passed".
- `node scripts/requirements-trace.mjs` shows "ears: 0 rows off form" and no problem lines.
- `node scripts/requirements-tree.mjs --check` exits 0. `npm run map:check` and `npm run readme:check` are green.
- `grep -nE "1,2[0-9]{2}|=== 1[0-9]{3}" packages/nana-pack/tests/requirements-tree.test.mjs` finds nothing.
- Added-row probe in a `mktemp -d` clone: add one row to any feature table, run `--write`, then run the tree test. It prints "all passed" with no test edit.

## Report (at most 10 lines)
1. DONE or BLOCKED, plus the commit SHAs.
2. Status of R-1640 to R-1643.
3. The tree test's last line.
4. The trace summary line.
5. map:check and readme:check results.
6. W1 to W7: the check each one turned red.
7. The added-row probe result.
8. Any deviation from this brief, with the reason.