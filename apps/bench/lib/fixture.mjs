// A FIXTURE is a frozen directory the model works in. It is pinned by a sha256 manifest
// (one `<sha256>  <posix-relpath>` line per file, sorted, LF) and the manifest's own sha256
// is the single number a reviewer checks.
//
// Why a directory + manifest and not a tarball: extracting a tarball needs an external `tar`
// binary (a runtime dependency, and one whose sha changes with mtimes on every rebuild),
// while `fs.cp` is built in, byte-exact and identical on darwin and win32. The manifest also
// localises damage — it names the file that drifted instead of just failing one big hash.
//
// CLI: node apps/bench/lib/fixture.mjs build <src> <dest> [--exclude a,b,c]
//      node apps/bench/lib/fixture.mjs hash  <dir>

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ALWAYS_SKIP = new Set(["node_modules", ".git", ".DS_Store"]);
const toPosix = (p) => p.split(path.sep).join("/");
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/** Sorted posix-relative paths of every file under dir. */
export async function listFiles(dir, { exclude = [], base = dir } = {}) {
	const out = [];
	const skip = new Set([...ALWAYS_SKIP, ...exclude.map((e) => toPosix(e).replace(/\/+$/, ""))]);
	const rec = async (abs) => {
		for (const ent of await fs.readdir(abs, { withFileTypes: true })) {
			const child = path.join(abs, ent.name);
			const rel = toPosix(path.relative(base, child));
			if (skip.has(ent.name) || skip.has(rel)) continue;
			if (ent.isDirectory()) await rec(child);
			else if (ent.isFile()) out.push(rel);
		}
	};
	await rec(dir);
	return out.sort();
}

/** { entries: [{path, sha}], manifest: string, sha: string } — sha is the pin. */
export async function hashDir(dir, opts = {}) {
	const files = await listFiles(dir, opts);
	const entries = [];
	for (const rel of files) entries.push({ path: rel, sha: sha256(await fs.readFile(path.join(dir, rel))) });
	const manifest = entries.map((e) => `${e.sha}  ${e.path}`).join("\n") + "\n";
	return { entries, manifest, sha: sha256(manifest) };
}

/** Verify a fixture against its pinned manifest sha. Returns { ok, sha, drift[] }. */
export async function verifyFixture(dir, expectedSha, opts = {}) {
	const got = await hashDir(dir, opts);
	if (got.sha === expectedSha) return { ok: true, sha: got.sha, drift: [] };
	let drift = [];
	const manifestPath = path.join(path.dirname(dir), "FIXTURE.sha256");
	try {
		const prev = new Map(
			(await fs.readFile(manifestPath, "utf8"))
				.split("\n")
				.filter(Boolean)
				.map((l) => [l.slice(66), l.slice(0, 64)]),
		);
		const now = new Map(got.entries.map((e) => [e.path, e.sha]));
		for (const [p, s] of now) if (prev.get(p) !== s) drift.push(prev.has(p) ? `changed ${p}` : `added ${p}`);
		for (const p of prev.keys()) if (!now.has(p)) drift.push(`removed ${p}`);
	} catch {
		drift = ["(no FIXTURE.sha256 next to the fixture dir — cannot localise the drift)"];
	}
	return { ok: false, sha: got.sha, drift: drift.slice(0, 20) };
}

/** Fresh byte-exact copy of the fixture for one run. */
export async function materialize(src, dest) {
	await fs.mkdir(dest, { recursive: true });
	await fs.cp(src, dest, { recursive: true, force: true, preserveTimestamps: false });
	return dest;
}

/**
 * Apply a task's declared mutations (e.g. the injected one-line bug) to a materialized copy.
 * Each mutation must match EXACTLY ONCE — an ambiguous or missing match aborts the run rather
 * than silently producing a different task than the one the study declares.
 */
export async function applyMutations(dir, mutations = []) {
	const applied = [];
	for (const m of mutations) {
		const abs = path.resolve(dir, m.file);
		if (!abs.startsWith(path.resolve(dir))) throw new Error(`mutation path escapes the fixture: ${m.file}`);
		const body = await fs.readFile(abs, "utf8");
		const hits = body.split(m.find).length - 1;
		if (hits !== 1) throw new Error(`mutation in ${m.file} matched ${hits} times, expected exactly 1: ${JSON.stringify(m.find)}`);
		await fs.writeFile(abs, body.replace(m.find, m.replace));
		applied.push(`${m.file}: ${m.note ?? "mutated"}`);
	}
	return applied;
}

/** Copy bench-owned assets (checker probes) into the run copy. */
export async function copyAssets(studyDir, dir, assets = []) {
	for (const a of assets) {
		const to = path.resolve(dir, a.to);
		if (!to.startsWith(path.resolve(dir))) throw new Error(`asset path escapes the fixture: ${a.to}`);
		await fs.mkdir(path.dirname(to), { recursive: true });
		await fs.copyFile(path.resolve(studyDir, a.from), to);
	}
}

async function main(argv) {
	const [cmd, ...rest] = argv;
	if (cmd === "build") {
		const [src, dest] = rest;
		const excludeArg = rest.find((a) => a.startsWith("--exclude="));
		const exclude = excludeArg ? excludeArg.slice("--exclude=".length).split(",").filter(Boolean) : [];
		await fs.rm(dest, { recursive: true, force: true });
		await fs.mkdir(dest, { recursive: true });
		for (const rel of await listFiles(src, { exclude })) {
			const to = path.join(dest, rel);
			await fs.mkdir(path.dirname(to), { recursive: true });
			await fs.copyFile(path.join(src, rel), to);
		}
		const h = await hashDir(dest);
		await fs.writeFile(path.join(path.dirname(dest), "FIXTURE.sha256"), h.manifest);
		console.log(`${h.entries.length} files\nfixtureSha256 ${h.sha}`);
		return;
	}
	if (cmd === "hash") {
		const h = await hashDir(rest[0]);
		console.log(`${h.entries.length} files\nfixtureSha256 ${h.sha}`);
		return;
	}
	console.error("usage: fixture.mjs build <src> <dest> [--exclude=a,b] | hash <dir>");
	process.exit(2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
	main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exit(1); });
}

/**
 * A minimal unified diff (LCS over lines). Zero-dep, deterministic, good enough to READ what an
 * edit task actually did — which is the evidence a reviewer needs to audit a pass or a failure.
 */
export function unifiedDiff(before, after, label = "file") {
	const A = String(before ?? "").split("\n");
	const B = String(after ?? "").split("\n");
	const L = Array.from({ length: A.length + 1 }, () => new Uint32Array(B.length + 1));
	for (let i = A.length - 1; i >= 0; i--) {
		for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
	}
	const out = [`--- a/${label}`, `+++ b/${label}`];
	let i = 0;
	let j = 0;
	while (i < A.length && j < B.length) {
		if (A[i] === B[j]) { out.push(` ${A[i]}`); i++; j++; }
		else if (L[i + 1][j] >= L[i][j + 1]) out.push(`-${A[i++]}`);
		else out.push(`+${B[j++]}`);
	}
	while (i < A.length) out.push(`-${A[i++]}`);
	while (j < B.length) out.push(`+${B[j++]}`);
	// Keep only hunks with context, so an unchanged 2000-line file does not fill the evidence dir.
	const keep = out.slice(0, 2).concat(compactHunks(out.slice(2)));
	return keep.join("\n");
}

function compactHunks(lines, context = 3) {
	const interesting = lines.map((l) => l[0] === "+" || l[0] === "-");
	const keep = new Set();
	interesting.forEach((hit, idx) => {
		if (!hit) return;
		for (let k = Math.max(0, idx - context); k <= Math.min(lines.length - 1, idx + context); k++) keep.add(k);
	});
	const out = [];
	let last = -2;
	for (const idx of [...keep].sort((a, b) => a - b)) {
		if (idx !== last + 1) out.push(`@@ line ${idx + 1} @@`);
		out.push(lines[idx]);
		last = idx;
	}
	return out;
}

/**
 * A structured line diff (same LCS as `unifiedDiff`). Returns the ADDED lines with their position
 * in the new file and the REMOVED lines with their position in the old one — which is what a
 * diff-shape rule needs: "the change must live inside this function", and "these tokens must not
 * appear on any line the model added".
 */
export function lineDiff(before, after) {
	const A = String(before ?? "").split("\n");
	const B = String(after ?? "").split("\n");
	const L = Array.from({ length: A.length + 1 }, () => new Uint32Array(B.length + 1));
	for (let i = A.length - 1; i >= 0; i--) {
		for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
	}
	const added = [];
	const removed = [];
	let i = 0;
	let j = 0;
	while (i < A.length && j < B.length) {
		if (A[i] === B[j]) { i++; j++; }
		else if (L[i + 1][j] >= L[i][j + 1]) removed.push({ line: i + 1, text: A[i++] });
		else added.push({ line: j + 1, text: B[j++] });
	}
	while (i < A.length) removed.push({ line: i + 1, text: A[i++] });
	while (j < B.length) added.push({ line: j + 1, text: B[j++] });
	return { added, removed };
}
