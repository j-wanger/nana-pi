/**
 * @module packages/nana-setup/tests/stale-copies-slow.test.mjs
 * @purpose Prove stale-copies remains reliable under slow installs and reports checker failures.
 * @inputs stale-copies.test.mjs, child-process preloads, and temporary folders.
 * @outputs PASS/FAIL/SKIP lines and a summary; nonzero exit on failure.
 * @effects disk (temporary fixtures only), process (meta-runs stale-copies).
 * @errors failed child runs or unexpected fixture output fail their checks.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { STALE_UNAVAILABLE_PREFIX } from "../lib/stale-copies-config.mjs";

// chosen 2026-10-21: exceeds the observed 5-second kill and stays below the sealed 20-second child limit.
const SLOW_INSTALL_MS = 6_000;
// chosen 2026-10-21: two meta-runs stay well below the runner's per-file limit, including the slowed run.
const META_RUN_LIMIT_MS = 120_000;
let passes = 0;
let fails = 0;
let skips = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
	if (ok) passes++;
	else fails++;
};
const skip = (reason) => { console.log("SKIP", reason); skips++; };
const root = tmpDir(path.join(os.tmpdir(), "nana-stale-copies-slow-"));
const packageFolder = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const staleCopies = path.join(packageFolder, "tests", "stale-copies.test.mjs");

function metaRun(preloadName, preloadSource) {
	const preload = path.join(root, preloadName);
	fs.writeFileSync(preload, preloadSource);
	const childTmp = path.join(root, `${preloadName}-tmp`);
	fs.mkdirSync(childTmp);
	const preloadOption = `--require="${preload.replaceAll("\\", "/")}"`;
	return spawnSync(process.execPath, ["--experimental-strip-types", staleCopies], {
		cwd: packageFolder,
		env: {
			...process.env,
			TMPDIR: childTmp,
			TMP: childTmp,
			TEMP: childTmp,
			NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} ${preloadOption}`,
		},
		encoding: "utf8",
		timeout: META_RUN_LIMIT_MS,
	});
}

if (process.platform === "win32") {
	skip("R-2482: forced-win32 fixtures prove the limit off Windows; a second Windows run would re-expose the open linked-claude failure");
} else {
	const slowRun = metaRun("slow install preload.cjs", `const path = require("node:path");
const sleeper = new Int32Array(new SharedArrayBuffer(4));
if (path.basename(process.argv[1] || "") === "nana-setup.mjs" && process.argv[2] === "install" && String(process.env.HOME || "").includes("-legacy-home-")) Atomics.wait(sleeper, 0, 0, ${SLOW_INSTALL_MS});
`);
	const slowOutput = `${slowRun.stdout ?? ""}${slowRun.stderr ?? ""}`;
	const slowLines = slowOutput.split(/\r?\n/);
	// req: R-2482
	check("R-2482: off Windows, stale-copies passes every check when each install in its legacy fixture homes takes six seconds longer",
		slowRun.status === 0 && !slowLines.some((line) => line.startsWith("FAIL")) && /^SUMMARY\s+PASS=\d+ FAIL=0/m.test(slowOutput),
		JSON.stringify({ status: slowRun.status, signal: slowRun.signal, error: slowRun.error?.message, summary: slowLines.find((line) => line.startsWith("SUMMARY")), failures: slowLines.filter((line) => line.startsWith("FAIL")) }));
}

if (process.platform === "win32") {
	skip("R-2483: a second Windows run would re-expose the open linked-claude failure; forced-win32 fixtures are covered off Windows");
} else {
	const failedCheckerRun = metaRun("failed linked claude preload.cjs", `const path = require("node:path");
if (path.basename(process.argv[1] || "") === "stale-copies.mjs" && String(process.env.HOME || "").includes("-linked-claude-home-")) process.exit(1);
`);
	const output = `${failedCheckerRun.stdout ?? ""}${failedCheckerRun.stderr ?? ""}`;
	const title = "FAIL R-1761: the stale line names exactly the rule, skill and hook rows doctor marks failed";
	const line = output.split(/\r?\n/).find((candidate) => candidate.startsWith(title));
	let facts = [];
	try { facts = JSON.parse(line.slice(title.length).trim()); } catch {}
	const linked = facts.filter((item) => item.name === "linked-claude");
	const ok = failedCheckerRun.status !== 0 && linked.length > 0 && linked.every((item) => item.hookStatus === 0 && item.hookSignal === null && Number.isFinite(item.hookMs) && item.hookMs >= 0 && Array.isArray(item.unavailable) && item.unavailable.length === 1 && item.unavailable[0].startsWith(STALE_UNAVAILABLE_PREFIX));
	// req: R-2483
	check("R-2483: when the stale-copies checker fails inside the linked-claude adoption hook, the R-1761 failure names that hook run's status, signal, time and unavailable line",
		ok,
		JSON.stringify({ status: failedCheckerRun.status, signal: failedCheckerRun.signal, linked, unavailablePrefix: STALE_UNAVAILABLE_PREFIX }));
}

fs.rmSync(root, { recursive: true, force: true });
console.log(`SUMMARY  PASS=${passes} FAIL=${fails} SKIP=${skips}`);
process.exitCode = fails ? 1 : 0;
