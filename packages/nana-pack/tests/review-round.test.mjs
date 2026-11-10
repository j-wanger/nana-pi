/**
 * @module packages/nana-pack/tests/review-round.test.mjs
 * @purpose Pin canonical review items and the live legacy forwarder contract.
 * @inputs bin/review-round.mjs
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects none
 * @errors a failed check prints FAIL and the run exits 1; the helpers that must reject bad input are asserted to throw
 */
// Gate: the review ROUND CAP — pure rules (T2b fix round). A round is a distinct REVISION; the item
// slug is canonical; roundCapVerdict keeps its pre-T2b contract; roundFromOutPath survives only as
// a deprecated export for ~/nana-agent-loop's forwarder (its test's assertions are mirrored here).
// Process-level proofs: review-ledger.test.mjs. Run: node packages/nana-pack/tests/review-round.test.mjs
import { REVIEW_ROUND_CAP, roundFromOutPath, roundCapVerdict } from '../bin/review-round.mjs';
const { SLUG_MAX, canonicalItem } =
	await import(new URL("../bin/review-round.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
// req: R-730
check("legacy forwarder named imports preserve pure compatibility",
	REVIEW_ROUND_CAP === 3 && typeof roundFromOutPath === 'function' &&
	[null, undefined, 1, 3].every(round => roundCapVerdict(round) === 'allow') &&
	roundCapVerdict(4) === 'refuse' && roundCapVerdict(4, '   ') === 'refuse' &&
	roundCapVerdict(4, 'legacy reason') === 'override');
const throws = (f) => { try { f(); return false; } catch { return true; } };

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

process.exit(fails);
