1. **MUST — The extra-heading proof is underspecified and can fail for unrelated reasons.**  
   **Evidence:** `plan.md:72,76` adds only a FEAT heading and purpose. An in-memory probe produced 77 headings but a missing-`Status:` problem, so R-1158 cannot pass. Even a valid added feature changes the outline; `packages/nana-pack/tests/requirements-tree.test.mjs:35-37` still compares against the committed outline. The file has no assertion-selection mechanism.  
   **Fix:** Specify an unused FEAT ID, valid capability placement, purpose and `Status: active`. Record the exact named assertions’ results separately from unrelated outline failures, or provide a temporary matching outline. Do not treat whole-file exit status as mutation evidence.

2. **MUST — M2 promises parse equality but compares only four heading fields.**  
   **Evidence:** `plan.md:34,75` compares ID, line, level and purpose. The parser also records labels, parents, rows, status, `statusLines`, `alsoAppliesLines`, `firstMarkdownTableLine` and capability-field locations (`scripts/requirements-tree.mjs:53,100-110,134-135`). A CRLF-only corruption of those fields can escape that comparison while both problem lists remain empty.  
   **Fix:** Compare the complete normalized parse, or explicitly enumerate all semantic and location fields. Preserve problem-list equality and the existing malformed fixture. Alternatively, narrow R-3681’s wording to exactly the four fields tested; do not claim identical parses.

3. **SHOULD — Make the LF baseline explicit on CRLF checkouts.**  
   **Evidence:** `packages/nana-pack/tests/requirements-tree.test.mjs:22,24,315,379` parses checkout bytes directly and constructs only a CRLF copy. Comparing `actual` with that copy on Windows can compare CRLF against CRLF. `plan.md:34` says “LF parse” without specifying normalization.  
   **Fix:** Derive LF text with `ledger.replace(/\r\n/g, "\n")`; derive CRLF from that text. Run the equivalence check with both LF and CRLF source inputs.

4. **SHOULD — Three populated levels prevent emptiness, not fixture substitution.**  
   **Evidence:** The override at `packages/nana-pack/tests/requirements-tree.test.mjs:22` accepts any file. An in-memory three-heading CAP/FEAT/SUB fixture passed the proposed ID/line comparison, all-level presence and purpose checks, with zero structural problems. Other existing checks would reject that fixture, so this is not a whole-file bypass.  
   **Fix:** Keep the canonical-ledger check unconditional; exercise overrides separately as explicit fixture runs. At minimum, state that all-level presence is an emptiness guard, not proof that the real ledger was checked.

5. **SHOULD — Strengthen the oracle’s mutation evidence and preserve its independence.**  
   **Evidence:** `plan.md:73` drops every level-3 heading. The all-level guard alone catches that, even if ID/line equality is broken. `plan.md:35` also permits sharing a private parser helper, risking correlated recognition failures. Current ledger headings match the broad scan; no fenced tree headings or fourth-level headings were found. The parser’s actual recognition regex is substantially stricter (`scripts/requirements-tree.mjs:18`).  
   **Fix:** Retain the deliberately broader, test-local scan. Add mutations dropping exactly one heading while retaining all levels, and changing one heading’s ID or line without changing count. Record exact mutation diffs and the named assertion that fails.

**Other checks:** The planned paths classify as `ordinary`. Repository searches found no additional real-ledger heading-count literal requiring a bump. No repository files changed; no full suite ran.

**Totals: 2 MUST, 3 SHOULD.**
