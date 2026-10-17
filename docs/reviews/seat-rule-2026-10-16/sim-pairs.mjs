// Wrong-code-first simulation for the seat-rule plan (§5.3). Run it from anywhere:
//   node docs/reviews/seat-rule-2026-10-16/sim-pairs.mjs
// It reads the proposed guide and the proposed test beside this file and the shared template at the
// repo root, copies the test into a temp folder laid out like packages/nana-setup (the test finds the
// guide at ../claude/rules/nana-seat.md), applies each pair's edit to a copy of the guide there, and
// runs the copied test. It writes nothing in the checkout and removes the temp folder at the end.
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..");
const proposed = fs.readFileSync(path.join(here, "nana-seat.proposed.md"), "utf8");
const testSource = fs.readFileSync(path.join(here, "proposed-seat-rule.test.mjs"), "utf8");
const shared = fs.readFileSync(path.join(root, "templates", "_shared", "working-under-nana-pi.md"), "utf8");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "seat-rule-sim-"));
const guidePath = path.join(tmp, "pkg", "claude", "rules", "nana-seat.md");
const testPath = path.join(tmp, "pkg", "tests", "seat-rule.test.mjs");
fs.mkdirSync(path.dirname(guidePath), { recursive: true });
fs.mkdirSync(path.dirname(testPath), { recursive: true });
fs.writeFileSync(testPath, testSource);
const lines = proposed.split("\n");
const B7 = lines.findIndex((l) => l.startsWith("- Keep at most"));
const BP = lines.findIndex((l) => l.startsWith("- Before you end your turn"));
const BL = lines.findIndex((l) => l.startsWith("- Run the full suite whole"));
const OLD7 = "- Keep at most two lanes in flight, a nana default. While one runs, work the other or end your turn.";
const sub = (a, b) => (t) => { if (!t.includes(a)) throw new Error(`anchor missing: ${a}`); return t.replace(a, b); };
const setLines = (fn) => (t) => { const ls = t.split("\n"); fn(ls); return ls.join("\n"); };
const C10 = "seat guide holds no bullet beyond its ten rules";
const CL = "seat guide carries: at most two lanes building and one in planning, each slot defined";
const CP = "seat guide carries: name and start independent work before the turn ends, lane steps in order";
const CT = "seat guide carries: full suite whole, no split beside a full suite, a time-limit failure re-run alone";
const PAIRS = [
  [1, "bullet 7 keeps the old two-lanes-in-flight text", setLines((ls) => { ls[B7] = OLD7; }), [CL, C10]],
  [2, "bullet 7 allows three lanes building", sub("at most two lanes building", "at most three lanes building"), [CL, C10]],
  [3, "bullet 7 drops the planning slot", sub(" and one more in planning", ""), [CL, C10]],
  [4, "bullet 7 drops what counts as building", sub(" A lane counts as building from its first build until it lands or closes.", ""), [CL, C10]],
  [5, "bullet 7 keeps the old second sentence", sub("until it lands or closes.", "until it lands or closes. While one runs, work the other or end your turn."), [CL, C10]],
  [6, "the guide has no parallel bullet", setLines((ls) => { ls.splice(BP, 1); }), [CP, C10]],
  [7, "the parallel bullet drops naming the work", sub("name and start what waits on nothing else", "start what waits on nothing else"), [CP, C10]],
  [8, "the parallel bullet drops another lane's build", sub("another lane's build, ", ""), [CP, C10]],
  [9, "the parallel bullet drops the step-order sentence", sub(" Each lane's own steps stay in order.", ""), [CP, C10]],
  // 10 changes meaning at seat revision 3: the six-step list is gone, so its pair now tests the turn's end.
  [10, "the parallel bullet goes back to 'At each step' and drops the turn's end", sub("Before you end your turn, name", "At each step, name"), [CP, C10]],
  [11, "the example goes back to a long check in parts", sub("a long mutation run in parts", "a long check in parts"), [CP, C10]],
  // 12 keeps its wrong code; at seat revision 3 the full-suite sentence sits in the load bullet.
  [12, "the load bullet drops the full-suite sentence", sub("Run the full suite whole, never in parts. ", ""), [CT, C10]],
  [13, "the parallel bullet appears twice", setLines((ls) => { ls.splice(BP, 0, ls[BP]); }), [CP, C10]],
  [14, "the step-order sentence becomes its own bullet", sub(" Each lane's own steps stay in order.", "\n- Each lane's own steps stay in order."), [CP, C10]],
  [15, "the parallel bullet is indented under bullet 6", setLines((ls) => { ls[BP] = "  " + ls[BP]; }), [CP, C10]],
  [16, "the parallel text is folded into bullet 7", setLines((ls) => { ls[B7] = ls[B7] + " " + ls[BP].slice(2); ls.splice(BP, 1); }), [CL, CP, C10]],
  [17, "an eleventh bullet is added", setLines((ls) => { ls.push("- Run every check in parts."); }), [C10]],
  // 18 to 24 are seat revision 3's pairs.
  [18, "a numbered bullet is appended", setLines((ls) => { ls.push("1. Run three lanes."); }), [C10]],
  [19, "bullet 7 drops the planning boundary", sub(" A lane in planning has no build yet and no builder working in it.", ""), [CL, C10]],
  [20, "the guide has no load bullet", setLines((ls) => { ls.splice(BL, 1); }), [CT, C10]],
  [21, "the load bullet drops the no-split sentence", sub(" Never split a long run while a full suite runs on the same machine.", ""), [CT, C10]],
  [22, "the load bullet drops the time-limit re-run", sub(" If a check fails on a time limit, re-run it alone before you call it a failure.", ""), [CT, C10]],
  [23, "the time-limit re-run drops 'alone'", sub("re-run it alone before", "re-run it before"), [CT, C10]],
  [24, "the load text is folded into the parallel bullet", setLines((ls) => { ls[BP] = ls[BP] + " " + ls[BL].slice(2); ls.splice(BL, 1); }), [CP, CT, C10]],
  ["S1", "the guide saved with CRLF line ends (must stay green)", (t) => t.replace(/\n/g, "\r\n"), []],
];
const run = (text) => {
  fs.writeFileSync(guidePath, text);
  const r = spawnSync(process.execPath, [testPath], { encoding: "utf8" });
  return r.stdout.split("\n").filter((l) => l.startsWith("FAIL ")).map((l) => l.slice(5).replace(/ (\[|\").*$/, "").trim());
};
let bad = 0;
let baseFails = 0;
try {
  baseFails = run(proposed).length;
  console.log(`${baseFails ? "MISS" : "ok  "} proposed guide: ${baseFails} FAIL`);
  for (const [n, label, edit, want] of PAIRS) {
    const fails = run(edit(proposed)).map((f) => [C10, CL, CP, CT, ...want].find((t) => f.startsWith(t)) ?? f);
    const ok = fails.length === want.length && want.every((w) => fails.includes(w));
    if (!ok) bad++;
    console.log(`${ok ? "ok  " : "MISS"} ${n} ${label} → ${fails.length ? fails.join(" | ") : "all green"}`);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
// S2: the R-1142 predicate (templates-render.test.mjs:395-400 at 2dbc817), replicated, on a shared
// file whose pointer gains a clause on parallel work.
const POINTER = "- Seat guide: while a builder or reviewer runs, the seat does not read or judge its partial work, and it acts when the run completes. The full guide is `$HOME/nana-pi/packages/nana-setup/claude/rules/nana-seat.md`; Claude Code loads it as a rule.";
const r1142 = (s) => { const b = [...s.matchAll(/^- Seat guide:.*$/gm)].map((m) => m[0]); return b.length === 1 && b[0] === POINTER; };
const s2 = shared.replace("and it acts when the run completes.", "and it acts when the run completes; it starts independent work at the same time.");
const okS2 = r1142(shared) === true && r1142(s2) === false;
if (!okS2) bad++;
console.log(`${okS2 ? "ok  " : "MISS"} S2 the shared pointer gains a parallel clause → R-1142 "shared working pattern carries one seat-guide bullet" ${r1142(s2) ? "green" : "red"} (base ${r1142(shared) ? "green" : "red"})`);
console.log(`RESULT ${PAIRS.length + 1 - bad}/${PAIRS.length + 1} as declared`);
process.exit(bad || baseFails ? 1 : 0);
