/**
 * @module apps/desk/test/knowledge-home-isolation.test.mjs
 * @purpose Pin temporary knowledge-home isolation in every committed real-pi launcher.
 * @inputs Real-process E2E harness and probe source files.
 * @outputs PASS/FAIL checks for each launcher's child environment.
 * @effects disk (reads committed test and review source files)
 * @errors A missing or non-temporary knowledge-home assignment prints FAIL and exits nonzero.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const listFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const fullPath = path.join(dir, entry.name);
  return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
});
const appDirs = fs.readdirSync(path.join(repoRoot, "apps"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(repoRoot, "apps", entry.name));
const candidates = [
  ...appDirs.flatMap((dir) => {
    const testDir = path.join(dir, "test");
    return fs.existsSync(testDir) ? fs.readdirSync(testDir)
      .filter((name) => name.endsWith(".e2e.mjs")).map((name) => path.join(testDir, name)) : [];
  }),
  ...listFiles(path.join(repoRoot, "docs/reviews")).filter((file) => file.endsWith(".mjs")),
];
const launchesPi = (source, file) =>
  /\b(?:spawn|exec)(?:Sync)?\s*\(\s*["'`]pi["'`]/.test(source) ||
  (/\/test\/[^/]+\.e2e\.mjs$/.test(file) && /REAL[\s\S]{0,80}pi[\s\S]{0,40}child|real pi child spawned/i.test(source));
const launchers = candidates.flatMap((file) => {
  const source = fs.readFileSync(file, "utf8");
  return launchesPi(source, file) ? [{ file, source }] : [];
});
let failures = 0;
const check = (name, ok) => {
  console.log(ok ? "PASS" : "FAIL", name);
  if (!ok) failures++;
};

// req: R-898
check("real-pi launchers isolate the knowledge home", launchers.length > 0 && launchers.every(({ file, source }) => {
  const relative = path.relative(repoRoot, file);
  return /NANA_KNOWLEDGE_HOME\s*:\s*path\.join\((?:tmp|CWD|os\.tmpdir\(\)),\s*["']knowledge["']\)/.test(source) ||
    (relative.startsWith("docs/reviews/") && /const knowledgeHome\s*=\s*fs\.mkdtempSync\(path\.join\(os\.tmpdir\(\),/.test(source) &&
      /NANA_KNOWLEDGE_HOME\s*:\s*knowledgeHome/.test(source));
}));

// req: R-899
check("acceptance driver removes its temporary knowledge home in child-close cleanup", /finally\s*\{[\s\S]*?fs\.rmSync\(knowledgeHome,\s*\{\s*recursive:\s*true,\s*force:\s*true\s*\}\)/.test(fs.readFileSync(path.join(repoRoot, "docs/reviews/pi-1.0-2026-10-04/acceptance-driver.mjs"), "utf8")));

process.exit(failures ? 1 : 0);
