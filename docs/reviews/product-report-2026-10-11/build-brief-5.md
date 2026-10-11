# Lane product-report — build round 5: refresh packets and the refresh guide (2026-10-11 · feat/product-report)

Round 4 landed staleness and the 38 migrated assessments; the seat re-ran the acceptance script
(0 mismatches) and `validateStore()` (clean). This is the last build round. Do every item before you
report.

- [ ] **A. Packets (R-1029, CHANGE §4 "Packets", including the seat amendment).**
  `node scripts/product-report.mjs [--root <dir>] --packets <dir>` (update the usage line): create
  the directory when absent; accept an empty one; refuse a non-empty one with a non-zero exit and
  write nothing. Write exactly one `<feature id>.json` per feature that is out of date or unassessed
  (none for a current one), each exactly
  `{ version: 1, feature: { id, label, purpose, status }, rows: [ { id, mark, requirement, status, evidence } ], assessment, differences, stamp }`
  — current purpose, status and rows (own and shared, marked), the stored assessment or `null`, the
  R-1021 differences (empty arrays and `null`s for an unassessed feature), and `stamp`: the feature's
  stamp at `HEAD`, built from `git show HEAD:REQUIREMENTS.md` by THE SAME function `validateStore`
  uses to rebuild a stamp (extract it; do not write a second stamp builder). Serialise
  deterministically (`JSON.stringify(packet, null, 2) + "\n"`, rows in ledger order), so two runs at
  one commit give identical bytes. Reword R-1029 to CHANGE §2's current text. Tests in
  `product-report.test.mjs` pin a stale packet, an unassessed packet, a current feature with no
  packet, the refusal, determinism, and the round trip (a store built from each packet's prose plus
  `packet.stamp` validates clean); flip R-1029 to `implemented`.
- [ ] **B. `docs/product-report/assess-brief.md`** (CHANGE §3): the refresh loop any seat runs with
  any model, in plain steps — generate packets into `docs/product-report/out/packets` (ignored);
  for each packet, write a candidate: the store's prose fields, judged from the packet's rows, plus
  `"stamp": <the packet's stamp>`; replace that feature's entry in `assessments.json`; run the report
  test; fix what it names; when a second model is available, have it check each candidate against
  its packet. State the rules the suite enforces (no digits or IDs in prose, `solid` never with an
  own row planned, untested or violated, the closed schema). Every command it names must run as
  written. Link it from the root README's "Product report" section, and add `--packets <dir>` to
  that section's option list.
- [ ] **C. The seat's acceptance script** (frozen) now has 21 packet cases that fail at launch
  (`seat-verify-report-r5-launch.txt`); it must print `0 mismatch(es)`.

Mutation pairs, red then green — break the CODE, never an assertion: write packets for current
features too → the "no packet" case; skip the non-empty refusal → its case; drop `stamp` or build it
from the working tree instead of `HEAD` → the round-trip or HEAD case; unsorted or nondeterministic
rows → the byte-identical case; drop shared rows from a packet → the unassessed rows case.

Then: `npm run req:tree`, `npm run map`, `npm run map:check`, `npm run readme:check`,
`npm run test:locked` (must pass; report the summary line and total check count), `npm run report`
twice (identical bytes), the seat script into
`docs/reviews/product-report-2026-10-11/seat-verify-report-output.txt` (exit 0), commit with explicit
paths. Frozen: `CHANGE.md`, the seat script, `HANDOFF.md`, `docs/sessions/`, `prototype/`, and every
assessment in `assessments.json` (do not refresh them this round). No suite test runs, imports or
copies a seat script. Report ≤ 25 lines, first line `VERDICT: …`, checklist ticked, the LAST TWO
LINES of the seat output verbatim, and the one claim most likely wrong.
