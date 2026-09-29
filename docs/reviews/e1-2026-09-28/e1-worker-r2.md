All four MUSTs, both MEDs and the LOW are fixed. P1 now depends on the matcher: YES on 6 lanes, unresolved on the original 5, and not evidence about ceremony. No new judge calls; the rebuild used cached labels only (spend here ≈ $1.45 of the $12 cap).

- **Commit:** `3dca12e` on `lane/e1-catch-ledger`. Rebuild with `node apps/bench/catch-ledger.mjs build` (two runs give byte-identical `results.json`). The table is in `results.json` → `p1_by_matcher`.
- **P1 before → after the component fix:**

  | Matcher | Sol-unmatched accepted rows (functional) | Functional lanes | 6 lanes | Original 5 |
  |---|---|---|---|---|
  | A (Opus) | 16 (8) → **15 (7)** | l1 l2 l3 t2b t2c | YES | YES |
  | B (Sonnet) | 6 (2) → **4 (2)** | l3 t2c | YES | NO |
  | A∩B | **4 (2)** | l3 t2c | YES | **NO** |

  - The fix dropped `t2c/astra-r1#3` under both matchers and `l3#5` under B. No lane-level answer moved.
  - The 6-lane YES rests on two rows, `l3/astra-r1#1` and `t2c/astra-r1#2`, and both have only `semantic` disposition confidence.
  - `RESULTS.md` says this is not evidence that astra's rung is not ceremony. My hand-read adjudication is withdrawn.
- **Licensing sentence (top of `RESULTS.md`, above P1):** "Most of the distinctive functional catches are defects in fixes made after sol's last round, and only astra reviewed those fixes. The evidence licenses 'review the final fixes again'. It does not license 'use astra', any particular reviewer role, or astra's cost premium." It is followed by the reviewer-vs-position confound and the controls needed to separate them.
- **Confirm-round correction:** astra-r2 is now 25/1/1 (was 27/1/1). A new section says this counts newly accepted defects only. It lists the 17 of 62 rows that are verification (excluded by design) and the 5 of 6 LAND reports with no fix brief, whose findings are "not ruled", not "rejected". It says the ledger cannot tell whether a confirm round verified the MUSTs or safely authorized the land.
- **Basename hints (MED):** `stageHints` now compares full paths (`samePath`, suffix match on whole path segments). The cached match runs keep the old basename hints, because changing the prompt hash would force paid re-matching. The build now measures the bias: 11 of 241 hints shown to the judge were false, and matcher A drew an edge on none of them.
- **`match_confidence` (MED):** implemented as registered, as a rule over the stored quote with no model call: 14 explicit, 73 semantic, and all 15 P1 rows semantic. `PREREG.md` has a dated amendment saying the rule was written after labels existed.
- **LOW and P3:** the κ-sample wording is noted in `RESULTS.md` and `PREREG.md` (κ 0.735 on the 35 rows both judges call findings). P3 is marked "do not use operationally".
- **Tests:** `npm test` exits 0 (71 PASS, 0 FAIL, 1 SKIP; 4516 checks). The new regressions cover sol's chain `sol-r1 ~ astra-r2 ~ astra-r1`, duplicates through a shared component, `src/one` vs `src/two/config.ts`, and `match_confidence`.

**Other numbers that moved** because within-report duplicates are now component-based too: distinct findings 192→175, accepted 95→87, P2 is 50 items with 3 new-scope (Opus), P3 is 18/87. P4's single t2c-land alignment disappeared: it now has 2 accepted functional findings, tied with l1, l3 and t2b.

**Residuals:**
- The matcher runs were never repeated with correct path hints.
- The components could over-merge through chained edges; the largest is 8 rows (l2), and I didn't audit it.
- The `explicit` rule is strict (a "MUST N" only counts for a MUST row), so it probably undercounts; t2c#2's quote names "MUST 2" but is scored semantic.

**Most likely wrong:** the 6-lane "YES under all three". It hangs on two semantic-confidence rows, and one different match decision on either would make it NO.

VERDICT: DONE
