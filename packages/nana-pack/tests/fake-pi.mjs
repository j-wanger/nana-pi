/**
 * @module packages/nana-pack/tests/fake-pi.mjs
 * @purpose Lay out a fake `pi` on win32 exactly the shape piLaunch (pi-watchdog.mjs) resolves an
 *  npm global install into, from a caller-supplied Node source body.
 * @inputs a directory to hold the fake (meant to sit first on PATH) and the Node source text to
 *  run as pi's body; PI_PACKAGE and PI_BIN_NAME from worker-config.mjs
 * @outputs the same directory, now holding pi.cmd, its npm package.json and the body as cli.js
 * @effects disk (creates the directory if missing, writes three files under it)
 * @errors none; a write failure throws through node:fs
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { PI_PACKAGE, PI_BIN_NAME } from "../bin/worker-config.mjs";

// piLaunch only checks that a win32 `pi.cmd` EXISTS before it looks for the npm package beside
// it (R-1125); it never runs the shim. This writes exactly that layout — dir/pi.cmd (a
// placeholder, never executed), dir/node_modules/<PI_PACKAGE>/package.json naming PI_BIN_NAME's
// bin as cli.js, and dir/node_modules/<PI_PACKAGE>/cli.js holding `body` — so piLaunch starts
// `body` directly with the running node (CommonJS; no "type":"module" is declared).
export function writeFakePi(dir, body) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "pi.cmd"), "@echo off\r\n");
  const packageDir = path.join(dir, "node_modules", ...PI_PACKAGE.split("/"));
  fs.mkdirSync(packageDir, { recursive: true });
  fs.writeFileSync(path.join(packageDir, "package.json"), JSON.stringify({ name: PI_PACKAGE, bin: { [PI_BIN_NAME]: "cli.js" } }));
  fs.writeFileSync(path.join(packageDir, "cli.js"), body);
  return dir;
}
