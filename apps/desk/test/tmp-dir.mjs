/**
 * @module apps/desk/test/tmp-dir.mjs
 * @purpose Create test temporary roots and remove them when the test process exits.
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
