/**
 * @module packages/nana-setup/tests/project-odd-seeds.test.mjs
 * @purpose Pin project setup and checks for odd seed entries, literal names, and dry-run repair prediction.
 * @inputs bin/nana-setup.mjs and throwaway projects with a throwaway --home
 * @outputs PASS/FAIL lines for exactly eight must-meet checks and a SUMMARY line
 * @effects disk (OS temporary fixtures), process (spawns the nana-setup CLI)
 * @errors A failed check prints FAIL and makes the test process exit 1.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const now = new Date();
const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const monthSeed = `docs/sessions/${month}.md`;
const seedPaths = ["OBJECTIVE.md", "HANDOFF.md", "docs/sessions/README.md", monthSeed, "AGENTS.md", "CLAUDE.md", ".pi/nana-pack.json"];
let passes = 0;
let fails = 0;

function check(title, ok, extra = "") {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : extra);
	if (ok) passes++;
	else fails++;
}

function fixture(prefix, leaf = "project") {
	const root = tmpDir(path.join(os.tmpdir(), `${prefix}-`));
	const dir = path.join(root, leaf);
	fs.mkdirSync(dir, { recursive: true });
	return { root, dir, home: path.join(root, "home") };
}

function run(args) {
	return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", timeout: 15_000 });
}

function projectRun(item, extra = []) {
	return run(["project", item.dir, "--home", item.home, ...extra]);
}

function escapeRe(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasRow(stdout, mark, label, detail = "") {
	return new RegExp(`^  ${escapeRe(mark)} ${escapeRe(label)} {2,}[^\\n]*${detail}`, "m").test(stdout);
}

function makeOdd(dir, rel, kind) {
	const target = path.join(dir, ...rel.split("/"));
	fs.mkdirSync(path.dirname(target), { recursive: true });
	if (kind === "link") {
		const linkTarget = `missing-${rel.replaceAll("/", "-")}`;
		fs.symlinkSync(linkTarget, target);
		return { target, linkTarget };
	}
	fs.mkdirSync(target);
	return { target };
}

function tree(root) {
	const visit = (dir) => fs.readdirSync(dir, { withFileTypes: true })
		.sort((a, b) => a.name.localeCompare(b.name))
		.flatMap((entry) => {
			const full = path.join(dir, entry.name);
			const rel = path.relative(root, full).split(path.sep).join("/");
			if (entry.isSymbolicLink()) return [[rel, "link", fs.readlinkSync(full)]];
			if (entry.isDirectory()) return [[rel, "dir"], ...visit(full)];
			return [[rel, "file", fs.readFileSync(full).toString("base64")]];
		});
	return fs.existsSync(root) ? visit(root) : [];
}

function setupRows(stdout) {
	return stdout.split(/\r?\n/).flatMap((line) => {
		const match = /^  ([+·–✗]) (.+?) {2,}(created|updated|unchanged|skipped|problem)(?: {2,}|$)/.exec(line);
		return match ? [[match[1], match[2], match[3]]] : [];
	});
}

{
	const observations = [];
	for (const kind of ["link", "directory"]) {
		const item = fixture(`nana-project-m1-${kind}`);
		const entries = seedPaths.map((rel) => ({ rel, ...makeOdd(item.dir, rel, kind === "link" ? "link" : "directory") }));
		const result = projectRun(item);
		observations.push(result.status === 0);
		for (const entry of entries) {
			observations.push(hasRow(result.stdout, "–", entry.rel, kind === "link" ? "a symlink ->" : "a directory"));
			observations.push(kind === "link"
				? fs.lstatSync(entry.target).isSymbolicLink() && fs.readlinkSync(entry.target) === entry.linkTarget
				: fs.lstatSync(entry.target).isDirectory());
			if (kind === "link") observations.push(!fs.existsSync(path.join(path.dirname(entry.target), entry.linkTarget)));
		}
	}
	// req: R-385
	check("R-385: a dangling link or a directory at each of the seven seed paths is reported skipped naming it, with nothing written through it", observations.every(Boolean), observations.map((v, i) => `${i}:${v}`).filter((v) => v.endsWith("false")).join(", "));
}

{
	const docs = fixture("nana-project-m2-docs");
	fs.writeFileSync(path.join(docs.dir, "docs"), "mine\n");
	const docsRun = projectRun(docs);
	const pi = fixture("nana-project-m2-pi");
	fs.symlinkSync("missing-pi", path.join(pi.dir, ".pi"));
	const piRun = projectRun(pi);
	const ok = docsRun.status === 0 && piRun.status === 0
		&& hasRow(docsRun.stdout, "–", "docs/sessions/README.md", "a file at docs")
		&& hasRow(docsRun.stdout, "–", monthSeed, "a file at docs")
		&& fs.existsSync(path.join(docs.dir, "OBJECTIVE.md")) && fs.existsSync(path.join(docs.dir, ".pi", "nana-pack.json"))
		&& hasRow(piRun.stdout, "–", ".pi/nana-pack.json", "a symlink -> missing-pi at \\.pi")
		&& fs.existsSync(path.join(pi.dir, "OBJECTIVE.md")) && fs.existsSync(path.join(pi.dir, "docs", "sessions", `${month}.md`));
	// req: R-2420
	check("R-2420: a file at docs and a dangling link at .pi are reported skipped by name and the other seeds still land", ok, `${docsRun.stdout}\n---\n${piRun.stdout}\n${docsRun.stderr}${piRun.stderr}`);
}

{
	const item = fixture("nana-project-m3");
	fs.symlinkSync("missing-agents", path.join(item.dir, "AGENTS.md"));
	fs.mkdirSync(path.join(item.dir, "HANDOFF.md"));
	fs.writeFileSync(path.join(item.dir, "docs"), "mine\n");
	projectRun(item);
	const second = projectRun(item);
	const closing = second.stdout.split(/\r?\n/).find((line) => line.includes("left alone — fix by hand")) ?? "";
	const ok = second.status === 0 && !second.stdout.includes("everything was already in place")
		&& ["AGENTS.md", "HANDOFF.md", "docs/sessions/README.md", monthSeed].every((label) => closing.includes(label));
	// req: R-2421
	check("R-2421: a second run over a dangling AGENTS.md link, a directory at HANDOFF.md and a file at docs names each seed path left alone as a fix by hand instead of everything already in place", ok, second.stdout);
}

{
	const observations = [];
	const checkPaths = ["OBJECTIVE.md", "HANDOFF.md", "docs/sessions/README.md", monthSeed, "AGENTS.md", ".pi/nana-pack.json"];
	for (const rel of checkPaths) for (const kind of ["link", "directory"]) {
		const item = fixture(`nana-project-m4-${rel.replaceAll("/", "-")}-${kind}`);
		makeOdd(item.dir, rel, kind);
		const result = projectRun(item, ["--check"]);
		const label = rel === monthSeed ? "docs/sessions/YYYY-MM.md" : rel;
		observations.push(hasRow(result.stdout, "✗", label, "move or remove it by hand"));
	}
	const blocked = fixture("nana-project-m4-blocked");
	fs.writeFileSync(path.join(blocked.dir, "docs"), "mine\n");
	fs.symlinkSync("missing-pi", path.join(blocked.dir, ".pi"));
	const blockedRun = projectRun(blocked, ["--check"]);
	observations.push(hasRow(blockedRun.stdout, "✗", "docs/sessions/README.md", "a file at docs.*move or remove it by hand"));
	observations.push(hasRow(blockedRun.stdout, "✗", ".pi/nana-pack.json", "a symlink -> missing-pi at \\.pi.*move or remove it by hand"));
	const noAgents = fixture("nana-project-m4-no-agents");
	fs.symlinkSync("missing-claude", path.join(noAgents.dir, "CLAUDE.md"));
	const noAgentsRun = projectRun(noAgents, ["--check"]);
	observations.push(hasRow(noAgentsRun.stdout, "✗", "AGENTS.md", "CLAUDE\\.md.*move or remove it by hand"));
	for (const kind of ["link", "directory"]) {
		const own = fixture(`nana-project-m4-own-claude-${kind}`);
		fs.writeFileSync(path.join(own.dir, "AGENTS.md"), "# mine\n");
		makeOdd(own.dir, "CLAUDE.md", kind);
		const ownRun = projectRun(own, ["--check"]);
		observations.push(hasRow(ownRun.stdout, "✗", "CLAUDE.md", "move or remove it by hand"));
	}
	// req: R-2422
	check("R-2422: --check names the entry at each seed path or on its folder path, CLAUDE.md included, and says to move or remove it", observations.every(Boolean), observations.map((v, i) => `${i}:${v}`).filter((v) => v.endsWith("false")).join(", "));
}

{
	const own = fixture("nana-project-m5-own");
	projectRun(own);
	fs.writeFileSync(path.join(own.dir, "CLAUDE.md"), "# My Claude instructions\n");
	const ownBefore = JSON.stringify(tree(own.dir));
	const ownCheck = projectRun(own, ["--check"]);
	const ownSummary = `1 missing — fix by hand as each ✗ line says: CLAUDE.md`;

	const mixed = fixture("nana-project-m5-mixed");
	projectRun(mixed);
	fs.unlinkSync(path.join(mixed.dir, "HANDOFF.md"));
	fs.mkdirSync(path.join(mixed.dir, "HANDOFF.md"));
	fs.unlinkSync(path.join(mixed.dir, "docs", "sessions", `${month}.md`));
	const mixedBefore = JSON.stringify(tree(mixed.dir));
	const mixedCheck = projectRun(mixed, ["--check"]);
	const mixedSummary = `2 missing — fix by hand as each ✗ line says: HANDOFF.md; then run: nana-setup project ${mixed.dir} for the other 1`;

	const project = fixture("nana-project-m5-project");
	projectRun(project);
	fs.unlinkSync(path.join(project.dir, "docs", "sessions", `${month}.md`));
	const projectBefore = JSON.stringify(tree(project.dir));
	const projectCheck = projectRun(project, ["--check"]);
	const projectSummary = `1 missing — run: nana-setup project ${project.dir}`;
	const ok = ownCheck.stdout.includes(ownSummary) && !ownCheck.stdout.includes(`run: nana-setup project ${own.dir}`)
		&& /fold .* into AGENTS\.md.*@AGENTS\.md.*by hand/.test(ownCheck.stdout)
		&& mixedCheck.stdout.includes(mixedSummary) && projectCheck.stdout.includes(projectSummary)
		&& JSON.stringify(tree(own.dir)) === ownBefore && JSON.stringify(tree(mixed.dir)) === mixedBefore && JSON.stringify(tree(project.dir)) === projectBefore
		&& !fs.existsSync(path.join(mixed.dir, "docs", "sessions", `${month}.md`)) && !fs.existsSync(path.join(project.dir, "docs", "sessions", `${month}.md`));
	// req: R-2423
	check("R-2423: --check sends each ✗ that project leaves alone to a fix by hand, names nana-setup project only for the other ✗ lines and writes nothing", ok, `${ownCheck.stdout}\n---\n${mixedCheck.stdout}\n---\n${projectCheck.stdout}`);
}

{
	const item = fixture("nana-project-m6");
	const canary = path.join(item.root, "name-was-executed");
	const name = `Rel <date> <name> $& \`touch ${canary}\` $(touch ${canary})`;
	const result = projectRun(item, ["--name", name]);
	const firstLines = ["OBJECTIVE.md", "HANDOFF.md", "AGENTS.md", monthSeed]
		.map((rel) => fs.readFileSync(path.join(item.dir, ...rel.split("/")), "utf8").split(/\r?\n/, 1)[0]);
	const ok = result.status === 0 && firstLines[0] === `# Objective and current priority — ${name}`
		&& firstLines[1] === `# Handoff — ${name} frontier` && firstLines[2] === `# ${name}`
		&& firstLines[3] === `# ${name} sessions — ${month}` && !fs.existsSync(canary);
	// req: R-335
	check("R-335: a --name holding the date and name placeholders, $&, backticks and $(...) lands literally in every seeded file that carries the name, with nothing executed", ok, `${JSON.stringify(firstLines)}\n${result.stderr}`);
}

{
	const root = tmpDir(path.join(os.tmpdir(), "nana-project-m7-"));
	const item = { root, dir: path.join(root, "new-project"), home: path.join(root, "home") };
	const dry = projectRun(item, ["--dry-run"]);
	const absentAfterDryRun = !fs.existsSync(item.dir);
	const real = projectRun(item);
	const dryRows = setupRows(dry.stdout);
	const realRows = setupRows(real.stdout);
	const ok = dry.status === 0 && real.status === 0 && absentAfterDryRun
		&& new RegExp(`^  \\+ folder {2,}${escapeRe(item.dir)} {2,}would create$`, "m").test(dry.stdout)
		&& JSON.stringify(dryRows) === JSON.stringify(realRows);
	// req: R-338
	check("R-338: a dry run of a missing folder names the folder it would create, reports every row the real run then reports with the same status, and writes nothing", ok, `${JSON.stringify(dryRows)}\n${JSON.stringify(realRows)}\n${dry.stdout}\n---\n${real.stdout}`);
}

{
	const root = tmpDir(path.join(os.tmpdir(), "nana-project-m8-"));
	const parent = path.join(root, "missing-parent");
	const dir = path.join(parent, "project");
	const home = path.join(root, "home");
	const real = run(["project", dir, "--home", home]);
	const dry = run(["project", dir, "--home", home, "--dry-run"]);
	const ok = real.status === 2 && dry.status === 2 && real.stderr.includes(parent) && dry.stderr.includes(parent)
		&& !fs.existsSync(parent) && !fs.existsSync(home);
	// req: R-931
	check("R-931: project and project --dry-run on a folder whose parent is missing both abort naming the parent and create nothing", ok, `${real.status}:${real.stderr}\n${dry.status}:${dry.stderr}`);
}

console.log(`SUMMARY  PASS=${passes} FAIL=${fails} SKIP=0`);
if (fails) process.exitCode = 1;
