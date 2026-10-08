/**
 * @module scripts/template-acceptance.mjs
 * @purpose Render and run every native check job for both templates and adoption modes at one immutable commit.
 * @inputs CLI source/ref and injectable child-process runner.
 * @outputs One failure report per failed command and a process exit status.
 * @effects process (git, copier, and package-manager children), disk (temporary renders).
 * @errors Missing tools, render failures, timeouts, or check failures return status 1.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** Chosen: 10 min; warm probe 2026-10-08 render 2 s, pnpm install 4.3 s, pnpm check 5.5 s, uv sync 1.3 s. */
export const COMMAND_TIMEOUT_MS = 600_000;
/** Provenance: mirrored from template CI check job on 2026-10-08. */
export const ACCEPTANCE_COMMANDS = {
  python: [["uv", ["sync"]], ["uv", ["run", "ruff", "check", "."]], ["uv", ["run", "ruff", "format", "--check", "."]], ["uv", ["run", "mypy"]], ["uv", ["run", "pytest"]]],
  typescript: [["pnpm", ["install"]], ["pnpm", ["check"]]],
};
/** Provenance: adopt-py/adopt-ts documented overlay inputs; TS workspace carries the entry-points reconciliation. */
export const ADOPT_FIXTURE_FILES = {
  python: ["README.md", "src", "tests/AGENTS.md", "tests/test_smoke.py"],
  typescript: ["README.md", "src", "tests/AGENTS.md", "tests/smoke.test.ts", "pnpm-workspace.yaml"],
};

const ANSWERS = {
  python: { project_name: "Tpl PY", description: "Acceptance render", package_name: "tpl_py" },
  typescript: { project_name: "Tpl TS", description: "Acceptance render" },
};
const defaultRun = (cmd, args, options) => spawnSync(cmd, args, { encoding: "utf8", ...options });
const textOf = (result) => `${result?.stdout ?? ""}${result?.stderr ?? ""}`;
function cli(argv) {
  let src = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  let ref = "HEAD";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--src" && argv[i + 1]) src = path.resolve(argv[++i]);
    else if (argv[i] === "--ref" && argv[i + 1]) ref = argv[++i];
    else throw new Error("usage: template-acceptance.mjs [--src <repo>] [--ref <rev>]");
  }
  return { src, ref };
}
function copierArgs(language, answers, dest, sha, adopt = false) {
  const args = ["copier", "copy", "--trust", "--defaults", "--vcs-ref", sha];
  for (const [key, value] of Object.entries({ language, ...answers, adopt })) args.push("-d", `${key}=${value}`);
  if (adopt) args.push("--overwrite");
  args.push(".", dest);
  return args;
}
function runChecked(run, cmd, args, cwd, env = process.env) {
  let result;
  try { result = run(cmd, args, { cwd, env, timeout: COMMAND_TIMEOUT_MS }); }
  catch (error) { result = { status: null, error, stderr: error?.message }; }
  return { result, ok: result?.status === 0 && !result?.error };
}
function seedAdopt(scaffold, target, language) {
  for (const relative of ADOPT_FIXTURE_FILES[language]) {
    const from = path.join(scaffold, relative);
    const to = path.join(target, relative);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    if (relative === "pnpm-workspace.yaml") {
      fs.writeFileSync(to, "packages: []\nallowBuilds:\n  esbuild: true\n");
    } else if (fs.statSync(from).isDirectory()) fs.cpSync(from, to, { recursive: true });
    else fs.copyFileSync(from, to);
  }
  const smoke = path.join(target, language === "python" ? "tests/test_smoke.py" : "tests/smoke.test.ts");
  const body = fs.readFileSync(smoke, "utf8").replace(/^\s*(?:\/\/|#) req: R-001\r?\n/m, "");
  fs.writeFileSync(smoke, body);
}

export function runAcceptance({ src, ref, tmpRoot = os.tmpdir(), run = defaultRun, log = console.log }) {
  const resolve = runChecked(run, "git", ["-C", src, "rev-parse", "--verify", `${ref}^{commit}`], src);
  if (!resolve.ok) { log(`template acceptance failed: git ${textOf(resolve.result).trim() || "could not start"}`); return 1; }
  const sha = String(resolve.result.stdout).trim();
  if (!/^[0-9a-f]{40}$/i.test(sha)) { log("template acceptance failed: git returned an invalid commit SHA"); return 1; }
  const root = fs.mkdtempSync(path.join(tmpRoot, "template-accept-"));
  const failures = [];
  const childEnv = { ...process.env, GIT_CONFIG_COUNT: "1", GIT_CONFIG_KEY_0: "gc.auto", GIT_CONFIG_VALUE_0: "0" };
  try {
    for (const language of ["python", "typescript"]) {
      const scaffold = path.join(root, `${language}-scaffold`);
      const render = runChecked(run, "uvx", copierArgs(language, ANSWERS[language], scaffold, sha), src, childEnv);
      if (!render.ok) failures.push({ language, mode: "scaffold", command: "uvx copier copy", code: render.result?.status, output: textOf(render.result) });
      const adopt = path.join(root, `${language}-adopt`);
      if (render.ok) {
        fs.mkdirSync(adopt, { recursive: true });
        seedAdopt(scaffold, adopt, language);
      }
      const overlay = runChecked(run, "uvx", copierArgs(language, ANSWERS[language], adopt, sha, true), src, childEnv);
      if (!overlay.ok) failures.push({ language, mode: "adopt", command: "uvx copier copy --overwrite", code: overlay.result?.status, output: textOf(overlay.result) });
      for (const [mode, dir] of [["scaffold", scaffold], ["adopt", adopt]]) {
        if (!fs.existsSync(dir)) continue;
        if (mode === "adopt") {
          const map = language === "python" ? ["uv", ["run", "python", "scripts/code_map.py"]] : [process.execPath, ["scripts/code-map.mjs"]];
          const mapped = runChecked(run, map[0], map[1], dir);
          if (!mapped.ok) failures.push({ language, mode, command: map[1].join(" "), code: mapped.result?.status, output: textOf(mapped.result) });
        }
        for (const [cmd, args] of ACCEPTANCE_COMMANDS[language]) {
          const result = runChecked(run, cmd, args, dir);
          if (!result.ok) failures.push({ language, mode, command: [cmd, ...args].join(" "), code: result.result?.status ?? 1, output: textOf(result.result) });
        }
      }
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
  for (const failure of failures) {
    const lines = failure.output.trim().split(/\r?\n/).slice(-40);
    log(`${failure.language} ${failure.mode}: ${failure.command} exited ${failure.code ?? 1}${lines.length ? `\n${lines.join("\n")}` : ""}`);
  }
  return failures.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try { process.exitCode = runAcceptance({ ...cli(process.argv.slice(2)) }); }
  catch (error) { console.error(error.message); process.exitCode = 2; }
}
