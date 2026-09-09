// Aggregate arithmetic on a fixed results.jsonl. Every number in summary.md is a decision input,
// so the medians, the denominators and the shared-task restriction are pinned here by hand.
// Three properties matter most: a grader error never counts as a model failure, an extension's
// nested spend never disappears, and profiles are never pooled across different workloads.
// Run: node apps/bench/test/aggregate.test.mjs   (exit 0 = all PASS)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aggregate, costOf, spendOf, stats, toMarkdown } from "../aggregate.mjs";
import { observedCostOfRecord } from "../lib/usage.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const records = fs.readFileSync(path.join(here, "fixtures", "results-fixed.jsonl"), "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
const schedule = JSON.parse(fs.readFileSync(path.join(here, "fixtures", "schedule-fixed.json"), "utf8"));

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};

// stats primitives — hand-computed
const s = stats([1, 2, 3, 4]);
check("median of an even sample interpolates", s.median === 2.5, String(s.median));
check("p25/p75 interpolate", s.p25 === 1.75 && s.p75 === 3.25, `${s.p25}/${s.p75}`);
check("IQR = p75 - p25", s.iqr === 1.5, String(s.iqr));
check("empty sample is null, not NaN", stats([]).median === null && stats([]).n === 0);
check("non-numbers are dropped", stats([1, null, undefined, "x", 3]).n === 2);
check("spendOf adds nested tokens to own tokens", spendOf({ totalTokens: 100, nestedTokens: { totalTokens: 900 } }) === 1000);
check("spendOf tolerates a record with no nested field", spendOf({ totalTokens: 100 }) === 100);
check("spendOf prefers the runner's recorded `spend` when present", spendOf({ spend: 777, totalTokens: 100, nestedTokens: { totalTokens: 900 } }) === 777);
// The parser now keeps own and nested APART, so this addition counts a tool's usage once — the
// shipped fixture is astra's 1,530 + 4,810 = 6,340, which used to aggregate as 11,150.
check("own + nested is counted exactly once", spendOf({ totalTokens: 1530, nestedTokens: { totalTokens: 4810 } }) === 6340);

const agg = aggregate(records, schedule);
const cell = (t, p) => agg.cells.find((c) => c.task === t && c.profile === p);

// ── denominators: a run-error is NOT a model failure ─────────────────────────────────────────
const A1 = cell("t1", "A"); // 100 ok, 200 ok, 300 run-error
check("t1/A: three runs recorded", A1.n === 3);
check("t1/A: only TWO are decided (the run-error leaves the denominator)", A1.decided === 2, String(A1.decided));
check("t1/A: success rate is 2/2, not 2/3", A1.successRate === 1, String(A1.successRate));
check("t1/A: the run-error is still reported in states", A1.states["run-error"] === 1, JSON.stringify(A1.states));
check("t1/A: spend median over DECIDED runs only", A1.spend.median === 150, String(A1.spend.median));

const C2 = cell("r2", "C"); // ok, grader-error, ok(with unknown nested)
check("r2/C: a grader error is excluded from the denominator", C2.decided === 2 && C2.successes === 2, `${C2.successes}/${C2.decided}`);
check("r2/C: …but is counted in states", C2.states["grader-error"] === 1, JSON.stringify(C2.states));
check("r2/C: an unmeasured nested call is flagged on the cell", C2.nestedUnknown === 1, String(C2.nestedUnknown));

// ── nested spend cannot hide ─────────────────────────────────────────────────────────────────
const B_r1 = cell("r1", "B");
const C_r1 = cell("r1", "C");
check("r1: B and C have identical OWN tokens", B_r1.ownTokens.median === 100 && C_r1.ownTokens.median === 100);
check("r1: C's spend is 10x B's once nested tokens count", C_r1.spend.median === 1000 && B_r1.spend.median === 100, `${C_r1.spend.median} vs ${B_r1.spend.median}`);
check("r1: nested tokens are also reported on their own", C_r1.nestedTokens.median === 900, String(C_r1.nestedTokens.median));

// ── per-family, shared tasks only ────────────────────────────────────────────────────────────
const code = agg.byFamily.find((f) => f.family === "code");
check("code family: t3 is EXCLUDED (only B ran it)", code.shared.join() === "t1,t2" && code.excluded.join() === "t3", `${code.shared} / ${code.excluded}`);
const rowA = code.rows.find((r) => r.profile === "A");
const rowB = code.rows.find((r) => r.profile === "B");
check("code/A: median of per-task medians = median(150, 400)", rowA.medianOfTaskMedians === 275, String(rowA.medianOfTaskMedians));
check("code/B: median of per-task medians = median(150, 900)", rowB.medianOfTaskMedians === 525, String(rowB.medianOfTaskMedians));
// The guard the review asked for: B wins t1 and loses t2 badly. The medians alone look close;
// the TOTAL of task medians is what shows the damage.
check("code/A: total of task medians = 150 + 400", rowA.totalOfTaskMedians === 550, String(rowA.totalOfTaskMedians));
check("code/B: total of task medians = 150 + 900 (the expensive task cannot hide)", rowB.totalOfTaskMedians === 1050, String(rowB.totalOfTaskMedians));
check("code/B: t3 is not in the totals", rowB.totalOfTaskMedians !== 1050 + 10);
check("per-task success counts are exposed as x/N", rowA.perTaskSuccess.t1 === "2/2" && rowB.perTaskSuccess.t2 === "3/3", JSON.stringify(rowA.perTaskSuccess));
check("cache buckets are reported, not averaged away", rowB.cache.cold === 4 && rowB.cache.warm === 2, JSON.stringify(rowB.cache));

const research = agg.byFamily.find((f) => f.family === "research");
check("research family holds only B and C", research.profiles.join() === "B,C");
check("A never appears in the research family", !research.rows.some((r) => r.profile === "A"));
check("families are separated (no pooled row across workloads)", agg.byFamily.length === 2);

// ── integrity ────────────────────────────────────────────────────────────────────────────────
check("a duplicate tuple is flagged", agg.integrity.duplicates.includes("r2|B|0"), JSON.stringify(agg.integrity.duplicates));
check("a scheduled-but-missing tuple is flagged", agg.integrity.missing.includes("t2|A|9"), JSON.stringify(agg.integrity.missing));

// ── cost, carried from pi's own arithmetic ───────────────────────────────────────────────────
const A2 = cell("t2", "A"); // three priced runs
check("t2/A: a fully priced cell reports cost stats", A2.cost !== null && A2.cost.median > 0, JSON.stringify(A2.cost));
check("t2/A: nothing unpriced there", A2.costUnpriced === 0);
const C1 = cell("r1", "C"); // one of three runs went unpriced
check("r1/C: a cell with an UNPRICED run reports cost null, not a partial total", C1.cost === null);
check("r1/C: …and says how many runs were unpriced", C1.costUnpriced === 1, String(C1.costUnpriced));
check("r1/C: …and still reports the priced part as an explicit lower bound", C1.observedCost.median > 0, String(C1.observedCost.median));
check("r1/C: …with a reason a reader can act on", C1.costUnknownReasons.length > 0, JSON.stringify(C1.costUnknownReasons));
// astra E: costOfRecord ignored nestedUnknown and returned money for an unknown-spend record.
check("a record flagged nestedUnknown has NO cost, whatever its cost field says", costOf({ cost: 0.01, nestedUnknown: true }) === null);
check("…but its observed cost is still available, separately named", observedCostOfRecord({ cost: 0.01, nestedUnknown: true }) === 0.01);
check("r1/C: token spend is still reported (only money is unknown)", C1.spend.median === 1000, String(C1.spend.median));
const rowsC = agg.byFamily.find((f) => f.family === "research").rows;
check("a profile row with any unpriced cell reports totalCost null", rowsC.find((r) => r.profile === "C").totalCost === null);
check("a fully priced profile row reports a money total", rowsC.find((r) => r.profile === "B").totalCost > 0, String(rowsC.find((r) => r.profile === "B").totalCost));

// ── markdown ─────────────────────────────────────────────────────────────────────────────────
const md = toMarkdown({ id: "fixture-study", baselineProfile: "A" }, agg, records);
check("markdown reports the run count", md.includes("Runs recorded: **28**"));
check("markdown warns about integrity problems", md.includes("⚠ Integrity") && md.includes("duplicate tuple"));
check("markdown has a per-family section", md.includes("Family `code`") && md.includes("Family `research`"));
check("markdown names the excluded task", md.includes("Excluded from the comparison") && md.includes("t3"));
check("markdown states the denominator rule", md.includes("grader errors, harness errors and blocked runs are reported but never counted"));
check("markdown states spend includes nested tokens", md.includes("PLUS any nested LLM tokens"));
check("markdown ratio to baseline uses spend, not own tokens", /\| t2 \| 2\.25× \(\+0\) \|/.test(md), md.split("\n").filter((l) => l.includes("×")).join(" | "));
check("markdown flags an unmeasured nested cell", md.includes("⚠?"));
check("markdown carries a money column", md.includes("$ median") && /\| \$0\./.test(md));
check("markdown says `unknown` rather than inventing a total", md.includes("unknown ≥$"), md.split("\n").filter((l) => l.includes("unknown")).join(" | ").slice(0, 170));
check("markdown gives the observed lower bound beside it", /unknown ≥\$\d/.test(md));
check("markdown calls the lower bound a lower bound", md.includes("LOWER BOUND"));
check("markdown credits pi's calculateCost for the money", md.includes("calculateCost") && md.includes("@earendil-works/pi-ai"));

// ── degenerate ───────────────────────────────────────────────────────────────────────────────
const one = aggregate([{ task: "t", family: "f", profile: "p", rep: 0, state: "fail", ok: false, totalTokens: 5, wallMs: 1, turns: 0 }]);
check("single failing run: spendPerSuccess is null, not Infinity", one.cells[0].spendPerSuccess === null);
check("missing toolCalls does not throw", JSON.stringify(one.cells[0].toolCalls) === "{}");
const legacy = aggregate([{ task: "t", family: "f", profile: "p", rep: 0, ok: true, tokens: { in: 1, out: 2, cacheRead: 3, cacheWrite: 4 }, wallMs: 1, turns: 1 }]);
check("a pre-pi-shape record still aggregates via the bucket fallback", legacy.cells[0].successes === 1 && legacy.cells[0].spend.median === 10);
const piShaped = aggregate([{ task: "t", family: "f", profile: "p", rep: 0, state: "ok", ok: true, tokens: { input: 1, output: 2, cacheRead: 3, cacheWrite: 4, totalTokens: 99, cost: { total: 0.5 } }, wallMs: 1, turns: 1 }]);
check("a pi-shaped record uses pi's authoritative totalTokens, not the bucket sum", piShaped.cells[0].spend.median === 99, String(piShaped.cells[0].spend.median));
const allGrader = aggregate([{ task: "t", family: "f", profile: "p", rep: 0, state: "grader-error", ok: null, totalTokens: 5, wallMs: 1 }]);
check("a cell of nothing but grader errors has a null success rate, not 0%", allGrader.cells[0].successRate === null && allGrader.cells[0].decided === 0);

process.exit(fails ? 1 : 0);
