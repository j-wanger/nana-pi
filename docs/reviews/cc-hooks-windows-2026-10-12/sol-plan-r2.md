# Plan review

**Score: 86/100.** Four round-one findings are closed. PowerShell lexer verification still leaves a named fail-open path unpinned, so the build remains blocked.

## MUST

### 1. R-1062’s tests do not pin quote-state recovery and include vacuous negatives

**Location:** `docs/reviews/cc-hooks-windows-2026-10-12/CHANGE.md:143,263-268,512,514-517`  
**Code:** `packages/nana-pack/lib/pipe-guard.mjs:86-88`

**Evidence:** The predicate returns `null` when it finds no live `git commit`. Several proposed negative cases contain no commit:

- `'npm test | x'`
- `"npm test | x"`
- ``npm test `| x``
- `# npm test | x`
- the single-quoted here-string
- `'it''s | x'`

Those cases pass even if the lexer exposes every pipe, because the commit precondition is absent.

The plan also specifies doubled double quotes and backtick-escaped quotes, but tests only a doubled single quote. A lexer that closes a double-quoted string at an escaped quote can remain incorrectly quoted afterward and hide a later live pipeline. That is a fail-open bug.

R-1062 also says every here-string pipe is inactive. The design says a pipe inside `$()` in an expandable here-string is live. The row and design therefore disagree.

**Smallest fix:**

1. Append a live commit outside every inactive construct.
2. Add live-pipeline recovery cases after doubled and backtick-escaped double quotes.
3. Add both inactive text and live `$()` cases for expandable here-strings.
4. Amend R-1062 to state the expandable here-string exception.
5. Make the lexer mutations demonstrably fail these cases.

Examples:

```powershell
"npm test | x"; git commit -m x
Write-Output "a`"b"; npm test | Select-Object -Last 1; git commit -m x
Write-Output "a""b"; npm test | Select-Object -Last 1; git commit -m x
@"
npm test | x
"@
git commit -m x
@"
$(npm test | Select-Object -Last 1)
"@
git commit -m x
```

## SHOULD

### 1. Remove the stale POSIX read-side claim

**Location:** `docs/reviews/cc-hooks-windows-2026-10-12/CHANGE.md:658-660`

**Evidence:** The revision history says POSIX exec-form entries count as present. The current outcome and R-1061 say POSIX reads only `command`, matching `main`.

**Smallest fix:** Mark that historical change as withdrawn by the second re-check, or replace it with the final R-1061 behavior.

## NOTE

### Round-one finding closure

- **PowerShell lexer:** The architecture now covers PowerShell syntax, but the MUST above leaves its fail-open behavior unverified.
- **R-1058:** Closed. R-1058 now covers direct execution, while R-1063 and R-1064 define observable output.
- **Runtime matrix:** Closed. The plan changes the shared source and both mirrored regions, with both checks and template acceptance.
- **Windows uninstall:** Properly declared as an existing gap. The plan no longer implies that pure removal proves uninstall support.
- **CI evidence naming:** Closed. The requirement and verification section call it direct exec-form conformance and reserve real Claude Code evidence for the owner's check.
- **Five-label coverage:** Closed. Doctor and migration cases explicitly iterate all five labels.

VERDICT: SEND-BACK
