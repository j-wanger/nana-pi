// Gate: `nana-setup project` turns a blank folder into a nana project, never overwrites what a
// folder already has, and emits exactly the same three seeds the copier templates render.
// Every run is in a throwaway dir with a throwaway --home; nothing touches the real machine.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const repo = path.resolve(pkg, "..", "..");
const shared = path.join(repo, "templates", "_shared");

let fails = 0;
let passes = 0;
let skips = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : (extra ?? ""));
	if (ok) passes++;
	else fails++;
};
/** A skipped GATE is counted and printed loudly — a silent skip is a test that stopped testing. */
const skip = (n, why) => {
	console.log(`SKIP ${n} (${why})`);
	skips++;
};

const tmps = [];
function tmp(prefix) {
	const d = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
	tmps.push(d);
	return d;
}
/** A project dir + a home that has no knowledge index, so the refresh step reports "skipped". */
function freshProject(name = "widget-shop") {
	const root = tmp("nana-project-");
	const dir = path.join(root, name);
	fs.mkdirSync(dir, { recursive: true });
	return { dir, home: path.join(root, "home") };
}
const run = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
const read = (p) => fs.readFileSync(p, "utf8");
const today = new Date();
const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

function walk(dir) {
	const out = [];
	for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
		const p = path.join(dir, e.name);
		if (e.isSymbolicLink()) out.push([path.relative(dir, p), "link", fs.readlinkSync(p)]);
		else if (e.isDirectory()) out.push(...walk(p).map(([q, k, v]) => [path.join(e.name, q), k, v]));
		else out.push([path.relative(dir, p), "file", fs.readFileSync(p, "utf8")]);
	}
	return out;
}

/* --- 1. a blank folder gets the whole frontier -------------------------------------- */
{
	const { dir, home } = freshProject();
	const first = run(["project", dir, "--home", home]);
	check("project exits 0", first.status === 0, first.stderr);
	for (const rel of ["OBJECTIVE.md", "HANDOFF.md", "docs/sessions/README.md", `docs/sessions/${stamp.slice(0, 7)}.md`, "AGENTS.md", ".pi/nana-pack.json"]) {
		check(`created ${rel}`, fs.existsSync(path.join(dir, ...rel.split("/"))));
	}
	check("git initialized", fs.existsSync(path.join(dir, ".git")));
	check("CLAUDE.md is a RELATIVE symlink to AGENTS.md", fs.readlinkSync(path.join(dir, "CLAUDE.md")) === "AGENTS.md");
	check("AGENTS.md carries the canonical section verbatim", read(path.join(dir, "AGENTS.md")).endsWith(read(path.join(shared, "working-under-nana-pi.md"))));
	check("AGENTS.md has the empty Layout + Rules sections", /## Layout\n/.test(read(path.join(dir, "AGENTS.md"))) && /## Rules that don't move\n/.test(read(path.join(dir, "AGENTS.md"))));
	check("pack starter is an empty postEdit list", JSON.parse(read(path.join(dir, ".pi", "nana-pack.json"))).postEdit.commands.length === 0);
	check("knowledge refresh is skipped with a reason when there is no index", /knowledge index\s+skipped.*run `nana-setup install` first/.test(first.stdout), first.stdout);

	// <date> and <name> filled; the DRAFT placeholders left for the owner
	const objective = read(path.join(dir, "OBJECTIVE.md"));
	check("<name> filled from the folder basename", objective.startsWith("# Objective and current priority — widget-shop"));
	check("<date> filled with today", objective.includes(`**Objective (since ${stamp}):**`) && objective.includes(`**Current priority (since ${stamp}):**`));
	check("no <date>/<name> placeholder survives", !objective.includes("<date>") && !objective.includes("<name>"));
	check("the DRAFT lines are left to ratify", (objective.match(/DRAFT — ratify by editing this line/g) || []).length === 2);
	check("the objective hook's two lines are greppable", /^\*\*Objective \(since /m.test(objective) && /^\*\*Current priority \(since /m.test(objective));
	const handoff = read(path.join(dir, "HANDOFF.md"));
	check("HANDOFF is frontier-only with the drop rule", handoff.startsWith("# Handoff — widget-shop frontier") && /one line per live decision/.test(handoff));
	check("HANDOFF has Where things stand / Open / NEXT", /## Where things stand \(\d{4}-\d{2}-\d{2}\)/.test(handoff) && handoff.includes("## Open") && handoff.includes("## NEXT"));
	const sessions = read(path.join(dir, "docs", "sessions", "README.md"));
	check("sessions README keeps its own <headline> placeholder", sessions.includes("## YYYY-MM-DD — <headline>") && sessions.includes("YYYY-MM.md"));
	check("month file is a header only", read(path.join(dir, "docs", "sessions", `${stamp.slice(0, 7)}.md`)).split("\n").filter((l) => l.trim()).length === 2);

	// --check is green now
	check("project --check exits 0 on a seeded folder", run(["project", dir, "--check", "--home", home]).status === 0);

	// second run changes nothing
	const before = walk(dir).filter(([p]) => !p.startsWith(".git" + path.sep));
	const second = run(["project", dir, "--home", home]);
	check("second run says nothing to do", /nothing to do/.test(second.stdout), second.stdout);
	check("second run changed no bytes", JSON.stringify(walk(dir).filter(([p]) => !p.startsWith(".git" + path.sep))) === JSON.stringify(before));
}

/* --- 2. --name overrides the basename ------------------------------------------------ */
{
	const { dir, home } = freshProject("tmp-dir-name");
	run(["project", dir, "--home", home, "--name", "Ledger Desk"]);
	check("--name is used for the title", read(path.join(dir, "OBJECTIVE.md")).startsWith("# Objective and current priority — Ledger Desk"));
}

/* --- 3. nothing the folder already has is touched ------------------------------------ */
{
	const { dir, home } = freshProject();
	fs.writeFileSync(path.join(dir, "OBJECTIVE.md"), "MINE\n");
	fs.writeFileSync(path.join(dir, "AGENTS.md"), "MY AGENTS\n");
	fs.mkdirSync(path.join(dir, "docs", "sessions"), { recursive: true });
	fs.writeFileSync(path.join(dir, "docs", "sessions", "README.md"), "MY SESSIONS\n");
	const r = run(["project", dir, "--home", home]);
	check("existing OBJECTIVE.md untouched", read(path.join(dir, "OBJECTIVE.md")) === "MINE\n");
	check("existing AGENTS.md untouched", read(path.join(dir, "AGENTS.md")) === "MY AGENTS\n");
	check("existing sessions README untouched", read(path.join(dir, "docs", "sessions", "README.md")) === "MY SESSIONS\n");
	check("no CLAUDE.md written next to an AGENTS.md the project already had", !fs.existsSync(path.join(dir, "CLAUDE.md")));
	check("the missing HANDOFF.md is still seeded", read(path.join(dir, "HANDOFF.md")).startsWith("# Handoff —"));
	check("what was left alone is reported", /OBJECTIVE\.md\s+unchanged/.test(r.stdout), r.stdout);
}

/* --- 4. a CLAUDE.md-only folder keeps its one file ----------------------------------- */
{
	const { dir, home } = freshProject();
	fs.writeFileSync(path.join(dir, "CLAUDE.md"), "MY CLAUDE\n");
	run(["project", dir, "--home", home]);
	check("CLAUDE.md-only: no AGENTS.md written", !fs.existsSync(path.join(dir, "AGENTS.md")));
	check("CLAUDE.md-only: the file is untouched", read(path.join(dir, "CLAUDE.md")) === "MY CLAUDE\n");
	check("CLAUDE.md-only: --check is still green", run(["project", dir, "--check", "--home", home]).status === 0);
}

/* --- 5. an empty project postEdit block must not shadow user-scope commands ---------- */
{
	const { dir, home } = freshProject();
	fs.mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	fs.writeFileSync(path.join(home, ".pi", "agent", "nana-pack.json"), JSON.stringify({ postEdit: { commands: [{ match: "\\.py$", run: "ruff check {file}" }] } }));
	const r = run(["project", dir, "--home", home]);
	check("no project pack config written over user-scope commands", !fs.existsSync(path.join(dir, ".pi", "nana-pack.json")));
	check("and the reason is reported", /would shadow them here/.test(r.stdout), r.stdout);
}

/* --- 6. dry run writes nothing -------------------------------------------------------- */
{
	const { dir, home } = freshProject();
	const r = run(["project", dir, "--home", home, "--dry-run"]);
	check("dry run exits 0", r.status === 0, r.stderr);
	check("dry run reports what it would do", /would change/.test(r.stdout), r.stdout);
	check("dry run wrote nothing", fs.readdirSync(dir).length === 0, fs.readdirSync(dir).join(","));
	check("--check on an empty folder exits 1", run(["project", dir, "--check", "--home", home]).status === 1);
}

/* --- 7. a symlink or a directory at a seed target is PRESENT, never written through --- */
{
	const { dir, home } = freshProject();
	const victim = path.join(tmp("nana-victim-"), "not-there.md");
	fs.symlinkSync(victim, path.join(dir, "OBJECTIVE.md")); // dangling on purpose
	fs.mkdirSync(path.join(dir, "HANDOFF.md")); // a directory where a file is expected
	const r = run(["project", dir, "--home", home]);
	check("dangling symlink: exits 0", r.status === 0, r.stderr);
	check("dangling symlink: nothing written through it", !fs.existsSync(victim));
	check("dangling symlink: the link itself is untouched", fs.lstatSync(path.join(dir, "OBJECTIVE.md")).isSymbolicLink() && fs.readlinkSync(path.join(dir, "OBJECTIVE.md")) === victim);
	check("dangling symlink: reported as skipped, naming what was found", /OBJECTIVE\.md\s+skipped\s+a symlink -> .*nothing written through it/.test(r.stdout), r.stdout);
	check("directory at a seed path: still a directory", fs.lstatSync(path.join(dir, "HANDOFF.md")).isDirectory());
	check("directory at a seed path: reported as skipped", /HANDOFF\.md\s+skipped\s+a directory is there/.test(r.stdout), r.stdout);
	check("the seeds that WERE absent still landed", fs.existsSync(path.join(dir, "docs", "sessions", "README.md")));

	// ...and --check must NOT print ✓ over the thing setup refused to write: the objective
	// still cannot be read (sol r2).
	const c = run(["project", dir, "--check", "--home", home]);
	check("--check: a dangling symlink at OBJECTIVE.md reads ✗", /✗ OBJECTIVE\.md\s+a symlink -> .* is there — not a readable OBJECTIVE\.md/.test(c.stdout), c.stdout);
	check("--check: a directory at HANDOFF.md reads ✗", /✗ HANDOFF\.md\s+a directory is there — not a readable HANDOFF\.md/.test(c.stdout), c.stdout);
	check("--check: exits 1 on those", c.status === 1, String(c.status));
}

/* --- 7b. the project NAME is data: never a shell, never a regex replacement ---------- */
{
	const { dir, home } = freshProject();
	const canary = path.join(tmp("nana-canary-"), "owned");
	// Every shape that would matter if the name reached a shell ($(), ``, ;) or a regex
	// replacement ($&, $', $1) — the name only ever becomes file CONTENT.
	const nasty = `$& $' $1 $(touch ${canary}) \`touch ${canary}\` ; touch ${canary}`;
	const r = run(["project", dir, "--home", home, "--name", nasty]);
	check("nasty name: exits 0", r.status === 0, r.stderr);
	check("nasty name: nothing was executed", !fs.existsSync(canary));
	check("nasty name: written LITERALLY into the seed ($& is not a regex replacement)", read(path.join(dir, "OBJECTIVE.md")).startsWith(`# Objective and current priority — ${nasty}\n`), read(path.join(dir, "OBJECTIVE.md")).split("\n")[0]);
	check("nasty name: literal in HANDOFF.md too", read(path.join(dir, "HANDOFF.md")).startsWith(`# Handoff — ${nasty} frontier`));
	check("nasty name: literal in the AGENTS.md stub", read(path.join(dir, "AGENTS.md")).startsWith(`# ${nasty}\n`));
}

/* --- 7c. the adopt-structure fallback must pass the name as DATA, not command text ---- */
{
	// A doc test on purpose: this text IS the instruction an agent executes, and the same
	// command line has now carried a shell-injection shape once (sol r2 HIGH). Pin the shape.
	const skillFile = path.join(repo, "packages", "nana-pack", "skills", "adopt-structure", "SKILL.md");
	const skillText = read(skillFile);
	const copierLines = skillText.split("\n").filter((l) => l.includes("uvx copier"));
	check("SKILL.md: the fallback renders with a project name at all", copierLines.length >= 2, String(copierLines.length));
	check(
		"SKILL.md: every fallback command takes the name from an env var",
		copierLines.every((l) => /--data project_name=(?:"\$NANA_PROJECT_NAME"|\$env:NANA_PROJECT_NAME)(?:\s|$)/.test(l)),
		copierLines.join(" | "),
	);
	check(
		"SKILL.md: no fallback command interpolates a name placeholder into the command text",
		copierLines.every((l) => !/project_name=["']?</.test(l)),
		copierLines.join(" | "),
	);
	check("SKILL.md: says the name is data, never pasted into the command text", /name is DATA/.test(skillText) && /environment variable, never in the command\s*\n?\s*text/.test(skillText));
}

/* --- 8. --check mirrors what setup decided, never fails a deliberate state ------------ */
{
	// a. a folder inside an existing repo: setup skips the nested `git init`, so ✓ not ✗
	const outer = tmp("nana-outer-");
	spawnSync("git", ["init", outer], { encoding: "utf8" });
	const inner = path.join(outer, "sub");
	fs.mkdirSync(inner);
	const home = path.join(tmp("nana-home-"), "h");
	const setup = run(["project", inner, "--home", home]);
	check("inside a repo: no nested git init", !fs.existsSync(path.join(inner, ".git")) && /inside .* already — no nested repo created/.test(setup.stdout), setup.stdout);
	const c1 = run(["project", inner, "--check", "--home", home]);
	check("--check: a folder inside a repo reads ✓ with the reason", c1.status === 0 && /✓ git repo\s+inside .* — no nested repo, by design/.test(c1.stdout), c1.stdout);

	// b. pack config deliberately omitted because user-scope postEdit.commands exist
	const { dir, home: home2 } = freshProject();
	fs.mkdirSync(path.join(home2, ".pi", "agent"), { recursive: true });
	fs.writeFileSync(path.join(home2, ".pi", "agent", "nana-pack.json"), JSON.stringify({ postEdit: { commands: [{ match: "\\.py$", run: "ruff check {file}" }] } }));
	run(["project", dir, "--home", home2]);
	const c2 = run(["project", dir, "--check", "--home", home2]);
	check("--check: a deliberately omitted pack config reads ✓ with the reason", c2.status === 0 && /✓ \.pi\/nana-pack\.json\s+omitted on purpose/.test(c2.stdout), c2.stdout);
	check("--check: the CLAUDE.md alias reads ✓ as a symlink to AGENTS.md", /✓ CLAUDE\.md\s+-> AGENTS\.md/.test(c2.stdout), c2.stdout);
	// and it is still ✗ when it is simply missing for no reason
	const { dir: bare } = freshProject();
	const c3 = run(["project", bare, "--check", "--home", path.join(tmp("nana-home-"), "h")]);
	check("--check: a missing pack config with no reason is still ✗", c3.status === 1 && /✗ \.pi\/nana-pack\.json/.test(c3.stdout), c3.stdout);
}

/* --- 9. the knowledge refresh tells the truth: a held lock is not a rebuild ----------- */
{
	const { dir, home } = freshProject();
	const kh = path.join(home, ".pi", "agent", "nana-knowledge");
	fs.mkdirSync(kh, { recursive: true });
	fs.writeFileSync(path.join(kh, "index.db"), ""); // the refresh only runs when an index exists
	fs.writeFileSync(path.join(kh, "sources.json"), JSON.stringify({ roots: [] }));
	// A LIVE lock: the owner pid is this test process, which `process.kill(pid, 0)` proves alive,
	// so nana-knowledge's own acquireBuildLock reports "held" and the CLI exits 0 saying so.
	fs.writeFileSync(path.join(kh, "build.lock"), JSON.stringify({ pid: process.pid, at: Date.now() }));
	const r = run(["project", dir, "--home", home]);
	check("build lock held: exits 0", r.status === 0, r.stderr);
	check("build lock held: reported as skipped (build lock held)", /knowledge index\s+skipped\s+skipped \(build lock held\)/.test(r.stdout), r.stdout);
	check("build lock held: never claims a rebuild", !/knowledge index\s+unchanged/.test(r.stdout), r.stdout);
	check("build lock held: the lock is left alone", fs.existsSync(path.join(kh, "build.lock")));
}

/* --- 10. the refresh has a hard deadline: a child that ignores SIGTERM cannot hang it -- */
{
	const { dir, home } = freshProject();
	const kh = path.join(home, ".pi", "agent", "nana-knowledge");
	fs.mkdirSync(kh, { recursive: true });
	fs.writeFileSync(path.join(kh, "index.db"), "");
	// A stub "nana-knowledge" that traps SIGTERM and never finishes — the uninterruptible
	// build, in a form a test can create. It also proves the parent does not wait for it.
	const stub = path.join(kh, "stub-cli.mjs");
	fs.writeFileSync(stub, "process.on('SIGTERM', () => {});\nsetInterval(() => {}, 1000);\nconsole.log('files 1');\n");
	const t0 = Date.now();
	const r = spawnSync(process.execPath, [cli, "project", dir, "--home", home], {
		encoding: "utf8",
		timeout: 20_000,
		env: { ...process.env, NANA_SETUP_KNOWLEDGE_CLI: stub, NANA_SETUP_KNOWLEDGE_DEADLINE_MS: "400", NANA_SETUP_KNOWLEDGE_KILL_GRACE_MS: "200" },
	});
	const ms = Date.now() - t0;
	check("deadline: the command still exits 0", r.status === 0, r.stderr);
	check("deadline: reported as a timeout, not a rebuild", /knowledge index\s+skipped\s+timeout after/.test(r.stdout), r.stdout);
	check("deadline: settles instead of hanging", ms < 15_000, `${ms}ms`);
	check("deadline: the rest of the project still got seeded", fs.existsSync(path.join(dir, "OBJECTIVE.md")));
}

/* --- 11. win32: CLAUDE.md is a copy, because there is no usable symlink ---------------- */
{
	const { dir, home } = freshProject();
	const r = spawnSync(process.execPath, [cli, "project", dir, "--home", home], { encoding: "utf8", env: { ...process.env, NANA_SETUP_PLATFORM: "win32" } });
	check("win32: project exits 0", r.status === 0, r.stderr);
	check("win32: CLAUDE.md is a regular file, not a link", fs.lstatSync(path.join(dir, "CLAUDE.md")).isFile());
	check("win32: CLAUDE.md is byte-identical to AGENTS.md", read(path.join(dir, "CLAUDE.md")) === read(path.join(dir, "AGENTS.md")));
	check("win32: the reason is reported", /win32: no usable symlink/.test(r.stdout), r.stdout);
}

/* --- 12. the copier templates emit the same three seeds ------------------------------ */
{
	const uvx = spawnSync("uvx", ["--version"], { encoding: "utf8" });
	if (uvx.error || uvx.status !== 0) {
		// These renders ARE the invariant (byte equality with _shared, `_skip_if_exists`), so a
		// machine without uvx must say so loudly — and CI sets NANA_SETUP_REQUIRE_COPIER=1 to
		// make the absence a failure instead of a shrug.
		if (process.env.NANA_SETUP_REQUIRE_COPIER === "1") check("copier renders (NANA_SETUP_REQUIRE_COPIER=1)", false, "uvx not found — install uv, or unset NANA_SETUP_REQUIRE_COPIER");
		else skip("copier renders", "uvx not found");
	} else {
		const dest = tmp("nana-render-");
		const render = (extra, out) =>
			spawnSync("uvx", ["copier", "copy", "--defaults", "--vcs-ref=HEAD", "--data", "project_name=_t", ...extra, repo, out], {
				encoding: "utf8",
				cwd: repo,
				timeout: 5 * 60_000,
			});
		// --vcs-ref=HEAD renders the working tree, so uncommitted template edits count; copier
		// prints a "dirty template" warning for exactly that reason, and it is expected here.
		for (const language of ["python", "typescript"]) {
			const out = path.join(dest, language);
			const r = render(["--data", `language=${language}`], out);
			check(`${language}: copier render succeeds`, r.status === 0, (r.stderr || "").trim().split("\n").slice(-3).join(" "));
			for (const rel of ["OBJECTIVE.md", "HANDOFF.md", "docs/sessions/README.md"]) {
				const want = read(path.join(shared, ...rel.split("/"))).split("<name>").join("_t");
				const got = fs.existsSync(path.join(out, ...rel.split("/"))) ? read(path.join(out, ...rel.split("/"))) : null;
				check(`${language}: ${rel} is byte-equal to templates/_shared (after <name>)`, got === want, got === null ? "not rendered" : "differs");
			}
			check(`${language}: <date> is left literal for the skill / nana-setup to fill`, read(path.join(out, "OBJECTIVE.md")).includes("(since <date>)"));
			// Pins the adopt-structure fallback rule: copier bakes <name> in at RENDER time, so a
			// throwaway rendered with a dummy name would seed that dummy into the adopted project.
			const rendered = read(path.join(out, "OBJECTIVE.md"));
			check(`${language}: the render bakes in project_name (fallback must render the REAL name)`, rendered.startsWith("# Objective and current priority — _t") && !rendered.includes("<name>"));
		}
		// adopt mode still emits them, and never over a file the project already has
		const adopt = path.join(dest, "adopt");
		fs.mkdirSync(adopt, { recursive: true });
		fs.writeFileSync(path.join(adopt, "OBJECTIVE.md"), "MINE\n");
		const r = render(["--data", "language=python", "--data", "adopt=true"], adopt);
		check("adopt: copier render succeeds", r.status === 0, (r.stderr || "").trim().split("\n").slice(-3).join(" "));
		check("adopt: a pre-existing OBJECTIVE.md is NOT overwritten", read(path.join(adopt, "OBJECTIVE.md")) === "MINE\n");
		check("adopt: the missing HANDOFF.md is still emitted", fs.existsSync(path.join(adopt, "HANDOFF.md")));
		check("adopt: docs/sessions/README.md is still emitted", fs.existsSync(path.join(adopt, "docs", "sessions", "README.md")));
	}
}

for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
console.log(`\nSUMMARY  PASS=${passes}  FAIL=${fails}  SKIP=${skips}`);
process.exit(fails);
