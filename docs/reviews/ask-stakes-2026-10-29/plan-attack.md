# Plan attack: ask-stakes

Adversary, 2026-10-29. Checked: plan.md, `ask-shape.mjs`, `planner.md`, `planner-prompt.test.mjs`, `nana-seat.md`, the Decisions and Needs you code in `product-report.mjs`, and all 29 open `ask` issues parsed with today's `parseAskBody`.

## MUST

**M1. At land the owner sees the new line nowhere on the page.** All 29 open asks lack it (A3 posts nothing new), so Decisions and Needs you look exactly as today. The plan's own question also uses the old four-line form, so this lane's ask will lack the line too. The owner asked for "the product page shows it"; first-look would show a feature nobody can see. Fix: write the plan's one question in the five-line form. Have the seat post this lane's ask in that form before first-look. That makes the line show on the live page in Decisions and Needs you. No code change is needed.

## SHOULD

**S1. Nothing stops a gains line that just restates the default.** The pinned parenthetical, "what the default gains and may miss, against the main alternative", gives no shape. A planner will write "gains: simpler; misses: little", which repeats `Default:` and `If answered otherwise:`. Fix: change the parenthetical to "one concrete gain of the default and one problem it may miss that the main alternative would catch, on one line". In the report, mark usefulness as unverified, not pinned: R-3070 proves the prompt says this, not that planners write it well.

**S2. The label and its instruction disagree.** The label says "each choice", but the parenthetical says "the default ... against the main alternative". A planner told "each choice" will write one clause per option, often as sub-bullets. Fix: use one meaning. Either `What the default gains and misses:` (this changes the owner question's default) or keep the label and let the parenthetical cover both options in one line.

**S3. A value split across lines drops silently.** `valueAfterLabel` reads one line only. Given "gains and misses", a planner will likely write the label and then put `Gains:` and `Misses:` on indented lines below. That gives `gains: ""`, so `if (group.gains)` hides it with no signal. Fix: S1's "on one line" wording, plus an R-3071 case for a label with an empty value (pin the result as `null`, or as "", whichever is chosen).

## NOTE

**N1. The carried `Default:` fix changes only issues 255 and 256, and neither for the worse.** The other 27 asks have no group default, so their recommendation stays the same. 255 goes from "yes" to its full default. 256 goes from a cut-off first sentence to its two-sentence default, which makes its Needs you line longer. Diagnosis: 255 has no separate body-level `Default:`. `inlineValue`'s `^` with the `m` flag matches the group's own `Default:` line and cuts it at ". ". The fix is still right; the R-3074 row text should describe it that way.

**N2. "First group's Default" is not today's behaviour.** Today the code uses `groups.find(g => g.default)`, which takes any group's default. Pin which one R-3074 means. If it means the first group only, a body whose first group has no default changes.

**N3. The seat's blocking rule, the cost tier and R-3012 are safe.** The tier reads only `groups[0].cost`, and `valueAfterLabel` is anchored at line start, so a gains value that mentions "hard to undo" or "Default:" cannot leak. One residual: the `inlineValue` Default fallback is unanchored after ": ", so a gains value like "...: Default: x" could match in a body that has no group default. Out of the threat model.

**N4. No row is wider than its test.** R-2951's order terms do not touch the changed sentence. Keep R-3070's row text to "the prompt requests", not "planners write".

**N5. Precedent grep confirmed.** "Cost of a wrong guess" and "four labelled" appear only in the files the plan names. Its 255 body text "four-line shape" is history and is not parsed.
