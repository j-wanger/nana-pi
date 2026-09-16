// Gate: the build is incremental on CONTENT HASH, not on mtime. Rebuilding 19k files
// every prompt-triggered background build would be the thing that makes this unusable.
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const td = fs.mkdtempSync(path.join(os.tmpdir(), "nk-build-"));
const home = path.join(td, "home");
const src = path.join(td, "src");
fs.mkdirSync(home, { recursive: true });
fs.mkdirSync(path.join(src, "node_modules", "pkg"), { recursive: true });
fs.mkdirSync(path.join(src, "sub"), { recursive: true });
process.env.NANA_KNOWLEDGE_HOME = home;

fs.writeFileSync(path.join(src, "one.md"), "# One\nalpha bravo charlie\n");
fs.writeFileSync(path.join(src, "sub", "two.md"), "# Two\ndelta echo foxtrot\n");
fs.writeFileSync(path.join(src, "sub", "notes.txt"), "not markdown\n");
fs.writeFileSync(path.join(src, "node_modules", "pkg", "readme.md"), "# Vendored\nshould not be indexed\n");
const big = path.join(src, "big.md");
fs.writeFileSync(big, "# Big\n" + "x".repeat(1024 * 1024 + 10));
const ledger = path.join(td, "led.md");
fs.writeFileSync(ledger, "- [uses:1] (ops) golf hotel. src: `r`\n- [uses:2] (spec) india juliet. src: `r`\n");
fs.writeFileSync(path.join(home, "sources.json"), JSON.stringify({
	roots: [
		{ path: src, kind: "articles" },
		{ path: ledger, kind: "ledger" },
		{ path: path.join(td, "gone"), kind: "articles" },
	],
}));

const { build } = await import(new URL("../lib/build.ts", import.meta.url).href);
const { openDb } = await import(new URL("../lib/db.ts", import.meta.url).href);
const { search } = await import(new URL("../lib/query.ts", import.meta.url).href);

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

const s1 = await build();
check("first build indexes both articles", s1.files === 3 && s1.reindexed === 3);
check("first build rows = 2 articles + 2 ledger entries", s1.rows === 4);
check("node_modules skipped", !JSON.stringify(s1).includes("node_modules"));
check("files > 1 MB skipped", s1.skippedLarge === 1);
check("missing root reported, not fatal", s1.missingRoots.length === 1);
check("per-root counts", s1.roots.find((r) => r.root === src).files === 2 && s1.roots.find((r) => r.root === ledger).rows === 2);

// mtime moves, content does not
const later = Date.now() / 1000 + 120;
fs.utimesSync(path.join(src, "one.md"), later, later);
const s2 = await build();
check("touch (mtime only) does NOT re-index", s2.reindexed === 0);
check("touch keeps the same row count", s2.rows === 4 && s2.unchanged === 3);

// unchanged files with unchanged mtime take the no-read fast path
const s3 = await build();
check("second no-op build re-indexes nothing", s3.reindexed === 0 && s3.unchanged === 3);

// real edit
fs.writeFileSync(path.join(src, "one.md"), "# One\nalpha bravo kilo lima\n");
const s4 = await build();
check("content change re-indexes exactly one file", s4.reindexed === 1 && s4.unchanged === 2);

let db = await openDb(path.join(home, "index.db"), {});
check("edited body is searchable", search(db, "kilo lima", 5).length === 1);
check("removed body is NOT searchable", search(db, "charlie", 5).length === 0);
check("no duplicate row for the re-indexed file",
	db.prepare("SELECT COUNT(*) AS n FROM docs WHERE path = ?").get(path.join(src, "one.md")).n === 1);
db.close();

// deletion
fs.rmSync(path.join(src, "sub", "two.md"));
const s5 = await build();
check("deleted file is removed from the index", s5.removed === 1 && s5.rows === 3);
db = await openDb(path.join(home, "index.db"), {});
check("deleted body is no longer searchable", search(db, "foxtrot", 5).length === 0);
db.close();

// --rebuild from scratch
const s6 = await build({ rebuild: true });
check("--rebuild re-indexes everything", s6.reindexed === 2 && s6.unchanged === 0 && s6.rows === 3);
check("build reports a db size", s6.dbBytes > 0);

// shown/ pruning happens on build
fs.mkdirSync(path.join(home, "shown"), { recursive: true });
const oldShown = path.join(home, "shown", "old.json");
const newShown = path.join(home, "shown", "new.json");
fs.writeFileSync(oldShown, "{}");
fs.writeFileSync(newShown, "{}");
const eightDaysAgo = Date.now() / 1000 - 8 * 86400;
fs.utimesSync(oldShown, eightDaysAgo, eightDaysAgo);
await build();
check("shown files older than 7 days pruned", !fs.existsSync(oldShown));
check("recent shown files kept", fs.existsSync(newShown));

fs.rmSync(td, { recursive: true, force: true });
process.exit(fails);
