## Land review — `eab842a`

### MUST

None. The round-two blocker is closed.

### SHOULD

None blocking acceptance.

### NOTE

- **`packages/nana-pack/bin/review-round.mjs:434` — position check is correct.**  
  `nonblank.length > 1` distinguishes separate lines even when their text matches. Identical marked, quoted, indented and bold endpoints now record empty verdicts. Identical plain endpoints and single marked verdicts remain accepted. No further fix needed.

- **`packages/nana-pack/tests/review-ledger.test.mjs:233–255` — regressions cover the reported bypass.**  
  The focused suite passed **155 checks**. Seat acceptance passed **77/77 cases**, plus every configured-table probe.

- **`REQUIREMENTS.md:433–434` — the contract remains aligned.**  
  Both rows retain one `shall`. Their cited tests cover selection, raw-line acceptance, canonicalization and refusal. The configuration header and provenance remain accurate.

- **`packages/nana-pack/README.md:177` — declared residuals remain explicit.**  
  I found no new rejection-to-LAND path outside those residuals. The position fix does not reopen the Unicode or first-line-grammar findings.

- **`docs/reviews/verdict-position-2026-10-11/seat-mutate.py:24,31` — historical mutation evidence is not reproducible unchanged on this tip.**  
  Two anchors still reference `first !== final`; both now match zero occurrences. The committed 17/17 result therefore describes the earlier build. Smallest follow-up: update those anchors and rerun when refreshing mutation evidence. This does not undermine the independently passing regression tests.

### Verification boundaries

I reran the seat script with corpus paths redirected into this immutable checkout: **338 files**, **zero prototype mismatches**, 330 accepted and eight empty.

I did not rerun the external yokai-world corpus, mutation runner or full suite. The checkout remained unchanged.

**Score: 9/10.** The product blocker is fixed; only historical verification-script drift remains.

VERDICT: LAND
