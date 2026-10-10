// Seat's independent attack battery for the req-tree build (scratch only; never writes the worktree).
import { readFileSync } from "node:fs";
const W = "/Users/jwang/nana-pi-wt/req-tree";
const { checkTree } = await import(`${W}/scripts/requirements-tree.mjs`);
const base = readFileSync(`${W}/REQUIREMENTS.md`, "utf8");
const L = base.split("\n");
const at = (pred) => L.findIndex(pred);
const r291 = at((l) => l.startsWith("| R-291 |"));
const r291line = L[r291];
const edit = (fn) => { const a = [...L]; fn(a); return a.join("\n"); };
const attacks = {
  "real ledger (expect GREEN)": base,
  "row under closing ordinary heading": edit((a) => { const row = a.splice(r291, 1)[0]; const i = a.indexOf("## Deliberate omissions"); a.splice(i + 1, 0, "", "| ID | Requirement | Status | Evidence |", "|---|---|---|---|", row); }),
  "row after prose inside FEAT-028 table": edit((a) => { a.splice(r291, 0, "Some prose in the middle."); }),
  "row after blank line following a table": edit((a) => { a.splice(r291, 0, ""); }),
  "header without delimiter": edit((a) => { const i = a.findIndex((l, k) => k > 50 && l.startsWith("|---|")); a.splice(i, 1); }),
  "row inside fenced block": edit((a) => { const row = a.splice(r291, 1)[0]; a.splice(r291, 0, "```", row, "```"); }),
  "setext H1 after FEAT-001 then table": base.replace(/(## FEAT-001 · [^\n]*\nPurpose: [^\n]*\n)/, "$1\nStray title\n===========\n"),
  "setext between CAP-01 and its Purpose": base.replace("# CAP-01 · Maintain direction and useful context\n", "# CAP-01 · Maintain direction and useful context\nStray\n-----\n"),
  "setext H1 between CAP-01 and FEAT-001": base.replace("## FEAT-001 · ", "Unrelated\n=========\n\n## FEAT-001 · "),
  "indented ATX h1 between CAP-01 and FEAT-001": base.replace("## FEAT-001 · ", "   # Unrelated\n\n## FEAT-001 · "),
  "h4 before CAP-01 purpose": base.replace("# CAP-01 · Maintain direction and useful context\n", "# CAP-01 · Maintain direction and useful context\n#### stray\n"),
  "fenced ATX line is NOT a boundary (expect GREEN)": base.replace("Purpose: Keep the agent aligned", "```\n# not a heading\n```\n\nPurpose: Keep the agent aligned").replace(/(# CAP-01 · [^\n]*\n)```/, "$1```"),
  "thematic break after blank is NOT a heading (expect GREEN)": base.replace(/(\n\n)(## FEAT-002 · )/, "$1---\n\n$2"),
  "duplicate SUB id": base.replace("### SUB-002 · ", "### SUB-001 · "),
};
for (const [name, text] of Object.entries(attacks)) {
  let r; try { r = checkTree(text); } catch (e) { console.log("THROW", name, String(e).slice(0, 100)); continue; }
  const n = r.problems?.length ?? 0;
  console.log(n ? "RED  " : "GREEN", name, n || "", (r.problems ?? []).slice(0, 1).join(" | ").slice(0, 100));
}
// Independent outline ID count: expand every "IDs:" list in the committed outline with the seat's own expander.
const outline = readFileSync(`${W}/docs/requirements-tree.md`, "utf8");
const ids = new Set();
for (const m of outline.matchAll(/IDs: ([^\n]*)/g)) {
  if (m[1].startsWith("listed below") || m[1] === "—") continue;
  for (const part of m[1].split(", ")) {
    const r = /^([RG])-(\d{3})(?:–\1-(\d{3}))?$/.exec(part.trim());
    if (!r) { console.log("UNPARSED", part); continue; }
    const a = +r[2], b = r[3] ? +r[3] : a;
    for (let k = a; k <= b; k++) ids.add(`${r[1]}-${String(k).padStart(3, "0")}`);
  }
}
const ledgerIds = new Set([...base.matchAll(/^\|\s*([RG]-\d{3})\s*\|/gm)].map((m) => m[1]));
const missing = [...ledgerIds].filter((i) => !ids.has(i)), extra = [...ids].filter((i) => !ledgerIds.has(i));
console.log(`outline IDs ${ids.size} / ledger ${ledgerIds.size}; missing ${missing.length} ${missing.slice(0, 5)}; extra ${extra.length} ${extra.slice(0, 5)}`);
