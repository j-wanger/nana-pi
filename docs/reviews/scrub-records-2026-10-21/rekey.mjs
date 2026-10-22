#!/usr/bin/env node
/**
 * @module docs/reviews/scrub-records-2026-10-21/rekey.mjs
 * @purpose Re-key current study cache records from the base corpus to its scrubbed counterpart exactly once.
 * @inputs --root, --base, optional --dry-run, the base and scrubbed review corpora, and study JSONL caches
 * @outputs rewritten current cache records, or per-cache pairing counts in dry-run mode
 * @effects process and disk reads; disk writes outside dry-run mode
 * @errors corpus pairing, key collisions, missing current records, malformed cache data, or process failures exit nonzero
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { extractCorpus } from "../../../apps/bench/lib/catch-extract.mjs";
import { labelPrompt, labelSchema, MATCH_GUIDE, matchSchema, sha } from "../../../apps/bench/lib/catch-judge.mjs";
import { sameBase, seededSample, stageHints } from "../../../apps/bench/lib/catch-stats.mjs";
import { applyTable, recoverWords } from "./scrub.mjs";

const SEED = "e1-2026-09-28";
const LANE_BRIEF = { u: "pi-upgrade-brief.md" };
const CACHE_NAMES = ["labels-a.jsonl", "labels-b.jsonl", "labels-c.jsonl", "matches-a.jsonl", "matches-b.jsonl"];
const readJsonl = (file) => fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));

function parseArgs(argv) {
	let root = ".";
	let base = "HEAD";
	let dryRun = false;
	for (let index = 0; index < argv.length; index++) {
		if (argv[index] === "--root" && argv[index + 1]) root = argv[++index];
		else if (argv[index] === "--base" && argv[index + 1]) base = argv[++index];
		else if (argv[index] === "--dry-run") dryRun = true;
		else throw new Error("usage: rekey.mjs [--root <dir>] [--base <rev>] [--dry-run]");
	}
	return { root: path.resolve(root), base, dryRun };
}

function corpus(reviews) {
	const value = extractCorpus(reviews);
	const dirOf = (lane) => value.reports.find((report) => report.lane === lane).file.split("/")[0];
	const read = (lane, file) => fs.readFileSync(path.join(reviews, dirOf(lane), file), "utf8");
	value.laneBrief = (lane) => read(lane, LANE_BRIEF[lane] ?? `${lane}-brief.md`);
	value.fixText = (file) => fs.readFileSync(path.join(reviews, file), "utf8");
	value.fixHeads = (lane) => value.fixBriefs.filter((file) => file.lane === lane)
		.map((file) => `${file.file.split("/")[1]}: ${value.fixText(file.file).split("\n")[0]}`).join("\n");
	return value;
}

function labelJobs(value, pass) {
	const sample = new Set(seededSample(value.rows.filter((row) => row.kind !== "verification").map((row) => row.id), 40, SEED));
	const jobs = [];
	for (const report of value.reports) {
		const stat = value.stats.find((item) => item.report === report.name);
		const pick = { a: () => true, b: (row) => sample.has(row.id), c: (row) => row.rung === "sol-r3" && row.kind !== "verification" }[pass];
		const rows = value.rows.filter((row) => row.report === report.name && pick(row));
		if (!rows.length) continue;
		const fixes = (stat.answered_by || []).map((file) => ({ file: file.split("/")[1], text: value.fixText(file) }));
		const earlier = (row) => row.lane === report.lane && row.kind !== "verification" &&
			(row.reviewer_model === report.model ? row.round < report.round : report.model === "astra");
		const prompt = labelPrompt({ report: { ...report, verdict: stat.verdict }, rows, laneBrief: value.laneBrief(report.lane),
			fixBriefs: fixes, priorRows: value.rows.filter(earlier), allFixHeads: value.fixHeads(report.lane) });
		jobs.push({ name: report.name, key: `${report.name}|${sha(prompt)}` });
	}
	return jobs;
}

function currentLabels(value, pass, records) {
	const keys = new Set(labelJobs(value, pass).map((job) => job.key));
	const labels = new Map();
	for (const record of records) if (keys.has(record.key)) for (const label of record.labels) labels.set(label.id, label);
	return labels;
}

function matchJobs(value, labels) {
	const jobs = [];
	for (const lane of [...new Set(value.rows.map((row) => row.lane))]) {
		const poolRows = value.rows.filter((row) => row.lane === lane && row.kind !== "verification" && labels.get(row.id)?.is_finding);
		const hints = stageHints(poolRows, 5, sameBase);
		const prompt = `LANE ${lane}\n\n== ROWS (${poolRows.length}) ==\n${poolRows.map((row) => `${row.id} [${row.rung} ${row.kind} ${row.severity ?? "-"}] refs=${row.refs.map((ref) => `${ref.base}${ref.from != null ? `:${ref.from}-${ref.to}` : ""}`).join(",") || "-"}\n  ${row.body.replace(/\s+/g, " ").slice(0, 600)}`).join("\n")}\n\n== STAGE HINTS (same file / line±5) ==\n${hints.map((hint) => `${hint.a} ~ ${hint.b} (${hint.stage})`).join("\n") || "none"}\n\nOutput same_as and covers for every row id.`;
		jobs.push({ lane, key: `${lane}|${sha(MATCH_GUIDE + JSON.stringify(matchSchema) + prompt)}` });
	}
	return jobs;
}

function pairBy(oldJobs, newJobs, field, label) {
	const oldBy = new Map(oldJobs.map((job) => [job[field], job]));
	const newBy = new Map(newJobs.map((job) => [job[field], job]));
	if (oldBy.size !== oldJobs.length || newBy.size !== newJobs.length || oldBy.size !== newBy.size) {
		throw new Error(`${label} pairing is not one to one`);
	}
	const pairs = new Map();
	const newKeys = new Set();
	for (const [name, oldJob] of oldBy) {
		const newJob = newBy.get(name);
		if (!newJob) throw new Error(`${label} pairing is incomplete`);
		if (pairs.has(oldJob.key) || newKeys.has(newJob.key)) throw new Error(`${label} key collision`);
		pairs.set(oldJob.key, newJob.key);
		newKeys.add(newJob.key);
	}
	return pairs;
}

function baseReviews(root, base) {
	const temp = fs.mkdtempSync(path.join(os.tmpdir(), "catch-base-"));
	const archive = execFileSync("git", ["-C", root, "archive", "--format=tar", base, "docs/reviews"], { maxBuffer: Infinity });
	execFileSync("tar", ["-xf", "-", "-C", temp], { input: archive, maxBuffer: Infinity });
	return { temp, reviews: path.join(temp, "docs/reviews") };
}

function transformedRecords(file, relative, words) {
	return readJsonl(file).map((record) => JSON.parse(applyTable({ relative, content: JSON.stringify(record), words })));
}

export function runRekey({ root, base, dryRun }) {
	const study = path.join(root, "apps/bench/studies/catch-ledger-2026-09-28");
	const config = JSON.parse(fs.readFileSync(path.join(root, "identity-scan.config.json"), "utf8"));
	const recordPaths = config.allowlist.filter((entry) => entry.reason === "record").map((entry) => entry.path);
	const materialized = baseReviews(root, base);
	try {
		const words = recoverWords(materialized.temp, recordPaths, config);
		const oldCorpus = corpus(materialized.reviews);
		const newCorpus = corpus(path.join(root, "docs/reviews"));
		const rewritten = new Map();
		for (const pass of ["a", "b", "c"]) {
			const name = `labels-${pass}.jsonl`;
			const file = path.join(study, name);
			const records = transformedRecords(file, `apps/bench/studies/catch-ledger-2026-09-28/${name}`, words);
			const pairs = pairBy(labelJobs(oldCorpus, pass), labelJobs(newCorpus, pass), "name", name);
			let paired = 0;
			for (const record of records) if (pairs.has(record.key)) {
				paired++;
				record.key = pairs.get(record.key);
			}
			rewritten.set(name, records);
			console.log(`cache=${name} pairs=${paired} paths=${name}`);
		}
		const oldA = currentLabels(oldCorpus, "a", readJsonl(path.join(study, "labels-a.jsonl")));
		const newA = currentLabels(newCorpus, "a", rewritten.get("labels-a.jsonl"));
		for (const pass of ["a", "b"]) {
			const name = `matches-${pass}.jsonl`;
			const file = path.join(study, name);
			const records = transformedRecords(file, `apps/bench/studies/catch-ledger-2026-09-28/${name}`, words);
			const pairs = pairBy(matchJobs(oldCorpus, oldA), matchJobs(newCorpus, newA), "lane", name);
			let paired = 0;
			for (const record of records) if (pairs.has(record.key)) {
				paired++;
				record.key = pairs.get(record.key);
			}
			rewritten.set(name, records);
			console.log(`cache=${name} pairs=${paired} paths=${name}`);
		}
		if (!dryRun) for (const name of CACHE_NAMES) {
			const rows = rewritten.get(name);
			fs.writeFileSync(path.join(study, name), `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
		}
		console.log(`summary caches=${CACHE_NAMES.length} write=${dryRun ? 0 : CACHE_NAMES.length} paths=${CACHE_NAMES.join(",")}`);
	} finally {
		fs.rmSync(materialized.temp, { recursive: true, force: true });
	}
}

if (process.argv[1] && fs.realpathSync(fileURLToPath(import.meta.url)) === fs.realpathSync(path.resolve(process.argv[1]))) {
	try { runRekey(parseArgs(process.argv.slice(2))); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
