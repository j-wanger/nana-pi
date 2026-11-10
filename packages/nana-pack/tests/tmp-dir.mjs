/**
 * @module packages/nana-pack/tests/tmp-dir.mjs
 * @purpose Create canonical test temporary roots and exercise explicit aliases, removing roots when the test process exits unless the
 *  caller opts out to clean the root up itself (one holding a symlink or junction that no
 *  generic recursive delete may ever meet).
 * @inputs A mkdtemp prefix, or a root and alias action; CI and platform for alias availability.
 * @outputs The created temporary directory path.
 * @effects disk (creates and removes temporary directories and links), process (registers exit cleanup, probes Windows short paths and temporarily changes temp environment)
 * @errors Propagates directory creation errors and ignores cleanup errors.
 */
import { mkdtempSync, realpathSync, rmSync, symlinkSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";

const roots = new Set();
process.on("exit", () => {
  for (const root of roots) {
    try { rmSync(root, { recursive: true, force: true }); } catch {}
  }
});

export function tmpDir(prefix) {
  const root = tmpDirUnmanaged(prefix);
  roots.add(root);
  return root;
}

/** Like tmpDir, but never registered for the exit-time recursive removal: for a root that will
 *  hold a symlink or junction, where only the caller's own unlink-then-rmdir may ever touch it. */
export function tmpDirUnmanaged(prefix) {
  return realpathSync.native(mkdtempSync(prefix));
}

/** Exercise an explicit temp-root alias; unlink POSIX aliases before removing their holder. */
export async function withTempRootAlias(root, title, action) {
  const exercise = async (alias) => {
    const keys = ["TMPDIR", "TEMP", "TMP", "NANA_TEST_TEMP_ROOTS"];
    const saved = keys.map(key => process.env[key]);
    try {
      for (const key of keys.slice(0, 3)) process.env[key] = alias;
      delete process.env.NANA_TEST_TEMP_ROOTS;
      return await action(alias);
    } finally {
      keys.forEach((key, index) => { if (saved[index] === undefined) delete process.env[key]; else process.env[key] = saved[index]; });
    }
  };
  if (process.platform === "win32") {
    const probe = spawnSync("powershell", ["-NoProfile", "-Command", `(New-Object -ComObject Scripting.FileSystemObject).GetFolder('${root.replaceAll("'", "''")}').ShortPath`], { encoding: "utf8", timeout: 10000 });
    const alias = probe.status === 0 ? probe.stdout.trim() : "";
    if (alias && alias.toLowerCase() !== root.toLowerCase()) return await exercise(alias);
    if (process.env.CI) throw new Error(`${title}: a distinct 8.3 path is required in CI: ${probe.stderr}`);
    console.log(`SKIP ${title} — no distinct 8.3 path is available`);
    return;
  }
  const holder = tmpDirUnmanaged(join(dirname(root), "temp-alias-"));
  const alias = join(holder, "alias");
  try {
    symlinkSync(root, alias);
    return await exercise(alias);
  } finally {
    try { unlinkSync(alias); } finally { rmSync(holder, { recursive: true, force: true }); }
  }
}
