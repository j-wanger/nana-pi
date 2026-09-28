1. **r2 HIGH is not fully fixed.** Temp-HOME probe passed all 30 asserted direct forms, including `write`/`edit`, absolute, relative, `@`, backslash, and mixed case.

2. However, lexical traversal bypasses the raw-string regex for both tools:
   - `~/.pi/agent/../agent/trust.json` → **ALLOW**
   - `<cwd>/.pi/x/../nana-pack.json` → **ALLOW**
   
   Both resolve to protected files, preserving the original trust-forging path. Protection must inspect the resolved path.

3. **Legitimate flows:** no break found. Desk and `nana-setup project` write outside pi tool calls. A mocked interactive probe confirmed “Allow once” permits all six protected `write`/`edit` calls after prompting.

4. **Other residuals for Astra:**
   - Bash/PowerShell/interpreter writes remain ungated: high cost—trust evidence can be forged despite tool-path checks.
   - `allowPatterns` run before protected-path checks: high cost—a broad exemption disables self-protection.
   - Textual substring matching can over-gate lookalike paths: low cost—avoidable user prompts.
   - Non-tool planting remains equivalent to pi’s advisory trust model: accepted high-impact residual, requiring sandbox enforcement for stronger guarantees.

Because a plain `write`/`edit` path normalization bypass still reproduces the r2 security issue, this cannot be confirmed fixed.

VERDICT: BLOCK
