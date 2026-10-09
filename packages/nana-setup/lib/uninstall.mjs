/**
 * @module packages/nana-setup/lib/uninstall.mjs
 * @purpose Removes only nana-setup-owned manifest pieces while preserving user state.
 * @inputs resolved layout, manifest rows, setup seed sources and settings lock helpers.
 * @outputs one result row per owned removable manifest piece and reported pi registrations.
 * @effects disk, process (launchctl print only for the real home).
 * @errors SetupError for unsafe preflight or concurrent settings changes.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { repoRoot, pkgRoot, platform } from "./paths.mjs";
import { stateRows } from "./state-manifest.mjs";
import { removeInstallerHooks, removeRetiredContextHook, serialize } from "./settings.mjs";
import { readClaudeSettings, SetupError, withSettingsLock, writeSettingsAtomic, DESK_SERVER, registrationState, realpathSafe } from "./steps.mjs";

const inside = (root, target) => { const rel = path.relative(root, target); return rel === "" || (!rel.startsWith(`..${path.sep}`) && rel !== ".." && !path.isAbsolute(rel)); };
const exists = (p) => { try { return fs.lstatSync(p); } catch (e) { if (e.code === "ENOENT" || e.code === "ENOTDIR") return null; throw e; } };
const sourceForSeed = (store) => ({
  "private rule": path.join(pkgRoot, "claude", "rules", "nana-personal.example.md"),
  "shared memory seed": path.join(pkgRoot, "claude", "memory", "MEMORY.seed.md"),
  "pi pack config": path.join(pkgRoot, "pi", "nana-pack.seed.json"),
  "pi objective": path.join(pkgRoot, "pi", "nana-objective.seed.md"),
  "subagent config.json": path.join(pkgRoot, "pi", "subagent-config.seed.json"),
  "reviewer.md": path.join(pkgRoot, "pi", "reviewer.seed.md"),
}[store]);
const result = (label, status, detail = "") => ({ label, status, detail });

export function uninstall(layout, { dryRun = false, afterTempWrite } = {}) {
  if (platform() === "win32") throw new SetupError("uninstall is POSIX-only");
  const rows = stateRows(layout).filter((r) => (r.owner === "nana-setup" || r.store === "knowledge index") && ["link", "seed", "generated", "plist", "settings-entry"].includes(r.kind));
  const removable = rows.filter((r) => r.kind !== "settings-entry");
  const inventoryLinks = removable.filter((r) => r.kind === "link");
  const repoReal = fs.realpathSync(repoRoot);
  let inRepoLink = false;
  for (const row of inventoryLinks) {
    if (!exists(row.path)?.isSymbolicLink()) continue;
    try { if (inside(repoReal, fs.realpathSync(row.path))) inRepoLink = true; } catch { /* dangling link */ }
  }
  if (inventoryLinks.some((r) => exists(r.path)?.isSymbolicLink()) && !inRepoLink) {
    const targets = inventoryLinks.filter((r) => exists(r.path)?.isSymbolicLink()).map((r) => {
      try { return `${r.path} -> ${fs.realpathSync(r.path)}`; } catch { return `${r.path} -> unresolved`; }
    });
    throw new SetupError(`inventory links do not resolve inside ${repoReal}: ${targets.join("; ")}. Nothing was changed.`);
  }

  const initial = readClaudeSettings(layout);
  const mutateSettings = (settings) => {
    const removed = removeInstallerHooks(settings, { hooksDir: layout.hooksDir, repoRoot });
    if (removeRetiredContextHook(settings, { hooksDir: layout.hooksDir })) removed.push("retired context-size hook");
    return removed;
  };
  let removedSettings = [];
  if (dryRun) removedSettings = mutateSettings(structuredClone(initial.settings));
  else removedSettings = withSettingsLock(layout.claudeSettings, () => {
    const fresh = readClaudeSettings(layout);
    if (fresh.snapshot.raw !== initial.snapshot.raw) throw new SetupError(`${layout.claudeSettings} changed on disk since uninstall preflight. Nothing was changed.`);
    const modified = structuredClone(fresh.settings);
    const removed = mutateSettings(modified);
    if (removed.length) writeSettingsAtomic(layout.claudeSettings, serialize(modified), fresh.snapshot, { afterTempWrite });
    return removed;
  });

  const out = [result("settings hooks", removedSettings.length ? (dryRun ? "created" : "updated") : "unchanged", removedSettings.length ? `${dryRun ? "would remove" : "removed"}: ${removedSettings.join(", ")}` : "nothing to remove")];
  for (const row of removable) {
    const st = exists(row.path);
    if (row.kind === "link") {
      if (!st) { out.push(result(row.store, "unchanged", "absent")); continue; }
      if (!st.isSymbolicLink()) { out.push(result(row.store, "skipped", `left — found ${st.isDirectory() ? "directory" : "regular file"}: ${row.path}`)); continue; }
      let target;
      try { target = fs.realpathSync(row.path); } catch { out.push(result(row.store, "skipped", `left — dangling symlink: ${row.path}`)); continue; }
      if (!inside(repoReal, target)) { out.push(result(row.store, "skipped", `left — symlink resolves outside repository: ${target}`)); continue; }
      if (!dryRun) fs.unlinkSync(row.path);
      out.push(result(row.store, dryRun ? "created" : "updated", `${dryRun ? "would unlink" : "unlinked"} ${target}`));
      continue;
    }
    if (row.kind === "seed") {
      if (!st) { out.push(result(row.store, "unchanged", "absent")); continue; }
      const source = sourceForSeed(row.store);
      if (!st.isFile() || st.isSymbolicLink() || !source || !fs.readFileSync(row.path).equals(fs.readFileSync(source))) {
        out.push(result(row.store, "skipped", "left — edited since seeding (yours)")); continue;
      }
      if (!dryRun) fs.unlinkSync(row.path);
      out.push(result(row.store, dryRun ? "created" : "updated", `${dryRun ? "would remove" : "removed"} unchanged seed`));
      continue;
    }
    if (row.store === "knowledge index") {
      for (const file of [row.path, `${row.path}-wal`, `${row.path}-shm`]) {
        const side = exists(file);
        if (side?.isFile() && !side.isSymbolicLink()) { if (!dryRun) fs.unlinkSync(file); out.push(result(file, dryRun ? "created" : "updated", dryRun ? "would remove regular index file" : "removed regular index file")); }
      }
      continue;
    }
    if (row.kind === "plist") {
      if (!st) { out.push(result(row.store, "unchanged", "absent")); continue; }
      if (!st.isFile() || st.isSymbolicLink() || !fs.readFileSync(row.path, "utf8").includes(DESK_SERVER)) { out.push(result(row.store, "skipped", "left — not a regular plist containing this checkout's desk server path")); continue; }
      if (layout.isRealHome && typeof process.getuid === "function") {
        const loaded = spawnSync("launchctl", ["print", `gui/${process.getuid()}/com.nana.pi-desk`], { encoding: "utf8" });
        if (loaded.status === 0) { out.push(result(row.store, "problem", `desk service loaded — run: launchctl bootout gui/${process.getuid()}/com.nana.pi-desk, then re-run`)); continue; }
      }
      if (!dryRun) fs.unlinkSync(row.path);
      out.push(result(row.store, dryRun ? "created" : "updated", dryRun ? "would remove plist" : "removed plist"));
    }
  }
  const coverage = registrationState(layout);
  for (const entry of coverage.entries) {
    if (/^(npm:|git:|https?:)/.test(entry)) { out.push(result("pi registration", "skipped", `left (remote): ${entry}`)); continue; }
    const expanded = entry === "~" ? layout.base : entry.startsWith("~/") ? path.join(layout.base, entry.slice(2)) : entry;
    const resolved = realpathSafe(path.resolve(layout.piHome, expanded));
    if (coverage.packageRoots.some((root) => inside(realpathSafe(root), resolved))) out.push(result("pi registration", "skipped", `run: pi remove '${entry}'`));
  }
  return out;
}
