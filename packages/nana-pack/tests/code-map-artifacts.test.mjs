/**
 * @module packages/nana-pack/tests/code-map-artifacts.test.mjs
 * @purpose Pin static impact's artifact writer and reader block and graceful ledger failures.
 * @inputs The real code-map CLI and artifact block, with temporary ledger and graph fixtures.
 * @outputs One PASS/FAIL line per check and a nonzero exit when a check fails.
 * @effects process (spawns the real code-map CLI), disk (temporary fixtures only).
 * @errors Assertions and per-case timeouts become named failures.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { withinCaseLimit } from "./report-fixtures.mjs";
import { artifactBlock } from "../../../scripts/code-map.mjs";
import { ARTIFACT_CLOSING_NOTE, ARTIFACT_NONE, ARTIFACT_NO_IMPORT_PATH, ARTIFACT_NO_LIVE_ENTRY, ARTIFACT_STAR, IMPACT_LABELS } from "../../../scripts/code-map-launch-config.mjs";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const TD = tmpDir(path.join(os.tmpdir(), "code-map-artifacts-"));
let failures = 0;
async function check(title, action) {
	try { await withinCaseLimit(title, action); console.log("PASS", title); }
	catch (error) { failures++; console.log("FAIL", title, error.stack); }
}
const config = { roots: ["probe"], moduleExtensions: [".mjs"], mapPath: "docs/code-map.md", runner: "npm run", packages: [{ id: "fixture", prefix: "" }], layers: [{ id: "all", title: "All", blurb: "x", match: "^probe/" }] };
const root = path.join(TD, "artifacts");
fs.mkdirSync(path.join(root, "probe"), { recursive: true });
fs.writeFileSync(path.join(root, "code-map.config.json"), JSON.stringify(config));
for (const [file, body] of Object.entries({ "writer.mjs": "export const W = 1;\n", "reader.mjs": 'import "./writer.mjs";\n', "reader2.mjs": 'import "./writer.mjs";\n', "outside.mjs": "export const O = 1;\n", "writer2.mjs": "export const W2 = 2;\n", "otherreader.mjs": "export const R = 3;\n", "thirdreader.mjs": "export const R3 = 4;\n" })) fs.writeFileSync(path.join(root, "probe", file), body);
const ledger = [
	"# CAP-01 · Fixture", "Kind: product", "Outcome: fixture", "", "## FEAT-001 · Maker", "Purpose: makes artifacts", "Status: active", "| ID | Requirement | Status | Evidence |", "|---|---|---|---|", "| R-001 | fixture | implemented | test |", "Artifact: A-001 · writer data · tracked: probe/writer.mjs · suite: probe/writer.mjs", "Artifact: A-002 · second data · tracked: probe/writer2.mjs · suite: probe/writer2.mjs", "Artifact: A-003 · retired data · retired: fixture", "",
	"## FEAT-002 · Reader", "Purpose: reads artifacts", "Status: active", "| ID | Requirement | Status | Evidence |", "|---|---|---|---|", "| R-002 | fixture | implemented | test |", "Reads: A-999 · probe/reader.mjs", "Reads: A-001 · probe/reader.mjs, probe/reader2.mjs, probe/writer.mjs, probe/outside.mjs", "Reads: A-001 · probe/reader.mjs", "Reads: A-002 · probe/otherreader.mjs", "Reads: A-003 · probe/reader.mjs", "",
	"## FEAT-003 · Another reader", "Purpose: also reads artifacts", "Status: active", "| ID | Requirement | Status | Evidence |", "|---|---|---|---|", "| R-003 | fixture | implemented | test |", "Reads: A-001 · probe/reader.mjs", "Reads: A-002 · probe/thirdreader.mjs", "",
].join("\n");
fs.writeFileSync(path.join(root, "REQUIREMENTS.md"), ledger);
const fixtureOutput = () => artifactBlock(root, ["--impact", ...["writer", "writer2", "reader", "reader2", "otherreader", "outside"].map((name) => path.join(root, "probe", `${name}.mjs`))]);
// req: R-2820
await check("R-2820: impact lists each artifact a named file writes with every recorded reader and marks readers outside its import radius", async () => {
	const out = await fixtureOutput();
	assert.ok(out.includes("artifacts for probe/writer.mjs (1):"));
	assert.ok(out.includes("writes A-001 writer data · FEAT-001 · suite"));
	assert.ok(out.includes("read by: probe/reader.mjs (FEAT-002, FEAT-003); probe/reader2.mjs (FEAT-002); probe/outside.mjs (FEAT-002)"));
	assert.ok(out.includes(`probe/outside.mjs (FEAT-002) ${ARTIFACT_NO_IMPORT_PATH}`));
	assert.ok(!out.includes("probe/writer.mjs (FEAT-002)"));
	assert.ok(out.includes("artifacts for probe/writer2.mjs (1):"));
	assert.ok(out.includes(`read by: probe/otherreader.mjs (FEAT-002) ${ARTIFACT_NO_IMPORT_PATH}; probe/thirdreader.mjs (FEAT-003) ${ARTIFACT_NO_IMPORT_PATH}`));
});
// req: R-2821
await check("R-2821: impact lists each artifact a named file reads, stars those whose writer is outside its import radius and marks IDs with no live entry", async () => {
	const out = await fixtureOutput();
	assert.ok(out.includes(`reads (3): A-001, A-003 ${ARTIFACT_NO_LIVE_ENTRY}, A-999 ${ARTIFACT_NO_LIVE_ENTRY}`));
	assert.ok(out.includes(`reads (1): A-002${ARTIFACT_STAR}`));
	assert.ok(!out.split("artifacts for probe/writer.mjs (1):")[1].split("artifacts for probe/writer2.mjs")[0].includes("reads"));
});
// req: R-2822
await check("R-2822: impact prints the launch-aware shim block, then the artifact block with its closing note", () => {
	const result = spawnSync(process.execPath, [path.join(REPO, "scripts", "code-map.mjs"), "--impact", "scripts/test.mjs", "README.md"], { cwd: REPO, encoding: "utf8", timeout: 30_000 });
	const out = result.stdout + result.stderr;
	assert.equal(result.status, 0, out);
	assert.ok(out.includes(`${ARTIFACT_NONE} README.md`));
	assert.equal(out.split(ARTIFACT_CLOSING_NOTE).length - 1, 1);
	assert.ok(out.indexOf(IMPACT_LABELS.untraced) >= 0);
	assert.ok(out.indexOf(IMPACT_LABELS.blind) > out.indexOf(IMPACT_LABELS.untraced));
	assert.ok(out.indexOf(IMPACT_LABELS.blind) < out.indexOf("artifacts for scripts/test.mjs"));
	assert.ok(!out.includes("artifact note:"));
});
// req: R-2823
await check("R-2823: an unreadable or unusable ledger or an unloadable parse gives one artifact note and keeps the impact output and exit code", async () => {
	const missing = path.join(TD, "missing-ledger"); fs.mkdirSync(missing);
	const nul = path.join(TD, "nul-ledger"); fs.mkdirSync(nul); fs.writeFileSync(path.join(nul, "REQUIREMENTS.md"), "\0\0");
	const notes = [await artifactBlock(missing, ["--impact", "probe.mjs"]), await artifactBlock(nul, ["--impact", "probe.mjs"]), await artifactBlock(root, ["--impact", "probe/reader.mjs"], { load: async () => { throw new Error("fixture loader failed"); } })];
	assert.ok(notes.every((out) => out.match(/artifact note:/g)?.length === 1));
});
process.exitCode = failures ? 1 : 0;
