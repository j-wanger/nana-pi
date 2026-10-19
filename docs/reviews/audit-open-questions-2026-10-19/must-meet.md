# audit-open-questions: must-meet

Feature: FEAT-039 · See the product and its decisions in one report
Class: ordinary. The lane changes the product report script, its test and ledger prose. It touches no install, hook, gate or land tool.
Threat model: honest variation in ledger shape is in scope. That covers CRLF (a Windows checkout), indented continuation lines, a lettered number (6b), bullet entries, a template's preamble line, and a project with no `## Open questions` heading. Deliberate forgery is out. Ledger markup is already inert data (R-1019, shared into FEAT-039).

Feature sentence: the product report's Decisions view lists every entry in REQUIREMENTS.md's open questions, and those entries record each 2026-10-09 audit issue that the seat confirmed and that is still open.

## Design
- Ledger: close question 3 in place. Append entries 13–23 (below) after the last line of 12. No row text changes.
- Builder (`scripts/product-report.mjs`; no new module, export or import). Parse the normalised `ledgerText` buildReport already holds, never a fresh read. Read from the line that is exactly `## Open questions` to the next line that starts with `#`.
  - An entry starts at a column-zero line `<digits><optional a-z>. ` or `- `. Each later non-blank line, up to the next entry start or heading, continues it. Lines before the first entry are a preamble, not listed.
  - Entry text: trim each line and join with one space. The model gains `questions: [{ number, text }]`, `number` null for a bullet.
- Decisions view, after the ask cards: an `h3` "Open questions in REQUIREMENTS.md", then a `ul.open-questions`, one `li` per entry reading `<number>. <text>` (a bullet: its text alone), written through `text()`.
  - With no heading or no entry (or no `questions` in the model): one `p` reading exactly "Open questions: none recorded in REQUIREMENTS.md", and no list.
  - No `article`: the R-1018 checks count articles as asks.
- `renderInto` reaches the page as `String(renderInto)`, so it may read nothing from module scope. The heading line is a module-scope constant used by buildReport only (`// contract (R-1570)`); the none message is a named constant inside `renderInto` (`// contract (R-1571)`).
- Both checks render through the written page's own inline script in `node:vm`, so they see what the reader sees. Probe: a module-scope none message passes all 63 existing checks yet throws a ReferenceError in the page.
- The root README's product-report sentence also names "the ledger's open questions".

## Must-meet
| Row | Requirement | Test (`packages/nana-pack/tests/product-report.test.mjs::`) | Red today |
|---|---|---|---|
| R-1570 | The product report's Decisions view shall list every numbered or bulleted entry under REQUIREMENTS.md's `## Open questions` heading, in file order, with its full text across continuation lines and, for a numbered entry, its number. | `R-1570: the Decisions view lists every open question with its number and full text in file order` | Probe test on a temp clone of the report-test-details tip b8616fb: the written page has no `ul.open-questions` (0 found). |
| R-1571 | IF REQUIREMENTS.md has no `## Open questions` heading or no entry under it, THEN the report command shall still write the page, with its Decisions view saying that no open questions are recorded. | `R-1571: a ledger with no open questions heading, or none under it, still writes the page and says none are recorded` | Same probe, heading-cut and preamble-only cases: today's command writes both pages, but neither holds the message. |

Probe of the design (prototype, then mutants): W1–W6, W8 and W9 in the brief each turned their named check red. W7 turned R-1570 and the R-1018 ask-body check red.

## The audit and each issue
Source: the 15-issue register (C02–C18) from the outside requirements proposal of 2026-10-09, verified read-only by the seat: verdict table `docs/reviews/requirements-proposal-2026-10-09/README.md:35-49`, evidence in `verifier-output.json`. Result: 12 CONFIRMED, 3 PARTIAL, none wrong. The 2026-10-10 decision page showed them. The step is HANDOFF Next 7. Each issue rechecked on main ab5c3e8 and against every in-flight lane's ledger diff.

Closed, no entry:
- C08: closed by the 2026-10-10 ruling and g005-carveout (G-005 reworded, R-1480), which is in report-test-details' history.
- C10: closed by the 2026-10-10 ruling (R-1002, R-1003 added; R-978 retired). C18: closed by four-digit IDs (R-1000, R-1001) and question 9.
- C09's R-937 half: reworded 2026-10-12 in the cc-hooks-windows lane (7b46022).

Already an open question, no entry: C02 (8(a) and 6b).

Close in place: question 3 is C16's first half. `test-runner.test.mjs` landed with question 3 in c0a7849, and 29 implemented FEAT-031 rows cite it. Prefix question 3's text with: `(closed: the external test \`packages/nana-pack/tests/test-runner.test.mjs\` landed with the row set on 2026-10-02; found stale by the 2026-10-09 audit, C16) `.

Entries to add. Each opens with `(2026-10-09 requirements audit, Cnn; verified in \`docs/reviews/requirements-proposal-2026-10-09/\`) ` and then the body below, word for word:
- 13 · C03: The status legend at the top of this file says `untested` means "the code does it, nothing pins it" and `implemented` means "a test in this repo asserts it". At the audit, 75 of the 264 `untested` rows named unpinned words in their cell (a partial pin), 111 carried a batch sentence and 49 read `—`; 6b says an `implemented` row means one mutation turns one cited check red. Proposed: reword this file's legend to match. The requirements skill and both templates carry the same legend and change with 6b's ruling, through a template release. Whose call: the seat for this file; the owner for the templates, with 6b.
- 14 · C04: R-739 repeats R-302 (the requirements skill's install link), and R-834 repeats R-972 (any number of reviews on one revision is one round). The check that pins a repeated review under one role carries no marker. Proposed: retire R-739 as a duplicate of R-302; mark that check with R-972, then retire R-834 as superseded by R-972. Whose call: the seat.
- 15 · C05: A template update can rewrite a G row's governing text in REQUIREMENTS-general.md (R-578) while the project's status for that row stays as judged against the old text; the drift only prints a line (R-583). Should a template rewrite of a G row count as a rewrite after judgement, sending the row back to be judged? Whose call: the owner, with 6b.
- 16 · C06: R-778 ("A record on the nearest recorded ancestor shall grant trust") lost its affirmative sense when it was split from R-075: read alone, a recorded decline on the ancestor would grant trust. R-028 says a store owned by this user counts as vouched, though ownership passes only the ownership check. R-075 still carries the subfolder clause that R-242 now owns. Proposed: R-778 "a recorded true on the nearest recorded ancestor, with no nearer record, shall count as a decided trust"; R-028 "ownership by this user passes only the ownership check"; drop the subfolder clause from R-075. The cited tests already fail each wrong reading. Whose call: the seat.
- 17 · C07: R-764 allows benign commands that merely mention a dangerous form, but R-040 gates rm text anywhere in a segment, and interpreter deletion text is scanned across the whole command. Read alone, R-764 invites reviving the rm-text relaxation retired as R-632 and R-637 on 2026-10-07. Proposed: name both exceptions in R-764 and leave the matcher unchanged. Whose call: the seat.
- 18 · C09: R-937's half closed on 2026-10-12. R-938 has no actor ("a stale copy shall read ✗ naming the file and be refreshed"): doctor reads ✗ and install refreshes. R-980, R-964 and R-311 promise PATH links with no platform clause, but on Windows no pack command is linked on PATH. Proposed: give R-938 doctor as its actor and move the refresh to an install row; open R-980, R-964 and R-311 with "WHERE the platform is not win32," as R-953 does. Whose call: the seat.
- 19 · C13: Four rows state a known limit as a `shall`: R-056 (a path the shell computes at run time shall not be caught), which R-053's four caught spellings contradict; R-731 (ledger storage shall not be bounded), which R-721 and R-722 already cover; R-625 (redirect detection shall not detect logs inside submodule contents); and R-771. A requirements-first agent could refuse an improvement as a violation. Proposed: restate R-056 and R-625 as declared non-guarantees, or retire them into the pack README's limits; retire R-731 as covered by R-721 and R-722; keep R-771's meaning. Whose call: the seat.
- 20 · C14: G-011 says a change's transitive callers and callees come from the map by one command. Its one cited check pins callers only, and its cell does not point to the graph's known gaps in 10–12. Proposed: name the unpinned callees clause and 10–12 in G-011's evidence cell. Whose call: the seat.
- 21 · C15: Eight desk rows (R-413, R-418, R-421, R-426, R-427, R-428, R-434, R-454) read `—` as evidence, though the 2026-10-09 verification found that hand-run browser suites under `apps/desk/test/` cover them; 6 records that those suites sit outside the suite of record. Proposed: name the suite in each cell when the desk reopens; the desk is frozen until then. Whose call: the seat, after the freeze.
- 22 · C16: Its stale-question half closed 3. R-865 accepts the legacy receipts config keys "during the compatibility release", with no end. Proposed: an end condition (a pack version past 0.4.0, or a date) mirrored in the config loader and the pack README. Whose call: the seat.
- 23 · C17: R-849 says adopt-structure changes no source, config or CI file, but the skill writes a starter `.pi/nana-pack.json` (R-592), and the pack README repeats the phrase. Proposed: "no source file, language or build configuration, lockfile or CI file", as the skill's own text says, in the row and the README. Whose call: the seat.

## Known limits
- Closed entries (2, 3, 4, 5, 9) still list, each with its own "(closed …)" text; a closed filter would be a phrase guess.
- Only `- ` bullets and `N.`/`Na.` numbers start an entry; a `*` bullet continues the entry above. A scaffold's placeholder `1. _(none yet)_` lists as entry 1, underscores shown, since `text()` renders only bold and code spans.
- The verification's own extra findings (R-389, R-734, the pack README `-m` line, misfiled rows) were not audit issues and are out of scope.
- The page is git-ignored. After the land, the seat runs `npm run report` and republishes the page to its link.