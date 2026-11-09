/**
 * @module packages/nana-pack/tests/fake-pi.mjs
 * @purpose Lay out a fake `pi` on win32 exactly the shape piLaunch (pi-watchdog.mjs) resolves an
 *  npm global install into, from a caller-supplied Node source body.
 * @inputs a directory to hold the fake (meant to sit first on PATH) and the Node source text to
 *  run as pi's body; PI_PACKAGE and PI_BIN_NAME from worker-config.mjs
 * @outputs Fake pi files, or a linked review temp environment preserving an alternate cwd spelling.
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

// macOS resolves a symlink in process.cwd(); Windows can retain a short-path
// spelling instead. Preserve the linked spelling in review children on macOS
// too, so both assertions exercise the Windows-style distinction.
export function linkedReviewTempEnv(dir, env) {
  const target = path.join(dir, 'review-temp'), alias = path.join(dir, 'review-alias');
  fs.mkdirSync(target);
  fs.symlinkSync(target, alias, process.platform === 'win32' ? 'junction' : 'dir');
  const preload = path.join(dir, 'review-cwd.cjs');
  fs.writeFileSync(preload, `const path = require('node:path');
const fs = require('node:fs'), cp = require('node:child_process');
const spawn = cp.spawn;
cp.spawn = function(command, args, options) {
  if (options?.cwd && /^nana-review-/.test(path.basename(options.cwd)) &&
      [${JSON.stringify(target)}, ${JSON.stringify(alias)}].includes(path.dirname(options.cwd))) {
    options = {...options, env: {...options.env, NANA_TEST_REVIEW_CWD: options.cwd}};
  }
  return spawn.call(this, command, args, options);
};
require('node:module').syncBuiltinESMExports();
const cwd = process.cwd.bind(process);
process.cwd = () => {
  const actual = cwd(), requested = process.env.NANA_TEST_REVIEW_CWD;
  return requested && fs.realpathSync.native(requested) === fs.realpathSync.native(actual) ? requested : actual;
};
`);
  return { ...env, TMPDIR: alias, TMP: alias, TEMP: alias,
    NODE_OPTIONS: `${env.NODE_OPTIONS ?? ''} --require ${JSON.stringify(preload)}`.trim() };
}
