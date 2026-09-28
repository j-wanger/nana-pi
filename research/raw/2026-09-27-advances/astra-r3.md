### Round 3 confirmation

Reviewed current synthesis and `research/raw/2026-09-27-advances/astra-r2.md`; document-only review, no tests rerun.

1. **R2 MUST-FIX: FIXED.** Item 1 now states:
   > “must not silently discard configured restrictions: either the gate keeps the last *validated* permission policy (a validated snapshot that survives a fresh process) or it stops conservatively”

   Its acceptance condition explicitly names both cases:
   > “a custom deny/protected path configured before corruption still holds after corruption AND after a restart”

   The 1+2 acceptance row repeats preservation across corruption/fresh process or conservative stopping with a repair reason. Missing configuration and advisory-block fallback are distinguished from invalid permission configuration.

2. **Both SHOULDs: APPLIED.**
   - Item 4: “build this FIRST; it is the acceptance path for items 1–3 and every later land.”
   - Work preamble applies independent review by **surface**, explicitly enumerates covered items, and maps item 8 to item 5; the acceptance table also includes item 8’s shutdown/CANNOT coverage.

3. **NEW HIGH: None introduced by these edits.**

SCORE: 9/10  
MUST-FIX: None.  
Residuals to carry: Implementation must prove validated-snapshot integrity or conservative stopping, including corruption/restart cases, through canonical tests and independent adversarial review. This verdict approves the synthesis, not implementation safety.  
VERDICT: LAND
