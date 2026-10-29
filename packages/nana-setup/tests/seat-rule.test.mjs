/**
 * @module packages/nana-setup/tests/seat-rule.test.mjs
 * @purpose Pins that the seat guide opens with exactly one scope sentence and carries each of its twelve rules exactly once, with no other bullet, numbered or not.
 * @inputs packages/nana-setup/claude/rules/nana-seat.md
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (reads the guide file)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; a missing guide file reads as empty text, so every check below fails
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const GUIDE = path.join(pkg, "claude", "rules", "nana-seat.md");
const ROOT = path.resolve(pkg, "..", "..");
const SHARED_WORKING = path.join(ROOT, "templates", "_shared", "working-under-nana-pi.md");

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra);
	if (!ok) fails++;
};

// The canonical scope sentence (CHANGE §3, R-1141's draft).
const SCOPE = "This rule is for the seat, the session that launches builders and reviewers; a session started as a builder or reviewer skips it.";

// The twelve bullets, each exactly once (CHANGE §3, R-1140's draft; this lane adds two question-handling rules).
// RULE_7's limit, two lanes building and one more in planning, is the owner's 2026-10-16 answer (seat-rule CHANGE §1).
const RULE_1 = "- In Claude Code, launch each builder or reviewer as a background task and end your turn. In pi, run it as one foreground command with no timeout.";
const RULE_2 = "- While a builder or reviewer runs, do not read or judge its partial output, transcript, diffs or test results. Do not re-run its checks before it ends.";
const RULE_3 = "- Leave a running builder or reviewer alone until its completion notification arrives or a monitor reports a failure or a stall. Then act in that turn.";
const RULE_4 = "- Verify once, when the build ends. Re-run the seat checks your brief names, read the builder's report, and look at every page or command output the change produces.";
const RULE_5 = "- In an install, hook or gate lane, re-run the lane's mutation runner after any change of your own to code or tests, before the review.";
const RULE_6 = "- Send findings on a build back in the next brief instead of fixing the builder's work yourself.";
const RULE_7 = "- Keep at most two lanes building and one more in planning, a nana default. A lane in planning has no build yet and no builder working in it. A lane counts as building from its first build until it lands or closes.";
const RULE_8 = "- The builder preamble holds the builder's rules and the review standard holds the reviewer's. Judge review findings by the review standard, and restate neither in a brief.";
const RULE_9 = "- Before you end your turn, name and start what waits on nothing else: another lane's build, a long mutation run in parts, separate research agents. Each lane's own steps stay in order.";
const RULE_10 = "- Run the full suite whole, never in parts. Never split a long run while a full suite runs on the same machine. If a check fails on a time limit, re-run it alone before you call it a failure.";
const RULE_11 = "- Post a plan's questions as one `ask` issue before the build. This is the one exception to one issue per question. Label it `blocking` when any question is `hard to undo`, else `optional`. A blocking issue's title ends with \"(default: go)\", meaning build on the listed defaults.";
const RULE_12 = "- A blocking build waits for the owner's answer; meanwhile the seat reports YOUR CALL and starts other lanes. An optional build starts on the defaults, and a differing answer goes in the next brief. A plan whose questions read `None.` posts nothing.";
const RULES = [RULE_1, RULE_2, RULE_3, RULE_4, RULE_5, RULE_6, RULE_9, RULE_11, RULE_12, RULE_10, RULE_7, RULE_8];

const raw = (() => { try { return fs.readFileSync(GUIDE, "utf8"); } catch { return ""; } })();
const text = raw.replace(/\r/g, "");
const lines = text.split("\n");
const firstBulletIndex = lines.findIndex((l) => l.startsWith("- "));
const prose = firstBulletIndex < 0 ? [] : lines.slice(1, firstBulletIndex).filter((l) => l.trim() !== "");
const sentenceEnders = (prose[0]?.match(/[.!?](?=\s|$)/g) ?? []).length;

// req: R-1141
check("seat guide scopes itself to the seat in one sentence before its first bullet", prose.length === 1 && prose[0] === SCOPE && sentenceEnders === 1, JSON.stringify(prose));

// A numbered item ("1." or "1)") counts as a bullet too.
const bullets = lines.filter((l) => /^\s*(?:[-*+]|\d{1,9}[.)])\s/.test(l));
// req: R-1140
check("seat guide holds no bullet beyond its twelve rules", bullets.length === RULES.length && bullets.every((b) => RULES.includes(b)), JSON.stringify(bullets));

// req: R-1140
check("seat guide carries: launch in the background and end the turn", lines.filter((l) => l === RULE_1).length === 1, JSON.stringify(lines.filter((l) => l === RULE_1)));
// req: R-1140
check("seat guide carries: no reading or judging partial work mid-run", lines.filter((l) => l === RULE_2).length === 1, JSON.stringify(lines.filter((l) => l === RULE_2)));
// req: R-1140
check("seat guide carries: act on completion or a monitor's failure or stall", lines.filter((l) => l === RULE_3).length === 1, JSON.stringify(lines.filter((l) => l === RULE_3)));
// req: R-1140
check("seat guide carries: verify once at the end", lines.filter((l) => l === RULE_4).length === 1, JSON.stringify(lines.filter((l) => l === RULE_4)));
// req: R-1140
check("seat guide carries: re-run the mutation runner only in an install, hook or gate lane, after the seat's own change, before the review", lines.filter((l) => l === RULE_5).length === 1, JSON.stringify(lines.filter((l) => l === RULE_5)));
// req: R-1140
check("R-1140: the seat guide reruns the mutation runner only in an install, hook or gate lane", lines.filter((l) => l === RULE_5).length === 1 && RULE_5.startsWith("- In an install, hook or gate lane, re-run"), JSON.stringify(lines.filter((l) => l === RULE_5)));
// req: R-1140
check("seat guide carries: findings back in the next brief", lines.filter((l) => l === RULE_6).length === 1, JSON.stringify(lines.filter((l) => l === RULE_6)));
// req: R-1140
check("seat guide carries: at most two lanes building and one in planning, each slot defined", lines.filter((l) => l === RULE_7).length === 1, JSON.stringify(lines.filter((l) => l === RULE_7)));
// req: R-1140
check("seat guide carries: name and start independent work before the turn ends, lane steps in order", lines.filter((l) => l === RULE_9).length === 1, JSON.stringify(lines.filter((l) => l === RULE_9)));
// req: R-1140
check("seat guide carries: full suite whole, no split beside a full suite, a time-limit failure re-run alone", lines.filter((l) => l === RULE_10).length === 1, JSON.stringify(lines.filter((l) => l === RULE_10)));
// req: R-1140
check("seat guide carries: preamble and review standard named, not restated", lines.filter((l) => l === RULE_8).length === 1, JSON.stringify(lines.filter((l) => l === RULE_8)));

{
	const guide = fs.readFileSync(GUIDE, "utf8");
	const sentence = "In pi, a seat starts another lane's build from another pi session or the desk; its own builds run in the foreground.";
	const shared = fs.readFileSync(SHARED_WORKING, "utf8");
	const agents = fs.readFileSync(path.join(ROOT, "AGENTS.md"), "utf8");
	const seatLine = shared.split("\n").find((line) => line.startsWith("- Seat guide:"));
	// req: R-3026
	check("pi seat guide explains parallel builds and the shared working pattern names both guide loaders", guide.split(sentence).length === 2 && seatLine?.includes("Claude Code loads it as a rule, and pi installs and injects the same guide for seat sessions") && agents.includes(seatLine), JSON.stringify({ seatLine, guideHasSentence: guide.includes(sentence), agentsHasLine: agents.includes(seatLine ?? "") }));
}

process.exit(fails ? 1 : 0);
