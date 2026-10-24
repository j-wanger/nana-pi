# artifact-registry · must-meet of record (seat, 2026-10-24)

Feature: FEAT-028 · Maintain requirement identity and trace links

Written by the seat from the planner's draft (`plan-draft.md`) and three adversary passes (`plan-attack-format.md`, `plan-attack-checker.md`, `plan-attack-page.md`), all kept in this folder, and the verified entry table (`entry-table.md`). Plans get no review round. Where this file and the draft differ, this file holds.

The owner's decision, 2026-10-24, after the product ledger audit (workflow wf_355ecc0f-a46): all four lanes the seat offered, among them "Artifact registry with IDs", "Page names artifacts" and "Feature artifact lines". The owner's question was why so many features say "no artifact named", since artifacts tie capabilities and features together.

Spend line: the current priority (since 2026-10-23): artifacts as maintained features; appetite clause 1 (every deliverable made by an existing run and read by code, or parked) and clause 2 (the report showing each deliverable's age and real reader).

Stakes: medium blast, reversible. The lane changes what the tree checker reads and which deliverable notes fail every land's suite (R-2730). A wrong rule either blocks every land or lets a false artifact claim pass silently.

## The lane split (seat decision)

Four lanes, one feature each, in order (AGENTS.md "a lane is one feature"; REQUIREMENTS.md "a builder adds or changes rows only in the feature its brief names"):

1. **artifact-registry (this lane, FEAT-028):** registry lines, classes, checks, references from deliverable claims, the migration of all 41 claims, the audit's claim corrections, the outline, the movement report, the ledger's own description, the requirements skill and the shared template text.
2. **report-names-artifacts (FEAT-039):** the page's three states, ages by class, the clone-store age table that replaces `MACHINE_LOCAL_ARTIFACTS`, the features-with-no-deliverable list. After lane 1 lands.
3. **feature-artifact-lines (FEAT-028):** feature `Reads:` lines and the remaining entries. After lane 2 lands (adversary page S11: both edit the same files), larger builder.
4. **artifact-flow (FEAT-039):** the Artifacts view, flow between capabilities, orphans. After lanes 2 and 3.

## Seat decisions on the attacks

- **Governance (format M2, page M2): decided by the seat, not the owner.** An artifact entry is a fact about code, like a requirement row, not a tree change. "Who decides" keeps its list; a new paragraph says artifact entries and feature artifact lines are added like rows, by a builder within the feature its brief names, and the movement report shows every change to the reviewer. The owner sees them on the page. The owner may overrule. This lane writes entries in many features' spans, as deliverable-fields and park-honestly (both FEAT-028) wrote claim lines in every capability block: entries and claims are ledger fields, not rows, so the one-feature rule for rows holds.
- **Frozen desk features: registered as ledger lines only (plan question 1, default taken).** Their artifacts get entries under the frozen features; no desk row or code changes. pi itself writes every session file, so the session store is one manual entry, A-023, which the parked `manual: desk frozen` claims of R-260, R-256 and R-257 name (page M1, resolved by the entry table's verifier).
- **Tags and CI records: "age not measured" (plan question 2, default taken).** R-1012 stays as it is.
- **Binding (checker M1): a named reference binds the claim's run and every writer.** The claim's run must equal the entry's run, and the claim's code paths must include every writer of the entry. Until lane 2, the shim that maps an entry back to one of today's three machine-local names does so only when the entry's location is that store's own location, built from the imported subpath constant, and its run and writer match today's map entry exactly.
- **Built-from lists (format M1): only live IDs.** Each ID in a `built from:` list must name a live entry; no run or writer binding.
- **Shapes (checker M2, page S5):** `CI record` is `ci: <tracked .github/workflows/*.yml path>#<name without "/">`; `git ref` is `refs/heads/…` or `refs/tags/…`; `tracked` forbids `~`, `<`, `\`, `..`, a wildcard first segment and `**`; `*` stays within one segment. Writers are tracked files only, never folders or globs.
- **Glob matcher (checker S12, page S9):** imported from `apps/bench/lib/checkers.mjs` `globMatch` (code-map.config.json puts `apps/` and `scripts/` in one layer), not written again; the seat's checks confirm map:check accepts the import.
- **No plain paths (format S1, checker S4, page S6):** no `Made by:` third part in this repository's ledger is a plain path, parked or not; every unparked deliverable carries a reference or a `built from:` list.
- **Duplicates and dead spans (format S2, S3):** two live entries with the same class and the same exact location string get one note; a live entry in a proposed or retired feature's span gets one note. A reused A-ID resolves to its first line and gets a note.
- **Kindless trees (format S8):** under a capability with no `Kind:`, `Artifact:` lines are prose: no notes, no outline line.
- **Gate (checker S7):** a ledger whose only field lines are registry lines still prints its notes in `--root`, `--write` and `--check`.
- **R-2730 control (checker S8):** the control ledger gains a malformed `Artifact:` line and a dangling `A-999` reference and yields exactly those two registry notes through `deliverableReportLines`.
- **Movement report (format S4, page N20):** writer changes are a trigger; an artifact-only change prints a summary with its count and never "tree movement: none".
- **Regroup (format S9, page S10):** R-2787 gains a mapping case (a feature moved to another capability keeps its `Artifact:` lines byte for byte); the regroup owner page not showing entries is a FEAT-028 known-bug line.
- **Ledger text (format S7, page N17):** the ID-blocks paragraph, the organization paragraph, the checks paragraph, `templates/_shared/requirements-organization.md` and the requirements skill describe the A- space, the line, the classes and the new rows.
- **`ownFieldLines` (format N1, page N13):** takes a label set as a parameter; its current callers keep today's labels and counts.
- **Multi-ID claims (checker N13):** in this lane the page shows the first referenced entry's resolution for a claim; lane 2 renders every entry. A known limit until then.
- **Seat pairs (page N18):** an ordinary lane, but it changes what fails every land's suite, so the seat runs wrong-code pairs before the final review, as park-honestly and report-at-land did.
- **Class: ordinary; builder: the larger builder, one session.**

## Must-meet rows (FEAT-028)

- **R-2780.** WHEN a feature span under a kinded capability holds an `Artifact:` line, the deliverable check shall read it by its A-ID; and it shall report one note for a reused ID, a malformed line, an `Artifact:` line in a capability or subgroup span under a kinded capability, or a live entry in a proposed or retired feature's span, and none for any `Artifact:` line under a kindless capability. Test (requirements-deliverables.test.mjs): `R-2780: an artifact line is read by its ID, and a reused ID, a malformed or misplaced line, or a live entry in a proposed or retired feature gets one note`.
- **R-2781.** IF an entry's class is not in the sealed list, or its location lacks that class's shape, THEN the check shall report one note naming the entry. Test: `R-2781: an unknown class or a location of the wrong shape for its class gets one note`. Red: `user-home store: docs/x.md`, `CI record: docs/new.md`, `git ref: docs/x`, `tracked: docs\x.md` or `tracked: */x.md` passes.
- **R-2782.** WHEN a tracked entry matches no file at HEAD, an automatic entry names a writer that is not a tracked file, a manual entry has no reason, or two live entries share a class and an exact location, the check shall report one note naming the entry and the path. Test: `R-2782: a tracked entry matching nothing, an untracked or non-file writer, a reasonless manual entry, or a second entry at the same location gets one note`. Red: an untracked `docs/new.md` passes; `docs/reviews/*/x.txt` matches `docs/reviews/a/b/x.txt`.
- **R-2783.** WHEN a `Made by:` third part names `A-nnn[, …]`, the check shall report one note for each ID with no live entry and for each entry whose run differs from the claim's run or one of whose writers is missing from the claim's code paths; WHEN it is `built from: A-nnn[, …]`, one note for each ID with no live entry; and a valid reference shall get no not-tracked note. Test: `R-2783: a registry reference binds the claim's run and every writer, a built-from list needs only live entries, and a valid home reference gets no not-tracked note`. Red: `suite: scripts/test.mjs · A-033` (A-033 written by suite-records.mjs) passes; `built from: A-001` on a session-start claim gets a note; a valid A-002 gets "not tracked at HEAD".
- **R-2784.** No `Made by:` third part in this repository's ledger shall be a plain path, and every listed deliverable that no `Parked:` line holds shall carry a registry reference or a `built from:` list on a `Made by:` line. Test: `R-2784: this repository's ledger names every unparked deliverable's artifact or what it is built from, and keeps no plain-path artifact`. Red: R-509 keeping its schedule.json path passes; R-873 without its `built from:` passes.
- **R-2785.** WHEN a feature span under a kinded capability holds entries, the outline shall list their IDs on one `Artifacts:` line after its Parent line, the outline field check shall report a dropped or altered `Artifacts:` line, and the outlines for c4332ecb, 4b3846ec and 5548d4c2 shall still equal the committed ones. Test (requirements-tree.test.mjs): `R-2785: the outline lists each feature's artifact IDs, the field check catches a dropped line, and the historical outlines are unchanged`.
- **R-2786.** WHEN an entry is new, removed, newly retired, under another feature, or has a changed class, location, run or writer, the movement command shall print an artifacts section naming each and a summary that counts the artifact changes, never "tree movement: none"; and its output shall be byte for byte as today when no entry changed. Test (requirements-moved.test.mjs): `R-2786: the movement report names every artifact entry change, a writer change included, and is unchanged when no entry changed`.
- **R-2787.** WHEN an accepted ledger carries `Artifact:` lines, the lift's dry run with no mapping shall exit 0 with a clean proof and keep each line byte for byte under its feature, and a lift whose mapping moves a feature to another capability shall keep its `Artifact:` lines byte for byte under that feature. Test (requirements-cap-kinds.test.mjs): `R-2787: the lift keeps every artifact line under its feature, with no mapping and when a mapping moves the feature`.

Rows that change text or tests: R-2536 (its artifact clause becomes "an artifact third part that is neither a registry reference nor a built-from list"; its `runtime-map` passing case moves to R-2743's test, which stays as it is in this lane); R-2538 (a ledger with only registry lines prints in every mode); R-2730 (the control ledger's two registry notes).

## Tunables

- The sealed class list, the A- ID pattern and the location shapes are contract values in `scripts/deliverables.mjs`, each with its provenance comment naming this lane's rows; one seal test names R-2781.

## Wrong-code pairs (the seat runs them before the final review)

The seat writes the table after build 1, from the rows' red cases above, the binding (claim includes every writer), the shim (location from the imported constants), the kindless rule, the gate, and the no-plain-path rule.

## Known limits (the seat writes them before the final round)

- Home, other-project, git-ref and CI locations are checked for shape and writer only; a stale location passes (checker S5). A FEAT-028 line.
- A regroup's owner page does not show artifact entries, and a split routes all of a feature's lines to one successor. A FEAT-028 line.
- Until lane 2, the page shows one artifact per claim, and home, other-project, ref and CI entries show "age unknown: not tracked at HEAD".
- Until lane 2, a glob entry (A-035, A-048) resolves to no artifact on the page, so its claim shows "no artifact named".
- A-012, A-013, A-019 and A-020 are written at `~/.claude`, but the code follows `CLAUDE_CONFIG_DIR` when it is set.
- Feature `Reads:` lines and an entry's readers wait for lane 3; a deliverable's `Read by:` paths stay the only reader record.

## Docs and lines that change

- REQUIREMENTS.md: the entries of `entry-table.md` table A in their maker features' spans; the Made-by lines of table B; the corrections of table C; rows R-2780 to R-2787 under FEAT-028; the text of R-2536, R-2538, R-2730; the ID-blocks, organization, governance and checks paragraphs.
- `docs/requirements-tree.md` regenerated; `templates/_shared/requirements-organization.md`; `packages/nana-pack/skills/requirements/SKILL.md`; `packages/nana-pack/README.md` if it names the claim grammar.
