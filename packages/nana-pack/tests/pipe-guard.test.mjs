/**
 * @module packages/nana-pack/tests/pipe-guard.test.mjs
 * @purpose Pins verifier-pipe classification and pi gate composition.
 * @inputs the pure pipe guard and nana-gate tool_call handler.
 * @outputs PASS/FAIL lines and a nonzero exit when any check fails.
 * @effects none
 * @errors an assertion failure exits nonzero.
 */
import { verifierPipeReason } from "../lib/pipe-guard.mjs";
import gateExtension from "../extensions/nana-gate.ts";
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

let failures = 0;
const check = (title, pass) => {
	console.log(pass ? "PASS" : "FAIL", title);
	if (!pass) failures++;
};

const cases = [
	["audit slip before commit", "npm test 2>&1 | tail -5 && git commit -am 'done'", true],
	["git -C target commit", "git log | head; git -C dir commit -m ok", true],
	["env-prefixed commit", "git log | head; env X=1 git commit -m ok", true],
	["commit in command substitution", "git log | head; echo $(git commit -m ok)", true],
	["quoted command substitution remains executable", "echo \"$(git log | head)\"; git commit -m ok", true],
	["pipe inside subshell", "(git log | head); git commit -m ok", true],
	["pipefail enabled", "set -o pipefail; npm test | tail; git commit -m ok", false],
	["pipefail only in subshell is inactive", "(echo start; set -o pipefail); npm test | tail; git commit -m ok", true],
	["PowerShell Bash syntax does not enable pipefail", "set -o pipefail; npm test | tail; git commit -m ok", true, "powershell"],
	["double-quoted backtick substitution pipeline", 'echo "`npm test | tail`"; git commit -m ok', true],
	["double-quoted backtick substitution commit", 'echo "`git log | head; git commit -m ok`"', true],
	["combined pipefail enabled", "set -euo pipefail; npm test | tail && git commit -m ok", false],
	["pipefail disabled later", "set -o pipefail; set +o pipefail; npm test | tail; git commit -m ok", true],
	["set eo pipefail", "set -eo pipefail; npm test | tail; git commit -m ok", false],
	["pipeline after commit", "git commit -m ok; git log | head", false],
	["no commit", "npm test | tail", false],
	["logical OR is not a pipeline", "npm test || true; git commit -m ok", false],
	["quoted pipe and commit text", "echo 'a | git commit' && git commit -m ok", false],
	["commented pipeline", "echo okay # npm test | tail && git commit\ngit commit -m ok", false],
	["here-doc text is not executed", "cat <<'END'\nnpm test | tail && git commit\nEND\ngit commit -m ok", false],
	["PowerShell pipeline", "npm test | Select-Object -First 1; git commit -m ok", true],
];
for (const [name, command, expected, dialect] of cases) {
	// req: R-982
	check(`predicate table: ${name}`, Boolean(verifierPipeReason(command, dialect)) === expected);
}

let handler;
gateExtension({ on: (event, fn) => { if (event === "tool_call") handler = fn; } });
const ctx = { cwd: process.cwd(), hasUI: false, isProjectTrusted: () => false };
const risky = "npm test 2>&1 | tail -5 && git commit -am done";
const pipeHit = await handler({ toolName: "bash", input: { command: risky } }, ctx);
// req: R-983
check("pi headless gate blocks with verifier-pipe reason", pipeHit?.block === true && /pipefail/.test(pipeHit.reason));
const dialogPrompts = [];
const interactiveCtx = { ...ctx, hasUI: true, ui: { setStatus() {}, theme: { fg: (_tone, text) => text }, select: async (prompt) => { dialogPrompts.push(prompt); return "Block"; } } };
const interactive = await handler({ toolName: "bash", input: { command: risky } }, interactiveCtx);
// req: R-983
check("pi interactive gate prompts with verifier-pipe reason", interactive?.block === true && dialogPrompts.some((prompt) => /pipefail/.test(prompt)));
const powershell = await handler({ toolName: "powershell", input: { command: "set -o pipefail; npm test | tail; git commit -m done" } }, ctx);
// req: R-983
check("pi PowerShell gate does not treat Bash pipefail syntax as active", powershell?.block === true && /pipefail/.test(powershell.reason));
const ordinary = await handler({ toolName: "bash", input: { command: "git commit -m done" } }, ctx);
// req: R-983
check("pi gate allows a bare commit", ordinary === undefined);
const existing = await handler({ toolName: "bash", input: { command: "rm -rf /tmp/x | cat; git commit -m done" } }, ctx);
// req: R-983
check("existing gate hit keeps precedence over the pipe reason", existing?.block === true && /dangerous command/.test(existing.reason) && !/pipefail/.test(existing.reason));
const unrelated = await handler({ toolName: "read", input: { path: "x" } }, ctx);
// req: R-983
check("other tool calls remain outside the gate", unrelated === undefined);

const home = tmpDir(path.join(os.tmpdir(), "nana-pipe-gate-"));
process.env.HOME = home;
process.env.USERPROFILE = home;
process.env.PI_CODING_AGENT_DIR = path.join(home, ".pi", "agent");
fs.mkdirSync(process.env.PI_CODING_AGENT_DIR, { recursive: true });
fs.writeFileSync(path.join(process.env.PI_CODING_AGENT_DIR, "nana-pack.json"), JSON.stringify({ journal: { enabled: false }, gate: { allowPatterns: ["^npm test"] } }));
let allowHandler;
gateExtension({ on: (event, fn) => { if (event === "tool_call") allowHandler = fn; } });
const allowCtx = { cwd: process.cwd(), hasUI: false, isProjectTrusted: () => false };
const allowHit = await allowHandler({ toolName: "bash", input: { command: risky } }, allowCtx);
// req: R-983
check("allowPatterns cannot exempt the verifier-pipe floor", allowHit?.block === true && /pipefail/.test(allowHit.reason));

if (failures) process.exitCode = 1;
