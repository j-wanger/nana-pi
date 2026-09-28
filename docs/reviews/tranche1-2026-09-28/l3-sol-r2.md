Reviewed `3996c98` + `a5c05ca`; only targeted probes under a temporary `HOME`.

1. **R1 #1 HIGH — PARTIAL** (`nana-handoff.ts:140-165`): default/under-home paths are fixed, but legal custom paths can still become unreadable.
2. **R1 #2 HIGH — FIXED** (`AGENTS.md:102-107`): guidance now names the user store and rejects maintaining repo `.pi/handoff.md`.
3. **R1 #3 MED — RULED** (`README.md:236-243`): wording honestly reflects Jake’s L5 ruling; no in-session line is correct.
4. **R1 #4 MED — FIXED** (`nana-handoff.ts:306-322`): missing provenance is explicitly journaled beside the successful write.
5. **R1 #5 LOW — FIXED** (`nana-handoff.ts:214-218`): fatal decoding prevents corrupt text injection and journals failure.
6. **R1 #6 LOW — RULED/SUBTRACTED** (`README.md:251-255`): default-store refusal removed; custom-path refusal retained.
7. **R1 #7 LOW — FIXED** (`README.md:231-235`): exact value and descendant inheritance are documented.

**NEW / remaining fold defects**
- **HIGH** (`nana-handoff.ts:157-165`): `…/<tail>` is not resolvable. Temp-HOME probe confirmed pi resolves it as `<cwd>/…/<tail>`, not the actual external custom path.
- **HIGH** (`nana-handoff.ts:158-165`): a legal 255-character basename still gets truncated at 300; the “basename always intact” claim is false.
- **MED** (`nana-handoff.ts:64-68,208`): an in-project literal `~/handoff.md` is emitted unchanged; pi expands it to `$HOME/handoff.md`, not `<cwd>/~/handoff.md`.
- A root custom path has no basename but remains `/`; since it is a directory, it cannot produce a valid stale handoff. No added defect.
- Strict UTF-8 does drop Latin-1/UTF-16 files, but README now defines non-UTF-8 as invalid and the writer emits UTF-8; no defect under that contract.
- L5 seam caveat: `raw == null` (`nana-handoff.ts:250`) also means read/decode failure, not merely absence. L5 must use a discriminated missing/error result.

**CARRY for astra**
- Require every stale pointer to provide a genuinely actionable locator; test ellipsis, 255-byte basenames, and leading literal `~`.
- L5 must check repository root, dismissal marker, and `OBJECTIVE.md`, and must not interpret pickup failure as “unadopted.”
- Win32 rename replacement remains unverified.

VERDICT: BLOCK
