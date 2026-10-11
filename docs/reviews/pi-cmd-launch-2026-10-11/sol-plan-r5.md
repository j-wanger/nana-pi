## MUST

None.

## SHOULD

None.

## NOTE

1. **Doctor refusal severity is closed.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:68,120-123,179-181`  
   **Evidence:** R-1035 requires FAIL on the real home and NOTE under `--home`. Both cases assert severity, the named character, no spawn, and the real-home non-zero exit.  
   **Smallest fix:** None.

2. **The real-shim PATH contradiction is closed.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:187-191`  
   **Evidence:** The test now only prepends the temporary prefix to inherited PATH, preserving access to Node. Discovery must resolve to the temporary `pi.cmd` before invocation.  
   **Smallest fix:** None.

**Score: 10/10.** Both round-four findings are closed with testable requirements and verification cases.

VERDICT: LAND
