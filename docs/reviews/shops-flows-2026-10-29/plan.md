# Plan: shops-flows (2026-10-29)

Worktree `~/nana-pi-wt/shops-flows`, branch `feat/shops-flows`, based on main `57167e92`. Rows R-3161 to R-3169 (map-spawn-edges holds R-3149 to R-3160). Artifact ID A-088.

Revision 1 takes the adversary's attack in `plan-attack.md`: all three MUST findings, SHOULDs 4 to 10 (the lane stays one lane, gated on the owner's shape answer per SHOULD 9), and NOTEs 11 to 15. NOTE 16 re-derived the counts; they match.

## Purpose

The owner's words on 2026-10-29, about the 3D map page (`apps/hive/`):

1. "artifacts are too isolated, in the new 3d map, they should be grouped into appropriate categories and be part of the visual flow, each capability actually also becomes a flow in the 3d world"
2. "Artifacts should belong to different shops, each shop is an artifact category, e.g. project memory, governance controls; and roads connect shop to whatever upstream and downstream, moving cargos deliver; follow feature, but only if feature order makes sense, this is an opportunity to audit the order as well, if we use the shop idea we can then list the items (artifacts) for sale which can also help us track the sales number for each artifact (number of cargos delivering/consuming the artifact)"

The working reading is the seat's. The owner has not answered it yet. Its open points are the Questions below, and build 1 runs on their defaults:

- Shops are artifact categories by meaning. Items on a shop's shelves are the `A-nnn` entries of `REQUIREMENTS.md`. The seat proposes the shop list (below); the owner approves it.
- Roads come only from declared lines: the `Artifact:` maker, other features' `Reads:` lines, the item's own `Read by:` claims, and the capability `Made by:`/`Read by:` joins. Every live, unparked item has at least one road out. Cargo moves along roads, and the cargo count is the item's number.
- Each capability is a flow: a route through its features in ledger order. Where a feature reads an artifact that a later feature of the same capability makes, the lane writes an order finding. The seat posts one ask whose default is to keep the order. The lane never reorders the ledger.
- The owner's "sales" splits into two named counts. `buyers` is the declared consumers: who reads the item. `restocks` is the measured changes: "changed in N commits in 14 days". Neither is called "sold". An item whose store this lane does not measure shows `not measured`, never 0.

This lane makes the data and draws it. The data part is contract v2, the shop list, the deriver, the order audit, buyers and restocks. The drawing part is shops, items, roads, cargo, flows and cards in the hive, published on Pages. It runs as two builds with the owner's shape check between them (see Builds and the shape gate).

### Measured today (main `57167e92`, the existing parsers in `scripts/deliverables.mjs`)

- Artifacts: 85 live entries, 0 retired (IDs A-001 to A-087; A-026 and A-027 were never registered).
- Makers: 22 name writer paths (an automatic run); 63 are `manual` with a reason. Each item has exactly one maker line, so a maker count says nothing; cards show the writer paths instead.
- Readers: 83 items have a declared reader; 2 are parked (A-057, A-059). Reader kinds over items: code 68, person 29, prompt 6, rule 5, runtime 1.
- Reader sources: 105 valid `Reads:` lines over 49 items; 24 valid artifact `Read by:` lines; 11 items reach a reader only through a capability join (A-028, A-031, A-035, A-039, A-040, A-043, A-044, A-045, A-047, A-048, A-082). With all four sources, 83 of 83 unparked items have a road out. With `Reads:` alone, 36 would have none.
- Restocks: 1,742 non-merge commits in the 14 days to HEAD. 25 of the 32 tracked items changed at least once (the 7 at zero: A-039, A-040, A-041, A-042, A-074, A-075, A-078). The busiest: A-030 the ledger 330, A-003 the handoff 291, A-072 the code map 239. The other 53 items are outside git and show `not measured`.
- Feature order: 4 of 8 capabilities have a within-capability read that runs backwards, 7 reads in all. CAP-02 has 2 reads, both forward. CAP-03, CAP-05 and CAP-06 have no reads inside, so their order is not judged.
  - CAP-01: A-055 knowledge shown sets, made by FEAT-004, read by FEAT-003. Mutual: FEAT-004 reads A-004 and A-052 from FEAT-003, so no order satisfies both.
  - CAP-04: A-021 release tags, made by FEAT-019, read by FEAT-015. Mutual: FEAT-019 reads A-022 from FEAT-015, so no order satisfies both.
  - CAP-04: A-016 desk launch agent, made by FEAT-016, read by FEAT-015, the diagnose feature. One-way; it reads like a deliberate check-everything loop.
  - CAP-07: A-038 shared general rows, made by FEAT-033, read by FEAT-028. One-way.
  - CAP-08: A-042 study results, made by FEAT-037, read by FEAT-034, FEAT-035 and FEAT-036. One-way; it reads like a deliberate results-feed-setup loop.
- Across capabilities (not audited here, see A6): no capability carries a `Needs:` line; 28 of 67 cross-capability reads run from a later capability to an earlier one.
- Roads under the revised shop list: 44 supply roads (maker feature to shop), 62 cross-feature delivery roads (shop to reader feature), 12 home roads (shop back to its maker feature, from code and prompt `Read by:` lines) and 7 edge roads (shop to the people, rules or host edge, from person, rule and runtime `Read by:` lines). Capability-join roads come on top; the builder measures them.

### Proposed shop list (11 shops, every live artifact in exactly one; verified 85 of 85)

| Shop | Items |
|---|---|
| Project memory (7) | A-001, A-002, A-003, A-051, A-053, A-062, A-084 |
| Knowledge (4) | A-004, A-052, A-054, A-055 |
| Governance controls (11) | A-005, A-010, A-028, A-036, A-037, A-049, A-058, A-079, A-080, A-081, A-083 |
| Requirements and maps (6) | A-030, A-031, A-032, A-038, A-072, A-086 |
| Work records (12) | A-006, A-007, A-008, A-022, A-033, A-034, A-035, A-048, A-056, A-057, A-059, A-082 |
| Releases (2) | A-009, A-021 |
| Machine setup (15) | A-011, A-012, A-013, A-016, A-018, A-019, A-020, A-050, A-060, A-061, A-063, A-064, A-065, A-066, A-071 |
| Project seeds (8) | A-014, A-015, A-046, A-047, A-067, A-068, A-069, A-070 |
| Sessions (4) | A-017, A-023, A-025, A-029 |
| Reports and pages (5) | A-024, A-045, A-073, A-085, A-087 |
| Evaluation evidence (11) | A-039, A-040, A-041, A-042, A-043, A-044, A-074, A-075, A-076, A-077, A-078 |

Changes from the first draft, after the attack:
- A-024, the desk runtime matrix, moved from Sessions to Reports and pages. It is a document in the desk README.
- A-013 (Claude rule links) and A-050 (pi rulings link) moved from Governance controls to Machine setup, beside the other install links. The rules they link stay in Governance controls.
- A-073, the feature assessment store, moved from Requirements and maps to Reports and pages. Only the product report reads it.
- A-017, the desk log, moved from Machine setup to Sessions. It is a run log of the desk's sessions.
- A-036, the requirements skill, stays in Governance controls. It tells agents how to keep the ledger, the same job as the standards rule beside it.

A-088, the shop list this lane adds, goes on the Requirements and maps shelf.

## Assumptions

- A1. Feature placement: the rows go in FEAT-039, the hive's home (A-087, A-086 and R-3120 to R-3139 live there). What may be wrong: FEAT-039 is already the largest feature by rows and known-bug lines.
- A2. The shop list is a tracked hand source, `docs/components/shops.json` (A-088), in the style of `docs/components/nana-pi.json`. It holds the shop id, name, one plain sentence and the item IDs. Item names, classes, locations, writers, buyers and restocks are derived at build time. The check rejects any of them written in the hand source, as R-3103 does for features.
- A3. A road is one distinct (from, to) pair with a shop at one end. It carries the list of A-IDs it moves. The coordinator's "shop-to-shop pairs" is read this way: a road that skipped feature stops would cut the shops out of the flows the owner asked for. Four kinds:
  - supply: maker feature stop to shop;
  - delivery: shop to another feature's stop, from a valid `Reads:` line;
  - home: shop back to the maker feature's stop, from a valid code or prompt reader in the home feature;
  - edge: shop to one edge sink per kind (people, rules, host), from a valid person, rule or runtime reader.

  Capability joins add home roads (code, prompt) to the deliverable row's home feature, or edge roads (person, rule, runtime). A goods trail from shop to shop shows through a feature stop: shop, then delivery road, then a feature, then supply road, then the next shop.
- A4. Buyers: one per valid `Reads:` line, plus one per valid artifact `Read by:` claim, plus one per capability-join reader. Each is keyed by (feature or deliverable row, kind), so no reader counts twice. A parked item has 0 buyers and a closed shelf showing its park reason.
- A5. Restocks: for a tracked item, the number of non-merge commits reachable from HEAD whose committer date falls in the window and that touch the item's location, glob-aware. That is `git log --no-merges --since=<window>` over all of history, not first-parent. A merge is skipped, so a lane's change counts once, at its own commits, whether or not the lane merged main before landing. A cherry-pick or a rebased copy of the same change counts again; that is outside the model and a residual. The window is `ACTIVITY_WINDOW_DAYS`, imported from `scripts/component-audit-config.mjs`. A shallow clone, checked the way `artifactAges` in `scripts/product-report.mjs` checks it, or a failed git call gives `not measured: git history` for every item. Every class other than tracked gives `not measured: <class>`. A measured 0 means a tracked item nobody changed in the window, which is distinct from `not measured`.
- A6. Capability order across the ledger is not audited. The owner named feature order, and no `Needs:` lines exist to audit against. The 28 backward cross-capability reads are reported in this plan only.
- A7. The order audit rule is deterministic. A capability's order "makes sense" when no valid within-capability `Reads:` line has its reader feature before its maker feature in ledger order. Own-feature reads are not written down (known bug, artifact-flow), so they never count. Each finding has a class: `mutual` when a read also runs the other way between the same two features, else `one-way`. A mutual finding says "no order satisfies both". A capability with no reads inside gets `order: CAP-nn not judged (no roads inside)`, not a pass.
- A8. The flow follows ledger order even when a finding exists. A backward road is drawn and marked as a return. The seat posts the findings as one `ask` issue labelled `optional`, default "keep order". It names the two mutual pairs as loops no reorder can fix. A reorder is a tree change only the owner approves.
- A9. Every kinded capability is a flow, constraint ones included (CAP-03). Only active and frozen features are stops; proposed and retired ones are skipped.
- A10. Contract v2 is a new file, `docs/components/contract-v2.json`. `docs/components/contract.json` and `docs/components/fixture.json` stay byte-identical (full sha256 under Precedent). No test pins those hashes today (FEAT-039 known-bug file, line 6). This lane adds the pin and deletes that line.
- A11. v2 is a superset of v1. It keeps v1's document, component, feature, ask and activity fields exactly. It adds three document fields: `shops`, `roads`, `flows` (flows carry their findings). `checkComponentData(v2doc, v2contract)` checks the v1 parts with the unchanged generic rules. A new exported `checkShopData` in the same module checks the new fields.
- A12. The v1 producer is untouched: `scripts/component-audit.mjs` still writes v1 from `docs/components/nana-pi.json`. A new deriver reads that v1 document and the ledger, and writes v2. Every v1 reader keeps working: the audit check, its tests, the frozen fixture, and a local `--data` v1 file. The page draws a v1 file as today, with no shops. The page refuses a version-2 file that fails `checkShopData` (a v1 body labelled 2 is the likely honest slip) with one plain error and no scene.
- A13. Cargo is the number. A supply road shows min(sum of its items' restocks, `CARGO_CAP`) cargo marks. A delivery, home or edge road shows min(its buyers, `CARGO_CAP`) marks. A road whose items are all `not measured` shows one still marker and no moving cargo. A card prints the true number when the cap hides it. With motion on, cargo moves along its road's path. Under `?still` and reduced motion, every road with cargo shows its marks strictly between its ends at sealed fixed fractions. first-look always captures with reduced motion, so this is what the judge sees.
- A14. Shop cards follow art-spec line 5 (no data dumps). A card shows the top items by buyers, sealed `SHOP_CARD_ITEMS`, then "and N more"; the full list is one tap away. Each item line shows its name, its buyers and its restocks ("changed in N commits in 14 days", or the `not measured` reason). No card prints "sold".
- A15. The lane adds one line each to the requirements skill's artifact section and to `apps/hive/README.md`: a new artifact must also go on a shelf in `docs/components/shops.json`, or the suite and the Pages job fail.

## Open choices

- O1. Town geometry inside the must-meet invariants. The suggestion is an outer ring past the governance perimeter for shops, edge sinks at the world's rim, and stop markers for the five features no component holds (FEAT-012, FEAT-017, FEAT-030, FEAT-032, FEAT-033). The builder also picks which cell stands for a feature that sits in two components (six do; the suggestion is the first in audit order). Shop and shelf forms, and road paths, are the builder's.
- O2. The deriver is a new script, `scripts/component-shops.mjs` (recommended, one purpose per module), or a `--shops` mode of `scripts/component-audit.mjs`.
- O3. Card wording and order for shop and flow cards, within the reading voices and A14.
- O4. Whether the order findings print as an `--asks`-style block from the deriver (recommended, so the seat posts them verbatim after the identity scan).

## Questions for the owner

Question: Do shops and flows join the hive's one 3D world, or open as a separate town view of the page?
Default: one world: shops stand in an outer ring around the hive, roads run to the feature cells, and each capability's flow is a traced route over them.
What the default gains and misses: the owner sees artifacts inside the flow he described, beside the components; misses a calmer picture, since over 125 roads across 23 chambers may crowd the overview.
Cost of a wrong guess: easy to undo: the data and cards stay; only layout and camera code move to a second view, and build 2 can do that after the shape check.
If answered otherwise: build 2 adds a Hive/Town switch and lays the town on its own ground plane, with its own camera stops.

Question: Is this the shop list (11 shops, table above, after the five moves)?
Default: the 11 shops as listed, every artifact in exactly one.
What the default gains and misses: covers all 85 artifacts with names the owner used (project memory, governance controls); misses a finer split of Machine setup's 15 items or Work records' 12, and the three judgement calls (A-036, A-073, A-017) may sit elsewhere in his view.
Cost of a wrong guess: easy to undo: the list is one hand file; a change redraws the page and moves no row.
If answered otherwise: the builder writes the owner's list into the shop file; no test pins a shop ID.

Question: For each item, do we show "buyers" (who reads it, from the ledger) and "restocks" (changed in N commits in 14 days), with every untracked store showing "not measured"?
Default: yes; counts from the build, land and CI record stores, and any measured read event, come in a later lane.
What the default gains and misses: every item gets a real buyers number, and 25 of 32 tracked items get a real restocks number; misses actual use, since no store records a read, so buyers are promises, not deliveries.
Cost of a wrong guess: easy to undo: both are derived fields; a later lane adds a third count beside them.
If answered otherwise: the lane also reads the local record stores for restocks, and the public page shows them as "not measured: clone store".

## Feature

Feature: FEAT-039 · See the product and its decisions in one report

Lane class: `ordinary` (`node scripts/lane-class.mjs --root . --files docs/components/contract-v2.json,docs/components/fixture-v2.json,docs/components/shops.json,scripts/component-shops.mjs,scripts/component-shops-config.mjs,scripts/component-contract.mjs,scripts/component-audit-config.mjs,scripts/deliverables.mjs,scripts/product-report.mjs,scripts/hive-page.mjs,apps/hive/runtime.mjs,apps/hive/layout.mjs,apps/hive/town.mjs,apps/hive/assets/shop.mjs,apps/hive/assets/hive.mjs,apps/hive/pixel.mjs,apps/hive/text-layer.mjs,apps/hive/main.mjs,apps/hive/config.mjs,apps/hive/camera.mjs,apps/hive/README.md,.github/workflows/pages.yml,packages/nana-pack/skills/requirements/SKILL.md,packages/nana-pack/tests/hive-shops.test.mjs,packages/nana-pack/tests/hive-page.test.mjs,packages/nana-pack/tests/hive-assets.test.mjs,packages/nana-pack/tests/component-audit.test.mjs,packages/nana-pack/tests/pages-workflow.test.mjs,packages/nana-pack/tests/product-report.test.mjs,REQUIREMENTS.md,docs/requirements-tree.md,docs/known-bugs/FEAT-039.md,docs/code-map.md`, run 2026-10-29 at `57167e92`). The requirements skill's tracked path is confirmed.

Size: larger. About 800 to 1,100 lines of code and tests: a contract, a deriver, a parser change, a layout, two renderers and cards. The larger builder (`pi-worker --lane-size larger`) fits.

Rows: R-3161 to R-3169. Artifact: A-088 · shop list · tracked: docs/components/shops.json · manual: the seat proposes it and the owner approves it; Read by: A-088 · code: scripts/component-shops.mjs. The v2 data itself stays part of A-087.

Requirement diffs to existing rows (same feature): R-3127 and R-3130 read "another contract name or version". Both become "a contract name other than nana-components or a version other than 1 or 2". R-3127 also gains "or a version-2 document without valid shops, roads and flows". R-3139 adds the deriver step between the audit and the publisher.

## Builds and the shape gate

- Build 1: all of the data (R-3161 to R-3166, R-3169), the drawing in WebGL (R-3167), the cards and Pages (R-3168), and the seat's three first-look runs.
- Gate: after build 1, the seat shows the owner the frames from the three runs with one question, "is this the shape?". Build 2 does not start until he answers. An answer that changes the shape goes into build 2's brief; the data stays.
- Build 2: the owner's shape answer, the visual judge's FAIL lines, and review fixes.
- If build 1 runs long, these move to a later lane: the pixel renderer's town marks (the pixel view keeps the v1 drawing and its renderer line says "shops in 3D only"); separate camera stops per flow (a flow hash highlights its route in the overview framing instead); and the one-tap full item list (cards keep the top items and "and N more"). The data, the cards' counts and the Pages publication never move out.

## Threat model

In scope: honest variation in our tools' output. Examples:
- a `Reads:` or `Read by:` line the checker flags, or a glob location;
- a shallow clone, or a lane that merged main before landing;
- a capability with no internal reads, or a feature in two components or in none;
- an artifact added to the ledger but not to the shop list;
- a v1 data file passed to the v2 page, or a v1 body labelled version 2;
- a renderer fallback to pixel.

Out of scope: deliberate forgery, such as a hand-edited v2 file with false counts that passes the contract, or commits crafted to inflate restocks. A cherry-picked duplicate counting twice is a residual. A finding outside this model is a residual and goes in the FEAT-039 known-bug file.

## Precedent

- `docs/components/contract.json` — shape of `contract-v2.json`: the same field lists, plus `shopFields`, `itemFields`, `roadFields`, `flowFields`, `findingFields`. v1 stays byte-identical: sha256 `ea48a6136c4fc7b77d1a1d949d08cf8a23795560f4623e9a0318a253dd2de39e`; `docs/components/fixture.json` sha256 `09d305725ce77b4d6e1aa2cb035bce06bd4c7274fa571bfb5b51714278363ebd`.
- `docs/components/fixture.json` — style and size for `docs/components/fixture-v2.json`: the v1 fixture's components verbatim plus a small shop, road and flow set. The set exercises a mutual and a one-way finding, a parked item, an edge road, a `not measured` item and a measured 0.
- `scripts/component-contract.mjs` — `checkComponentData` and its named-problem lines. The new `checkShopData(data, contract)` sits beside it and follows the same `where: field detail` form.
- `docs/components/nana-pi.json` and `scripts/component-audit.mjs` (`checkSource`, R-3103) — a hand source checked by a tool, which rejects derived values written by hand. This is the model for `docs/components/shops.json` and its check.
- `scripts/component-audit.mjs` (`buildAudit`, `main`) — injected `gitRunner`, `--out`, one named problem per line, exit 1 on problems and 2 on usage. The deriver `scripts/component-shops.mjs` follows it. Its `countActivities` is not the restocks precedent: it walks first-parent and skips the shallow check (A5).
- `scripts/product-report.mjs` (`artifactAges`) — the shallow-clone check and the glob-aware tracked-location matcher, its inner `matches`. Move: lift `matches` into `scripts/deliverables.mjs` as an exported `artifactLocationMatches(entry, file)`. Keep its `plain` flag, so a plain path holding `*` never becomes a glob. product-report imports it and the deriver is its second caller (the 2026-10-22 helper ruling). Guard: the artifact-age tests in `packages/nana-pack/tests/product-report.test.mjs` (the R-2791 family) stay green, and the builder builds the product report before and after the move and reports the two files identical.
- `scripts/deliverables.mjs` (`artifactRegistry`, `artifactReads`, `artifactConsumers`) — the only parsers of `Artifact:`, `Reads:`, `Read by:` and `Parked:` lines; the deriver imports them and never re-parses the ledger. In-lane change (R-3169): each `artifactConsumers` line gains `valid`, true exactly when the line raised no problem. Each item's consumer record gains `joins`, a list of `{ row, kind, featureId }` for the capability-join readers it already adds to `kinds`. Its existing outputs and notes do not change.
- `scripts/component-audit-config.mjs` — provenance comments; the home for the two v1 hash seals beside `CONTRACT_PATH`, and the source of `ACTIVITY_WINDOW_DAYS`, which the deriver imports.
- `scripts/hive-page-config.mjs` with `packages/nana-pack/tests/hive-assets.test.mjs` (R-3124) — a sealed sha256 checked by one test; the precedent for the v1 hash pin.
- `scripts/hive-page.mjs` (`buildHivePage`) — the contract read and refusal. It gains a version-to-contract choice: 1 goes to `contract.json`, 2 to `contract-v2.json`, and anything else is refused in one line.
- `apps/hive/runtime.mjs` (`prepare`) — accepts version 1, and version 2 only when `checkShopData` passes; refuses everything else with the existing plain error.
- `apps/hive/layout.mjs` (`layout`, `bees`) — deterministic, renderer-free geometry with bounds. It is the model for `apps/hive/town.mjs` (shops, stops, sinks, roads, cargo), with `CARGO_CAP` modelled on `BEE_CAP`.
- `apps/hive/assets/hive.mjs`, `apps/hive/assets/bee.mjs`, `apps/hive/assets/cell.mjs` — THREE passed in explicitly, triangle budgets, pickable `userData`. The model for `apps/hive/assets/shop.mjs` and cargo.
- `apps/hive/runtime.mjs` (`animationStep`) — the motion clock that cargo position follows.
- `apps/hive/camera.mjs` (`focus`) — camera stops for shops and flows, with the same framing test.
- `apps/hive/pixel.mjs` — the pixel fallback draws shops and roads on the same grid.
- `apps/hive/text-layer.mjs` (`textLayer`, `renderText`) — shop and flow cards join the rail and the three voices; component hashes are the precedent for `#shop-<id>` and `#flow-CAP-nn`.
- `apps/hive/config.mjs` — sealed visual values with provenance (`CARGO_CAP`, `CARGO_STILL_FRACTIONS`, `SHOP_CARD_ITEMS`, shop scale, road width).
- `.github/workflows/pages.yml` with `packages/nana-pack/tests/pages-workflow.test.mjs` (R-3131, R-3139) — the step order: audit, derive, publish, scan.
- `packages/nana-pack/tests/component-audit.test.mjs` and `packages/nana-pack/tests/hive-page.test.mjs` — temporary-repo git fixtures and build-and-compare tests for the new `packages/nana-pack/tests/hive-shops.test.mjs`.
- `scripts/first-look.mjs` and `scripts/visual-reader.mjs` — the capture and judge; first-look takes one URL per run at its sealed 380 and 1280 widths with reduced motion, so the seat runs it three times.
- `docs/reviews/hive-render-2026-10-29/replicate-art-spec.md` — the six spec lines this lane's visual acceptance keeps.

`npm run map:search` results taken:
- "artifact registry reads parse" named `scripts/deliverables.mjs`, `scripts/requirements-moved.mjs` and `scripts/product-report.mjs`.
- "component contract validate" named `scripts/component-contract.mjs` and `scripts/component-audit-config.mjs`.
- "hive layout chambers" named `apps/hive/camera.mjs` and `apps/hive/runtime.mjs`.
- "first-look reference capture" named `scripts/visual-reader.mjs` and `scripts/first-look.mjs`.
- "git activity window commits" named only release and land tools; `artifactAges` stays the closer precedent.

Impact (`npm run map:impact`):
- `scripts/component-contract.mjs` is called by `scripts/component-audit.mjs`, `scripts/hive-page.mjs` and two test files.
- `apps/hive/layout.mjs` is called by `main.mjs`, `runtime.mjs` and `hive-assets.test.mjs`.
- `scripts/hive-page.mjs` is called by `hive-page.test.mjs`.

Expected test edits (a forecast, not a limit):
- The R-3130 check that uses version 2 as the refused case moves to version 3.
- The R-3127 check keeps its version-2 case, now a v1 body labelled 2, and still expects the plain error.
- The R-3131/R-3139 workflow check gains the deriver step.
- `first-look.test.mjs` lists `scripts/deliverables.mjs` among page-shaping files, so check it after the matcher move.

## Outside precedent

CodeCharta (MaibornWolff, BSD-3-Clause, github.com/MaibornWolff/codecharta) — borrow: it draws a codebase as a 3D city whose districts group buildings by category and whose edges show dependencies. Borrow the district-per-category idea for shops and its edge highlighting on focus. Skip its code and its metric-height buildings; the hive keeps its own monochrome look and vendored three.js.

Other public reference: https://3dmk.com/ stays the look for spec lines 1 to 6, as in hive-render; no code or assets come from it.

## Must-meet

1. R-3161 · The v1 contract and fixture stay frozen, and v1 data draws as before.
   - Proves: no lane can change the v1 files by accident, and a v1 document builds and lays out exactly as at the base.
   - Pins: `docs/components/contract.json` and `docs/components/fixture.json` each match a sealed sha256 in `scripts/component-audit-config.mjs`. `buildHivePage` on the v1 fixture writes `components.json` equal to the fixture. `layout(v1 fixture)` deep-equals its output at `57167e92`, saved as a test fixture, and `prepare` on it returns no shops, roads or flows.
   - Deletes the FEAT-039 known-bug line about reviewer-checked hashes.

2. R-3162 · Contract v2 is v1 plus shops, roads and flows, and every reader enforces it.
   - Proves: v2 readers can trust the new fields, v1 parts keep their v1 rules, and a v1 body labelled 2 is refused in the browser as well as the publisher.
   - Pins: `docs/components/contract-v2.json` holds v1's field lists unchanged and adds `shops`, `roads`, `flows` to `documentFields`. `checkComponentData` plus `checkShopData` return `[]` for `docs/components/fixture-v2.json`. Each mutation names its rule:
     - an item in two shops;
     - a road with no shop at either end, or an end that is no drawn shop, stop or sink;
     - a restocks value neither an integer of at least 0 nor a string starting `not measured: `;
     - a flow stop that is not a feature of its capability.
   - Also pins: `prepare({ ...v1 fixture, version: 2 })` returns one plain error and no scene. `hive-page --data` with version 3 exits 1 with `hive-page: document: version must equal 1 or 2` and creates no output.

3. R-3163 · Every live artifact sits on exactly one shop's shelf.
   - Proves: no artifact is left out, and the shop list cannot drift from the ledger silently.
   - Pins: on the tracked tree, the deriver puts every live artifact in one shop. A temporary ledger with an artifact in no shop, one in two shops, an unknown ID, or a retired ID on a shelf fails with one line naming that ID. A hand source with an item name, class, location, buyers or restocks written in fails naming the field.

4. R-3164 · Roads come only from declared lines, and every unparked item has a road out.
   - Proves: every road traces to a ledger line, a line the checker flags draws nothing, and no live unparked item is a dead end.
   - Pins: a road is one distinct (from, to) pair with a shop at one end, carrying its A-ID list.
     - Supply roads come from `Artifact:` makers; delivery roads from valid `Reads:` lines.
     - Home roads come from valid code or prompt `Read by:` lines and joins; edge roads from valid person, rule or runtime ones.
     - A fixture `Reads:` or `Read by:` line that the parsers mark invalid gives no road.
     - On the tracked tree every live unparked item has at least one road out, and each parked item has none and a closed shelf.
     - On the ledger at `57167e92` (read with `git show 57167e92:REQUIREMENTS.md` or saved as a fixture) with the revised shop list, there are 44 supply, 62 delivery, 12 home-from-`Read by:` and 7 edge-from-`Read by:` roads.

5. R-3165 · Each capability is a flow, and its order is audited without a reorder.
   - Proves: the flow follows the ledger, and a backward read becomes a classed finding, not a silent change.
   - Pins: each kinded capability gives one flow whose stops are its active and frozen features in ledger order. A within-capability read whose reader comes before its maker gives one finding naming the A-ID, the maker feature, the reader feature and its class. A mutual finding says "no order satisfies both". The flow's stop order is unchanged. A capability with no reads inside prints `order: CAP-nn not judged (no roads inside)`.
   - On the ledger at `57167e92`, the findings are exactly the seven under "Measured today", with A-055 and A-021 `mutual` and the other five `one-way`. On the live tree the test asserts only that the deriver runs clean.

6. R-3166 · Each item shows buyers and restocks honestly.
   - Proves: a count is either measured or says it is not, never a false 0, and a merge never counts a lane's change twice.
   - Pins: buyers are one per valid `Reads:` line, valid `Read by:` claim and capability-join reader, keyed by (feature or row, kind). A `Reads:` line and a `Read by: code` line from two features count 2; the same feature and kind twice counts 1.
   - Restocks for a tracked item are the non-merge commits in the window touching its location, glob locations included. A temporary repo whose lane branch changes a file once, merges main, then lands gives 1 for that file, not 2. An untouched tracked item gives 0. Every other class gives `not measured: <class>`. A shallow clone or a failing git runner gives `not measured: git history` for every item.
   - The window is `ACTIVITY_WINDOW_DAYS` imported, not a literal.

7. R-3167 · The hive draws shops, roads, cargo and flows, and the cargo is the number.
   - Proves: the picture shows the data deterministically, cargo moves when motion is on, and the frozen frames still show cargo on the road.
   - Pins: `town` layout on `fixture-v2.json` is deterministic.
     - Shops are disjoint from every chamber and from each other, and every road end resolves to a drawn shop, stop or sink.
     - A supply road carries min(sum of its items' restocks, `CARGO_CAP`) cargo marks, and another road min(its buyers, `CARGO_CAP`). A road whose items are all `not measured` carries one still marker. `CARGO_CAP` is sealed and pinned here.
     - Under `?still` and reduced motion, every road with cargo shows each mark strictly between its ends at `CARGO_STILL_FRACTIONS`. With motion on, `animationStep` at two times moves a mark along its road's path.
     - Each shop and flow has a camera stop framing it at 380/1000 and 1280/800.
     - The pixel view draws one mark per shop and one line per road inside its grid.

8. R-3168 · Shop and flow cards read as a shop and a route, and Pages publishes v2.
   - Proves: a reader can see what each shop holds and how a flow runs, on the public page, without a data dump.
   - Pins: a shop card lists its top `SHOP_CARD_ITEMS` items by buyers. Each line shows the item's name, its buyers count, and "changed in N commits in 14 days" or its `not measured` reason. The card ends with "and N more" when items remain, and the full list is one tap away. No card contains "sold".
   - A flow card lists its stops in order and each order finding with its class. `#shop-<id>` and `#flow-CAP-nn` hashes open their cards like component hashes.
   - The Pages job runs the audit, then the deriver, then the publisher on the v2 file, then the identity scan on it, keeping the product index.

9. R-3169 · The consumer parser says which reader lines are valid and which joins add readers.
   - Proves: the deriver counts only lines the checker accepts, without re-parsing the ledger.
   - Pins: each `artifactConsumers` line carries `valid`, false exactly for a line that raised a note (a fixture with one bad and one good `Read by:` line shows one of each). Each consumer record carries `joins` with the row, kind and home feature of every capability-join reader. The checker's notes and outputs on the tracked tree are unchanged.

### Visual acceptance (the seat, outside the suite)

1. Serve the v2 page with `node scripts/hive-page.mjs --serve --data <v2 file>`.
2. Run first-look three times, once per URL, each at its 380 and 1280 px widths: `node scripts/first-look.mjs --page url --hive --after <url> --reference <frames folder outside git> --spec <spec file> --out <folder outside git>`. The three URLs:
   - the overview `<served url>/`;
   - one shop, `<served url>/#shop-project-memory`;
   - one flow, `<served url>/#flow-CAP-04`.
3. Run `npm run visual-reader -- --from <folder> --out <folder outside git>` on each capture.
4. The spec is `shops-art-spec.md` in this lane folder, written by the builder. Lines 1 to 6 are the six lines of `docs/reviews/hive-render-2026-10-29/replicate-art-spec.md`, judged against the 3dmk reference frames. Lines 7 to 9 quote the owner's words above as their bar and are judged against those words, not the reference frames, which show no shops:
   - (7) "Artifacts should belong to different shops": each shop reads as a shop with its items on shelves.
   - (8) "roads connect shop to whatever upstream and downstream, moving cargos deliver": roads lead from shops to features and edges, with cargo marks on them.
   - (9) "each capability actually also becomes a flow in the 3d world": the flow link shows one route that can be followed from its first stop to its last.
5. Pass means every line judged PASS in all three captures. A FAIL goes back to the builder in the next brief, or to the owner as YOUR CALL with the frames. The seat does not override a FAIL. Reference frames are never committed.
6. After build 1, the shape gate above applies before build 2.

## Later lane (not this one)

- Restocks or buyers from the build, land and CI record stores, and any measured read event.
- Any feature reorder the owner picks from the order-audit ask, and any shop regroup he asks for.
- Capability order across the ledger, once `Needs:` lines exist.
- Whatever moves out of build 1 under "Builds and the shape gate".
