#!/usr/bin/env node
/**
 * @module packages/nana-setup/tests/objective-path-shapes.test.mjs
 * @purpose Pin the shared objective-path resolver: doctor and install never throw on a shaped
 *  objective.path, doctor's new ✗ row names the value and the default file only when the value is
 *  invalid, an empty string resolves to the default file everywhere, and the tilde-backslash rule
 *  expands only on win32.
 * @inputs lib/objective-path.mjs, lib/doctor.mjs, lib/steps.mjs, lib/paths.mjs, bin/nana-setup.mjs,
 *  the nana-pack objective producer CLI, and throwaway --home layouts with a knowledge sources.json
 * @outputs PASS/FAIL/SKIP lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway home layouts, nana-pack.json and objective-file fixtures), process
 *  (spawns the nana-setup and nana-objective CLIs)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: objective.path of any JSON shape never throws, in the producer, doctor or install, and the
// three runtimes keep naming the same file. Every run here goes into a throwaway --home; nothing
// touches the real machine.
import { tmpDir } from "./tmp-dir.mjs";
import { withPiStub } from "./stub-pi.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const { resolveObjectivePath } = await import(new URL("../../nana-pack/lib/objective-path.mjs", import.meta.url).href);
const { diagnose } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
const { resolveLayout } = await import(new URL("../lib/paths.mjs", import.meta.url).href);
const { install } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
const { PI_MODEL_SHELL_ENV } = await import(new URL("../../nana-pack/bin/worker-config.mjs", import.meta.url).href);

const diagnoseWithPi = (...args) => withPiStub(() => diagnose(...args));

let fails = 0;
const check = (title, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail); if (!ok) fails++; };

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const repo = path.resolve(pkg, "..", "..");
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const objectiveCli = path.join(repo, "packages", "nana-pack", "bin", "nana-objective.mjs");

const tmps = [];
const NEUTRAL_CWD = tmpDir(path.join(os.tmpdir(), "nana-objective-path-shapes-cwd-"));

/** A throwaway home with a tiny knowledge source and the pi-subagents floor seeded, so `install`
 *  runs end to end with no unrelated ✗ row (copied from install.test.mjs's freshHome). */
function freshHome() {
	const td = tmpDir(path.join(os.tmpdir(), "nana-objective-path-shapes-"));
	tmps.push(td);
	fs.mkdirSync(path.join(td, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.mkdirSync(path.join(td, "src"), { recursive: true });
	fs.writeFileSync(path.join(td, "src", "note.md"), "# Note\nOne tiny knowledge file.\n");
	fs.writeFileSync(
		path.join(td, ".pi", "agent", "nana-knowledge", "sources.json"),
		JSON.stringify({ roots: [{ path: path.join(td, "src"), kind: "articles" }] }),
	);
	const subagentDir = path.join(td, ".pi", "agent", "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(subagentDir, { recursive: true });
	fs.writeFileSync(path.join(subagentDir, "package.json"), JSON.stringify({ name: "pi-subagents", version: "0.75.0" }));
	return td;
}

/** Write <home>/.pi/agent/nana-pack.json with the given objective block, raw — no schema layer,
 *  exactly as doctor and install read it. */
function writeConfig(home, objective) {
	const file = path.join(home, ".pi", "agent", "nana-pack.json");
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, JSON.stringify({ objective }));
}

/** Producer env: HOME/USERPROFILE = home, PI_CODING_AGENT_DIR = <home>/.pi/agent, and no stray
 *  pi-model-shell marker (cleanEnv, copied from pack-config-utf16.test.mjs). */
function cleanEnv(home, extra = {}) {
	const env = { ...process.env, HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: path.join(home, ".pi", "agent"), ...extra };
	delete env[PI_MODEL_SHELL_ENV];
	return env;
}

const runCli = (args) => spawnSync(process.execPath, [cli, ...args], { cwd: NEUTRAL_CWD, encoding: "utf8", env: process.env });
const runObjective = (home) => spawnSync(process.execPath, [objectiveCli, "--cwd", NEUTRAL_CWD], { cwd: NEUTRAL_CWD, encoding: "utf8", env: cleanEnv(home) });

try {
	// -------------------------------------------------------------------------------- R-2280
	{
		const badValues = [5, true, {}, []];
		const cliResults = badValues.map((v) => {
			const home = freshHome();
			writeConfig(home, { path: v });
			const r = withPiStub(() => runCli(["doctor", "--home", home]));
			return { v, r };
		});
		const cliOk = cliResults.every(({ r }) =>
			r.status === 1 &&
			!/TypeError/.test(r.stdout) && !/TypeError/.test(r.stderr) &&
			!/^\s+at /m.test(r.stdout) && !/^\s+at /m.test(r.stderr) &&
			!r.stdout.includes("could not predict"),
		);

		const inProcessOk = badValues.every((v) => {
			const home = freshHome();
			writeConfig(home, { path: v });
			const layout = resolveLayout({ home });
			const withValue = diagnoseWithPi(layout, { projectDir: NEUTRAL_CWD }).map((c) => c.label);
			writeConfig(home, {});
			const baseline = diagnoseWithPi(layout, { projectDir: NEUTRAL_CWD }).map((c) => c.label);
			const withoutRow = withValue.filter((l) => l !== "pi objective.path");
			return JSON.stringify(withoutRow) === JSON.stringify(baseline) && withValue.includes("pi objective.path");
		});

		// req: R-2280
		check("R-2280: doctor prints every row and no stack trace when objective.path is 5, true or an object",
			cliOk && inProcessOk,
			JSON.stringify(cliResults.map(({ v, r }) => ({ v, status: r.status, out: `${r.stdout}${r.stderr}`.slice(0, 400) }))));
	}

	// -------------------------------------------------------------------------------- R-2281
	{
		const invalidValues = [5, true, false, {}, []];
		const invalidOk = invalidValues.every((v) => {
			const home = freshHome();
			writeConfig(home, { path: v });
			const layout = resolveLayout({ home });
			const row = diagnoseWithPi(layout, { projectDir: NEUTRAL_CWD }).find((c) => c.label === "pi objective.path");
			return row?.status === "fail" && row.detail.includes(JSON.stringify(v)) && row.detail.includes(layout.piObjective);
		});
		const noRowFor = [null, "", "notes/goal.md", "absent"];
		const absentOk = noRowFor.every((v) => {
			const home = freshHome();
			writeConfig(home, v === "absent" ? {} : { path: v });
			const layout = resolveLayout({ home });
			return diagnoseWithPi(layout, { projectDir: NEUTRAL_CWD }).find((c) => c.label === "pi objective.path") === undefined;
		});
		// the named default file is exactly the file the producer's `governing:` line names once it holds an **Objective line
		const home = freshHome();
		writeConfig(home, { path: 5 });
		const layout = resolveLayout({ home });
		fs.mkdirSync(path.dirname(layout.piObjective), { recursive: true });
		fs.writeFileSync(layout.piObjective, "**Objective (since 2026-10-20):** made-up default\n");
		const producerResult = runObjective(home);
		const sameFileOk = producerResult.stdout.includes(`governing: ${layout.piObjective}`);

		// req: R-2281
		check("R-2281: doctor marks objective.path ✗ naming the value and the default file only when it is neither a string nor null",
			invalidOk && absentOk && sameFileOk,
			JSON.stringify({ invalidOk, absentOk, sameFileOk, producerStdout: producerResult.stdout }));
	}

	// -------------------------------------------------------------------------------- R-2282
	{
		const values = [5, true, {}];
		const results = values.map((v) => {
			const home = freshHome();
			writeConfig(home, { path: v });
			const r = runCli(["install", "--home", home]);
			const noTypeError = !/TypeError/.test(r.stdout) && !/TypeError/.test(r.stderr);
			const layout = resolveLayout({ home });
			// second, idempotent in-process call: a pure label-list read, after the CLI above already installed
			const labels = install(layout, {}).map((x) => x.label);
			const defaultExists = fs.existsSync(layout.piObjective);
			return { v, status: r.status, noTypeError, labels, defaultExists };
		});

		const baselineHome = freshHome();
		writeConfig(baselineHome, {});
		const baselineLayout = resolveLayout({ home: baselineHome });
		const baselineLabels = install(baselineLayout, {}).map((x) => x.label); // first, fresh in-process call

		const ok = results.every((r) => r.status === 0 && r.noTypeError && r.defaultExists && JSON.stringify(r.labels) === JSON.stringify(baselineLabels));
		// req: R-2282
		check("R-2282: install runs every step and seeds the default objective file when objective.path is 5, true or an object",
			ok, JSON.stringify({ results: results.map(({ v, status, noTypeError, defaultExists }) => ({ v, status, noTypeError, defaultExists })), baselineLabels }));
	}

	// -------------------------------------------------------------------------------- R-2283
	{
		const home = freshHome();
		writeConfig(home, { path: "" });
		const layout = resolveLayout({ home });
		const results = install(layout, {}); // first, fresh in-process call
		const objStep = results.find((r) => r.label === "pi nana-objective.md");
		const installOk = objStep?.status === "created" && !/not needed/.test(objStep.detail ?? "");

		const producerResult = runObjective(home);
		const producerOk = producerResult.stdout.includes("**Objective") &&
			!producerResult.stdout.includes("OBJECTIVE UNAVAILABLE") &&
			producerResult.stdout.includes(`governing: ${layout.piObjective}`);

		const doctorRow = diagnoseWithPi(layout, { projectDir: NEUTRAL_CWD }).find((c) => c.label === "pi objective file");
		const doctorOk = doctorRow?.status === "ok" && doctorRow.detail === layout.piObjective;

		// req: R-2283
		check("R-2283: an empty objective.path names the default objective file in the producer, doctor and install",
			installOk && producerOk && doctorOk,
			JSON.stringify({ objStep, producerStdout: producerResult.stdout, doctorRow }));
	}

	// -------------------------------------------------------------------------------- R-2284
	{
		const winHome = "C:\\Users\\jane-zq9";
		const winAgent = "C:\\Users\\jane-zq9\\.pi\\agent";
		const posixHome = "/home/jane-zq9";
		const posixAgent = "/home/jane-zq9/.pi/agent";

		const winBackslash = resolveObjectivePath("~\\notes\\goal.md", { home: winHome, agentDir: winAgent, platform: "win32" });
		const posixBackslash = resolveObjectivePath("~\\notes\\goal.md", { home: posixHome, agentDir: posixAgent, platform: "darwin" });
		const winSlash = resolveObjectivePath("~/notes/goal.md", { home: winHome, agentDir: winAgent, platform: "win32" });
		const posixSlash = resolveObjectivePath("~/notes/goal.md", { home: posixHome, agentDir: posixAgent, platform: "darwin" });

		const ok =
			winBackslash === path.win32.join(winHome, "notes", "goal.md") &&
			posixBackslash === path.posix.join(posixAgent, "~\\notes\\goal.md") &&
			winSlash === path.win32.join(winHome, "notes", "goal.md") &&
			posixSlash === path.posix.join(posixHome, "notes", "goal.md");

		// req: R-2284
		check("R-2284: the objective path resolver expands a tilde-backslash prefix to the home folder only on win32",
			ok, JSON.stringify({ winBackslash, posixBackslash, winSlash, posixSlash }));
	}

	// -------------------------------------------------------------------------------- R-2285 (Windows CI leg only)
	// req-candidate: R-2285 (Windows only; becomes req: when the Windows CI leg passes it)
	if (process.platform !== "win32") {
		console.log("SKIP R-2285: on Windows, the producer and doctor both read a tilde-backslash objective.path from the home folder — win32 only");
	} else {
		const home = freshHome();
		const notesDir = path.join(home, "notes");
		fs.mkdirSync(notesDir, { recursive: true });
		const goalFile = path.join(notesDir, "goal.md");
		fs.writeFileSync(goalFile, "**Objective (since 2026-10-20):** made-up win32 tilde-backslash\n");
		writeConfig(home, { path: "~\\notes\\goal.md" });
		const layout = resolveLayout({ home });
		const producerResult = runObjective(home);
		const doctorRow = diagnoseWithPi(layout, { projectDir: NEUTRAL_CWD }).find((c) => c.label === "pi objective file");

		check("R-2285: on Windows, the producer and doctor both read a tilde-backslash objective.path from the home folder",
			producerResult.stdout.includes(`governing: ${goalFile}`) && doctorRow?.status === "ok" && doctorRow.detail === goalFile,
			JSON.stringify({ stdout: producerResult.stdout, doctorRow }));
	}
} finally {
	for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
}

console.log(fails ? `FAILED ${fails}` : "ALL PASS");
process.exit(fails ? 1 : 0);
