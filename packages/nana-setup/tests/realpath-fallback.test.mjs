#!/usr/bin/env node
/**
 * @module packages/nana-setup/tests/realpath-fallback.test.mjs
 * @purpose Prove setup remains consistent when native realpath fails inside the checkout but typed realpath succeeds.
 * @inputs This checkout's setup and stale-copy CLIs, a runtime-written preload, fresh temporary homes and projects, and POSIX/win32 setup forms.
 * @outputs PASS/FAIL/SKIP lines and a summary; a nonzero exit when any requirement check fails.
 * @effects disk (temporary homes, projects and preload only), process (bounded CLI, producer and preload-probe children).
 * @errors Preconditions and assertions fail their check; every child process has a per-case timeout.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";

const CASE_LIMIT_MS = 20_000;
const checkout = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const checkoutNative = fs.realpathSync.native(checkout);
const cli = path.join(checkout, "packages", "nana-setup", "bin", "nana-setup.mjs");
const producer = path.join(checkout, "packages", "nana-setup", "bin", "stale-copies.mjs");
const root = tmpDir(path.join(os.tmpdir(), "nana-realpath-fallback-"));
const preload = path.join(root, "native-realpath-error.mjs");
const preloadUrl = pathToFileURL(preload).href;
fs.writeFileSync(preload, `import fs from "node:fs";\nimport path from "node:path";\nconst root = ${JSON.stringify(checkoutNative)};\nconst injectedCode = ${JSON.stringify("EISDIR")};\nconst original = fs.realpathSync.native;\nfs.realpathSync.native = function (...args) {\n\tconst result = original.apply(this, args);\n\tif (result === root || result.startsWith(root + path.sep)) throw Object.assign(new Error("injected native realpath failure"), { code: injectedCode });\n\treturn result;\n};\n`);

const forms = process.platform === "win32"
	? [{ name: "native", platform: undefined }]
	: [{ name: "POSIX", platform: undefined }, { name: "forced win32", platform: "win32" }];
let passes = 0;
let fails = 0;
let skips = 0;

function check(title, body) {
	try {
		body();
		console.log("PASS", title);
		passes++;
	} catch (error) {
		console.log("FAIL", title, error?.message ?? String(error));
		fails++;
	}
}
function skip(reason) { console.log("SKIP", reason); skips++; }
function assert(condition, detail) { if (!condition) throw new Error(detail); }
function fresh(prefix) { return tmpDir(path.join(root, prefix)); }
function assertFinished(result, label) {
	assert(!result.error, `${label} did not finish: ${result.error?.message}`);
	assert(result.signal === null, `${label} ended by ${result.signal}`);
}
function childEnv(home, form) {
	const env = {
		...process.env,
		HOME: home,
		USERPROFILE: home,
		PATH: `${path.join(home, ".local", "bin")}${path.delimiter}${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ""}`,
	};
	delete env.PI_CODING_AGENT_DIR;
	if (form.platform) env.NANA_SETUP_PLATFORM = form.platform;
	else delete env.NANA_SETUP_PLATFORM;
	return env;
}
function runScript(script, args, item, failure) {
	const nodeArgs = failure ? ["--import", preloadUrl, script, ...args] : [script, ...args];
	return spawnSync(process.execPath, nodeArgs, {
		cwd: item.project,
		env: childEnv(item.home, item.form),
		encoding: "utf8",
		timeout: CASE_LIMIT_MS,
	});
}
function runSetup(args, item, failure = false) {
	return runScript(cli, [...args, "--home", item.home], item, failure);
}
function runProducer(item, failure = false) {
	return runScript(producer, [], item, failure);
}
function doctorRows(result) {
	assertFinished(result, "doctor");
	return String(result.stdout).split(/\r?\n/u).flatMap((line) => {
		const match = line.match(/^\s*([✓✗!·])\s+(.+?)\s{2,}/u);
		return match ? [[match[1], match[2]]] : [];
	});
}
function wouldUnlinkRows(result) {
	return String(result.stdout).split(/\r?\n/u).filter((line) => line.includes("would unlink"));
}
function fixture(form, label) {
	return { home: fresh(`${label}-home-`), project: fresh(`${label}-project-`), form };
}
function assertPreload() {
	const probe = spawnSync(process.execPath, ["--import", preloadUrl, "-e", `import fs from "node:fs"; let code; try { fs.realpathSync.native(${JSON.stringify(checkout)}); } catch (error) { code = error.code; } process.stdout.write(String(code ?? "NO_ERROR"));`], {
		encoding: "utf8",
		timeout: CASE_LIMIT_MS,
	});
	assertFinished(probe, "preload probe");
	assert(probe.status === 0 && probe.stdout === "EISDIR", `preload probe expected EISDIR, got exit=${probe.status} stdout=${JSON.stringify(probe.stdout)} stderr=${probe.stderr}`);
}
function prepared(form, label) {
	const item = fixture(form, label);
	assertPreload();
	const install = runSetup(["install"], item, true);
	assertFinished(install, "install under native failure");
	assert(install.status === 0, `${form.name}: install under native failure exited ${install.status}\n${install.stdout}\n${install.stderr}`);
	const controlDoctor = runSetup(["doctor"], item);
	const rows = doctorRows(controlDoctor);
	assert(rows.some(([status, row]) => status === "✓" && /^(?:hook |settings |skill )/u.test(row)), `${form.name}: control doctor has no ✓ hook, settings or skill row\n${controlDoctor.stdout}\n${controlDoctor.stderr}`);
	return { item, controlDoctor, controlRows: rows };
}

// req: R-2182
check("R-2182: doctor row labels and statuses match control when native realpath fails inside the checkout", () => {
	for (const form of forms) {
		const { item, controlRows } = prepared(form, `2182-${form.name}`);
		const failed = runSetup(["doctor"], item, true);
		const actualRows = doctorRows(failed);
		assert(JSON.stringify(actualRows) === JSON.stringify(controlRows), `${form.name}: doctor rows differ\ncontrol=${JSON.stringify(controlRows)}\nfailure=${JSON.stringify(actualRows)}\n${failed.stderr}`);
	}
});

// req: R-2183
check("R-2183: the stale-copy producer stays silent in control and native-realpath-failure runs", () => {
	for (const form of forms) {
		const { item } = prepared(form, `2183-${form.name}`);
		const control = runProducer(item);
		const failed = runProducer(item, true);
		assertFinished(control, "control stale-copy producer");
		assertFinished(failed, "failure stale-copy producer");
		assert(control.status === 0 && control.stdout === "", `${form.name}: control producer exit=${control.status} stdout=${JSON.stringify(control.stdout)} stderr=${control.stderr}`);
		assert(failed.status === 0 && failed.stdout === "", `${form.name}: failure producer exit=${failed.status} stdout=${JSON.stringify(failed.stdout)} stderr=${failed.stderr}`);
	}
});

// req: R-2184
process.platform !== "win32" ? check("R-2184: uninstall dry-run keeps the control would-unlink rows when native realpath fails inside the checkout", () => {
	const form = { name: "POSIX", platform: undefined };
	const { item } = prepared(form, "2184-POSIX");
	const control = runSetup(["uninstall", "--dry-run"], item);
	const failed = runSetup(["uninstall", "--dry-run"], item, true);
	assertFinished(control, "control uninstall dry-run");
	assertFinished(failed, "failure uninstall dry-run");
	const expectedRows = wouldUnlinkRows(control);
	const actualRows = wouldUnlinkRows(failed);
	assert(control.status === 0, `control uninstall exited ${control.status}\n${control.stdout}\n${control.stderr}`);
	assert(failed.status === 0, `failure uninstall exited ${failed.status}\n${failed.stdout}\n${failed.stderr}`);
	assert(expectedRows.length > 0, `control uninstall printed no would-unlink rows\n${control.stdout}`);
	assert(JSON.stringify(actualRows) === JSON.stringify(expectedRows), `would-unlink rows differ\ncontrol=${JSON.stringify(expectedRows)}\nfailure=${JSON.stringify(actualRows)}`);
}) : skip("R-2184 — uninstall is POSIX-only");

console.log(`SUMMARY  PASS=${passes} FAIL=${fails} SKIP=${skips}`);
if (fails) process.exitCode = 1;
