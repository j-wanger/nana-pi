// L1 (2026-09-28, sol r2 HIGH): tool writes to the gate's own policy files and to pi's trust
// store are gated, because both are trust EVIDENCE for project-scope config — an agent that can
// plant `~/.pi/agent/trust.json` for its cwd makes a repo-supplied `.pi/nana-pack.json` honored
// on the next process, widening the gate. Path forms only here; L2 owns the bash/PowerShell
// redirection forms (`echo … > …`, `sed -i`, `Set-Content`) and segment-scoped exceptions.
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const NANA_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "nana-home-"));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
const ext = (await import(new URL("../extensions/nana-gate.ts", import.meta.url).href)).default;
let handler;
ext({ on: (ev, fn) => { if (ev === "tool_call") handler = fn; } });
const ctx = { cwd: "/tmp/proj", hasUI: false, isProjectTrusted: () => false };

let fails = 0;
const check = (name, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", name, extra); if (!ok) fails++; };
const decide = async (toolName, p) => (await handler({ toolName, input: { path: p } }, ctx))?.block ? "BLOCK" : "ALLOW";

// Traversal and normalization forms: the gate must check the RESOLVED path, because
// every one of these opens a policy file (sol L1 r3 found them ALLOW on raw-string regexes).
const TRAVERSAL = [
	`${NANA_HOME}/.pi/agent/../agent/trust.json`,
	"~/.pi/agent/../agent/trust.json",
	"/tmp/proj/.pi/x/../nana-pack.json",
	".pi/../.pi/nana-pack.json",
	"@.pi/../.pi/nana-pack.json",
	`file://${NANA_HOME}/.pi/agent/trust.json`,
	"./.pi/./nana-pack.json",
	"../proj/.pi/nana-pack.json",
];

const BLOCK = [
	`${NANA_HOME}/.pi/agent/trust.json`, "~/.pi/agent/trust.json", ".pi/agent/trust.json",
	`${NANA_HOME}/.pi/agent/nana-pack.json`, "~/.pi/agent/nana-pack.json",
	".pi/nana-pack.json", "/tmp/proj/.pi/nana-pack.json", "@.pi/nana-pack.json",
	"C:\\Users\\x\\.pi\\agent\\trust.json", ".PI\\NANA-PACK.JSON",
];
const ALLOW = ["src/nana-pack-notes.md", "docs/trust.md", ".pi/handoff.md", "/tmp/proj/README.md", "nana-pack.json.example"];
for (const p of BLOCK) for (const t of ["write", "edit"]) check(`${t} ${p} is gated`, (await decide(t, p)) === "BLOCK");
for (const p of TRAVERSAL) for (const t of ["write", "edit"]) check(`${t} ${p} is gated after resolution`, (await decide(t, p)) === "BLOCK");
for (const p of ALLOW) for (const t of ["write", "edit"]) check(`${t} ${p} is not gated`, (await decide(t, p)) === "ALLOW");
// A path that only LOOKS like a policy file after resolution must still be allowed.
for (const p of ["/tmp/proj/notes/.pi-nana-pack.json", "/tmp/proj/.pineapple/nana-pack.json.md"])
	check(`write ${p} is not gated`, (await decide("write", p)) === "ALLOW");

// Composed regression (documented residual, equal to pi's own trust model): a trust.json planted
// by a NON-tool write (e.g. `python -c`, outside the gate's sight) would still be honored as trust
// evidence — that is pi's own rule too (a planted trust.json also loads project extensions).
// The gate can only refuse the writes it sees; we pin that it does. Bash redirection into
// trust.json is L2's item — deliberately not asserted here.

fs.rmSync(NANA_HOME, { recursive: true, force: true });
console.log(fails ? `FAILED ${fails}` : "all PASS");
process.exit(fails ? 1 : 0);
