#!/usr/bin/env node
/**
 * @module docs/reviews/scrub-records-2026-10-21/proof.mjs
 * @purpose Prove a completed record scrub against an explicit repository revision without exposing removed text.
 * @inputs --base, optional --root, the base record allowlist, the scrub table, optional paraphrase.tsv, and study digests
 * @outputs named check counts and repository-relative paths only
 * @effects process and disk reads; temporary extraction and parser artifacts outside the repository
 * @errors invalid arguments or any failed proof check exits nonzero
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { countIdentityWords } from "../../../scripts/identity-scan.mjs";
import { applyTable, recoverWords } from "./scrub.mjs";

const STUDY_PREFIX = "apps/bench/studies/catch-ledger-2026-09-28/";
const GENERATED_STUDY = new Set(["rows.jsonl", "skipped.jsonl", "reports.json", "kappa-pairs.json", "results.json", "table.md", "ledger.jsonl"]);
const splitLines = (text) => text.split(/\r\n|\n|\r/);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function parseArgs(argv) {
	let root = ".";
	let base = null;
	for (let index = 0; index < argv.length; index++) {
		if (argv[index] === "--root" && argv[index + 1]) root = argv[++index];
		else if (argv[index] === "--base" && argv[index + 1]) base = argv[++index];
		else throw new Error("usage: proof.mjs --base <rev> [--root <dir>]");
	}
	if (!base) throw new Error("usage: proof.mjs --base <rev> [--root <dir>]");
	return { root: path.resolve(root), base };
}

function materialize(root, base) {
	const temp = fs.mkdtempSync(path.join(os.tmpdir(), "scrub-proof-base-"));
	const archive = execFileSync("git", ["-C", root, "archive", "--format=tar", base], { maxBuffer: Infinity });
	execFileSync("tar", ["-xf", "-", "-C", temp], { input: archive, maxBuffer: Infinity });
	return temp;
}

function paraphrases(root) {
	const file = path.join(root, "docs/reviews/scrub-records-2026-10-21/paraphrase.tsv");
	const listed = new Set();
	if (!fs.existsSync(file)) return listed;
	for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean)) {
		const [relative, number, code, ...extra] = line.split("\t");
		if (!relative || !/^\d+$/.test(number) || !code || extra.length) throw new Error("invalid paraphrase.tsv row");
		listed.add(`${relative}:${number}`);
	}
	return listed;
}

function preservedTokens(text) {
	const values = [];
	for (const pattern of [/\b\d+(?:\.\d+)*\b/g, /`[^`]*`/g, /https?:\/\/\S+/g, /(?:^|\s)(?:\.?\.?[/\\]|[A-Za-z]:\\)\S+/g]) {
		for (const match of text.match(pattern) ?? []) values.push(match.trim());
	}
	return values.sort();
}

function cacheEquivalent(relative, expected, actual) {
	if (!relative.startsWith(STUDY_PREFIX) || !/^(?:labels|matches)-[abc]\.jsonl$/.test(path.basename(relative))) return false;
	try {
		const left = JSON.parse(expected);
		const right = JSON.parse(actual);
		if (typeof left.key !== "string" || typeof right.key !== "string") return false;
		right.key = left.key;
		return JSON.stringify(right) === JSON.stringify(left);
	} catch { return false; }
}

function parsesJson(relative, text) {
	try {
		if (relative.endsWith(".json")) JSON.parse(text);
		else for (const line of text.split(/\r?\n/).filter(Boolean)) JSON.parse(line);
		return true;
	} catch { return false; }
}

function scriptCommand(relative, target, cache) {
	if (/\.(?:mjs|js)$/.test(relative)) return { command: process.execPath, args: ["--check", target], env: process.env };
	if (relative.endsWith(".py")) return { command: "python3", args: ["-m", "py_compile", target], env: { ...process.env, PYTHONPYCACHEPREFIX: cache } };
	if (relative.endsWith(".sh")) return { command: "bash", args: ["-n", target], env: process.env };
	return null;
}

function badSpacedTokens(line) {
	let count = 0;
	for (const phrase of ["the owner", "the work project"]) {
		let from = 0;
		while (true) {
			const index = line.indexOf(phrase, from);
			if (index === -1) break;
			const left = line.slice(0, index).match(/\S*$/)?.[0] ?? "";
			const right = line.slice(index + phrase.length).match(/^\S*/)?.[0] ?? "";
			if (/[\/\\@=(]/.test(left + right)) count++;
			from = index + phrase.length;
		}
	}
	return count;
}

function outputDigests(root) {
	const study = path.join(root, STUDY_PREFIX);
	const manifest = new Map(fs.readFileSync(path.join(study, "OUTPUTS.sha256"), "utf8").trim().split("\n").map((line) => {
		const [hash, name] = line.trim().split(/\s+/, 2);
		return [name, hash];
	}));
	return [...manifest].filter(([name, expected]) => sha256(fs.readFileSync(path.join(study, name))) !== expected).map(([name]) => `${STUDY_PREFIX}${name}`);
}

export function runProof({ root, base }) {
	const baseRoot = materialize(root, base);
	const checks = new Map([
		["line-count", []], ["table", []], ["identity", []], ["base-record", []], ["script-parse", []],
		["data-parse", []], ["spaced-token", []], ["preserved-token", []], ["study-digest", []],
	]);
	let changedFiles = 0;
	let changedLines = 0;
	let generatedLines = 0;
	try {
		const config = JSON.parse(fs.readFileSync(path.join(baseRoot, "identity-scan.config.json"), "utf8"));
		const records = config.allowlist.filter((entry) => entry.reason === "record").map((entry) => entry.path);
		const words = recoverWords(baseRoot, records, config);
		const listed = paraphrases(root);
		const seenParaphrases = new Set();
		const parserCache = fs.mkdtempSync(path.join(os.tmpdir(), "scrub-proof-cache-"));
		try {
			for (const relative of records) {
				const baseFile = path.join(baseRoot, ...relative.split("/"));
				const currentFile = path.join(root, ...relative.split("/"));
				if (!fs.existsSync(currentFile)) { checks.get("base-record").push(relative); continue; }
				const before = fs.readFileSync(baseFile, "utf8");
				const after = fs.readFileSync(currentFile, "utf8");
				const counts = countIdentityWords({ path: relative, content: after, config });
				if (counts.some(Boolean)) checks.get("identity").push(relative);
				if (counts.some(Boolean)) checks.get("base-record").push(relative);
				if (before === after) continue;
				changedFiles++;
				const oldLines = splitLines(before);
				const newLines = splitLines(after);
				const expectedLines = splitLines(applyTable({ relative, content: before, words }));
				if (oldLines.length !== newLines.length) checks.get("line-count").push(relative);
				const generated = relative.startsWith(STUDY_PREFIX) && GENERATED_STUDY.has(path.basename(relative));
				for (let index = 0; index < Math.max(oldLines.length, newLines.length); index++) {
					if (oldLines[index] === newLines[index]) continue;
					changedLines++;
					const key = `${relative}:${index + 1}`;
					if (listed.has(key)) {
						seenParaphrases.add(key);
						if (JSON.stringify(preservedTokens(expectedLines[index] ?? "")) !== JSON.stringify(preservedTokens(newLines[index] ?? ""))) checks.get("preserved-token").push(key);
					} else if (newLines[index] !== expectedLines[index] && !cacheEquivalent(relative, expectedLines[index] ?? "", newLines[index] ?? "")) {
						if (generated) generatedLines++;
						else checks.get("table").push(key);
					}
					if (badSpacedTokens(newLines[index] ?? "") > badSpacedTokens(oldLines[index] ?? "")) checks.get("spaced-token").push(key);
				}
				if (/\.(?:json|jsonl)$/.test(relative) && parsesJson(relative, before) && !parsesJson(relative, after)) checks.get("data-parse").push(relative);
				const command = scriptCommand(relative, baseFile, parserCache);
				if (command) {
					const baseResult = spawnSync(command.command, command.args, { env: command.env, encoding: "utf8" });
					if (baseResult.status === 0) {
						const currentCommand = scriptCommand(relative, currentFile, parserCache);
						const currentResult = spawnSync(currentCommand.command, currentCommand.args, { env: currentCommand.env, encoding: "utf8" });
						if (currentResult.status !== 0) checks.get("script-parse").push(relative);
					}
				}
			}
			for (const key of listed) if (!seenParaphrases.has(key)) checks.get("preserved-token").push(key.split(":").slice(0, -1).join(":"));
		} finally { fs.rmSync(parserCache, { recursive: true, force: true }); }
		checks.set("study-digest", outputDigests(root));
		for (const [name, paths] of checks) console.log(`check=${name} count=${paths.length} paths=${[...new Set(paths)].sort().join(",")}`);
		console.log(`summary files=${records.length} changed=${changedFiles} lines=${changedLines} generated=${generatedLines} failures=${[...checks.values()].reduce((sum, paths) => sum + paths.length, 0)}`);
		if ([...checks.values()].some((paths) => paths.length)) process.exitCode = 1;
	} finally { fs.rmSync(baseRoot, { recursive: true, force: true }); }
}

if (process.argv[1] && fs.realpathSync(fileURLToPath(import.meta.url)) === fs.realpathSync(path.resolve(process.argv[1]))) {
	try { runProof(parseArgs(process.argv.slice(2))); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
