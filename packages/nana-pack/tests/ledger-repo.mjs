/**
 * @module packages/nana-pack/tests/ledger-repo.mjs
 * @purpose Build caller-scoped ledger repositories and capture real movement reports without a stdout pipe.
 * @inputs A caller-supplied folder, optional ledger texts and branch name, and the repository's movement script.
 * @outputs Git runner, ledger writer, commit helper, process result and file-written report text.
 * @effects disk (writes temporary repositories and report files), process (starts git and node).
 * @errors Git setup or file errors throw; movement failures are returned with stderr and status.
 */
import { spawnSync } from "node:child_process";
import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { MOVEMENT_BASE, MOVEMENT_NODE_ARGS, MOVEMENT_SCRIPT_URL, MOVEMENT_TIMEOUT_MS, MOVEMENT_MAX_BYTES } from "../lib/review-movement-config.mjs";

export const TABLE = "| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n";

export function ledgerText(rows = "| R-001 | Row one. | untested | — |\n") {
  return `# CAP-01 · Cap\nPurpose: cap\n\n## FEAT-001 · Alpha\nPurpose: alpha\nStatus: active\n\n${TABLE}${rows}`;
}

function cleanEnv() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^GIT_/.test(key)) delete env[key];
  return env;
}

export function ledgerRepo(dir) {
  mkdirSync(dir, { recursive: true });
  const env = cleanEnv();
  function git(...args) {
    return spawnSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", ...args], { cwd: dir, encoding: "utf8", env, timeout: MOVEMENT_TIMEOUT_MS });
  }
  function writeLedger(text) { writeFileSync(join(dir, "REQUIREMENTS.md"), text); }
  function commit(message) {
    const add = git("add", "-A");
    if (add.status !== 0) throw new Error(`git add failed: ${add.stderr}`);
    const made = git("commit", "-qm", message);
    if (made.status !== 0) throw new Error(`git commit failed: ${made.stderr}`);
  }
  return { git, writeLedger, commit, env };
}

export function reportToFile(dir, reportFile) {
  const fd = openSync(reportFile, "w");
  let result;
  try {
    result = spawnSync(process.execPath, [...MOVEMENT_NODE_ARGS, fileURLToPath(MOVEMENT_SCRIPT_URL), "--root", dir, "--base", MOVEMENT_BASE], {
      cwd: dir, env: cleanEnv(), encoding: "utf8", timeout: MOVEMENT_TIMEOUT_MS, maxBuffer: MOVEMENT_MAX_BYTES, stdio: ["ignore", fd, "pipe"],
    });
  } finally { closeSync(fd); }
  return { ...result, stdout: readFileSync(reportFile, "utf8") };
}

export function makeLedgerBranch(dir, { trunk = false, large = false } = {}) {
  const fixture = ledgerRepo(dir);
  const { git, writeLedger, commit } = fixture;
  const init = git("init", "-q", "-b", trunk ? "trunk" : "main");
  if (init.status !== 0) throw new Error(init.stderr);
  writeLedger(ledgerText());
  commit("base ledger");
  if (!trunk) {
    const branch = git("checkout", "-q", "-b", "feat/x");
    if (branch.status !== 0) throw new Error(branch.stderr);
    // chosen: the must-meet's 3,000-row lift fixture, assembled and written in one pass.
    const added = large
      ? Array.from({ length: 3_000 }, (_, i) => `| R-${1000 + i} | Added row ${i}. | untested | — |\n`).join("")
      : "| R-002 | Row two. | untested | — |\n";
    writeLedger(ledgerText("| R-001 | Row one. | untested | — |\n" + added));
    commit("lane ledger");
  }
  return fixture;
}

// Moved from requirements-moved.test.mjs: its merge-base and row-change fixture stays exact.
export function makeMovementRepo(dir) {
  const fixture = ledgerRepo(dir);
  const { git, writeLedger, commit } = fixture;
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
  const mainAfter = c1.replace("| R-005 | Row five. | untested | — |", "| R-005 | Row five. | untested | — |\n| R-007 | Row seven. | untested | — |");
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
  return fixture;
}
