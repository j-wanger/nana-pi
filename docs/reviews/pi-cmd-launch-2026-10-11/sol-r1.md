## MUST

1. **`REQUIREMENTS.md:726` overstates test coverage for the argument-refusal clause.**  
   `packages/nana-pack/tests/win-command.test.mjs:44-50` tests every forbidden character only in the shim path. Only trailing backslash is tested in an argument. The seat verifier covers arguments, but it is not cited standing-suite evidence.  
   **Smallest fix:** run the existing forbidden-character table against both the shim path and an argument, preserving the requirement marker.

2. **`REQUIREMENTS.md:727` omits its POSIX evidence.**  
   The row applies on every platform, but its evidence cites only Windows tests. Existing tests at `packages/nana-setup/tests/pi-registration.test.mjs:274-277` already pin POSIX start failure and nonzero exit.  
   **Smallest fix:** add those two test titles to the evidence cell.

3. **`REQUIREMENTS.md:728` does not pin doctor’s direct `.exe`/`.com` launch clause.**  
   The cited helper test pins direct invocation, and the registration test pins installer wiring. No cited doctor test observes a direct executable invocation.  
   **Smallest fix:** add an injected doctor `.exe` case asserting the executable path and argument array, then cite it.

These gaps make the new `implemented` statuses stronger than their standing test evidence. That blocks merge under the requirements review rule.

## SHOULD

- **`packages/nana-setup/README.md:56` understates refusal behavior.** It says forbidden characters in `.cmd`/`.bat` paths are refused, but the implementation also refuses them in arguments. Change “paths containing” to “paths or arguments containing.”

## NOTE

- Every reviewed requirement row contains exactly one `shall`.
- The implementation follows the declared lookup, launch, doctor, and post-edit behavior.
- Tests use injected launchers or a local fake package; none runs a real `pi install`.
- HANDOFF and session claims match the recorded Windows and mutation evidence.
- I did not run either mutation script.
- Local verification passed: all four focused test files, both seat verification scripts, code-map check, and README check.
- Score: **7/10**. The code looks sound, but three implemented clauses need standing-suite evidence.

VERDICT: SEND-BACK
