#!/usr/bin/env node
/**
 * @module packages/nana-pack/tests/pack-config-utf16.test.mjs
 * @purpose Prove every user-facing nana-pack.json reader accepts marked UTF-16 and rejects unmarked, double-marked or odd-byte UTF-16.
 * @inputs nana-gate, nana-objective and nana-roster child processes plus UTF-8, UTF-16LE and UTF-16BE temporary config fixtures
 * @outputs PASS/FAIL lines per check, a Windows-only SKIP line, and exit 1 when any check fails
 * @effects disk (temporary homes and config files), process (spawns Node and Windows PowerShell children)
 * @errors failed assertions increment the failure count; child timeouts or launch failures are reported by their check
 */
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG_FAILURE_PREFIX, MANUAL_JSON_ADVICE } from "../lib/json-text.mjs";
import { displayPath } from "../lib/objective.ts";
import { PI_MODEL_SHELL_ENV } from "../bin/worker-config.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const objectiveCli = path.join(here, "..", "bin", "nana-objective.mjs");
const rosterCli = path.join(here, "..", "bin", "nana-roster.mjs");
const gateUrl = new URL("../extensions/nana-gate.ts", import.meta.url).href;
const timeout = 15_000;
let fails = 0;
let passes = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (ok) passes++; else fails++; };
const skip = (name, why) => console.log("SKIP", name, "—", why);
const freshHome = (label) => { const home = tmpDir(path.join(os.tmpdir(), `pack-config-utf16-${label}-`)); fs.mkdirSync(home, { recursive: true }); return home; };
/** Copied from nana-roster-set.test.mjs: fresh user roots and no pi-model-shell marker. */
const cleanEnv = (home, extra = {}) => { const env = { ...process.env, HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: home, ...extra }; delete env[PI_MODEL_SHELL_ENV]; return env; };
const utf8 = (text) => Buffer.from(text, "utf8");
const utf16le = (text) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, "utf16le")]);
const utf16be = (text) => Buffer.concat([Buffer.from([0xfe, 0xff]), Buffer.from(text, "utf16le").swap16()]);
const writeConfig = (home, bytes) => { const file = path.join(home, "nana-pack.json"); fs.writeFileSync(file, bytes); return file; };
const runNode = (args, home, options = {}) => spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", ...args], { cwd: home, encoding: "utf8", timeout, env: cleanEnv(home), ...options });
const runObjective = (home) => runNode([objectiveCli, "--cwd", home], home);

const gateChildDir = freshHome("gate-child");
const gateChild = path.join(gateChildDir, "gate-child.mjs");
fs.writeFileSync(gateChild, `
const ext = (await import(${JSON.stringify(gateUrl)})).default;
const handlers = {};
ext({ on: (name, handler) => { handlers[name] = handler; } });
const ctx = { cwd: process.cwd(), hasUI: false, isProjectTrusted: () => false };
const terraform = (await handlers.tool_call({ toolName: "bash", input: { command: "terraform destroy" } }, ctx)) ?? null;
const ls = (await handlers.tool_call({ toolName: "bash", input: { command: "ls" } }, ctx)) ?? null;
process.stdout.write(JSON.stringify({ terraform, ls }));
`);
const gateConfig = JSON.stringify({ gate: { extraPatterns: ["\\bterraform\\s+destroy\\b"] } });
const gateRuns = [["utf8", utf8], ["utf16le", utf16le], ["utf16be", utf16be]].map(([label, encode]) => {
	const home = freshHome(`gate-${label}`);
	writeConfig(home, encode(gateConfig));
	const child = runNode([gateChild], home);
	let value = null;
	try { value = JSON.parse(child.stdout); } catch { /* reported by the aggregate check */ }
	return { label, child, value };
});
// req: R-2230
check("R-2230: the gate applies a UTF-16LE or UTF-16BE user nana-pack.json's extraPatterns with no stop reason", gateRuns.every(({ child, value }) => child.status === 0 && value?.terraform?.block === true && !/malformed/.test(value.terraform.reason ?? "") && value?.ls === null), JSON.stringify(gateRuns));

const disabledText = JSON.stringify({ objective: { enabled: false } });
const objectiveControls = [["utf8", utf8], ["utf16le", utf16le]].map(([label, encode]) => {
	const home = freshHome(`objective-${label}`);
	writeConfig(home, encode(disabledText));
	return { label, run: runObjective(home) };
});
// req: R-2231
check("R-2231: the objective producer prints nothing for a UTF-16LE user nana-pack.json with objective.enabled false", objectiveControls.every(({ run }) => run.status === 0 && run.stdout === ""), JSON.stringify(objectiveControls));

const roster = {
	scout: { provider: "p", model: "scout", thinking: "low" },
	builder: { provider: "p", model: "builder", thinking: "medium" },
	largerBuilder: null,
	reviewer: { provider: "p", model: "reviewer", thinking: null },
	land: null,
};
const rosterText = JSON.stringify({ objective: { enabled: true }, gate: { extraPatterns: ["example"] }, unknownMember: { keep: true }, roster });
const rosterRuns = [["utf8", utf8], ["utf16le", utf16le]].map(([label, encode]) => {
	const home = freshHome(`roster-${label}`);
	const file = writeConfig(home, encode(rosterText));
	const jsonRun = runNode([rosterCli, "--json"], home);
	const env = cleanEnv(home);
	delete env.PI_SESSION_ID;
	const setRun = spawnSync(process.execPath, [rosterCli, "set", "builder", "p", "m", "low"], { cwd: home, encoding: "utf8", timeout, env });
	return { label, file, jsonRun, setRun, bytes: fs.readFileSync(file) };
});
// req: R-2232
check("R-2232: nana-roster --json and set give byte-identical output and file for a UTF-16LE and a UTF-8 nana-pack.json", rosterRuns.every(({ jsonRun, setRun }) => jsonRun.status === 0 && setRun.status === 0) && rosterRuns[0].jsonRun.stdout === rosterRuns[1].jsonRun.stdout && rosterRuns[0].bytes.equals(rosterRuns[1].bytes), JSON.stringify(rosterRuns.map(({ label, jsonRun, setRun }) => ({ label, jsonRun, setRun }))));

const malformedText = JSON.stringify({ objective: { enabled: false } });
const malformedShapes = [
	["LE without a mark", Buffer.from(malformedText, "utf16le")],
	["BE without a mark", Buffer.from(malformedText, "utf16le").swap16()],
	["LE with two marks", utf16le(`\uFEFF${malformedText}`)],
	["BE with two marks", utf16be(`\uFEFF${malformedText}`)],
	["LE with one extra byte", Buffer.concat([utf16le(malformedText), Buffer.from([0])])],
	["BE with one extra byte", Buffer.concat([utf16be(malformedText), Buffer.from([0])])],
].map(([label, bytes]) => {
	const home = freshHome(`malformed-${label.replaceAll(" ", "-")}`);
	const file = writeConfig(home, bytes);
	return { label, file, run: runObjective(home) };
});
// req: R-2236
check("R-2236: UTF-16 with no mark, two marks or an odd byte count, LE or BE, stays unparseable for the objective producer", malformedShapes.every(({ file, run }) => run.status === 0 && run.stdout.includes(`${CONFIG_FAILURE_PREFIX}${displayPath(file)}`) && run.stdout.includes(MANUAL_JSON_ADVICE)), JSON.stringify(malformedShapes));

if (process.platform !== "win32") {
	skip("R-2237: on Windows, a nana-pack.json written by Windows PowerShell's Out-File and > turns the objective off", "Windows PowerShell 5.1 exists only on Windows");
} else {
	const home = freshHome("windows-powershell");
	const outFile = path.join(home, "out-file.json");
	const redirectFile = path.join(home, "redirect.json");
	const script = "$env:NANA_JSON | Out-File -FilePath $env:NANA_OUT; $env:NANA_JSON > $env:NANA_REDIRECT";
	const encoded = Buffer.from(script, "utf16le").toString("base64");
	const shell = path.join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
	const produced = spawnSync(shell, ["-NoProfile", "-NonInteractive", "-EncodedCommand", encoded], { encoding: "utf8", timeout, env: cleanEnv(home, { NANA_JSON: disabledText, NANA_OUT: outFile, NANA_REDIRECT: redirectFile }) });
	const observations = [outFile, redirectFile].map((source) => {
		const bytes = fs.readFileSync(source);
		fs.copyFileSync(source, path.join(home, "nana-pack.json"));
		return { source, marked: bytes[0] === 0xff && bytes[1] === 0xfe, run: runObjective(home) };
	});
	const windowsProof = produced.status === 0 && produced.stdout === "" && observations.every(({ marked, run }) => marked && run.status === 0 && run.stdout === "");
	const windowsDetail = JSON.stringify({ produced, observations });
	// req: R-2237
	check("R-2237: on Windows, a nana-pack.json written by Windows PowerShell's Out-File and > turns the objective off", windowsProof, windowsDetail);
}

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
