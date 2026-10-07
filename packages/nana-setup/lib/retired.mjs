/**
 * @module packages/nana-setup/lib/retired.mjs
 * @purpose Describe only legacy artifacts whose exact captured file fingerprints permit safe retirement.
 * @inputs home path and filesystem entries inspected with lstat.
 * @outputs a list of relative paths, expected kinds, and exact provenance predicates.
 * @effects disk (reads artifact contents; callers perform moves).
 * @errors unreadable, linked, or mismatched artifacts are returned as unrecognized, never followed.
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import fingerprints from "./retired-fingerprints.json" with { type: "json" };

const legacySkills = ["py-init", "ts-init", "nana-init", "nana", "spec", "py-lint", "py-review", "py-test"];
const agentImports = ["dev-check", "dev-debrief", "dev-init", "dev-plan", "dev-scan", "dev-wiki", "knowledge-wiki", "memory-consolidate", "nana", "nana-init", "py-init", "ts-init", "wiki-absorb", "wiki-add", "wiki-bootstrap", "wiki-consolidate", "wiki-health", "wiki-index", "wiki-init", "wiki-query", "wiki-registry", "wiki-reorg"];

function digest(file) {
 const bytes = fs.readFileSync(file);
 return bytes.length ? createHash("sha256").update(bytes).digest("hex") : "empty file";
}

/** Verify the exact file set and every digest under an artifact root. */
export function matchesFingerprintArtifact(root, relative, manifest) {
 const prefix = `${relative}/`;
 const expected = Object.entries(manifest).filter(([name]) => name.startsWith(prefix));
 if (!expected.length) return false;
 const actual = [];
 const walk = (directory, rel) => {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
   const absolute = path.join(directory, item.name);
   const name = `${rel}/${item.name}`;
   const stat = fs.lstatSync(absolute);
   if (stat.isSymbolicLink()) throw new Error("linked artifact content");
   if (stat.isDirectory()) walk(absolute, name);
   else if (stat.isFile()) actual.push([name, digest(absolute)]);
   else throw new Error("unsupported artifact entry");
  }
 };
 try {
  walk(root, relative);
  actual.sort(([a], [b]) => a.localeCompare(b));
  expected.sort(([a], [b]) => a.localeCompare(b));
  return actual.length === expected.length && actual.every(([name, hash], i) => name === expected[i][0] && hash === expected[i][1]);
 } catch { return false; }
}

function exactArtifact(relative, kind) {
 return (stat, absolutePath) => {
  if (kind === "directory") return stat.isDirectory() && matchesFingerprintArtifact(absolutePath, relative, fingerprints);
  if (!stat.isFile()) return false;
  const expected = fingerprints[relative];
  return expected !== undefined && digest(absolutePath) === expected;
 };
}

/** Return manifest entries rooted under the supplied home, without resolving their paths. */
export function retiredArtifacts(home) {
 const entries = [
  ...legacySkills.map((name) => ({ relative: `.claude/skills/${name}`, kind: "directory", provenance: exactArtifact(`.claude/skills/${name}`, "directory") })),
  ...agentImports.map((name) => ({ relative: `.agents/skills/${name}`, kind: "directory", provenance: exactArtifact(`.agents/skills/${name}`, "directory") })),
  ...[".claude/enforce", ".claude/enforce-memory"].map((relative) => ({ relative, kind: "file", provenance: exactArtifact(relative, "file") })),
 ];
 for (const relative of Object.keys(fingerprints)) {
  if (relative.startsWith(".claude/hooks/") && relative.endsWith(".bak-20260918") && !relative.slice(".claude/hooks/".length).includes("/")) {
   entries.push({ relative, kind: "file", provenance: exactArtifact(relative, "file") });
  }
 }
 return entries;
}

/** Check kind and provenance on the lstat'd path, without following a link. */
export function matchesRetiredArtifact(entry, stat, absolutePath) {
 if (!stat || stat.isSymbolicLink()) return false;
 const kindMatches = entry.kind === "directory" ? stat.isDirectory() : stat.isFile();
 if (!kindMatches) return false;
 try { return entry.provenance(stat, absolutePath); } catch { return false; }
}
