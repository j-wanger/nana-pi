/**
 * @module scripts/playwright-resolve.mjs
 * @purpose Resolves optional Playwright from the explicit root, scripts or the main checkout.
 * @inputs Environment and repository root.
 * @outputs Playwright module or null.
 * @effects process (git common-dir lookup), disk (module resolution)
 * @errors Missing modules return null.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export function resolvePlaywright(env, root) {
  const common = spawnSync("git", ["rev-parse", "--git-common-dir"], { cwd: root, encoding: "utf8" });
  const commonDir = common.status === 0 ? path.resolve(root, common.stdout.trim()) : null;
  const mainRoot = commonDir ? path.dirname(commonDir) : null;
  for (const base of [env.PW_ROOT, SCRIPT_DIR, mainRoot].filter(Boolean)) {
    const require = createRequire(path.join(path.resolve(base), "first-look-resolve.cjs"));
    for (const name of ["playwright", "playwright-core"]) {
      try { return require(name); } catch { /* try the next declared location */ }
    }
  }
  return null;
}
