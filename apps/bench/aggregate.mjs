#!/usr/bin/env node
// Aggregate a study's results.jsonl into summary.json + summary.md.
//   node apps/bench/aggregate.mjs <study-dir>
// Pure arithmetic on the recorded runs — no model calls, no judging, no re-running.
//
// Three things this file refuses to do, because each one would flatter a profile:
//   * count a GRADER failure as a model failure (they leave the success denominator entirely);
//   * pool profiles across different workloads (A runs code only, so a pooled row would compare
//     A's navigation tasks against C's web tasks) — everything is per family, shared tasks only;
//   * hide an extension's nested LLM spend (`tokensAll` = own + nested; unknown is flagged, not 0).

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const q = (sorted, p) => {
	if (!sorted.length) return null;
	const i = (sorted.length - 1) * p;
	const lo = Math.floor(i);
	const hi = Math.ceil(i);
	return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
};
// 2 decimals: the decision rule compares medians against a 1.15x threshold, and rounding a
// ratio to one decimal can move a borderline verdict.
const round = (x) => (x == null ? null : Math.round(x * 100) / 100);

export function stats(values) {
	const v = values.filter((x) => typeof x === "number" && Number.isFinite(x)).sort((a, b) => a - b);
	if (!v.length) return { n: 0, mean: null, median: null, p25: null, p75: null, iqr: null, min: null, max: null };
	const mean = v.reduce((a, b) => a + b, 0) / v.length;
	const p25 = q(v, 0.25);
	const p75 = q(v, 0.75);
	return { n: v.length, mean: round(mean), median: round(q(v, 0.5)), p25: round(p25), p75: round(p75), iqr: round(p75 - p25), min: v[0], max: v[v.length - 1] };
}

const tot = (t) => (t ? (t.in || 0) + (t.out || 0) + (t.cacheRead || 0) + (t.cacheWrite || 0) : 0);
/** Own spend plus the nested spend an extension made on the run's behalf. */
export const spendOf = (r) => (r.totalTokens ?? tot(r.tokens)) + tot(r.nestedTokens);
const decided = (r) => r.state === "ok" || r.state === "fail" || (r.state === undefined && typeof r.ok === "boolean");
const succeeded = (r) => r.state === "ok" || (r.state === undefined && r.ok === true);

export function aggregate(records, schedule = null) {
	const cells = new Map();
	const seen = new Map();
	const duplicates = [];
	for (const r of records) {
		const k = `${r.task}|${r.profile}`;
		const tk = `${k}|${r.rep}`;
		seen.set(tk, (seen.get(tk) ?? 0) + 1);
		if (seen.get(tk) === 2) duplicates.push(tk);
		if (!cells.has(k)) cells.set(k, { task: r.task, family: r.family ?? null, profile: r.profile, runs: [] });
		cells.get(k).runs.push(r);
	}
	const out = [];
	for (const c of cells.values()) {
		const dec = c.runs.filter(decided);
		const okRuns = c.runs.filter(succeeded);
		const toolCalls = {};
		for (const r of c.runs) for (const [name, n] of Object.entries(r.toolCalls ?? {})) toolCalls[name] = (toolCalls[name] ?? 0) + n;
		const states = {};
		for (const r of c.runs) states[r.state ?? (r.ok ? "ok" : "fail")] = (states[r.state ?? (r.ok ? "ok" : "fail")] ?? 0) + 1;
		out.push({
			task: c.task,
			family: c.family,
			profile: c.profile,
			n: c.runs.length,
			decided: dec.length, // grader/run/blocked failures are NOT in the denominator
			successes: okRuns.length,
			successRate: dec.length ? okRuns.length / dec.length : null,
			states,
			spend: stats(dec.map(spendOf)),
			spendOnSuccess: stats(okRuns.map(spendOf)),
			ownTokens: stats(dec.map((r) => r.totalTokens ?? tot(r.tokens))),
			nestedTokens: stats(dec.map((r) => tot(r.nestedTokens))),
			nestedUnknown: c.runs.filter((r) => r.nestedUnknown).length,
			spendPerSuccess: okRuns.length ? Math.round(dec.reduce((a, r) => a + spendOf(r), 0) / okRuns.length) : null,
			wallMs: stats(dec.map((r) => r.wallMs)),
			turns: stats(dec.map((r) => r.turns)),
			retries: c.runs.reduce((a, r) => a + (r.retries ?? 0), 0),
			cache: { cold: c.runs.filter((r) => r.cacheBucket === "cold").length, warm: c.runs.filter((r) => r.cacheBucket === "warm").length },
			cacheReadMedian: stats(dec.map((r) => r.tokens?.cacheRead ?? 0)).median,
			toolCalls,
		});
	}
	out.sort((a, b) => String(a.family).localeCompare(String(b.family)) || a.task.localeCompare(b.task) || a.profile.localeCompare(b.profile));

	// Per family, restricted to tasks EVERY compared profile actually ran.
	const families = [...new Set(out.map((c) => c.family))];
	const byFamily = families.map((family) => {
		const fam = out.filter((c) => c.family === family);
		const profiles = [...new Set(fam.map((c) => c.profile))].sort();
		const tasks = [...new Set(fam.map((c) => c.task))].sort();
		const shared = tasks.filter((t) => profiles.every((p) => fam.some((c) => c.task === t && c.profile === p)));
		const rows = profiles.map((p) => {
			const mine = fam.filter((c) => c.profile === p && shared.includes(c.task));
			const toolCalls = {};
			for (const c of mine) for (const [k, v] of Object.entries(c.toolCalls)) toolCalls[k] = (toolCalls[k] ?? 0) + v;
			return {
				profile: p,
				sharedTasks: shared.length,
				decided: mine.reduce((a, c) => a + c.decided, 0),
				successes: mine.reduce((a, c) => a + c.successes, 0),
				// Per-task success counts out of N — the denominator the decision rule uses.
				perTaskSuccess: Object.fromEntries(mine.map((c) => [c.task, `${c.successes}/${c.decided}`])),
				// Median of per-task medians: one number per task, so eight cheap navigation
				// tasks cannot outvote two expensive edits by sheer run count.
				medianOfTaskMedians: stats(mine.map((c) => c.spend.median)).median,
				// Total spend guard: the sum of per-task medians. A profile that is cheap on
				// six tasks and ruinous on two shows up HERE even when the median looks fine.
				totalOfTaskMedians: Math.round(mine.reduce((a, c) => a + (c.spend.median ?? 0), 0)),
				nestedUnknown: mine.reduce((a, c) => a + c.nestedUnknown, 0),
				retries: mine.reduce((a, c) => a + c.retries, 0),
				wallMedian: stats(mine.map((c) => c.wallMs.median)).median,
				cache: { cold: mine.reduce((a, c) => a + c.cache.cold, 0), warm: mine.reduce((a, c) => a + c.cache.warm, 0) },
				toolCalls,
			};
		});
		return { family, profiles, tasks, shared, excluded: tasks.filter((t) => !shared.includes(t)), rows };
	});

	// Integrity: what the schedule promised versus what is on disk.
	let missing = [];
	if (schedule?.runs) {
		const have = new Set(records.map((r) => `${r.task}|${r.profile}|${r.rep}`));
		missing = schedule.runs.map((r) => `${r.task}|${r.profile}|${r.rep}`).filter((k) => !have.has(k));
	}
	return { cells: out, byFamily, integrity: { duplicates, missing, records: records.length } };
}

const pct = (x) => (x == null ? "—" : `${Math.round(x * 100)}%`);
const mix = (t) => Object.entries(t).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(" ") || "—";
const secs = (ms) => (ms == null ? "—" : round(ms / 1000));

export function toMarkdown(study, agg, records) {
	const { cells, byFamily, integrity } = agg;
	const L = [];
	L.push(`# ${study.id ?? "study"} — summary`, "", `Runs recorded: **${records.length}**. Generated ${new Date().toISOString()}.`, "");
	L.push(
		"**Success** = the deterministic checker passed AND pi exited 0 AND the stream reached `agent_settled` with no dangling tool calls.",
		"**Denominator** = decided runs only: grader errors, harness errors and blocked runs are reported but never counted as model failures.",
		"**Spend** = the run's own tokens PLUS any nested LLM tokens an extension reported. No run was ever retried.",
		"",
	);

	if (integrity.duplicates.length || integrity.missing.length) {
		L.push("## ⚠ Integrity", "");
		if (integrity.duplicates.length) L.push(`- **${integrity.duplicates.length} duplicate tuple(s)**: ${integrity.duplicates.slice(0, 8).join(", ")}`);
		if (integrity.missing.length) L.push(`- **${integrity.missing.length} scheduled tuple(s) missing** (study incomplete): ${integrity.missing.slice(0, 8).join(", ")}${integrity.missing.length > 8 ? " …" : ""}`);
		L.push("");
	}

	for (const f of byFamily) {
		L.push(`## Family \`${f.family}\` — ${f.shared.length} shared task(s)`, "");
		if (f.excluded.length) L.push(`Excluded from the comparison (not run by every profile): ${f.excluded.join(", ")}`, "");
		L.push("| profile | success | median of task medians | total of task medians | wall median (s) | cold/warm | retries | nested unknown | tool mix |", "|---|---:|---:|---:|---:|---:|---:|---:|---|");
		for (const r of f.rows) {
			L.push(`| ${r.profile} | ${r.successes}/${r.decided} (${pct(r.decided ? r.successes / r.decided : null)}) | ${r.medianOfTaskMedians ?? "—"} | ${r.totalOfTaskMedians} | ${secs(r.wallMedian)} | ${r.cache.cold}/${r.cache.warm} | ${r.retries} | ${r.nestedUnknown} | ${mix(r.toolCalls)} |`);
		}
		L.push("", "Per-task successes (the decision rule reads these):", "");
		const tasks = f.shared;
		L.push(`| profile | ${tasks.join(" | ")} |`, `|---|${tasks.map(() => "---:").join("|")}|`);
		for (const r of f.rows) L.push(`| ${r.profile} | ${tasks.map((t) => r.perTaskSuccess[t] ?? "—").join(" | ")} |`);
		L.push("");
	}

	L.push("## Per task × profile", "", "| family | task | profile | n | states | success | spend median | IQR | spend/success | own | nested | wall (s) | turns | cacheRead med | tool mix |", "|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|");
	for (const c of cells) {
		L.push(
			`| ${c.family} | ${c.task} | ${c.profile} | ${c.n} | ${mix(c.states)} | ${c.successes}/${c.decided} | ${c.spend.median ?? "—"} | ${c.spend.iqr ?? "—"} | ${c.spendPerSuccess ?? "—"} | ` +
				`${c.ownTokens.median ?? "—"} | ${c.nestedTokens.median ?? "—"}${c.nestedUnknown ? " ⚠?" : ""} | ${secs(c.wallMs.median)} | ${c.turns.median ?? "—"} | ${c.cacheReadMedian ?? "—"} | ${mix(c.toolCalls)} |`,
		);
	}

	const base = study.baselineProfile;
	for (const f of byFamily) {
		const others = f.profiles.filter((p) => p !== base);
		if (!f.profiles.includes(base) || !others.length) continue;
		L.push("", `## \`${f.family}\`: ratio to baseline \`${base}\` (median spend; Δ successes)`, "", `| task | ${others.join(" | ")} |`, `|---|${others.map(() => "---:").join("|")}|`);
		for (const t of f.shared) {
			const b = cells.find((c) => c.task === t && c.profile === base);
			if (!b?.spend.median) continue;
			L.push(`| ${t} | ${others.map((p) => {
				const c = cells.find((x) => x.task === t && x.profile === p);
				return c ? `${round(c.spend.median / b.spend.median)}× (${c.successes - b.successes >= 0 ? "+" : ""}${c.successes - b.successes})` : "—";
			}).join(" | ")} |`);
		}
	}
	L.push("", "Apply the decision rule in `DESIGN.md` to these numbers; this file computes them and stops there.", "");
	return L.join("\n");
}

async function main() {
	const studyDir = path.resolve(process.argv[2] ?? ".");
	const study = JSON.parse(await fs.readFile(path.join(studyDir, "study.json"), "utf8"));
	const schedule = await fs.readFile(path.join(studyDir, "schedule.json"), "utf8").then(JSON.parse).catch(() => null);
	const raw = await fs.readFile(path.join(studyDir, "results.jsonl"), "utf8").catch(() => "");
	const records = raw.split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
	if (!records.length) throw new Error(`no runs in ${path.join(studyDir, "results.jsonl")}`);
	const agg = aggregate(records, schedule);
	await fs.writeFile(path.join(studyDir, "summary.json"), `${JSON.stringify({ study: study.id, runs: records.length, fingerprint: records[0]?.fingerprint ?? null, ...agg }, null, 2)}\n`);
	await fs.writeFile(path.join(studyDir, "summary.md"), `${toMarkdown(study, agg, records)}\n`);
	console.log(`wrote summary.md + summary.json for ${records.length} runs`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
	main().catch((e) => { console.error(e.message); process.exit(1); });
}
