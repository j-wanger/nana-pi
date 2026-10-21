## Review — 94/100

Reviewed `7e6ce39..54b569b`. The reported production regressions are fixed. Two evidence-reference corrections remain; neither requires a production-code change.

## MUST

### 1. Finish R-937’s “every skipped line” evidence

**Files:** `REQUIREMENTS.md:912`; `packages/nana-setup/tests/win32-degrade.test.mjs:122`; `packages/nana-setup/lib/doctor.mjs:362`

The replacement assertions individually cover four hook rows, four PATH rows and the desk service. They omit the four skipped skill rows: `spec`, `py-lint`, `py-review` and `py-test`.

Those rows already have an adequate assertion at `packages/nana-setup/tests/retired-artifacts.test.mjs:321`. I ran that file successfully. However, R-937 neither cites that test nor appears in its markers.

**Smallest fix:** add R-937 to that existing test’s marker and cite its title in R-937’s Evidence cell. This completes astra round-2 MUST 1 without another fixture or implementation change.

## SHOULD

### 1. Bring the Windows evidence references forward

**File:** `REQUIREMENTS.md:686,776–777`

R-1064, R-1058 and R-1063 now cite run `38333416292`. That closes the previously requested update, but the supplied final-code run is `38342945583`, also recorded in `docs/sessions/2026-10.md:19`.

**Smallest fix:** replace the three older run/job references with the final run and its verified Windows job. Keep the explicit **Windows-leg-only** qualification.

## NOTE

### Round-1 and round-2 closure

- **PowerShell lexer:** `pipe-guard.mjs:111–205,224–320` now applies one boundary predicate to `#` and `<#` in both scans. Embedded hashes, URL fragments, embedded block-comment openers and subexpression-comment parentheses have positive regressions. The reported bypasses are closed.
- **POSIX compatibility:** `settings.mjs:443` scans every group when no matcher is required. `settings.mjs:370` rejects both different and missing status messages. Command-only reading, writer output and stale-entry replacement retain main’s behavior. Seat acceptance confirms normalized Darwin settings equal main’s.
- **Installer ownership:** `settings.mjs:410–411` requires the repository suffix. Same-basename customized targets remain foreign. R-923 now states the recognized-invocation scope and records unsupported Windows spellings.
- **Execution evidence:** `hooks-win32-exec.test.mjs:108–175` uses each installed timeout, checks all five entries for successful execution/module errors, checks the seeded index line, and requires one non-empty JSON response line.
- **Doctor and migration evidence:** R-1055 now cites the restrictive negative cases. `settings-merge.test.mjs:187–207` exercises an existing outside-checkout target. `win32-degrade.test.mjs:146–176` adds recording `claude` stubs. Only the R-937 citation completion above remains.
- **Documentation:** `packages/nana-setup/README.md:44` now qualifies POSIX migration, restricts repair to installer-shaped entries and escapes the table’s matcher pipe. The obsolete knowledge-only test title is corrected.
- **Jake’s check:** `owner-windows-check.md:27–80` adds fixture preflight and a per-run folder. It provides checkout-relative commands, the probe JSON, a same-command pipeline/commit and cleanup. HANDOFF and the session correctly leave actual Claude Code dispatch, routing and latency unproven.

### Contract checks

Every changed requirement sentence has exactly one `shall`. R-387 and R-936 remain retired; R-1052 remains withdrawn.

The three Support lines are identical. `CLAUDE.md` remains a symlink to `AGENTS.md`; their bytes match. The shared runtime region matches the template.

I read all seven committed mutation outputs and did not run the mutation runner. The final seat record reports **37/37 red**. That is consistent with the session narrative, not proof of exhaustive lexer coverage.

The supplied Windows results and local locked-suite result remain separate evidence. The upstream macOS/Linux CI failure is correctly assigned to the urgent CI lane. I did not independently run Windows, PowerShell or the full suite.

### Checks run

| Check | Result |
|---|---:|
| Seat acceptance | 59/59 |
| Test-title verification | 0 gaps |
| Pipe guard | 69 pass |
| Settings merge | 213 pass |
| Forced-win32 degradation | 87 pass |
| Verifier hook | 28 pass |
| Template rendering | 124 pass |
| Requirements tree | 78 pass |
| Retired artifacts | Passed |
| Map / README checks | Green |

No additional production-code merge blocker found within the stated threat model. Checkout unchanged.

VERDICT: LAND-WITH-FIXES
