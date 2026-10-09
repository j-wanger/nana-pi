/**
 * @module packages/nana-pack/tests/pi-install.test.mjs
 * @purpose Pin the shared installed-pi locator's override, fallback, and diagnostic behavior.
 * @inputs The pi-install helper and synthetic package/bin fixtures in the OS temp directory.
 * @outputs PASS/FAIL checks and a nonzero exit when the locator contract breaks.
 * @effects disk (writes temporary fixture metadata and links), process (temporarily changes locator env).
 * @errors Failed assertions print FAIL and exit nonzero.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { findPiRoot } from "./pi-install.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

let fails = 0;
const check = (name, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : extra); if (!ok) fails++; };
const root = tmpDir(path.join(os.tmpdir(), "pi-install-test-"));
const packageRoot = path.join(root, "package");
fs.mkdirSync(packageRoot, { recursive: true });
fs.writeFileSync(path.join(packageRoot, "package.json"), JSON.stringify({ name: "@earendil-works/pi-coding-agent" }));
const oldDesk = process.env.DESK_PI_ROOT;
const oldPath = process.env.PATH;
const oldPrefix = process.env.npm_config_prefix;
try {
	process.env.DESK_PI_ROOT = packageRoot;
	// req: R-601
	check("a valid DESK_PI_ROOT package directory is returned", findPiRoot() === packageRoot);
	process.env.DESK_PI_ROOT = path.join(root, "not-a-package");
	let invalid = "";
	try { findPiRoot(); } catch (error) { invalid = error.message; }
	// req: R-601
	check("an invalid DESK_PI_ROOT fails naming the exclusive candidate", invalid.includes(process.env.DESK_PI_ROOT));

	const bin = path.join(root, "bin");
	const prefix = path.join(root, "prefix");
	fs.mkdirSync(bin); fs.mkdirSync(prefix);
	const npmPath = (oldPath ?? "").split(path.delimiter).map((entry) => path.join(entry, process.platform === "win32" ? "npm.cmd" : "npm")).find((entry) => fs.existsSync(entry));
	if (process.platform !== "win32") {
		fs.symlinkSync(process.execPath, path.join(bin, "node"));
		if (npmPath) fs.symlinkSync(npmPath, path.join(bin, "npm"));
		process.env.PATH = `${bin}:/usr/bin:/bin`;
		process.env.npm_config_prefix = prefix;
	} else {
		process.env.PATH = `${bin}${path.delimiter}${oldPath ?? ""}`;
		process.env.npm_config_prefix = prefix;
	}
	delete process.env.DESK_PI_ROOT;
	let missing = "";
	try { findPiRoot(); } catch (error) { missing = error.message; }
	// req: R-601
	check("missing pi fails naming npm-root and PATH candidates", missing.includes("npm root -g") && missing.includes("realpath of pi on PATH"));
	const testsDir = path.dirname(fileURLToPath(import.meta.url));
	const piTests = ["config-trust", "config-project-gate-fallback", "objective-golden", "handoff-staleness", "post-edit-status", "post-edit-file-queue"];
	const unmigrated = piTests.filter((name) => {
		const source = fs.readFileSync(path.join(testsDir, `${name}.test.mjs`), "utf8");
		const locator = source.indexOf("const piRoot = findPiRoot()");
		const homeSwap = source.indexOf("process.env.HOME =");
		return !source.includes('from "./pi-install.mjs"') || locator < 0 || (homeSwap >= 0 && locator > homeSwap) || source.includes("@earendil-works/pi-coding-agent is not installed");
	});
	// req: R-601
	check("all installed-pi pack tests use the shared locator before HOME isolation", unmigrated.length === 0, unmigrated.join(", "));
} finally {
	if (oldDesk === undefined) delete process.env.DESK_PI_ROOT; else process.env.DESK_PI_ROOT = oldDesk;
	if (oldPath === undefined) delete process.env.PATH; else process.env.PATH = oldPath;
	if (oldPrefix === undefined) delete process.env.npm_config_prefix; else process.env.npm_config_prefix = oldPrefix;
}
process.exit(fails ? 1 : 0);
