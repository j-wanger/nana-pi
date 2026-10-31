# city-loop — plan

Lane: city-loop · worktree `~/nana-pi-wt/city-loop` · branch `feat/city-loop` from main `811ed082` · 2026-10-31.
Grounding: `docs/reviews/city-loop-2026-10-31/backbone-map.md` (copied from the seat's survey; sections 2 and 3).
Attack: `docs/reviews/city-loop-2026-10-31/plan-attack.md` (4 MUST, 3 SHOULD, 1 NOTE). All eight findings are taken in below under the seat's rulings; each change is marked `(attack N)`.

Lane class (`node scripts/lane-class.mjs --root . --files apps/hive/city.json,apps/hive/city.mjs,apps/hive/config.mjs,apps/hive/assets/district.mjs,apps/hive/assets/hive.mjs,apps/hive/text-layer.mjs,apps/hive/tour.mjs,apps/hive/README.md,packages/nana-pack/tests/hive-city.test.mjs,packages/nana-pack/tests/hive-page.test.mjs,REQUIREMENTS.md,docs/known-bugs/FEAT-039.md,docs/sessions/2026-10.md,HANDOFF.md,docs/code-map.md`):

```
ordinary
```

## Purpose

Agreed reading (owner, 2026-10-30/31, "show, then build", then "Go"): the city must show the records and checks that already keep work consistent, as a loop; show missing parts honestly as unbuilt; and stop overclaiming.

This lane is "show" only. It builds no new flow. It also restores truth in two narration lines that contradict the code:

- "The library theater broadcasts the memory the lane needs" (workshop chapter, plus the theater→bay air legs). False: the 2026-10-09 ruling and `NANA_ROLE=worker` turn the pull off for builders (`packages/nana-knowledge/lib/hook.ts`).
- "Each lane's findings return to the library theater as new tapes" (library chapter, the inspection→theater road and the hand-built `back/theater` tray). False for the review corpus: the knowledge index excludes `reviews` (`packages/nana-knowledge/lib/sources.ts`). Only known-bug lines, rulings, HANDOFF and session notes return, and the last two reach only the seat.

After the lane, a reader following the tour sees: the moving request passes the land gate and a return packet carries on along built returns back to the drafting office, so the motion itself is a loop (attack 2). Each chapter frames and highlights the roads it names (attack 3). A known-bug ledger feeds the drafting office and the bays. An archive of review, build and land records sits half-lit behind the gate, with a dark dashed road back to drafting (attack 4). A survey→drafting road shows precedent search. A watchtower past the gate stands for the main-CI check the seat runs at each session start. A dark dashed template road runs from customer towns to the freight terminal. A test owns the list of claimed flows and checks each against the working line of code.

## Assumptions

- A1. "Show" means the city plan, its renderer and its text only. No change to pi-worker, the knowledge index, nana-land or templates. Lane lessons-flow builds the archive's road back later and flips its mark; the flow test then fails until the city says so.
- A2. Live mechanisms with no audited component (archive, ledger, watchtower) take their light from the component that owns their code, through a new optional place field `part`: archive → `land-gate`, ledger → `requirement-contract` (owns `scripts/known-bugs.mjs`), watchtower → `land-gate`. A `part` place does not count as a placement and needs no visit. A place with an unbuilt outgoing return renders at most half-lit, whatever its part's status (attack 4), so the archive is half-lit with the live audit.
- A3. The builders-get-no-pull fact is a ruling, not a missing part. The theater→bay air legs are removed, not drawn as unbuilt.
- A4. The library theater keeps its roof rings; they now stand for the seat's pull. A new air leg theater→tower (chapter `library`) replaces the two bay legs. The README sentence "The library broadcasts expanding rings toward the bays" is rewritten.
- A5. The customers→tower air leg ("feedback rises as new signals") overclaims: no tool carries feedback from other projects. It stays, marked unbuilt, so the customers chapter shows it dark. The customers metaphor in `apps/hive/text-layer.mjs` ("Their feedback becomes the next signal.") and the landing text "Feedback starts again." are rewritten (attack 5).
- A6. The inspection→theater back road is replaced by review-ladder→ledger (back, built). The hand-built back trays in `cityLayout` (`findings/park`, `back/theater`, `back/court`) are replaced by trays derived from the declared built `back` roads that cross districts, using the same entry-then-ring route. So no `back`-class tray exists without a declared built back road (attack 5).
- A7. Returns are drawn as ribbons along the existing streets (handoff paths), not as new trays. Each ribbon is at least `RETURNS.widthFraction × STREETS.laneWidth` wide, a sealed tunable, and stays visible while the page runs (attack 2). Built returns are solid and lit; unbuilt returns are dark (`LIGHTS.colors.dark`) and broken into dashes. Built and unbuilt ribbons that share a street take different lateral offsets (attack 6).
- A8. Fourteen chapters stay (attack 7, adversary's preferred fix). The ledger is a visit of the review-ladder chapter; the archive and the watchtower are visits of the land-gate chapter. Their sentences fold into those chapters under the 40-word cap.
- A9. The library chapter ("The way back") becomes a whole-city pose (`place: null`, `component: library`), so every return it lists is in frame (attack 3). Its title and id stay, so the R-3126 card check and hashes keep working.
- A10. Chapter word limits become sealed tunables in `apps/hive/config.mjs` (contract: owner brief 2026-10-31): at most 40 words per chapter text, at most 24 words per sentence.
- A11. The watchtower does not "report". The seat runs the main-CI check by hand at each session start, and the narration says so (attack 4).

## Open choices

- O1. Placement: archive in the park beside the land gate (bearing about 345, inside the fence, so its unbuilt road to drafting stays inside the park); ledger in the town civic quarter beside records (bearing about 306); watchtower as a north town lot near the billboard (bearing about 15) or an edge lot kept off the forward freight chain. Caution: `cityLayout` chains every `edge`/`outside` place into the forward freight road; a watchtower in `edge` must be excluded from that chain. Builder picks bearings that pass R-3172's clearance and band checks.
- O2. Geometry of the three new forms, built from the parts kit, static (no mechanism). See the `district.mjs` precedent: branches are keyed by id, not form.
- O3. Footprint size for `part` places: a fixed small footprint or the parent's. Parent-sized would make the archive as large as the gate.
- O4. Emphasis style for the active chapter's roads (full opacity, others dimmed to a sealed fraction) and how the return packet's short connector from the land gate to the review ladder is drawn. The builder decides; the tests pin the outcome.
- O5. Exact chapter wording. The drafts below pass the limits; the builder may tune wording but keeps each chapter's flows and the "not yet" honesty.
- O6. The Technical and From the work text of a part place (for example "Part of the land gate · sound"). The test pins only what they must not say and what the unbuilt line must say.

## Questions for the owner

None.

Every change is page content and drawing, easy to undo by a later lane.

## Feature

Feature: FEAT-039 · See the product and its decisions in one report

## Threat model

In scope: honest variation in our tools' output and in the code the city describes. Examples: the audit changes a component's status; a later lane builds a flow (lessons-flow flips archive→drafting) or removes one (pi-worker stops appending known bugs, the worker gate is deleted); a narration or voice edit names a road that does not exist or revives a retired claim. The flow test must fail in each case, naming the road.

Out of scope: deliberate forgery, such as planting a matching code line that does no work. Residual: the evidence check matches one working line by regex after stripping comments; it cannot prove the line runs.

## Precedent

- `apps/hive/city.json` — the hand plan. New places, roads with `built`, chapter `flows` and the rewritten journey go here, in its existing one-object-per-line style.
- `apps/hive/city.mjs` — `checkCityPlan` gains the `part`, `built` and `flows` fields inside its existing `fields(...)` allow-lists and its inner `place`/`visit` closures; no move needed (only `checkCityPlan` calls them). `cityLayout`'s status rule (`c?.status ?? ...`) gains the `part` lookup and the unbuilt-return cap. The hand-built back trays (`findings/park`, `back/${n.id}` for theater and court) become a loop over declared built cross-district `back` roads, reusing that same entry-then-ring path code; the `for (const n of [theater, court])` body is its precedent. The edge loop (`freight/${n.id}`) needs the O1 exclusion. Avenue promotion (`road.class = 'avenue'`) acts only on `forward` handoffs, so returns must never be `forward` (attack 6). Inner helpers `place`, `visit`, `add`, `edgeKey` stay local.
- `apps/hive/assets/hive.mjs` — the moving request (`sequence` of place ids, a `packet` over `journey`) is the precedent for the return packet: a second packet built the same way, from the land gate along the built returns to the drafting office's front. Its inline `elevated` lane-offset mapping gains a second caller: move it to one module-level helper in `hive.mjs` and call it from the journey, the return packet and the return ribbons. The journey's `signalTrace` line is not the precedent for returns: it is hidden while animating (`if (o.userData.signalTrace) o.visible = frozen`) and is 1 px wide (attack 2).
- `apps/hive/assets/parts.mjs` — `ribbon` is the precedent for return ribbons (the same helper trays use), at the sealed minimum width.
- `apps/hive/assets/road.mjs` — trays stay as they are; no tray gains dash meshes, which R-3173 forbids.
- `apps/hive/assets/district.mjs` — branches key on `c.id = n.component ?? n.id`, not on form (records is `c.id === 'requirement-contract'`). New forms need id-keyed branches `c.id === 'archive'`, `'ledger'`, `'watchtower'`; a `part` place must not set `c.id` from its part, or the ledger draws as a second records office (attack 8). The `requirement-contract` and `key-cabinet` branches are the geometry precedent; window and roof lights come from the existing status block at the end. Inner `pivot`/`load` closures are mechanism-only and not needed.
- `apps/hive/assets/materials.mjs` — `windows.dark` (from `LIGHTS.colors.dark`) for unbuilt ribbons; `windows.lit` for built ones.
- `apps/hive/config.mjs` — `CITY_FORMS` (sealed vocabulary), a `NARRATION` block (`chapterWords`, `sentenceWords`) and a `RETURNS` block (`widthFraction`, dim fraction, offsets), with provenance lines in the `TOUR_SCROLL` comment style.
- `apps/hive/text-layer.mjs` — both landing `legend` strings gain the unbuilt-road sentence; landing `text` and the customers metaphor lose the feedback claim; the `work` voice gains `Not built yet: <from> → <to>` lines for a chapter's unbuilt flows and a part place's unbuilt returns; part places stop falling back to `absent` and "No gap recorded".
- `apps/hive/tour.mjs` — `tourPose` and the visit framing are the precedent for framing each listed flow's ends; header text unchanged (still fourteen).
- `packages/nana-pack/tests/hive-city.test.mjs` — R-3171 mutation list, R-3173 street walk and the animated checks in the R-3122 traveller test, R-3174 framing test (`bounds ... project(cam)`), R-3177 light and legend check (line 278 asserts the legend is one sentence; it becomes two). The new flow test follows the file's `test(...)` and `req:` pattern.
- `packages/nana-pack/tests/hive-page.test.mjs` — R-3126 reads the `library` card by title "The way back"; R-3122 checks residents.
- Evidence files the flow table cites, each line confirmed at `811ed082` to match its regex exactly once with comments stripped: `packages/nana-pack/bin/pi-worker.mjs` (line 187), `packages/nana-pack/prompts/planner.md` (lines 5, 29, 32), `packages/nana-pack/prompts/review-standard.md` (line 1), `packages/nana-pack/bin/nana-land.mjs` (line 288), `packages/nana-pack/lib/frontier-summary-config.mjs` (line 52), `packages/nana-setup/lib/settings.mjs` (the `UserPromptSubmit` registration entry), `packages/nana-knowledge/lib/hook.ts` (line 162), `packages/nana-knowledge/lib/sources.ts` (line 45).
- `npm run map:search` results taken: "city plan checker" → `apps/hive/city.mjs`, `apps/hive/tour.mjs`, `apps/hive/assets/hive.mjs`; "known bug file appended to builder brief" → `packages/nana-pack/bin/pi-worker.mjs`, `packages/nana-pack/lib/brief-precedent.mjs` (confirms the ledger→bay road); "unbuilt dark lot status" → `apps/hive/assets/district.mjs`; "dashed line trace" and "legend text" returned nothing relevant.
- Impact (`npm run map:impact -- apps/hive/city.mjs`): callers `apps/hive/assets/hive.mjs`, `layout.mjs`, `main.mjs`, `runtime.mjs`, `scripts/hive-page.mjs`, and tests `hive-city`, `hive-page`, `hive-assets` (measured 57 s, 5.5 s, 0.1 s). `text-layer.mjs` callers: `main.mjs` and the same two tests.

Expected test edits (forecast, not a limit): R-3171's mutation list; R-3173's street walk; the R-3122 traveller test (a second packet); R-3174's framing loop; R-3177's one-sentence legend assertion; R-3126 if the library card's text check reads place data. `apps/hive/README.md`: "toward the bays", "Back routes are solid" and the feedback sentence.

## Outside precedent

Structurizr DSL (Apache-2.0) — borrow: it styles relationships by tag, so a "planned" tag renders dashed and grey beside live ones. This lane borrows that idea (a `built` mark on each road, styled dark and dashed) but none of its code. Also consulted: the C4 model's convention of dashed lines for future-state relationships.

## Roads after the lane

Every return is `back` except the two sky legs, which are `air`. No return is `forward`, so avenue promotion never touches the town (attack 6). Forward roads are unchanged.

| From → to | Kind | Built | Chapter that lists it |
|---|---|---|---|
| court → drafting | back | yes | compass |
| watchtower → tower | back | yes | compass, land-gate |
| survey → drafting | back | yes | drafting-table |
| ledger → drafting | back | yes | drafting-table, library |
| ledger → bay-1 | back | yes | workshop, library |
| ladder → ledger | back | yes | review-ladder, library |
| land-gate → archive | back | yes | land-gate |
| archive → drafting | back | no | land-gate, library |
| customers → freight | back | no | customers, library |
| customers → tower | air (chapter customers) | no | customers |
| theater → tower | air (chapter library) | yes | library |

Removed: theater → bay-1, theater → bay-2 (air), inspection → theater (back).

## Must-meet

Five tests, one row each. Four amend existing FEAT-039 rows; one row is new.

1. **R-3187 (new): the city claims only flows the code has.**
   Row: "The city shall declare every narrated flow as a road marked built or unbuilt and match a test-owned flow table both ways. Each evidence entry is a regex that matches its file, comments stripped, exactly once, on the line that does the work. Removed flows stay absent, no chapter names an undeclared road, no rendered string or README line matches a retired claim, and every drawn back-class road lies on a declared built back road."
   Test `R-3187: every claimed flow matches one working code line and no text revives a retired claim`. The test owns a table of `{ from, to, kind, built, file, pattern }` rows:
   - built:
     - ledger→bay-1: `pi-worker.mjs`, `/promptParts\.push\([^;]*readFileSync\(knownBugPath\)/`
     - ledger→drafting: `planner.md`, `/Read the feature's known-bug file when one exists/`
     - survey→drafting: `planner.md`, ``/Run `npm run map:search -- "<need>"` for each part of the lane/``
     - court→drafting: `planner.md`, ``/^2\. `\$HOME\/nana-pi\/packages\/nana-pack\/rules\/nana-rulings\.md`/m``
     - ladder→ledger: `review-standard.md`, `/the seat records them as known bugs/`
     - land-gate→archive: `nana-land.mjs`, `/const kept = appendLandRecord\(common, end\)/`
     - watchtower→tower: `frontier-summary-config.mjs`, `/export const MAIN_CI_COMMAND_PREFIX = .*nana-main-ci\.mjs/`
     - theater→tower: `settings.mjs`, `/event: "UserPromptSubmit", label: "UserPromptSubmit knowledge pull"/`
   - unbuilt, with still-true evidence: archive→drafting (`sources.ts`, `/exclude:\s*\["node_modules", "raw", "reviews"\]/`); customers→freight and customers→tower (reason only).
   - absent: theater→bay-1 and theater→bay-2 (`hook.ts`, `/NANA_ROLE === "worker"\) return none\("worker-role"\)/`); inspection→theater (`sources.ts`, same pattern as archive→drafting).
   Comment stripping removes `//` line comments and `/* */` blocks in `.mjs` and `.ts` files; Markdown is matched whole.
   It asserts:
   - the plan's non-forward roads equal the table's present rows, with the same `kind` and `built` mark, both ways;
   - each pattern matches exactly once;
   - the deletion check: for each evidence row, delete the matched line from an in-memory copy, re-run the check, and assert it fails naming that road;
   - no absent row is a declared road;
   - every chapter `flows` entry names a declared road;
   - the library chapter lists at least one built and one unbuilt flow;
   - every `back`-class road in the drawn model lies on the path of a declared built back road;
   - no rendered string matches a test-owned retired-claim list `/broadcasts the memory/`, `/findings return to the library/`, `/feedback (rises|becomes|starts)/`. Rendered strings are all three voices of every card, both landings and both legends. `apps/hive/README.md` is checked the same way.
   Pins: a failure names the road, such as `theater/bay-1: flow the code lacks` or `ledger/bay-1: evidence line missing`.

2. **R-3171 (amend): the checker accepts the new fields and refuses bad ones.**
   Row adds: "accept `part` places that take a placed component's light without placing it, roads marked built or unbuilt, and chapter flow lists, refusing a part that no place in the plan carries, a non-boolean built mark and a flow naming an undeclared road."
   Test: extend the existing mutation list with:
   - `part: 'missing'` → `unknown part`. "Unknown" means no place in this plan carries that component, not absent from the audit, so the fixture page still renders (attack 8).
   - `built: 'yes'` → `road: built must be true or false`, its own message (attack 8).
   - `flows: ['x>y']` → `unknown flow`.
   The tracked plan still returns `[]` against the live audit and against the fixture's structural problems; `prepare` refuses each mutation with one `hive: ` line.

3. **R-3173 (amend): returns run on the streets as visible ribbons, and the request loops back to drafting.**
   Row adds: "draw each declared return as a ribbon along drawn streets, at least the sealed return width, visible while the page runs, solid and lit for built and dark and dashed for unbuilt, with built and unbuilt ribbons never sharing a segment at the same lateral offset. Add no trays and no avenues, and keep fence crossings at the entry and land gate only. A return packet continues from the land gate along built returns to the drafting office."
   Test: extend R-3173's street walk and the R-3122 traveller test. After `animateHive(scene, t, false)`:
   - every return ribbon is visible;
   - its width is at least `RETURNS.widthFraction × STREETS.laneWidth`;
   - unbuilt ribbons use the dark material and broken segments, built ones the lit material and one piece;
   - no built and unbuilt ribbon share a segment at the same offset;
   - every ribbon path lies on drawn street segments;
   - the crossing set stays `['entry', 'land-gate']`;
   - the avenue segment set equals main's (computed from the plan without the new roads);
   - tray objects still carry no dash meshes.
   The return packet's first point is at the land gate's front and its last point equals `drafting.front`; every leg except the short gate connector lies on a built return, never an unbuilt one, and the packet moves between two animation times. The test does not assert `LineDashedMaterial`.
   One line pins the sealed width: `assert.equal(RETURNS.widthFraction, <chosen value>)`.

4. **R-3177 (amend): lights and card voices tell the truth about part places and unbuilt roads.**
   Row adds: "light part places by their component's audited status, at most half-lit when they have an unbuilt outgoing return. Name each unbuilt road in the From the work voice. Never show a part place as absent or as having no gap. State in both landing legends that dark dashed roads are returns not built yet."
   Test:
   - with the live audit, the ledger and watchtower lights equal their part component's status, and the archive is half-lit;
   - with a fixture where the part component is absent, they render dark with full form;
   - the archive's card and every chapter whose flows include an unbuilt road read `Not built yet: <from> → <to>` in From the work;
   - no part place's Technical or From the work voice contains `absent` or `No gap recorded`;
   - both tour and explore legends contain the sealed sentence "Dark dashed roads are returns not built yet." The existing one-sentence legend assertion becomes two sentences (attack 8).

5. **R-3174 (amend): every chapter frames and highlights the roads it names, within the word limits.**
   Row adds: "For every chapter, both ends of each listed flow project inside the frame at 1280 and 390 px, above the card. The active chapter's listed returns render emphasized while the rest dim. Each chapter text keeps within the sealed chapter and sentence word limits."
   Test: extend `R-3174: request journey frames fourteen narrated chapters`:
   - for each chapter and each listed flow, project both end places' bounds at both widths and assert they fall inside the frame and above the card band, using the phone card test's band;
   - the active chapter's listed ribbons are at full opacity, and others at or below the sealed dim fraction;
   - each text has at most `NARRATION.chapterWords` words and each sentence at most `NARRATION.sentenceWords`;
   - one line pins the sealed values: `assert.deepEqual([NARRATION.chapterWords, NARRATION.sentenceWords], [40, 24])`.
   The chapter id list and count stay fourteen. A flow that no pose can frame moves to the chapter whose place sits at one of its ends.

### Draft chapter text (builder may tune per O5; counts are words, longest sentence)

| Chapter | Text | Words |
|---|---|---|
| overview | nana is a city that turns one wish into shipped work. Each place reads records before it acts and leaves a record behind. Scroll to follow one request around the loop. | 31, 12 |
| signal | (unchanged) | 19, 11 |
| compass | The seat works in the tower. It reads the handoff note, the rulings and open questions. At each session start it checks main from the watchtower. It sends work into the park and posts questions back as asks. | 38, 12 |
| drafting-table | A planner reads the requirement rows, its feature's known bugs and the survey office's search for similar code. It leaves a plan and the tests it must pass. An adversary tries to break them first. | 35, 18 |
| queue | (unchanged) | 19, 12 |
| workshop | A builder takes the plan into a bay. It reads the plan, the code the plan names and its feature's known bugs. It carries no memory. It leaves tests, code and a build record. | 34, 14 |
| eyes | (unchanged) | 20, 10 |
| review-ladder (visits ledger) | Reviewers from another model family read the change and the rows it moved. A blocking finding sends it back. Every other finding becomes a line in the known-bug ledger, which planners and builders read next. | 35, 16 |
| land-gate (visits vault, archive, watchtower) | The gate opens only when every reviewer says LAND and CI is green. It is the park's only way out. Behind it, the archive keeps review and land records, with no road back to drafting yet. | 36, 16 |
| identity-scan | (unchanged) | 17, 17 |
| release-route | (unchanged) | 14, 9 |
| customers | Other projects built the nana way receive the templates. No road yet checks whether they fall behind. Their feedback returns only when the owner brings it. | 26, 9 |
| library ("The way back", whole-city pose) | What returns today: known-bug lines reach planners and builders, and rulings, the handoff note and session notes reach the next seat. Review records have no road back yet. Builders get no library pull, by the owner's ruling. | 37, 18 |
| closing | The tower at the centre, the factory park around it, the town around that, and one road out. Dark buildings and dark dashed roads are parts still to come. | 29, 18 |

Chapter `flows` follow the "Chapter that lists it" column of the roads table.

### Seat checks after the build

Suite (`npm run test:locked`), `map:check`, `readme-check`, requirements trace and tree check, `nana-writing` on HANDOFF. The page changes, so the seat runs first-look with `--hive` at 1280 and 390 px, while running (not `?still`). It asks the owner one question: is this the loop he wanted to see?

### Notes step (before the final round)

- `docs/known-bugs/FEAT-039.md` records the four world-graph final-review lines from the seat's pending carries, word for word:
  - City page (world-graph, final review): R-3171 requires checkCityPlan(plan, live audit) to return nothing, so a later lane that adds a component to the audit turns it red until city.json gets a lot; the drift signal reaches lanes that never touch the hive.
  - City page (world-graph, final review): the published page fetches layout-override.json on every load; Pages answers 404, which the code handles, but it leaves a console error.
  - City page (world-graph, final review): city.json ships hand-written chapter text that the Pages identity scan does not cover (extends the components.json-only scan bug).
  - City page (world-graph, final review): the comment at apps/hive/city.mjs:40 names a file that no longer exists.
- It also records this lane's residual: the flow evidence check matches one working line by regex; it cannot prove the line runs.
- HANDOFF and the session note go into the reviewed change; review-ledger keep runs before the final round. The seat then deletes the FEAT-039 block from its pending-carries memory.
