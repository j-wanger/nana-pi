# Lane product-report — build round 11: the final reviews' findings (2026-10-11)

sol r1 (`sol-r1.md`, SEND-BACK 6/10) and astra r1 (`astra-r1.md`, SEND-BACK 6/10). Threat model and
lane class as in `review-brief.md`. If a row must be split, new IDs come from **R-1043–R-1049** (this
lane's range; R-1033–R-1039 belong to pi-cmd-launch). Do every item:

- [ ] **A (astra M1) — the feature filter.** The Requirements view deduplicates rows before filtering,
  so a row is credited to the first feature that mentions it and filtering by its owner (or a later
  receiver) can hide it — 59 rows in the real ledger. Filter a feature's own and shared-in rows FIRST;
  deduplicate only for "All". Suite test that drives the select's change handler: an earlier receiver,
  the owner and a later receiver each see the row.
- [ ] **B (sol MUST 1 + astra M3) — the refresh guide.** `assess-brief.md` must say to copy
  `packet.feature.id` into the candidate's `id`, and to replace the feature's entry when one exists or
  append one when it does not. Give one complete candidate example. A suite test follows the guide's
  recipe literally from a generated packet (stale AND unassessed) and validates the result clean.
- [ ] **C (sol S1 + astra S2) — Issues pills.** Keep `status` in the violated-row projection; assert
  each Issues card shows the `violated` pill text and no `undefined`.
- [ ] **D (sol MUST 2–6 + astra M2) — evidence that pins each clause.** For R-1013, R-1014, R-1015,
  R-1016, R-1018, R-1021, R-1027, R-1029, R-1030 and R-1042: with small fixtures holding DISTINCT values,
  assert exact text inside the right rendered card or section (not page-wide word sets); check count
  and bar values; drive handlers; run the page bootstrap through a stub for the scroll-after-hashchange
  row; port the seat's staleness cases (row added, removed, text changed, status changed) into the suite
  and assert the rendered difference section names them; compare the whole packet filename set with the
  model's stale/unassessed features and every packet byte for byte across two runs; add an unknown-kind
  ask refusal naming its line; cite the closed-schema violation matrix on R-1027. A clause you cannot pin
  in this suite (for example phone-width wrapping or monospace size) moves out of `implemented`: split it
  into its own row (`untested`, R-1043 onward) with the reason in Evidence. Never leave an unpinned
  clause under `implemented`.
- [ ] **E (astra S1) — one stale recommendation.** The installation feature's migrated assessment
  recommends deferring Windows tests; the owner requires Windows testing now (2026-10-10). Refresh that one
  assessment through the guide's own loop (packet → candidate with the packet's stamp → validate), as the
  first real use of it. Beside the `current` badge, say in plain words that "current" means "matches the
  stamped ledger", not "rechecked against later decisions".
- [ ] **F (astra S3).** README and HANDOFF wording: full git history is needed for the SUITE's historical
  stamp check, not for `npm run report` itself. (The seat edits HANDOFF; you edit the README only.)

The seat's acceptance script (frozen) has three new cases; two fail at launch
(`seat-verify-report-r11-launch.txt`). Then `npm run req:tree`, `npm run map:check`,
`npm run readme:check`, `npm run test:locked` (summary line), `npm run report` twice (identical bytes),
the seat script and title check into their output files, and
`python3 docs/reviews/product-report-2026-10-11/seat-mutate.py > docs/reviews/product-report-2026-10-11/seat-mutate-output.txt 2>&1`
(21/21 red; on `ANCHOR`, name it, do not edit the script). Commit with explicit paths. Report ≤ 25
lines, first line `VERDICT: …`, checklist ticked, each row's status after this round, the last two
lines of each output file verbatim.
