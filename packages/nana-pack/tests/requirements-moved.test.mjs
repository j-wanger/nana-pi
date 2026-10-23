/**
 * @module packages/nana-pack/tests/requirements-moved.test.mjs
 * @purpose Pin the tree movement report's row grouping, merge-base diffing, capability changes and shared-row annotations.
 * @inputs scripts/requirements-moved.mjs, direct ledger texts and a fixture git repository built under the OS temp directory.
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
import { treeMovement } from "../../../scripts/requirements-moved.mjs";

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

function movementLedger({ moveFeature = false, kind = "product", needs = "CAP-01, CAP-03", binds = null, deliverables = "R-002", retired = null, includeThird = true, includeFourth = false } = {}) {
  const featureOne = `## FEAT-001 · Alpha\nPurpose: alpha\nStatus: active\n\n${TABLE}| R-001 | Row one. | untested | — |\n`;
  const fieldLines = [`Kind: ${kind}`, `Needs: ${needs}`, ...(binds === null ? [] : [`Binds: ${binds}`]), `Deliverables: ${deliverables}`, ...(retired === null ? [] : [`Retired: ${retired}`])].join("\n");
  return `# CAP-01 · First\nPurpose: first\nKind: product\n${moveFeature ? "" : `\n${featureOne}`}\n# CAP-02 · Second\nPurpose: second\n${fieldLines}\n${moveFeature ? `\n${featureOne}` : ""}\n## FEAT-002 · Beta\nPurpose: beta\nStatus: active\n\n${TABLE}| R-002 | Row two. | untested | — |\n\n${includeThird ? "# CAP-03 · Third\nPurpose: third\nKind: product\n" : ""}${includeFourth ? "\n# CAP-04 · Fourth\nPurpose: fourth\nKind: constraint\nBinds: CAP-01\n" : ""}`;
}

const capabilityBase = movementLedger();
const capabilityHead = movementLedger({ moveFeature: true, kind: "constraint", needs: "CAP-01", binds: "CAP-01", deliverables: "R-001", retired: "CAP-01", includeThird: false, includeFourth: true });
const capabilityOutput = treeMovement({ baseText: capabilityBase, headText: capabilityHead, baseRevLabel: "base", headRevLabel: "head" });
const reorderBase = movementLedger({ needs: "CAP-01, CAP-03" });
const reorderHead = movementLedger({ needs: "  CAP-03 ,  CAP-01  " });
const reorderOutput = treeMovement({ baseText: reorderBase, headText: reorderHead, baseRevLabel: "base", headRevLabel: "head" });
const whitespaceHead = movementLedger({ needs: "  CAP-01 ,  CAP-03  " });
const whitespaceOutput = treeMovement({ baseText: reorderBase, headText: whitespaceHead, baseRevLabel: "base", headRevLabel: "head" });
const rowOnlyHead = capabilityBase.replace("| R-001 | Row one. | untested | — |", "| R-001 | Row one. | implemented | — |");
const rowOnlyOutput = treeMovement({ baseText: capabilityBase, headText: rowOnlyHead, baseRevLabel: "base", headRevLabel: "head" });
const expectedRowOnly = "tree movement base..head: 1 rows in 1 features\nFEAT-001 · Alpha\n  R-001 untested -> implemented";
const capabilityClaims = [
  "FEAT-001 moved CAP-01 → CAP-02",
  "CAP-02 · Second: Kind product → constraint",
  "CAP-02 · Second: Needs CAP-01, CAP-03 → CAP-01",
  "CAP-02 · Second: Binds none → CAP-01",
  "CAP-02 · Second: Deliverables R-002 → R-001",
  "CAP-02 · Second: Retired none → CAP-01",
  "CAP-03 · Third: removed",
  "CAP-04 · Fourth: new",
];
// req: R-2447
check("R-2447: a capability move or capability field change prints a capability section, and none leaves the output unchanged", capabilityOutput.includes("0 rows in 0 features, 8 capability change(s)") && capabilityOutput.includes("\ncapabilities:\n") && capabilityClaims.every((claim) => capabilityOutput.includes(`  ${claim}`)) && !capabilityOutput.includes("tree movement: none") && reorderOutput === "tree movement: none" && whitespaceOutput === "tree movement: none" && rowOnlyOutput === expectedRowOnly, `capability:\n${capabilityOutput}\nreorder:\n${reorderOutput}\nwhitespace:\n${whitespaceOutput}\nrow-only:\n${rowOnlyOutput}`);

const deliverableBase = `# CAP-01 · Product
Purpose: product
Kind: product
Deliverables: R-001
Made by: R-001 · manual: release owner
Read by: R-001 · rule: required by the review checklist

## FEAT-001 · Alpha
Purpose: alpha
Status: active

${TABLE}| R-001 | Row one. | untested | — |
`;
const deliverableHead = deliverableBase
  .replace("Made by: R-001 · manual: release owner", "Made by: R-001 · suite: scripts/make.mjs")
  .replace("Read by: R-001 · rule: required by the review checklist", "Read by: R-001 · code: scripts/read.mjs");
const deliverableOutput = treeMovement({ baseText: deliverableBase, headText: deliverableHead, baseRevLabel: "base", headRevLabel: "head" });
const deliverableLines = deliverableOutput.split("\n").filter((line) => /^  R-001 /.test(line));
const changedIn = (baseText, headText) => treeMovement({ baseText, headText, baseRevLabel: "base", headRevLabel: "head" }).includes("Made by/Read by lines changed");
const crlfBase = deliverableBase.replaceAll("\n", "\r\n");
const crlfHead = deliverableHead.replaceAll("\n", "\r\n");
const noFinalBase = deliverableBase.replace(/\n$/, "");
const noFinalHead = deliverableHead.replace(/\n$/, "");
const trailingHead = deliverableBase.replace("Read by: R-001 · rule: required by the review checklist", "Read by: R-001 · rule: required by the review checklist \t");
// req: R-2540
check("the movement report lists a row whose Made by or Read by lines changed", deliverableOutput.startsWith("tree movement base..head: 1 rows in 1 features\nFEAT-001 · Alpha\n") && deliverableLines.length === 1 && deliverableLines[0].includes("Made by/Read by lines changed") && changedIn(crlfBase, crlfHead) && changedIn(noFinalBase, noFinalHead) && changedIn(deliverableBase, trailingHead) && treeMovement({ baseText: deliverableBase, headText: deliverableBase, baseRevLabel: "base", headRevLabel: "head" }) === "tree movement: none", deliverableOutput);

const parkLine = "Parked: R-001 · since 2026-10-22: the owner holds it";
const parkedHead = deliverableBase.replace("Read by: R-001 · rule: required by the review checklist", `Read by: R-001 · rule: required by the review checklist\n${parkLine}`);
const rewordedHead = parkedHead.replace("the owner holds it", "the owner still holds it");
const parkedMovement = treeMovement({ baseText: deliverableBase, headText: parkedHead, baseRevLabel: "base", headRevLabel: "head" });
const unparkedMovement = treeMovement({ baseText: parkedHead, headText: deliverableBase, baseRevLabel: "base", headRevLabel: "head" });
const rewordedMovement = treeMovement({ baseText: parkedHead, headText: rewordedHead, baseRevLabel: "base", headRevLabel: "head" });
const parkEntryIsSeparate = (output) => {
  const entries = output.split("\n").filter((line) => /^  R-001 /.test(line));
  return entries.length === 1 && entries[0].includes("Parked lines changed") && !entries[0].includes("Made by/Read by lines changed");
};
// req: R-2643
check("R-2643: the movement report lists a row whose Parked line was added, removed or reworded",
  parkEntryIsSeparate(parkedMovement) && parkEntryIsSeparate(unparkedMovement) && parkEntryIsSeparate(rewordedMovement) && treeMovement({ baseText: parkedHead, headText: parkedHead, baseRevLabel: "base", headRevLabel: "head" }) === "tree movement: none",
  `added:\n${parkedMovement}\nremoved:\n${unparkedMovement}\nreworded:\n${rewordedMovement}`);

if (fails > 0) { console.log(`${fails} check(s) failed`); process.exit(1); }
console.log("all checks passed");
