/**
 * @module apps/bench/test/catch-ledger.test.mjs
 * @purpose Pins the catch ledger — structural extraction over the real review corpus, the kappa arithmetic, the matcher's stages, ledger uniqueness, and the judge's fail-closed contract with zero model calls
 * @inputs lib/catch-extract.mjs, lib/catch-judge.mjs, lib/catch-stats.mjs, the docs/reviews corpus, and stub judge executables
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp dirs, ledger files, reads the review corpus), process (spawns the stub judge executables)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// catch-ledger: structural extraction over the real review corpus, κ arithmetic, the matcher's
// structural stages, ledger uniqueness, and the judge's fail-closed contract. Zero model calls:
// the judge is exercised only through stub executables that FAIL (or succeed with a fixed shape).
// Run: node apps/bench/test/catch-ledger.test.mjs   (exit 0 = all PASS)
import { tmpDir } from "./tmp-dir.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { answeredReport, extractCorpus, parseReport } from "../lib/catch-extract.mjs";
import { callJudge, labelSchema, validateLabels } from "../lib/catch-judge.mjs";
import { buildLedger, claims, components, matchGraph, cohensKappa, matchConfidence, sameBase, samePath, seededSample, stageHints } from "../lib/catch-stats.mjs";

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
	// req: R-536
	check("κ rejects unequal vectors", throws(() => cohensKappa(["a"], ["a", "b"]), /equal length/));
	const s1 = seededSample(["x1", "x2", "x3", "x4", "x5"], 3, "s"), s2 = seededSample(["x5", "x4", "x3", "x2", "x1"], 3, "s");
	// req: R-536
	check("seeded sample is order-independent and deterministic", JSON.stringify(s1) === JSON.stringify(s2) && s1.length === 3);
}

// ── extraction over the real corpus ─────────────────────────────────────────────────────────
const c1 = extractCorpus(REVIEWS);
const c2 = extractCorpus(REVIEWS);
check("corpus: 35 reviewer reports", c1.reports.length === 35, `(${c1.reports.length})`);
check("corpus: 28 fix briefs", c1.fixBriefs.length === 28, `(${c1.fixBriefs.length})`);
check("corpus: every report yields ≥1 row", c1.stats.every((s) => s.parsed), c1.stats.filter((s) => !s.parsed).map((s) => s.report).join(","));
// req: R-536
check("extraction is deterministic (two runs byte-identical)", JSON.stringify(c1.rows) === JSON.stringify(c2.rows) && JSON.stringify(c1.skipped) === JSON.stringify(c2.skipped));
// req: R-536
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
	// req: R-536
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
	const G = matchGraph([{ id: "z/astra-r1#1", same_as: ["z/sol-r1#1"], covers: [] }, { id: "z/astra-r1#3", same_as: ["z/astra-r1#2"], covers: [] }], rows);
	const { L, findings } = buildLedger(rows, labels, G);
	const g = (id) => L.find((r) => r.id === id);
	check("same_as is symmetrised", G.eq.get("z/sol-r1#1").has("z/astra-r1#1"));
	let thrown = "";
	try { matchGraph([{ id: "z/astra-r1#3", same_as: ["not-in-pool"], covers: [] }], rows); } catch (e) { thrown = e.message; }
	check("matchGraph: unknown id in same_as throws", /unknown id not-in-pool/.test(thrown), thrown);
	thrown = "";
	try { matchGraph([{ id: "z/astra-r1#3", same_as: [], covers: ["not-in-pool"] }], rows); } catch (e) { thrown = e.message; }
	check("matchGraph: unknown id in covers throws", /unknown id not-in-pool/.test(thrown), thrown);
	thrown = "";
	try { matchGraph([{ id: "z/astra-r1#3", same_as: ["z/astra-r1#2"], covers: ["z/astra-r1#2"] }], rows); } catch (e) { thrown = e.message; }
	check("matchGraph: an id in both same_as and covers throws", /both same_as and covers/.test(thrown), thrown);
	check("cross-rung match → not unique, matched_sol", !g("z/astra-r1#1").unique && g("z/astra-r1#1").matched_sol);
	check("same-report restatement → later row is a duplicate, earlier stays unique", g("z/astra-r1#3").dup_in_report && !g("z/astra-r1#2").dup_in_report && g("z/astra-r1#2").unique);
	check("duplicates are excluded from findings", findings.length === 4 && !findings.some((r) => r.id === "z/astra-r1#3"));
}
// sol r1 HIGH regression: uniqueness over CONNECTED COMPONENTS. Judge edges sol-r1 ~ astra-r2 and
// astra-r2 ~ astra-r1 only (no direct sol–astra-r1 edge). astra-r1 is the same defect as sol's.
{
	const R = (id, model, round) => ({ id, lane: "z", reviewer_model: model, round, rung: `${model}-r${round}`, kind: "finding", refs: [], report: id.split("#")[0] });
	const rows = [R("z/sol-r1#1", "sol", 1), R("z/astra-r2#1", "astra", 2), R("z/astra-r1#1", "astra", 1), R("z/astra-r1#2", "astra", 1)];
	const labels = new Map(rows.map((r) => [r.id, { is_finding: true, top: "functional", disposition: "accepted" }]));
	const adj = matchGraph([{ id: "z/sol-r1#1", same_as: ["z/astra-r2#1"], covers: [] }, { id: "z/astra-r2#1", same_as: ["z/astra-r1#1"], covers: [] }, { id: "z/astra-r1#2", same_as: [], covers: [] }], rows);
	const { L, findings } = buildLedger(rows, labels, adj);
	const g = (id) => L.find((r) => r.id === id);
	check("chain sol-r1 ~ astra-r2 ~ astra-r1: astra-r1 matched_sol via component", g("z/astra-r1#1").matched_sol && !g("z/astra-r1#1").unique);
	check("chain: matched_other_rungs spans the whole component", g("z/astra-r1#1").matched_other_rungs.join() === "astra-r2,sol-r1");
	const stats = [{ rung: "astra-r1", lane: "z", report: "z-astra-land" }];
	const P1 = claims(L, findings, stats).P1;
	check("chain: claims() does not count astra-r1#1 as sol-unmatched", P1.unique_accepted_rows.map((r) => r.id).join() === "z/astra-r1#2");
	// within-report duplicates are component-based too: #3 ~ sol ~ #1 → #3 restates #1
	const rows2 = [R("z/astra-r1#1", "astra", 1), R("z/sol-r1#1", "sol", 1), R("z/astra-r1#3", "astra", 1)];
	const adj2 = matchGraph([{ id: "z/astra-r1#1", same_as: ["z/sol-r1#1"], covers: [] }, { id: "z/sol-r1#1", same_as: ["z/astra-r1#3"], covers: [] }], rows2);
	const L2 = buildLedger(rows2, labels, adj2).L;
	check("component: later same-report row in the component is a duplicate", L2.find((r) => r.id === "z/astra-r1#3").dup_in_report && !L2.find((r) => r.id === "z/astra-r1#1").dup_in_report);
	check("components(): singleton for an isolated row", components(adj.eq).get("z/astra-r1#2") !== components(adj.eq).get("z/astra-r1#1"));
}
// sol r2 HIGH regression: a BUNDLE (t2c/astra-r1#5 shape) summarises two distinct defects #2 and #3.
// Containment never merges: #2 and #3 stay distinct, the bundle is the within-report duplicate
// (whatever its position), and a sol match on #2 does not leak to #3 through the bundle.
{
	const R = (id, model, round) => ({ id, lane: "z", reviewer_model: model, round, rung: `${model}-r${round}`, kind: "finding", refs: [], report: id.split("#")[0] });
	const labels = new Map(["z/astra-r1#1", "z/astra-r1#2", "z/astra-r1#3", "z/astra-r1#5", "z/sol-r1#1", "z/sol-r1#2"].map((i) => [i, { is_finding: true, top: "functional", disposition: "accepted" }]));
	const rows = [R("z/astra-r1#1", "astra", 1), R("z/astra-r1#2", "astra", 1), R("z/astra-r1#3", "astra", 1), R("z/astra-r1#5", "astra", 1), R("z/sol-r1#1", "sol", 1)];
	const G = matchGraph([
		{ id: "z/astra-r1#5", same_as: [], covers: ["z/astra-r1#2", "z/astra-r1#3"] },
		{ id: "z/astra-r1#2", same_as: ["z/sol-r1#1"], covers: [] },
		{ id: "z/astra-r1#3", same_as: [], covers: [] },
	], rows);
	const { L, findings } = buildLedger(rows, labels, G);
	const g = (id) => L.find((r) => r.id === id);
	check("bundle: #2 and #3 stay in different components", g("z/astra-r1#2").component !== g("z/astra-r1#3").component);
	check("bundle: #3 is NOT a within-report duplicate", !g("z/astra-r1#3").dup_in_report && !g("z/astra-r1#2").dup_in_report);
	check("bundle: the bundle #5 is the within-report duplicate", g("z/astra-r1#5").dup_in_report && !findings.some((r) => r.id === "z/astra-r1#5"));
	check("bundle: sol match on #2 does not leak to #3 through the bundle", g("z/astra-r1#2").matched_sol && !g("z/astra-r1#3").matched_sol && g("z/astra-r1#3").unique);
	// a bundle EARLIER in the report than its atoms is still the one dropped
	const G2 = matchGraph([{ id: "z/astra-r1#1", same_as: [], covers: ["z/astra-r1#2", "z/astra-r1#3"] }], rows);
	const L2 = buildLedger(rows, labels, G2).L;
	check("bundle first: bundle dropped, atoms kept", L2.find((r) => r.id === "z/astra-r1#1").dup_in_report && !L2.find((r) => r.id === "z/astra-r1#2").dup_in_report && !L2.find((r) => r.id === "z/astra-r1#3").dup_in_report);
	// containment denies uniqueness (either direction) but never merges; nothing dropped across reports
	const rows3 = [R("z/astra-r1#2", "astra", 1), R("z/sol-r1#1", "sol", 1), R("z/sol-r1#2", "sol", 1)];
	const G3 = matchGraph([{ id: "z/sol-r1#1", same_as: [], covers: ["z/astra-r1#2"] }], rows3);
	const L3 = buildLedger(rows3, labels, G3).L;
	const a3 = L3.find((r) => r.id === "z/astra-r1#2"), s3 = L3.find((r) => r.id === "z/sol-r1#1");
	check("covered by a sol bundle → matched_sol, not unique, via containment only", a3.matched_sol && !a3.unique && a3.matched_via_containment_only);
	check("covering an astra row → the sol bundle is matched too (either direction)", s3.matched_other_rungs.join() === "astra-r1");
	check("cross-report covers never drops", !a3.dup_in_report && !s3.dup_in_report && a3.component !== s3.component);
	check("claims(): row covered by sol is not sol-unmatched", !claims(L3, L3, [{ rung: "astra-r1", lane: "z", report: "z-astra-land" }]).P1.unique_accepted_rows.some((r) => r.id === "z/astra-r1#2"));
	// mutual containment is a contradiction → resolved as same_as and counted; same_as-vs-covers → covers, counted
	const G4 = matchGraph([{ id: "z/sol-r1#1", same_as: [], covers: ["z/astra-r1#2"] }, { id: "z/astra-r1#2", same_as: [], covers: ["z/sol-r1#1"] }, { id: "z/sol-r1#2", same_as: ["z/astra-r1#2"], covers: [] }], rows3);
	check("mutual covers → same_as, counted", G4.eq.get("z/sol-r1#1").has("z/astra-r1#2") && !G4.cov.get("z/sol-r1#1").has("z/astra-r1#2") && G4.stats.mutual_covers_as_same_as === 1, JSON.stringify(G4.stats));
	const G5 = matchGraph([{ id: "z/sol-r1#1", same_as: ["z/astra-r1#2"], covers: [] }, { id: "z/astra-r1#2", same_as: [], covers: ["z/sol-r1#1"] }], rows3);
	check("same_as one side, covers other side → covers (non-merging), counted", G5.cov.get("z/astra-r1#2").has("z/sol-r1#1") && !G5.eq.get("z/sol-r1#1").size && G5.stats.same_as_vs_covers_as_covers === 1, JSON.stringify(G5.stats));
}
// sol r1 MED regression: same basename, different directories is NOT the same file.
{
	const R = (id, refs) => ({ id, refs });
	const f = (file, from) => ({ file, base: file.split("/").pop(), from, to: from });
	const h = stageHints([R("x#1", [f("src/one/config.ts", 10)]), R("x#2", [f("src/two/config.ts", 12)])]);
	check("stage: src/one/config.ts vs src/two/config.ts → no hint", h.length === 0, JSON.stringify(h));
	check("stage: legacy basename rule still conflates them (kept only for cache keys)", stageHints([R("x#1", [f("src/one/config.ts", 10)]), R("x#2", [f("src/two/config.ts", 12)])], 5, sameBase).length === 1);
	check("samePath: bare basename is compatible with a full path", samePath("config.ts", "packages/nana-pack/lib/config.ts"));
	check("samePath: partial suffix compatible", samePath("lib/objective.ts", "packages/nana-pack/lib/objective.ts"));
	check("samePath: different parent dirs differ", !samePath("apps/desk/README.md", "packages/nana-pack/README.md"));
	check("samePath: ~ ignored, .. resolved canonically", samePath("~/.pi/agent/../agent/trust.json", "agent/trust.json"));
	check("samePath: a/b/../c → a/c", samePath("a/b/../c", "a/c") && !samePath("a/b/../c", "b/c"));
	check("samePath: .. is not deleted (x/b/../c ≠ b/c)", !samePath("x/b/../c.ts", "b/c.ts"));
}
// pre-registered match_confidence (explicit | semantic), structural
{
	const r = (o) => ({ quote_verified: true, disposition: "accepted", item_no: 3, severity: "HIGH", body: "the gate accepts a symlinked path outside the repo root", fix_quote: "", ...o });
	check("confidence: quote names #N → explicit", matchConfidence(r({ fix_quote: "sol #3 — close the symlink hole" })) === "explicit");
	check("confidence: 6-word shared span → explicit", matchConfidence(r({ fix_quote: "Fix: the gate accepts a symlinked path outside" })) === "explicit");
	check("confidence: verified quote without either → semantic", matchConfidence(r({ fix_quote: "resolve realpath before the check" })) === "semantic");
	check("confidence: MUST N only counts for a MUST row", matchConfidence(r({ fix_quote: "MUST 3 — realpath" })) === "semantic" && matchConfidence(r({ severity: "MUST", fix_quote: "MUST 3 — realpath" })) === "explicit");
	check("confidence: no verified disposition → null", matchConfidence(r({ quote_verified: false, fix_quote: "x" })) === null);
}

// ── judge: fail-closed, no mock ─────────────────────────────────────────────────────────────
{
	const tmp = tmpDir(path.join(os.tmpdir(), "catch-judge-"));
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
	// req: R-537
	check("judge missing → throws 'unavailable'", throws(() => run(path.join(tmp, "nope")), /unavailable/));
	// req: R-537
	check("judge exit 1 → throws", throws(() => run(stub("fail", "process.exit(1)")), /exited 1/));
	// req: R-537
	check("judge non-JSON → throws", throws(() => run(stub("garbage", "process.stdout.write('hello')")), /non-JSON/));
	// req: R-537
	check("judge is_error → throws", throws(() => run(stub("err", `process.stdout.write(JSON.stringify({is_error:true,result:"x"}))`)), /no structured output/));
	// req: R-537
	check("judge silently on another model → throws", throws(() => run(stub("wrongmodel", `process.stdout.write(JSON.stringify({is_error:false,structured_output:{labels:[]},modelUsage:{"claude-haiku-4":{}}}))`)), /expected claude-opus/));
	const ok = run(stub("ok", `process.stdout.write(JSON.stringify({is_error:false,structured_output:{labels:[]},modelUsage:{"claude-opus-5-5":{}},total_cost_usd:0.01}))`));
	check("judge well-formed → returns structured output + cost", Array.isArray(ok.out.labels) && ok.cost === 0.01);
	const L = (id, d, q) => ({ id, is_finding: true, top: "functional", sub: "logic", surface: "none", validity: "PLAUSIBLE", disposition: d, fix_quote: q, origin: "worker_impl", relation: "n/a", rationale: "" });
	check("labels: missing id → throws", throws(() => validateLabels({ labels: [L("a", "unmatched", "")] }, ["a", "b"], ""), /missing b/));
	const v = validateLabels({ labels: [L("a", "accepted", "Fix   these\nnow"), L("b", "accepted", "invented text")] }, ["a", "b"], "## Fix these now please");
	check("labels: verbatim quote (whitespace-normalised) keeps 'accepted'", v[0].disposition === "accepted" && v[0].quote_verified);
	// req: R-537
	check("labels: unverifiable quote forces 'unmatched' and keeps the raw claim", v[1].disposition === "unmatched" && v[1].disposition_raw === "accepted");
	fs.rmSync(tmp, { recursive: true, force: true });
}
{
	const cli = path.resolve(here, "../catch-ledger.mjs");
	const tmp = tmpDir(path.join(os.tmpdir(), "catch-cli-"));
	const r = spawnSync(process.execPath, [cli, "label", "a", "l4"], { env: { ...process.env, CATCH_JUDGE_BIN: path.join(tmp, "absent"), CATCH_OUT: tmp }, encoding: "utf8" });
	// req: R-537
	check("CLI: judge unavailable → exit non-zero, nothing labelled", r.status === 1 && /unavailable/.test(r.stderr) && !fs.existsSync(path.join(tmp, "labels-a.jsonl")));
	const b = spawnSync(process.execPath, [cli, "build"], { env: { ...process.env, CATCH_OUT: tmp }, encoding: "utf8" });
	check("CLI: build without labels → exit non-zero", b.status === 1 && /lack pass-A labels/.test(b.stderr));
	fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(fails ? `${fails} FAIL` : "all PASS");
process.exit(fails ? 1 : 0);
