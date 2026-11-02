/**
 * @module packages/nana-setup/tests/knowledge-state.mjs
 * @purpose Describe the observable state of a nana knowledge index for failure diagnostics.
 * @inputs A knowledge-home path and node:sqlite database access.
 * @outputs A state description with database time, WAL size, build-lock age and built_at.
 * @effects disk (stat and read-only database access).
 * @errors Database busy is represented as `busy`; unavailable values are represented as null.
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

// chosen: diagnostics run after the build wait, when avoiding a probe-induced lock matters.
const READ_BUSY_TIMEOUT_MS = 1000;

export function describeKnowledgeHome(home, now = Date.now()) {
	const index = path.join(home, "index.db");
	const wal = `${index}-wal`;
	const lock = path.join(home, "build.lock");
	let indexMtimeMs = null;
	let walBytes = null;
	let buildLockPresent = false;
	let buildLockAgeMs = null;
	try { indexMtimeMs = fs.statSync(index).mtimeMs; } catch {}
	try { walBytes = fs.statSync(wal).size; } catch {}
	try { const st = fs.statSync(lock); buildLockPresent = true; buildLockAgeMs = Math.max(0, now - st.mtimeMs); } catch {}
	let builtAt = null;
	try {
		const db = new DatabaseSync(index, { readOnly: true, timeout: READ_BUSY_TIMEOUT_MS });
		try { builtAt = db.prepare("SELECT value FROM meta WHERE key = ?").get("built_at")?.value ?? null; }
		finally { db.close(); }
	} catch (error) {
		builtAt = /busy|locked/i.test(String(error?.message)) ? "busy" : null;
	}
	return { indexMtimeMs, walBytes, buildLockPresent, buildLockAgeMs, builtAt };
}
