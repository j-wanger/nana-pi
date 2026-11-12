/**
 * @module scripts/test-packs.mjs
 * @purpose Select complete packs and individually affected tests with auditable reasons.
 * @inputs Collected relative paths, pack names, a base ref, tracked working-tree edits, untracked non-ignored files, git and graph boundaries.
 * @outputs Selected paths and a record of changed paths, changed-test, release and module reasons and fail-safe cause.
 * @effects process (bounded git reads), disk (code graph reads).
 * @errors Invalid packs or incomplete membership throw; uncertain impact selects all modules.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { CI_READ_TIMEOUT_MS, CHILD_OUTPUT_MAX_BYTES } from "../packages/nana-pack/lib/land-config.mjs";
import { globMatch } from "./glob-match.mjs";
import { TEST_PACKS, PACK_NAMES, WATCH_GLOBS, FAIL_SAFE_PATHS, RELEASE_GLOBS, RELEASE_COVERAGE_HOLDS, NAME_MATCH_HUBS, NAME_MATCH_STEM_FOLDERS, NAME_MATCH_STEM_MIN_LENGTH, packProblems } from "../packages/nana-pack/lib/test-packs-config.mjs";

/** Read deduplicated paths from the merge base to the working tree, including untracked non-ignored files; NULs preserve whitespace in paths. */
export function changedPaths(root, ref) {
  const git = args => {
    const r = spawnSync("git", args, { cwd: root, encoding: "utf8", timeout: CI_READ_TIMEOUT_MS, maxBuffer: CHILD_OUTPUT_MAX_BYTES });
    if (r.error || r.status !== 0) throw new Error(`diff could not be read: ${r.stderr?.trim() || r.error?.message || `git ${args.join(" ")} exited ${r.status}`}`);
    return r.stdout;
  };
  const base = git(["merge-base", ref, "HEAD"]).trim();
  const tracked = git(["diff", "--name-only", "--no-renames", "-z", base]);
  const untracked = git(["ls-files", "--others", "--exclude-standard", "-z"]);
  return [...new Set((tracked + untracked).split("\0").filter(Boolean))];
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
  const selection = { changedFrom, changedPaths: [], changedTests: [], nameMatches: [], module: [], release: [], failSafe: null };
  const moduleFiles = files.filter(file => membership[file] === "module");
  const reasons = new Map();
  const add = (file, reason, target = reasons) => { if (!target.has(file)) target.set(file, new Set()); target.get(file).add(reason); };
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
  const namedPaths = selection.changedPaths.filter(file => !NAME_MATCH_HUBS.includes(path.posix.basename(file))).map(changed => {
    const basename = path.posix.basename(changed);
    const stem = path.posix.basename(changed, path.posix.extname(changed));
    const inCommandFolder = path.posix.dirname(changed).split("/").some(folder => NAME_MATCH_STEM_FOLDERS.includes(folder));
    const stemPattern = inCommandFolder && stem.length >= NAME_MATCH_STEM_MIN_LENGTH
      ? new RegExp(`\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b(?![/\\\\])`) : null;
    return { changed, basename, stem, stemPattern };
  });
  if (namedPaths.length) {
    for (const file of files) {
      if (membership[file] === "manual") continue;
      const text = readFileSync(path.join(root, file), "utf8");
      const matches = namedPaths.flatMap(({ changed, basename, stem, stemPattern }) =>
        text.includes(basename) ? [`names ${changed}`] : stemPattern?.test(text) ? [`names ${stem} (${changed})`] : []);
      if (matches.length) selection.nameMatches.push({ path: file, reasons: matches });
    }
  }
  const nameMatches = new Set(selection.nameMatches.map(item => item.path));
  if (changedTestsOnly) return { packs: [], selection, files: files.filter(file => changedTests.has(file) || nameMatches.has(file)) };
  // Release files supplement a lane individually; neither setup edits nor fail-safe promote a pack.
  const lane = changedFrom && packs.includes("land") && packs.includes("module") && !packs.includes("main");
  const releaseReasons = new Map();
  const addRelease = (file, reason) => {
    if (lane && files.includes(file) && membership[file] === "release") add(file, reason, releaseReasons);
  };
  const holdReleaseCoverage = reason => {
    for (const file of Object.keys(RELEASE_COVERAGE_HOLDS)) addRelease(file, `coverage hold: ${reason}`);
  };
  for (const changed of selection.changedPaths) {
    if (membership[changed] === "release") holdReleaseCoverage(`changed release test: ${changed}`);
    for (const [file, globs] of Object.entries(RELEASE_COVERAGE_HOLDS)) {
      for (const glob of globs) if (globMatch(glob, changed)) addRelease(file, `coverage hold ${glob}: ${changed}`);
    }
    for (const glob of Object.keys(RELEASE_GLOBS)) {
      if (globMatch(glob, changed)) for (const file of files) addRelease(file, `release input ${glob}: ${changed}`);
    }
  }
  if (packs.includes("module")) {
    if (!changedFrom) all("complete module pack");
    else {
      const policy = selection.changedPaths.find(file => Object.hasOwn(FAIL_SAFE_PATHS, file));
      if (policy) selection.failSafe = `policy path changed: ${policy}`;
      if (!selection.failSafe || lane) {
        try {
          const { impact, blindReach } = await import("./code-map.mjs");
          const graph = await makeGraph(root);
          for (const changed of selection.changedPaths) {
            if (moduleFiles.includes(changed)) add(changed, "changed test");
            if (!graph.modules.has(changed) && !Object.keys(WATCH_GLOBS).some(glob => globMatch(glob, changed))) all(`unmapped path: ${changed}`);
            for (const caller of impact(graph, [changed]).callers) {
              if (moduleFiles.includes(caller)) add(caller, `caller of ${changed}`);
              addRelease(caller, `caller of ${changed}`);
              if (membership[caller] === "release") holdReleaseCoverage(`release caller of ${changed}`);
            }
          }
          for (const file of blindReach(graph)) if (moduleFiles.includes(file)) add(file, "blind reach");
          for (const changed of selection.changedPaths) for (const glob of Object.keys(WATCH_GLOBS)) if (globMatch(glob, changed)) all(`watch glob ${glob}: ${changed}`);
        } catch { selection.failSafe ??= "graph could not be read"; }
      }
      if (selection.failSafe) { reasons.clear(); all(`fail-safe: ${selection.failSafe}`); }
    }
  }
  if (selection.failSafe) holdReleaseCoverage(`fail-safe: ${selection.failSafe}`);
  selection.release = [...releaseReasons].sort(([a], [b]) => a.localeCompare(b)).map(([path, reasons]) => ({ path, reasons: [...reasons] }));
  selection.module = [...reasons].sort(([a], [b]) => a.localeCompare(b)).map(([path, reasons]) => ({ path, reasons: [...reasons] }));
  return { packs, selection, files: files.filter(file => changedTests.has(file) || nameMatches.has(file) || releaseReasons.has(file) || (packs.includes(membership[file]) && (membership[file] !== "module" || reasons.has(file)))) };
}
