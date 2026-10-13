/**
 * @module packages/nana-setup/tests/pi-install-pin.test.mjs
 * @purpose Pins README and missing-pi install hints to CI's pi package version and cutoff.
 * @inputs CI workflow, covered README files and temporary workflow fixtures.
 * @outputs PASS/FAIL test lines.
 * @effects disk (temporary OS fixtures only)
 * @errors Failed assertions are reported and set a nonzero exit code.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CI_WORKFLOW, parsePiPin, pinPiInstall, readPiPin } from "../lib/pi-pin.mjs";
import { PI_INSTALL_HINT } from "../lib/steps.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ciText = fs.readFileSync(path.join(root, ...CI_WORKFLOW), "utf8");
const lines = ciText.split(/\r?\n/);
const version = lines.find((line) => /^  PI_VERSION: (\S+)$/.test(line))?.match(/^  PI_VERSION: (\S+)$/)?.[1];
const before = lines.find((line) => /^  PI_BEFORE: "([^"]*)"$/.test(line))?.match(/^  PI_BEFORE: "([^"]*)"$/)?.[1];
const readmes = JSON.parse(fs.readFileSync(path.join(root, "readme-check.config.json"), "utf8")).readmes;
function npmCommands(text) {
  const lines = text.split(/\r?\n/);
  const found = [];
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fence && new RegExp(`^ {0,3}${fence[0]}{${fence.length},}\\s*$`).test(line)) { fence = null; continue; }
    const open = !fence && /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (open) { fence = open[1]; continue; }
    const code = Boolean(fence) || /^(?: {4}|\t)/.test(line);
    const re = /\bnpm\s+(?:i|install)\b/g;
    let match;
    while ((match = re.exec(line))) {
      let command;
      const inline = !fence && ((line.slice(0, match.index).match(/`/g) ?? []).length % 2 === 1);
      if (inline) {
        let rest = line.slice(match.index), k = i;
        while (!rest.includes("`") && k + 1 < lines.length && k < i + 5) rest += `\n${lines[++k]}`;
        command = rest.split("`")[0];
      } else {
        let rest = line.slice(match.index), k = i;
        const continuation = code ? /\s(?:\\|`|\^)\s*$/ : /\s\\\s*$/;
        while (continuation.test(rest) && k + 1 < lines.length) rest = rest.replace(continuation, " ") + lines[++k];
        command = rest;
      }
      found.push(command.replace(/\s+/g, " ").trim());
    }
  }
  return found;
}
const cases = [];
const check = (title, fn) => cases.push({ title, fn });

// req: R-1093
check("every README pi install command carries CI's PI_VERSION and an unquoted PI_BEFORE", () => {
  assert.ok(version && before);
  for (const rel of readmes) {
    const text = fs.readFileSync(path.join(root, rel), "utf8");
    const commands = npmCommands(text).filter((command) => command.includes("@earendil-works/pi-coding-agent"));
    for (const command of commands) {
      assert.ok(command.includes(`@earendil-works/pi-coding-agent@${version}`), `${rel}: ${command}`);
      assert.ok(new RegExp(`(?:^|\\s)--before=${before}(?=\\s|$)`).test(command), `${rel}: ${command}`);
      assert.ok(!command.includes(`--before="${before}"`), `${rel}: quoted cutoff`);
    }
  }
});

// req: R-1093
check("the missing-pi hint carries CI's PI_VERSION and an unquoted PI_BEFORE", () => {
  assert.equal(PI_INSTALL_HINT, `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@${version} --before=${before}`);
});

// req: R-1093
check("pi pin reads PI_VERSION and PI_BEFORE from the workflow env with LF or CRLF line ends", () => {
  assert.deepEqual(parsePiPin(`env:\n  PI_VERSION: ${version}\n  PI_BEFORE: "${before}"\n`), { version, before });
  assert.deepEqual(parsePiPin(`env:\r\n  PI_VERSION: ${version}\r\n  PI_BEFORE: "${before}"\r\n`), { version, before });
});

// req: R-1093, R-1094
check("the missing-pi hint is built from the checkout's CI workflow by pi-pin", () => {
  assert.match(fs.readFileSync(path.join(root, "packages/nana-setup/lib/steps.mjs"), "utf8"), /pinPiInstall\(PI_INSTALL_BASE, readPiPin\(repoRoot\)\)/);
  assert.equal(PI_INSTALL_HINT, pinPiInstall("npm i -g --ignore-scripts @earendil-works/pi-coding-agent", readPiPin(root)));
});

// req: R-1094
check("an unreadable or incomplete workflow gives a placeholder hint, never an empty cutoff", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nana-pi-pin-"));
  try {
    assert.equal(readPiPin(dir), null);
    for (const body of ["", `  PI_VERSION: ${version}\n`, `  PI_VERSION: ${version}\n  PI_BEFORE: \"\"\n`, `  PI_VERSION: \n  PI_BEFORE: \"${before}\"\n`, `  PI_VERSION: ${version}\n  PI_BEFORE: \"not-a-date\"\n`]) {
      fs.mkdirSync(path.join(dir, ".github", "workflows"), { recursive: true });
      fs.writeFileSync(path.join(dir, ...CI_WORKFLOW), body);
      assert.equal(readPiPin(dir), null);
      assert.equal(pinPiInstall("npm i -g pkg", readPiPin(dir)), "npm i -g pkg@<version> --before=<cutoff>");
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// req: R-1093
check("pin R-1093: the CI workflow path pi-pin reads", () => {
  assert.deepEqual(CI_WORKFLOW, [".github", "workflows", "ci.yml"]);
});

// req: R-1094
check("a cutoff with a space, a shell metacharacter or a rollover date gives a placeholder hint", () => {
  for (const value of ["2026-10-04 06:57:57Z", "2026-10-04T06:57:57Z;echo", "2026-02-30T06:57:57Z"]) {
    assert.equal(parsePiPin(`  PI_VERSION: ${version}\n  PI_BEFORE: "${value}"`), null);
  }
});

let failed = 0;
for (const { title, fn } of cases) {
  try { fn(); console.log("PASS", title); }
  catch (error) { failed++; console.log("FAIL", title, error?.stack ?? error); }
}
if (failed) process.exitCode = 1;
