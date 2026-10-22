# Review — the product report as a feature, 2026-10-11 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

Review `git diff 0818b72..HEAD` on `feat/product-report` (based before the Windows CI, verdict-reader
and pi-launch lanes; `main` is merged in after this review, under a confirmation round). Threat model
(Owner, 2026-10-11): honest variation in our own ledger, HANDOFF and assessment text — CRLF, hostile-
looking markup in a row, malformed asks, a stale stamp — is in scope; a person deliberately forging a
store entry to deceive the page is out. Lane class: format (a stored schema checked by the suite).

Records: the plan (`CHANGE.md`; Fable consult, fact-check, sol plan r1–r3; checkpoint 1; one seat
amendment adding a ready stamp to packets), ten builds (`build-brief-1..10.md`, builder reports), the
seat's acceptance script (`seat-verify-report.mjs`; renders every view through a DOM stub; 0
mismatches), title check (0 gaps), mutation runner (`seat-mutate.py`, 21/21 red — do NOT run it: it
rewrites files), the 38 migrated assessments (`docs/product-report/assessments.json`), the refresh
guide (`docs/product-report/assess-brief.md`), and the seat's `HANDOFF.md` lines and session entry.
Generate the page (`node scripts/product-report.mjs --out <tmp file>`) and read it as the owner would.

Check: (1) `scripts/product-report.mjs` and `scripts/product-report/template.html` against CHANGE
§2–§4 and rows R-1012–R-1030 and R-1040–R-1042 — determinism, the stamp rebuilt with `git show`,
staleness, packets, text-only rendering through the fixed DOM surface, the guarded hash route;
(2) each row has one `shall` and the clause each cited test pins — the page rows must be pinned on
the RENDERED views, not the embedded data; (3) the migrated assessments: no digits or IDs in prose,
honest ratings, inferred stamp declared; (4) README and the refresh guide: every command runs as
written; (5) the HANDOFF lines and session entry are true; (6) anything that should block the merge.
Rare cases are residuals. Answer with the full review: MUST / SHOULD / NOTE with file:line, evidence and
the smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
