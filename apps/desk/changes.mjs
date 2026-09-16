// changes.mjs — the desk's "files changed" view of a live session's repository.
//
// Two read-only surfaces, both driven from a live child's `cwd`:
//   collectChanges(cwd)          → the file list + totals
//   fileDiff(cwd, relativePath)  → one file's unified diff
//
// Both return `{status, body}` so server.mjs relays them without knowing git;
// both are pure functions of a directory, so the zero-dep test drives them
// directly against a temp repository.
//
// THE BASELINE IS HEAD. What this reports is the working tree against HEAD —
// the conversation's edits plus whatever was already uncommitted, staged or not,
// in ONE number per file. It is not "what this session changed": the desk has no
// way to attribute a working-tree line to a conversation. A repository with no
// commits yet is diffed against the empty tree (resolved with `hash-object`, so
// it is right for a sha256 repository too), which makes a freshly `git add`ed
// file show as added instead of failing.
//
// Never a shell: every call is `spawn("git", [...])` with the path after `--`.

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// Per-call rather than a module constant: a test exercises both sides of the cap
// in one process. Same env-override shape as the server's other caps.
const diffCap = () => Number(process.env.DESK_DIFF_CAP) || 512 * 1024;
const gitTimeout = () => Number(process.env.DESK_GIT_TIMEOUT_MS) || 20000; // env: tests only

// Bounds that are NOT configurable — they exist so one `agent_settled` in a
// wrongly-shaped repository (no .gitignore over node_modules) cannot stall the
// desk's single event loop or hand the page a multi-megabyte JSON body.
const LIST_CAP = 8 * 1024 * 1024; // git's own porcelain/numstat output
const MAX_FILES = 1000; // rows returned; the rest are reported as a count
const UNTRACKED_READ_LIMIT = 1000; // untracked files whose lines we count
const UNTRACKED_BYTE_CAP = 1024 * 1024; // per file; bigger ones are reported as binary

// A git invocation, bounded in time and in bytes. `truncate` decides what a
// byte overrun MEANS: for a diff it is a truncated answer the caller can still
// use, for a file list it is a failure (half a numstat is a wrong answer).
function runGit(args, cwd, { cap, truncate = false } = {}) {
	return new Promise((resolve) => {
		const chunks = [];
		let bytes = 0, done = false, over = false;
		// declared first: a synchronous spawn() throw calls finish() before the
		// timer exists, and `clearTimeout(timer)` would hit the temporal dead zone
		let timer = null;
		const finish = (r) => {
			if (done) return;
			done = true;
			clearTimeout(timer);
			resolve(r);
		};
		let proc;
		try {
			proc = spawn("git", args, {
				cwd,
				stdio: ["ignore", "pipe", "pipe"],
				env: { ...process.env, GIT_OPTIONAL_LOCKS: "0", GIT_PAGER: "cat", GIT_TERMINAL_PROMPT: "0" },
			});
		} catch (e) {
			return finish({ ok: false, reason: e?.code === "ENOENT" ? "missing" : "spawn", error: String(e?.message || e) });
		}
		timer = setTimeout(() => {
			try { proc.kill("SIGKILL"); } catch {}
			finish({ ok: false, reason: "timeout", error: `git timed out after ${gitTimeout()} ms` });
		}, gitTimeout());
		let err = "";
		proc.stdout.on("data", (c) => {
			if (over) return;
			bytes += c.length;
			chunks.push(c);
			if (bytes <= (cap ?? LIST_CAP)) return;
			over = true;
			try { proc.kill("SIGKILL"); } catch {}
			if (!truncate) {
				chunks.length = 0;
				return finish({ ok: false, reason: "cap", error: `git output exceeded cap (${cap ?? LIST_CAP} bytes)` });
			}
			finish({ ok: true, out: Buffer.concat(chunks).subarray(0, cap ?? LIST_CAP), truncated: true });
			chunks.length = 0;
		});
		proc.stderr.on("data", (c) => (err = (err + c).slice(-2000)));
		// ENOENT lands here, not on the spawn() call: git is simply not on PATH.
		proc.on("error", (e) => finish({ ok: false, reason: e?.code === "ENOENT" ? "missing" : "spawn", error: String(e?.message || e) }));
		proc.on("close", (code) => finish({ ok: true, out: Buffer.concat(chunks), code, stderr: err.trim(), truncated: false }));
	});
}

const text = (r) => r.out.toString("utf-8");
// A `git` that could not run at all vs one that ran and said no: only the first
// is the desk's problem to report.
const gitBroken = (r) => !r.ok;

// One call for both questions: where the work tree is, and whether it has a
// commit. With no HEAD `--verify --quiet` exits 1 but the toplevel line is still
// printed, which is how "a repository with no commits" is told from "not a
// repository" (no line at all).
async function repoInfo(cwd) {
	const r = await runGit(["rev-parse", "--show-toplevel", "--verify", "--quiet", "HEAD"], cwd);
	if (gitBroken(r)) return { broken: r };
	const lines = text(r).split("\n").map((s) => s.trim()).filter(Boolean);
	if (!lines.length || !path.isAbsolute(lines[0])) return { repo: false };
	const root = lines[0];
	if (lines[1]) return { repo: true, root, baseline: lines[1] };
	// No commit yet: the empty tree is the baseline. `hash-object` without `-w`
	// computes it for this repository's hash algorithm and writes nothing.
	const e = await runGit(["hash-object", "-t", "tree", "/dev/null"], cwd);
	if (gitBroken(e) || e.code !== 0) return { repo: true, root, baseline: null };
	const oid = text(e).trim();
	return { repo: true, root, baseline: oid || null };
}

// `git diff -z --numstat <base>`:
//   normal  "<add>\t<del>\t" NUL "<path>" — i.e. one field ending in the path
//   rename  "<add>\t<del>\t" NUL "<src>" NUL "<dst>"  (the path field is EMPTY)
// Binary files print "-" for both counts.
function parseNumstat(out) {
	const parts = out.split("\0");
	const files = new Map();
	for (let i = 0; i < parts.length; i++) {
		const rec = parts[i];
		if (!rec.includes("\t")) continue;
		const [a, d, rest] = rec.split("\t");
		let p = rest;
		if (p === "") {
			// rename/copy: source then destination follow as their own fields
			i += 2;
			p = parts[i];
		}
		if (!p) continue;
		const binary = a === "-" || d === "-";
		files.set(p, {
			path: p,
			added: binary ? null : Number(a) || 0,
			removed: binary ? null : Number(d) || 0,
			binary,
		});
	}
	return files;
}

// `git status --porcelain=v1 -z`: "XY<space><path>" NUL, and for a rename the
// ORIGINAL path follows as its own field. Two uses here: the status letter for
// a tracked path, and the untracked set (numstat cannot see those).
function parsePorcelain(out) {
	const parts = out.split("\0");
	const status = new Map();
	const untracked = [];
	for (let i = 0; i < parts.length; i++) {
		const rec = parts[i];
		if (rec.length < 4) continue;
		const x = rec[0], y = rec[1], p = rec.slice(3);
		if (x === "?" || y === "?") {
			untracked.push(p);
			continue;
		}
		if (x === "R" || x === "C") i++; // the original path rides behind a rename/copy
		const codes = new Set([x, y].filter((c) => c !== " " && c !== "."));
		status.set(p, codes.has("R") ? "R" : codes.has("D") ? "D" : codes.has("A") ? "A" : "M");
	}
	return { status, untracked };
}

// A new file's diff is every line added, so the line count IS the added count.
// Bounded: a file over the cap, or one holding a NUL byte, is reported as binary
// with no count rather than read whole.
function countNewFile(abs) {
	let buf;
	try {
		// lstat, not stat: an untracked SYMLINK must never be followed — counting
		// its target's lines would report something from outside the work tree.
		const st = fs.lstatSync(abs);
		if (st.isSymbolicLink()) return { added: null, binary: false };
		if (!st.isFile()) return null;
		if (st.size > UNTRACKED_BYTE_CAP) return { added: null, binary: true };
		buf = fs.readFileSync(abs);
	} catch {
		return null; // vanished between `git status` and here
	}
	if (buf.includes(0)) return { added: null, binary: true };
	if (!buf.length) return { added: 0, binary: false };
	const s = buf.toString("utf-8");
	let n = 0;
	for (let i = 0; i < s.length; i++) if (s[i] === "\n") n++;
	return { added: s.endsWith("\n") ? n : n + 1, binary: false };
}

// A spawn ENOENT is ambiguous: git is not on PATH, or the cwd itself is gone
// (the worktree was removed under a live session). Say which.
function spawnFailure(cwd) {
	return fs.existsSync(cwd) ? "git not found" : "working directory is gone";
}

export async function collectChanges(cwd) {
	const info = await repoInfo(cwd);
	if (info.broken) {
		if (info.broken.reason === "missing") return { status: 200, body: { repo: false, reason: spawnFailure(cwd) } };
		return { status: 500, body: { error: info.broken.error } };
	}
	if (!info.repo) return { status: 200, body: { repo: false } };
	const { root, baseline } = info;

	const [num, por] = await Promise.all([
		baseline ? runGit(["-c", "core.quotepath=false", "diff", "-z", "--numstat", baseline], cwd) : Promise.resolve(null),
		runGit(["-c", "core.quotepath=false", "-c", "status.relativePaths=false", "status", "--porcelain=v1", "-z", "--untracked-files=all"], cwd),
	]);
	for (const r of [num, por]) {
		if (!r) continue;
		if (gitBroken(r)) return { status: 500, body: { error: r.error } };
		if (r.code !== 0) return { status: 500, body: { error: r.stderr || `git exited ${r.code}` } };
	}
	const tracked = num ? parseNumstat(text(num)) : new Map();
	const { status: statusOf, untracked } = parsePorcelain(text(por));

	const files = [];
	for (const f of tracked.values()) files.push({ ...f, status: statusOf.get(f.path) || "M" });
	let read = 0;
	for (const p of untracked) {
		const counted = read++ < UNTRACKED_READ_LIMIT ? countNewFile(path.join(root, p)) : { added: null, binary: false };
		if (!counted) continue;
		files.push({ path: p, status: "??", added: counted.added, removed: 0, binary: counted.binary });
	}
	files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
	const omitted = Math.max(0, files.length - MAX_FILES);
	const shown = omitted ? files.slice(0, MAX_FILES) : files;
	const totals = { files: shown.length, added: 0, removed: 0 };
	for (const f of shown) {
		totals.added += f.added || 0;
		totals.removed += f.removed || 0;
	}
	const body = { repo: true, root, files: shown, totals };
	if (omitted) body.omitted = omitted;
	return { status: 200, body };
}

// The path comes from a request. Rejected outright: empty, NUL, absolute (posix
// or windows), any `..` segment. Then it must resolve inside the work tree —
// checked through realpath so a symlink cannot walk out. A path that does not
// EXIST skips the realpath check on purpose: a deleted file is a legitimate row
// in this list, and nothing on that branch touches the filesystem — only
// `git diff <base> -- <path>`, which git itself resolves inside the repository.
export function resolveInRoot(root, rel) {
	if (typeof rel !== "string" || !rel || rel.includes("\0")) return { error: "path required" };
	if (path.isAbsolute(rel) || /^[A-Za-z]:[\\/]/.test(rel) || rel.startsWith("/") || rel.startsWith("\\"))
		return { error: "path must be relative to the repository root" };
	const segs = rel.split(/[\\/]/);
	if (segs.some((s) => s === "..")) return { error: "path must not leave the repository root" };
	const abs = path.resolve(root, rel);
	let realRoot;
	try {
		realRoot = fs.realpathSync(root);
	} catch {
		return { error: "repository root is unreadable" };
	}
	let real;
	try {
		real = fs.realpathSync(abs);
	} catch {
		return { abs, exists: false }; // deleted (or never existed): git decides
	}
	if (real !== realRoot && !real.startsWith(realRoot + path.sep))
		return { error: "path must not leave the repository root" };
	return { abs: real, exists: true };
}

// An untracked file has no diff in git's model, so the desk synthesizes the one
// git would print for a new file. Deliberately not `git diff --no-index`: that
// exits 1 on difference, and /dev/null is not a path on win32.
function newFileDiff(rel, abs, cap) {
	let buf;
	try {
		const st = fs.statSync(abs);
		if (st.size > UNTRACKED_BYTE_CAP) return { diff: `Binary or oversized file (${st.size} bytes) — not shown`, truncated: false, binary: true };
		buf = fs.readFileSync(abs);
	} catch (e) {
		return { error: String(e?.message || e) };
	}
	if (buf.includes(0)) return { diff: `Binary file (${buf.length} bytes) — not shown`, truncated: false, binary: true };
	const body = buf.toString("utf-8");
	const lines = body === "" ? [] : body.replace(/\n$/, "").split("\n");
	const head = [`--- /dev/null`, `+++ b/${rel}`, `@@ -0,0 +1,${lines.length} @@`];
	let out = head.concat(lines.map((l) => `+${l}`)).join("\n");
	if (!body.endsWith("\n") && lines.length) out += "\n\\ No newline at end of file";
	const bytes = Buffer.byteLength(out, "utf-8");
	if (bytes > cap) return { diff: Buffer.from(out, "utf-8").subarray(0, cap).toString("utf-8"), truncated: true };
	return { diff: out, truncated: false };
}

export async function fileDiff(cwd, rel) {
	const info = await repoInfo(cwd);
	if (info.broken) {
		if (info.broken.reason === "missing") return { status: 500, body: { error: spawnFailure(cwd) } };
		return { status: 500, body: { error: info.broken.error } };
	}
	if (!info.repo) return { status: 409, body: { error: "not a git work tree" } };
	const at = resolveInRoot(info.root, rel);
	if (at.error) return { status: 400, body: { error: at.error } };
	const cap = diffCap();

	// Tracked or untracked? Ask git, not the filesystem: a file can exist and
	// still be untracked, and only git knows which.
	const ls = await runGit(["--literal-pathspecs", "ls-files", "-z", "--error-unmatch", "--", rel], info.root);
	const trackedByGit = ls.ok && ls.code === 0 && text(ls).replace(/\0/g, "").length > 0;
	if (!trackedByGit && at.exists) {
		const r = newFileDiff(rel, at.abs, cap);
		if (r.error) return { status: 500, body: { error: r.error } };
		return { status: 200, body: { path: rel, diff: r.diff, truncated: r.truncated, ...(r.binary ? { binary: true } : {}) } };
	}
	if (!info.baseline) return { status: 200, body: { path: rel, diff: "", truncated: false } };
	const d = await runGit(["-c", "core.quotepath=false", "--literal-pathspecs", "diff", info.baseline, "--", rel], info.root, { cap, truncate: true });
	if (gitBroken(d)) return { status: 500, body: { error: d.error } };
	if (!d.truncated && d.code !== 0) return { status: 500, body: { error: d.stderr || `git exited ${d.code}` } };
	return { status: 200, body: { path: rel, diff: text(d), truncated: !!d.truncated } };
}
