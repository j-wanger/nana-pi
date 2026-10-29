# Plan attack — page-needs-you (2026-10-29)

Adversary for the plan beside this file. Grades: MUST (the plan as written fails the owner or causes a harm), SHOULD, NOTE.

## MUST

**M1. On landing day the Overview shows no recommendation and no reason, so point 1 still fails.**
Checked with `gh issue list -R j-wanger/nana-pi --label ask --state open`: 27 open, 0 blocking, 25 optional, 2 parked, 0 with a `Question:` line, 0 with `hard to undo`. So the tier rule is empty, and "newest first" picks #242, #238, #237. All three were posted within seconds of each other on 10-28, so the order follows posting order, not consequence. Each shows only its first paragraph. No `Seat recommends:` or `Why it needs you:` line appears anywhere on the Overview. The reader asked for "the seat's recommendation, and why his judgment matters". Q3's default ("no re-post") guarantees that this lane alone does not deliver it.
The data to fix it is already in the bodies. 13 of the 25 listable asks carry an inline `Default: <word>.` (242, 237, 230, 225, 224, 223, 222, 220, 219, 218, 217, 216, 215). #242 is a full decision point with `Recommendation: keep the narrow rule.` and `Your call, because …` in paragraphs 5 and 6. The first-paragraph fallback drops all of that.
Fix: (a) the unshaped path pulls an inline `Default:` or a `Recommendation:` line into `Seat recommends:`, and a `Your call, because …` line into the reason; (b) an ask with no recommendation shows `Seat recommends: none recorded`, so the gap is visible instead of silent; (c) add one fixture from #242 and one from #225 to must-meet 3; (d) extend the expected first-look result: "at 390 px, at least one listed ask shows a Seat recommends line". Q3's default can then stay `no`. Without (a) to (d), flip Q3's default to `yes` for the asks the Overview lists.

## SHOULD

**S1. "Why it needs you: <cost>" misreads the cost line.** The planner's cost line starts `easy to undo` for most questions, so the page would read "Why it needs you: easy to undo; …". That line says why the call does *not* need him. Fix: label it `If the seat guesses wrong:` or keep the planner's words `Cost of a wrong guess:`. Pin the chosen words in R-3053 and R-3054 alike.

**S2. The two views use different words for the same label.** R-3053 maps Default to `Seat recommends:`. R-3054 renders `If you answer otherwise:`, but the planner label is `If answered otherwise:`. One name for one thing: pin one label set as a sealed constant, shared by both views, with the planner prompt as provenance.

**S3. R-3050 drops words R-2920 pins.** "The tab order stays the same" replaces the explicit list Overview, Decisions, Product, Artifacts, Features, Issues, Requirements. "Any unknown hash" replaces "every hash that names no other view and no feature", and the R-2920 test also covers `#shared`. The owner wants exact words pinned. Restate both clauses word for word in R-3050, or the retire loses clauses (A6 claims none are lost).

**S4. R-3053 is wider than one test.** It holds ten clauses: count line, questions line, blocking listing, a two-tier fill, the line shape, three shaped lines, the more-questions line, the unshaped line, the remainder link and the failed read. Split it into two rows, selection (which asks, what order, remainder link) and rendering (what each listed ask shows), each with its own test. The cap pin stays its own test, as written.

**S5. A4's "fails closed" claim is weaker than stated.** The Pages scan reads the page's escaped JSON, and FEAT-039 already records that a word fused to an escape is not counted (page-on-pages, N5). Bodies put a `\n` before every paragraph's first word, so a name that opens a paragraph slips past. The exposure is small, because the issues are already public and seat posts were scanned. Fix: amend A4 to say so and record it as a residual. Or pipe the raw bodies through `identity-scan --stdin` in the Pages job, a one-line step.

## NOTE

**N1. "Newest first" sorts on a wrong date.** FEAT-039 records that every migrated ask shows 2026-10-28 as Since, while the body holds the real date ("open since 2026-10-09"). Ordering and the `since` text on the Overview inherit that. Either sort by the body's `open since` date when present, or leave a known-bug line saying the fill order is posting order for migrated asks.

**N2. O3 misses one stale known-bug line.** "An issue ask draws no Ask line, and the issue body never reaches the page" becomes false when this lane lands. Add it to O3's list. "Blocking asks are not listed first in Decisions" stays true; leave it.

**N3. The issue-reader change is safe for session start as written.** Callers pass named options. The `--json` list is a literal at line 31, and must-meet 2 pins byte-identical arguments and items without the flag. No finding. One caution for the builder: add the field to the list only under the flag, so no caller's default list changes.

**N4. Markup injection is covered.** The renderer uses text nodes, and the payload escapes `<` as `\u003c` before embedding. Must-meet 5's `<b>x</b>` fixture pins the text path. No finding.

**N5. Ceremony check.** The new module `ask-shape.mjs` earns its place, because the parser is pure and tested alone. No finding.
