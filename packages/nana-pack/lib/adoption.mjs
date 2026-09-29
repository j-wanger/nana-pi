// Directory adoption (lane L5) — the one predicate shared by the producer (extensions/nana-handoff.ts,
// which journals `directory_unadopted`) and the reader (bin/nana-adoption.mjs, the seat's
// `[nana:adoption]` session-start block). Plain .mjs on purpose: the reader imports no .ts, so its
// hook has no Node floor of its own. Never throws, except tailLines() on a journal that exists but
// cannot be read. Never walks a filesystem looking for candidates — it only ever inspects a
// directory it is handed and that directory's ancestors (for `.git`).
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { piAgentDir } from "./agent-dir.mjs";

export const EVENT = "directory_unadopted";
/** Committed at the repository root by `nana-setup project <dir> --not-a-project`. */
export const MARKER = ".nana-not-a-project";
/** The journal is append-only and never rotated: read at most this much of its end. */
export const TAIL_BYTES = 256 * 1024;
/** A claimed root longer than this is not printed (and not re-checked). */
export const MAX_ROOT = 512;

const present = (p) => {
	try {
		fs.lstatSync(p); // something is there — a dangling link counts as "not absent"
		return true;
	} catch {
		return false;
	}
};
const isDir = (p) => {
	try {
		return fs.statSync(p).isDirectory();
	} catch {
		return false;
	}
};

// The handoff store — the ONE implementation (extensions/nana-handoff.ts imports these). It is
// FIXED at ~/.pi/agent/handoffs on purpose (U2's ruling, twice): a handoff must survive switching
// PI_CODING_AGENT_DIR, which only selects which CONFIG is live — so config follows piAgentDir(), the
// store does not.
export const storeDir = () => path.join(os.homedir(), ".pi", "agent", "handoffs");

export function canonicalCwd(cwd) {
	try {
		return fs.realpathSync.native(cwd);
	} catch {
		return path.resolve(cwd);
	}
}

export function storePathFor(canonical) {
	const key = process.platform === "win32" ? canonical.toLowerCase() : canonical;
	return path.join(storeDir(), `${crypto.createHash("sha256").update(key).digest("hex")}.md`);
}

/**
 * The adoption settings, USER SCOPE ONLY — one computation for the producer and the reader, so
 * both touch the same journal and look for the same objective file whatever their cwd:
 * - journal: user-scope `journal.path` when ABSOLUTE, else <pi's active agent dir>/nana-journal.jsonl
 *   (a project-scope override never captures this event; a relative path is never honoured for it);
 *   null when user scope sets `journal.enabled: false`.
 * - objectiveFile: user-scope `objective.projectFile` when a bare filename (lib/objective.ts
 *   isBareFileName), else OBJECTIVE.md.
 * Never throws: an absent / malformed nana-pack.json yields the defaults.
 */
export function adoptionSettings() {
	const agent = piAgentDir();
	let u = {};
	try {
		u = JSON.parse(fs.readFileSync(path.join(agent, "nana-pack.json"), "utf8")) ?? {};
	} catch {
		/* absent / unreadable / malformed: the defaults */
	}
	const j = u.journal, pf = u.objective?.projectFile;
	return {
		journal: j?.enabled === false ? null : typeof j?.path === "string" && path.isAbsolute(j.path) ? j.path : path.join(agent, "nana-journal.jsonl"),
		objectiveFile: typeof pf === "string" && pf !== "" && pf !== "." && pf !== ".." && !/[\\/]/.test(pf) ? pf : "OBJECTIVE.md",
	};
}

/** Nearest ancestor-or-self holding a `.git` entry — directory OR file (a linked worktree). null = none. */
export function repoRootOf(canon) {
	for (let dir = canon; ; dir = path.dirname(dir)) {
		if (present(path.join(dir, ".git"))) return dir;
		if (path.dirname(dir) === dir) return null;
	}
}

/** What the repository root itself shows — nothing outside it. */
export function rootState(root, objectiveFile = "OBJECTIVE.md") {
	return {
		handoff: present(storePathFor(root)),
		objective: present(path.join(root, objectiveFile)),
		agents: present(path.join(root, "AGENTS.md")),
		sessions: isDir(path.join(root, "docs", "sessions")),
		dismissed: present(path.join(root, MARKER)),
	};
}

export const isAdopted = (s) => s.handoff || s.objective || s.dismissed;

/**
 * The last TAIL_BYTES of `file` as whole lines (a line cut by the window is dropped). An ABSENT
 * journal is [] (nothing written yet); anything else that cannot be read — a directory, a
 * non-regular file, a permission error — THROWS, so "nothing open" never means "could not look".
 */
export function tailLines(file, bytes = TAIL_BYTES) {
	let fd;
	try {
		fd = fs.openSync(file, "r");
	} catch (e) {
		if (e?.code === "ENOENT") return [];
		throw e;
	}
	try {
		const st = fs.fstatSync(fd);
		if (!st.isFile()) throw Object.assign(new Error("not a regular file"), { code: "ENOTFILE" });
		const start = Math.max(0, st.size - bytes);
		const buf = Buffer.alloc(st.size - start);
		const n = fs.readSync(fd, buf, 0, buf.length, start);
		const lines = buf.subarray(0, n).toString("utf8").split("\n");
		if (start > 0) lines.shift();
		return lines.filter(Boolean);
	} finally {
		try {
			fs.closeSync(fd);
		} catch {
			/* already closed */
		}
	}
}

/** C0 controls, DEL, C1 controls and the Unicode line/paragraph separators — anything that can break a line. */
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
/** A root claim the reader may print: absolute, not the filesystem root, ≤ MAX_ROOT, no control character. */
export const printable = (p) => typeof p === "string" && path.isAbsolute(p) && path.dirname(p) !== p && p.length <= MAX_ROOT && !CONTROL.test(p);

/**
 * `directory_unadopted` reports newer than `sinceMs`, newest first, one per canonical root, plus
 * `dropped`: the number of distinct claims refused BEFORE anything is resolved — a cwd that is not
 * absolute, is the filesystem root, is longer than MAX_ROOT or holds a control character, or a ts
 * that is unparseable or in the future (beyond a 5-minute clock skew). A refused claim is never
 * canonicalised, re-checked or printed. `now` is injectable for tests.
 */
export function recentReports(lines, sinceMs, now = Date.now()) {
	const out = new Map();
	const bad = new Set();
	for (let i = lines.length - 1; i >= 0; i--) {
		if (!lines[i].includes(`"${EVENT}"`)) continue;
		let e;
		try {
			e = JSON.parse(lines[i]);
		} catch {
			continue;
		}
		if (e?.event !== EVENT) continue;
		const t = Date.parse(e.ts);
		const cwd = e.cwd;
		// Age first, THEN validate: a claim already outside the window is simply gone, and must not
		// keep a "not printable" count on screen for seven days (sol r2). A future timestamp is
		// refused outright — no clock-skew tolerance, since `t > now` cannot order anything.
		if (!(t > sinceMs) && !Number.isNaN(t)) continue;
		if (!printable(cwd) || Number.isNaN(t) || t > now) {
			bad.add(typeof cwd === "string" ? cwd.slice(0, MAX_ROOT + 1) : lines[i].slice(0, MAX_ROOT + 1));
			continue;
		}
		const root = canonicalCwd(cwd);
		if (!printable(root)) {
			bad.add(cwd);
			continue;
		}
		const ts = t;
		if (!(out.get(root) >= ts)) out.set(root, ts); // newest ts per root, whatever the line order
	}
	const reports = [...out].map(([root, ts]) => ({ root, ts })).sort((a, b) => b.ts - a.ts);
	return Object.assign(reports, { dropped: bad.size });
}
