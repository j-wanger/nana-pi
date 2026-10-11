# Change declaration — the product report as a feature

*Lane `product-report` · branch `feat/product-report` · worktree `~/nana-pi-wt/product-report`, based
on `main` at `0818b72` (the tree, four-digit IDs and the land rule) · 2026-10-11. Feature: **new — FEAT-039 · See the product and its decisions in one report**, under
CAP-07 "Keep code and promises checkable" (a tree change Jake asked for; he confirmed its name and home on 2026-10-10).
Order: why → plan → Fable consult (`fable-consult.md`) → seat fact-check (`factcheck.md`) → sol plan
review (item `product-report-plan`)
→ build → seat verification → sol build review → astra land review → Jake accepts.*

## 1. Why

Jake, 2026-10-10: "we need to make that product report a feature, and not a one time assembly thing."

The decision page Jake used today ("nana-pi Product Ledger") was assembled by hand: an extraction
script and template in the seat's scratch folder, a 17-agent workflow for the assessments, a manual
publish. None of it is in the repo; next week nobody can rebuild it the same way or tell which parts
are out of date.

**Observable outcome.**
1. One command rebuilds the page from the repo at any commit; two builds at one commit are
   byte-identical; the page states the commit and whether the tree was clean.
2. Every count, status and list on the page is computed from `REQUIREMENTS.md` and `HANDOFF.md`;
   no number lives in prose.
3. The plain-language assessments are stored in the repo, each stamped with per-row fingerprints of
   the content it was written against — the feature's own rows AND the shared rows it depends on.
   The page shows each as current or out of date and names the rows that changed.
4. Refreshing assessments works from either seat with any model: the command writes evidence packets
   for out-of-date features; a model writes candidates into the store; the suite refuses a store
   that cites rows outside a feature, has IDs or numerals in prose, rates a feature with untested or
   violated rows `solid`, or carries a stale fingerprint.
5. The seat publishes: from Claude Code, a republish to the same link; from pi, open the file.

## 2. Requirement delta (new rows in FEAT-039)

| ID | Requirement (draft) |
|---|---|
| R-1012 | Two runs of `npm run report` at the same commit shall write byte-identical product reports. |
| R-1013 | The product report shall state the commit it was built from and whether the working tree was clean. |
| R-1014 | The product report shall show, for every capability and feature in REQUIREMENTS.md, its purpose and status, its requirement counts by status, its shared requirements in and out, and every requirement with its status and evidence. |
| R-1015 | The product report shall list every violated requirement, every open question in REQUIREMENTS.md and every ask in HANDOFF.md's "Open for Jake" section. |
| R-1016 | The product report shall render every ledger and HANDOFF text as text, never as markup or script. |
| R-1017 | Each stored assessment shall carry a fingerprint per row it was written against — the feature's rows and its shared rows, each over ID, requirement text and status — and the product report shall mark the assessment out of date, naming the changed rows, when any differs. |
| R-1018 | Fingerprints shall be equal for a ledger with LF line endings and the same ledger with CRLF line endings or trailing whitespace. |
| R-1019 | The suite shall fail when a stored assessment cites a row outside its feature's rows and shared rows. |
| R-1020 | The suite shall fail when a stored assessment's prose holds a requirement or feature ID or a numeral. |
| R-1021 | The suite shall fail when a stored assessment rates `solid` a feature with an untested or violated row. |

Tree change (Jake's request): FEAT-039 under CAP-07 — `Purpose: Rebuild one report of the product,
its features, their requirements and the decisions waiting on Jake, from the repo at any commit.` —
`Status: active`.

## 3. Scope

**In.** `scripts/product-report.mjs` (mapped module: reuse `parseLedger` from the tree checker, reuse
the HANDOFF ask grammar `nana-frontier` already pins, exported from a shared lib rather than copied;
fingerprints; render; `--packets <dir>`); its HTML template; `docs/product-report/assessments.json`
(today's 38 fact-checked assessments, numerals removed from prose, re-stamped with current
fingerprints and provenance fields `written_by`, `checked_by`, `date`); `docs/product-report/assess-brief.md`
(the single-model loop any seat can run: packet → candidate → run the report test → fix; a second
model as checker when available); `package.json` (`report`); root `README.md` (one entry, saying
how each seat publishes); `packages/nana-pack/tests/product-report.test.mjs`; `REQUIREMENTS.md`
(FEAT-039, its rows); regenerated outline and code map; `.gitignore` (the output folder).

**NOT.** Committing the generated page; the capability summary prose (counts render live); the
review ledger and other machine-local state; the placement-review history; the audit issues (a
separate small lane moves the confirmed open ones into the ledger's Open questions, if Jake agrees);
a publish step inside the script; the tree checker's own CRLF gap (the Windows lane).

## 4. Design

- **Sources are canonical only:** `REQUIREMENTS.md`, `HANDOFF.md`, `assessments.json`.
- **Fingerprint:** per row, SHA-256 over `id`, requirement text and status after normalizing line
  endings and trailing whitespace; a feature's assessment also stamps its purpose and status. Evidence
  is excluded (it churns on test renames) — declared residual: a meaning change carried only by an
  evidence edit does not mark an assessment stale.
- **The suite is the gate:** no separate accept command; any write to `assessments.json`, by a model
  or by hand, passes the same checks.
- **Determinism:** stamp the commit hash and commit date, never the wall clock; embed data as JSON
  with `<` escaped; fonts from Google Fonts with system fallbacks (the page reads without network).
- **Output:** `docs/product-report/out/nana-pi-product-ledger.html`, gitignored — a stable path the
  seat republishes from.

## 5. Checkpoint 1 (Jake, decided 2026-10-10)

Jake: "agreed on all your recommendations, and yes lift the hold for html". So: (1) the report is
queued after the land rule (done); (2) the new feature is FEAT-039 "See the product and its
decisions in one report" under CAP-07; (3) the confirmed audit issues go to the ledger's open
questions in a separate small lane, not into this report; (4) the 2026-10-05 hold on HTML pages is
lifted.
## 6. Verification (doneWhen)

`npm run report` twice → identical bytes; `npm run test:locked`; mutation pairs per row (a changed
shared row marks its lister out of date; an ID, a numeral, a foreign row, a `solid` over an
untested row each fail the suite; a `</script>` in a ledger cell renders as text; a CRLF copy of the
ledger gives the same fingerprints); the seat's acceptance script, verbatim.
