#!/usr/bin/env node
// nana-adoption — the seat's session-start block of git repositories a session ran in that nobody
// has adopted (the Claude Code SessionStart hook's producer; pi sessions get nothing from this).
//   node bin/nana-adoption.mjs [--cwd <dir>]     (--cwd is accepted and unused: the source is the journal)
// Reads ONLY the tail of the nana journal (pi's agent dir, or the user-scope journal.path) for
// `directory_unadopted` lines from the last 7 days, re-checks each root NOW, and drops any that is
// adopted (store entry / OBJECTIVE.md), dismissed (.nana-not-a-project) or gone. No cursor file.
// Output: "[nana:adoption]" then the block; NOTHING when there is nothing to say.
// Plain .mjs, no .ts import. Always exits 0 — a hook must never fail the session start.
import * as fs from "node:fs";
import * as path from "node:path";

const TAG = "[nana:adoption]";
const WINDOW_MS = 7 * 86_400_000;
const SHOW = 5;

try {
	const { piAgentDir } = await import("../lib/agent-dir.mjs");
	const { isAdopted, recentReports, rootState, tailLines } = await import("../lib/adoption.mjs");
	let journal = path.join(piAgentDir(), "nana-journal.jsonl");
	try {
		const p = JSON.parse(fs.readFileSync(path.join(piAgentDir(), "nana-pack.json"), "utf8"))?.journal?.path;
		if (typeof p === "string" && p) journal = path.resolve(p);
	} catch {
		/* no / unreadable user config: the default journal */
	}
	const open = recentReports(tailLines(journal), Date.now() - WINDOW_MS)
		.filter((r) => {
			try {
				return fs.statSync(r.root).isDirectory();
			} catch {
				return false; // gone
			}
		})
		.map((r) => ({ ...r, s: rootState(r.root) }))
		.filter((r) => !isAdopted(r.s));
	if (open.length) {
		const has = (s) => [s.agents && "AGENTS.md", s.sessions && "docs/sessions/"].filter(Boolean).join(", ") || "nothing";
		const lines = open
			.slice(0, SHOW)
			.map((r) => `- ${r.root} — has: ${has(r.s)} · last session ${new Date(r.ts).toISOString().slice(0, 10)}`);
		if (open.length > SHOW) lines.push(`…and ${open.length - SHOW} more`);
		process.stdout.write(
			`${TAG}\n## Unadopted repositories (nana)\n\nSessions ran in ${open.length === 1 ? "this git repository" : "these git repositories"}, which ${open.length === 1 ? "has" : "have"} no OBJECTIVE.md, no handoff and no dismissal:\n\n${lines.join("\n")}\n\n` +
				"For each: adopt it with `nana-setup project <dir>` and set its objective with Jake, or dismiss it once with `nana-setup project <dir> --not-a-project`.\n",
		);
	}
} catch (err) {
	const why = String(err?.code ?? err?.message ?? "failed").replace(/[^\w .:-]/g, "").slice(0, 60);
	process.stdout.write(`${TAG}\nADOPTION UNAVAILABLE: reader failed (${why}).\n`);
}
process.exitCode = 0;
