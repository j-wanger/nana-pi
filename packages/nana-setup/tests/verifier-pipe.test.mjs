/**
 * @module packages/nana-setup/tests/verifier-pipe.test.mjs
 * @purpose Pins Claude hook decisions, setup wiring, doctor health, and declared runtime coverage.
 * @inputs the canonical verifier hook, settings and doctor modules, and shared runtime documentation.
 * @outputs PASS/FAIL lines and a nonzero exit when any check fails.
 * @effects disk (throwaway home), process (runs the hook with fixture stdin).
 * @errors an assertion failure exits nonzero.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { desiredHooks } from "../lib/settings.mjs";
import { diagnose } from "../lib/doctor.mjs";
import { resolveLayout } from "../lib/paths.mjs";
import { runHook } from "../claude/hooks/verifier-pipe.mjs";
import { verifierPipeReason } from "../../nana-pack/lib/pipe-guard.mjs";

let failures = 0;
const check = (title, pass, extra = "") => {
	console.log(pass ? "PASS" : "FAIL", title, pass ? "" : extra);
	if (!pass) failures++;
};
const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const root = path.resolve(pkg, "..", "..");
const hook = path.join(pkg, "claude", "hooks", "verifier-pipe.mjs");
const installedHome = tmpDir(path.join(os.tmpdir(), "nana-pipe-installed-"));
const install = spawnSync(process.execPath, [path.join(pkg, "bin", "nana-setup.mjs"), "install", "--home", installedHome], { encoding: "utf8" });
const installedHook = path.join(installedHome, ".claude", "hooks", "verifier-pipe.mjs");
const invokeInstalledHook = (input) => spawnSync(process.execPath, [installedHook], { input, encoding: "utf8" });
const hit = invokeInstalledHook(JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "npm test | tail -1 && git commit -m done" } }));
// req: R-984
check("installed symlink asks on a verifier-pipe hit", install.status === 0 && fs.realpathSync(installedHook) === hook && hit.status === 0 && JSON.stringify(JSON.parse(hit.stdout).hookSpecificOutput) === JSON.stringify({ hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: verifierPipeReason("npm test | tail -1 && git commit -m done") }));
const ordinary = invokeInstalledHook(JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "git status" } }));
// req: R-984
check("installed symlink abstains on an unrelated command", ordinary.status === 0 && ordinary.stdout === "" && ordinary.stderr === "");
const invalid = invokeInstalledHook("{");
// req: R-984
check("installed symlink abstains on malformed JSON with stderr note", invalid.status === 0 && invalid.stdout === "" && /nana verifier-pipe:/.test(invalid.stderr));
const malformedShape = invokeInstalledHook(JSON.stringify({ tool_name: "Bash", tool_input: { command: "git log | head; git commit" } }));
// req: R-984
check("installed hook reports malformed JSON shape on stderr", malformedShape.status === 0 && malformedShape.stdout === "" && /nana verifier-pipe:.*malformed/.test(malformedShape.stderr));
let protocolStdout = "";
let protocolStderr = "";
runHook(JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "git log | head; git commit" } }), {
	predicate: () => { throw new Error("predicate failure"); },
	stdout: { write: (text) => { protocolStdout += text; } },
	stderr: { write: (text) => { protocolStderr += text; } },
});
// req: R-984
check("protocol writer reports predicate errors on stderr", protocolStdout === "" && /nana verifier-pipe:.*predicate failure.*abstaining/.test(protocolStderr));

const hooks = desiredHooks({ hooksDir: "/tmp/claude/hooks", repoRoot: root });
const pipe = hooks.find((entry) => entry.label === "PreToolUse verifier pipe");
// req: R-985
check("setup wants a Node PreToolUse hook with exact script spec", pipe?.event === "PreToolUse" && pipe.matcher === "Bash" && pipe.spec.interpreters.includes("node") && pipe.spec.script === "verifier-pipe.mjs" && pipe.entry.command.startsWith("node "));

const home = tmpDir(path.join(os.tmpdir(), "nana-pipe-doctor-"));
const layout = resolveLayout({ home });
fs.mkdirSync(layout.hooksDir, { recursive: true });
fs.mkdirSync(layout.claudeHome, { recursive: true });
fs.symlinkSync(hook, path.join(layout.hooksDir, "verifier-pipe.mjs"));
const missing = diagnose(layout, { projectDir: home }).find((item) => item.label === "settings PreToolUse verifier pipe");
// req: R-985
check("doctor reports the missing user hook wiring unhealthy", missing?.status === "fail");
const settings = { hooks: { PreToolUse: [{ matcher: pipe.matcher, hooks: [{ type: "command", command: pipe.entry.command }] }] } };
fs.writeFileSync(layout.claudeSettings, JSON.stringify(settings));
const healthy = diagnose(layout, { projectDir: home }).find((item) => item.label === "settings PreToolUse verifier pipe");
// req: R-985
check("doctor accepts the installed Node hook wiring", healthy?.status === "ok", JSON.stringify(healthy));

const matrix = fs.readFileSync(path.join(root, "templates/_shared/working-under-nana-pi.md"), "utf8");
const packReadme = fs.readFileSync(path.join(root, "packages/nana-pack/README.md"), "utf8");
const setupReadme = fs.readFileSync(path.join(pkg, "README.md"), "utf8");
const claudeRow = matrix.split("\n").find((line) => line.startsWith("| Claude Code seat |")) ?? "";
const piRow = matrix.split("\n").find((line) => line.startsWith("| pi TUI or desk session |")) ?? "";
// req: R-985
check("runtime matrix declares verifier-pipe surfaces for pi and Claude Code", /Verifier pipe/.test(matrix) && /Bash PreToolUse Node hook/.test(claudeRow) && /nana-gate/.test(piRow) && /shared predicate/.test(piRow));
const packDeclaration = packReadme.split("\n").find((line) => line.includes("Verifier-pipe guard")) ?? "";
const setupDeclaration = setupReadme.split("\n").find((line) => line.includes("Verifier-pipe guard")) ?? "";
// req: R-985
check("both READMEs declare the user-scope live verifier-pipe change", /user-scope/.test(packDeclaration) && /every session/.test(packDeclaration) && /user-scope/.test(setupDeclaration) && /every session/.test(setupDeclaration));
// req: R-985
check("pack README declares the Claude win32 hook limitation", /Claude Code.*unavailable on win32/.test(packDeclaration));
// req: R-982
check("both READMEs declare the literal-text later-call gap and the sandbox boundary", [packDeclaration, setupDeclaration].every((line) => /best-effort text check/.test(line) && /not present in the literal command text/.test(line) && /reached through a later call/.test(line) && /sandbox is the boundary/.test(line)));
// req: R-985
check("setup README retains context retirement and knowledge migration guarantees", setupReadme.includes("Install removes only the exact managed `bash ~/.claude/hooks/context-size-check.sh` invocation; variants are preserved.") && setupReadme.includes("The knowledge hook is migrated in place only when its timeout and status metadata match"));

if (failures) process.exitCode = 1;
