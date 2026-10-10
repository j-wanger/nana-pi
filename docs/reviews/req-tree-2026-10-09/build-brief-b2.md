# Lane req-tree — increment B, continuation 1: close sol build-b r1 (SEND-BACK 6.5/10)   (2026-10-10 · feat/req-tree)

Contract: `CHANGE-B.md` (now with §8, amendment B-A1). Read `sol-build-b-r1.md` and
`sol-build-b-r1-response.md`. **INPUTS moved to `8c2ec5274662850a6e8173b5ef048aaf5b191548`**
(`fixed-text-b.md` changed: one sentence of "How this file is organized"). BASE is unchanged
(`6b9202a501a7fe03dfc834ab34cdfc212f6d92ce`). The ledger rows were right; the holes are in the proof
and the checker. Change nothing else.

1. **Proof heading set** (sol MUST 1, `prove.mjs` ~66–81): compare the COMPLETE ordered arrays of
   capability, feature and subgroup IDs in `tree-b.json` against BASE's `tree.json` — no filtering.
   An added, removed or reordered heading fails.
2. **Duplicate metadata lines** (sol MUST 2, `scripts/requirements-tree.mjs` ~79–82): collect every
   `Status:` and every `Also applies:` line per feature. More than one of either is a problem, named
   by line. Every listed ID on every `Also applies:` line is validated (R-292).
3. **Independent R-291 field check** (sol MUST 3, ~270, ~290): `checkOutlineFields` must not call
   `renderOutline` or any helper the renderer uses to build text. Derive each expected field (ID,
   label, purpose, parent, row count, row IDs, feature status, feature shares) and the index (row,
   home, listers, count, order) from the PARSED LEDGER, then compare with the parsed OUTLINE text.
   Add a test that a deliberately broken renderer (e.g. one dropping a status or a lister) is caught
   by the field check alone.
4. **Test** (sol SHOULD 1): a fixture removing one sharing feature from a multi-feature index row
   makes the field check fail.
5. Re-render the ledger (the governance sentence changed) from BASE + new INPUTS; `npm run req:tree`;
   section map; `npm run map`.
6. Run: the proof `--approved 6b9202a501a7fe03dfc834ab34cdfc212f6d92ce --inputs 8c2ec5274662850a6e8173b5ef048aaf5b191548`
   (save to `prove-output.txt`), `npm run map:check`, `npm run test:locked`, then
   `bash docs/reviews/req-tree-2026-10-09/seat-verify-b.sh` — paste its output VERBATIM. Every line
   must read as wanted; fix the code, never the script.

Rules, NOT and allowlist as `build-brief-b1.md`. Mutation breaks code or scratch copies, never an
assertion. Report ≤ 30 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`, with the verbatim
script output, the proof and suite summary lines, and the one claim most likely wrong.
