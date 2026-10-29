/**
 * @module packages/nana-pack/lib/ask-shape.mjs
 * @purpose Parse planner-shaped ask text into shared question groups and recommendations.
 * @inputs Issue or legacy ask body text and its creation date.
 * @outputs Question groups, recommendation and parsed open-since date.
 * @effects none
 * @errors None; absent labels and empty bodies produce null fields or no groups.
 */
// Question, Cost and Otherwise are pinned by packages/nana-pack/prompts/planner.md; the
// recommendation label records the seat's 2026-10-29 decision from attack M1.
export const ASK_LABELS = Object.freeze({
  question: "Question",
  recommends: "Seat recommends",
  cost: "Cost of a wrong guess",
  otherwise: "If answered otherwise",
  none: "none recorded",
});

function valueAfterLabel(line, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const normalized = line.replace(/^(\s*(?:(?:\d+[.)]|[-*])\s*)?)\*\*(.*?)\*\*(.*)$/, "$1$2$3");
  const match = new RegExp(`^\\s*(?:(?:\\d+[.)]|[-*])\\s*)?${escaped}:\\s*(.*)$`).exec(normalized);
  return match ? match[1].trim() : null;
}

function paragraphs(body) {
  return String(body ?? "").replace(/\r\n?/g, "\n").trim().split(/\n\s*\n/).filter(Boolean);
}

function inlineValue(body, labels = ["Recommendation", "Default"]) {
  for (const label of labels) {
    const escaped = label;
    const normalized = String(body ?? "").replace(/\*\*(Recommendation|Default):\*\*/g, "$1:").replace(/\*\*(Recommendation|Default)\*\*:/g, "$1:");
    const match = new RegExp(`(?:^|[.?!:;][ \\t]+)(?:[-*][ \\t]*)?${escaped}:[ \\t]*([^\\n]*?)(?:\\.\\s|$)`, "m").exec(normalized);
    if (match) return match[1].trim() || null;
  }
  return null;
}

export function parseAskBody(body, createdAt) {
  const source = String(body ?? "").replace(/\r\n?/g, "\n");
  const lines = source.split("\n");
  const groups = [];
  let current = null;
  for (const line of lines) {
    const question = valueAfterLabel(line, ASK_LABELS.question);
    if (question !== null) {
      if (current) groups.push(current);
      current = { question, default: null, cost: null, otherwise: null };
      continue;
    }
    if (!current) continue;
    const defaultValue = valueAfterLabel(line, "Default");
    const cost = valueAfterLabel(line, ASK_LABELS.cost);
    const otherwise = valueAfterLabel(line, ASK_LABELS.otherwise);
    if (defaultValue !== null) current.default = defaultValue;
    if (cost !== null) current.cost = cost;
    if (otherwise !== null) current.otherwise = otherwise;
  }
  if (current) groups.push(current);
  if (!groups.length) {
    const first = paragraphs(source)[0];
    if (first) groups.push({ question: first, default: null, cost: null, otherwise: null });
  }
  const since = /open since (\d{4}-\d{2}-\d{2})/i.exec(source)?.[1] ?? String(createdAt ?? "").slice(0, 10);
  const recommendation = inlineValue(source, ["Recommendation"])
    ?? inlineValue(source, ["Default"])
    ?? groups.find((group) => group.default)?.default
    ?? null;
  return { groups, recommendation, since };
}
