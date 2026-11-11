/**
 * @module packages/nana-pack/tests/planner-prompt.test.mjs
 * @purpose Pins the planner prompt's pi-worker-compatible brief form.
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

// req: R-2954
check("R-2954: a plan in the prompt form passes brief parsing and precedent checking", (() => {
	const sample = `Feature: FEAT-006 · Launch builders with execution limits\n\n## Precedent\n- AGENTS.md\n- none: no code precedent for the manual prompt text\n\n## Outside precedent\n- Rust RFC template, MIT/Apache-2.0, \`borrow\`: its Prior art section asks the same question; we take the idea, not the text.\n`;
	const mergedBoldOutside = `Feature: FEAT-006 · Launch builders with execution limits\n\n## Precedent\n- AGENTS.md\n**Outside precedent**\n- Public reference: a planning approach\n`;
	const parsed = readBrief(sample);
	const refused = readBrief(mergedBoldOutside);
	return parsed.feature === "FEAT-006" && parsed.precedent?.length === 2 &&
		checkPrecedent(parsed.precedent, ["AGENTS.md"]).length === 0 &&
		refused.precedent?.length > 1 && checkPrecedent(refused.precedent, ["AGENTS.md"]).length > 0 &&
		prompt.includes("Write every plan section, from Purpose through Validation, as a `##` heading.") &&
		prompt.includes("Read the feature's known-bug file when one exists.") &&
		prompt.includes("Feature: FEAT-nnn · <label>") && prompt.includes("none: <reason>");
})(), prompt);

if (fails) process.exitCode = 1;
