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
	const override = findPiRoot();
	// req: R-601
	check("a valid DESK_PI_ROOT package directory is returned", override.root === packageRoot && override.how === "DESK_PI_ROOT");
	process.env.DESK_PI_ROOT = path.join(root, "not-a-package");
	let invalid = "";
	try { findPiRoot(); } catch (error) { invalid = error.message; }
	// req: R-601
	check("an invalid DESK_PI_ROOT fails naming the exclusive candidate", invalid.includes(process.env.DESK_PI_ROOT));

	delete process.env.DESK_PI_ROOT;
	const injectedRoot = path.join(root, "injected-global");
	const injectedPackage = path.join(injectedRoot, "@earendil-works", "pi-coding-agent");
	fs.mkdirSync(injectedPackage, { recursive: true });
	fs.writeFileSync(path.join(injectedPackage, "package.json"), JSON.stringify({ name: "@earendil-works/pi-coding-agent" }));
	const calls = [];
	const fakeSpawn = (command, args, options) => {
		calls.push({ command, args, options });
		return { status: 0, stdout: `${injectedRoot}\n` };
	};
	findPiRoot({ platform: "win32", spawn: fakeSpawn });
	const windowsCall = calls[0];
	calls.length = 0;
	findPiRoot({ platform: "darwin", spawn: fakeSpawn });
	const darwinCall = calls[0];
	// req: R-601
	check("npm discovery uses the command processor only on win32",
		windowsCall?.command === (process.env.ComSpec || "cmd.exe") &&
		JSON.stringify(windowsCall.args) === JSON.stringify(["/d", "/s", "/c", "npm root -g"]) &&
		darwinCall?.command === "npm" && JSON.stringify(darwinCall.args) === JSON.stringify(["root", "-g"]));

	if (process.platform === "win32") {
		console.log("SKIP missing-pi PATH fixture: native Windows pi-absent isolation is not implemented; this platform leg is declared unexecuted");
	} else {
		const bin = path.join(root, "bin");
		const prefix = path.join(root, "prefix");
		fs.mkdirSync(bin); fs.mkdirSync(prefix);
		fs.symlinkSync(process.execPath, path.join(bin, "node"));
		const globalRoot = path.join(prefix, "lib", "node_modules");
		fs.writeFileSync(path.join(bin, "npm"), `#!/bin/sh\n[ "$1 $2" = "root -g" ] || exit 2\nprintf '%s\\n' '${globalRoot}'\n`, { mode: 0o755 });
		process.env.PATH = `${bin}:/usr/bin:/bin`;
		process.env.npm_config_prefix = prefix;
		delete process.env.DESK_PI_ROOT;
		const npmCandidate = path.join(globalRoot, "@earendil-works", "pi-coding-agent");
		let missing = "";
		try { findPiRoot(); } catch (error) { missing = error.message; }
		// req: R-601
		check("missing pi fails naming npm-root and PATH candidates", missing.includes("npm root -g") && missing.includes("realpath of pi on PATH"));
		// req: R-601
		check("missing pi diagnostic names the concrete npm package candidate", missing.includes(npmCandidate));

		const pathPackage = path.join(root, "path-package");
		fs.mkdirSync(pathPackage, { recursive: true });
		fs.writeFileSync(path.join(pathPackage, "package.json"), JSON.stringify({ name: "@earendil-works/pi-coding-agent" }));
		const executable = path.join(pathPackage, "bin", "pi");
		fs.mkdirSync(path.dirname(executable), { recursive: true });
		fs.writeFileSync(executable, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
		fs.symlinkSync(executable, path.join(bin, "pi"));
		const fromPath = findPiRoot();
		// req: R-601
		check("a PATH-resolved pi reports its resolution source", fromPath.root === fs.realpathSync(pathPackage) && fromPath.how === "PATH realpath");

		fs.mkdirSync(npmCandidate, { recursive: true });
		fs.writeFileSync(path.join(npmCandidate, "package.json"), JSON.stringify({ name: "@earendil-works/pi-coding-agent" }));
		const fromNpm = findPiRoot();
		// req: R-601
		check("npm root package wins over a distinct package on PATH", fromNpm.root === npmCandidate && fromNpm.how === "npm root -g");
	}
} finally {
	if (oldDesk === undefined) delete process.env.DESK_PI_ROOT; else process.env.DESK_PI_ROOT = oldDesk;
	if (oldPath === undefined) delete process.env.PATH; else process.env.PATH = oldPath;
	if (oldPrefix === undefined) delete process.env.npm_config_prefix; else process.env.npm_config_prefix = oldPrefix;
}
process.exit(fails ? 1 : 0);
