/**
 * @module packages/nana-setup/tests/doctor-memory-links.test.mjs
 * @purpose Pins two-tier doctor memory-link resolution by frontmatter name and its bounded issue output.
 * @inputs memoryLinkState, the configured issue limit, and isolated memory tiers.
 * @outputs PASS/FAIL lines and a nonzero exit when an assertion fails.
 * @effects disk (temporary memory fixtures only).
 * @errors failed assertions produce a nonzero exit.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { diagnose, memoryLinkState, MEMORY_LINK_ISSUE_LIMIT } from "../lib/doctor.mjs";
import { install } from "../lib/steps.mjs";
import { projectMemoryDir } from "../lib/project-key.mjs";
import { resolveLayout } from "../lib/paths.mjs";

const root = tmpDir(path.join(os.tmpdir(), "nana-memory-links-"));
const shared = path.join(root, "shared");
const project = path.join(root, "project");
fs.mkdirSync(shared); fs.mkdirSync(project);
let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };
const write = (tier, file, name, body = "") => fs.writeFileSync(path.join(tier, file), `---\nname: ${name}\n---\n${body}`);

write(shared, "actual-file.md", "shared-name", "Shared body.\n");
write(project, "project-file.md", "project-name", "Project body.\n");
write(shared, "references.md", "references", "[[shared-name]] [[project-name]] [[missing-name]]\n");
write(project, "references.md", "local-references", "[[shared-name]] [[project-name]]\n");
// req: R-990
check("README describes dangling links as informational and reserves warnings for cross-tier and ambiguous links", /Dangling links are informational and add only a count; they do not fail doctor\.[\s\S]*Cross-tier and ambiguous links read `!`/.test(fs.readFileSync(fileURLToPath(new URL("../README.md", import.meta.url)), "utf8")));
const snapshot = (dir) => fs.readdirSync(dir).sort().map((file) => [file, fs.readFileSync(path.join(dir, file), "utf8")]);
const beforeShared = snapshot(shared);
const beforeProject = snapshot(project);
let state = memoryLinkState(shared, project);
// req: R-990
check("frontmatter names ignore filenames; only cross-tier links are issues", !state.ok && state.issues.length === 1 && state.issues[0].includes("shared-to-project link [[project-name]]") && state.danglingCount === 1, JSON.stringify(state));
// req: R-990
check("memory lint leaves both tiers byte-identical", JSON.stringify(snapshot(shared)) === JSON.stringify(beforeShared) && JSON.stringify(snapshot(project)) === JSON.stringify(beforeProject));

{
	const duplicate = path.join(shared, "second-file.md");
	write(shared, "second-file.md", "shared-name", "duplicate\n");
	state = memoryLinkState(shared, project);
	// req: R-990
	check("duplicate frontmatter names in a tier are reported as ambiguous", state.issues.some((i) => i.includes("ambiguous name [[shared-name]] in shared tier")), JSON.stringify(state));
	fs.unlinkSync(duplicate);
}

{
	const names = Array.from({ length: MEMORY_LINK_ISSUE_LIMIT + 5 }, (_, i) => `target-${i}`);
	const body = names.map((name) => `[[${name}]]`).join(" ");
	for (const name of names) write(project, `${name}.md`, name, "target\n");
	write(shared, "many.md", "many", body);
	state = memoryLinkState(shared, project);
	// req: R-991
	check("memory diagnostic limit is pinned", MEMORY_LINK_ISSUE_LIMIT === 30);
	// req: R-991
	check("checker discovers issues beyond the output limit", state.issues.length > MEMORY_LINK_ISSUE_LIMIT);
	const home = path.join(root, "doctor-home");
	const layout = resolveLayout({ home });
	fs.mkdirSync(layout.sharedMemoryDir, { recursive: true });
	const projectDir = path.join(root, "doctor-project"); fs.mkdirSync(projectDir);
	const memoryDir = projectMemoryDir(layout.projectsDir, projectDir); fs.mkdirSync(memoryDir, { recursive: true });
	for (const name of names) write(memoryDir, `${name}.md`, name, "target\n");
	write(layout.sharedMemoryDir, "bounded.md", "bounded", body);
	const row = diagnose(layout, { projectDir }).find((item) => item.label === "memory links");
	// req: R-991
	check("doctor reports only the configured issue limit plus a remainder count", row?.status === "warn" && row.detail.includes("… 5 more") && row.detail.split("; ").length === MEMORY_LINK_ISSUE_LIMIT + 1, row?.detail);
}

const doctorMemoryResult = (label, sharedFiles, projectFiles) => {
	const home = path.join(root, `${label}-doctor-home`);
	const layout = resolveLayout({ home });
	install(layout);
	const subagentsPackage = path.join(layout.piHome, "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(subagentsPackage, { recursive: true });
	fs.writeFileSync(path.join(subagentsPackage, "package.json"), '{"version":"0.75.0"}\n');
	const projectDir = path.join(root, `${label}-doctor-project`); fs.mkdirSync(projectDir);
	const canonicalProjectDir = fs.realpathSync(projectDir);
	const projectMemory = projectMemoryDir(layout.projectsDir, canonicalProjectDir); fs.mkdirSync(projectMemory, { recursive: true });
	for (const [file, name, body] of sharedFiles) write(layout.sharedMemoryDir, file, name, body);
	for (const [file, name, body] of projectFiles) write(projectMemory, file, name, body);
	const cli = fileURLToPath(new URL("../bin/nana-setup.mjs", import.meta.url));
	return spawnSync(process.execPath, [cli, "doctor", "--home", home], { cwd: canonicalProjectDir, encoding: "utf8" });
};

{
	const result = doctorMemoryResult("cross-tier", [["reference.md", "reference", "[[project-only]]\n"]], [["target.md", "project-only", "target\n"]]);
	// req: R-990
	check("doctor warns and exits nonzero for a shared-to-project link", result.status === 1 && /! memory links\s+.*shared-to-project link \[\[project-only\]\]/.test(result.stdout), `${result.status} ${result.stdout} ${result.stderr}`);
}

{
	const result = doctorMemoryResult("ambiguous", [["reference.md", "reference", "[[duplicated]]\n"], ["first.md", "duplicated", "first\n"], ["second.md", "duplicated", "second\n"]], []);
	// req: R-990
	check("doctor warns and exits nonzero for an ambiguous name", result.status === 1 && /! memory links\s+.*ambiguous name \[\[duplicated\]\] in shared tier/.test(result.stdout), `${result.status} ${result.stdout} ${result.stderr}`);
}

{
	const result = doctorMemoryResult("project-ambiguous", [], [["reference.md", "reference", "[[duplicated-local]]\n"], ["first.md", "duplicated-local", "first\n"], ["second.md", "duplicated-local", "second\n"]]);
	// req: R-990
	check("doctor warns and exits nonzero for project-tier ambiguity", result.status === 1 && /! memory links\s+.*ambiguous name \[\[duplicated-local\]\] in project tier/.test(result.stdout), `${result.status} ${result.stdout} ${result.stderr}`);
}

{
	const home = path.join(root, "dangling-doctor-home");
	const layout = resolveLayout({ home });
	install(layout);
	const subagentsPackage = path.join(layout.piHome, "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(subagentsPackage, { recursive: true });
	fs.writeFileSync(path.join(subagentsPackage, "package.json"), '{"version":"0.75.0"}\n');
	const projectDir = path.join(root, "dangling-doctor-project"); fs.mkdirSync(projectDir);
	const projectMemory = projectMemoryDir(layout.projectsDir, projectDir); fs.mkdirSync(projectMemory, { recursive: true });
	write(layout.sharedMemoryDir, "future.md", "future", "[[not-written-yet]] [[another-future]]\n");
	const cli = fileURLToPath(new URL("../bin/nana-setup.mjs", import.meta.url));
	const result = spawnSync(process.execPath, [cli, "doctor", "--home", home], { cwd: projectDir, encoding: "utf8" });
	// req: R-990
	check("dangling-only links keep doctor green and report only their count", result.status === 0 && /✓ memory links\s+no cross-tier or ambiguous wiki links · 2 links name memories not written yet/.test(result.stdout) && !result.stdout.includes("not-written-yet") && !result.stdout.includes("another-future"), `${result.status} ${result.stdout} ${result.stderr}`);
}

console.log(`${fails ? "FAIL" : "PASS"} summary: ${fails} failures`);
process.exit(fails ? 1 : 0);
