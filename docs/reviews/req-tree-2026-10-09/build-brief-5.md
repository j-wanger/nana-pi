# Lane req-tree — continuation 4: close sol build-review r3 (SEND-BACK 6/10; the cap is reached)   (2026-10-09 · feat/req-tree)

Contract unchanged. Read `sol-build-r3.md`. All r1 and r2 findings are closed; two named holes
remain. Change NOTHING else.

1. **R-291 equality regression.** Commit `54cc87f` deleted
   `check("R-291: committed outline equals a fresh render", map === actual.outline, …)` from
   `packages/nana-pack/tests/requirements-tree.test.mjs`. Restore an R-291-marked check asserting
   the committed `docs/requirements-tree.md` equals `renderOutline` of the real ledger, byte for
   byte. Keep the field checks. Mutation pairs (on scratch copies or by breaking the code, never an
   assertion): append a line to a scratch copy of the outline → the equality check fails; make the
   renderer emit `Purpose: MUTATED` → the test fails; restore → green.
2. **`prove.mjs` accepts trailing bytes on the new rows** (`prove.mjs` ~lines 90–94 compare only
   cells 1–2, then accept the whole line). For R-287–R-291 the line must be exactly
   `| <ID> | <Requirement> | implemented | <Evidence> |`: four cells, nothing before the first pipe
   or after the last, ID and Requirement equal to `new_rows`, Status exactly `implemented`,
   Evidence non-empty and citing `packages/nana-pack/tests/requirements-tree.test.mjs::`. Negative
   proof runs on scratch copies in the OS temp dir: trailing bytes after R-291's closing pipe; a
   fifth cell; Status `untested`; empty Evidence — each exits 1; the real ledger exits 0.
3. `npm run req:tree` (no diff expected), `npm run map:check`, the proof, `npm run test:locked`.

Same NOT, allowlist and frozen inputs; this brief is frozen too. Report ≤ 25 lines, first line
`VERDICT: DONE | PARTIAL | BLOCKED`, with each mutation's red/green, the prove and suite summary
lines, and the one claim most likely wrong.
