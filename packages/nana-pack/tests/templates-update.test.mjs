/**
 * @module packages/nana-pack/tests/templates-update.test.mjs
 * @purpose Verify that the template-owned Part G file survives rendering and copier updates while each project's rail reconciles its owned status cells.
 * @inputs Copier templates, the shared Part G source, and the exported TypeScript rail over temporary project roots
 * @outputs PASS/FAIL checks for rail source selection, status ownership, drift reporting, and template update behavior
 * @effects disk (writes fixture projects under the OS temp directory), process (runs external copier commands when available)
 * @errors Failed checks exit non-zero; unavailable optional Copier tooling is reported as SKIP
 */
import { tmpDir } from "./tmp-dir.mjs";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { check: railCheck, printReport } = await import(new URL("../../../templates/typescript/template/tests/requirements-trace.ts", import.meta.url).href);
const root = tmpDir(join(tmpdir(), "nana-partg-rail-"));
mkdirSync(join(root, "tests"), { recursive: true });
let failures = 0;
const check = (title, ok, detail = "") => {
 console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
 if (!ok) failures++;
};
const table = (entries) => ["| ID | Requirement | Status | Evidence |", "|---|---|---|---|", ...entries.map(([id, req, status = "untested", evidence = "—"]) => `| ${id} | ${req} | ${status} | ${evidence} |`), ""].join("\n");
const baseRows = [
 ["G-001", "The fixture shall be shaped and shall expose its source."],
 ["G-002", "The fixture shall use configured values.", "violated", "tests/fixture.test.ts::owned evidence"],
 ["G-013", "WHERE a row is not retired, it shall carry exactly one `shall` outside a code span."],
 ["G-014", "The rail shall report the count of rows off form in its own line after the summary line."],
 ["G-015", "IF the count of rows off form exceeds the declared allowance THEN the rail shall fail naming each off-form row."],
];
writeFileSync(join(root, "REQUIREMENTS.md"), table(baseRows));
writeFileSync(join(root, "REQUIREMENTS-general.md"), table([
 ["G-001", "The fixture shall be shaped."],
 ["G-002", "The fixture shall use configured values."],
 ["G-013", baseRows[2][1]], ["G-014", baseRows[3][1]], ["G-015", baseRows[4][1]],
 ["G-016", "An inline literal shall not tune behavior."],
]));
let result = railCheck(root, { testRoots: ["tests"] });
// req: R-578
check("Part G Requirement and EARS counts come from the template-owned file", result.earsOffForm.includes("G-001") === false && !result.problems.some((p) => p.includes("G-001 carries")), result.report);
// req: R-579
check("project Status and Evidence override template cells; file-only rows join", result.requirements.get("G-002")?.status === "violated" && result.requirements.get("G-002")?.local[0] === "tests/fixture.test.ts::owned evidence" && result.requirements.get("G-016")?.status === "untested", `${result.line}`);
const printed = [];
const originalLog = console.log;
console.log = (line) => printed.push(line);
printReport(result);
console.log = originalLog;
// req: R-583
check("Part G drift is printed once without becoming a problem", printed.filter((line) => line.startsWith("part g:")).length === 1 && printed.includes(result.driftLine) && result.driftLine?.includes("G-001") && result.problems.length === 0, `${printed.join("|")} ${result.problems.join("|")}`);
writeFileSync(join(root, "REQUIREMENTS.md"), table([
 ["G-001", "The fixture shall be shaped and shall expose its source."],
 ["G-002", "The fixture shall use configured values.", "violated"],
 ["G-013", baseRows[2][1]], ["G-014", baseRows[3][1]], ["G-015", baseRows[4][1]],
]));
writeFileSync(join(root, "REQUIREMENTS-general.md"), table(baseRows.map(([id, req, status]) => [id, id === "G-001" ? "The fixture shall be shaped." : req, status])));
result = railCheck(root, { testRoots: ["tests"] });
// req: R-578
check("reverse discrepancy uses the file's single-shall Requirement", !result.earsOffForm.includes("G-001"), result.earsLine);
writeFileSync(join(root, "REQUIREMENTS.md"), table(baseRows));
writeFileSync(join(root, "REQUIREMENTS-general.md"), table(baseRows.map(([id, req, status]) => [id, id === "G-001" ? "The fixture shall be shaped." : req, status])));
result = railCheck(root, { testRoots: ["tests"] });
// req: R-578
check("two shall in REQUIREMENTS.md is governed by single-shall template text", !result.earsOffForm.includes("G-001"), result.earsLine);
writeFileSync(join(root, "REQUIREMENTS.md"), table(baseRows));
writeFileSync(join(root, "REQUIREMENTS-general.md"), table(baseRows));
import { unlinkSync } from "node:fs";
unlinkSync(join(root, "REQUIREMENTS-general.md"));
result = railCheck(root, { testRoots: ["tests"] });
// req: R-580
check("without the general file the rail uses REQUIREMENTS.md alone", result.earsOffForm.includes("G-001"), result.earsLine);

const sourceRoot = new URL("../../../", import.meta.url);
const uvCache = spawnSync("uv", ["cache", "dir"], { encoding: "utf8" }).stdout.trim();
const env = { ...process.env, HOME: root, UV_CACHE_DIR: uvCache, GIT_AUTHOR_NAME: "Part G Test", GIT_AUTHOR_EMAIL: "partg@example.invalid", GIT_COMMITTER_NAME: "Part G Test", GIT_COMMITTER_EMAIL: "partg@example.invalid" };
const shared = readFileSync(new URL("templates/_shared/requirements-general.md", sourceRoot), "utf8");
const copierConfig = readFileSync(new URL("copier.yml", sourceRoot), "utf8");
const skipMatches = (config, target) => config.split("\n").some((line) => {
 const item = /^\s*-\s*[\"']?([^\"']+)[\"']?\s*$/.exec(line);
 if (!item) return false;
 const pattern = item[1].replace(/[.+^${}()|[\\]\\]/g, "\\$&").replaceAll("*", ".*").replaceAll("?", ".");
 return new RegExp(`^${pattern}$`).test(target);
});
// req: R-581
check("skip-pattern matcher catches a matching path fixture", skipMatches('_skip_if_exists:\n  - "REQUIREMENTS-general.md"', "REQUIREMENTS-general.md"));
// req: R-581
check("template-owned file path is not skip-listed", !skipMatches(copierConfig, "REQUIREMENTS-general.md"));
const parseG = (text) => new Map([...text.matchAll(/^\|\s*(G-\d{3})\s*\|\s*(.*?)\s*\|\s*(\w+)\s*\|/gm)].map((match) => [match[1], { requirement: match[2], status: match[3] }]));
const copyProbe = spawnSync("uvx", ["copier", "--version"], { encoding: "utf8" });
if (copyProbe.status !== 0) {
 console.log("SKIP fresh Part G render matrix: uvx copier unavailable");
} else {
 for (const language of ["python", "typescript"]) {
  for (const adopt of [false, true]) {
   const dest = join(root, `render-${language}-${adopt ? "adopt" : "scaffold"}`);
   const copyArgs = ["copier", "copy", "--trust", "--defaults", "--vcs-ref", "HEAD", "-d", `language=${language}`, "-d", `project_name=partg-${language}`];
   if (adopt) copyArgs.push("-d", "adopt=true");
   copyArgs.push(sourceRoot.pathname, dest);
   const rendered = spawnSync("uvx", copyArgs, { encoding: "utf8", env });
   const generalPath = join(dest, "REQUIREMENTS-general.md");
   const generalText = existsSync(generalPath) ? readFileSync(generalPath, "utf8") : "";
   const projectText = existsSync(join(dest, "REQUIREMENTS.md")) ? readFileSync(join(dest, "REQUIREMENTS.md"), "utf8") : "";
   const generalRows = parseG(generalText);
   const projectRows = parseG(projectText);
   const statuses = new Set([...generalRows.values()].map((row) => row.status));
   const modeStatus = adopt ? statuses.size === 1 && statuses.has("untested") : statuses.has("implemented") && statuses.has("untested");
   const matches = rendered.status === 0 && generalRows.size > 0 && JSON.stringify([...generalRows]) === JSON.stringify([...projectRows]) && modeStatus && !/\{\{|\{%/.test(generalText);
   // req: R-581
   check("render has the shared Part G map, mode status, and no Jinja", matches, `${language}/${adopt}: ${rendered.stdout} ${rendered.stderr} ${generalRows.size}/${projectRows.size}`);
  }
 }
}
const repo = sourceRoot;
const available = spawnSync("uvx", ["copier", "--version"], { encoding: "utf8" });
const hasOldTag = spawnSync("git", ["-C", repo.pathname, "rev-parse", "--verify", "v0.6.0"], { encoding: "utf8" }).status === 0;
if (available.status !== 0 || !hasOldTag) {
 console.log(`SKIP copier update legs: ${available.status !== 0 ? "uvx copier unavailable" : "v0.6.0 tag unavailable"}`);
} else {
 for (const language of ["python", "typescript"]) {
  const dest = join(root, `update-${language}`);
  const copy = spawnSync("uvx", ["copier", "copy", "--trust", "--defaults", "--vcs-ref", "v0.6.0", "-d", `language=${language}`, "-d", `project_name=partg-${language}`, repo.pathname, dest], { encoding: "utf8", env });
  const copiedRequirements = existsSync(join(dest, "REQUIREMENTS.md")) ? readFileSync(join(dest, "REQUIREMENTS.md"), "utf8") : "";
  const init = spawnSync("git", ["init", dest], { encoding: "utf8", env });
  spawnSync("git", ["-C", dest, "add", "."], { encoding: "utf8", env });
  const commit = spawnSync("git", ["-C", dest, "commit", "-m", "fixture"], { encoding: "utf8", env });
  const update = spawnSync("uvx", ["copier", "update", "--trust", "--defaults", "--vcs-ref", "HEAD", "--conflict", "rej"], { encoding: "utf8", env, cwd: dest });
  const rejects = existsSync(dest) ? readdirSync(dest).filter((name) => name.endsWith(".rej")) : [];
  const generalExists = existsSync(join(dest, "REQUIREMENTS-general.md"));
  let checkOutput = "";
  let railExit = 1;
  let mapExit = 1;
  if (generalExists && language === "typescript") {
   const checkRun = spawnSync("node", ["--experimental-strip-types", "--input-type=module", "-e", "const { check } = await import('file://' + process.cwd() + '/tests/requirements-trace.ts'); const r=check('.'); console.log(r.report); if (r.driftLine) console.log(r.driftLine); console.log('problems: ' + r.problems.length);"], { encoding: "utf8", env, cwd: dest });
   checkOutput = checkRun.stdout ?? "";
   railExit = checkRun.status ?? 1;
  } else if (generalExists) {
   const checkRun = spawnSync("uvx", ["--with", "pytest", "python", "-c", "from pathlib import Path; import runpy; m=runpy.run_path('tests/conftest.py'); r=m['check'](Path('.')); print(r[-1]); print('problems: ' + str(len(r[2])))"], { encoding: "utf8", env, cwd: dest });
   checkOutput = checkRun.stdout ?? "";
   railExit = checkRun.status ?? 1;
  }
  if (generalExists && language === "typescript") {
   spawnSync("node", ["scripts/code-map.mjs"], { encoding: "utf8", env, cwd: dest });
   const mapCheck = spawnSync("node", ["scripts/code-map.mjs", "--check"], { encoding: "utf8", env, cwd: dest });
   checkOutput += mapCheck.stdout ?? "";
   mapExit = mapCheck.status ?? 1;
  } else if (generalExists) {
   spawnSync("python3", ["scripts/code_map.py"], { encoding: "utf8", env, cwd: dest });
   const mapCheck = spawnSync("python3", ["scripts/code_map.py", "--check"], { encoding: "utf8", env, cwd: dest });
   checkOutput += mapCheck.stdout ?? "";
   mapExit = mapCheck.status ?? 1;
  }
  const clean = copy.status === 0 && init.status === 0 && commit.status === 0 && update.status === 0 && railExit === 0 && mapExit === 0 && rejects.length === 0 && copiedRequirements === readFileSync(join(dest, "REQUIREMENTS.md"), "utf8") && generalExists && checkOutput.includes("ears: 0 rows off form (allowance 0)") && checkOutput.includes("problems: 0") && checkOutput.endsWith("\n");
  // req: R-582
  check(`${language} earlier-tag copier update leaves REQUIREMENTS.md unchanged and its rail clean`, clean, `${copy.stderr}\n${update.stderr}\n${checkOutput}`);
 }
}
const adoptRoot = join(root, "adopt-python");
mkdirSync(adoptRoot, { recursive: true });
const initialRequirements = "| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-900 | The existing project shall remain identifiable. | untested | — |\n";
writeFileSync(join(adoptRoot, "REQUIREMENTS.md"), initialRequirements);
const initAdopt = spawnSync("git", ["init", adoptRoot], { encoding: "utf8", env });
spawnSync("git", ["-C", adoptRoot, "add", "REQUIREMENTS.md"], { encoding: "utf8", env });
const commitAdopt = spawnSync("git", ["-C", adoptRoot, "commit", "-m", "existing project"], { encoding: "utf8", env });
const adoptCopy = spawnSync("uvx", ["copier", "copy", "--trust", "--defaults", "--vcs-ref", "v0.6.0", "-d", "language=python", "-d", "project_name=partg-adopt", "-d", "adopt=true", repo.pathname, adoptRoot], { encoding: "utf8", env });
spawnSync("git", ["-C", adoptRoot, "add", "."], { encoding: "utf8", env });
const adoptCommit = spawnSync("git", ["-C", adoptRoot, "commit", "-m", "adopt scaffold"], { encoding: "utf8", env });
const adoptUpdate = spawnSync("uvx", ["copier", "update", "--trust", "--defaults", "--vcs-ref", "HEAD", "--conflict", "rej"], { encoding: "utf8", env, cwd: adoptRoot });
let adoptRailOutput = "";
let adoptRailExit = 1;
if (existsSync(join(adoptRoot, "REQUIREMENTS-general.md"))) {
 const rail = spawnSync("uvx", ["--with", "pytest", "python", "-c", "from pathlib import Path; import runpy; m=runpy.run_path('tests/conftest.py'); r=m['check'](Path('.')); print(r[3]); print('rows: ' + str(sum(i.startswith('G-') for i in r[0])) + ' G, ' + str(sum(i.startswith('R-') for i in r[0])) + ' R'); print('problems: ' + str(len(r[2]))); print(r[5])"], { encoding: "utf8", env, cwd: adoptRoot });
 adoptRailOutput = rail.stdout ?? "";
 adoptRailExit = rail.status ?? 1;
}
// req: R-579
check("Python adopt update adds 22 untested Part G rows without replacing the project's R row", initAdopt.status === 0 && commitAdopt.status === 0 && adoptCopy.status === 0 && adoptCommit.status === 0 && adoptUpdate.status === 0 && adoptRailExit === 0 && adoptRailOutput.includes("23 total (23 untested)") && adoptRailOutput.includes("rows: 22 G, 1 R") && adoptRailOutput.includes("problems: 0") && adoptRailOutput.includes("ears: 0 rows off form (allowance 0)"), `${adoptCopy.stderr}\n${adoptUpdate.stderr}\n${adoptRailOutput}`);
console.log(failures ? `\n${failures} FAILED` : "\nall passed");
process.exit(failures ? 1 : 0);
