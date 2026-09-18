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
import { spawnSync } from "node:child_process";
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

/** Re-index so this repo's docs are findable at prompt time. Never builds an index from scratch. */
export function stepKnowledgeRefresh(layout, o) {
	const label = "knowledge index";
	if (!fs.existsSync(path.join(layout.knowledgeHome, "index.db"))) {
		return { label, status: SKIPPED, detail: `no index at ${layout.knowledgeHome} — run \`nana-setup install\` first` };
	}
	if (o.dryRun) return { label, status: UNCHANGED, detail: "would run `nana-knowledge build`" };
	const r = spawnSync(process.execPath, [KNOWLEDGE_CLI, "build"], {
		env: { ...process.env, NANA_KNOWLEDGE_HOME: layout.knowledgeHome, NODE_NO_WARNINGS: "1" },
		encoding: "utf8",
		timeout: 10 * 60_000,
	});
	if (r.status !== 0) {
		const why = (r.stderr || r.error?.message || `exit ${r.status}`).trim().split("\n").slice(-2).join(" ");
		return { label, status: SKIPPED, detail: `rebuild failed, the pull just stays quiet: ${why}` };
	}
	const rows = (r.stdout || "").trim().split("\n").filter((l) => l.includes("files ")).pop();
	return { label, status: UNCHANGED, detail: (rows || "rebuilt").trim() };
}

/* -------------------------------------------------------------------------------- run */

export function projectName(dir, opts = {}) {
	return opts.name || path.basename(path.resolve(dir)) || "project";
}

export function setupProject(dir, layout, opts = {}) {
	const o = { dryRun: Boolean(opts.dryRun) };
	const name = projectName(dir, opts);
	const date = opts.date || today();
	const results = [stepGit(dir, o)];
	results.push(...stepSeeds(dir, o, { name, date }));
	results.push(...stepAgents(dir, o, { name }));
	results.push(stepPackConfig(dir, o, layout));
	results.push(stepKnowledgeRefresh(layout, o));
	return results;
}

/* ------------------------------------------------------------------------------ check */

/** `project --check`: one ✓/✗ per file this command owns. */
export function checkProject(dir) {
	const has = (rel) => Boolean(lstat(path.join(dir, ...rel.split("/"))));
	const month = today().slice(0, 7);
	const checks = [
		{ label: "git repo", ok: has(".git"), detail: ".git" },
		{ label: "OBJECTIVE.md", ok: has("OBJECTIVE.md"), detail: "the two lines the session-start hook prints" },
		{ label: "HANDOFF.md", ok: has("HANDOFF.md"), detail: "the frontier" },
		{ label: "docs/sessions/README.md", ok: has("docs/sessions/README.md"), detail: "the narrative's rules" },
		{ label: `docs/sessions/${month}.md`, ok: has(`docs/sessions/${month}.md`), detail: "this month's log" },
		{ label: "AGENTS.md", ok: has("AGENTS.md") || has("CLAUDE.md"), detail: "AGENTS.md (or a CLAUDE.md the project already had)" },
		{ label: ".pi/nana-pack.json", ok: has(".pi/nana-pack.json"), detail: "post-edit on-ramp" },
	];
	return checks;
}
