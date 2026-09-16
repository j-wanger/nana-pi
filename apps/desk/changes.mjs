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

// Bounds that exist so one `agent_settled` in a wrongly-shaped repository (no
// .gitignore over node_modules) cannot stall the desk's single event loop or
// hand the page a multi-megabyte JSON body. Fixed, except the aggregate read
// budget below, which takes the same test-only env override DESK_DIFF_CAP does.
const LIST_CAP = 8 * 1024 * 1024; // git's own porcelain/numstat output
const MAX_FILES = 1000; // rows returned; the rest are reported as a count
const UNTRACKED_READ_LIMIT = 1000; // untracked files whose lines we count
const UNTRACKED_BYTE_CAP = 1024 * 1024; // per file; bigger ones are reported as binary
const READ_CONCURRENCY = 8; // untracked reads in flight at once
// Every untracked read goes through an fd opened with this. `undefined` on
// win32, where 0 leaves the lstat-first check as the only guard (README).
const NOFOLLOW = fs.constants.O_NOFOLLOW ?? 0;

// AGGREGATE, per call. The per-file cap alone bounds nothing that matters: 1000
// untracked files of 1 MiB each is a gigabyte read on every refresh. Past this
// budget the remaining untracked files are still LISTED — with no line count —
// and the body says `partial: true` so the page does not present the totals as
// the whole truth. Same env-override shape as DESK_DIFF_CAP; tests only.
const untrackedTotalCap = () => Number(process.env.DESK_UNTRACKED_TOTAL_CAP) || 16 * 1024 * 1024;

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

// Read a file through an open DESCRIPTOR, never past what `plan` allows,
// counting lines as the bytes arrive.
//
// The descriptor is the whole point. lstat-then-readFile decides on one PATHNAME
// and then reads another: between the two the file can grow, or be replaced by a
// symlink, which defeated both the per-file cap and the aggregate budget below.
// Here the fd IS what was opened — O_NOFOLLOW refuses a symlink outright, fstat
// refuses anything that is not a regular file, and the byte count is what was
// actually read, not what a pathname said a moment ago.
//
// `plan(size)` is called SYNCHRONOUSLY between the fstat and the first read, with
// the size this descriptor really has. It answers how many bytes this read may
// cost — or `null` to refuse the file without reading a byte of it. Synchronous
// is what makes a SHARED budget safe under the pool: JS runs one of these at a
// time, so a plan that charges the budget has charged it before any other worker
// can look at the number. And there is no probe byte: the read stops AT what
// plan said, so no cap and no budget is ever exceeded to learn that it would be.
//
// A file that GROWS after the fstat is invisible here by construction — nothing
// past `n` is read, so what is counted is the first `n` bytes and the answer
// claims nothing more. A file that SHRINKS shows up as a SHORT read, and the
// caller refuses to count that: a file being written has no stable line count
// anyway, and a prefix's count would be a number for a file nobody measured.
//
// A new file's diff is every line added, so the line count IS the added count.
// Counted on the BYTES: 0x0A cannot occur inside a UTF-8 multi-byte sequence, so
// this is the same number decoding would give, without decoding a megabyte to
// get it. A file holding a NUL byte is reported as binary, not counted.
async function readBounded(abs, { collect = false, plan }) {
	let fh;
	try {
		fh = await fs.promises.open(abs, fs.constants.O_RDONLY | NOFOLLOW);
	} catch (e) {
		// ELOOP/EMLINK is O_NOFOLLOW refusing a symlink — a different answer from a
		// file that is simply not there ("not shown" vs "gone").
		return { error: e, symlink: e?.code === "ELOOP" || e?.code === "EMLINK", bytes: 0 };
	}
	try {
		const st = await fh.stat();
		if (!st.isFile()) return { notFile: true, bytes: 0 };
		const n = plan(st.size);
		if (n === null) return { refused: true, size: st.size, bytes: 0 };
		const buf = Buffer.allocUnsafe(Math.min(n, 64 * 1024));
		const chunks = [];
		let bytes = 0, lines = 0, nul = false, lastByte = -1;
		while (bytes < n) {
			const { bytesRead } = await fh.read(buf, 0, Math.min(buf.length, n - bytes), null);
			if (!bytesRead) break;
			for (let i = 0; i < bytesRead; i++) {
				if (buf[i] === 0x0a) lines++;
				else if (buf[i] === 0) nul = true;
			}
			lastByte = buf[bytesRead - 1];
			bytes += bytesRead;
			if (collect) chunks.push(Buffer.from(buf.subarray(0, bytesRead)));
		}
		return {
			bytes,
			size: st.size,
			added: bytes === 0 ? 0 : lastByte === 0x0a ? lines : lines + 1,
			binary: nul,
			short: bytes < n, // it had LESS to give than the fstat said: it is moving
			buf: collect ? Buffer.concat(chunks) : null,
		};
	} catch (e) {
		return { error: e, symlink: false, bytes: 0 };
	} finally {
		await fh.close().catch(() => {});
	}
}

// A bounded worker pool. Bounded because the whole point of going async is to
// leave the event loop free: 1000 readFile calls issued at once hand the thread
// pool a queue exactly as long as the synchronous loop this replaced.
async function pooled(items, width, fn) {
	let next = 0;
	const worker = async () => {
		while (next < items.length) await fn(items[next++]);
	};
	await Promise.all(Array.from({ length: Math.min(width, items.length) }, worker));
}

// Line-count the untracked files, asynchronously and within an aggregate byte
// budget. Three passes so the budget is spent in LIST order however the pool
// interleaves: lstat everything, decide in order who may be read, then read.
//   map value `null` = drop the row (vanished, or not a regular file)
//   {added: null, binary: false} = listed, deliberately not counted
//
// The lstat sizes decide WHO is read, in list order — that walk is one
// synchronous pass, so which files get the last of the budget does not depend on
// how the pool interleaves. What each read may COST is decided again on the
// DESCRIPTOR, against the size the fd really has, and the budget is charged
// there: a file is never trusted to still be the size it announced.
async function countUntracked(root, rels) {
	const budget = untrackedTotalCap();
	const stats = new Map();
	await pooled(rels, READ_CONCURRENCY, async (rel) => {
		// lstat, not stat: an untracked SYMLINK must never be followed — counting
		// its target's lines would report something from outside the work tree.
		try { stats.set(rel, await fs.promises.lstat(path.join(root, rel))); } catch {}
	});
	const counts = new Map();
	const toRead = [];
	let allocated = 0, budgeted = false, raced = false;
	for (const rel of rels) {
		const st = stats.get(rel);
		if (!st) counts.set(rel, null); // vanished between `git status` and here
		else if (st.isSymbolicLink()) counts.set(rel, { added: null, binary: false });
		else if (!st.isFile()) counts.set(rel, null);
		else if (st.size > UNTRACKED_BYTE_CAP) counts.set(rel, { added: null, binary: true });
		else if (allocated + st.size > budget) {
			counts.set(rel, { added: null, binary: false });
			budgeted = true;
		} else {
			allocated += st.size;
			toRead.push(rel);
		}
	}
	let spent = 0;
	await pooled(toRead, READ_CONCURRENCY, async (rel) => {
		let refused = null;
		const r = await readBounded(path.join(root, rel), {
			// The budget is charged HERE — against the size the descriptor really
			// has, before the first byte is read, and with nothing able to run in
			// between — so two workers can never allocate the same bytes twice.
			// A reservation comes BACK only when nothing at all is read; a read
			// that comes up short keeps its whole share, because the file moved.
			plan: (size) => {
				if (size > UNTRACKED_BYTE_CAP) {
					refused = "cap"; // grew past the per-file cap since the lstat
					return null;
				}
				const n = Math.min(size, budget - spent);
				spent += n;
				if (n === size) return n;
				spent -= n; // not enough budget left for the WHOLE file: read none of it
				refused = "budget";
				return null;
			},
		});
		// Swapped for a symlink since the lstat: listed and not counted, the same
		// answer an untracked symlink gets when it was already one.
		if (r.symlink) counts.set(rel, { added: null, binary: false });
		else if (r.error || r.notFile) counts.set(rel, null); // vanished, or no longer a file
		else if (refused === "cap") counts.set(rel, { added: null, binary: true });
		else if (refused === "budget") {
			counts.set(rel, { added: null, binary: false });
			budgeted = true;
		} else if (r.short) {
			// Smaller than the fstat said: it is being written under us, and a
			// prefix's line count would be a number for a file nobody measured.
			counts.set(rel, { added: null, binary: false });
			raced = true;
		} else counts.set(rel, { added: r.binary ? null : r.added, binary: r.binary });
	});
	return { counts, budgeted, raced, budget };
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
	// Past UNTRACKED_READ_LIMIT a file is listed with no count, like one the byte
	// budget cut off — the row is still true, the number is simply not there.
	const { counts, budgeted, raced, budget } = await countUntracked(root, untracked.slice(0, UNTRACKED_READ_LIMIT));
	const overLimit = Math.max(0, untracked.length - UNTRACKED_READ_LIMIT);
	for (const p of untracked) {
		const counted = counts.has(p) ? counts.get(p) : { added: null, binary: false };
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
	// `partial` = some listed file has no line count, so the totals are a floor,
	// not the sum. Said out loud rather than folded silently into the numbers.
	const why = [];
	if (budgeted) why.push(`the ${budget}-byte untracked read budget for one refresh was reached`);
	if (raced) why.push(`a file changed under the read`);
	if (overLimit) why.push(`only the first ${UNTRACKED_READ_LIMIT} untracked files are line-counted`);
	if (why.length) {
		body.partial = true;
		body.partialReason = `${why.join("; ")} — the rest are listed with no line count`;
	}
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
		return { abs, raw: abs, exists: false }; // deleted (or never existed): git decides
	}
	if (real !== realRoot && !real.startsWith(realRoot + path.sep))
		return { error: "path must not leave the repository root" };
	// `raw` = the path AS GIVEN, before realpath resolved any link away. The
	// untracked branch needs it to ask whether the path itself is a symlink.
	return { abs: real, raw: abs, exists: true };
}

// An untracked file has no diff in git's model, so the desk synthesizes the one
// git would print for a new file. Deliberately not `git diff --no-index`: that
// exits 1 on difference, and /dev/null is not a path on win32.
async function newFileDiff(rel, abs, cap) {
	// Same descriptor rule as the file LIST: the path checked above and the bytes
	// read here cannot be two different files (O_NOFOLLOW + fstat). And the same
	// strictness about the bound — the window shows at most `cap` bytes, so `cap`
	// is what is READ. A bigger file is cut at exactly that and says `truncated`;
	// nothing is read past it to find out how much bigger it is.
	let over = false;
	const r = await readBounded(abs, {
		collect: true,
		plan: (size) => {
			over = size > cap;
			return Math.min(size, cap);
		},
	});
	if (r.symlink) return { symlink: true };
	if (r.notFile) return { error: "not a regular file" };
	if (r.error) return { error: String(r.error?.message || r.error) };
	const buf = r.buf;
	if (r.binary) return { diff: `Binary file (${r.size} bytes) — not shown`, truncated: false, binary: true };
	const body = buf.toString("utf-8");
	const lines = body === "" ? [] : body.replace(/\n$/, "").split("\n");
	const head = [`--- /dev/null`, `+++ b/${rel}`, `@@ -0,0 +1,${lines.length} @@`];
	let out = head.concat(lines.map((l) => `+${l}`)).join("\n");
	if (!body.endsWith("\n") && lines.length) out += "\n\\ No newline at end of file";
	const bytes = Buffer.byteLength(out, "utf-8");
	if (bytes > cap) return { diff: Buffer.from(out, "utf-8").subarray(0, cap).toString("utf-8"), truncated: true };
	return { diff: out, truncated: over };
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
		// "Untracked symlinks are never read" is the same rule the file LIST keeps
		// (`countUntracked` lstats), and it holds here even for a target inside the
		// root: the desk shows the work tree, not what a link in it points at.
		// lstat the path AS GIVEN — `at.abs` is already the resolved target. A path
		// swapped for a symlink AFTER this check is refused by the open itself.
		let link = false;
		try { link = fs.lstatSync(at.raw).isSymbolicLink(); } catch {}
		if (link) return { status: 409, body: { error: "symlinked path" } };
		const r = await newFileDiff(rel, at.abs, cap);
		if (r.symlink) return { status: 409, body: { error: "symlinked path" } };
		if (r.error) return { status: 500, body: { error: r.error } };
		return { status: 200, body: { path: rel, diff: r.diff, truncated: r.truncated, ...(r.binary ? { binary: true } : {}) } };
	}
	if (!info.baseline) return { status: 200, body: { path: rel, diff: "", truncated: false } };
	const d = await runGit(["-c", "core.quotepath=false", "--literal-pathspecs", "diff", info.baseline, "--", rel], info.root, { cap, truncate: true });
	if (gitBroken(d)) return { status: 500, body: { error: d.error } };
	if (!d.truncated && d.code !== 0) return { status: 500, body: { error: d.stderr || `git exited ${d.code}` } };
	return { status: 200, body: { path: rel, diff: text(d), truncated: !!d.truncated } };
}
