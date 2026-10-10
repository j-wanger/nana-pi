# Fable consult on the change declaration (seat adversarial consult, 2026-10-09)

Fable (Claude, `model: fable`) read the first draft of `CHANGE.md`, `mapping.json` and the repo,
read-only, and answered eight questions. Its verdicts and the seat's response:

| # | Fable's point | Seat response |
|---|---|---|
| 1 | Keep the single move (a partial move leaves two navigation systems and needs an exemption), but put the names-and-grouping review BEFORE the build: afterwards a regrouping is a second move, before it a JSON edit. | Adopted. Checkpoint 1 now carries `outline.md`. |
| 2 | Rows not testable as worded ("feature heading" undefined); R-289 checks a SUB ID's digits, not where it sits; unpinned cases unstated. | Adopted. Heading forms named in the rows; uniqueness (R-289) and nesting (R-290) split; unpinned cases listed. Four IDs, not three. |
| 3 | Part G whole: keep, but the R-756 test is order-free, so the honest reason is that rendered projects read Part G as one block. | Adopted the reason. |
| 4 | The intro cites "section 13c" (dangling after the move); the §10 note is positional; old headings carry package ownership; a lane folder is the wrong home for a permanent map. | Adopted. One declared intro edit; §10 note to the map; package column; map at `docs/requirements-sections-2026-10-09.md`, cited from the ledger. |
| 5 | Keep CAP/FEAT IDs; an embedded feature number in SUB IDs forces renumbering when a subgroup moves. | Adopted. Flat SUB-001…SUB-021; R-290 pins nesting. |
| 6 | 140 outline lines plus proof plus verdicts in 15 minutes is a skim. Give one 38-row table (rows, status mix, frozen/idle share); one proof line. | Adopted, in `outline.md`. |
| 7 | §7 restated the working pattern: cut it. Missing piece: nothing here changes what a session does until the lane brief names the feature and the requirement delta. Propose one feature per lane as a trial. | Adopted. §7 cut to its two specifics; brief fields are increment 2; the size rule is decision 3. |
| 8 | Facts: `mapping.json` listed the four subgrouped features' rows twice (feature list and subgroup lists, different orders), so the "doubly placed" stop would fire on 280 rows; rule 6 misdescribed `requirement-rows.mjs`; the Open questions heading level changes; only two `---` lines. | Adopted. `tree.json` drops the feature-level list where subgroups exist; rule 6 now names the rail's row regex; heading change declared. |

Fable's single insisted change: the outline review before the build. Its claim most likely wrong in
the first draft: "a rename or a moved row afterwards is a one-line edit" — corrected in §6.
