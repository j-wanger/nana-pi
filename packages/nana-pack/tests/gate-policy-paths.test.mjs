/**
 * @module packages/nana-pack/tests/gate-policy-paths.test.mjs
 * @purpose Pins that tool writes to the gate's own policy files and to pi's trust store are gated in every path form, because both are trust evidence for project-scope config
 * @inputs extensions/nana-gate.ts and a temp HOME standing in for the default agent dir
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (a temp HOME), process (sets HOME and USERPROFILE)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// L1 (2026-09-28, sol r2 HIGH): tool writes to the gate's own policy files and to pi's trust
// store are gated, because both are trust EVIDENCE for project-scope config — an agent that can
// plant `~/.pi/agent/trust.json` for its cwd makes a repo-supplied `.pi/nana-pack.json` honored
// on the next process, widening the gate. Path forms only here; L2 owns the bash/PowerShell
// redirection forms (`echo … > …`, `sed -i`, `Set-Content`) and segment-scoped exceptions.
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";

const NANA_HOME = tmpDir(path.join(os.tmpdir(), "nana-home-"));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
const gatePaths = await import(new URL("../lib/gate-paths.ts", import.meta.url).href);
const ext = (await import(new URL("../extensions/nana-gate.ts", import.meta.url).href)).default;
let handler;
ext({ on: (ev, fn) => { if (ev === "tool_call") handler = fn; } });
const ctx = { cwd: "/tmp/proj", hasUI: false, isProjectTrusted: () => false };

let fails = 0;
const check = (name, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", name, extra); if (!ok) fails++; };
const decide = async (toolName, p) => (await handler({ toolName, input: { path: p } }, ctx))?.block ? "BLOCK" : "ALLOW";
const decideCommand = async (command) => (await handler({ toolName: "bash", input: { command } }, ctx))?.block ? "BLOCK" : "ALLOW";
const decideAt = async (toolName, input, cwd) => (await handler({ toolName, input }, { ...ctx, cwd }))?.block ? "BLOCK" : "ALLOW";

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
	`${NANA_HOME}/.pi/agent/auth.json`, `${NANA_HOME}/.pi/agent/settings.json`, `${NANA_HOME}/.pi/agent/mcp.json`,
	`${NANA_HOME}/.pi/agent/extensions/subagent/config.json`,
	".pi/settings.json", ".pi/mcp.json", ".pi/extensions/evil.ts",
	`${NANA_HOME}/.pi/agent/trust.json`, "~/.pi/agent/trust.json", ".pi/agent/trust.json",
	`${NANA_HOME}/.pi/agent/nana-pack.json`, "~/.pi/agent/nana-pack.json",
	".pi/nana-pack.json", "/tmp/proj/.pi/nana-pack.json", "@.pi/nana-pack.json",
	"C:\\Users\\x\\.pi\\agent\\trust.json", ".PI\\NANA-PACK.JSON",
];
const ALLOW = ["src/nana-pack-notes.md", "docs/trust.md", ".pi/handoff.md", "/tmp/proj/README.md", "nana-pack.json.example", "packages/nana-pack/extensions/nana-gate.ts", "apps/bench/.ext/pi-web-access/x.ts", "templates/python/template/.pi/nana-pack.json.jinja", "templates/typescript/template/.pi/nana-pack.json.jinja", "/tmp/proj/project.foo.pi/extensions/x.ts", "/tmp/proj/project.foo.pi/settings.json"];
// req: R-035 R-038 R-051
for (const p of BLOCK) for (const t of ["write", "edit"]) check(`${t} ${p} is gated`, (await decide(t, p)) === "BLOCK");
// req: R-051
for (const p of TRAVERSAL) for (const t of ["write", "edit"]) check(`${t} ${p} is gated after resolution`, (await decide(t, p)) === "BLOCK");
for (const p of ALLOW) for (const t of ["write", "edit"]) check(`${t} ${p} is not gated`, (await decide(t, p)) === "ALLOW");
// req: R-631 R-058
check("active and default pi code-loading resources are policy floor", BLOCK.includes(`${NANA_HOME}/.pi/agent/extensions/subagent/config.json`) && BLOCK.includes(".pi/extensions/evil.ts") && (await decide("write", `${NANA_HOME}/.pi/agent/extensions/subagent/config.json`)) === "BLOCK" && (await decide("edit", ".pi/extensions/evil.ts")) === "BLOCK");
// req: R-639
// req: R-639
check("extension walk cap is sealed at 2048 entries", gatePaths.EXTENSION_WALK_ENTRY_CAP === 2048);
// req: R-631
check("project policy matches require a real .pi path segment", (await decide("edit", "/tmp/proj/project.foo.pi/extensions/x.ts")) === "ALLOW" && (await decide("edit", "/tmp/proj/project.foo.pi/settings.json")) === "ALLOW");
{
	const sessionDir = fs.mkdtempSync(path.join(os.tmpdir(), "nana-session-"));
	const externalDir = fs.mkdtempSync(path.join(os.tmpdir(), "nana-external-extension-"));
	const target = path.join(externalDir, "target.ts");
	fs.mkdirSync(path.join(sessionDir, ".pi"), { recursive: true });
	fs.mkdirSync(path.join(sessionDir, ".pi", "extensions"), { recursive: true });
	fs.writeFileSync(target, "export {};");
	fs.rmSync(path.join(sessionDir, ".pi", "extensions"), { recursive: true });
	fs.symlinkSync(externalDir, path.join(sessionDir, ".pi", "extensions"), "dir");
	// req: R-631
	check("project extension symlink target blocks edit, write, and shell with a distinct session cwd", (await decideAt("edit", { path: target }, sessionDir)) === "BLOCK" && (await decideAt("write", { path: target }, sessionDir)) === "BLOCK" && (await decideAt("bash", { command: `printf x > ${target}` }, sessionDir)) === "BLOCK");
	fs.rmSync(sessionDir, { recursive: true, force: true });
	fs.rmSync(externalDir, { recursive: true, force: true });
}
{
	const agentExtensions = path.join(NANA_HOME, ".pi", "agent", "extensions");
	const targetDir = path.join(NANA_HOME, "external-extension-target");
	const sibling = path.join(NANA_HOME, "external-sibling", "free.ts");
	fs.mkdirSync(agentExtensions, { recursive: true });
	fs.mkdirSync(targetDir, { recursive: true });
	fs.mkdirSync(path.dirname(sibling), { recursive: true });
	fs.writeFileSync(path.join(targetDir, "loaded.ts"), "export {};");
	fs.writeFileSync(sibling, "export {};");
	fs.symlinkSync(targetDir, path.join(agentExtensions, "linked"), "dir");
	const target = path.join(targetDir, "loaded.ts");
	// req: R-631
	check("symlinked extension targets are floored without flooring unrelated siblings", (await decide("edit", target)) === "BLOCK" && (await decide("write", target)) === "BLOCK" && (await decideCommand(`printf x > ${target}`)) === "BLOCK" && (await decide("edit", sibling)) === "ALLOW");
	fs.symlinkSync(path.join(targetDir, "loop"), path.join(agentExtensions, "loop"), "dir");
	// req: R-631
	check("symlink loop terminates while resolving extension targets", (await decide("edit", target)) === "BLOCK");
}
// req: R-630
check("template source edit/write is allowed but a symlink to policy is blocked", (await decide("edit", "templates/python/template/.pi/nana-pack.json.jinja")) === "ALLOW" && (await decide("write", "templates/python/template/.pi/nana-pack.json.jinja")) === "ALLOW" && (await decide("read", "templates/python/template/.pi/nana-pack.json.jinja")) === "ALLOW" && (await decide("edit", "packages/nana-pack/extensions/nana-gate.ts")) === "ALLOW");
{
	const project = fs.mkdtempSync(path.join(os.tmpdir(), "nana-template-policy-link-"));
	const sourceDir = path.join(project, "templates", "python", "template", ".pi");
	fs.mkdirSync(path.join(project, ".pi"), { recursive: true });
	fs.mkdirSync(sourceDir, { recursive: true });
	fs.writeFileSync(path.join(project, ".pi", "nana-pack.json"), "{}");
	fs.symlinkSync(path.join(project, ".pi", "nana-pack.json"), path.join(sourceDir, "nana-pack.json.jinja"));
	// req: R-630
	check("template-shaped symlink to policy blocks through edit path resolution", (await decideAt("edit", { path: "templates/python/template/.pi/nana-pack.json.jinja" }, project)) === "BLOCK");
	// req: R-630
	check("template-shaped cwd does not suppress policy protection", (await decideAt("bash", { command: "cat .pi/nana-pack.json" }, path.join(project, "templates", "python", "template"))) === "BLOCK");
	// req: R-630
	check("bash source alias resolving to policy stays blocked", (await decideAt("bash", { command: "cat templates/python/template/.pi/nana-pack.json.jinja" }, project)) === "BLOCK");
	fs.rmSync(project, { recursive: true, force: true });
}
{
	const active = path.join(NANA_HOME, "active-agent");
	const activeExtensions = path.join(active, "extensions");
	const defaultExtensions = path.join(NANA_HOME, ".pi", "agent", "extensions");
	const project = fs.mkdtempSync(path.join(os.tmpdir(), "nana-basename-project-"));
	const projectExtensions = path.join(project, ".pi", "extensions");
	const linkedTarget = fs.mkdtempSync(path.join(os.tmpdir(), "nana-basename-linked-"));
	fs.mkdirSync(activeExtensions, { recursive: true });
	fs.mkdirSync(defaultExtensions, { recursive: true });
	fs.mkdirSync(projectExtensions, { recursive: true });
	fs.writeFileSync(path.join(linkedTarget, "loaded.ts"), "export {};");
	fs.symlinkSync(linkedTarget, path.join(activeExtensions, "linked"), "dir");
	process.env.PI_CODING_AGENT_DIR = active;
	// req: R-631
	check("basename shell writes block inside active, default, project, and discovered symlink extension dirs but allow ordinary cwd", (await decideAt("bash", { command: "printf x > target.ts" }, activeExtensions)) === "BLOCK" && (await decideAt("bash", { command: "printf x > target.ts" }, defaultExtensions)) === "BLOCK" && (await decideAt("bash", { command: "printf x > target.ts" }, projectExtensions)) === "BLOCK" && (await decideAt("bash", { command: "printf x > target.ts" }, linkedTarget)) === "BLOCK" && (await decideAt("bash", { command: "printf x > target.ts" }, project)) === "ALLOW");
	delete process.env.PI_CODING_AGENT_DIR;
	fs.rmSync(project, { recursive: true, force: true });
	fs.rmSync(linkedTarget, { recursive: true, force: true });
}
// req: R-638
check("prompt-only pi resources remain editable", (await decide("edit", ".pi/SYSTEM.md")) === "ALLOW" && (await decide("edit", ".pi/APPEND_SYSTEM.md")) === "ALLOW" && (await decide("edit", ".pi/skills/example/SKILL.md")) === "ALLOW" && (await decide("edit", ".pi/prompts/example.md")) === "ALLOW");
const RELOCATED = path.join(NANA_HOME, "relocated-agent");
process.env.PI_CODING_AGENT_DIR = RELOCATED;
// req: R-631 R-058
check("relocated agent resources and default-dir resources remain on the floor", (await decide("write", path.join(RELOCATED, "extensions", "subagent", "config.json"))) === "BLOCK" && (await decide("write", path.join(RELOCATED, "auth.json"))) === "BLOCK" && (await decide("write", path.join(RELOCATED, "settings.json"))) === "BLOCK" && (await decide("write", path.join(RELOCATED, "mcp.json"))) === "BLOCK" && (await decide("write", path.join(NANA_HOME, ".pi", "agent", "auth.json"))) === "BLOCK");
const externalRoot = path.join(NANA_HOME, "external-extension-root");
fs.mkdirSync(externalRoot, { recursive: true });
fs.writeFileSync(path.join(externalRoot, "loaded.ts"), "export {};");
fs.mkdirSync(RELOCATED, { recursive: true });
fs.symlinkSync(externalRoot, path.join(RELOCATED, "extensions"), "dir");
// req: R-631
check("symlinked extension root floors its direct target", (await decide("edit", path.join(externalRoot, "loaded.ts"))) === "BLOCK");
{
	const spacedAgent = path.join(NANA_HOME, "relocated agent with space");
	const spacedExtensions = path.join(spacedAgent, "extensions");
	const spacedTarget = path.join(spacedExtensions, "evil; target.ts");
	const linkedRoot = path.join(NANA_HOME, "discovered linked target with space");
	const linkedTarget = path.join(linkedRoot, "evil; linked.ts");
	fs.mkdirSync(spacedExtensions, { recursive: true });
	fs.mkdirSync(linkedRoot, { recursive: true });
	fs.writeFileSync(spacedTarget, "export {};");
	fs.writeFileSync(linkedTarget, "export {};");
	fs.symlinkSync(linkedRoot, path.join(spacedExtensions, "linked"), "dir");
	process.env.PI_CODING_AGENT_DIR = spacedAgent;
	const quoted = (value) => `"${value}"`;
	const spacedCommands = [
		`printf x > ${quoted(spacedTarget)}`,
		`tee ${quoted(spacedTarget)}`,
		`dd of=${quoted(spacedTarget)}`,
		`printf x > ${quoted(linkedTarget)}`,
		`dd of=${quoted(linkedTarget)}`,
	];
	const commandResults = await Promise.all(spacedCommands.map(decideCommand));
	const ordinaryResult = await decideCommand(`printf x > ${quoted(path.join(NANA_HOME, "ordinary folder", "free; target.ts"))}`);
	// req: R-631
	check("quoted literal paths and assignment values floor relocated and symlink targets while ordinary paths remain allowed", commandResults.every((result) => result === "BLOCK") && ordinaryResult === "ALLOW");
	process.env.PI_CODING_AGENT_DIR = RELOCATED;
	fs.rmSync(spacedAgent, { recursive: true, force: true });
	fs.rmSync(linkedRoot, { recursive: true, force: true });
}
fs.unlinkSync(path.join(RELOCATED, "extensions"));
fs.mkdirSync(path.join(RELOCATED, "extensions"));
for (let i = 0; i < gatePaths.EXTENSION_WALK_ENTRY_CAP - 1; i++) fs.writeFileSync(path.join(RELOCATED, "extensions", `entry-${String(i).padStart(4, "0")}`), "x");
const beyondTarget = path.join(NANA_HOME, "target-beyond-cap.ts");
fs.writeFileSync(beyondTarget, "export {};");
fs.symlinkSync(beyondTarget, path.join(RELOCATED, "extensions", "zz-link"));
// req: R-639
check("extension symlink walk floors resolved root and fails closed at the cap", (await decide("edit", beyondTarget)) === "BLOCK" && (await decide("edit", path.join(NANA_HOME, "unrelated-after-cap.ts"))) === "BLOCK" && (await decideCommand("printf x > target.ts")) === "BLOCK");
delete process.env.PI_CODING_AGENT_DIR;
{
	const relocated = "/tmp/relocated";
	process.env.PI_CODING_AGENT_DIR = relocated;
	const historicalDir = fs.mkdtempSync(path.join(os.tmpdir(), "gate-legacy-reference-"));
	const historicalPath = path.join(historicalDir, "gate-paths.ts");
	try {
		const source = execFileSync("git", ["show", "a3afab28ce136e394bbf6fb89384a169f0a5ee67:packages/nana-pack/lib/gate-paths.ts"], { cwd: path.resolve(new URL("../../../", import.meta.url).pathname), encoding: "utf8" });
		fs.writeFileSync(historicalPath, source);
		fs.copyFileSync(new URL("../lib/agent-dir.mjs", import.meta.url), path.join(historicalDir, "agent-dir.mjs"));
		const mainPaths = await import(`${new URL(`file://${historicalPath}`).href}?probe=${process.pid}`);
		const policy = path.join(relocated, "nana-pack.json");
		const probes = [
			`printf x > ${policy}`, `printf x > '${policy}'`, `printf x > "${policy}"`,
			'printf x > "$PI_CODING_AGENT_DIR"/nana-pack.json', 'printf x > "${PI_CODING_AGENT_DIR}"/nana-pack.json',
			'printf x > "$PI_CODING_AGENT_DIR"/trust.json', 'printf x > "${PI_CODING_AGENT_DIR}"/trust.json',
			`echo '${policy}'`, `cat ${policy}`, `tee ${policy}`, `dd of=${policy}`,
			`bash -c 'printf x > ${policy}'`, `bash -c "printf x > ${policy}"`,
			`sh -c 'printf x > ${policy}'`, `eval 'printf x > ${policy}'`,
			`python3 -c "open('${policy}','w').write('{}')"`,
			...[
				`python3 -c "open('${policy}','w')"`, `python -c 'open("${policy}","w")'`,
				`node -e "write('${policy}')"`, `node --eval="write('${policy}')"`,
				`printf x,${policy}`, `printf x, ${policy}`, `echo ${policy},x`,
				`x=${policy}`, `x='${policy}'`, `x="${policy}"`, `X=${policy} printf x`,
				`printf x >${policy}`, `printf x >>${policy}`, `printf x < ${policy}`,
				`printf x | tee ${policy}`, `printf x; cat ${policy}`, `printf x && cat ${policy}`,
				`printf x || cat ${policy}`, `(cat ${policy})`, `cat (${policy})`,
				`python3 -c 'open("${policy}","w").write("x")'`,
				`python3 -c "open('${policy}','w').write('x')"`,
				`ruby -e 'File.write("${policy}", "x")'`, `perl -e 'open(F,">${policy}")'`,
				`printf '%s' '${policy}'`, `printf "%s" "${policy}"`,
				`cmd /c echo x^>${policy}`, `pwsh -c 'echo x > ${policy}'`,
				`printf x > ${policy} 2>&1`, `printf x 2>${policy}`,
				`printf x > ${policy} & cat ${policy}`, `cd /tmp && cat ${policy}`,
			],
		];
		const subset = probes.every((command) => !mainPaths.commandPolicyHit(command, "/tmp/proj") || gatePaths.commandPolicyHit(command, "/tmp/proj"));
		// req: R-631
		check("legacy extraction parity covers the gate probe corpus", probes.length >= 40 && subset);
		// req: R-631
		check("relocated Python open write to the active policy blocks", (await decideCommand(`python3 -c "open('${policy}','w').write('{}')"`)) === "BLOCK");
		const relocatedSettings = path.join(relocated, "settings.json");
		const settingsOperand = `python3 -c "open('${relocatedSettings}','w').write('{}')"`;
		// req: R-631
		check("declared gap: Python open literal inside -c does not hit relocated settings policy", !gatePaths.commandPolicyHit(settingsOperand, "/tmp/proj") && (await decideCommand(settingsOperand)) === "ALLOW");
	} finally {
		fs.rmSync(historicalDir, { recursive: true, force: true });
		delete process.env.PI_CODING_AGENT_DIR;
	}
}
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
