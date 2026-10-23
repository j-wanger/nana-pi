/**
 * @module packages/nana-setup/tests/project-stale.test.mjs
 * @purpose Pin the shared project-working-region drift notice in the Claude Code and pi session-start seats.
 * @inputs the real adoption hook and stale-copy producer, nana-rulings, project helpers, shared working text, and temporary repositories.
 * @outputs PASS/FAIL/SKIP lines and a summary; a nonzero exit when a contract case fails.
 * @effects disk (OS temporary fixtures only), process (spawns hook CLIs and temporarily patches child_process and NANA_ROLE).
 * @errors fixture errors fail their case; every asynchronous handler is bounded by the per-case limit.
 */
import { spawnSync } from "node:child_process";
import { createRequire, syncBuiltinESMExports } from "node:module";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { BOUNDED_READ_CAP } from "../../nana-pack/lib/bounded-read.mjs";
import { codeSpan } from "../../nana-pack/lib/display.mjs";
import { MARKER, canonicalCwd, repoRootOf } from "../../nana-pack/lib/adoption.mjs";
import { RULINGS_FILE, RULINGS_SECTION } from "../../nana-pack/lib/rulings-config.mjs";
import { REVIEWER_CHILD_ENV } from "../../nana-pack/bin/worker-config.mjs";
import rulingsExtension from "../../nana-pack/extensions/nana-rulings.ts";
import { SHARED_DIR, WORKING_BEGIN, WORKING_END, checkProject, refreshWorkingRegion } from "../lib/project.mjs";
import { pkgRoot } from "../lib/paths.mjs";
import * as staleConfig from "../lib/stale-copies-config.mjs";
import * as staleCopies from "../lib/stale-copies.mjs";

delete process.env.NANA_ROLE;

const here = path.dirname(fileURLToPath(import.meta.url));
const hook = path.join(here, "..", "claude", "hooks", "nana-adoption.mjs");
const producer = path.join(here, "..", "bin", "stale-copies.mjs");
const shared = fs.readFileSync(path.join(SHARED_DIR, "working-under-nana-pi.md"), "utf8").replace(/\r\n/g, "\n");
const base = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "nana-project-stale-")));
const home = path.join(base, "home");
const agentDir = path.join(home, ".pi", "agent");
fs.mkdirSync(agentDir, { recursive: true });
fs.writeFileSync(path.join(agentDir, RULINGS_FILE), "# Fixture rulings\n\n- Keep the fixture bounded.\n");

// Chosen to bound every child beyond the installed 5 s hook limit, following hooks-closed-output.test.mjs.
const CASE_LIMIT_MS = 15_000;
let passes = 0;
let fails = 0;
let skips = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
	if (ok) passes++;
	else fails++;
};
const skip = (reason) => { console.log("SKIP", reason); skips++; };

async function within(label, fn) {
	let timer;
	try {
		return await Promise.race([
			Promise.resolve().then(fn),
			new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} exceeded ${CASE_LIMIT_MS}ms`)), CASE_LIMIT_MS); }),
		]);
	} finally {
		clearTimeout(timer);
	}
}

function childEnv(extra = {}) {
	const env = { ...process.env, HOME: home, USERPROFILE: home, ...extra };
	for (const key of ["NANA_ROLE", "PI_CODING_AGENT_DIR", "CLAUDE_CONFIG_DIR", "NANA_TEST_TEMP_ROOTS"]) delete env[key];
	if (Object.hasOwn(extra, "NANA_ROLE")) env.NANA_ROLE = extra.NANA_ROLE;
	return env;
}

function child(script, args = [], options = {}) {
	return spawnSync(process.execPath, [...(options.nodeArgs ?? []), script, ...args], {
		cwd: options.cwd ?? base,
		env: options.env ?? childEnv(),
		encoding: "utf8",
		timeout: CASE_LIMIT_MS,
	});
}

function repository(name, body = null) {
	const root = path.join(base, name);
	fs.mkdirSync(path.join(root, ".git"), { recursive: true });
	if (body !== null) fs.writeFileSync(path.join(root, "AGENTS.md"), body);
	return root;
}

const marked = (inside, { crlf = false, bom = false, suffix = "" } = {}) => {
	const text = `${WORKING_BEGIN}\n${inside}${WORKING_END}\n${suffix}`;
	return `${bom ? "\uFEFF" : ""}${crlf ? text.replace(/\n/g, "\r\n") : text}`;
};
const drifted = () => marked(shared.replace("## Working under nana-pi", "## Working under nana-pi changed"));
const producerRun = (cwd, options = {}) => child(producer, ["--cwd", cwd], options);
const projectLines = (result) => String(result.stdout ?? "").split(/\r?\n/).filter((line) => typeof staleConfig.PROJECT_STALE_PREFIX === "string" && line.startsWith(staleConfig.PROJECT_STALE_PREFIX));

function expectedLine(sessionDir) {
	const root = canonicalCwd(repoRootOf(canonicalCwd(sessionDir)));
	const command = `node "${path.join(pkgRoot, "bin", "nana-setup.mjs")}" project "${root}"`;
	const rendered = !root.includes('"') ? codeSpan(command) : null;
	const fix = rendered ?? `\`nana-setup project\` ${staleConfig.PROJECT_STALE_ROOT_PHRASE}`;
	return `${staleConfig.PROJECT_STALE_PREFIX} ${staleConfig.PROJECT_STALE_LABEL} — tell the user; they fix it with ${fix}`;
}

async function sectionsFor(cwd, reason = "startup") {
	const handlers = {};
	rulingsExtension({ on: (name, handler) => { handlers[name] = handler; } }, { agentDir });
	await within(`rulings ${reason} session_start`, () => handlers.session_start({ reason }, cwd === undefined ? {} : { cwd }));
	const event = { systemPromptOptions: { sections: {} } };
	await within(`rulings ${reason} before_agent_start`, () => handlers.before_agent_start(event, cwd === undefined ? {} : { cwd }));
	return event.systemPromptOptions.sections;
}

function oneProjectLine(result, expected) {
	const lines = projectLines(result);
	return result.status === 0 && lines.length === 1 && lines[0] === expected;
}

const r2623Facts = [];
{
	const ordinary = repository("r2623-ordinary", drifted());
	const sub = path.join(ordinary, "subfolder");
	fs.mkdirSync(sub);
	fs.writeFileSync(path.join(sub, "AGENTS.md"), "# Local instructions without markers\n");
	const outside = path.join(base, "outside");
	fs.mkdirSync(outside);
	const hookRoot = child(hook, [], { cwd: outside, env: childEnv({ CLAUDE_PROJECT_DIR: ordinary }) });
	r2623Facts.push(["hook root", oneProjectLine(hookRoot, expectedLine(ordinary)), hookRoot]);
	const hookSub = child(hook, [], { cwd: outside, env: childEnv({ CLAUDE_PROJECT_DIR: sub }) });
	r2623Facts.push(["hook subfolder", oneProjectLine(hookSub, expectedLine(sub)), hookSub]);
	const direct = producerRun(ordinary);
	r2623Facts.push(["producer", oneProjectLine(direct, expectedLine(ordinary)), direct]);
	for (const [label, name] of [["space", "r2623 with space"], ["backtick", "r2623-`-tick"]]) {
		const root = repository(name, drifted());
		const result = producerRun(root);
		r2623Facts.push([label, oneProjectLine(result, expectedLine(root)), result]);
	}
	if (process.platform === "win32") skip("R-2623 double-quote root is illegal on win32");
	else {
		const root = repository('r2623-"-quote', drifted());
		const result = producerRun(root);
		r2623Facts.push(["double quote", oneProjectLine(result, expectedLine(root)), result]);
	}
	const journal = path.join(agentDir, "nana-journal.jsonl");
	fs.writeFileSync(journal, `${JSON.stringify({ ts: new Date().toISOString(), event: "directory_unadopted", cwd: ordinary, has: {} })}\n`);
	const childTemp = path.join(base, "child-os-temp");
	fs.mkdirSync(childTemp);
	const withAdoption = child(hook, [], { cwd: outside, env: childEnv({ CLAUDE_PROJECT_DIR: ordinary, TMPDIR: childTemp, TMP: childTemp, TEMP: childTemp }) });
	const outputLines = withAdoption.stdout.trimEnd().split(/\r?\n/);
	r2623Facts.push(["adoption block whole", withAdoption.status === 0 && outputLines[0] === "[nana:adoption]" && outputLines.at(-1) === expectedLine(ordinary) && projectLines(withAdoption).length === 1, withAdoption]);
}
// req: R-2623
check("R-2623: a session in a project whose working section differs gets one project-stale line naming nana-setup project for its root", r2623Facts.every(([, ok]) => ok), JSON.stringify(r2623Facts.map(([name, ok, result]) => ({ name, ok, status: result.status, stdout: result.stdout, stderr: result.stderr }))));

const r2624Facts = [];
const negativeRoots = [];
async function negativeControl(name, root, makePositive, { skipReason = null } = {}) {
	if (skipReason) { skip(skipReason); return; }
	const negative = producerRun(root);
	const sections = await sectionsFor(root);
	const noLine = projectLines(negative).length === 0 && !Object.hasOwn(sections, staleConfig.PROJECT_STALE_SECTION);
	makePositive();
	const positive = producerRun(root);
	const hasLine = oneProjectLine(positive, expectedLine(root));
	r2624Facts.push({ name, noLine, hasLine, negative: negative.stdout, positive: positive.stdout });
	negativeRoots.push(name);
}

await within("R-2624 cases", async () => {
	{
		const root = repository("r2624-match", marked(shared));
		await negativeControl("matching LF", root, () => fs.writeFileSync(path.join(root, "AGENTS.md"), drifted()));
	}
	{
		const root = repository("r2624-crlf-bom", `\uFEFF# Fixture\r\n${marked(shared, { crlf: true })}`);
		await negativeControl("matching CRLF and BOM", root, () => fs.writeFileSync(path.join(root, "AGENTS.md"), `\uFEFF# Fixture\r\n${marked(shared.replace("## Working under nana-pi", "## Working under nana-pi changed"), { crlf: true })}`));
	}
	{
		const root = repository("r2624-outside", marked(shared, { suffix: "changed outside\n" }));
		await negativeControl("outside prose", root, () => fs.writeFileSync(path.join(root, "AGENTS.md"), marked(shared.replace("## Working under nana-pi", "## Working under nana-pi changed"), { suffix: "changed outside\n" })));
	}
	{
		const root = repository("r2624-no-pair", shared);
		await negativeControl("no pair", root, () => fs.writeFileSync(path.join(root, "AGENTS.md"), drifted()));
	}
	{
		const root = repository("r2624-fenced", `\`\`\`md\n${WORKING_BEGIN}\nstale\n${WORKING_END}\n\`\`\`\n`);
		await negativeControl("fenced pair", root, () => fs.writeFileSync(path.join(root, "AGENTS.md"), drifted()));
	}
	{
		const root = repository("r2624-duplicate", `${WORKING_BEGIN}\n${WORKING_BEGIN}\nstale\n${WORKING_END}\n`);
		await negativeControl("two begin markers", root, () => fs.writeFileSync(path.join(root, "AGENTS.md"), drifted()));
	}
	if (process.platform === "win32") skip("R-2624 symlinked AGENTS.md requires symlink privilege and is covered off Windows");
	else {
		const root = repository("r2624-symlink");
		fs.writeFileSync(path.join(root, "target.md"), drifted());
		fs.symlinkSync("target.md", path.join(root, "AGENTS.md"));
		await negativeControl("symlink", root, () => { fs.unlinkSync(path.join(root, "AGENTS.md")); fs.copyFileSync(path.join(root, "target.md"), path.join(root, "AGENTS.md")); });
	}
	{
		const root = repository("r2624-absent");
		await negativeControl("absent", root, () => fs.writeFileSync(path.join(root, "AGENTS.md"), drifted()));
	}
	{
		const root = repository("r2624-directory");
		fs.mkdirSync(path.join(root, "AGENTS.md"));
		await negativeControl("directory", root, () => { fs.rmSync(path.join(root, "AGENTS.md"), { recursive: true }); fs.writeFileSync(path.join(root, "AGENTS.md"), drifted()); });
	}
	if (process.platform === "win32") skip("R-2624 EACCES mode case is POSIX-only");
	else {
		const root = repository("r2624-eacces", drifted());
		const target = path.join(root, "AGENTS.md");
		fs.chmodSync(target, 0o000);
		let readable = true;
		try { fs.readFileSync(target); } catch { readable = false; }
		if (readable) { fs.chmodSync(target, 0o600); skip("R-2624 EACCES fixture remains readable under this user"); }
		else await negativeControl("unreadable", root, () => fs.chmodSync(target, 0o600));
	}
	{
		const root = repository("r2624-over-cap", `${drifted()}${"x".repeat(BOUNDED_READ_CAP)}`);
		await negativeControl("over cap", root, () => fs.writeFileSync(path.join(root, "AGENTS.md"), drifted()));
	}
	{
		const root = repository("r2624-cp1252");
		fs.writeFileSync(path.join(root, "AGENTS.md"), Buffer.concat([Buffer.from([0x96]), Buffer.from(drifted())]));
		await negativeControl("invalid UTF-8", root, () => fs.writeFileSync(path.join(root, "AGENTS.md"), drifted()));
	}
	{
		const root = repository("r2624-dismissed", drifted());
		fs.writeFileSync(path.join(root, MARKER), "dismissed\n");
		await negativeControl("dismissed", root, () => fs.unlinkSync(path.join(root, MARKER)));
	}
	{
		const root = repository("r2624-linked", drifted());
		fs.rmSync(path.join(root, ".git"), { recursive: true });
		fs.writeFileSync(path.join(root, ".git"), "gitdir: elsewhere\n");
		await negativeControl("linked worktree", root, () => { fs.unlinkSync(path.join(root, ".git")); fs.mkdirSync(path.join(root, ".git")); });
	}
	{
		const root = repository("r2624-nana-pi", drifted());
		const ownShared = path.join(root, "templates", "_shared", "working-under-nana-pi.md");
		fs.mkdirSync(path.dirname(ownShared), { recursive: true });
		fs.writeFileSync(ownShared, shared);
		await negativeControl("nana-pi checkout", root, () => fs.unlinkSync(ownShared));
	}
	{
		const root = path.join(base, "r2624-no-repo");
		fs.mkdirSync(root);
		fs.writeFileSync(path.join(root, "AGENTS.md"), drifted());
		if (repoRootOf(canonicalCwd(root)) !== null) skip("R-2624 no-repository fixture lies under a repository");
		else await negativeControl("no repository", root, () => fs.mkdirSync(path.join(root, ".git")));
	}
});
// req: R-2624
check("R-2624: no project-stale line where the region matches or nana-setup project would not refresh it, while one changed byte in the same region brings it", r2624Facts.length >= 13 && r2624Facts.every((fact) => fact.noLine && fact.hasLine), JSON.stringify(r2624Facts));

let r2625 = false;
await within("R-2625", async () => {
	const root = repository("r2625-reload", drifted());
	const sub = path.join(root, "sub");
	fs.mkdirSync(sub);
	const expected = projectLines(producerRun(sub))[0];
	const handlers = {};
	rulingsExtension({ on: (name, handler) => { handlers[name] = handler; } }, { agentDir });
	await handlers.session_start({ reason: "startup" }, { cwd: sub });
	const first = { systemPromptOptions: { sections: {} } };
	await handlers.before_agent_start(first, { cwd: sub });
	const firstOk = first.systemPromptOptions.sections[staleConfig.PROJECT_STALE_SECTION] === expected && typeof first.systemPromptOptions.sections[RULINGS_SECTION] === "string";
	refreshWorkingRegion(root);
	await handlers.session_start({ reason: "reload" }, { cwd: sub });
	const refreshed = { systemPromptOptions: { sections: {} } };
	await handlers.before_agent_start(refreshed, { cwd: sub });
	const reloadOk = !Object.hasOwn(refreshed.systemPromptOptions.sections, staleConfig.PROJECT_STALE_SECTION) && typeof refreshed.systemPromptOptions.sections[RULINGS_SECTION] === "string";
	await handlers.session_start({ reason: "new" }, {});
	const cwdless = { systemPromptOptions: { sections: {} } };
	await handlers.before_agent_start(cwdless, {});
	const cwdlessOk = !Object.hasOwn(cwdless.systemPromptOptions.sections, staleConfig.PROJECT_STALE_SECTION) && typeof cwdless.systemPromptOptions.sections[RULINGS_SECTION] === "string";
	r2625 = Boolean(expected) && firstOk && reloadOk && cwdlessOk;
});
// req: R-2625
check("R-2625: a pi session in a drifted project gets the producer's project-stale line as its section, gone after a refresh and a reload", r2625);

const r2626Facts = [];
await within("R-2626", async () => {
	const root = repository("r2626-role", drifted());
	for (const role of [REVIEWER_CHILD_ENV.NANA_ROLE, "worker"]) {
		const producerResult = producerRun(root, { env: childEnv({ NANA_ROLE: role }) });
		const saved = process.env.NANA_ROLE;
		try {
			process.env.NANA_ROLE = role;
			const sections = await sectionsFor(root);
			r2626Facts.push({ role, producerQuiet: projectLines(producerResult).length === 0, extensionQuiet: !Object.hasOwn(sections, staleConfig.PROJECT_STALE_SECTION) });
		} finally {
			if (saved === undefined) delete process.env.NANA_ROLE;
			else process.env.NANA_ROLE = saved;
		}
	}
	const producerControl = oneProjectLine(producerRun(root), expectedLine(root));
	const sections = await sectionsFor(root);
	r2626Facts.push({ role: "none", producerControl, extensionControl: sections[staleConfig.PROJECT_STALE_SECTION] === expectedLine(root) });
});
// req: R-2626
check("R-2626: reviewer and worker children get no project-stale line in either seat, and the same folder with no role does", r2626Facts.length === 3 && r2626Facts.slice(0, 2).every((fact) => fact.producerQuiet && fact.extensionQuiet) && r2626Facts[2].producerControl && r2626Facts[2].extensionControl, JSON.stringify(r2626Facts));

let r2627 = false;
await within("R-2627", async () => {
	const root = repository("r2627-no-child", drifted());
	const sub = path.join(root, "sub");
	fs.mkdirSync(sub);
	fs.writeFileSync(path.join(sub, "AGENTS.md"), "unmarked local file\n");
	const callsFile = path.join(base, "r2627-calls.jsonl");
	const preload = path.join(base, "r2627-preload.cjs");
	fs.writeFileSync(preload, `const fs = require("node:fs");\nconst cp = require("node:child_process");\nfor (const name of ["spawn","spawnSync","exec","execSync","execFile","execFileSync","fork"]) { const original = cp[name]; cp[name] = function (...args) { fs.appendFileSync(process.env.NANA_CALLS_FILE, name + "\\n"); return original.apply(this, args); }; }\n`);
	const preloadOption = `--require=${preload}`;
	const producerResult = producerRun(sub, { env: childEnv({ NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} ${preloadOption}`, NANA_CALLS_FILE: callsFile }) });
	const childCalls = fs.existsSync(callsFile) ? fs.readFileSync(callsFile, "utf8").trim().split(/\r?\n/).filter(Boolean) : [];
	const requireFS = createRequire(import.meta.url)("node:child_process");
	const names = ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"];
	const originals = Object.fromEntries(names.map((name) => [name, requireFS[name]]));
	const inProcessCalls = [];
	for (const name of names) requireFS[name] = (...args) => { inProcessCalls.push(name); return originals[name](...args); };
	syncBuiltinESMExports();
	let section;
	try { section = (await sectionsFor(sub))[staleConfig.PROJECT_STALE_SECTION]; }
	finally {
		for (const name of names) requireFS[name] = originals[name];
		syncBuiltinESMExports();
	}
	const noTypes = child(producer, ["--cwd", sub], { cwd: base, env: childEnv(), nodeArgs: ["--no-experimental-strip-types"] });
	r2627 = oneProjectLine(producerResult, expectedLine(sub)) && childCalls.length === 0 && section === expectedLine(sub) && inProcessCalls.length === 0 && oneProjectLine(noTypes, expectedLine(sub));
});
// req: R-2627
check("R-2627: deciding the project-stale line starts no child process and loads no TypeScript in either seat", r2627);

const r2628Facts = [];
await within("R-2628", async () => {
	const fixtures = [
		["matching LF", marked(shared), {}],
		["matching CRLF", marked(shared, { crlf: true }), {}],
		["matching without a final newline", `${WORKING_BEGIN}\n${shared}${WORKING_END}`, {}],
		["one byte differs", drifted(), {}],
		["trailing spaces differ", marked(shared.replace("## Working under nana-pi", "## Working under nana-pi  ")), {}],
		["trailing tab differs", marked(shared.replace("## Working under nana-pi", "## Working under nana-pi\t")), {}],
		["blank line differs", marked(`${shared}\n`), {}],
		["no pair", shared, {}],
		["malformed pair", `${WORKING_BEGIN}\n${WORKING_BEGIN}\nstale\n${WORKING_END}\n`, {}],
		["fence-only pair", `\`\`\`md\n${WORKING_BEGIN}\nstale\n${WORKING_END}\n\`\`\`\n`, {}],
	];
	for (const [name, body, options] of fixtures) {
		const root = repository(`r2628-${r2628Facts.length}`, body);
		const row = (await checkProject(root)).find((item) => item.label === "AGENTS.md working region");
		for (const cwd of [root, path.join(root, "sub")]) {
			if (cwd !== root) fs.mkdirSync(cwd);
			const hasLine = projectLines(producerRun(cwd)).length === 1;
			r2628Facts.push({ name, cwd: cwd === root ? "root" : "sub", row: row?.detail, ok: hasLine === Boolean(row?.detail?.startsWith("differs")), ...options });
		}
	}
	if (process.platform === "win32") skip("R-2628 symlinked AGENTS.md requires symlink privilege and is covered off Windows");
	else {
		const root = repository("r2628-symlink");
		fs.writeFileSync(path.join(root, "target.md"), drifted());
		fs.symlinkSync("target.md", path.join(root, "AGENTS.md"));
		const row = (await checkProject(root)).find((item) => item.label === "AGENTS.md working region");
		r2628Facts.push({ name: "symlink", row: row?.detail, ok: projectLines(producerRun(root)).length === 0 });
	}
	for (const [name, setup] of [
		["dismissed carve-out", (root) => fs.writeFileSync(path.join(root, MARKER), "dismissed\n")],
		["over-cap carve-out", (root) => fs.appendFileSync(path.join(root, "AGENTS.md"), "x".repeat(BOUNDED_READ_CAP))],
	]) {
		const root = repository(`r2628-${name}`, drifted());
		setup(root);
		const row = (await checkProject(root)).find((item) => item.label === "AGENTS.md working region");
		r2628Facts.push({ name, row: row?.detail, ok: row?.detail?.startsWith("differs") === true && projectLines(producerRun(root)).length === 0 });
	}
});
// req: R-2628
check("R-2628: the project-stale line appears exactly where project --check says the working region differs", r2628Facts.length >= 19 && r2628Facts.every((fact) => fact.ok), JSON.stringify(r2628Facts));

// req: R-2623
// req: R-2625
check("seal: the project-stale prefix is [nana:project] PROJECT STALE: and its pi section key is nana-project-stale", staleConfig.PROJECT_STALE_PREFIX === "[nana:project] PROJECT STALE:" && staleConfig.PROJECT_STALE_SECTION === "nana-project-stale");

console.log(`SUMMARY  PASS=${passes} FAIL=${fails} SKIP=${skips}`);
process.exitCode = fails ? 1 : 0;
