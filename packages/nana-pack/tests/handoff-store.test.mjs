import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// L3 invariants (b), (f), (g): the handoff lives in the USER-SCOPE store
// ~/.pi/agent/handoffs/<sha256(canonical cwd)>.md, written atomically; keys are per exact
// canonical directory (no cross-project pickup, nested dirs / worktrees never silently
// borrow an ancestor's); resume/fork/reload skip pickup. Temp HOME.
// Run: node --experimental-strip-types <this file>
const NANA_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "nana-home-"));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
delete process.env.NANA_HANDOFF;
const USER_CFG = path.join(NANA_HOME, ".pi", "agent", "nana-pack.json");
const JOURNAL = path.join(NANA_HOME, "journal.jsonl");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: true, path: JOURNAL } }));

const mod = await import(new URL("../extensions/nana-handoff.ts", import.meta.url).href);
let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
const journal = () => (fs.existsSync(JOURNAL) ? fs.readFileSync(JOURNAL, "utf-8") : "");
const STORE = path.join(NANA_HOME, ".pi", "agent", "handoffs");

function session(cwd, extra = {}) {
	const handlers = {};
	mod.default({ on: (name, fn) => { handlers[name] = fn; } });
	const ctx = { cwd, hasUI: false, isProjectTrusted: () => true, sessionManager: { getSessionFile: () => "/sessions/s1.jsonl" }, ...extra };
	return {
		compact: (summary) => handlers.session_compact({ compactionEntry: { summary }, reason: "manual" }, ctx),
		prompt: async (reason = "startup") => {
			await handlers.session_start({ reason }, ctx);
			return (await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx))?.systemPrompt ?? "BASE";
		},
	};
}
const mk = (p) => (fs.mkdirSync(p, { recursive: true }), p);
const base = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "handoff-store-")));

// (b) compaction writes the store, not <cwd>/.pi/handoff.md — and the path is printed
{
	const repo = mk(path.join(base, "repo"));
	mk(path.join(repo, ".pi"));
	const notes = [];
	const s = session(repo, { hasUI: true, ui: { notify: (m) => notes.push(m) } });
	await s.compact("REPO-STATE");
	const file = mod.storePathFor(repo);
	check("b: store file written under ~/.pi/agent/handoffs/<sha256>.md", path.dirname(file) === STORE && /^[0-9a-f]{64}\.md$/.test(path.basename(file)) && fs.readFileSync(file, "utf-8").includes("REPO-STATE"));
	check("b: the canonical cwd is recorded inside", fs.readFileSync(file, "utf-8").includes(`Cwd: ${repo}\n`));
	check("b: nothing written to <cwd>/.pi/handoff.md", !fs.existsSync(path.join(repo, ".pi", "handoff.md")));
	check("b: no .gitignore written into the repo", !fs.existsSync(path.join(repo, ".pi", ".gitignore")));
	check("b: the write notice prints the store path", notes.some((m) => m.includes(file)));
	console.log(`  store path: ${notes.find((m) => m.includes(file))}`);
	const sp = await s.prompt();
	check("b: fresh session picks it up", sp.includes("REPO-STATE"));
	check("b: the pickup notice prints the store path", notes.some((m) => m.startsWith("handoff picked up") && m.includes(file)));
	console.log(`  pickup: ${notes.find((m) => m.startsWith("handoff picked up"))}`);
	// (f) resume, fork, reload skip pickup
	for (const reason of ["resume", "fork", "reload"]) check(`f: ${reason} skips pickup`, !(await session(repo).prompt(reason)).includes("REPO-STATE"));
	check("f: /new picks up", (await session(repo).prompt("new")).includes("REPO-STATE"));
}

// darwin: /tmp/x and /private/tmp/x are one directory → one key
if (process.platform === "darwin") {
	const name = `nana-l3-${process.pid}-${Date.now()}`;
	const viaLink = path.join("/tmp", name);
	fs.mkdirSync(viaLink);
	await session(viaLink).compact("TMP-STATE");
	check("darwin: /tmp/x and /private/tmp/x → same key", mod.storePathFor(mod.canonicalCwd(viaLink)) === mod.storePathFor(mod.canonicalCwd(path.join("/private/tmp", name))));
	check("darwin: written via /tmp/x, picked up via /private/tmp/x", (await session(path.join("/private/tmp", name)).prompt()).includes("TMP-STATE"));
	fs.rmSync(viaLink, { recursive: true, force: true });
} else {
	console.log("SKIP darwin: /tmp → /private/tmp canonical-key case (not darwin)");
}

// two sibling repos → distinct keys, no cross-project pickup
{
	const a = mk(path.join(base, "sib-a"));
	const b = mk(path.join(base, "sib-b"));
	await session(a).compact("ALPHA-STATE");
	check("siblings: distinct keys", mod.storePathFor(a) !== mod.storePathFor(b));
	const sp = await session(b).prompt();
	check("siblings: B does not pick up A's handoff", !sp.includes("ALPHA-STATE"));
}

// (g) root has a handoff; a nested cwd names it, does not inject it
{
	const root = mk(path.join(base, "mono"));
	const nested = mk(path.join(root, "packages", "leaf"));
	await session(root).compact("ROOT-STATE");
	fs.rmSync(JOURNAL, { force: true });
	const sp = await session(nested).prompt();
	check("g: nested cwd does not inject the root's text", !sp.includes("ROOT-STATE"));
	check("g: nested cwd is told 'no handoff for this directory'", /no handoff for this directory/i.test(sp));
	check("g: …and given the ancestor's store path", sp.includes(mod.storePathFor(root)) && sp.includes(root));
	check("g: handoff_ancestor_named journaled", journal().includes('"handoff_ancestor_named"'));
	check("g: a directory with no handoff and no ancestor handoff gets nothing", (await session(mk(path.join(base, "lonely"))).prompt()) === "BASE");
}

// a worktree path → distinct key, no pickup of the main checkout's handoff
if (spawnSync("git", ["--version"]).status === 0) {
	const main = mk(path.join(base, "gitmain"));
	const git = (...a) => spawnSync("git", ["-C", main, ...a], { encoding: "utf-8" });
	git("init", "-q");
	git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "i");
	const wt = path.join(base, "gitmain-wt");
	const r = git("worktree", "add", "-q", wt);
	if (r.status === 0) {
		await session(main).compact("MAIN-CHECKOUT-STATE");
		check("worktree: distinct key", mod.storePathFor(mod.canonicalCwd(wt)) !== mod.storePathFor(main));
		check("worktree: does not pick up the main checkout's handoff", !(await session(wt).prompt()).includes("MAIN-CHECKOUT-STATE"));
	} else console.log(`SKIP worktree: git worktree add failed (${r.stderr.trim()})`);
} else console.log("SKIP worktree: git not available");

// adversarial: a store entry whose recorded Cwd is another directory (planted / colliding key) is not injected
{
	const victim = mk(path.join(base, "victim"));
	const file = mod.storePathFor(victim);
	fs.writeFileSync(file, `# Session handoff (nana)\n\nCwd: /somewhere/else\nWritten: ${new Date().toISOString()}\nWriter: x\n---\nPLANTED-STATE\n`);
	fs.rmSync(JOURNAL, { force: true });
	check("cwd mismatch: planted entry not injected", !(await session(victim).prompt()).includes("PLANTED-STATE"));
	check("cwd mismatch: handoff_cwd_mismatch journaled", journal().includes('"handoff_cwd_mismatch"'));
}

// (c) provenance unavailable: the write still happens, but journals the degradation explicitly
for (const [label, getSessionFile] of [["throws", () => { throw new Error("no session manager state"); }], ["returns undefined", () => undefined]]) {
	const proj = mk(path.join(base, `noprov-${label.replace(/\s/g, "-")}`));
	fs.rmSync(JOURNAL, { force: true });
	await session(proj, { sessionManager: { getSessionFile } }).compact("NOPROV-STATE");
	const text = fs.readFileSync(mod.storePathFor(proj), "utf-8");
	check(`provenance ${label}: write not declined, Writer: unknown`, text.includes("NOPROV-STATE") && /^Writer: unknown$/m.test(text));
	check(`provenance ${label}: handoff_written AND handoff_provenance_unavailable journaled`, journal().includes('"handoff_written"') && journal().includes('"handoff_provenance_unavailable"'));
}
{
	const proj = mk(path.join(base, "prov-ok"));
	fs.rmSync(JOURNAL, { force: true });
	await session(proj).compact("PROV-STATE");
	check("provenance available: no degradation journaled", journal().includes('"handoff_written"') && !journal().includes('"handoff_provenance_unavailable"'));
}

// corrupt UTF-8: inject nothing, journal handoff_pickup_failed (never U+FFFD text as a normal pickup)
{
	const proj = mk(path.join(base, "badutf8"));
	const file = mod.storePathFor(proj);
	fs.writeFileSync(file, Buffer.concat([Buffer.from(`# x\n\nCwd: ${proj}\nWritten: ${new Date().toISOString()}\nWriter: w\n---\nCORRUPT-STATE `), Buffer.from([0xff, 0xfe, 0xc3]), Buffer.from("\n")]));
	fs.rmSync(JOURNAL, { force: true });
	const sp = await session(proj).prompt();
	check("bad utf-8: nothing injected", sp === "BASE");
	check("bad utf-8: handoff_pickup_failed journaled with the reason", /"handoff_pickup_failed".*ERR_ENCODING_INVALID_ENCODED_DATA/.test(journal()));
	check("bad utf-8: not journaled as a pickup", !journal().includes('"handoff_pickup"'));
	check("bad utf-8 (L5 seam): an unreadable entry is NOT journaled as missing", !journal().includes('"handoff_missing"'));
}

// L5 seam: no store entry at all is journaled as handoff_missing, distinct from a failed read
{
	const proj = mk(path.join(base, "never-compacted"));
	fs.rmSync(JOURNAL, { force: true });
	check("missing: nothing injected", (await session(proj).prompt()) === "BASE");
	check("missing: handoff_missing journaled with the store path", journal().includes('"handoff_missing"') && journal().includes(mod.storePathFor(proj)));
	check("missing: not journaled as a failed pickup", !journal().includes('"handoff_pickup_failed"'));
}

// a failed write leaves the prior file byte-identical with no temp litter (POSIX read-only store)
if (process.platform === "win32") console.log("SKIP failed write: POSIX read-only-dir semantics (win32)");
else if (process.getuid?.() === 0) console.log("SKIP failed write: running as root ignores the read-only dir");
else {
	const proj = mk(path.join(base, "ro"));
	await session(proj).compact("PRIOR-STATE");
	const file = mod.storePathFor(proj);
	const before = fs.readFileSync(file);
	fs.rmSync(JOURNAL, { force: true });
	fs.chmodSync(STORE, 0o555);
	let threw = false;
	try { await session(proj).compact("NEW-STATE"); } catch { threw = true; } finally { fs.chmodSync(STORE, 0o755); }
	check("failed write: no throw", !threw);
	check("failed write: prior file byte-identical", Buffer.compare(before, fs.readFileSync(file)) === 0);
	check("failed write: no temp litter", fs.readdirSync(STORE).every((f) => !f.endsWith(".tmp")));
	check("failed write: handoff_write_failed journaled", journal().includes('"handoff_write_failed"'));
}

// concurrent compactions from two sessions in one cwd: one whole file wins, no temp litter
{
	const proj = mk(path.join(base, "concurrent"));
	await Promise.all(Array.from({ length: 8 }, (_, i) => session(proj).compact(`CONCURRENT-${i}-${"x".repeat(20000)}`)));
	const text = fs.readFileSync(mod.storePathFor(proj), "utf-8");
	check("concurrent: exactly one summary, whole", (text.match(/CONCURRENT-\d/g) ?? []).length === 1 && text.trimEnd().endsWith("x".repeat(20000)));
	check("concurrent: no temp litter", fs.readdirSync(STORE).every((f) => !f.endsWith(".tmp")));
}

fs.rmSync(base, { recursive: true, force: true });
process.exit(fails);
