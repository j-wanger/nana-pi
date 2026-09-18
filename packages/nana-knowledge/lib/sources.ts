// sources.json: the only knob. { "roots": [{ "path": "...", "kind": "articles"|"ledger" }] }
// Missing roots are skipped silently at build time — a store can be deleted or a repo
// moved without breaking the pull.
//
// Optional `discover` block: roots BY CONVENTION, so a new repo is indexed without anyone
// editing this file. { "parents": ["~"], "subdirs": ["docs","research","knowledge"],
// "exclude": ["node_modules","raw","reviews"] } — every immediate child of a parent that
// holds a .git entry is a repo, and each listed subdir it has becomes an `articles` root.
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { paths } from "./paths.ts";

export type Kind = "articles" | "ledger";
export interface Root { path: string; kind: Kind; discovered?: boolean }

export interface Discover {
	/** Directories whose immediate children are candidate repos. `~` is expanded. */
	parents: string[];
	/** Subdirectories of a repo that hold knowledge. */
	subdirs: string[];
	/** Directory NAMES that are never knowledge (see SKIP_DIRS). */
	exclude: string[];
}

/** Written into a FRESHLY seeded sources.json. An existing file is never rewritten:
 *  discovery is opt-in, by editing the file. */
export const DEFAULT_DISCOVER: Discover = {
	parents: ["~"],
	subdirs: ["docs", "research", "knowledge"],
	exclude: ["node_modules", "raw", "reviews"],
};

/**
 * Directory names that are never knowledge, skipped as PATH COMPONENTS wherever we walk or
 * discover — one mechanism for both.
 *   - raw/ is the wiki convention for unprocessed scrapes; the CURATED articles are the wiki.
 *   - review corpora are process artifacts, not knowledge — they dominated 2 of the first 3
 *     real queries with reviewer prose about code that has since changed.
 */
export const SKIP_DIRS = new Set(["node_modules", ".git", "raw", "reviews"]);

/** SKIP_DIRS plus whatever the owner listed in `discover.exclude`. */
export function skipNames(exclude: readonly string[] = []): Set<string> {
	return exclude.length ? new Set([...SKIP_DIRS, ...exclude]) : SKIP_DIRS;
}

/** `~`-expanded, absolute. */
function expand(p: string): string {
	return path.resolve(p.replace(/^~(?=\/|$)/, os.homedir()));
}

/** The stores that exist on this machine today. Discovery (the wikis) runs once, at seed. */
export function seedRoots(): Root[] {
	const h = os.homedir();
	const literal: Root[] = [
		{ path: path.join(h, "nana-agent-loop/research/knowledge"), kind: "articles" },
		{ path: path.join(h, "nana-agent-loop/loops/DOCTRINE.md"), kind: "ledger" },
		{ path: path.join(h, "nana-agent-loop/docs"), kind: "articles" },
		{ path: path.join(h, "nana-pi/docs"), kind: "articles" },
		{ path: path.join(h, "nana-pi/research"), kind: "articles" },
		{ path: path.join(h, "the-hive/docs/research"), kind: "articles" },
		{ path: path.join(h, "toy-battle/research"), kind: "articles" },
		{ path: path.join(h, "fate/knowledge"), kind: "articles" },
	];
	const wikiParent = path.join(h, "private-knowledge");
	let wikis: Root[] = [];
	try {
		wikis = fs.readdirSync(wikiParent, { withFileTypes: true })
			.filter((d) => d.isDirectory() && d.name.endsWith("-wiki"))
			.map((d) => ({ path: path.join(wikiParent, d.name), kind: "articles" as const }))
			.sort((a, b) => a.path.localeCompare(b.path));
	} catch { /* no wiki parent on this machine */ }
	return [...literal, ...wikis].filter((r) => fs.existsSync(r.path));
}

/**
 * Roots by convention. A repo is an immediate child directory of a parent holding a `.git`
 * entry (a directory, or the FILE a git worktree gets); each configured subdir that exists
 * under it is an `articles` root. A missing parent is skipped silently — laptops differ.
 */
export function discoverRoots(d: Discover): Root[] {
	const skip = skipNames(d.exclude);
	const out: Root[] = [];
	for (const parent of d.parents) {
		const dir = expand(parent);
		let entries: fs.Dirent[];
		try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
		for (const e of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
			// Symlinked children are skipped, exactly as the index walk skips symlinks.
			if (!e.isDirectory() || skip.has(e.name)) continue;
			const repo = path.join(dir, e.name);
			if (!fs.existsSync(path.join(repo, ".git"))) continue;
			for (const sub of d.subdirs) {
				if (skip.has(sub)) continue;
				const p = path.join(repo, sub);
				try { if (fs.statSync(p).isDirectory()) out.push({ path: p, kind: "articles", discovered: true }); }
				catch { /* not there: this repo just does not have that subdir */ }
			}
		}
	}
	return out;
}

function stringList(v: unknown, fallback: string[]): string[] {
	return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : fallback;
}

/** The `discover` block, or null when the file does not opt in. */
function parseDiscover(raw: unknown): Discover | null {
	const d = (raw as { discover?: unknown } | null)?.discover;
	if (!d || typeof d !== "object" || Array.isArray(d)) return null;
	const o = d as Record<string, unknown>;
	return {
		parents: stringList(o.parents, []),
		subdirs: stringList(o.subdirs, DEFAULT_DISCOVER.subdirs),
		exclude: stringList(o.exclude, DEFAULT_DISCOVER.exclude),
	};
}

export interface Sources {
	/** Explicit roots first, then discovered ones; deduped by resolved path. */
	roots: Root[];
	/** Extra directory names to skip, from `discover.exclude` (empty when not configured). */
	exclude: string[];
}

/** Read sources.json, creating it from the seed when absent. Never throws on bad JSON. */
export function loadSources(): Sources {
	const file = paths.sources;
	let raw: unknown;
	try {
		raw = JSON.parse(fs.readFileSync(file, "utf8"));
	} catch (err) {
		if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") return { roots: [], exclude: [] };
		// First run: seed the literal stores AND the discover block, so a repo added later
		// is picked up without anyone editing the file.
		const roots = seedRoots();
		try {
			fs.mkdirSync(path.dirname(file), { recursive: true });
			fs.writeFileSync(file, JSON.stringify({ roots, discover: DEFAULT_DISCOVER }, null, 2) + "\n");
		} catch { /* read-only home: run with what we derived */ }
		return union(roots, discoverRoots(DEFAULT_DISCOVER), DEFAULT_DISCOVER.exclude);
	}
	const listed = Array.isArray((raw as { roots?: unknown })?.roots) ? (raw as { roots: unknown[] }).roots : [];
	const explicit: Root[] = listed
		.filter((r: unknown): r is Root =>
			!!r && typeof (r as Root).path === "string" &&
			((r as Root).kind === "articles" || (r as Root).kind === "ledger"))
		.map((r: Root) => ({ path: expand(r.path), kind: r.kind }));
	const d = parseDiscover(raw);
	return union(explicit, d ? discoverRoots(d) : [], d?.exclude ?? []);
}

/** Is `p` inside `root`, or the same path? Compared with a separator boundary, so
 *  `…/repoF/doc` does not contain `…/repoF/docs`. */
function contains(root: string, p: string): boolean {
	return p === root || p.startsWith(root.endsWith(path.sep) ? root : root + path.sep);
}

/**
 * Explicit roots win: a discovered path already listed keeps its configured kind.
 *
 * Roots must also never NEST. `docs.key` is the file path, so a file reached through two
 * roots is inserted twice in one build and the UNIQUE constraint kills the whole build —
 * measured the first time discovery ran for real, where the seeded explicit root
 * `~/nana-agent-loop/research/knowledge` sits inside the discovered `~/nana-agent-loop/research`.
 * So a discovered root is dropped when it is an ancestor OR a descendant of an explicit one
 * (the explicit root's scope is what was indexed before discovery existed, and stays), and
 * between two discovered roots the ancestor is kept — it already covers the other.
 */
function union(explicit: Root[], discovered: Root[], exclude: string[]): Sources {
	const seen = new Set<string>();
	const roots: Root[] = [];
	for (const r of explicit) {
		if (seen.has(r.path)) continue;
		seen.add(r.path);
		roots.push(r);
	}
	const kept: Root[] = [];
	for (const d of discovered) {
		if (seen.has(d.path)) continue;
		seen.add(d.path);
		if (roots.some((e) => contains(e.path, d.path) || contains(d.path, e.path))) continue;
		if (kept.some((k) => contains(k.path, d.path))) continue;
		for (let i = kept.length - 1; i >= 0; i--) if (contains(d.path, kept[i].path)) kept.splice(i, 1);
		kept.push(d);
	}
	return { roots: [...roots, ...kept], exclude };
}

/** Roots only — the shape every caller but the builder wants. */
export function loadRoots(): Root[] {
	return loadSources().roots;
}
