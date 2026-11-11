/**
 * @module packages/nana-setup/tests/project.test.mjs
 * @purpose Pins that `nana-setup project` turns a blank folder into a nana project, never overwrites what a folder already has, and emits the same seeds the copier templates render
 * @inputs bin/nana-setup.mjs, the shared templates, and throwaway target dirs with a throwaway --home
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway project dirs, seeds, symlinks, a throwaway home), process (spawns the setup CLI and git)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: `nana-setup project` turns a blank folder into a nana project, never overwrites what a
// folder already has, and emits exactly the same three seeds the copier templates render.
// Every run is in a throwaway dir with a throwaway --home; nothing touches the real machine.
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnNpmRoot } from "../lib/npm-root.mjs";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const repo = path.resolve(pkg, "..", "..");
const shared = path.join(repo, "templates", "_shared");
const { CLAUDE_IMPORT } = await import(new URL("../lib/project.mjs", import.meta.url).href);

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
	const d = tmpDir(path.join(os.tmpdir(), prefix));
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
	for (const rel of ["OBJECTIVE.md", "HANDOFF.md", "docs/sessions/README.md", `docs/sessions/${stamp.slice(0, 7)}.md`, "AGENTS.md"]) {
		// req: R-327
		check(`created ${rel}`, fs.existsSync(path.join(dir, ...rel.split("/"))));
	}
	check("git initialized", fs.existsSync(path.join(dir, ".git")));
	// req: R-329
	check("CLAUDE.md is a regular file holding the one-line import @AGENTS.md", fs.lstatSync(path.join(dir, "CLAUDE.md")).isFile() && !fs.lstatSync(path.join(dir, "CLAUDE.md")).isSymbolicLink() && read(path.join(dir, "CLAUDE.md")) === CLAUDE_IMPORT);
	// req: R-329
	check("AGENTS.md carries the canonical section verbatim", read(path.join(dir, "AGENTS.md")).includes(read(path.join(shared, "working-under-nana-pi.md"))));
	check("AGENTS.md has the empty Layout + Rules sections", /## Layout\n/.test(read(path.join(dir, "AGENTS.md"))) && /## Rules that don't move\n/.test(read(path.join(dir, "AGENTS.md"))));
	// req: R-4013
	check("knowledge refresh is skipped with a reason when there is no index", /knowledge index\s+skipped.*run `nana-setup install` first/.test(first.stdout), first.stdout);

	// <date> and <name> filled; the DRAFT placeholders left for the owner
	const objective = read(path.join(dir, "OBJECTIVE.md"));
	// req: R-327
	check("<name> filled from the folder basename", objective.startsWith("# Objective and current priority — widget-shop"));
	// req: R-327
	check("<date> filled with today", objective.includes(`**Objective (since ${stamp}):**`) && objective.includes(`**Current priority (since ${stamp}):**`));
	// req: R-327
	check("no <date>/<name> placeholder survives", !objective.includes("<date>") && !objective.includes("<name>"));
	// req: R-327
	check("the DRAFT lines are left to ratify", (objective.match(/DRAFT — ratify by editing this line/g) || []).length === 2);
	// req: R-327
	check("month file is a header only", read(path.join(dir, "docs", "sessions", `${stamp.slice(0, 7)}.md`)).split("\n").filter((l) => l.trim()).length === 2);

	// The seeded empty checker set and undecided trust are explicit warnings.
	const seededCheck = run(["project", dir, "--check", "--home", home]);
	check("project --check accepts defaults without config", seededCheck.status === 0 && !/post-edit|project trust/.test(seededCheck.stdout), seededCheck.stdout);
	check("--check summarizes healthy defaults", /all good/.test(seededCheck.stdout), seededCheck.stdout);
	const currentMonth = path.join(dir, "docs", "sessions", `${stamp.slice(0, 7)}.md`);
	fs.unlinkSync(currentMonth);
	const olderMonth = path.join(dir, "docs", "sessions", "2001-01.md");
	fs.writeFileSync(olderMonth, "# historical log\n");
	const oldLogCheck = run(["project", dir, "--check", "--home", home]);
	// req: R-395
	check("project --check accepts an existing prior-month YYYY-MM log", oldLogCheck.status === 0 && /✓ docs\/sessions\/YYYY-MM\.md\s+2001-01\.md/.test(oldLogCheck.stdout) && !/✗ docs\/sessions\//.test(oldLogCheck.stdout), oldLogCheck.stdout);
	fs.unlinkSync(olderMonth);
	const impossibleMonth = path.join(dir, "docs", "sessions", "2026-99.md");
	fs.writeFileSync(impossibleMonth, "# impossible month\n");
	const invalidMonthCheck = run(["project", dir, "--check", "--home", home]);
	// req: R-395
	check("project --check rejects an impossible month filename", invalidMonthCheck.status === 1 && /✗ docs\/sessions\/YYYY-MM\.md/.test(invalidMonthCheck.stdout), invalidMonthCheck.stdout);
	fs.unlinkSync(impossibleMonth);
	fs.writeFileSync(currentMonth, "# restored current log\n");

	// second run changes nothing
	const before = walk(dir).filter(([p]) => !p.startsWith(".git" + path.sep));
	const second = run(["project", dir, "--home", home]);
	check("second run says nothing to do", /nothing to do/.test(second.stdout), second.stdout);
	// req: R-334
	check("second run changed no bytes", JSON.stringify(walk(dir).filter(([p]) => !p.startsWith(".git" + path.sep))) === JSON.stringify(before));
}

/* --- 3. nothing the folder already has is touched ------------------------------------ */
{
	const { dir, home } = freshProject();
	fs.writeFileSync(path.join(dir, "OBJECTIVE.md"), "MINE\n");
	fs.writeFileSync(path.join(dir, "AGENTS.md"), "MY AGENTS\n");
	fs.mkdirSync(path.join(dir, "docs", "sessions"), { recursive: true });
	fs.writeFileSync(path.join(dir, "docs", "sessions", "README.md"), "MY SESSIONS\n");
	const r = run(["project", dir, "--home", home]);
	// req: R-334
	check("existing OBJECTIVE.md untouched", read(path.join(dir, "OBJECTIVE.md")) === "MINE\n");
	check("existing AGENTS.md untouched", read(path.join(dir, "AGENTS.md")) === "MY AGENTS\n");
	check("existing sessions README untouched", read(path.join(dir, "docs", "sessions", "README.md")) === "MY SESSIONS\n");
	check("no CLAUDE.md written next to an AGENTS.md the project already had", !fs.existsSync(path.join(dir, "CLAUDE.md")));
	check("the missing HANDOFF.md is still seeded", read(path.join(dir, "HANDOFF.md")).startsWith("# Handoff —"));
	// req: R-334
	check("what was left alone is reported", /OBJECTIVE\.md\s+unchanged/.test(r.stdout), r.stdout);
}

/* --- 4. a CLAUDE.md-only folder keeps its one file ----------------------------------- */
{
	const { dir, home } = freshProject();
	fs.writeFileSync(path.join(dir, "CLAUDE.md"), "MY CLAUDE\n");
	run(["project", dir, "--home", home]);
	// req: R-329
	check("CLAUDE.md-only: no AGENTS.md written", !fs.existsSync(path.join(dir, "AGENTS.md")));
	check("CLAUDE.md-only: the file is untouched", read(path.join(dir, "CLAUDE.md")) === "MY CLAUDE\n");
	const claudeCheck = run(["project", dir, "--check", "--home", home]);
	check("CLAUDE.md-only: --check keeps the navigation file healthy", claudeCheck.status === 0 && /✓ AGENTS\.md\s+CLAUDE\.md/.test(claudeCheck.stdout));
}

/* --- 7. a symlink or a directory at a seed target is PRESENT, never written through --- */
{
	const { dir, home } = freshProject();
	const victim = path.join(tmp("nana-victim-"), "not-there.md");
	fs.symlinkSync(victim, path.join(dir, "OBJECTIVE.md")); // dangling on purpose
	fs.mkdirSync(path.join(dir, "HANDOFF.md")); // a directory where a file is expected
	const r = run(["project", dir, "--home", home]);

	fs.mkdirSync(path.join(dir, '.pi'), { recursive: true });
	fs.writeFileSync(path.join(dir, '.pi/nana-pack.json'), '{}');
	// req: R-674
	check("--check warns when project config has no affirmative trust decision", /! project trust.*nana-setup trust/.test(run(["project", dir, "--check", "--home", home]).stdout));
	const npmRoot = spawnNpmRoot().stdout.trim();
	const { ProjectTrustStore } = await import(pathToFileURL(path.join(npmRoot, "@earendil-works", "pi-coding-agent", "dist", "core", "trust-manager.js")).href);
	new ProjectTrustStore(path.join(home, ".pi", "agent")).set(dir, true);
	const trustCheck = spawnSync(process.execPath, [cli, "project", dir, "--check", "--home", home], { encoding: "utf8", env: { ...process.env, PI_CODING_AGENT_DIR: path.join(home, "different-agent") } });
	// req: R-674
	check("--check reads trust from its explicit layout without rewriting process environment", /✓ project trust.*affirmative/.test(trustCheck.stdout), trustCheck.stdout);

	// ...and --check must NOT print ✓ over the thing setup refused to write: the objective
	// still cannot be read (sol r2).
	const c = run(["project", dir, "--check", "--home", home]);
	// req: R-337
	check("--check: exits 1 on those", c.status === 1, String(c.status));
}

/* --- 7c. the adopt-structure fallback must pass the name as DATA, not command text ---- */
{
	// A doc test on purpose: this text IS the instruction an agent executes, and the same
	// command line has now carried a shell-injection shape once (sol r2 HIGH). Pin the shape.
	const skillFile = path.join(repo, "packages", "nana-pack", "skills", "adopt-structure", "SKILL.md");
	const skillText = read(skillFile);
	const copierLines = skillText.split("\n").filter((l) => l.includes("uvx copier"));
	check("SKILL.md: the fallback renders with a project name at all", copierLines.length >= 2, String(copierLines.length));
// req: R-929
	check("SKILL.md: every fallback command takes the name from an env var",
		copierLines.every((l) => /--data project_name=(?:"\$NANA_PROJECT_NAME"|\$env:NANA_PROJECT_NAME)(?:\s|$)/.test(l)),
		copierLines.join(" | "),
	);
// req: R-929
	check("SKILL.md: no fallback command interpolates a name placeholder into the command text",
		copierLines.every((l) => !/project_name=["']?</.test(l)),
		copierLines.join(" | "),
	);
// req: R-929
	check("SKILL.md: says the name is data, never pasted into the command text", /name is DATA/.test(skillText) && /environment variable, never in the command\s*\n?\s*text/.test(skillText));
 // req: R-591
 check("SKILL.md: names the skill-relative canonical shared source and it resolves", (skillText.match(/\.\.\/\.\.\/\.\.\/\.\.\/templates\/_shared\//g) ?? []).length >= 4 && fs.existsSync(path.resolve(path.dirname(skillFile), "../../../../templates/_shared/working-under-nana-pi.md")) && /Only when this canonical path is absent on\s+disk may you render a throwaway scaffold/.test(skillText));
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
// req: R-928
	check("inside a repo: no nested git init", !fs.existsSync(path.join(inner, ".git")) && /inside .* already — no nested repo created/.test(setup.stdout), setup.stdout);
	const c1 = run(["project", inner, "--check", "--home", home]);
	// req: R-336
	check("--check: a folder inside a repo reads ✓ with the reason", c1.status === 0 && /✓ git repo\s+inside .* — no nested repo, by design/.test(c1.stdout) && !/post-edit commands/.test(c1.stdout), c1.stdout);

	// b. pack config deliberately omitted because user-scope postEdit.commands exist
	const { dir, home: home2 } = freshProject();
	fs.mkdirSync(path.join(home2, ".pi", "agent"), { recursive: true });
	fs.writeFileSync(path.join(home2, ".pi", "agent", "nana-pack.json"), JSON.stringify({ postEdit: { commands: [{ match: "\\.py$", run: "ruff check {file}" }] } }));
	run(["project", dir, "--home", home2]);
	const c2 = run(["project", dir, "--check", "--home", home2]);
	// req: R-336
	check("--check: a deliberately omitted pack config reads ✓ with the reason", c2.status === 0 && /✓ \.pi\/nana-pack\.json\s+not needed/.test(c2.stdout), c2.stdout);
	check("--check: the CLAUDE.md import reads ✓", /✓ CLAUDE\.md\s+the one-line import @AGENTS\.md/.test(c2.stdout), c2.stdout);

	// ...and ONLY when it resolves to THIS project's AGENTS.md (sol r3). Three bad shapes:
	const claude = path.join(dir, "CLAUDE.md");
	const foreign = path.join(tmp("nana-foreign-"), "AGENTS.md");
	fs.writeFileSync(foreign, "# someone else's project\n");
	for (const [shape, target] of [
		["dangling", "AGENTS.md.gone"],
		["a link into a missing folder", path.join("missing", "AGENTS.md")], // native separator: fs.readlinkSync echoes it back on win32 (backslash), not the POSIX literal
		["a link to another project's AGENTS.md", foreign],
	]) {
		fs.unlinkSync(claude);
		fs.symlinkSync(target, claude);
		const bad = run(["project", dir, "--check", "--home", home2]);
		const dangling = shape !== "a link to another project's AGENTS.md";
// req: R-930
		check(`--check: CLAUDE.md as ${shape} reads ✗ naming the target`,
			bad.status === 1 && new RegExp(`✗ CLAUDE\\.md\\s+a symlink -> ${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} — ${dangling ? "dangling" : "not this project's AGENTS\\.md"}`).test(bad.stdout),
			`${bad.status} ${bad.stdout}`,
		);
	}
	// restored to the healthy shape, it is ✓ again
	fs.unlinkSync(claude);
	fs.symlinkSync("AGENTS.md", claude);
	const good = run(["project", dir, "--check", "--home", home2]);
// req: R-930
	check("--check: CLAUDE.md -> AGENTS.md resolves to this project and reads ✓", good.status === 0 && /✓ CLAUDE\.md\s+-> AGENTS\.md/.test(good.stdout), good.stdout);
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
	// req: R-4013
	check("build lock held: reported as skipped (build lock held)", /knowledge index\s+skipped\s+skipped \(build lock held\)/.test(r.stdout), r.stdout);
	// req: R-4013
	check("build lock held: never claims a rebuild", !/knowledge index\s+unchanged/.test(r.stdout), r.stdout);
	// req: R-4014
	check("build lock held: the lock is left alone", fs.existsSync(path.join(kh, "build.lock")));
}

/* --- 11. CLAUDE.md is the one-line import, on every platform ------------------------- */
{
	const { dir, home } = freshProject();
	const r = spawnSync(process.execPath, [cli, "project", dir, "--home", home], { encoding: "utf8" });

	const { dir: winDir, home: winHome } = freshProject();
	const winR = spawnSync(process.execPath, [cli, "project", winDir, "--home", winHome], { encoding: "utf8", env: { ...process.env, NANA_SETUP_PLATFORM: "win32" } });
	check("win32 (forced): project exits 0", winR.status === 0, winR.stderr);
	check("win32 (forced): CLAUDE.md is a regular file, not a link", fs.lstatSync(path.join(winDir, "CLAUDE.md")).isFile() && !fs.lstatSync(path.join(winDir, "CLAUDE.md")).isSymbolicLink());
	// req: R-1311
	check("R-1311: project writes a new project's CLAUDE.md as the one-line import @AGENTS.md, on the host platform and with win32 forced", read(path.join(winDir, "CLAUDE.md")) === CLAUDE_IMPORT && read(path.join(winDir, "CLAUDE.md")) === read(path.join(dir, "CLAUDE.md")), `win32=${JSON.stringify(read(path.join(winDir, "CLAUDE.md")))} host=${JSON.stringify(read(path.join(dir, "CLAUDE.md")))}`);
}

/* --- 11b. nana-pi's own committed CLAUDE.md is a regular file holding the import -------- */
{
	const mode = spawnSync("git", ["ls-files", "-s", "CLAUDE.md"], { cwd: repo, encoding: "utf8" }).stdout.trim();
	const ownContent = read(path.join(repo, "CLAUDE.md")).replace(/\r\n/g, "\n");
	// req: R-1310
	check("R-1310: nana-pi's committed CLAUDE.md is a regular file holding the one-line import @AGENTS.md", mode.startsWith("100644 ") && ownContent === CLAUDE_IMPORT, ownContent);
}

/* --- 11c. --check fails the AGENTS.md placeholder; a refresh replaces it, never a link -- */
{
	const { dir, home } = freshProject();
	run(["project", dir, "--home", home]); // AGENTS.md + the healthy CLAUDE.md import
	const claude = path.join(dir, "CLAUDE.md");
	const placeholder = "AGENTS.md\n"; // the 9-byte placeholder text, plus the optional trailing newline, that a Windows checkout of a committed symlink produces
	fs.writeFileSync(claude, placeholder);
	const placeholderCheck = run(["project", dir, "--check", "--home", home]);
	check("--check: the AGENTS.md placeholder reads ✗", placeholderCheck.status === 1 && /✗ CLAUDE\.md\s+holds the AGENTS\.md placeholder text/.test(placeholderCheck.stdout), placeholderCheck.stdout);

	const refresh = run(["project", dir, "--home", home]);
	// req: R-1312
	check("R-1312: project --check fails a CLAUDE.md holding the AGENTS.md placeholder text and passes the import file and a link, and a refresh replaces the placeholder and leaves a link untouched", read(claude) === CLAUDE_IMPORT, `after refresh: ${JSON.stringify(read(claude))} — ${refresh.stdout}`);

	// a link is accepted by --check, and a refresh never writes through it
	fs.unlinkSync(claude);
	fs.symlinkSync("AGENTS.md", claude);
	const linkCheck = run(["project", dir, "--check", "--home", home]);
	check("--check: an existing link to AGENTS.md still reads ✓", /✓ CLAUDE\.md\s+-> AGENTS\.md/.test(linkCheck.stdout), linkCheck.stdout);
	run(["project", dir, "--home", home]); // a refresh run must leave a healthy link alone
	check("a refresh never writes through a link", fs.lstatSync(claude).isSymbolicLink() && fs.readlinkSync(claude) === "AGENTS.md");
}

/* --- 12. the copier templates emit the same three seeds ------------------------------ */
{
	const uvx = spawnSync("uvx", ["--version"], { encoding: "utf8" });
	if (uvx.error || uvx.status !== 0) {
		// These renders ARE the invariant (byte equality with _shared, `_skip_if_exists`), so a
		// machine without uvx must say so loudly — and CI sets NANA_TEST_REQUIRE_COPIER=1 to
		// make the absence a failure instead of a shrug.
		if (process.env.NANA_TEST_REQUIRE_COPIER === "1") check("copier renders (NANA_TEST_REQUIRE_COPIER=1)", false, "uvx not found — install uv, or unset NANA_TEST_REQUIRE_COPIER");
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
				// req: R-339
				check(`${language}: ${rel} is byte-equal to templates/_shared (after <name>)`, got === want, got === null ? "not rendered" : "differs");
			}
			// req: R-339
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
		// req: R-339
		check("adopt: a pre-existing OBJECTIVE.md is NOT overwritten", read(path.join(adopt, "OBJECTIVE.md")) === "MINE\n");
		check("adopt: the missing HANDOFF.md is still emitted", fs.existsSync(path.join(adopt, "HANDOFF.md")));
		check("adopt: docs/sessions/README.md is still emitted", fs.existsSync(path.join(adopt, "docs", "sessions", "README.md")));
	}
}

for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
console.log(`\nSUMMARY  PASS=${passes}  FAIL=${fails}  SKIP=${skips}`);
process.exit(fails);
