/**
 * @module packages/nana-pack/tests/ask-shape.test.mjs
 * @purpose Pin parsing of planner-shaped and legacy ask bodies.
 * @inputs Ask parser and exact issue-body fixtures.
 * @outputs Requirement-tagged parser contract check.
 * @effects none
 * @errors Assertion failures exit nonzero.
 */
import assert from "node:assert/strict";
import { ASK_LABELS, parseAskBody } from "../lib/ask-shape.mjs";

function check(title, action) {
  try { action(); console.log("PASS", title); }
  catch (error) { console.log("FAIL", title, error.stack); process.exitCode = 1; }
}

// req: R-3052
check("R-3052: ask bodies parse question groups, recommendations and since dates", () => {
  assert.deepEqual(ASK_LABELS, { question: "Question", recommends: "Seat recommends", cost: "Cost of a wrong guess", otherwise: "If answered otherwise", none: "none recorded" });
  const shaped = parseAskBody("**Question:** Should we wait?\n- **Default:** wait for you.\n* Cost of a wrong guess: hard to undo; wrong.\n**If answered otherwise:** ship now.\n\nQuestion: Should we ship?\nDefault: ship later.", "2026-10-01");
  assert.deepEqual(shaped.groups, [
    { question: "Should we wait?", cost: "hard to undo; wrong.", otherwise: "ship now." },
    { question: "Should we ship?", cost: null, otherwise: null },
  ]);
  assert.equal(shaped.recommendation, "wait for you");
  assert.equal(shaped.since, "2026-10-01");
  const issue237 = "The backup has no destination yet, and a clean-account test needs your hand. Default: wait for you.\n\nAn optional question for the owner, open since 2026-10-09. Moved from HANDOFF.md on 2026-10-28.";
  assert.deepEqual(parseAskBody(issue237, "2026-10-28"), { groups: [{ question: "The backup has no destination yet, and a clean-account test needs your hand. Default: wait for you.", cost: null, otherwise: null }], recommendation: "wait for you", since: "2026-10-09" });
  const issue225 = "Should new commits use a different git author? Default: leave it.\n\nAn optional question for the owner, open since 2026-10-21. Moved from HANDOFF.md on 2026-10-28.";
  assert.deepEqual(parseAskBody(issue225, "2026-10-28"), { groups: [{ question: "Should new commits use a different git author? Default: leave it.", cost: null, otherwise: null }], recommendation: "leave it", since: "2026-10-21" });
  const issue242 = "YOUR CALL: keep the narrow lane class, or widen it. Today a lane gets the full review ladder only when it changes hooks, install steps, the gate or the review tools. A wider rule would also count shared rules, commands on your PATH, prompts and package scripts: everything that runs as you after a land.\n\nWhat the seat tested: both rules over the last ten landed lanes.\n\nResult: the wider rule changes the class of 2 of 10 lanes. Both changed the product report script, which builds a page and runs nothing as you.\n\nTrade: the wider rule adds a land reviewer, wrong-code pairs and an independent check to lanes like those two. It would also catch a prompt or rule change, which the narrow rule calls ordinary.\n\nRecommendation: keep the narrow rule. Default: keep.\n\nYour call, because the class rule decides how much review every lane gets.";
  const parsed242 = parseAskBody(issue242, "2026-10-28");
  assert.equal(parsed242.groups[0].question, issue242.split("\n\n")[0]);
  assert.equal(parsed242.recommendation, "keep the narrow rule");
  assert.equal(parsed242.since, "2026-10-28");
  assert.equal(parseAskBody("Question: No recommendation?", "2026-10-04").recommendation, null);
  assert.deepEqual(parseAskBody("Question: spaced?  \r\nCost of a wrong guess: hard to undo.  ", "2026-10-04"), { groups: [{ question: "spaced?", cost: "hard to undo.", otherwise: null }], recommendation: null, since: "2026-10-04" });
  assert.deepEqual(parseAskBody("", "2026-10-04"), { groups: [], recommendation: null, since: "2026-10-04" });
});
