// `nana-setup project` — the last manual step between a blank folder and a nana project.
//
// `install` wires the MACHINE: the shared rules, the two-tier memory, the objective fallback,
// the pi extensions. None of that gives a folder the three files those mechanisms read per
// project — OBJECTIVE.md (what the session-start hook prints and scores against), HANDOFF.md
// (the frontier) and docs/sessions/ (the narrative). This command seeds exactly those, from the
// SAME `templates/_shared` sources the copier templates and the adopt-structure skill emit, so
// a scaffolded, an adopted and a hand-made project read identically.
//
// Every step is idempotent and never overwrites: a file that is already there is left alone.
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { CREATED, SKIPPED, UNCHANGED, seedFile } from "./fsops.mjs";
import { platform, repoRoot } from "./paths.mjs";
import { KNOWLEDGE_CLI, readPiPackConfig } from "./steps.mjs";

/** The single source of the three seeds — shared with the copier templates and the skill. */
export const SHARED_DIR = path.join(repoRoot, "templates", "_shared");

const win = () => platform() === "win32";

export function today(d = new Date()) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Fill the two placeholders the seeds carry and NOTHING else. The seeds keep `<date>` and
 * `<name>` literal on purpose (copier has no date variable, so the rendered template ships them
 * unfilled and says so); every other `<...>` in them is draft text the owner is meant to replace.
 *
 * `split().join()`, deliberately, NOT `replaceAll` (sol r2): `replaceAll` gives the REPLACEMENT
 * string special meaning — `$&`, `$'`, `$1` — even when the pattern is a plain string, so a
 * project named `$&` would smear the pattern through its own title. split/join is literal. The
 * name never reaches a shell either: it only ever becomes file CONTENT here and in `agentsStub`.
 */
export function fillSeed(text, { name, date }) {
	return text.split("<name>").join(name).split("<date>").join(date);
}

function readShared(rel) {
	return fs.readFileSync(path.join(SHARED_DIR, ...rel.split("/")), "utf8");
}

function lstat(p) {
	try {
		return fs.lstatSync(p);
	} catch {
		return null;
	}
}

/* --------------------------------------------------------------------------------- git */

export function stepGit(dir, o) {
	if (lstat(path.join(dir, ".git"))) return { label: "git repo", status: UNCHANGED, detail: "already a repository" };
	// A folder INSIDE an existing repo must not get a nested one — that hides every file from
	// the outer repo and is silent until someone looks for a commit that never happened.
	const top = spawnSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { encoding: "utf8" });
	if (top.status === 0 && top.stdout.trim()) {
		return { label: "git repo", status: SKIPPED, detail: `inside ${top.stdout.trim()} already — no nested repo created` };
	}
	if (o.dryRun) return { label: "git repo", status: CREATED, detail: "would run `git init`" };
	const r = spawnSync("git", ["init", dir], { encoding: "utf8" });
	return r.status === 0
		? { label: "git repo", status: CREATED, detail: "git init" }
		: { label: "git repo", status: SKIPPED, detail: `git init failed: ${(r.stderr || "").trim().split("\n").pop() || `exit ${r.status}`}` };
}

/* ------------------------------------------------------------------------------- seeds */

/** The month file is the only seed with no other consumer, so it is written here, not in `_shared`. */
export function monthHeader(name, month) {
	return `# ${name} sessions — ${month}\n\n*Newest first — a new entry goes at the TOP of this file.*\n`;
}

export function stepSeeds(dir, o, { name, date }) {
	const out = [];
	for (const rel of ["OBJECTIVE.md", "HANDOFF.md", "docs/sessions/README.md"]) {
		const r = seedFile(path.join(dir, ...rel.split("/")), fillSeed(readShared(rel), { name, date }), o);
		out.push({ label: rel, ...r });
	}
	const month = date.slice(0, 7);
	const rel = `docs/sessions/${month}.md`;
	out.push({ label: rel, ...seedFile(path.join(dir, "docs", "sessions", `${month}.md`), monthHeader(name, month), o) });
	return out;
}

/* -------------------------------------------------------------------------- AGENTS.md */

export function agentsStub(name) {
	return (
		`# ${name}\n\n` +
		"<one line: what this project is for — replace this line>\n\n" +
		"## Layout\n\n" +
		"<!-- one line per major folder, each pointing at its own AGENTS.md where one exists -->\n\n" +
		"## Rules that don't move\n\n" +
		"<!-- the few rules a session here must not break; add them as real failures show the need -->\n\n" +
		readShared("working-under-nana-pi.md")
	);
}

/**
 * Only when NEITHER AGENTS.md nor CLAUDE.md is there. A repo that already has one has made its
 * choice — pi and Claude Code both read it, and a stub would either overwrite it or contradict it.
 */
export function stepAgents(dir, o, { name }) {
	const agents = path.join(dir, "AGENTS.md");
	const claude = path.join(dir, "CLAUDE.md");
	const hasAgents = Boolean(lstat(agents));
	const hasClaude = Boolean(lstat(claude));
	if (hasAgents || hasClaude) {
		return [{ label: "AGENTS.md", status: UNCHANGED, detail: `${hasAgents ? "AGENTS.md" : "CLAUDE.md"} already present, left untouched` }];
	}
	const w = seedFile(agents, agentsStub(name), o);
	const out = [{ label: "AGENTS.md", ...w, detail: w.detail ?? "stub + the canonical `Working under nana-pi` section" }];
	if (o.dryRun) {
		out.push({ label: "CLAUDE.md", status: CREATED, detail: "would link -> AGENTS.md" });
		return out;
	}
	if (win()) {
		fs.copyFileSync(agents, claude);
		out.push({ label: "CLAUDE.md", status: CREATED, detail: "copied from AGENTS.md (win32: no usable symlink)" });
	} else {
		// RELATIVE on purpose: this link is committed, so it must resolve in anyone's clone.
		fs.symlinkSync("AGENTS.md", claude);
		out.push({ label: "CLAUDE.md", status: CREATED, detail: "-> AGENTS.md" });
	}
	return out;
}

/* ------------------------------------------------------------------- .pi/nana-pack.json */

export const PACK_STARTER = `${JSON.stringify({ postEdit: { commands: [] } }, null, 2)}\n`;

/**
 * The post-edit on-ramp — empty, so nothing runs until the owner fills it in. Skipped when the
 * user has user-scope `postEdit.commands`: project config REPLACES user config per key group, so
 * an empty project block would silently disable their global checks in this one repo.
 */
export function stepPackConfig(dir, o, layout) {
	const target = path.join(dir, ".pi", "nana-pack.json");
	if (lstat(target)) return { label: ".pi/nana-pack.json", status: UNCHANGED, detail: "already present, left untouched" };
	const user = readPiPackConfig(layout);
	if (Array.isArray(user?.postEdit?.commands) && user.postEdit.commands.length) {
		return {
			label: ".pi/nana-pack.json",
			status: SKIPPED,
			detail: "you have user-scope postEdit.commands — an empty project block would shadow them here",
		};
	}
	return { label: ".pi/nana-pack.json", ...seedFile(target, PACK_STARTER, o) };
}

/* ------------------------------------------------------------------------ knowledge pull */

/**
 * The exact text `nana-knowledge` prints when another build holds the lock
 * (`BuildLockedError` in packages/nana-knowledge/lib/build.ts). That CLI exits **0** on it by
 * design — the prompt hook must not fail because a build is already running — so exit status
 * alone cannot tell "rebuilt" from "did nothing" (sol r1). This marker is the only evidence.
 */
export const BUILD_LOCK_MARK = "another nana-knowledge build holds";
/** Hard wall-clock deadline, and how long SIGTERM gets before SIGKILL. Env seams are for tests. */
export const REFRESH_DEADLINE_MS = Number(process.env.NANA_SETUP_KNOWLEDGE_DEADLINE_MS) || 60_000;
export const REFRESH_KILL_GRACE_MS = Number(process.env.NANA_SETUP_KNOWLEDGE_KILL_GRACE_MS) || 2_000;
const knowledgeCli = () => process.env.NANA_SETUP_KNOWLEDGE_CLI || KNOWLEDGE_CLI;

/**
 * Spawn the build ASYNC with a parent-side timer, the way the knowledge hook keeps itself
 * unblockable. `spawnSync`'s own `timeout` is not a deadline: it signals the child and then
 * keeps waiting for it to die, so a build stuck in an uninterruptible syscall (a hung network
 * or FUSE knowledge root) hangs `nana-setup project` forever. Here the parent decides at
 * `REFRESH_DEADLINE_MS`, reports, and abandons the child — SIGTERM now, SIGKILL after the
 * grace, and the grace timer is deliberately NOT unref'd so the kill is actually delivered.
 */
export function runKnowledgeBuild(layout) {
	return new Promise((resolve) => {
		const child = spawn(process.execPath, [knowledgeCli(), "build"], {
			env: { ...process.env, NANA_KNOWLEDGE_HOME: layout.knowledgeHome, NODE_NO_WARNINGS: "1" },
			stdio: ["ignore", "pipe", "pipe"],
		});
		let out = "";
		let err = "";
		let settled = false;
		child.stdout.on("data", (d) => {
			out += d;
		});
		child.stderr.on("data", (d) => {
			err += d;
		});
		const done = (res) => {
			if (settled) return;
			settled = true;
			clearTimeout(deadline);
			resolve(res);
		};
		const deadline = setTimeout(() => {
			try {
				child.kill("SIGTERM");
			} catch {
				/* already gone */
			}
			setTimeout(() => {
				try {
					child.kill("SIGKILL");
				} catch {
					/* already gone */
				}
			}, REFRESH_KILL_GRACE_MS);
			child.stdout.destroy();
			child.stderr.destroy();
			child.unref();
			done({ timedOut: true, code: null, out, err });
		}, REFRESH_DEADLINE_MS);
		// A spawn failure (ENOENT, EMFILE) arrives as an EVENT, never a throw — with no
		// listener Node turns it into an uncaught exception long after this resolved.
		child.on("error", (e) => done({ error: e, code: null, out, err }));
		child.on("close", (code) => done({ code, out, err }));
	});
}

/** Re-index so this repo's docs are findable at prompt time. Never builds an index from scratch. */
export async function stepKnowledgeRefresh(layout, o) {
	const label = "knowledge index";
	if (!lstat(path.join(layout.knowledgeHome, "index.db"))) {
		return { label, status: SKIPPED, detail: `no index at ${layout.knowledgeHome} — run \`nana-setup install\` first` };
	}
	if (o.dryRun) return { label, status: UNCHANGED, detail: "would run `nana-knowledge build`" };
	const r = await runKnowledgeBuild(layout);
	if (r.timedOut) {
		return { label, status: SKIPPED, detail: `timeout after ${Math.round(REFRESH_DEADLINE_MS / 1000)}s — SIGTERM then SIGKILL; the index is unchanged` };
	}
	if (r.err.includes(BUILD_LOCK_MARK)) {
		return { label, status: SKIPPED, detail: "skipped (build lock held) — another nana-knowledge build is running; nothing was re-indexed" };
	}
	if (r.error || r.code !== 0) {
		const why = (r.err || r.error?.message || `exit ${r.code}`).trim().split("\n").slice(-2).join(" ");
		return { label, status: SKIPPED, detail: `rebuild failed, the pull just stays quiet: ${why}` };
	}
	const rows = (r.out || "").trim().split("\n").filter((l) => l.includes("files ")).pop();
	return { label, status: UNCHANGED, detail: (rows || "rebuilt").trim() };
}

/* -------------------------------------------------------------------------------- run */

export function projectName(dir, opts = {}) {
	return opts.name || path.basename(path.resolve(dir)) || "project";
}

export async function setupProject(dir, layout, opts = {}) {
	const o = { dryRun: Boolean(opts.dryRun) };
	const name = projectName(dir, opts);
	const date = opts.date || today();
	const results = [stepGit(dir, o)];
	results.push(...stepSeeds(dir, o, { name, date }));
	results.push(...stepAgents(dir, o, { name }));
	results.push(stepPackConfig(dir, o, layout));
	results.push(await stepKnowledgeRefresh(layout, o));
	return results;
}

/* ------------------------------------------------------------------------------ check */

/**
 * `project --check`: one ✓/✗ per file this command owns. It MIRRORS the setup decisions —
 * a check that fails a state setup deliberately produced would send the owner round a loop
 * re-running a command that correctly does nothing (sol r1).
 */
export function checkProject(dir, layout = {}) {
	const has = (rel) => Boolean(lstat(path.join(dir, ...rel.split("/"))));
	/**
	 * A seed counts only as a REGULAR file. Setup deliberately refuses to write through a
	 * symlink or into a directory sitting at a seed path — and the thing it refused is exactly
	 * the thing `--check` must not print ✓ over: the objective still cannot be read (sol r2).
	 */
	const fileState = (rel) => {
		const p = path.join(dir, ...rel.split("/"));
		const st = lstat(p);
		if (!st) return { ok: false, found: null };
		if (st.isSymbolicLink()) {
			let to = "";
			try {
				to = ` -> ${fs.readlinkSync(p)}`;
			} catch {
				/* unreadable link */
			}
			return { ok: false, found: `a symlink${to}` };
		}
		if (st.isDirectory()) return { ok: false, found: "a directory" };
		if (!st.isFile()) return { ok: false, found: "not a regular file" };
		return { ok: true, found: null };
	};
	const seed = (rel, meaning, label = rel) => {
		const s = fileState(rel);
		return { label, ok: s.ok, detail: s.found ? `${s.found} is there — not a readable ${rel}` : meaning };
	};
	const month = today().slice(0, 7);
	const checks = [];

	if (has(".git")) checks.push({ label: "git repo", ok: true, detail: ".git" });
	else {
		const top = spawnSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { encoding: "utf8" });
		const inside = top.status === 0 ? top.stdout.trim() : "";
		checks.push({ label: "git repo", ok: Boolean(inside), detail: inside ? `inside ${inside} — no nested repo, by design` : ".git" });
	}

	checks.push(
		seed("OBJECTIVE.md", "the two lines the session-start hook prints"),
		seed("HANDOFF.md", "the frontier"),
		seed("docs/sessions/README.md", "the narrative's rules"),
		seed(`docs/sessions/${month}.md`, "this month's log"),
	);

	// The navigation file: AGENTS.md as a regular file, or — for a project that already had one
	// — CLAUDE.md as a regular file of its own.
	const agents = fileState("AGENTS.md");
	const claude = fileState("CLAUDE.md");
	if (agents.ok) checks.push({ label: "AGENTS.md", ok: true, detail: "the navigation file" });
	else if (agents.found) checks.push({ label: "AGENTS.md", ok: false, detail: `${agents.found} is there — not a readable AGENTS.md` });
	else checks.push({ label: "AGENTS.md", ok: claude.ok, detail: claude.ok ? "CLAUDE.md, the project's own — no AGENTS.md by design" : "AGENTS.md (or a CLAUDE.md the project already had)" });

	// CLAUDE.md is the ONE path where a symlink is the healthy state: `project` writes it as a
	// relative link to AGENTS.md (win32 has no usable symlink, so a copy is healthy there too).
	// Judged only when there is an AGENTS.md for it to alias — otherwise it IS the nav file above.
	//
	// The link must RESOLVE to this project's own AGENTS.md, not merely be named after it
	// (sol r3): `-> missing/AGENTS.md` reads nothing at all, and `-> /elsewhere/AGENTS.md`
	// points Claude Code at another project's instructions while pi reads this one's.
	const claudePath = path.join(dir, "CLAUDE.md");
	const st = lstat(claudePath);
	if (agents.ok && st) {
		if (st.isSymbolicLink()) {
			const raw = (() => {
				try {
					return fs.readlinkSync(claudePath);
				} catch {
					return null;
				}
			})();
			const real = (p) => {
				try {
					return fs.realpathSync(p);
				} catch {
					return null;
				}
			};
			const resolved = real(claudePath); // null == dangling
			const want = real(path.join(dir, "AGENTS.md"));
			const linked = Boolean(resolved && want && resolved === want);
			checks.push({
				label: "CLAUDE.md",
				ok: linked,
				detail: linked ? "-> AGENTS.md" : `a symlink -> ${raw ?? "?"} — ${resolved ? "not this project's AGENTS.md" : "dangling"}`,
			});
		} else {
			checks.push({
				label: "CLAUDE.md",
				ok: st.isFile(),
				detail: st.isFile() ? "a copy of AGENTS.md (win32 has no usable symlink)" : "a directory is there",
			});
		}
	}

	const user = readPiPackConfig(layout);
	const shadowed = Array.isArray(user?.postEdit?.commands) && user.postEdit.commands.length > 0;
	const pack = fileState(".pi/nana-pack.json");
	checks.push({
		label: ".pi/nana-pack.json",
		ok: pack.ok || (!pack.found && shadowed),
		detail: pack.ok
			? "post-edit on-ramp"
			: pack.found
				? `${pack.found} is there — not a readable .pi/nana-pack.json`
				: shadowed
					? "omitted on purpose — your user-scope postEdit.commands would be shadowed by it"
					: "post-edit on-ramp",
	});
	return checks;
}
