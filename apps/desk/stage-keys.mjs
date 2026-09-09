/**
 * stage-keys.mjs — the desk's ISSUANCE RECORD for stage provenance keys
 * (design B, docs/agent-frontend-design-2026-09-04.md §3.2 addendum 2026-09-09).
 *
 * The problem it solves: `NANA_STAGE_KEY` used to live only in the desk process
 * that spawned the child, so a desk restart or a session resume minted a fresh key
 * and every `nana-block` entry already on disk failed verification — a session's
 * whole stage went blank. The blocks were intact; the desk had thrown away the only
 * thing that could vouch for them.
 *
 * So the key becomes a property of the SESSION, and this file is where the desk
 * writes down which keys it issued for which session. Keyed by the pi session
 * header `id`, never by the file path: a session file gets renamed (title append)
 * and resumed by the new name, and the id survives that.
 *
 *   {"v":1,"sessions":{"<pi session id>":{"keys":["<hex>", …],"updatedAt":<ms>}}}
 *
 * Rules that make this safe to reason about:
 *   · A CHILD still signs with exactly one key, and the live tool-event path still
 *     verifies against that one key only. This record only widens the LEDGER read,
 *     which asks "did this desk ever issue the key that signed this block for this
 *     session?" Any-of-recorded-keys is as strong as one key for the threat model:
 *     a co-resident extension forging blocks, or a hand-edited session file, holds
 *     none of them.
 *   · Nothing here ever makes an unverifiable block acceptable. A session we have
 *     no record for simply gets a fresh key, and its older blocks stay redacted.
 *   · Keys are only ever ADDED (most recent first, capped). Reading this file is
 *     enough to forge blocks for those sessions — the same authority the desk
 *     process itself has — which is why it is 0600 in a 0700 directory.
 *   · No method throws at its caller: this sits under a request handler, and a
 *     store that cannot be read or written must cost the stage's continuity, never
 *     the request.
 */

import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// One key per desk restart / re-spawn of a session. Eight covers a working week of
// them; beyond that the oldest drops off and blocks signed under it go back to
// being unverifiable — which is the honest outcome, not a silent acceptance.
export const KEYS_PER_SESSION = 8;
// A second, independent bound on the file: the existence prune below cannot shrink
// it on a machine whose sessions are never deleted.
export const MAX_SESSIONS = 512;
const KEY_RE = /^[0-9a-f]{64}$/;

// DESK_STAGE_KEYS: tests only (same convention as DESK_APPS_DIR). The real path
// follows $HOME like every other ~/.pi/agent save, so a test that isolates HOME
// isolates this too.
export const defaultStageKeysPath = () =>
	process.env.DESK_STAGE_KEYS || path.join(os.homedir(), ".pi", "agent", "nana-desk", "stage-keys.json");

export class StageKeyStore {
	/**
	 * @param file            store path (defaults to ~/.pi/agent/nana-desk/stage-keys.json)
	 * @param knownSessionIds () => Set<sessionId> — the desk's OWN session enumeration,
	 *                        injected so this module never walks the sessions tree itself
	 * @param log             one-line warnings (console.error in the desk)
	 */
	constructor({ file = defaultStageKeysPath(), knownSessionIds = null, log = console.error } = {}) {
		this.file = file;
		this.knownSessionIds = knownSessionIds;
		this.log = log;
		this.sessions = new Map(); // id → {keys: [hex], updatedAt: ms}
		this.dropped = new Set(); // ids the prune removed — never merged back in
		this.loaded = false;
	}

	// Read + prune once, on FIRST use rather than at desk startup: the prune reads a
	// session header per file, and a desk that never opens an app should not pay for
	// it. First use is the first app spawn, inside a request that is already spawning
	// a process.
	#ensureLoaded() {
		if (this.loaded) return;
		this.loaded = true;
		this.sessions = this.#read(true) ?? new Map();
		this.#prune();
	}

	// Every key this desk has recorded for a session, most recent first.
	keysFor(id) {
		if (typeof id !== "string" || !id) return [];
		this.#ensureLoaded();
		return [...(this.sessions.get(id)?.keys || [])];
	}

	// Record that `key` was issued for session `id`. Returns whether anything
	// changed — a key we already hold costs nothing and touches no file, which is
	// what keeps the ledger read (which calls this on every replay) off the write
	// path.
	record(id, key) {
		if (typeof id !== "string" || !id || typeof key !== "string" || !KEY_RE.test(key)) return false;
		this.#ensureLoaded();
		const cur = this.sessions.get(id);
		if (cur?.keys.includes(key)) return false;
		this.dropped.delete(id); // a live child holds it: it exists again
		this.sessions.set(id, { keys: [key, ...(cur?.keys || [])].slice(0, KEYS_PER_SESSION), updatedAt: Date.now() });
		this.#persist();
		return true;
	}

	#warn(msg) {
		try {
			this.log(msg);
		} catch {
			/* a logger that throws must not take the desk with it */
		}
	}

	// aside=true is the LOAD path, which moves an unreadable store out of the way so
	// the desk starts clean without destroying whatever was there. The merge path
	// passes false: it must never rename anything.
	#read(aside) {
		let raw;
		try {
			raw = fs.readFileSync(this.file, "utf-8");
		} catch (e) {
			if (e?.code !== "ENOENT") this.#warn(`stage keys: cannot read ${this.file}: ${e.message}`);
			return null;
		}
		const map = parseStore(raw);
		if (!map && aside) this.#aside();
		return map;
	}

	#aside() {
		const to = `${this.file}.corrupt-${Date.now()}`;
		try {
			fs.renameSync(this.file, to);
			this.#warn(`stage keys: ${this.file} is not a readable v1 key store — moved to ${to}, starting empty`);
		} catch (e) {
			this.#warn(`stage keys: ${this.file} is unreadable and could not be moved aside (${e.message}) — starting empty`);
		}
	}

	// Store hygiene: forget sessions that no longer exist on disk. The id set comes
	// from the desk's own session enumeration (no second filesystem walk here).
	#prune() {
		if (!this.knownSessionIds || !this.sessions.size) return;
		let known;
		try {
			known = this.knownSessionIds();
		} catch (e) {
			this.#warn(`stage keys: session enumeration failed, keeping every recorded key (${e.message})`);
			return;
		}
		// An EMPTY enumeration is indistinguishable from "the sessions directory could
		// not be read", and acting on it would drop every key we hold. Do nothing.
		if (!(known instanceof Set) || known.size === 0) return;
		for (const id of [...this.sessions.keys()]) {
			if (known.has(id)) continue;
			this.sessions.delete(id);
			this.dropped.add(id);
		}
		// Deliberately no write here: the prune is in memory, and the next `record`
		// persists it. Startup stays read-only, so merely starting a desk never
		// rewrites this file.
	}

	#persist() {
		let merged;
		try {
			merged = this.#merge(this.#read(false));
			this.#write(merged);
		} catch (e) {
			// The in-memory record keeps this desk's live sessions verifying; only
			// continuity across the next restart is lost.
			this.#warn(`stage keys: could not save ${this.file} (${e.message}) — keys are held in memory for this desk only`);
			return;
		}
		this.sessions = merged;
	}

	// Another desk (a second instance, a test harness) may hold the same store: read
	// what is there and UNION it rather than overwriting. Ours wins on ordering; a
	// key only this process knows and a key only the other one knows both survive.
	#merge(disk) {
		const out = new Map(this.sessions);
		if (disk) {
			for (const [id, rec] of disk) {
				if (this.dropped.has(id)) continue; // pruned this run: do not resurrect
				const ours = out.get(id);
				if (!ours) {
					out.set(id, rec);
					continue;
				}
				out.set(id, {
					keys: [...ours.keys, ...rec.keys.filter((k) => !ours.keys.includes(k))].slice(0, KEYS_PER_SESSION),
					updatedAt: Math.max(ours.updatedAt, rec.updatedAt),
				});
			}
		}
		if (out.size <= MAX_SESSIONS) return out;
		return new Map([...out.entries()].sort((a, b) => b[1].updatedAt - a[1].updatedAt).slice(0, MAX_SESSIONS));
	}

	#write(map) {
		const doc = { v: 1, sessions: Object.fromEntries([...map].map(([id, r]) => [id, { keys: r.keys, updatedAt: r.updatedAt }])) };
		// Follow a symlink at the store path — the declared policy for our own
		// ~/.pi/agent saves — but stay atomic: resolve the real target first, then
		// write a temp file NEXT TO IT and rename over it. A reader therefore sees
		// either the old store or the new one, never a half-written one, and the
		// rename replaces the target rather than the link.
		let target = this.file;
		try {
			target = fs.realpathSync(this.file);
		} catch {
			/* not there yet: create it at the literal path */
		}
		const dir = path.dirname(target);
		fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
		const tmp = path.join(dir, `.${path.basename(target)}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`);
		try {
			fs.writeFileSync(tmp, `${JSON.stringify(doc, null, "\t")}\n`, { mode: 0o600 });
			fs.chmodSync(tmp, 0o600); // explicit: writeFileSync's mode is masked by the umask
			fs.renameSync(tmp, target);
		} catch (e) {
			try {
				fs.unlinkSync(tmp);
			} catch {
				/* nothing to clean up */
			}
			throw e;
		}
	}
}

// Shape check, not a parse convenience: anything that is not a v1 store with a
// `sessions` object reads as "unusable" so the caller can move it aside instead of
// silently treating a foreign file as an empty record and overwriting it.
function parseStore(raw) {
	let doc;
	try {
		doc = JSON.parse(raw);
	} catch {
		return null;
	}
	if (!doc || typeof doc !== "object" || Array.isArray(doc) || doc.v !== 1) return null;
	const sessions = doc.sessions;
	if (!sessions || typeof sessions !== "object" || Array.isArray(sessions)) return null;
	const out = new Map();
	for (const [id, rec] of Object.entries(sessions)) {
		if (!id) continue;
		const keys = Array.isArray(rec?.keys) ? rec.keys.filter((k) => typeof k === "string" && KEY_RE.test(k)).slice(0, KEYS_PER_SESSION) : [];
		if (!keys.length) continue;
		out.set(id, { keys, updatedAt: Number.isFinite(rec.updatedAt) ? rec.updatedAt : 0 });
	}
	return out;
}
