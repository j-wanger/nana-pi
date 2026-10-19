# audit-open-questions: build brief 1

Feature: FEAT-039 · See the product and its decisions in one report. Lane class: ordinary.
Worktree `~/nana-pi-wt/audit-open-questions`, branch `feat/audit-open-questions`, cut from main AFTER report-test-details lands (same renderer, model line, test file, README paragraph and FEAT-039 table).
Read `docs/reviews/audit-open-questions-<date>/must-meet.md` first: row text, design and the ledger entries word for word.

## Change
1. REQUIREMENTS.md, FEAT-039 table: add R-1570 and R-1571 as `planned`; flip each to `implemented` with its cite when its check passes.
2. REQUIREMENTS.md, `## Open questions`: close question 3 in place with must-meet.md's prefix; append entries 13–23 word for word; change no row text.
   - Before writing each entry, re-read the rows it names on your base. If a row already reads as the entry proposes, drop that entry and say so in the report.
   - If another lane added an entry first, number yours from the next free number.
3. scripts/product-report.mjs (no new module, export or import):
   - Parse the section from the normalised `ledgerText` in buildReport; add `questions` to the model; render it as must-meet.md's Design says, through the existing `text()` and `el()` helpers, never innerHTML.
   - `renderInto` is shipped to the page as `String(renderInto)`: it must read nothing from module scope. Put the heading line at module scope (`// contract (R-1570)`) and the none message as a named const INSIDE `renderInto` (`// contract (R-1571)`).
   - Treat a model with no `questions` as none: the R-1019 text-node check renders such a model.
4. packages/nana-pack/tests/product-report.test.mjs: one shared helper plus two checks, each with its `// req:` marker directly above.
   - Helper: run `generateReport` to a temp file, take the page's inline bootstrap script (the `<script>` without an id) and run it with `node:vm` against a minimal fake document (`report` root, `report-data` text), `location.hash` "", a no-op `addEventListener` and `window.scrollTo`. Return the flattened nodes. A throw counts as a failed check.
   - `R-1570: the Decisions view lists every open question with its number and full text in file order`. On a fixture() copy, replace the section body with: the preamble `Unruled decisions, numbered.`, a blank line, `- (lane, 2026-10-01) A bullet question.`, `1. First **bold** question.`, `6b. Lettered \`code\` question.`, `6. Six after six-b.`, `12. (origin) Long question`, `    continued one`, `    continued two.`, a blank line. Keep `## Deliberate omissions` and add `- An omission.` under it. Write the whole ledger with CRLF endings. Assert the `li` texts of the one `ul.open-questions` are exactly, in order: `(lane, 2026-10-01) A bullet question.` · `1. First bold question.` · `6b. Lettered code question.` · `6. Six after six-b.` · `12. (origin) Long question continued one continued two.`
   - `R-1571: a ledger with no open questions heading, or none under it, still writes the page and says none are recorded`. Two fixture() copies: one with the `## Open questions` line and body cut, one keeping the heading with only the preamble line. For each, the page is written and holds a `p` whose text is exactly the none message, and no `ul.open-questions`. This is the one test that pins the message literal.
5. README.md, product-report paragraph: "…requirement rows, open asks, the ledger's open questions, and the git revision…".
6. Run `npm run req:tree`; bump the leaf total in packages/nana-pack/tests/requirements-tree.test.mjs by 2 from your base's value. Run `npm run map` if `npm run map:check` says the map is stale.

## Wrong code to try (revert each; report which check turned red)
- W1 keep only an entry's first line → R-1570. W2 sort entries by number → R-1570. W3 skip bullets → R-1570.
- W4 list the preamble → R-1570, R-1571. W5 read past the next heading → R-1570, R-1571. W6 throw when the heading is missing → R-1571.
- W7 render entries as `article` → R-1570 and the R-1018 ask-body check.
- W8 move the none message to module scope, read from `renderInto` → R-1571.
- W9 parse a fresh raw read of REQUIREMENTS.md instead of the normalised text → R-1570.

## Run
Single files only, never the full suite, each with `node`, under packages/nana-pack/tests/: product-report, requirements-trace, requirements-tree, code-map, readme-check (`.test.mjs`).
Then `node scripts/product-report.mjs --out <a temp folder>/page.html` and grep the page for one phrase from each of entries 13–23.

## Done
R-1570 and R-1571 `implemented`; all five files green; W1–W9 each turned their named check red; the page holds every entry; no row text changed.
The seat edits HANDOFF.md and the session note, not you. In HANDOFF the seat drops the audit step from Next 7, and the REQUIREMENTS-decisions ask drops 3 and adds 13 and 15.

## Report (at most 10 lines)
Commit; PASS/FAIL per file; for W1–W9, the check that turned red; the entries written, with their numbers; any entry dropped, and why; the page grep result; anything not done.