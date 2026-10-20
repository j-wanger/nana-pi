/**
 * @module packages/nana-setup/tests/doctor-quiet.test.mjs
 * @purpose Pin the selective muting of Node warnings in doctor and project --check while preserving unrelated warning output.
 * @inputs The nana-setup CLI, scratch homes and projects, a pi stub, and a warning-emitting preload.
 * @outputs PASS/FAIL lines and a summary with a nonzero exit when any check fails.
 * @effects disk (temporary fixtures), process (spawns the CLI with sanitized environments).
 * @errors Failed assertions print FAIL and make the test process exit nonzero.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { withPiStub } from "./stub-pi.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const root = tmpDir(path.join(os.tmpdir(), "nana-doctor-quiet-"));
const cli = fileURLToPath(new URL("../bin/nana-setup.mjs", import.meta.url));
let fails = 0;
const check = (title, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail); if (!ok) fails++; };
const warningLines = (stderr) => stderr.split(/\r?\n/).filter((line) => /^\(node:\d+\) /.test(line));
const runDoctor = (label, nodeOptions = []) => {
	const folder = path.join(root, label);
	const home = path.join(root, `${label}-home`);
	fs.mkdirSync(folder, { recursive: true });
	return { folder, result: withPiStub(() => {
		const env = { ...process.env };
		delete env.NODE_OPTIONS;
		delete env.NODE_NO_WARNINGS;
		delete env.NODE_REDIRECT_WARNINGS;
		return spawnSync(process.execPath, [...nodeOptions, cli, "doctor", "--home", home], { cwd: folder, env, encoding: "utf8" });
	}) };
};

const runProjectCheck = (label, { nodeOptions = [], config = true } = {}) => {
	const folder = path.join(root, label);
	fs.mkdirSync(folder, { recursive: true });
	if (config) {
		fs.mkdirSync(path.join(folder, ".pi"), { recursive: true });
		fs.writeFileSync(path.join(folder, ".pi", "nana-pack.json"), "{}\n");
	}
	const home = path.join(root, `${label}-home`);
	const env = { ...process.env };
	delete env.NODE_OPTIONS;
	delete env.NODE_NO_WARNINGS;
	delete env.NODE_REDIRECT_WARNINGS;
	return spawnSync(process.execPath, [...nodeOptions, cli, "project", folder, "--check", "--home", home], { cwd: folder, env, encoding: "utf8" });
};

{
	const { result } = runDoctor("without-project-config");
	const warnings = warningLines(result.stderr);
	// req: R-1750
	check("doctor in a folder without project config writes no Node warning", result.stdout.includes("nana-setup doctor") && warnings.length === 0, `status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
}

{
	const folder = path.join(root, "with-project-config");
	fs.mkdirSync(path.join(folder, ".pi"), { recursive: true });
	fs.writeFileSync(path.join(folder, ".pi", "nana-pack.json"), "{}\n");
	const home = path.join(root, "with-project-config-home");
	const result = withPiStub(() => {
		const env = { ...process.env };
		delete env.NODE_OPTIONS;
		delete env.NODE_NO_WARNINGS;
		delete env.NODE_REDIRECT_WARNINGS;
		return spawnSync(process.execPath, [cli, "doctor", "--home", home], { cwd: folder, env, encoding: "utf8" });
	});
	const warnings = warningLines(result.stderr);
	// req: R-1751
	check("doctor in a folder with project config writes no Node warning", result.stdout.includes("project trust") && warnings.length === 0, `status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
}

{
	const preload = path.join(root, "warning-preload.mjs");
	fs.writeFileSync(preload, `const originalWrite = process.stdout.write.bind(process.stdout);\nlet emitted = false;\nprocess.stdout.write = function (chunk, ...args) {\n\tif (!emitted && String(chunk).includes("nana-setup doctor")) {\n\t\temitted = true;\n\t\tprocess.emitWarning("doctor keeps this experimental warning", { type: "ExperimentalWarning" });\n\t\tprocess.emitWarning("doctor keeps this coded warning", { code: "NANA_DOCTOR_QUIET_PROBE" });\n\t}\n\treturn originalWrite(chunk, ...args);\n};\n`);
	const { result } = runDoctor("unmuted-warning", ["--import", pathToFileURL(preload).href]);
	// req: R-1752
	check("doctor still prints a Node warning it does not mute", result.stdout.includes("nana-setup doctor") && result.stderr.includes("doctor keeps this experimental warning") && result.stderr.includes("doctor keeps this coded warning"), `status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
}

{
	const result = runProjectCheck("project-without-config", { config: false });
	const warnings = warningLines(result.stderr);
	// req: R-2052
	check("project --check in a folder without project config writes no Node warning", result.stdout.includes("nana-setup project --check") && !result.stdout.includes("project trust") && warnings.length === 0, `status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
}

{
	const result = runProjectCheck("project-with-config", { config: true });
	const warnings = warningLines(result.stderr);
	// req: R-2050
	check("project --check in a folder with project config writes no Node warning", result.stdout.includes("nana-setup project --check") && result.stdout.includes("project trust") && warnings.length === 0, `status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
}

{
	const preload = path.join(root, "project-warning-preload.mjs");
	fs.writeFileSync(preload, `const originalWrite = process.stdout.write.bind(process.stdout);\nlet emitted = false;\nprocess.stdout.write = function (chunk, ...args) {\n\tif (!emitted && String(chunk).includes("nana-setup project --check")) {\n\t\temitted = true;\n\t\tprocess.emitWarning("project --check keeps this experimental warning", { type: "ExperimentalWarning" });\n\t\tprocess.emitWarning("project --check keeps this coded warning", { code: "NANA_PROJECT_QUIET_PROBE" });\n\t}\n\treturn originalWrite(chunk, ...args);\n};\n`);
	const result = runProjectCheck("project-unmuted-warning", { nodeOptions: ["--import", pathToFileURL(preload).href] });
	// req: R-2051
	check("project --check still prints a Node warning it does not mute", result.stdout.includes("nana-setup project --check") && result.stderr.includes("project --check keeps this experimental warning") && result.stderr.includes("project --check keeps this coded warning"), `status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
}

console.log(`${fails ? "FAIL" : "PASS"} summary: ${fails} failures`);
process.exit(fails ? 1 : 0);
