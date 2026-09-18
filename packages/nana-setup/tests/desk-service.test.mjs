// Gate: the desk launchd service is opt-in, rendered from the template with REAL resolved
// values, and never loaded from a test. launchctl is only ever called when the install targets
// the real home — every run here uses --home, so the service is written and not bootstrapped.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const repo = path.resolve(pkg, "..", "..");
const { renderPlist } = await import(new URL("../lib/steps.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

/* --- the template renders, and escapes ------------------------------------------------- */
{
	const out = renderPlist({ LABEL: "com.nana.pi-desk", NODE: "/n/node", SERVER: "/r/server.mjs", WORKDIR: "/r", PATH: "/a&b:/c<d>", LOG: "/l/desk.log" });
	check("template: no placeholders left", !/\{\{\w+\}\}/.test(out));
	check("template: keeps the launchd label", out.includes("<key>Label</key><string>com.nana.pi-desk</string>"));
	check("template: program arguments are node + server", out.includes("<string>/n/node</string>") && out.includes("<string>/r/server.mjs</string>"));
	check("template: PATH is XML-escaped", out.includes("/a&amp;b:/c&lt;d&gt;"));
	check("template: RunAtLoad and KeepAlive survive", out.includes("<key>RunAtLoad</key><true/>") && out.includes("<key>KeepAlive</key><true/>"));
	let threw = false;
	try {
		renderPlist({ LABEL: "x" });
	} catch {
		threw = true;
	}
	check("template: a missing value is an error, not an empty string", threw);
}

if (process.platform !== "darwin") {
	console.log("SKIP not darwin — the install half of this test is macOS-only");
	process.exit(fails);
}

const tmps = [];
function freshHome() {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "nana-setup-desk-"));
	tmps.push(td);
	fs.mkdirSync(path.join(td, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(td, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	return td;
}
const run = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });

/* --- opt-in ---------------------------------------------------------------------------- */
const home = freshHome();
const plist = path.join(home, "Library", "LaunchAgents", "com.nana.pi-desk.plist");
run(["install", "--home", home]);
check("no --desk: no plist is written", !fs.existsSync(plist));

const r = run(["install", "--home", home, "--desk"]);
check("--desk exits 0", r.status === 0, r.stderr);
check("--desk writes the plist", fs.existsSync(plist));
const body = fs.readFileSync(plist, "utf8");
check("plist uses the resolved node", body.includes(`<string>${process.execPath}</string>`));
check("plist points at this install's desk server", body.includes(path.join(repo, "apps", "desk", "server.mjs")));
check("plist WorkingDirectory is the install root", body.includes(`<key>WorkingDirectory</key><string>${repo}</string>`));
check("plist logs into the pi home", body.includes(path.join(home, ".pi", "agent", "desk.log")));
check("plist carries a PATH", /<key>PATH<\/key><string>[^<]+<\/string>/.test(body));
check("launchctl is NOT called under --home", r.stdout.includes("not loaded (--home override in play)"));

const again = run(["install", "--home", home, "--desk"]);
check("--desk is idempotent", again.stdout.includes("nothing to do"));
check("doctor sees the service", run(["doctor", "--home", home]).stdout.includes(plist));
check("doctor still exits 0", run(["doctor", "--home", home]).status === 0);

for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
process.exit(fails);
