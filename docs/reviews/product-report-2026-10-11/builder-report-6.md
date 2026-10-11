VERDICT: PARTIAL

- Commit: `5e35a00` — `product-report: render readable routed views`.
- Files: `REQUIREMENTS.md`, `scripts/product-report.mjs`, `scripts/product-report/template.html`, `packages/nana-pack/tests/product-report.test.mjs`, `docs/product-report/assess-brief.md`, and three review evidence files.
- [x] A–C: Added routed views, text-only DOM rendering, safe hash lookup, and an inline copy of the exported renderer.
- [x] D–F: Reworked rendered-view tests; added the dirty-ledger packet refusal and guidance; mapped the renamed R-291 test.
- Rows: R-1014–R-1019, R-1028, R-1029; R-291 title map.
- Mutation pairs: Not run; this is the remaining brief item.
- Checks: `req:tree`, `map`, `map:check`, `readme:check`, and product-report tests passed (exit 0).
- Locked suite: 135 files; 134 PASS, 0 FAIL, 1 SKIP; 6,755 checks passed, 5 skipped.
- Report: Ran twice; HTML bytes matched. Packet generation wrote 12 packets after commit.
- Seat report, last two lines:
  `ok   packets: refused while REQUIREMENTS.md differs from HEAD: true/0 (want true/0)`
  `seat-verify-report: 0 mismatch(es)`
- Seat test map, last two lines:
  `ok   replaced: R-291: every real heading's committed IDs survive expansion and leaf counts total 1,024 → R-291: every real heading's committed IDs survive expansion and leaf counts total 1,043`
  `seat-verify-tests: 0 gap(s)`
- Most likely wrong: R-1016’s test checks each row ID and article count, but text tokens can match elsewhere in the rendered page rather than that specific row.
