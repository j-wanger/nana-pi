/**
 * @module packages/nana-pack/lib/lane-lock.mjs
 * @purpose Release a lane lock only while its stored owner is still the expected process.
 * @inputs lock path, expected owner pid, and optional filesystem seams
 * @outputs true only when the owned lock was removed
 * @effects disk (reads and may remove one lock file)
 * @errors never throws
 */
import * as fs from "node:fs";

/** Best-effort owner-checked lane-lock release. */
export function releaseLaneLock(lock, ownerPid = process.pid, { readFile = fs.readFileSync, remove = fs.rmSync } = {}) {
	if (!lock) return false;
	try {
		if (Number(readFile(lock, "utf8").trim()) !== ownerPid) return false;
		remove(lock, { force: true });
		return true;
	} catch {
		return false;
	}
}
