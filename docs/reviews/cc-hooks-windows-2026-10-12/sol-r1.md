## MUST

1. **PowerShell subexpression matching can hide a live pipeline.**  
   `packages/nana-pack/lib/pipe-guard.mjs:102-119`

   `matchPowerShellParen` handles nested quotes and parentheses, but not PowerShell comments, block comments, here-strings, or backtick-escaped parentheses. A `)` inside a comment prematurely closes the scanner:

   ```powershell
   "$(Write-Output hi # )
   npm test | Select-Object -Last 1
   )"; git commit -m x
   ```

   The live pipeline runs inside the subexpression, but `verifierPipeReason(..., "powershell")` returns `null`. This violates R-1062 in the gate-adjacent path.

   **Smallest fix:** make the matching scan honor PowerShell backticks, line comments, block comments, strings, and here-strings. Add the command above as an R-1062 positive case.

2. **POSIX stale-hook merging differs from main.**  
   `packages/nana-setup/lib/settings.mjs:427`

   Main scans every `UserPromptSubmit` group for an installer-owned knowledge entry. The new code scans only groups without a matcher when `w.matcher` is undefined. An installer-shaped stale entry in a matcher-scoped group is ignored and later receives a duplicate.

   This contradicts R-1061, CHANGE §3, the function comment, and the session claim that macOS/Linux merge behavior remains identical.

   **Smallest fix:**

   ```js
   const matcherOk =
     w.matcher === undefined || group?.matcher === w.matcher;
   ```

   Add a POSIX regression test with the stale knowledge entry inside a matcher-scoped group.

3. **R-1058 is marked implemented without evidence for its full clause.**  
   `REQUIREMENTS.md:776`  
   `packages/nana-setup/tests/hooks-win32-exec.test.mjs:104-146`

   The row says every hook exits within its five-second timeout without module-resolution errors. The harness allows an extra five seconds. Only objective and knowledge carry R-1058 markers, and only knowledge checks module-resolution stderr. Adoption, shared memory, and verifier do not pin the clause.

   **Smallest fix:** spawn every entry with its declared timeout, assert exit 0 and no module-resolution error for all five, and cite every resulting test under R-1058. Otherwise mark the row untested or narrow it.

4. **R-1064’s “exactly one JSON line” clause is not tested.**  
   `REQUIREMENTS.md:686`  
   `packages/nana-setup/tests/hooks-win32-exec.test.mjs:132-138`

   `isAsk` parses only the first stdout line. Additional output would still pass, so the cited tests do not prove “exactly one JSON line.”

   **Smallest fix:** require one non-empty line, parse that complete line, and assert the decision for both Bash and PowerShell.

## SHOULD

1. **The setup README overstates stale-entry replacement.**  
   `packages/nana-setup/README.md:44`

   It says any entry whose script no longer resolves is replaced. Code replaces only installer-shaped entries with the expected timeout and status message; hand-written variants remain untouched.

   **Smallest fix:** say “an installer-shaped entry whose script no longer resolves.”

2. **Windows-only requirement evidence cites an older CI run.**  
   `REQUIREMENTS.md:686,776-777`

   These rows cite run `38283629664`, while the final-review brief identifies run `38313718241` as the real Windows evidence for this tip.

   **Smallest fix:** cite the final run and its Windows job in all three rows.

## NOTE

- Every reviewed requirement row contains exactly one `shall`.
- The status-message gate correctly rejects both a different and a missing message.
- The 59-case acceptance script and title check pass.
- AGENTS.md and CLAUDE.md are byte-identical; CLAUDE.md remains the expected symlink.
- The shared runtime-matrix cell matches its template copy.
- HANDOFF and the machine-check steps agree with the session entry.
- Score: **6/10**. The implementation is close, but two behavioral regressions and two evidence overclaims block merge.

VERDICT: SEND-BACK
