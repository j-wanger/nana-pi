## MUST

1. **Doctor has no defined behavior when a `.cmd` or `.bat` path triggers refusal.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:66-70,88-90`  
   **Evidence:** R-1034 requires doctor to run every located shim. R-1035 defines refusal only for the installer. The shared helper nevertheless returns refusal to doctor. R-952 then references R-1034 without defining whether doctor reports missing, malformed, or failed. This makes the doctor case untestable.  
   **Smallest fix:** Extend R-1035 to doctor and require a FAIL result naming the refusal. Qualify R-1034 with “unless R-1035 refuses it.” Add one doctor refusal test.

2. **The conservative classifier still misclassifies valid cmd.exe internal-command syntax.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:46-49,72,94-100,159-163`  
   **Evidence:** cmd.exe accepts attached syntax such as `dir/Z`, `dir/W`, `cd\path`, and `echo.text`. The predicate compares the whole first word against `dir`, `cd`, or `echo`. For example, `dir/Z` exits 1 for an invalid switch, contains only allowed characters, and usually names no file. It would become “could not run” despite running an internal command. Leading whitespace is also undefined: taking text only up to the first whitespace can produce an empty candidate and a false missing-command result.  
   **Smallest fix:** Reject an empty candidate. Conservatively return false when a token starts with an internal-command name followed by cmd.exe’s attached separators. Pin `dir/Z` and a leading-whitespace failing command as failed checks.

3. **The real npm-shim test removes the Node executable from PATH.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:171-178`  
   **Evidence:** An npm shim under a custom global prefix normally falls back to bare `node` because that prefix does not contain `node.exe`. Setting PATH to only the prefix prevents the shim from reaching the fake package, so the exact-argv assertion cannot pass on a normal hosted runner.  
   **Smallest fix:** Prepend the temporary prefix to the inherited PATH instead of replacing PATH. Assert that discovery selected the temporary shim before checking the logged argv.

## SHOULD

1. **Add case-insensitive extension evidence.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:65-68,83-90,154-159`  
   **Evidence:** Windows extension matching is case-insensitive, and PATHEXT normally contains uppercase values. The declared cases do not explicitly require a discovered `pi.CMD` or `pi.EXE` to select the correct launch path.  
   **Smallest fix:** Add one uppercase-extension pure case and state that supported-extension comparisons are case-insensitive.

## NOTE

- The overstated terminal-equivalence claim is closed. The declaration now promises only the first supported external PATH entry and names terminal differences.
- The `.exe` and `.com` refusal finding is closed by R-1039 and direct argument-array tests.
- The round-two `%ComSpec%`, `@`, `^`, quoted-path, and separator-PATHEXT cases are closed. Attached internal-command syntax remains unresolved.
- The exact `%*` forwarding design is now capable of proving Node-visible argv once inherited PATH remains available.
- The internal-command vocabulary is sealed as 45 named entries and pinned independently.
- R-952 now states exit zero, first stdout line, dotted-version shape, and ignored stderr.
- The accepted metacharacter case is present in the real-shim test.
- The remaining terminal-selection differences are appropriately declared as residuals.

**Score: 7/10.** The round-two findings are substantially closed, but one contract remains undefined, one classification is wrong, and the real Windows proof cannot currently complete.

VERDICT: SEND-BACK
