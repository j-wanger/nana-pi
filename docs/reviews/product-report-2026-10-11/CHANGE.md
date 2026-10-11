# Change declaration — the product report as a feature

*Lane `product-report` · branch `feat/product-report` · worktree `~/nana-pi-wt/product-report`, based
on `main` at `0818b72` (the tree, four-digit IDs and the land rule) · 2026-10-11. Features:
**new — FEAT-039 · See the product and its decisions in one report** under CAP-07 (home of every new
row; Jake confirmed its name and home on 2026-10-10); FEAT-028 (its tree-checker module gains one
exported row reader and a capability `outcome` field — code only, no row changes); FEAT-002 SUB-005
(the HANDOFF ask tag moves into a shared lib that `nana-frontier` imports — code only). Order: why →
plan → Fable consult (`fable-consult.md`) → seat fact-check (`factcheck.md`) → sol plan review (item
`product-report-plan`; r1 SEND-BACK, answered in `sol-plan-r1-response.md`) → Jake's tree decisions
(decided) → build → seat verification → sol build review →
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
2. Every count, ledger status and list on the page is computed from `REQUIREMENTS.md` and
   `HANDOFF.md`; only the assessments (prose and a rating) are stored, and their prose carries no
   digits, so it cannot go stale by number. A feature with no assessment shows as unassessed.
3. The plain-language assessments are stored in the repo under a closed schema, each stamped with
   the commit it was written against, the set of rows it covers (its feature's own rows and the rows
   shared into it, each marked own or shared) and a fingerprint and status per row. The suite rebuilds
   every stamp from the ledger at its commit, so a stamp cannot be forged. The page shows each
   assessment as current or out of date and names each added, removed or changed row.
4. Refreshing works from either seat with any model: the command writes evidence packets for
   out-of-date features; a model writes candidates into the store; the suite refuses a store that
   cites a row outside its stamp, carries a digit in prose, breaks the schema, carries a stamp that
   differs from the ledger at its commit, or rates a feature `solid` while one of its own stamped rows
   was untested or violated. Staleness is never a suite failure — it is
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
| R-1018 | The product report shall list every entry in HANDOFF.md's "Open for Jake" section with its kind, its since-date, its title and its full body. |
| R-1019 | The product report shall insert ledger, HANDOFF and assessment text into the page only as text nodes, never parsed as HTML or run as script. |
| R-1020 | Each stored assessment shall carry a stamp of the commit it was written against, its feature's purpose and status, and for each row it covers — the feature's own rows and the rows shared into it, each marked own or shared — the row's status and a SHA-256 over its ID, requirement text and status. |
| R-1021 | WHEN a stored assessment's stamped row set, any stamped row's own-or-shared mark or fingerprint, or its feature's stamped purpose or status differs from the current ledger, the product report shall mark the assessment out of date and name each added, removed or changed row. |
| R-1022 | Fingerprints shall be equal for a ledger with LF line endings and the same ledger with CRLF line endings or trailing whitespace, read through the report's own parse. |
| R-1023 | The suite shall fail when a stored assessment cites a row outside the rows it was stamped against. |
| R-1024 | The suite shall fail when a prose field of a stored assessment holds an ASCII digit. |
| R-1025 | The suite shall fail when a stored assessment is rated `solid` while one of its feature's own stamped rows had status untested or violated. |
| R-1026 | IF the tree checker reports problems for the ledger, THEN the report command shall refuse, naming them, and write no page. |
| R-1027 | The suite shall fail when a stored assessment's stamp differs from what the ledger at its stamped commit, read with `git show`, gives for its feature: the row set, each row's own-or-shared mark, status and fingerprint, and the feature's purpose and status. |
| R-1028 | The suite shall fail when the assessment store breaks its declared schema: only the declared fields, each prose field a string or a list of strings, and a rating of `solid`, `mostly solid`, `partial` or `weak`. |
| R-1029 | The product report shall show a feature that has no stored assessment as unassessed. |
| R-1030 | WHEN run with `--packets <dir>`, the report command shall write one packet per out-of-date or unassessed feature, holding the feature's current purpose and status, its own and shared rows with text, status and evidence, its current assessment and its stale differences, byte-identical across runs at one commit. |
| R-1031 | IF an entry in HANDOFF.md's "Open for Jake" section has no parseable kind, since-date or title, THEN the report command shall refuse, naming the line, and write no page. |

(R-1024 checks digits only: every capability, feature, subgroup and requirement ID holds a digit, so
a separate ID clause could never fail on its own — sol plan r1. R-1014–R-1018 replace the draft's two bundled rows: capabilities have a purpose and an outcome but no
status or shares; the draft's "every open question" is dropped — the open questions are free text with
no grammar, and HANDOFF's "Open for Jake" already carries the ask about them.)

**Tree changes for Jake (checkpoint 1b — Jake, 2026-10-11: "Yes").** FEAT-039 is `Status:
active` with `Purpose: Rebuild one report of the product, its features, their requirements and the
decisions waiting on Jake, from the repo at any commit from its first build on.` Proposed share line:
`Also applies: R-292, R-293, R-878, R-1000` — the report reads the share grammar, the feature status
grammar, the HANDOFF ask tag and the ID grammar, so a change to any of them must re-read the report.
The builder adds this line with FEAT-039.

## 3. Scope

**In.**
- `scripts/product-report.mjs` (mapped module, six-tag header): normalise the ledger text (LF line
  endings; trailing whitespace stripped per line with the rail's `WHITESPACE`) BEFORE parsing; run the
  tree checker (refuse on problems, R-1026); read headings through `parseLedger` and cells through the
  new exported row reader; read HANDOFF entries through the shared ask lib (refuse on a parse error,
  R-1031); compute counts, shares in and out, violated rows; check stamps; render; `--out <file>`
  (default `docs/product-report/out/nana-pi-product-ledger.html`, gitignored), `--packets <dir>`, and
  an injectable repository root and git runner for tests (G-006).
- `scripts/requirements-tree.mjs` (FEAT-028): export one row reader (each row's ID, requirement text,
  status, evidence, line and owning heading, built on the rail's `requirementRowId` and `WHITESPACE`)
  and use it in `checkLifecycleAndShares` instead of its private cell read; record each capability's
  `Outcome:` as `outcome`; export the descendant walk the report needs. R-291's outline stays byte for
  byte.
- `packages/nana-pack/lib/handoff-asks.mjs` (FEAT-002 SUB-005; new, six-tag header): the ask tag
  pattern and ONE entry parser for the "Open for Jake" section returning every entry with its kind,
  since-date, title, full body and line, or a named parse error; `nana-frontier.mjs` consumes that
  parser and keeps its own checks (the date must not be in the future — a wall-clock check the report
  never uses). Frontier's existing tests (they spawn the CLI) keep pinning its behaviour.
- The page template at `scripts/product-report/template.html`, read from disk by the module: a
  complete HTML document meeting the artifact page contract (title, colour
  tokens with both dark-mode selectors, a phone-width layout, Google Fonts only); every fact computed;
  data embedded as JSON with `<` escaped and inserted with a function replacer (no `$` patterns);
  text inserted through DOM text nodes, with `**…**` and backtick spans built as `b` and `code`
  elements from text; the hash route guarded with an own-property check.
- `docs/product-report/assessments.json` under a closed schema: `{ "features": [ { "id",
  "what_it_does", "maturity", "maturity_reason", "gaps": [], "risks": [], "decisions": [],
  "next_step", "written_by", "checked_by", "date", "stamp": { "commit", "purpose", "status", "rows":
  [ { "id", "mark": "own"|"shared", "status", "sha256" } ] } } ] }`; the prose fields are
  `what_it_does`, `maturity_reason`, `gaps`, `risks`, `decisions` and `next_step`; the prototype's
  `corrections` and product-level `synth` are dropped (the synthesis had no stamp and would go stale).
  It holds the prototype's 38 assessments, stamped against `c4332ec` —
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
  ledger literals (67 → 68 headings, 1,024 → 1,044 rows); regenerated outline and code map;
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
- **R-1013 is pinned against independent values:** temporary git repositories for a clean tree, a
  tracked change and an untracked file, each checked against `git rev-parse` and `git log -1
  --format=%cI` run by the test itself, and an injected failing git runner that must make the command
  refuse.
- **R-1019 is pinned in two halves:** hostile ledger text (`</script>`, `<img onerror>`) leaves exactly
  one parseable data script in the page; and the renderer, run against an injected document stub,
  builds every text through text nodes and never assigns to an HTML sink.
- **R-1027 needs history:** CI already checks out with `fetch-depth: 0`, so `git show <stamp commit>`
  works there; a stamp commit missing from the clone makes the suite fail, never skip.

## 5. Checkpoint 1 (Jake, decided 2026-10-10)

Jake: "agreed on all your recommendations, and yes lift the hold for html". So: (1) the report is
queued after the land rule (done); (2) the new feature is FEAT-039 "See the product and its
decisions in one report" under CAP-07; (3) the confirmed audit issues go to the ledger's open
questions in a separate small lane, not into this report; (4) the 2026-10-05 hold on HTML pages is
lifted. Checkpoint 1b (the share line in §2): Jake, 2026-10-11, "Yes".

## 6. Verification (doneWhen)

`npm run report` twice → identical bytes; `npm run test:locked`; mutation pairs per row (parse
without normalising → the CRLF fingerprint test fails; drop a share from the stamp check → a share
added marks nothing stale; skip the digit or ID check → its test passes a bad store; check the live
ledger instead of the stamp → a lane edit fails the suite; trust the stored stamp instead of
rebuilding it → a forged status passes; ignore the own-or-shared mark → a row moving home stays
current; drop the ask body → its test fails; skip a malformed ask instead of refusing → its test
fails; insert text as HTML → a `</script>` in a ledger cell runs; drop the own-property guard →
`#constructor` throws; hardcode the commit or the clean flag → the temporary-repository tests fail); the seat's acceptance script
and title-coverage check, verbatim; independent clause check for every row flipped to `implemented`.
