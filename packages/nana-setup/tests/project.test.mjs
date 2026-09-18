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
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : (extra ?? ""));
	if (!ok) fails++;
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
	check("project --check exits 0 on a seeded folder", run(["project", dir, "--check"]).status === 0);

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
	check("CLAUDE.md-only: --check is still green", run(["project", dir, "--check"]).status === 0);
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
	check("--check on an empty folder exits 1", run(["project", dir, "--check"]).status === 1);
}

/* --- 7. win32: CLAUDE.md is a copy, because there is no usable symlink ---------------- */
{
	const { dir, home } = freshProject();
	const r = spawnSync(process.execPath, [cli, "project", dir, "--home", home], { encoding: "utf8", env: { ...process.env, NANA_SETUP_PLATFORM: "win32" } });
	check("win32: project exits 0", r.status === 0, r.stderr);
	check("win32: CLAUDE.md is a regular file, not a link", fs.lstatSync(path.join(dir, "CLAUDE.md")).isFile());
	check("win32: CLAUDE.md is byte-identical to AGENTS.md", read(path.join(dir, "CLAUDE.md")) === read(path.join(dir, "AGENTS.md")));
	check("win32: the reason is reported", /win32: no usable symlink/.test(r.stdout), r.stdout);
}

/* --- 8. the copier templates emit the same three seeds ------------------------------- */
{
	const uvx = spawnSync("uvx", ["--version"], { encoding: "utf8" });
	if (uvx.error || uvx.status !== 0) {
		console.log("SKIP copier render checks — uvx is not available on this machine");
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
process.exit(fails);
