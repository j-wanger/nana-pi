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
 * So the key becomes a property of the SESSION, and this directory is where the desk
 * writes down which keys it issued for which session:
 *
 *   ~/.pi/agent/nana-desk/stage-keys/<pi session id>.json   0700 dir, 0600 files
 *   {"v":1,"keys":["<hex>", …],"updatedAt":<ms>}            ≤8, most recent first
 *
 * ONE FILE PER SESSION, and that shape is the point. A single shared file needed a
 * read-merge-write, which needed a cross-process lock, which needed stale-lock
 * takeover and a retry loop — a failure class whose worst case (a wedged desk) was
 * worse than the blank stage it existed to prevent. Here every write is one
 * temp-file-plus-rename of one small file that only that session's records live in,
 * so there is nothing to merge and nothing to serialize.
 *
 * The file is read on EVERY lookup, and a record is written as read-union-write.
 * There is no cache: two desks are both live, and a desk that answered from its own
 * memory redacted the other's blocks while it was still running, then overwrote its
 * record with a stale one. What is left is a genuine race — two desks writing the
 * same session's file in the same instant, where the later write wins and one new
 * key is lost — and that is declared rather than locked away.
 *
 * Keyed by the pi session header `id`, never by the file path: a session file gets
 * renamed on a title append and resumed by its new name, and the id survives that.
 *
 * Rules that make this safe to reason about:
 *   · A CHILD still signs with exactly one key, and the live tool-event path still
 *     verifies against that one key only. This record only widens the LEDGER read,
 *     which asks "did this desk issue the key that signed this block for this
 *     session?" A co-resident extension forging blocks, or a hand-edited session
 *     file, holds none of them.
 *   · Nothing here ever makes an unverifiable block acceptable. A session we have
 *     no record for simply gets a fresh key, and its older blocks stay redacted.
 *   · Persistence is BEST EFFORT: a write that fails costs continuity across the
 *     next restart, never the request. The keys it could not save are held in memory
 *     and overlaid on what the file says, and the next record for that session
 *     retries the write.
 *   · Reading these files is enough to mint blocks that pass the check for the
 *     sessions they name — the same authority the desk process itself has — which
 *     is why they are 0600 in a 0700 directory.
 *   · No method throws at its caller. This sits under a request handler.
 */

import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// One key per desk restart / re-spawn of a session. Eight covers a working week of
// them; beyond that the oldest drops off and blocks signed under it go back to
// being unverifiable — the honest outcome, not a silent acceptance.
export const KEYS_PER_SESSION = 8;
const KEY_RE = /^[0-9a-f]{64}$/;
// A session id becomes a FILENAME here, so it is validated before it is either
// recorded or looked up: pi's ids are UUID-like, and anything that is not simply
// name-shaped is refused rather than escaped.
const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

// DESK_STAGE_KEYS: tests only (same convention as DESK_APPS_DIR); it names the
// DIRECTORY. The real path follows $HOME like every other ~/.pi/agent save, so a
// test that isolates HOME isolates this too.
export const defaultStageKeysDir = () =>
	process.env.DESK_STAGE_KEYS || path.join(os.homedir(), ".pi", "agent", "nana-desk", "stage-keys");

export class StageKeyStore {
	/**
	 * @param dir             store directory (defaults to ~/.pi/agent/nana-desk/stage-keys)
	 * @param knownSessionIds () => Set<sessionId> — the desk's OWN session enumeration,
	 *                        injected so this module never walks the sessions tree itself
	 * @param log             one-line warnings (console.error in the desk)
	 */
	constructor({ dir = defaultStageKeysDir(), knownSessionIds = null, log = console.error } = {}) {
		this.configuredDir = dir;
		this.dir = dir; // replaced by the resolved path at first use
		this.knownSessionIds = knownSessionIds;
		this.log = log;
		// NOT a cache. The FILE is authority, read on every call: a long-lived cache
		// made this desk redact another desk's blocks while it was still running, and
		// then overwrite its record with a stale one. This map holds only the keys
		// whose own write FAILED, overlaid on what the file says so a failed save
		// costs continuity across a restart and nothing sooner.
		this.pending = new Map(); // id → [keys] we hold but could not persist
		this.ready = false;
	}

	// Every key this desk has recorded for a session, most recent first. Reads the
	// file each time — the records are one short line, and being current matters more
	// than the read: another desk may have added keys since.
	keysFor(id) {
		if (!ID_RE.test(id || "")) return [];
		this.#ensureReady();
		return union(this.pending.get(id), this.#readRecord(id));
	}

	// Record that `key` was issued for session `id`. Returns whether anything changed
	// — a key we already hold costs nothing and touches no file, which is what keeps
	// the ledger read (which calls this on every replay) off the write path.
	record(id, key) {
		if (!ID_RE.test(id || "") || !KEY_RE.test(key || "")) return false;
		const cur = this.keysFor(id); // re-read: never write back a stale list
		const held = cur.includes(key);
		if (held && !this.pending.has(id)) return false; // nothing to add, nothing owed
		this.#write(id, held ? cur : union([key], cur));
		return !held;
	}

	// Seed a session's record from another's. The ONE case for it: pi's fork and
	// clone copy the source session's custom entries UNCHANGED into a new file with a
	// NEW header id, so blocks that verified a moment earlier would go blank under an
	// id nothing was recorded for. The caller establishes the source by asking the
	// child what it holds BEFORE the fork (server.mjs `lifecycleRpc`) — never from
	// `parentSession` text in the file, which a session file is not authority for.
	// A UNION, not "fill a blank". An overlapping ledger read can create the
	// destination's record — with the live child's key alone — between the fork and
	// the moment the desk confirms it, and refusing then stranded the inherited blocks
	// for good. Adding is safe: these are keys already recorded for a source this desk
	// CONFIRMED the child was holding, which is exactly the set the copied blocks
	// verified under a moment earlier. Whatever is already there stays in front, so
	// the live child's key remains the most recent.
	seed(id, keys) {
		if (!ID_RE.test(id || "") || !Array.isArray(keys) || !keys.length) return false;
		const valid = keys.filter((k) => KEY_RE.test(k || ""));
		if (!valid.length) return false;
		const cur = this.keysFor(id);
		const next = union(cur, valid);
		if (next.length === cur.length) return false; // nothing new to add
		this.#write(id, next);
		return true;
	}

	#warn(msg) {
		try {
			this.log(msg);
		} catch {
			/* a logger that throws must not take the desk with it */
		}
	}

	#file(id) {
		return path.join(this.dir, `${id}.json`);
	}

	// Open the store directory once, on FIRST use rather than at desk startup: the
	// prune reads a session header per file, and a desk that never opens an app
	// should not pay for it. First use is the first app spawn.
	#ensureReady() {
		if (this.ready) return;
		this.ready = true;
		this.#openDir();
		this.#prune();
	}

	#openDir() {
		let created;
		try {
			created = fs.mkdirSync(this.configuredDir, { recursive: true, mode: 0o700 });
		} catch (e) {
			this.#warn(`stage keys: cannot create ${this.configuredDir} (${e.message}) — keys are held in memory for this desk only`);
		}
		// We only ever set the mode on a directory WE created. A directory that was
		// already there belongs to whoever made it: say once that it is loose and leave
		// it, rather than re-permissioning a path the operator may share.
		if (created === undefined) {
			try {
				const mode = fs.statSync(this.configuredDir).mode & 0o777;
				if (mode !== 0o700)
					this.#warn(`stage keys: ${this.configuredDir} is mode ${mode.toString(8)}, not 0700 — anyone who can read it can mint blocks that pass the stage's provenance check`);
			} catch {
				/* the first read that needs it will report the real problem */
			}
		}
		// A symlinked store directory is resolved ONCE, here, and every file operation
		// afterwards works on the resolved directory — so a link is followed, and no
		// per-file rename can replace it.
		try {
			this.dir = fs.realpathSync(this.configuredDir);
		} catch {
			this.dir = this.configuredDir;
		}
	}

	// Store hygiene: forget sessions that no longer exist on disk. The id set comes
	// from the desk's own session enumeration (no second filesystem walk here).
	#prune() {
		if (!this.knownSessionIds) return;
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
		let files;
		try {
			files = fs.readdirSync(this.dir);
		} catch {
			return;
		}
		for (const f of files) {
			if (!f.endsWith(".json")) continue; // leaves .corrupt-* and stray temps alone
			const id = f.slice(0, -5);
			// Only a name this store could have WRITTEN is a candidate. Anything else in
			// the directory (`operator.notes.json`, say) is someone else's file, and a
			// hygiene pass has no business deleting it.
			if (!ID_RE.test(id) || known.has(id)) continue;
			try {
				fs.unlinkSync(path.join(this.dir, f));
			} catch {
				/* already gone, or not ours to remove */
			}
		}
	}

	#readRecord(id) {
		const file = this.#file(id);
		let raw;
		try {
			raw = fs.readFileSync(file, "utf-8");
		} catch (e) {
			if (e?.code !== "ENOENT") this.#warn(`stage keys: cannot read ${file}: ${e.message}`);
			return [];
		}
		const keys = parseRecord(raw);
		if (keys) return keys;
		// Unreadable: move THAT session's file aside — never delete it — and start that
		// session blank. One bad file costs one session's continuity, nothing else.
		const to = `${file}.corrupt-${Date.now()}`;
		try {
			fs.renameSync(file, to);
			this.#warn(`stage keys: ${file} is not a readable v1 record — moved to ${to}, starting that session blank`);
		} catch (e) {
			this.#warn(`stage keys: ${file} is unreadable and could not be moved aside (${e.message})`);
		}
		return [];
	}

	// In-memory first, then the file: a save that fails must not cost this desk the
	// keys it just issued. Atomic within the directory (temp + rename), so a reader
	// sees either the old record or the new one.
	#write(id, keys) {
		const file = this.#file(id);
		let tmp = null;
		let fd = null;
		try {
			// inside the try: an entropy source that throws follows the same in-memory
			// fallback as a disk that will not take the write
			tmp = `${file}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
			// "wx": create it or fail. Never write through a name something else made.
			fd = fs.openSync(tmp, "wx", 0o600);
			fs.writeSync(fd, `${JSON.stringify({ v: 1, keys, updatedAt: Date.now() })}\n`);
			fs.closeSync(fd);
			fd = null;
			fs.chmodSync(tmp, 0o600); // explicit: the create mode is masked by the umask
			fs.renameSync(tmp, file);
			this.pending.delete(id);
			return true;
		} catch (e) {
			if (fd !== null) {
				try {
					fs.closeSync(fd);
				} catch {
					/* already closed */
				}
			}
			if (tmp) {
				try {
					fs.unlinkSync(tmp);
				} catch {
					/* nothing to clean up */
				}
			}
			// Held in memory so this desk keeps verifying what it just issued; overlaid
			// on the file by keysFor, and retried by the next record for this session.
			this.pending.set(id, keys);
			this.#warn(`stage keys: could not save ${file} (${e.message}) — held in memory for this desk only; the next record for this session retries`);
			return false;
		}
	}
}

// Most-recent-first, de-duplicated, capped. `a` keeps its order and its place at the
// front; `b` contributes only what `a` does not already have.
function union(a, b) {
	const out = [...(a || [])];
	for (const k of b || []) if (!out.includes(k)) out.push(k);
	return out.slice(0, KEYS_PER_SESSION);
}

// Shape check, not a parse convenience: anything that is not a v1 record reads as
// "unusable" so the caller can move it aside rather than silently treat a foreign
// file as an empty record and overwrite it.
function parseRecord(raw) {
	let doc;
	try {
		doc = JSON.parse(raw);
	} catch {
		return null;
	}
	if (!doc || typeof doc !== "object" || Array.isArray(doc) || doc.v !== 1 || !Array.isArray(doc.keys)) return null;
	return doc.keys.filter((k) => typeof k === "string" && KEY_RE.test(k)).slice(0, KEYS_PER_SESSION);
}
