/**
 * @module packages/nana-pack/tests/tmp-dir.mjs
 * @purpose Create test temporary roots, removing them when the test process exits unless the
 *  caller opts out to clean the root up itself (one holding a symlink or junction that no
 *  generic recursive delete may ever meet).
 * @inputs A mkdtemp prefix.
 * @outputs The created temporary directory path.
 * @effects disk (creates and removes temporary directories), process (registers exit cleanup)
 * @errors Propagates directory creation errors and ignores cleanup errors.
 */
import { mkdtempSync, rmSync } from "node:fs";

const roots = new Set();
process.on("exit", () => {
  for (const root of roots) {
    try { rmSync(root, { recursive: true, force: true }); } catch {}
  }
});

export function tmpDir(prefix) {
  const root = mkdtempSync(prefix);
  roots.add(root);
  return root;
}

/** Like tmpDir, but never registered for the exit-time recursive removal: for a root that will
 *  hold a symlink or junction, where only the caller's own unlink-then-rmdir may ever touch it. */
export function tmpDirUnmanaged(prefix) {
  return mkdtempSync(prefix);
}
