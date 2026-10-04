#!/usr/bin/env node
/**
 * Exhaustive boundary-rule sweep (astra r3 item 3) -- evidence for this lane, NOT a suite
 * test. For every codepoint 0..0x10FFFF, excluding the UTF-16 surrogate range, places the
 * character both AFTER "shall" and BEFORE it, and compares TypeScript's real `SHALL` regex
 * (imported from the rail, not re-implemented) against Python's real `SHALL_RE` (run via a
 * companion worker script, since conftest.py needs pytest importable). Reports the number
 * of codepoints where the two rails disagree on either placement. Must be 0.
 *
 * Run: node --experimental-strip-types docs/reviews/ears-form-2026-10-04/boundary-sweep.mjs
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");

const { SHALL } = await import(
	new URL("../../../templates/typescript/template/tests/requirements-trace.ts", import.meta.url).href
);

const SURROGATE_LO = 0xd800;
const SURROGATE_HI = 0xdfff;
const COUNT = 0x110000;

console.log("Computing the TypeScript side...");
const tsSuffix = new Uint8Array(COUNT);
const tsPrefix = new Uint8Array(COUNT);
for (let cp = 0; cp < COUNT; cp++) {
	if (cp >= SURROGATE_LO && cp <= SURROGATE_HI) {
		tsSuffix[cp] = 2;
		tsPrefix[cp] = 2;
		continue;
	}
	const ch = String.fromCodePoint(cp);
	tsSuffix[cp] = ("shall" + ch).match(SHALL) ? 1 : 0;
	tsPrefix[cp] = (ch + "shall").match(SHALL) ? 1 : 0;
}

console.log("Computing the Python side (spawning uv run --with pytest)...");
const scratch = mkdtempSync(join(tmpdir(), "boundary-sweep-"));
const outPath = join(scratch, "py-results.bin");
const worker = join(HERE, "boundary-sweep-python-worker.py");
const result = spawnSync("uv", ["run", "--with", "pytest", "python3", worker, outPath], {
	cwd: REPO,
	encoding: "utf-8",
	maxBuffer: 1024 * 1024 * 16,
});
if (result.status !== 0) {
	console.error("Python worker failed:", result.stdout, result.stderr);
	process.exit(1);
}

const pyBytes = readFileSync(outPath);
rmSync(scratch, { recursive: true, force: true });

let differences = 0;
const examples = [];
for (let cp = 0; cp < COUNT; cp++) {
	const pySuffix = pyBytes[cp * 2];
	const pyPrefix = pyBytes[cp * 2 + 1];
	if (tsSuffix[cp] !== pySuffix || tsPrefix[cp] !== pyPrefix) {
		differences++;
		if (examples.length < 20) {
			examples.push({
				codepoint: `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`,
				tsSuffix: tsSuffix[cp],
				pySuffix,
				tsPrefix: tsPrefix[cp],
				pyPrefix,
			});
		}
	}
}

console.log(`\nSwept ${COUNT.toLocaleString()} codepoints (0..0x10FFFF), surrogates excluded from scoring.`);
console.log(`Differences: ${differences}`);
if (examples.length) {
	console.log("First examples:");
	for (const e of examples) {
		console.log(
			`  ${e.codepoint}: TS suffix=${e.tsSuffix} prefix=${e.tsPrefix}  Python suffix=${e.pySuffix} prefix=${e.pyPrefix}`,
		);
	}
}
process.exit(differences === 0 ? 0 : 1);
