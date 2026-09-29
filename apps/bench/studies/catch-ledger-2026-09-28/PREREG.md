# Catch ledger — pre-registration (written and committed BEFORE any judge label or table exists)

Lane E1, 2026-09-28. Method: `research/raw/2026-09-28-eval/eval-methods.md` §2, §(a) Q3.
Corpus: `docs/reviews/tranche{1,2}-2026-09-28/`, read-only.

## Corpus as recounted (commands in RESULTS.md)
- **35 reviewer reports**: sol r1–r3 on 7 lanes + sol r1–r2 on l4 and u (22 sol files);
  astra first ruling (`*-astra-land.md`) on **6** lanes (l1 l2 l3 t2a t2b t2c), astra confirm
  `*-astra-r2.md` on 6 lanes, `t2c-astra-r3.md` (13 astra files).
- 28 fix briefs (`*-fix*-brief.md`), 36 worker reports (`*-worker-r*.md`), 8 lanes.
- **Stale-number correction:** the lane brief says astra ruled on 5 lanes; it ruled on 6 (t2c is
  the sixth). P1 is answered on 6 and, separately, on the original 5 (l1 l2 l3 t2a t2b).

## Units and definitions (fixed now)
- **Row** = one item the reviewer itemized: a severity-led item, a MUST/CARRY list item, a
  verification line (FIXED / PARTIAL / NOT FIXED / RULED / CONFIRMED), or an item in a section
  headed New/Findings. Extraction is structural (regex over markdown); every top-level list item or
  bold-led paragraph NOT turned into a row is written to `skipped.jsonl` with a reason.
- **Finding** = a row the judge labels `is_finding` (a claimed defect or required change, not an
  evidence note). Verification rows are never findings (they restate an earlier row).
- **Rung** = (reviewer_model, round): sol-r1..r3, astra-r1 (= `astra-land`), astra-r2, astra-r3.
- **Disposition** (from the fix brief that answered the report, named by the brief's own header /
  "Read <report>" line): accepted | overridden | carried | unmatched. The judge must quote the
  fix-brief text it relies on; the tool verifies the quote verbatim and forces `unmatched` if absent.
  `match_confidence` = explicit (quote names the item by number/MUST index or shares a ≥6-word span
  with the finding) | semantic.
- **Match** (for "unique"): 4-stage idea — same file → line ±5 → judge semantic. The judge decides;
  the stage that supported each match is recorded. Pool = findings on the same lane.
- **Unique-accepted** = accepted finding with no matched finding from any other rung on that lane.
- **Class**: Mäntylä two-level — functional {interface, logic, resource, check, timing, support,
  larger_defect} | evolvability {documentation, visual_representation, structure} | false_positive.
- **Origin** (P3): seat_spec | worker_impl | pre_existing | unclear.
- **Scope relation** (P2, rounds ≥ 2): fold_defect (defect in / caused by the fix of an earlier
  finding) | new_scope (defect not touched by any earlier finding or its fold); verification rows are
  structurally `verification`.

## Reliability gate (fixed now)
- Judge A = Claude Opus 5.5 labels every row. Judge B = Claude Sonnet 5, an independent pass
  (fresh context, different model) on a seeded-random 40 findings (seed `e1-2026-09-28`).
- Cohen's κ reported per axis: top-level class, sub-class, disposition, origin.
- **If κ(top-level class) < 0.6: STOP.** The table is not published; the result is "labels
  unreliable". If κ(origin) < 0.6, P3 is reported as unreliable. If κ(disposition) < 0.6, every
  "accepted"-based number is flagged unreliable.
- No mock judge. Judge unavailable / malformed output → the tool exits non-zero.

## Claims (answers are computed by `catch-ledger.mjs build`, never by prose)
- **P1 (astra's rung):** astra's first ruling contributes ≥1 seat-accepted **functional** finding not
  matched by any sol finding on the same lane, on **≥2 lanes** (of 6; also reported of the original 5).
  YES → the rung is not ceremony on this evidence. If all its unique accepted catches are
  evolvability → "documentation check at ~2.5× sol's token price". Neither answer rules any role
  ceremony (no seeded-defect or clean-patch control was run).
- **P2 (round cap, H5):** among sol r3 rows: fraction verification vs fold_defect vs new_scope.
  "Mostly new scope" = new_scope > 50% of r3 non-verification findings.
- **P3 (the seat):** fraction of accepted findings whose origin is seat_spec. "High" = ≥ 25%.
- **P4 (astra's score):** the distribution of astra SCORE by (round, verdict). SCORE "carries
  information beyond the verdict" only if it varies within a verdict class and that variation lines
  up with the count of accepted functional findings. With n = 13 this is descriptive only.

## What this design cannot say (fixed now)
- Recall against truth: the gold is the seat's own acceptance, which is circular for precision.
- Role value: role tags exist only on some sol r1 reports; role is confounded with model and round.
- Independence of catches: astra reads the sol reports before ruling, so "matched" can mean "echoed".

## Amendments (dated; appended after results existed; the text above is unchanged)

- **2026-09-28 (after sol r1 BLOCK): `match_confidence` implemented post hoc.** The definition
  above was never implemented in the first build: no field was requested, stored or checked.
  It is now computed **structurally** from the stored, verbatim-verified quote, with no model
  call, using exactly the rule stated above. A quote is explicit if it names the item (`#N`,
  "item/finding N", or "MUST N" for a MUST row) or shares a ≥6-word contiguous span with the
  finding; otherwise it is semantic. The rule was written after labels existed, so it is not
  blind. It changes no disposition and is reported alongside them only.
- **2026-09-28: "unique" and within-report duplicates are computed over connected components**
  of the judge's same-defect graph, not over direct edges ("same underlying defect" is an
  equivalence relation). The first build used direct edges, which was a defect found by sol r1.
- **2026-09-28: κ sample.** The seeded 40 were drawn over all non-verification *rows*, not over 40
  judge-labelled findings as the wording above says. Among the rows both judges call findings,
  κ(top) = 0.735 (n = 35), so the gate outcome is unchanged.
- **2026-09-28: P1 interpretation withdrawn.** "YES → the rung is not ceremony on this evidence" does
  not hold when the answer depends on the matcher. P1 is reported under both matchers and their
  intersection. A matcher-dependent answer is unresolved, not YES.
- **2026-09-28: P3 is not for operational use.** It is descriptive only (κ(origin) < 0.6).
- **2026-09-28 (after sol r2 BLOCK): the match relation is split into `same_as` and `covers`.** This
  was decided after labelling and after two matcher runs. The earlier matcher guide made one relation do
  two jobs: a row matched another if it was "a restatement, summary, or subset" of it. The stats then
  took connected components over that relation. Containment is neither symmetric nor transitive, so a
  bundling row (e.g. `t2c/astra-r1#5`, which summarises `#2` and `#3`) welded distinct defects into
  one component. The judge now outputs two lists: `same_as` (equivalence: the same single defect,
  and fixing either fixes the other) and `covers` (directed containment: the other row is part of this
  row's broader or bundled claim). Components are taken over `same_as` only. Containment still
  denies uniqueness, one hop in either direction, but never merges. Mutual containment resolves to
  `same_as` and is counted. A row that covers another row of the same report is the within-report
  duplicate. **All matcher output was regenerated** (`match a`, `match b`), and every count was rebuilt.
  Labels (`label a/b/c`) are unaffected and were not re-run. The superseded match records stay in
  `matches-a/b.jsonl` under their old prompt-hash keys, and `build` ignores them.
