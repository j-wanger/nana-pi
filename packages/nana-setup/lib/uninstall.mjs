/**
 * @module packages/nana-setup/lib/uninstall.mjs
 * @purpose Removes only nana-setup-owned manifest pieces while preserving user state.
 * @inputs resolved layout, manifest rows with seed sources and settings lock helpers.
 * @outputs one result row per owned removable manifest piece and reported pi registrations.
 * @effects disk, process (launchctl print only for the real home).
 * @errors SetupError for unsafe preflight or concurrent settings changes.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { repoRoot, platform } from "./paths.mjs";
import { stateRows } from "./state-manifest.mjs";
import { desiredHooks, commandInvokes, removeInstallerHooks, removeRetiredContextHook, serialize } from "./settings.mjs";
import { readClaudeSettings, SetupError, withSettingsLock, writeSettingsAtomic, DESK_SERVER, realpathSafe, directoryAncestorsAreSafe } from "./steps.mjs";

const inside = (root, target) => { const rel = path.relative(root, target); return rel === "" || (!rel.startsWith(`..${path.sep}`) && rel !== ".." && !path.isAbsolute(rel)); };
const exists = (p) => { try { return fs.lstatSync(p); } catch (e) { if (e.code === "ENOENT" || e.code === "ENOTDIR") return null; throw e; } };
const result = (label, status, detail = "") => ({ label, status, detail });
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
const installerRows = (layout) => stateRows(layout).filter((r) => r.owner === "nana-setup" && ["link", "seed", "generated", "plist", "settings-entry"].includes(r.kind));

function settingsVariants(settings, layout) {
  const wanted = desiredHooks({ hooksDir: layout.hooksDir, repoRoot });
  const exact = new Set(wanted.map((w) => JSON.stringify(canonical(w.entry))));
  const found = [];
  for (const [event, groups] of Object.entries(settings?.hooks ?? {})) {
    if (!Array.isArray(groups)) continue;
    for (const group of groups) for (const hook of group?.hooks ?? []) {
      if (!hook || typeof hook.command !== "string" || exact.has(JSON.stringify(canonical(hook)))) continue;
      const match = wanted.find((w) => w.event === event && (commandInvokes(hook.command, w.spec) || hook.command.split(/\s+/u).some((part) => part.replaceAll("'", "").replaceAll('"', "").endsWith(`/${w.spec.script}`))));
      if (match) found.push(hook.command);
    }
  }
  return [...found];
}

export function uninstall(layout, { dryRun = false, afterTempWrite } = {}) {
  if (platform() === "win32") throw new SetupError("uninstall is POSIX-only");
  const rows = installerRows(layout);
  const removable = rows.filter((r) => r.kind !== "settings-entry");
  const settingsRow = rows.find((r) => r.kind === "settings-entry" && path.resolve(r.path) === path.resolve(layout.claudeSettings));
  const settingsLayout = settingsRow ? { ...layout, claudeSettings: settingsRow.path } : layout;
  const roots = [layout.base, layout.claudeHome, layout.piHome].map((root) => path.resolve(root));
  // Walk from the broadest selected root so nested roots cannot hide a symlink above them.
  // Independent explicit roots fall back to themselves because no broader root contains them.
  const rootFor = (target) => roots.filter((root) => inside(root, path.resolve(target))).sort((a, b) => a.length - b.length)[0];
  const preflightPaths = [...removable.map((r) => r.path), ...(settingsRow ? [settingsRow.path] : [])];
  for (const target of preflightPaths) {
    const directory = path.dirname(path.resolve(target));
    const root = rootFor(target);
    if (!root || !directoryAncestorsAreSafe(root, directory, true)) {
      return [result(path.basename(target), "problem", `unsafe ancestor directory: ${directory}; nothing was changed`)];
    }
  }

  const repoReal = fs.realpathSync(repoRoot);
  const inventoryLinks = removable.filter((r) => r.kind === "link");
  let hasLink = false;
  let inRepoLink = false;
  const targets = [];
  for (const row of inventoryLinks) {
    if (!exists(row.path)?.isSymbolicLink()) continue;
    hasLink = true;
    try {
      const target = fs.realpathSync(row.path);
      targets.push(`${row.path} -> ${target}`);
      if (inside(repoReal, target)) inRepoLink = true;
    } catch { targets.push(`${row.path} -> unresolved`); }
  }
  if (hasLink && !inRepoLink) throw new SetupError(`inventory links do not resolve inside ${repoReal}: ${targets.join("; ")}. Nothing was changed.`);

  const desk = removable.find((r) => r.kind === "plist");
  const plistStat = desk && exists(desk.path);
  if (layout.isRealHome && plistStat?.isFile() && !plistStat.isSymbolicLink() && fs.readFileSync(desk.path, "utf8").includes(DESK_SERVER) && typeof process.getuid === "function") {
    const loaded = spawnSync("launchctl", ["print", `gui/${process.getuid()}/com.nana.pi-desk`], { encoding: "utf8" });
    if (loaded.status === 0) return [result("desk plist", "problem", `desk service loaded — run: launchctl bootout gui/${process.getuid()}/com.nana.pi-desk, then re-run`)];
  }

  // Settings parsing and shape validation is read-only and precedes every possible write.
  if (settingsRow) {
    const settingsStat = exists(settingsRow.path);
    if (settingsStat && (settingsStat.isSymbolicLink() || !settingsStat.isFile())) {
      throw new SetupError(`${settingsRow.path} is not a regular file. Nothing was changed.`);
    }
  }
  const initial = readClaudeSettings(settingsLayout);
  const mutateSettings = (settings) => {
    const removed = removeInstallerHooks(settings, { hooksDir: layout.hooksDir, repoRoot });
    if (removeRetiredContextHook(settings, { hooksDir: layout.hooksDir })) removed.push("retired context-size hook");
    return removed;
  };
  const previewSettings = structuredClone(initial.settings);
  const removedSettings = mutateSettings(previewSettings);
  const variants = settingsVariants(initial.settings, layout);
  let settingsChanged = removedSettings.length > 0;
  if (settingsChanged && !dryRun) {
    withSettingsLock(settingsRow.path, () => {
      const fresh = readClaudeSettings(settingsLayout);
      if (fresh.snapshot.raw !== initial.snapshot.raw) throw new SetupError(`${settingsRow.path} changed on disk since uninstall preflight. Nothing was changed.`);
      const modified = structuredClone(fresh.settings);
      const removed = mutateSettings(modified);
      if (removed.length) writeSettingsAtomic(settingsRow.path, serialize(modified), fresh.snapshot, { afterTempWrite });
    });
  }

  const out = [result("settings hooks", settingsChanged ? (dryRun ? "created" : "updated") : "unchanged", settingsChanged ? `${dryRun ? "would remove" : "removed"}: ${removedSettings.join(", ")}` : "nothing to remove")];
  for (const command of variants) out.push(result("settings hook variant", "skipped", `left — ${command}`));
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
      const source = row.source;
      if (!st.isFile() || st.isSymbolicLink() || !source || !fs.readFileSync(row.path).equals(fs.readFileSync(source))) {
        out.push(result(row.store, "skipped", "left — edited since seeding (yours)")); continue;
      }
      if (!dryRun) fs.unlinkSync(row.path);
      out.push(result(row.store, dryRun ? "created" : "updated", `${dryRun ? "would remove" : "removed"} unchanged seed`));
      continue;
    }
    if (row.kind === "generated") {
      for (const file of [row.path, `${row.path}-wal`, `${row.path}-shm`]) {
        const side = exists(file);
        if (side?.isFile() && !side.isSymbolicLink()) { if (!dryRun) fs.unlinkSync(file); out.push(result(file, dryRun ? "created" : "updated", dryRun ? "would remove regular index file" : "removed regular index file")); }
      }
      continue;
    }
    if (row.kind === "plist") {
      if (!st) { out.push(result(row.store, "unchanged", "absent")); continue; }
      if (!st.isFile() || st.isSymbolicLink() || !fs.readFileSync(row.path, "utf8").includes(DESK_SERVER)) { out.push(result(row.store, "skipped", "left — not a regular plist containing this checkout's desk server path")); continue; }
      if (!dryRun) fs.unlinkSync(row.path);
      out.push(result(row.store, dryRun ? "created" : "updated", dryRun ? "would remove plist" : "removed plist"));
    }
  }
  out.push(result("pi registration", "skipped", "run `pi list` and `pi remove` the nana-pi entries (doctor's `pi packages` and `pi package source` rows name them)"));
  return out;
}
