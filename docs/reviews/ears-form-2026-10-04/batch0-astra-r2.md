## Findings

### MUST 1 — Word-boundary parity still depends on the runtime’s Unicode version

**Files:** `templates/typescript/template/tests/requirements-trace.ts:107`; `templates/python/template/tests/conftest.py:67`

The two character classes agree for the same Unicode database. The installed runtimes use different databases:

- Node 22.22.2: **Unicode 17.0**
- Rendered Python 3.14.4: **Unicode 16.0.0**

**Executed counterexample**, using the public counting functions:

```text
The system shall print shall\u088F.
```

Here `\u088F` denotes the actual **U+088F** character, not a literal escape.

| Runtime | Count | Result at allowance 0 |
|---|---:|---|
| TypeScript | 1 | On form |
| Python | 2 | Off form |

The same disagreement occurs before `shall`, and with **U+A7F1**. These characters belong to Node’s newer letter database but are unassigned in Python’s database.

An exhaustive comparison across Unicode codepoints found **4,657 boundary-membership differences** on this machine. This is not a hypothetical future upgrade.

**Requested category attacks:**

| Adjacent character | TypeScript / Python count¹ |
|---|---|
| U+0301 combining acute accent | 2 / 2 |
| U+0660 Arabic-Indic digit zero | 1 / 1 |
| U+2160 Roman numeral one | 1 / 1 |
| U+00B2 superscript two | 1 / 1 |
| U+02B0 modifier letter small h, Lm | 1 / 1 |
| U+4E00 CJK letter, Lo | 1 / 1 |
| U+200D zero-width joiner | 2 / 2 |
| U+088F | **1 / 2** |
| U+A7F1 | **1 / 2** |

¹ Each fixture also contains one ordinary `shall`. Prefix and suffix placements produced the same results.

**Smallest fix:** Specify a version-independent boundary contract and implement it in both languages. A pinned character table preserves Unicode semantics; an explicitly narrower definition changes the contract. Add these counterexamples to the parity corpus.

**Round-1 MUST 4: partially closed.** `shallé` now agrees, but the promised cross-runtime definition still does not.

### MUST 2 — The TypeScript G-014 citation still does not pin printed output

**File:** `templates/typescript/template/tests/requirements-trace.test.ts.jinja:374–375`

The new fixture asserts `check().report`. However, the rendered TypeScript suite does not print that field. It separately prints `line` and `earsLine`.

**Executed mutation:**

```ts
console.log(earsLine);
```

changed to:

```ts
console.log("WRONG REPORT");
```

The complete rendered TypeScript suite remains **52/52 green**, while its actual report is wrong.

The requested mutation to the *computed* `earsLine` now fails in all three places. That closes the original fixture weakness, but not the full reporting clause.

nana-pi now exercises its actual CLI. Python now exercises its actual pytest hook. TypeScript still tests a returned structure instead of its reporting surface.

**Smallest fix:** Make the TypeScript reporting path consume the tested report and assert its actual output and ordering. Cite that assertion for G-014.

**Round-1 MUST 2: partially closed.** G-015 closes everywhere; G-014 closes for nana-pi and Python, not fully for TypeScript.

### MUST 3 — Removing code spans creates and destroys outside tokens

**Files:** `templates/typescript/template/tests/requirements-trace.ts:91`; `templates/python/template/tests/conftest.py:181`

The new matching-run scanners correctly find double-backtick spans, but delete them without preserving a boundary. Text on opposite sides becomes one word.

**Executed results, identical in both rails:**

| Requirement cell | Actual count | Correct outside-span count |
|---|---:|---:|
| ``sh`x`all`` | 1 | 0 |
| ``shall`x`é`` | 0 | 1 |
| ```shall``x``é``` | 0 | 1 |

The first case passes despite containing no outside `shall` token. The others lose an actual token.

This deletion behavior was inherited from the old masker; the replacement scanner retains it.

**Smallest fix:** Replace each recognized span with a non-word separator rather than nothing. Add adjacent-span fixtures in both languages.

## Round-1 closure

| Item | Round-2 result |
|---|---|
| MUST 1: double-backtick span | **Closed for the reported defect.** Double and embedded-backtick fixtures count 1 in both rails. Separate masking defect above. |
| MUST 2: G-014/G-015 evidence | **Partial.** All six requested computation/first-row mutations fail. Actual TypeScript output remains unpinned. |
| MUST 3: split placement | **Closed.** All six origin groups follow §2 in both copies. |
| MUST 4: `shallé` parity | **Partial.** Exact reproducer closes; Unicode-version counterexamples remain. |
| SHOULD: usable TS allowance setting | **Closed.** Both project checks consume `PROJECT_EARS_ALLOWANCE`; adoption instructions name it. |
| NOTE: stale headroom and Python seal | **Addressed.** Stale headroom fails the repository suite. Python’s seal now names G-015. |

## R-757 ruling

**Keep it as a nana-pi-only suite invariant.**

The ruling requires tightening at every landing. The added equality assertion catches a missed tightening ceremony without introducing stored state or changing the reusable rails’ ceiling semantics.

**Executed count-reduction probe:**

- Changed one off-form row into an on-form row in a disposable checkout.
- Measured count became **193**, allowance remained **194**.
- Repository rail tests exited **1**, naming measured and declared counts.
- Standalone rail CLI exited **0**.

That distinction should be explicit. R-757 currently says “the rail shall fail,” but the extra enforcement lives only in the repository test suite.

**SHOULD:** Say “the repository suite shall fail” in R-757 and record the approved local deviation. Keep generic `check()` and template behavior as `count > allowance`.

This supplements the ceiling; it does not automatically lower the allowance or prevent exchanging one old off-form row for a new one.

## Row re-audit

Reviewed the complete `6f21ea9..0704531` diff, including tests, templates, documentation, and generated-map changes.

- **539 → 551 IDs** since the pre-batch commit; no removed IDs or duplicate rows.
- New IDs are exactly **G-013–G-022, R-756, R-757**.
- All **13 mapped clause texts** match the committed requirement cells.
- All six origin groups have correct adjacent placement in both copies.
- All seven split-born rows remain honestly **untested**.
- No implemented split-born rows exist to sample; I inspected all seven.
- G-007’s retained citation fails on an injected package-to-app import.
- G-012’s retained citation fails after removing the test-heading evidence, against a clean disposable baseline.
- G-013 remains honestly **violated** in nana-pi, with **194** off-form rows.
- R-737 and R-756 retain direct render/ID and mirrored-cell checks.
- G-014’s TypeScript citation remains incomplete as described above.
- G-015’s multi-row diagnostics now have adequate fixtures in all three places.
- R-757’s assertion catches its intended stale-headroom condition.

## Verification

| Command or probe | Result |
|---|---|
| Repository rail tests | **8 passed** |
| Template render tests, both languages and modes | **61 passed** |
| Fresh TypeScript scaffold, install and suite | **52 passed** |
| Fresh Python scaffold, sync and suite | **58 passed** |
| Computed `WRONG REPORT`, all three places | **All exit 1** |
| First-offending-row-only diagnostics, all three places | **All exit 1** |
| TypeScript printed-output mutation | **52 passed — evidence gap** |
| Injected two-`shall` R-900 in each scaffold | **Both exit 1 and name R-900** |
| `npm run map:check` | **0 problems** |
| `npm run readme:check` | **5 missing-path problems; exit 1** |
| Completed `npm test` | **93 PASS, 1 FAIL, 1 SKIP; 5521 checks passed, 2 failed, 6 skipped** |

The full-suite failure remains `readme-check.test.mjs`: missing root dependency and benchmark extension paths. It is unchanged from round 1, not a new regression.

Execution artifacts: `/tmp/ears-astra-r2/`. The reviewed worktree remains clean.

## Residuals to RECORD

- The form check counts tokens; it does not establish one semantic promise or clause-level coverage.
- Generic allowances remain ceilings; R-757 adds equality enforcement only to nana-pi’s suite.
- `batch-0.json` still omits R-757 from `rowsAddedThisBatch`; update that bookkeeping.
- Render tests do not execute rendered language suites; separate acceptance runs remain necessary.
- The known missing-path environment prevents claiming a green repository acceptance suite.

**VERDICT: BLOCK — 7/10**
