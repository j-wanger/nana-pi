/**
 * @module apps/desk/test/tmp-dir.mjs
 * @purpose Create test temporary roots and remove them when the test process exits.
 * @inputs A mkdtemp prefix or finished temporary root.
 * @outputs The created temporary directory path, or removal of a finished root.
 * @effects disk (creates and removes temporary directories), process (registers exit cleanup)
 * @errors Explicit creation/removal errors propagate; exit-time cleanup errors are ignored.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { TEMP_REMOVE_RETRIES, TEMP_REMOVE_RETRY_DELAY_MS } from "../../../packages/nana-pack/lib/test-runner-config.mjs";

const roots = new Set();
process.on("exit", () => {
  for (const root of roots) {
    try { removeTmpDir(root); } catch {}
  }
});

/** Remove a finished fixture with the runner's Windows busy-file retry policy. */
export function removeTmpDir(root) {
  rmSync(root, { recursive: true, force: true, maxRetries: TEMP_REMOVE_RETRIES, retryDelay: TEMP_REMOVE_RETRY_DELAY_MS });
  roots.delete(root);
}

export function tmpDir(prefix) {
  const root = mkdtempSync(prefix);
  roots.add(root);
  return root;
}
