/**
 * @module packages/nana-pack/tests/requirements-moved.test.mjs
 * @purpose Pin the tree movement report's feature grouping, merge-base diffing, cross-feature moves and shared-row annotations against a built git fixture.
 * @inputs scripts/requirements-moved.mjs and a fixture git repository built under the OS temp directory.
 * @outputs PASS/FAIL lines for each marked assertion and a non-zero exit when any fails.
 * @effects disk (creates a scratch git repository under the OS temp directory; never touches the repository this test runs in), process (spawns node and git as children)
 * @errors A failed check prints its reason and exits non-zero.
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";

let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const CLI = join(REPO_ROOT, "scripts/requirements-moved.mjs");

const dir = tmpDir(join(tmpdir(), "req-moved-"));
const cleanEnv = () => {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^GIT_/.test(key)) delete env[key];
  return env;
};
const env = cleanEnv();
function git(...args) {
  return spawnSync(
    "git",
    ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", ...args],
    { cwd: dir, encoding: "utf8", env },
  );
}
function writeLedger(text) { writeFileSync(join(dir, "REQUIREMENTS.md"), text); }
function commit(message) {
  const add = git("add", "-A");
  if (add.status !== 0) throw new Error(`git add failed: ${add.stderr}`);
  const made = git("commit", "-qm", message);
  if (made.status !== 0) throw new Error(`git commit failed: ${made.stderr}`);
}

const TABLE = "| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n";

// Commit c1 on main (must-meet.md's fixture).
const c1 = `# CAP-01 · Cap
Purpose: cap

## FEAT-001 · Alpha
Purpose: alpha
Status: active

${TABLE}| R-001 | Row one. | planned | — |
| R-002 | Row two. | untested | — |
| R-003 | Row three. | implemented | — |

## FEAT-002 · Beta
Purpose: beta
Status: active
Also applies: R-001

${TABLE}| R-004 | Row four. | untested | — |
| R-005 | Row five. | untested | — |

## FEAT-003 · Gamma
Purpose: gamma
Status: active

### SUB-001 · Deep
Purpose: deep

${TABLE}| R-008 | Row eight. | untested | — |
`;

// Branch feat/x from c1 (must-meet.md's branch bullets): R-001 implemented, R-002 reworded,
// R-003 deleted, R-006 added planned in FEAT-001, R-004 moved into FEAT-001, R-005 Evidence-only
// edit, R-008 implemented.
const branch = `# CAP-01 · Cap
Purpose: cap

## FEAT-001 · Alpha
Purpose: alpha
Status: active

${TABLE}| R-001 | Row one. | implemented | — |
| R-002 | Row two, reworded. | untested | — |
| R-004 | Row four. | untested | — |
| R-006 | Row six. | planned | — |

## FEAT-002 · Beta
Purpose: beta
Status: active
Also applies: R-001

${TABLE}| R-005 | Row five. | untested | edited |

## FEAT-003 · Gamma
Purpose: gamma
Status: active

### SUB-001 · Deep
Purpose: deep

${TABLE}| R-008 | Row eight. | implemented | — |
`;

// main, after the branch point (must-meet.md: "After the branch, main gains R-007 in FEAT-002").
const mainAfter = `# CAP-01 · Cap
Purpose: cap

## FEAT-001 · Alpha
Purpose: alpha
Status: active

${TABLE}| R-001 | Row one. | planned | — |
| R-002 | Row two. | untested | — |
| R-003 | Row three. | implemented | — |

## FEAT-002 · Beta
Purpose: beta
Status: active
Also applies: R-001

${TABLE}| R-004 | Row four. | untested | — |
| R-005 | Row five. | untested | — |
| R-007 | Row seven. | untested | — |

## FEAT-003 · Gamma
Purpose: gamma
Status: active

### SUB-001 · Deep
Purpose: deep

${TABLE}| R-008 | Row eight. | untested | — |
`;

git("init", "-q", "-b", "main");
git("config", "core.autocrlf", "false");
writeLedger(c1);
commit("c1");

const branched = git("checkout", "-q", "-b", "feat/x");
if (branched.status !== 0) throw new Error(`git checkout -b feat/x failed: ${branched.stderr}`);
writeLedger(branch);
commit("branch");

const toMain = git("checkout", "-q", "main");
if (toMain.status !== 0) throw new Error(`git checkout main failed: ${toMain.stderr}`);
writeLedger(mainAfter);
commit("main gains R-007");

const backToBranch = git("checkout", "-q", "feat/x");
if (backToBranch.status !== 0) throw new Error(`git checkout feat/x failed: ${backToBranch.stderr}`);

const result = spawnSync(process.execPath, [CLI, "--root", dir, "--base", "main"], { encoding: "utf8", env });
const stdout = result.stdout ?? "";

/** A row line's nearest preceding unindented stdout line. */
function rowSection(id) {
  const lines = stdout.replace(/\r/g, "").split("\n");
  let current = null;
  const rowStart = new RegExp(`^ {2}${id} `);
  for (const line of lines) {
    if (line !== "" && !/^\s/.test(line)) current = line;
    if (rowStart.test(line)) return { line, section: current };
  }
  return { line: null, section: null };
}

const r1 = rowSection("R-001");
const r2 = rowSection("R-002");
const r3 = rowSection("R-003");
const r4 = rowSection("R-004");
const r5 = rowSection("R-005");
const r6 = rowSection("R-006");
const r8 = rowSection("R-008");

const mt1 = result.status === 0
  && r1.section === "FEAT-001 · Alpha" && r1.line.includes("planned -> implemented")
  && r2.section === "FEAT-001 · Alpha" && r2.line.includes("text changed")
  && r3.section === "FEAT-001 · Alpha" && r3.line.includes("removed (implemented)")
  && r6.section === "FEAT-001 · Alpha" && r6.line.includes("new (planned)")
  && r8.section === "FEAT-003 · Gamma" && r8.line.includes("untested -> implemented")
  && r5.line === null;
// req: R-1460
check("R-1460: added, removed, re-statused and reworded rows are listed under their feature, evidence-only edits are not", mt1, `status ${result.status}\nstdout:\n${stdout}\nstderr:\n${result.stderr}`);

const mt2 = !/R-007/.test(stdout) && Boolean(r6.line?.includes("new (planned)"));
// req: R-1461
check("R-1461: rows main gained after the branch point are not reported", mt2, stdout);

const mt3 = r4.section === "FEAT-001 · Alpha" && Boolean(r4.line?.includes("moved from FEAT-002"));
// req: R-1462
check("R-1462: a row moved to another feature is listed there naming the feature it left", mt3, stdout);

const mt4 = Boolean(r1.line?.includes("also applies: FEAT-002")) && !r2.line?.includes("also applies");
// req: R-1463
check("R-1463: a changed shared row names the feature that lists it", mt4, stdout);

if (fails > 0) { console.log(`${fails} check(s) failed`); process.exit(1); }
console.log("all checks passed");
