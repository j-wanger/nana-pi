## Land review — `c324e646`

Reviewed this lane’s changes, excluding the already-reviewed main-side merge.

### MUST — A configured look-alike bypasses rejection detection

**Files:** `packages/nana-pack/bin/review-round.mjs:422–423`; `packages/nana-pack/lib/verdict-config.mjs:14`

The table explicitly maps `Ϲ` (U+03F9, Greek capital lunate sigma) to `C`. However, NFKC first converts it to `Σ`, which the table does not fold.

Both inputs below record **LAND** through the real `admit()` → `complete()` path:

```text
VERDIϹT: SEND-BACK
notes
VERDICT: LAND
```

```text
VERDICT: LAND
VERDIϹT: SEND-BACK
```

Both should record an empty verdict. This is not the declared outside-table residual: the original character explicitly appears in the configured table.

**Smallest fix:** add the normalized counterpart to the detection table, preserving raw-line acceptance. Add regression cases for both branches. Ideally, test every configured substitution through canonicalization; the prototype shares this defect, so prototype agreement cannot expose it.

### SHOULD — Document ignored middle verdicts precisely

**File:** `packages/nana-pack/README.md:177`

The paragraph mentions unsupported middle-only verdicts, but omits the declared residual where a selected final verdict overrides a middle rejection.

For example, `notes\nVERDICT: SEND-BACK\nVERDICT: LAND` records LAND.

**Smallest fix:** state explicitly that selecting the final line checks the first line for conflict, not intermediate lines.

### NOTE — Requirements and verification

- `REQUIREMENTS.md:433–434`: both rows contain one `shall`. Their cited tests cover accepted forms and refusal paths, respectively.
- `packages/nana-pack/lib/verdict-config.mjs:1–16`: six-tag header, dated rationale, named export, and externalized vocabulary are present.
- `docs/sessions/2026-10.md:5–13`: the recorded build history matches the committed reports. The normalization/folding claim needs the MUST fix.
- No additional blocker found in the HANDOFF changes.

**Independent checks:**
- Review-ledger tests: **154 passed**, exit 0.
- Seat acceptance: **64/64 passed**.
- In-checkout corpus: **338 files**, zero prototype mismatches; 330 accepted, eight empty.
- Test-title check: **zero gaps**.
- Working tree unchanged.

The external yokai-world corpus and full suite were not rerun. The mutation runner was inspected, not executed against the immutable checkout.

**Score: 7/10.** The ordinary first-line recovery works, but a configured rejection disguise still records LAND.

VERDICT: SEND-BACK
