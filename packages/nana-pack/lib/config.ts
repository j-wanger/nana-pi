/**
 * Shared config for the nana pack.
 *
 * Sources (project wins over user, both optional — every extension works with defaults):
 *   user:    ~/.pi/agent/nana-pack.json
 *   project: <cwd>/.pi/nana-pack.json
 *
 * Read on every event so config edits apply live, without restarting the session.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export interface PostEditCommand {
	/** Regex (string) tested against the edited file's path */
	match: string;
	/** Shell command; every `{file}` is replaced with the quoted file path */
	run: string;
	timeoutMs?: number;
}

export interface NanaPackConfig {
	gate: {
		/** Extra dangerous-command regexes (strings) added to the built-in list */
		extraPatterns: string[];
		/** Regexes that skip gating entirely — checked first */
		allowPatterns: string[];
		/** Extra protected-path regexes added to the built-in list */
		protectedPaths: string[];
	};
	postEdit: { commands: PostEditCommand[] };
	notify: { enabled: boolean; headless: boolean };
	journal: { enabled: boolean; path: string | null };
}

const DEFAULTS: NanaPackConfig = {
	gate: { extraPatterns: [], allowPatterns: [], protectedPaths: [] },
	postEdit: { commands: [] },
	notify: { enabled: true, headless: false },
	journal: { enabled: true, path: null },
};

function readJson(p: string): Record<string, any> | undefined {
	try {
		return JSON.parse(fs.readFileSync(p, "utf-8"));
	} catch {
		return undefined;
	}
}

export function loadConfig(cwd: string): NanaPackConfig {
	const user = readJson(path.join(os.homedir(), ".pi", "agent", "nana-pack.json")) ?? {};
	const project = readJson(path.join(cwd, ".pi", "nana-pack.json")) ?? {};
	return {
		gate: { ...DEFAULTS.gate, ...user.gate, ...project.gate },
		postEdit: { ...DEFAULTS.postEdit, ...user.postEdit, ...project.postEdit },
		notify: { ...DEFAULTS.notify, ...user.notify, ...project.notify },
		journal: { ...DEFAULTS.journal, ...user.journal, ...project.journal },
	};
}

export function compileRegexes(patterns: string[]): RegExp[] {
	const out: RegExp[] = [];
	for (const p of patterns) {
		try {
			out.push(new RegExp(p, "i"));
		} catch {
			// invalid user regex: skip rather than break the extension
		}
	}
	return out;
}

export function journalFile(cfg: NanaPackConfig): string {
	return cfg.journal.path ?? path.join(os.homedir(), ".pi", "agent", "nana-journal.jsonl");
}

/** Best-effort append; observability must never break the agent. */
export function appendJournal(cfg: NanaPackConfig, entry: Record<string, unknown>): void {
	if (!cfg.journal.enabled) return;
	try {
		fs.appendFileSync(journalFile(cfg), `${JSON.stringify(entry)}\n`);
	} catch {
		// best-effort by design
	}
}
