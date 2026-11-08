/**
 * @module packages/nana-setup/tests/seat-rule.test.mjs
 * @purpose Pin the seat guide's scope, original rules and role-launch rule without extra bullets.
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

// The retained bullets, each exactly once (R-1140; owner-profile adds automatic saving).
// RULE_7 follows the owner's 2026-11-02 per-machine roster pick; planning stays two.
const RULE_1 = "- In Claude Code, launch each builder, reviewer or role child as a background task and end your turn. In pi, run it as one foreground command with no timeout.";
const RULE_2 = "- While a builder or reviewer runs, do not read or judge its partial output, transcript, diffs or test results. Do not re-run its checks before it ends.";
const RULE_3 = "- Leave a running builder or reviewer alone until its completion notification arrives or a monitor reports a failure or a stall. Then act in that turn.";
const RULE_4 = "- Verify once, when the build ends. Re-run the seat checks your brief names, read the builder's report, and look at every page or command output the change produces.";
const RULE_5 = "- Every lane gets one reviewer plus CI.";
const RULE_6 = "- Send findings on a build back in the next brief instead of fixing the builder's work yourself.";
const RULE_7 = '- Keep no more lanes building than the lanes line of this machine\'s roster command allows, `node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs"`, and at most two more in planning. A lane in planning has no build yet and no builder working in it. A lane counts as building from its first build until it lands or closes.';
const RULE_8 = "- The builder preamble holds the builder's rules and the review standard holds the reviewer's. Judge review findings by the review standard, and restate neither in a brief.";
const RULE_9 = "- Before you end your turn, name and start what waits on nothing else: another lane's build, separate research agents. Each lane's own steps stay in order.";
const RULE_10 = "- Run the full suite whole, never in parts. Never split a long run while a full suite runs on the same machine. If a check fails on a time limit, re-run it alone before you call it a failure.";
const RULE_11 = "- Post a plan's questions as one `ask` issue before the build. This is the one exception to one issue per question. Label it `blocking` when any question is `hard to undo`, else `optional`. A blocking issue's title ends with \"(default: go)\", meaning build on the listed defaults.";
const RULE_12 = "- A blocking build waits for the owner's answer; meanwhile the seat reports YOUR CALL and starts other lanes. An optional build starts on the defaults, and a differing answer goes in the next brief. A plan whose questions read `None.` posts nothing.";
const RULE_13 = "- On a lane that produces or changes a page a person looks at, run first-look after build 1 and save the shots outside git: `npm run first-look -- --page product --out <folder>`, `--page desk --before <url> --after <url>`, or, for a new page or one with a reference, `--page url --after <url> --reference <folder> --spec <file> --out <folder>`. Point the owner to the shots with one question: is this the shape?";
const RULE_14 = "- On a lane that changes the product page, after first-look run `npm run outside-reader -- --from <first-look folder> --out <folder>` outside git, show the owner its top new finding in your report, and write a known-bug line only for a finding that is a real defect.";
const RULE_15 = "- On a lane whose page has a reference, run `npm run visual-reader -- --from <first-look folder> --out <folder>` outside git before you point the owner to the shots. Point the owner to them only after it prints a pass, or after you have judged them side by side with the reference yourself and say so in your report.";
const RULE_16 = "- On an enabled personal machine, automatically save quoted preferences, corrections, facts and thinking about the owner to both the private profile and today's shared memory until delivery lands. Run `node \"$HOME/nana-pi/packages/nana-pack/bin/nana-profile.mjs\" save`; never enable saving on a machine without the owner's choice. Show each Saved: line in your reply so the owner can retract it; confirm only on an explicit owner yes with new owner words. Never save as a builder or reviewer, from a linked worktree, or from a disabled machine. Decisions belong in nana-rulings.md and open threads in GitHub issues.";
const RULE_17 = "- On a lane that builds or reshapes a page a person looks at, write the build brief from `$HOME/nana-pi/docs/ui-brief-template.md`. The seat picks references by default. The owner's starred references from the library replace those picks when the owner wants a say.";
const BRIEF_RULE = "- A brief names the following checks.";
const BRIEF_CHECKS = [
	"  Name the new requirement ID range.",
	"  Name only Precedent files tracked at the lane's current tip.",
	"  Name the tests and known-bug lines a removal lane may delete.",
	"  Require whole-part commits for large lanes.",
	"  Export CI logs when the builder must read a failure.",
	"  Commit the review brief before the first push.",
	"  Serialize lanes sharing `templates/_shared/working-under-nana-pi.md`, `AGENTS.md`, `packages/nana-setup/claude/rules/nana-seat.md`, `code-map.config.json`, `packages/nana-pack/tests/code-map-launch.test.mjs` or `REQUIREMENTS.md`.",
];
const TRACE_CHECK = "  Name `node scripts/requirements-trace.mjs` among every brief's seat checks, including small fix briefs.";
const ROLE_RULE = fs.readFileSync(GUIDE, 'utf8').split(/\r?\n/).find(line => line.startsWith('- Start scout '));
const PUSH_RULE = '- Before pushing a lane branch, run `node "$HOME/nana-pi/packages/nana-pack/bin/leak-scan.mjs" --base main --tip HEAD` chained with `&&` to the push; on a hit, fix the commit before any push.';
const RULES = [BRIEF_RULE, PUSH_RULE, ROLE_RULE, RULE_1, RULE_2, RULE_3, RULE_4, RULE_13, RULE_14, RULE_15, RULE_17, RULE_5, RULE_6, RULE_9, RULE_10, RULE_7, RULE_8, RULE_16];

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
// req: R-3900
check("seat guide holds only retained rules and the brief checklist", bullets.length === 18 && bullets.length === RULES.length && RULES.every(rule => bullets.filter(b => b === rule).length === 1), JSON.stringify(bullets));

// req: R-1140
check("seat guide carries: launch in the background and end the turn", lines.filter((l) => l === RULE_1).length === 1, JSON.stringify(lines.filter((l) => l === RULE_1)));
// req: R-1140
check("seat guide carries: no reading or judging partial work mid-run", lines.filter((l) => l === RULE_2).length === 1, JSON.stringify(lines.filter((l) => l === RULE_2)));
// req: R-1140
check("seat guide carries: act on completion or a monitor's failure or stall", lines.filter((l) => l === RULE_3).length === 1, JSON.stringify(lines.filter((l) => l === RULE_3)));
// req: R-1140
check("seat guide carries: verify once at the end", lines.filter((l) => l === RULE_4).length === 1, JSON.stringify(lines.filter((l) => l === RULE_4)));
// req: R-1140
check("seat guide carries: every lane gets one reviewer plus CI", lines.filter((l) => l === RULE_5).length === 1, JSON.stringify(lines.filter((l) => l === RULE_5)));
// req: R-1140
check("R-1140: the seat guide has no retired mutation-runner instruction", !text.includes("mutation runner"));
// req: R-1140
// req: R-3140
check("R-3140: first-look covers any page the owner sees with usable mode commands", lines.filter((l) => l === RULE_13).length === 1, JSON.stringify(lines.filter((l) => l === RULE_13)));
// req: R-3141
check("R-3141: referenced shots stay with the seat until visual-reader passes or the seat judges them", lines.filter((l) => l === RULE_15).length === 1 && lines.indexOf(RULE_15) === lines.indexOf(RULE_14) + 1, JSON.stringify(lines.filter((l) => l === RULE_15)));
// req: R-1140
// req: R-3161
check("R-3161: UI brief rule appears once after visual-reader with the canonical path and picking defaults", lines.filter((l) => l === RULE_17).length === 1 && lines.indexOf(RULE_17) === lines.indexOf(RULE_15) + 1);

const templatePath = RULE_17.match(/`\$HOME\/nana-pi\/([^`]+)`/)?.[1];
const template = (() => { try { return fs.readFileSync(path.join(ROOT, templatePath), "utf8"); } catch { return ""; } })();
// req: R-3162
check("R-3162: linked template carries reference picking and the image handoff", [
	/seat picks/i, /owner picks/i, /captur/i, /look/i,
	/capture[^\n]*1440/i, /densest relevant view/i, /cookie dialogs dismissed/i,
	/reference images/i, /ref-1\.jpg/i, /ref-2\.jpg/i,
	/open both[^\n]*before you design/i, /for the captured page/i, /out of git/i,
].every((phrase) => phrase.test(template)) && template.includes("https://claude.ai/artifact/TqVYBrbms8gRvnS5sqtzce"));
// req: R-3163
check("R-3163: template gates follow the lane spec and recommend anchored ratings", [
	/defect gate[^\n]*lane.s spec checks/i,
	/horizontal scroll[^\n]*phone width/i, /contrast/i,
	/no network[^\n]*only where[^\n]*spec[^\n]*offline/i,
	/recommend[^\n]*anchor/i, /not a land requirement/i,
].every((phrase) => phrase.test(template)));

// req: R-3067
check("R-3067: seat guide carries the outside-reader timing, output and defect rule", lines.filter((l) => l === RULE_14).length === 1, JSON.stringify(lines.filter((l) => l === RULE_14)));
// req: R-1140
check("seat guide carries: findings back in the next brief", lines.filter((l) => l === RULE_6).length === 1, JSON.stringify(lines.filter((l) => l === RULE_6)));
// req: R-1140
check("seat guide carries: no more lanes building than the roster command's lanes line, two in planning, each slot defined", lines.filter((l) => l === RULE_7).length === 1, JSON.stringify(lines.filter((l) => l === RULE_7)));
// req: R-1140
check("seat guide carries: name and start independent work before the turn ends, lane steps in order", lines.filter((l) => l === RULE_9).length === 1, JSON.stringify(lines.filter((l) => l === RULE_9)));
// req: R-1140
check("seat guide carries: full suite whole, no split beside a full suite, a time-limit failure re-run alone", lines.filter((l) => l === RULE_10).length === 1, JSON.stringify(lines.filter((l) => l === RULE_10)));
// req: R-1140
check("seat guide carries: preamble and review standard named, not restated", lines.filter((l) => l === RULE_8).length === 1, JSON.stringify(lines.filter((l) => l === RULE_8)));

{
	const guide = fs.readFileSync(GUIDE, "utf8");
	const sentence = "In pi, the seat asks the user to start another lane's build from another pi session or the desk; its own builds run in the foreground.";
	const shared = fs.readFileSync(SHARED_WORKING, "utf8");
	const agents = fs.readFileSync(path.join(ROOT, "AGENTS.md"), "utf8");
	const seatLine = shared.split("\n").find((line) => line.startsWith("- Seat guide:"));
	// req: R-3026
	// req: R-3900
	check("pi seat guide explains parallel builds and the shared working pattern names both guide loaders", guide.split(sentence).length === 2 && guide.indexOf(sentence) > guide.indexOf(RULE_9) && guide.indexOf(sentence) < guide.indexOf(RULE_10) && seatLine?.includes("Claude Code loads it as a rule, and pi installs and injects the same guide for seat sessions") && agents.includes(seatLine), JSON.stringify({ seatLine, guideHasSentence: guide.includes(sentence), agentsHasLine: agents.includes(seatLine ?? "") }));
}

// req: R-3536
check('MM9: role launch guidance names commands slots seat exceptions scheduling and ruling', (() => {
	const shared=fs.readFileSync(SHARED_WORKING,'utf8'), agents=fs.readFileSync(path.join(ROOT,'AGENTS.md'),'utf8');
	const ruling=fs.readFileSync(path.join(ROOT,'packages/nana-pack/rules/nana-rulings.md'),'utf8');
	return ['scout','planner','adversary','pi-worker --slot','node "$HOME/nana-pi/packages/nana-pack/bin/pi-worker.mjs" --slot','node "$env:USERPROFILE\\nana-pi\\packages\\nana-pack\\bin\\pi-worker.mjs" --slot','seat','none'].every(s=>text.includes(s)) &&
		/launch.*role.*background/.test(text) && /In pi.*foreground/.test(text) &&
		[shared,agents].every(t=>t.includes('pi-worker --slot')&&t.includes('scout')&&t.includes('planner')&&t.includes('adversary')&&!t.includes('adversary and checker')&&t.includes('seat')&&t.includes('none')) &&
		ruling.includes('2026-11-07: The roster names a slot for the scout, planner and adversary; a seat starts each through its slot.');
})());
// req: R-3898
check("M5: one brief checklist names the seven build lessons", text.split(BRIEF_RULE).length === 2 &&
	text.includes([BRIEF_RULE, ...BRIEF_CHECKS].join("\n")));
// req: R-3901
check("M8: brief authority and builder scope agree on named known-bug removals", (() => {
	const preamble = fs.readFileSync(path.join(ROOT, "packages/nana-pack/prompts/builder-preamble.md"), "utf8");
	return text.includes(BRIEF_CHECKS[2]) &&
		preamble.includes("- Remove only the known-bug lines your brief names; never make any other edit under `docs/known-bugs/`.") &&
		!preamble.includes("Never edit `HANDOFF.md` or `docs/known-bugs/`");
})());
// req: R-3902
check("M9: red-main guidance names the reviewed fix land path beside post", (() => {
	const redMain = text.split("\n\n").find(paragraph => paragraph.includes("Use `--post` when it reports red."));
	return redMain?.includes("Land the reviewed fix through `nana-land … --fixes-red <run>`.") ?? false;
})());
// req: R-3904
check("M11: every brief including small fixes names the requirements trace seat check",
	text.includes([BRIEF_RULE, ...BRIEF_CHECKS, TRACE_CHECK].join("\n")));
// req: R-3894
check("M1: plan questions stay in the planner without seat posting or answer waits", (() => {
	const planner = fs.readFileSync(path.join(ROOT, "packages/nana-pack/prompts/planner.md"), "utf8");
	const requirements = fs.readFileSync(path.join(ROOT, "REQUIREMENTS.md"), "utf8");
	return !text.includes(RULE_11) && !text.includes(RULE_12) &&
		!/Post a plan's questions|blocking build waits|optional build starts/.test(text) &&
		planner.includes("Questions for the owner") && ["R-3012", "R-3013"].every(id =>
			requirements.split("\n").some(line => line.startsWith(`| ${id} |`) && line.includes("| retired |")));
})());
process.exit(fails ? 1 : 0);
