// Gate: a line-oriented ledger indexes as one row per ENTRY, not one row per file and
// not one row per physical line. Fixture mirrors loops/DOCTRINE.md exactly: a fenced
// contract block full of template lines, 3-physical-line entries, prose between sections.
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const { parseLedger, parseArticle, isEntryLine, articleTitle, splitFrontmatter } =
	await import(new URL("../lib/parse.ts", import.meta.url).href);

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

const FIXTURE = `# Doctrine ledger — propositions this program has proven

*Prose that mentions [uses:N] inline should not become a row.*

## Entry contract (curator-linted, advisory)

\`\`\`
- [uses:1] (spec) A template line inside a fence.
- [uses:N] (tag) Proposition — one sentence. src: \`<run-id>\`
- [uses:N] [pinned] (tag) ...
\`\`\`

- \`N\` is an integer ≥ 1; seed entries start at 1.

## Spec authoring

- [uses:4] [pinned] (spec) Spec the contract, not the design — lean specs with worker
  freedom beat design-prescribing specs on every measured axis (rounds, cost, review
  findings). src: memory \`project_leanspec_experiment\`
- [uses:2] (spec) Never REQUIRE a worker deletion in a describe. src: \`run-abc\`

## Ops

- [uses:1] (ops) A single-line entry. src: \`run-def\`
- a bullet with no uses marker at all
1. [uses:9] (meta) A numbered entry line. src: \`run-ghi\`
`;

const td = fs.mkdtempSync(path.join(os.tmpdir(), "nk-ledger-"));
const f = path.join(td, "DOCTRINE.md");
fs.writeFileSync(f, FIXTURE);

const rows = parseLedger(f, fs.readFileSync(f, "utf8"));

check("fenced template lines are not rows", rows.length === 4);
check("entry keys are unique", new Set(rows.map((r) => r.key)).size === rows.length);
check("key is path#Lnn", rows.every((r) => r.key === `${f}#L${r.loc}`));
check("all rows share the source path", rows.every((r) => r.path === f));

const multi = rows[0];
check("3-physical-line entry folds into one row", multi.body.includes("freedom beat") && multi.body.includes("findings). src:"));
check("continuation lines are joined with a space", !/\n/.test(multi.body));
check("loc points at the entry's FIRST line", FIXTURE.split("\n")[multi.loc - 1].startsWith("- [uses:4]"));
check("title strips uses/pinned/tag bookkeeping", multi.title.startsWith("doctrine(spec): Spec the contract"));
check("title is bounded", rows.every((r) => r.title.length <= 130));

check("numbered entry line is a row", rows.some((r) => r.body.startsWith("1. [uses:9]")));
check("bullet without [uses:] is not a row", !rows.some((r) => r.body.includes("no uses marker")));
check("inline prose mention is not a row", !rows.some((r) => r.body.includes("should not become a row")));

check("isEntryLine: dash + uses", isEntryLine("- [uses:2] (ops) x"));
check("isEntryLine: digit + uses", isEntryLine("12. [uses:2] (ops) x"));
check("isEntryLine: dash without uses", !isEntryLine("- plain bullet"));
check("isEntryLine: indented continuation", !isEntryLine("  freedom beat design-prescribing"));

// --- the real DOCTRINE.md, when it is on this machine ---
const REAL = path.join(os.homedir(), "nana-agent-loop/loops/DOCTRINE.md");
if (fs.existsSync(REAL)) {
	const real = parseLedger(REAL, fs.readFileSync(REAL, "utf8"));
	const rawMarkers = (fs.readFileSync(REAL, "utf8").match(/^(?:[-*] |\d)[^\n]*\[uses:/gm) || []).length;
	check(`real DOCTRINE parses to >80 entries (got ${real.length})`, real.length > 80);
	check("real DOCTRINE: fewer rows than raw marker lines (fence lines excluded)", real.length < rawMarkers);
	check("real DOCTRINE: every row has a body", real.every((r) => r.body.length > 20));
} else {
	console.log("SKIP real DOCTRINE.md not present");
}

// --- articles ---
const a = path.join(td, "a.md");
fs.writeFileSync(a, "---\ntitle: From Frontmatter\n---\n# An H1\nbody text\n");
check("frontmatter title wins", parseArticle(a, fs.readFileSync(a, "utf8"))[0].title === "From Frontmatter");
check("frontmatter stripped from body", !parseArticle(a, fs.readFileSync(a, "utf8"))[0].body.includes("title:"));
check("H1 used when no frontmatter", articleTitle(a, {}, "# An H1\nbody") === "An H1");
check("filename used when neither", articleTitle(path.join(td, "some-doc.md"), {}, "body") === "some doc");
check("splitFrontmatter no-op without fence", splitFrontmatter("# x").body === "# x");

fs.rmSync(td, { recursive: true, force: true });
process.exit(fails);
