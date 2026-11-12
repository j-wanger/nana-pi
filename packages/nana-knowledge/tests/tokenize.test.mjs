/**
 * @module packages/nana-knowledge/tests/tokenize.test.mjs
 * @purpose Pin tokenization and explicit FTS5 query construction.
 * @inputs lib/tokenize.ts
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects none
 * @errors a failed check prints FAIL and the run exits 1
 */
// Explicit query tokenization and FTS5 construction.
// Run: node packages/nana-knowledge/tests/tokenize.test.mjs
const { tokenize, meaningfulTokens, ftsQuery, STOPWORDS } =
	await import(new URL("../lib/tokenize.ts", import.meta.url).href);

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

check("tokenize lowercases and splits on non-alnum",
	JSON.stringify(tokenize("Pi-Review, ROUND #4!")) === JSON.stringify(["pi", "review", "round", "4"]));
check("tokenize keeps digits (version numbers matter)",
	tokenize("node 22.22 sqlite3").includes("22"));

check("stopwords dropped", !meaningfulTokens("what is the handoff").includes("the"));
check("short tokens dropped", !meaningfulTokens("pi is ok now").includes("is"));
check("3-char non-stopword kept", meaningfulTokens("the fts index").includes("fts"));
check("order preserved and deduped",
	JSON.stringify(meaningfulTokens("review round review cap")) === JSON.stringify(["review", "round", "cap"]));
check("stopword list is short enough to reason about", STOPWORDS.size < 120);

check("fts query ORs quoted tokens", ftsQuery(["pi", "review"]) === '"pi" OR "review"');
check("fts query empty for no tokens", ftsQuery([]) === "");

process.exit(fails);
