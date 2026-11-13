## 4. Module headers and the code map

Every module opens with the six-tag contract header:

```
@module  path/to/module
@purpose one sentence — if it needs two, the module is two modules
@inputs  what it reads or is given
@outputs what it returns, writes or emits
@effects none | disk | database | network | process
@errors  the typed errors or statuses it can produce
```

Standing rules: named exports only, where a pi extension's default export counts as its
named entry point (no reaching into another module's internals, private helpers or mutable
state) · resources with identity or side effects (db handles, clocks, random sources,
fetchers, file roots) injected at the boundary so the module is exercisable without the real
resource · imports follow the declared layer direction, and a reverse or layer-skipping
import fails the check · one purpose per module.

The map is generated from the import graph plus those headers, and the check is in the suite:

```
pnpm map            # write a current docs/code-map.md (local and ignored in nana-pi)
pnpm map:check      # headers and layers; stale entries too where the project tracks its map
pnpm map:impact <files>    # no `--`: pnpm forwards it literally; transitive callers and callees
npm run map:impact -- <files>    # npm requires `--` to forward arguments
uv run python scripts/code_map.py --impact <files>
```

Spelled with the project's runner: `pnpm map:check` / `npm run map:check` over
`scripts/code-map.mjs`, or `uv run python scripts/code_map.py --check` / `--impact` in a Python
project. Run the map and README checks yourself before committing; nana runs no per-edit checks.

**Before touching a mapped module, run the impact command on it** and work from the blast radius
it reports, upstream and downstream. At every land, the check is green: a missing or malformed
header or an undeclared cross-layer import blocks the land. Where a project tracks its code
map, stale entries also block; regenerate and commit the map with the change. Where it generates
the map without tracking it (nana-pi), `map:check` proves it builds and no map is committed.

**The README is checked the same way (G-012).** A README claim is a row whose evidence is the
readme check, not prose: `pnpm readme:check` / `uv run python scripts/readme_check.py` verifies
that every command the README shows exists (a `scripts` key, or a real script file), every path
and file it names resolves, it carries an install, a run and a test section plus a first
paragraph saying what the project is for, every `--flag` it shows appears in that script's
source, and every script the project ships is named somewhere in the README. It runs in the
suite and on every README edit. **When the README names a command that no longer exists, fix
the README or fix the command — never the check.**

Once the ledger has a tree (capability → feature → subgroup headings), add each new row — including one the audit extracts — to the table of the feature it serves, and name its shares in the requirement diff. Features carry lifecycle `Status:` lines and cross-feature `Also applies:` links. Before changing a row, find every feature that lists it: search the ledger for its ID, including in nana-pi. The project owner decides every change to the tree; the seat proposes a change and declares it. A new capability, feature or subgroup takes an unused ID and a non-empty `Purpose:` line; CAP-90, FEAT-900 and SUB-900 to SUB-904 are reserved for the general-engineering feature. Artifact IDs use the separate A-001 to A-999 space, are allocated in order and are never reused. A builder adds artifact entries and cross-feature read lines like rows within the feature its brief names; the reviewer reads registry and read changes in the diff, and the owner may overrule them. Keep the `## Open questions` heading for unresolved owner decisions. Move a closed question, with its number and note, under a `## Closed questions` heading below the open ones; the product report lists only the open ones.

A maker feature declares its own artifact reader as `Read by: A-nnn · <kind>: <detail>` and a hold as `Parked: A-nnn · since <YYYY-MM-DD>: <reason>`; `runtime` is a reason-bearing reader kind on artifact and deliverable lines. A product capability is a product stage or step with tangible deliverables; a constraint capability is a cross-cutting property. Every capability field is optional. In a capability's own span, outside code fences and in any order, `Kind:` is exactly `product` or `constraint`; `Deliverables:` is a comma-separated list of R or G row IDs; `Needs:` and `Binds:` are comma-separated lists of capability IDs; and `Retired:` is a comma-separated list of live successor capability IDs. Lists contain single IDs, not ranges, wildcards or duplicates. Without `Kind:`, the checker treats `Deliverables:`, `Needs:` and `Binds:` as prose. A feature under a kinded capability may carry `Artifact: A-nnn · <name> · <class>: <location> · <run>: <writer or reason>` lines after its lifecycle lines and before any subgroup. The classes are `tracked`, `clone store`, `user-home store`, `other project`, `git ref` and `CI record`; a retired entry keeps its ID with `retired: <reason or successor>`. After its entries, a feature names each artifact registered elsewhere that its own behavior reads as `Reads: A-nnn · <tracked reader path>[, <tracked reader path>]`; it never lists an artifact registered in its own span. The outline lists each feature's artifact IDs and read IDs after its Parent line. A live product capability may repeat `Made by:` and `Read by:` lines in its own span. Write automatic makers as `Made by: <row> · <run>: <tracked code path>[, <path>…][ · <artifact>]`, where the run is `session start`, `suite`, `land`, `review`, `build`, `CI`, `hook` or `extension`; write hand-made artifacts as `Made by: <row> · manual: <reason>[ · <artifact>]`. A third part may name `A-nnn[, …]` or `built from: A-nnn[, …]`; a named entry binds the claim's run and every registry writer, while a built-from list needs only live IDs. Write machine readers as `Read by: <row> · code: <path>[, <path>…]` or `Read by: <row> · prompt: <path>`, and other readers as `Read by: <row> · person: <reason>` or `Read by: <row> · rule: <reason>`. Code paths and unregistered ledger-relative artifact paths must be tracked at HEAD. A clone-store registry entry earns a record age only at one of the sealed age-table locations under that key's exact run and one writer; every other class follows the page's class-specific age rule. The tree checker prints report-only notes for missing, unreadable, untracked or invalid registry claims. A deliverable the owner holds back carries `Parked: <row> · since <YYYY-MM-DD>: <reason>`. The date is the day of the owner's decision, and the reason says what holds it and what reopens it. The count line leaves a parked deliverable out of its total and ends with `, <n> more parked`. A parked deliverable that code makes and reads still counts as made and read by code, with a note. Unpark by deleting the line.

The product report opens on an Overview: what needs the owner, what is broken, maker and reader gaps, stale or unmeasured ages and each stage's deliverable count. The product report's Product view orders capability kinds, shows constraint coverage with gaps, and puts retired capabilities last. Each product deliverable shows one line with the checker's code-made and code-read marks, its readable reader kinds, a parked mark and its oldest artifact's age or why it has none; its home feature's page shows its written maker, reader and `Parked:` claims and one artifact block naming its registered outputs and inputs, their class-specific ages or why no artifact is written down. Tracked entries show their git age; the registered clone stores at age-table keys show newest-record ages from HEAD; every other class says its age is not measured. Product cards list active or frozen features with no deliverable and their artifacts, while constraint cards list their active or frozen features' artifacts. The Artifacts view shows both artifact attention lists, each entry linked to its maker feature. Feature details show the live entries they register and every artifact their `Reads:` lines name, then their deliverables' blocks and one card per registered live entry with its age, run, reading features and deliverables.

The capability rules carry five amendments:
1. A constraint names every product capability it binds, keeps explicit shares, and carries one tested row per bound stage; there is no implicit every-stage target.
2. A deliverable is a row under the feature that produces it, and its consumer and check stay visible; a missing check is a report gap.
3. Product capabilities are ordered stages only when a later step needs an earlier stage's checked artifact; otherwise they are loops, tool families or services.
4. A feature lives at its main deliverable's stage, and rows consumed in other stages link to it through `Also applies:`; splits need approval.
5. Keep the outcome line, keep every field optional, and retire an old capability ID with named successors instead of relabelling it.

A ledger without a requirements tree keeps its numbered sections; its next step is a lift into the tree, with every row kept byte-identical, then a regroup into capabilities and features that the owner approves. Until then, a ledger with rows and no tree yet is refused by the checker command and the product report with one line naming the row count, saying the ledger has no requirements tree yet, and pointing back here for the next step — in place of one problem per row.

Check the tree with `node "$HOME/nana-pi/scripts/requirements-tree.mjs" --root .`. The product report (`node "$HOME/nana-pi/scripts/product-report.mjs" --root .`) needs the tree, `HANDOFF.md` and git in the project root to build.

A lane brief names its feature as `Feature: FEAT-nnn · <label>`. Both review launchers select the known-bug section from that line.

Lift the flat ledger with `node "$HOME/nana-pi/scripts/requirements-lift.mjs" --root .`: a dry run that shows the plan and the proof line, writing nothing — every purpose is a "Not yet sorted:" placeholder. If the ledger holds uncommitted edits, tell the owner; never commit, stash or discard another session's lines to get past the refusal. Run `--write` only after the owner's yes, and only while REQUIREMENTS.md matches HEAD in every worktree of the repository — the lift refuses otherwise, naming the reason. A shape the default refuses (a hand-built partial tree, say) needs a hand fix to the ledger, or a hand-written mapping file applied with `--mapping` — `--emit-mapping` only writes for a ledger the default already accepts, or one that already passes the tree checker. Check the tree, then commit `REQUIREMENTS.md` by its own path with the proof line in the commit message; the reviewer re-runs `--verify <base>` on the tip. Lift only when no other lane is editing the ledger.

**Regroup a flat or lifted ledger (R-1180)** into the capabilities and features the owner approves: `node "$HOME/nana-pi/scripts/requirements-regroup.mjs" --root . --proposal <file> --out <page>`. The proposal is a lift mapping plus one `regroup` object naming what was read (`regroup.read`), a reason per reported line (`regroup.reasons`), text-placed rows (`regroup.placed`), a gap's evidence (`regroup.evidence`) and the review record (`regroup.review`). The drafter reads `req:` markers and Evidence cells, each module's `@purpose` header, the code map (write a current local map first with the project's map command; `npm run map` in nana-pi), the README's first paragraph, `OBJECTIVE.md` and HANDOFF rulings that freeze or retire work — never session archives or review corpora. A reviewer of another model lineage, or a same-family reviewer named as such, checks every row's placement and every purpose, outcome and section reason before the owner sees the page. Show the page; `--write` with the proposal as `--mapping` runs only after the owner's yes, with the proposal committed, and the reviewer then runs `--verify <base> --mapping <proposal>`. A gap in the tree becomes a `proposed` feature with no rows, never a hand-added row. Before a regroup that moves features, strip the capability fields from the capabilities involved, then add them back.

