## MUST

1. **The expected-failure path still permits the original fail-open bug.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:498,506-509,520-522`  
   **Evidence:** Verification still says any listed failure becomes XFAIL. It does not require the sealed failure code or check the expiry. This contradicts R-1080 and can hide a new failure behind an old item.  
   **Smallest fix:** Replace those bullets with matching-code and pre-expiry conditions. Add explicit wrong-code and expired-entry cases beside the reporting tests.

2. **The sealed hook table does not contain dispatch forms.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:120-130,459-479`  
   **Evidence:** R-1082 refers to each table row’s platform form, but the displayed table has no macOS, Linux, or Windows form fields. Verification tests execution mechanics, not rejection of the wrong installed form. A Windows shell-form entry could still pass.  
   **Smallest fix:** Add platform dispatch fields to every hook row. Add shape cases rejecting shell form on Windows and exec form on macOS or Linux.

3. **The all-subprocess environment test remains narrower than R-1084.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:197-199,490-495`  
   **Evidence:** The verification list checks install, pi, hooks, and doctor. It still omits both fixture Git processes and Git Bash discovery. Only the closing revision note mentions a recording-spawn test.  
   **Smallest fix:** Put that recording-spawn test in the verification section. Enumerate both Git initializations, Git Bash discovery, install, every pi call, every hook, and doctor.

4. **The contradictory open decision remains near the plan’s front.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:53-58,396-400,574-579`  
   **Evidence:** The plan still says the definition of “done” is the owner's open call. Later sections say the seat decided it and that the owner's Windows run is required.  
   **Smallest fix:** Replace lines 53–58 with the settled definition and remove the Open reference.

## SHOULD

1. **Remove stale conditional wording after probe (f) held.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:51,56,69,226,370,397,439,457`  
   The plan repeatedly calls the probe provisional or discusses failure. State the held result consistently.

2. **Make resolved executable-path output testable.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:239-244,271-274,639`  
   Only the closing revision note promises resolved Git Bash and pi paths. Add them to reporting design and verification.

3. **Relabel references after the requirement splits.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:148,153,257,263,510-514`  
   Known-red behavior belongs to R-1080, doctor behavior to R-1081, and knowledge output to R-1083. Several headings and pins retain the old rows.

## NOTE

- The adoption fallback is removed. Probe (f) records model-free `session_start`, `reload-runtime`, and the journal evidence.
- R-1072, R-1077, and R-1079 now contain one literal “shall” each.
- The pi residual is explicit: prompt-time objective, knowledge, gate, and post-edit behavior remain untested.
- The first MUST is the named fail-open bug that justifies reopening the plan under the round cap.

**Score: 78/100.** The design direction is sound, but verification still specifies unconditional XFAIL behavior. That blocks the build.

VERDICT: SEND-BACK
