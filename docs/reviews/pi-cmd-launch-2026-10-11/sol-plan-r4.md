## MUST

1. **Doctor refusal severity remains unpinned.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:68,120-125,175-181`  
   **Evidence:** The design requires FAIL on the real home and NOTE otherwise. R-1035 only requires “not OK,” and verification declares one refusal case without selecting either home mode. An implementation returning NOTE in both modes would pass the declared test.  
   **Smallest fix:** Add the FAIL/NOTE distinction to R-1035. Add real-home and override-home refusal cases that assert severity, exit behavior, named character, and no spawn.

## SHOULD

1. **The real-shim PATH setup contradicts itself.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:182-190`  
   **Evidence:** Line 186 says PATH contains only the temporary prefix. Lines 187-188 say the prefix is prepended to inherited PATH. Following line 186 reproduces the round-three failure because the shim cannot find Node.  
   **Smallest fix:** Replace “PATH is set to that prefix” with “the prefix is prepended to inherited PATH.”

## NOTE

- The attached internal-command finding is closed. R-1038 covers leading spaces, empty words, case-insensitive matching, and all four attached separators.
- The declared tests pin `dir/Z`, `cd\nowhere`, `cd..`, `echo.text`, blank input, and leading whitespace.
- The extension-case finding is closed. The rows require case-insensitive comparisons, and tests cover `pi.CMD` and `PI.EXE`.
- The real-shim test now asserts discovery before invocation and preserves Node through inherited PATH, aside from the contradictory sentence.
- Rare residual: whitespace other than spaces and tabs remains outside the classifier grammar.
- Rare residual: an omitted internal command can still be reported as missing. The declaration states this explicitly and never turns failure into success.

**Score: 8/10.** Three round-three findings are closed. Doctor refusal severity remains outside both its row and executable evidence.

VERDICT: SEND-BACK
