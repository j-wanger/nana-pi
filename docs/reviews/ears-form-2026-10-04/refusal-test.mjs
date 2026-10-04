#!/usr/bin/env node
/**
 * @module docs/reviews/ears-form-2026-10-04/refusal-test.mjs
 * @purpose Prove apply-batch.mjs's refusal contract — on ANY failed check, every file it could have
 *  touched is byte-identical to its state before the run — using astra r2's own reproduction: remove
 *  R-110's mutation record and reword its sentence in a disposable copy of the mapping, then assert
 *  the verifier exits non-zero while every affected file's hash is unchanged.
 * @inputs docs/reviews/ears-form-2026-10-04/batch-a2.json (read only, to find the affected-file list
 *  and to build the disposable tampered copy), REQUIREMENTS.md, scripts/requirements-trace.mjs,
 *  packages/nana-pack/tests/requirements-trace.test.mjs, every file named by a markerEdit
 * @outputs a PASS/FAIL line and the exit code apply-batch.mjs returned, on stdout; exit 1 if the
 *  refusal contract did not hold
 * @effects disk (writes one temp file under the OS temp dir for the tampered mapping, removed after),
 *  process (spawns `node apply-batch.mjs <tampered> --base main`); never writes to any repo file —
 *  the whole point is to prove apply-batch.mjs itself did not either
 * @errors never throws; a failed assertion prints what differed and exits 1
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..", "..");
const APPLY_BATCH = join(HERE, "apply-batch.mjs");
const REAL_MAPPING_PATH = join(HERE, "batch-a2.json");

function sha256(path) {
	return createHash("sha256").update(readFileSync(path)).digest("hex");
}

// ---------------------------------------------------------------------------
// 1. The affected-file list: REQUIREMENTS.md, the rail script, the rail test,
// and every file any markerEdit in the REAL mapping names — the complete set
// apply-batch.mjs can write to.
// ---------------------------------------------------------------------------
const realBatch = JSON.parse(readFileSync(REAL_MAPPING_PATH, "utf8"));
const affectedRel = new Set([
	"REQUIREMENTS.md",
	"scripts/requirements-trace.mjs",
	"packages/nana-pack/tests/requirements-trace.test.mjs",
]);
for (const origin of realBatch.origins) for (const me of origin.markerEdits ?? []) affectedRel.add(me.file);
const affected = [...affectedRel].map((rel) => ({ rel, abs: join(REPO_ROOT, rel) }));

const before = new Map(affected.map(({ rel, abs }) => [rel, sha256(abs)]));

// ---------------------------------------------------------------------------
// 2. Build astra's exact tampered mapping in a disposable temp file: remove
// R-110's `mutations` array and reword its sentence.
// ---------------------------------------------------------------------------
const tampered = JSON.parse(JSON.stringify(realBatch)); // deep clone
let found = false;
for (const origin of tampered.origins) {
	for (const clause of origin.clauses) {
		if (clause.id === "R-110") {
			clause.mutations = [];
			clause.text = clause.text.replace("stored summary", "stored handoff summary");
			found = true;
		}
	}
}
if (!found) {
	console.error("REFUSAL TEST SETUP FAILED: R-110 not found in batch-a2.json");
	process.exit(1);
}

const tmpDir = mkdtempSync(join(tmpdir(), "ears-a2-refusal-test-"));
const tamperedPath = join(tmpDir, "batch-a2-tampered.json");
writeFileSync(tamperedPath, JSON.stringify(tampered, null, 2));

// ---------------------------------------------------------------------------
// 3. Run the verifier against the tampered mapping, against the SAME repo
// (apply-batch.mjs's paths are fixed relative to its own location) — the
// files it could write to are the real ones, which is exactly what this test
// must prove stay untouched.
// ---------------------------------------------------------------------------
const run = spawnSync(process.execPath, [APPLY_BATCH, tamperedPath, "--base", "main"], {
	cwd: REPO_ROOT,
	encoding: "utf8",
});
rmSync(tmpDir, { recursive: true, force: true });

const after = new Map(affected.map(({ rel, abs }) => [rel, sha256(abs)]));

let ok = true;
if (run.status === 0) {
	console.log(`FAIL exit code: expected non-zero, got 0\n${run.stdout}`);
	ok = false;
} else {
	console.log(`PASS exit code: ${run.status} (non-zero)`);
}
for (const { rel } of affected) {
	const same = before.get(rel) === after.get(rel);
	console.log(`${same ? "PASS" : "FAIL"} byte-identical: ${rel}`);
	if (!same) ok = false;
}

console.log(ok ? "REFUSAL TEST: ALL PASS" : "REFUSAL TEST: FAILED");
process.exit(ok ? 0 : 1);
