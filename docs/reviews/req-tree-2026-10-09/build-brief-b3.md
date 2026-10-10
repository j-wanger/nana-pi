# Lane req-tree — increment B, continuation 2: close sol build-b r2 (SEND-BACK 8/10; the next review is the last)   (2026-10-10 · feat/req-tree)

Read `sol-build-b-r2.md`. Every r1 finding is closed; one hole remains. Change nothing else.

**`prove.mjs` accepts reordered governed rows** (~lines 150–160). Today a line whose EXPECTED text is
one of R-287–R-294 is accepted if the actual line is any valid governed row, so swapping R-292 and
R-293 passes. Fix: at each expected position, the actual line must carry the SAME ID and the SAME
Requirement cell as the expected line; only the Status and Evidence cells may differ, and they must
pass the existing validation (canonical four cells, `implemented`, evidence citing
`packages/nana-pack/tests/requirements-tree.test.mjs::`). Every other line is compared whole.

Then: the proof `--approved 6b9202a501a7fe03dfc834ab34cdfc212f6d92ce --inputs 8c2ec5274662850a6e8173b5ef048aaf5b191548`
(save to `prove-output.txt`), `npm run map:check`, `npm run test:locked`, and
`bash docs/reviews/req-tree-2026-10-09/seat-verify-b.sh` (it now includes the swap attack) — paste
the output VERBATIM; every line as wanted.

Rules, NOT and allowlist as `build-brief-b1.md`. Report ≤ 25 lines, first line `VERDICT: …`, with
the verbatim script output, the proof and suite summary lines, and the one claim most likely wrong.
