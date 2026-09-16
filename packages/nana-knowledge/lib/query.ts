// BM25 over title+body. Title is weighted up: a pointer is only useful if its handle
// tells you whether to open it.
import type { Db } from "./db.ts";
import { ftsQuery, meaningfulTokens } from "./tokenize.ts";
import { tildeify } from "./paths.ts";

export interface Hit {
	key: string;
	path: string;
	display: string;
	loc: number | null;
	kind: string;
	title: string;
	snippet: string;
	score: number;
}

export const SNIPPET_MAX = 160;

const SQL =
	"SELECT d.key, d.path, d.loc, d.kind, d.title," +
	" snippet(docs_fts, 1, '', '', '…', 22) AS snip," +
	" bm25(docs_fts, 4.0, 1.0) AS score" +
	" FROM docs_fts f JOIN docs d ON d.id = f.rowid" +
	" WHERE docs_fts MATCH ? ORDER BY f.rank LIMIT ?";

export function search(db: Db, text: string, limit: number): Hit[] {
	const tokens = meaningfulTokens(text);
	if (tokens.length === 0) return [];
	let rows: any[];
	try { rows = db.prepare(SQL).all(ftsQuery(tokens), limit); }
	catch { return []; }
	return rows.map((r) => ({
		key: r.key,
		path: r.path,
		display: tildeify(r.path) + (r.loc ? `:${r.loc}` : ""),
		loc: r.loc ?? null,
		kind: r.kind,
		title: clean(r.title, 90),
		snippet: clean(r.snip ?? "", SNIPPET_MAX),
		score: r.score,
	}));
}

function clean(s: string, max: number): string {
	const flat = String(s).replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
	return flat.length > max ? flat.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : flat;
}
