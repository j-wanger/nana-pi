/**
 * @module packages/nana-pack/tests/ts-syntax-check.test.mjs
 * @purpose Pins the TypeScript syntax checker's compilation, diagnostics, and non-evaluation contract.
 * @inputs The repository checker and temporary TypeScript fixtures.
 * @outputs Named PASS/FAIL checks and a nonzero exit when an assertion fails.
 * @effects disk (temporary fixtures); process (runs the checker in child processes).
 * @errors Failed assertions are reported and cause exit 1.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const CHECKER = path.join(REPO, "scripts", "ts-syntax-check.mjs");
const ROOT = tmpDir(path.join(os.tmpdir(), "ts-syntax-check-"));
let fails = 0;
const check = (name, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
	if (!ok) fails++;
};
function run(file) {
	return spawnSync(process.execPath, ["--no-warnings", "--experimental-vm-modules", CHECKER, file], { encoding: "utf8" });
}

const valid = path.join(ROOT, "valid.ts");
fs.writeFileSync(valid, "export const answer: number = 42;\n");
const validResult = run(valid);
// req: R-993
check("valid TypeScript syntax exits 0", validResult.status === 0, validResult.stderr);

const invalid = path.join(ROOT, "invalid.ts");
fs.writeFileSync(invalid, "export const answer: number = ;\n");
const invalidResult = run(invalid);
// req: R-993
check("invalid TypeScript syntax exits 1 with a filename-qualified Node parser diagnostic", invalidResult.status === 1 && invalidResult.stderr.startsWith(`${invalid}: `) && invalidResult.stderr.includes("ERR_INVALID_TYPESCRIPT_SYNTAX"), invalidResult.stderr);

const enumFile = path.join(ROOT, "enum.ts");
fs.writeFileSync(enumFile, "enum Direction { Up, Down }\n");
const enumResult = run(enumFile);
// req: R-993
check("TypeScript requiring transformation is rejected with a filename-qualified Node diagnostic", enumResult.status === 1 && enumResult.stderr.startsWith(`${enumFile}: `) && enumResult.stderr.includes("ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX"), enumResult.stderr);

const moduleError = path.join(ROOT, "module-error.ts");
fs.writeFileSync(moduleError, "export { missing };\n");
const moduleErrorResult = run(moduleError);
// req: R-994
check("module-level early errors fail compilation with a filename-qualified diagnostic", moduleErrorResult.status === 1 && moduleErrorResult.stderr.startsWith(`${moduleError}: `), moduleErrorResult.stderr);

const marker = path.join(ROOT, "executed.marker");
const sideEffect = path.join(ROOT, "side-effect.ts");
fs.writeFileSync(sideEffect, `import { writeFileSync } from "node:fs";\nwriteFileSync(${JSON.stringify(marker)}, "executed");\n`);
const sideEffectResult = run(sideEffect);
// req: R-994
check("valid module top level is not evaluated", sideEffectResult.status === 0 && !fs.existsSync(marker), `${sideEffectResult.stderr} marker=${fs.existsSync(marker)}`);

function collectTs(dir) {
	const found = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) found.push(...collectTs(full));
		else if (entry.isFile() && entry.name.endsWith(".ts")) found.push(full);
	}
	return found;
}
const packageTs = collectTs(path.join(REPO, "packages"));
const failures = packageTs.map((file) => ({ file, result: run(file) })).filter(({ result }) => result.status !== 0);
// req: R-993
check("every TypeScript file under packages passes syntax checking", packageTs.length > 0 && failures.length === 0, failures.map(({ file, result }) => `${file}: ${result.stderr}`).join("\n"));

if (fails) process.exitCode = 1;
