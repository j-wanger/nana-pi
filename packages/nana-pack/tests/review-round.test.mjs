// Gate: the review ROUND CAP. Names are the REAL corpus conventions under
// ~/nana-pi/docs/reviews/*/ (sol r1 finding F: the first regex missed `round-N`).
// Run: node packages/nana-pack/tests/review-round.test.mjs
const { REVIEW_ROUND_CAP, roundFromOutPath, roundCapVerdict } =
	await import(new URL("../bin/review-round.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

// roundFromOutPath — both corpus conventions
check("sol-r4.md is round 4", roundFromOutPath("/x/sol-r4.md") === 4);
check("r1.md is round 1", roundFromOutPath("/x/r1.md") === 1);
check("edge-r3.md is round 3", roundFromOutPath("/x/edge-r3.md") === 3);
check("brief-round-9.md is round 9", roundFromOutPath("/x/brief-round-9.md") === 9);
check("astra-round-4-NO-GO.md is round 4", roundFromOutPath("/x/astra-round-4-NO-GO.md") === 4);
check("build-round-10.md is round 10", roundFromOutPath("/x/build-round-10.md") === 10);
check("fable-round-7-GO.md is round 7", roundFromOutPath("/x/fable-round-7-GO.md") === 7);
check("review-astra-stagekey-r1.md is round 1", roundFromOutPath("/x/review-astra-stagekey-r1.md") === 1);

// roundFromOutPath — not inferable (fail OPEN on naming: no round means no cap)
check("notes.md has no round", roundFromOutPath("/x/notes.md") === null);
check("pr12.md is not a round", roundFromOutPath("/x/pr12.md") === null);
check("r2026-summary.md is not a round", roundFromOutPath("/x/r2026-summary.md") === null);
check("adjudication.md has no round", roundFromOutPath("/x/adjudication.md") === null);
// sol r2 F: a trailing LETTER is not a round boundary either
check("report-r4beta.md is not a round", roundFromOutPath("/x/report-r4beta.md") === null);
check("round-4k-notes.md is not a round", roundFromOutPath("/x/round-4k-notes.md") === null);

check("basename only — a round token in a parent dir never counts",
	roundFromOutPath("/reviews/round-4/notes.md") === null);

// roundCapVerdict
check("unnumbered file allowed", roundCapVerdict(null, "") === "allow");
check("at the cap allowed", roundCapVerdict(REVIEW_ROUND_CAP, "") === "allow");
check("over cap without a reason refused", roundCapVerdict(REVIEW_ROUND_CAP + 1, "") === "refuse");
check("blank reason is no reason", roundCapVerdict(REVIEW_ROUND_CAP + 1, "   ") === "refuse");
check("missing reason refused", roundCapVerdict(REVIEW_ROUND_CAP + 1, undefined) === "refuse");
check("override only with a stated reason",
	roundCapVerdict(4, "worker rewrote the buffer path") === "override");

process.exit(fails);
