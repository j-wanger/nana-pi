/**
 * @module packages/nana-setup/tests/readme-rehearsal.test.mjs
 * @purpose Pins the README rehearsal's parse grammar, answer rule, sandbox environment, output cap and stop-at-first-failure verdict.
 * @inputs Synthetic checklist fixtures, a stub spawn and the sealed README_REHEARSAL contract.
 * @outputs PASS/FAIL lines and a nonzero exit when any assertion fails.
 * @effects disk (OS-temp fixture roots and homes).
 * @errors A failed assertion exits nonzero.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { EventEmitter } from "node:events";
import { README_REHEARSAL } from "../lib/install-check-config.mjs";
import { createSpawnAdapter } from "../lib/install-check.mjs";
import { parseChecklist, rehearsalPlan, runReadmeRehearsal } from "../lib/readme-rehearsal.mjs";
import { resolveLayout } from "../lib/paths.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const CASE_TIMEOUT_MS = 30000;
const cases = [];
let failures = 0;
const check = (title, fn) => cases.push({ title, fn });
async function runChecks() {
  for (const { title, fn } of cases) {
    let timer;
    try {
      await Promise.race([
        Promise.resolve().then(fn),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`case timed out after ${CASE_TIMEOUT_MS} ms`)), CASE_TIMEOUT_MS); }),
      ]);
      console.log("PASS", title);
    } catch (error) {
      failures++;
      console.log("FAIL", title, error?.message ?? String(error));
    } finally { clearTimeout(timer); }
  }
}

function fixtureText({ eol = "\n", trailingSpace = false, finalNewline = true } = {}) {
  const sp = trailingSpace ? "  " : "";
  const lines = [
    "# doc",
    "",
    README_REHEARSAL.heading.darwin,
    "",
    `1. Prep with a \`skip\` span and (\`also skip\`) a note.${sp}`,
    `2. Run \`cmd one\`, then \`cmd two\` (\`skip too\`); expect \`needle\`.${sp}`,
    "",
    "### Next section",
    "3. Out of scope.",
  ];
  let text = lines.join(eol);
  if (finalNewline) text += eol;
  return text;
}

// req: R-1541
check("parse: Run and then spans are commands, other spans are not, and the expect span is kept", () => {
  for (const variant of [
    { eol: "\n", trailingSpace: false, finalNewline: true },
    { eol: "\r\n", trailingSpace: false, finalNewline: true },
    { eol: "\n", trailingSpace: true, finalNewline: true },
    { eol: "\n", trailingSpace: false, finalNewline: false },
  ]) {
    const steps = parseChecklist(fixtureText(variant), "darwin");
    assert.equal(steps.length, 2, JSON.stringify(variant));
    assert.deepEqual(steps[0], { step: 1, commands: [], expect: null }, JSON.stringify(variant));
    assert.deepEqual(steps[1], { step: 2, commands: ["cmd one", "cmd two"], expect: "needle" }, JSON.stringify(variant));
  }
});

function fixtureRoot(bodyLines, platformName = "darwin") {
  const root = tmpDir(path.join(os.tmpdir(), "nana-readme-rehearsal-root-"));
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ repository: "github:fixture/repo" }));
  fs.writeFileSync(path.join(root, "README.md"), [README_REHEARSAL.heading[platformName], "", ...bodyLines, ""].join("\n"));
  return root;
}

// req: R-1542
check("run: each command step is one login zsh call from the rehearsal home with no ZDOTDIR, a home npm prefix ahead of the caller's PATH and only the clone redirect added", async () => {
  const root = fixtureRoot(["1. No commands here.", "2. Run `echo one`, then `echo two`; expect `done`."]);
  const home = tmpDir(path.join(os.tmpdir(), "nana-readme-rehearsal-home-"));
  try {
    const env = { PATH: "/caller/bin", ZDOTDIR: "/caller/.zdotdir", HOME: home, OTHER: "x" };
    const calls = [];
    const spawn = async (command, args, options) => { calls.push({ command, args, options }); return { status: 0, stdout: "done" }; };
    const result = await runReadmeRehearsal({ root, home, env, spawn, platformName: "darwin" });
    assert.equal(result.passed, true, result.detail);
    assert.equal(calls.length, 1);
    const call = calls[0];
    assert.equal(call.command, README_REHEARSAL.shell.darwin);
    assert.deepEqual(call.args, [...README_REHEARSAL.shellArgs.darwin, "echo one && echo two"]);
    assert.equal(call.options.cwd, home);
    assert.equal(call.options.input, undefined);
    assert.equal(Object.hasOwn(call.options.env, "ZDOTDIR"), false);
    const prefixBin = path.join(home, README_REHEARSAL.npmPrefix, README_REHEARSAL.npmPrefixBin.darwin);
    assert.equal(call.options.env.PATH, `${prefixBin}${path.delimiter}${env.PATH}`);
    assert.equal(call.options.env.npm_config_prefix, path.join(home, README_REHEARSAL.npmPrefix));
    assert.equal(call.options.env.GIT_CONFIG_COUNT, "1");
    assert.equal(call.options.env.GIT_CONFIG_KEY_0, `url.${root}.insteadOf`);
    assert.equal(call.options.env.GIT_CONFIG_VALUE_0, "https://github.com/fixture/repo");
    assert.equal(call.options.env.GIT_ALLOW_PROTOCOL, "file");
    const { PATH: _p, npm_config_prefix: _n, GIT_CONFIG_COUNT: _c, GIT_CONFIG_KEY_0: _k, GIT_CONFIG_VALUE_0: _v, GIT_ALLOW_PROTOCOL: _g, ...restEnv } = call.options.env;
    const { ZDOTDIR: _z, PATH: _origPath, ...restOriginal } = env;
    assert.deepEqual(restEnv, restOriginal);
  } finally { fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(home, { recursive: true, force: true }); }
});

// req: R-1543
check("plan: nana-setup trust gets --yes and every other command, the global npm install included, runs as written", () => {
  const steps = [
    { step: 2, commands: ["npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2"], expect: null },
    { step: 8, commands: ["cd ~/nana-pi", "nana-setup trust ~/nana-pi", "nana-setup doctor"], expect: "all good" },
  ];
  const planned = rehearsalPlan(steps);
  assert.deepEqual(planned[0].commands, ["npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2"]);
  assert.deepEqual(planned[1].commands, ["cd ~/nana-pi", "nana-setup trust ~/nana-pi --yes", "nana-setup doctor"]);
  assert.equal(planned[1].expect, "all good");
  // rehearsalPlan applies the answer rule and nothing else: the input steps are left untouched.
  assert.deepEqual(steps[1].commands, ["cd ~/nana-pi", "nana-setup trust ~/nana-pi", "nana-setup doctor"]);
});

// req: R-1544
check("output: a 20,000-character step output keeps its last line through the spawn adapter", async () => {
  const marker = "STEP-OUTPUT-END";
  const childSpawn = () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.stdin = { end() {} };
    queueMicrotask(() => {
      child.stdout.emit("data", "x".repeat(20000 - marker.length));
      child.stdout.emit("data", marker);
      child.emit("close", 0, null);
    });
    child.kill = () => {};
    return child;
  };
  const adapter = createSpawnAdapter(childSpawn);
  const result = await adapter("fake", [], { maxOutput: README_REHEARSAL.maxOutput });
  assert.equal(result.stdout.length, 20000);
  assert.ok(result.stdout.endsWith(marker));
});

// req: R-1545
check("verdict: all steps ok passes; a nonzero exit, a timeout, missing expected text or no expected text anywhere fails naming the step, and later steps do not run", async () => {
  const root = fixtureRoot(["1. Run `cmd-a`.", "2. Run `cmd-b`; expect `marker-b`.", "3. Run `cmd-c`."]);
  const baseEnv = (home) => ({ PATH: "/caller/bin", HOME: home });
  try {
    {
      const home = tmpDir(path.join(os.tmpdir(), "nana-readme-rehearsal-home-"));
      const calls = [];
      const spawn = async (command, args) => { const cmd = args.at(-1); calls.push(cmd); return { status: 0, stdout: cmd.includes("cmd-b") ? "marker-b seen" : "" }; };
      const result = await runReadmeRehearsal({ root, home, env: baseEnv(home), spawn, platformName: "darwin" });
      assert.equal(result.passed, true, result.detail);
      assert.equal(result.code, null);
      assert.deepEqual(calls, ["cmd-a", "cmd-b", "cmd-c"]);
      fs.rmSync(home, { recursive: true, force: true });
    }
    {
      const home = tmpDir(path.join(os.tmpdir(), "nana-readme-rehearsal-home-"));
      const calls = [];
      const spawn = async (command, args) => { const cmd = args.at(-1); calls.push(cmd); return cmd.includes("cmd-a") ? { status: 1, stdout: "" } : { status: 0, stdout: "marker-b seen" }; };
      const result = await runReadmeRehearsal({ root, home, env: baseEnv(home), spawn, platformName: "darwin" });
      assert.equal(result.passed, false);
      assert.equal(result.code, "exit");
      assert.match(result.detail, /\bstep 1\b/);
      assert.match(result.detail, /cmd-a/);
      assert.deepEqual(calls, ["cmd-a"]);
      fs.rmSync(home, { recursive: true, force: true });
    }
    {
      const home = tmpDir(path.join(os.tmpdir(), "nana-readme-rehearsal-home-"));
      const calls = [];
      const spawn = async (command, args) => { const cmd = args.at(-1); calls.push(cmd); return cmd.includes("cmd-b") ? { error: { code: "ETIMEDOUT" }, status: null, stdout: "" } : { status: 0, stdout: "" }; };
      const result = await runReadmeRehearsal({ root, home, env: baseEnv(home), spawn, platformName: "darwin" });
      assert.equal(result.passed, false);
      assert.equal(result.code, "timeout");
      assert.match(result.detail, /\bstep 2\b/);
      assert.deepEqual(calls, ["cmd-a", "cmd-b"]);
      fs.rmSync(home, { recursive: true, force: true });
    }
    {
      const home = tmpDir(path.join(os.tmpdir(), "nana-readme-rehearsal-home-"));
      const calls = [];
      const spawn = async (command, args) => { const cmd = args.at(-1); calls.push(cmd); return { status: 0, stdout: cmd.includes("cmd-b") ? "no marker here" : "" }; };
      const result = await runReadmeRehearsal({ root, home, env: baseEnv(home), spawn, platformName: "darwin" });
      assert.equal(result.passed, false);
      assert.match(result.detail, /\bstep 2\b/);
      assert.match(result.detail, /marker-b/);
      assert.deepEqual(calls, ["cmd-a", "cmd-b"]);
      fs.rmSync(home, { recursive: true, force: true });
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }

  const rootNoExpect = fixtureRoot(["1. Run `cmd-a`.", "2. Run `cmd-b`."]);
  try {
    const home = tmpDir(path.join(os.tmpdir(), "nana-readme-rehearsal-home-"));
    const calls = [];
    const spawn = async (command, args) => { calls.push(args.at(-1)); return { status: 0, stdout: "" }; };
    const result = await runReadmeRehearsal({ root: rootNoExpect, home, env: baseEnv(home), spawn, platformName: "darwin" });
    assert.equal(result.passed, false);
    assert.equal(calls.length, 0);
    fs.rmSync(home, { recursive: true, force: true });
  } finally { fs.rmSync(rootNoExpect, { recursive: true, force: true }); }
});

async function assertWin32CommandShape() {
  const root = fixtureRoot(["1. No commands here.", "2. Run `echo one`, then `echo two`; expect `done`.", "3. Run `echo three`."], "win32");
  const home = tmpDir(path.join(os.tmpdir(), "nana-readme-rehearsal-win-home-"));
  try {
    const calls = [];
    const spawn = async (command, args, options) => { calls.push({ command, args, options }); return { status: 0, stdout: "done" }; };
    const result = await runReadmeRehearsal({ root, home, env: { Path: "C:\\caller", HOME: home }, spawn, platformName: "win32" });
    assert.equal(result.passed, true, result.detail);
    assert.equal(calls.length, 2);
    assert.deepEqual(calls.map(({ command, args, options }) => ({ command, args, cwd: options.cwd, windowsVerbatimArguments: options.windowsVerbatimArguments })), [
      { command: "cmd.exe", args: ["/d", "/v:off", "/s", "/c", '"echo one && echo two"'], cwd: home, windowsVerbatimArguments: true },
      { command: "cmd.exe", args: ["/d", "/v:off", "/s", "/c", '"echo three"'], cwd: home, windowsVerbatimArguments: true },
    ]);
  } finally { fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(home, { recursive: true, force: true }); }
}

async function assertWin32Environment() {
  for (const pathKey of ["Path", "PATH"]) {
    const root = fixtureRoot(["1. Run `echo one`; expect `done`."], "win32");
    const home = tmpDir(path.join(os.tmpdir(), "nana-readme-rehearsal-win-home-"));
    try {
      const env = { [pathKey]: "C:\\caller", ZDOTDIR: "C:\\caller\\zsh", HOME: home, OTHER: "x" };
      const calls = [];
      const spawn = async (command, args, options) => { calls.push({ command, args, options }); return { status: 0, stdout: "done" }; };
      const result = await runReadmeRehearsal({ root, home, env, spawn, platformName: "win32" });
      assert.equal(result.passed, true, result.detail);
      assert.equal(calls.length, 1);
      const actual = calls[0].options.env;
      const prefix = path.join(home, README_REHEARSAL.npmPrefix);
      const binDir = resolveLayout({ home }).binDir;
      assert.deepEqual(Object.keys(actual).filter((key) => key.toLowerCase() === "path"), [pathKey]);
      assert.equal(actual[pathKey], `${prefix};${binDir};C:\\caller`);
      const expected = {
        [pathKey]: `${prefix};${binDir};C:\\caller`,
        HOME: home,
        OTHER: "x",
        npm_config_prefix: prefix,
        GIT_CONFIG_COUNT: "1",
        GIT_CONFIG_KEY_0: `url.${root}.insteadOf`,
        GIT_CONFIG_VALUE_0: "https://github.com/fixture/repo",
        GIT_ALLOW_PROTOCOL: "file",
      };
      assert.deepEqual(actual, expected);
    } finally { fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(home, { recursive: true, force: true }); }
  }
}

// req: R-1854
check("run on win32: each command step is one verbatim cmd.exe /d /v:off /s /c call from the rehearsal home with the joined commands in one pair of quotes", assertWin32CommandShape);
// req: R-1855
check("run on win32: one Path key in any letter case holds the home npm prefix folder, the home's bin folder and the caller's Path in that order, with only the npm prefix and clone redirect added", assertWin32Environment);

// req: R-1542, R-1543, R-1544, R-1545, R-1853, R-1854, R-1855
check("pin R-1542 R-1543 R-1544 R-1545 R-1853 R-1854 R-1855: the sealed README_REHEARSAL contract", () => {
  assert.deepEqual(README_REHEARSAL, {
    item: "readme checklist",
    readme: "README.md",
    heading: { darwin: "### Fresh machine (macOS), in order", win32: "### Fresh machine (Windows), in order" },
    platforms: ["darwin", "win32"],
    home: "readme-home",
    npmPrefix: ".npm-global",
    npmPrefixBin: { darwin: "bin", win32: "" },
    binOnPath: { darwin: false, win32: true },
    shell: { darwin: "/bin/zsh", win32: "cmd.exe" },
    shellArgs: { darwin: ["-l", "-c"], win32: ["/d", "/v:off", "/s", "/c"] },
    commandLeads: ["Run", "then"],
    expectLead: "expect",
    droppedEnv: ["ZDOTDIR"],
    answers: [{ prefix: "nana-setup trust ", append: "--yes" }],
    stepTimeoutMs: 300000,
    maxOutput: 1000000,
  });
});

await runChecks();
if (failures) process.exitCode = 1;
