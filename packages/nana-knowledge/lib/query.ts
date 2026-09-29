// BM25 over title+body. Title is weighted up: a pointer is only useful if its handle
// tells you whether to open it.
import type { Db } from "./db.ts";
import { ftsQuery, meaningfulTokens } from "./tokenize.ts";
import { tildeify } from "./paths.ts";
// nana-pack's ONE renderer for model-visible text (lane S2). A cross-package relative import,
// the shape apps/desk uses for nana-stage's sign.mjs: both packages ship in this one repo and
// one install, and a second copy of the escaping rule is exactly the drift S1 closed.
import { head, promptPath, promptText, str } from "../../nana-pack/lib/display.mjs";

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
	const hits: Hit[] = [];
	// A row that cannot be rendered costs its pointer, never the search.
	for (const r of rows) {
		try {
			hits.push({
				key: r.key,
				path: r.path,
				// tildeify SHORTENS; promptPath RENDERS. The :loc suffix comes from the number, never a string.
				display: promptPath(tildeify(str(r.path))) + (Number.isSafeInteger(r.loc) && r.loc > 0 ? `:${r.loc}` : ""),
				loc: r.loc ?? null,
				kind: r.kind,
				title: clean(r.title, 90),
				snippet: clean(r.snip ?? "", SNIPPET_MAX),
				score: r.score,
			});
		} catch { /* dropped */ }
	}
	return hits;
}

/** 16× the display cap: generous enough that the whitespace collapse below rarely loses words. */
const PRE_CAP = 16;

/** promptText is the rule; collapsing whitespace and cutting on a word boundary is a display nicety on top. */
function clean(s: unknown, max: number): string {
	const flat = promptText(s, max * PRE_CAP).replace(/\s{2,}/g, " ").trim();
	return flat.length > max ? head(flat, max - 1).replace(/\s+\S*$/, "") + "…" : flat;
}
