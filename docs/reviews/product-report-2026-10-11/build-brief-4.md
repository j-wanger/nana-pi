# Lane product-report — build round 4: staleness on the page, and the 38 assessments (2026-10-11 · feat/product-report)

Round 3 built `validateStore`; the seat's acceptance script passes all 33 of its earlier cases. Three
items this round; do all three before you report.

- [ ] **A. Staleness in the model and on the page (R-1021).** `buildReport({ root })`'s model gets a
  flat `features` list; each entry carries `id`, `assessmentState` (`"current"` | `"out of date"` |
  `"unassessed"`) and `differences` = `{ added: [ids], removed: [ids], changed: [ids], purpose: null |
  { was, now }, status: null | { was, now } }`, computed by comparing the stored stamp with the
  CURRENT ledger: a row added to or removed from the covered set (own + shared), a row whose
  fingerprint or own-or-shared mark changed, a changed feature purpose or status. The page shows each
  feature's state and names every difference. A feature with no assessment is unassessed (R-1028).
  Tests pin each kind of difference; flip R-1021 to `implemented`.
- [ ] **B. Migrate the 38 assessments** from `docs/reviews/product-report-2026-10-11/prototype/assess.json`
  into `docs/product-report/assessments.json` under CHANGE §3's schema: stamp each against
  `c4332ecb9b9d22d45083fb52b9631c5f1b41fa67` (computed by the module from the ledger at that commit,
  never by hand); keep each field's meaning but rewrite every sentence that holds a digit or an ID so
  it holds neither (say "most rows", "a few", "the desk features" — never invent a fact the original
  did not state); FEAT-011 and FEAT-015 drop from `solid` to `mostly solid` (each had untested own rows
  at that commit — `validateStore` must agree, and if it flags any other `solid`, lower that one too
  and list it); `written_by`: "seat workflow, 2026-10-10"; `checked_by`: "fact-check workflow,
  2026-10-10; stamp commit inferred from matching counts at migration"; `date`: "2026-10-10". Drop the
  prototype's `corrections` and `synth`. `validateStore()` on the repo must return `[]`. Expect many
  features to show out of date: the ledger changed since that commit, and that is the honest state.
- [ ] **C. The seat's acceptance script** (frozen) now has 13 more cases (staleness and the real
  store); it must print `0 mismatch(es)`.

Mutation pairs, red then green: ignore the own-or-shared mark → the move-home case; ignore purpose or
status → their cases; compare only fingerprints, not the covered set → the share-added case.

Then: `npm run req:tree`, `npm run map:check`, `npm run readme:check`, `npm run test:locked` (must
pass; report the summary line), `npm run report` (report how many features are current, out of date
and unassessed), the seat script into its output file (exit 0), commit with explicit paths. Frozen:
`CHANGE.md`, the seat script, `HANDOFF.md`, `docs/sessions/`, `prototype/`. Report ≤ 25 lines, first
line `VERDICT: …`, checklist ticked.
