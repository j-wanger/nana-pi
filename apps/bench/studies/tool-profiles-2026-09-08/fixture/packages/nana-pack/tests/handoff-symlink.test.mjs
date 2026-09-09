import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// Security property: the handoff artifact is never read or written THROUGH a
// symlink. A repo can commit `.pi/handoff.md` as a link to e.g. ~/.ssh/id_rsa —
// pickup would paste the target into the next session's system prompt, and the
// next compaction would overwrite it. Same for the sibling `.pi/.gitignore`,
// which is read-then-written. Drives the REAL registered handlers.
// Run: node --experimental-strip-types <this file>
const ext = (await import(new URL("../extensions/nana-handoff.ts", import.meta.url).href)).default;

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

function workspace() {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-link-"));
	fs.mkdirSync(path.join(td, ".pi"));
	fs.writeFileSync(path.join(td, ".pi", "nana-pack.json"), JSON.stringify({ journal: { enabled: false } }));
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
	fs.symlinkSync(secret, path.join(td, ".pi", "handoff.md"));

	let threw = false;
	try { await handlers.session_start({ reason: "startup" }, ctx); } catch { threw = true; }
	check("a: symlinked handoff does not throw at session_start", !threw);
	const r = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
	check("a: nothing injected from a symlinked handoff", r === undefined);
	check("a: target contents never reach the system prompt", !(r?.systemPrompt ?? "").includes("SUPERSECRET"));
	fs.rmSync(td, { recursive: true, force: true });
}

// (b) WRITE: compaction must not overwrite a symlink target.
{
	const { td, handlers, ctx } = workspace();
	const target = path.join(td, "precious.txt");
	fs.writeFileSync(target, "ORIGINAL\n");
	const link = path.join(td, ".pi", "handoff.md");
	fs.symlinkSync(target, link);

	let threw = false;
	try { await handlers.session_compact({ compactionEntry: { summary: "state of play" }, reason: "manual" }, ctx); } catch { threw = true; }
	check("b: symlinked handoff does not throw at compaction", !threw);
	check("b: symlink target not overwritten", fs.readFileSync(target, "utf-8") === "ORIGINAL\n");
	check("b: the link itself is left alone (not replaced by a regular file)", fs.lstatSync(link).isSymbolicLink());
	fs.rmSync(td, { recursive: true, force: true });
}

// (c) the sibling .pi/.gitignore is read-then-written, so it is the same vector.
{
	const { td, handlers, ctx } = workspace();
	const target = path.join(td, "shell-rc");
	fs.writeFileSync(target, "export SECRET=1\n");
	fs.symlinkSync(target, path.join(td, ".pi", ".gitignore"));

	let threw = false;
	try { await handlers.session_compact({ compactionEntry: { summary: "state of play" }, reason: "manual" }, ctx); } catch { threw = true; }
	check("c: symlinked .gitignore does not throw at compaction", !threw);
	check("c: .gitignore symlink target not written through", fs.readFileSync(target, "utf-8") === "export SECRET=1\n");
	// the artifact itself is a regular file here, so continuity still works
	check("c: the handoff itself was still written", fs.readFileSync(path.join(td, ".pi", "handoff.md"), "utf-8").includes("state of play"));
	fs.rmSync(td, { recursive: true, force: true });
}

// (d)+(e) the LINK ONE LEVEL UP: `.pi` itself committed as a link to an external
// directory. Every component is a regular file, so a final-component-only check
// waves this through — read and write must both refuse.
{
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-dirlink-"));
	const ws = path.join(td, "ws");
	const outside = path.join(td, "outside");
	fs.mkdirSync(ws);
	fs.mkdirSync(outside);
	fs.writeFileSync(path.join(outside, "nana-pack.json"), JSON.stringify({ journal: { enabled: false } }));
	fs.writeFileSync(path.join(outside, "handoff.md"), "EXTERNAL SECRET\n");
	fs.symlinkSync(outside, path.join(ws, ".pi")); // the whole .pi directory is the link
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	const ctx = { cwd: ws, hasUI: false, isProjectTrusted: () => true };

	let threw = false;
	try { await handlers.session_start({ reason: "startup" }, ctx); } catch { threw = true; }
	check("d: symlinked .pi directory does not throw at session_start", !threw);
	const r = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
	check("d: nothing injected through a symlinked .pi directory", r === undefined);
	check("d: external contents never reach the system prompt", !(r?.systemPrompt ?? "").includes("EXTERNAL SECRET"));

	try { await handlers.session_compact({ compactionEntry: { summary: "state of play" }, reason: "manual" }, ctx); } catch { threw = true; }
	check("e: symlinked .pi directory does not throw at compaction", !threw);
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
	fs.mkdirSync(path.join(real, ".pi"), { recursive: true });
	fs.writeFileSync(path.join(real, ".pi", "nana-pack.json"), JSON.stringify({ journal: { enabled: false } }));
	fs.symlinkSync(real, link);
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	const ctx = { cwd: link, hasUI: false, isProjectTrusted: () => true };

	await handlers.session_compact({ compactionEntry: { summary: "under a symlinked root" }, reason: "manual" }, ctx);
	check("f: symlinked ANCESTOR does not block the write", fs.readFileSync(path.join(real, ".pi", "handoff.md"), "utf-8").includes("under a symlinked root"));
	check("f: .gitignore still maintained under a symlinked root", fs.readFileSync(path.join(real, ".pi", ".gitignore"), "utf-8").split("\n").includes("handoff.md"));
	await handlers.session_start({ reason: "startup" }, ctx);
	const r = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
	check("f: symlinked ANCESTOR does not block the pickup", (r?.systemPrompt ?? "").includes("under a symlinked root"));
	fs.rmSync(td, { recursive: true, force: true });
}

process.exit(fails);
