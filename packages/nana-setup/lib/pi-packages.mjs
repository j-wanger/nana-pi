/**
 * @module packages/nana-setup/lib/pi-packages.mjs
 * @purpose Find the package behind the pi executable and judge its installed scoped dependencies.
 * @inputs pi invocation state, environment, injected version and PATH helpers, and package.json files above the executable and in dependency lookup paths.
 * @outputs piPackagesState() returning one doctor-row state { status, detail }.
 * @effects disk (reads executable real paths and package manifests).
 * @errors none thrown — an unresolved package or unreadable version returns a note state.
 */
import fs from "node:fs";
import path from "node:path";
import { PI_PACKAGE } from "../../nana-pack/bin/worker-config.mjs";
import { PI_INSTALL_HINT } from "./steps.mjs";

const VERSION = /^\d+\.\d+\.\d+$/;

function readJson(file, readText) {
  try { return JSON.parse(readText(file)); }
  catch { return null; }
}

// Copied from apps/desk/pi-session.mjs walkUpToPackage: resolve the executable, then inspect at
// most six containing folders. nana-setup cannot import from the frozen desk application.
function walkUpToPackage(executable, { paths, readText, realpath, resolveRealPath }) {
  if (!executable) return null;
  let resolved = executable;
  if (resolveRealPath) {
    try { resolved = realpath(executable); }
    catch { return null; }
  }
  let dir = paths.dirname(resolved);
  for (let level = 0; level < 6 && dir && dir !== paths.dirname(dir); level++, dir = paths.dirname(dir)) {
    const manifest = readJson(paths.join(dir, "package.json"), readText);
    if (manifest?.name === PI_PACKAGE) return { root: dir, manifest };
  }
  return null;
}

function dependencyManifest(packageRoot, name, { paths, readText }) {
  let dir = packageRoot;
  for (;;) {
    const root = paths.join(dir, "node_modules", ...name.split("/"));
    const manifest = readJson(paths.join(root, "package.json"), readText);
    if (manifest) return manifest;
    const parent = paths.dirname(dir);
    if (!parent || parent === dir) return null;
    dir = parent;
  }
}

export function piPackagesState({
  win32 = false,
  env = process.env,
  piEntry = null,
  versionAtLeast,
  firstOnPath,
  readText = (file) => fs.readFileSync(file, "utf8"),
  realpath = fs.realpathSync,
} = {}) {
  const paths = win32 ? path.win32 : path;
  const executable = win32 ? piEntry : firstOnPath("pi", env.PATH);
  const found = walkUpToPackage(executable, { paths, readText, realpath, resolveRealPath: !win32 });
  if (!found) return { status: "note", detail: "no pi package found for the pi executable on PATH" };

  const piVersion = found.manifest?.version;
  if (typeof piVersion !== "string" || !VERSION.test(piVersion)) {
    return { status: "note", detail: `could not read an exact three-part version from ${PI_PACKAGE}` };
  }
  const scope = `${PI_PACKAGE.split("/")[0]}/`;
  const names = Object.keys(found.manifest.dependencies ?? {}).filter((name) => name.startsWith(scope));
  const newer = [];
  const unreadable = [];
  for (const name of names) {
    const manifest = dependencyManifest(found.root, name, { paths, readText });
    const version = manifest?.version;
    if (typeof version !== "string" || !VERSION.test(version)) {
      unreadable.push(name);
      continue;
    }
    if (versionAtLeast(version, piVersion) && !versionAtLeast(piVersion, version)) newer.push(`${name} ${version}`);
  }
  if (newer.length) {
    return {
      status: "fail",
      detail: `${newer.join(", ")} newer than pi ${piVersion} — install: ${PI_INSTALL_HINT}`,
    };
  }
  if (unreadable.length) {
    return {
      status: "note",
      detail: `could not read an exact three-part installed version for ${unreadable.join(", ")}`,
    };
  }
  return { status: "ok", detail: `pi ${piVersion}; ${names.length} scoped packages read` };
}
