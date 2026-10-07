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
import { diagnose, memoryLinkState, MEMORY_LINK_ISSUE_LIMIT } from "../lib/doctor.mjs";
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
let state = memoryLinkState(shared, project);
const snapshot = (dir) => fs.readdirSync(dir).sort().map((file) => [file, fs.readFileSync(path.join(dir, file), "utf8")]);
const beforeShared = snapshot(shared);
const beforeProject = snapshot(project);
// req: R-990
check("frontmatter names ignore filenames and tier rules flag only invalid links", !state.ok && state.issues.some((i) => i.includes("shared-to-project link [[project-name]]")) && state.issues.some((i) => i.includes("dangling link [[missing-name]]")) && !state.issues.some((i) => i.includes("dangling link [[shared-name]]")) && !state.issues.some((i) => i.includes("dangling link [[project-name]]")), JSON.stringify(state));
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
	const body = Array.from({ length: MEMORY_LINK_ISSUE_LIMIT + 5 }, (_, i) => `[[absent-${i}]]`).join(" ");
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
	write(layout.sharedMemoryDir, "bounded.md", "bounded", body);
	const row = diagnose(layout, { projectDir }).find((item) => item.label === "memory links");
	// req: R-991
	check("doctor reports only the configured issue limit plus a remainder count", row?.status === "warn" && row.detail.includes("… 5 more") && row.detail.split("; ").length === MEMORY_LINK_ISSUE_LIMIT + 1, row?.detail);
}

console.log(`${fails ? "FAIL" : "PASS"} summary: ${fails} failures`);
process.exit(fails ? 1 : 0);
