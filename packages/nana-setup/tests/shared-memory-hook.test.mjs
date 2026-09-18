// Gate: the shared-memory SessionStart hook self-heals. It runs in EVERY session in EVERY repo,
// so it must (a) never print a broken session into existence — fail-open, and (b) create this
// project's memory dir + `shared` symlink itself, which is why the installer has no per-project
// step at all. The real bash script is executed here with HOME and CLAUDE_PROJECT_DIR overridden.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const hook = path.join(pkg, "claude", "hooks", "nana-shared-memory.sh");
const { projectKey } = await import(new URL("../lib/project-key.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const tmps = [];
function freshHome({ withIndex = true } = {}) {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "nana-shared-"));
	tmps.push(td);
	if (withIndex) {
		const shared = path.join(td, ".claude", "nana-memory", "shared");
		fs.mkdirSync(shared, { recursive: true });
		fs.writeFileSync(path.join(shared, "MEMORY.md"), "# Shared memory (user · feedback · reference)\n\nBlurb.\n\n- [One](one.md) — the first rule\n- [Two](two.md) — the second rule\n");
	}
	return td;
}
const run = (home, env = {}, stdin = "") =>
	spawnSync("bash", [hook], { encoding: "utf8", input: stdin, env: { PATH: process.env.PATH, HOME: home, ...env } });

/* --- 1. fail-open when there is no shared index ---------------------------------------- */
{
	const home = freshHome({ withIndex: false });
	const r = run(home, { CLAUDE_PROJECT_DIR: "/Users/x/repo" });
	check("no index: exit 0", r.status === 0);
	check("no index: prints nothing", r.stdout === "");
	check("no index: creates nothing", !fs.existsSync(path.join(home, ".claude", "projects")));
}

/* --- 2. self-heals a missing memory dir AND symlink ------------------------------------ */
{
	const home = freshHome();
	const project = "/Users/x/brand-new-repo";
	const r = run(home, { CLAUDE_PROJECT_DIR: project });
	const mem = path.join(home, ".claude", "projects", projectKey(project), "memory");
	check("self-heal: exit 0", r.status === 0, r.stderr);
	check("self-heal: memory dir created at the derived key", fs.existsSync(mem), mem);
	const link = path.join(mem, "shared");
	check("self-heal: `shared` is a symlink", fs.lstatSync(link).isSymbolicLink());
	check("self-heal: it points at the shared dir", fs.realpathSync(link) === fs.realpathSync(path.join(home, ".claude", "nana-memory", "shared")));
	check("self-heal: prints the index header", r.stdout.includes("[nana:shared-memory]"));
	check("self-heal: prints the entries", r.stdout.includes("- [One](one.md)") && r.stdout.includes("- [Two](two.md)"));
	check("self-heal: prints nothing but header + entries", r.stdout.trim().split("\n").length === 3);

	// running it again changes nothing
	const before = fs.readlinkSync(link);
	const again = run(home, { CLAUDE_PROJECT_DIR: project });
	check("second run: exit 0", again.status === 0);
	check("second run: link unchanged", fs.readlinkSync(link) === before);
	check("second run: no duplicate entries in the memory dir", fs.readdirSync(mem).length === 1);
}

/* --- 3. the exact branch: transcript_path names the project dir ------------------------ */
{
	const home = freshHome();
	const exact = path.join(home, ".claude", "projects", "-Users-x-weird-%C3%A9-path");
	fs.mkdirSync(exact, { recursive: true });
	const stdin = JSON.stringify({ session_id: "s1", transcript_path: path.join(exact, "abc.jsonl"), cwd: "/elsewhere", hook_event_name: "SessionStart" });
	const r = run(home, { CLAUDE_PROJECT_DIR: "/Users/x/some-other-guess" }, stdin);
	check("transcript_path: exit 0", r.status === 0, r.stderr);
	check("transcript_path: links the dir the harness named", fs.lstatSync(path.join(exact, "memory", "shared")).isSymbolicLink());
	check("transcript_path: does not use the derived key", !fs.existsSync(path.join(home, ".claude", "projects", projectKey("/Users/x/some-other-guess"))));
}

/* --- 4. a transcript_path outside the projects dir is ignored (subagent transcripts) ---- */
{
	const home = freshHome();
	const project = "/Users/x/fallback-repo";
	const stdin = JSON.stringify({ transcript_path: "/var/folders/zz/agents/sub/abc.jsonl" });
	const r = run(home, { CLAUDE_PROJECT_DIR: project }, stdin);
	check("foreign transcript_path: falls back to the derived key", fs.existsSync(path.join(home, ".claude", "projects", projectKey(project), "memory", "shared")));
	check("foreign transcript_path: exit 0", r.status === 0);
}

/* --- 5. does not disturb an existing `shared` entry ------------------------------------ */
{
	const home = freshHome();
	const project = "/Users/x/has-own-shared";
	const mem = path.join(home, ".claude", "projects", projectKey(project), "memory");
	fs.mkdirSync(path.join(mem, "shared"), { recursive: true });
	fs.writeFileSync(path.join(mem, "shared", "mine.md"), "mine\n");
	const r = run(home, { CLAUDE_PROJECT_DIR: project });
	check("existing shared/: exit 0", r.status === 0, r.stderr);
	check("existing shared/: left as a real directory", fs.lstatSync(path.join(mem, "shared")).isDirectory() && !fs.lstatSync(path.join(mem, "shared")).isSymbolicLink());
	check("existing shared/: contents untouched", fs.readFileSync(path.join(mem, "shared", "mine.md"), "utf8") === "mine\n");
}

/* --- 6. no CLAUDE_PROJECT_DIR: falls back to the cwd ------------------------------------ */
{
	const home = freshHome();
	const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "nana-cwd-"));
	tmps.push(cwd);
	const r = spawnSync("bash", [hook], { encoding: "utf8", input: "", cwd, env: { PATH: process.env.PATH, HOME: home } });
	check("no CLAUDE_PROJECT_DIR: uses the cwd", fs.existsSync(path.join(home, ".claude", "projects", projectKey(fs.realpathSync(cwd)), "memory", "shared")) || fs.existsSync(path.join(home, ".claude", "projects", projectKey(cwd), "memory", "shared")));
	check("no CLAUDE_PROJECT_DIR: exit 0", r.status === 0);
}

/* --- 7. over-200-character keys: reproduce the hash, never guess by pattern ------------- */
{
	// No project dir on this machine is anywhere near 200 chars (the longest is 84), so the
	// expectation comes from the CLI's own rule — key.slice(0,200) + "-" + abs(hash32(path)).toString(36)
	// — and is pinned here against the JS reference in lib/project-key.mjs.
	const home = freshHome();
	const longs = [
		"/Users/x/" + "a".repeat(250),
		"/Users/x/deep/" + "b".repeat(190) + "/x_y-z.42",
		"/tmp/" + "Mixed-Case_9/".repeat(30) + "end",
	];
	for (const project of longs) {
		const r = run(home, { CLAUDE_PROJECT_DIR: project });
		const want = path.join(home, ".claude", "projects", projectKey(project), "memory", "shared");
		check(`long path: the hook derives the same key as the CLI rule (…${projectKey(project).slice(-12)})`, fs.lstatSync(want).isSymbolicLink(), r.stdout + r.stderr);
	}
	const made = fs.readdirSync(path.join(home, ".claude", "projects"));
	check("long path: exactly one directory per project, no extras", made.length === longs.length, made.join(" "));
}

/* --- 8. a sibling that shares the first 200 characters is NEVER touched ------------------ */
{
	const home = freshHome();
	const a = "/Users/x/" + "z".repeat(250) + "/project-a";
	const b = "/Users/x/" + "z".repeat(250) + "/project-b";
	// only B's directory exists; a session for A must not adopt it
	const bDir = path.join(home, ".claude", "projects", projectKey(b), "memory");
	fs.mkdirSync(bDir, { recursive: true });
	check("precondition: the two keys share their first 200 chars", projectKey(a).slice(0, 200) === projectKey(b).slice(0, 200));
	const r = run(home, { CLAUDE_PROJECT_DIR: a });
	check("shared prefix: exit 0", r.status === 0, r.stderr);
	check("shared prefix: project B's memory dir was NOT linked", !fs.existsSync(path.join(bDir, "shared")));
	check("shared prefix: project A got its own dir", fs.lstatSync(path.join(home, ".claude", "projects", projectKey(a), "memory", "shared")).isSymbolicLink());
}

/* --- 9. a non-ASCII path: say it skipped rather than guess ------------------------------- */
{
	// bash works in bytes, the harness in UTF-16 code units, so a derived key would be a
	// DIFFERENT (stray) directory. Such a session still heals through transcript_path.
	const home = freshHome();
	const short = "/Users/x/café-repo";
	const rs = run(home, { CLAUDE_PROJECT_DIR: short });
	check("non-ASCII short path: exit 0", rs.status === 0);
	check("non-ASCII short path: skipped, nothing created", /self-heal skipped/.test(rs.stdout) && !fs.existsSync(path.join(home, ".claude", "projects")));
	const exact = path.join(home, ".claude", "projects", "-Users-x-caf--repo");
	fs.mkdirSync(exact, { recursive: true });
	const rt = run(home, { CLAUDE_PROJECT_DIR: short }, JSON.stringify({ transcript_path: path.join(exact, "s.jsonl") }));
	check("non-ASCII short path: transcript_path still heals it", fs.lstatSync(path.join(exact, "memory", "shared")).isSymbolicLink(), rt.stdout);
	fs.rmSync(path.join(home, ".claude", "projects"), { recursive: true, force: true });
	const project = "/Users/x/" + "é".repeat(250);
	const r = run(home, { CLAUDE_PROJECT_DIR: project });
	check("non-ASCII long path: exit 0 (fail-open)", r.status === 0, r.stderr);
	check("non-ASCII long path: the index is still printed", r.stdout.includes("- [One](one.md)"));
	check("non-ASCII long path: it says the self-heal skipped", /self-heal skipped/.test(r.stdout), r.stdout);
	check("non-ASCII long path: nothing was created", !fs.existsSync(path.join(home, ".claude", "projects")), fs.existsSync(path.join(home, ".claude", "projects")) ? fs.readdirSync(path.join(home, ".claude", "projects")).join(" ") : "");
}

/* --- 10. CLAUDE_CONFIG_DIR is honoured --------------------------------------------------- */
{
	const home = freshHome({ withIndex: false });
	const cfg = path.join(home, "alt-claude");
	fs.mkdirSync(path.join(cfg, "nana-memory", "shared"), { recursive: true });
	fs.writeFileSync(path.join(cfg, "nana-memory", "shared", "MEMORY.md"), "# Shared\n\n- [A](a.md) — a\n");
	const project = "/Users/x/alt-config-repo";
	const r = run(home, { CLAUDE_PROJECT_DIR: project, CLAUDE_CONFIG_DIR: cfg });
	check("CLAUDE_CONFIG_DIR: prints from the alternate config dir", r.stdout.includes("- [A](a.md)"));
	check("CLAUDE_CONFIG_DIR: links under the alternate projects dir", fs.lstatSync(path.join(cfg, "projects", projectKey(project), "memory", "shared")).isSymbolicLink());
}

for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
process.exit(fails);
