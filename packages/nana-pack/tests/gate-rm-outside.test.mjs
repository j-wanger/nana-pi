#!/usr/bin/env node
/**
 * @module packages/nana-pack/tests/gate-rm-outside.test.mjs
 * @purpose Pin prompts for readable non-recursive rm targets outside the working and accepted temp folders, including Git Bash path readings, the POSIX /tmp root, and the inside and variable-led passes.
 * @inputs the real nana-gate handler, gate-rm-outside, gate-shell, real-path, and one temporary fixture tree containing working, home, temp, outside, sibling, link and junction spellings
 * @outputs twelve named PASS/FAIL checks (or eleven and one Windows SKIP) and exit 1 when any requirement fails
 * @effects disk (one temporary fixture tree and gate config), process (temporarily sets HOME, USERPROFILE and temp variables)
 * @errors unexpected failures reject through a per-case timeout and fail the process; assertion failures print FAIL
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { gitBashPath, rmOutsideTargets } from "../lib/gate-rm-outside.ts";
import { acceptedTempRoots } from "../lib/gate-temp-roots.ts";
import { detectionSegments, splitCommand } from "../lib/gate-shell.ts";
import { realPath } from "../lib/real-path.mjs";

const F = tmpDir(path.join(os.tmpdir(), "gate-rm-outside-"));
const WORK = path.join(F, "work");
const NEVER_ROOT = path.join(path.parse(WORK).root, `nana-rm-outside-${process.pid}-${Math.random().toString(36).slice(2)}`);
const OUTSIDE = path.join(F, "outside");
const HOME = path.join(F, "home");
const TEMP_ROOT = path.join(F, "tmproot");
const WORK_SIBLING = path.join(F, "work-sibling");
const TEMP_SIBLING = path.join(F, "tmproot-sibling");
for (const dir of [path.join(WORK, "sub", "deep"), OUTSIDE, HOME, path.join(TEMP_ROOT, "sub"), WORK_SIBLING, TEMP_SIBLING]) fs.mkdirSync(dir, { recursive: true });
const linkType = process.platform === "win32" ? "junction" : "dir";
fs.symlinkSync(OUTSIDE, path.join(WORK, "linkout"), linkType);
fs.symlinkSync(OUTSIDE, path.join(TEMP_ROOT, "linkout"), linkType);
fs.symlinkSync(TEMP_ROOT, path.join(WORK, "linktmp"), linkType);
fs.symlinkSync(path.join(WORK, "sub"), path.join(WORK, "linkin"), linkType);
const TEMP_LINK = path.join(F, "tmproot-link");
fs.symlinkSync(TEMP_ROOT, TEMP_LINK, linkType);

const envNames = ["HOME", "USERPROFILE", ...(process.platform === "win32" ? ["TEMP", "TMP"] : ["TMPDIR"])];
const savedEnv = new Map(envNames.map((name) => [name, process.env[name]]));
process.env.HOME = HOME;
process.env.USERPROFILE = HOME;
for (const name of process.platform === "win32" ? ["TEMP", "TMP"] : ["TMPDIR"]) process.env[name] = TEMP_ROOT;
process.on("exit", () => {
	for (const [name, value] of savedEnv) value === undefined ? delete process.env[name] : (process.env[name] = value);
});

const USER_CFG = path.join(HOME, ".pi", "agent", "nana-pack.json");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: false }, gate: {} }));
const ext = (await import(new URL("../extensions/nana-gate.ts", import.meta.url).href)).default;
const handlers = {};
ext({ on: (name, fn) => { handlers[name] = fn; } });

let failures = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
	if (!ok) failures++;
};
async function deadline(promise, label) {
	let timer;
	try {
		return await Promise.race([
			promise,
			new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`timeout: ${label}`)), 2000); }),
		]);
	} finally {
		clearTimeout(timer);
	}
}
const shellQuote = (value) => `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
const gitBash = (p) => "/" + p[0].toLowerCase() + p.slice(2).replaceAll("\\", "/");
async function call(command, toolName = "bash", ui = null) {
	const ctx = { cwd: WORK, hasUI: !!ui, isProjectTrusted: () => false, ...(ui ? { ui } : {}) };
	return deadline(handlers.tool_call({ toolName, input: { command } }, ctx), `${toolName}: ${command}`);
}
async function reason(command, toolName = "bash") {
	return (await call(command, toolName))?.reason ?? "";
}
async function withHome(home, fn) {
	const saved = new Map(["HOME", "USERPROFILE"].map((name) => [name, process.env[name]]));
	process.env.HOME = home;
	process.env.USERPROFILE = home;
	try {
		return await fn();
	} finally {
		for (const [name, value] of saved) value === undefined ? delete process.env[name] : (process.env[name] = value);
	}
}
function moduleHits(command, tool = "bash") {
	const split = splitCommand(command);
	const options = { home: HOME, tempRoots: [TEMP_ROOT], segmentable: split.segmentable };
	const hits = rmOutsideTargets(split.segments, WORK, tool, options);
	if (!split.segmentable) for (const [segment, target] of rmOutsideTargets(detectionSegments(command), WORK, tool, options)) hits.set(segment, target);
	return [...hits.values()];
}
function gbHits(command, { platform = "win32", env = { TMP: TEMP_ROOT }, tool = "bash", tempRoots = [TEMP_ROOT] } = {}) {
	const split = splitCommand(command);
	const options = { home: HOME, tempRoots, segmentable: split.segmentable, platform, env };
	const hits = rmOutsideTargets(split.segments, WORK, tool, options);
	if (!split.segmentable) for (const [segment, target] of rmOutsideTargets(detectionSegments(command), WORK, tool, options)) hits.set(segment, target);
	return [...hits.values()];
}
const full = (value, cwd = WORK) => path.resolve(cwd, value);

{
	const cases = [
		["rm -f /tmp/out.txt", { TMP: TEMP_ROOT }, []],
		["rm /tmp/sub/x", { TMP: TEMP_ROOT }, []],
		["rm -f /tmp/sub/*.log", { TMP: TEMP_ROOT }, []],
		["rm -f /tmp", { TMP: TEMP_ROOT }, [TEMP_ROOT]],
		["rm -f /tmp/out.txt", { TEMP: TEMP_ROOT }, []],
		["rm -f /tmp/out.txt", { TMP: "", TEMP: TEMP_ROOT }, []],
		["rm -f /tmp/out.txt", { TMP: TEMP_ROOT, TEMP: OUTSIDE }, []],
		["rm -f /tmp/out.txt", { TMP: OUTSIDE, TEMP: TEMP_ROOT }, [path.join(OUTSIDE, "out.txt")]],
		["rm -f /tmp/out.txt", {}, [path.resolve(WORK, "/tmp/out.txt")]],
	];
	const results = cases.map(([command, env, expected]) => ({ command, actual: gbHits(command, { env }), expected }));
	// req: R-2490
	check("on Windows a Git Bash /tmp target is judged in the folder TMP names, or TEMP when TMP is unset", results.every(({ actual, expected }) => JSON.stringify(actual) === JSON.stringify(expected)), JSON.stringify(results));
}

{
	const cases = [
		["cd /tmp && rm -f out.txt", { TMP: TEMP_ROOT }, []],
		["pushd /tmp/sub && rm x", { TMP: TEMP_ROOT }, []],
		["cd /tmp && rm ../x", { TMP: TEMP_ROOT }, [path.join(F, "x")]],
	];
	const results = cases.map(([command, env, expected]) => ({ command, actual: gbHits(command, { env }), expected }));
	// req: R-2491
	check("on Windows a cd to Git Bash /tmp moves relative rm targets into the temp folder", results.every(({ actual, expected }) => JSON.stringify(actual) === JSON.stringify(expected)), JSON.stringify(results));
}

{
	const options = { platform: "win32", env: {} };
	const cases = [
		["/c/Users/u/x", "C:/Users/u/x", "C:\\Users\\u\\x"], ["/D/data/x", "D:/data/x", "D:\\data\\x"],
		["/c", "C:/", "C:\\"], ["/c/", "C:/", "C:\\"],
		["/cd/x", "/cd/x"], ["/1/x", "/1/x"], ["//c/x", "//c/x"], ["c/x", "c/x"], ["C:/x", "C:/x"], ["x", "x"], ["/c/a\\b", "/c/a\\b"],
	];
	const translated = cases.map(([spelling, expected]) => [spelling, gitBashPath(spelling, options), expected]);
	const platformCases = ["darwin", "linux"].map((platform) => [platform, gitBashPath("/c/x", { platform, env: {} })]);
	const ok = translated.every(([, actual, expected]) => actual === expected) && cases.slice(0, 4).every(([spelling, , expected]) => path.win32.resolve(gitBashPath(spelling, options)) === expected) && platformCases.every(([, actual]) => actual === "/c/x");
	// req: R-2492
	check("on Windows a Git Bash drive spelling such as /c/ reads as that drive's path", ok, JSON.stringify({ translated, platformCases }));
}

{
	const lookalikes = ["/tmpx/y", "/tmp2/y", "/cd/y"];
	const lookalikeExpected = lookalikes.map((spelling) => [path.resolve(WORK, spelling)]);
	const lookalikeHits = lookalikes.map((spelling) => gbHits(`rm -f ${spelling}`, { platform: "win32", env: { TMP: TEMP_ROOT } }));
	const climbOut = gbHits("rm -f /tmp/../outside/x", { platform: "win32", env: { TMP: TEMP_ROOT } });
	const linkTarget = path.join(TEMP_ROOT, "linkout", "x");
	const linkHits = gbHits("rm -f /tmp/linkout/x", { platform: "win32", env: { TMP: TEMP_ROOT } });
	const powershellHits = gbHits("Remove-Item /tmp/x", { platform: "win32", env: { TMP: TEMP_ROOT }, tool: "powershell" });
	const offWindows = ["darwin", "linux"].map((platform) => gbHits("rm -f /tmp/x", { platform, env: { TMP: TEMP_ROOT } }));
	const positiveControl = gbHits("rm -f /tmp/x", { platform: "win32", env: { TMP: TEMP_ROOT } });
	const ok = lookalikeHits.every((hits, index) => JSON.stringify(hits) === JSON.stringify(lookalikeExpected[index]))
		&& JSON.stringify(climbOut) === JSON.stringify([path.resolve(WORK, "/outside/x")])
		&& JSON.stringify(linkHits) === JSON.stringify([linkTarget])
		&& powershellHits.length === 1 && offWindows.every((hits) => hits.length === 1) && positiveControl.length === 0;
	// req: R-2493
	check("Git Bash lookalikes, climb-outs, links out of /tmp, PowerShell /tmp and /tmp off Windows still ask", ok, JSON.stringify({ lookalikeHits, lookalikeExpected, climbOut, linkHits, linkTarget, powershellHits, offWindows, positiveControl }));
}

{
	const NAME = `nana-rm-gitbash-${process.pid}-${Math.random().toString(36).slice(2)}`;
	const excluded = [path.parse(WORK).root, HOME, F];
	const cases = excluded.map((tmp) => {
		const env = { TMP: tmp };
		const tempRoots = acceptedTempRoots({ platform: "win32", env, home: HOME, tmpdir: env.TEMP ?? env.TMP });
		return { tmp, actual: gbHits(`rm -f /tmp/${NAME}`, { platform: "win32", env, tempRoots }), expected: [path.resolve(tmp, NAME)] };
	});
	const env = { TEMP: HOME };
	const tempRoots = acceptedTempRoots({ platform: "win32", env, home: HOME, tmpdir: env.TEMP ?? env.TMP });
	const tempFallback = gbHits(`rm -f /tmp/${NAME}`, { platform: "win32", env, tempRoots });
	const positiveEnv = { TMP: TEMP_ROOT };
	const positiveRoots = acceptedTempRoots({ platform: "win32", env: positiveEnv, home: HOME, tmpdir: positiveEnv.TEMP ?? positiveEnv.TMP });
	const positiveControl = gbHits(`rm -f /tmp/${NAME}`, { platform: "win32", env: positiveEnv, tempRoots: positiveRoots });
	const ok = cases.every(({ actual, expected }) => JSON.stringify(actual) === JSON.stringify(expected))
		&& JSON.stringify(tempFallback) === JSON.stringify([path.resolve(HOME, NAME)]) && positiveControl.length === 0;
	// req: R-2494
	check("a Git Bash /tmp target still asks when TMP names a drive root, the home folder or a folder above it", ok, JSON.stringify({ cases, tempFallback, expectedFallback: path.resolve(HOME, NAME), positiveControl }));
}

if (process.platform !== "win32") {
	console.log("SKIP on Windows a headless rm -f of a Git Bash /tmp file runs unblocked: Git Bash spellings are a Windows reading");
} else {
	const name = `nana-rm-gitbash-${process.pid}`;
	const saved = new Map(["TMP", "TEMP", "HOME", "USERPROFILE"].map((key) => [key, process.env[key]]));
	process.env.TMP = TEMP_ROOT;
	process.env.TEMP = TEMP_ROOT;
	process.env.HOME = path.join(HOME, "home");
	process.env.USERPROFILE = path.join(HOME, "home");
	try {
		const reasons = await Promise.all([reason(`rm -f /tmp/${name}`), reason(`cd /tmp && rm -f ${name}`)]);
		const outsideReason = await reason(`rm -f ${shellQuote(path.join(NEVER_ROOT, "x"))}`);
		// req: R-2495
		check("on Windows a headless rm -f of a Git Bash /tmp file runs unblocked", reasons.every((why) => why === "") && outsideReason.includes(path.resolve(NEVER_ROOT, "x")), JSON.stringify({ reasons, outsideReason }));
	} finally {
		for (const [key, value] of saved) value === undefined ? delete process.env[key] : (process.env[key] = value);
	}
}

if (process.platform !== "win32") {
	console.log("SKIP on Windows a headless rm of, or after a cd to, a Git Bash drive spelling is judged at that drive's path: Git Bash spellings are a Windows reading");
} else {
	const workTarget = gitBash(path.join(WORK, "x"));
	const tempTarget = gitBash(path.join(TEMP_ROOT, "x"));
	const outsideTarget = gitBash(path.join(NEVER_ROOT, "x"));
	const cases = await Promise.all([
		[ `rm -f ${shellQuote(workTarget)}`, "" ],
		[ `rm -f ${shellQuote(tempTarget)}`, "" ],
		[ `cd ${shellQuote(gitBash(WORK))} && rm -f x`, "" ],
	].map(async ([command, expected]) => ({ command, expected, actual: await reason(command) })));
	const outsideReason = await reason(`rm -f ${shellQuote(outsideTarget)}`);
	// req: R-2496
	check("on Windows a headless rm of, or after a cd to, a Git Bash drive spelling is judged at that drive's path", cases.every(({ actual, expected }) => actual === expected) && outsideReason.includes(path.resolve(NEVER_ROOT, "x")), JSON.stringify({ cases, outsideReason }));
}

if (process.platform !== "win32") {
	console.log("SKIP on Windows the gate reads Git Bash drive spellings as Git Bash's own cygpath does, over a usertemp /tmp mount: not running on Windows");
} else {
	const bash = path.join(process.env.ProgramFiles ?? "C:\\Program Files", "Git", "bin", "bash.exe");
	if (!fs.existsSync(bash)) {
		console.log("SKIP on Windows the gate reads Git Bash drive spellings as Git Bash's own cygpath does, over a usertemp /tmp mount: Git Bash bash.exe is missing from %ProgramFiles%\\Git\\bin");
	} else {
		const result = spawnSync(bash, ["-c", "/usr/bin/cygpath -w /c/Users /D/data/x; /usr/bin/mount"], { encoding: "utf8" });
		const lines = result.stdout.trim().split(/\r?\n/);
		const expected = ["/c/Users", "/D/data/x"].map((spelling) => path.win32.resolve(gitBashPath(spelling, { platform: "win32", env: {} })));
		const readsMatch = lines.length >= 3 && expected.every((value, index) => lines[index].toLowerCase() === value.toLowerCase());
		const usertemp = lines.slice(2).some((line) => / on \/tmp type \S+ \([^)]*usertemp[^)]*\)/i.test(line));
		// req: R-2497
		check("on Windows the gate reads Git Bash drive spellings as Git Bash's own cygpath does, over a usertemp /tmp mount", result.status === 0 && readsMatch && usertemp, JSON.stringify({ status: result.status, lines, expected, usertemp }));
	}
}

{
	const rootTarget = path.join(NEVER_ROOT, "x");
	const detectionTarget = path.join(NEVER_ROOT, "detected");
	const expected = path.resolve(rootTarget);
	const detectionCommand = `echo $(rm ${shellQuote(detectionTarget)})`;
	const headless = await Promise.all([reason(`rm ${shellQuote(rootTarget)}`), reason(`rm -f ${shellQuote(rootTarget)}`), reason(detectionCommand)]);
	const dialogs = [];
	const ui = { select: async (message, choices) => { dialogs.push({ message, choices }); return "Block"; }, setStatus() {}, notify() {}, theme: { fg: (_c, text) => text } };
	const interactive = await call(`rm ${shellQuote(rootTarget)}`, "bash", ui);
	const insideDialogs = [];
	const insideUi = { ...ui, select: async (message, choices) => { insideDialogs.push({ message, choices }); return "Block"; } };
	const inside = await call("rm -f x", "bash", insideUi);
	const ok = headless.slice(0, 2).every((r) => r.includes(expected)) && headless[2].includes(path.resolve(detectionTarget)) && interactive?.block === true && dialogs.length === 1 && dialogs[0].message.includes(expected) && !inside?.block && insideDialogs.length === 0;
	// req: R-2330
	check("plain rm and rm -f outside the working and temp folders ask and name the target", ok, JSON.stringify({ headless, interactive, dialogs: dialogs.length, inside, insideDialogs: insideDialogs.length }));
}

{
	const cases = [
		[shellQuote(path.join(OUTSIDE, "x")), path.join(OUTSIDE, "x")], ["../outside/x", path.join(OUTSIDE, "x")], ["~/x", path.join(HOME, "x")],
		["$HOME/x", path.join(HOME, "x")], ["${HOME}/x", path.join(HOME, "x")], ["-- ../outside/x", path.join(OUTSIDE, "x")],
		["../outside/*.log", path.join(OUTSIDE, "*.log")], ["../outside/{a,b}", path.join(OUTSIDE, "{a,b}")],
		["a b ../outside/x", path.join(OUTSIDE, "x")],
	];
	const results = cases.map(([args, expected]) => ({ command: `rm ${args}`, hits: moduleHits(`rm ${args}`), expected: path.resolve(expected) }));
	for (const [command, expected] of [["rm a; rm ../outside/b", path.join(OUTSIDE, "b")], ["rm a && rm -f ../outside/b", path.join(OUTSIDE, "b")], ["command rm ../outside/x", path.join(OUTSIDE, "x")], ["/bin/rm ../outside/x", path.join(OUTSIDE, "x")], ["\\rm ../outside/x", path.join(OUTSIDE, "x")], ["rm ../work-sibling/x", path.join(WORK_SIBLING, "x")], [`rm ${shellQuote(path.join(TEMP_SIBLING, "x"))}`, path.join(TEMP_SIBLING, "x")]]) results.push({ command, hits: moduleHits(command), expected: path.resolve(expected) });
	const handlerHome = path.join(NEVER_ROOT, "home");
	const handlerResults = await withHome(handlerHome, () => Promise.all([
		["rm ~/x", path.join(handlerHome, "x")],
		["rm -f $HOME/x", path.join(handlerHome, "x")],
	].map(async ([command, expected]) => ({ command, expected, reason: await reason(command) }))));
	const ok = results.every(({ hits, expected }) => hits.includes(expected)) && handlerResults.every(({ reason: why, expected }) => why.includes(expected));
	// req: R-2331
	check("every honest spelling of an outside rm target asks", ok, JSON.stringify({ moduleBad: results.filter(({ hits, expected }) => !hits.includes(expected)), handlerBad: handlerResults.filter(({ reason: why, expected }) => !why.includes(expected)) }));
}

{
	const cases = ["rm x", "rm sub/x", "rm -- -x", "rm *.log", "rm sub/*/x", "rm linkout", "rm linkin/x", "rm x 2>/dev/null", "rm x >/dev/null 2>&1", "rm x &>/dev/null", 'rm "my file"', "rm ../work/x"];
	const moduleBad = cases.filter((command) => moduleHits(command).length !== 0);
	const handlerBad = [];
	for (const command of cases) if ((await reason(command)) !== "") handlerBad.push(command);
	// req: R-2332
	check("plain rm inside the working folder stays unasked", moduleBad.length === 0 && handlerBad.length === 0, JSON.stringify({ moduleBad, handlerBad }));
}

{
	const cases = [`rm ${shellQuote(path.join(TEMP_ROOT, "x"))}`, `rm ${shellQuote(path.join(TEMP_ROOT, "sub", "*.log"))}`, "rm linktmp/x", `rm ${shellQuote(path.join(TEMP_LINK, "x"))}`];
	const moduleBad = cases.filter((command) => moduleHits(command).length !== 0);
	const handlerTarget = path.join(TEMP_ROOT, `nana-rm-outside-${process.pid}`);
	const handlerReason = await reason(`rm -f ${shellQuote(handlerTarget)}`);
	// req: R-2333
	check("plain rm inside a temp folder stays unasked", moduleBad.length === 0 && handlerReason === "", JSON.stringify({ moduleBad, handlerReason }));
}

if (process.platform === "win32") {
	console.log("SKIP plain rm under /tmp stays unasked on macOS and Linux: /tmp is not a temp root on Windows");
} else {
	const suffix = `nana-rm-outside-${process.pid}-${Math.random().toString(36).slice(2)}`;
	const typedTarget = path.join("/tmp", suffix, "x");
	const realTarget = path.join(realPath("/tmp"), suffix, "x");
	const dialogs = [];
	const ui = { select: async (message) => { dialogs.push(message); return "Block"; }, setStatus() {}, notify() {}, theme: { fg: (_c, text) => text } };
	const results = await Promise.all([typedTarget, realTarget].map(async (target) => ({ target, verdict: await call(`rm -f ${shellQuote(target)}`, "bash", ui) })));
	// req: R-2338
	check("plain rm under /tmp stays unasked on macOS and Linux", results.every(({ verdict }) => !verdict?.block) && dialogs.length === 0, JSON.stringify({ results, dialogs }));
}

{
	const results = ["rm linkout/x", "rm linkout/deep/x"].map((command) => ({ command, hits: moduleHits(command) }));
	const ok = results.every(({ command, hits }) => hits.includes(full(command.split(" ")[1])));
	// req: R-2334
	check("rm through a linked folder that leads outside asks", ok, JSON.stringify(results));
}

{
	const cdOutsideTarget = path.join(NEVER_ROOT, "cd-x");
	const cdOutsideParts = path.relative(WORK, cdOutsideTarget).split(path.sep);
	const cdOutsideRelative = cdOutsideParts.join("/");
	const rootSteps = cdOutsideParts.findIndex((part) => part !== "..");
	const deepInside = path.join(WORK, ...Array.from({ length: rootSteps }, (_, index) => `level-${index}`));
	fs.mkdirSync(deepInside, { recursive: true });
	const handlerCommand = `(cd ${shellQuote(deepInside)} && true); rm ${cdOutsideRelative}`;
	const ask = ["cd .. && rm x", `cd ${shellQuote(OUTSIDE)}; rm x`, "cd && rm x", "cd ~ && rm x", "pushd .. && rm x", "cd -P .. && rm x", "(cd .. && rm x)", "{ cd ..; rm x; }", handlerCommand];
	const pass = ["cd sub && rm x", `cd ${shellQuote(TEMP_ROOT)} && rm x`, "cd .. && cd work && rm x", "(cd sub && rm x)"];
	const psAsk = "Set-Location -Path ..; Remove-Item x";
	const askBad = ask.filter((command) => moduleHits(command).length === 0);
	if (moduleHits(psAsk, "powershell").length === 0) askBad.push(psAsk);
	const passBad = pass.filter((command) => moduleHits(command).length !== 0);
	const handlerReason = await reason(handlerCommand);
	// req: R-2335
	check("a cd earlier in the command line moves where relative targets are judged", askBad.length === 0 && passBad.length === 0 && handlerReason.includes(path.resolve(cdOutsideTarget)), JSON.stringify({ askBad, passBad, handlerCommand, handlerReason }));
}

{
	const ask = ["Remove-Item ../x", "ri ../x", "rm ../x", "del ../x", "erase ../x", "rd ../x", "rmdir ../x", "Remove-Item -Path ../x", "Remove-Item -LiteralPath ../x", "Remove-Item ~/x", "Remove-Item $HOME/x", "ri $env:USERPROFILE/x", "erase ..\\x", "cd ..; Remove-Item x"];
	const pass = ["Remove-Item x", "Remove-Item -Path sub/x", `Remove-Item ${shellQuote(path.join(TEMP_ROOT, "x"))}`];
	const askBad = ask.filter((command) => moduleHits(command, "powershell").length === 0);
	const passBad = pass.filter((command) => moduleHits(command, "powershell").length !== 0);
	const rootTarget = path.join(path.parse(WORK).root, `nana-rm-outside-ps-${process.pid}`, "x");
	const handlerReason = await reason(`Remove-Item -Path ${shellQuote(rootTarget)}`, "powershell");
	const ok = askBad.length === 0 && passBad.length === 0 && handlerReason.includes(path.resolve(rootTarget));
	// req: R-2336
	check("PowerShell Remove-Item and its aliases outside the working folder ask", ok, JSON.stringify({ askBad, passBad, handlerReason }));
}

{
	const handlerCases = ['rm -f "$msg"', 'msg=$(mktemp); rm -f "$msg"', 'rm -f "${TMPDIR:-/tmp}/x.log"'];
	const handlerBad = [];
	for (const command of handlerCases) if ((await reason(command)) !== "") handlerBad.push(command);
	const moduleHitsForX = moduleHits('rm -f "$X/y"');
	// req: R-2337
	check("rm of a variable-led target such as the builder's message-file cleanup runs unasked", handlerBad.length === 0 && moduleHitsForX.length === 0, JSON.stringify({ handlerBad, moduleHitsForX }));
}

console.log(failures ? `FAILED ${failures}` : "all PASS");
process.exitCode = failures ? 1 : 0;
