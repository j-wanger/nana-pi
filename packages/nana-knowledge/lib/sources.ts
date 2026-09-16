// sources.json: the only knob. { "roots": [{ "path": "...", "kind": "articles"|"ledger" }] }
// Missing roots are skipped silently at build time — a store can be deleted or a repo
// moved without breaking the pull.
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { paths } from "./paths.ts";

export type Kind = "articles" | "ledger";
export interface Root { path: string; kind: Kind }

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

/** Read sources.json, creating it from the seed when absent. Never throws on bad JSON. */
export function loadRoots(): Root[] {
	const file = paths.sources;
	try {
		const raw = JSON.parse(fs.readFileSync(file, "utf8"));
		const roots = Array.isArray(raw?.roots) ? raw.roots : [];
		return roots
			.filter((r: unknown): r is Root =>
				!!r && typeof (r as Root).path === "string" &&
				((r as Root).kind === "articles" || (r as Root).kind === "ledger"))
			.map((r: Root) => ({ path: path.resolve(r.path.replace(/^~(?=\/|$)/, os.homedir())), kind: r.kind }));
	} catch (err) {
		if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") return [];
		const roots = seedRoots();
		try {
			fs.mkdirSync(path.dirname(file), { recursive: true });
			fs.writeFileSync(file, JSON.stringify({ roots }, null, 2) + "\n");
		} catch { /* read-only home: run with what we derived */ }
		return roots;
	}
}
