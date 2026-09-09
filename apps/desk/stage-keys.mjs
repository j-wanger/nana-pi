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
// Cross-process lock (see #persist). Held for the length of one read-merge-write —
// a small file read, a write and a rename — so the wait is microseconds in practice
// and the ceiling only matters when another desk is wedged mid-save.
const LOCK_WAIT_MS = 2000;
const LOCK_STALE_MS = 30000;
const LOCK_SLEEP_MS = 15;

// Sync sleep, because the whole store API is sync (it is called from the sync spawn
// path). Atomics.wait parks the thread instead of spinning; Node permits it on the
// main thread.
function sleepSync(ms) {
	try {
		Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
	} catch {
		const until = Date.now() + ms;
		while (Date.now() < until) { /* no Atomics here: fall back to a bounded spin */ }
	}
}

function readIfPresent(file) {
	try {
		return fs.readFileSync(file, "utf-8");
	} catch {
		return null;
	}
}

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
		// A save that failed leaves the in-memory record AHEAD of the file. Returning
		// early from record() on an already-held key then made that permanent — the
		// desk kept working and lost every one of those keys at the next restart. The
		// flag makes the next record() retry, whatever it is recording.
		this.dirty = false;
	}

	// Read + prune once, on FIRST use rather than at desk startup: the prune reads a
	// session header per file, and a desk that never opens an app should not pay for
	// it. First use is the first app spawn, inside a request that is already spawning
	// a process.
	#ensureLoaded() {
		if (this.loaded) return;
		this.loaded = true;
		this.sessions = this.#load() ?? new Map();
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
		if (cur?.keys.includes(key)) {
			if (this.dirty) this.#persist(); // an earlier save failed: retry it now
			return false;
		}
		this.dropped.delete(id); // a live child holds it: it exists again
		this.sessions.set(id, { keys: [key, ...(cur?.keys || [])].slice(0, KEYS_PER_SESSION), updatedAt: Date.now() });
		this.#persist();
		return true;
	}

	// Seed a session's record from another's. The ONE case for it: pi's fork and
	// clone copy the source session's custom entries UNCHANGED into a new file with a
	// NEW header id, so blocks that verified a moment earlier under the source's keys
	// would go blank under an id that has no record. The desk seeds from what it
	// OBSERVED itself — the id this same child held immediately before — never from
	// `parentSession` text in the file, which is not authority. Refuses to overwrite
	// an existing record: this only ever fills a blank.
	seed(id, keys) {
		if (typeof id !== "string" || !id || !Array.isArray(keys) || !keys.length) return false;
		this.#ensureLoaded();
		if (this.sessions.has(id)) return false;
		const valid = keys.filter((k) => typeof k === "string" && KEY_RE.test(k)).slice(0, KEYS_PER_SESSION);
		if (!valid.length) return false;
		this.dropped.delete(id);
		this.sessions.set(id, { keys: valid, updatedAt: Date.now() });
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

	// The LOAD path. An unreadable store is moved out of the way so the desk starts
	// clean without destroying whatever was there. (The merge path inside #persist
	// reads the target directly and never renames anything.)
	#load() {
		const target = this.#target();
		let raw;
		try {
			raw = fs.readFileSync(target, "utf-8");
		} catch (e) {
			if (e?.code !== "ENOENT") this.#warn(`stage keys: cannot read ${target}: ${e.message}`);
			return null;
		}
		const map = parseStore(raw);
		if (!map) this.#aside();
		return map;
	}

	// Move the RESOLVED target aside, not the literal path: if the store is a symlink
	// into a dotfiles checkout, renaming the link would leave the unreadable file in
	// place and silently detach the store from where the user keeps it.
	#aside() {
		const target = this.#target();
		const to = `${target}.corrupt-${Date.now()}`;
		try {
			fs.renameSync(target, to);
			this.#warn(`stage keys: ${target} is not a readable v1 key store — moved to ${to}, starting empty`);
		} catch (e) {
			this.#warn(`stage keys: ${target} is unreadable and could not be moved aside (${e.message}) — starting empty`);
		}
	}

	// Follow a symlink at the store path — the declared policy for our own
	// ~/.pi/agent saves. Everything that touches bytes (read-for-merge, write, lock,
	// aside) works on this resolved path, so the link is followed and never replaced.
	#target() {
		try {
			return fs.realpathSync(this.file);
		} catch {
			return this.file; // not there yet: create it at the literal path
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

	// One read-merge-write, serialized ACROSS PROCESSES. Merging alone is not enough:
	// two desks that both read the file before either wrote it each rename their own
	// merge over the other's, and the loser's issuance simply disappears — an atomic
	// rename prevents a torn file, not a lost update. So the read happens inside the
	// lock, and a desk that cannot take the lock keeps its keys in memory and retries
	// on the next record rather than clobbering.
	#persist() {
		const target = this.#target();
		const lockPath = `${target}.lock`;
		let fd = null;
		try {
			const dir = path.dirname(target);
			fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
			this.#secureDir(dir, path.basename(target));
			fd = this.#lock(lockPath);
			const merged = this.#merge(parseStore(readIfPresent(target) ?? ""));
			this.#write(target, merged);
			this.sessions = merged;
			this.dirty = false;
		} catch (e) {
			// The in-memory record keeps this desk's live sessions verifying; only
			// continuity across the next restart is at stake, and the next record retries.
			this.dirty = true;
			this.#warn(`stage keys: could not save ${target} (${e.message}) — keys are held in memory for this desk only; the next record retries`);
		} finally {
			if (fd !== null) this.#release(fd, lockPath);
		}
	}

	// Advisory lock: exclusive-create beside the store, released in `finally`. A desk
	// that died holding it must not wedge every other desk forever, so a lock older
	// than LOCK_STALE_MS is taken over. Residual, and narrower than what it replaces:
	// two desks that take over the SAME stale lock in the same instant can still lose
	// one update — that window needs a 30-second-old lock and a simultaneous retry,
	// where before EVERY concurrent save could lose one.
	#lock(lockPath) {
		const deadline = Date.now() + LOCK_WAIT_MS;
		for (;;) {
			try {
				const fd = fs.openSync(lockPath, "wx", 0o600);
				try {
					fs.writeSync(fd, `${process.pid}\n`);
				} catch {
					/* the lock is the file's existence, not its contents */
				}
				return fd;
			} catch (e) {
				if (e?.code !== "EEXIST") throw e;
				let st = null;
				try {
					st = fs.statSync(lockPath);
				} catch {
					continue; // it vanished between the create and the stat: try again at once
				}
				if (Date.now() - st.mtimeMs > LOCK_STALE_MS) {
					try {
						fs.unlinkSync(lockPath);
					} catch {
						/* someone else took it over first */
					}
					continue;
				}
				if (Date.now() >= deadline) throw new Error(`another process has held the stage-key lock for more than ${LOCK_WAIT_MS} ms`);
				sleepSync(LOCK_SLEEP_MS);
			}
		}
	}

	#release(fd, lockPath) {
		try {
			fs.closeSync(fd);
		} catch {
			/* already closed */
		}
		try {
			fs.unlinkSync(lockPath);
		} catch {
			/* already gone */
		}
	}

	// mkdirSync's mode applies only to directories it CREATES, so a store directory
	// that already exists at 0777 stays world-writable and anyone local can replace
	// the issuance record. Tighten it — but ONLY when the directory is ours: one that
	// holds nothing except this store's own files. A store pointed at a shared
	// directory (pi's own ~/.pi/agent, say) is never re-permissioned out from under
	// its other users, and a symlinked directory is left alone entirely.
	#secureDir(dir, base) {
		try {
			if (fs.lstatSync(dir).isSymbolicLink()) return;
			if ((fs.statSync(dir).mode & 0o777) === 0o700) return;
			const ours = (f) => f === base || f.startsWith(`${base}.`) || f.startsWith(`.${base}.`);
			if (!fs.readdirSync(dir).every(ours)) return;
			fs.chmodSync(dir, 0o700);
		} catch (e) {
			this.#warn(`stage keys: could not restrict ${dir} to 0700 (${e.message})`);
		}
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

	// Atomic replace of the already-resolved target: write a temp file NEXT TO IT and
	// rename over it, so a reader sees either the old store or the new one, never a
	// half-written one, and the rename replaces the target rather than a link to it.
	// Called only with the lock held.
	#write(target, map) {
		const doc = { v: 1, sessions: Object.fromEntries([...map].map(([id, r]) => [id, { keys: r.keys, updatedAt: r.updatedAt }])) };
		const tmp = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`);
		let fd = null;
		try {
			// "wx": create it or fail. Never write through a name something else made.
			fd = fs.openSync(tmp, "wx", 0o600);
			fs.writeSync(fd, `${JSON.stringify(doc, null, "\t")}\n`);
			fs.closeSync(fd);
			fd = null;
			fs.chmodSync(tmp, 0o600); // explicit: the create mode is masked by the umask
			fs.renameSync(tmp, target);
		} catch (e) {
			if (fd !== null) try { fs.closeSync(fd); } catch { /* already closed */ }
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
