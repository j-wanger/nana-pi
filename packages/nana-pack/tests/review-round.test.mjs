/**
 * @module packages/nana-pack/tests/review-round.test.mjs
 * @purpose Pins the review ROUND CAP as pure rules — a round is a distinct revision, the item slug is canonical, and the deprecated path helper keeps its contract
 * @inputs bin/review-round.mjs
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects none
 * @errors a failed check prints FAIL and the run exits 1; the helpers that must reject bad input are asserted to throw
 */
// Gate: the review ROUND CAP — pure rules (T2b fix round). A round is a distinct REVISION; the item
// slug is canonical; roundCapVerdict keeps its pre-T2b contract; roundFromOutPath survives only as
// a deprecated export for ~/nana-agent-loop's forwarder (its test's assertions are mirrored here).
// Process-level proofs: review-ledger.test.mjs. Run: node packages/nana-pack/tests/review-round.test.mjs
const { REVIEW_ROUND_CAP, SLUG_MAX, roundsUsed, roundCapVerdict, optValue, canonicalItem, roundFromOutPath } =
	await import(new URL("../bin/review-round.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
const v = (revision, role) => ({ revision, role });
const throws = (f) => { try { f(); return false; } catch { return true; } };

// req: R-719
check("cap is 3", REVIEW_ROUND_CAP === 3);
check("no verdicts, no rounds", roundsUsed([]) === 0);
// req: R-707
check("sol + astra on one revision = ONE round", roundsUsed([v("a", "sol"), v("a", "astra")]) === 1);
// req: R-707
check("ten roles on one revision = ONE round", roundsUsed(Array.from({ length: 10 }, (_, i) => v("a", "r" + i))) === 1);
check("the same role twice on one revision = ONE round (a revision, not a role count)", roundsUsed([v("a", "sol"), v("a", "sol")]) === 1);
// req: R-707
check("three revisions = three rounds", roundsUsed([v("a", "sol"), v("b", "sol"), v("c", "astra")]) === 3);

check("at the cap allowed", roundCapVerdict(REVIEW_ROUND_CAP, undefined) === "allow");
check("null round allowed (pre-T2b contract)", roundCapVerdict(null, "") === "allow");
// req: R-720
check("over cap without a reason refused", roundCapVerdict(REVIEW_ROUND_CAP + 1, undefined) === "refuse");
check("over cap with '' refused", roundCapVerdict(REVIEW_ROUND_CAP + 1, "") === "refuse");
check("over cap with '   ' refused (blank is no reason)", roundCapVerdict(REVIEW_ROUND_CAP + 1, "   ") === "refuse");
check("override only with a stated reason", roundCapVerdict(4, "worker rewrote the buffer path") === "override");

// req: R-704
check("slug: trim + casefold + collapse whitespace", canonicalItem("  Scope \t  ONE ") === "scope one");
check("slug: CaseItem ≡ caseitem", canonicalItem("CaseItem") === canonicalItem("caseitem"));
// req: R-704
check("slug: NFKC (fullwidth ≡ ascii)", canonicalItem("ｉｔｅｍ") === "item");
for (const bad of ["../item", "a/b", "a\\b", "..", "x..y", "", "   ", "a\u0000b", "x".repeat(SLUG_MAX + 1)]) {
	// req: R-704
	check(`slug ${JSON.stringify(bad.slice(0, 12))}${bad.length > 12 ? "…" : ""} rejected`, throws(() => canonicalItem(bad)));
}
// req: R-704
check(`slug bound is ${SLUG_MAX} (exactly ${SLUG_MAX} accepted)`, SLUG_MAX === 128 && canonicalItem("x".repeat(SLUG_MAX)).length === SLUG_MAX);

// deprecated export, pinned exactly as ~/nana-agent-loop/app/tests/review-round.test.ts pins it
// req: R-730
check("roundFromOutPath (deprecated) still reads both conventions",
	roundFromOutPath("/x/sol-r4.md") === 4 && roundFromOutPath("/x/brief-round-9.md") === 9 && roundFromOutPath("/x/astra-round-4-NO-GO.md") === 4 && roundFromOutPath("/x/review-astra-stagekey-r1.md") === 1);
// req: R-730
check("roundFromOutPath (deprecated) null cases unchanged",
	["/x/notes.md", "/x/pr12.md", "/x/r2026-summary.md", "/x/report-r4beta.md", "/x/round-4k-notes.md", "/reviews/round-4/notes.md"].every((p) => roundFromOutPath(p) === null));

check("absent option is undefined", optValue(["--out", "x"], "--item") === undefined);
check("--over-cap --retries: a flag is not a reason", throws(() => optValue(["--over-cap", "--retries", "2"], "--over-cap")));
check("--over-cap '   ': blank is not a reason", throws(() => optValue(["--over-cap", "   "], "--over-cap")));
check("--over-cap at the end: nothing is not a reason", throws(() => optValue(["--over-cap"], "--over-cap")));
// req: R-703
check("--item --role: a flag is not an item", throws(() => optValue(["--item", "--role", "sol"], "--item")));
check("a real reason passes, trimmed", optValue(["--over-cap", " instrumented X "], "--over-cap") === "instrumented X");

process.exit(fails);
