/**
 * @module packages/nana-pack/tests/post-edit-values-named.test.mjs
 * @purpose Pins that the post-edit checker reads its kill grace, output cap, failure cap, command cap
 *  and lock message cap BY NAME from lib/post-edit-config.mjs, so retuning any of the five there
 *  changes the check's behaviour with no other code change.
 * @inputs a copy of extensions/nana-post-edit.ts and the whole lib/ directory (its post-edit-config.mjs
 *  retuned to 1234, 64, 37, 9 and 11 in the copy only), a stand-in @earendil-works/pi-coding-agent
 *  package under the copy's own node_modules, a user nana-pack.json under a temp HOME with one
 *  command per case, and the real lib/post-edit-config.mjs
 * @outputs PASS/FAIL lines per check on stdout, and exit code 1 when any check fails
 * @effects disk (temp HOME, a temp copy of extensions/lib plus its stand-in node_modules package,
 *  a workspace with checker script files), process (sets HOME/USERPROFILE, runs one `node -e` and
 *  two `node <script>` checker commands)
 * @errors a failed check prints FAIL with the observed detail; an import or run failure is caught and
 *  reported as a failing check rather than propagating
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

let fails = 0;
const check = (title, ok, detail) => {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : (detail ?? ""));
	if (!ok) { fails++; process.exitCode = 1; }
};

// L1 fixture: isolate the user-scope config this run reads, as the other post-edit tests do
// (os.homedir() reads HOME on posix, USERPROFILE on win32).
const NANA_HOME = tmpDir(path.join(os.tmpdir(), "postedit-named-home-"));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
delete process.env.PI_CODING_AGENT_DIR;

// A copy of the extension plus its whole lib/, as post-edit-default-timeout.test.mjs does, so the
// five exports this lane names can be retuned in the copy without touching the real module — a
// check against the imported name would still pass if an inline literal were left in place.
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const copyRoot = tmpDir(path.join(os.tmpdir(), "postedit-named-copy-"));
fs.mkdirSync(path.join(copyRoot, "extensions"), { recursive: true });
fs.cpSync(path.join(pkgRoot, "extensions", "nana-post-edit.ts"), path.join(copyRoot, "extensions", "nana-post-edit.ts"));
fs.cpSync(path.join(pkgRoot, "lib"), path.join(copyRoot, "lib"), { recursive: true });

// Rewrite the five named values in the copy only, each only far enough from its sealed value
// (R-2215) to prove the extension reads them BY NAME rather than an inline literal. The output
// cap stays above the failure cap, as a real config would.
const RETUNE = [
	["POST_EDIT_KILL_GRACE_MS", 1234],
	["POST_EDIT_OUTPUT_CAP", 64],
	["POST_EDIT_FAILURE_CAP", 37],
	["POST_EDIT_COMMAND_CAP", 9],
	["POST_EDIT_LOCK_MESSAGE_CAP", 11],
];
const configPath = path.join(copyRoot, "lib", "post-edit-config.mjs");
const rewritten = {};
{
	let text = fs.readFileSync(configPath, "utf8");
	for (const [name, value] of RETUNE) {
		const re = new RegExp(`(export const ${name}\\s*=\\s*)[^;]+;`);
		const next = text.replace(re, `$1${value}; // chosen: retuned by this test's copy, only to differ from the sealed value`);
		rewritten[name] = next !== text;
		text = next;
	}
	fs.writeFileSync(configPath, text);
}
const [GRACE, OUTPUT_CAP, FAILURE_CAP, COMMAND_CAP, LOCK_CAP] = RETUNE.map(([, v]) => v);

// A stand-in @earendil-works/pi-coding-agent under the copy's own node_modules: its
// withFileMutationQueue refuses only a path holding "lock-case", so neither the real pi package
// nor the real file-mutation queue is ever touched (R-091/R-785 cover the real queue's refusal).
const stubRoot = path.join(copyRoot, "node_modules", "@earendil-works", "pi-coding-agent");
fs.mkdirSync(stubRoot, { recursive: true });
fs.writeFileSync(path.join(stubRoot, "package.json"), JSON.stringify({ name: "@earendil-works/pi-coding-agent", type: "module", exports: "./index.js" }));
fs.writeFileSync(path.join(stubRoot, "index.js"), [
	"export async function withFileMutationQueue(file, fn) {",
	"\tif (String(file).includes(\"lock-case\")) throw new Error(\"Q\".repeat(500));",
	"\treturn fn();",
	"}",
].join("\n"));

// The workspace and its four case files. Each checker whose output a check inspects byte for
// byte is written to its OWN script file and run as `node <JSON-quoted path>` — never
// interpolated into a `node -e` source, where a comma list, 50 distinct letters or an astral
// character would risk shell or source-string quoting rather than testing the extension.
const ws = tmpDir(path.join(os.tmpdir(), "postedit-named-ws-"));
const scriptPath = (name) => path.join(ws, name);

const EMOJI = String.fromCodePoint(0x1f600);
const OVERFLOW_OUTPUT = `${EMOJI},${Array.from({ length: 60 }, (_, i) => i).join(",")}`;
const overflowScript = scriptPath("overflow-case.cjs");
fs.writeFileSync(overflowScript, [
	"process.stdout.write(String.fromCodePoint(0x1f600) + \",\" + Array.from({ length: 60 }, (_, i) => i).join(\",\"));",
].join("\n"));

const FIFTY_LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX"; // 50 distinct letters
const failScript = scriptPath("fail-case.cjs");
fs.writeFileSync(failScript, [
	`process.stdout.write(${JSON.stringify(FIFTY_LETTERS)});`,
	"process.exitCode = 1;",
].join("\n"));

const timeoutCmd = 'node -e "setTimeout(()=>{},10000)"';
const overflowCmd = `node ${JSON.stringify(overflowScript)}`;
const failCmd = `node ${JSON.stringify(failScript)}`;
const lockCmd = 'node -e "process.exitCode=0"'; // never runs: the stand-in queue refuses first

const USER_CFG = path.join(NANA_HOME, ".pi", "agent", "nana-pack.json");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
fs.writeFileSync(USER_CFG, JSON.stringify({
	journal: { enabled: false },
	postEdit: {
		commands: [
			{ match: "timeout-case", run: timeoutCmd, timeoutMs: 300 },
			{ match: "overflow-case", run: overflowCmd },
			{ match: "fail-case", run: failCmd },
			{ match: "lock-case", run: lockCmd },
		],
	},
}));

for (const name of ["timeout-case.txt", "overflow-case.txt", "fail-case.txt", "lock-case.lock"]) {
	fs.writeFileSync(path.join(ws, name), "x\n");
}

let line1 = "", line2 = "", line3 = "", line4 = "";
let recordedDelays = [];
try {
	const ext = (await import(pathToFileURL(path.join(copyRoot, "extensions", "nana-post-edit.ts")).href)).default;
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	const ctx = { cwd: ws, hasUI: false, isProjectTrusted: () => true, signal: new AbortController().signal };
	const fire = async (name) => {
		const ret = await handlers.tool_result(
			{ toolName: "edit", isError: false, input: { path: path.join(ws, name) }, content: [{ type: "text", text: "edited" }] },
			ctx,
		);
		const text = ret?.content?.at(-1)?.text ?? "";
		return text.split("\n")[2] ?? ""; // line 3: the header, a blank line, then the one failure line
	};

	const realSetTimeout = globalThis.setTimeout;
	try {
		globalThis.setTimeout = (callback, delay, ...args) => { recordedDelays.push(delay); return realSetTimeout(callback, delay, ...args); };
		line1 = await fire("timeout-case.txt");
	} finally {
		globalThis.setTimeout = realSetTimeout;
	}

	line2 = await fire("overflow-case.txt");
	line3 = await fire("fail-case.txt");
	line4 = await fire("lock-case.lock");
} catch {
	// lines/recordedDelays stay at their initial values; each check below fails with a detail
}

// req: R-2210
check("a timed-out post-edit check arms its forced kill at the named kill grace, retuned in a copy", rewritten.POST_EDIT_KILL_GRACE_MS && JSON.stringify(recordedDelays) === JSON.stringify([300, GRACE]) && line1.includes("timed out"), JSON.stringify({ rewritten: rewritten.POST_EDIT_KILL_GRACE_MS, recordedDelays, line1 }));

const overflowCut = OVERFLOW_OUTPUT.slice(0, OUTPUT_CAP);
const overflowTail8 = overflowCut.slice(-8);
// req: R-2211
check("a post-edit check that prints past the named output cap could not run and keeps only that many first units, retuned in a copy", rewritten.POST_EDIT_OUTPUT_CAP && OVERFLOW_OUTPUT.length > OUTPUT_CAP && line2.includes(" could not run") && line2.endsWith(overflowTail8), JSON.stringify({ rewritten: rewritten.POST_EDIT_OUTPUT_CAP, line2, overflowTail8 }));

const failureTail = FIFTY_LETTERS.slice(-FAILURE_CAP);
// req: R-2212
check("a failing post-edit check shows the model the last units up to the named failure cap, retuned in a copy", rewritten.POST_EDIT_FAILURE_CAP && line3.endsWith(` (output truncated: last ${FAILURE_CAP} of ${FIFTY_LETTERS.length} chars shown): ${failureTail}`), JSON.stringify({ rewritten: rewritten.POST_EDIT_FAILURE_CAP, line3 }));

const cmdHead = failCmd.slice(0, COMMAND_CAP);
// req: R-2213
check("a failing post-edit check shows the model its command up to the named command cap, retuned in a copy", rewritten.POST_EDIT_COMMAND_CAP && line3.startsWith(`- check ${cmdHead} (command truncated: first ${COMMAND_CAP} of ${failCmd.length} chars shown) exited 1`), JSON.stringify({ rewritten: rewritten.POST_EDIT_COMMAND_CAP, line3 }));

const lockQs = "Q".repeat(LOCK_CAP);
// req: R-2214
check("a refused post-edit file lock shows the model the refusal up to the named lock message cap, retuned in a copy", rewritten.POST_EDIT_LOCK_MESSAGE_CAP && line4.includes(" did not run — could not lock ") && line4.endsWith(`for checking: ${lockQs}`), JSON.stringify({ rewritten: rewritten.POST_EDIT_LOCK_MESSAGE_CAP, line4 }));

const realCfg = await import(new URL("../lib/post-edit-config.mjs", import.meta.url).href).catch(() => ({}));
// req: R-2215
check("seal: the post-edit kill grace is 2000 ms, the output cap 1048576, the command cap 400 and the lock message cap 300", realCfg.POST_EDIT_KILL_GRACE_MS === 2000 && realCfg.POST_EDIT_OUTPUT_CAP === 1048576 && realCfg.POST_EDIT_COMMAND_CAP === 400 && realCfg.POST_EDIT_LOCK_MESSAGE_CAP === 300, JSON.stringify({ grace: realCfg.POST_EDIT_KILL_GRACE_MS, outputCap: realCfg.POST_EDIT_OUTPUT_CAP, commandCap: realCfg.POST_EDIT_COMMAND_CAP, lockCap: realCfg.POST_EDIT_LOCK_MESSAGE_CAP }));
