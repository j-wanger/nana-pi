/**
 * @module packages/nana-pack/tests/lane-class.test.mjs
 * @purpose Pin lane-class decisions for changed and planned paths, hop rules, errors, and the sealed path list.
 * @inputs scripts/lane-class.mjs and this checkout's code map.
 * @outputs Requirement-tagged PASS/FAIL lines and a non-zero exit on failure.
 * @effects process (runs the CLI); disk (none).
 * @errors Failed assertions print their title and exit non-zero.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { CLASS_PATHS, LAUNCHED_CLIS, LANE_CLASS_MAX_BUFFER_BYTES } from "../lib/lane-class-config.mjs";

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const CLI = fileURLToPath(new URL("../../../scripts/lane-class.mjs", import.meta.url));
let failures = 0;
function check(name, ok, why = "") {
	console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why);
	if (!ok) failures++;
}
function run(...args) {
	return spawnSync(process.execPath, [CLI, "--root", ROOT, ...args], { encoding: "utf8", timeout: 45_000 });
}
function runAt(root, ...args) {
	return spawnSync(process.execPath, [CLI, "--root", root, ...args], { encoding: "utf8", timeout: 45_000 });
}
function line(result) { return result.stdout.trim().split(/\r?\n/); }

const ordinary = run("--files", "README.md");
// req: R-2960
check("R-2960: unrelated changed files print ordinary", ordinary.status === 0 && line(ordinary)[0] === "ordinary", JSON.stringify(ordinary));

const deletedAndNonModule = run("--files", "packages/nana-pack/extensions/deleted.ts,packages/nana-setup/lib/retired-fingerprints.json");
const extensionFixture = tmpDir(path.join(tmpdir(), "lane-class-"));
let addedExtension;
try {
	writeFileSync(path.join(extensionFixture, "package.json"), JSON.stringify({ pi: { extensions: ["./packages/extra/extensions"] } }));
	copyFileSync(path.join(ROOT, "code-map.config.json"), path.join(extensionFixture, "code-map.config.json"));
	mkdirSync(path.join(extensionFixture, "packages/nana-stage"), { recursive: true });
	writeFileSync(path.join(extensionFixture, "packages/nana-stage/package.json"), JSON.stringify({ pi: { extensions: ["./extensions"] } }));
	addedExtension = runAt(extensionFixture, "--files", "packages/extra/extensions/hook-data.txt");
} finally { rmSync(extensionFixture, { recursive: true, force: true }); }
// req: R-2961
check("R-2961: sealed prefixes match deleted, non-module and manifest-added extension paths", deletedAndNonModule.status === 0 && line(deletedAndNonModule)[0].startsWith("hook:") && line(deletedAndNonModule)[0].includes("packages/nana-pack/extensions/deleted.ts") && addedExtension.status === 0 && line(addedExtension)[0] === "hook: packages/extra/extensions/hook-data.txt — pi extension", JSON.stringify({ deletedAndNonModule, addedExtension }));

const cli = run("--files", "packages/nana-setup/bin/stale-copies.mjs");
// req: R-2962
check("R-2962: a launched CLI is named as a launched hook CLI", cli.status === 0 && line(cli)[0].startsWith("hook:") && line(cli)[0].includes("packages/nana-setup/bin/stale-copies.mjs") && /launched/.test(line(cli)[0]), JSON.stringify(cli));

const hookLib = run("--files", "packages/nana-knowledge/lib/hook.ts");
const toolLib = run("--files", "packages/nana-pack/lib/verdict-config.mjs");
const installLib = run("--files", "packages/nana-pack/lib/json-text.mjs");
const sharedToolLib = run("--files", "packages/nana-pack/lib/record-ledger.mjs");
const realPathLib = run("--files", "packages/nana-pack/lib/real-path.mjs");
const extensionOnlyLib = run("--files", "packages/nana-pack/lib/post-edit-config.mjs");
// req: R-2963
check("R-2963: direct hook, tool and install importers are named, while shared tool dependencies stay ordinary", hookLib.status === 0 && line(hookLib)[0].startsWith("hook:") && line(hookLib)[0].includes("packages/nana-knowledge/bin/nana-knowledge.ts") && toolLib.status === 0 && line(toolLib)[0].startsWith("gate:") && line(toolLib)[0].includes("packages/nana-pack/bin/review-round.mjs") && realPathLib.status === 0 && /^(install|gate):/.test(line(realPathLib)[0]) && line(realPathLib)[0].includes("packages/nana-pack/lib/gate-") && installLib.status === 0 && line(installLib)[0].startsWith("install:") && line(installLib)[0].includes("packages/nana-setup/lib/") && sharedToolLib.status === 0 && line(sharedToolLib)[0] === "ordinary" && line(sharedToolLib).some((item) => item.startsWith("also reaches:")), JSON.stringify({ hookLib: hookLib.stdout, toolLib: toolLib.stdout, realPathLib: realPathLib.stdout, installLib: installLib.stdout, sharedToolLib: sharedToolLib.stdout }));
// req: R-2963
check("R-2963: a library imported only by a pi extension names that extension as hook", extensionOnlyLib.status === 0 && line(extensionOnlyLib)[0].startsWith("hook:") && line(extensionOnlyLib)[0].includes("packages/nana-pack/extensions/nana-post-edit.ts"), JSON.stringify({ path: "packages/nana-pack/lib/post-edit-config.mjs", importer: "packages/nana-pack/extensions/nana-post-edit.ts", output: extensionOnlyLib.stdout }));

const posix = run("--files", "packages/nana-setup/lib/planned.json");
const winPath = run("--files", ".\\packages\\nana-setup\\lib\\planned.json");
// req: R-2964
check("R-2964: planned paths normalize dot and Windows separators like posix paths", posix.status === 0 && winPath.status === 0 && line(posix)[0] === line(winPath)[0], JSON.stringify({ posix: posix.stdout, winPath: winPath.stdout }));

const badArgs = spawnSync(process.execPath, [CLI, "--root", ROOT, "--wat", "x"], { encoding: "utf8" });
const noBase = run("--base", "refs/heads/lane-class-no-such-base");
// req: R-2965 R-2968
check("R-2965: usage and missing merge base fail with their cause and no class", badArgs.status === 2 && /--root/.test(badArgs.stderr) && noBase.status === 1 && /merge base/.test(noBase.stderr) && !noBase.stdout.trim(), JSON.stringify({ badArgs, noBase }));

const workerSource = await (await import("node:fs/promises")).readFile(fileURLToPath(new URL("../bin/pi-worker.mjs", import.meta.url)), "utf8");
// req: R-2966
check("R-2966: worker source bounds the class child and preserves exit ordering on timeout",  workerSource.indexOf("if (buildEndKept) process.stderr.write(`${buildEndLine()}\\n`);") < workerSource.indexOf("lane class unavailable") && workerSource.indexOf("spawnSync(process.execPath, ['--no-warnings', script") > workerSource.indexOf("buildEndLine()") && workerSource.indexOf("const exit = outputError ? 1 : workerExit(r)") < workerSource.indexOf("lane class unavailable") && !/exit\s*=/.test(workerSource.slice(workerSource.indexOf("if (laneMode && buildEndKept)"))) && /timeout: LANE_CLASS_TIMEOUT_MS/.test(workerSource) && /process\.exit\(exit\)/.test(workerSource) && /import \{ fileURLToPath \} from 'node:url'/.test(workerSource) && /replace\(\/\[\\r\\n\]\+\$\//.test(workerSource) && /split\(\/\\r\?\\n\//.test(workerSource), "worker class call, output parsing, or exit ordering is missing");
const workerFixture = tmpDir(path.join(tmpdir(), "lane-class-worker-"));
let workerRun;
try {
	const repo = path.join(workerFixture, "repo"), lane = path.join(workerFixture, "lane"), home = path.join(workerFixture, "home"), stub = path.join(workerFixture, "stub");
	mkdirSync(repo, { recursive: true }); mkdirSync(home, { recursive: true }); mkdirSync(stub, { recursive: true });
	const git = (cwd, ...args) => execFileSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args], { cwd, encoding: "utf8" }).trim();
	git(repo, "init", "-q", "-b", "main");
	mkdirSync(path.join(repo, "scripts"), { recursive: true });
	writeFileSync(path.join(repo, "scripts/lane-class.mjs"), "// present at HEAD\n");
	git(repo, "add", "scripts/lane-class.mjs"); git(repo, "commit", "-qm", "seed");
	git(repo, "worktree", "add", "-q", "-b", "feat/alpha", lane);
	git(repo, "checkout", "-q", "--detach"); git(repo, "branch", "-q", "-D", "main");
	writeFileSync(path.join(lane, "brief.md"), "Feature: FEAT-029 · Navigate code and investigate impact\n\nPrecedent:\n- scripts/lane-class.mjs\n");
	mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	writeFileSync(path.join(home, ".pi", "agent", "nana-pack.json"), JSON.stringify({ roster: { scout: null, builder: { provider: "fixture", model: "fixture", thinking: null }, reviewer: { provider: "fixture", model: "fixture", thinking: null }, land: null } }));
	const pi = path.join(stub, process.platform === "win32" ? "pi.cmd" : "pi");
	writeFileSync(pi, process.platform === "win32" ? "@echo off\r\nexit /b 7\r\n" : "#!/bin/sh\nexit 7\n", { mode: 0o755 });
	workerRun = spawnSync(process.execPath, [fileURLToPath(new URL("../bin/pi-worker.mjs", import.meta.url)), "--poll", "0.1", "--stall-secs", "5", "--retries", "0", "--out", path.join(workerFixture, "out.md"), "--lane", "alpha", "--brief", "brief.md", "--lane-size", "small"], { cwd: lane, encoding: "utf8", timeout: 30_000, env: { ...process.env, HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: path.join(home, ".pi", "agent"), PATH: `${stub}${path.delimiter}${process.env.PATH ?? ""}` } });
} finally { rmSync(workerFixture, { recursive: true, force: true }); }
const workerLines = (workerRun?.stderr ?? "").split(/\r?\n/);
const endLineAt = workerLines.findIndex((item) => item.startsWith("pi-worker: build record:"));
const unavailableAt = workerLines.findIndex((item) => item.startsWith("pi-worker: lane class unavailable:"));
// req: R-2966
check("R-2966: failed class child prints one reason after build end and keeps the build exit", workerRun?.status === 1 && endLineAt >= 0 && unavailableAt > endLineAt && workerLines.filter((item) => item.startsWith("pi-worker: lane class unavailable:")).length === 1, JSON.stringify({ status: workerRun?.status, stderr: workerRun?.stderr }));
// req: R-2967
check("R-2967: worker checks the class script at HEAD before running the class child", /git', \['cat-file', '-e', 'HEAD:scripts\/lane-class\.mjs'\]/.test(workerSource), "HEAD presence check missing");

const sealedExpected = ["packages/nana-setup/claude/hooks/", "packages/nana-setup/bin/", "packages/nana-setup/lib/", "packages/nana-pack/lib/gate-paths.ts", "packages/nana-pack/lib/gate-rm-inside.ts", "packages/nana-pack/lib/gate-rm-outside.ts", "packages/nana-pack/lib/gate-shell.ts", "packages/nana-pack/lib/gate-temp-roots.ts", "packages/nana-pack/bin/nana-land.mjs", "packages/nana-pack/bin/pi-review.mjs", "packages/nana-pack/bin/claude-review.mjs", "packages/nana-pack/bin/review-round.mjs"];
const launchedExpected = ["packages/nana-pack/bin/nana-objective.mjs", "packages/nana-pack/bin/nana-frontier-summary.mjs", "packages/nana-pack/bin/nana-adoption.mjs", "packages/nana-knowledge/bin/nana-knowledge.ts", "packages/nana-setup/bin/stale-copies.mjs"];
// req: R-2961
check("seal: R-2961 class paths and launched CLIs match the reviewed path list", JSON.stringify(CLASS_PATHS.map(({ prefix }) => prefix)) === JSON.stringify(sealedExpected) && JSON.stringify(LAUNCHED_CLIS) === JSON.stringify(launchedExpected) && LANE_CLASS_MAX_BUFFER_BYTES === 1024 * 1024 && /cap captured class output at 1 MiB/.test(await (await import("node:fs/promises")).readFile(fileURLToPath(new URL("../lib/lane-class-config.mjs", import.meta.url)), "utf8")) && /AGENTS\.md:94/.test(await (await import("node:fs/promises")).readFile(fileURLToPath(new URL("../lib/lane-class-config.mjs", import.meta.url)), "utf8")), JSON.stringify({ paths: CLASS_PATHS, launched: LAUNCHED_CLIS, maxBuffer: LANE_CLASS_MAX_BUFFER_BYTES }));

process.exit(failures ? 1 : 0);
