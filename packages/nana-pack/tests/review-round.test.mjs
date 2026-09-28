// Gate: the review ROUND CAP — pure rules (T2b). The old file pinned the basename parse and its
// fail-OPEN ("notes.md has no round → uncapped", opus-review B2). That parse is GONE: the round is
// now counted from a per-item ledger (review-round.mjs); the process-level proofs are in
// review-ledger.test.mjs. Run: node packages/nana-pack/tests/review-round.test.mjs
const { REVIEW_ROUND_CAP, roundsUsed, roundCapVerdict, optValue } =
	await import(new URL("../bin/review-round.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
const v = (revision, role) => ({ revision, role });

check("cap is 3", REVIEW_ROUND_CAP === 3);
check("no verdicts, no rounds", roundsUsed([]) === 0);
check("sol + astra on one revision = ONE round", roundsUsed([v("a", "sol"), v("a", "astra")]) === 1);
check("scope+adversarial+compat on one revision = ONE round",
	roundsUsed([v("a", "scope"), v("a", "adversarial"), v("a", "compat")]) === 1);
check("same role twice on one revision = TWO rounds (no free re-review)", roundsUsed([v("a", "sol"), v("a", "sol")]) === 2);
check("a new revision resets nothing", roundsUsed([v("a", "sol"), v("b", "sol"), v("c", "sol")]) === 3);
check("mixed: a{sol×2,astra} b{astra} = 3", roundsUsed([v("a", "sol"), v("a", "sol"), v("a", "astra"), v("b", "astra")]) === 3);

check("at the cap allowed", roundCapVerdict(REVIEW_ROUND_CAP, undefined) === "allow");
check("over cap without a reason refused", roundCapVerdict(REVIEW_ROUND_CAP + 1, undefined) === "refuse");
check("override only with a stated reason", roundCapVerdict(4, "worker rewrote the buffer path") === "override");

const throws = (f) => { try { f(); return false; } catch { return true; } };
check("absent option is undefined", optValue(["--out", "x"], "--item") === undefined);
check("--over-cap --retries: a flag is not a reason", throws(() => optValue(["--over-cap", "--retries", "2"], "--over-cap")));
check("--over-cap '   ': blank is not a reason", throws(() => optValue(["--over-cap", "   "], "--over-cap")));
check("--over-cap at the end: nothing is not a reason", throws(() => optValue(["--over-cap"], "--over-cap")));
check("--item --role: a flag is not an item", throws(() => optValue(["--item", "--role", "sol"], "--item")));
check("a real reason passes, trimmed", optValue(["--over-cap", " instrumented X "], "--over-cap") === "instrumented X");

process.exit(fails);
