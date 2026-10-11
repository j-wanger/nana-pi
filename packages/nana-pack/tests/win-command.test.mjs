/**
 * @module packages/nana-pack/tests/win-command.test.mjs
 * @purpose Pins Windows command discovery, quoting, refusal and missing-command rules on every platform.
 * @inputs pure helper/config modules and injected Windows paths.
 * @outputs named PASS/FAIL checks and a nonzero exit on any mismatch.
 * @effects process (Windows-only cmd.exe and where probes).
 * @errors assertion mismatches set the process exit code.
 */
import { findOnPath, winCommand, cmdCouldNotRun } from "../lib/win-command.mjs";
import { INTERNAL_COMMANDS } from "../lib/win-command-config.mjs";
import { spawnSync } from "node:child_process";

let fails = 0;
let checks = 0;
const check = (name, actual, expected) => {
  checks++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(ok ? "PASS" : "FAIL", name, ok ? "" : `got ${JSON.stringify(actual)} expected ${JSON.stringify(expected)}`);
  if (!ok) fails++;
};
const files = new Set(["C:\\one\\pi.cmd", "C:\\one\\pi.exe", "C:\\cwd\\pi.cmd", "C:\\bin\\check.cmd", "C:\\bin\\tool.cmd"]);
const exists = (p) => [...files].some((file) => file.toLowerCase() === p.toLowerCase());
const env = { Path: '"C:\\one";;C:\\two', PATHEXT: ".cmd;.exe;.bat;.com" };
// req: R-1033
check("PATH keys ignore case, quoted and empty entries skip, PATHEXT order applies within folder", findOnPath("pi", { env, cwd: "C:\\cwd", exists }), "C:\\one\\pi.cmd");
// req: R-1033
check("earlier folder beats later extension", findOnPath("pi", { env: { PATH: "C:\\one;C:\\two", PATHEXT: ".exe;.cmd" }, exists: (p) => p === "C:\\one\\pi.cmd" || p === "C:\\two\\pi.exe" }), "C:\\one\\pi.cmd");
// req: R-1033
check("working directory is excluded unless requested", [findOnPath("pi", { env: { PATH: "", PATHEXT: ".cmd" }, cwd: "C:\\cwd", exists }), findOnPath("pi", { env: { PATH: "", PATHEXT: ".cmd" }, cwd: "C:\\cwd", searchCwd: true, exists })], [null, "C:\\cwd\\pi.cmd"]);
// req: R-1033
check("directories do not satisfy lookup", findOnPath("pi", { env: { PATH: "C:\\dir", PATHEXT: ".CMD" }, exists: () => false }), null);
// req: R-1033
check("existing extension and unsupported PATHEXT entries", [findOnPath("pi.CMD", { env, exists }), findOnPath("pi", { env: { PATH: "C:\\one", PATHEXT: ".JS;.PS1" }, exists })], ["C:\\one\\pi.CMD", null]);
// req: R-1034
check("uppercase pi.CMD selects cmd launch", winCommand("C:\\one\\pi.CMD", [], {}).command, "cmd.exe");
// req: R-1039
check("uppercase PI.EXE selects direct launch", winCommand("C:\\one\\PI.EXE", [], {}).command, "C:\\one\\PI.EXE");
// req: R-1034
check("cmd launch quotes path and arguments exactly", winCommand("C:\\path with space\\pi.cmd", ["--version"], { comspec: "C:\\Windows\\cmd.exe" }), { command: "C:\\Windows\\cmd.exe", args: ["/d", "/v:off", "/s", "/c", '""C:\\path with space\\pi.cmd" "--version""'], options: { windowsVerbatimArguments: true } });
// req: R-1039
check("exe with metacharacters launches directly", winCommand("C:\\100%!\\pi.exe", ["%", "!"], {}), { command: "C:\\100%!\\pi.exe", args: ["%", "!"], options: {} });
for (const bad of ['"', "%", "!", "\r", "\n", "\0"]) {
  const refusal = winCommand(`C:\\${bad}\\pi.cmd`, [], {}).refused;
  // req: R-1035
  check(`cmd refusal names ${JSON.stringify(bad)}`, Boolean(refusal) && refusal.includes(bad === '"' ? "double quote" : bad === "\r" ? "carriage return" : bad === "\n" ? "line feed" : bad === "\0" ? "NUL" : bad), true);
}
// req: R-1035
check("cmd trailing backslash refused", Boolean(winCommand("C:\\bin\\pi.cmd", ["ends\\"], {}).refused), true);
// req: R-1039
check("unsupported extension refused", Boolean(winCommand("pi.ps1", [], {}).refused), true);
const cmdCases = [
  ["missing-tool x", true], [".\\missing-tool", true], ["C:\\nowhere\\tool.exe", true],
  ["tool x", false], ["check x", false], [".\\check", false], ["ECHO", false], ["type missing.txt", false],
  ["dir/Z", false], ["cd\\nowhere", false], ["cd..", false], ["echo.text", false], ["", false], ["   missing-tool", true],
  ["%ComSpec% /c exit 1", false], ["@node -e x", false], ["^ruff check", false], ['"C:\\nowhere\\tool.exe"', false], ["ruff,check", false], ["missing-tool&&x", false],
];
for (const [cmd, expected] of cmdCases) {
  // req: R-1038
  check(`cmdCouldNotRun ${JSON.stringify(cmd)}`, cmdCouldNotRun(cmd, { env: { PATH: "C:\\bin", PATHEXT: ".CMD;.EXE" }, cwd: "C:\\cwd", exists: (p) => ["c:\\cwd\\check.cmd", "c:\\bin\\tool.cmd"].includes(p.toLowerCase()) }), expected);
}
// req: R-1038
check("sealed cmd internal command vocabulary", INTERNAL_COMMANDS, "assoc break call cd chdir cls color copy date del dir dpath echo endlocal erase exit for ftype goto if keys md mkdir mklink move path pause popd prompt pushd rd rem ren rename rmdir set setlocal shift start time title type ver verify vol".split(" "));
if (process.platform === "win32") {
  for (const name of INTERNAL_COMMANDS) {
    const where = spawnSync("where", [name], { encoding: "utf8", windowsHide: true });
    // req: R-1038
    check(`Windows where confirms internal ${name} is not external`, where.status !== 0, true);
    const cmd = spawnSync("cmd.exe", ["/d", "/c", `${name} /?`], { encoding: "utf8", windowsHide: true });
    // req: R-1038
    check(`Windows cmd confirms internal ${name} runs`, cmd.status === 0, true);
  }
} else console.log("SKIP Windows sealed-command integration: each name via where and cmd /d /c");
console.log(`win-command: ${checks} checks, ${fails} failure(s)`);
process.exitCode = fails ? 1 : 0;
