/**
 * @module packages/nana-knowledge/lib/query.ts
 * @purpose BM25 search over the index, rendered as the bounded pointer fields a prompt can carry safely.
 * @inputs an open Db handle, the query text, and a row limit
 * @outputs Hit records {key, path, display, loc, kind, title, snippet, score} whose every field is one
 *  line, capped (TITLE_MAX / DISPLAY_MAX / SNIPPET_MAX) and free of the literal FIELD_SEP, the display path
 *  exact or reversibly JSON-escaped
 * @effects database (one SELECT over docs_fts joined to docs)
 * @errors database prepare/query errors are thrown to the caller; a row that cannot be rendered loses only
 *  its own pointer
 */
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

/** D6 monthly-archive path pattern (2026-10-06, L7-01; R-239). */
export const MONTHLY_SESSION_ARCHIVE_GLOB = "*/sessions/[0-9][0-9][0-9][0-9]-[0-9][0-9].md";

const SQL =
	"SELECT d.key, d.path, d.loc, d.kind, d.title," +
	" snippet(docs_fts, 1, '', '', '…', 22) AS snip," +
	" bm25(docs_fts, 4.0, 1.0) AS score" +
	" FROM docs_fts f JOIN docs d ON d.id = f.rowid" +
	" WHERE docs_fts MATCH ?" +
	" ORDER BY f.rank LIMIT ?";

const SQL_WITHOUT_MONTHLY_ARCHIVES =
	"SELECT d.key, d.path, d.loc, d.kind, d.title," +
	" snippet(docs_fts, 1, '', '', '…', 22) AS snip," +
	" bm25(docs_fts, 4.0, 1.0) AS score" +
	" FROM docs_fts f JOIN docs d ON d.id = f.rowid" +
	" WHERE docs_fts MATCH ? AND replace(d.path, char(92), '/') NOT GLOB ?" +
	" ORDER BY f.rank LIMIT ?";

export function search(db: Db, text: string, limit: number, options: { excludeMonthlySessionArchives?: boolean } = {}): Hit[] {
	const tokens = meaningfulTokens(text);
	if (tokens.length === 0) return [];
	const sql = options.excludeMonthlySessionArchives ? SQL_WITHOUT_MONTHLY_ARCHIVES : SQL;
	const rows: any[] = options.excludeMonthlySessionArchives
		? db.prepare(sql).all(ftsQuery(tokens), MONTHLY_SESSION_ARCHIVE_GLOB, limit)
		: db.prepare(sql).all(ftsQuery(tokens), limit);
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
					// tildeify SHORTENS; pointerPath RENDERS. The :loc suffix comes from the number, never a string.
					display: pointerPath(tildeify(str(r.path))) + (Number.isSafeInteger(r.loc) && r.loc > 0 ? `:${r.loc}` : ""),
				}),
			});
		} catch { /* dropped */ }
	}
	return hits;
}

/** 16× the display cap: generous enough that the whitespace collapse below rarely loses words. */
const PRE_CAP = 16;
/** The delimiter's dash. */
const DASH = "\u2014";

/**
 * A path as a pointer's display field. A path is an ADDRESS, so it is never substituted: when its
 * rendering would hold the exact FIELD_SEP, promptPath escapes the separator's dash as \u2014 along
 * with its own unsafe class, and returns the JSON-literal form. Exact and reversible —
 * JSON.parse gives the path back, unless it was elided, which the "…" marks — and free of the
 * literal separator. The `extra` argument is displayPath's additive escape set (S2: it replaced a
 * stand-in-character trick, which had a path shape it could not render at all).
 */
export function pointerPath(p: unknown): string {
	const plain = promptPath(p);
	return plain.includes(FIELD_SEP) ? promptPath(p, DASH) : plain;
}

/**
 * THE field renderer for a pointer line — search() and renderBlock() both call it, so a raw hit
 * and a searched hit get the same bounded fields. The invariant is ONE sentence: the exact
 * FIELD_SEP never appears inside a rendered field. Every field is one line (promptText) and capped;
 * the display field is exact or reversibly escaped (pointerPath); in the prose fields (title,
 * snippet) an exact FIELD_SEP becomes " - ", which is readability, not the guarantee. Look-alike
 * dashes (en dash, minus, horizontal bar …) are NOT touched: they can visually mislead a reader,
 * and the block header already frames every field as data. Idempotent on its own output.
 */
export function renderFields(h: { title?: unknown; display?: unknown; snippet?: unknown }): { title: string; display: string; snippet: string } {
	// Already a rendered path: no whitespace collapse, no word cut, no substitution — only one line, capped.
	const d = promptText(h.display, DISPLAY_MAX * PRE_CAP);
	return {
		title: clean(h.title, TITLE_MAX),
		display: head(d.includes(FIELD_SEP) ? pointerPath(h.display) : d, DISPLAY_MAX),
		snippet: clean(h.snippet, SNIPPET_MAX),
	};
}

/** promptText is the rule; collapsing whitespace (BEFORE the substitution, so it cannot form a separator) and cutting on a word boundary are display niceties. */
function clean(s: unknown, max: number): string {
	const flat = promptText(s, max * PRE_CAP).replace(/\s{2,}/g, " ").replaceAll(FIELD_SEP, " - ").trim();
	return flat.length > max ? head(flat, max - 1).replace(/\s+\S*$/, "") + "…" : flat;
}
