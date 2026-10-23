/**
 * @module packages/nana-setup/tests/doctor-pi-packages.test.mjs
 * @purpose Pins doctor's diagnosis of the scoped dependencies installed for the pi package on PATH.
 * @inputs doctor.mjs, steps.mjs, and synthetic npm package trees under OS temporary folders.
 * @outputs PASS/FAIL lines and a nonzero exit on failed checks.
 * @effects disk (writes temporary package, executable, and npm-stub fixtures).
 * @errors Failed assertions are reported and set a nonzero exit code.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { diagnose } from "../lib/doctor.mjs";
import { resolveLayout } from "../lib/paths.mjs";
import { PI_INSTALL_HINT } from "../lib/steps.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const PACKAGE = "@earendil-works/pi-coding-agent";
const cases = [];
const check = (title, fn) => cases.push({ title, fn });
const homes = [];

function writeJson(file, value, ending = "") {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2).replace(/\n/g, "\r\n") + ending);
}

function posixFixture({ piVersion = "1.0.3", omitPiVersion = false, dependencies = {}, devDependencies, installed = {}, decoy = false } = {}) {
  const home = tmpDir(path.join(os.tmpdir(), "nana-doctor-pi-packages-"));
  homes.push(home);
  const prefix = path.join(home, "prefix");
  const packageRoot = path.join(prefix, "lib", "node_modules", ...PACKAGE.split("/"));
  const entry = path.join(packageRoot, "dist", "bundle", "cli.js");
  const bin = path.join(prefix, "bin");
  const manifest = { name: PACKAGE, dependencies };
  if (!omitPiVersion) manifest.version = piVersion;
  if (devDependencies) manifest.devDependencies = devDependencies;
  writeJson(path.join(packageRoot, "package.json"), manifest, "\t");
  fs.mkdirSync(path.dirname(entry), { recursive: true });
  fs.writeFileSync(entry, "#!/bin/sh\nexit 0", { mode: 0o755 });
  fs.mkdirSync(bin, { recursive: true });
  fs.symlinkSync(entry, path.join(bin, "pi"));
  for (const [name, spec] of Object.entries(installed)) {
    if (spec === null) continue;
    const where = typeof spec === "object" && spec.where ? spec.where : "nested";
    const version = typeof spec === "object" ? spec.version : spec;
    const depRoot = where === "hoisted"
      ? path.join(prefix, "lib", "node_modules", ...name.split("/"))
      : path.join(packageRoot, "node_modules", ...name.split("/"));
    writeJson(path.join(depRoot, "package.json"), { name, version }, "\t");
  }
  const env = { PATH: `${bin}${path.delimiter}/usr/bin:/bin` };
  if (decoy) {
    const decoyPrefix = path.join(home, "decoy");
    const decoyRoot = path.join(decoyPrefix, "lib", "node_modules");
    const decoyPackage = path.join(decoyRoot, ...PACKAGE.split("/"));
    writeJson(path.join(decoyPackage, "package.json"), { name: PACKAGE, version: piVersion, dependencies });
    for (const name of Object.keys(dependencies)) {
      if (!name.startsWith("@earendil-works/")) continue;
      writeJson(path.join(decoyPackage, "node_modules", ...name.split("/"), "package.json"), { name, version: piVersion });
    }
    fs.writeFileSync(path.join(bin, "npm"), `#!/bin/sh\n[ "$1 $2" = "root -g" ] || exit 2\nprintf '%s\\n' '${decoyRoot}'`, { mode: 0o755 });
    env.npm_config_prefix = decoyPrefix;
  }
  return { home, env, spawn: () => ({ status: 0, stdout: `${piVersion}\n`, stderr: "" }) };
}

function outsideFixture() {
  const home = tmpDir(path.join(os.tmpdir(), "nana-doctor-pi-outside-"));
  homes.push(home);
  const bin = path.join(home, "bin");
  fs.mkdirSync(bin, { recursive: true });
  fs.writeFileSync(path.join(bin, "pi"), "#!/bin/sh\necho 1.0.3", { mode: 0o755 });
  return { home, env: { PATH: `${bin}${path.delimiter}/usr/bin:/bin` }, spawn: () => ({ status: 0, stdout: "1.0.3\n" }) };
}

function winFixture({ newer = true } = {}) {
  const home = tmpDir(path.join(os.tmpdir(), "nana-doctor-pi-win-"));
  homes.push(home);
  const win = path.win32;
  const prefix = "C:\\npm";
  const packageRoot = win.join(prefix, "node_modules", ...PACKAGE.split("/"));
  const entry = win.join(packageRoot, "dist", "bundle", "cli.js");
  const files = new Map();
  const put = (file, value) => files.set(win.normalize(file).toLowerCase(), JSON.stringify(value));
  put(win.join(packageRoot, "package.json"), { name: PACKAGE, version: "1.0.3", bin: { pi: "dist/bundle/cli.js" }, dependencies: { "@earendil-works/pi-ai": "^1.0.3" } });
  put(win.join(packageRoot, "node_modules", "@earendil-works", "pi-ai", "package.json"), { name: "@earendil-works/pi-ai", version: newer ? "1.4.0" : "1.0.3" });
  const key = (file) => win.normalize(file).toLowerCase();
  return {
    home,
    env: { PATH: prefix, PATHEXT: ".CMD", ComSpec: "C:\\Windows\\cmd.exe" },
    exists: (file) => key(file) === key(win.join(prefix, "pi.cmd")),
    isFile: (file) => key(file) === key(entry),
    readText: (file) => {
      const value = files.get(key(file));
      if (value === undefined) throw Object.assign(new Error(`missing ${file}`), { code: "ENOENT" });
      return value;
    },
    spawn: () => ({ status: 0, stdout: "1.0.3\n", stderr: "" }),
  };
}

function packageRow(fixture, platform = "darwin") {
  const layout = { ...resolveLayout({ home: fixture.home }), isRealHome: true };
  return diagnose(layout, { projectDir: fixture.home, pi: { platform: () => platform, env: fixture.env, spawn: fixture.spawn, exists: fixture.exists, isFile: fixture.isFile, readText: fixture.readText } })
    .find((row) => row.label === "pi packages");
}

// req: R-2713
check("R-2713: a pi package with its own packages installed newer than itself prints a ✗ pi packages row naming each of them, both versions and the install hint", () => {
  const dependencies = { "@earendil-works/pi-codemode": "^1.0.3", "@earendil-works/pi-ai": "^1.0.3", chalk: "6.0.0" };
  const installed = { "@earendil-works/pi-codemode": "1.4.0", "@earendil-works/pi-ai": "1.4.0" };
  const row = packageRow(posixFixture({ dependencies, installed, decoy: true }));
  assert.equal(row?.status, "fail");
  for (const text of ["@earendil-works/pi-codemode 1.4.0", "@earendil-works/pi-ai 1.4.0", "1.0.3", PI_INSTALL_HINT]) assert.ok(row.detail.includes(text), text);
  assert.ok(!row.detail.includes("chalk"));
  assert.ok(!row.detail.includes("·"));
  const numeric = packageRow(posixFixture({ piVersion: "1.9.0", dependencies: { "@earendil-works/pi-ai": "^1.9.0" }, installed: { "@earendil-works/pi-ai": "1.10.0" } }));
  assert.equal(numeric?.status, "fail");
  const windows = packageRow(winFixture({ newer: true }), "win32");
  assert.equal(windows?.status, "fail");
  assert.ok(windows.detail.includes("@earendil-works/pi-ai 1.4.0"));
});

// req: R-2714
check("R-2714: a pi package whose own packages are at or below its version, nested or hoisted, prints a ✓ pi packages row naming its version and count", () => {
  const row = packageRow(posixFixture({
    dependencies: { "@earendil-works/pi-codemode": "^1.0.3", "@earendil-works/pi-ai": "^1.0.3", "@earendil-works/pi-mcp": "^1.0.3", chalk: "6.0.0" },
    devDependencies: { "@earendil-works/pi-client": "^1.0.3" },
    installed: { "@earendil-works/pi-codemode": "1.0.3", "@earendil-works/pi-ai": "1.0.2", "@earendil-works/pi-mcp": { version: "1.0.3", where: "hoisted" } },
  }));
  assert.equal(row?.status, "ok");
  assert.ok(row.detail.includes("1.0.3"));
  assert.match(row.detail, /\b3\b/);
  assert.ok(!row.detail.includes("pi-client"));
  assert.ok(!row.detail.includes("·"));
  assert.equal(packageRow(winFixture({ newer: false }), "win32")?.status, "ok");
});

// req: R-2715
check("R-2715: a pi outside any package, a pre-release or missing version, a missing dependency or an unreadable version prints a · pi packages row, never ✗", () => {
  const rows = [
    packageRow(outsideFixture()),
    packageRow(posixFixture({ dependencies: { "@earendil-works/pi-ai": "^1.0.3" }, installed: { "@earendil-works/pi-ai": null } })),
    packageRow(posixFixture({ dependencies: { "@earendil-works/pi-ai": "^1.0.3" }, installed: { "@earendil-works/pi-ai": "x" } })),
    packageRow(posixFixture({ piVersion: "1.5.0-beta.1", dependencies: { "@earendil-works/pi-ai": "^1.5.0" }, installed: { "@earendil-works/pi-ai": "1.5.0-beta.1" } })),
    packageRow(posixFixture({ omitPiVersion: true, dependencies: { "@earendil-works/pi-ai": "^1.0.3" }, installed: { "@earendil-works/pi-ai": "1.0.3" } })),
  ];
  for (const row of rows) {
    assert.equal(row?.status, "note", JSON.stringify(row));
    assert.ok(row.detail.length > 0);
  }
  assert.match(rows[0].detail, /no pi package/i);
  assert.ok(rows[1].detail.includes("@earendil-works/pi-ai"));
  assert.ok(rows[2].detail.includes("@earendil-works/pi-ai"));
  const precedence = packageRow(posixFixture({ dependencies: { "@earendil-works/pi-ai": "^1.0.3", "@earendil-works/pi-mcp": "^1.0.3" }, installed: { "@earendil-works/pi-ai": null, "@earendil-works/pi-mcp": "1.4.0" } }));
  assert.equal(precedence?.status, "fail");
});

let failures = 0;
try {
  for (const { title, fn } of cases) {
    try { fn(); console.log("PASS", title); }
    catch (error) { failures++; console.log("FAIL", title, error?.stack ?? error); }
  }
} finally {
  for (const home of homes) fs.rmSync(home, { recursive: true, force: true });
}
if (failures) process.exitCode = 1;
