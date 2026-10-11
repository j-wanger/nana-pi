# Change declaration — the product report as a feature

*Lane `product-report` · branch `feat/product-report` · worktree `~/nana-pi-wt/product-report`, based
on `main` at `0818b72` (the tree, four-digit IDs and the land rule) · 2026-10-11. Features:
**new — FEAT-039 · See the product and its decisions in one report** under CAP-07 (home of every new
row; Jake confirmed its name and home on 2026-10-10); FEAT-028 (its tree-checker module gains one
exported row reader and a capability `outcome` field — code only, no row changes); FEAT-002 SUB-005
(the HANDOFF ask tag moves into a shared lib that `nana-frontier` imports — code only). Order: why →
plan → Fable consult (`fable-consult.md`) → seat fact-check (`factcheck.md`) → sol plan review (item
`product-report-plan`) → Jake's tree decisions → build → seat verification → sol build review →
astra land review → Jake accepts.*

## 1. Why

Jake, 2026-10-10: "we need to make that product report a feature, and not a one time assembly thing."

The decision page Jake used that day ("nana-pi Product Ledger") was assembled by hand: an extraction
script and template in the seat's scratch folder, a 17-agent workflow for the assessments, a manual
publish (`prototype/` keeps them). Nobody can rebuild it the same way or tell which parts are out of
date.

**Observable outcome.**
1. One command rebuilds the page from the repo at any commit from this change on; two builds at one
   commit with the working tree unchanged are byte-identical; the page states the commit and whether
   the tree was clean. If the tree checker finds problems in the ledger, the command refuses.
2. Every count, status and list on the page is computed from `REQUIREMENTS.md` and `HANDOFF.md`;
   stored prose carries no digits and no IDs, so it cannot go stale by number.
3. The plain-language assessments are stored in the repo, each stamped with the commit it was written
   against, the set of rows it covers (its feature's own rows and the rows shared into it) and a
   fingerprint and status per row. The page shows each as current or out of date and names each
   added, removed or changed row.
4. Refreshing works from either seat with any model: the command writes evidence packets for
   out-of-date features; a model writes candidates into the store; the suite refuses a store that
   cites a row outside its stamp, carries a digit or an ID in prose, or rates a feature `solid` while
   one of its own stamped rows was untested or violated. Staleness is never a suite failure — it is
   what the page shows — so no other lane has to edit the store.
5. The seat publishes: from Claude Code, a republish to the same link; from pi, open the file.

## 2. Requirement delta (new rows in FEAT-039; one `shall` each)

| ID | Requirement (draft) |
|---|---|
| R-1012 | WHEN the working tree is unchanged between them, two runs of the report command at the same commit shall write byte-identical product reports. |
| R-1013 | The product report shall state the full commit hash and commit date it was built from and whether the working tree was clean. |
| R-1014 | The product report shall show every capability in REQUIREMENTS.md with its purpose, its outcome and its features. |
| R-1015 | The product report shall show every feature with its purpose, its status, its requirement counts by status, the requirements shared into it and the features that list its requirements. |
| R-1016 | The product report shall show every requirement row under its feature or subgroup with its requirement text, status and evidence. |
| R-1017 | The product report shall list every requirement whose status is violated. |
| R-1018 | The product report shall list every ask in HANDOFF.md's "Open for Jake" section with its kind, its since-date and its title. |
| R-1019 | The product report shall insert ledger, HANDOFF and assessment text into the page only as text nodes, never parsed as HTML or run as script. |
| R-1020 | Each stored assessment shall carry a stamp of the commit it was written against, its feature's purpose and status, and for each row it covers — the feature's own rows and the rows shared into it, each marked own or shared — the row's status and a SHA-256 over its ID, requirement text and status. |
| R-1021 | WHEN a stored assessment's stamped row set, any stamped row fingerprint, or its feature's stamped purpose or status differs from the current ledger, the product report shall mark the assessment out of date and name each added, removed or changed row. |
| R-1022 | Fingerprints shall be equal for a ledger with LF line endings and the same ledger with CRLF line endings or trailing whitespace, read through the report's own parse. |
| R-1023 | The suite shall fail when a stored assessment cites a row outside the rows it was stamped against. |
| R-1024 | The suite shall fail when a stored assessment's prose holds an ASCII digit or a capability, feature, subgroup or requirement ID. |
| R-1025 | The suite shall fail when a stored assessment is rated `solid` while one of its feature's own stamped rows had status untested or violated. |
| R-1026 | IF the tree checker reports problems for the ledger, THEN the report command shall refuse, naming them, and write no page. |

(R-1014–R-1018 replace the draft's two bundled rows: capabilities have a purpose and an outcome but no
status or shares; the draft's "every open question" is dropped — the open questions are free text with
no grammar, and HANDOFF's "Open for Jake" already carries the ask about them.)

**Tree changes for Jake (checkpoint 1b; governance: Jake decides shares).** FEAT-039 is `Status:
active` with `Purpose: Rebuild one report of the product, its features, their requirements and the
decisions waiting on Jake, from the repo at any commit from its first build on.` Proposed share line:
`Also applies: R-292, R-293, R-878, R-1000` — the report reads the share grammar, the feature status
grammar, the HANDOFF ask tag and the ID grammar, so a change to any of them must re-read the report.

## 3. Scope

**In.**
- `scripts/product-report.mjs` (mapped module, six-tag header): normalise the ledger text (LF line
  endings; trailing whitespace stripped per line with the rail's `WHITESPACE`) BEFORE parsing; run the
  tree checker (refuse on problems, R-1026); read headings through `parseLedger` and cells through the
  new exported row reader; read HANDOFF asks through the shared ask lib; compute counts, shares in and
  out, violated rows; check stamps; render; `--out <file>` (default
  `docs/product-report/out/nana-pi-product-ledger.html`, gitignored) and `--packets <dir>`.
- `scripts/requirements-tree.mjs` (FEAT-028): export one row reader (each row's ID, requirement text,
  status, evidence, line and owning heading, built on the rail's `requirementRowId` and `WHITESPACE`)
  and use it in `checkLifecycleAndShares` instead of its private cell read; record each capability's
  `Outcome:` as `outcome`; export the descendant walk the report needs. R-291's outline stays byte for
  byte.
- `packages/nana-pack/lib/handoff-asks.mjs` (FEAT-002 SUB-005; new, six-tag header): the ask tag
  pattern and a parser for the "Open for Jake" section returning each ask's kind, since-date, title
  and line; `nana-frontier.mjs` imports the tag pattern from it and keeps its own checks (the date must
  not be in the future — a wall-clock check the report never uses).
- The page template: a complete HTML document meeting the artifact page contract (title, colour
  tokens with both dark-mode selectors, a phone-width layout, Google Fonts only); every fact computed;
  data embedded as JSON with `<` escaped and inserted with a function replacer (no `$` patterns);
  text inserted through DOM text nodes, with `**…**` and backtick spans built as `b` and `code`
  elements from text; the hash route guarded with an own-property check.
- `docs/product-report/assessments.json`: the prototype's 38 assessments, stamped against `c4332ec` —
  the ledger they were written against (the fact-check matched their counts there) — so every feature
  that drifted since shows out of date on day one. Prose loses its digits and IDs. FEAT-011 and
  FEAT-015 drop from `solid` (each had untested own rows at `c4332ec`). Provenance fields `written_by`,
  `checked_by`, `date`.
- `docs/product-report/assess-brief.md`: the single-model refresh loop any seat can run (packet →
  candidate → run the report test → fix; a second model as checker when available).
- `packages/nana-pack/tests/product-report.test.mjs`; `package.json` (`report`); root `README.md`
  (what the report is, `npm run report`, the script, how each seat publishes; no backticked output
  path unless declared in `readme-check.config.json`); `REQUIREMENTS.md` (FEAT-039 and its rows, landing
  `implemented` with their `// req:` markers in the same commit); `requirements-tree.test.mjs`'s real-
  ledger literals (67 → 68 headings, 1,024 → 1,039 rows); regenerated outline and code map;
  `.gitignore` (the output folder).

**NOT.** Committing the generated page; capability summary prose; machine-local state; the
placement-review history; the audit issues (a separate small lane); a publish step inside the script;
the tree checker's own CRLF gap (the Windows lane — the report normalises before it parses); the
module-type warning Node prints when a script imports the TypeScript rail.

## 4. Design

- **Sources are canonical only:** `REQUIREMENTS.md`, `HANDOFF.md`, `assessments.json`, and git for the
  commit stamp.
- **Determinism:** document order from `parseLedger`, plain code-unit `.sort()` where a sort is
  needed (never `localeCompare`); the full commit hash and `git log -1 --format=%cI`; the clean flag
  from `git status --porcelain --untracked-files=normal` with `GIT_OPTIONAL_LOCKS=0`, failing closed on
  a git error; no wall clock anywhere.
- **Fingerprint and staleness:** per row, SHA-256 over ID, requirement text and status of the
  normalised row. Stale when the covered set (own + shared) changed, any per-row hash changed, or the
  feature's purpose or status changed; the page names added, removed and changed rows. Evidence is
  excluded (it churns on test renames) — declared residual.
- **The suite is the gate, and it checks stamps, not the live ledger:** R-1023–R-1025 read the
  stamped rows, so a lane that changes a row elsewhere never fails this feature's test; the change
  shows as out of date on the page instead.
- **Numbers and the writing rule:** the page's numbers are computed and shown beside the prose; the
  prose itself carries no digits. Spelled-out counts are not caught by the check (residual; the
  re-stamp removes the ones in today's store).
- **Tests run from the repo root:** the R-1012 test runs `node scripts/product-report.mjs --out <tmp>`
  twice from the repo root, not `npm run report` from the pack folder.

## 5. Checkpoint 1 (Jake, decided 2026-10-10)

Jake: "agreed on all your recommendations, and yes lift the hold for html". So: (1) the report is
queued after the land rule (done); (2) the new feature is FEAT-039 "See the product and its
decisions in one report" under CAP-07; (3) the confirmed audit issues go to the ledger's open
questions in a separate small lane, not into this report; (4) the 2026-10-05 hold on HTML pages is
lifted. Checkpoint 1b (the share line in §2) is open.

## 6. Verification (doneWhen)

`npm run report` twice → identical bytes; `npm run test:locked`; mutation pairs per row (parse
without normalising → the CRLF fingerprint test fails; drop a share from the stamp check → a share
added marks nothing stale; skip the digit or ID check → its test passes a bad store; check the live
ledger instead of the stamp → a lane edit fails the suite; insert text as HTML → a `</script>` in a
ledger cell runs; drop the own-property guard → `#constructor` throws); the seat's acceptance script
and title-coverage check, verbatim; independent clause check for every row flipped to `implemented`.
