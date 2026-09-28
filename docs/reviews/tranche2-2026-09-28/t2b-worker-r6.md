**Commit:** `371b410` on `lane/t2b-review-ledger`, not pushed. It touches only `review-round.mjs`, `README.md` and `tests/review-ledger.test.mjs`. `HANDOFF.md` is unchanged.

- **Symlinked `--out`:** reproduced first. A link outside the tree pointing at tracked `f` was admitted, and `f` went from `4f524947494e414c0a` ("ORIGINAL\n") to `564552444943543a204c414e440a` ("VERDICT: LAND\n"). After the fix, the link and a two-link chain are refused before admission with `TRACKED file (→ …/repo/f)`. `f` stays `4f524947494e414c0a`, and nothing is reserved or counted. The new `realOut` resolves the full path, including the last link; a dangling link is followed to where the write would land. The snapshot exclusion now uses the same resolution.
- **`..notes.md`:** before, it was admitted and overwritten. After, it is refused as a tracked in-tree file and left unchanged (`4e4f5445530a`). An untracked `..draft.md` now gets the in-tree warning and is left out of the snapshot. Paths are now compared by segment (new `relUnder`), which also fixes the same `startsWith('..')` bug in the snapshot's skip list.
- **Audit growth:** before, with the audit at 1260000 B, five failed over-cap launches grew it by 296 B each (1261480 B at the end) and it never rotated. After, the first one rotates it (`.1` = 1260000 B, audit = 296 B). Every audit append now rotates first, via `rotateAudit`/`appendAudit`. The README now says outright that the tally grows forever and total storage is not bounded; only the audit is (about 2 MiB).
- **Migration recipe:** I confirmed both jev scripts pass `--retries 2` (lines 11 and 7). It now reads: "replace `pi-review` with `pi-worker` **and delete their `--retries 2`** … A retried worker repeats its file mutations, and under the new N+1 meaning `--retries 2` is **three** mutating attempts … A worker must **not** receive `--item` or `--worker` (`pi-worker` refuses both, before running anything)."
- **Qualifications:**
  - The slug docs now say "lowercased (JavaScript `toLowerCase`, not Unicode case folding)".
  - The trust model now says a failed ordinary admission "leaves **no durable record**".
  - The round rule is now "A completed verdict earns the round — with one exception" (the unverified completion).
  - Added: the wrappers do not read, pass or enforce `--max-budget-usd`; budget control is external.
- **Assertion at `:306`:** the tally, audit and reservation list are now captured before `check`. A live reservation is planted so "check prunes nothing" can actually be seen.
- **Tests:** all 7 new checks FAIL against the pre-fix `review-round.mjs` and PASS after. The review-ledger suite gives 134 PASS, 0 FAIL. `npm test` exits 0: 69 files, 68 PASS, 0 FAIL, 1 SKIP; 3324 checks pass, 0 fail.
- **Residuals:**
  - The jev scripts, `~/.local/bin/pi-worker` and the external docs are documented, not changed.
  - The staging-independence exception for force-added ignored files that astra named was not in this brief and is not documented yet.
  - The CARRY items in astra's ruling are untouched.
  - The rewritten `:306` check passes on both old and new code, as expected since `check` never mutated. I did not prove it would catch a mutating `check`.
- **Most likely wrong:** `realOut` rethrows `ENOTDIR`/`ELOOP` from `realpathSync`. That refuses admission rather than warning, which I believe is the safe side but did not test.

VERDICT: DONE
