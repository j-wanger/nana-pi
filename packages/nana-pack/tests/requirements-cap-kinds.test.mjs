/**
 * @module packages/nana-pack/tests/requirements-cap-kinds.test.mjs
 * @purpose Pin capability field parsing, validation, lift preservation, outline rendering and historical compatibility.
 * @inputs scripts/requirements-tree.mjs, scripts/requirements-lift.mjs, git history, and ledger fixtures built under the OS temp directory.
 * @outputs Seven PASS/FAIL lines and a non-zero exit when any check fails.
 * @effects disk (creates ledger fixtures under the OS temp directory), process (spawns the lift and read-only git commands)
 * @errors A failed check prints its reason and exits non-zero.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { applyMapping, buildIdentityMapping, loadSeed } from "../../../scripts/requirements-lift.mjs";
import { checkOutlineFields, checkTree, parseLedger, renderOutline } from "../../../scripts/requirements-tree.mjs";

let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const LIFT = join(REPO_ROOT, "scripts/requirements-lift.mjs");
const scratch = tmpDir(join(tmpdir(), "requirements-cap-kinds-"));
let fixtureNumber = 0;

function fixtureLedger(text, { crlf = false, finalNewline = true } = {}) {
  fixtureNumber++;
  const dir = join(scratch, `fixture-${fixtureNumber}`);
  mkdirSync(dir, { recursive: true });
  let bytes = text.replace(/\n$/, "");
  if (crlf) bytes = bytes.replace(/\n/g, "\r\n");
  if (finalNewline) bytes += crlf ? "\r\n" : "\n";
  writeFileSync(join(dir, "REQUIREMENTS.md"), bytes);
  return { dir, text: readFileSync(join(dir, "REQUIREMENTS.md"), "utf8") };
}

const row = (id, status = "untested") => ({ id, status });
function ledger(capabilities) {
  const lines = [];
  for (const capability of capabilities) {
    lines.push(`# ${capability.id} · ${capability.label ?? capability.id}`, "Purpose: capability purpose", "Outcome: capability outcome");
    lines.push(...(capability.fields ?? []));
    for (const feature of capability.features ?? []) {
      lines.push("", `## ${feature.id} · ${feature.label ?? feature.id}`, "Purpose: feature purpose", `Status: ${feature.status ?? "active"}`);
      lines.push(...(feature.fields ?? []));
      if (feature.rows?.length) {
        lines.push("", "| ID | Requirement | Status | Evidence |", "|---|---|---|---|");
        for (const item of feature.rows) lines.push(`| ${item.id} | ${item.id} shall work. | ${item.status} | — |`);
      }
      for (const subgroup of feature.subgroups ?? []) {
        lines.push("", `### ${subgroup.id} · ${subgroup.label ?? subgroup.id}`, "Purpose: subgroup purpose", ...(subgroup.fields ?? []));
        if (subgroup.rows?.length) {
          lines.push("", "| ID | Requirement | Status | Evidence |", "|---|---|---|---|");
          for (const item of subgroup.rows) lines.push(`| ${item.id} | ${item.id} shall work. | ${item.status} | — |`);
        }
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

function acceptedFixture() {
  return ledger([
    { id: "CAP-01", label: "Build", fields: ["Kind: product", "Deliverables: R-001, R-002"], features: [
      { id: "FEAT-001", rows: [row("R-001")], subgroups: [{ id: "SUB-001", rows: [row("R-002", "planned")] }] },
    ] },
    { id: "CAP-02", label: "Use", fields: ["Kind: product", "Needs: CAP-01", "Deliverables: R-003"], features: [{ id: "FEAT-002", rows: [row("R-003")] }] },
    { id: "CAP-03", label: "Secure", fields: ["Kind: constraint", "Binds: CAP-01, CAP-02"], features: [{ id: "FEAT-003", rows: [row("R-004")] }] },
    { id: "CAP-04", label: "Old", fields: ["Kind: product", "Retired: CAP-01, CAP-02"], features: [{ id: "FEAT-004", status: "retired (CAP-01)" }] },
  ]);
}

const liftFixture = fixtureLedger(acceptedFixture());
const liftRun = spawnSync(process.execPath, [LIFT, "--root", liftFixture.dir], { cwd: REPO_ROOT, encoding: "utf8", timeout: 120_000 });
const liftInput = liftFixture.text;
const lifted = applyMapping(liftInput, buildIdentityMapping(liftInput), loadSeed(REPO_ROOT));
const expectedFieldOwners = new Map();
for (const heading of parseLedger(liftInput).headings.filter((item) => item.id.startsWith("CAP-"))) {
  const end = parseLedger(liftInput).allHeadings.find((item) => item.line > heading.line)?.line ?? Number.MAX_SAFE_INTEGER;
  expectedFieldOwners.set(heading.id, liftInput.split(/\r?\n/).slice(heading.line, end - 1).filter((line) => /^(?:Kind|Needs|Binds|Deliverables|Retired):/.test(line)));
}
const liftedParsed = parseLedger(lifted);
const fieldsKept = [...expectedFieldOwners].every(([id, expected]) => {
  const heading = liftedParsed.headings.find((item) => item.id === id);
  const next = liftedParsed.allHeadings.find((item) => item.line > heading.line)?.line ?? Number.MAX_SAFE_INTEGER;
  const actual = lifted.split(/\r?\n/).slice(heading.line, next - 1).filter((line) => /^(?:Kind|Needs|Binds|Deliverables|Retired):/.test(line));
  return JSON.stringify(actual) === JSON.stringify(expected);
});
// req: R-2440
check("R-2440: a ledger carrying every capability field lifts with a clean proof and keeps each field line under its capability", liftRun.status === 0 && /lift proof: .*tree check 0 problems/.test(liftRun.stdout) && checkTree(liftInput).problems.length === 0 && fieldsKept, `status=${liftRun.status}\nstdout=${liftRun.stdout}\nstderr=${liftRun.stderr}\nproblems=${checkTree(liftInput).problems.join("; ")}`);

const kindGood = fixtureLedger(ledger([
  { id: "CAP-01", fields: ["Kind: product   \t"], features: [{ id: "FEAT-001", rows: [row("R-001")] }] },
  { id: "CAP-02", fields: ["Kind: constraint", "Binds: CAP-01"], features: [{ id: "FEAT-002", rows: [row("R-002")] }] },
  { id: "CAP-03", fields: ["Needs: a database", "Binds: prose", "Deliverables: prose"], features: [{ id: "FEAT-003", fields: ["Kind: Products", "Needs: CAP-99"], rows: [row("R-003")], subgroups: [{ id: "SUB-003", fields: ["Retired: CAP-99"], rows: [row("R-004")] }] }] },
]), { crlf: true, finalNewline: false }).text;
const badKindText = fixtureLedger(ledger([{ id: "CAP-01", fields: ["Kind: Products"], features: [{ id: "FEAT-001", rows: [row("R-001")] }] }])).text;
const duplicateText = fixtureLedger(ledger([{ id: "CAP-01", fields: ["Kind: product", "Kind: constraint", "Deliverables: R-001", "Deliverables: R-001", "Needs: CAP-02", "Needs: CAP-02", "Binds: CAP-02", "Binds: CAP-02", "Retired: CAP-02", "Retired: CAP-02"], features: [{ id: "FEAT-001", rows: [row("R-001")] }] }, { id: "CAP-02", features: [{ id: "FEAT-002", rows: [row("R-002")] }] }])).text;
const badKindProblems = checkTree(badKindText).problems;
const duplicateProblems = checkTree(duplicateText).problems;
const duplicateLabels = ["Kind:", "Deliverables:", "Needs:", "Binds:", "Retired:"];
// req: R-2441
check("R-2441: a bad Kind value or a duplicate capability field line is a problem naming the capability and line, and the two kinds and prose lines pass", checkTree(kindGood).problems.length === 0 && badKindProblems.some((problem) => /line \d+: CAP-01 .*Kind:.*Products/.test(problem)) && duplicateLabels.every((label) => duplicateProblems.some((problem) => problem.includes("CAP-01") && problem.includes("line ") && problem.includes(label) && problem.includes("duplicate field line"))), `good=${checkTree(kindGood).problems.join("; ")}\nbad=${badKindProblems.join("; ")}\nduplicates=${duplicateProblems.join("; ")}`);

const deliverablesGood = fixtureLedger(acceptedFixture()).text;
const deliverablesBad = fixtureLedger(ledger([
  { id: "CAP-01", fields: ["Kind: product", "Deliverables: R-999, FEAT-001, R-001–R-002, R-005, R-003, R-001, R-001"], features: [{ id: "FEAT-001", rows: [row("R-001"), row("R-005", "retired")], subgroups: [{ id: "SUB-001", rows: [row("R-002", "planned")] }] }] },
  { id: "CAP-02", fields: ["Kind: product"], features: [{ id: "FEAT-002", rows: [row("R-003")] }] },
  { id: "CAP-03", fields: ["Kind: constraint", "Binds: CAP-01", "Deliverables: R-004"], features: [{ id: "FEAT-003", rows: [row("R-004")] }] },
])).text;
const deliverableProblems = checkTree(deliverablesBad).problems;
const deliverableDetails = ["R-999 does not name a requirement row", "FEAT-001 does not name a requirement row", "R-001–R-002 does not name a requirement row", "R-005 is retired", "R-003 is homed under another capability"];
// req: R-2442
check("R-2442: each deliverable must be a live row homed under its own capability, and an untested or planned deliverable is no problem", checkTree(deliverablesGood).problems.length === 0 && deliverableDetails.every((detail) => deliverableProblems.some((problem) => problem.includes("CAP-01") && problem.includes("Deliverables:") && problem.endsWith(detail))) && deliverableProblems.some((problem) => problem.includes("CAP-01") && problem.endsWith("R-001 is listed more than once")) && deliverableProblems.some((problem) => problem.includes("CAP-03") && problem.includes("Deliverables:")), deliverableProblems.join("; "));

function bindsCase(capabilityFields, targetFields = ["Kind: product"], extraTarget = "") {
  return fixtureLedger(ledger([
    { id: "CAP-01", fields: targetFields, features: [{ id: "FEAT-001", rows: [row("R-001")] }] },
    { id: "CAP-02", fields: ["Kind: product"], features: [{ id: "FEAT-002", rows: [row("R-002")] }] },
    { id: "CAP-03", fields: capabilityFields, features: [{ id: "FEAT-003", rows: [row("R-003")] }] },
    ...(extraTarget ? [{ id: "CAP-04", fields: extraTarget, features: [{ id: "FEAT-004", status: extraTarget.some((field) => field.startsWith("Retired:")) ? "retired (CAP-01)" : "active", rows: extraTarget.some((field) => field.startsWith("Retired:")) ? [] : [row("R-004")] }] }] : []),
  ])).text;
}
const bindsCases = [
  ["missing", bindsCase(["Kind: constraint"])],
  ["all", bindsCase(["Kind: constraint", "Binds: all"])],
  ["constraint target", bindsCase(["Kind: constraint", "Binds: CAP-01"], ["Kind: constraint", "Binds: CAP-02"])],
  ["kindless target", bindsCase(["Kind: constraint", "Binds: CAP-01"], [])],
  ["retired target", bindsCase(["Kind: constraint", "Binds: CAP-04"], ["Kind: product"], ["Kind: product", "Retired: CAP-01"])],
  ["empty", bindsCase(["Kind: constraint", "Binds:"])],
  ["product carries Binds", bindsCase(["Kind: product", "Binds: CAP-01"])],
];
const bindsFailures = bindsCases.map(([name, text]) => [name, checkTree(text).problems]);
const bindsValidOne = checkTree(bindsCase(["Kind: constraint", "Binds: CAP-01"])).problems;
const bindsValidTwo = checkTree(bindsCase(["Kind: constraint", "Binds: CAP-01, CAP-02"])).problems;
// req: R-2443
check("R-2443: a constraint capability must bind only live product capabilities, and a product capability may not carry Binds", bindsValidOne.length === 0 && bindsValidTwo.length === 0 && bindsFailures.every(([, problems]) => problems.some((problem) => problem.includes("CAP-03") && problem.includes("Binds:"))), `valid-one=${bindsValidOne.join("; ")} valid-two=${bindsValidTwo.join("; ")}\n${bindsFailures.map(([name, problems]) => `${name}: ${problems.join("; ")}`).join("\n")}`);

function needsCase(capabilityId, value, fieldsById = {}) {
  const caps = ["CAP-01", "CAP-02", "CAP-03", "CAP-04", "CAP-05"].map((id, index) => ({
    id,
    fields: fieldsById[id] ?? (id === "CAP-03" ? ["Kind: constraint", "Binds: CAP-01"] : id === "CAP-04" ? [] : id === "CAP-05" ? ["Kind: product", "Retired: CAP-01"] : ["Kind: product"]),
    features: [{ id: `FEAT-00${index + 1}`, status: id === "CAP-05" ? "retired (CAP-01)" : "active", rows: id === "CAP-05" ? [] : [row(`R-00${index + 1}`)] }],
  }));
  caps.find((capability) => capability.id === capabilityId).fields.push(`Needs: ${value}`);
  return fixtureLedger(ledger(caps)).text;
}
const needsCases = [
  ["later", needsCase("CAP-01", "CAP-02")],
  ["itself", needsCase("CAP-02", "CAP-02")],
  ["constraint target", needsCase("CAP-02", "CAP-03")],
  ["kindless target", needsCase("CAP-02", "CAP-04")],
  ["retired target", needsCase("CAP-02", "CAP-05")],
  ["constraint carries Needs", needsCase("CAP-03", "CAP-01")],
];
const needsFailures = needsCases.map(([name, text]) => [name, checkTree(text).problems]);
const needsValid = checkTree(needsCase("CAP-02", "CAP-01")).problems;
// req: R-2444
check("R-2444: a stage may need only earlier live product capabilities, so no Needs cycle can form", needsValid.length === 0 && needsFailures.every(([, problems]) => problems.some((problem) => problem.includes("Needs:") && problem.includes("CAP-"))), `valid=${needsValid.join("; ")}\n${needsFailures.map(([name, problems]) => `${name}: ${problems.join("; ")}`).join("\n")}`);

function retiredCase(retiredFields, featureStatus = "retired (CAP-01)") {
  return fixtureLedger(ledger([
    { id: "CAP-01", fields: ["Kind: product"], features: [{ id: "FEAT-001", rows: [row("R-001")] }] },
    { id: "CAP-02", fields: ["Kind: product"], features: [{ id: "FEAT-002", rows: [row("R-002")] }] },
    { id: "CAP-03", fields: ["Kind: product", "Retired: CAP-01"], features: [{ id: "FEAT-003", status: "retired (CAP-01)" }] },
    { id: "CAP-04", fields: retiredFields, features: [{ id: "FEAT-004", status: featureStatus, rows: featureStatus === "active" ? [row("R-004")] : [] }] },
  ])).text;
}
const retiredCases = [
  ["missing successor", retiredCase(["Kind: product", "Retired: CAP-99"])],
  ["itself", retiredCase(["Kind: product", "Retired: CAP-04"])],
  ["retired successor", retiredCase(["Kind: product", "Retired: CAP-03"])],
  ["empty", retiredCase(["Kind: product", "Retired:"])],
  ["stage field", retiredCase(["Kind: product", "Retired: CAP-01", "Needs: CAP-01"])],
  ["live feature", retiredCase(["Kind: product", "Retired: CAP-01"], "active")],
];
const retiredFailures = retiredCases.map(([name, text]) => [name, checkTree(text).problems]);
const retiredValid = checkTree(retiredCase(["Kind: product", "Retired: CAP-01, CAP-02"])).problems;
// req: R-2445
check("R-2445: a retired capability names live successors, carries no stage fields and holds only retired features", retiredValid.length === 0 && retiredFailures.every(([, problems]) => problems.some((problem) => problem.includes("CAP-04") && problem.includes("Retired:"))), `valid=${retiredValid.join("; ")}\n${retiredFailures.map(([name, problems]) => `${name}: ${problems.join("; ")}`).join("\n")}`);

const outlineText = fixtureLedger(acceptedFixture()).text;
const outlineParsed = parseLedger(outlineText);
const outline = renderOutline(outlineParsed);
const outlineLines = outline.split("\n");
const expectedOutlineFields = [
  ["CAP-01", ["Kind: product", "Deliverables: R-001, R-002"]],
  ["CAP-02", ["Kind: product", "Needs: CAP-01", "Deliverables: R-003"]],
  ["CAP-03", ["Kind: constraint", "Binds: CAP-01, CAP-02"]],
  ["CAP-04", ["Kind: product", "Retired: CAP-01, CAP-02"]],
];
const outlineOrdered = expectedOutlineFields.every(([id, expected]) => {
  const title = outlineLines.findIndex((line) => line.startsWith(`- **${id} · `));
  const parent = outlineLines.findIndex((line, index) => index > title && line.startsWith("  Parent:"));
  return expected.every((value, index) => outlineLines[parent + index + 1] === `  ${value}`);
});
const needsLine = "  Needs: CAP-01";
const droppedProblems = checkOutlineFields(outline.replace(`${needsLine}\n`, ""), outlineParsed);
const alteredProblems = checkOutlineFields(outline.replace(needsLine, "  Needs: CAP-99"), outlineParsed);
const revisions = ["c4332ecb", "4b3846ec", "5548d4c2"];
const historical = revisions.map((revision) => {
  const ledgerShow = spawnSync("git", ["show", `${revision}:REQUIREMENTS.md`], { cwd: REPO_ROOT, encoding: "utf8" });
  const outlineShow = spawnSync("git", ["show", `${revision}:docs/requirements-tree.md`], { cwd: REPO_ROOT, encoding: "utf8" });
  return { revision, ok: ledgerShow.status === 0 && outlineShow.status === 0 && renderOutline(parseLedger(ledgerShow.stdout)) === outlineShow.stdout, ledgerStatus: ledgerShow.status, outlineStatus: outlineShow.status };
});
// req: R-2446
check("R-2446: the outline lists each read capability field after the Parent line, and historical outlines render unchanged", outlineOrdered && droppedProblems.some((problem) => problem.includes("CAP-02") && problem.includes("Needs:")) && alteredProblems.some((problem) => problem.includes("CAP-02") && problem.includes("Needs:")) && historical.every((item) => item.ok), `ordered=${outlineOrdered}\ndropped=${droppedProblems.join("; ")}\naltered=${alteredProblems.join("; ")}\nhistorical=${JSON.stringify(historical)}`);

if (fails > 0) { console.log(`${fails} check(s) failed`); process.exit(1); }
console.log("all 7 checks passed");
