#!/usr/bin/env node
/**
 * @module apps/bench/catch-ledger.mjs
 * @purpose CLI for the retroactive catch ledger — extract reviewer findings, label and match them
 *  with judge models, then build the kappa table and the pre-registered claims.
 * @inputs argv subcommand (extract | label a|b|c [lane..] | match a|b [lane..] | build); env
 *  CATCH_REVIEWS (default docs/reviews) and CATCH_OUT (default
 *  apps/bench/studies/catch-ledger-2026-09-28); the review markdown corpus and any cached
 *  label/match jsonl under CATCH_OUT
 * @outputs under CATCH_OUT: rows.jsonl, skipped.jsonl, reports.json, per-pass label-*.jsonl and
 *  match-*.jsonl caches, kappa-pairs.json, results.json, table.md; progress and claims JSON on
 *  stdout
 * @effects disk (reads the corpus, writes and appends the ledger files), process (spawns the
 *  judge CLI, exits non-zero), network (judge model calls made by that child)
 * @errors exit 2 on an unknown subcommand; exit 1 on any judge failure or a missing label
 *  (fail-closed); build writes the refusal instead of table.md when kappa(top-level class) < 0.6
 */
// catch-ledger.mjs — the retroactive catch ledger (lane E1). Which reviewer rung caught which class
// of defect, and did the seat accept it. Method: research/raw/2026-09-28-eval/eval-methods.md §2.
//
//   node apps/bench/catch-ledger.mjs extract            structural; writes rows.jsonl, skipped.jsonl, reports.json
//   node apps/bench/catch-ledger.mjs label a [lane..]   judge pass A (Opus) over every row, cached per report
//   node apps/bench/catch-ledger.mjs label b            judge pass B (Sonnet), the seeded 40-row κ sample only
//   node apps/bench/catch-ledger.mjs label c            Sonnet over every sol-r3 finding (P2 relation κ; post-hoc, not pre-registered)
//   node apps/bench/catch-ledger.mjs match a|b [lane..] semantic matching per lane (after label a)
//   node apps/bench/catch-ledger.mjs build              κ, table, claims → results.json + table.md (no model)
//
// Fail-closed: a judge failure exits 1. `build` exits 1 if any label is missing, and refuses to
// write the table if κ(top-level class) < 0.6 (it writes the κ and the refusal instead).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractCorpus } from "./lib/catch-extract.mjs";
import { callJudge, GUIDE, labelPrompt, labelSchema, MATCH_GUIDE, matchSchema, MODELS, sha, validateLabels } from "./lib/catch-judge.mjs";
import { buildLedger, claims, cohensKappa, matchConfidence, sameBase, componentSizes, matchGraph, seededSample, stageHints, table } from "./lib/catch-stats.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "../..");
const REVIEWS = process.env.CATCH_REVIEWS || path.join(REPO, "docs/reviews");
const OUT = process.env.CATCH_OUT || path.join(here, "studies/catch-ledger-2026-09-28");
const SEED = "e1-2026-09-28";
const KAPPA_GATE = 0.6;
const LANE_BRIEF = { u: "pi-upgrade-brief.md" };

const readJsonl = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const writeJsonl = (f, rows) => fs.writeFileSync(f, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
const out = (f) => path.join(OUT, f);

function corpus() {
	const c = extractCorpus(REVIEWS);
	const dirOf = (lane) => c.reports.find((r) => r.lane === lane).file.split("/")[0];
	const read = (lane, f) => fs.readFileSync(path.join(REVIEWS, dirOf(lane), f), "utf8");
	c.laneBrief = (lane) => read(lane, LANE_BRIEF[lane] ?? `${lane}-brief.md`);
	c.fixText = (file) => fs.readFileSync(path.join(REVIEWS, file), "utf8");
	c.fixHeads = (lane) => c.fixBriefs.filter((f) => f.lane === lane).map((f) => `${f.file.split("/")[1]}: ${c.fixText(f.file).split("\n")[0]}`).join("\n");
	return c;
}

function cmdExtract() {
	const c = corpus();
	fs.mkdirSync(OUT, { recursive: true });
	writeJsonl(out("rows.jsonl"), c.rows);
	writeJsonl(out("skipped.jsonl"), c.skipped);
	fs.writeFileSync(out("reports.json"), JSON.stringify({ reports: c.stats, fix_briefs: c.fixBriefs.map((f) => ({ file: f.file, answers: f.answers })) }, null, 1) + "\n");
	const unparsed = c.stats.filter((s) => !s.parsed).map((s) => s.report);
	const bodies = c.skipped.filter((s) => s.reason === "attached_as_body").length;
	console.log(`reports ${c.stats.length} · parsed ${c.stats.length - unparsed.length} · unparsed [${unparsed.join(", ")}]`);
	console.log(`rows ${c.rows.length} (${["finding", "carry", "verification"].map((k) => `${k} ${c.rows.filter((r) => r.kind === k).length}`).join(", ")}) · non-row blocks ${c.skipped.length} (attached-as-body ${bodies}, logged in skipped.jsonl)`);
	console.log(`fix briefs ${c.fixBriefs.length} · answering a report ${c.fixBriefs.filter((f) => f.answers).length} · reviewer-less (seat/worker-raised) ${c.fixBriefs.filter((f) => !f.answers).length}`);
}

// The exact prompt for one report in one pass. Labels are valid ONLY for the prompt hash they were
// produced from: any change to extraction (ids, bodies) or context invalidates them.
function labelJobs(c, pass) {
	const sample = new Set(seededSample(c.rows.filter((r) => r.kind !== "verification").map((r) => r.id), 40, SEED));
	const jobs = [];
	for (const rep of c.reports) {
		const stat = c.stats.find((s) => s.report === rep.name);
		// a: every row · b: the seeded κ sample · c: every non-verification sol-r3 row (P2 reliability, post-hoc)
		const pick = { a: () => true, b: (r) => sample.has(r.id), c: (r) => r.rung === "sol-r3" && r.kind !== "verification" }[pass];
		const rows = c.rows.filter((r) => r.report === rep.name && pick(r));
		if (!rows.length) continue;
		const fixes = (stat.answered_by || []).map((f) => ({ file: f.split("/")[1], text: c.fixText(f) }));
		const earlier = (r) => r.lane === rep.lane && r.kind !== "verification" && (r.reviewer_model === rep.model ? r.round < rep.round : rep.model === "astra");
		const prompt = labelPrompt({ report: { ...rep, verdict: stat.verdict }, rows, laneBrief: c.laneBrief(rep.lane), fixBriefs: fixes, priorRows: c.rows.filter(earlier), allFixHeads: c.fixHeads(rep.lane) });
		jobs.push({ rep, rows, fixes, prompt, key: `${rep.name}|${sha(prompt)}` });
	}
	return jobs;
}

// Judge calls are synchronous (spawnSync), one report at a time; results append to the cache.
function cmdLabel(pass, lanes) {
	const c = corpus();
	const file = out(`labels-${pass}.jsonl`);
	const have = new Set(readJsonl(file).map((x) => x.key));
	for (const j of labelJobs(c, pass)) {
		if ((lanes.length && !lanes.includes(j.rep.lane)) || have.has(j.key)) continue;
		const t0 = Date.now();
		const { out: o, cost } = callJudge({ model: MODELS[pass], system: GUIDE, prompt: j.prompt, schema: labelSchema });
		const labels = validateLabels(o, j.rows.map((r) => r.id), j.fixes.map((f) => f.text).join("\n"));
		const rec = { key: j.key, report: j.rep.name, model: MODELS[pass], cost, secs: Math.round((Date.now() - t0) / 1000), labels };
		fs.appendFileSync(file, JSON.stringify(rec) + "\n");
		console.log(`label ${pass} ${j.rep.name}: ${labels.length} rows · $${cost?.toFixed(3)} · ${rec.secs}s`);
	}
}

/** Labels for the CURRENT extraction only: records whose prompt hash matches today's prompt. */
function currentLabels(c, pass) {
	const keys = new Set(labelJobs(c, pass).map((j) => j.key));
	const m = new Map();
	for (const rec of readJsonl(out(`labels-${pass}.jsonl`))) if (keys.has(rec.key)) for (const l of rec.labels) m.set(l.id, l);
	return m;
}

function matchJobs(c, A) {
	const jobs = [];
	for (const lane of [...new Set(c.rows.map((r) => r.lane))]) {
		const poolRows = c.rows.filter((r) => r.lane === lane && r.kind !== "verification" && A.get(r.id)?.is_finding);
		// HINTS_AS_RUN: matches-a/b.jsonl were prompted with the legacy basename rule (sol r1 MED). The
		// cache key is the prompt hash, so switching the prompt to path-aware hints would orphan every
		// cached match and require re-matching spend. `build` measures the bias instead (false_hints).
		const hints = stageHints(poolRows, 5, sameBase);
		const prompt = `LANE ${lane}\n\n== ROWS (${poolRows.length}) ==\n${poolRows.map((r) => `${r.id} [${r.rung} ${r.kind} ${r.severity ?? "-"}] refs=${r.refs.map((x) => `${x.base}${x.from != null ? `:${x.from}-${x.to}` : ""}`).join(",") || "-"}\n  ${r.body.replace(/\s+/g, " ").slice(0, 600)}`).join("\n")}\n\n== STAGE HINTS (same file / line±5) ==\n${hints.map((h) => `${h.a} ~ ${h.b} (${h.stage})`).join("\n") || "none"}\n\nOutput same_as and covers for every row id.`;
		// the key hashes the system guide and schema too: a change to the relation definition re-runs the matcher
		jobs.push({ lane, poolRows, hints, prompt, key: `${lane}|${sha(MATCH_GUIDE + JSON.stringify(matchSchema) + prompt)}` });
	}
	return jobs;
}

function currentMatches(c, A, pass) {
	const keys = new Set(matchJobs(c, A).map((j) => j.key));
	return readJsonl(out(`matches-${pass}.jsonl`)).filter((m) => keys.has(m.key));
}

function cmdMatch(pass, lanes) {
	const c = corpus();
	const A = currentLabels(c, "a");
	if (c.rows.some((r) => !A.has(r.id))) throw new Error("match: some rows lack current pass-A labels; run `label a` first");
	const file = out(`matches-${pass}.jsonl`);
	const have = new Set(readJsonl(file).map((x) => x.key));
	for (const j of matchJobs(c, A)) {
		if ((lanes.length && !lanes.includes(j.lane)) || have.has(j.key) || !j.poolRows.length) continue;
		const t0 = Date.now();
		const { out: o, cost } = callJudge({ model: MODELS[pass], system: MATCH_GUIDE, prompt: j.prompt, schema: matchSchema });
		const got = new Set(o.matches.map((m) => m.id));
		const missing = j.poolRows.map((r) => r.id).filter((i) => !got.has(i));
		if (missing.length) throw new Error(`match: judge omitted ${missing.join(",")}`);
		matchGraph(o.matches, j.poolRows); // fail-closed: unknown ids, an id in both fields → throw before caching
		fs.appendFileSync(file, JSON.stringify({ key: j.key, lane: j.lane, model: MODELS[pass], cost, secs: Math.round((Date.now() - t0) / 1000), hints: j.hints, matches: o.matches }) + "\n");
		console.log(`match ${pass} ${j.lane}: ${j.poolRows.length} rows, ${j.hints.length} hints · $${cost?.toFixed(3)}`);
	}
}

function kappaBlock(c, A, B, sampleIds) {
	const axes = ["is_finding", "top", "sub", "disposition", "origin"];
	const res = {};
	for (const ax of axes) res[ax] = cohensKappa(sampleIds.map((i) => String(A.get(i)[ax])), sampleIds.map((i) => String(B.get(i)[ax])));
	const both = sampleIds.filter((i) => A.get(i).is_finding && B.get(i).is_finding);
	res.top_given_both_finding = both.length > 1 ? cohensKappa(both.map((i) => A.get(i).top), both.map((i) => B.get(i).top)) : null;
	res.pairs = sampleIds.map((i) => ({ id: i, a: axes.map((x) => String(A.get(i)[x])), b: axes.map((x) => String(B.get(i)[x])) }));
	return res;
}

function cmdBuild() {
	const c = corpus();
	const A = currentLabels(c, "a");
	const B = currentLabels(c, "b");
	const missing = c.rows.filter((r) => !A.has(r.id)).map((r) => r.id);
	if (missing.length) throw new Error(`build: ${missing.length} rows lack pass-A labels (${missing.slice(0, 5).join(", ")}…)`);
	const sampleIds = seededSample(c.rows.filter((r) => r.kind !== "verification").map((r) => r.id), 40, SEED);
	const missB = sampleIds.filter((i) => !B.has(i));
	if (missB.length) throw new Error(`build: κ sample lacks pass-B labels (${missB.join(", ")})`);
	const kappa = kappaBlock(c, A, B, sampleIds);
	fs.writeFileSync(out("kappa-pairs.json"), JSON.stringify({ axes: ["is_finding", "top", "sub", "disposition", "origin"], pairs: kappa.pairs }, null, 1) + "\n");
	const C = currentLabels(c, "c");
	const r3 = c.rows.filter((r) => r.rung === "sol-r3" && r.kind !== "verification" && C.has(r.id) && A.get(r.id).is_finding && C.get(r.id).is_finding);
	const r3k = r3.length > 1 ? cohensKappa(r3.map((r) => A.get(r.id).relation), r3.map((r) => C.get(r.id).relation)) : null;
	const spend = (f) => readJsonl(out(f)).reduce((s, x) => s + (x.cost ?? 0), 0);
	const cost = ["labels-a", "labels-b", "matches-a", "matches-b", "labels-c"].map((f) => spend(`${f}.jsonl`));
	const result = { kappa_gate: KAPPA_GATE, kappa: Object.fromEntries(Object.entries(kappa).filter(([k]) => k !== "pairs")), kappa_p2_relation_posthoc: r3k, judge_cost_usd: { label_a: cost[0], label_b: cost[1], match_a: cost[2], match_b: cost[3], label_c: cost[4], total_including_superseded: cost.reduce((a, b) => a + b, 0) } };
	const quoteStats = { claimed: 0, verified: 0 };
	for (const l of A.values()) if (l.disposition_raw || ["accepted", "overridden", "carried"].includes(l.disposition)) (quoteStats.claimed++, l.quote_verified && quoteStats.verified++);
	result.disposition_quotes = quoteStats;
	if (kappa.top.kappa < KAPPA_GATE) {
		result.published = false;
		result.reason = `κ(top-level class) = ${kappa.top.kappa.toFixed(3)} < ${KAPPA_GATE}: labels unreliable, table withheld`;
		fs.writeFileSync(out("results.json"), JSON.stringify(result, null, 1) + "\n");
		console.log(result.reason);
		return;
	}
	const mA = currentMatches(c, A, "a");
	const poolAll = c.rows.filter((r) => r.kind !== "verification" && A.get(r.id)?.is_finding);
	const gA = matchGraph(mA.flatMap((m) => m.matches), poolAll);
	const { L, findings } = buildLedger(c.rows, A, gA);
	const { groups_ge3: groupsA, ...sizesA } = componentSizes(gA.eq);
	result.match_graph = { a: { ...gA.stats, ...sizesA, components_ge3: groupsA.map((g) => g.join(" ")) } };
	for (const r of L) r.match_confidence = matchConfidence(r);
	// the matcher's stage for each cross-rung match (file / line / semantic-only)
	// Stage accounting uses PATH-AWARE hints. The judge was shown basename hints; a "false hint" is a
	// shown pair whose path-aware stage differs (no same-path ref at all, or line → file).
	const lanes = [...new Set(poolAll.map((r) => r.lane))];
	const pathHints = lanes.flatMap((l) => stageHints(poolAll.filter((r) => r.lane === l)));
	const shown = mA.flatMap((m) => m.hints);
	const pk = (h) => `${h.a}|${h.b}`;
	const hintStage = new Map(pathHints.flatMap((h) => [[`${h.a}|${h.b}`, h.stage], [`${h.b}|${h.a}`, h.stage]]));
	const stages = { same_as: { line: 0, file: 0, semantic_only: 0 }, covers: { line: 0, file: 0, semantic_only: 0 } };
	for (const [id, s] of gA.eq) for (const o of s) if (id < o && id.split("#")[0] !== o.split("#")[0]) stages.same_as[hintStage.get(`${id}|${o}`) ?? "semantic_only"]++;
	for (const [id, s] of gA.cov) for (const o of s) if (id.split("#")[0] !== o.split("#")[0]) stages.covers[hintStage.get(`${id}|${o}`) ?? "semantic_only"]++;
	result.match_pairs_by_stage = stages;
	const falseHints = shown.filter((h) => hintStage.get(pk(h)) !== h.stage);
	const edge = (g, h) => g.eq.get(h.a)?.has(h.b) || g.cov.get(h.a)?.has(h.b) || g.cov.get(h.b)?.has(h.a) || false;
	result.false_hints_shown_to_judge = { shown: shown.length, false: falseHints.length, false_and_matched_by_a: falseHints.filter((h) => edge(gA, h)).length, ids: falseHints.map((h) => `${pk(h)} (${h.stage}→${hintStage.get(pk(h)) ?? "none"})`) };
	result.published = true;
	result.table = table(findings);
	result.claims = claims(L, findings, c.stats);
	// P1 is matcher-dependent (sol r1 HIGH): report it under matcher A, matcher B and their intersection
	// (a row counts only if it is sol-unmatched under BOTH component graphs). None of these is a finding
	// on its own; see RESULTS.md.
	const mB = currentMatches(c, A, "b");
	if (mB.length) {
		const gB = matchGraph(mB.flatMap((m) => m.matches), poolAll);
		const LB = buildLedger(c.rows, A, gB);
		const { groups_ge3: groupsB, ...sizesB } = componentSizes(gB.eq);
		result.match_graph.b = { ...gB.stats, ...sizesB, components_ge3: groupsB.map((g) => g.join(" ")) };
		const PB = claims(LB.L, LB.findings, c.stats).P1;
		const PA = result.claims.P1;
		const bIds = new Set(PB.unique_accepted_rows.map((r) => r.id));
		const both = PA.unique_accepted_rows.filter((r) => bIds.has(r.id));
		const funcLanes = [...new Set(both.filter((r) => r.top === "functional").map((r) => r.id.split("/")[0]))].sort();
		const o5 = ["l1", "l2", "l3", "t2a", "t2b"];
		const summ = (P) => ({ functional_lanes: P.functional_lanes, answer_6: P.answer_6, answer_original5: P.answer_original5, n_rows: P.unique_accepted_rows.length, n_functional: P.unique_accepted_rows.filter((r) => r.top === "functional").length });
		const intersection = { functional_lanes: funcLanes, answer_6: funcLanes.length >= 2 ? "YES" : "NO", answer_original5: funcLanes.filter((l) => o5.includes(l)).length >= 2 ? "YES" : "NO", n_rows: both.length, n_functional: both.filter((r) => r.top === "functional").length, rows: both.map((r) => r.id) };
		const a = summ(PA), b = summ(PB);
		const agree = (k) => a[k] === b[k] && b[k] === intersection[k];
		result.p1_by_matcher = { a, b: { ...b, rows: PB.unique_accepted_rows.map((r) => r.id) }, intersection, resolved_6: agree("answer_6"), resolved_original5: agree("answer_original5") };
	}
	// pre-registered match_confidence (structural, from the stored quote; no model call)
	const conf = { explicit: 0, semantic: 0 };
	for (const r of findings) if (r.disposition === "accepted") conf[r.match_confidence]++;
	result.accepted_match_confidence = conf;
	result.p1_match_confidence = Object.fromEntries(result.claims.P1.unique_accepted_rows.map((r) => [r.id, L.find((x) => x.id === r.id).match_confidence]));
	fs.writeFileSync(out("results.json"), JSON.stringify(result, null, 1) + "\n");
	writeJsonl(out("ledger.jsonl"), L.map(({ body, refs, _key, ...r }) => r));
	const md = ["| model | round | class | found | of which CARRY rows | accepted | unique-accepted |", "|---|---|---|---|---|---|---|", ...result.table.map((t) => `| ${t.model} | ${t.round} | ${t.cls} | ${t.found} | ${t.carry} | ${t.accepted} | ${t.unique_accepted} |`)].join("\n");
	fs.writeFileSync(out("table.md"), md + "\n");
	console.log(md);
	console.log(JSON.stringify({ kappa: result.kappa, cost: result.judge_cost_usd, stages, quotes: quoteStats }, null, 1));
	console.log(JSON.stringify(result.claims, null, 1));
}

const main = async () => {
	const [cmd, ...rest] = process.argv.slice(2);
	if (cmd === "extract") return cmdExtract();
	if (cmd === "label" && ["a", "b", "c"].includes(rest[0])) return cmdLabel(rest[0], rest.slice(1));
	if (cmd === "match" && ["a", "b"].includes(rest[0])) return cmdMatch(rest[0], rest.slice(1));
	if (cmd === "build") return cmdBuild();
	console.error("usage: catch-ledger.mjs extract | label a|b [lane..] | match a|b [lane..] | build");
	process.exit(2);
};
main().catch((e) => {
	console.error(`catch-ledger: ${e.message}`);
	process.exit(1);
});
