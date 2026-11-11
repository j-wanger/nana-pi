/**
 * @module packages/nana-pack/tests/win-command.test.mjs
 * @purpose Pins Windows command discovery, quoting and launch refusals on every platform.
 * @inputs pure helper/config modules and injected Windows paths.
 * @outputs named PASS/FAIL checks and a nonzero exit on any mismatch.
 * @effects none
 * @errors assertion mismatches set the process exit code.
 */
import { findOnPath, findPi, winCommand } from "../lib/win-command.mjs";

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
check("existing extension and unsupported PATHEXT entries",  [findOnPath("pi.CMD", { env, exists }), findOnPath("tool", { env: { PATH: "C:\\bin", PATHEXT: ".PY;.CMD" }, exists: (p) => p.toLowerCase() === "c:\\bin\\tool.py" }), findPi({ env: { PATH: "C:\\bin", PATHEXT: ".JS;.PS1;.CMD" }, exists: (p) => /\\.js$|\\.ps1$/i.test(p) || p.toLowerCase() === "c:\\bin\\pi.cmd" })], ["C:\\one\\pi.CMD", "C:\\bin\\tool.py", "C:\\bin\\pi.cmd"]);
// req: R-1033
check("findPi excludes non-pi PATHEXT extensions", findPi({ env: { PATH: "C:\\bin", PATHEXT: ".JS;.PS1" }, exists: () => true }), null);
// req: R-1034
check("uppercase pi.CMD selects cmd launch", winCommand("C:\\one\\pi.CMD", [], {}).command, "cmd.exe");
// req: R-1039
check("uppercase PI.EXE selects direct launch", winCommand("C:\\one\\PI.EXE", [], {}).command, "C:\\one\\PI.EXE");
// req: R-1034
check("cmd launch quotes path and arguments exactly", winCommand("C:\\path with space\\pi.cmd", ["--version"], { comspec: "C:\\Windows\\cmd.exe" }), { command: "C:\\Windows\\cmd.exe", args: ["/d", "/v:off", "/s", "/c", '""C:\\path with space\\pi.cmd" "--version""'], options: { windowsVerbatimArguments: true } });
// req: R-1039
check("exe with metacharacters launches directly", winCommand("C:\\100%!\\pi.exe", ["%", "!"], {}), { command: "C:\\100%!\\pi.exe", args: ["%", "!"], options: {} });
for (const bad of ['"', "%", "!", "\r", "\n", "\0"]) {
  const label = bad === '"' ? "double quote" : bad === "\r" ? "carriage return" : bad === "\n" ? "line feed" : bad === "\0" ? "NUL" : bad;
  const refusal = winCommand(`C:\\${bad}\\pi.cmd`, [], {}).refused;
  // req: R-1035
  check(`cmd refusal names ${JSON.stringify(bad)}`, Boolean(refusal) && refusal.includes(label), true);
  const argumentRefusal = winCommand("C:\\bin\\pi.cmd", [bad], {}).refused;
  // req: R-1035
  check(`cmd argument refusal names ${JSON.stringify(bad)}`, Boolean(argumentRefusal) && argumentRefusal.includes(label), true);
}
// req: R-1035
check("cmd trailing backslash refused", Boolean(winCommand("C:\\bin\\pi.cmd", ["ends\\"], {}).refused), true);
// req: R-1039
check("unsupported extension refused", Boolean(winCommand("pi.ps1", [], {}).refused), true);
console.log(`win-command: ${checks} checks, ${fails} failure(s)`);
process.exitCode = fails ? 1 : 0;
