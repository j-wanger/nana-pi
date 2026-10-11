# Lane product-report — build round 3: the assessment store and its checks (2026-10-11 · feat/product-report)

Round 2 built the report command; the seat's acceptance script passes its 22 page cases. This round
is the store's validation only — the page's stale marking and the migration of the 38 assessments
come next round. Three items; do all three before you report.

- [ ] **A. `validateStore`.** Export from `scripts/product-report.mjs`:
  `validateStore({ root = REPO_ROOT, storePath = <root>/docs/product-report/assessments.json, gitRunner })`
  returning a list of problem strings (empty when valid; a missing store file is valid and empty).
  It enforces CHANGE §3's closed recursive schema (R-1027: exact keys and types, `version: 1`, FEAT
  IDs, 40-hex commits, the rail's ID grammar, status/mark/rating enums, 64-hex SHA-256, real calendar
  dates, one assessment per feature, each row once per stamp); no ASCII digit in any prose field
  (R-1023); no `solid` while an OWN stamped row is planned, untested or violated (R-1024); and rebuilds
  each stamp from the ledger at its stamped commit read with `git show <full-hash>:REQUIREMENTS.md`
  through the injectable runner (R-1026) — the row set, each row's own-or-shared mark, status and
  fingerprint, and the feature's purpose and status. An unknown commit is a problem naming the commit
  and saying "fetch full history". Fingerprint: SHA-256 over `JSON.stringify([id, requirement,
  status])` of the normalised row (R-1020, R-1022: LF and CRLF/trailing-space ledgers give equal
  fingerprints).
- [ ] **B. Tests** in `packages/nana-pack/tests/product-report.test.mjs`: each row's clause pinned,
  including the two-commit history test of CHANGE §4 (stamp against the first commit while the second
  is checked out; a spy on the runner sees `git show <full-hash>:REQUIREMENTS.md`) and the duplicate-
  feature and duplicate-row cases; plus one suite check that `validateStore()` on the real repo returns
  `[]` (no store file yet → valid). Flip R-1020, R-1022, R-1023, R-1024, R-1026 and R-1027 to
  `implemented` with markers and exact evidence — only rows whose clauses the tests pin.
- [ ] **C. The seat's acceptance script** `docs/reviews/product-report-2026-10-11/seat-verify-report.mjs`
  (frozen) now has 11 store cases that fail; it must print `0 mismatch(es)`.

Mutation pairs, red then green: trust the stored stamp instead of rebuilding it; read the checked-out
ledger instead of `git show`; allow a second assessment for one feature; drop `planned` from the solid
check; skip the digit check; skip normalisation before fingerprinting.

Then: `npm run req:tree`, `npm run map:check`, `npm run readme:check`, `npm run test:locked` (must
pass; report the summary line), `node docs/reviews/product-report-2026-10-11/seat-verify-report.mjs >
docs/reviews/product-report-2026-10-11/seat-verify-report-output.txt 2>&1` (must exit 0), commit with
explicit paths. Frozen: `CHANGE.md`, the seat script, `HANDOFF.md`, `docs/sessions/`, `prototype/`.
Report ≤ 25 lines, first line `VERDICT: …`, checklist ticked.
