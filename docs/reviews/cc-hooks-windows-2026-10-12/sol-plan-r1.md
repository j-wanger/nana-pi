# Plan review

**Score: 70/100.** Exec form and matcher selection are sound. The PowerShell predicate, one requirement row, and contract documentation need revision before implementation.

## MUST

### 1. The verifier does not actually parse PowerShell syntax

**Location:** `docs/reviews/cc-hooks-windows-2026-10-12/CHANGE.md:142,255-260`  
**Code:** `packages/nana-pack/lib/pipe-guard.mjs:17-75,85-95`

**Evidence:** The plan calls `verifierPipeReason(command, "powershell")`, but the dialect changes only pipefail handling. `liveText` still applies Bash-oriented parsing:

- Backticks become command substitutions, but PowerShell uses backticks as escapes.
- Double-quote escaping expects backslashes, while PowerShell uses backticks.
- PowerShell here-strings and block comments are not recognized.

This can treat quoted or commented pipes as active. It can also misclassify text after escaped quotes. The matcher is gate-adjacent, so this is not a rare machine variation.

The official hook input shape is correct: `tool_name` is `PowerShell`, and the command remains in `tool_input.command`. The defect is the local predicate.

**Smallest fix:** Expand this lane so `liveText` accepts a dialect and handles PowerShell backtick escaping, here-strings, and block comments. Add positive and negative PowerShell cases before claiming “PowerShell dialect.”

### 2. R-1058 is not independently testable

**Location:** `docs/reviews/cc-hooks-windows-2026-10-12/CHANGE.md:146`

**Evidence:** “Produce that script’s expected output” does not define the output. Section 5 later defines different expectations for each hook, but the requirement row does not.

The row also combines startup, output behavior, path-character coverage, and five distinct hooks under one broad result.

**Smallest fix:** Replace “expected output” with named observable outcomes, or split execution shape from per-hook protocol behavior. Keep one `shall` per row.

### 3. The canonical runtime matrix cannot remain knowingly inaccurate

**Location:** `docs/reviews/cc-hooks-windows-2026-10-12/CHANGE.md:328,411`  
**Tests:** `packages/nana-setup/tests/verifier-pipe.test.mjs:122-123`; `packages/nana-pack/tests/templates-render.test.mjs:288-298`

**Evidence:** The plan changes R-985 to require the verifier on every platform, then leaves the shared matrix saying only “Bash PreToolUse Node hook.” That becomes false for the Windows contract and remains pinned by tests tagged to R-985.

A template release is operational work, not a reason to leave the canonical consumer-facing contract wrong.

**Smallest fix:** Update the shared matrix to distinguish Windows `Bash|PowerShell` from POSIX `Bash`, update both checks, and include the template release impact in scope.

## SHOULD

### 1. Windows uninstall still cannot remove the entries this lane installs

**Location:** `docs/reviews/cc-hooks-windows-2026-10-12/CHANGE.md:228,338,406`  
**Code:** `packages/nana-setup/lib/uninstall.mjs:24,41,91`

**Evidence:** The pure `removeInstallerHooks` path will understand the platform-specific desired objects, but actual uninstall refuses on win32 before calling it. Users must manually remove five settings entries.

This answers the reader-path question: `hasHook`, stale repair, doctor, and pure removal are covered; actual Windows uninstall is not.

**Smallest fix:** Either add Windows settings-only pruning now, or make landing this lane conditional on the named uninstall lane. Do not describe uninstall as handled by the pure test.

### 2. Separate direct-spawn evidence from real Claude Code evidence

**Location:** `docs/reviews/cc-hooks-windows-2026-10-12/CHANGE.md:479,497,525-548`

**Evidence:** The Windows CI test executes every installed entry with `spawnSync(..., {shell:false})`. That proves:

- the installed `command` and `args` shape;
- Node can start each script;
- special-character paths survive Node’s Windows spawn;
- each script handles sample stdin.

It does not prove Claude Code’s executable lookup, argument reconstruction, workspace-trust behavior, matcher dispatch, or environment. The plan correctly acknowledges this elsewhere.

**Smallest fix:** Call R-1058’s CI evidence “direct exec-form conformance.” Record the owner's real Claude Code run as acceptance evidence for the broader “hooks run on Windows” claim.

## NOTE

### Exec-form shape and reader coverage

The entry shape is correct under the official `hooks#exec-form-and-shell-form` contract:

```json
{
  "type": "command",
  "command": "node",
  "args": ["absolute-script-path"],
  "timeout": 5,
  "statusMessage": "..."
}
```

The knowledge hook correctly adds `"hook"` as the second argument. No `shell` field is needed.

The proposed platform gate is also correct:

- win32 reads exec form through `args`;
- POSIX continues reading `command` alone;
- the macOS/Linux writer remains byte-identical;
- stale knowledge entries receive platform-aware repair;
- doctor validates targets inside the checkout;
- exact removal compares `args` as part of the object.

The POSIX golden test and R-1061 cases are appropriate regression protection.

### Matcher selection

`Bash|PowerShell` is correct. Official matcher rules treat it as alternatives of exact tool names, not a general regular expression. It handles the owner's machine whether PowerShell is enabled or Git Bash remains primary.

### Remaining requirement rows

The other proposed rows each contain one `shall` and have observable conditions. R-1055 and R-1056 are dense but testable. Their forced-win32 doctor and migration cases should iterate across all applicable hook labels rather than prove only one representative.

### Proper residuals

The plan correctly treats these as residuals rather than blockers:

- Claude Code’s PATH may differ from doctor’s PATH.
- A `node.cmd` shim cannot satisfy exec form.
- Literal Claude placeholders inside an argument are substituted.
- Older Claude Code versions have undocumented `args` behavior.
- Handwritten full-path or backslash-only variants may get a twin.
- POSIX users who opt into PowerShell bypass the Bash-only matcher.
- `CLAUDE_CONFIG_DIR` remains a pre-existing installer gap.
- The Windows leg is non-blocking.
- Real Claude Code execution still requires the owner's machine check.

The threat model and two-round gate-adjacent lane classification are stated correctly.

VERDICT: SEND-BACK
