#!/usr/bin/env node
/**
 * @module scripts/identity-scan.mjs
 * @purpose Find tracked paths and content whose identity-word counts violate the repository allowlist.
 * @inputs a directory inside a git tree, an identity scan config, and an optional tracked-file list
 * @outputs pure count and tree-scan results; the CLI prints findings and a summary
 * @effects disk and process (reads tracked files and invokes git; the writer CLI updates the config)
 * @errors invalid config, git, or file reads throw; malformed CLI options exit 2; findings exit 1
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** Census metadata, 2026-10-21: lengths paired by index with the committed digest list. */
const COMMITTED_WORD_LENGTHS = [4, 5, 4, 3];
const ALLOWLIST_REASONS = new Set(["record", "byte-pinned", "frozen-desk"]);
const RECORD_PREFIXES = ["docs/reviews/", "docs/sessions/", "research/", "apps/bench/studies/"];
const RECORD_PATHS = new Set(["docs/product-report/assessments.json"]);

function hashToken(token) {
	return createHash("sha256").update(token.toLowerCase()).digest("hex");
}

function validateConfig(config) {
	if (!config || !Array.isArray(config.wordDigests) || config.wordDigests.length === 0 ||
		config.wordDigests.some((digest) => !/^[a-f0-9]{64}$/.test(digest))) {
		throw new Error("identity scan config needs a non-empty wordDigests array of sha256 hex digests");
	}
	const lengths = config.wordLengths ?? (config.wordDigests.length === COMMITTED_WORD_LENGTHS.length ? COMMITTED_WORD_LENGTHS : null);
	if (!Array.isArray(lengths) || lengths.length !== config.wordDigests.length ||
		lengths.some((length) => !Number.isInteger(length) || length < 1)) {
		throw new Error("identity scan config needs one positive word length per digest");
	}
	if (!Array.isArray(config.allowlist)) throw new Error("identity scan config needs an allowlist array");
	const seen = new Set();
	for (const entry of config.allowlist) {
		if (!entry || typeof entry.path !== "string" || entry.path.length === 0 || path.isAbsolute(entry.path) || entry.path.includes("\\")) {
			throw new Error("identity scan allowlist paths must be non-empty repository-relative slash paths");
		}
		if (seen.has(entry.path)) throw new Error(`duplicate identity scan allowlist path: ${entry.path}`);
		seen.add(entry.path);
		if (!Array.isArray(entry.counts) || entry.counts.length !== config.wordDigests.length ||
			entry.counts.some((count) => !Number.isInteger(count) || count < 0)) {
			throw new Error(`identity scan allowlist counts do not match the digest list: ${entry.path}`);
		}
		if (!ALLOWLIST_REASONS.has(entry.reason)) throw new Error(`invalid identity scan allowlist reason: ${entry.path}`);
		if (entry.pin !== undefined && typeof entry.pin !== "string") throw new Error(`invalid identity scan allowlist pin: ${entry.path}`);
	}
	return lengths;
}

function camelParts(token) {
	if (!/^[A-Za-z]+$/.test(token)) return [token];
	return token.match(/[A-Z]+(?=[A-Z][a-z]|$)|[A-Z]?[a-z]+/g) ?? [token];
}

function countText(text, digests, lengths) {
	const counts = digests.map(() => 0);
	const digestIndices = new Map();
	for (let index = 0; index < digests.length; index++) {
		const indices = digestIndices.get(digests[index]) ?? [];
		indices.push(index);
		digestIndices.set(digests[index], indices);
	}
	const candidateLengths = new Set(lengths);
	for (const token of String(text).split(/[^A-Za-z0-9]+/)) {
		if (!token) continue;
		for (const part of camelParts(token)) {
			if (!candidateLengths.has(part.length)) continue;
			for (const index of digestIndices.get(hashToken(part)) ?? []) counts[index]++;
		}
	}
	return counts;
}

/** Count configured identity words in one repository-relative path and its content. */
export function countIdentityWords({ path: relativePath = "", content = "", config }) {
	const lengths = validateConfig(config);
	const pathCounts = countText(relativePath, config.wordDigests, lengths);
	const contentCounts = countText(content, config.wordDigests, lengths);
	return pathCounts.map((count, index) => count + contentCounts[index]);
}

function gitRoot(start) {
	return execFileSync("git", ["-C", path.resolve(start), "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
}

function trackedFiles(root) {
	const output = execFileSync("git", ["-C", root, "ls-files", "-z"]);
	return output.toString("utf8").split("\0").filter(Boolean);
}

function fileContent(root, relative) {
	const target = path.join(root, ...relative.split("/"));
	let stat;
	try {
		stat = fs.lstatSync(target);
	} catch (error) {
		if (error?.code === "ENOENT") return "";
		throw error;
	}
	if (stat.isSymbolicLink()) return fs.readlinkSync(target, "utf8");
	if (!stat.isFile()) return "";
	return fs.readFileSync(target).toString("utf8");
}

/** Scan a git tree without relying on the process cwd or mutating the supplied config. */
export function scanTree({ root, config, files } = {}) {
	validateConfig(config);
	const resolvedRoot = gitRoot(root);
	const listed = files === undefined ? trackedFiles(resolvedRoot) : [...files];
	const allowlist = new Map(config.allowlist.map((entry) => [entry.path, entry]));
	const findings = [];
	const totals = config.wordDigests.map(() => 0);
	const countsByFile = {};
	for (const relative of listed) {
		if (typeof relative !== "string" || relative.length === 0 || path.isAbsolute(relative) || relative.includes("\\")) {
			throw new Error(`invalid tracked path: ${String(relative)}`);
		}
		const counts = countIdentityWords({ path: relative, content: fileContent(resolvedRoot, relative), config });
		countsByFile[relative] = counts;
		for (let index = 0; index < totals.length; index++) totals[index] += counts[index];
		const expected = allowlist.get(relative)?.counts;
		for (let wordIndex = 0; wordIndex < counts.length; wordIndex++) {
			if (!expected && counts[wordIndex] > 0) {
				findings.push({ path: relative, wordIndex, kind: "unallowlisted", expected: 0, actual: counts[wordIndex] });
			} else if (expected && counts[wordIndex] !== expected[wordIndex]) {
				findings.push({ path: relative, wordIndex, kind: "count-mismatch", expected: expected[wordIndex], actual: counts[wordIndex] });
			}
		}
		allowlist.delete(relative);
	}
	for (const entry of allowlist.values()) {
		for (let wordIndex = 0; wordIndex < entry.counts.length; wordIndex++) {
			if (entry.counts[wordIndex] !== 0) {
				findings.push({ path: entry.path, wordIndex, kind: "count-mismatch", expected: entry.counts[wordIndex], actual: 0 });
			}
		}
	}
	return { root: resolvedRoot, findings, scannedFiles: listed.length, totals, countsByFile };
}

function isRecordPath(relative) {
	return RECORD_PATHS.has(relative) || RECORD_PREFIXES.some((prefix) => relative.startsWith(prefix)) ||
		(relative.startsWith("docs/") && !relative.slice("docs/".length).includes("/"));
}

function writeAllowlist({ root, config, configPath }) {
	const result = scanTree({ root, config });
	const kept = config.allowlist.filter((entry) => entry.reason === "byte-pinned" || entry.reason === "frozen-desk");
	const keptPaths = new Set(kept.map((entry) => entry.path));
	const records = Object.entries(result.countsByFile)
		.filter(([relative, counts]) => isRecordPath(relative) && counts.some((count) => count > 0) && !keptPaths.has(relative))
		.map(([relative, counts]) => ({ path: relative, counts, reason: "record" }));
	const allowlist = [...kept, ...records].sort((left, right) => left.path.localeCompare(right.path, "en"));
	const next = { ...config, allowlist };
	fs.writeFileSync(configPath, `${JSON.stringify(next, null, 2)}\n`);
	return next;
}

function usage() {
	return "usage: node scripts/identity-scan.mjs [--root <dir>] [--write-allowlist]";
}

function parseArgs(argv) {
	let root = ".";
	let write = false;
	let sawRoot = false;
	for (let index = 0; index < argv.length; index++) {
		if (argv[index] === "--root" && !sawRoot && argv[index + 1]) {
			root = argv[++index];
			sawRoot = true;
		} else if (argv[index] === "--write-allowlist" && !write) {
			write = true;
		} else {
			throw new Error(usage());
		}
	}
	return { root, write };
}

function runCli(argv) {
	let options;
	try {
		options = parseArgs(argv);
	} catch (error) {
		console.error(error.message);
		return 2;
	}
	const resolvedRoot = gitRoot(options.root);
	const configPath = path.join(resolvedRoot, "identity-scan.config.json");
	let config = JSON.parse(fs.readFileSync(configPath, "utf8"));
	if (options.write) config = writeAllowlist({ root: options.root, config, configPath });
	const result = scanTree({ root: options.root, config });
	for (const finding of result.findings) {
		console.log(`${finding.path}: wordIndex=${finding.wordIndex} expected=${finding.expected} actual=${finding.actual} ${finding.kind}`);
	}
	console.log(`summary files=${result.scannedFiles} findings=${result.findings.length} totals=${result.totals.join(",")}`);
	return result.findings.length > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
	try {
		process.exitCode = runCli(process.argv.slice(2));
	} catch (error) {
		console.error(error.message);
		process.exitCode = 2;
	}
}
