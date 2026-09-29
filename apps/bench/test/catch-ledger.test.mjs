// catch-ledger: structural extraction over the real review corpus, κ arithmetic, the matcher's
// structural stages, ledger uniqueness, and the judge's fail-closed contract. Zero model calls:
// the judge is exercised only through stub executables that FAIL (or succeed with a fixed shape).
// Run: node apps/bench/test/catch-ledger.test.mjs   (exit 0 = all PASS)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { answeredReport, extractCorpus, parseReport } from "../lib/catch-extract.mjs";
import { callJudge, labelSchema, validateLabels } from "../lib/catch-judge.mjs";
import { adjacency, buildLedger, cohensKappa, seededSample, stageHints } from "../lib/catch-stats.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REVIEWS = path.resolve(here, "../../../docs/reviews");
let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};
const throws = (f, re) => {
	try {
		f();
		return false;
	} catch (e) {
		return re.test(e.message);
	}
};

// ── κ by hand ────────────────────────────────────────────────────────────────────────────────
{
	const k = cohensKappa(["y", "y", "n", "n"], ["y", "n", "n", "n"]); // po .75, pe .5·.25+.5·.75=.5
	check("κ 2×2 by hand = 0.5", Math.abs(k.kappa - 0.5) < 1e-12 && k.po === 0.75 && k.pe === 0.5);
	const a = [...Array(20).fill("y"), ...Array(5).fill("y"), ...Array(10).fill("n"), ...Array(15).fill("n")];
	const b = [...Array(20).fill("y"), ...Array(5).fill("n"), ...Array(10).fill("y"), ...Array(15).fill("n")];
	check("κ textbook 20/5/10/15 = 0.4", Math.abs(cohensKappa(a, b).kappa - 0.4) < 1e-12);
	check("κ perfect agreement = 1", cohensKappa(["a", "b", "c"], ["a", "b", "c"]).kappa === 1);
	check("κ one-category both raters = 1 (degenerate pe=1)", cohensKappa(["a", "a"], ["a", "a"]).kappa === 1);
	check("κ rejects unequal vectors", throws(() => cohensKappa(["a"], ["a", "b"]), /equal length/));
	const s1 = seededSample(["x1", "x2", "x3", "x4", "x5"], 3, "s"), s2 = seededSample(["x5", "x4", "x3", "x2", "x1"], 3, "s");
	check("seeded sample is order-independent and deterministic", JSON.stringify(s1) === JSON.stringify(s2) && s1.length === 3);
}

// ── extraction over the real corpus ─────────────────────────────────────────────────────────
const c1 = extractCorpus(REVIEWS);
const c2 = extractCorpus(REVIEWS);
check("corpus: 35 reviewer reports", c1.reports.length === 35, `(${c1.reports.length})`);
check("corpus: 28 fix briefs", c1.fixBriefs.length === 28, `(${c1.fixBriefs.length})`);
check("corpus: every report yields ≥1 row", c1.stats.every((s) => s.parsed), c1.stats.filter((s) => !s.parsed).map((s) => s.report).join(","));
check("extraction is deterministic (two runs byte-identical)", JSON.stringify(c1.rows) === JSON.stringify(c2.rows) && JSON.stringify(c1.skipped) === JSON.stringify(c2.skipped));
check("row ids unique", new Set(c1.rows.map((r) => r.id)).size === c1.rows.length);
{
	const l3 = c1.rows.filter((r) => r.report === "l3-sol-r1" && r.kind === "finding");
	check("l3-sol-r1: the 7 numbered severity findings, in order", l3.length === 7 && l3.map((r) => r.item_no).join() === "1,2,3,4,5,6,7" && l3.map((r) => r.severity).join() === "HIGH,HIGH,MEDIUM,MEDIUM,LOW,LOW,LOW");
	check("l3-sol-r1 #3 surface + role tag", l3[2].surface === "packages/nana-pack/extensions/nana-handoff.ts:227-236" && l3[2].role_tag === "adversarial");
	const l1 = c1.rows.filter((r) => r.report === "l1-sol-r1" && r.kind === "finding");
	check("l1-sol-r1: heading items own their bullet lists (2 findings, not 7)", l1.length === 2 && l1[0].body.includes("allowPatterns"));
	check("l1-sol-r1 #1 carries both role tags", l1[0].role_tag === "adversarial+scope");
	const t2b = c1.rows.filter((r) => r.report === "t2b-sol-r2");
	check("t2b-sol-r2: 9 verification lines (#1–#9) + new findings #10–#13,#15", t2b.filter((r) => r.kind === "verification").length === 9 && t2b.filter((r) => r.kind === "finding").map((r) => r.item_no).join() === "10,11,12,13,15");
	const must = c1.rows.filter((r) => r.report === "l3-astra-land" && r.severity === "MUST");
	check("l3-astra-land: exactly its 2 MUST items", must.length === 2);
	const sc = c1.stats.filter((s) => s.score != null).map((s) => s.score).sort().join("");
	check("astra SCORE lines: 13 parsed (6,7×6,9×6)", sc === "6777777999999", sc);
}
{
	const ans = Object.fromEntries(c1.fixBriefs.map((f) => [f.file.split("/")[1], f.answers]));
	check("fix brief → answered report (header 'Read …')", ans["l3-fix-brief.md"] === "l3-sol-r1" && ans["l1-fix2-brief.md"] === "l1-astra-land" && ans["t2c-fix7-brief.md"] === "t2c-astra-r2");
	check("seat-raised fix briefs answer no report", ["l2-fix2-brief.md", "t2a-fix-brief.md", "t2b-fix2-brief.md", "t2c-fix-brief.md", "t2c-fix5-brief.md"].every((f) => ans[f] === null));
	check("answeredReport ignores names outside the Read clause", answeredReport("# x after l9-sol-r1\n\nno read here", "l9") === null);
}
// No silent drop: every top-level list item / bold-led paragraph in every report is either inside a
// row body or logged in `skipped`.
{
	const hay = c1.rows.map((r) => r.body).join("\n") + "\n" + c1.skipped.map((s) => s.text).join("\n");
	const norm = (s) => s.replace(/\s+/g, " ").trim().slice(0, 50);
	const H = norm(hay);
	const lost = [];
	for (const r of c1.reports) {
		for (const line of fs.readFileSync(path.join(REVIEWS, r.file), "utf8").split("\n")) {
			const m = line.match(/^(?:[-*]|\d+\.)\s+(.*)$/) || line.match(/^(\*\*.*)$/);
			if (!m || /^\**(VERDICT|SCORE)/.test(line)) continue;
			const probe = norm(m[1]).slice(0, 40);
			if (probe.length > 8 && !hay.replace(/\s+/g, " ").includes(probe)) lost.push(`${r.name}: ${probe}`);
		}
	}
	check("no silent drop: every top-level item is a row or logged", lost.length === 0 && H.length > 0, lost.slice(0, 3).join(" | "));
}
// Synthetic shapes
{
	const md = "## Findings\n\n### HIGH — thing breaks `a/b.ts:10-12`\n\nbody\n\n- probe 1\n\n**MUST**\n- fix it\n\nCARRY: one; two `x;y`; three\n\n1. **#4 FIXED** — ok\n\n**NEW:** No new blocker found.\n\nVERDICT: BLOCK";
	const p = parseReport(md, { id: "z/sol-r2", lane: "z", model: "sol", round: 2, name: "z-sol-r2" });
	const k = p.rows.map((r) => `${r.kind}:${r.severity ?? "-"}`).join(",");
	check("synthetic: heading item, MUST, inline CARRY split (3), verification, NEW inline", k === "finding:HIGH,finding:MUST,carry:-,carry:-,carry:-,verification:-,finding:-", k);
	check("synthetic: heading item absorbs its bullet", p.rows[0].body.includes("probe 1") && p.rows[0].surface === "a/b.ts:10-12");
	check("synthetic: verdict parsed", p.verdict === "BLOCK");
}

// ── matcher stages + ledger uniqueness ──────────────────────────────────────────────────────
{
	const R = (id, refs, model = "sol", round = 1) => ({ id, lane: "z", reviewer_model: model, round, rung: `${model}-r${round}`, kind: "finding", refs, report: id.split("#")[0] });
	const rows = [
		R("z/sol-r1#1", [{ base: "a.ts", from: 10, to: 12 }]),
		R("z/sol-r1#2", [{ base: "a.ts", from: 40, to: 40 }]),
		R("z/astra-r1#1", [{ base: "a.ts", from: 16, to: 20 }], "astra"),
		R("z/astra-r1#2", [], "astra"),
		R("z/astra-r1#3", [], "astra"),
	];
	const h = stageHints(rows);
	const st = (a, b) => h.find((x) => x.a === a && x.b === b)?.stage;
	check("stage: same file, lines 10-12 vs 16-20 within ±5 → line", st("z/sol-r1#1", "z/astra-r1#1") === "line");
	check("stage: same file, far lines → file only", st("z/sol-r1#2", "z/astra-r1#1") === "file");
	check("stage: no refs → no hint (semantic stage only)", !h.some((x) => x.b === "z/astra-r1#2"));
	const labels = new Map(rows.map((r) => [r.id, { is_finding: true, top: "functional", disposition: "accepted" }]));
	// judge says: astra#1 == sol#1 (cross-rung); astra#3 restates astra#2 (same report); one-sided output
	const adj = adjacency([{ id: "z/astra-r1#1", same_as: ["z/sol-r1#1"] }, { id: "z/astra-r1#3", same_as: ["z/astra-r1#2", "not-in-pool"] }], rows);
	const { L, findings } = buildLedger(rows, labels, adj);
	const g = (id) => L.find((r) => r.id === id);
	check("adjacency is symmetrised", adj.get("z/sol-r1#1").has("z/astra-r1#1"));
	check("cross-rung match → not unique, matched_sol", !g("z/astra-r1#1").unique && g("z/astra-r1#1").matched_sol);
	check("same-report restatement → later row is a duplicate, earlier stays unique", g("z/astra-r1#3").dup_in_report && !g("z/astra-r1#2").dup_in_report && g("z/astra-r1#2").unique);
	check("duplicates are excluded from findings", findings.length === 4 && !findings.some((r) => r.id === "z/astra-r1#3"));
}

// ── judge: fail-closed, no mock ─────────────────────────────────────────────────────────────
{
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "catch-judge-"));
	const stub = (name, body) => {
		const f = path.join(tmp, name);
		fs.writeFileSync(f, `#!/usr/bin/env node\n${body}\n`, { mode: 0o755 });
		return f;
	};
	const run = (bin) => {
		process.env.CATCH_JUDGE_BIN = bin;
		try {
			return callJudge({ model: "claude-opus-5-5", system: "s", prompt: "p", schema: labelSchema });
		} finally {
			delete process.env.CATCH_JUDGE_BIN;
		}
	};
	check("judge missing → throws 'unavailable'", throws(() => run(path.join(tmp, "nope")), /unavailable/));
	check("judge exit 1 → throws", throws(() => run(stub("fail", "process.exit(1)")), /exited 1/));
	check("judge non-JSON → throws", throws(() => run(stub("garbage", "process.stdout.write('hello')")), /non-JSON/));
	check("judge is_error → throws", throws(() => run(stub("err", `process.stdout.write(JSON.stringify({is_error:true,result:"x"}))`)), /no structured output/));
	check("judge silently on another model → throws", throws(() => run(stub("wrongmodel", `process.stdout.write(JSON.stringify({is_error:false,structured_output:{labels:[]},modelUsage:{"claude-haiku-4":{}}}))`)), /expected claude-opus/));
	const ok = run(stub("ok", `process.stdout.write(JSON.stringify({is_error:false,structured_output:{labels:[]},modelUsage:{"claude-opus-5-5":{}},total_cost_usd:0.01}))`));
	check("judge well-formed → returns structured output + cost", Array.isArray(ok.out.labels) && ok.cost === 0.01);
	const L = (id, d, q) => ({ id, is_finding: true, top: "functional", sub: "logic", surface: "none", validity: "PLAUSIBLE", disposition: d, fix_quote: q, origin: "worker_impl", relation: "n/a", rationale: "" });
	check("labels: missing id → throws", throws(() => validateLabels({ labels: [L("a", "unmatched", "")] }, ["a", "b"], ""), /missing b/));
	const v = validateLabels({ labels: [L("a", "accepted", "Fix   these\nnow"), L("b", "accepted", "invented text")] }, ["a", "b"], "## Fix these now please");
	check("labels: verbatim quote (whitespace-normalised) keeps 'accepted'", v[0].disposition === "accepted" && v[0].quote_verified);
	check("labels: unverifiable quote forces 'unmatched' and keeps the raw claim", v[1].disposition === "unmatched" && v[1].disposition_raw === "accepted");
	fs.rmSync(tmp, { recursive: true, force: true });
}
{
	const cli = path.resolve(here, "../catch-ledger.mjs");
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "catch-cli-"));
	const r = spawnSync(process.execPath, [cli, "label", "a", "l4"], { env: { ...process.env, CATCH_JUDGE_BIN: path.join(tmp, "absent"), CATCH_OUT: tmp }, encoding: "utf8" });
	check("CLI: judge unavailable → exit non-zero, nothing labelled", r.status === 1 && /unavailable/.test(r.stderr) && !fs.existsSync(path.join(tmp, "labels-a.jsonl")));
	const b = spawnSync(process.execPath, [cli, "build"], { env: { ...process.env, CATCH_OUT: tmp }, encoding: "utf8" });
	check("CLI: build without labels → exit non-zero", b.status === 1 && /lack pass-A labels/.test(b.stderr));
	fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(fails ? `${fails} FAIL` : "all PASS");
process.exit(fails ? 1 : 0);
