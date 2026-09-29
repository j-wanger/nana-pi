import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
// L5 reader: bin/nana-adoption.mjs (and its hook) prints `[nana:adoption]` newest-first, at most 5
// plus a count, re-checks each root at print time, and prints NOTHING when there is nothing to say.
// Run: node <this file>
const here = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.join(here, "..", "bin", "nana-adoption.mjs");
const HOOK = path.join(here, "..", "..", "nana-setup", "claude", "hooks", "nana-adoption.sh");
const base = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "adoption-reader-")));
const HOME = path.join(base, "home");
const AGENT = path.join(HOME, ".pi", "agent");
fs.mkdirSync(AGENT, { recursive: true });
const JOURNAL = path.join(AGENT, "nana-journal.jsonl");
const env = { ...process.env, HOME, USERPROFILE: HOME, PI_CODING_AGENT_DIR: "" };
delete env.PI_CODING_AGENT_DIR;
let fails = 0;
const check = (n, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : why); if (!ok) fails++; };
const run = (cmd = process.execPath, args = [BIN, "--cwd", base], e = env) => spawnSync(cmd, args, { env: e, encoding: "utf8" });
const H = 3_600_000;
const line = (root, hoursAgo) => `${JSON.stringify({ ts: new Date(Date.now() - hoursAgo * H).toISOString(), event: "directory_unadopted", cwd: root, has: {} })}\n`;
const repo = (name) => {
	const r = path.join(base, name);
	fs.mkdirSync(path.join(r, ".git"), { recursive: true });
	return r;
};

// nothing to say: absent journal, empty journal, only other events
{
	for (const [label, content] of [["absent journal", null], ["empty journal", ""], ["other events only", '{"event":"handoff_missing"}\n']]) {
		if (content === null) fs.rmSync(JOURNAL, { force: true });
		else fs.writeFileSync(JOURNAL, content);
		const r = run();
		check(`c: ${label} → empty stdout, exit 0`, r.status === 0 && r.stdout === "", JSON.stringify(r));
	}
	const h = run("bash", [HOOK]);
	check("c: the hook prints nothing when there is nothing", h.status === 0 && h.stdout === "", JSON.stringify(h));
}

// seeded: 7 open roots (newest first, cap 5 + count), one adopted after its line, one dismissed,
// one gone, one older than 7 days, one duplicate
const roots = Array.from({ length: 7 }, (_, i) => repo(`r${i}`));
fs.writeFileSync(path.join(roots[0], "AGENTS.md"), "x");
fs.mkdirSync(path.join(roots[0], "docs", "sessions"), { recursive: true });
const adopted = repo("adopted-later");
const dismissed = repo("dismissed");
const old = repo("old");
let seed = "";
seed += line(old, 8 * 24);
roots.forEach((r, i) => (seed += line(r, 10 * (i + 1)))); // r0 newest
seed += line(roots[3], 70); // an older duplicate of r3 — r3 stays at its newest position
seed += line(adopted, 1);
seed += line(dismissed, 2);
seed += line(path.join(base, "gone"), 3);
seed += "{not json\n";
fs.writeFileSync(JOURNAL, seed);
fs.writeFileSync(path.join(adopted, "OBJECTIVE.md"), "x"); // adopted AFTER the line was written
fs.writeFileSync(path.join(dismissed, ".nana-not-a-project"), "x");
{
	const r = run();
	console.log(r.stdout.replace(/^/gm, "  | "));
	const listed = r.stdout.split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2).split(" — ")[0]);
	check("c: tagged [nana:adoption], exit 0", r.status === 0 && r.stdout.startsWith("[nana:adoption]\n"));
	check("c: newest first, capped at 5", JSON.stringify(listed) === JSON.stringify(roots.slice(0, 5)), JSON.stringify(listed));
	check("c: …and 2 more", r.stdout.includes("…and 2 more\n"));
	check("c: a root adopted after the line is dropped", !r.stdout.includes(adopted));
	check("c: a dismissed root is dropped", !r.stdout.includes(dismissed));
	check("c: a gone root is dropped", !r.stdout.includes(path.join(base, "gone")));
	check("c: a line older than 7 days is dropped", !r.stdout.includes(old));
	check("c: names what each root has", r.stdout.includes(`- ${roots[0]} — has: AGENTS.md, docs/sessions/`) && r.stdout.includes(`- ${roots[1]} — has: nothing`));
	check("c: ends with the action sentence", r.stdout.trimEnd().endsWith("or dismiss it once with `nana-setup project <dir> --not-a-project`."));
	const h = run("bash", [HOOK]);
	check("c: the hook prints the same block", h.status === 0 && h.stdout === r.stdout, JSON.stringify(h.stderr));
}
// adopting via a store entry drops it too; a symlinked spelling is one entry
{
	const s = repo("stored");
	const link = path.join(base, "stored-link");
	fs.symlinkSync(s, link);
	fs.writeFileSync(JOURNAL, line(s, 1) + line(link, 2));
	const r1 = run();
	check("c: a symlinked spelling of a root is one entry", r1.stdout.split("\n").filter((l) => l.startsWith("- ")).length === 1 && r1.stdout.includes(`- ${s} —`), r1.stdout);
	const { storeEntryFor } = await import(new URL("../lib/adoption.mjs", import.meta.url).href);
	process.env.HOME = HOME; // storeEntryFor reads os.homedir()
	const entry = storeEntryFor(s);
	fs.mkdirSync(path.dirname(entry), { recursive: true });
	fs.writeFileSync(entry, "x");
	check("c: a root with a store entry now → nothing", run().stdout === "");
}
// a configured user-scope journal.path is where it reads
{
	const j2 = path.join(base, "custom-journal.jsonl");
	fs.writeFileSync(path.join(AGENT, "nana-pack.json"), JSON.stringify({ journal: { path: j2 } }));
	fs.writeFileSync(j2, line(roots[6], 1));
	const r = run();
	check("c: reads the configured journal.path", r.stdout.includes(`- ${roots[6]} —`), r.stdout);
	fs.rmSync(path.join(AGENT, "nana-pack.json"));
}
// failure: a named one-line marker, exit 0, no stack
{
	const bare = "/usr/bin:/bin";
	if (spawnSync("/bin/sh", ["-c", "command -v node"], { env: { PATH: bare } }).status === 0) console.log(`SKIP fail: node is on ${bare}`);
	else {
	const r = run("/bin/bash", [HOOK], { ...env, PATH: bare });
	check("fail: no node → named marker, exit 0", r.status === 0 && r.stdout === "[nana:adoption]\nADOPTION UNAVAILABLE: node not found on PATH.\n", JSON.stringify(r));
	}
	fs.writeFileSync(path.join(AGENT, "nana-pack.json"), JSON.stringify({ journal: { path: base } })); // a directory
	const d = run();
	fs.writeFileSync(path.join(AGENT, "nana-pack.json"), "{ not json");
	fs.writeFileSync(JOURNAL, line(roots[6], 1));
	const m = run();
	fs.rmSync(path.join(AGENT, "nana-pack.json"));
	check("fail: journal.path is a directory → nothing, exit 0", d.status === 0 && d.stdout === "" && d.stderr === "", JSON.stringify(d));
	check("fail: malformed nana-pack.json → the default journal, exit 0", m.status === 0 && m.stdout.includes(`- ${roots[6]} —`), JSON.stringify(m));
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
