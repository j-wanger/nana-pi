/**
 * @module apps/desk/test/knowledge-home-isolation.test.mjs
 * @purpose Pin temporary knowledge-home isolation in every real-pi desk E2E harness.
 * @inputs The real-pi E2E harness sources in this test directory.
 * @outputs PASS/FAIL checks for each harness's child environment.
 * @effects disk (reads test source files)
 * @errors A missing or non-temporary knowledge-home assignment prints FAIL and exits nonzero.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const harnesses = ["double-msg.e2e.mjs", "stage-chain.e2e.mjs", "stage-chain-edge.e2e.mjs"];
let failures = 0;
const check = (name, ok) => {
  console.log(ok ? "PASS" : "FAIL", name);
  if (!ok) failures++;
};

// req: R-898
check("real-pi E2E harnesses isolate the knowledge home", harnesses.every((name) => {
  const source = fs.readFileSync(path.join(testDir, name), "utf8");
  return /NANA_KNOWLEDGE_HOME:\s*path\.join\((?:tmp|CWD),\s*["']knowledge["']\)/.test(source);
}));

process.exit(failures ? 1 : 0);
