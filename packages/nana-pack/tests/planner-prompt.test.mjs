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
check("R-2951: planner prompt requests the required plan sections in order", (() => {
	const terms = ["First write **Purpose**", "Then write marked **Assumptions**", "**Open choices**", "Then write the **Feature** line", "**Threat model**", "**Precedent**", "**Outside precedent**", "**Must-meet**"];
	const offsets = terms.map((term) => prompt.indexOf(term));
	return offsets.every((offset) => offset >= 0) && offsets.every((offset, i) => i === 0 || offsets[i - 1] < offset) &&
		prompt.includes("For a fix, name the row, ruling or contract it restores.");
})(), prompt);

// req: R-2952
check("R-2952: without an agreed reading the planner returns readings and no plan", [
	"An agreed reading is the owner's own words that already choose one meaning",
	"a pre-written plan, a pick, or a go on a slate line that described the lane",
	"return two or three readings of the intent, each with its consequences",
	"recommend a pick",
	"do not write a plan",
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
	const sample = `Feature: FEAT-006 · Launch builders with execution limits\n\n## Precedent\n- AGENTS.md\n- none: no code precedent for the manual prompt text\n\n## Outside precedent\n- Public reference: a planning approach\n`;
	const parsed = readBrief(sample);
	return parsed.feature === "FEAT-006" && parsed.precedent?.length === 2 &&
		checkPrecedent(parsed.precedent, ["AGENTS.md"]).length === 0 &&
		prompt.includes("Read the feature's known-bug file when one exists.") &&
		prompt.includes("Feature: FEAT-nnn · <label>") && prompt.includes("none: <reason>");
})(), prompt);

if (fails) process.exitCode = 1;
