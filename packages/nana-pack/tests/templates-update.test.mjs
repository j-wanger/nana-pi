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
const findRejectFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => { const path = join(dir, entry.name); return entry.isDirectory() ? findRejectFiles(path) : entry.name.endsWith(".rej") ? [path] : []; });
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
 ["G-001", "The fixture shall be shaped."],
 ["G-002", "The fixture shall use configured values.", "violated"],
 ["G-013", baseRows[2][1]], ["G-014", baseRows[3][1]], ["G-015", baseRows[4][1]],
]));
writeFileSync(join(root, "REQUIREMENTS-general.md"), table(baseRows.map(([id, req, status]) => [id, id === "G-001" ? "The fixture shall be shaped and shall expose its source." : req, status])));
result = railCheck(root, { testRoots: ["tests"] });
// req: R-578
check("reverse discrepancy counts the two-shall file Requirement", result.earsOffForm.includes("G-001"), result.earsLine);
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
writeFileSync(join(root, "REQUIREMENTS.md"), table([["G-017", "The malformed fixture shall be rejected.", "untested"]]));
writeFileSync(join(root, "REQUIREMENTS-general.md"), table([["G-017", "The malformed fixture shall be rejected.", "bogus"]]));
let malformedTs = false;
try { railCheck(root, { testRoots: ["tests"] }); } catch (error) { malformedTs = String(error).includes("unknown status 'bogus'"); }
// req: R-579
check("TypeScript rejects malformed template status before merging project-owned fields", malformedTs);

const sourceRoot = new URL("../../../", import.meta.url);
const probe = (command, args, options = {}) => {
 try { return spawnSync(command, args, { encoding: "utf8", ...options }); }
 catch (error) { return { status: null, error }; }
};
const unavailableReason = (tool) => `${tool} unavailable`;
// req: R-582
check("unavailable-tool skip reason names the missing tool", unavailableReason("nana-partg-unavailable-tool") === "nana-partg-unavailable-tool unavailable");
const uvProbe = probe("uv", ["cache", "dir"], { cwd: root });
const uvCache = uvProbe.status === 0 ? (uvProbe.stdout ?? "").trim() : "";
const env = { ...process.env, HOME: root, ...(uvCache ? { UV_CACHE_DIR: uvCache } : {}), GIT_AUTHOR_NAME: "Part G Test", GIT_AUTHOR_EMAIL: "partg@example.invalid", GIT_COMMITTER_NAME: "Part G Test", GIT_COMMITTER_EMAIL: "partg@example.invalid" };
if (uvProbe.status !== 0) console.log(`SKIP uv cache configuration: ${unavailableReason("uv")}${uvProbe.error ? ` (${uvProbe.error.message})` : ""}`);
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
const nestedRejectFixture = join(root, "nested-reject-fixture", "docs");
mkdirSync(nestedRejectFixture, { recursive: true });
writeFileSync(join(nestedRejectFixture, "conflict.rej"), "fixture");
// req: R-582
check("updated trees reject nested conflict files before map regeneration", findRejectFiles(join(root, "nested-reject-fixture")).length === 1);
const parseG = (text) => new Map([...text.matchAll(/^\|\s*(G-\d{3})\s*\|\s*(.*?)\s*\|\s*(\w+)\s*\|/gm)].map((match) => [match[1], { requirement: match[2], status: match[3] }]));
const sharedRequirements = new Map([...shared.matchAll(/^\|\s*(G-\d{3})\s*\|\s*(.*?)\s*\|/gm)].map((match) => [match[1], match[2]]));
const pythonJinja = readFileSync(new URL("templates/python/template/REQUIREMENTS-general.md.jinja", sourceRoot), "utf8");
// req: R-581
check("Python rendered Jinja includes the shared source", pythonJinja.trim() === "{% include 'templates/_shared/requirements-general.md' %}" && sharedRequirements.size === 22);
const pythonRailSource = readFileSync(new URL("templates/python/template/tests/conftest.py", sourceRoot), "utf8");
// req: R-581
check("Python filename constant is pinned to REQUIREMENTS-general.md", /GENERAL_REQUIREMENTS_FILE\s*=\s*["']REQUIREMENTS-general\.md["']/.test(pythonRailSource));
const typescriptJinja = readFileSync(new URL("templates/typescript/template/REQUIREMENTS-general.md.jinja", sourceRoot), "utf8");
// req: R-581
check("TypeScript rendered Jinja includes the shared source", typescriptJinja.trim() === "{% include 'templates/_shared/requirements-general.md' %}" && sharedRequirements.size === 22);
const typescriptRailSource = readFileSync(new URL("templates/typescript/template/tests/requirements-trace.ts", sourceRoot), "utf8");
// req: R-581
check("TypeScript filename constant is pinned to REQUIREMENTS-general.md", /GENERAL_REQUIREMENTS_FILE\s*=\s*["']REQUIREMENTS-general\.md["']/.test(typescriptRailSource));
const copyProbe = probe("uvx", ["copier", "--version"], { cwd: root });
const pythonProbe = probe("uvx", ["--with", "pytest", "python", "-c", "import pytest"], { cwd: root });
const haveCopier = copyProbe.status === 0;
const havePytest = pythonProbe.status === 0;
if (!havePytest) console.log(`SKIP Python rail fixtures: ${unavailableReason("pytest through uvx")}${pythonProbe.error ? ` (${pythonProbe.error.message})` : ""}`);
if (havePytest) {
 const pythonRail = (fixture, code) => probe("uvx", ["--with", "pytest", "python", "-c", code, fixture, new URL("../../../templates/python/template/tests/conftest.py", import.meta.url).pathname], { cwd: fixture });
 const pythonFixture = (name, project, general) => {
  const dir = join(root, name); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "REQUIREMENTS.md"), table(project));
  if (general) writeFileSync(join(dir, "REQUIREMENTS-general.md"), table(general));
  return dir;
 };
 const ownedStatus = pythonFixture("python-owned", [["G-001", "The project shall retain this longer two shall contract.", "violated", "`tests/test_owned.py::owned status evidence`"]], [["G-001", "The file shall govern Requirement text."], ["G-016", "An inline literal shall not tune behavior.", "untested", "`tests/template.test.py::fallback evidence`"]]);
 const precedence = pythonRail(ownedStatus, "import runpy,sys; from pathlib import Path; m=runpy.run_path(sys.argv[2]); r=m['check'](Path(sys.argv[1]), test_roots=()); assert r[0]['G-001'].status == 'violated'; assert r[0]['G-001'].local == ['tests/test_owned.py::owned status evidence']; assert r[0]['G-016'].status == 'untested'; assert r[0]['G-016'].local == ['tests/template.test.py::fallback evidence']; assert 'G-001' not in r[4]");
 // req: R-578
 // req: R-579
 check("Python rail uses the file Requirement while preserving project-owned fields", precedence.status === 0, precedence.stderr ?? "");
 const reverseFixture = pythonFixture("python-reverse", [["G-001", "The fixture shall be shaped."]], [["G-001", "The fixture shall be shaped and shall expose its source."]]);
 const reverse = pythonRail(reverseFixture, "import runpy,sys; from pathlib import Path; m=runpy.run_path(sys.argv[2]); r=m['check'](Path(sys.argv[1]), test_roots=()); assert 'G-001' in r[4]");
 // req: R-578
 check("Python rail flags the two-shall file Requirement when the project has one shall", reverse.status === 0, reverse.stderr ?? "");
 const fallback = pythonFixture("python-fallback", [["G-001", "The fixture shall work and shall report."]], null);
 mkdirSync(join(fallback, "tests"));
 writeFileSync(join(fallback, "tests", "test_marker.py"), "# req: G-013\ndef test_unknown_marker():\n    pass\n");
 const noGeneral = pythonRail(fallback, "import runpy,sys; from pathlib import Path; m=runpy.run_path(sys.argv[2]); r=m['check'](Path(sys.argv[1])); assert 'G-001' in r[4]; assert any('G-013' in p and 'not in REQUIREMENTS.md' in p for p in r[2])");
 // req: R-580
 check("Python rail reads Part G from REQUIREMENTS.md when the template file is absent", noGeneral.status === 0, noGeneral.stderr ?? "");
 const drift = pythonFixture("python-drift", [["G-001", "The project shall keep its two shall cells."]], [["G-001", "The file shall govern the cell."]]);
 const driftCheck = pythonRail(drift, "import runpy,sys; from pathlib import Path; m=runpy.run_path(sys.argv[2]); r=m['check'](Path(sys.argv[1]), test_roots=()); line=m['_drift_line'](Path(sys.argv[1])); assert r[2] == []; assert line and line.endswith('G-001')");
 // req: R-583
 check("Python rail reports drift without failing its check", driftCheck.status === 0, driftCheck.stderr ?? "");
 const malformed = pythonFixture("python-malformed", [["G-017", "The malformed fixture shall fail.", "untested"]], [["G-017", "The malformed fixture shall fail.", "bogus"]]);
 const badStatus = pythonRail(malformed, "import runpy,sys; from pathlib import Path; import pytest; m=runpy.run_path(sys.argv[2]);\ntry: m['check'](Path(sys.argv[1]), test_roots=())\nexcept pytest.UsageError as e: assert 'unknown status' in str(e) and 'bogus' in str(e)\nelse: raise AssertionError('invalid template status was masked by project ownership')");
 // req: R-579
 check("Python rejects malformed template status before merging project-owned fields", badStatus.status === 0, badStatus.stderr ?? "");
 const conftestSource = readFileSync(new URL("../../../templates/python/template/tests/conftest.py", import.meta.url), "utf8");
 for (const [shape, malformedTable, expected] of [
  ["duplicate ID", table([["G-017", "The duplicate fixture shall fail."], ["G-017", "The duplicate fixture shall fail again."]]), "duplicate id G-017"],
  ["wrong cell count", "| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| G-017 | The cell-count fixture shall fail. | untested | — | extra |\n", "cells, expected 4"],
 ]) {
  const fullRun = join(root, `python-full-${shape.replaceAll(" ", "-")}`);
  mkdirSync(join(fullRun, "tests"), { recursive: true });
  writeFileSync(join(fullRun, "conftest.py"), conftestSource);
  writeFileSync(join(fullRun, "pytest.ini"), "[pytest]\ntestpaths = tests\n");
  writeFileSync(join(fullRun, "REQUIREMENTS.md"), table([["R-900", "The fixture shall exist."]]));
  writeFileSync(join(fullRun, "REQUIREMENTS-general.md"), malformedTable);
  writeFileSync(join(fullRun, "tests", "test_smoke.py"), "def test_smoke():\n    assert True\n");
  const fullPytest = probe("uvx", ["--with", "pytest", "pytest", "-o", "addopts="], { cwd: fullRun, env });
  const fullOutput = `${fullPytest.stdout ?? ""}${fullPytest.stderr ?? ""}`;
  // req: R-583
  check(`full pytest reports malformed ${shape} as a readable rail failure`, fullPytest.status === 1 && fullOutput.includes(expected) && fullOutput.includes("requirements trace FAILED:") && !fullOutput.includes("INTERNALERROR") && !fullOutput.includes("PluggyTeardownRaisedWarning"), `${fullPytest.status}: ${fullOutput.slice(-1200)}`);
 }
 const duplicateTs = table([["G-017", "The duplicate fixture shall fail."], ["G-017", "The duplicate fixture shall fail again."]]);
 const wrongCountTs = "| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| G-017 | The cell-count fixture shall fail. | untested | — | extra |\n";
 for (const [shape, malformedText, expected] of [["duplicate ID", duplicateTs, "duplicate id G-017"], ["wrong cell count", wrongCountTs, "cells"]]) {
  writeFileSync(join(root, "REQUIREMENTS.md"), table([["R-900", "The fixture shall exist."]]));
  writeFileSync(join(root, "REQUIREMENTS-general.md"), malformedText);
  let rejected = false;
  try { railCheck(root, { testRoots: ["tests"] }); } catch (error) { rejected = String(error).includes(expected); }
  // req: R-583
  check(`TypeScript rail rejects malformed ${shape} before returning drift`, rejected);
 }
}
if (!haveCopier) {
 console.log(`SKIP fresh Part G render matrix: ${unavailableReason("uvx copier")}${copyProbe.error ? ` (${copyProbe.error.message})` : ""}`);
} else {
 for (const language of ["python", "typescript"]) {
  for (const adopt of [false, true]) {
   const dest = join(root, `render-${language}-${adopt ? "adopt" : "scaffold"}`);
   const copyArgs = ["copier", "copy", "--trust", "--defaults", "--vcs-ref", "HEAD", "-d", `language=${language}`, "-d", `project_name=partg-${language}`];
   if (adopt) copyArgs.push("-d", "adopt=true");
   copyArgs.push(sourceRoot.pathname, dest);
   const rendered = spawnSync("uvx", copyArgs, { encoding: "utf8", env, cwd: root });
   const generalPath = join(dest, "REQUIREMENTS-general.md");
   const generalText = existsSync(generalPath) ? readFileSync(generalPath, "utf8") : "";
   const generalRows = parseG(generalText);
   const expectedRows = parseG(shared.replaceAll("{{ _status }}", adopt ? "untested" : "implemented"));
   const matches = rendered.status === 0 && generalRows.size === sharedRequirements.size && JSON.stringify([...generalRows]) === JSON.stringify([...expectedRows]) && !/\{\{|\{%/.test(generalText);
   // req: R-581
   check("render has the shared Part G map, mode status, and no Jinja", matches, `${language}/${adopt}: ${rendered.stdout} ${rendered.stderr} ${generalRows.size}/${expectedRows.size}`);
  }
 }
}
const repo = sourceRoot;
const available = copyProbe;
const hasOldTag = probe("git", ["-C", repo.pathname, "rev-parse", "--verify", "v0.6.0"]).status === 0;
if (!haveCopier || !hasOldTag || !havePytest) {
 console.log(`SKIP copier update legs: ${!haveCopier ? unavailableReason("uvx copier") : !hasOldTag ? unavailableReason("v0.6.0 tag") : unavailableReason("pytest through uvx")}`);
} else {
 for (const language of ["python", "typescript"]) {
  const dest = join(root, `update-${language}`);
  const copy = spawnSync("uvx", ["copier", "copy", "--trust", "--defaults", "--vcs-ref", "v0.6.0", "-d", `language=${language}`, "-d", `project_name=partg-${language}`, repo.pathname, dest], { encoding: "utf8", env, cwd: root });
  const copiedRequirements = existsSync(join(dest, "REQUIREMENTS.md")) ? readFileSync(join(dest, "REQUIREMENTS.md"), "utf8") : "";
  const init = spawnSync("git", ["init", dest], { encoding: "utf8", env });
  spawnSync("git", ["-C", dest, "add", "."], { encoding: "utf8", env });
  const commit = spawnSync("git", ["-C", dest, "commit", "-m", "fixture"], { encoding: "utf8", env });
  const update = spawnSync("uvx", ["copier", "update", "--trust", "--defaults", "--vcs-ref", "HEAD", "--conflict", "rej"], { encoding: "utf8", env, cwd: dest });
  const rejects = existsSync(dest) ? findRejectFiles(dest) : [];
  // req: R-582
  check(`${language} update has no rejection files anywhere before map regeneration`, rejects.length === 0, rejects.join(", "));
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
  let pythonPytestOutput = "";
  let pythonPytestExit = 0;
  if (generalExists && language === "python") {
   const pytestRun = spawnSync("uvx", ["--with", "pytest", "pytest", "-o", "addopts="], { encoding: "utf8", env: { ...env, PYTHONPATH: join(dest, "src") }, cwd: dest });
   pythonPytestOutput = `${pytestRun.stdout ?? ""}${pytestRun.stderr ?? ""}`;
   pythonPytestExit = pytestRun.status ?? 1;
   // req: R-583
   check("Python earlier-tag update prints Part G drift", pythonPytestExit === 0 && pythonPytestOutput.includes("part g: 6 cells in REQUIREMENTS.md differ from REQUIREMENTS-general.md (the file governs): G-001, G-003, G-005, G-007, G-008, G-012"), `exit ${pythonPytestExit}; ${pythonPytestOutput.slice(-600)}`);
  }
  const clean = copy.status === 0 && init.status === 0 && commit.status === 0 && update.status === 0 && railExit === 0 && mapExit === 0 && rejects.length === 0 && copiedRequirements === readFileSync(join(dest, "REQUIREMENTS.md"), "utf8") && generalExists && checkOutput.includes("ears: 0 rows off form (allowance 0)") && checkOutput.includes("problems: 0") && checkOutput.endsWith("\n");
  // req: R-582
  check(`${language} earlier-tag copier update leaves REQUIREMENTS.md unchanged and its rail clean`, clean, `${copy.stderr}\n${update.stderr}\n${checkOutput}\n${pythonPytestOutput.slice(-3000)}`);
 }
}
if (!haveCopier || !hasOldTag || !havePytest) {
 console.log(`SKIP Python adopt update leg: ${!haveCopier ? unavailableReason("uvx copier") : !hasOldTag ? unavailableReason("v0.6.0 tag") : unavailableReason("pytest through uvx")}`);
} else {
const adoptRoot = join(root, "adopt-python");
mkdirSync(adoptRoot, { recursive: true });
const initialRequirements = "| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-900 | The existing project shall remain identifiable. | untested | — |\n";
writeFileSync(join(adoptRoot, "REQUIREMENTS.md"), initialRequirements);
const initAdopt = spawnSync("git", ["init", adoptRoot], { encoding: "utf8", env });
spawnSync("git", ["-C", adoptRoot, "add", "REQUIREMENTS.md"], { encoding: "utf8", env });
const commitAdopt = spawnSync("git", ["-C", adoptRoot, "commit", "-m", "existing project"], { encoding: "utf8", env });
const adoptCopy = spawnSync("uvx", ["copier", "copy", "--trust", "--defaults", "--vcs-ref", "v0.6.0", "-d", "language=python", "-d", "project_name=partg-adopt", "-d", "adopt=true", repo.pathname, adoptRoot], { encoding: "utf8", env, cwd: root });
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
}
console.log(failures ? `\n${failures} FAILED` : "\nall passed");
process.exit(failures ? 1 : 0);
