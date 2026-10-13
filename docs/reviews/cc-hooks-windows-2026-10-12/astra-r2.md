## Review — 90/100

Reviewed `7e6ce39..f7bb70c`. The round-1 behavioral regressions are fixed. Two requirement-evidence gaps still prevent unconditional acceptance.

## MUST

### 1. Finish proving the promoted doctor requirements

**Files:** `packages/nana-setup/tests/win32-degrade.test.mjs:117–130`; `REQUIREMENTS.md:912,915`

- **R-1060:** the strengthened assertion checks that doctor *prints* “claude --version … never run.” It does not establish that doctor never executes `claude`. Adding that execution while retaining the note would leave this assertion green. This part of astra round-1 MUST 4 remains open.
- **R-937:** “marks the skipped pieces” checks only that at least four `skipped (win32)` strings appear. Changing another skipped row’s detail to an unmarked note would still pass. That does not pin **every** skipped line, despite the promotion from `untested` to `implemented`.

**Smallest fix:** observe subprocess calls and assert no `claude` invocation; assert the expected doctor skip labels individually. Alternatively, split out the unsupported clauses and mark them `untested`.

The production doctor currently behaves correctly; this finding concerns the explicit evidence contract.

## SHOULD

### 1. Make Jake’s check safe to repeat and explicit about prerequisites

**File:** `docs/reviews/cc-hooks-windows-2026-10-12/jake-windows-check.md:29–30,58–59,70`

The instructions now provide concrete installer commands, a same-command pipeline/commit, knowledge fixture, probe JSON, version floors and environment checks. However:

- The fixed folder name can already exist. Cleanup recursively deletes it without proving this run created it.
- The objective and shared-memory expectations still assume existing user fixtures. They are not established by this page.

**Smallest fix:** create a uniquely named folder, retain its path for cleanup, and preflight the objective/shared index—or explicitly record those checks as unavailable when their fixtures are absent.

### 2. Complete the evidence references

**Files:** `REQUIREMENTS.md:686,776–777,913`

The Windows-only rows correctly identify their evidence as Windows-only, but still cite run `38330995309`, rather than the final supplied run `38333416292`. R-1055’s evidence cell also omits the new wrong-event, wrong-matcher, outside-checkout and duplicate-target cases.

**Smallest fix:** cite the final run and append the clause-bearing doctor test titles.

### 3. Escape the matcher inside the README table

**File:** `packages/nana-setup/README.md:44`

The table cell contains an unescaped `Bash|PowerShell`. Markdown table parsing can treat that pipe as a column boundary.

**Smallest fix:** write `Bash\|PowerShell`, as the runtime template already does.

## NOTE

### Round-1 closure

- **Lexer repros:** fixed. Embedded hashes and URL fragments remain literal; parentheses inside subexpression comments and escapes no longer terminate the scan early. The predicate and hook tests cover the reported failures.
- **POSIX matcher scan:** fixed at `packages/nana-setup/lib/settings.mjs:443`. Matcher-less specifications again scan every group.
- **Exec ownership:** fixed at `settings.mjs:410–411`. Customized same-basename targets no longer become installer-owned.
- **Status-message gate:** `settings.mjs:370` rejects both different and missing messages, matching main.
- **Windows execution evidence:** `hooks-win32-exec.test.mjs:108–175` now uses each entry’s actual timeout, checks all five entries for successful execution/module errors, checks the seeded index line, and requires one non-empty JSON response line.
- **Doctor negative cases:** present at `win32-degrade.test.mjs:218–271`. The remaining evidence issue is the no-`claude` assertion described above.
- **R-923:** appropriately narrowed to recognized invocations, with unsupported Windows spellings declared.
- **README repair wording and obsolete test title:** corrected.

### Rare lexer residual—not an additional blocker

**File:** `packages/nana-pack/lib/pipe-guard.mjs:134–136,231–233`

Block comments use a boolean rather than nesting depth. A nested PowerShell block comment containing an unmatched quote after its inner terminator can hide subsequent live commands:

```powershell
<# outer <# inner #> a "quoted example #>
npm test | Select-Object -Last 1; git commit -m x
```

I reproduced Bash classification as a hit and PowerShell classification as `null`. Record this rare case as a residual; the eventual fix is nesting-aware comment handling in both scans.

### Contract and documentation checks

- Every changed requirement sentence has exactly one `shall`.
- POSIX writer output and command-only reading remain consistent with main; the repaired matcher and status gates restore the identified merge behavior.
- All three Support lines are identical.
- `CLAUDE.md` and `AGENTS.md` are byte-identical; the shared runtime region matches its template.
- HANDOFF correctly retains the Windows machine rehearsal, uninstall and actual Claude Code dispatch limitations.
- The session’s acceptance and mutation counts agree with the committed records. I read all five mutation outputs and did not run the mutation runner.

### Checks run

| Check | Result |
|---|---:|
| Seat acceptance | 59/59 |
| Test-title check | 0 gaps |
| Pipe guard | 66 pass |
| Settings merge | 212 pass |
| Forced-win32 degradation | 78 pass |
| Verifier hook | 27 pass |
| Template rendering | 124 pass |
| Requirements tree | 78 pass |
| Map / README checks | Green |

I did not independently run Windows, PowerShell or the full suite. The supplied Windows CI evidence remains distinct from Jake’s outstanding machine acceptance. The checkout is unchanged.

VERDICT: SEND-BACK
