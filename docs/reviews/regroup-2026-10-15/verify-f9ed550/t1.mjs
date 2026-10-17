import { run, fxProposal, variant, mappingNodesOf, verdictOf, L30, L37, L15 } from "./fx.mjs";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
const crash = (x) => /^\s+at .+:\d+:\d+\)?$/m.test(x.stderr) || /TypeError|ReferenceError/.test(x.stderr);
const show = (label, x) => console.log(`${label}: exit ${x.status} crash=${crash(x)} page=${x.text !== null} | ${x.stderr.split("\n").filter(Boolean).filter(l=>!/^\(node|Reparsing|To eliminate|Use `node/.test(l)).slice(0, 2).join(" || ").slice(0, 260)}`);
const cases = {
  "placed names unknown row R-999": (q) => { q.regroup.placed["R-999"] = "a hallucinated row"; },
  "refuted names unknown row R-999": (q) => { q.regroup.refuted.push({ id: "R-999", to: "FEAT-001", reason: "x" }); },
  "question about unknown row R-999": (q) => { q.regroup.questions[0].about.push({ id: "R-999", to: "FEAT-001" }); },
  "verdict for unknown row R-999": (q) => { q.regroup.review.verdicts.push({ id: "R-999", at: "FEAT-001", verdict: "keep", reason: "x" }); },
  "tree holds unknown row R-999": (q) => { mappingNodesOf(q).find((x) => x.id === "FEAT-001").node.rows.push("R-999"); },
  "row R-009 duplicated in FEAT-001": (q) => { mappingNodesOf(q).find((x) => x.id === "FEAT-001").node.rows.push("R-009"); },
  "row R-009 lost": (q) => { const n = mappingNodesOf(q).find((x) => x.id === "FEAT-004").node; n.rows = n.rows.filter((r) => r !== "R-009"); },
  "also_applies names unknown row": (q) => { mappingNodesOf(q).find((x) => x.id === "FEAT-001").node.also_applies = ["R-999"]; },
  "also_applies empty array": (q) => { mappingNodesOf(q).find((x) => x.id === "FEAT-001").node.also_applies = []; },
  "stale pin": (q) => { q.pin.sha256 = "0".repeat(64); },
  "purpose ' Not yet sorted:' leading space": (q) => { mappingNodesOf(q).find((x) => x.id === "FEAT-001").node.purpose = " Not yet sorted: x"; },
  "purpose 'not yet sorted:' lowercase": (q) => { mappingNodesOf(q).find((x) => x.id === "FEAT-001").node.purpose = "not yet sorted: x"; },
  "subgroup purpose missing entirely": (q) => { delete mappingNodesOf(q).find((x) => x.id === "SUB-001").node.purpose; },
  "reason line as string '37'": (q) => { const r = q.regroup.reasons.find((y) => y.line === L37); r.line = String(L37); },
  "reasons as object keyed by line": (q) => { q.regroup.reasons = Object.fromEntries(q.regroup.reasons.map((r) => [`${r.line}|${r.to}`, r.why])); },
  "move target as one object, not array": (q) => { const v = verdictOf(q, "R-003"); v.targets = v.targets[0]; },
  "question about as one object": (q) => { q.regroup.questions[0].about = q.regroup.questions[0].about[0]; },
  "verdicts holds a null": (q) => { q.regroup.review.verdicts.push(null); },
  "evidence value a string": (q) => { q.regroup.evidence["FEAT-005"] = "src/report/render.mjs"; },
  "gap FEAT-005 status 'proposed (gap)' no evidence": (q) => { const n = mappingNodesOf(q).find((x) => x.id === "FEAT-005").node; n.status = "proposed (gap)"; delete q.regroup.evidence["FEAT-005"]; },
  "gap FEAT-005 status 'active' no rows no evidence": (q) => { const n = mappingNodesOf(q).find((x) => x.id === "FEAT-005").node; n.status = "active"; delete q.regroup.evidence["FEAT-005"]; },
  "gap FEAT-005 status 'Proposed' capital": (q) => { const n = mappingNodesOf(q).find((x) => x.id === "FEAT-005").node; n.status = "Proposed"; delete q.regroup.evidence["FEAT-005"]; },
  "same_family true but lineages differ": (q) => { q.regroup.review.same_family = true; },
  "lineage case differs (Anthropic/anthropic)": (q) => { q.regroup.review.reviewer = "Anthropic"; },
  "extra claim for a node not in tree": (q) => { q.regroup.review.claims.push({ node: "FEAT-777", field: "purpose", text: "x", verdict: "accept", reason: "x" }); },
  "capability key 'status' (valid at feature)": (q) => { q.tree[0].status = "active"; },
  "verdict key 'to' (valid at target)": (q) => { verdictOf(q, "R-001").to = "FEAT-001"; },
  "subgroup key 'subgroups'": (q) => { mappingNodesOf(q).find((x) => x.id === "SUB-001").node.subgroups = []; },
  "move verdict carried via also_applies? (lift)": (q) => { mappingNodesOf(q).find((x) => x.id === "FEAT-004").node.also_applies = ["R-003"]; q.regroup.refuted = q.regroup.refuted.filter((r) => r.id !== "R-003"); },
};
for (const [label, fn] of Object.entries(cases)) show(label, run(label, variant(fn)));
