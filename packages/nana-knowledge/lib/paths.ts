// User-scope locations for the knowledge index. Everything lives under one dir so
// the whole thing can be deleted with `rm -rf`. NANA_KNOWLEDGE_HOME overrides it
// (tests use that; nothing else should).
import * as os from "node:os";
import * as path from "node:path";

export function home(): string {
	return process.env.NANA_KNOWLEDGE_HOME || path.join(os.homedir(), ".pi", "agent", "nana-knowledge");
}

export const paths = {
	get home() { return home(); },
	get sources() { return path.join(home(), "sources.json"); },
	get db() { return path.join(home(), "index.db"); },
	get shownDir() { return path.join(home(), "shown"); },
	get log() { return path.join(home(), "pull.log"); },
	get buildLock() { return path.join(home(), "build.lock"); },
};

/** Display form: collapse $HOME to `~` so pointers stay short in the hook block. */
export function tildeify(p: string): string {
	const h = os.homedir();
	return p === h || p.startsWith(h + path.sep) ? "~" + p.slice(h.length) : p;
}
