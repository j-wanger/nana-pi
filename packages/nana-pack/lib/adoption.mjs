// Directory adoption (lane L5) — the one predicate shared by the producer (extensions/nana-handoff.ts,
// which journals `directory_unadopted`) and the reader (bin/nana-adoption.mjs, the seat's
// `[nana:adoption]` session-start block). Plain .mjs on purpose: the reader imports no .ts, so its
// hook has no Node floor of its own. Never throws; never walks a filesystem looking for candidates —
// it only ever inspects a directory it is handed and that directory's ancestors (for `.git`).
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export const EVENT = "directory_unadopted";
/** Committed at the repository root by `nana-setup project <dir> --not-a-project`. */
export const MARKER = ".nana-not-a-project";
/** The journal is append-only and never rotated: read at most this much of its end. */
export const TAIL_BYTES = 256 * 1024;

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

export function canonical(p) {
	try {
		return fs.realpathSync.native(p);
	} catch {
		return path.resolve(p);
	}
}

/** MUST equal extensions/nana-handoff.ts `storePathFor` (asserted by tests/adoption-producer.test.mjs). */
export function storeEntryFor(canon) {
	const key = process.platform === "win32" ? canon.toLowerCase() : canon;
	return path.join(os.homedir(), ".pi", "agent", "handoffs", `${crypto.createHash("sha256").update(key).digest("hex")}.md`);
}

/** Nearest ancestor-or-self holding a `.git` entry — directory OR file (a linked worktree). null = none. */
export function repoRootOf(canon) {
	for (let dir = canon; ; dir = path.dirname(dir)) {
		if (present(path.join(dir, ".git"))) return dir;
		if (path.dirname(dir) === dir) return null;
	}
}

/** What the repository root itself shows — nothing outside it. */
export function rootState(root, storeEntry = storeEntryFor(root)) {
	return {
		handoff: present(storeEntry),
		objective: present(path.join(root, "OBJECTIVE.md")),
		agents: present(path.join(root, "AGENTS.md")),
		sessions: isDir(path.join(root, "docs", "sessions")),
		dismissed: present(path.join(root, MARKER)),
	};
}

export const isAdopted = (s) => s.handoff || s.objective || s.dismissed;

/** The last TAIL_BYTES of `file` as whole lines (a line cut by the window is dropped). [] on any failure. */
export function tailLines(file, bytes = TAIL_BYTES) {
	let fd;
	try {
		fd = fs.openSync(file, "r");
		const size = fs.fstatSync(fd).size;
		const start = Math.max(0, size - bytes);
		const buf = Buffer.alloc(size - start);
		const n = fs.readSync(fd, buf, 0, buf.length, start);
		const lines = buf.subarray(0, n).toString("utf8").split("\n");
		if (start > 0) lines.shift();
		return lines.filter(Boolean);
	} catch {
		return [];
	} finally {
		if (fd !== undefined) {
			try {
				fs.closeSync(fd);
			} catch {
				/* already closed */
			}
		}
	}
}

/** `directory_unadopted` reports newer than `sinceMs`, newest first, one per canonical root. */
export function recentReports(lines, sinceMs) {
	const out = new Map();
	for (let i = lines.length - 1; i >= 0; i--) {
		if (!lines[i].includes(`"${EVENT}"`)) continue;
		let e;
		try {
			e = JSON.parse(lines[i]);
		} catch {
			continue;
		}
		const t = Date.parse(e?.ts);
		if (e?.event !== EVENT || typeof e.cwd !== "string" || !(t > sinceMs)) continue;
		const root = canonical(e.cwd);
		if (!(out.get(root) >= t)) out.set(root, t); // newest ts per root, whatever the line order
	}
	return [...out].map(([root, ts]) => ({ root, ts })).sort((a, b) => b.ts - a.ts);
}
