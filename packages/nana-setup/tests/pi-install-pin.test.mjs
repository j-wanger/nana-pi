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
import { tmpDir } from "./tmp-dir.mjs";
import { CI_WORKFLOW, parsePiPin, pinPiInstall, readPiPin } from "../lib/pi-pin.mjs";
import { PI_INSTALL_HINT } from "../lib/steps.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ciText = fs.readFileSync(path.join(root, ...CI_WORKFLOW), "utf8");
const lines = ciText.split(/\r?\n/);
const version = lines.find((line) => /^  PI_VERSION: (\S+)$/.test(line))?.match(/^  PI_VERSION: (\S+)$/)?.[1];
const before = lines.find((line) => /^  PI_BEFORE: "([^"]*)"$/.test(line))?.match(/^  PI_BEFORE: "([^"]*)"$/)?.[1];
const floorVersion = lines.find((line) => /^  PI_FLOOR_VERSION: (\S+)$/.test(line))?.match(/^  PI_FLOOR_VERSION: (\S+)$/)?.[1];
const floorBefore = lines.find((line) => /^  PI_FLOOR_BEFORE: "([^"]*)"$/.test(line))?.match(/^  PI_FLOOR_BEFORE: "([^"]*)"$/)?.[1];
const readmes = JSON.parse(fs.readFileSync(path.join(root, "readme-check.config.json"), "utf8")).readmes;
function npmCommands(text) {
  // Every npm install command in a README, whatever the Markdown form: inline spans (one or more backticks,
  // across lines), fenced and indented blocks, with continued lines joined (\ everywhere; PowerShell ` and cmd ^
  // in code blocks) and shell comments dropped — so "npm \" + "i -g …", a span split across lines, or a cutoff
  // that appears only in a trailing comment cannot hide a command (final review r1, 2026-10-13).
  const lines = text.split(/\r?\n/);
  const fragments = [];
  let fence = null, block = [], prose = [];
  const flushBlock = () => { if (block.length) fragments.push({ code: true, text: block.join("\n") }); block = []; };
  const flushProse = () => { if (prose.length) fragments.push({ code: false, text: prose.join("\n") }); prose = []; };
  for (const line of lines) {
    if (fence) {
      if (new RegExp(`^ {0,3}${fence[0]}{${fence.length},}\\s*$`).test(line)) { fence = null; flushBlock(); continue; }
      block.push(line); continue;
    }
    const open = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (open) { flushProse(); fence = open[1]; continue; }
    // a blank line ends a paragraph (so an indented block may follow it) and stays inside an indented block
    if (/^\s*$/.test(line)) { if (block.length) block.push(line); else flushProse(); continue; }
    if (/^(?: {4}|\t)/.test(line) && !prose.length) { block.push(line); continue; }
    flushBlock(); prose.push(line);
  }
  flushBlock(); flushProse();
  const found = [];
  const scan = (source, code) => {
    const joined = code ? source.replace(/[ \t](?:\\|`|\^)[ \t]*\n[ \t]*/g, " ") : source.replace(/[ \t]\\[ \t]*\n[ \t]*/g, " ");
    for (const logical of joined.split("\n")) {
      const re = /\bnpm\s+(?:i|install)\b/g;
      let match;
      while ((match = re.exec(logical))) {
        let command = logical.slice(match.index);
        command = command.replace(/(^|\s)#.*$/, "$1");
        found.push(command.replace(/\s+/g, " ").trim());
      }
    }
  };
  for (const fragment of fragments) {
    if (fragment.code) { scan(fragment.text, true); continue; }
    const span = /(`+)([\s\S]*?[^`])\1(?!`)/g;
    let m;
    while ((m = span.exec(fragment.text))) scan(m[2].replace(/\n/g, " "), false);
  }
  return found;
}
const cases = [];
const check = (title, fn) => cases.push({ title, fn });

// req: R-1093
check("the README scan finds a command continued after npm, a span across lines, a comment-only cutoff and an indented block after a paragraph", () => {
  const pin = `@earendil-works/pi-coding-agent@${version}`;
  const continued = npmCommands("```bash\nnpm \\\n  i -g " + pin + "\n```\n");
  assert.deepEqual(continued, [`npm i -g ${pin}`]);
  const span = npmCommands("Run ``npm i -g\n" + pin + " --before=" + before + "`` first.");
  assert.deepEqual(span, [`npm i -g ${pin} --before=${before}`]);
  const commented = npmCommands("```bash\nnpm i -g " + pin + " # --before=" + before + "\n```\n");
  assert.deepEqual(commented, [`npm i -g ${pin}`]);
  const indented = npmCommands("Install pi:\n\n    npm i -g " + pin + "\n\nThen run doctor.\n");
  assert.deepEqual(indented, [`npm i -g ${pin}`]);
});

// req: R-1093
check("every README pi install command carries CI's ceiling or floor version with that version's unquoted cutoff", () => {
  assert.ok(version && before && floorVersion && floorBefore);
  for (const rel of readmes) {
    const text = fs.readFileSync(path.join(root, rel), "utf8");
    const commands = npmCommands(text).filter((command) => command.includes("@earendil-works/pi-coding-agent"));
    for (const command of commands) {
      const ceiling = command.includes(`@earendil-works/pi-coding-agent@${version}`) && new RegExp(`(?:^|\\s)--before=${before}(?=\\s|$)`).test(command);
      const floor = command.includes(`@earendil-works/pi-coding-agent@${floorVersion}`) && new RegExp(`(?:^|\\s)--before=${floorBefore}(?=\\s|$)`).test(command);
      assert.notEqual(ceiling, floor, `${rel}: command must carry exactly one matching CI pair: ${command}`);
      assert.ok(!command.includes(`--before="${before}"`) && !command.includes(`--before="${floorBefore}"`), `${rel}: quoted cutoff`);
    }
  }
});

// req: R-2716
check("R-2716: the root README names CI's floor and ceiling as the supported pi range", () => {
  assert.ok(version && floorVersion);
  const text = fs.readFileSync(path.join(root, "README.md"), "utf8");
  const matches = [...text.matchAll(/supports pi (\d+\.\d+\.\d+) through (\d+\.\d+\.\d+)/g)];
  assert.equal(matches.length, 1);
  assert.deepEqual(matches[0].slice(1), [floorVersion, version]);
});

// req: R-2717
check("R-2717: the setup README carries one floor pi install command at CI's floor version and cutoff", () => {
  assert.ok(version && before && floorVersion && floorBefore);
  const rootCommands = npmCommands(fs.readFileSync(path.join(root, "README.md"), "utf8"));
  const ceilingCommands = rootCommands.filter((command) => command.includes(`@earendil-works/pi-coding-agent@${version}`) && command.includes(`--before=${before}`));
  assert(ceilingCommands.length >= 1, "the root README must carry a ceiling command");
  assert.equal(new Set(ceilingCommands).size, 1, "the root README ceiling command must have one form");
  const expected = ceilingCommands[0].replace(`@${version}`, `@${floorVersion}`).replace(`--before=${before}`, `--before=${floorBefore}`);
  const setupCommands = npmCommands(fs.readFileSync(path.join(root, "packages/nana-setup/README.md"), "utf8"));
  const floorCommands = setupCommands.filter((command) => command.includes(`@earendil-works/pi-coding-agent@${floorVersion}`));
  assert.deepEqual(floorCommands, [expected]);
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
  const dir = tmpDir(path.join(os.tmpdir(), "nana-pi-pin-"));
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
