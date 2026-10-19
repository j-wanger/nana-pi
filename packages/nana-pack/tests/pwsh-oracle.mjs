/**
 * @module packages/nana-pack/tests/pwsh-oracle.mjs
 * @purpose Generate parse-clean PowerShell commands and obtain tokenizer spans from PowerShell.
 * @inputs a seed and size, plus injected platform, spawn function, and temporary root.
 * @outputs named corpus, shell-selection, oracle-runner, and span-comparison helpers.
 * @effects disk, process
 * @errors rejects on startup, timeout, parse, incomplete output, or span disagreement.
 */
import { spawn as nodeSpawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { tmpDir } from "./tmp-dir.mjs";
import {
	POWERSHELL_CORPUS_SEED,
	POWERSHELL_CORPUS_SIZE,
	POWERSHELL_ORACLE_SHELLS,
	POWERSHELL_ORACLE_TIMEOUT_MS,
} from "../lib/pwsh-lexer-config.mjs";

const POWERSHELL_SCRIPT = String.raw`$InputPath = $env:NANA_PWSH_ORACLE_INPUT
$OutputPath = $env:NANA_PWSH_ORACLE_OUTPUT
$source = [IO.File]::ReadAllText($InputPath, [Text.Encoding]::UTF8)
$commands = $source.Split([char]0)
$lines = [Collections.Generic.List[string]]::new()
function Add-Tokens([object[]]$Tokens, [Collections.Generic.List[string]]$Spans) {
  foreach ($token in $Tokens) {
    $kind = $token.Kind.ToString()
    if ($kind -eq 'Comment') { $Spans.Add(('comment,{0},{1}' -f $token.Extent.StartOffset,$token.Extent.EndOffset)) }
    elseif ($kind -in @('StringLiteral','StringExpandable','HereStringLiteral','HereStringExpandable')) { $Spans.Add(('string,{0},{1}' -f $token.Extent.StartOffset,$token.Extent.EndOffset)) }
    if ($null -ne $token.NestedTokens) { Add-Tokens $token.NestedTokens $Spans }
  }
}
for ($index = 0; $index -lt $commands.Count; $index++) {
  $tokens = $null; $errors = $null
  [void][Management.Automation.Language.Parser]::ParseInput($commands[$index], [ref]$tokens, [ref]$errors)
  if ($errors.Count -gt 0) { $lines.Add(('E|{0}' -f $index)); continue }
  $spans = [Collections.Generic.List[string]]::new()
  Add-Tokens $tokens $spans
  $ordered = $spans | Sort-Object { [int]($_.Split(',')[1]) }, { [int]($_.Split(',')[2]) }, { $_.Split(',')[0] }
  $lines.Add(('R|{0}|{1}' -f $index,($ordered -join ';')))
}
[IO.File]::WriteAllLines($OutputPath, $lines, [Text.Encoding]::ASCII)`;

const ENCODED_SCRIPT = Buffer.from(POWERSHELL_SCRIPT, "utf16le").toString("base64");

function mulberry32(seed) {
	let state = seed >>> 0;
	return () => {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

const atoms = [
	"alpha", "$a", "$a[0]", "${a}", "$env:X[0]", "`a#b", "a#b", "a<#b", "a@'b'", 'a@"b"',
	"'a''b'", '"a`"b"', "‘a’’b’", "'a‛", '“a””b”', '"a„',
	"$(Write-Output inner)", "a$(Write-Output inner)b", "(Write-Output inner)", "{ Write-Output inner }",
	'"a$(Write-Output \'inner\')b"',
];
const comments = ["# note", "<# note #>", "alpha#literal", "alpha<#literal", "$a[0]# note"];
const hereStrings = [
	"@'\nliteral\n'@", '@"\nexpandable\n"@', "@‘\ntypographic\n’@", "@“\ntypographic\n”@",
	'@"\ninside $(Write-Output \'nested\')\n"@', "@'\ninside $(literal)\n'@",
	"@'\nclose\n'@# glued", '@"\nclose\n"@<# glued #>', "@'\nclose\n'@ ", '@"\nclose\n"@ | Write-Output',
];
const anchors = [
	...atoms.map((atom) => `Write-Output ${atom}`),
	...comments.map((comment) => `Write-Output before ${comment}`),
	...hereStrings,
	"Write-Output a@'\nb'",
	'Write-Output a@"\nb"',
	"Write-Output (1, 2)",
	"Write-Output one; Write-Output two",
	"Write-Output one | Write-Output",
	"Write-Output one\nWrite-Output two",
	"Write-Output one\r\nWrite-Output two",
	"Write-Output trailing-tab\t",
	"Write-Output one # trailing\nWrite-Output two",
	"Write-Output one <# block #> Write-Output two",
	"Write-Output (Write-Output nested)",
	"Write-Output { Write-Output nested }",
];

/** Return a deterministic corpus whose anchors cover every grammar production. */
export function generatePowerShellCorpus({ seed = POWERSHELL_CORPUS_SEED, size = POWERSHELL_CORPUS_SIZE } = {}) {
	const random = mulberry32(seed);
	const corpus = anchors.slice(0, size);
	while (corpus.length < size) {
		const left = atoms[Math.floor(random() * atoms.length)];
		const right = atoms[Math.floor(random() * atoms.length)];
		const separator = ["; ", " | Write-Output; ", "\n", "\r\n"][Math.floor(random() * 4)];
		corpus.push(`Write-Output ${left}${separator}Write-Output ${right}`);
	}
	return corpus;
}

/** Return the oracle shells for a platform, marking Windows PowerShell as required on win32. */
export function powerShellOracleShells(platform = process.platform) {
	return POWERSHELL_ORACLE_SHELLS.map((shell) => ({ shell, required: shell === "powershell" && platform === "win32", skip: shell === "powershell" && platform !== "win32" }));
}

function parseOutput(text, commands, shell) {
	const results = new Map();
	const errors = new Set();
	for (const line of text.split(/\r?\n/)) {
		if (!line) continue;
		const [tag, rawIndex, body = ""] = line.split("|", 3);
		const index = Number(rawIndex);
		if (tag === "E") errors.add(index);
		if (tag === "R") {
			const spans = body ? body.split(";").map((span) => {
				const [kind, start, end] = span.split(",");
				return { kind, start: Number(start), end: Number(end) };
			}) : [];
			results.set(index, spans);
		}
	}
	for (let index = 0; index < commands.length; index++) {
		const shown = JSON.stringify(commands[index]);
		if (errors.has(index)) throw new Error(`${shell} parse error for command ${index}: ${shown}`);
		if (!results.has(index)) throw new Error(`${shell} missing result for command ${index}: ${shown}`);
	}
	return commands.map((_, index) => results.get(index));
}

function shellOnPath(shell, platform) {
	const extensions = platform === "win32" ? (process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";") : [""];
	return (process.env.PATH ?? "").split(path.delimiter).some((directory) => extensions.some((extension) => {
		try { return fs.statSync(path.join(directory, platform === "win32" ? shell + extension.toLowerCase() : shell)).isFile()
			|| fs.statSync(path.join(directory, shell + extension.toUpperCase())).isFile(); }
		catch { return false; }
	}));
}

/** Run one PowerShell tokenizer process over a corpus. */
export async function runPowerShellOracle(shell, commands, {
	spawn = nodeSpawn,
	platform = process.platform,
	tempRoot = os.tmpdir(),
	timeoutMs = POWERSHELL_ORACLE_TIMEOUT_MS,
} = {}) {
	if (shell === "powershell" && platform !== "win32") return { skipped: true, reason: "Windows PowerShell is only required on win32" };
	if (spawn === nodeSpawn && !shellOnPath(shell, platform)) {
		if (shell === "powershell" && platform === "win32") throw new Error(`${shell} did not start: executable is not on PATH`);
		return { skipped: true, reason: `${shell} is not on PATH` };
	}
	const root = tmpDir(path.join(tempRoot, "nana-pwsh-oracle-"));
	const inputPath = path.join(root, "corpus.txt");
	const outputPath = path.join(root, "offsets.txt");
	fs.writeFileSync(inputPath, commands.join("\0"), "utf8");
	try {
		const args = ["-NoProfile", "-NonInteractive", "-EncodedCommand", ENCODED_SCRIPT];
		const result = await new Promise((resolve, reject) => {
			let stderr = "";
			const child = spawn(shell, args, {
				shell: false,
				windowsHide: true,
				timeout: timeoutMs,
				stdio: ["ignore", "ignore", "pipe"],
				env: { ...process.env, NANA_PWSH_ORACLE_INPUT: inputPath, NANA_PWSH_ORACLE_OUTPUT: outputPath },
			});
			child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
			child.once("error", (error) => { child.kill?.(); reject(error); });
			child.once("close", (code, signal) => resolve({ code, signal, stderr }));
		});
		if (result.code !== 0) throw new Error(`${shell} oracle exited ${result.code ?? result.signal}: ${result.stderr.trim()}`);
		if (!fs.existsSync(outputPath)) throw new Error(`${shell} oracle wrote no result file for command 0: ${JSON.stringify(commands[0])}`);
		return { skipped: false, spans: parseOutput(fs.readFileSync(outputPath, "ascii"), commands, shell) };
	} catch (error) {
		const missing = error?.code === "ENOENT";
		if (missing && !(shell === "powershell" && platform === "win32")) return { skipped: true, reason: `${shell} is not on PATH` };
		throw new Error(`${shell} did not start: ${error?.message ?? error}`);
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
}

/** Compare each scanner result with the corresponding PowerShell tokenizer result. */
export function comparePowerShellSpans(shell, commands, expected, scan) {
	for (let index = 0; index < commands.length; index++) {
		const actual = scan(commands[index]);
		if (JSON.stringify(actual) !== JSON.stringify(expected[index])) {
			throw new Error(`${shell} span disagreement for command ${index}: ${JSON.stringify(commands[index])}\nexpected ${JSON.stringify(expected[index])}\nactual ${JSON.stringify(actual)}`);
		}
	}
}
