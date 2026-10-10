The plan is close, but two MUST fixes remain before the owner can approve it.

## MUST

### 1. Adding the new command will fail the README check

**Files:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:84-86,99-112`; `templates/typescript/template/scripts/readme-check.mjs:531-543`

**Evidence:** The plan adds both:

- the `req:tree` package script;
- `scripts/requirements-tree.mjs`.

The README checker requires every package script and every file directly under `scripts/` to appear in a configured README. The allowlist excludes every README, while the NOT list explicitly forbids README changes.

Therefore the declared `npm run test:locked` doneWhen cannot pass.

**Smallest fix:** Add the root README to the allowlist, remove READMEs from the corresponding NOT item, and document both `npm run req:tree` and `scripts/requirements-tree.mjs`.

### 2. R-291 checks freshness but does not preserve the visibility lock’s contents

**Files:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:33-36,55,64-69,84-88,227-231`; `docs/reviews/req-tree-2026-10-09/tree.json:1558-1563`; `docs/reviews/req-tree-2026-10-09/fixed-text.md:14-17`

**Evidence:** R-291 requires only equality between the committed outline and whatever the renderer produces.

A later change can remove row IDs, purposes, parent relationships, or entire headings from the renderer and regenerate the outline. R-291 remains green because both sides still match. R-287–R-290 remain green because the ledger itself is structurally valid.

That mutation removes the compact evidence needed to notice regrouping. The suite then stays green while the declared visibility lock has decayed.

The stated mutation changes only the committed outline. It proves staleness detection, not output completeness.

The fixed text also says all five rows “pin this structure,” although the declaration deliberately leaves names and grouping unpinned.

**Smallest fix:** Make R-291 state the required outline fields: every heading’s ID, label, purpose, parent, row count, and row IDs. Add fixture mutations that omit or alter each field. Change “pin this structure” to “check structural validity and keep the outline current.”

## SHOULD

### 3. Replace the “one-line diff” promise with “compact diff”

**Files:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:35-36,67-68`; `docs/reviews/req-tree-2026-10-09/fixed-text.md:15-17`

**Evidence:** Renaming one heading can produce one changed line. Moving a row normally changes both source and destination membership lines, and may change two counts.

**Smallest fix:** Say that structural changes produce a compact outline diff.

### 4. Keep the generated-outline approach rather than adding a permanent manifest

**Files:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:62-70,260-268`; `docs/reviews/req-tree-2026-10-09/fable-consult-2.md:5-18`

**Evidence:** I withdraw the previous manifest request as a MUST. An editor can update either a manifest or generated outline in the same change. Neither test can distinguish decay from an authorized regroup.

The generated outline supplies the review surface. Increment 2 supplies declared intent and a base-to-tip structure report.

**Recommendation to the owner:** Choose “visible, not pinned,” after the two MUST fixes above. Nothing else makes that governance choice unsafe to build.

## NOTE

### Round-two fixes are verified

**Files:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:115-217`; `docs/reviews/req-tree-2026-10-09/tree.json:1260-1264,1558-1579`

The revised proof now:

- reads the ledger and frozen inputs from the approved commit;
- accounts for every physical line, including blank lines and the final newline;
- permits exactly the five declared additions;
- verifies every old heading, package declaration, row count, and destination;
- requires blank-line insertion and deletion mutations.

No remaining byte-loss case is apparent in the specified proof.

### Consumers remain layout-independent

**Files:** `templates/typescript/template/tests/requirements-trace.ts:45-46,183-209`; `scripts/requirement-rows.mjs:68-74`; `packages/nana-pack/tests/templates-render.test.mjs:193-222`; `AGENTS.md:7,71`; `code-map.config.json:3-46`

The trace rail parses row lines globally. The row lister joins by ID and searches anchored row text. R-756 scans G rows globally. Startup guidance uses ID lookup. The code map does not inspect ledger headings.

I executed the current trace rail. It reported 1,004 rows, 718 traced rows, and zero EARS-form problems.

I executed the map check. It reported 242 modules and zero problems.

### Counts, mapping, and deviations are accurate

A mechanical comparison found:

- 1,004 unique base rows;
- 1,009 unique planned rows;
- exactly R-287 through R-291 added;
- no missing or duplicated row IDs;
- eight capabilities, 38 features, and 21 subgroups;
- 64 old headings declared exactly once and in ledger order;
- five new rows placed once in FEAT-028.

The previously declared mapping departures remain complete: Part G consolidation, the two post-snapshot rows, and flat subgroup IDs. The five new rows are the declared requirement delta, not an undeclared departure.

### Process and scope

The two checkpoints affect outcomes. Checkpoint 1 approves semantics before movement. Checkpoint 2 presents preservation, implementation, and independent review evidence.

The allowlist is otherwise sufficient, and its entries are necessary for the declared result. The missing README is the only consumer-driven scope addition found.

**Score: 8/10**

VERDICT: LAND-WITH-FIXES
