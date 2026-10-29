/**
 * @module packages/nana-pack/tests/planner-prompt.test.mjs
 * @purpose Pins the planner prompt's source order, requested plan content, readings behavior and pi-worker-compatible brief form.
 * @inputs packages/nana-pack/prompts/planner.md, tracked repository paths, and the shared brief parser.
 * @outputs PASS/FAIL lines and a nonzero exit when a contract check fails.
 * @effects none
 * @errors failed assertions print FAIL and make the process exit nonzero
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { readBrief, checkPrecedent } from "../lib/brief-precedent.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const promptPath = path.join(root, "packages/nana-pack/prompts/planner.md");
const prompt = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, "utf8") : "";
let fails = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
	if (!ok) fails++;
};

// req: R-2950
check("R-2950: planner prompt names its sources in conflict order and resolves pack paths", (() => {
	const sources = prompt.split("## Sources")[1]?.split("\n## ")[0] ?? "";
	const entries = [
		"Use these sources in this order when instructions conflict:",
		"The owner's words for this lane",
		"$HOME/nana-pi/packages/nana-pack/rules/nana-rulings.md",
		"This project's own AGENTS.md section after the shared markers",
		"The shared working pattern",
		"$HOME/nana-pi/packages/nana-pack/prompts/planner.md",
	];
	const offsets = entries.map((entry) => sources.indexOf(entry));
	return offsets.every((offset) => offset >= 0) && offsets.every((offset, i) => i === 0 || offsets[i - 1] < offset) &&
		fs.existsSync(path.join(root, "packages/nana-pack/rules/nana-rulings.md")) &&
		fs.existsSync(path.join(root, "packages/nana-pack/prompts/planner.md")) &&
		fs.existsSync(path.join(root, "templates/_shared/working-under-nana-pi.md"));
})(), prompt);

// req: R-2951
check("R-2951: planner prompt requests Questions for the owner in plan-section order", (() => {
	const terms = ["First write **Purpose**", "Then write marked **Assumptions**", "**Open choices**", "**Questions for the owner**", "Then write the **Feature** line", "**Threat model**", "**Precedent**", "**Outside precedent**", "**Must-meet**"];
	const offsets = terms.map((term) => prompt.indexOf(term));
	return offsets.every((offset) => offset >= 0) && offsets.every((offset, i) => i === 0 || offsets[i - 1] < offset) &&
		prompt.includes("For a fix, name the row, ruling or contract it restores.");
})(), prompt);

// req: R-3030
check("R-3030: planner prompt makes Outside precedent part of the required section order", prompt.includes("Then write the **Feature** line, **Threat model**, **Precedent**, **Outside precedent**, and **Must-meet** tests."), prompt);

// req: R-3031
check("R-3031: planner prompt requires a licensed outside project or a located none", prompt.includes("Under **Outside precedent**, name one open-source project for the lane's main part, with its licence and one of `adopt`, `borrow` or `skip` and a reason; put any other public reference after it. When none applies, write `none:` with where you looked."), prompt);

// req: R-3070
check("R-3070: planner prompt specifies the five-line owner-question form, ranking and overflow", [
	"Then write **Questions for the owner**. Write each question as five labelled lines: `Question:`, `Default:`, `What the default gains and misses:` (one concrete gain of the default and one problem it may miss that the main alternative would catch, on one line), `Cost of a wrong guess:` (starting `easy to undo` or `hard to undo`), and `If answered otherwise:`. Order them from the costliest wrong guess down. Keep the top one to three; make every other question a marked assumption. With no open question, write `None.`",
].every((sentence) => prompt.includes(sentence)), prompt);

// req: R-3011
check("R-3011: readings put the top questions for each reading in the same message", prompt.includes("When you return readings instead of a plan, put the top questions for each reading in the same message."), prompt);

// req: R-2952
check("R-2952: without an agreed reading the planner returns readings and no plan", [
	"An agreed reading is the owner's own words that already choose one meaning",
	"a pre-written plan, a pick, or a go on a slate line that described the lane",
	"For new capability without an agreed reading",
	"return two or three readings of the intent, each with its consequences",
	"recommend a pick",
	"do not write a plan",
	"A fix that restores agreed behaviour plans straight away.",
].every((sentence) => prompt.includes(sentence)), prompt);

// req: R-2953
check("R-2953: planner prompt pins its planning and forecast rules without scratch-plan pointers", [
	"Expected changes to existing tests are a forecast, never a limit on what the builder may edit.",
	"The seat's wrong-code pairs belong to install, hook or gate lanes.",
	"An earlier plan is grounding for a decision it records, never a format to copy.",
	"For code files, use the project's map impact command to forecast callers and tests.",
	"For files the map does not cover, search tests and checkers for the path and every literal the change breaks.",
].every((sentence) => prompt.includes(sentence)) && !prompt.includes("docs/reviews/") && !prompt.includes("must-meet.md"), prompt);

// req: R-2954
check("R-2954: a plan in the prompt form passes brief parsing and precedent checking", (() => {
	const sample = `Feature: FEAT-006 · Launch builders with execution limits\n\n## Precedent\n- AGENTS.md\n- none: no code precedent for the manual prompt text\n\n## Outside precedent\n- Rust RFC template, MIT/Apache-2.0, \`borrow\`: its Prior art section asks the same question; we take the idea, not the text.\n`;
	const mergedBoldOutside = `Feature: FEAT-006 · Launch builders with execution limits\n\n## Precedent\n- AGENTS.md\n**Outside precedent**\n- Public reference: a planning approach\n`;
	const parsed = readBrief(sample);
	const refused = readBrief(mergedBoldOutside);
	return parsed.feature === "FEAT-006" && parsed.precedent?.length === 2 &&
		checkPrecedent(parsed.precedent, ["AGENTS.md"]).length === 0 &&
		refused.precedent?.length > 1 && checkPrecedent(refused.precedent, ["AGENTS.md"]).length > 0 &&
		prompt.includes("Write every plan section, from Purpose through Must-meet, as a `##` heading.") &&
		prompt.includes("Read the feature's known-bug file when one exists.") &&
		prompt.includes("Feature: FEAT-nnn · <label>") && prompt.includes("none: <reason>");
})(), prompt);

const seatGuidePath = path.join(root, "packages/nana-setup/claude/rules/nana-seat.md");
const seatGuide = fs.existsSync(seatGuidePath) ? fs.readFileSync(seatGuidePath, "utf8") : "";

// req: R-3012
check("R-3012: seat guide posts one plan-question issue with the build label and default title", seatGuide.includes('Post a plan\'s questions as one `ask` issue before the build. This is the one exception to one issue per question. Label it `blocking` when any question is `hard to undo`, else `optional`. A blocking issue\'s title ends with "(default: go)", meaning build on the listed defaults.'), seatGuide);

// req: R-3013
check("R-3013: seat guide distinguishes blocking waits, optional defaults and None", seatGuide.includes("A blocking build waits for the owner's answer; meanwhile the seat reports YOUR CALL and starts other lanes. An optional build starts on the defaults, and a differing answer goes in the next brief. A plan whose questions read `None.` posts nothing."), seatGuide);

if (fails) process.exitCode = 1;
