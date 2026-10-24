/**
 * @module packages/nana-setup/tests/project-stale.test.mjs
 * @purpose Pin the shared adopted-project file-row notice in the Claude Code and pi session-start seats.
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
import { CODE_SPAN_CAP, codeSpan } from "../../nana-pack/lib/display.mjs";
import { MARKER, canonicalCwd, printable, repoRootOf } from "../../nana-pack/lib/adoption.mjs";
import { RULINGS_FILE, RULINGS_SECTION } from "../../nana-pack/lib/rulings-config.mjs";
import { REVIEWER_CHILD_ENV } from "../../nana-pack/bin/worker-config.mjs";
import rulingsExtension from "../../nana-pack/extensions/nana-rulings.ts";
import { CLAUDE_IMPORT, SHARED_DIR, WORKING_BEGIN, WORKING_END, checkProject, refreshWorkingRegion } from "../lib/project.mjs";
import { pkgRoot } from "../lib/paths.mjs";
import * as staleConfig from "../lib/stale-copies-config.mjs";
import * as staleCopies from "../lib/stale-copies.mjs";

delete process.env.NANA_ROLE;

const here = path.dirname(fileURLToPath(import.meta.url));
const hook = path.join(here, "..", "claude", "hooks", "nana-adoption.mjs");
const producer = path.join(here, "..", "bin", "stale-copies.mjs");
const cli = path.join(here, "..", "bin", "nana-setup.mjs");
const shared = fs.readFileSync(path.join(SHARED_DIR, "working-under-nana-pi.md"), "utf8").replace(/\r\n/g, "\n");
const base = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "nana-project-stale-")));
const home = path.join(base, "home");
const agentDir = path.join(home, ".pi", "agent");
fs.mkdirSync(agentDir, { recursive: true });
fs.writeFileSync(path.join(agentDir, RULINGS_FILE), "# Fixture rulings\n\n- Keep the fixture bounded.\n");

// Chosen to bound every child beyond the installed 5 s hook limit, following hooks-closed-output.test.mjs.
const CASE_LIMIT_MS = 15_000;
const FILE_LABELS = ["OBJECTIVE.md", "HANDOFF.md", "docs/sessions/README.md", "docs/sessions/YYYY-MM.md", "AGENTS.md working region", "AGENTS.md", "CLAUDE.md"];
const PRIOR_MONTH = "2000-01.md";
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
	if (Object.hasOwn(extra, "NANA_TEST_TEMP_ROOTS")) env.NANA_TEST_TEMP_ROOTS = extra.NANA_TEST_TEMP_ROOTS;
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

function seedFrontier(root, { objective = true } = {}) {
	if (objective) fs.writeFileSync(path.join(root, "OBJECTIVE.md"), "# Objective\n");
	fs.writeFileSync(path.join(root, "HANDOFF.md"), "# Handoff\n");
	fs.mkdirSync(path.join(root, "docs", "sessions"), { recursive: true });
	fs.writeFileSync(path.join(root, "docs", "sessions", "README.md"), "# Sessions\n");
	fs.writeFileSync(path.join(root, "docs", "sessions", PRIOR_MONTH), "# Prior month\n");
}

function repository(name, body = null, { seeds = true, objective = true } = {}) {
	const root = path.join(base, name);
	fs.mkdirSync(path.join(root, ".git"), { recursive: true });
	if (seeds) seedFrontier(root, { objective });
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

function commandSpan(root, checkOnly = false) {
	const command = `node "${path.join(pkgRoot, "bin", "nana-setup.mjs")}" project "${root}"${checkOnly ? " --check" : ""}`;
	const rendered = ![...staleConfig.PROJECT_STALE_NO_PATH_CHARS].some((character) => root.includes(character)) && printable(root) ? codeSpan(command) : null;
	return rendered ?? `\`nana-setup project${checkOnly ? " --check" : ""}\` ${staleConfig.PROJECT_STALE_ROOT_PHRASE}`;
}

function displayLabel(label) {
	return label === "AGENTS.md working region" ? staleConfig.PROJECT_STALE_LABEL : label;
}

function expectedLine(sessionDir, labels = ["AGENTS.md working region"], byHand = []) {
	const root = canonicalCwd(repoRootOf(canonicalCwd(sessionDir)));
	const shown = labels.map(displayLabel);
	const hand = byHand.map(displayLabel);
	const project = commandSpan(root, false);
	const projectCheck = commandSpan(root, true);
	let remedy;
	if (hand.length === 0) remedy = `they fix it with ${project}`;
	else if (hand.length === shown.length) remedy = `they fix it by hand as ${projectCheck} says`;
	else remedy = `they fix ${hand.join(", ")} by hand as ${projectCheck} says, then the rest with ${project}`;
	return `${staleConfig.PROJECT_STALE_PREFIX} ${shown.join(", ")} — tell the user; ${remedy}`;
}

function labelsFromLine(line) {
	if (!line?.startsWith(`${staleConfig.PROJECT_STALE_PREFIX} `)) return [];
	return line.slice(staleConfig.PROJECT_STALE_PREFIX.length + 1).split(" —", 1)[0].split(", ").map((label) => label === staleConfig.PROJECT_STALE_LABEL ? "AGENTS.md working region" : label);
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

async function seatState(root) {
	const result = producerRun(root);
	const sections = await sectionsFor(root);
	return { result, lines: projectLines(result), section: sections[staleConfig.PROJECT_STALE_SECTION] };
}

function removePath(target) {
	fs.rmSync(target, { recursive: true, force: true });
}

function checkFileLabels(rows) {
	return rows.filter((row) => FILE_LABELS.includes(row.label) && !row.ok && !row.note).map((row) => row.label);
}

function parseByHand(stdout) {
	const match = /fix by hand as each ✗ line says: ([^\n]+?)(?:; then run:|$)/m.exec(stdout);
	if (!match) return [];
	return match[1].split(", ").filter((label) => FILE_LABELS.includes(label));
}

const r2623Facts = [];
{
	const ordinary = repository("r2623-ordinary", drifted(), { seeds: false });
	const sub = path.join(ordinary, "subfolder");
	fs.mkdirSync(sub);
	fs.writeFileSync(path.join(sub, "AGENTS.md"), "# Local instructions without markers\n");
	const outside = path.join(base, "outside");
	fs.mkdirSync(outside);
	const expected = expectedLine(ordinary, ["OBJECTIVE.md", "HANDOFF.md", "docs/sessions/README.md", "docs/sessions/YYYY-MM.md", "AGENTS.md working region"]);
	const hookRoot = child(hook, [], { cwd: outside, env: childEnv({ CLAUDE_PROJECT_DIR: ordinary }) });
	r2623Facts.push(["hook root", oneProjectLine(hookRoot, expected), hookRoot]);
	const hookSub = child(hook, [], { cwd: outside, env: childEnv({ CLAUDE_PROJECT_DIR: sub }) });
	r2623Facts.push(["hook subfolder", oneProjectLine(hookSub, expected), hookSub]);
	const direct = producerRun(ordinary);
	r2623Facts.push(["producer", oneProjectLine(direct, expected), direct]);
	for (const [label, name] of [["space", "r2623 with space"], ["backtick", "r2623-`-tick"], ["dollar sign", "r2623-$-dollar"], ["percent sign", "r2623-%-percent"]]) {
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
	const withAdoption = child(hook, [], { cwd: outside, env: childEnv({ CLAUDE_PROJECT_DIR: ordinary, TMPDIR: childTemp, TMP: childTemp, TEMP: childTemp, NANA_TEST_TEMP_ROOTS: "" }) });
	const outputLines = withAdoption.stdout.trimEnd().split(/\r?\n/);
	r2623Facts.push(["adoption block whole", withAdoption.status === 0 && outputLines[0] === "[nana:adoption]" && outputLines.at(-1) === expected && projectLines(withAdoption).length === 1, withAdoption]);
}
// req: R-2623
check("R-2623: a session in a project whose working section differs gets one project-stale line naming nana-setup project for its root", r2623Facts.every(([, ok]) => ok), JSON.stringify(r2623Facts.map(([name, ok, result]) => ({ name, ok, status: result.status, stdout: result.stdout, stderr: result.stderr }))));

const r2760Facts = [];
await within("R-2760", async () => {
	async function quiet(name, setup) {
		const root = repository(name, null, { seeds: false });
		setup(root);
		const state = await seatState(root);
		r2760Facts.push({ name, ok: state.lines.length === 0 && state.section === undefined, stdout: state.result.stdout });
	}
	const ordinary = (root) => {
		fs.writeFileSync(path.join(root, "AGENTS.md"), "# nana instructions without markers\n");
		fs.writeFileSync(path.join(root, "CLAUDE.md"), "# Project Claude instructions\n");
	};
	await quiet("mentions nana and own Claude", ordinary);
	await quiet("own handoff without sessions", (root) => { ordinary(root); fs.writeFileSync(path.join(root, "HANDOFF.md"), "# Own frontier\n"); });
	await quiet("own sessions README", (root) => { ordinary(root); fs.mkdirSync(path.join(root, "docs", "sessions"), { recursive: true }); fs.writeFileSync(path.join(root, "docs", "sessions", "README.md"), "# Own sessions\n"); });
	await quiet("fenced markers", (root) => fs.writeFileSync(path.join(root, "AGENTS.md"), `\`\`\`md\n${WORKING_BEGIN}\nstale\n${WORKING_END}\n\`\`\`\n`));
	await quiet("over-cap marked file", (root) => fs.writeFileSync(path.join(root, "AGENTS.md"), `${drifted()}${"x".repeat(BOUNDED_READ_CAP)}`));
	if (process.platform === "win32") skip("R-2760 symlinked AGENTS.md requires symlink privilege and is covered off Windows");
	else await quiet("linked marked file", (root) => { fs.writeFileSync(path.join(root, "target.md"), drifted()); fs.symlinkSync("target.md", path.join(root, "AGENTS.md")); });
	await quiet("invalid UTF-8 marked file", (root) => {
		const text = drifted();
		const at = text.indexOf("changed");
		fs.writeFileSync(path.join(root, "AGENTS.md"), Buffer.concat([Buffer.from(text.slice(0, at)), Buffer.from([0x96]), Buffer.from(text.slice(at))]));
	});
	for (const kind of ["directory", "dangling link"]) {
		if (kind === "dangling link" && process.platform === "win32") { skip("R-2760 dangling OBJECTIVE.md link requires symlink privilege and is covered off Windows"); continue; }
		const root = repository(`r2760-objective-${kind.replace(" ", "-")}`, "# no markers\n", { seeds: false });
		seedFrontier(root, { objective: false });
		fs.writeFileSync(path.join(root, "CLAUDE.md"), CLAUDE_IMPORT);
		if (kind === "directory") fs.mkdirSync(path.join(root, "OBJECTIVE.md"));
		else fs.symlinkSync("missing-objective", path.join(root, "OBJECTIVE.md"));
		const expected = expectedLine(root, ["OBJECTIVE.md"], ["OBJECTIVE.md"]);
		const state = await seatState(root);
		r2760Facts.push({ name: `objective ${kind}`, ok: oneProjectLine(state.result, expected) && state.section === expected, stdout: state.result.stdout });
	}
	const marker = repository("r2760-marker-control", drifted(), { objective: false });
	fs.writeFileSync(path.join(marker, "CLAUDE.md"), CLAUDE_IMPORT);
	const markerExpected = expectedLine(marker, ["OBJECTIVE.md", "AGENTS.md working region"]);
	const markerState = await seatState(marker);
	r2760Facts.push({ name: "marker control exact line", ok: oneProjectLine(markerState.result, markerExpected) && markerState.section === markerExpected, stdout: markerState.result.stdout });
});
// req: R-2760
check("R-2760: a repository with neither an objective file nor a nana working-region marker gets no project line in either seat, whatever its check fails", r2760Facts.length >= (process.platform === "win32" ? 8 : 10) && r2760Facts.every((fact) => fact.ok), JSON.stringify(r2760Facts));

const r2761Facts = [];
await within("R-2761", async () => {
	const healthy = repository("r2761-healthy", marked(shared));
	fs.writeFileSync(path.join(healthy, "CLAUDE.md"), CLAUDE_IMPORT);
	let state = await seatState(healthy);
	r2761Facts.push({ name: "fully seeded", ok: state.lines.length === 0 && state.section === undefined });
	removePath(path.join(healthy, "HANDOFF.md"));
	let expected = expectedLine(healthy, ["HANDOFF.md"]);
	state = await seatState(healthy);
	r2761Facts.push({ name: "HANDOFF only", ok: oneProjectLine(state.result, expected) && state.section === expected, stdout: state.result.stdout });

	const measured = repository("r2761-sessions-readme", "# no markers\n");
	fs.writeFileSync(path.join(measured, "CLAUDE.md"), CLAUDE_IMPORT);
	removePath(path.join(measured, "docs", "sessions", "README.md"));
	expected = expectedLine(measured, ["docs/sessions/README.md"]);
	state = await seatState(measured);
	r2761Facts.push({ name: "sessions README only", ok: oneProjectLine(state.result, expected) && state.section === expected, stdout: state.result.stdout });

	const several = repository("r2761-several", drifted());
	fs.writeFileSync(path.join(several, "CLAUDE.md"), CLAUDE_IMPORT);
	for (const rel of ["HANDOFF.md", "docs/sessions/README.md", `docs/sessions/${PRIOR_MONTH}`]) removePath(path.join(several, ...rel.split("/")));
	expected = expectedLine(several, ["HANDOFF.md", "docs/sessions/README.md", "docs/sessions/YYYY-MM.md", "AGENTS.md working region"]);
	state = await seatState(several);
	r2761Facts.push({ name: "several in check order", ok: oneProjectLine(state.result, expected) && state.section === expected, stdout: state.result.stdout });

	const prior = repository("r2761-prior-month", marked(shared));
	fs.writeFileSync(path.join(prior, "CLAUDE.md"), CLAUDE_IMPORT);
	state = await seatState(prior);
	r2761Facts.push({ name: "prior month accepted", ok: state.lines.length === 0 && state.section === undefined });

	const hookRoot = repository("r2761-real-hook", marked(shared));
	fs.writeFileSync(path.join(hookRoot, "CLAUDE.md"), CLAUDE_IMPORT);
	removePath(path.join(hookRoot, "HANDOFF.md"));
	const sub = path.join(hookRoot, "sub");
	fs.mkdirSync(sub);
	fs.writeFileSync(path.join(sub, "AGENTS.md"), "# local unmarked\n");
	expected = expectedLine(hookRoot, ["HANDOFF.md"]);
	const hookResult = child(hook, [], { env: childEnv({ CLAUDE_PROJECT_DIR: sub }) });
	r2761Facts.push({ name: "real hook subfolder", ok: oneProjectLine(hookResult, expected), stdout: hookResult.stdout });

	fs.writeFileSync(path.join(healthy, "HANDOFF.md"), "# Restored\n");
	const handlers = {};
	rulingsExtension({ on: (name, handler) => { handlers[name] = handler; } }, { agentDir });
	await handlers.session_start({ reason: "startup" }, { cwd: several });
	removePath(path.join(several, "AGENTS.md"));
	fs.writeFileSync(path.join(several, "AGENTS.md"), marked(shared));
	fs.writeFileSync(path.join(several, "HANDOFF.md"), "# Restored\n");
	fs.writeFileSync(path.join(several, "docs", "sessions", "README.md"), "# Restored\n");
	fs.writeFileSync(path.join(several, "docs", "sessions", PRIOR_MONTH), "# Restored\n");
	await handlers.session_start({ reason: "reload" }, { cwd: several });
	const event = { systemPromptOptions: { sections: {} } };
	await handlers.before_agent_start(event, { cwd: several });
	r2761Facts.push({ name: "reload clears", ok: !Object.hasOwn(event.systemPromptOptions.sections, staleConfig.PROJECT_STALE_SECTION) });
});
// req: R-2625
// req: R-2761
check("R-2761: an adopted project missing frontier seeds gets one project line naming each missing row in the check's order, in both seats", r2761Facts.length === 7 && r2761Facts.every((fact) => fact.ok), JSON.stringify(r2761Facts));

const r2762Facts = [];
await within("R-2762", async () => {
	const fixtures = [];
	const add = (name, body = marked(shared), mutate = () => {}) => fixtures.push({ name, body, mutate });
	add("matching LF");
	add("matching CRLF", marked(shared, { crlf: true }));
	add("matching without final newline", `${WORKING_BEGIN}\n${shared}${WORKING_END}`);
	add("one byte differs", drifted());
	add("trailing spaces", marked(shared.replace("## Working under nana-pi", "## Working under nana-pi  ")));
	add("trailing tab", marked(shared.replace("## Working under nana-pi", "## Working under nana-pi\t")));
	add("extra blank line", marked(`${shared}\n`));
	add("no pair", shared);
	add("malformed pair", `${WORKING_BEGIN}\n${WORKING_BEGIN}\nstale\n${WORKING_END}\n`);
	add("fence-only pair", `\`\`\`md\n${WORKING_BEGIN}\nstale\n${WORKING_END}\n\`\`\`\n`);
	add("matching CRLF with BOM", `\uFEFF# Fixture\r\n${marked(shared, { crlf: true })}`);
	add("outside prose differs", marked(shared, { suffix: "changed outside\n" }));
	for (const rel of ["OBJECTIVE.md", "HANDOFF.md", "docs/sessions/README.md", `docs/sessions/${PRIOR_MONTH}`]) {
		add(`${rel} absent`, marked(shared), (root) => removePath(path.join(root, ...rel.split("/"))));
		add(`${rel} directory`, marked(shared), (root) => { const target = path.join(root, ...rel.split("/")); removePath(target); fs.mkdirSync(target); });
	}
	add("docs is a file", marked(shared), (root) => { removePath(path.join(root, "docs")); fs.writeFileSync(path.join(root, "docs"), "mine\n"); });
	add("prior month only");
	add("AGENTS absent", null, (root) => removePath(path.join(root, "AGENTS.md")));
	add("AGENTS absent with own CLAUDE", null, (root) => { removePath(path.join(root, "AGENTS.md")); fs.writeFileSync(path.join(root, "CLAUDE.md"), "# own\n"); });
	add("CLAUDE import", marked(shared), (root) => fs.writeFileSync(path.join(root, "CLAUDE.md"), CLAUDE_IMPORT));
	add("CLAUDE placeholder", marked(shared), (root) => fs.writeFileSync(path.join(root, "CLAUDE.md"), "AGENTS.md\n"));
	add("CLAUDE own file", marked(shared), (root) => fs.writeFileSync(path.join(root, "CLAUDE.md"), "# own\n"));
	add("CLAUDE BOM import", marked(shared), (root) => fs.writeFileSync(path.join(root, "CLAUDE.md"), `\uFEFF${CLAUDE_IMPORT}`));
	add("BOM directly before begin", `\uFEFF${drifted()}`, (root) => fs.writeFileSync(path.join(root, "CLAUDE.md"), CLAUDE_IMPORT));
	if (process.platform !== "win32") {
		add("CLAUDE link to AGENTS", marked(shared), (root) => fs.symlinkSync("AGENTS.md", path.join(root, "CLAUDE.md")));
		add("dangling CLAUDE link", marked(shared), (root) => fs.symlinkSync("missing", path.join(root, "CLAUDE.md")));
		add("linked AGENTS", null, (root) => { fs.writeFileSync(path.join(root, "target.md"), drifted()); fs.symlinkSync("target.md", path.join(root, "AGENTS.md")); });
	} else skip("R-2762 symlink fixtures require symlink privilege and are covered off Windows");

	const childLabels = new Set();
	for (let i = 0; i < fixtures.length; i++) {
		const fixture = fixtures[i];
		const root = repository(`r2762-${i}`, fixture.body);
		fixture.mutate(root);
		const rows = await checkProject(root);
		const expectedLabels = checkFileLabels(rows);
		const line = staleCopies.projectStaleLine(root, { env: {} });
		const actualLabels = labelsFromLine(line);
		let childrenOk = true;
		for (const label of expectedLabels) {
			if (childLabels.has(label)) continue;
			childLabels.add(label);
			const sub = path.join(root, `sub-${childLabels.size}`);
			fs.mkdirSync(sub, { recursive: true });
			childrenOk = childrenOk && projectLines(producerRun(root))[0] === line && projectLines(producerRun(sub))[0] === line;
		}
		r2762Facts.push({ name: fixture.name, expectedLabels, actualLabels, ok: JSON.stringify(actualLabels) === JSON.stringify(expectedLabels) && childrenOk && (expectedLabels.length > 0 || line === "") });
	}
	if (process.platform === "win32") skip("R-2762 unreadable AGENTS.md check assertion is POSIX-only");
	else {
		const root = repository("r2762-check-eacces", marked(shared));
		const target = path.join(root, "AGENTS.md");
		fs.chmodSync(target, 0o000);
		let readable = true;
		try { fs.readFileSync(target); } catch { readable = false; }
		if (readable) { fs.chmodSync(target, 0o600); skip("R-2762 EACCES fixture remains readable under this user"); }
		else {
			let rejected = false;
			try { await checkProject(root); } catch (error) { rejected = error?.code === "EACCES" || error?.code === "EPERM"; }
			fs.chmodSync(target, 0o600);
			r2762Facts.push({ name: "check preserves AGENTS read error", ok: rejected });
		}
	}
});
// req: R-2762
check("R-2762: the project line names exactly the file rows project --check marks ✗", r2762Facts.length >= (process.platform === "win32" ? 28 : 31) && r2762Facts.every((fact) => fact.ok), JSON.stringify(r2762Facts));

const r2763Facts = [];
await within("R-2763", async () => {
	async function byHandCase(name, root, forbidden = []) {
		const cliResult = child(cli, ["project", root, "--check", "--home", home]);
		const rows = await checkProject(root);
		const labels = checkFileLabels(rows);
		const byHand = parseByHand(cliResult.stdout);
		const line = staleCopies.projectStaleLine(root, { env: {} });
		const expected = expectedLine(root, labels, byHand);
		const remaining = labels.filter((label) => !byHand.includes(label));
		const checkCommand = commandSpan(root, true);
		const projectCommand = commandSpan(root, false);
		const bound = staleConfig.PROJECT_STALE_PREFIX.length + labels.concat(byHand).reduce((n, label) => n + displayLabel(label).length + 2, 0) + (2 * CODE_SPAN_CAP) + 240;
		const ok = cliResult.status === 1 && line === expected && byHand.every((label) => labels.includes(label))
			&& (byHand.length ? line.includes(checkCommand) : !line.includes(checkCommand))
			&& (remaining.length ? line.includes(projectCommand) : !line.includes(`then the rest with ${projectCommand}`))
			&& !line.includes("\n") && forbidden.every((text) => !line.includes(text)) && line.length <= bound;
		r2763Facts.push({ name, labels, byHand, ok, line, summary: cliResult.stdout.split(/\r?\n/).slice(-4).join("\n") });
	}

	{
		const root = repository("r2763-objective-dir", marked(shared));
		fs.writeFileSync(path.join(root, "CLAUDE.md"), CLAUDE_IMPORT);
		removePath(path.join(root, "OBJECTIVE.md")); fs.mkdirSync(path.join(root, "OBJECTIVE.md"));
		await byHandCase("OBJECTIVE directory", root);
	}
	{
		const root = repository("r2763-handoff-odd", marked(shared));
		fs.writeFileSync(path.join(root, "CLAUDE.md"), CLAUDE_IMPORT);
		removePath(path.join(root, "HANDOFF.md"));
		if (process.platform === "win32") fs.mkdirSync(path.join(root, "HANDOFF.md"));
		else {
			const target = `secret-line\n${"x".repeat(600)}`;
			fs.symlinkSync(target, path.join(root, "HANDOFF.md"));
			await byHandCase("HANDOFF dangling newline link", root, ["secret-line", "x".repeat(40)]);
		}
		if (process.platform === "win32") await byHandCase("HANDOFF directory", root);
	}
	{
		const root = repository("r2763-docs-file", marked(shared));
		fs.writeFileSync(path.join(root, "CLAUDE.md"), CLAUDE_IMPORT);
		removePath(path.join(root, "docs")); fs.writeFileSync(path.join(root, "docs"), "private-entry-text\n");
		await byHandCase("docs file", root, ["private-entry-text"]);
	}
	for (const [name, content] of [["own file", "# own\n"], ["placeholder", "AGENTS.md\n"]]) {
		const root = repository(`r2763-claude-${name.replace(" ", "-")}`, marked(shared));
		fs.writeFileSync(path.join(root, "CLAUDE.md"), content);
		await byHandCase(`CLAUDE ${name}`, root, [content.trim()]);
	}
	{
		const root = repository("r2763-mixed", marked(shared));
		fs.writeFileSync(path.join(root, "CLAUDE.md"), CLAUDE_IMPORT);
		removePath(path.join(root, "HANDOFF.md")); fs.mkdirSync(path.join(root, "HANDOFF.md"));
		removePath(path.join(root, "docs", "sessions", "README.md"));
		await byHandCase("mixed by-hand and project", root);
	}
	{
		const root = repository("r2763-no-agents-claude-dir", null);
		fs.mkdirSync(path.join(root, "CLAUDE.md"));
		await byHandCase("AGENTS absent with CLAUDE directory", root);
	}
	if (process.platform === "win32") skip("R-2763 live CLAUDE.md link requires symlink privilege and is covered off Windows");
	else {
		const root = repository("r2763-no-agents-claude-link", null);
		fs.writeFileSync(path.join(root, "other.md"), "# other\n");
		fs.symlinkSync("other.md", path.join(root, "CLAUDE.md"));
		await byHandCase("AGENTS absent with live CLAUDE link", root);
	}
	for (const [label, leaf] of [["backtick", "r2763-`-root"], ["dollar", "r2763-$-root"], ["quote", 'r2763-"-root']]) {
		if (label === "quote" && process.platform === "win32") { skip("R-2763 double-quote root is illegal on win32"); continue; }
		const root = repository(leaf, marked(shared));
		fs.writeFileSync(path.join(root, "CLAUDE.md"), CLAUDE_IMPORT);
		removePath(path.join(root, "OBJECTIVE.md")); fs.mkdirSync(path.join(root, "OBJECTIVE.md"));
		removePath(path.join(root, "HANDOFF.md"));
		await byHandCase(`${label} root uses both fallbacks`, root);
	}
	{
		const before = new Date();
		const month = `${before.getFullYear()}-${String(before.getMonth() + 1).padStart(2, "0")}.md`;
		const root = repository("r2763-month-directory", marked(shared));
		fs.writeFileSync(path.join(root, "CLAUDE.md"), CLAUDE_IMPORT);
		removePath(path.join(root, "docs", "sessions", PRIOR_MONTH));
		fs.mkdirSync(path.join(root, "docs", "sessions", month));
		const after = new Date();
		if (before.getFullYear() !== after.getFullYear() || before.getMonth() !== after.getMonth()) skip("R-2763 month changed during the this-month-directory case");
		else await byHandCase("this month's log path is a directory", root);
	}
});
// req: R-2763
check("R-2763: rows the check leaves to the owner are named as fixes by hand with the check command, and the line carries nothing read from the entry", r2763Facts.length >= (process.platform === "win32" ? 10 : 12) && r2763Facts.every((fact) => fact.ok), JSON.stringify(r2763Facts));

const r2764Facts = [];
await within("R-2764", async () => {
	async function guarded(name, root, removeGuard) {
		let state = await seatState(root);
		const guardedOk = state.lines.length === 0 && state.section === undefined;
		removeGuard();
		const expected = expectedLine(root, ["HANDOFF.md", "docs/sessions/README.md", "docs/sessions/YYYY-MM.md"]);
		state = await seatState(root);
		r2764Facts.push({ name, guardedOk, controlOk: oneProjectLine(state.result, expected) && state.section === expected, stdout: state.result.stdout });
	}
	{
		const root = repository("r2764-dismissed", marked(shared), { seeds: false });
		fs.writeFileSync(path.join(root, "OBJECTIVE.md"), "# Objective\n"); fs.writeFileSync(path.join(root, MARKER), "dismissed\n");
		await guarded("dismissed", root, () => removePath(path.join(root, MARKER)));
	}
	{
		const root = repository("r2764-linked", marked(shared), { seeds: false });
		fs.writeFileSync(path.join(root, "OBJECTIVE.md"), "# Objective\n"); removePath(path.join(root, ".git")); fs.writeFileSync(path.join(root, ".git"), "gitdir: elsewhere\n");
		await guarded("linked worktree", root, () => { removePath(path.join(root, ".git")); fs.mkdirSync(path.join(root, ".git")); });
	}
	{
		const root = repository("r2764-nana-pi", marked(shared), { seeds: false });
		fs.writeFileSync(path.join(root, "OBJECTIVE.md"), "# Objective\n"); const own = path.join(root, "templates", "_shared", "working-under-nana-pi.md"); fs.mkdirSync(path.dirname(own), { recursive: true }); fs.writeFileSync(own, shared);
		await guarded("nana-pi checkout", root, () => removePath(own));
	}
	{
		const root = path.join(base, "r2764-no-repo");
		fs.mkdirSync(root); fs.writeFileSync(path.join(root, "OBJECTIVE.md"), "# Objective\n"); fs.writeFileSync(path.join(root, "AGENTS.md"), marked(shared));
		if (repoRootOf(canonicalCwd(root)) !== null) skip("R-2764 no-repository fixture lies under a repository");
		else await guarded("no repository", root, () => fs.mkdirSync(path.join(root, ".git")));
	}
});
// req: R-2764
check("R-2764: no repository, a linked worktree, a nana-pi checkout and a dismissed root get no project line even with every seed missing", r2764Facts.length === 4 && r2764Facts.every((fact) => fact.guardedOk && fact.controlOk), JSON.stringify(r2764Facts));

const r2765Facts = [];
await within("R-2765", async () => {
	async function damaged(name, bytes, prepare = () => {}, restore = () => {}) {
		const root = repository(`r2765-${name}`, null);
		fs.writeFileSync(path.join(root, "CLAUDE.md"), CLAUDE_IMPORT);
		removePath(path.join(root, "HANDOFF.md"));
		fs.writeFileSync(path.join(root, "AGENTS.md"), bytes);
		prepare(root);
		const expected = expectedLine(root, ["HANDOFF.md"]);
		const state = await seatState(root);
		restore(root);
		r2765Facts.push({ name, ok: oneProjectLine(state.result, expected) && state.section === expected, stdout: state.result.stdout });
	}
	if (process.platform === "win32") skip("R-2765 unreadable AGENTS.md mode case is POSIX-only");
	else {
		const probe = repository("r2765-unreadable-probe", drifted());
		const target = path.join(probe, "AGENTS.md");
		fs.chmodSync(target, 0o000);
		let readable = true;
		try { fs.readFileSync(target); } catch { readable = false; }
		fs.chmodSync(target, 0o600);
		removePath(probe);
		if (readable) skip("R-2765 EACCES fixture remains readable under this user");
		else await damaged("unreadable", drifted(), (root) => fs.chmodSync(path.join(root, "AGENTS.md"), 0o000), (root) => fs.chmodSync(path.join(root, "AGENTS.md"), 0o600));
	}
	{
		const text = drifted(); const at = text.indexOf("changed");
		const bytes = Buffer.concat([Buffer.from(text.slice(0, at)), Buffer.from([0x96]), Buffer.from(text.slice(at))]);
		await damaged("invalid-utf8", bytes);
	}
	await damaged("over-cap", `${drifted()}${"x".repeat(BOUNDED_READ_CAP)}`);
	{
		const root = repository("r2765-control", drifted());
		fs.writeFileSync(path.join(root, "CLAUDE.md"), CLAUDE_IMPORT); removePath(path.join(root, "HANDOFF.md"));
		const expected = expectedLine(root, ["HANDOFF.md", "AGENTS.md working region"]);
		const state = await seatState(root);
		r2765Facts.push({ name: "readable control", ok: oneProjectLine(state.result, expected) && state.section === expected, stdout: state.result.stdout });
	}
});
// req: R-2765
check("R-2765: an unreadable, invalid UTF-8 or over-cap AGENTS.md leaves the working section out and the other failing rows in", r2765Facts.length >= (process.platform === "win32" ? 3 : 4) && r2765Facts.every((fact) => fact.ok), JSON.stringify(r2765Facts));

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
	const root = repository("r2627-no-child", marked(shared));
	removePath(path.join(root, "HANDOFF.md"));
	const sub = path.join(root, "sub");
	fs.mkdirSync(sub);
	fs.writeFileSync(path.join(sub, "AGENTS.md"), "unmarked local file\n");
	const expected = expectedLine(root, ["HANDOFF.md"]);
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
	r2627 = oneProjectLine(producerResult, expected) && childCalls.length === 0 && section === expected && inProcessCalls.length === 0 && oneProjectLine(noTypes, expected);
});
// req: R-2627
check("R-2627: deciding the project-stale line starts no child process and loads no TypeScript in either seat", r2627);

// req: R-2623
// req: R-2625
check("seal: the project-stale prefix is [nana:project] PROJECT STALE: and its pi section key is nana-project-stale", staleConfig.PROJECT_STALE_PREFIX === "[nana:project] PROJECT STALE:" && staleConfig.PROJECT_STALE_SECTION === "nana-project-stale");

console.log(`SUMMARY  PASS=${passes} FAIL=${fails} SKIP=${skips}`);
process.exitCode = fails ? 1 : 0;
