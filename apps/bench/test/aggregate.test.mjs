// Aggregate arithmetic on a fixed results.jsonl. Every number in summary.md is a decision input,
// so the medians, the denominators and the shared-task restriction are pinned here by hand.
// Three properties matter most: a grader error never counts as a model failure, an extension's
// nested spend never disappears, and profiles are never pooled across different workloads.
// Run: node apps/bench/test/aggregate.test.mjs   (exit 0 = all PASS)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aggregate, spendOf, stats, toMarkdown } from "../aggregate.mjs";

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
check("spendOf adds nested tokens to own tokens", spendOf({ totalTokens: 100, nestedTokens: { in: 900 } }) === 1000);
check("spendOf tolerates a record with no nested field", spendOf({ totalTokens: 100 }) === 100);

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

// ── degenerate ───────────────────────────────────────────────────────────────────────────────
const one = aggregate([{ task: "t", family: "f", profile: "p", rep: 0, state: "fail", ok: false, totalTokens: 5, wallMs: 1, turns: 0 }]);
check("single failing run: spendPerSuccess is null, not Infinity", one.cells[0].spendPerSuccess === null);
check("missing toolCalls does not throw", JSON.stringify(one.cells[0].toolCalls) === "{}");
const legacy = aggregate([{ task: "t", family: "f", profile: "p", rep: 0, ok: true, tokens: { in: 1, out: 2, cacheRead: 3, cacheWrite: 4 }, wallMs: 1, turns: 1 }]);
check("a pre-state record still aggregates (ok:true counts as decided+success)", legacy.cells[0].successes === 1 && legacy.cells[0].spend.median === 10);
const allGrader = aggregate([{ task: "t", family: "f", profile: "p", rep: 0, state: "grader-error", ok: null, totalTokens: 5, wallMs: 1 }]);
check("a cell of nothing but grader errors has a null success rate, not 0%", allGrader.cells[0].successRate === null && allGrader.cells[0].decided === 0);

process.exit(fails ? 1 : 0);
