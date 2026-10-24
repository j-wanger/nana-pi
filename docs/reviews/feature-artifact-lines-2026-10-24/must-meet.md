# feature-artifact-lines · must-meet of record (seat, 2026-10-24)

Feature: FEAT-028 · Maintain requirement identity and trace links

Written by the seat from the artifact-model plan (`docs/reviews/artifact-registry-2026-10-24/plan-draft.md`, the L3 rows of section 6) and lane 1's must-meet (lane split item 3), plus the derived and verified entry table (`entry-table.md`, this folder, written by an adversarial verifier from the derive text `entry-table-derive.md` kept beside it) and one adversary pass (`plan-attack.md`, this folder; 1 MUST, 6 SHOULD, 8 NOTE, all taken except where a decision below says otherwise). Plans get no review round. Where this file and the plan differ, this file holds.

The owner's decision, 2026-10-24: "Feature artifact lines (Recommended)", the third of the four artifact lanes. Lane 1 gave each artifact an entry in its maker feature's span. This lane records which other features read it, and registers the artifacts lane 1 left out, so lane 4 can draw the flow between capabilities.

Spend line: the current priority (since 2026-10-23), appetite clause 1 (every deliverable read by code) and clause 2 (the report showing each deliverable's real reader).

Stakes: medium blast, reversible. The lane adds a field the tree checker reads, and R-2730 makes every deliverable note fail every land's suite in this repository. A wrong rule either blocks every land or lets a stale reader pass.

Threat model: honest variation in our tools' output and in other projects' ledgers is in scope; deliberate forgery is out (a reader path that never opens the artifact, a false row citation).

Order: builds after lane 2 (report-names-artifacts) lands; both edit `scripts/deliverables.mjs` and the ledger. Row IDs start at R-2795 (lane 2's must-meet, attack 13).

## Seat decisions

- **Grammar.** One line per artifact a feature reads, in that feature's span, after its `Artifact:` lines, or after Status and Also applies when it has none, before any subgroup: `Reads: A-nnn · <reader path>[, <reader path>]`. Reader paths are tracked files, never folders or globs, the same rule as writers.
- **Why paths and not bare IDs.** A bare ID list cannot go stale visibly. A reader path renamed or deleted gets a note, so a feature's read stays checked the way a writer is. This is the priority's own rule: nothing built once and left to go stale.
- **No `Writes:` line.** An entry's writers already name every writing file, and a second writer in another feature is listed on the entry itself. The plan's `Writes:` row (old R-2792) is dropped by subtraction.
- **Own reads are implicit.** A feature never lists an artifact registered in its own span; such a line gets a note. A feature's reads are what crosses a feature boundary.
- **Which feature reads (attack 1).** A `Reads:` line goes in the span of the feature whose own row states the behaviour the reading code serves. A deliverable row's `built from:` list is such a statement for its home feature: each entry it names that the home feature does not register gets a `Reads:` line there, citing that deliverable row. The entry table cites the row; the checker ties only built-from lists (R-2798), since forgery is out of scope and the other row ties are review facts.
- **What counts as a read (derive doubt 1).** Run-time code that acts on the artifact's content or presence: it opens, parses, lists or stats it to decide something. The install check's reads in its temporary home count, because they check the artifact install makes. Tests, docs, inventory lists that only name a path, code that only removes or executes the artifact, and location constants do not.
- **Built-from lists tie to reads (derive doubt 2).** Each entry a deliverable's `built from:` list names is either registered in the deliverable's home feature or read there by a `Reads:` line. The checker notes a missing one (R-2798). This makes the claim and the feature lines agree mechanically, so neither drifts alone.
- **Prompt and rule sources (derive doubt 15).** The builder preamble, the seat rule and the soul rule are registered like the standards rule and the review standard.
- **Reads lines are not registry entries (attack 3).** They do not enter the registry's entries, its ID map, or the count that switches the registry rules (plain-path notes, the R-2784-style reference rule) and the page's `no artifact registry` text. They do count toward the tree checker's print gate (R-2538), and a `Reads:` line makes the shared report read the HEAD tree, as an automatic writer does (attack 4).
- **One parse, one label (attacks 13, 14).** `scripts/deliverables.mjs` exports one reads parse; the outline, its field check and the movement report import it, and lane 4 will. The `Reads` label is a contract value beside `ARTIFACT_LABELS`, with provenance naming R-2795.
- **Kindless trees.** Under a capability with no `Kind:`, `Reads:` lines are prose: no notes, no outline line (lane 1's kindless rule).
- **The remaining entries.** The entry table's Table A lists every artifact the audit's sweep found that lane 1 did not register and that is a lasting artifact; Table C lists the rest with a reason. New IDs start at A-049; A-? gaps stay unused.
- **Lift and regroup.** The lift keeps every `Reads:` line under its feature (R-2787 widens). A regroup's owner page does not show reads, and a split sends all of a feature's reads to one successor: a FEAT-028 known-bug line, as for entries.
- **Ledger text.** The organization, governance and checks paragraphs, `templates/_shared/requirements-organization.md` and the requirements skill describe the `Reads:` line and the new rows.

## Must-meet rows (FEAT-028; test file requirements-deliverables.test.mjs unless noted)

- **R-2795.** WHEN a feature span under a kinded capability holds a `Reads:` line, the deliverable check shall read it as `Reads: A-nnn · <reader path>[, …]`, reporting one note for a malformed line (not exactly two ` · ` parts, a first part that is not one A-ID, or an empty reader after splitting on commas), an ID with no live entry, an ID registered in the same span, a second `Reads:` line for the same ID in the same span, a reader that is not a tracked file, a `Reads:` line in a proposed or retired feature's span, or a `Reads:` line in a capability or subgroup span under a kinded capability, and none for any `Reads:` line under a kindless capability. Test: `R-2795: a reads line names a live entry read by tracked files, and a malformed, unknown, own, repeated or misplaced line or an untracked reader gets one note`. Red cases:
  - `Reads: A-999 · scripts/x.mjs` passes;
  - a feature reading its own A-ID passes;
  - an untracked or folder reader passes;
  - a second `Reads: A-002` line in one span passes;
  - a kindless capability's `Reads:` line gets a note;
  - a retired feature's valid `Reads:` line passes;
  - through `deliverableReportLines`, an untracked reader in a ledger whose only path is that reader gets no note;
  - a ledger whose only registry-like line is a `Reads:` line gets a note for a plain-path third part;
  - a ledger whose only field line is a `Reads:` line prints nothing under `--check`.
- **R-2796.** WHEN a feature span under a kinded capability holds `Reads:` lines, the outline shall list the IDs of the span's well-formed `Reads:` lines, in document order and each once, on one `Reads:` line after its `Artifacts:` line, or after its Parent line when it has no entries, have the outline field check report a dropped or altered `Reads:` line, and preserve the committed outlines for c4332ecb, 4b3846ec, 5548d4c2 and 0943299b. Test (requirements-tree.test.mjs): `R-2796: the outline lists each feature's read artifact IDs, the field check catches a dropped line, and the historical outlines are unchanged`. Red cases:
  - the line is omitted;
  - a dropped `Reads:` line passes the field check;
  - the 0943299b outline changes;
  - a kindless capability's `Reads:` line appears in the outline;
  - an altered `Reads:` line passes the field check.
- **R-2797.** WHEN a feature's `Reads:` lines change (an ID added or removed, or a reader path added, removed or changed), the movement command shall name the feature and each change in its artifacts section and count it in the summary as `N read change(s)`, comparing kinded spans only and counting a reorder of the same reader paths as a change, never "tree movement: none", while keeping today's output byte for byte when no `Reads:` line changed. Test (requirements-moved.test.mjs): `R-2797: the movement report names every change to a feature's reads and is unchanged when no reads line changed`. Red cases:
  - a reader path change is not printed;
  - a removed `Reads:` line prints "tree movement: none".
- **R-2798 (attack 2).** WHEN a listed deliverable's `Made by:` claims name a live entry in a `built from:` list, parked or not, and that entry is neither registered in the row's home feature (the feature whose span holds the row's table, or that subgroup's parent feature; an `Also applies:` line does not count) nor named on a `Reads:` line in that feature's own span, the deliverable check shall report one note per row and entry, naming the row, the entry and the feature, however many claims name it. Test: `R-2798: each built-from entry is registered or read in the deliverable's home feature`. Red cases:
  - a built-from entry from another feature with no `Reads:` line passes;
  - a built-from entry registered in the home feature gets a note;
  - a built-from entry read by a `Reads:` line in another feature passes;
  - a subgroup-homed row whose built-from entry is registered in the parent feature gets a note;
  - two claims naming the same missing entry give two notes;
  - a direct `A-nnn` reference to another feature's entry gets an R-2798 note.
- **R-2730 (test change, attack 5).** The control ledger also gains `Reads: A-999 · scripts/x.mjs` in a feature span and yields exactly three registry notes through `deliverableReportLines`.
- **R-2538 (text change, attack 3).** "a ledger whose only field lines are registry lines" becomes "a ledger whose only field lines are registry or `Reads:` lines"; its test gains a `Reads:`-only ledger.
- **R-2787, widened (text change).** The lift keeps every `Artifact:` and `Reads:` line byte for byte under its feature, with no mapping and when a mapping moves the feature. Its test gains a `Reads:` line.

## Precedent

- `scripts/deliverables.mjs` — `artifactRegistry`, `ownFieldLines` with its label set, `registryReference`, and the tracked-writer check; the reads parse goes beside the registry parse and shares its one parse per ledger (lane 2).
- `scripts/requirements-tree.mjs` — the `Artifacts:` outline line and its field check (R-2785).
- `scripts/requirements-moved.mjs` — the artifacts section and its summary count (R-2786).
- `scripts/requirements-lift.mjs` — feature prose carried through a lift (R-2787).
- `packages/nana-pack/tests/requirements-deliverables.test.mjs` — the R-2780 to R-2783 tests and their temporary repository fixture; the R-2730 control ledger.
- `packages/nana-pack/tests/requirements-tree.test.mjs`, `requirements-moved.test.mjs`, `requirements-cap-kinds.test.mjs` — the R-2785, R-2786 and R-2787 tests.
- `docs/reviews/artifact-registry-2026-10-24/entry-table.md` — how lane 1 derived, verified and pasted its entries.

No private helper moves to a shared module.

## Class and builder

Ordinary: the tree checker and the ledger; no install, hook, gate or land-tool change; lane 1 was ordinary. The larger builder, one session: the paste is large (Table A and Table B). The seat runs wrong-code pairs before the final review.

## Known limits (the seat writes them before the final round)

- The checker does not tie a `Reads:` line to the row it serves; a reader path that is tracked but no longer opens the artifact passes.
- A regroup's owner page does not show reads, and a split sends all of a feature's reads to one successor.
- A feature's `Read by:` paths on its deliverables and its `Reads:` lines overlap; lane 4's flow view draws only `Reads:` lines.
- A lift that merges two features can leave a repeated or self-read `Reads:` line; the check notes it.
- Table B covers the reads the derive and the verifier found, not a whole-repository sweep; the reads no feature's own row states (product-report `--root` on another project, the regroup page, the knowledge build's crawl, this repository's own AGENTS.md, CLAUDE.md and `.pi/nana-pack.json`) have no line.
- The ledger text the lane adds must not start a line with `Reads:` inside a capability span, or that line is parsed as a field.
