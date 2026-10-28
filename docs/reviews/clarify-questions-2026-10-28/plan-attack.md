# clarify-questions · plan attack (adversary, 2026-10-28)

## MUST

1. **One issue per plan clashes with the carry rule and the one-word default.** Problem: the carry rule (nana-soul.md) posts "each unresolved item and open question as one issue". The 2026-10-16 ruling says "A blocking question carries a one-word default". One issue holding three questions has no single one-word title default. Fix: keep one issue, because the owner's words rank first in the planner's sources. Name the exception in the seat rule and fix the title: "A plan's questions issue is one ask; a blocking one's title ends with "(default: go)", meaning build on the listed defaults." Evidence: nana-soul.md line 37; nana-rulings.md line 21; planner.md Sources.

2. **The must-meets name no exact sentences.** Problem: the plan says "each pins exact sentences" but gives none. The builder would write prompt and pin together, so checks pass by construction. planner.md requires "what exact sentence or result it pins". Fix: the seat writes the sentences into the plan (proposed below).

3. **Posting and waiting are seat rules, not planner rules.** Problem: planner.md is "planner-only instructions". Only the seat posts. Must-meets 3 and 4 belong in nana-seat.md. lane-class prints `ordinary` for that file, so the class holds. Fix: must-meets 1, 2 and 5 pin planner.md; must-meets 3 and 4 pin nana-seat.md.

## SHOULD

4. **Blocking versus optional has no switch.** Problem: O1's free sentence leaves "hard to undo" to judgment. Fix: the cost part starts with `easy to undo` or `hard to undo`, then the sentence. Any `hard to undo` among the posted questions makes the issue blocking.

5. **The readings round and the questions issue stack two owner asks per request.** The 2026-10-28 ruling asks readings "once per request". Fix: "When readings go to the owner, the top questions ride in the same message, and no separate issue follows."

6. **R-2951 should be amended, not just left green.** Its pin stays green, but its row text lists the old sections. Fix: amend R-2951 to name Questions for the owner after Open choices, and add `**Questions for the owner**` to its terms list. The new heading is safe for pi-worker: `readBrief` reads only the first Precedent heading and the Feature line.

7. **A blocking wait has no end.** Fix: "While the issue is blocking, the seat reports YOUR CALL and starts other lanes; it reads the replies before building."

## NOTE

8. **Fold must-meet 6 into must-meet 1.** Fixed labels cost nothing once must-meet 1 names them. No reader exists yet (2026-10-22 ruling).
9. A sentence pin cannot prove a planner ranks. Record that as a residual.
10. Say how this section differs from Open choices: questions go to the owner, and open choices stay with the builder.

## Proposed planner.md text (after the Open choices paragraph)

"Then write **Questions for the owner**. Write each question as four labelled lines: `Question:`, `Default:`, `Cost of a wrong guess:` (starting `easy to undo` or `hard to undo`), and `If answered otherwise:`. Order them from the costliest wrong guess down. Keep the top one to three; make every other question a marked assumption. With no open question, write `None.`"

## Proposed nana-seat.md text

"Post a plan's questions as one `ask` issue before the build. Label it `blocking` when any question is `hard to undo`, else `optional`. A blocking build waits for the owner's answer; an optional build starts on the defaults, and a differing answer goes in the next brief. A plan whose questions read `None.` posts nothing."
