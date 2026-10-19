/**
 * @module packages/nana-pack/tests/post-edit-utf8.test.mjs
 * @purpose Pin UTF-8 Python checker output and exact environment pass-through from the owner for post-edit checks.
 * @inputs extensions/nana-post-edit.ts, Python 3.7 or later when available, node, and user-scope config under a temporary HOME.
 * @outputs Four PASS/FAIL/SKIP verdict lines, Python discovery details, and exit 1 when a check fails.
 * @effects disk (temporary HOME, workspaces, checker scripts and observations), process (runs post-edit checkers and temporarily changes locale variables).
 * @errors Missing suitable Python fails its two checks naming candidates tried; watchdog expiry or a false assertion fails the run.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { tmpDir } from "./tmp-dir.mjs";

const NANA_HOME = tmpDir(path.join(os.tmpdir(), "nana-home-"));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
const USER_CFG = path.join(NANA_HOME, ".pi", "agent", "nana-pack.json");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
const ext = (await import(new URL("../extensions/nana-post-edit.ts", import.meta.url).href)).default;

let fails = 0;
function check(name, ok, detail = "", skipRow) {
	if (skipRow) console.log("SKIP", skipRow, name, "—", detail);
	else console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
	if (!skipRow && !ok) fails++;
}

// chosen: five seconds is well above these local one-process checks while bounding every handler call.
const FIRE_WATCHDOG_MS = 5000;
async function fireUnderWatchdog(fire, file) {
	let timer;
	try {
		return await Promise.race([
			fire(file),
			new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`post-edit fire exceeded ${FIRE_WATCHDOG_MS}ms`)), FIRE_WATCHDOG_MS); }),
		]);
	} finally {
		clearTimeout(timer);
	}
}

function setup(command, tag) {
	const td = tmpDir(path.join(os.tmpdir(), `postedit-utf8-${tag}-`));
	fs.writeFileSync(USER_CFG, JSON.stringify({
		journal: { enabled: false },
		postEdit: { commands: [{ match: "\\.txt$", run: command, timeoutMs: 3000 }] },
	}));
	const handlers = {};
	ext({ on: (name, handler) => { handlers[name] = handler; } });
	const ctx = { cwd: td, hasUI: false, isProjectTrusted: () => true, signal: new AbortController().signal };
	const file = path.join(td, `${tag}.txt`);
	fs.writeFileSync(file, "edited\n");
	const fire = () => handlers.tool_result(
		{ toolName: "edit", isError: false, input: { path: file }, content: [{ type: "text", text: "edited" }] },
		ctx,
	);
	return { td, file, fire };
}

function shellQuote(value) {
	if (process.platform === "win32") return `"${value}"`;
	return `'${value.replaceAll("'", "'\\''")}'`;
}

function snapshot(names) {
	return new Map(names.map((name) => [name, Object.hasOwn(process.env, name) ? process.env[name] : undefined]));
}
function restore(values) {
	for (const [name, value] of values) {
		if (value === undefined) delete process.env[name];
		else process.env[name] = value;
	}
}

const PYTHON_PROBE = "import sys; print(sys.executable); print('.'.join(map(str, sys.version_info[:3]))); raise SystemExit(0 if sys.version_info >= (3, 7) else 1)";
const pythonAttempts = [];
let python;
for (const command of ["python3", "python"]) {
	const probe = spawnSync(command, ["-c", PYTHON_PROBE], { encoding: "utf8" });
	pythonAttempts.push(`${command} (${probe.error?.code ?? `exit ${probe.status}`})`);
	const lines = probe.stdout?.trim().split(/\r?\n/) ?? [];
	const version = lines.at(-1) ?? "";
	if (probe.status === 0 && lines.length >= 2 && /^\d+\.\d+\.\d+$/.test(version)) {
		python = { command, executable: lines.slice(0, -1).join("\n"), version };
		break;
	}
}
console.log(python ? `Python: ${python.version} ${python.executable}` : `Python unavailable: tried ${pythonAttempts.join(", ")}`);

const expected = "ï — λ";
let directOk = false;
let directDetail = `no Python 3.7 or later found; tried ${pythonAttempts.join(", ")}`;
let childOk = false;
let childDetail = directDetail;
let encodingSkip;
if (python) {
	const scripts = tmpDir(path.join(os.tmpdir(), "postedit-utf8-python-"));
	const directScript = path.join(scripts, "direct.py");
	const parentScript = path.join(scripts, "parent.py");
	const directSource = [
		"import sys",
		"sys.stdout.reconfigure(errors=\"backslashreplace\")",
		"print(\"\\u00ef \\u2014 \\u03bb\")",
		"raise SystemExit(1)",
	].join("\n");
	const parentSource = [
		"import subprocess, sys",
		"child = subprocess.run([sys.executable, sys.argv[1]], capture_output=True, text=True)",
		"sys.stdout.reconfigure(errors=\"backslashreplace\")",
		"print(\"child said: \" + child.stdout, end=\"\")",
		"raise SystemExit(1)",
	].join("\n");
	if (!/^[\x00-\x7f]*$/.test(directSource + parentSource)) throw new Error("Python checker fixtures must remain ASCII");
	fs.writeFileSync(directScript, directSource);
	fs.writeFileSync(parentScript, parentSource);

	const saved = snapshot(["LC_ALL", "PYTHONUTF8", "PYTHONIOENCODING"]);
	try {
		process.env.LC_ALL = "en_US.ISO8859-1";
		delete process.env.PYTHONUTF8;
		delete process.env.PYTHONIOENCODING;
		const control = spawnSync(python.executable, [directScript], { env: process.env });
		if (Buffer.isBuffer(control.stdout) && control.stdout.includes(Buffer.from(expected, "utf8"))) {
			encodingSkip = "the direct control already wrote UTF-8 bytes under the forced host locale";
		} else {
			const direct = setup(`${shellQuote(python.executable)} ${shellQuote(directScript)}`, "direct");
			const unsetResult = await fireUnderWatchdog(direct.fire, direct.file);
			const unsetText = unsetResult?.content?.at(-1)?.text ?? "";
			process.env.PYTHONUTF8 = "";
			process.env.PYTHONIOENCODING = "";
			const emptyResult = await fireUnderWatchdog(direct.fire, direct.file);
			const emptyText = emptyResult?.content?.at(-1)?.text ?? "";
			const unsetOk = unsetText.includes(expected);
			const emptyOk = emptyText.includes(expected);
			directOk = unsetOk && emptyOk;
			directDetail = !unsetOk ? `unset case showed ${JSON.stringify(unsetText)}` : `empty case showed ${JSON.stringify(emptyText)}`;

			delete process.env.PYTHONUTF8;
			delete process.env.PYTHONIOENCODING;
			const parent = setup(`${shellQuote(python.executable)} ${shellQuote(parentScript)} ${shellQuote(directScript)}`, "child");
			const childResult = await fireUnderWatchdog(parent.fire, parent.file);
			const childText = childResult?.content?.at(-1)?.text ?? "";
			childOk = childText.includes(`child said: ${expected}`);
			childDetail = `unset case showed ${JSON.stringify(childText)}`;
		}
	} finally {
		restore(saved);
	}
}
// req: R-1740
check("a failing Python check with PYTHONUTF8 unset or empty shows the model its non-ASCII output as printed", directOk, encodingSkip ?? directDetail, encodingSkip ? "R-1740" : undefined);
// req: R-1741
check("a failing Python check shows the model its own Python child's non-ASCII output as printed", childOk, encodingSkip ?? childDetail, encodingSkip ? "R-1741" : undefined);

const envScriptDir = tmpDir(path.join(os.tmpdir(), "postedit-utf8-env-"));
const envScript = path.join(envScriptDir, "environment.cjs");
fs.writeFileSync(envScript, 'require("node:fs").writeFileSync(process.env.NANA_UTF8_ENV_OUT, JSON.stringify(process.env));\n');
const envCommand = `${shellQuote(process.execPath)} ${shellQuote(envScript)}`;
const fiveNames = ["PYTHONUTF8", "PYTHONIOENCODING", "LANG", "LC_ALL", "LC_CTYPE"];
let passThroughOk = false;
let passThroughDetail = "environment observation was not written";
{
	const saved = snapshot([...fiveNames, "NANA_UTF8_ENV_OUT"]);
	const values = {
		PYTHONUTF8: "owner-utf8",
		PYTHONIOENCODING: "owner-io-encoding",
		LANG: "owner-lang",
		LC_ALL: "owner-lc-all",
		LC_CTYPE: "owner-lc-ctype",
	};
	try {
		Object.assign(process.env, values);
		const run = setup(envCommand, "pass-through");
		const observedFile = path.join(run.td, "environment.json");
		process.env.NANA_UTF8_ENV_OUT = observedFile;
		await fireUnderWatchdog(run.fire, run.file);
		const observed = JSON.parse(fs.readFileSync(observedFile, "utf8"));
		passThroughOk = fiveNames.every((name) => observed[name] === values[name]);
		passThroughDetail = JSON.stringify(Object.fromEntries(fiveNames.map((name) => [name, observed[name]])));
	} finally {
		restore(saved);
	}
}
// req: R-1742
check("PYTHONUTF8, PYTHONIOENCODING, LANG, LC_ALL and LC_CTYPE values from pi reach the check unchanged", passThroughOk, passThroughDetail);

const unsetNames = ["PYTHONIOENCODING", "LANG", "LC_ALL", "LC_CTYPE"];
let unsetOk = false;
let unsetDetail = "environment observation was not written";
{
	const saved = snapshot(["PYTHONUTF8", ...unsetNames, "NANA_UTF8_ENV_OUT"]);
	try {
		process.env.PYTHONUTF8 = "owner-utf8";
		for (const name of unsetNames) delete process.env[name];
		const run = setup(envCommand, "unset");
		const observedFile = path.join(run.td, "environment.json");
		process.env.NANA_UTF8_ENV_OUT = observedFile;
		await fireUnderWatchdog(run.fire, run.file);
		const observed = JSON.parse(fs.readFileSync(observedFile, "utf8"));
		unsetOk = unsetNames.every((name) => !Object.hasOwn(observed, name));
		unsetDetail = JSON.stringify(Object.fromEntries(unsetNames.map((name) => [name, observed[name]])));
	} finally {
		restore(saved);
	}
}
// req: R-1743
check("PYTHONIOENCODING, LANG, LC_ALL and LC_CTYPE that pi leaves unset stay unset for the check", unsetOk, unsetDetail);

process.exit(fails);
