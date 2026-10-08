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
import { ADOPT_FIXTURE_FILES, runAcceptance } from "../../../scripts/template-acceptance.mjs";

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

// req: R-594
check("missing tools fail closed and name the tool", () => {
  const logs = [];
  const status = runAcceptance({ src: root, ref: "HEAD", tmpRoot: root, run: (cmd) => cmd === "git" ? { status: 0, stdout: `${sha}\n` } : { status: null, error: new Error("spawn ENOENT") }, log: (line) => logs.push(line) });
  assert.equal(status, 1); assert(logs.join("\n").includes("uvx"));
});
if (failures) process.exitCode = 1;
