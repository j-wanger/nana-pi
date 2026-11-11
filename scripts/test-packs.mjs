/**
 * @module scripts/test-packs.mjs
 * @purpose Select complete packs and conservative changed-module tests with auditable reasons.
 * @inputs Collected relative paths, pack names, a base ref, git and graph boundaries.
 * @outputs Selected paths and a record of changed paths, changed-test and module reasons and fail-safe cause.
 * @effects process (bounded git reads), disk (code graph reads).
 * @errors Invalid packs or incomplete membership throw; uncertain impact selects all modules.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { CI_READ_TIMEOUT_MS, CHILD_OUTPUT_MAX_BYTES } from "../packages/nana-pack/lib/land-config.mjs";
import { globMatch } from "./glob-match.mjs";
import { TEST_PACKS, PACK_NAMES, WATCH_GLOBS, FAIL_SAFE_PATHS, RELEASE_GLOBS, NAME_MATCH_HUBS, packProblems } from "../packages/nana-pack/lib/test-packs-config.mjs";

/** Read committed paths since the actual merge base; NULs preserve whitespace in paths. */
export function changedPaths(root, ref) {
  const git = args => {
    const r = spawnSync("git", args, { cwd: root, encoding: "utf8", timeout: CI_READ_TIMEOUT_MS, maxBuffer: CHILD_OUTPUT_MAX_BYTES });
    if (r.error || r.status !== 0) throw new Error(`diff could not be read: ${r.stderr?.trim() || r.error?.message || `git ${args.join(" ")} exited ${r.status}`}`);
    return r.stdout;
  };
  const base = git(["merge-base", ref, "HEAD"]).trim();
  return git(["diff", "--name-only", "--no-renames", "-z", `${base}...HEAD`]).split("\0").filter(Boolean);
}

async function makeRepoGraph(root) {
  const { collectModules, linkRepo, repoGraph } = await import("./code-map.mjs");
  const graph = repoGraph(root);
  linkRepo(root, graph, collectModules(root, graph.config));
  if (graph.problems.length) throw new Error("graph has problems");
  return graph;
}

/** Watch inputs read as text conservatively select every module test, not a guessed reader. */
export async function selectPackFiles({ root, files, packs, changedFrom = null, membership = TEST_PACKS, readDiff = changedPaths, makeGraph = makeRepoGraph, changedTestsOnly = false }) {
  if (!Array.isArray(packs) || (!packs.length && !changedTestsOnly) || packs.some(pack => !PACK_NAMES.includes(pack))) throw new Error(`bad --pack: ${packs?.join(",")}`);
  const problems = packProblems(files, membership);
  if (problems.length) throw new Error(problems.join("\n"));
  packs = [...new Set(packs)];
  const selection = { changedFrom, changedPaths: [], changedTests: [], nameMatches: [], module: [], failSafe: null };
  const moduleFiles = files.filter(file => membership[file] === "module");
  const reasons = new Map();
  const add = (file, reason) => { if (!reasons.has(file)) reasons.set(file, new Set()); reasons.get(file).add(reason); };
  const all = reason => { for (const file of moduleFiles) add(file, reason); };
  if (changedFrom) {
    try { selection.changedPaths = readDiff(root, changedFrom); }
    catch (error) {
      if (changedTestsOnly) throw error;
      selection.failSafe = error.message;
    }
  }
  const changedTests = new Set(selection.changedPaths.filter(file => files.includes(file) && membership[file] !== "manual"));
  selection.changedTests = [...changedTests].sort().map(path => ({ path, reasons: ["changed test"] }));
  // Read each eligible test once, independent of the module map that fail-safe clears.
  const namedPaths = selection.changedPaths.filter(file => !NAME_MATCH_HUBS.includes(path.posix.basename(file)));
  if (namedPaths.length) {
    for (const file of files) {
      if (membership[file] === "manual") continue;
      const text = readFileSync(path.join(root, file), "utf8");
      const matches = namedPaths.filter(changed => text.includes(path.posix.basename(changed)));
      if (matches.length) selection.nameMatches.push({ path: file, reasons: matches.map(changed => `names ${changed}`) });
    }
  }
  const nameMatches = new Set(selection.nameMatches.map(item => item.path));
  if (changedTestsOnly) return { packs: [], selection, files: files.filter(file => changedTests.has(file) || nameMatches.has(file)) };
  // Release paths and graph callers supplement a lane run, never a single-pack or main run.
  const lane = changedFrom && packs.includes("land") && packs.includes("module") && !packs.includes("main");
  const release = () => { if (lane && !packs.includes("release")) packs.push("release"); };
  if (selection.changedPaths.some(file => membership[file] === "release" || Object.keys(RELEASE_GLOBS).some(glob => globMatch(glob, file)))) release();
  if (packs.includes("module")) {
    if (!changedFrom) all("complete module pack");
    else {
      const policy = selection.changedPaths.find(file => Object.hasOwn(FAIL_SAFE_PATHS, file));
      if (policy) selection.failSafe = `policy path changed: ${policy}`;
      if (!selection.failSafe) {
        try {
          const { impact, blindReach } = await import("./code-map.mjs");
          const graph = await makeGraph(root);
          for (const changed of selection.changedPaths) {
            if (moduleFiles.includes(changed)) add(changed, "changed test");
            if (!graph.modules.has(changed) && !Object.keys(WATCH_GLOBS).some(glob => globMatch(glob, changed))) all(`unmapped path: ${changed}`);
            for (const caller of impact(graph, [changed]).callers) {
              if (moduleFiles.includes(caller)) add(caller, `caller of ${changed}`);
              if (membership[caller] === "release") release();
            }
          }
          for (const file of blindReach(graph)) if (moduleFiles.includes(file)) add(file, "blind reach");
          for (const changed of selection.changedPaths) for (const glob of Object.keys(WATCH_GLOBS)) if (globMatch(glob, changed)) all(`watch glob ${glob}: ${changed}`);
        } catch { selection.failSafe = "graph could not be read"; }
      }
      if (selection.failSafe) { reasons.clear(); all(`fail-safe: ${selection.failSafe}`); }
    }
  }
  if (selection.failSafe) release();
  selection.module = [...reasons].sort(([a], [b]) => a.localeCompare(b)).map(([path, reasons]) => ({ path, reasons: [...reasons] }));
  return { packs, selection, files: files.filter(file => changedTests.has(file) || nameMatches.has(file) || (packs.includes(membership[file]) && (membership[file] !== "module" || reasons.has(file)))) };
}
