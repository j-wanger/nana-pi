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
check("R-3052: ask bodies parse numbered indented issue questions and values", () => {
  const issue256 = `The outside reader lane plan has three questions. Each is easy to undo, so the build starts on the defaults; a different answer goes in the next build brief.\n\n\n1. Question: When should the reader run?\n   Default: After build 1, right after first-look, only on a lane that changes the product page. It reads that lane's diff as its focus and the lane's after page as context.\n   Cost of a wrong guess: easy to undo — one seat-guide sentence and its pinned test.\n   If answered otherwise: \"before the final round\" moves the sentence and nothing else. \"On a schedule against the live page\" drops the seat-guide step for a scheduled job, likely a CI workflow since launchd is macOS-only. Its findings would then need issues, since no lane would carry them.\n\n2. Question: Where do the reader's new findings go?\n   Default: The seat shows the owner the top new finding in its report, beside the first-look card. It writes a known-bug line in the page feature's file only for a finding it judges a real defect.\n   Cost of a wrong guess: easy to undo — one seat-guide sentence.\n   If answered otherwise: \"every finding as a known-bug line\" grows the file the reader reads back, so repeats get harder to suppress. \"An issue\" means one \`next\` issue per finding, each passed through \`scripts/identity-scan.mjs --stdin\` first and posted by the seat only.\n\n3. Question: Which model reads?\n   Default: The roster's first pi entry among \`scout\`, \`land\`, \`builder\`, in that sealed order (on this machine: \`land\`, openai-codex gpt-6-astra). \`--provider\`, \`--model\` and \`--thinking\` override one run.\n   Cost of a wrong guess: easy to undo — one sealed slot list.\n   If answered otherwise: a dedicated \`reader\` roster slot edits \`worker-config.mjs\` and \`nana-roster.mjs\`, which the roster-notice hook imports, so the lane becomes a hook lane with heavier checks. A Claude Code reader means launching through \`claude-review.mjs\`'s path instead of pi.\n\n\nPlan: \`docs/reviews/reader-at-land-2026-10-29/plan.md\` on branch \`feat/reader-at-land\`.\n`;
  const parsed = parseAskBody(issue256, "2026-10-29");
  assert.equal(parsed.groups.length, 3);
  assert.deepEqual(parsed.groups.map(({ question }) => question), [
    "When should the reader run?",
    "Where do the reader's new findings go?",
    "Which model reads?",
  ]);
  assert.equal(parsed.recommendation, "After build 1, right after first-look, only on a lane that changes the product page. It reads that lane's diff as its focus and the lane's after page as context.");
  assert.deepEqual(parsed.groups[0], {
    question: "When should the reader run?",
    default: "After build 1, right after first-look, only on a lane that changes the product page. It reads that lane's diff as its focus and the lane's after page as context.",
    cost: "easy to undo — one seat-guide sentence and its pinned test.",
    otherwise: "\"before the final round\" moves the sentence and nothing else. \"On a schedule against the live page\" drops the seat-guide step for a scheduled job, likely a CI workflow since launchd is macOS-only. Its findings would then need issues, since no lane would carry them.",
  });
});

// req: R-3052
check("R-3052: ask bodies parse question groups, recommendations and since dates", () => {
  assert.deepEqual(ASK_LABELS, { question: "Question", recommends: "Seat recommends", cost: "Cost of a wrong guess", otherwise: "If answered otherwise", none: "none recorded" });
  const shaped = parseAskBody("**Question:** Should we wait?\n- **Default:** wait for you.\n* Cost of a wrong guess: hard to undo; wrong.\n**If answered otherwise:** ship now.\n\nQuestion: Should we ship?\nDefault: ship later.", "2026-10-01");
  assert.deepEqual(shaped.groups, [
    { question: "Should we wait?", default: "wait for you.", cost: "hard to undo; wrong.", otherwise: "ship now." },
    { question: "Should we ship?", default: "ship later.", cost: null, otherwise: null },
  ]);
  assert.equal(shaped.recommendation, "wait for you");
  assert.equal(shaped.since, "2026-10-01");
  const issue237 = "The backup has no destination yet, and a clean-account test needs your hand. Default: wait for you.\n\nAn optional question for the owner, open since 2026-10-09. Moved from HANDOFF.md on 2026-10-28.";
  assert.deepEqual(parseAskBody(issue237, "2026-10-28"), { groups: [{ question: "The backup has no destination yet, and a clean-account test needs your hand. Default: wait for you.", default: null, cost: null, otherwise: null }], recommendation: "wait for you", since: "2026-10-09" });
  const issue225 = "Should new commits use a different git author? Default: leave it.\n\nAn optional question for the owner, open since 2026-10-21. Moved from HANDOFF.md on 2026-10-28.";
  assert.deepEqual(parseAskBody(issue225, "2026-10-28"), { groups: [{ question: "Should new commits use a different git author? Default: leave it.", default: null, cost: null, otherwise: null }], recommendation: "leave it", since: "2026-10-21" });
  const issue242 = "YOUR CALL: keep the narrow lane class, or widen it. Today a lane gets the full review ladder only when it changes hooks, install steps, the gate or the review tools. A wider rule would also count shared rules, commands on your PATH, prompts and package scripts: everything that runs as you after a land.\n\nWhat the seat tested: both rules over the last ten landed lanes.\n\nResult: the wider rule changes the class of 2 of 10 lanes. Both changed the product report script, which builds a page and runs nothing as you.\n\nTrade: the wider rule adds a land reviewer, wrong-code pairs and an independent check to lanes like those two. It would also catch a prompt or rule change, which the narrow rule calls ordinary.\n\nRecommendation: keep the narrow rule. Default: keep.\n\nYour call, because the class rule decides how much review every lane gets.";
  const parsed242 = parseAskBody(issue242, "2026-10-28");
  assert.equal(parsed242.groups[0].question, issue242.split("\n\n")[0]);
  assert.equal(parsed242.recommendation, "keep the narrow rule");
  assert.equal(parsed242.since, "2026-10-28");
  assert.equal(parseAskBody("Question: No recommendation?", "2026-10-04").recommendation, null);
  assert.deepEqual(parseAskBody("Question: spaced?  \r\nCost of a wrong guess: hard to undo.  ", "2026-10-04"), { groups: [{ question: "spaced?", default: null, cost: "hard to undo.", otherwise: null }], recommendation: null, since: "2026-10-04" });
  assert.deepEqual(parseAskBody("", "2026-10-04"), { groups: [], recommendation: null, since: "2026-10-04" });
});
