/**
 * nana-objective — the owner's standing objective + current priority, in every
 * session's system prompt.
 *
 * Ruled 2026-09-16: every session (Claude Code and pi) starts by seeing the same
 * two lines, so it can say which of them its spend serves. Claude Code gets them
 * through a global SessionStart hook; pi gets them here. One file is the source
 * of truth (default ~/.pi/agent/nana-objective.md, usually pointed at the real
 * OBJECTIVE.md via objective.path) — edit that file, and the next agent start
 * everywhere sees the new text.
 *
 * Why this reads on EVERY session_start reason while nana-handoff reads only on
 * "startup"/"new": the handoff is *continuity* — a resumed or forked session
 * already carries that context in its own transcript, so re-injecting it is
 * noise. The objective is *standing governance*, and it lives only in the system
 * prompt, which pi reassembles from scratch at every agent start (see
 * before_agent_start's `systemPrompt`). A resumed, forked or reloaded session is
 * just as able to spend on the wrong thing as a fresh one, so all five reasons
 * (startup, new, resume, fork, reload) pick it up.
 *
 * Config (nana-pack.json): objective.enabled (default true), objective.path
 * (default ~/.pi/agent/nana-objective.md; "~/" expands, a RELATIVE path resolves
 * against ~/.pi/agent and NEVER against cwd). USER SCOPE ONLY — see lib/config.ts.
 *
 * When the objective is enabled but unreadable, an "OBJECTIVE UNAVAILABLE" marker
 * is injected instead of nothing: silence is the failure that matters here.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { appendJournal, loadConfig } from "../lib/config.ts";

const INJECT_CAP = 4000; // OBJECTIVE.md is ~1.7k today; 2000 left 300 chars of headroom (truncates mid-file, silently)
const HEADING = "## Objective and current priority (nana)";
const CHARGE =
	"Every session must be able to say which of these lines its spend serves. If it cannot, say so to the user before spending.";
const MARKER_PREFIX = "OBJECTIVE UNAVAILABLE: ";

function agentDir(): string {
	return path.join(os.homedir(), ".pi", "agent");
}

function objectivePath(cfg: { objective: { path: string | null } }): string {
	const p = cfg.objective.path ?? path.join(agentDir(), "nana-objective.md");
	// A "~/..." written by hand in nana-pack.json would otherwise resolve to a
	// literal "~" directory, miss, and silently inject nothing — an invisible
	// failure of the one artifact that is supposed to always be there.
	if (p === "~") return os.homedir();
	if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
	// A RELATIVE path must never resolve against cwd: `"path": "OBJECTIVE.md"`
	// would then let every repository supply its own standing system-prompt text,
	// which is exactly the project-scope escape lib/config.ts refuses. Relative
	// means "relative to the user's own ~/.pi/agent", nothing else.
	return path.isAbsolute(p) ? p : path.join(agentDir(), p);
}

function isSymlink(file: string): boolean {
	try {
		return fs.lstatSync(file).isSymbolicLink();
	} catch {
		return false; // absent (or unreadable) — nothing is being followed
	}
}

/**
 * Refuse to read the objective through a symlink only when it sits INSIDE the
 * current workspace — the minimal half of nana-handoff's `reachedThroughSymlink`
 * (see that file for the full reasoning).
 *
 * The objective normally lives in the user's own home (~/.pi/agent/...), where a
 * symlink is the *intended* affordance: pointing the pack's default path at a
 * repo's real OBJECTIVE.md by linking to it is the user's own filesystem
 * decision, and refusing it would break the documented setup. Nothing there is
 * repo-supplied, so there is nothing to refuse.
 *
 * A path inside the cwd is different: a repo could commit
 * `<cwd>/whatever/objective.md` — or a symlinked directory above it — as a link
 * to ~/.ssh/id_rsa and have the target pasted into every system prompt. So when
 * (and only when) the resolved file is below the workspace root, every component
 * below that root is checked. Advisory, not a security boundary: the lstats are
 * not atomic with the read that follows.
 */
function reachedThroughSymlinkInWorkspace(root: string, file: string): boolean {
	const base = path.resolve(root);
	const target = path.resolve(file);
	const rel = path.relative(base, target);
	if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return false; // outside the workspace: the user's own filesystem
	let cur = base;
	for (const segment of rel.split(path.sep)) {
		cur = path.join(cur, segment);
		if (isSymlink(cur)) return true;
	}
	return false;
}

export default function (pi: ExtensionAPI) {
	// The whole body injected under HEADING: either the objective text (plus a
	// truncation line) or the UNAVAILABLE marker. null only when the feature is off.
	let block: string | null = null;

	pi.on("session_start", async (_event, ctx) => {
		// every reason, deliberately — see the header comment
		// Cleared BEFORE the enabled check: a live config toggle to enabled:false
		// must not leave the previous session's objective text cached and injectable.
		block = null;
		const cfg = loadConfig(ctx);
		if (!cfg.objective.enabled) return;
		const file = objectivePath(cfg);
		const unavailable = (cause: string) => {
			block = `${MARKER_PREFIX}${cause} (${file}). Tell the user before spending.`;
			appendJournal(cfg, { ts: new Date().toISOString(), event: "objective_unavailable", cwd: ctx.cwd, path: file, cause });
			if (ctx.hasUI) ctx.ui.notify(`objective unavailable: ${cause} (${file})`, "warning");
		};
		try {
			if (reachedThroughSymlinkInWorkspace(ctx.cwd, file)) return unavailable("reached through a symlink inside the workspace");
			const raw = fs.readFileSync(file, "utf-8").trim();
			if (!raw) return unavailable("empty file");
			const truncated = raw.length > INJECT_CAP;
			block = raw.slice(0, INJECT_CAP) + (truncated ? `\n\n(truncated at ${INJECT_CAP} chars)` : "");
			appendJournal(cfg, { ts: new Date().toISOString(), event: "objective_pickup", cwd: ctx.cwd, path: file, chars: block.length, truncated });
		} catch (err) {
			// Silence was the original behaviour and it defeated the whole point: the one
			// artifact every session must see went missing INVISIBLY. Say so in the prompt.
			unavailable((err as NodeJS.ErrnoException)?.code === "ENOENT" ? "file not found" : "unreadable");
		}
	});

	pi.on("before_agent_start", async (event, ctx) => {
		if (!block) return undefined;
		if (!loadConfig(ctx).objective.enabled) return undefined;
		// The marker carries its own charge; the charge line only makes sense when
		// there are actual lines to serve.
		const tail = block.startsWith(MARKER_PREFIX) ? "" : `\n\n${CHARGE}`;
		return { systemPrompt: `${(event as any).systemPrompt}\n\n${HEADING}\n\n${block}${tail}` };
	});
}
