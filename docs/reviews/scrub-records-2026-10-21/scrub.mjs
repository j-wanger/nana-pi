#!/usr/bin/env node
/**
 * @module docs/reviews/scrub-records-2026-10-21/scrub.mjs
 * @purpose Replace configured identity tokens in record text through one context-sensitive table.
 * @inputs --root, optional --dry-run, optional repository-relative file, and identity-scan.config.json
 * @outputs changed record files, or class and folder counts with repository-relative paths
 * @effects disk in write mode; process and disk reads in every mode
 * @errors invalid arguments, missing inputs, unrecoverable digest tokens, or incomplete replacement exit nonzero
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { countIdentityWords } from "../../../scripts/identity-scan.mjs";

const STUDY_PREFIX = "apps/bench/studies/catch-ledger-2026-09-28/";
const SCRIPT_EXTENSIONS = new Set([".mjs", ".js", ".py", ".sh"]);
const digest = (value) => createHash("sha256").update(value.toLowerCase()).digest("hex");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const casing = (source, lower, title = lower[0].toUpperCase() + lower.slice(1)) =>
	source === source.toUpperCase() || source[0] === source[0].toUpperCase() ? title : lower;
const insideCodeToken = (whole, offset, length) => {
	const left = whole.slice(0, offset).match(/\S*$/)?.[0] ?? "";
	const right = whole.slice(offset + length).match(/^\S*/)?.[0] ?? "";
	return /[\/\\@=(]/.test(left + right);
};

function camelParts(token) {
	if (!/^[A-Za-z]+$/.test(token)) return [token];
	return token.match(/[A-Z]+(?=[A-Z][a-z]|$)|[A-Z]?[a-z]+/g) ?? [token];
}

export function recoverWords(root, files, config) {
	const found = config.wordDigests.map(() => new Set());
	for (const relative of files) {
		const target = path.join(root, ...relative.split("/"));
		let text = relative;
		try { text += `\n${fs.readFileSync(target, "utf8")}`; } catch (error) { if (error.code !== "ENOENT") throw error; }
		for (const token of text.match(/[A-Za-z]+/g) ?? []) {
			for (const part of camelParts(token)) {
				const index = config.wordDigests.indexOf(digest(part));
				if (index !== -1) found[index].add(part.toLowerCase());
			}
		}
	}
	return found.map((values, index) => {
		if (values.size !== 1) throw new Error(`class ${index} recovered ${values.size} tokens`);
		return [...values][0];
	});
}

function identifierText(text, words) {
	let next = text;
	const pair = new RegExp(`${escapeRegExp(words[0])}([ _-]+)${escapeRegExp(words[2])}`, "gi");
	next = next.replace(pair, (source) => casing(source, "owner"));
	const splitter = new RegExp(`splitOpenFor${escapeRegExp(words[0])}`, "gi");
	next = next.replace(splitter, "splitOpenSection");
	words.forEach((word, index) => {
		const replacement = index === 3 ? "work" : "owner";
		next = next.replace(new RegExp(escapeRegExp(word), "gi"), (source) => casing(source, replacement));
	});
	return next;
}

function proseText(text, words) {
	let next = text;
	const pair = new RegExp(`${escapeRegExp(words[0])}\s+${escapeRegExp(words[2])}`, "gi");
	next = next.replace(pair, (source, _join, offset, whole) => insideCodeToken(whole, offset, source.length) ? casing(source, "owner") : casing(source, "the owner", "The owner"));
	for (const word of [words[0], words[1], words[2]]) {
		const escaped = escapeRegExp(word);
		next = next.replace(new RegExp(`${escaped}(?:['’]s)`, "gi"), (source, offset, whole) =>
			insideCodeToken(whole, offset, source.length) ? casing(source, "owner's", "Owner's") : casing(source, "the owner's", "The owner's"));
		next = next.replace(new RegExp(`\ba\s+${escaped}\b`, "gi"), (source) => casing(source, "an owner", "An owner"));
		next = next.replace(new RegExp(escaped, "gi"), (source, offset, whole) => {
			const before = whole[offset - 1] ?? "";
			const after = whole[offset + source.length] ?? "";
			if (/[A-Za-z0-9_-]/.test(before) || /[A-Za-z0-9_-]/.test(after) || insideCodeToken(whole, offset, source.length)) return casing(source, "owner");
			return casing(source, "the owner", "The owner");
		});
	}
	const work = escapeRegExp(words[3]);
	next = next.replace(new RegExp(`${work}-desk`, "gi"), "work-project");
	next = next.replace(new RegExp(work, "gi"), (source, offset, whole) => {
		const before = whole[offset - 1] ?? "";
		const after = whole[offset + source.length] ?? "";
		if (/[A-Za-z0-9_-]/.test(before) || /[A-Za-z0-9_-]/.test(after) || insideCodeToken(whole, offset, source.length)) return casing(source, "work");
		return casing(source, "the work project", "The work project");
	});
	next = next.replace(/\ba\s+the owner\b/gi, (source) => casing(source, "an owner", "An owner"));
	next = next.replace(/\ba\s+the work project\b/gi, (source) => casing(source, "a work project", "A work project"));
	return next;
}

function homeSegments(text, words) {
	let next = text;
	for (const word of words) {
		const escaped = escapeRegExp(word);
		next = next.replace(new RegExp(`((?:[/\\\\]|-)Users(?:[/\\\\]|-))${escaped}(?=[^A-Za-z0-9_]|$)`, "gi"), "$1example");
	}
	return next;
}

export function applyTable({ relative, content, words }) {
	const script = SCRIPT_EXTENSIONS.has(path.extname(relative).toLowerCase());
	let fenced = false;
	const pieces = content.split(/(\r\n|\n|\r)/);
	for (let index = 0; index < pieces.length; index += 2) {
		let line = homeSegments(pieces[index], words);
		const fenceLine = /^\s*```/.test(line);
		if (script || fenced || fenceLine) {
			line = identifierText(line, words);
		} else {
			line = line.replace(/`[^`]*`/g, (span) => identifierText(span, words));
			line = proseText(line, words);
		}
		pieces[index] = line;
		if (fenceLine) fenced = !fenced;
	}
	return pieces.join("");
}

function parseArgs(argv) {
	let root = ".";
	let dryRun = false;
	let file = null;
	for (let index = 0; index < argv.length; index++) {
		if (argv[index] === "--root" && argv[index + 1]) root = argv[++index];
		else if (argv[index] === "--dry-run") dryRun = true;
		else if (!file && !argv[index].startsWith("--")) file = argv[index];
		else throw new Error("usage: scrub.mjs [--root <dir>] [--dry-run] [file]");
	}
	return { root: path.resolve(root), dryRun, file };
}

const folderOf = (relative) => {
	if (relative.startsWith("docs/reviews/")) return "docs/reviews";
	if (relative.startsWith("docs/sessions/")) return "docs/sessions";
	if (relative.startsWith("research/raw/")) return "research/raw";
	if (relative.startsWith("research/")) return "research";
	if (relative.startsWith("apps/bench/studies/")) return "apps/bench/studies";
	if (relative === "docs/product-report/assessments.json") return "docs/product-report";
	if (relative.startsWith("docs/")) return "docs";
	return relative.split("/")[0];
};

export function runScrub({ root, dryRun, file }) {
	const configPath = path.join(root, "identity-scan.config.json");
	const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
	const records = config.allowlist.filter((entry) => entry.reason === "record").map((entry) => entry.path);
	const targets = file ? [file.replaceAll(path.sep, "/")] : records.filter((relative) => !relative.startsWith(STUDY_PREFIX));
	const recoveryFiles = [...new Set([...records, ...(file ? [file] : [])])];
	const words = recoverWords(root, recoveryFiles, config);
	const classPaths = config.wordDigests.map(() => []);
	const classCounts = config.wordDigests.map(() => 0);
	const folders = new Map();
	for (const relative of file ? targets : records) {
		const target = path.join(root, ...relative.split("/"));
		const content = fs.readFileSync(target, "utf8");
		const counts = countIdentityWords({ path: relative, content, config });
		counts.forEach((count, index) => {
			classCounts[index] += count;
			if (count) classPaths[index].push(relative);
		});
		const folder = folderOf(relative);
		const current = folders.get(folder) ?? { files: 0, counts: config.wordDigests.map(() => 0), paths: [] };
		current.files++;
		current.paths.push(relative);
		counts.forEach((count, index) => { current.counts[index] += count; });
		folders.set(folder, current);
		if (!dryRun && targets.includes(relative)) {
			const next = applyTable({ relative, content, words });
			fs.writeFileSync(target, next);
		}
	}
	for (let index = 0; index < classCounts.length; index++) {
		console.log(`class=${index} count=${classCounts[index]} files=${classPaths[index].length} paths=${classPaths[index].sort().join(",")}`);
	}
	for (const [folder, value] of [...folders].sort(([left], [right]) => left.localeCompare(right))) {
		console.log(`folder=${folder} files=${value.files} counts=${value.counts.join(",")} paths=${value.paths.sort().join(",")}`);
	}
	console.log(`summary files=${file ? targets.length : records.length} counts=${classCounts.join(",")} write=${dryRun ? 0 : targets.length}`);
	return { files: file ? targets.length : records.length, counts: classCounts, targets, words };
}

if (process.argv[1] && fs.realpathSync(fileURLToPath(import.meta.url)) === fs.realpathSync(path.resolve(process.argv[1]))) {
	try { runScrub(parseArgs(process.argv.slice(2))); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
