/**
 * @module packages/nana-pack/tests/post-edit-default-timeout.test.mjs
 * @purpose Pins that a post-edit command with no timeoutMs is armed at the pack's named default,
 *  POST_EDIT_DEFAULT_TIMEOUT_MS, read by name rather than an inline literal, and that the pack's
 *  post-edit configuration module seals that default at 30000 ms.
 * @inputs a copy of extensions/nana-post-edit.ts and the whole lib/ directory (its
 *  post-edit-config.mjs retuned to 4321 in the copy only), a user nana-pack.json under a temp
 *  HOME with one command that sets no timeoutMs, and the real lib/post-edit-config.mjs
 * @outputs PASS/FAIL lines per check on stdout, and exit code 1 when any check fails
 * @effects disk (temp HOME, a temp copy of extensions/lib, a workspace file), process (sets
 *  HOME/USERPROFILE, runs one `node -e` checker command)
 * @errors a failed check prints FAIL with the observed detail; an import or run failure is caught
 *  and reported as a failing check rather than propagating
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

// L1 fixture: isolate the user-scope config this run reads, the same way
// post-edit-status.test.mjs does (os.homedir() reads HOME on posix, USERPROFILE on win32).
const NANA_HOME = tmpDir(path.join(os.tmpdir(), "postedit-timeout-home-"));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
delete process.env.PI_CODING_AGENT_DIR;
const USER_CFG = path.join(NANA_HOME, ".pi", "agent", "nana-pack.json");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
fs.writeFileSync(USER_CFG, JSON.stringify({
	journal: { enabled: false },
	postEdit: { commands: [{ match: "\\.txt$", run: 'node -e "process.exit(0)"' }] },
}));

// A copy of the extension plus its whole lib/, so the one export this lane adds can be
// retuned in the copy without touching the real module — a check against the imported
// name would still pass if the literal were left in place (the defect this lane removes).
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const copyRoot = tmpDir(path.join(os.tmpdir(), "postedit-timeout-copy-"));
fs.mkdirSync(path.join(copyRoot, "extensions"), { recursive: true });
fs.cpSync(path.join(pkgRoot, "extensions", "nana-post-edit.ts"), path.join(copyRoot, "extensions", "nana-post-edit.ts"));
fs.cpSync(path.join(pkgRoot, "lib"), path.join(copyRoot, "lib"), { recursive: true });

const RETUNED_MS = 4321;
let retuned = false;
try {
	const configPath = path.join(copyRoot, "lib", "post-edit-config.mjs");
	const original = fs.readFileSync(configPath, "utf8");
	const rewritten = original.replace(
		/(export const POST_EDIT_DEFAULT_TIMEOUT_MS\s*=\s*)[^;]+;/,
		`$1${RETUNED_MS}; // chosen: retuned by this test's copy, only to differ from the sealed default`,
	);
	retuned = rewritten !== original;
	fs.writeFileSync(configPath, rewritten);
} catch {
	retuned = false;
}

let recorded = [];
let status = "";
try {
	const ext = (await import(pathToFileURL(path.join(copyRoot, "extensions", "nana-post-edit.ts")).href)).default;
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });

	const workspace = tmpDir(path.join(os.tmpdir(), "postedit-timeout-ws-"));
	const file = path.join(workspace, "case.txt");
	fs.writeFileSync(file, "x\n");
	const ctx = {
		cwd: workspace,
		hasUI: true,
		isProjectTrusted: () => true,
		signal: new AbortController().signal,
		ui: {
			setStatus: (_key, text) => { status = text; },
			notify: () => {},
			theme: { fg: (_color, text) => text },
		},
	};

	const realSetTimeout = globalThis.setTimeout;
	try {
		globalThis.setTimeout = (callback, delay, ...args) => {
			recorded.push(delay);
			return realSetTimeout(callback, delay, ...args);
		};
		await handlers.tool_result(
			{ toolName: "edit", isError: false, input: { path: file }, content: [{ type: "text", text: "edited" }] },
			ctx,
		);
	} finally {
		globalThis.setTimeout = realSetTimeout;
	}
} catch {
	// recorded/status stay at their initial values; the check below fails with a detail
}

// req: R-2150
check("a post-edit command with no timeoutMs arms its deadline at the pack's named default, retuned in a copy", retuned && recorded.length === 1 && recorded[0] === RETUNED_MS && status.includes("✓ 1 check"), JSON.stringify({ retuned, recorded, status }));

const cfg = await import(new URL("../lib/post-edit-config.mjs", import.meta.url).href).catch(() => ({}));
// req: R-2151
check("seal: POST_EDIT_DEFAULT_TIMEOUT_MS is 30000", cfg.POST_EDIT_DEFAULT_TIMEOUT_MS === 30_000, String(cfg.POST_EDIT_DEFAULT_TIMEOUT_MS));
