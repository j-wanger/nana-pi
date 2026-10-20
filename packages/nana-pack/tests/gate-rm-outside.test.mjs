#!/usr/bin/env node
/**
 * @module packages/nana-pack/tests/gate-rm-outside.test.mjs
 * @purpose Pin prompts for readable non-recursive rm targets outside the working and accepted temp folders, including the POSIX /tmp root, and preserve the inside and variable-led passes.
 * @inputs the real nana-gate handler, gate-rm-outside, gate-shell, real-path, and one temporary fixture tree containing working, home, temp, outside, sibling, link and junction spellings
 * @outputs nine named PASS/FAIL checks (or eight and one Windows SKIP) and exit 1 when any requirement fails
 * @effects disk (one temporary fixture tree and gate config), process (temporarily sets HOME, USERPROFILE and temp variables)
 * @errors unexpected failures reject through a per-case timeout and fail the process; assertion failures print FAIL
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { rmOutsideTargets } from "../lib/gate-rm-outside.ts";
import { detectionSegments, splitCommand } from "../lib/gate-shell.ts";
import { realPath } from "../lib/real-path.mjs";

const F = tmpDir(path.join(os.tmpdir(), "gate-rm-outside-"));
const WORK = path.join(F, "work");
const OUTSIDE = path.join(F, "outside");
const HOME = path.join(F, "home");
const TEMP_ROOT = path.join(F, "tmproot");
const WORK_SIBLING = path.join(F, "work-sibling");
const TEMP_SIBLING = path.join(F, "tmproot-sibling");
for (const dir of [path.join(WORK, "sub", "deep"), OUTSIDE, HOME, path.join(TEMP_ROOT, "sub"), WORK_SIBLING, TEMP_SIBLING]) fs.mkdirSync(dir, { recursive: true });
const linkType = process.platform === "win32" ? "junction" : "dir";
fs.symlinkSync(OUTSIDE, path.join(WORK, "linkout"), linkType);
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
async function call(command, toolName = "bash", ui = null) {
	const ctx = { cwd: WORK, hasUI: !!ui, isProjectTrusted: () => false, ...(ui ? { ui } : {}) };
	return deadline(handlers.tool_call({ toolName, input: { command } }, ctx), `${toolName}: ${command}`);
}
async function reason(command, toolName = "bash") {
	return (await call(command, toolName))?.reason ?? "";
}
function moduleHits(command, tool = "bash") {
	const split = splitCommand(command);
	const options = { home: HOME, tempRoots: [TEMP_ROOT], segmentable: split.segmentable };
	const hits = rmOutsideTargets(split.segments, WORK, tool, options);
	if (!split.segmentable) for (const [segment, target] of rmOutsideTargets(detectionSegments(command), WORK, tool, options)) hits.set(segment, target);
	return [...hits.values()];
}
const full = (value, cwd = WORK) => path.resolve(cwd, value);

{
	const rootTarget = path.join(path.parse(WORK).root, `nana-rm-outside-${process.pid}`, "x");
	const expected = path.resolve(rootTarget);
	const detectionCommand = `echo $(rm ${shellQuote(path.join(OUTSIDE, "detected"))})`;
	const headless = await Promise.all([reason(`rm ${shellQuote(rootTarget)}`), reason(`rm -f ${shellQuote(rootTarget)}`), reason(detectionCommand)]);
	const dialogs = [];
	const ui = { select: async (message, choices) => { dialogs.push({ message, choices }); return "Block"; }, setStatus() {}, notify() {}, theme: { fg: (_c, text) => text } };
	const interactive = await call(`rm ${shellQuote(rootTarget)}`, "bash", ui);
	const insideDialogs = [];
	const insideUi = { ...ui, select: async (message, choices) => { insideDialogs.push({ message, choices }); return "Block"; } };
	const inside = await call("rm -f x", "bash", insideUi);
	const ok = headless.slice(0, 2).every((r) => r.includes(expected)) && headless[2].includes(path.join(OUTSIDE, "detected")) && interactive?.block === true && dialogs.length === 1 && dialogs[0].message.includes(expected) && !inside?.block && insideDialogs.length === 0;
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
	const handlerResults = await Promise.all([
		["rm ~/x", path.join(HOME, "x")],
		["rm -f $HOME/x", path.join(HOME, "x")],
	].map(async ([command, expected]) => ({ command, expected, reason: await reason(command) })));
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
	const ask = ["cd .. && rm x", `cd ${shellQuote(OUTSIDE)}; rm x`, "cd && rm x", "cd ~ && rm x", "pushd .. && rm x", "cd -P .. && rm x", "(cd .. && rm x)", "{ cd ..; rm x; }", "(cd sub/deep && true); rm ../../x"];
	const pass = ["cd sub && rm x", `cd ${shellQuote(TEMP_ROOT)} && rm x`, "cd .. && cd work && rm x", "(cd sub && rm x)"];
	const psAsk = "Set-Location -Path ..; Remove-Item x";
	const askBad = ask.filter((command) => moduleHits(command).length === 0);
	if (moduleHits(psAsk, "powershell").length === 0) askBad.push(psAsk);
	const passBad = pass.filter((command) => moduleHits(command).length !== 0);
	const handlerCommand = "(cd sub/deep && true); rm ../../x";
	const handlerReason = await reason(handlerCommand);
	// req: R-2335
	check("a cd earlier in the command line moves where relative targets are judged", askBad.length === 0 && passBad.length === 0 && handlerReason.includes(path.resolve(WORK, "../../x")), JSON.stringify({ askBad, passBad, handlerCommand, handlerReason }));
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
