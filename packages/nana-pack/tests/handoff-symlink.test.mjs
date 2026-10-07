/**
 * @module packages/nana-pack/tests/handoff-symlink.test.mjs
 * @purpose Pins that a custom handoff.path is never read or written THROUGH a symlink the repository controls, so no link target reaches the system prompt or gets overwritten
 * @inputs extensions/nana-handoff.ts, a nana-pack.json naming a symlinked handoff path, and a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, symlinks and their targets), process (sets HOME and USERPROFILE)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// L1 fixture: a nana-only `.pi/` is never nana-trusted (pi auto-trusts it; that is not a
// decision), so this file's config lives at USER scope under an isolated HOME
// (os.homedir() reads HOME on posix, USERPROFILE on win32).
const NANA_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "nana-home-"));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
const USER_CFG = path.join(NANA_HOME, ".pi", "agent", "nana-pack.json");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
// Security property: a CUSTOM handoff.path is never read or written THROUGH a
// symlink the repo controls. If handoff.path points into the workspace, a repo can
// commit that file (or its directory) as a link to e.g. ~/.ssh/id_rsa — pickup would
// paste the target into the next session's system prompt, and the next compaction
// would overwrite it. Drives the REAL registered handlers.
// L3: the DEFAULT location is now the user-scope store, so the default-path forms of
// these cases are moot (a repo .pi/handoff.md is never read at all — see
// handoff-trust.test.mjs); each case below keeps its shape with handoff.path = a file
// under the workspace's `state/` dir. The sibling-.gitignore case (old c) is gone with
// .gitignore management itself.
// Run: node --experimental-strip-types <this file>
const ext = (await import(new URL("../extensions/nana-handoff.ts", import.meta.url).href)).default;

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

const useCustom = (file) => fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: false }, handoff: { path: file } }));
function workspace() {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-link-"));
	fs.mkdirSync(path.join(td, "state"));
	useCustom(path.join(td, "state", "handoff.md"));
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	return { td, handlers, ctx: { cwd: td, hasUI: false, isProjectTrusted: () => true } };
}

// (a) READ: a committed handoff.md symlink must not exfiltrate its target into
// the injected system prompt.
{
	const { td, handlers, ctx } = workspace();
	const secret = path.join(td, "id_rsa");
	fs.writeFileSync(secret, "-----BEGIN OPENSSH PRIVATE KEY-----\nSUPERSECRET\n");
	fs.symlinkSync(secret, path.join(td, "state", "handoff.md"));

	let threw = false;
	try { await handlers.session_start({ reason: "startup" }, ctx); } catch { threw = true; }
	// req: R-136
	check("a: symlinked handoff does not throw at session_start", !threw);
	const event = { systemPromptOptions: { sections: {} } }; await handlers.before_agent_start(event, ctx);
	const r = event.systemPromptOptions.sections["nana-handoff"];
	// req: R-134
	check("a: nothing injected from a symlinked handoff", r === undefined);
	check("a: target contents never reach the system prompt", !(r ?? "").includes("SUPERSECRET"));
	fs.rmSync(td, { recursive: true, force: true });
}

// (b) WRITE: compaction must not overwrite a symlink target.
{
	const { td, handlers, ctx } = workspace();
	const target = path.join(td, "precious.txt");
	fs.writeFileSync(target, "ORIGINAL\n");
	const link = path.join(td, "state", "handoff.md");
	fs.symlinkSync(target, link);

	let threw = false;
	try { await handlers.session_compact({ compactionEntry: { summary: "state of play" }, reason: "manual" }, ctx); } catch { threw = true; }
	// req: R-136
	check("b: symlinked handoff does not throw at compaction", !threw);
	// req: R-806
	check("b: symlink target not overwritten", fs.readFileSync(target, "utf-8") === "ORIGINAL\n");
	check("b: the link itself is left alone (not replaced by a regular file)", fs.lstatSync(link).isSymbolicLink());
	fs.rmSync(td, { recursive: true, force: true });
}

// (d)+(e) the LINK ONE LEVEL UP: `state` itself committed as a link to an external
// directory. Every component is a regular file, so a final-component-only check
// waves this through — read and write must both refuse.
{
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-dirlink-"));
	const ws = path.join(td, "ws");
	const outside = path.join(td, "outside");
	fs.mkdirSync(ws);
	fs.mkdirSync(outside);
	useCustom(path.join(ws, "state", "handoff.md"));
	fs.writeFileSync(path.join(outside, "handoff.md"), "EXTERNAL SECRET\n");
	fs.symlinkSync(outside, path.join(ws, "state")); // the whole state directory is the link
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	const ctx = { cwd: ws, hasUI: false, isProjectTrusted: () => true };

	let threw = false;
	try { await handlers.session_start({ reason: "startup" }, ctx); } catch { threw = true; }
	// req: R-136
	check("d: symlinked state directory does not throw at session_start", !threw);
	const event = { systemPromptOptions: { sections: {} } }; await handlers.before_agent_start(event, ctx);
	const r = event.systemPromptOptions.sections["nana-handoff"];
	check("d: nothing injected through a symlinked state directory", r === undefined);
	// req: R-806
	check("d: external contents never reach the system prompt", !(r ?? "").includes("EXTERNAL SECRET"));

	try { await handlers.session_compact({ compactionEntry: { summary: "state of play" }, reason: "manual" }, ctx); } catch { threw = true; }
	check("e: symlinked state directory does not throw at compaction", !threw);
	// req: R-806
	check("e: external handoff.md not overwritten", fs.readFileSync(path.join(outside, "handoff.md"), "utf-8") === "EXTERNAL SECRET\n");
	check("e: no .gitignore written into the external directory", !fs.existsSync(path.join(outside, ".gitignore")));
	fs.rmSync(td, { recursive: true, force: true });
}

// (f) NO MISFIRE: only components BELOW the workspace root are checked. A project
// legitimately living under a symlinked path (macOS /tmp → /private/tmp, or a
// symlinked checkout root) must keep working — read and write both.
{
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-linkroot-"));
	const real = path.join(td, "real");
	const link = path.join(td, "link"); // the workspace root itself is reached via a link
	fs.mkdirSync(path.join(real, "state"), { recursive: true });
	useCustom(path.join(link, "state", "handoff.md"));
	fs.symlinkSync(real, link);
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	const ctx = { cwd: link, hasUI: false, isProjectTrusted: () => true };

	await handlers.session_compact({ compactionEntry: { summary: "under a symlinked root" }, reason: "manual" }, ctx);
	// req: R-135
	check("f: symlinked ANCESTOR does not block the write", fs.readFileSync(path.join(real, "state", "handoff.md"), "utf-8").includes("under a symlinked root"));
	await handlers.session_start({ reason: "startup" }, ctx);
	const event = { systemPromptOptions: { sections: {} } }; await handlers.before_agent_start(event, ctx);
	const r = event.systemPromptOptions.sections["nana-handoff"];
	// req: R-135
	check("f: symlinked ANCESTOR does not block the pickup", (r ?? "").includes("under a symlinked root"));
	fs.rmSync(td, { recursive: true, force: true });
}

process.exit(fails);
