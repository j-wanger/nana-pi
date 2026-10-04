## Findings

### MUST 1 — Python’s case-insensitive flag still violates the ASCII-only boundary contract

**File:** `templates/python/template/tests/conftest.py:71`

```python
SHALL_RE = re.compile(
    r"(?<![A-Za-z0-9_])shall(?![A-Za-z0-9_])",
    re.IGNORECASE,
)
```

The explicit class is not sufficient. Python’s Unicode-aware `re.IGNORECASE` makes `[A-Za-z]` match four additional non-ASCII characters.

I compared the actual rails’ regexes across **all 1,114,112 codepoints**, placing each character before and after `shall`.

**Result: four differing codepoints, eight differing placements—not zero.**

| Adjacent character | TypeScript count, either side | Python count, either side |
|---|---:|---:|
| U+0130 `İ` | 1 | 0 |
| U+0131 `ı` | 1 | 0 |
| U+017F `ſ` | 1 | 0 |
| U+212A `K` | 1 | 0 |

The public counting functions confirm the discrepancy:

```text
Requirement cell: The system shall print shallİ.
TypeScript: 2 — off form
Python:     1 — on form
```

The flag also changes the token itself: `ſhall` counts as **0 in TypeScript, 1 in Python**.

This violates the seat’s explicit contract: only `[A-Za-z0-9_]` are word characters. It is a current enforcement disagreement, not a residual Unicode-version concern.

**Smallest fix:**

```python
SHALL_RE = re.compile(
    r"(?<![A-Za-z0-9_])shall(?![A-Za-z0-9_])",
    re.IGNORECASE | re.ASCII,
)
```

I applied that flag **only inside the disposable verification script** and repeated the exhaustive comparison: **zero differences**. It also makes `ſhall` agree at zero.

Add the four characters in both adjacency positions, plus `ſhall`, to both parity corpora. The existing shared fixtures miss this class: both rendered suites currently pass.

**Round-2 MUST 1: not closed.** The previously reported Unicode-version examples close, but the replacement still fails the ruled boundary contract.

## Round-2 closure

| Item | Round-3 result |
|---|---|
| MUST 1: version-independent boundary | **Not closed.** Four Python case-folding exceptions remain. |
| MUST 2: TypeScript printed output | **Closed.** Both project checks use `printReport`; its actual output is asserted. |
| MUST 3: code-span adjacency | **Closed.** Both public counting functions return the required counts. |
| SHOULD: R-757 enforcement wording | **Closed.** The row now correctly names the repository suite. |
| R-757 policy decision | **Recorded correctly.** Repository-only equality supplements the reusable ceiling. |
| Missing R-757 in batch inventory | **Closed.** `rowsAddedThisBatch` now includes it. |
| Residual recording | **Addressed.** Open questions #7–#8 contain the distinctions and limitations. |

### Executed TypeScript printing mutation

Changed the actual `printReport` body at `requirements-trace.ts:498` to:

```ts
console.log("WRONG REPORT");
```

The rendered suite exited **1**: **51 passed, 1 failed**. The failed assertion was the cited G-014 output test.

The mutation was restored. This closes the reporting-surface gap rather than merely testing a computed field.

### Executed span-adjacency fixtures

| Requirement cell | TypeScript | Python |
|---|---:|---:|
| ``sh`x`all`` | 0 | 0 |
| ``shall`x`é`` | 1 | 1 |
| ```shall``x``é``` | 1 | 1 |

Replacing a recognized span with a space closes the token-gluing defect.

### Executed R-757 count-reduction probe

In a disposable checkout, I retired untested off-form row R-056:

- Measured count dropped from **194 to 193**.
- Allowance remained **194**.
- Repository rail tests exited **1**, naming `measured 193, declared 194`.
- Standalone rail CLI exited **0**.

The behavior now matches the row’s wording and the recorded local deviation.

## New-code review

Reviewed the complete `git diff 0704531..eac6906`, including implementation, fixtures, requirement wording, batch inventory, worker report, and generated map.

The printing function, spy restoration, span separators, and map update introduce no additional blocker found here.

The Python regex flag is the remaining defect. The worker report’s “all findings fixed” conclusion is therefore unsupported.

## Row re-audit

- **539 → 551 IDs** since the pre-batch commit.
- No removed IDs or duplicate rows.
- Added IDs exactly match **G-013–G-022, R-756, R-757** and the updated inventory.
- All **13 mapped clause texts** match both committed requirement-cell copies.
- All **six origin groups** have correct adjacent placement.
- All **seven split-born rows** remain honestly **untested**. There are no implemented split-born rows to sample.
- G-007’s retained assertion fails when a package-to-app import is injected.
- G-012’s retained assertion fails when test-heading evidence is removed, against a clean disposable baseline.
- G-013 remains honestly **violated** in nana-pi: **194** rows remain off form.
- G-014’s reporting evidence now reaches the actual printing surface in TypeScript as well as the existing repository and Python paths.
- G-015 retains the multi-row diagnostic assertions and allowance seals.
- R-737 and R-756 retain direct rendered-ID and mirrored-cell checks.
- R-757’s cited assertion catches stale allowance headroom.

No new status overclaim was found in the batch’s split rows. The remaining regex defect affects the form-check implementation, despite the passing fixture suites.

## Verification

| Command or probe | Result |
|---|---|
| Repository rail tests | **8 passed** |
| Template render tests, both languages and modes | **61 passed** |
| Fresh TypeScript scaffold: install and suite | **52 passed** |
| Fresh Python scaffold: sync and suite | **58 passed** |
| Exhaustive boundary comparison, committed code | **4 differing codepoints** |
| Same comparison with proposed Python ASCII flag | **0 differences** |
| Actual TypeScript `WRONG REPORT` mutation | **Exit 1; cited test fails** |
| Three span-adjacency fixtures | **0 / 1 / 1 in both rails** |
| R-757 count reduction | **Suite exit 1; CLI exit 0** |
| G-007 retained-citation mutation | **Cited assertion fails** |
| G-012 retained-citation mutation | **Clean baseline passes; mutation fails** |
| `npm run map:check` | **0 problems** |
| `npm run readme:check` | **5 known missing-path problems** |
| `git diff --check 0704531..eac6906` | **Clean** |
| Full `npm test` attempt | **Timed out at 240 seconds; no completed acceptance result** |

Before timeout, the full run reproduced the known README-check failure and passed the EARS-touched tests. I do **not** claim the previous round’s completed full-suite totals for this run.

Execution artifacts: `/tmp/ears-astra-r3/`. The reviewed worktree remains clean.

## Residuals to RECORD at landing—not blockers

1. Token counting does not establish one semantic promise or clause-level test coverage.
2. Generic allowances remain ceilings. R-757 adds repository-only equality; it neither lowers the allowance automatically nor prevents exchanging old and new off-form rows.
3. Template-render tests do not execute rendered language suites. Separate acceptance runs remain necessary.
4. Missing dependency and benchmark-extension paths prevent claiming green repository acceptance in this environment. This round additionally lacks a completed full-suite run.

These limitations are distinct from the remaining ASCII-contract violation. **Do not record that violation as an accepted residual.**

At the review cap, implement the small flag correction and add the missing fixtures. Verify mechanically with the exhaustive sweep and rendered suites; another judgment round is unnecessary.

**VERDICT: BLOCK — 8/10**
