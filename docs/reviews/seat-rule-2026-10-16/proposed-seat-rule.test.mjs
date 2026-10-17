/**
 * @module packages/nana-setup/tests/seat-rule.test.mjs
 * @purpose Pins that the seat guide opens with exactly one scope sentence and carries each of its nine rules exactly once, with no other bullet.
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

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra);
	if (!ok) fails++;
};

// The canonical scope sentence (CHANGE §3, R-1141's draft).
const SCOPE = "This rule is for the seat, the session that launches builders and reviewers; a session started as a builder or reviewer skips it.";

// The nine bullets, each exactly once (CHANGE §3, R-1140's draft; seat-rule CHANGE §3 rewords RULE_7 and adds RULE_9, which sits between RULE_6 and RULE_7 in the file).
const RULE_1 = "- In Claude Code, launch each builder or reviewer as a background task and end your turn. In pi, run it as one foreground command with no timeout.";
const RULE_2 = "- While a builder or reviewer runs, do not read or judge its partial output, transcript, diffs or test results. Do not re-run its checks before it ends.";
const RULE_3 = "- Leave a running builder or reviewer alone until its completion notification arrives or a monitor reports a failure or a stall. Then act in that turn.";
const RULE_4 = "- Verify once, when the build ends. Re-run the seat checks your brief names, read the builder's report, and look at every page or command output the change produces.";
const RULE_5 = "- After any change of your own to code or tests, re-run the lane's mutation runner before the review.";
const RULE_6 = "- Send findings on a build back in the next brief instead of fixing the builder's work yourself.";
const RULE_7 = "- Keep at most two lanes building and one more in planning, a nana default. A lane counts as building from its first build until it lands or closes.";
const RULE_8 = "- The builder preamble holds the builder's rules and the review standard holds the reviewer's. Judge review findings by the review standard, and restate neither in a brief.";
const RULE_9 = "- At each step, name what waits on nothing else and start it now: another lane's build, a long mutation run in parts, separate research agents. Keep each lane's own steps in order: plan, seat checks, build, verify, review, land. Run the full suite whole, never in parts.";
const RULES = [RULE_1, RULE_2, RULE_3, RULE_4, RULE_5, RULE_6, RULE_7, RULE_8, RULE_9];

const raw = (() => { try { return fs.readFileSync(GUIDE, "utf8"); } catch { return ""; } })();
const text = raw.replace(/\r/g, "");
const lines = text.split("\n");
const firstBulletIndex = lines.findIndex((l) => l.startsWith("- "));
const prose = firstBulletIndex < 0 ? [] : lines.slice(1, firstBulletIndex).filter((l) => l.trim() !== "");
const sentenceEnders = (prose[0]?.match(/[.!?](?=\s|$)/g) ?? []).length;

// req: R-1141
check("seat guide scopes itself to the seat in one sentence before its first bullet", prose.length === 1 && prose[0] === SCOPE && sentenceEnders === 1, JSON.stringify(prose));

const bullets = lines.filter((l) => /^\s*[-*+]\s/.test(l));
// req: R-1140
check("seat guide holds no bullet beyond its nine rules", bullets.length === RULES.length && bullets.every((b) => RULES.includes(b)), JSON.stringify(bullets));

// req: R-1140
check("seat guide carries: launch in the background and end the turn", lines.filter((l) => l === RULE_1).length === 1, JSON.stringify(lines.filter((l) => l === RULE_1)));
// req: R-1140
check("seat guide carries: no reading or judging partial work mid-run", lines.filter((l) => l === RULE_2).length === 1, JSON.stringify(lines.filter((l) => l === RULE_2)));
// req: R-1140
check("seat guide carries: act on completion or a monitor's failure or stall", lines.filter((l) => l === RULE_3).length === 1, JSON.stringify(lines.filter((l) => l === RULE_3)));
// req: R-1140
check("seat guide carries: verify once at the end", lines.filter((l) => l === RULE_4).length === 1, JSON.stringify(lines.filter((l) => l === RULE_4)));
// req: R-1140
check("seat guide carries: re-run the mutation runner after the seat's own change", lines.filter((l) => l === RULE_5).length === 1, JSON.stringify(lines.filter((l) => l === RULE_5)));
// req: R-1140
check("seat guide carries: findings back in the next brief", lines.filter((l) => l === RULE_6).length === 1, JSON.stringify(lines.filter((l) => l === RULE_6)));
// req: R-1140
check("seat guide carries: at most two lanes building and one in planning", lines.filter((l) => l === RULE_7).length === 1, JSON.stringify(lines.filter((l) => l === RULE_7)));
// req: R-1140
check("seat guide carries: start what waits on nothing else, keep lane steps in order, run the full suite whole", lines.filter((l) => l === RULE_9).length === 1, JSON.stringify(lines.filter((l) => l === RULE_9)));
// req: R-1140
check("seat guide carries: preamble and review standard named, not restated", lines.filter((l) => l === RULE_8).length === 1, JSON.stringify(lines.filter((l) => l === RULE_8)));

process.exit(fails ? 1 : 0);
