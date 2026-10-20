/**
 * @module packages/nana-pack/tests/launch-wait.mjs
 * @purpose Waits for review-test launch records without assuming process startup or record writes are immediate.
 * @inputs A record path, launcher-close promise, completeness predicate and optional wait timings.
 * @outputs The first complete record text, or null after closure or the wait limit.
 * @effects disk (record reads).
 * @errors Record read errors other than ENOENT propagate.
 */
import * as fs from "node:fs";

export const LAUNCH_RECORD_WAIT_MS = 60_000; // chosen: twelve times the old wait and above the slowest observed 34.7-second Windows check.
export const LAUNCH_RECORD_POLL_MS = 25; // chosen: preserves the prior polling step.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function awaitLaunchRecord(file, {
  closed,
  isComplete = () => true,
  limitMs = LAUNCH_RECORD_WAIT_MS,
  pollMs = LAUNCH_RECORD_POLL_MS,
}) {
  let hasClosed = false;
  const closedSettled = Promise.resolve(closed).then(() => { hasClosed = true; });
  const deadline = Date.now() + limitMs;
  for (;;) {
    try {
      const text = fs.readFileSync(file, "utf8");
      if (isComplete(text)) return text;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (hasClosed || Date.now() >= deadline) return null;
    const remainingMs = Math.max(0, deadline - Date.now());
    await Promise.race([closedSettled, delay(Math.min(pollMs, remainingMs))]);
  }
}
