/**
 * @module packages/nana-setup/tests/doctor-memory-links.test.mjs
 * @purpose Pin the dangling-only memory-link doctor regression.
 * @inputs Setup CLI, pi stub and an isolated memory home.
 * @outputs PASS/FAIL lines and a nonzero exit on failed assertions.
 * @effects disk (temporary memory fixtures), process (bounded doctor child).
 * @errors Failed assertions produce a nonzero exit.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { withPiStub } from "./stub-pi.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { install } from "../lib/steps.mjs";
import { projectMemoryDir } from "../lib/project-key.mjs";
import { resolveLayout } from "../lib/paths.mjs";

const root = tmpDir(path.join(os.tmpdir(), "nana-memory-links-"));
let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };
try {
	const home = path.join(root, "dangling-doctor-home");
	const layout = resolveLayout({ home });
	install(layout);
	const subagentsPackage = path.join(layout.piHome, "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(subagentsPackage, { recursive: true });
	fs.writeFileSync(path.join(subagentsPackage, "package.json"), '{"version":"0.75.0"}\n');
	const projectDir = path.join(root, "dangling-doctor-project"); fs.mkdirSync(projectDir);
	const projectMemory = projectMemoryDir(layout.projectsDir, projectDir); fs.mkdirSync(projectMemory, { recursive: true });
	fs.writeFileSync(path.join(layout.sharedMemoryDir, "future.md"), '---\nname: future\n---\n[[not-written-yet]] [[another-future]]\n');
	const cli = fileURLToPath(new URL("../bin/nana-setup.mjs", import.meta.url));
	const result = withPiStub(() => spawnSync(process.execPath, [cli, "doctor", "--home", home], { cwd: projectDir, encoding: "utf8", timeout: 20000 }));
	// req: R-4015
	check("dangling-only links keep doctor green and report only their count", result.status === 0 && /✓ memory links\s+no cross-tier or ambiguous wiki links · 2 links name memories not written yet/.test(result.stdout) && !result.stdout.includes("not-written-yet") && !result.stdout.includes("another-future"), `${result.status} ${result.stdout} ${result.stderr}`);
} finally {
	fs.rmSync(root, { recursive: true, force: true });
}
console.log(`${fails ? "FAIL" : "PASS"} summary: ${fails} failures`);
process.exitCode = fails ? 1 : 0;
