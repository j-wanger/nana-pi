# city-loop — plan attack

Adversary, 2026-10-31, against `plan.md` at worktree tip `811ed082`. Threat model as the plan states it: honest variation in scope, deliberate forgery out. Every finding below is honest variation or an owner-visible failure, not forgery.

Eight findings: four MUST, three SHOULD, one NOTE. Each says how a build passes the plan's tests and still fails the owner, and the fix.

## MUST 1 — R-3187's evidence literals do not move with the code (several sit in comments the plan itself chose)

How it passes and fails: the plan scopes "lessons-flow flips archive→drafting" and "pi-worker stops appending known bugs" as in-scope variation the test must catch. With the chosen literals it does not:

- `packages/nana-knowledge/lib/sources.ts` holds `"reviews"` three times: a comment (line 20), the `exclude` default (line 45) and `SKIP_DIRS` (line 55). Lessons-flow removing it from `exclude` leaves two copies. The "still-true" check passes, and the archive road stays marked unbuilt after it is built.
- `hook.ts` holds `worker-role` three times: the doc comment (12), the hidden-reason set (144) and the gate (162). Deleting the gate line, so builders get the pull again, leaves the literal. The "absent" theater→bay rows still pass.
- `hook.ts` holds `UserPromptSubmit` only in a comment (line 14). That is the plan's own evidence for theater→tower, not a forgery.
- `pi-worker.mjs` `knownBugPath` is a variable name (lines 92, 133, 187). Removing the line-187 `promptParts.push(... readFileSync(knownBugPath))` keeps it.
- `frontier-summary-config.mjs` `nana-main-ci.mjs` is a command string the session block prints. It proves a printed suggestion, not a report (see MUST 4).

Fix (R-3187 wording): "Each evidence entry is a regex matched against the file with comments stripped, it matches exactly once, and it matches the line that does the work." Examples:
- `pi-worker.mjs`: `/promptParts\.push\([^;]*readFileSync\(knownBugPath\)/`
- `hook.ts`: `/NANA_ROLE === "worker"\) return none\("worker-role"\)/`
- `sources.ts`: `/exclude:\s*\[[^\]]*"reviews"/`
- theater→tower: a code line, such as the nana-setup line that registers the hook for `UserPromptSubmit`, not the comment.

Add one in-test mutation. Delete the matched line from an in-memory copy and assert the check fails, naming the road. This proves each pattern is load-bearing.

## MUST 2 — the page still moves in a straight line; the loop exists only as static hairlines

How it passes and fails: `hive.mjs:109` hard-codes the only moving thing, the request crate, as `tower → … → customers`. It then respawns from the sky. The plan leaves that sequence alone. The returns become `THREE.Line` traces. WebGL draws every `THREE.Line` 1 px wide whatever `linewidth` says, so at whole-city zoom and at 390 px they are hairlines. The named precedent, the journey `signalTrace`, is hidden while the page animates (`hive.mjs:150`, `visible = frozen`). A builder who copies it ships returns that appear only in still or reduced motion.

R-3173 as written checks material class, colour and path, and passes in all three cases. The owner then sees what he rejected: a one-way conveyor with a diagram overlay.

Fix (R-3173 wording): "In the running page (update with `frozen = false`), every return trace is visible. Each is a ribbon at least `RETURNS.widthFraction × STREETS.laneWidth` wide, a sealed tunable, not a 1 px line. The moving request continues past the review ladder along the built returns, ladder→ledger→drafting, so its animated path ends at the drafting office's front, not at customers." Assert the packet's last point equals `drafting.front`, or that a second packet runs the built returns. Do not assert `LineDashedMaterial`.

## MUST 3 — a chapter's `flows` has no visible effect and can sit off-screen

How it passes and fails: R-3187 checks only that each `flows` entry names a declared road. R-3174 frames a chapter's place and visits, not its flows. The library chapter lists `ledger>bay-1`, `theater>tower` and `archive>drafting`. Their endpoints span the north-west town, the park centre, the east bays and the far north. A pose framed on the theater can leave every listed return off-screen, worst at 390 px. With O4's default (always visible, thin), a listed flow looks the same as an unlisted one. The narration says "Review records have no road back yet", and the picture does not point at it. That is the "story does not read" failure.

Fix (R-3174 wording): "For every chapter, both ends of each listed flow project inside the frame at 1280 and 390 px, above the card. The active chapter's listed traces render emphasized: full opacity while the rest dim." If a pose cannot frame them, move that flow to the chapter whose place sits at one end. The archive chapter already owns `archive>drafting`, so the library chapter can drop it and point back to it.

## MUST 4 — `part` lights and card voices overclaim the exact gap this lane exists to show

How it passes and fails: live statuses are `land-gate: sound` and `requirement-contract: sound`. So the archive, the ledger and the watchtower all render fully lit. The archive is write-only for later lanes; the backbone marks it partial. The watchtower borrows the gate's light though `bin/nana-main-ci.mjs` is unclaimed and run by the seat by hand. The planner's A2 doubt is right.

The cards are worse. These chapters cannot carry the part component, because `visit()` would report "visited twice". So `component` is null and `textLayer` falls back:
- Technical reads "workflow · absent … No features recorded · empty foundation" under a fully lit building.
- From the work reads "No gap recorded in this assessment. No decision requested." for the archive, which is the gap.

R-3177 as written checks only "light equals the part component's status", and passes all of it.

Fix:
- R-3177 wording: "A place with an unbuilt outgoing return renders at most half-lit, whatever its part's status." Assert the archive is half-lit with the live audit.
- Add: "A chapter whose flows include an unbuilt road shows it in From the work as 'Not built yet: <from> → <to>'. Neither the Technical nor the From the work voice of a part place reads 'absent' or 'No gap recorded'."
- Watchtower: narrate it as "the seat checks main at each session start", not "reports", or leave it unlit.

## SHOULD 5 — retired overclaims survive outside the chapter text

How it passes and fails: R-3187's regexes scan chapter `text` only. Three overclaims survive:
- `text-layer.mjs:14` keeps the customers metaphor "Other projects receive the work. Their feedback becomes the next signal." in the Technical voice. A5 retires that claim.
- `city.mjs:163` always builds hand trays `back/theater` and `back/court`. Removing the inspection→theater road from `plan.roads` leaves a solid back tray drawn into the library: the old "findings return to the library" picture. "No absent row is a road" checks `plan.roads`, not the drawn model.
- README line 39 says "Back routes are solid", which the dashed returns contradict.

Fix (R-3187 wording):
- "No rendered string (all three voices, both landings, both legends) and no README line matches a test-owned list of retired claims." Include `/feedback (rises|becomes|starts)/`, `/broadcasts the memory/` and `/findings return to the library/`.
- Add: "Every drawn `back`-class road lies on the path of a declared built back road."

## SHOULD 6 — road kinds are unstated; the wrong kind widens the town and stacks traces

How it passes and fails: the flow table has a `kind` column, but the plan never names the kind of ledger→bay-1, ledger→drafting, survey→drafting, land-gate→archive or watchtower→tower. If a builder declares the town-to-park ones `forward`, `city.mjs:185` promotes every local tray on their path to an avenue. The town then grows two-lane avenues: clutter, and a misread of the main road. Even as `back`, ledger→bay-1, ledger→drafting, ladder→ledger and court→drafting all route through the one entry crossing and the same ring arc. Solid and dashed traces then coincide and read as one broken road.

Fix: the plan states each road's kind. Returns into the park are `back`; theater→tower is `air`. R-3173 adds: "the avenue segment set equals main's", and "no built and unbuilt traces share a segment at the same lateral offset".

## SHOULD 7 — sixteen chapters lengthen the tour, and the returns sit far from their causes

How it passes and fails: at 1 to 1.5 screens a chapter, 16 chapters is up to 24 screens. The plan forecasts only raising the `<= 21` bound. Separate ledger and archive chapters put each return a full screen after the review ladder and the gate that cause them. The plan already makes the watchtower a visit in the land-gate chapter.

Fix, preferred: keep 14 chapters. Make the ledger a visit of the review-ladder chapter and the archive a visit of the land-gate chapter, with their sentences folded in under the same 40-word cap.

If 16 stay, add sealed `NARRATION.tourScreens` and pin the last span's end at 390 px against it. Also replace the hard-coded `14` in "card boundary never overlaps" and the `stageAtScroll`/`cardBlend` calls with `chapters.length`; the forecast misses those.

## NOTE 8 — precedent and test-wording mismatches the builder will hit

- `district.mjs` branches on `c.id = n.component ?? n.id`, not on form. Records is `c.id === 'requirement-contract'` (line 292). A new `archive` form in `CITY_FORMS` draws nothing distinct without an id branch. If a builder sets `c` from `part`, the ledger draws as a second records office. The precedent line should say "id-keyed branch".
- R-3177 already asserts the legend is one sentence (`legend.split('.')…length === 1`). The new sealed sentence breaks that, and the forecast edits omit it.
- "unknown part" must mean "no place in this plan carries that component", not "absent from the audit". The fixture has no `requirement-contract`. An audit-relative check refuses the fixture page, which R-3171, R-3173 and R-3177 all render.
- `built: 'yes'` → `road: invalid hand source` reuses the unknown-field message, so the test cannot tell the new type check from the allow-list. Give it its own message, such as `road: built must be true or false`.
