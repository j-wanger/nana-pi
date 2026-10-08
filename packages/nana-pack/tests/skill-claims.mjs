/**
 * @module packages/nana-pack/tests/skill-claims.mjs
 * @purpose Judge path, package-script, flag, and nana-command claims on one declared surface.
 * @inputs A surface name, its text, and the root directories against which its claims apply.
 * @outputs Judged claim counts, unjudged command heads, and categorized problems.
 * @effects disk (reads package metadata and claimed source paths).
 * @errors Invalid package metadata is treated as an empty declaration; claim failures are returned to the caller.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { claims, shellLines, pathProblems, flagProblems, commandProblems } from "../../../templates/typescript/template/scripts/readme-check.mjs";

export const SURFACES = {
  "scaffold-py": ["python-scaffold"],
  "scaffold-ts": ["typescript-scaffold"],
  "adopt-py": ["python-adopt"],
  "adopt-ts": ["typescript-adopt"],
  "py-lint": ["python-scaffold"],
  "py-test": ["python-scaffold"],
  "py-review": ["python-scaffold"],
  spec: ["python-scaffold", "typescript-scaffold"],
  requirements: ["python-scaffold", "typescript-scaffold", "checkout"],
  "adopt-structure": ["python-adopt", "typescript-adopt", "checkout"],
  "templates/_shared/working-under-nana-pi.md": ["python-scaffold", "typescript-scaffold", "python-adopt", "typescript-adopt", "checkout"],
};

export const EXEMPTIONS = [
  ...[["adopt-py", "tests/__init__.py"], ["adopt-structure", "AGENTS.override.md"], ["adopt-structure", "CLAUDE.md"], ["adopt-structure", "nana-pack.json"], ["adopt-structure", "./skills"], ["adopt-structure", "skills/adopt-structure"], ["requirements", "config.mjs"], ["requirements", "config.py"], ["requirements", "config.ts"], ["requirements", "path/to/module"], ["adopt-ts", "pnpm-workspace.yaml"], ["py-review", "uv.lock"], ["spec", "specs"]].map(([surface, text]) => ({ surface, kind: "path", text, reason: "Claim is a documented placeholder or optional target, measured in the lane probe." })),
  ...["nana-adoption.sh", "nana-knowledge.ts", "nana-knowledge.ts hook", "nana-objective.sh", "nana-shared-memory.sh", "verifier-pipe.mjs", "nana-knowledge"].map((text) => ({ surface: "templates/_shared/working-under-nana-pi.md", kind: "path", text, reason: "Runtime name is provided by another package or runtime, measured in the lane probe." })),
];
const COMMAND_HEADS = new Set(["npm", "pnpm", "yarn", "bun", "npx", "uv", "uvx", "python", "python3", "node", "make", "just", "git", "pi", "claude", "codex", "ruff", "mypy", "pytest", "curl", "brew", "chmod", "cp", "mv", "mkdir", "touch", "export", "source", "cd", "echo", "cat", "grep", "sed", "find", "ls"]);

export function staleExemptions(surface, text) {
  const found = new Set(claims(stripFenceComments(text)).map((claim) => `${claim.kind}:${claim.text}`));
  return EXEMPTIONS.filter((entry) => entry.surface === surface && !found.has(`${entry.kind}:${entry.text}`));
}

export function surfaceCoverage(table, skills, shared) {
  const names = Object.keys(table).map((name) => name.endsWith(".md") ? name : `${name}/SKILL.md`).sort();
  return JSON.stringify(names) === JSON.stringify([...skills, shared].sort());
}

function stripFenceComments(text) {
  const lines = text.split("\n");
  let inShell = false;
  return lines.map((line) => {
    if (/^\s*```/.test(line)) {
      const lang = line.trim().slice(3).trim().toLowerCase();
      inShell = inShell ? false : ["", "bash", "sh", "shell", "zsh", "console", "shell-session", "text"].includes(lang);
      return line;
    }
    return inShell ? line.replace(/\s+#\s.*$/, "") : line;
  }).join("\n");
}

function scriptsOf(root) {
  try { return Object.keys(JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).scripts ?? {}); }
  catch { return []; }
}

function binSources(root) {
  const found = new Map();
  for (const entry of fs.readdirSync(path.join(root, "packages"), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgRoot = path.join(root, "packages", entry.name);
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, "package.json"), "utf8"));
      const bins = typeof pkg.bin === "string" ? { [pkg.name?.split("/").at(-1)]: pkg.bin } : pkg.bin ?? {};
      for (const [name, file] of Object.entries(bins)) found.set(name, { file: path.resolve(pkgRoot, file), pkgRoot });
    } catch {}
  }
  return found;
}

function nanaProblems(root, text, lineOffset = 0) {
  const found = binSources(root);
  const out = [];
  for (const [line, body] of [...text.split("\n").entries()].map(([i, value]) => [i + 1 + lineOffset, value])) {
    const commands = [...body.matchAll(/`([^`]+)`/g)].map((m) => [m[1], line]);
    commands.push(...shellLines(text).filter(([n]) => n === line - lineOffset).map(([, command]) => [command, line]));
    for (const [command, n] of commands) {
      const tokens = command.trim().split(/\s+/);
      const bin = found.get(tokens[0]);
      if (bin) checkNana(bin, tokens, n, out, tokens[0]);
    }
  }
  return out;
}
function checkNana(bin, tokens, line, out, name) {
  if (!fs.existsSync(bin.file)) return;
  const source = fs.readFileSync(bin.file, "utf8");
  for (const token of tokens.slice(1)) {
    if (token.startsWith("--") && !source.includes(token)) out.push(`${name}:${line}: '${token}' is absent from command source`);
  }
  const subcommand = tokens.slice(1).find((token) => !token.startsWith("-") && !/[<>]/.test(token));
  if (subcommand && !source.includes(subcommand)) out.push(`${name}:${line}: '${subcommand}' is absent from command source`);
}

function targetClaimApplies(target, surface, claim) {
  if (surface === "requirements" && target.name.startsWith("typescript") && /(?:code_map|readme_check)\.py$/.test(claim.text)) return false;
  if (surface === "requirements" && target.name.startsWith("python") && /(?:code-map|readme-check)\.mjs$/.test(claim.text)) return false;
  if (surface === "requirements" && target.name.startsWith("typescript") && /^(?:uv run python|python3)\s/.test(claim.text)) return false;
  if (surface === "requirements" && target.name.startsWith("python") && /^(?:pnpm|npm)\s/.test(claim.text)) return false;
  if (["adopt-py", "adopt-ts"].includes(surface) && claim.text === "readme-check.config.json") return false;
  if (surface === "adopt-structure" && target.name !== "checkout" && ["templates/_shared", "package.json"].includes(claim.text)) return false;
  return true;
}

function targetPathProblems(target, surface, claim, checkoutRoot) {
  if (!targetClaimApplies(target, surface, claim)) return [];
  const where = surface === "templates/_shared/working-under-nana-pi.md"
    ? "templates/_shared/working-under-nana-pi.md"
    : `packages/nana-pack/skills/${surface}/SKILL.md`;
  const skillDir = path.resolve(checkoutRoot, path.dirname(where));
  const resolved = pathProblems(target.root, ".", claim).length === 0 || pathProblems(skillDir, ".", claim).length === 0;
  return resolved ? [] : [`${surface}:${claim.line}: '${claim.text}' does not exist in declared target '${target.name}'`];
}

export function judgeClaims({ surface, root, targets, text }) {
  const cleaned = stripFenceComments(text);
  const list = claims(cleaned);
  const pathIssues = [];
  const commandIssues = [];
  const flagIssues = nanaProblems(root, cleaned);
  const unjudgedCommands = [];
  for (const claim of list) {
    if (claim.kind === "path") {
      if (!EXEMPTIONS.some((e) => e.surface === surface && e.kind === "path" && e.text === claim.text)) {
        for (const target of targets) pathIssues.push(...targetPathProblems(target, surface, claim, root));
      }
    }
    if (claim.kind === "command") {
      const first = claim.text.trim().split(/\s+/)[0];
      const pm = /^(npm|pnpm|yarn|bun)\s+(?:run\s+)?([A-Za-z0-9:_.-]+)/.exec(claim.text);
      for (const target of targets) {
        if (!targetClaimApplies(target, surface, claim)) continue;
        const scripts = scriptsOf(target.root);
        commandIssues.push(...commandProblems(target.root, surface, claim, scripts));
        if (pm && pm[1] === "pnpm" && scripts.includes(pm[2]) && /(?:^|\s)--(?:\s|$)/.test(claim.text)) {
          commandIssues.push(`${surface}:${claim.line}: literal -- separator after pnpm script in target '${target.name}'`);
        }
        if (scripts.includes(first)) commandIssues.push(`${surface}:${claim.line}: '${first}' is a script; spell it with its runner for target '${target.name}'`);
        if (claim.text.startsWith("scripts/")) {
          const flags = [...claim.text.matchAll(/--[\w-]+/g)].map((m) => m[0]);
          for (const flag of flags) flagIssues.push(...flagProblems(target.root, surface, { ...claim, text: `${claim.text.split(/\s+/)[0]} ${flag}` }));
        }
      }
      if (!pm && !COMMAND_HEADS.has(first) && !path.isAbsolute(first)) unjudgedCommands.push(first);
    }
    if (claim.kind === "flag") {
      for (const target of targets) {
        if (fs.existsSync(path.join(target.root, claim.text.split(" ")[0]))) flagIssues.push(...flagProblems(target.root, surface, claim));
      }
    }
  }
  return { claims: list.length, pathProblems: pathIssues, commandProblems: commandIssues, flagProblems: flagIssues, unjudgedCommands };
}
