/**
 * @module packages/nana-knowledge/tests/tokenize.test.mjs
 * @purpose Pins what the prompt hook decides to search on and what it refuses to search on at all
 * @inputs lib/tokenize.ts
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects none
 * @errors a failed check prints FAIL and the run exits 1
 */
// Gate: what the hook decides to search on, and what it refuses to search on at all.
// Run: node packages/nana-knowledge/tests/tokenize.test.mjs
const { tokenize, meaningfulTokens, skipReason, ftsQuery, STOPWORDS } =
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

check("skip: under 12 chars", skipReason("fix this") === "too-short");
check("skip: exactly 11 chars", skipReason("12345678901") === "too-short");
check("no skip: 12 chars with 2 tokens", skipReason("review rounds") === null);
check("skip: slash command", skipReason("/compact now please explain") === "slash-command");
check("skip: slash command after trim", skipReason("   /loop-init start here") === "slash-command");
// req: R-226
check("skip: fewer than 2 meaningful tokens",
	skipReason("the the the and and for you") === "too-few-tokens");
check("skip: one long token among stopwords",
	skipReason("what about the compaction") === "too-few-tokens");
check("skip: non-string prompt", skipReason(undefined) === "not-a-string");
check("no skip: real prompt", skipReason("how does pi handle context compaction") === null);

check("fts query ORs quoted tokens", ftsQuery(["pi", "review"]) === '"pi" OR "review"');
check("fts query empty for no tokens", ftsQuery([]) === "");

process.exit(fails);
