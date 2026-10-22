# Research A — what the lift gives the regroup

*nana-pi `main` `e451c90`, 2026-10-15. Read = source read at that tip; Ran = run on this Mac against copies in this scratch folder (repo untouched,
`git status` clean); INFERRED = neither. Cites without a file are `scripts/requirements-lift.mjs`; `proof:` = `scripts/requirements-lift-proof.mjs`;
`tree:` = `scripts/requirements-tree.mjs`; `test:` = `packages/nana-pack/tests/requirements-lift.test.mjs`; `CHANGE` = `docs/reviews/lift-2026-10-14/CHANGE.md`.*

## 1. Bottom line

- A regroup proposal is a lift mapping JSON (CHANGE:56-77), committed inside the project root and applied with `--mapping <file> [--write]`. No lift change is needed for a
  share-free ledger: renames, cross-capability moves, merges and proposed empty features all pass today (Ran, §4).
- nana-pi has **two** blockers, not one. (1) Its 31 `Also applies:` lines are refused (Ran: exit 1, 31 lines, nothing else). (2) Hidden behind them: its 22 G rows sit in
  FEAT-033, and the validator demands each G row in its seed subgroup (:532-536). With shares patched in a scratch copy, the identity mapping fails on exactly those 22 rows (Ran).
- Smallest share change: about six lines in two modules plus one new proof check (§5). Without the new check, a mapping that omits a feature's shares drops them silently (Ran).

## 2. What a proposal must contain to pass `--mapping --write`

**File (readMapping :478-500; main :914-923).** Inside `--root` by realpath (:916-920). UTF-8; no NUL (:482); re-encodes byte-exact (:483-484); a BOM is stripped (:486); a JSON
object (:488-489); `"lift": 1` (:490, `MAPPING_FORMAT` :38); no string holding U+FFFD, CR or LF (:491-494). `pin.sha256` = SHA-256 of the ledger, BOM removed, LF endings
(:495-496, `pinOf` :398-402). `pin.rows` is never compared (Read). The ledger must first clear `baseRefusals` (:911, :915; :182-230).
**Shape (shapeProblems :415-469).** `tree`: array of capabilities `{id, label, purpose, outcome, from, features}`. Features: `{id, label, purpose, status, also_applies?, from, rows,
subgroups}`. Subgroups: `{id, label, purpose, from, rows}`. `from` entries are `{line, heading}` (:417-421). `rows` holds IDs or same-prefix, non-reversed en-dash ranges (:426-436).
`head: {through}`; `tail: {heading, from, keep}`. Labels, purposes, outcomes and statuses are not shape-checked. A missing one is caught later by the proof's heading compare
(proof:333-335) or the tree check (Read; the error names the sequence, not the field).
**Coverage (validateMapping :503-584).** Node IDs are unique in the mapping (:521). Each `from` names a real heading by exact line text (:511-516). Every row is known, listed once,
and owned (:528-529, :561-562). No R row sits in CAP-90, FEAT-900 or SUB-900 to SUB-904 (:531). Each G row sits in its seed subgroup (:532-536). A `proposed` or `retired`
feature holds no own rows (:538). `head.through` = earliest named heading − 1 (:546-553). Every heading after `head.through` is named exactly once, in a node's `from`, in
`tail.from` or in `tail.keep` (:554-560). Nothing is placed after an unterminated last row (:566-582).
**Proof, mapping mode (proveLift proof:241-613).** Rows byte-identical with their own endings (proof:300-311), in the mapping's order per node (proof:325-329). Output headings equal
the mapping's id, label, purpose, outcome and parent, in order (proof:333-335). Regions run head, nodes, tail (proof:341-354). Every `from` section's prose is carried once into its
node (proof:476-497). A count-based line accounting backs this up (proof:557-607). No R row is under CAP-90 at any depth; each G row is in its seed subgroup (proof:397-407).
`checkTree(out)` is clean (proof:410-411), so statuses must match `tree:19`, purposes must be non-empty, and shares must exist, not be retired, and not be self-homed (tree:194-205).
**Write gate (:982-1000).** git on PATH and a born HEAD. The ledger and the mapping are tracked and equal HEAD (:798-807). No worktree holds an uncommitted copy of either
(:826-850). The ledger bytes are unchanged since the proof, then a temp file and a rename (:776-788). The reviewer re-runs `--mapping <file> --verify <base>`, which takes both from
blobs and runs every check again (:1012-1113).
**What the owner sees (:971-980).** One line per node, `<id>: <n> row(s)`. One line per old-heading → new-node row move or merge (detectMoves :605-635; merge line :619). Then the
proof line. **No label, purpose, status or share is printed.** Ran: a sample regroup renamed FEAT-033 and added FEAT-040; the plan showed `FEAT-040: 0 row(s)` and no rename.
The owner's approval therefore needs a rendered proposal (tree with labels, purposes, statuses, moves, share changes) that the regroup lane builds. The lift does not provide one.

## 3. The regroup's starting point

- `--emit-mapping` on a ledger the tree checker passes writes the identity mapping: each heading to itself, rows in file order, `also_applies` carried (:374-394, :383; S8 CHANGE:224).
  It validates first (:954-955), so any validator refusal also blocks the emit.
- Flat project: either lift with the default and commit (the "Not yet sorted" tree), then regroup from its identity mapping; or apply one mapping straight to the flat ledger (R-1166
  "with or without a tree", CHANGE:35). Mapping mode drops the input-order checks (proof:357-392 run only `fromDefault`). The two-step route leaves a reviewable intermediate.
- nana-pi: tree check 0 problems, 1,136 rows, 39 features (Ran). Even with shares supported, its emit is refused on the G-row rule. Ran: a 20-line script built the identity from
  the exported `buildIdentityMapping`, moved the 22 G rows into CAP-90 › FEAT-900 › SUB-900..904 (5/8/3/3/3), and the patched lift passed. Exit 0, `1136 rows kept
  byte-identical`, tree check 0 problems. The diff against the input was only the G rows and the new CAP-90 block (78 changed lines).
- Moving the G rows out of FEAT-033 is a tree change the owner decides (REQUIREMENTS.md:34-37). FEAT-033's note (REQUIREMENTS.md:1539-1543) frames those rows as a mirror of the shared seed.
  The alternative is a validator exception for nana-pi; I would not take it, because the seed placement is what every rendered project uses.

## 4. What the regroup can and cannot express today

| Want | Today | Where |
|---|---|---|
| Shares | **Cannot.** Any `Also applies:` line outside a field block is refused (:226). The field block excludes shares (:160-173; proof:98-111). A mapping-declared `also_applies` is emitted (:740) but fails line accounting. T22b pins refusal in all six modes (test:1303-1388). | CHANGE residual 3 (:230); HANDOFF.md:63 |
| Move prose | **Cannot**, except a whole section. Prose is bound to its old heading. A node carries all non-row lines of its `from` sections (sectionBody :656-699; proof:430-452). A paragraph cannot move, be dropped or be edited (line accounting proof:557-607). | — |
| Split a section's prose | **Cannot.** Each old heading is named exactly once (:554-560; proof:273-286). Its rows can go to many nodes; its prose stays with one. A re-laid leaf puts prose above one table (:726-727). | residual 2 (CHANGE:229) |
| Rename | **Can.** Labels, purposes, outcomes and statuses come from the mapping (:730-749; proof:333-335; S3 CHANGE:222). But the plan never prints them (§2). Renumbering an ID is also accepted: only uniqueness inside the mapping is checked (:521), and it prints as a merge line (:619). nana-pi's rule "IDs are never renumbered or reused" (REQUIREMENTS.md:44-45) is not enforced by the tool. | Ran (lab regroup) |
| New proposed feature, no rows | **Can.** `from: []`, `rows: []`, `status: "proposed"`. Proposed with rows is refused (:538; tree:189-191). Covered in T20 (CHANGE:180). Cosmetic: a generated rowless node gets no blank line before the next heading. | Ran (FEAT-040 passed) |
| Merge / split as nana-pi governs it | **Can.** The old feature keeps its heading, takes `retired (<successor>)` and holds no rows; the rows move to a new ID (REQUIREMENTS.md:43-45). Its prose stays on the retired heading. | INFERRED from the rules above |
| Reorder capabilities and features | **Can.** Output follows mapping order (proof:341-354). | Read |
| Change row text or status, edit the head or kept sections | **Cannot**, by design (proof:300-311, :423, :526). | — |

## 5. Smallest change for shares (tested in a scratch copy, not in the repo)

(a) `fieldBlockAt`, both copies (:160-173, proof:98-111): the **first** `Also applies:` line in a FEAT heading's span joins its field block (two lines each). Then `baseRefusals`
accepts one share line per tree-form feature. It still refuses shares in a flat ledger (no tree heading, so the block is empty), a second share line, and a share under a CAP or SUB.
`applyMapping` already regenerates the line from `also_applies` (:740) and skips the old one (:683). The identity already carries it (:383), and its shape is already checked (:438-441).
(b) The proof's heading tuple adds the feature's parsed shares against the mapping's `also_applies` (proof:333-335), plus `[]` for features in the default's derived sequence
(proof:364-367).
(c) **New proof check: the same count.** Each old FEAT heading's share IDs follow its `from` to the node that names it. The output's share pairs must equal those pairs, with one
exception: a pair is dropped when its row's new home is that same feature, which the checker forces (tree:201) and the proof can derive. Without (c), a mapping that omits
a feature's `also_applies` passes. Ran: FEAT-001's eight shares were dropped, the run exited 0 with a clean proof, and the plan printed nothing. With only (a)+(b), the lab also showed:
moving R-756 into FEAT-033, which shares it, was refused by the tree check ("is homed in this feature"); after the mapping dropped that share, the run exited 0.
(d) Policy: carry-only (A) refuses every other share change. Declared changes (B) allow adds and drops, with one plan line per change and the recount covering them. nana-pi
governance makes share adds and drops the owner's call (REQUIREMENTS.md:36). B fits a regroup that moves rows out of a feature that still depends on them. A is smaller.
(e) Ledger and tests: R-1167 loses "an `Also applies:` line" and gains "outside a tree-form feature's field block". R-1163 gains the share-count clause, and R-1166 gains
"carrying each feature's declared shares". Ran: with (a)+(b), the lift suite went **55 pass, 1 fail**. The one failure is T22b's six-mode share refusal (test:1386), which must be
rewritten as tree-form shares lifting. The flat-ledger share refusal (T22, test:1276-1300) still passed. New mutation pairs are needed for (c) and for the field-block edge cases.
(f) Not needed: no change to the apply layout or the git gate. Ran: the identity mapping round-trips nana-pi's 31 share lines byte-identical.

## 6. Does share support belong in this lane?

It belongs in the regroup program, but as its **own first slice or lane, class GATE**. It reopens the exact MUST that T22b closed (astra r1, silent share drop; test:1304-1309) in the
proof, which is the tool's safety core. It is about 15 lines plus a test rewrite. The agent's proposal and its rendering are a different review class. The downstream flat ledgers
(work-project, basketball-geek, trading-zone) lift without shares (CHANGE:205-206), so their regroups do not wait on it (INFERRED for their post-lift regroup). Only nana-pi needs
it. nana-pi also needs the owner's ruling on the G rows (§3). Land the share slice first, then the regroup applies to nana-pi.

## 7. What still speaks the old contract

- The skill says "name no regroup command until that lane lands" (`packages/nana-pack/skills/requirements/SKILL.md:132`). The regroup lane rewrites that paragraph; R-1169 pins its phrases.
- nana-pi only: after `--write`, `docs/requirements-tree.md` (outline plus share index) must be regenerated with `npm run req:tree`, because the suite fails on a stale outline
  (REQUIREMENTS.md:26-29; tree:357, :376). The lift does not do this. A "where it went" record like `docs/requirements-sections-2026-10-09.md` (REQUIREMENTS.md:30) would come from the move lines.
- FEAT and SUB IDs cited in HANDOFF, review corpora and briefs go stale on a renumber. `req:` markers cite row IDs only, so they are unaffected (INFERRED; not grepped across docs).
- The proof summary's "lines inserted" counts regenerated headings, fields and table headers. Ran: 359 for a 78-line diff. It is not a diff measure for the owner.

## 8. Claim most likely wrong

That (a)+(b)+(c) is complete for shares. My lab ran nana-pi's identity and four tampers only. Two cases are untested: a feature demoted to a subgroup with shares (its pairs must
re-attach to the parent feature), and a share line sitting after its feature's table (the parser accepts it there, tree:85-98; the writer would move it above the table).

Scratch evidence (this folder): `nana-copy/` (ledger copy and mappings), `lab/` (patched script copies), `mk-gmove.mjs`, `apply-out.mjs`, `real-dry.txt`, `lab-*.txt`, `out-gmove.md`.
