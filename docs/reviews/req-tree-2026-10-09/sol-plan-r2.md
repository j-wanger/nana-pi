The revision fixes most round-one defects, but two MUST findings still block owner approval.

## MUST

### 1. The approved tree can still decay while the suite stays green

**Files:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:31-34,54-59`; `docs/reviews/req-tree-2026-10-09/sol-plan-r1-response.md:7`; `docs/reviews/req-tree-2026-10-09/tree.json:1249-1263`

**Evidence:** The declined round-one reason does not resolve the failure mode. These mutations satisfy all four new rows:

- Move R-001 from FEAT-001 to FEAT-002.
- Move FEAT-001 under another capability.
- Rename FEAT-001 and replace its purpose with unrelated non-empty text.

The trace rail remains green because it parses rows globally at `templates/typescript/template/tests/requirements-trace.ts:45-46,185-187`. R-287 only requires some feature or subgroup home. R-290 only requires a parent at the next level.

The approved manifest already exists in `tree.json`; using its IDs and relationships is not a second copy of row text. Requiring an intentional manifest edit for regrouping is the control, not harmful staleness. New rows can remain exempt from baseline membership until deliberately added to the manifest.

**Smallest fix:** Have the permanent test pin approved heading IDs, labels, parent relationships, purposes, and existing-row memberships against a committed manifest. Permit unknown future row IDs structurally, or require their declared feature addition alongside the requirement delta.

### 2. The preservation proof ignores bytes it claims to preserve

**File:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:31,178-191`

**Evidence:** The proof explicitly ignores blank lines, then claims that no extra, reordered, or altered prose can pass. Deleting every blank line, adding blank lines, or changing blank-line placement inside Open questions can therefore pass.

This violates the declared byte-for-byte outcome. Neither the trace rail nor the new structural rows inspect blank lines.

**Smallest fix:** Account for every physical line, including empty lines and the final newline. Add mutations that delete and insert a blank line.

## SHOULD

### 3. The proof’s trusted baseline is still caller-selected

**Files:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:96-98,178-180,198`

**Evidence:** The proof reads the frozen tree and fixed text from the approved commit, but reads the old ledger from the `<before>` argument. An altered ledger supplied as both the move source and baseline can redefine what “preserved” means.

The doneWhen calls it the base ledger, but the tool does not establish that identity itself.

**Smallest fix:** Read `REQUIREMENTS.md` from the approved commit too, or verify the supplied baseline against that blob before comparing.

### 4. The permanent section map’s package claims remain unchecked

**File:** `docs/reviews/req-tree-2026-10-09/CHANGE.md:78-79,158-160,191-194`

**Evidence:** The revised proof checks all 60 headings, row counts, homes, and the moved §10 note. It explicitly leaves the package column unproved. A wrong package attribution can therefore pass despite package ownership being a stated reason for retaining the map.

**Smallest fix:** Put expected package ownership in the approved input and compare it, or remove the package column’s accuracy claim.

## NOTE

### Round-one fixes verified

- R-287–R-290 now appear exactly once in FEAT-028 and in `new_rows` at `tree.json:1260-1263,1557-1561`.
- The current ledger has 1,004 unique rows. The tree has 1,008 unique IDs: every base ID plus exactly four additions.
- Current statuses are 718 implemented, 264 untested, 15 retired, six violated, and one planned.
- The outline correctly reports FEAT-028 as seven existing plus four new rows at `outline.md:50`.
- The Open questions heading remains `## Open questions`, preserving the skill instruction at `packages/nana-pack/skills/requirements/SKILL.md:153-155`.
- The NOT list now excludes only pre-existing row-cell edits at `CHANGE.md:83-86`.
- R-290 is acceptably generic, and doneWhen now mutates both hierarchy branches at `CHANGE.md:201-204`.
- The outline names both mapping files correctly at `outline.md:3`.
- The frozen-input rule closes the corpus-edit gap during the build at `CHANGE.md:96-98`.

### Consumers and current checks

I executed the current trace rail. It reported 1,004 rows, 718 traced, and zero EARS-form problems.

I executed the map check. It reported 242 modules and zero problems.

The consumers remain layout-independent:

- The rail recognizes row lines globally: `templates/typescript/template/tests/requirements-trace.ts:45-46,185-187`.
- `req:rows` joins rail data and finds cells by anchored ID: `scripts/requirement-rows.mjs:68-74`.
- R-756 scans G rows globally: `packages/nana-pack/tests/templates-render.test.mjs:194-202`.
- Startup guidance performs ID lookup: `AGENTS.md:7,71`.
- The code-map configuration has no ledger-heading dependency: `code-map.config.json:3-6`.

### Deviations, scope, and process

The measured structure remains eight capabilities, 38 features, and 21 subgroups. No undeclared mapping departure was found beyond the stated G-row move, two post-snapshot rows, flat subgroup IDs, and four new rows.

The allowlist covers the ledger, structural test, skill change, permanent map, generated code map, proof scripts, and reports. It is disjoint from the revised NOT list.

The two checkpoints are outcome-bearing rather than ceremonial. The first approves semantics before movement; the second presents preservation and review evidence. The remaining durable-enforcement gap prevents that approval from surviving later edits.

Score: 6/10

VERDICT: SEND-BACK
