## Score: 7.5/10

The plan is sound overall, and the frozen input is mechanically consistent. Four small plan defects need correction before building.

### MUST

1. **The placement record contradicts its final decision for R-945.**  
   - `docs/reviews/req-tree-2026-10-09/placement-review.md:186` says to move R-945, although the refutation at line 163 keeps it in FEAT-026.
   - `docs/reviews/req-tree-2026-10-09/placement-review.json:10568` and `:10610` repeat the stale move.
   - The later verification correctly rejects that move at `placement-review.json:10629-10632`.
   - `tree-b.json` correctly moves R-948 and R-949, not R-945.
   - **Evidence:** I compared all 17 declared moves with the base and final trees. They match exactly.
   - **Smallest fix:** Replace R-945 with R-949 in the stale consistency resolution and summary, in both placement-review files.

2. **R-291 assigns feature-only fields to every heading.**  
   - `docs/reviews/req-tree-2026-10-09/tree-b.json:1774` says every capability, feature, and subgroup lists its “status” and “shared requirements.”
   - The plan only gives statuses and shares to features at `CHANGE-B.md:88-106`.
   - Capability and subgroup statuses are explicitly outside scope at `CHANGE-B.md:77-79`.
   - Rendering `—` would satisfy shape mechanically but misstate the contract.
   - **Smallest fix:** Make R-291 require common fields for every heading, then status and shared requirements only for features.

3. **The required seat verification script is absent and outside the declared increment.**  
   - `docs/reviews/req-tree-2026-10-09/CHANGE-B.md:147` requires `seat-verify-b.sh`.
   - No such file exists.
   - `CHANGE-B.md:81-83` adds nothing to increment 1’s allowlist.
   - **Evidence:** A repository search returned no matching file.
   - **Smallest fix:** Add and freeze the script before builder launch, and name it in the allowlist. Alternatively, remove the script requirement and keep the explicit commands and mutations in section 5.

4. **The reserve count is internally inconsistent.**  
   - `CHANGE-B.md:42` correctly says R-295–R-299 leaves five IDs.
   - `CHANGE-B.md:166` says four remain.
   - **Smallest fix:** Change “four” to “five.”

### SHOULD

1. **Add lifecycle triggers for revalidating shares and frozen statuses.**  
   - `fixed-text-b.md:35-39` re-reads a share only when its row changes, then leaves it until an unspecified placement review.
   - A feature purpose change, split, merge, retirement, or home move can make a still-valid share semantically stale.
   - A dated frozen reason can also remain after its ruling without violating R-293.
   - **Smallest fix:** Require review of affected incoming and outgoing shares whenever a feature changes lifecycle or purpose, or a row changes home. Require resolution of a frozen status when its named ruling occurs.

2. **Strengthen R-293’s grammar fixtures.**  
   - `CHANGE-B.md:49` requires non-empty frozen and retired reasons.
   - `CHANGE-B.md:140-143` only names deletion and `Status: done` mutations.
   - **Smallest fix:** Add rejection cases for `frozen ()`, `retired ()`, and whitespace-only reasons. Add acceptance cases for all four legal forms.

3. **Narrow the inherited allowlist.**  
   - Increment 1’s allowlist includes `package.json` and the root README at `CHANGE.md:111-116`.
   - Increment B needs neither.
   - **Smallest fix:** State the exact increment-B modification allowlist instead of inheriting increment 1 wholesale.

4. **Make the R-292 evidence sentence list all four clauses.**  
   - `CHANGE-B.md:57` omits unknown-ID existence.
   - `CHANGE-B.md:140-142` correctly lists duplicate, retired, unknown, and same-home mutations.
   - **Smallest fix:** Add “exists” to line 57.

### NOTE — proof

The proposed proof retains the important guarantees.

- `CHANGE-B.md:124-133` derives output from the original approved ledger and immutable increment-B inputs.
- Exact whole-file comparison prevents loss, alteration, duplication, old-home retention, and changed metadata lines.
- Comparing the two tree inputs prevents undeclared labels, purposes, order changes, and placements.
- Retiring `--amendment` loses no guarantee because both original-intro substitutions move into `intro_edits`.
- The build review should verify that each intro substitution is unique and mandatory.
- The proof mutation set at `CHANGE-B.md:144-146` covers the critical new paths.

### NOTE — frozen input

Mechanical checks produced:

- 1,009 base rows, each placed exactly once.
- 1,012 final rows: the base plus R-292–R-294.
- 17 actual moves, exactly matching `tree-b.json` and the Moves table.
- 113 share links over 95 requirements across 30 features.
- Every shared ID exists, is not retired, and is homed in another feature.
- No duplicate share link exists.
- 31 active features and seven well-formed frozen features.
- No proposed or retired feature currently holds rows.
- The placement workflow covers all 1,009 base IDs once, with no omissions or duplicates.

R-291 through R-294 are testable as written, but R-291 needs the feature-only wording correction above. R-292 is multi-clause but remains auditable because the plan requires one mutation per clause.

### NOTE — compatibility

The added lines do not weaken existing consumers.

- The trace rail recognizes only table lines beginning with an R-/G- ID at `templates/typescript/template/tests/requirements-trace.ts:45-46` and `:183-190`.
- `req:rows` obtains rows through that rail and separately matches table rows at `scripts/requirement-rows.mjs:68-74`.
- R-756’s mirror check matches only table rows at `packages/nana-pack/tests/templates-render.test.mjs:192-200`.
- The code map and README checker do not parse ledger metadata.
- `Status:` and `Also applies:` are neither headings nor table rows, so they cannot create false IDs or alter table parsing.
- The tree checker itself is the only consumer requiring intentional extension.

### NOTE — D4 facts

The seven frozen features match the plan’s interpretation of the current desk freeze. The source ruling freezes discretionary desk hardening and permits the flaky-test fix and usage measurement at `docs/hardening-plan-2026-10-06.md:94`. The plan properly sends the disputed feature boundary to the owner for confirmation.

VERDICT: LAND-WITH-FIXES
