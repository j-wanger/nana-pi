The declaration is bounded, but four MUST findings prevent owner approval.

## MUST

### 1. The preservation proof cannot pass after adding the four declared rows

**Files:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:41-49,164-169`; `docs/reviews/req-tree-2026-10-09/tree.json:1245-1257`

**Evidence:** The base ledger and `tree.json` each contain exactly 1,004 unique rows. The declaration adds R-287 through R-290, making the result contain 1,008 rows. However, `prove.mjs` requires equal before-and-after ID multisets. The tree also omits the four new IDs, so its placement check cannot account for them.

I executed a mechanical comparison:

- Base ledger: 1,004 rows, all unique.
- Tree: 1,004 IDs, all unique, no missing or extra base IDs.
- Proposed result: necessarily 1,008 rows.

**Smallest fix:** Define the proof as preserving every base row while allowing exactly R-287 through R-290 as additions. Add those IDs to FEAT-028 in `tree.json`, then update FEAT-028’s outline count and status mix.

### 2. The prose proof permits an altered ledger while exiting zero

**File:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:164-169`

**Evidence:** The proof only requires each old prose line to occur somewhere in the new ledger. It does not reject extra prose, preserve prose location, or preserve block order.

A builder could alter a Part G note in place, append the original line elsewhere, and satisfy every stated condition. A builder could also reorder ordinary prose lines while preserving each line. Rows and the two protected ending bodies would remain valid.

This contradicts the byte-preservation claim at `CHANGE.md:31`.

**Smallest fix:** Compare each retained prose block byte-for-byte at its declared destination. Permit only the explicitly generated tree prose and the single declared intro replacement. Reject extra or reordered legacy prose.

### 3. The suite permits the approved tree to decay undetected

**Files:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:46-53,84-86,176-178`

**Evidence:** R-287 through R-290 check only structural form. The following mutation can remain green:

1. Move every feature from one capability into another capability.
2. Delete the now-empty capability.
3. Keep all remaining purposes, IDs, and nesting valid.

The same gap permits deleting a feature after moving its rows, renaming every heading, changing every purpose, or replacing purpose text with an empty `Purpose:` line. The declared mutation set tests only one example per row and never tests feature-under-capability separately.

The corpus wildcard also permits the builder to modify the approved outline, declaration, and tree during the build.

This contradicts checkpoint 1, where Jake agrees names and grouping before the build.

**Smallest fix:** Pin the approved heading IDs, labels, non-empty purposes, parent relationships, and row memberships against an immutable manifest. Freeze the checkpoint inputs after approval. Any intentional regrouping should require a manifest and requirement diff.

### 4. The layout change makes the requirements skill’s Open-questions instruction false

**Files:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:131-132`; `packages/nana-pack/skills/requirements/SKILL.md:154-155`; `docs/reviews/req-tree-2026-10-09/CHANGE.md:67-69`

**Evidence:** The new layout changes `## Open questions` to `# Open questions`. The skill explicitly tells agents to place conflicts under `## Open questions`. The declared skill edit only adds a feature-placement paragraph and does not update this existing instruction.

**Smallest fix:** Add this correction to scope. Make the skill heading-level-neutral, such as “under the Open questions heading.”

## SHOULD

### 5. Nothing verifies the promised old-section map is complete

**File:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:139-148,164-169`

**Evidence:** The declaration promises all 60 old headings, packages, new homes, and row counts in the permanent map. The proof excludes old headings and checks only the moved §10 prose. A missing or incorrect map entry can therefore pass every stated doneWhen.

**Smallest fix:** Have `prove.mjs` verify all 60 old headings exactly once, their package ownership, row counts, and complete new-home sets.

### 6. The NOT list literally forbids the declared additions

**File:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:66,75-76`

**Evidence:** Scope requires adding four rows, while the NOT list prohibits touching “Any row’s Requirement, Status or Evidence cell.” The intended meaning appears to be existing rows, but the written scope is contradictory.

**Smallest fix:** Change it to “Any pre-existing row’s Requirement, Status or Evidence cell.”

### 7. R-290 combines two independently failing hierarchy clauses

**File:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:49,176-178`

**Evidence:** Feature-under-capability and subgroup-under-feature can regress independently. The doneWhen mutation exercises only the subgroup branch.

**Smallest fix:** Either split the clauses or express one generic next-higher-level invariant. Add separate mutations for misplaced FEAT and SUB headings.

### 8. The owner-facing outline names a nonexistent source file

**File:** `docs/reviews/req-tree-2026-10-09/outline.md:3`

**Evidence:** The outline says it was generated from `mapping.json`. The committed files are `mapping-astra.json` and `tree.json`.

**Smallest fix:** Name `mapping-astra.json` as the draft and `tree.json` as the checkpoint input.

## NOTE

### Consumers otherwise remain layout-independent

**Files:** `templates/typescript/template/tests/requirements-trace.ts:45-46,184-188`; `scripts/requirement-rows.mjs:68-74`; `packages/nana-pack/tests/templates-render.test.mjs:193-202`; `AGENTS.md:7`

**Evidence:**

- The trace rail recognizes row lines anywhere and does not inspect headings.
- `req:rows` obtains status data from that rail and finds row text by anchored ID.
- R-756 finds G rows globally and compares their Requirement cells.
- Startup guidance requests lookup by ID.
- The README check and code-map configuration contain no dependency on ledger headings.

I ran the current rail successfully: 1,004 rows, 718 traced, zero EARS problems. I also ran `npm run map:check`; it reported 242 modules and zero problems.

An edge-case execution confirmed that nested row tables parse normally. Indented rows and four-digit IDs remain silently skipped, but this declaration neither introduces nor expands that existing limitation.

### Counts and deviations are accurate

**Files:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:10-16,41`; `docs/reviews/req-tree-2026-10-09/outline.md:17-59`

**Evidence:** Mechanical checks confirmed:

- 1,004 rows.
- 718 implemented, 264 untested, 15 retired, six violated, and one planned.
- 60 numbered old sections.
- 35 sections split across multiple features.
- 8 capabilities, 38 features, and 21 subgroups.
- All 1,004 base IDs occur exactly once in `tree.json`.
- Applying the three declared transformations to `mapping-astra.json` produces `tree.json` exactly. No undeclared mapping departure was found.

## Score

**5/10.** The scope and source mapping are strong, but the current proof is impossible for the declared delta and insufficient for prose preservation. The approved tree also lacks durable enforcement.

VERDICT: SEND-BACK
