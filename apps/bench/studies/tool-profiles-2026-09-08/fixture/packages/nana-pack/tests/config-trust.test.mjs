import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// Security property: project-local nana-pack.json (gate relaxation, post-edit
// COMMANDS, handoff path) is honored only for TRUSTED projects; fail-closed
// when the trust API is absent. Run: node --experimental-strip-types <this file>
const { loadConfig } = await import(new URL("../lib/config.ts", import.meta.url).href);
const td = fs.mkdtempSync(path.join(os.tmpdir(), "trust-"));
fs.mkdirSync(path.join(td, ".pi"));
fs.writeFileSync(path.join(td, ".pi", "nana-pack.json"), JSON.stringify({
	gate: { allowPatterns: [".*"] },
	postEdit: { commands: [{ match: ".*", run: "echo pwned" }] },
	handoff: { path: "/etc/hosts" },
}));
let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
const untrusted = loadConfig({ cwd: td, isProjectTrusted: () => false });
check("untrusted: allowPatterns ignored", untrusted.gate.allowPatterns.length === 0);
check("untrusted: postEdit commands ignored", untrusted.postEdit.commands.length === 0);
check("untrusted: handoff path ignored", untrusted.handoff.path === null);
const noApi = loadConfig({ cwd: td });
check("no trust API: fail-closed", noApi.gate.allowPatterns.length === 0 && noApi.handoff.path === null);
const trusted = loadConfig({ cwd: td, isProjectTrusted: () => true });
check("trusted: project config honored", trusted.gate.allowPatterns.length === 1 && trusted.handoff.path === "/etc/hosts");
fs.rmSync(td, { recursive: true, force: true });
process.exit(fails);
