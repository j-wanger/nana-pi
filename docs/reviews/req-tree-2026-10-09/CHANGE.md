# Change declaration — the requirements tree (increment 1: move every row under its feature)

*Lane `req-tree` · branch `feat/req-tree` · worktree `~/nana-pi-wt/req-tree` · base `5b68a91` · 2026-10-09.
The first change written in the feature-change format astra proposed and Jake asked the seat to apply.
Order: why → plan → Fable consult (`fable-consult.md`) → sol review (r1 adjudicated in `sol-plan-r1-response.md`) → **checkpoint 1: Jake agrees the
outline and this plan** → build → sol + astra → **checkpoint 2: Jake accepts the result**.*

## 1. Why

**The problem.** `REQUIREMENTS.md` holds 1,004 rows in 60 numbered sections. The sections follow
packages and the order work happened in (gate, installer, desk, bench), not what the rows enable.
35 of the 60 sections mix rows that belong to different features. Jake, 2026-10-09: "otherwise I'll
never get to go through or understand the requirements we have and what they represent." He asked
astra for requirements categories; astra drafted a tree (8 capabilities, 38 features, 21 subgroups,
every row placed once); Jake decided to implement it.

**What it is for.** The tree is the first step toward feature-based development (Jake to astra:
"development should also be feature based … each development session is making way too many
changes"). Once every row has a feature home, a change can name the feature it serves and the rows
it adds or changes, and a review can be read per feature. Increment 2 (section 8) makes the lane
brief carry exactly that; without it the tree changes no session.

**Scenario.** Jake wants to know what makes resuming work reliable. He reads the capability
headings and their purpose lines, opens "CAP-01 · Maintain direction and useful context" →
"FEAT-002 · Resume decisions and next actions", and reads its 62 rows in five subgroups, each with
its own purpose line.

**Observable outcome when this increment is done.**
1. Every row sits in exactly one feature or subgroup table, under a heading with a stable ID and a
   one-line purpose.
2. No row's text, status or evidence changed; no row was lost. A script proves it, byte for byte.
3. The suite fails, naming the row or heading, if a later change puts a row outside a feature,
   leaves a heading without purpose text, reuses an ID, or nests a heading wrongly. Renaming or
   regrouping stays possible on purpose: it is a visible diff that the lane's review reads.

**Where it sits.** CAP-07 "Keep code and promises checkable" → FEAT-028 "Maintain requirement
identity and trace links"; the first piece of astra's candidate feature "Browse purpose, scope and
evidence together".

## 2. Requirement delta

Added, from the free reserve R-287–R-299 (13 at base, 9 after this). Heading forms: capability
`# CAP-nn · <label>`, feature `## FEAT-nnn · <label>`, subgroup `### SUB-nnn · <label>`. The
Requirement text is final (`tree.json` → `new_rows`); the builder writes Status and Evidence. The
four rows end FEAT-028's table.

| ID | Requirement | Status target |
|---|---|---|
| R-287 | Every requirement row in REQUIREMENTS.md shall sit in a table whose nearest preceding heading is a feature heading (`## FEAT-nnn · <label>`) or a subgroup heading (`### SUB-nnn · <label>`). | implemented |
| R-288 | Every capability, feature and subgroup heading in REQUIREMENTS.md shall be followed, before any table or heading, by a `Purpose:` line with non-empty text. | implemented |
| R-289 | No two capability, feature or subgroup headings in REQUIREMENTS.md shall carry the same ID. | implemented |
| R-290 | Every feature heading and subgroup heading in REQUIREMENTS.md shall sit under a heading of the level directly above its own: a capability above a feature, a feature above a subgroup. | implemented |

Deliberately not pinned: a row in the wrong feature (Jake's judgement, not a test); a feature with
subgroups that also holds its own table (harmless); a feature with no rows yet (allowed, e.g. a
planned feature); unique labels (IDs carry identity); the approved names, purposes and grouping
(seat ruling on sol r1 MUST 3: pinning them against a second copy of the tree would make every new
row a two-file edit and bring back the copy that goes stale; a later regrouping is a reviewed diff,
and from increment 2 a declared one).

Changed: none. Retired: none. No existing row's Requirement, Status or Evidence cell changes.

Existing obligations that still apply: the trace rail (markers, cites, statuses; G-013–G-015 form
check); R-756 (Part G cells mirror the shared file); R-649 (`req:rows`); the intro's ID rule (never
renumbered or reused), which the new heading IDs follow too; G-009 (map current: the new test
module needs its header and a regenerated map).

## 3. Scope

**In.**
- Restructure `REQUIREMENTS.md` to the layout in section 4, moving rows by script.
- Add R-287–R-290 and one test module that pins them, with fixture-based negative cases.
- One paragraph in `packages/nana-pack/skills/requirements/SKILL.md`: in a ledger organized by
  capability and feature, a new row goes into its feature's table; a new capability, feature or
  subgroup takes an unused ID and a `Purpose:` line; the general-engineering (G) rows form one
  feature instead of a closing Part; `## Open questions` keeps its heading (the skill's existing
  instruction stays true).
- `docs/requirements-sections-2026-10-09.md` (new): the old-section map, a permanent dated
  reference like the 2026-10-02 extraction notes, cited from the ledger.
- Regenerate `docs/code-map.md`.
- Corpus `docs/reviews/req-tree-2026-10-09/`: the move and proof scripts, their output, reviews.

**NOT (touching one is a scope defect).**
- Any pre-existing row's Requirement, Status or Evidence cell; any new ID other than R-287–R-290.
- The 15 confirmed issues (`docs/reviews/requirements-proposal-2026-10-09/`), the ID format
  (Open question 9), the trace rail (`templates/*/tests/requirements-trace.*`,
  `scripts/requirements-trace.mjs`), any template or copier file, a file split, extra columns.
- Row kind tags, feature scenarios, boundaries or relationships beyond the `Purpose:` line.
- A browser page or generator (HTML pages wait for the writing-trial verdict, 10-18).
- `AGENTS.md`, `CLAUDE.md`, READMEs, the lane brief template.

**Allowlist.** `REQUIREMENTS.md` · `packages/nana-pack/tests/requirements-tree.test.mjs` (new) ·
`packages/nana-pack/skills/requirements/SKILL.md` · `docs/requirements-sections-2026-10-09.md` (new)
· `docs/code-map.md` · new files in `docs/reviews/req-tree-2026-10-09/` (`move.mjs`, `prove.mjs`,
`prove-output.txt`, the builder report).
**Frozen at checkpoint 1 (seat-owned; the builder must not edit):** `CHANGE.md`, `tree.json`,
`fixed-text.md`, `mapping-astra.json`, `outline.md`. `prove.mjs` reads `tree.json` and
`fixed-text.md` from the approved commit (`git show <sha>:…`), not from the working tree.
Seat-owned: `HANDOFF.md`, `docs/sessions/2026-10.md`.

## 4. Design

**Input.** `tree.json` — astra's tree with the seat's deviations applied. `mapping-astra.json` is
astra's draft unedited; the diff between the two is exactly the deviations below. Both carry IDs,
labels and purposes only, never row text: the ledger stays the one copy. In `tree.json` a feature
with subgroups carries no row list of its own; its subgroup lists are its rows, in that order.

**Layout.**

```
# nana-pi requirements
<intro paragraphs: unchanged except one phrase — see rule 3>

<fixed-text.md, BEGIN to END, verbatim: "## How this file is organized" and
"## Purpose and outcomes">

# CAP-01 · Maintain direction and useful context
Purpose: …
Outcome: …

## FEAT-001 · Keep goals and priorities in view
Purpose: …
<See also: line, where tree.json gives one>
<Note (moved from old §N on 2026-10-09): + the old prose block, where tree.json gives notes_from>

| ID | Requirement | Status | Evidence |
|---|---|---|---|
<rows, byte-identical, in tree.json order>

## FEAT-002 · Resume decisions and next actions
Purpose: …

### SUB-001 · Write and identify a compaction summary
Purpose: …

| ID | Requirement | Status | Evidence |
…
# Open questions and deliberate omissions      (new heading)
## Open questions          (heading and body byte-identical)
## Deliberate omissions    (heading and body byte-identical)
```

**Move rules.**
1. Rows move whole, byte for byte, in `tree.json` order.
2. Subgroup IDs are flat (`SUB-001`…`SUB-021`), so a subgroup can later move to another feature
   without renumbering. R-290 pins where it sits.
3. Prose between the old tables:
   - The Part G intro and the §13a, §13b and §13c notes move to the feature `tree.json` names
     (`notes_from`): Part G → FEAT-033, §13a and §13b → FEAT-005, §13c → FEAT-029. They sit
     after the `Purpose:` (and `See also:`) line, each under "Note (moved from old §N on
     2026-10-09):", byte for byte and in their old order. The destinations are declared, not
     computed: §13c's most common new home is FEAT-002 (it holds seven misfiled frontier rows),
     but its note is about the code map.
   - The §10 note is positional ("exhausted above", "the two that follow") and about ID
     allocation; it moves to the old-section map, byte for byte, beside its old heading.
   - The intro's "section 13c" becomes "the code-map generator feature (old section 13c)". This is
     the only intro edit; the proof names it.
   - The two `---` rules and every old heading are dropped; the old-section map lists every old
     heading with its package and its new homes and row counts. Old §48–51 and §54 are nana-pi's
     copies of the shared file's G1–G5; the map says so.
4. **Deviation: Part G stays whole.** All 22 G rows go in FEAT-033 "Adopt explicit engineering
   standards" (astra placed 9 in FEAT-028, -029 and -032). Reason: every rendered project reads
   Part G as one block, and nana-pi should read the same. FEAT-028, -029 and -032 each get a
   "See also:" line naming those G rows.
5. **Deviation: rows after astra's snapshot.** R-286 (pi-worker children get the worker role) then
   R-285 (the knowledge hook skips worker sessions) end FEAT-006's table; astra placed their
   reviewer twin R-973 under the reviewer feature. If main gains another row before the build,
   `move.mjs` stops; the seat places it and records it here.
6. Constraint: the trace rail reads any line shaped `| R-nnn | … |` anywhere in the file as a row.
   No new table may carry R- or G- IDs in its first column; CAP/FEAT/SUB-keyed tables are fine.
7. The closing headings `## Open questions` and `## Deliberate omissions` keep their level and text
   under a new `# Open questions and deliberate omissions`, so the requirements skill's existing
   "under `## Open questions`" instruction stays true.

**Scripts (corpus, outside the code map, run once).**
- `move.mjs <ledger> <tree.json> <out>` builds the new file; exits non-zero on any row not placed
  exactly once.
- `prove.mjs --approved <sha> <before> <after> <section-map>` reads `tree.json` and `fixed-text.md`
  at `<sha>` and walks the new ledger line by line. Blank lines are ignored; EVERY other line must
  be accounted for, in this order, or the proof fails naming the line:
  1. the base intro, byte-identical except the one `intro_edit` phrase;
  2. the `fixed-text.md` block, byte-identical;
  3. for each capability, feature and subgroup in `tree.json` order: its heading in the declared
     form with the `tree.json` ID and label; `Purpose:` + the `tree.json` purpose; for a
     capability, `Outcome:` + its outcome; the `see_also` line where declared; each `notes_from`
     block as the note header plus the old block's lines, byte-identical and in order; one table
     header and separator; the rows in `tree.json` order, each byte-identical to its base line,
     except R-287–R-290, whose Requirement cell must equal `new_rows`;
  4. the tail heading, then the base `## Open questions` and `## Deliberate omissions` blocks,
     byte-identical.
  So no extra prose, no reordered prose and no altered prose can pass. Separately, the section map
  must list every old heading exactly once, with row counts and new homes equal to those computed
  from the base ledger and `tree.json`, and must hold the §10 note byte-identical. The package
  column is declared text, not proved. Output: one summary line, then any failure.

## 5. Verification (doneWhen, from the worktree)

1. `prove.mjs` on the base ledger and the result → exit 0; output saved as `prove-output.txt`.
2. `npm run map`, then `npm run map:check` green.
3. `npm run test:locked` green (rail, the new test, map, README check).
4. Mutation pairs, each red then green again, in the builder report: a row above the first feature
   heading (R-287); a deleted `Purpose:` line and, separately, an empty one (R-288); a duplicated
   FEAT ID (R-289); a FEAT heading before any CAP heading and, separately, a SUB heading before any
   FEAT heading (R-290). For `prove.mjs`: one altered prose byte in place, one extra prose line and
   one swapped pair of note lines each make it fail.

## 6. The two checkpoints

**Checkpoint 1 (now, before the build).** Jake reads `outline.md`: the purpose, the outcomes, a
38-row table (feature, row count, status mix, frozen or idle share) and every heading with its
purpose line. He rules on names and grouping while a change is still a JSON edit, plus the three
decisions in section 7.

**Checkpoint 2 (after the build), about 15 minutes.** One proof line (rows, prose lines and blocks
preserved), the deviations as built, sol's and astra's verdicts, and the claim most likely wrong.
After it: renaming a heading is a one-line edit; moving a row or a whole subgroup is a block move.

Review ladder (the working pattern, with two specifics): the build gets a sol slice review (item
`req-tree`) and an astra land review on the same revision (no extra round), asking whether the
result matches the tree it drafted. Placement disputes about single rows do not block; they go to
Jake at checkpoint 2.

## 7. Decisions for Jake at checkpoint 1

1. **Purpose.** Recommend Jake's own words (`outline.md` top). Alternative: astra's synthesis
   ("Help a developer turn project goals into useful software through agent work that remains
   understandable, bounded, verifiable, and reusable across projects").
2. **Business and technical.** In this increment the business layer is the purposes and outcomes
   at capability and feature level; the rows are the technical layer. Tagging each row's kind
   comes later, feature by feature. Recommend: accept.
3. **Size rule trial.** From increment 2 on, one lane touches one feature's rows, and its brief
   names the feature and the requirement delta. Recommend: trial it for the next five lanes.

## 8. Next increments (not authorized by this declaration)

2. The lane brief template gains `Feature:` and `Requirement delta:`; the review item and the
   session archive name the feature. Small; the issue fixes are its first user.
3. The confirmed issue fixes, wording only, one feature at a time.
4. The ID format (9 IDs left after this increment).
5. Row kinds and fuller feature introductions (scenario, boundary, relationships) as each feature
   becomes active.
6. The tree in the project templates, so every nana project starts with it.
