/**
 * @module packages/nana-setup/tests/fresh-machine.test.mjs
 * @purpose Pins the ordered fresh-machine README checklist and its sourced version values.
 * @inputs README.md, doctor and step constants, CI workflow and resolved layout names.
 * @outputs PASS/FAIL lines and a nonzero exit on failed checks.
 * @effects disk (reads repository documentation and source).
 * @errors failed checks exit nonzero.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { DESK_NODE_FLOOR, PI_SUBAGENTS_FLOOR } from "../lib/doctor.mjs";
import { PI_INSTALL_HINT } from "../lib/steps.mjs";
import { resolveLayout } from "../lib/paths.mjs";

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
check("checklist versions match Node, pi CI and pi-subagents sources", entries[0]?.includes(`Node ≥ ${DESK_NODE_FLOOR}`) && entries[1]?.includes(`${PI_INSTALL_HINT}@${ciVersion}`) && entries[5]?.includes(`pi install npm:pi-subagents@${PI_SUBAGENTS_FLOOR}`), flat);
const layout = resolveLayout();
// req: R-950
check("checklist objective paths name the resolved pi seed files", entries[6]?.includes(path.basename(layout.piObjective)) && entries[6]?.includes(path.basename(layout.piPackConfig)), entries[6]);
if (fails) process.exitCode = 1;
