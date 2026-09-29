// BM25 over title+body. Title is weighted up: a pointer is only useful if its handle
// tells you whether to open it.
import type { Db } from "./db.ts";
import { ftsQuery, meaningfulTokens } from "./tokenize.ts";
import { tildeify } from "./paths.ts";
// nana-pack's ONE renderer for model-visible text (lane S2). A cross-package relative import,
// the shape apps/desk uses for nana-stage's sign.mjs: both packages ship in this one repo and
// one install, and a second copy of the escaping rule is exactly the drift S1 closed.
import { head, PATH_CAP, promptPath, promptText, str } from "../../nana-pack/lib/display.mjs";

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
export const TITLE_MAX = 90;
/** A rendered path plus its `:loc` suffix (":" and at most 16 digits of a safe integer). */
export const DISPLAY_MAX = PATH_CAP + 17;
/** The pointer line's field delimiter. It appears ONLY where hook.ts renderBlock puts it. */
export const FIELD_SEP = " — ";

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
				loc: r.loc ?? null,
				kind: r.kind,
				score: r.score,
				...renderFields({
					title: r.title,
					snippet: r.snip ?? "",
					// tildeify SHORTENS; promptPath RENDERS. The :loc suffix comes from the number, never a string.
					display: promptPath(tildeify(str(r.path))) + (Number.isSafeInteger(r.loc) && r.loc > 0 ? `:${r.loc}` : ""),
				}),
			});
		} catch { /* dropped */ }
	}
	return hits;
}

/** 16× the display cap: generous enough that the whitespace collapse below rarely loses words. */
const PRE_CAP = 16;
/** The delimiter and its look-alikes (em dash, horizontal bar, two/three-em dash), with any spacing around them. */
const SEP_LIKE = /\s*[\u2014\u2015\u2e3a\u2e3b]\s*/g;

/**
 * THE field renderer for a pointer line — search() and renderBlock() both call it, so a raw hit
 * and a searched hit get the same bounded fields. Every field is one line (promptText), capped,
 * and holds no delimiter: a dash that could read as FIELD_SEP becomes " - ". Idempotent on its
 * own output, so rendering a searched hit again changes nothing.
 */
export function renderFields(h: { title?: unknown; display?: unknown; snippet?: unknown }): { title: string; display: string; snippet: string } {
	return {
		title: clean(h.title, TITLE_MAX),
		// Already a rendered path: no whitespace collapse, no word cut — only one line, no delimiter, capped.
		display: head(promptText(h.display, DISPLAY_MAX * PRE_CAP).replace(SEP_LIKE, " - "), DISPLAY_MAX),
		snippet: clean(h.snippet, SNIPPET_MAX),
	};
}

/** promptText is the rule; collapsing whitespace and cutting on a word boundary is a display nicety on top. */
function clean(s: unknown, max: number): string {
	const flat = promptText(s, max * PRE_CAP).replace(SEP_LIKE, " - ").replace(/\s{2,}/g, " ").trim();
	return flat.length > max ? head(flat, max - 1).replace(/\s+\S*$/, "") + "…" : flat;
}
