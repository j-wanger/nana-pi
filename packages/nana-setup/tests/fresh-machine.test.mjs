/**
 * @module packages/nana-setup/tests/fresh-machine.test.mjs
 * @purpose Pins the ordered fresh-machine README checklist and its sourced version values.
 * @inputs README.md, doctor and step constants, CI workflow, resolved layout names, and the pack and doctor objective-path resolvers.
 * @outputs PASS/FAIL lines and a nonzero exit on failed checks.
 * @effects disk (reads repository documentation and source).
 * @errors failed checks exit nonzero.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { DESK_NODE_FLOOR, PI_SUBAGENTS_FLOOR } from "../lib/doctor.mjs";
import { resolveLayout } from "../lib/paths.mjs";
import { parseChecklist, rehearsalPlan } from "../lib/readme-rehearsal.mjs";
import { objectiveTarget } from "../lib/steps.mjs";
const { objectivePath } = await import(new URL("../../nana-pack/lib/objective.ts", import.meta.url).href);

let fails = 0;
const check = (title, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail); if (!ok) fails++; };
const repo = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const read = (file) => fs.readFileSync(path.join(repo, file), "utf8");
const readme = read("README.md");
const heading = "### Fresh machine (macOS), in order";
const start = readme.indexOf(heading);
const checklist = start < 0 ? "" : readme.slice(start + heading.length).split(/\n### /)[0];
const entries = [...checklist.matchAll(/^\s*(\d+)\.\s+(.+)$/gm)].map((m) => `${m[1]}. ${m[2]}`);
// req: R-950
check("fresh-machine checklist has eight ordered actions", entries.length === 8 && ["Node ≥", "@earendil-works/pi-coding-agent@", "git clone", "nana-setup.mjs install", ".local/bin", "npm:pi-subagents@", "objective.path", "nana-setup doctor"].every((anchor, i) => entries[i].includes(anchor)), entries.join("\n"));
const ciVersion = read(".github/workflows/ci.yml").match(/^\s*PI_VERSION:\s*(\S+)/m)?.[1];
const flat = entries.join(" ");
// req: R-951
check("checklist versions match Node, pi CI and pi-subagents sources", entries[0]?.includes(`Node ≥ ${DESK_NODE_FLOOR}`) && entries[1]?.includes(`@earendil-works/pi-coding-agent@${ciVersion} `) && entries[5]?.includes(`pi install npm:pi-subagents@${PI_SUBAGENTS_FLOOR}`), flat);
const layout = resolveLayout();
// req: R-950
check("checklist objective paths name the resolved pi seed files", entries[6]?.includes(path.basename(layout.piObjective)) && entries[6]?.includes(path.basename(layout.piPackConfig)), entries[6]);
const step8 = entries[7] ?? "";
const step8Commands = [...step8.matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((c) => /^nana-setup\s/.test(c));
const step8Kinds = step8Commands.map((c) => c.split(/\s+/)[1]);
// req: R-1111
check("fresh-machine step 8 trusts the clone before doctor", step8Kinds.includes("trust") && step8Kinds.includes("doctor") && step8Kinds.indexOf("trust") < step8Kinds.indexOf("doctor"), step8);
const rehearsalSteps = rehearsalPlan(parseChecklist(readme, "darwin"));
const lastRehearsalStep = rehearsalSteps.at(-1);
// req: R-1546
check("last step runs cd ~/nana-pi, trust and doctor as commands and expects all good",
  lastRehearsalStep?.commands.length === 3 &&
  lastRehearsalStep.commands[0] === "cd ~/nana-pi" &&
  lastRehearsalStep.commands[1] === "nana-setup trust ~/nana-pi --yes" &&
  lastRehearsalStep.commands[2] === "nana-setup doctor" &&
  lastRehearsalStep.expect === "all good",
  JSON.stringify(lastRehearsalStep));

const windowsHeading = "### Fresh machine (Windows), in order";
const windowsStart = readme.indexOf(windowsHeading);
const windowsChecklist = windowsStart < 0 ? "" : readme.slice(windowsStart + windowsHeading.length).split(/\n### /)[0];
const windowsEntries = [...windowsChecklist.matchAll(/^\s*(\d+)\.\s+(.+)$/gm)].map((m) => `${m[1]}. ${m[2]}`);
const windowsSteps = rehearsalPlan(parseChecklist(readme, "win32"));
const windowsFlat = windowsSteps.flatMap((step) => step.commands).join(" ");
const windowsLayoutHome = path.join(path.parse(repo).root, "fixture-home");
const windowsLayout = resolveLayout({ home: windowsLayoutHome });
const windowsBin = `%USERPROFILE%\\${path.relative(windowsLayoutHome, windowsLayout.binDir).split(path.sep).join("\\")}`;
const windowsObjectiveNames = [path.basename(windowsLayout.piObjective), path.basename(windowsLayout.piPackConfig)];
const windowsExpectedAnchors = [
  [`Node ≥ ${DESK_NODE_FLOOR}`, "Git for Windows", "Command Prompt"],
  [`@earendil-works/pi-coding-agent@${ciVersion}`, "pi --version"],
  ["git clone", '"%USERPROFILE%\\nana-pi"'],
  ['cd /d "%USERPROFILE%\\nana-pi"', "nana-setup.mjs install"],
  [windowsBin, "user Path", "Environment Variables", "new Command Prompt"],
  [`pi install npm:pi-subagents@${PI_SUBAGENTS_FLOOR}`],
  windowsObjectiveNames,
  ['cd /d "%USERPROFILE%\\nana-pi"', 'nana-setup trust "%USERPROFILE%\\nana-pi"', "nana-setup doctor"],
];
const windowsLastStep = windowsSteps.at(-1);
const quotedUserPaths = windowsFlat.match(/"%USERPROFILE%\\[^"\r\n]+"/g) ?? [];
const outsideQuotedUserPaths = windowsFlat.replace(/"%USERPROFILE%\\[^"\r\n]+"/g, "");

// req: R-1850
check("Windows checklist has eight ordered actions for Command Prompt at the declared versions, with no command in the user Path step", windowsEntries.length === 8 && windowsSteps.length === 8 && windowsExpectedAnchors.every((anchors, index) => anchors.every((anchor) => windowsEntries[index]?.includes(anchor))) && windowsSteps[4]?.commands.length === 0, windowsEntries.join("\n"));
// req: R-1851
check("Windows last step runs cd /d to the clone, trust and doctor as commands and expects all good", windowsLastStep?.commands.length === 3 && windowsLastStep.commands[0] === 'cd /d "%USERPROFILE%\\nana-pi"' && windowsLastStep.commands[1] === 'nana-setup trust "%USERPROFILE%\\nana-pi" --yes' && windowsLastStep.commands[2] === "nana-setup doctor" && windowsLastStep.expect === "all good", JSON.stringify(windowsLastStep));
// req: R-1852
check("every Windows checklist command names user-folder paths only as double-quoted %USERPROFILE% paths, and at least three exist", !/~|\$HOME/.test(windowsFlat) && !outsideQuotedUserPaths.includes("%USERPROFILE%") && quotedUserPaths.length >= 3, windowsFlat);
const windowsJsonExamples = [...(windowsEntries[6] ?? "").matchAll(/`(\{[^`]+\})`/g)].map((match) => match[1]);
const windowsJsonResults = windowsJsonExamples.map((text) => {
	try {
		const cfg = JSON.parse(text);
		const packPath = objectivePath(cfg.objective);
		const doctorPath = objectiveTarget(resolveLayout(), cfg);
		const relative = path.relative(os.homedir(), packPath);
		return cfg?.objective?.path?.startsWith("~/") && !cfg.objective.path.includes("\\") && packPath === doctorPath && relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
	} catch {
		return false;
	}
});
// req: R-1970
check("Windows step 7 shows a nana-pack.json example that parses as JSON and whose objective.path resolves inside the home folder alike in the pack and in doctor", windowsJsonResults.length > 0 && windowsJsonResults.every(Boolean), JSON.stringify({ examples: windowsJsonExamples, results: windowsJsonResults }));
if (fails) process.exitCode = 1;
