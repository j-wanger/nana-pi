# FEAT-042 — known bugs

*One line per known bug in this feature. A review finding that does not block a land goes here as one line.*

- Builder context measurement (builder-anatomy, seat measurement): the tagging rules agree with the two labellers' consensus at κ 0.36, below the 0.6 bar, and leave 55% of pushed chars unsorted; function shares from the rules are not findings until a model labeller replaces them.
- Builder context measurement (builder-anatomy, seat measurement): precedent, feedback and purpose are too rare in a random 150-unit sample to measure labeller agreement; a stratified draw is needed.
- Builder context measurement (builder-anatomy, seat measurement): 42% of older builds without a build record do not split into parts, and 187 briefs go unmatched.
- Builder context measurement (builder-anatomy, final review): `assemble` drops a heading with no units under it on any `--drop`, even when nothing under it was dropped.
- Builder context measurement (builder-anatomy, final review): dropping table rows leaves the table's header and delimiter rows behind.
- Builder context measurement (builder-anatomy, final review): staged units are joined with no separator, so a unit without a trailing newline runs into the next.
- Builder anatomy labels (anatomy-labeller, final review): resume repairs a torn tail by rewriting `labels.jsonl` in place, so a kill during that window can lose labelled rows.
- Builder anatomy labels (anatomy-labeller, final review): the effort and seed fingerprint refusals and the `--resume` checkout refusal have no automated tests.
- Builder anatomy labels (anatomy-labeller, final review): resume does not compare the input store's counts with its manifest.
- Builder anatomy labels (anatomy-labeller, final review): `--resume` with a missing folder creates an empty folder before it refuses.
- Builder anatomy labels (anatomy-labeller, final review): only the unit's own worktree and branch are masked; plan A3's broader claim about home paths overstates the masking.
- Builder anatomy labels (anatomy-label-check, seat measurement): the heavy sheet misses the 0.85 weighted-agreement bar; six functions stay unmeasurable until definitions sharpen where the labellers split.
- Builder anatomy labels (anatomy-label-check, seat measurement): labeller A on the new sheets was Sonnet, not Opus, because Opus became the label model; sheet 2's labeller A was also Sonnet.
- Builder anatomy labels (anatomy-label-check, final review): the overall-bar recheck after the model change reused sheet 2 rather than drawing a fresh seeded sheet.
- Builder anatomy labels (anatomy-label-check, final review): `labeller-counts.md` omits per-part shares, denominator details, context-dependent and empty-normalized counts, token and subscription-cost status, the Part 1 tip correction, committed agreement outputs and the step-0 store-count explanation.
- Builder anatomy labels (anatomy-label-check, final review): pooled per-function counts use the union of labels from three labellers, which can exceed the pair's κ denominator and make near-threshold counts unclear.
- Builder anatomy labels (anatomy-label-check, final review): precedent's model:B agreement is displayed as 0.70 to two decimals against a 0.7 bar, so rounding can hide a shortfall.
- Builder anatomy labels (anatomy-label-check, final review): `report --labels` excludes occurrences that normalize to empty text from every table, while the stated denominator does not name that exclusion.
