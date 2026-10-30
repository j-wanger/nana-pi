# Plan attack: shops-flows (2026-10-29)

Adversary for `docs/reviews/shops-flows-2026-10-29/plan.md`, worktree `~/nana-pi-wt/shops-flows` at `57167e92`. Every count below was taken with the plan's own parsers (`parseLedger`, `artifactRegistry`, `artifactReads`, `artifactConsumers`) and git on that tree. The recount scripts were run from the session scratchpad and are not committed.

Verdict: the data counts hold. Three MUST findings: the visual acceptance cannot see what the owner asked for, 36 of 85 items are still isolated, and "sales" is the wrong number under the owner's word.

## MUST

1. **MUST: The visual acceptance cannot judge the three lines the owner cares about, and the seat can override it.** All eight must-meet tests pin plumbing and geometry. R-3167 pins disjoint boxes and road ends, not anything the owner looks at. Build 1 of the hive passed tests like these, and the owner called its picture slop. The acceptance check has five holes:
   - (a) first-look always captures with reduced motion (`scripts/first-look.mjs:174`, `emulateMedia({ reducedMotion: "reduce" })`). The plan holds cargo still under reduced motion (A13, R-3167). So spec line 8, "moving cargo ... lead somewhere", is judged on frames where nothing moves and cargo may sit on road ends.
   - (b) first-look takes one URL at 380 and 1280 (`scripts/first-look.mjs:169-183`, `VIEWPORT_WIDTHS` in `scripts/first-look-config.mjs:29`). The plan captures only the overview. Spec line 7 (goods on shelves) and line 9 (follow one flow end to end) need a shop focus and a flow focus. Nothing captures those.
   - (c) The reference frames are 3dmk.com captures. They show no shops, roads or cargo. So lines 7 to 9 have no reference to compare against.
   - (d) "Pass means every line judged PASS, or the seat's own side-by-side judgement" lets the seat overrule a FAIL.
   - (e) The seat rule's "is this the shape?" check after build 1 covers only `--page product` and `--page desk`. The hive is in neither. The plan adds no owner shape check, though this is the exact point where the owner rejected the hive last time.

   Fix:
   - (a) Add to R-3167: under `?still` and reduced motion, every road with a non-zero cargo count shows at least one cargo mark strictly between its ends, at a fixed fraction. Add one test that `animationStep` at two times moves a cargo mark along its road's path.
   - (b) Run first-look three times: on the overview, on one shop hash, and on one flow hash (`#flow-CAP-04`). That is six frames per run. Name the hashes in the plan.
   - (c) Spec lines 7 to 9 quote the owner's words as the bar. Lines 1 to 6 keep the 3dmk reference.
   - (d) Delete the override. A FAIL goes back to the builder in the next brief, or to the owner as YOUR CALL with the frames.
   - (e) After build 1, the seat shows the owner the frames with one question, "is this the shape?", before build 2 starts.

2. **MUST: 36 of 85 items get no outbound road, and one whole shop is a dead end.** That repeats the owner's first complaint: "artifacts are too isolated". Roads come only from `Artifact:` and `Reads:` lines (plan, Purpose; R-3164). Only 49 distinct artifacts have a valid `Reads:` line. That leaves 36 items with a supply road in and nothing out.
   - Their readers by kind: code 18 (read inside the home feature), person 13, rule 1, runtime 1, prompt plus code 1, parked 2.
   - Delivery lines per shop: Machine setup 31, Governance controls 14, Project seeds 13, Project memory 10, Work records 9, Knowledge 8, Requirements and maps 6, Releases 6, Sessions 5, Evaluation evidence 3, Reports and pages **0**.
   - All three Reports and pages items (A-045, A-085, A-087) are read by a person, so that shop draws no road out.

   Fix: R-3164 gains a third road source, the item's valid `Read by:` claims. A `code` or `prompt` reader in the home feature gives a delivery road back to that feature's stop. A `person`, `rule` or `runtime` reader gives a road to one named edge sink per kind (people, rules, host). A parked item shows a closed shelf with its park reason. Pin: on the tracked tree, every live unparked item has at least one outbound road. Keep the cross-feature road count separate, so the 63 pairs stay measurable.

3. **MUST: "Sales" counts the wrong thing, and the reader count is undefined and cannot be built from the exported API.**
   - The owner defined sales as "number of cargos delivering/consuming the artifact". A12 makes "sales" mean make events, which are commits touching the file. A shop card would then say REQUIREMENTS.md sold 177 and HANDOFF.md 158, when those are edit counts on files every lane touches.
   - The "declared maker count" is always 1. `artifactRegistry` keeps the first line and rejects a reused ID (`scripts/deliverables.mjs`, the "reused ID" note in `artifactRegistry`). Only the writer-path count varies: A-004 2, A-022 2, A-025 3, A-034 2, A-087 2.
   - The "declared reader count" has no definition. `artifactConsumers` returns a `kinds` Set per item, not a count. A `Reads:` line and a `Read by: code` line both add `"code"` and collapse into one.
   - Its `lines` array is pushed before the problem check, so it carries no valid flag (`scripts/deliverables.mjs`, the `lines.push(...)` call before `let problem`). The deriver must then either re-parse, which the Precedent section forbids, or count lines the checker flags. Counting flagged lines is the honest variation the threat model puts in scope.
   - There are 24 `Read by:` lines, yet 83 items have a reader. The rest come from capability `Made by`/`Read by` joins and `built from` references, which have no per-line record at all.

   Fix:
   - Name the fields for what they count. `restocks` is the measured commits in the window, shown as "changed in N commits in 14 days". `buyers` is the declared count: one per valid `Reads:` line plus one per valid `Read by:` claim, keyed by (feature, kind) so nothing counts twice. Drop the maker count, or show the writer paths instead.
   - Add an in-lane change to `scripts/deliverables.mjs`: each `artifactConsumers` line gets `valid: !problem`, pinned by one test. Capability-join readers count as one buyer per (capability row, kind).
   - The card never prints the word "sold" against a commit count.
   - Restate Question 3 to the owner in those terms. As written it asks him to approve "measured git changes" as sales.

## SHOULD

4. **SHOULD: The first-parent walk counts neither real edits nor lands.** The window to HEAD holds 2,050 commits, and the first-parent walk sees 680 of them. 65 of those 680 are merges. Under git 2.50, a merge's first-parent diff carries another lane's whole change as one commit, and that lane's own commits sit off the first-parent line.

   | Path | First-parent | First-parent, no merges | All, no merges |
   |---|---:|---:|---:|
   | REQUIREMENTS.md | 177 | 116 | 330 |
   | HANDOFF.md | 158 | 94 | 290 |
   | docs/code-map.md | 140 | 84 | 239 |

   The count therefore depends on whether a lane merged main before landing. `countActivities` (`scripts/component-audit.mjs:130`) is a precedent for a component's activity, not for an artifact's edits. Fix: count `git log --no-merges --since=<window>` over all commits reachable from HEAD, and state that definition on the card. Pin it with a temporary-repo fixture that holds one merge of main. Keep the shallow-clone and failed-git cases giving `not measured: git history`. Note that `countActivities` does not check for a shallow clone, but `artifactAges` does (`scripts/product-report.mjs:284-286`). Follow `artifactAges` for that check.

5. **SHOULD: Two of the seven order findings are loops no reorder can fix. The test that pins all seven breaks on any later lane.**
   - Within-capability reads run both ways for FEAT-003 and FEAT-004 (CAP-01, A-055 one way and a forward read back), and for FEAT-015 and FEAT-019 (CAP-04, A-021 one way and a forward read back). No feature order satisfies either pair.
   - The other cases look deliberate. FEAT-015, the diagnose feature, reads A-016 from FEAT-016. FEAT-034 to FEAT-036, the study set-up features, read A-042 results from FEAT-037. Both are feedback loops rather than misordering. An ask that says only "runs backwards" invites a pointless reorder.
   - R-3165 pins "exactly the seven listed" on the live tracked tree. Any lane that adds a `Reads:` line, and the owner's own answer if he reorders, turns the suite red in an unrelated lane.

   Fix:
   - Each finding carries a class, `mutual` (a read exists in both directions) or `one-way`. The finding line says "no order satisfies" for a mutual pair.
   - The ask's default is "keep order". Its label is `optional` unless the seat sees a hard-to-undo case.
   - Pin the seven against a ledger fixture or `git show 57167e92:REQUIREMENTS.md`, not the working tree. The live-tree check asserts only that the deriver runs clean.

6. **SHOULD: What counts as one road contradicts itself.** R-3164 says "each live artifact gives one supply road" (85) and "each valid `Reads:` line gives one delivery road" (105). It also says road counts "equal the distinct pairs", which the plan measures as 42 and 63 (I re-derived 42 and 63). Fix: a road is one distinct (from, to) pair carrying the list of A-IDs it moves. Pin 42 and 63, on the base fixture per finding 5. Each item gets its own cargo.

7. **SHOULD: Cargo is decoration, but the owner wants cargo to be the sales number.** `CARGO_CAP` caps cargo, but nothing ties the number of cargo marks to any count. Fix:
   - A supply road shows min(sum of its items' `restocks`, `CARGO_CAP`) marks.
   - A delivery road shows min(its `buyers`, `CARGO_CAP`) marks.
   - A `not measured` road shows no moving cargo and a still marker.
   - The card prints the true number when the cap hides it.
   - Pin this in R-3167.

8. **SHOULD: The shop list has misfiled items and inconsistent links.** A2 and Question 2 are the right place to fix them before the owner sees the list.
   - A-024 "desk runtime matrix" is `apps/desk/README.md`, a document. It sits in Sessions. It belongs in Reports and pages, or in Governance controls next to the other rule documents.
   - A-013 "Claude rule links" (`~/.claude/rules/`) is in Governance controls. Its siblings A-012 hook links, A-060 skill links and A-063 PATH links are in Machine setup. A-050 "pi rulings link" goes with A-013. Put all install links in Machine setup; the linked rules stay in Governance controls.
   - A-036 requirements skill (Governance controls) and A-073 feature assessment store (Requirements and maps) are borderline. A-073 only feeds the product report, so Reports and pages fits better.
   - A-017 desk log is a run log. Work records or Sessions fits better than Machine setup.

   Fix: move A-024 and the two links, and name A-073, A-036 and A-017 as candidates in Question 2.

9. **SHOULD: The lane is too big for one build plan.** The hive-render lane, which had a smaller scope, needed five builds. Over the same range it changed 32 files with 2,465 insertions outside the vendored code. This plan estimates 700 to 1,000 lines and covers a contract, a shop list, a deriver, an order audit, sales, a town layout, two renderers, a shop asset, cards, camera stops, Pages, a helper move and hash pins. Fix: either split it, or gate it.
   - Split: lane A is the data. That means contract v2, `shops.json`, the deriver, the order audit, sales and Pages publishing the v2 file. The page accepts v2 and ignores the new fields, and the order ask reaches the owner a lane earlier. Lane B is the drawing and the cards.
   - Gate: plan two builds with the owner's shape check (finding 1e) between them, and say so in the plan.

10. **SHOULD: A v2 document without shops is not refused in the browser.** `prepare` checks only the contract name and version (`apps/hive/runtime.mjs:16`). Today's test refuses `{ ...fixture, version: 2 }` (`packages/nana-pack/tests/hive-page.test.mjs:87`). The plan's forecast moves that case to version 3. That drops the most likely honest error: a v1 body labelled version 2, which would reach `town()` and throw or draw half a scene. Fix: R-3162 pins that `prepare({ ...v1fixture, version: 2 })` returns one plain error and no scene. `prepare` runs `checkShopData`, or an equivalent shape check, before layout.

## NOTE

11. **NOTE: The matcher move needs the `plain` flag kept, and nothing guards the product report's output.** `matches` in `scripts/product-report.mjs:293-296` reads `artifact.plain`, which only path-claim descriptors carry. An exported `artifactLocationMatches(entry, file)` must keep that flag, or a plain path holding `*` turns into a glob. The plan says "the product report's output must not change" but names no test. Name the existing artifact-age tests (the R-2791 family), or build the report before and after the move and compare.

12. **NOTE: R-3161 is wider than its test.** "Still builds and draws as before" is pinned only by the written bytes and "no shops". Add `layout(v1 fixture)` deep-equal to its output at `57167e92`, saved as a test fixture.

13. **NOTE: The lane-class file list is incomplete.** It omits `scripts/component-audit-config.mjs`, where the hash seals go, and lists `scripts/deliverables.mjs` and `scripts/product-report.mjs` only in prose. I re-ran it with all three added, and it still prints `ordinary`.

14. **NOTE: Shop cards risk breaking spec line 5.** A Machine setup card with 14 items and three numbers each is the "data dump" that art-spec line 5 forbids. Fix: show the top items by buyers, plus "and N more", with the full list one tap away.

15. **NOTE: A future artifact must also go on a shelf, and nothing tells lane authors.** R-3163's tracked-tree check catches a missing shelf before land, which is right. But the requirements skill and the artifact-registry contract do not say so, and a Pages run on an unshelved ledger fails the product page too, since it is the same job (`.github/workflows/pages.yml`). Fix: add one line to the requirements skill's artifact section and to `apps/hive/README.md`.

16. **NOTE: Counts re-derived. All match the plan.**
    - Artifacts: 85 live, 0 retired, A-026 and A-027 absent.
    - Makers: 22 automatic, 63 manual.
    - Readers: 83 declared. Parked: A-057 and A-059. Reader kinds: code 68, person 29, prompt 6, rule 5, runtime 1.
    - Reads: 105 valid lines over 49 artifacts, 76 feature pairs, 0 checker notes.
    - Classes: 32, 32, 8, 6, 4, 2, 1.
    - Window: 680 first-parent commits. 25 of 32 tracked items were changed; the 7 at zero are A-039, A-074, A-040, A-041, A-042, A-075 and A-078.
    - Order: the 7 backward reads match exactly. 28 of 67 cross-capability reads run to an earlier capability. No `Needs:` line exists (grep `^Needs:` finds none).
    - Roads: 42 supply pairs and 63 delivery pairs. The 11 shops cover all 85 items once, with no unknown ID.
    - Components: FEAT-012, 017, 030, 032 and 033 sit in no component. FEAT-001, 002, 005, 006, 025 and 039 sit in two or more.
    - v1 sha256: `contract.json` `ea48a613…de39e` and `fixture.json` `09d30572…3ebd` both match.
    - `node scripts/identity-scan.mjs --root .` exits 0, and so does `--stdin` on the plan. A-084's location names the public repo's owner handle and scans clean.
