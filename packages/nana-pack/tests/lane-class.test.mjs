/**
 * @module packages/nana-pack/tests/lane-class.test.mjs
 * @purpose Pin lane-class decisions for changed and planned paths, hop rules, errors, and the sealed path list.
 * @inputs scripts/lane-class.mjs and this checkout's code map.
 * @outputs Requirement-tagged PASS/FAIL lines and a non-zero exit on failure.
 * @effects process (runs the CLI); disk (none).
 * @errors Failed assertions print their title and exit non-zero.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CLASS_PATHS, LAUNCHED_CLIS } from "../lib/lane-class-config.mjs";

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
function line(result) { return result.stdout.trim().split(/\r?\n/); }

const ordinary = run("--files", "README.md");
// req: R-2960
check("R-2960: unrelated changed files print ordinary", ordinary.status === 0 && line(ordinary)[0] === "ordinary", JSON.stringify(ordinary));

const deletedAndNonModule = run("--files", "packages/nana-pack/extensions/deleted.ts,packages/nana-setup/lib/retired-fingerprints.json");
// req: R-2961
check("R-2961: sealed prefixes match deleted and non-module paths and name the first reason", deletedAndNonModule.status === 0 && line(deletedAndNonModule)[0].startsWith("hook:") && line(deletedAndNonModule)[0].includes("packages/nana-pack/extensions/deleted.ts"), JSON.stringify(deletedAndNonModule));

const cli = run("--files", "packages/nana-setup/bin/stale-copies.mjs");
// req: R-2962
check("R-2962: a launched CLI is named as a launched hook CLI", cli.status === 0 && line(cli)[0].startsWith("hook:") && line(cli)[0].includes("packages/nana-setup/bin/stale-copies.mjs") && /launched/.test(line(cli)[0]), JSON.stringify(cli));

const hookLib = run("--files", "packages/nana-knowledge/lib/hook.ts");
const toolLib = run("--files", "packages/nana-pack/lib/verdict-config.mjs");
const sharedToolLib = run("--files", "packages/nana-pack/lib/json-text.mjs");
// req: R-2963
check("R-2963: direct hook and tool importers are named, while shared tool dependencies stay ordinary", hookLib.status === 0 && line(hookLib)[0].startsWith("hook:") && line(hookLib)[0].includes("packages/nana-knowledge/bin/nana-knowledge.ts") && toolLib.status === 0 && line(toolLib)[0].startsWith("gate:") && line(toolLib)[0].includes("packages/nana-pack/bin/review-round.mjs") && sharedToolLib.status === 0 && line(sharedToolLib)[0] === "ordinary" && line(sharedToolLib).some((item) => item.startsWith("also reaches:")), JSON.stringify({ hookLib: hookLib.stdout, toolLib: toolLib.stdout, sharedToolLib: sharedToolLib.stdout }));

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
check("R-2966: worker runs the sealed-timeout class child after the build-end line and retains its build exit", workerSource.indexOf("if (buildEndKept) process.stderr.write(`${buildEndLine()}\\n`);") < workerSource.indexOf("lane class unavailable") && workerSource.indexOf("spawnSync(process.execPath, ['--no-warnings', script") > workerSource.indexOf("buildEndLine()") && workerSource.indexOf("const exit = outputError ? 1 : workerExit(r)") < workerSource.indexOf("lane class unavailable") && !/exit\s*=/.test(workerSource.slice(workerSource.indexOf("if (laneMode && buildEndKept)"))) && /timeout: LANE_CLASS_TIMEOUT_MS/.test(workerSource) && /process\.exit\(exit\)/.test(workerSource) && /import \{ fileURLToPath \} from 'node:url'/.test(workerSource) && /replace\(\/\[\\r\\n\]\+\$\//.test(workerSource) && /split\(\/\\r\?\\n\//.test(workerSource), "worker class call, output parsing, or exit ordering is missing");
// req: R-2967
check("R-2967: worker checks the class script at HEAD before running the class child", /git', \['cat-file', '-e', 'HEAD:scripts\/lane-class\.mjs'\]/.test(workerSource), "HEAD presence check missing");

const sealedExpected = ["packages/nana-pack/extensions/", "packages/nana-knowledge/extensions/", "packages/nana-stage/extensions/", "packages/nana-setup/claude/hooks/", "packages/nana-setup/bin/", "packages/nana-setup/lib/", "packages/nana-pack/lib/gate-paths.ts", "packages/nana-pack/lib/gate-rm-inside.ts", "packages/nana-pack/lib/gate-rm-outside.ts", "packages/nana-pack/lib/gate-shell.ts", "packages/nana-pack/lib/gate-temp-roots.ts", "packages/nana-pack/bin/nana-land.mjs", "packages/nana-pack/bin/pi-review.mjs", "packages/nana-pack/bin/claude-review.mjs", "packages/nana-pack/bin/review-round.mjs"];
const launchedExpected = ["packages/nana-pack/bin/nana-objective.mjs", "packages/nana-pack/bin/nana-frontier-summary.mjs", "packages/nana-pack/bin/nana-adoption.mjs", "packages/nana-knowledge/bin/nana-knowledge.ts", "packages/nana-setup/bin/stale-copies.mjs"];
// req: R-2961
check("seal: R-2961 class paths and launched CLIs match the reviewed path list", JSON.stringify(CLASS_PATHS.map(({ prefix }) => prefix)) === JSON.stringify(sealedExpected) && JSON.stringify(LAUNCHED_CLIS) === JSON.stringify(launchedExpected) && /AGENTS\.md:94/.test(await (await import("node:fs/promises")).readFile(fileURLToPath(new URL("../lib/lane-class-config.mjs", import.meta.url)), "utf8")), JSON.stringify({ paths: CLASS_PATHS, launched: LAUNCHED_CLIS }));

process.exit(failures ? 1 : 0);
