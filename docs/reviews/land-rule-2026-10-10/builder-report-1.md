VERDICT: PARTIAL

Commit: `eb937f8` — `land-rule: enforce reviewed land authorization`

Files: `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/code-map.md`, `packages/nana-pack/{README.md,bin/nana-land.mjs,bin/review-round.mjs,tests/land.test.mjs,tests/land-rule.test.mjs,tests/review-ledger.test.mjs,tests/requirements-tree.test.mjs}`, `templates/_shared/working-under-nana-pi.md`, `AGENTS.md`.

Rows: reworded R-976, R-977, R-588, R-731, R-969, R-970, R-992; retired R-978; added R-1002–R-1011 except R-1009? **R-1009 included; R-1010 included.** R-969/R-1010 tests cover raw last-line parsing and malformed verdicts; R-1008/R-992 cover per-verdict records and reads; R-970 covers per-verdict reporting. The acceptance-matrix test pins R-975–R-977 and R-1002–R-1007, R-1009, R-1011. R-731 remains untested.

Verification: `npm run req:tree` (0); `npm run map` (0); `npm run map:check` (0); `npm run readme:check` (0); `npm run template:accept` (0, no summary emitted); `npm run test:locked` (0); seat acceptance script (0).

Suite summary: `134 files: 133 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6657 pass, 0 fail, 5 skip · 597.5s`

Mutation pairs: none performed.

Scope: `git diff --stat 661f76e..HEAD` — 12 files changed, 220 insertions(+), 455 deletions(-).

Seat output, last two lines:
```text
ok   the pre-change ledger code refuses a tally holding version-2 records: refused (want refused)
seat-verify-land: 0 mismatch(es)
```

Not done: mutation proofs; committing the seat output file (kept in the OS temp directory); HANDOFF/session edits (seat-owned). FEAT-008’s purpose and share lines were left unchanged as instructed.

Most likely wrong claim: the acceptance matrix demonstrates the lock interleavings comprehensively; mutation testing did not independently verify those cases.
