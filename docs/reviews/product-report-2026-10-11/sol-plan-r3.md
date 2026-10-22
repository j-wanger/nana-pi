## MUST

1. **The expanded share line still lacks the owner's approval.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:74-83,182-188`  
   `REQUIREMENTS.md:31-37`  
   Round two required approval for the expanded dependency list. The declaration records approval only for the earlier line, then says the owner must re-decide the expanded line. The opening sequence nevertheless says the tree decisions are decided. Tree governance requires the owner to approve every added share.  
   **Smallest fix:** obtain and record the owner's approval of the exact nine-row share line before builder admission. Remove the contradictory “decided” wording until then.

## SHOULD

1. **The packet schema remains incomplete for unassessed features.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:65,177-180`  
   The plan says every packet has an `assessment` matching the store schema. An unassessed feature has no such object. The packet’s exact top-level keys and nullable representation remain unspecified.  
   **Smallest fix:** declare the exact packet object, including `version`, feature data, differences, and `assessment: null | <assessment object>`. Pin both stale and unassessed packets.

2. **The historical assessment baseline remains inferred rather than recorded.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:126-130`  
   `docs/reviews/product-report-2026-10-11/factcheck.md:174,228`  
   Three matching counts make the selected commit persuasive, but the prototype recorded no baseline. The fact-check calls the commit “right or very near,” while the declaration calls it the ledger the assessments were written against.  
   **Smallest fix:** preserve the inference explicitly as migration provenance, or provide stronger evidence establishing the exact commit. Do not describe inference as recorded fact.

3. **Purpose-only and status-only staleness lacks an explained difference.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:57,153-156`  
   The report marks purpose or feature-status changes stale, but the requirement only demands names for changed rows. A refresh packet can therefore say “out of date” without identifying the non-row cause.  
   **Smallest fix:** require the report and packet to name changed feature purpose or status alongside row differences.

## NOTE

- All six substantive round-two design defects are otherwise closed: historical reconstruction, recursive schema validation, the dropped citation row, parser separation, planned-row rejection, and expanded dependency discovery.
- The two-commit test now distinguishes historical parsing from checked-out parsing and covers missing history.
- The raw-entry split preserves frontier’s permissive tag behavior while giving the report its stricter title grammar.
- The recursive schema now closes duplicate feature and duplicate stamp-row paths.
- The revised row total of 1,043 is correct.
- `docs/reviews/product-report-2026-10-11/CHANGE.md:194` still mentions an ID check that was deliberately dropped. This is harmless verification-text residue.
- Canonical fingerprint serialization remains unspecified. Using a JSON tuple or length-prefixed fields would remove delimiter ambiguity.
- A calendar-validity check for assessment dates would be stronger than a format-only date check.

**Score: 9/10.** The plan is buildable after the exact expanded share line receives approval and the declaration records it.

VERDICT: LAND-WITH-FIXES
