/**
 * @module packages/nana-pack/lib/rename-retry.mjs
 * @purpose Provide one synchronous retry policy for transient rename failures on every platform.
 * @inputs source and destination paths plus optional rename, delay and recheck seams
 * @outputs renameWithRetry and sealed attempt, delay and retry-code constants
 * @effects disk
 * @errors throws the last rename error
 */
import { renameSync } from "node:fs";

// chosen 2026-10-17 in project.mjs's Windows triage and carried into the shared policy.
export const RENAME_RETRY_ATTEMPTS = 3;
// chosen 2026-10-17: two waits total at the attempt bound, short enough to keep a lasting error prompt.
export const RENAME_RETRY_DELAY_MS = 20;
// chosen 2026-10-22: the union of the setup refresh and review-text store's transient codes.
export const RENAME_RETRY_CODES = Object.freeze(["EPERM", "EBUSY", "EACCES"]);

/** Retry a transient rename, checking the destination after each delay and before each retry. */
export function renameWithRetry(src, dest, {
	rename = renameSync,
	delay = () => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, RENAME_RETRY_DELAY_MS),
	recheck = () => {},
} = {}) {
	for (let attempt = 1; ; attempt++) {
		try {
			rename(src, dest);
			return;
		} catch (error) {
			if (attempt >= RENAME_RETRY_ATTEMPTS || !RENAME_RETRY_CODES.includes(error?.code)) throw error;
			delay();
			recheck();
		}
	}
}
