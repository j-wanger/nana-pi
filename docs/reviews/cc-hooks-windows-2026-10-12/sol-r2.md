## MUST

1. **An embedded PowerShell `<#` can still hide a live commit.**  
   `packages/nana-pack/lib/pipe-guard.mjs:179,282`

   Both scanners start a block comment at every unquoted `<#`, without checking a token boundary. PowerShell treats `<`, `>`, `@`, and `#` as special only at the start of a token. Therefore `issue<#123` remains a bare token.

   Reproduced:

   ```powershell
   npm test | Select-Object -Last 1; Write-Output issue<#123; git commit -m x
   ```

   The Bash dialect finds the live commit, while the PowerShell dialect returns `null`. This is another R-1062 gate bypass in the same class as round 1’s embedded `#` finding.

   **Smallest fix:** recognize `<#` only at a valid PowerShell comment boundary in both scanners. Add the command above, with a live commit, as an R-1062 positive case and pin it through `decideHook`.

2. **R-1055’s evidence omits the tests that prove its restrictive clauses.**  
   `REQUIREMENTS.md:913`  
   `packages/nana-setup/tests/win32-degrade.test.mjs:211,220,240,256`

   The row’s cited tests cover healthy entries, missing targets, and repaired targets. They do not cite the new cases for wrong matcher, wrong event, an existing outside-checkout target, or a good entry beside a stale duplicate. Those are the tests that prove “only when” and “every entry.”

   **Smallest fix:** add those four existing test titles to R-1055’s Evidence cell.

3. **R-1056 lacks evidence for an existing target outside the checkout.**  
   `REQUIREMENTS.md:995`  
   `packages/nana-setup/tests/settings-merge.test.mjs:176`

   Its cited stale-target tests use missing paths. The similarly named “outside repository” check also uses `/old-clone`, which does not exist. No cited install test proves replacement when the target exists but resolves outside the checkout.

   **Smallest fix:** create an existing outside-checkout fixture with the repository suffix, assert in-place replacement without a twin, mark it R-1056, and cite it.

## SHOULD

1. **The Windows-only rows cite an older CI run instead of the final-tip run supplied for this review.**  
   `REQUIREMENTS.md:686,776-777`

   They cite run `38330995309`; the session record and review brief identify final-tip run `38333416292`.

   **Smallest fix:** update all three evidence cells to run `38333416292` and its Windows job.

2. **The setup README’s POSIX migration sentence is unqualified.**  
   `packages/nana-setup/README.md:44`

   It first says knowledge migration occurs only for the exact prefixed shell form, although Windows also recognizes legacy and exec forms. The later Windows sentence gives the broader behavior, but the earlier universal wording remains contradictory.

   **Smallest fix:** begin the first migration sentence with “On POSIX.”

## NOTE

- Round 1’s matcher scan, filename-only ownership, status-message, timeout, exact-output, shared-index, doctor-negative, and R-923 scope findings are otherwise closed.
- The status-message gate rejects both a different message and a missing message.
- POSIX `desiredHooks` matches main’s fixture, and the committed acceptance run reports Darwin settings equal to main.
- Every reviewed R-1050–R-1064 row contains exactly one `shall`.
- AGENTS.md and CLAUDE.md are byte-identical. Their runtime matrix region matches the shared template.
- HANDOFF, the session entry, and the owner's runnable Windows page agree about the remaining real-Claude-Code check.
- Checks run: pipe guard 66 pass; settings merge passed; seat acceptance 59/59; title verification 0 gaps.
- Score: **7/10**. Most round-1 defects are fixed, but the remaining PowerShell lexer bypass blocks landing.

VERDICT: SEND-BACK
