/**
 * @module packages/nana-pack/tests/runtime-map.test.mjs
 * @purpose Pin runtime measurement, impact freshness and per-test staleness from outside their command boundaries.
 * @inputs the real scripts/runtime-measure.mjs, packages/nana-pack/lib/runtime-map.mjs and scripts/code-map.mjs, fixture git repositories this file builds, and the real checkout's own tracked files and hashes for the --impact fixtures
 * @outputs one PASS / FAIL line per check and a non-zero exit when any check failed
 * @effects process (spawns git, the copied test runner, the real code-map and runtime-measure CLIs, and fake multi-level process trees for the signal case), disk (temp git repositories and data files under one mkdtemp tree, removed at exit)
 * @errors a FAIL line naming the broken behaviour; a non-zero exit code
 */
// must-meet.md (docs/reviews/runtime-map-2026-10-17/): MM2 to MM9. MM1 (R-1270, the runner's own
// knob-unset contract) lives in test-runner.test.mjs instead, beside the runner it pins.
//
// MM3, MM4, MM5 and MM7 spawn the REAL scripts/code-map.mjs CLI against THIS checkout (never a
// fixture clone) with NANA_RUNTIME_MAP_FILE pointed at fixture data this file builds from the
// checkout's OWN current tracked list and hashes (computed with the real hashFile at check time),
// so the "matches" case matches on any checkout, dirty or not, and nothing here reads or writes
// this clone's real runtime data.
import { tmpDir } from "./tmp-dir.mjs";
import { measure } from "../../../scripts/runtime-measure.mjs";
import { hashFile } from "../lib/runtime-map.mjs";
import { artifactBlock, runtimeBlock } from "../../../scripts/code-map.mjs";
import { ARTIFACT_CLOSING_NOTE, ARTIFACT_HEADING, ARTIFACT_NONE, ARTIFACT_NOTE_PREFIX, ARTIFACT_NO_IMPORT_PATH, ARTIFACT_NO_LIVE_ENTRY, ARTIFACT_READ_BY, ARTIFACT_READS, ARTIFACT_STAR, ARTIFACT_WRITES, COMPLETION_FILE, COVERAGE_ENV, NOTE_PREFIX, RECORD_FILE, STOP_WAIT_MS } from "../lib/runtime-map-config.mjs";
import { spawn, spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const RUNNER = path.join(REPO, "scripts", "test.mjs");
const TEST_LOCKED = path.join(REPO, "scripts", "test-locked.mjs");
const RUNTIME_MEASURE = path.join(REPO, "scripts", "runtime-measure.mjs");
const PROCESS_TREE = path.join(REPO, "packages", "nana-pack", "lib", "process-tree.mjs");
const RUNTIME_MAP_CONFIG = path.join(REPO, "packages", "nana-pack", "lib", "runtime-map-config.mjs");
const LAND_CONFIG = path.join(REPO, "packages", "nana-pack", "lib", "land-config.mjs");
const SUITE_RECORDS_CONFIG = path.join(REPO, "packages", "nana-pack", "lib", "suite-records-config.mjs");
const SUITE_RECORDS = path.join(REPO, "packages", "nana-pack", "lib", "suite-records.mjs");
const WINDOWS_SKIPS_CONFIG = path.join(REPO, "packages", "nana-pack", "lib", "windows-skips-config.mjs");
const TEST_RUNNER_CONFIG = path.join(REPO, "packages", "nana-pack", "lib", "test-runner-config.mjs");
const RUNTIME_MAP_READER = path.join(REPO, "packages", "nana-pack", "lib", "runtime-map.mjs");
const CODE_MAP = path.join(REPO, "scripts", "code-map.mjs");
const GENERATOR = path.join(REPO, "templates", "typescript", "template", "scripts", "code-map.mjs");
const TD = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "runtime-map-test-")));
const posix = process.platform !== "win32";

let fails = 0;
const check = (n, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : why); if (!ok) fails++; };
const skip = (n, why) => console.log("SKIP", n, "—", why);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const gone = (pid) => { try { process.kill(pid, 0); return false; } catch { return true; } };

/** A throwaway git repository with one commit holding the given files (path -> body). */
function mkGitFixture(name, files) {
	const root = path.join(TD, name);
	for (const [rel, body] of Object.entries(files)) {
		const p = path.join(root, rel);
		fs.mkdirSync(path.dirname(p), { recursive: true });
		fs.writeFileSync(p, body);
	}
	spawnSync("git", ["init", "-q", "-b", "main"], { cwd: root });
	spawnSync("git", ["add", "."], { cwd: root });
	spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "fixture"], { cwd: root });
	return root;
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// MM2 (R-1271): a measurement credits each test file with the files it (and its node child) ran.
// ════════════════════════════════════════════════════════════════════════════════════════════
const MM2_SLEEP_MS = 300; // chosen: a lower bound the recorded seconds must clear; no upper bound asserted
const rootMM2 = mkGitFixture("mm2", {
	"scripts/test.mjs": fs.readFileSync(RUNNER, "utf8"),
	"packages/nana-pack/lib/process-tree.mjs": fs.readFileSync(PROCESS_TREE, "utf8"),
	"packages/nana-pack/lib/runtime-map-config.mjs": fs.readFileSync(RUNTIME_MAP_CONFIG, "utf8"),
	"packages/nana-pack/lib/suite-records-config.mjs": fs.readFileSync(SUITE_RECORDS_CONFIG, "utf8"),
	"packages/nana-pack/lib/land-config.mjs": fs.readFileSync(LAND_CONFIG, "utf8"),
	"packages/nana-pack/lib/windows-skips-config.mjs": fs.readFileSync(WINDOWS_SKIPS_CONFIG, "utf8"),
	"packages/nana-pack/lib/test-runner-config.mjs": fs.readFileSync(TEST_RUNNER_CONFIG, "utf8"),
	"packages/probe/moduleA.mjs": "export const A = 1;\n",
	"packages/probe/moduleB.mjs": "export const B = 2;\n",
	"packages/probe/moduleC.mjs": "export const C = 4;\n",
	"packages/probe/run-child.mjs": 'import { B } from "./moduleB.mjs";\nconsole.log("child saw", B);\n',
	"packages/probe/tests/a.test.mjs": [
		'import { A } from "../moduleA.mjs";',
		'import { U } from "../untracked.mjs";',
		`await new Promise((resolve) => setTimeout(resolve, ${MM2_SLEEP_MS}));`,
		'console.log("PASS a ran", A, U);',
		"",
	].join("\n"),
	"packages/probe/tests/b.test.mjs": [
		'import { spawnSync } from "node:child_process";',
		'import * as path from "node:path";',
		'import { fileURLToPath } from "node:url";',
		'const here = path.dirname(fileURLToPath(import.meta.url));',
		'const r = spawnSync(process.execPath, [path.join(here, "..", "run-child.mjs")], { env: { PATH: process.env.PATH }, encoding: "utf8" });',
		'console.log("PASS b ran", r.status, r.stdout);',
		"",
	].join("\n"),
	// a genuinely failing file (sol MUST 1): with every record forced to PASS/0 this fixture
	// alone would still make every MM2 assertion pass, unless the label and the lower-bound
	// seconds below are checked against it specifically.
	"packages/probe/tests/c.test.mjs": [
		'import { C } from "../moduleC.mjs";',
		'console.log("FAIL c is meant to fail", C);',
		"process.exit(1);",
		"",
	].join("\n"),
});
// written AFTER the commit, so it is never added to git — the "credits no untracked file" case
fs.writeFileSync(path.join(rootMM2, "packages", "probe", "untracked.mjs"), "export const U = 3;\n");

function injectedRunnerStart({ root, env, coverageDir }) {
	return spawn(process.execPath, [path.join(root, "scripts", "test.mjs")], {
		cwd: root,
		env: { ...env, [COVERAGE_ENV]: coverageDir },
		stdio: "ignore",
	});
}
const dataMM2 = path.join(TD, "mm2-data.json");
await measure({ root: rootMM2, dataFile: dataMM2, start: injectedRunnerStart });
const exitMM2 = process.exitCode;
process.exitCode = undefined;
const dataMM2Result = JSON.parse(fs.readFileSync(dataMM2, "utf8"));
const aEntry = dataMM2Result.tests?.["packages/probe/tests/a.test.mjs"];
const bEntry = dataMM2Result.tests?.["packages/probe/tests/b.test.mjs"];
const cEntry = dataMM2Result.tests?.["packages/probe/tests/c.test.mjs"];
const noUntrackedMM2 = !Object.values(dataMM2Result.tests ?? {}).some((t) => (t.ran ?? []).includes("packages/probe/untracked.mjs"));
// req: R-1271
check("R-1271: a fixture measurement credits each test file with the tracked files it ran, a node child's files included when the child's environment lacks the coverage variable, with the file's label and seconds, and credits no untracked file",
	exitMM2 === 1 // c.test.mjs fails, and the suite's own exit code is the measure command's too
		&& aEntry?.label === "PASS" && aEntry?.seconds >= MM2_SLEEP_MS / 1000 && (aEntry?.ran ?? []).includes("packages/probe/moduleA.mjs")
		&& bEntry?.label === "PASS" && typeof bEntry?.seconds === "number"
		&& (bEntry?.ran ?? []).includes("packages/probe/run-child.mjs") && (bEntry?.ran ?? []).includes("packages/probe/moduleB.mjs")
		&& cEntry?.label === "FAIL" && typeof cEntry?.seconds === "number" && (cEntry?.ran ?? []).includes("packages/probe/moduleC.mjs")
		&& noUntrackedMM2,
);

// ════════════════════════════════════════════════════════════════════════════════════════════
// MM3, MM4, MM5, MM7: the real scripts/code-map.mjs CLI against THIS checkout, fed fixture data
// built from the checkout's own current tracked list and hashes.
// ════════════════════════════════════════════════════════════════════════════════════════════
function runCodeMap(args, env = {}) {
	const r = spawnSync(process.execPath, [CODE_MAP, ...args], { cwd: REPO, encoding: "utf8", env: { ...process.env, ...env } });
	return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}
const realTracked = spawnSync("git", ["ls-files"], { cwd: REPO, encoding: "utf8" }).stdout.split("\n").filter(Boolean);
function currentHashes() {
	const h = {};
	for (const f of realTracked) h[f] = hashFile(path.join(REPO, f));
	return h;
}
const NAMED_A = "scripts/test.mjs"; // always tracked in this repo
const NAMED_ZERO = "README.md"; // always tracked, never referenced by the fixture's tests
function mkImpactData(file, hashes) {
	fs.writeFileSync(
		file,
		JSON.stringify({
			schema: 1,
			hashes,
			// inserted shortest-first (astra SHOULD 2): a missing sort would print b before a,
			// in insertion order, instead of the expected longest-first a before b.
			tests: {
				"fixture/b.test.mjs": { label: "FAIL", seconds: 1.1, ran: [NAMED_A] },
				"fixture/a.test.mjs": { label: "PASS", seconds: 2.5, ran: [NAMED_A] },
			},
		}),
	);
}
const mm3Data = path.join(TD, "mm3-data.json");
mkImpactData(mm3Data, currentHashes());
const missingData = path.join(TD, "missing-data.json");

const noData = runCodeMap(["--impact", NAMED_A, NAMED_ZERO], { NANA_RUNTIME_MAP_FILE: missingData });
const noDataSuffix = `\n${NOTE_PREFIX} no runtime data; run npm run map:measure\n`;
const staticOk = noData.out.endsWith(noDataSuffix);
const staticPart = staticOk ? noData.out.slice(0, noData.out.length - noDataSuffix.length) : null;

const withData = runCodeMap(["--impact", NAMED_A, NAMED_ZERO], { NANA_RUNTIME_MAP_FILE: mm3Data });
// req: R-1272
check("R-1272: with runtime data, impact prints the generator's output byte for byte, then the artifact block, then the measured test files that ran each named file longest first with seconds and a FAIL label, a zero line for a file no test ran, and the not-counted closing line",
	staticOk
		&& withData.out.startsWith(`${staticPart}\n`)
		&& withData.out.includes(ARTIFACT_CLOSING_NOTE)
		&& withData.out.indexOf("artifacts for scripts/test.mjs") < withData.out.indexOf("runtime map:")
		&& !withData.out.includes("artifact note:")
		&& withData.out.includes(`measured tests for ${NAMED_A} (2):`)
		&& withData.out.includes("2.5s  fixture/a.test.mjs")
		&& withData.out.includes("1.1s  fixture/b.test.mjs [FAIL]")
		&& withData.out.indexOf("2.5s") < withData.out.indexOf("1.1s")
		&& withData.out.includes(`measured tests for ${NAMED_ZERO} (0): —`)
		&& withData.out.includes(NOTE_PREFIX)
		&& withData.out.includes("copies run from a temporary folder and children stopped by a signal are not counted"),
);

// req: R-1273
check("R-1273: with no runtime data, impact prints one note naming npm run map:measure after the generator's output and artifact block and exits with the generator's code",
	staticOk && noData.out.includes("npm run map:measure") && noData.code === 0,
);

// req: R-2822
check("R-2822: impact prints the generator output, then the artifact block with its closing note, then the runtime block",
	withData.code === 0
		&& withData.out.includes(`${ARTIFACT_NONE} ${NAMED_ZERO}`)
		&& withData.out.match(new RegExp(ARTIFACT_CLOSING_NOTE, "g"))?.length === 1
		&& withData.out.indexOf("untraced test modules") < withData.out.indexOf(`artifacts for ${NAMED_A}`)
		&& withData.out.indexOf(ARTIFACT_CLOSING_NOTE) < withData.out.indexOf("measured tests for")
		&& !withData.out.includes("artifact note:"));

const freshnessData = path.join(TD, "freshness-data.json");
const freshnessHashes = currentHashes();
freshnessHashes[NAMED_A] = "0".repeat(64);
delete freshnessHashes[NAMED_ZERO];
const freshnessTime = "2026-10-22T05:00:00.000Z";
fs.writeFileSync(freshnessData, JSON.stringify({
	schema: 1,
	tip: spawnSync("git", ["rev-parse", "HEAD"], { cwd: REPO, encoding: "utf8" }).stdout.trim(),
	measuredAt: freshnessTime,
	hashes: freshnessHashes,
	tests: {},
}));
const freshnessOut = runtimeBlock(REPO, ["--impact", NAMED_A], {
	env: { ...process.env, NANA_RUNTIME_MAP_FILE: freshnessData },
	now: () => new Date("2026-10-22T10:00:00.000Z"),
});
// req: R-2528
check("impact names the measured tip, its UTC time, its age in hours and how many tracked files differ",
	freshnessOut.includes(`runtime map: measured tip ${JSON.parse(fs.readFileSync(freshnessData, "utf8")).tip.slice(0, 8)} at ${freshnessTime} is 5 hours old; 2 tracked files differ from this checkout`),
	freshnessOut,
);

const relationConfig = {
	roots: ["probe"],
	moduleExtensions: [".mjs"],
	mapPath: "docs/code-map.md",
	runner: "npm run",
	packages: [{ id: "relation", prefix: "" }],
	layers: [{ id: "all", title: "All", blurb: "x", match: "^probe/" }],
};
const relationRoot = mkGitFixture("main-relation", {
	"code-map.config.json": JSON.stringify(relationConfig),
	"probe/a.mjs": "export const A = 1;\n",
	"probe/writer.mjs": "export const W = 1;\n",
	"probe/reader.mjs": 'import "./writer.mjs";\n',
	"probe/reader2.mjs": 'import "./writer.mjs";\n',
	"probe/outside.mjs": "export const O = 1;\n",
	"probe/writer2.mjs": "export const W2 = 2;\n",
	"probe/otherreader.mjs": "export const R = 3;\n",
	"probe/thirdreader.mjs": "export const R3 = 4;\n",
});
const artifactLedger = [
	"# CAP-01 · Fixture", "Kind: product", "Outcome: fixture", "", "## FEAT-001 · Maker", "Purpose: makes artifacts", "Status: active", "| ID | Requirement | Status | Evidence |", "|---|---|---|---|", "| R-001 | fixture | implemented | test |", "Artifact: A-001 · writer data · tracked: probe/writer.mjs · suite: probe/writer.mjs", "Artifact: A-002 · second data · tracked: probe/writer2.mjs · suite: probe/writer2.mjs", "Artifact: A-003 · retired data · retired: fixture", "",
	"## FEAT-002 · Reader", "Purpose: reads artifacts", "Status: active", "| ID | Requirement | Status | Evidence |", "|---|---|---|---|", "| R-002 | fixture | implemented | test |", "Reads: A-999 · probe/reader.mjs", "Reads: A-001 · probe/reader.mjs, probe/reader2.mjs, probe/writer.mjs, probe/outside.mjs", "Reads: A-001 · probe/reader.mjs", "Reads: A-002 · probe/otherreader.mjs", "Reads: A-003 · probe/reader.mjs", "",
	"## FEAT-003 · Another reader", "Purpose: also reads artifacts", "Status: active", "| ID | Requirement | Status | Evidence |", "|---|---|---|---|", "| R-003 | fixture | implemented | test |", "Reads: A-001 · probe/reader.mjs", "Reads: A-002 · probe/thirdreader.mjs", "",
].join("\n");
fs.writeFileSync(path.join(relationRoot, "REQUIREMENTS.md"), artifactLedger);
const artifactReader = async () => ({
	parseLedger: (await import("../../../scripts/requirements-tree.mjs")).parseLedger,
	ledgerReadProblem: (await import("../../../scripts/requirements-tree.mjs")).ledgerReadProblem,
	artifactRegistry: (await import("../../../scripts/deliverables.mjs")).artifactRegistry,
	artifactReads: (await import("../../../scripts/deliverables.mjs")).artifactReads,
});
const artifactFixtureOut = await artifactBlock(relationRoot, ["--impact", path.join(relationRoot, "probe", "writer.mjs"), path.join(relationRoot, "probe", "writer2.mjs"), path.join(relationRoot, "probe", "reader.mjs"), path.join(relationRoot, "probe", "reader2.mjs"), path.join(relationRoot, "probe", "otherreader.mjs"), path.join(relationRoot, "probe", "outside.mjs")], { load: artifactReader });
const writerReaders = "read by: probe/reader.mjs (FEAT-002, FEAT-003); probe/reader2.mjs (FEAT-002); probe/outside.mjs (FEAT-002)";
const secondWriterReaders = `read by: probe/otherreader.mjs (FEAT-002) ${ARTIFACT_NO_IMPORT_PATH}; probe/thirdreader.mjs (FEAT-003) ${ARTIFACT_NO_IMPORT_PATH}`;
// req: R-2820
check("R-2820: impact lists each artifact a named file writes with every recorded reader and marks readers outside its import radius",
	artifactFixtureOut.includes("artifacts for probe/writer.mjs (1):")
		&& artifactFixtureOut.includes("writes A-001 writer data · FEAT-001 · suite")
		&& artifactFixtureOut.includes(writerReaders)
		&& artifactFixtureOut.includes("probe/reader2.mjs (FEAT-002)")
		&& artifactFixtureOut.includes(`probe/outside.mjs (FEAT-002) ${ARTIFACT_NO_IMPORT_PATH}`)
		&& !artifactFixtureOut.includes("probe/writer.mjs (FEAT-002)")
		&& artifactFixtureOut.includes("artifacts for probe/writer2.mjs (1):")
		&& artifactFixtureOut.includes(secondWriterReaders));
// req: R-2821
check("R-2821: impact lists each artifact a named file reads, stars those whose writer is outside its import radius and marks IDs with no live entry",
	artifactFixtureOut.includes(`reads (3): A-001, A-003 ${ARTIFACT_NO_LIVE_ENTRY}, A-999 ${ARTIFACT_NO_LIVE_ENTRY}`)
		&& artifactFixtureOut.includes(`reads (1): A-002${ARTIFACT_STAR}`)
		&& artifactFixtureOut.includes("artifacts for probe/writer.mjs (1):")
		&& !artifactFixtureOut.split("artifacts for probe/writer.mjs (1):")[1].split("artifacts for probe/writer2.mjs")[0].includes("reads"));
const missingLedgerRoot = path.join(TD, "missing-ledger");
fs.mkdirSync(missingLedgerRoot, { recursive: true });
fs.writeFileSync(path.join(missingLedgerRoot, "code-map.config.json"), JSON.stringify(relationConfig));
fs.writeFileSync(path.join(missingLedgerRoot, "probe.mjs"), "export {};\n");
const missingLedgerNote = await artifactBlock(missingLedgerRoot, ["--impact", "probe.mjs"], { load: artifactReader });
const rejectedLoaderNote = await artifactBlock(relationRoot, ["--impact", "probe/reader.mjs"], { load: async () => { throw new Error("fixture loader failed"); } });
const nulLedgerRoot = path.join(TD, "nul-ledger");
fs.mkdirSync(nulLedgerRoot, { recursive: true });
fs.copyFileSync(path.join(relationRoot, "code-map.config.json"), path.join(nulLedgerRoot, "code-map.config.json"));
fs.writeFileSync(path.join(nulLedgerRoot, "REQUIREMENTS.md"), "\0\0");
const nulLedgerNote = await artifactBlock(nulLedgerRoot, ["--impact", "probe/reader.mjs"], { load: artifactReader });
// req: R-2823
check("R-2823: an unreadable or unusable ledger or an unloadable parse gives one artifact note and keeps the impact output and exit code",
	[missingLedgerNote, nulLedgerNote, rejectedLoaderNote].every((out) => out.match(/artifact note:/g)?.length === 1));

function fixtureGit(...args) {
	const result = spawnSync("git", args, { cwd: relationRoot, encoding: "utf8" });
	if (result.status !== 0) throw new Error((result.stderr ?? "git failed").trim());
	return result.stdout.trim();
}
const baseTip = fixtureGit("rev-parse", "HEAD");
for (let i = 1; i <= 3; i++) {
	fs.appendFileSync(path.join(relationRoot, "probe", "a.mjs"), `export const V${i} = ${i};\n`);
	fixtureGit("add", "probe/a.mjs");
	fixtureGit("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", `main-${i}`);
}
function relationOutput(name, tip) {
	const file = path.join(TD, `${name}.json`);
	const hashes = {};
	for (const tracked of fixtureGit("ls-files").split("\n").filter(Boolean)) hashes[tracked] = hashFile(path.join(relationRoot, tracked));
	fs.writeFileSync(file, JSON.stringify({ schema: 1, tip, measuredAt: freshnessTime, hashes, tests: {} }));
	return runtimeBlock(relationRoot, ["--impact", "probe/a.mjs"], {
		env: { ...process.env, NANA_RUNTIME_MAP_FILE: file },
		now: () => new Date("2026-10-22T10:00:00.000Z"),
	});
}
const mainPastOut = relationOutput("main-past", baseTip);
fixtureGit("checkout", "-qb", "ahead-of-main");
fs.appendFileSync(path.join(relationRoot, "probe", "a.mjs"), "export const AHEAD = true;\n");
fixtureGit("add", "probe/a.mjs");
fixtureGit("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "ahead");
const aheadOut = relationOutput("ahead", fixtureGit("rev-parse", "HEAD"));
const absentOut = relationOutput("absent", "f".repeat(40));
// req: R-2529
check("impact says how far main is past the measured tip, or that the tip is not on main",
	mainPastOut.includes("runtime map: main is 3 commits past the measured tip; the next land measures it")
		&& aheadOut.includes("runtime map: the measured tip is not on main; the next land measures it")
		&& absentOut.includes("runtime map: the measured tip is not on main; the next land measures it")
		&& !/fatal:|git error/i.test(`${mainPastOut}\n${aheadOut}\n${absentOut}`),
	`${mainPastOut}\n${aheadOut}\n${absentOut}`,
);

const changedTest = "packages/nana-pack/tests/runtime-map.test.mjs";
const unchangedTests = ["packages/nana-pack/tests/code-map.test.mjs", "packages/nana-pack/tests/blast-radius.test.mjs"];
function perTestStalenessData(file, kind) {
	const hashes = currentHashes();
	const target = kind === "gone" ? "no/such/file.txt" : NAMED_ZERO;
	if (kind === "changed") hashes[target] = "0".repeat(64);
	else if (kind === "untracked") delete hashes[target];
	else hashes[target] = "f".repeat(64);
	fs.writeFileSync(file, JSON.stringify({
		schema: 1,
		hashes,
		tests: {
			[changedTest]: { label: "PASS", seconds: 3, ran: [NAMED_A, target] },
			[unchangedTests[0]]: { label: "PASS", seconds: 2, ran: [NAMED_A] },
			[unchangedTests[1]]: { label: "PASS", seconds: 1, ran: [NAMED_A] },
		},
	}));
}
const stalenessOutputs = ["changed", "untracked", "gone"].map((kind) => {
	const file = path.join(TD, `per-test-${kind}.json`);
	perTestStalenessData(file, kind);
	return runCodeMap(["--impact", NAMED_A], { NANA_RUNTIME_MAP_FILE: file }).out;
});
// req: R-2534
check("impact marks stale only the measured tests that ran a changed file",
	stalenessOutputs.every((out) => out.includes(`3.0s  ${changedTest} [stale]`)
		&& unchangedTests.every((test) => !out.includes(`${test} [stale]`))
		&& !out.includes(`measured tests for ${NAMED_A} (3): [stale]`)),
	stalenessOutputs.join("\n---\n"),
);

const garbageData = path.join(TD, "garbage-data.json");
fs.writeFileSync(garbageData, "not json {{{");
const checkNoOverride = runCodeMap(["--check"]);
const checkMissing = runCodeMap(["--check"], { NANA_RUNTIME_MAP_FILE: missingData });
const checkValid = runCodeMap(["--check"], { NANA_RUNTIME_MAP_FILE: mm3Data });
const checkGarbage = runCodeMap(["--check"], { NANA_RUNTIME_MAP_FILE: garbageData });
// req: R-1276
check("R-1276: the map check's output and exit code are the same with no runtime data, valid data and garbage data",
	checkNoOverride.out === checkMissing.out && checkMissing.out === checkValid.out && checkValid.out === checkGarbage.out
		&& checkNoOverride.code === checkMissing.code && checkMissing.code === checkValid.code && checkValid.code === checkGarbage.code,
);

// ════════════════════════════════════════════════════════════════════════════════════════════
// MM6 (R-1275): a bad completion record leaves earlier data unchanged and exits non-zero.
// ════════════════════════════════════════════════════════════════════════════════════════════
const rootMM6 = mkGitFixture("mm6", { "README.md": "fixture\n" });
function fakeChild() {
	const ee = new EventEmitter();
	ee.pid = 999999;
	return ee;
}
function startFakeFolder(extra) {
	return ({ coverageDir }) => {
		const dir = path.join(coverageDir, "0000");
		fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(path.join(dir, RECORD_FILE), JSON.stringify({ path: "fake/a.test.mjs", label: "PASS", seconds: 1 }));
		extra?.(coverageDir);
		const child = fakeChild();
		setImmediate(() => child.emit("exit", 0, null));
		return child;
	};
}
const dataMM6 = path.join(TD, "mm6-data.json");
const earlierMM6 = JSON.stringify({ schema: 1, hashes: {}, tests: { marker: { label: "PASS", seconds: 0, ran: [] } } });
fs.writeFileSync(dataMM6, earlierMM6);

await measure({ root: rootMM6, dataFile: dataMM6, start: startFakeFolder(), stopWaitMs: 200 });
const exitNoCompletion = process.exitCode;
process.exitCode = undefined;
const unchangedNoCompletion = fs.readFileSync(dataMM6, "utf8") === earlierMM6;

await measure({
	root: rootMM6,
	dataFile: dataMM6,
	start: startFakeFolder((coverageDir) => fs.writeFileSync(path.join(coverageDir, COMPLETION_FILE), JSON.stringify({ files: 5 }))),
	stopWaitMs: 200,
});
const exitWrongCount = process.exitCode;
process.exitCode = undefined;
const unchangedWrongCount = fs.readFileSync(dataMM6, "utf8") === earlierMM6;

// req: R-1275
check("R-1275: a run with no completion record, or with a count that differs from the records read, leaves the earlier runtime data byte for byte unchanged and exits non-zero",
	exitNoCompletion !== 0 && unchangedNoCompletion && exitWrongCount !== 0 && unchangedWrongCount,
);

// ════════════════════════════════════════════════════════════════════════════════════════════
// MM8 (R-1277): off Windows, SIGINT/SIGTERM/SIGHUP end the suite's whole tree, including
// descendants orphaned between the first signal and escalation, without touching the caller.
// ════════════════════════════════════════════════════════════════════════════════════════════
const LEVEL_SCRIPT = path.join(TD, "tree-level.mjs");
fs.writeFileSync(LEVEL_SCRIPT, [
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	'import { spawn } from "node:child_process";',
	"const depth = Number(process.argv[2]);",
	"const outDir = process.argv[3];",
	"fs.writeFileSync(path.join(outDir, `level-${depth}.pid`), String(process.pid));",
	`if (depth === 3) fs.writeFileSync(path.join(outDir, "coverage-dir.txt"), process.env.${COVERAGE_ENV} ?? "");`,
	"if (depth > 1) spawn(process.execPath, [process.argv[1], String(depth - 1), outDir], { detached: true, stdio: \"ignore\" }).unref();",
	'else fs.writeFileSync(path.join(outDir, "ready"), "1");',
	"setTimeout(() => {}, 120000);",
	"",
].join("\n"));
const ORPHAN_WORKER_SCRIPT = path.join(TD, "orphan-worker.mjs");
fs.writeFileSync(ORPHAN_WORKER_SCRIPT, [
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	'const [, , kind, outDir] = process.argv;',
	'for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => {});',
	'fs.writeFileSync(path.join(outDir, `${kind}.pid`), String(process.pid));',
	'setTimeout(() => {}, 120000);',
	'',
].join("\n"));
const ORPHAN_BRIDGE_SCRIPT = path.join(TD, "orphan-bridge.mjs");
fs.writeFileSync(ORPHAN_BRIDGE_SCRIPT, [
	'import { spawn } from "node:child_process";',
	'const [, , worker, outDir] = process.argv;',
	'spawn(process.execPath, [worker, "same-group", outDir], { stdio: "ignore" }).unref();',
	'',
].join("\n"));
const ORPHAN_ROOT_SCRIPT = path.join(TD, "orphan-root.mjs");
fs.writeFileSync(ORPHAN_ROOT_SCRIPT, [
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	'import { spawn } from "node:child_process";',
	'const [, , worker, bridge, outDir] = process.argv;',
	`fs.writeFileSync(path.join(outDir, "coverage-dir.txt"), process.env.${COVERAGE_ENV} ?? "");`,
	'for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => process.exit(23));',
	'const bridgeChild = spawn(process.execPath, [bridge, worker, outDir], { stdio: "ignore" });',
	'bridgeChild.unref();',
	'spawn(process.execPath, [worker, "detached", outDir], { detached: true, stdio: "ignore" }).unref();',
	'const ready = setInterval(() => {',
	'  let bridgeGone = false; try { process.kill(bridgeChild.pid, 0); } catch { bridgeGone = true; }',
	'  if (bridgeGone && fs.existsSync(path.join(outDir, "same-group.pid")) && fs.existsSync(path.join(outDir, "detached.pid"))) {',
	'    clearInterval(ready); fs.writeFileSync(path.join(outDir, "ready"), "1");',
	'  }',
	'}, 10);',
	'setTimeout(() => {}, 120000);',
	'',
].join("\n"));
const HAND_STOP_WRAPPER = path.join(TD, "hand-stop-wrapper.mjs");
fs.writeFileSync(HAND_STOP_WRAPPER, [
	`import { handMeasure } from ${JSON.stringify(RUNTIME_MEASURE)};`,
	`process.exitCode = await handMeasure({ root: process.cwd(), env: process.env, testLocked: ${JSON.stringify(TEST_LOCKED)} });`,
	"",
].join("\n"));
const CALLER_SCRIPT = path.join(TD, "fake-caller.mjs");
fs.writeFileSync(CALLER_SCRIPT, [
	'import { spawn } from "node:child_process";',
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	"const [, , wrapperPath, outDir, root] = process.argv;",
	'const wrapper = spawn(process.execPath, [wrapperPath], { cwd: root, env: process.env, stdio: "ignore" });',
	'fs.writeFileSync(path.join(outDir, "measure.pid"), String(wrapper.pid));',
	'wrapper.on("exit", (code) => { try { fs.writeFileSync(path.join(outDir, "measure-exit.txt"), String(code)); } catch {} });',
	"setTimeout(() => {}, 120000);",
	"",
].join("\n"));
async function runStopCase(signal, orphan = false) {
	const suffix = `${signal}-${orphan ? "orphan" : "tree"}`;
	const outDir = path.join(TD, `mm8-${suffix}`);
	fs.mkdirSync(outDir, { recursive: true });
	const root = mkGitFixture(`mm8-root-${suffix}`, { "README.md": "fixture\n" });
	const dataFile = path.join(TD, `mm8-data-${suffix}.json`);
	const earlierData = JSON.stringify({ schema: 1, hashes: {}, tests: {}, marker: "earlier" });
	fs.writeFileSync(dataFile, earlierData);
	const suiteCommand = orphan
		? [process.execPath, ORPHAN_ROOT_SCRIPT, ORPHAN_WORKER_SCRIPT, ORPHAN_BRIDGE_SCRIPT, outDir]
		: [process.execPath, LEVEL_SCRIPT, "3", outDir];
	const env = {
		...process.env,
		NANA_RUNTIME_MAP_FILE: dataFile,
		NANA_SUITE_LOCK_DIR: path.join(TD, `mm8-lock-${suffix}`),
		NANA_SUITE_TEST_COMMAND: JSON.stringify(suiteCommand),
	};
	const caller = spawn(process.execPath, [CALLER_SCRIPT, HAND_STOP_WRAPPER, outDir, root], { env, stdio: "ignore" });
	const pidFiles = (orphan ? ["same-group.pid", "detached.pid"] : ["level-1.pid", "level-2.pid", "level-3.pid"]).map((f) => path.join(outDir, f));
	try {
		const readyPath = path.join(outDir, "ready");
		const readyDeadline = Date.now() + 10000;
		while (!fs.existsSync(readyPath) && Date.now() < readyDeadline) await sleep(50);
		if (!fs.existsSync(readyPath)) return false;
		const measurePid = Number(fs.readFileSync(path.join(outDir, "measure.pid"), "utf8"));
		try { process.kill(measurePid, signal); } catch {}
		await sleep(10);
		try { process.kill(measurePid, signal); } catch {}

		const margin = STOP_WAIT_MS + 4000; // the production stop wait plus a margin
		const deadline = Date.now() + margin;
		let treeGone = false;
		while (Date.now() < deadline) {
			const pids = pidFiles.map((f) => Number(fs.readFileSync(f, "utf8")));
			if (pids.every((pid) => gone(pid))) { treeGone = true; break; }
			await sleep(50);
		}
		const callerAlive = !gone(caller.pid);
		let measureExit = null;
		const exitDeadline = Date.now() + margin;
		while (Date.now() < exitDeadline) {
			if (fs.existsSync(path.join(outDir, "measure-exit.txt"))) {
				measureExit = fs.readFileSync(path.join(outDir, "measure-exit.txt"), "utf8").trim();
				break;
			}
			await sleep(50);
		}
		const coverageDirPath = fs.readFileSync(path.join(outDir, "coverage-dir.txt"), "utf8");
		const coverageGone = !!coverageDirPath && !fs.existsSync(coverageDirPath);
		const dataUnchanged = fs.readFileSync(dataFile, "utf8") === earlierData;
		return treeGone && callerAlive && coverageGone && dataUnchanged && measureExit !== null && measureExit !== "0";
	} finally {
		for (const file of pidFiles) {
			try { process.kill(Number(fs.readFileSync(file, "utf8")), "SIGKILL"); } catch {}
		}
		try { process.kill(caller.pid, "SIGKILL"); } catch {}
	}
}

if (posix) {
	const results = [];
	for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
		results.push(await runStopCase(signal));
		results.push(await runStopCase(signal, true));
	}
	// req: R-1277
	check("R-1277: off Windows, SIGINT or SIGTERM sent twice to the measure command while a fake three-level suite runs ends the whole tree within the stop wait, removes the coverage folder, leaves the caller alive and exits non-zero", results.every(Boolean));
} else {
	skip("R-1277: off Windows, SIGINT or SIGTERM sent twice to the measure command while a fake three-level suite runs ends the whole tree within the stop wait, removes the coverage folder, leaves the caller alive and exits non-zero", "runs only off Windows (R-1277 excludes it)");
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// MM9 (R-1278): the real measure command, run from a linked worktree with no override, writes
// nana/runtime-map.json under the git common directory, and the impact reader resolves the same
// file from the main checkout.
// ════════════════════════════════════════════════════════════════════════════════════════════
const mm9Config = {
	roots: ["scripts", "packages/probe"],
	moduleExtensions: [".mjs"],
	mapPath: "docs/code-map.md",
	runner: "npm run",
	packages: [{ id: "mm9", prefix: "" }],
	layers: [{ id: "all", title: "All", blurb: "x", match: "^(scripts/|packages/)" }],
};
const mainMM9 = mkGitFixture("mm9-main", {
	"code-map.config.json": JSON.stringify(mm9Config),
	"scripts/test.mjs": fs.readFileSync(RUNNER, "utf8"),
	"scripts/test-locked.mjs": fs.readFileSync(TEST_LOCKED, "utf8"),
	"scripts/runtime-measure.mjs": fs.readFileSync(RUNTIME_MEASURE, "utf8"),
	"scripts/code-map.mjs": fs.readFileSync(CODE_MAP, "utf8"),
	"scripts/code-map-launch.mjs": fs.readFileSync(path.join(REPO, "scripts/code-map-launch.mjs"), "utf8"),
	"scripts/code-search.mjs": fs.readFileSync(path.join(REPO, "scripts/code-search.mjs"), "utf8"),
	"scripts/code-search-config.mjs": fs.readFileSync(path.join(REPO, "scripts/code-search-config.mjs"), "utf8"),
	"templates/typescript/template/scripts/code-map.mjs": fs.readFileSync(GENERATOR, "utf8"),
	"packages/nana-pack/lib/process-tree.mjs": fs.readFileSync(PROCESS_TREE, "utf8"),
	"packages/nana-pack/lib/runtime-map-config.mjs": fs.readFileSync(RUNTIME_MAP_CONFIG, "utf8"),
	"packages/nana-pack/lib/land-config.mjs": fs.readFileSync(LAND_CONFIG, "utf8"),
	"packages/nana-pack/lib/suite-records-config.mjs": fs.readFileSync(SUITE_RECORDS_CONFIG, "utf8"),
	"packages/nana-pack/lib/suite-records.mjs": fs.readFileSync(SUITE_RECORDS, "utf8"),
	"packages/nana-pack/lib/windows-skips-config.mjs": fs.readFileSync(WINDOWS_SKIPS_CONFIG, "utf8"),
	"packages/nana-pack/lib/test-runner-config.mjs": fs.readFileSync(TEST_RUNNER_CONFIG, "utf8"),
	"packages/nana-pack/lib/runtime-map.mjs": fs.readFileSync(RUNTIME_MAP_READER, "utf8"),
	"packages/probe/moduleMM9.mjs": "export const M = 1;\n",
	"packages/probe/tests/a.test.mjs": [
		'import { M } from "../moduleMM9.mjs";',
		'console.log("PASS mm9 ran", M);',
		"",
	].join("\n"),
});
const worktreeMM9 = path.join(TD, "mm9-worktree");
spawnSync("git", ["worktree", "add", "-b", "mm9-wt", worktreeMM9, "HEAD"], { cwd: mainMM9 });

const gitCommonDirOut = spawnSync("git", ["rev-parse", "--git-common-dir"], { cwd: worktreeMM9, encoding: "utf8" }).stdout.trim();
const resolvedCommonDir = path.resolve(worktreeMM9, gitCommonDirOut);
const nanaDirMM9 = path.join(resolvedCommonDir, "nana");
const existedBeforeMM9 = fs.existsSync(nanaDirMM9);

const lockDirMM9 = path.join(TD, "mm9-lock");
const mm9Env = {
	...process.env,
	NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, path.join(worktreeMM9, "scripts", "test.mjs")]),
	NANA_SUITE_LOCK_DIR: lockDirMM9,
	npm_execpath: "/dummy/npm-cli.js",
};
delete mm9Env.NANA_RUNTIME_MAP_FILE;
const mm9Run = spawnSync(process.execPath, [path.join(worktreeMM9, "scripts", "runtime-measure.mjs")], {
	cwd: worktreeMM9, env: mm9Env, encoding: "utf8", timeout: 60000,
});

const dataFileMM9 = path.join(nanaDirMM9, "runtime-map.json");
const createdNanaMM9 = !existedBeforeMM9 && fs.existsSync(nanaDirMM9);
const runtimeMapPresentMM9 = fs.existsSync(dataFileMM9);

// the real impact command (sol MUST 2): run from the fixture's MAIN checkout, no override, so it
// has to resolve the same shared data file dataPath would, on its own, to show anything at all.
const impactEnvMM9 = { ...process.env };
delete impactEnvMM9.NANA_RUNTIME_MAP_FILE;
const mm9Impact = spawnSync(process.execPath, [path.join(mainMM9, "scripts", "code-map.mjs"), "--impact", "packages/probe/moduleMM9.mjs"], {
	cwd: mainMM9, env: impactEnvMM9, encoding: "utf8",
});
const mm9ImpactOut = (mm9Impact.stdout ?? "") + (mm9Impact.stderr ?? "");

// req: R-1278
check("R-1278: run from a linked worktree with no override, the real measure command writes nana/runtime-map.json under the git common directory and impact in the main checkout reads it",
	mm9Run.status === 0 && createdNanaMM9 && runtimeMapPresentMM9
		&& mm9Impact.status === 0
		&& mm9ImpactOut.match(/artifact note:/g)?.length === 1
		&& mm9ImpactOut.includes("measured tests for packages/probe/moduleMM9.mjs (1):")
		&& mm9ImpactOut.includes("packages/probe/tests/a.test.mjs"),
	`measure status: ${mm9Run.status}; measure output: ${(mm9Run.stdout ?? "") + (mm9Run.stderr ?? "")}; impact output: ${mm9ImpactOut}`,
);

// req: R-2820 R-2821 R-2822 R-2823
check("seal: the artifact block's heading, writes, read by, no import path, reads, star, no live entry, none, closing and note labels",
	ARTIFACT_HEADING === "artifacts for" && ARTIFACT_WRITES === "writes" && ARTIFACT_READ_BY === "read by"
		&& ARTIFACT_NO_IMPORT_PATH === "(no import path)" && ARTIFACT_READS === "reads" && ARTIFACT_STAR === "*"
		&& ARTIFACT_NO_LIVE_ENTRY === "(no live entry)"
		&& ARTIFACT_NONE === "artifacts: no Artifact writer list or Reads line names"
		&& ARTIFACT_CLOSING_NOTE === "artifact block shows only Artifact: writer lists and other features' Reads: lines; it leaves out readers in the maker's own feature, deliverable Read by: lines, hand-run makers and a file that is itself an artifact's location"
		&& ARTIFACT_NOTE_PREFIX === "artifact note:");

console.log(fails ? `\n${fails} check(s) failed` : "\nall checks passed");
process.exit(fails ? 1 : 0);
