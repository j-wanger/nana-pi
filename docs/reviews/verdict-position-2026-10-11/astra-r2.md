## Land review — `1146c7d`

### MUST — Identical first and final text bypasses the plain-first-line check

**File:** `packages/nana-pack/bin/review-round.mjs:434`

`first !== final` compares line contents, not line positions. When separate first and final lines contain identical text, the parser skips first-line validation.

Through the real `admit()` → `complete()` path, this records **LAND**:

```text
`VERDICT: LAND`
body
`VERDICT: LAND`
```

Identical bold, indented and hash-prefixed verdict lines also record LAND. All four should record an empty verdict under R-969 and CHANGE §4.

This leaves sol’s round-one first-line-grammar finding partially open. The new regressions use different first and final text, so they miss this case.

**Smallest fix:** replace `first !== final` with `nonblank.length > 1`. Add regressions for identical non-plain first and final lines. Preserve acceptance of a single marked final verdict.

### SHOULD

None additional.

### NOTE — Other round-one findings are closed

- **`packages/nana-pack/bin/review-round.mjs:422–424`**: folding before and after NFKC closes the configured lunate-sigma bypass.
- **`packages/nana-pack/tests/review-ledger.test.mjs:260–286`**: both lunate-sigma branches, post-normalization folding and the whole-table invariant have tests.
- **`REQUIREMENTS.md:433–434`**: both rows contain one `shall`. R-969 now cites canonicalization evidence and states the amended transformation order.
- **`packages/nana-pack/lib/verdict-config.mjs:10–15`**: “selected visual look-alikes” accurately describes the table, including its Cherokee entries.
- **`packages/nana-pack/README.md:177`**: the ignored-middle-verdict residual is explicit and its example matches the parser.
- **`docs/sessions/2026-10.md:5–13`**: the build history matches the committed evidence, but the claim that first lines always receive plain-form validation needs the MUST fix.

I found no additional rejection-to-LAND case outside the declared residuals. The remaining blocker violates the explicitly amended first-line contract.

### Independent verification

- Review-ledger suite: **155 checks passed**.
- Seat acceptance: **72/72 cases passed**, plus configured-table probes.
- In-checkout corpus: **338 files**, zero prototype mismatches; 330 accepted, eight empty.
- Test-title coverage: **zero gaps**.
- Four additional identical-endpoint probes reproduced the MUST finding.
- Working tree unchanged.

The external 76-file yokai-world corpus, mutation runner and full suite were not rerun.

**Score: 8/10.** The Unicode fix is sound; first-line validation still has one uncovered bypass.

VERDICT: SEND-BACK
