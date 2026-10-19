/**
 * @module packages/nana-pack/tests/pipe-guard-pwsh-oracle.test.mjs
 * @purpose Compare the pipe guard's PowerShell spans with deterministic and live tokenizer oracles.
 * @inputs the PowerShell scanner, generated corpus, injected runner fakes, and installed shells.
 * @outputs PASS, FAIL, and SKIP lines plus a nonzero exit on any failed check.
 * @effects disk, process
 * @errors reports the first command behind an oracle or comparison failure.
 */
import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import { powerShellSpans, verifierPipeReason } from "../lib/pipe-guard.mjs";
import { POWERSHELL_ORACLE_TIMEOUT_MS } from "../lib/pwsh-lexer-config.mjs";
import {
	comparePowerShellSpans,
	generatePowerShellCorpus,
	powerShellOracleShells,
	runPowerShellOracle,
} from "./pwsh-oracle.mjs";

let failures = 0;
async function check(title, body) {
	let timer;
	try {
		const pass = await Promise.race([
			Promise.resolve().then(body),
			new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("case timed out")), POWERSHELL_ORACLE_TIMEOUT_MS + 5_000); }),
		]);
		console.log(pass === false ? "FAIL" : "PASS", title);
		if (pass === false) failures++;
	} catch (error) {
		console.log("FAIL", title, "—", error?.message ?? error);
		failures++;
	} finally {
		clearTimeout(timer);
	}
}

const corpus = generatePowerShellCorpus();
for (const { shell, required, skip } of powerShellOracleShells()) {
	// req: R-1730
	await check(`oracle: ${shell} reports the lexer's comment and string spans for every generated command`, async () => {
		if (skip) { console.log(`SKIP oracle: ${shell} (${shell} is only available on win32)`); return true; }
		const result = await runPowerShellOracle(shell, corpus);
		if (result.skipped) {
			if (required) throw new Error(`${shell} is required on win32`);
			console.log(`SKIP oracle: ${shell} (${result.reason})`);
			return true;
		}
		comparePowerShellSpans(shell, corpus, result.spans, powerShellSpans);
		return true;
	});
}

function fakeSpawn(writeResult) {
	return (_shell, _args, options) => {
		if (options.shell !== false || options.windowsHide !== true || options.timeout !== POWERSHELL_ORACLE_TIMEOUT_MS) throw new Error("unsafe spawn options");
		const child = new EventEmitter();
		child.stderr = new EventEmitter();
		queueMicrotask(() => {
			try { writeResult(options.env.NANA_PWSH_ORACLE_OUTPUT, child); }
			catch (error) { child.emit("error", error); }
		});
		return child;
	};
}

// req: R-1731
await check("oracle: on win32 a Windows PowerShell that does not start fails the run instead of skipping", async () => {
	const spawn = fakeSpawn((_output, child) => { const error = new Error("missing"); error.code = "ENOENT"; child.emit("error", error); });
	try { await runPowerShellOracle("powershell", ["Write-Output x"], { platform: "win32", spawn }); }
	catch (error) { return /powershell did not start/.test(error.message); }
	return false;
});

// req: R-1732
await check("oracle: a parse error or a missing result fails the comparison and names the command", async () => {
	const commands = ["Write-Output first", "Write-Output second"];
	const parseSpawn = fakeSpawn((output, child) => { fs.writeFileSync(output, "E|0\nR|1|\n", "ascii"); child.emit("close", 0, null); });
	const missingSpawn = fakeSpawn((output, child) => { fs.writeFileSync(output, "R|0|\n", "ascii"); child.emit("close", 0, null); });
	let parseNamed = false;
	let missingNamed = false;
	try { await runPowerShellOracle("pwsh", commands, { spawn: parseSpawn }); } catch (error) { parseNamed = error.message.includes(JSON.stringify(commands[0])); }
	try { await runPowerShellOracle("pwsh", commands, { spawn: missingSpawn }); } catch (error) { missingNamed = error.message.includes(JSON.stringify(commands[1])); }
	return parseNamed && missingNamed;
});

// Oracle-derived outcomes from pwsh 7.4.6 and 7.6.7; no hand-derived expected span is used.
const tokenStartCases = [
	["quoted part before line comment marker", "a'b'#c", true],
	["closing bracket in a bare word", "a]#c", true],
	["dollar before line comment marker", "$#c", true],
	["word subexpression before line comment marker", "a$(1)#c", true],
	["escaped space before line comment marker", "a` #c", true],
	["leading escape before line comment marker", "`a#c", true],
	["leading escape before block comment marker", "`a<#c", true],
	["braced variable before line comment marker", "${a}#c", true],
	["quoted part before block comment marker", "a'b'<#c", true],
	["indexed variable starts a comment", "$a[0]#c", false],
	["standalone string starts a comment", "'a'#c", false],
];
for (const [name, value, expected] of tokenStartCases) {
	const command = `Write-Output ${value} | Select-Object -Last 1; git commit -m x`;
	// req: R-1733
	await check(`token start: ${name}`, () => Boolean(verifierPipeReason(command, "powershell")) === expected);
}
for (const [name, command] of [
	["single-quote here marker inside a word", "Write-Output a@'\nb'; npm test | Select-Object -Last 1; git commit -m x"],
	["double-quote here marker inside a word", 'Write-Output a@"\nb"; npm test | Select-Object -Last 1; git commit -m x'],
]) {
	// req: R-1733
	await check(`token start: ${name}`, () => verifierPipeReason(command, "powershell") !== null);
}

for (const [name, command, expected] of [
	["typographic single opener", "Write-Output ‘a'; npm test | Select-Object -Last 1; git commit -m x", true],
	["typographic double closer", 'Write-Output "a”; npm test | Select-Object -Last 1; git commit -m x', true],
	["typographic double-quoted pipe", "Write-Output “a | b”; git commit -m x", false],
]) {
	// req: R-1734
	await check(`typographic quotes: ${name}`, () => Boolean(verifierPipeReason(command, "powershell")) === expected);
}

// req: R-1735
await check("line end: a carriage return ends a line comment", () => verifierPipeReason("Write-Output x # note\rnpm test | Select-Object -Last 1; git commit -m x", "powershell") !== null);

for (const [name, command] of [
	["single-quoted here-string", "@'\nx\n'@#it's\nnpm test | Select-Object -Last 1; git commit -m x"],
	["expandable here-string", '@"\nx\n"@#it\'s\nnpm test | Select-Object -Last 1; git commit -m x'],
	["block comment", "<#a#>#it's\nnpm test | Select-Object -Last 1; git commit -m x"],
]) {
	// req: R-1736
	await check(`token start after a close: ${name}`, () => verifierPipeReason(command, "powershell") !== null);
}

if (failures) process.exitCode = 1;
