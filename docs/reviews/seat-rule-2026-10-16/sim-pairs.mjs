// Wrong-code-first simulation for the seat-rule plan (§5.3). Scratch only: applies each pair's
// edit to a copy of the proposed guide (or the shared file) and runs the proposed seat-rule test.
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const proposed = fs.readFileSync(path.join(here, "..", "nana-seat.proposed.md"), "utf8");
const shared = fs.readFileSync(path.join(here, "..", "src", "templates", "_shared", "working-under-nana-pi.md"), "utf8");
const guidePath = path.join(here, "pkg", "claude", "rules", "nana-seat.md");
const lines = proposed.split("\n");
const B7 = lines.findIndex((l) => l.startsWith("- Keep at most"));
const BP = lines.findIndex((l) => l.startsWith("- At each step"));
const OLD7 = "- Keep at most two lanes in flight, a nana default. While one runs, work the other or end your turn.";
const sub = (a, b) => (t) => { if (!t.includes(a)) throw new Error(`anchor missing: ${a}`); return t.replace(a, b); };
const setLines = (fn) => (t) => { const ls = t.split("\n"); fn(ls); return ls.join("\n"); };
const C9 = "seat guide holds no bullet beyond its nine rules";
const CL = "seat guide carries: at most two lanes building and one in planning";
const CP = "seat guide carries: start what waits on nothing else, keep lane steps in order, run the full suite whole";
const PAIRS = [
  [1, "bullet 7 keeps the old two-lanes-in-flight text", setLines((ls) => { ls[B7] = OLD7; }), [CL, C9]],
  [2, "bullet 7 allows three lanes building", sub("at most two lanes building", "at most three lanes building"), [CL, C9]],
  [3, "bullet 7 drops the planning slot", sub(" and one more in planning", ""), [CL, C9]],
  [4, "bullet 7 drops what counts as building", sub(" A lane counts as building from its first build until it lands or closes.", ""), [CL, C9]],
  [5, "bullet 7 keeps the old second sentence", sub("until it lands or closes.", "until it lands or closes. While one runs, work the other or end your turn."), [CL, C9]],
  [6, "the guide has no parallel bullet", setLines((ls) => { ls.splice(BP, 1); }), [CP, C9]],
  [7, "the parallel bullet drops naming the work", sub("name what waits on nothing else and start it now", "start what waits on nothing else now"), [CP, C9]],
  [8, "the parallel bullet drops another lane's build", sub("another lane's build, ", ""), [CP, C9]],
  [9, "the parallel bullet drops the step-order sentence", sub(" Keep each lane's own steps in order: plan, seat checks, build, verify, review, land.", ""), [CP, C9]],
  [10, "the step order puts review before verify", sub("build, verify, review, land", "build, review, verify, land"), [CP, C9]],
  // 11 and 12 hold the two new pairs of seat revision 2 in the numbers the cut hand-split pairs left.
  [11, "the example goes back to a long check in parts", sub("a long mutation run in parts", "a long check in parts"), [CP, C9]],
  [12, "the parallel bullet drops the full-suite sentence", sub(" Run the full suite whole, never in parts.", ""), [CP, C9]],
  [13, "the parallel bullet appears twice", setLines((ls) => { ls.splice(BP, 0, ls[BP]); }), [CP, C9]],
  [14, "the step-order sentence becomes its own bullet", sub(" Keep each lane's own steps in order:", "\n- Keep each lane's own steps in order:"), [CP, C9]],
  [15, "the parallel bullet is indented under bullet 6", setLines((ls) => { ls[BP] = "  " + ls[BP]; }), [CP, C9]],
  [16, "the parallel text is folded into bullet 7", setLines((ls) => { ls[B7] = ls[B7] + " " + ls[BP].slice(2); ls.splice(BP, 1); }), [CL, CP, C9]],
  [17, "a tenth bullet is added", setLines((ls) => { ls.push("- Run every check in parts."); }), [C9]],
  ["S1", "the guide saved with CRLF line ends (must stay green)", (t) => t.replace(/\n/g, "\r\n"), []],
];
const run = (text) => {
  fs.writeFileSync(guidePath, text);
  const r = spawnSync(process.execPath, [path.join(here, "pkg", "tests", "seat-rule.test.mjs")], { encoding: "utf8" });
  return r.stdout.split("\n").filter((l) => l.startsWith("FAIL ")).map((l) => l.slice(5).replace(/ (\[|\").*$/, "").trim());
};
let bad = 0;
const base = run(proposed);
console.log(`proposed guide: ${base.length} FAIL`);
for (const [n, label, edit, want] of PAIRS) {
  const fails = run(edit(proposed)).map((f) => [C9, CL, CP, ...want].find((t) => f.startsWith(t)) ?? f);
  const ok = fails.length === want.length && want.every((w) => fails.includes(w));
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "MISS"} ${n} ${label} → ${fails.length ? fails.join(" | ") : "all green"}`);
}
// S2: the R-1142 predicate (templates-render.test.mjs:395-400 at 2dbc817), replicated, on a shared
// file whose pointer gains a clause on parallel work.
const POINTER = "- Seat guide: while a builder or reviewer runs, the seat does not read or judge its partial work, and it acts when the run completes. The full guide is `$HOME/nana-pi/packages/nana-setup/claude/rules/nana-seat.md`; Claude Code loads it as a rule.";
const r1142 = (s) => { const b = [...s.matchAll(/^- Seat guide:.*$/gm)].map((m) => m[0]); return b.length === 1 && b[0] === POINTER; };
const s2 = shared.replace("and it acts when the run completes.", "and it acts when the run completes; it starts independent work at the same time.");
const okS2 = r1142(shared) === true && r1142(s2) === false;
if (!okS2) bad++;
console.log(`${okS2 ? "ok  " : "MISS"} S2 the shared pointer gains a parallel clause → R-1142 "shared working pattern carries one seat-guide bullet" ${r1142(s2) ? "green" : "red"} (base ${r1142(shared) ? "green" : "red"})`);
fs.writeFileSync(guidePath, proposed);
console.log(`RESULT ${PAIRS.length + 1 - bad}/${PAIRS.length + 1} as declared`);
process.exit(bad ? 1 : 0);
