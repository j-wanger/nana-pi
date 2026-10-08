/**
 * @module packages/nana-pack/tests/template-acceptance.test.mjs
 * @purpose Pins immutable-ref rendering, adopt fixture order, and fail-closed acceptance outcomes.
 * @inputs Acceptance runner and injected child process results.
 * @outputs PASS/FAIL lines and exit status.
 * @effects disk (temporary fixture trees).
 * @errors Failed checks exit nonzero.
 */
import assert from "node:assert/strict";
import * as fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { tmpDir } from "./tmp-dir.mjs";
import { ACCEPTANCE_COMMANDS, ADOPT_FIXTURE_FILES, runAcceptance } from "../../../scripts/template-acceptance.mjs";

let failures = 0;
const check = (title, fn) => { try { fn(); console.log("PASS", title); } catch (error) { failures++; console.log("FAIL", title, error.message); } };
const root = tmpDir(path.join(os.tmpdir(), "accept-test-"));
const sha = "0123456789abcdef0123456789abcdef01234567";
const makeFile = (base, rel, content = "seed\n") => { const file = path.join(base, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };
const files = { python: ["README.md", "src/pkg/__init__.py", "tests/AGENTS.md", "tests/test_smoke.py"], typescript: ["README.md", "src/index.ts", "tests/AGENTS.md", "tests/smoke.test.ts"] };

// req: R-593
check("renders all four modes with the exact resolved SHA and prepares adopt overlays", () => {
  const src = path.join(root, "src"); fs.mkdirSync(src);
  const seen = []; const logs = [];
  const run = (cmd, args, options) => {
    if (cmd === "git") return { status: 0, stdout: `${sha}\n` };
    if (cmd === "uvx") {
      const dest = args.at(-1); const language = args.find((arg) => arg.startsWith("language=")).slice(9);
      const adopt = args.includes("adopt=true");
      assert(args.includes("--vcs-ref")); assert.equal(args[args.indexOf("--vcs-ref") + 1], sha); assert(!args.includes("HEAD"));
      if (adopt) {
        assert(args.includes("--overwrite"));
        for (const rel of ADOPT_FIXTURE_FILES[language]) assert(fs.existsSync(path.join(dest, rel)), `${language} fixture ${rel} exists before overlay`);
      } else for (const rel of files[language]) makeFile(dest, rel, rel.includes("smoke") ? "// req: R-001\nseed\n" : "seed\n");
      seen.push(`${language}:${adopt ? "adopt" : "scaffold"}`);
      return { status: 0, stdout: "" };
    }
    return { status: 0, stdout: "" };
  };
  assert.equal(runAcceptance({ src, ref: "HEAD", tmpRoot: root, run, log: (line) => logs.push(line) }), 0);
  assert.deepEqual(seen, ["python:scaffold", "python:adopt", "typescript:scaffold", "typescript:adopt"]);
});

// req: R-593
check("removing the marker preserves blank-line separation before the test", () => {
  const src = path.join(root, "spacing-src"); fs.mkdirSync(src);
  const smoke = "from package import run\n\n# req: R-001\ndef test_smoke():\n    assert run()\n";
  const run = (cmd, args) => {
    if (cmd === "git") return { status: 0, stdout: `${sha}\n` };
    if (cmd === "uvx") {
      const dest = args.at(-1); const language = args.find((arg) => arg.startsWith("language=")).slice(9);
      if (!args.includes("adopt=true")) {
        for (const rel of ADOPT_FIXTURE_FILES[language]) {
          if (rel === "src") fs.mkdirSync(path.join(dest, rel), { recursive: true });
          else makeFile(dest, rel, rel === "tests/test_smoke.py" ? smoke : rel === "pnpm-workspace.yaml" ? "packages: []\\n" : "seed\\n");
        }
      } else if (language === "python") {
        assert.equal(fs.readFileSync(path.join(dest, "tests/test_smoke.py"), "utf8"), "from package import run\n\ndef test_smoke():\n    assert run()\n");
      }
      return { status: 0, stdout: "" };
    }
    return { status: 0, stdout: "" };
  };
  assert.equal(runAcceptance({ src, ref: "HEAD", tmpRoot: root, run, log: console.log }), 0);
});

function ciCheckCommands(filePath) {
  const commands = []; let inCheck = false;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (line === "  check:") inCheck = true;
    else if (inCheck && /^  [a-zA-Z0-9_-]+:/.test(line)) break;
    else if (inCheck && /^      - run: /.test(line)) commands.push(line.slice("      - run: ".length));
  }
  return commands;
}

function declaredCommandsMatch(filePath, language, substitution) {
  const declared = ACCEPTANCE_COMMANDS[language].map(([cmd, args]) => [cmd, ...args].join(" "));
  const expected = ciCheckCommands(filePath).map((command) => substitution?.[0] === command ? substitution[1] : command);
  return JSON.stringify(declared) === JSON.stringify(expected);
}

// req: R-595
check("declared commands mirror each template CI check job with the install substitution", () => {
  const templates = path.resolve(new URL("../../../templates", import.meta.url).pathname);
  for (const [language, substitution] of [["python", null], ["typescript", ["pnpm install --frozen-lockfile", "pnpm install"]]]) {
    const ciPath = path.join(templates, language, "template/.github/workflows/ci.yml");
    assert.equal(declaredCommandsMatch(ciPath, language, substitution), true, `${language} check job command drift`);
    if (language === "typescript") {
      const copy = path.join(root, "ci-mutated.yml");
      fs.writeFileSync(copy, fs.readFileSync(ciPath, "utf8").replace("\n  template-drift:", "\n      - run: pnpm build\n\n  template-drift:"));
      assert.equal(declaredCommandsMatch(copy, language, substitution), false, "added command must fail drift comparison");
    }
  }
});

function acceptanceStub({ failCommand = null } = {}) {
  const calls = []; let generatedRoot = "";
  const run = (cmd, args, options) => {
    calls.push({ cmd, args, options });
    if (cmd === "git") return { status: 0, stdout: `${sha}\n` };
    if (cmd === "uvx") {
      const dest = args.at(-1); const language = args.find((arg) => arg.startsWith("language=")).slice(9);
      generatedRoot = path.dirname(dest);
      if (!args.includes("adopt=true")) for (const rel of ADOPT_FIXTURE_FILES[language]) {
        if (rel === "src") fs.mkdirSync(path.join(dest, rel), { recursive: true });
        else makeFile(dest, rel, "fixture\n");
      }
      return { status: 0, stdout: "" };
    }
    if (failCommand && [cmd, ...args].join(" ") === failCommand) return { status: 1, stdout: "failed", stderr: "stub failure" };
    if (cmd === "pnpm" && failCommand === "pnpm ENOENT") return { status: null, error: new Error("spawn ENOENT") };
    return { status: 0, stdout: "" };
  };
  return { run, calls, get generatedRoot() { return generatedRoot; } };
}

// req: R-594
check("all four combinations run and the temporary root is removed on success", () => {
  const stub = acceptanceStub();
  assert.equal(runAcceptance({ src: root, ref: "HEAD", tmpRoot: root, run: stub.run, log: () => {} }), 0);
  assert.deepEqual(stub.calls.filter(({ cmd }) => cmd === "uvx").map(({ args }) => args.find((arg) => arg.startsWith("language=")).slice(9) + (args.includes("adopt=true") ? " adopt" : " scaffold")), ["python scaffold", "python adopt", "typescript scaffold", "typescript adopt"]);
  assert.equal(fs.existsSync(stub.generatedRoot), false);
  const copier = stub.calls.find(({ cmd }) => cmd === "uvx");
  assert.equal(copier.options.env.GIT_CONFIG_KEY_0, "gc.auto"); assert.equal(copier.options.env.GIT_CONFIG_VALUE_0, "0");
});
// req: R-594
check("command failures continue all combinations and ENOENT names pnpm", () => {
  const stub = acceptanceStub({ failCommand: "pnpm ENOENT" }); const logs = [];
  const status = runAcceptance({ src: root, ref: "HEAD", tmpRoot: root, run: stub.run, log: (line) => logs.push(line) });
  assert.equal(status, 1); assert(logs.join("\n").includes("pnpm"));
  assert.equal(stub.calls.filter(({ cmd }) => cmd === "uvx").length, 4); assert.equal(fs.existsSync(stub.generatedRoot), false);
});
// req: R-594
check("a single adopt mypy failure names its command while later combinations still run", () => {
  const stub = acceptanceStub({ failCommand: "uv run mypy" }); const logs = [];
  const status = runAcceptance({ src: root, ref: "HEAD", tmpRoot: root, run: stub.run, log: (line) => logs.push(line) });
  assert.equal(status, 1); assert(logs.some((line) => line.includes("python adopt") && line.includes("uv run mypy")));
  assert.equal(stub.calls.filter(({ cmd }) => cmd === "uvx").length, 4); assert.equal(fs.existsSync(stub.generatedRoot), false);
});

// req: R-594
check("missing tools fail closed and name the tool", () => {
  const logs = [];
  const status = runAcceptance({ src: root, ref: "HEAD", tmpRoot: root, run: (cmd) => cmd === "git" ? { status: 0, stdout: `${sha}\n` } : { status: null, error: new Error("spawn ENOENT") }, log: (line) => logs.push(line) });
  assert.equal(status, 1); assert(logs.join("\n").includes("uvx"));
});
if (failures) process.exitCode = 1;
