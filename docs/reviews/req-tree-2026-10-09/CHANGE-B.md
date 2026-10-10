# Change declaration — requirements tree, increment B: placements reviewed, shared requirements, lifecycle governance

*Lane `req-tree` (same branch and worktree; increment 1 is built and reviewed, not yet landed) ·
2026-10-10. Same process as increment 1: why → plan → Fable consult → sol plan review (item
`req-tree-b-plan`) → build (pi luna) → seat verification → sol build review (item `req-tree-b`) →
astra land review → Jake accepts both increments together.*

## 1. Why

At checkpoint 2 Jake asked, before accepting: "Do one review on all 1009 placements, also we
should allow multiple features pointing to the same requirements, those requirements are
potentially high impact high blast radius, we also need to make sure we have proper governance on
the features and requirements life cycle, make these changes then I'll accept."

- **Placements.** astra's mapping was checked for fidelity, never for correctness: nobody had
  judged all 1,009 placements. That was the claim most likely wrong in the checkpoint-2 report.
- **Shared requirements.** One home per row hides that some rows constrain several features (the
  trust floor, the gate, path resolution, doctor verdicts, the code map). A change to such a row
  has a wide blast radius; today nothing says so.
- **Governance.** The tree has no rules for who may create, rename, regroup, freeze, split, merge
  or retire a feature, or how a shared requirement changes or retires. Without them the tree
  drifts, or a session reshapes it unseen.

**Jake's instruction is the agreement for this increment** (checkpoint 1); its content is decided
by the review and declared here. Every move and share is listed in `placement-review.md` for his
acceptance at checkpoint 2.

**Observable outcome.**
1. Every row sits in the home the placement review upheld (17 moves; 991 rows unchanged).
2. 30 features carry an `Also applies:` line naming the requirements homed elsewhere that directly
   constrain them (113 links over 95 requirements); the outline lists them per feature and in a
   shared-requirements index flagged as high blast radius.
3. Every feature carries a `Status:` line; the ledger states who decides each tree change and how
   features and requirements are born, changed, shared, frozen, split, merged and retired.
4. The suite fails when an `Also applies:` entry is invalid, a `Status:` line is missing or
   malformed, or a retired feature still holds rows; the outline stays exact (R-291, R-293).
5. Still: no pre-existing row's text, status or evidence changes; the proof shows it end to end
   from the original ledger (6b9202a).

## 2. Requirement delta

Added, from the reserve (R-292–R-299 before; R-296–R-299 after — four left, so the ID format
decision must precede the next increment that adds rows). Text final in `tree-b.json` → `new_rows`;
they end FEAT-028's table after R-291.

| ID | Requirement |
|---|---|
| R-292 | Every requirement ID on a feature's `Also applies:` line in REQUIREMENTS.md shall name, once, a requirement that is not retired and whose home is another feature. |
| R-293 | The committed `docs/requirements-tree.md` shall list every requirement named on any `Also applies:` line, with its home feature and every feature that names it. |
| R-294 | Every feature heading in REQUIREMENTS.md shall be followed, before any table, by a `Status:` line reading `proposed`, `active`, `frozen (<reason>)` or `retired (<successor or reason>)`. |
| R-295 | A feature whose `Status:` line in REQUIREMENTS.md reads `retired` shall hold no requirement rows. |

Changed: none. Retired: none. R-287–R-291 stand as built. The intro's reserve sentence records the
consumption (see §4, intro edits).

Not pinned by a test (governance by declaration and review, stated in the ledger): who decides a
tree change; that a brief declares tree changes; that a change to a shared requirement names every
feature that lists it; that a split or merge retires the old ID with a successor. These need the
lane brief fields of the next increment to become checkable.

## 3. Scope

**In.** `REQUIREMENTS.md` re-rendered from `tree-b.json` and `fixed-text-b.md`;
`scripts/requirements-tree.mjs` (parse `Status:` and `Also applies:` lines; checks R-292, R-294,
R-295; outline renders status, also-applies and the shared index; R-291's field check covers the new
fields); `packages/nana-pack/tests/requirements-tree.test.mjs` (pins R-292–R-295, negative fixtures,
mutation pairs); `docs/requirements-tree.md` (regenerated); `docs/requirements-sections-2026-10-09.md`
(regenerated: homes change with the moves); `move.mjs` and `prove.mjs` (extended, §4);
`packages/nana-pack/skills/requirements/SKILL.md` (the paragraph gains the lifecycle and sharing
rules); `docs/code-map.md` (regenerated if headers change).

**NOT.** Any pre-existing row's cells (R-139's missing worker clause is a follow-up, not here); any
ID other than R-292–R-295; the trace rail; templates or copier files; the ID format; the lane brief
template (next increment); subgroup or capability statuses; the HTML page.

**Allowlist.** As increment 1's, plus nothing new. **Frozen at this increment's approved commit:**
`CHANGE-B.md`, `tree-b.json`, `fixed-text-b.md`, `placement-review.md`, `placement-review.json`, and
every increment-1 frozen file.

## 4. Design

**Shared requirements.** A row keeps exactly one home (R-287 unchanged). A feature that depends on
rows homed elsewhere lists them on one line after its `Purpose:` and `Status:` lines:
`Also applies: R-074, R-190, G-005` (sorted, R before G, by number). The three increment-1
`See also:` lines are subsumed: the review upheld all nine of their G links as shares. The outline
shows each feature's also-applies list, and ends with a "Shared requirements (high blast radius)"
table: row · home · every feature that lists it · count.

**Status.** Every feature carries `Status:` right after `Purpose:`. Initial values: `active`, except
eight features wholly inside Jake's D4 desk freeze — FEAT-016, -020, -021, -022, -024, -025, -026,
-027 — which read `frozen (D4: desk work paused until the 2026-10-23 usage ruling)`. The compaction
store's freeze (hardening plan item 6.6) covers only part of FEAT-002 and is not represented; feature
statuses do not split. No feature is `proposed` or `retired` today.

**Feature block order.** heading · `Purpose:` · `Status:` · `Also applies:` (if any) · moved notes
(if any) · tables. Capability: heading · `Purpose:` · `Outcome:`. Subgroup: heading · `Purpose:`.

**Moves.** The 17 moves in `tree-b.json` → `moves`; each moved row is appended to its target table,
in ID order. The rows are byte-identical; only their position changes.

**Governance text.** `fixed-text-b.md` replaces `fixed-text.md`: "How this file is organized" (now
naming `Status:` and `Also applies:`), a new "How the tree is governed" (who decides; a feature's
life; a requirement's life), then "Purpose and outcomes" unchanged.

**Intro edits.** `tree-b.json` → `intro_edits` replaces increment 1's single `intro_edit` and
amendment A1: two edits to the ORIGINAL base intro — the 13c phrase, and the reserve sentence now
reading "R-287–R-295 consumed 2026-10-09 and 2026-10-10 (the requirements tree), R-296–R-299 stay
the reserve".

**Proof, end to end.** `prove.mjs` keeps `--approved 6b9202a…` as the BASE (the original ledger)
and gains `--inputs <increment-B approved sha>`: it reads `tree-b.json` and `fixed-text-b.md` at that
commit. `--amendment` is retired (its edit is inside `intro_edits`). It still accounts for every
physical line, now including `Status:` and `Also applies:` lines (exact text from `tree-b.json`),
validates R-287–R-295 as canonical four-cell `implemented` rows citing
`packages/nana-pack/tests/requirements-tree.test.mjs::`, and checks the regenerated section map.
`move.mjs` renders the same layout. The two still share no code.

## 5. Verification (doneWhen)

1. `prove.mjs --approved 6b9202a501a7fe03dfc834ab34cdfc212f6d92ce --inputs <B sha> REQUIREMENTS.md docs/requirements-sections-2026-10-09.md` → exit 0.
2. `npm run req:tree`, `npm run map`, `npm run map:check`, `npm run test:locked` → exit 0.
3. Mutation pairs (code or scratch copies only, red then green): an `Also applies:` entry naming a
   row homed in the same feature, a retired row, an unknown ID, and a duplicate (R-292, four); an
   outline missing one shared row or one sharing feature (R-293); a feature with no `Status:`, and
   one with `Status: done` (R-294); a `retired` feature holding a row (R-295); proof runs on scratch
   copies: a moved row left in its old home, a wrong `Status:` text, an `Also applies:` line with
   one ID dropped — each exits 1.
4. The seat's own checks, handed to the builder, pasted VERBATIM in its report: `seat-verify-b.sh`.

## 6. Checkpoint 2 (both increments), about 20 minutes

The outline (now with statuses and the shared index), `placement-review.md` (17 moves, 95 shared
requirements, refuted items, six critic questions with the seat's rulings), the governance text,
the proof line, the review verdicts, and the claim most likely wrong. Then the seat lands.

Review ladder: sol plan review (item `req-tree-b-plan`, ≤ 3 rounds); sol build review (item
`req-tree-b`, ≤ 3 rounds); astra land review on the same revision. Appetite (advisory): hand-written
changes ≤ 6 files and ≤ 600 lines, not counting the re-rendered ledger, outline, section map and map.

## 7. Follow-ups (not in this increment)

- R-139 (or a new row): pi-watchdog sets `NANA_HANDOFF=off` for every child — the R-137 share to
  FEAT-006 rests on it, and no row states it.
- The ID format: four IDs remain after this increment.
- Lane brief fields (`Feature:`, `Requirement delta:`, `Tree changes:`) and the land-time structure
  diff, which make the governance rules checkable.
- Subgroup-level status, if partial freezes like the compaction store's need to show.
