# leaf-total-drop: must-meet

Feature: FEAT-028 · Maintain requirement identity and trace links
Class: ordinary. The lane changes one test file, adds ledger rows and regenerates the outline. It touches no install, hook, gate, land or review tool.
Threat model: honest variation in our tools' output, platforms and ledger shapes is in scope. Deliberate forgery is out.

## Feature (falsifiable)
Adding a requirement row under a feature needs no edit to the tree test. The tree test still fails, naming the ID, when the tree does not read a row line or reads one more than once.

## What is wrong today
- The R-291 real-ledger check in `packages/nana-pack/tests/requirements-tree.test.mjs` compares the leaf headings' row total with a typed literal. The literal appears three times: in the title, in `leafTotal === N` and in the failure message.
- 46 commits have changed it (git log -G on the literal). It moved from 1,278 to 1,285 while this plan was under attack, when gate-rm-workdir landed.
- In one case, two parallel lanes each raised it to the same number, and every CI leg went red with no real defect (docs/reviews/report-test-details-2026-10-19/seat-verify-4c975f7.md).
- The check sums leaf headings only, so a row in a feature's own table, above that feature's subgroups, is never counted. Lane briefs say to set the literal to the trace total, which fails in that case.

## Design
- Inside the test file, replace the inline IIFE with a test-local `treeAccounting(parsed, outline)` that returns a list of problems:
  1. For each heading, the outline IDs must equal the heading's rows plus its descendants' rows. This is today's logic.
  2. For each row ID, compare two counts:
     - `lines`: ledger lines that `requirementRowId` recognises. It is imported from scripts/requirements-trace.mjs and is the trace rail's own row reader. No second parser is added.
     - `tree`: occurrences across ALL headings' `rows`.
     - If `tree > 1`, report "<ID> is read N times by the tree".
     - If `lines > tree`, report "<ID> has a requirement row line the tree does not read".
- The real check keeps `// req: R-291` and gets a new title. It requires `treeAccounting(actual.parsed, map)` to return nothing and prints the problems on failure.
- The file carries no row total.
- Nothing changes in scripts/requirements-tree.mjs, its CLI, the product report, the templates or the requirements skill. Neither template ships a tree test.
- No skill sentence is added. R-287 already allows rows in a feature's own table.

## Must-meet
| Row | Requirement | Test (file::title) | Red today |
|---|---|---|---|
| R-1640 | WHEN a requirement row is added to a feature table in REQUIREMENTS.md, the tree test's row accounting shall pass with no edit to the tree test. | packages/nana-pack/tests/requirements-tree.test.mjs::R-1640: a row added to a real feature table passes the tree accounting with no test edit | Probe P1, run in a temp clone: one row was added to FEAT-028 and the outline regenerated. Today's test FAILED only on the leaf literal. A typed total (W1) turns this check red. |
| R-1641 | IF a line of REQUIREMENTS.md reads as a requirement row but the tree parser places it under no heading, THEN the tree test's row accounting shall fail naming that row's ID. | packages/nana-pack/tests/requirements-tree.test.mjs::R-1641: a requirement row line the tree parser drops fails the accounting naming its ID | Not red on the real ledger, because R-287 already names a dropped row through the parser's own problem list (probe P4). The literal names no ID. The check is new and reads raw lines. W3, W5 and the rowsInTables variant (W6) each turn it red. |
| R-1642 | IF the tree parser reads one requirement row ID under two headings, THEN the tree test's row accounting shall fail naming that ID. | packages/nana-pack/tests/requirements-tree.test.mjs::R-1642: a row ID read under two headings fails the accounting naming its ID | Probe P3 copied R-294 under FEAT-001. The tree CLI reported 0 problems. Today's test failed only on the literal, with no ID. W4 turns this check red. |
| R-1643 | WHERE a feature that has subgroups holds rows in its own table, the tree test's row accounting shall count each of those rows once. | packages/nana-pack/tests/requirements-tree.test.mjs::R-1643: a row on a feature that has subgroups is counted once by the accounting | Probe P2 added a row to FEAT-002's own table, above SUB-001. Today's test PASSED with the literal one below the trace total, so the row was never counted. W2 turns this check red. |

All four checks run in memory on every platform, with no skip. The repo checks out with LF line endings everywhere.

The adversary built a prototype in a temp clone:
- With the four rows added, all checks passed.
- The trace showed 0 rows off form, the tree check exited 0, and map:check and readme:check were green.
- W1 to W7 each turned its named check red.
- An added row and a feature-level row each passed with no test edit.
- A duplicate R-294 failed naming R-294.

## Known limits (residuals)
- A row deleted from both the ledger and the outline no longer fails the tree test. requirements-moved reports it as "removed" at final review and at land.
- The accounting lives in the test, not in the tree checker CLI, so an adopted project's `--root` check gains nothing. That project's trace rail already throws on a duplicate line.
- R-1640 runs on the real ledger. When the real ledger has an accounting problem, R-1640 fails together with the real check.
- The R-288 heading count (`=== 68`) is the same kind of literal. It has changed 3 times and is out of scope.
- The old seat helpers in review corpora (seat-titles.mjs) match the old title prefix. They are records and are not edited.
- A row line inside a code fence counts as unread, which matches R-287.
- The seat's planning template, outside the repo, still says "set the R-291 leaf total". The seat removes that line after this lane lands.

## Merge note for in-flight lanes
- Eight branches are in flight: clean-revision, win-gate-tmp, parallel-runner, blast-radius, review-timeline, win-leg-flip, readme-install and audit-open-questions.
- Each changes only the literal's three lines in this file (3 insertions, 3 deletions). Their worktrees hold no uncommitted edits to the file.
- After this lane lands, a lane's merge of main takes main's version of the file, then regenerates the outline with `--write`.
- If another lane lands first, this lane's merge keeps its own block.