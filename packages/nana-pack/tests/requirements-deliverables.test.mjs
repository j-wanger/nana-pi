/**
 * @module packages/nana-pack/tests/requirements-deliverables.test.mjs
 * @purpose Pin deliverable claims, artifact registry entries, cross-feature reads, built-from ties and HEAD-tree path checks.
 * @inputs scripts/deliverables.mjs, scripts/requirements-tree.mjs, and temporary git repositories.
 * @outputs PASS/FAIL lines and a non-zero exit when a deliverable contract fails.
 * @effects disk (creates fixtures under the OS temp directory), process (runs git and the tree checker)
 * @errors A failed check prints its reason and exits non-zero.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { parseLedger } from "../../../scripts/requirements-tree.mjs";
import * as deliverablesModule from "../../../scripts/deliverables.mjs";
import * as productReportModule from "../../../scripts/product-report.mjs";
import { DATA_SUBPATH } from "../lib/runtime-map-config.mjs";
import { STORE_SUBPATH } from "../lib/suite-records-config.mjs";
import { BUILD_RECORDS_SUBPATH } from "../lib/build-records-config.mjs";
import {
  DELIVERABLE_FIELD_LABELS,
  MAKER_RUNS,
  PARKED_LABEL,
  PARKED_SINCE,
  PART_SEPARATOR,
  PATH_REQUIRED,
  READER_KINDS,
  REASON_REQUIRED,
  ARTIFACT_CLASSES,
  ARTIFACT_ID_PATTERN,
  ARTIFACT_LOCATION_SHAPES,
  artifactRegistry,
  checkDeliverables,
  deliverableClaims,
  deliverableFieldLinesByRow,
  deliverableReportLines,
} from "../../../scripts/deliverables.mjs";

let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };
const CLI = fileURLToPath(new URL("../../../scripts/requirements-tree.mjs", import.meta.url));
const LIMIT = 10_000;
const cleanEnv = () => {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^GIT_/.test(key)) delete env[key];
  return env;
};
const env = cleanEnv();
const run = (cwd, command, args) => spawnSync(command, args, { cwd, encoding: "utf8", env, timeout: LIMIT });
const git = (cwd, ...args) => run(cwd, "git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", ...args]);
const notesFor = (text, tracked = ["scripts/make.mjs", "docs/x.md"]) => checkDeliverables(parseLedger(text), tracked).notes;
const tree = (capabilityLines, featureLines = "", ending = "\n") => `# CAP-01 · Product\nPurpose: product\nOutcome: artifact exists\nKind: product\nDeliverables: R-001\n${capabilityLines}\n\n## FEAT-001 · Feature\nPurpose: feature\nStatus: active\n${featureLines}\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | The artifact shall exist. | untested | — |${ending}`;

const registryTree = (artifactLines, claimLines = "Made by: R-001 · manual: owner\nRead by: R-001 · person: owner", { kind = "product", status = "active", subgroup = "", ending = "\n" } = {}) => `# CAP-01 · Product
Purpose: product
Outcome: artifact exists
Kind: ${kind}
Deliverables: R-001
${claimLines}

## FEAT-001 · Feature
Purpose: feature
Status: ${status}
${artifactLines}
${subgroup}| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R-001 | The artifact shall exist. | untested | — |${ending}`;

const artifactPlacementFailures = [];
const validArtifact = "Artifact: A-001 · output · tracked: docs/x.md · manual: owner";
const validRegistry = artifactRegistry(parseLedger(registryTree(validArtifact)), ["docs/x.md"]);
if (validRegistry.byId.get("A-001")?.name !== "output" || validRegistry.notes.length !== 0) artifactPlacementFailures.push(`valid: ${validRegistry.notes.join(" | ")}`);
for (const [label, text, fragment] of [
  ["reused", registryTree(`${validArtifact}\nArtifact: A-001 · other · tracked: docs/y.md · manual: owner`), "reused"],
  ["malformed", registryTree("Artifact: A-002 · broken"), "malformed"],
  ["capability", registryTree(validArtifact).replace(`${validArtifact}\n`, "").replace("Deliverables: R-001\n", `Deliverables: R-001\n${validArtifact}\n`), "feature span"],
  ["subgroup", registryTree("", undefined, { subgroup: `### SUB-001 · Sub\nPurpose: sub\n${validArtifact}\n` }), "feature span"],
  ["proposed", registryTree(validArtifact, undefined, { status: "proposed" }), "proposed or retired"],
  ["retired", registryTree(validArtifact, undefined, { status: "retired (FEAT-002)" }), "proposed or retired"],
]) {
  const report = artifactRegistry(parseLedger(text), ["docs/x.md", "docs/y.md"]);
  if (report.notes.length !== 1 || !report.notes[0].includes(fragment)) artifactPlacementFailures.push(`${label}: ${report.notes.join(" | ")}`);
}
const kindlessRegistry = artifactRegistry(parseLedger(registryTree("Artifact: broken", undefined, { kind: "" }).replace("Kind: \n", "")), []);
if (kindlessRegistry.notes.length !== 0 || kindlessRegistry.byId.size !== 0) artifactPlacementFailures.push(`kindless: ${kindlessRegistry.notes.join(" | ")}`);
for (const text of [registryTree(`${validArtifact}  \t`), registryTree(validArtifact).replaceAll("\n", "\r\n"), registryTree(validArtifact, undefined, { ending: "" })]) {
  const report = artifactRegistry(parseLedger(text), ["docs/x.md"]);
  if (report.notes.length !== 0 || !report.byId.has("A-001")) artifactPlacementFailures.push(`line endings: ${report.notes.join(" | ")}`);
}
// req: R-2780
check("R-2780: an artifact line is read by its ID, and a reused ID, a malformed or misplaced line, or a live entry in a proposed or retired feature gets one note", artifactPlacementFailures.length === 0, artifactPlacementFailures.join("\n"));

const artifactShapeFailures = [];
for (const [label, line] of [
  ["unknown", "Artifact: A-001 · output · mystery: docs/x.md · manual: owner"],
  ["home", "Artifact: A-001 · output · user-home store: docs/x.md · manual: owner"],
  ["CI", "Artifact: A-001 · output · CI record: docs/new.md · manual: owner"],
  ["ref", "Artifact: A-001 · output · git ref: docs/x · manual: owner"],
  ["backslash", "Artifact: A-001 · output · tracked: docs\\x.md · manual: owner"],
  ["first wildcard", "Artifact: A-001 · output · tracked: */x.md · manual: owner"],
]) {
  const report = artifactRegistry(parseLedger(registryTree(line)), ["docs/x.md"]);
  if (report.notes.length !== 1 || !report.notes[0].includes("A-001")) artifactShapeFailures.push(`${label}: ${report.notes.join(" | ")}`);
}
const shapesPinned = Object.isFrozen(ARTIFACT_CLASSES)
  && JSON.stringify(ARTIFACT_CLASSES) === JSON.stringify(["tracked", "clone store", "user-home store", "other project", "git ref", "CI record"])
  && ARTIFACT_ID_PATTERN.source === "^A-(?:00[1-9]|0[1-9][0-9]|[1-9][0-9]{2})$"
  && Object.isFrozen(ARTIFACT_LOCATION_SHAPES)
  && JSON.stringify(ARTIFACT_LOCATION_SHAPES) === JSON.stringify({
    tracked: "repo-relative tracked path, folder or single-segment-* glob",
    "clone store": "<git common dir>/<path>",
    "user-home store": "~/<path> or <pi agent dir>/<path>",
    "other project": "<project>/<path>",
    "git ref": "refs/heads/<name> or refs/tags/<prefix>",
    "CI record": "ci: .github/workflows/<workflow>.yml#<name-without-slash>",
  });
if (!shapesPinned) artifactShapeFailures.push("sealed artifact classes, ID pattern or location shapes differ");
// req: R-2781
check("R-2781: an unknown class or a location of the wrong shape for its class gets one note", artifactShapeFailures.length === 0, artifactShapeFailures.join("\n"));

const artifactValidityFailures = [];
for (const [label, lines, tracked, fragment] of [
  ["missing tracked", "Artifact: A-001 · output · tracked: docs/new.md · manual: owner", ["docs/x.md"], "docs/new.md"],
  ["untracked writer", "Artifact: A-001 · output · user-home store: ~/output · suite: scripts/new.mjs", ["scripts/make.mjs"], "scripts/new.mjs"],
  ["folder writer", "Artifact: A-001 · output · user-home store: ~/output · suite: scripts", ["scripts/make.mjs"], "scripts"],
  ["reasonless", "Artifact: A-001 · output · user-home store: ~/output · manual:", [], "reason"],
  ["duplicate location", "Artifact: A-001 · first · user-home store: ~/output · manual: owner\nArtifact: A-002 · second · user-home store: ~/output · manual: owner", [], "A-002"],
  ["single-segment glob", "Artifact: A-001 · output · tracked: docs/reviews/*/x.txt · manual: owner", ["docs/reviews/a/b/x.txt"], "docs/reviews/*/x.txt"],
]) {
  const report = artifactRegistry(parseLedger(registryTree(lines)), tracked);
  if (report.notes.length !== 1 || !report.notes[0].includes(fragment)) artifactValidityFailures.push(`${label}: ${report.notes.join(" | ")}`);
}
// req: R-2782
check("R-2782: a tracked entry matching nothing, an untracked or non-file writer, a reasonless manual entry, or a second entry at the same location gets one note", artifactValidityFailures.length === 0, artifactValidityFailures.join("\n"));

const bindingFailures = [];
const bindingEntries = [
  "Artifact: A-001 · manual input · user-home store: ~/input · manual: owner",
  "Read by: A-001 · person: owner",
  "Artifact: A-002 · handoff · user-home store: ~/.pi/agent/handoffs/ · extension: packages/nana-pack/extensions/nana-handoff.ts",
  "Read by: A-002 · person: owner",
  "Artifact: A-033 · suite records · clone store: <git common dir>/nana/suite-runs · suite: packages/nana-pack/lib/suite-records.mjs",
  "Read by: A-033 · person: owner",
].join("\n");
const bindingTracked = ["packages/nana-pack/extensions/nana-handoff.ts", "packages/nana-pack/lib/suite-records.mjs", "scripts/test.mjs"];
for (const [label, maker, wanted, unwanted] of [
  ["run mismatch", "Made by: R-001 · manual: owner · A-002", "run", null],
  ["missing writer", "Made by: R-001 · suite: scripts/test.mjs · A-033", "packages/nana-pack/lib/suite-records.mjs", null],
  ["built from ignores binding", "Made by: R-001 · session start: scripts/test.mjs · built from: A-001", null, "deliverable note:"],
  ["missing reference", "Made by: R-001 · manual: owner · A-999", "A-999", null],
  ["missing built from", "Made by: R-001 · manual: owner · built from: A-999", "A-999", null],
  ["valid home", "Made by: R-001 · extension: packages/nana-pack/extensions/nana-handoff.ts · A-002", null, "not tracked at HEAD"],
]) {
  const text = registryTree(bindingEntries, `${maker}\nRead by: R-001 · person: owner`);
  const report = checkDeliverables(parseLedger(text), bindingTracked);
  if (wanted && (report.notes.length !== 1 || !report.notes[0].includes(wanted))) bindingFailures.push(`${label}: ${report.notes.join(" | ")}`);
  if (!wanted && report.notes.some((entry) => !unwanted || entry.includes(unwanted))) bindingFailures.push(`${label}: ${report.notes.join(" | ")}`);
}
const multipleWriterEntry = "Artifact: A-034 · shared output · clone store: <git common dir>/nana/shared · suite: scripts/make.mjs, scripts/also-make.mjs\nRead by: A-034 · person: owner";
for (const [label, writerPaths, expectedMissing] of [
  ["one of two writers", "scripts/make.mjs", "scripts/also-make.mjs"],
  ["both writers", "scripts/make.mjs, scripts/also-make.mjs", null],
]) {
  const text = registryTree(multipleWriterEntry, `Made by: R-001 · suite: ${writerPaths} · A-034\nRead by: R-001 · person: owner`);
  const notes = checkDeliverables(parseLedger(text), ["scripts/make.mjs", "scripts/also-make.mjs"]).notes;
  if (expectedMissing && (notes.length !== 1 || !notes[0].includes(expectedMissing))) bindingFailures.push(`${label}: ${notes.join(" | ")}`);
  if (!expectedMissing && notes.length) bindingFailures.push(`${label}: ${notes.join(" | ")}`);
}
// req: R-2783
check("R-2783: a registry reference binds the claim's run and every writer, a built-from list needs only live entries, and a valid home reference gets no not-tracked note", bindingFailures.length === 0, bindingFailures.join("\n"));

const readsLedger = ({ reads = "Reads: A-001 · scripts/read.mjs", kind = "product", status = "active", placement = "reader", ending = "\n" } = {}) => `# CAP-01 · Product
Purpose: product
Outcome: artifact exists
${kind ? `Kind: ${kind}\n` : ""}${placement === "capability" ? `${reads}\n` : ""}
## FEAT-001 · Maker
Purpose: maker
Status: active
Artifact: A-001 · output · user-home store: ~/output · manual: owner
${placement === "maker" ? `${reads}\n` : ""}
## FEAT-002 · Reader
Purpose: reader
Status: ${status}
${placement === "reader" ? `${reads}\n` : ""}${placement === "subgroup" ? `### SUB-001 · Subgroup\nPurpose: subgroup\n${reads}\n` : ""}| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R-001 | The reader shall work. | untested | — |${ending}`;
const readsFailures = [];
const parsedReads = (text, tracked = ["scripts/read.mjs", "scripts/other.mjs"]) => deliverablesModule.artifactReads?.(parseLedger(text), tracked) ?? { notes: ["missing artifactReads export"], reads: [], byFeature: new Map(), fieldLineCount: 0, needsTrackedPaths: false };
const expectReadsNote = (label, options, fragment) => {
  const report = parsedReads(readsLedger(options));
  if (report.notes.length !== 1 || !report.notes[0].includes(fragment)) readsFailures.push(`${label}: ${report.notes.join(" | ")}`);
};
const validReads = parsedReads(readsLedger({ reads: "Reads: A-001 · scripts/read.mjs, scripts/other.mjs" }));
if (validReads.notes.length || validReads.reads.length !== 1 || validReads.reads[0]?.id !== "A-001" || validReads.byFeature.get("FEAT-002")?.[0]?.readers.join(",") !== "scripts/read.mjs,scripts/other.mjs") readsFailures.push(`valid: ${JSON.stringify(validReads)}`);
for (const text of [
  readsLedger({ reads: "Reads: A-001 · scripts/read.mjs  \t" }),
  readsLedger().replaceAll("\n", "\r\n"),
  readsLedger({ ending: "" }),
]) {
  const report = parsedReads(text);
  if (report.notes.length !== 0 || report.reads.length !== 1) readsFailures.push(`line endings: ${report.notes.join(" | ")}`);
}
const retiredEntryLedger = readsLedger().replace(
  "## FEAT-002 · Reader",
  "## FEAT-003 · Retired entry\nPurpose: retired entry\nStatus: retired (FEAT-004)\nArtifact: A-002 · retired output · retired: replaced by A-003\n\n## FEAT-002 · Reader",
).replace("Reads: A-001 · scripts/read.mjs", "Reads: A-002 · scripts/read.mjs");
const retiredEntryNotes = parsedReads(retiredEntryLedger).notes;
if (retiredEntryNotes.length !== 1 || !retiredEntryNotes[0].includes("A-002") || !retiredEntryNotes[0].includes("no live entry")) readsFailures.push(`retired entry: ${retiredEntryNotes.join(" | ")}`);
for (const [label, options, fragment] of [
  ["parts", { reads: "Reads: A-001" }, "malformed"],
  ["id", { reads: "Reads: R-001 · scripts/read.mjs" }, "malformed"],
  ["empty reader", { reads: "Reads: A-001 · scripts/read.mjs, " }, "malformed"],
  ["unknown", { reads: "Reads: A-999 · scripts/read.mjs" }, "no live entry"],
  ["own", { placement: "maker" }, "same feature"],
  ["repeated", { reads: "Reads: A-001 · scripts/read.mjs\nReads: A-001 · scripts/other.mjs" }, "more than once"],
  ["untracked", { reads: "Reads: A-001 · scripts/missing.mjs" }, "not a tracked file"],
  ["folder", { reads: "Reads: A-001 · scripts/" }, "not a tracked file"],
  ["retired", { status: "retired (FEAT-003)" }, "proposed or retired"],
  ["capability", { placement: "capability" }, "outside a feature span"],
  ["subgroup", { placement: "subgroup" }, "outside a feature span"],
]) expectReadsNote(label, options, fragment);
const kindlessReads = parsedReads(readsLedger({ kind: "" }), []);
if (kindlessReads.notes.length || kindlessReads.reads.length || kindlessReads.fieldLineCount !== 0) readsFailures.push(`kindless: ${kindlessReads.notes.join(" | ")}`);
const reportOnlyReads = deliverableReportLines(parseLedger(readsLedger({ reads: "Reads: A-001 · scripts/missing.mjs" })), ".", () => ({ status: 0, stdout: Buffer.from("scripts/read.mjs\0"), stderr: Buffer.alloc(0) }));
if (reportOnlyReads.filter((line) => line.includes("scripts/missing.mjs") && line.includes("not a tracked file")).length !== 1) readsFailures.push(`shared report: ${reportOnlyReads.join(" | ")}`);
const readsOnlySwitch = registryTree("", "Made by: R-001 · manual: owner · docs/x.md\nRead by: R-001 · person: owner").replace("Status: active\n", "Status: active\nReads: A-999 · scripts/read.mjs\n");
const readsOnlyNotes = checkDeliverables(parseLedger(readsOnlySwitch), ["docs/x.md", "scripts/read.mjs"]).notes;
if (readsOnlyNotes.some((entry) => entry.includes("neither a registry reference")) || !readsOnlyNotes.some((entry) => entry.includes("A-999") && entry.includes("no live entry"))) readsFailures.push(`registry switching: ${readsOnlyNotes.join(" | ")}`);
if (deliverablesModule.READS_LABEL !== "Reads") readsFailures.push(`sealed Reads label differs: ${String(deliverablesModule.READS_LABEL)}`);
// req: R-2795
check("R-2795: a reads line names a live entry read by tracked files, and a malformed, unknown, own, repeated or misplaced line or an untracked reader gets one note", readsFailures.length === 0, readsFailures.join("\n"));

const builtFromLedger = ({ builtId = "A-002", reads = "", otherReads = "", ownId = "A-001", subgroup = false, duplicateClaim = false, direct = false, parked = false } = {}) => `# CAP-01 · Product
Purpose: product
Outcome: artifact exists
Kind: product
Deliverables: R-001
Made by: R-001 · manual: owner · ${direct ? builtId : `built from: ${builtId}`}
${duplicateClaim ? `Made by: R-001 · manual: owner · built from: ${builtId}\n` : ""}Read by: R-001 · person: owner
${parked ? "Parked: R-001 · since 2026-10-24: held\n" : ""}
## FEAT-001 · Home
Purpose: home
Status: active
Artifact: A-001 · home · user-home store: ~/home · manual: owner
${reads}${subgroup ? "### SUB-001 · Rows\nPurpose: rows\n" : ""}
| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R-001 | The deliverable shall exist. | untested | — |

## FEAT-002 · Other
Purpose: other
Status: active
Artifact: A-002 · other · user-home store: ~/other · manual: owner
${otherReads}`;
const builtFromFailures = [];
const builtFromNotes = (options) => checkDeliverables(parseLedger(builtFromLedger(options)), []).notes.filter((entry) => entry.includes("built-from entry"));
for (const [label, options, count] of [
  ["foreign missing", { parked: true }, 1],
  ["home entry", { builtId: "A-001" }, 0],
  ["read at home", { reads: "Reads: A-002 · scripts/read.mjs\n" }, 0],
  ["read elsewhere", { reads: "", otherReads: "Reads: A-002 · scripts/other-read.mjs\n", builtId: "A-002" }, 1],
  ["subgroup home", { builtId: "A-001", subgroup: true }, 0],
  ["duplicate claims", { duplicateClaim: true }, 1],
  ["direct reference", { direct: true }, 0],
]) {
  const notes = builtFromNotes(options);
  if (notes.length !== count || notes.some((entry) => !entry.includes("R-001") || !entry.includes(options.builtId ?? "A-002") || !entry.includes("FEAT-001"))) builtFromFailures.push(`${label}: ${notes.join(" | ")}`);
}
// req: R-2798
check("R-2798: each built-from entry is registered or read in the deliverable's home feature", builtFromFailures.length === 0, builtFromFailures.join("\n"));

const artifactConsumerLedger = ({ before = [], after = [], status = "active", kind = "product", second = [], capability = [] } = {}) => [
  "# CAP-01 · Product", "Purpose: product", "Outcome: artifacts are maintained", ...(kind ? [`Kind: ${kind}`] : []), ...capability, "",
  "## FEAT-001 · Maker", "Purpose: make artifacts", `Status: ${status}`, ...before,
  "Artifact: A-001 · output · user-home store: ~/output · manual: owner", ...after, "",
  "| ID | Requirement | Status | Evidence |", "|---|---|---|---|", "| R-001 | The output shall exist. | untested | — |", "",
  "## FEAT-002 · Reader", "Purpose: read artifacts", "Status: active", ...second, "",
  "| ID | Requirement | Status | Evidence |", "|---|---|---|---|", "| R-002 | The reader shall exist. | untested | — |",
].join("\n");

const artifactReaderFailures = [];
const artifactReaderNotes = (text, tracked = ["scripts/read.mjs", "scripts/other.mjs"]) => checkDeliverables(parseLedger(text), tracked).notes.filter((entry) => entry.includes("Read by:"));
for (const [label, text] of [
  ["two paths", artifactConsumerLedger({ after: ["Read by: A-001 · code: scripts/read.mjs, scripts/other.mjs"] })],
  ["above entry", artifactConsumerLedger({ before: ["Read by: A-001 · prompt: scripts/read.mjs"] })],
  ["frozen", artifactConsumerLedger({ status: "frozen (fixture)", after: ["Read by: A-001 · person: owner reads it"] })],
  ["second kind", artifactConsumerLedger({ after: ["Read by: A-001 · code: scripts/read.mjs", "Read by: A-001 · person: owner reads it"] })],
]) {
  const notes = artifactReaderNotes(text);
  if (notes.length) artifactReaderFailures.push(`${label}: ${notes.join(" | ")}`);
}
for (const [label, lines, fragment] of [
  ["parts", ["Read by: A-001"], "malformed"],
  ["row id", ["Read by: R-001 · code: scripts/read.mjs"], "malformed"],
  ["unknown kind", ["Read by: A-001 · daemon: because"], "unknown reader"],
  ["unknown entry", ["Read by: A-999 · code: scripts/read.mjs"], "no live entry"],
  ["untracked", ["Read by: A-001 · code: scripts/missing.mjs"], "not a tracked file"],
  ["folder", ["Read by: A-001 · code: scripts/"], "not a tracked file"],
  ["glob", ["Read by: A-001 · code: scripts/*.mjs"], "not a tracked file"],
  ["reasonless person", ["Read by: A-001 · person:"], "needs a reason"],
  ["reasonless runtime", ["Read by: A-001 · runtime:"], "needs a reason"],
  ["repeated", ["Read by: A-001 · code: scripts/read.mjs", "Read by: A-001 · code: scripts/other.mjs"], "more than once"],
]) {
  const notes = artifactReaderNotes(artifactConsumerLedger({ after: lines }));
  if (notes.length !== 1 || !notes[0].includes(fragment)) artifactReaderFailures.push(`${label}: ${notes.join(" | ")}`);
}
const capabilityArtifactReaderNotes = artifactReaderNotes(tree("Made by: R-001 · manual: owner\nRead by: R-001 · person: owner\nRead by: R-001 · person: capability reader"));
if (capabilityArtifactReaderNotes.some((entry) => entry.includes("malformed Read by:") || entry.includes("Read by: R-001 is"))) artifactReaderFailures.push(`capability reader parsed as artifact reader: ${capabilityArtifactReaderNotes.join(" | ")}`);
const foreignArtifactLedger = artifactConsumerLedger({ second: ["Artifact: A-002 · other · user-home store: ~/other · manual: owner"] });
const foreignArtifactNotes = artifactReaderNotes(foreignArtifactLedger.replace("Artifact: A-001 · output", "Read by: A-002 · code: scripts/read.mjs\nArtifact: A-001 · output"));
if (foreignArtifactNotes.length !== 1 || !foreignArtifactNotes[0].includes("another feature")) artifactReaderFailures.push(`foreign: ${foreignArtifactNotes.join(" | ")}`);
for (const [label, text, fragment] of [
  ["subgroup", artifactConsumerLedger({ second: ["### SUB-001 · Group", "Purpose: group", "Read by: A-001 · code: scripts/read.mjs"] }), "outside a feature span"],
  ["proposed", artifactConsumerLedger({ status: "proposed", after: ["Read by: A-001 · code: scripts/read.mjs"] }), "proposed or retired"],
  ["retired", artifactConsumerLedger({ status: "retired (FEAT-003)", after: ["Read by: A-001 · code: scripts/read.mjs"] }), "proposed or retired"],
]) {
  const notes = artifactReaderNotes(text);
  if (notes.length !== 1 || !notes[0].includes(fragment)) artifactReaderFailures.push(`${label}: ${notes.join(" | ")}`);
}
const kindlessArtifactReader = checkDeliverables(parseLedger(artifactConsumerLedger({ kind: "", after: ["Read by: A-001 · mystery"] })), []).notes;
if (kindlessArtifactReader.length) artifactReaderFailures.push(`kindless: ${kindlessArtifactReader.join(" | ")}`);
const artifactReaderLf = artifactReaderNotes(artifactConsumerLedger({ after: ["Read by: A-001 · code: scripts/missing.mjs  \t"] }));
const artifactReaderCrlf = artifactReaderNotes(artifactConsumerLedger({ after: ["Read by: A-001 · code: scripts/missing.mjs  \t"] }).replaceAll("\n", "\r\n"));
if (JSON.stringify(artifactReaderLf) !== JSON.stringify(artifactReaderCrlf)) artifactReaderFailures.push(`line endings: ${artifactReaderLf.join(" | ")} / ${artifactReaderCrlf.join(" | ")}`);
const registryNotesBefore = artifactRegistry(parseLedger(artifactConsumerLedger()), []).notes;
const registryNotesAfter = artifactRegistry(parseLedger(artifactConsumerLedger({ after: ["Read by: A-001 · code: scripts/missing.mjs"] })), []).notes;
const readsNotesBefore = parsedReads(artifactConsumerLedger()).notes;
const readsNotesAfter = parsedReads(artifactConsumerLedger({ after: ["Read by: A-001 · code: scripts/missing.mjs"] })).notes;
if (JSON.stringify(registryNotesBefore) !== JSON.stringify(registryNotesAfter) || JSON.stringify(readsNotesBefore) !== JSON.stringify(readsNotesAfter)) artifactReaderFailures.push("artifactRegistry or artifactReads notes changed");
const reportOnlyArtifactReader = deliverableReportLines(parseLedger(artifactConsumerLedger({ after: ["Read by: A-001 · code: scripts/missing.mjs"] })), ".", () => ({ status: 0, stdout: Buffer.from("scripts/read.mjs\0"), stderr: Buffer.alloc(0) }));
if (!reportOnlyArtifactReader.some((line) => line.includes("scripts/missing.mjs") && line.includes("not a tracked file"))) artifactReaderFailures.push(`shared report: ${reportOnlyArtifactReader.join(" | ")}`);
const capabilityOnlyMisplaced = `# CAP-01 · Product\nPurpose: product\nOutcome: output\nKind: product\n\n## FEAT-001 · Feature\nPurpose: feature\nStatus: active\nRead by: A-001 · code: scripts/read.mjs\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | Output exists. | untested | — |`;
const misplacedReport = checkDeliverables(parseLedger(capabilityOnlyMisplaced), ["scripts/read.mjs"]);
const misplacedLines = deliverableReportLines(parseLedger(capabilityOnlyMisplaced), ".", () => ({ status: 0, stdout: Buffer.from("scripts/read.mjs\0"), stderr: Buffer.alloc(0) }));
if (misplacedReport.fieldLineCount !== 1 || !misplacedLines.some((line) => line.includes("A-001") && line.includes("no live entry"))) artifactReaderFailures.push(`misplaced field line: count=${misplacedReport.fieldLineCount}; ${misplacedLines.join(" | ")}`);
// req: R-2830
check("R-2830: an artifact Read by line reads its own feature's entry, and a malformed, foreign, unknown, untracked, reasonless, repeated or misplaced line gets one note", artifactReaderFailures.length === 0, artifactReaderFailures.join("\n"));

const runtimeReaderFailures = [];
const runtimeDeliverable = checkDeliverables(parseLedger(tree("Made by: R-001 · suite: scripts/make.mjs\nRead by: R-001 · runtime: loaded by the host")), ["scripts/make.mjs"]);
const runtimeClaims = deliverableClaims(parseLedger(tree("Made by: R-001 · suite: scripts/make.mjs\nRead by: R-001 · runtime: loaded by the host")), parseLedger(tree("Made by: R-001 · suite: scripts/make.mjs\nRead by: R-001 · runtime: loaded by the host")).headings[0]).get("R-001") ?? [];
const runtimeState = deliverablesModule.deliverableCodeState?.(runtimeClaims);
if (runtimeDeliverable.notes.length || runtimeDeliverable.madeAndReadByCode !== 0 || runtimeState?.readByCode !== false) runtimeReaderFailures.push(`deliverable runtime: ${JSON.stringify({ notes: runtimeDeliverable.notes, count: runtimeDeliverable.madeAndReadByCode, runtimeState })}`);
const runtimeArtifact = checkDeliverables(parseLedger(artifactConsumerLedger({ after: ["Read by: A-001 · runtime: loaded by the host"] })), []);
if (runtimeArtifact.notes.length || !runtimeArtifact.artifactConsumers?.get("A-001")?.kinds.has("runtime")) runtimeReaderFailures.push(`artifact runtime: ${runtimeArtifact.notes.join(" | ")}`);
for (const [label, text] of [
  ["deliverable reasonless", tree("Made by: R-001 · manual: owner\nRead by: R-001 · runtime:")],
  ["artifact reasonless", artifactConsumerLedger({ after: ["Read by: A-001 · runtime:"] })],
]) {
  const notes = checkDeliverables(parseLedger(text), []).notes.filter((entry) => entry.includes("needs a reason"));
  if (notes.length !== 1) runtimeReaderFailures.push(`${label}: ${notes.join(" | ")}`);
}
// req: R-2831
check("R-2831: a runtime reader needs a reason on both Read by forms and never counts as code", runtimeReaderFailures.length === 0, runtimeReaderFailures.join("\n"));

const artifactParkFailures = [];
const validArtifactPark = checkDeliverables(parseLedger(artifactConsumerLedger({ after: ["Parked: A-001 · since 2026-10-25: held for an owner decision"] })), []);
if (validArtifactPark.notes.length || validArtifactPark.artifactConsumers?.get("A-001")?.park?.date !== "2026-10-25") artifactParkFailures.push(`valid: ${validArtifactPark.notes.join(" | ")}`);
for (const [label, line, fragment] of [
  ["separator", "Parked: A-001 - since 2026-10-25: held", "cannot read Parked:"],
  ["third part", "Parked: A-001 · since 2026-10-25: held · more", "cannot read Parked:"],
  ["unknown", "Parked: A-999 · since 2026-10-25: held", "registered in that feature"],
  ["date", "Parked: A-001 · 2026-10-25: held", "needs a since date"],
  ["reason", "Parked: A-001 · since 2026-10-25:", "needs a reason"],
]) {
  const report = checkDeliverables(parseLedger(artifactConsumerLedger({ after: [line] })), []);
  const notes = report.notes.filter((entry) => entry.includes("Parked:"));
  if (notes.length !== 1 || !notes[0].includes(fragment) || report.artifactConsumers?.get("A-001")?.park) artifactParkFailures.push(`${label}: ${report.notes.join(" | ")}`);
}
const readAndPark = checkDeliverables(parseLedger(artifactConsumerLedger({ after: ["Parked: A-001 · since 2026-10-25: held"], second: ["Reads: A-001 · scripts/read.mjs"] })), ["scripts/read.mjs"]);
if (!readAndPark.notes.some((entry) => entry.includes("Parked:") && entry.includes("parks nothing")) || readAndPark.artifactConsumers?.get("A-001")?.park) artifactParkFailures.push(`read entry: ${readAndPark.notes.join(" | ")}`);
const foreignPark = checkDeliverables(parseLedger(artifactConsumerLedger({ after: ["Parked: A-002 · since 2026-10-25: held"], second: ["Artifact: A-002 · other · user-home store: ~/other · manual: owner"] })), []);
if (!foreignPark.notes.some((entry) => entry.includes("Parked:") && entry.includes("registered in that feature")) || foreignPark.artifactConsumers?.get("A-002")?.park) artifactParkFailures.push(`foreign park: ${foreignPark.notes.join(" | ")}`);
const capabilityPark = checkDeliverables(parseLedger(tree("Made by: R-001 · manual: owner\nRead by: R-001 · person: owner\nParked: R-001 · since 2026-10-25: held")), []);
if (capabilityPark.artifactConsumers?.get("A-001")?.park || capabilityPark.notes.some((entry) => entry.includes("Parked: line"))) artifactParkFailures.push(`capability park: ${capabilityPark.notes.join(" | ")}`);
// req: R-2832
check("R-2832: an artifact park needs its own unread entry, a since date and a reason, and a park of a read entry parks nothing", artifactParkFailures.length === 0, artifactParkFailures.join("\n"));

const testReaderFailures = [];
for (const [label, text] of [
  ["deliverable", tree("Made by: R-001 · manual: owner\nRead by: R-001 · code: tests/reader.test.mjs")],
  ["artifact", artifactConsumerLedger({ after: ["Read by: A-001 · prompt: nested/reader.test.ts"] })],
  ["reads", artifactConsumerLedger({ second: ["Reads: A-001 · nested/reader.test.js"] })],
]) {
  const notes = checkDeliverables(parseLedger(text), ["tests/reader.test.mjs", "nested/reader.test.ts", "nested/reader.test.js"]).notes.filter((entry) => entry.includes("test file"));
  if (notes.length !== 1 || !notes[0].includes("reader.test.")) testReaderFailures.push(`${label}: ${notes.join(" | ")}`);
}
for (const [label, text, tracked] of [
  ["folder segment", artifactConsumerLedger({ after: ["Read by: A-001 · code: x.test.d/reader.mjs"] }), ["x.test.d/reader.mjs"]],
  ["harness", artifactConsumerLedger({ after: ["Read by: A-001 · code: templates/python/template/tests/conftest.py"] }), ["templates/python/template/tests/conftest.py"]],
  ["person reason", artifactConsumerLedger({ after: ["Read by: A-001 · person: owner reads reader.test.mjs"] }), []],
]) {
  const notes = checkDeliverables(parseLedger(text), tracked).notes.filter((entry) => entry.includes("test file"));
  if (notes.length) testReaderFailures.push(`${label}: ${notes.join(" | ")}`);
}
// req: R-2833
check("R-2833: a reader path whose file name is a test file gets one note on every reader form, and a harness file in a tests folder gets none", testReaderFailures.length === 0, testReaderFailures.join("\n"));

const consumerLedger = [
  "# CAP-01 · Product", "Purpose: product", "Outcome: artifacts are consumed", "Kind: product", "Deliverables: R-001, R-002, R-003, R-004",
  "Made by: R-001 · suite: scripts/make.mjs · built from: A-003, A-008", "Read by: R-001 · code: scripts/read.mjs", "Parked: R-001 · since 2026-10-25: held",
  "Made by: R-002 · manual: owner · built from: A-004", "Read by: R-002 · person: owner",
  "Made by: R-003 · suite: scripts/make.mjs · A-005", "Read by: R-003 · runtime: loaded by host",
  "Made by: R-004 · manual: owner · A-011", "Read by: R-004 · code: tests/reader.test.mjs", "",
  "## FEAT-001 · Maker", "Purpose: make artifacts", "Status: active",
  "Artifact: A-001 · one · user-home store: ~/one · manual: owner",
  "Artifact: A-002 · two · user-home store: ~/two · manual: owner", "Read by: A-002 · person: owner",
  "Artifact: A-003 · three · user-home store: ~/three · manual: owner",
  "Artifact: A-004 · four · user-home store: ~/four · manual: owner",
  "Artifact: A-005 · five · user-home store: ~/five · suite: scripts/make.mjs",
  "Artifact: A-006 · six · user-home store: ~/six · manual: owner", "Parked: A-006 · since 2026-10-25 held",
  "Artifact: A-007 · seven · user-home store: ~/seven · manual: owner", "Parked: A-007 · since 2026-10-25: held",
  "Artifact: A-008 · eight · user-home store: ~/eight · manual: owner",
  "Artifact: A-009 · nine · user-home store: ~/nine · manual: owner", "Read by: A-009 · code: tests/bad.test.mjs",
  "Artifact: A-010 · ten · retired: replaced by A-001",
  "Artifact: A-011 · eleven · user-home store: ~/eleven · manual: owner",
  "Artifact: A-012 · twelve · user-home store: ~/twelve · manual: owner", "",
  "| ID | Requirement | Status | Evidence |", "|---|---|---|---|", "| R-001 | One shall exist. | untested | — |", "| R-002 | Two shall exist. | untested | — |", "| R-003 | Three shall exist. | untested | — |", "| R-004 | Four shall exist. | untested | — |", "",
  "## FEAT-002 · Reader", "Purpose: read artifacts", "Status: active", "Reads: A-001 · scripts/read.mjs", "",
  "| ID | Requirement | Status | Evidence |", "|---|---|---|---|", "| R-004 | The reader shall exist. | untested | — |",
].join("\n");
const consumerReport = checkDeliverables(parseLedger(consumerLedger), ["scripts/make.mjs", "scripts/read.mjs", "tests/bad.test.mjs", "tests/reader.test.mjs"]);
const consumerMap = consumerReport.artifactConsumers;
const consumerFacts = consumerMap instanceof Map
  && consumerMap.get("A-001")?.kinds.has("code")
  && consumerMap.get("A-002")?.kinds.has("person")
  && consumerMap.get("A-003")?.kinds.has("code")
  && consumerMap.get("A-004")?.kinds.has("person")
  && consumerMap.get("A-005")?.kinds.has("runtime")
  && consumerMap.get("A-007")?.park
  && consumerMap.get("A-008")?.kinds.has("code")
  && consumerMap.get("A-009")?.kinds.size === 0
  && consumerMap.get("A-011")?.kinds.size === 0
  && !consumerMap.has("A-010");
const noReaderNotes = consumerReport.notes.filter((entry) => entry.includes("has no declared reader"));
const secondCapabilityLedger = `${consumerLedger}\n\n# CAP-02 · Other product\nPurpose: other product\nKind: product\n\n## FEAT-003 · Other reader\nPurpose: other reader\nStatus: active\nReads: A-012 · scripts/other.mjs\n`;
const secondCapabilityReport = checkDeliverables(parseLedger(secondCapabilityLedger), ["scripts/make.mjs", "scripts/read.mjs", "scripts/other.mjs", "tests/bad.test.mjs", "tests/reader.test.mjs"]);
const secondCapabilityCounts = secondCapabilityReport.artifactConsumers?.get("A-012")?.kinds.has("code") === true;
// req: R-2834
check("R-2834: the shared consumer predicate gives each entry its reader kinds, and an entry with none and no park gets one note", consumerFacts && noReaderNotes.length === 4 && noReaderNotes.some((entry) => entry.includes("A-006")) && noReaderNotes.some((entry) => entry.includes("A-009")) && noReaderNotes.some((entry) => entry.includes("A-011")) && noReaderNotes.some((entry) => entry.includes("A-012")) && !noReaderNotes.some((entry) => entry.includes("A-007") || entry.includes("A-008") || entry.includes("A-010")) && secondCapabilityCounts, JSON.stringify({ consumers: consumerMap ? [...consumerMap].map(([id, value]) => [id, [...value.kinds], value.park]) : null, notes: consumerReport.notes }));

// req: R-2833, R-2834
check("seal: the test-reader glob and the no-declared-reader note read as sealed", deliverablesModule.TEST_READER_GLOB === "*.test.*" && deliverablesModule.NO_DECLARED_READER_NOTE === "has no declared reader", JSON.stringify({ glob: deliverablesModule.TEST_READER_GLOB, note: deliverablesModule.NO_DECLARED_READER_NOTE }));

const reasonCases = [
  ["Made by: R-001 · manual", "Read by: R-001 · person: owner", "Made by:"],
  ["Made by: R-001 · manual:   ", "Read by: R-001 · person: owner", "Made by:"],
  ["Made by: R-001 · manual: owner", "Read by: R-001 · rule", "Read by:"],
  ["Made by: R-001 · manual: owner", "Read by: R-001 · person:   ", "Read by:"],
  ["Made by: R-001 · manual · docs/x.md", "Read by: R-001 · code: scripts/make.mjs", "Made by:"],
];
const reasonFailures = [];
for (const [maker, reader, label] of reasonCases) {
  const notes = notesFor(tree(`${maker}\n${reader}`)).filter((note) => note.includes("needs a reason"));
  if (notes.length !== 1 || !notes[0].includes("R-001") || !notes[0].includes(label)) reasonFailures.push(`${maker} / ${reader}: ${notes.join(" | ")}`);
}
for (const lines of [
  "Made by: R-001 · manual: release owner\nRead by: R-001 · person: release owner",
  "Made by: R-001 · manual: release owner\nRead by: R-001 · rule: required by the land checklist",
]) {
  const notes = notesFor(tree(lines)).filter((note) => note.includes("needs a reason"));
  if (notes.length) reasonFailures.push(`${lines}: ${notes.join(" | ")}`);
}
// req: R-2535
check("a manual maker or a rule or person reader with no reason gets one note naming the row", reasonFailures.length === 0, reasonFailures.join("\n"));

const scratch = tmpDir(join(tmpdir(), "req-deliverables-"));
const repo = join(scratch, "repo");
const project = join(repo, "project");
mkdirSync(join(project, "scripts"), { recursive: true });
mkdirSync(join(project, "readers", "nested"), { recursive: true });
mkdirSync(join(project, "docs"), { recursive: true });
mkdirSync(join(project, "src"), { recursive: true });
writeFileSync(join(project, "scripts", "make.mjs"), "export const make = true;\n");
writeFileSync(join(project, "scripts", "runtime-measure.mjs"), "export const measure = true;\n");
writeFileSync(join(project, "readers", "nested", "read.mjs"), "export const read = true;\n");
writeFileSync(join(project, "docs", "artifact.md"), "artifact\n");
writeFileSync(join(project, "src", "é.mjs"), "export const unicode = true;\n");
writeFileSync(join(project, ".gitignore"), "ignored.tmp\n");
const pathLedger = tree([
  "Made by: R-001 · suite: scripts/make.mjs",
  "Made by: R-001 · build: readers",
  "Made by: R-001 · review: src/é.mjs",
  "Made by: R-001 · land: scripts/make.mjs · docs/artifact.md",
  "Made by: R-001 · land: scripts/runtime-measure.mjs · runtime-map",
  "Made by: R-001 · suite: missing.mjs",
  "Made by: R-001 · build: ignored.tmp",
  "Made by: R-001 · hook: staged.mjs",
  "Made by: R-001 · CI: scripts\\make.mjs",
  "Made by: R-001 · extension: scripts/make.mjs, missing-two.mjs",
  "Made by: R-001 · review: scripts/make.mjs · docs/missing-artifact.md",
  "Read by: R-001 · code: readers",
  "Read by: R-001 · prompt: missing-reader.mjs",
  "Read by: R-001 · prompt: scripts/make.mjs",
].join("\n"));
writeFileSync(join(project, "REQUIREMENTS.md"), pathLedger);
let setupFailure = "";
for (const result of [
  git(repo, "init", "-q", "-b", "main"),
  git(repo, "add", "."),
  git(repo, "commit", "-qm", "base"),
]) if (result.status !== 0) setupFailure += result.stderr;
writeFileSync(join(project, "ignored.tmp"), "ignored\n");
writeFileSync(join(project, "staged.mjs"), "export const staged = true;\n");
const staged = git(repo, "add", "project/staged.mjs");
if (staged.status !== 0) setupFailure += staged.stderr;
const pathRun = run(scratch, process.execPath, [CLI, "--root", project]);
const pathNotes = (pathRun.stdout ?? "").split(/\r?\n/).filter((line) => line.includes("is not tracked at HEAD"));
const missingPaths = ["runtime-map", "missing.mjs", "ignored.tmp", "staged.mjs", "scripts\\make.mjs", "missing-two.mjs", "docs/missing-artifact.md", "missing-reader.mjs"];
const passingPaths = ["scripts/make.mjs", "readers", "src/é.mjs", "docs/artifact.md"];

const noGit = join(scratch, "not-git");
mkdirSync(noGit, { recursive: true });
writeFileSync(join(noGit, "REQUIREMENTS.md"), tree("Made by: R-001 · suite: scripts/make.mjs\nRead by: R-001 · person: owner"));
const noGitRun = run(scratch, process.execPath, [CLI, "--root", noGit]);
const noGitNotes = (noGitRun.stdout ?? "").split(/\r?\n/).filter((line) => line.includes("paths not checked"));

const unborn = join(scratch, "unborn");
mkdirSync(unborn, { recursive: true });
git(unborn, "init", "-q", "-b", "main");
writeFileSync(join(unborn, "REQUIREMENTS.md"), tree("Made by: R-001 · suite: scripts/make.mjs\nRead by: R-001 · person: owner"));
const unbornRun = run(scratch, process.execPath, [CLI, "--root", unborn]);
const unbornNotes = (unbornRun.stdout ?? "").split(/\r?\n/).filter((line) => line.includes("paths not checked"));
// req: R-2536
check("a maker or reader path not tracked at HEAD gets one note naming the row and the path",
  !setupFailure && pathRun.status === 0 && pathNotes.length === missingPaths.length && missingPaths.every((path) => pathNotes.filter((note) => note.includes("R-001") && note.includes(path)).length === 1) && passingPaths.every((path) => !pathNotes.some((note) => note.includes(path))) && noGitRun.status === 0 && noGitNotes.length === 1 && unbornRun.status === 0 && unbornNotes.length === 1,
  `${setupFailure}\npath status ${pathRun.status}:\n${pathRun.stdout}\n${pathRun.stderr}\nno git:\n${noGitRun.stdout}\n${noGitRun.stderr}\nunborn:\n${unbornRun.stdout}\n${unbornRun.stderr}`);

const grammarFailures = [];
const expectNote = (label, text, fragment, count = 1) => {
  const notes = notesFor(text);
  const found = notes.filter((note) => note.includes(fragment));
  if (found.length !== count) grammarFailures.push(`${label}: wanted ${count} x ${fragment}; ${notes.join(" | ")}`);
};
expectNote("missing both", tree(""), "has no readable", 2);
const outside = `# CAP-01 · Constraint\nPurpose: constraint\nKind: constraint\nMade by: R-001 · manual: owner\n\n# CAP-02 · Kindless\nPurpose: kindless\nRead by: R-002 · person: owner\n`;
expectNote("constraint and kindless", outside, "outside a live Kind: product capability", 2);
expectNote("unlisted row", tree("Made by: R-999 · manual: owner\nMade by: R-001 · manual: owner\nRead by: R-001 · person: owner"), "R-999", 1);
expectNote("unknown run", tree("Made by: R-001 · nightly: scripts/make.mjs\nRead by: R-001 · person: owner"), "unknown maker run", 1);
expectNote("bad separator", tree("Made by: R-001 - land: scripts/make.mjs\nRead by: R-001 · person: owner"), "cannot read Made by:", 1);
expectNote("bare automatic", tree("Made by: R-001 · land\nRead by: R-001 · person: owner"), "needs a code path", 1);
expectNote("bare prompt", tree("Made by: R-001 · manual: owner\nRead by: R-001 · prompt"), "needs a code path", 1);
expectNote("bare code", tree("Made by: R-001 · manual: owner\nRead by: R-001 · code"), "needs a code path", 1);
const ignoredProse = tree(
  "Made by: R-001 · manual: owner\nRead by: R-001 · person: owner\nmade by: R-999 · nightly\n```\nMade by: R-999 · nightly\n```\nMade by: R-001 · manual: second owner",
  "Made by: R-999 · nightly\n### SUB-001 · Sub\nPurpose: sub\nRead by: R-999 · mystery\n",
);
if (notesFor(ignoredProse).length !== 0) grammarFailures.push(`ignored prose: ${notesFor(ignoredProse).join(" | ")}`);
const lfNotes = notesFor(tree("Made by: R-001 · land\nRead by: R-001 · prompt"));
const crlfNotes = notesFor(tree("Made by: R-001 · land\nRead by: R-001 · prompt").replaceAll("\n", "\r\n"));
if (JSON.stringify(lfNotes) !== JSON.stringify(crlfNotes)) grammarFailures.push(`CRLF differs: ${lfNotes.join(" | ")} / ${crlfNotes.join(" | ")}`);
const trailing = tree("Made by: R-001 · manual: owner  \t\nRead by: R-001 · person: owner\t", "", "");
if (notesFor(trailing).length !== 0) grammarFailures.push(`trailing/no-final-newline: ${notesFor(trailing).join(" | ")}`);
const tunablesPinned = JSON.stringify(DELIVERABLE_FIELD_LABELS) === JSON.stringify(["Made by", "Read by"])
  && JSON.stringify(MAKER_RUNS) === JSON.stringify(["session start", "suite", "land", "review", "build", "CI", "hook", "extension", "manual"])
  && JSON.stringify(READER_KINDS) === JSON.stringify(["code", "prompt", "person", "rule", "runtime"])
  && JSON.stringify(REASON_REQUIRED) === JSON.stringify(["manual", "rule", "person", "runtime"])
  && JSON.stringify(PATH_REQUIRED) === JSON.stringify(["session start", "suite", "land", "review", "build", "CI", "hook", "extension", "code", "prompt"])
  && PART_SEPARATOR === " · ";
if (!tunablesPinned) grammarFailures.push("sealed deliverable tunables differ");
// req: R-2537
check("a missing or unreadable line, or an automatic claim with no code path, gets one note naming it", grammarFailures.length === 0, grammarFailures.join("\n"));

const parkedGrammarFailures = [];
const parkedBase = "Made by: R-001 · manual: owner\nRead by: R-001 · person: owner";
const expectPark = (label, parkLine, fragment, parked = 0, transform = (value) => value) => {
  const report = checkDeliverables(parseLedger(transform(tree(`${parkedBase}\n${parkLine}`))), ["scripts/make.mjs", "docs/x.md"]);
  const matching = report.notes.filter((entry) => entry.includes(fragment));
  if (matching.length !== 1 || report.notes.length !== 1 || report.parkedDeliverables !== parked)
    parkedGrammarFailures.push(`${label}: parked=${report.parkedDeliverables}; ${report.notes.join(" | ")}`);
};
expectPark("dash separator", "Parked: R-001 - since 2026-10-22: held", "cannot read Parked:");
for (const [label, line] of [
  ["date without since", "Parked: R-001 · 2026-10-22: held"],
  ["date in another order", "Parked: R-001 · since 22-10-2026: held"],
  ["date as a word", "Parked: R-001 · since soon: held"],
]) expectPark(label, line, "needs a since date");
for (const [label, line] of [
  ["missing colon and reason", "Parked: R-001 · since 2026-10-22"],
  ["blank reason", "Parked: R-001 · since 2026-10-22:   "],
]) expectPark(label, line, "needs a reason");
expectPark("third part", "Parked: R-001 · since 2026-10-22: held · more", "cannot read Parked:");

const crossCapability = `# CAP-01 · First\nPurpose: first\nOutcome: first artifact\nKind: product\nDeliverables: R-001\nMade by: R-001 · manual: owner\nRead by: R-001 · person: owner\nParked: R-002 · since 2026-10-22: held\n\n## FEAT-001 · First feature\nPurpose: first feature\nStatus: active\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | The first artifact shall exist. | untested | — |\n\n# CAP-02 · Second\nPurpose: second\nOutcome: second artifact\nKind: product\nDeliverables: R-002\nMade by: R-002 · manual: owner\nRead by: R-002 · person: owner\n\n## FEAT-002 · Second feature\nPurpose: second feature\nStatus: active\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-002 | The second artifact shall exist. | untested | — |\n`;
const crossReport = checkDeliverables(parseLedger(crossCapability), []);
if (crossReport.notes.length !== 1 || !crossReport.notes[0].includes("names an unlisted deliverable") || crossReport.parkedDeliverables !== 0)
  parkedGrammarFailures.push(`cross capability: parked=${crossReport.parkedDeliverables}; ${crossReport.notes.join(" | ")}`);
for (const [label, text] of [
  ["constraint", `# CAP-01 · Constraint\nPurpose: constraint\nKind: constraint\nParked: R-001 · since 2026-10-22: held\n`],
  ["kindless", `# CAP-01 · Kindless\nPurpose: kindless\nParked: R-001 · since 2026-10-22: held\n`],
]) {
  const report = checkDeliverables(parseLedger(text), []);
  if (report.notes.length !== 1 || !report.notes[0].includes("outside a live Kind: product capability") || report.parkedDeliverables !== 0)
    parkedGrammarFailures.push(`${label}: parked=${report.parkedDeliverables}; ${report.notes.join(" | ")}`);
}
for (const [label, parkLine, transform = (value) => value] of [
  ["readable", "Parked: R-001 · since 2026-10-22: the owner holds it"],
  ["spaced", "Parked: R-001  ·  since  2026-10-22:  the owner holds it"],
  ["CRLF", "Parked: R-001 · since 2026-10-22: the owner holds it", (value) => value.replaceAll("\n", "\r\n")],
  ["trailing tab and no final newline", "Parked: R-001 · since 2026-10-22: the owner holds it\t", (value) => value.replace(/\n$/, "")],
]) {
  const report = checkDeliverables(parseLedger(transform(tree(`${parkedBase}\n${parkLine}`))), []);
  if (report.notes.length !== 0 || report.parkedDeliverables !== 1)
    parkedGrammarFailures.push(`${label}: parked=${report.parkedDeliverables}; ${report.notes.join(" | ")}`);
}
for (const [label, parkLine] of [
  ["lowercase", "parked: R-001 · since 2026-10-22: held"],
  ["bold", "**Parked:** R-001 · since 2026-10-22: held"],
  ["bullet", "- Parked: R-001 · since 2026-10-22: held"],
]) {
  const report = checkDeliverables(parseLedger(tree(`${parkedBase}\n${parkLine}`)), []);
  if (report.notes.length !== 0 || report.parkedDeliverables !== 0)
    parkedGrammarFailures.push(`${label}: parked=${report.parkedDeliverables}; ${report.notes.join(" | ")}`);
}
const featureParkReport = checkDeliverables(parseLedger(tree(parkedBase, "Parked: R-001 · since 2026-10-22: held")), []);
if (featureParkReport.notes.length !== 1 || !featureParkReport.notes[0].includes("cannot read Parked:") || featureParkReport.parkedDeliverables !== 0)
  parkedGrammarFailures.push(`feature line: parked=${featureParkReport.parkedDeliverables}; ${featureParkReport.notes.join(" | ")}`);
if (PARKED_LABEL !== "Parked" || PARKED_SINCE !== "since") parkedGrammarFailures.push(`sealed park tunables differ: ${PARKED_LABEL}/${PARKED_SINCE}`);
// req: R-2640
check("R-2640: an unreadable or misplaced Parked line gets one note and parks nothing", parkedGrammarFailures.length === 0, parkedGrammarFailures.join("\n"));

const staleParkFailures = [];
for (const [label, lines, firstLine] of [
  ["above maker", "Parked: R-001 · since 2026-10-22: held\nMade by: R-001 · suite: scripts/make.mjs\nRead by: R-001 · code: scripts/make.mjs", 6],
  ["below reader", "Made by: R-001 · suite: scripts/make.mjs\nRead by: R-001 · code: scripts/make.mjs\nParked: R-001 · since 2026-10-22: held", 8],
  ["two park lines", "Made by: R-001 · suite: scripts/make.mjs\nParked: R-001 · since 2026-10-22: held first\nRead by: R-001 · code: scripts/make.mjs\nParked: R-001 · since 2026-10-23: held second", 7],
]) {
  const text = tree(lines);
  const report = checkDeliverables(parseLedger(text), ["scripts/make.mjs"]);
  const stale = report.notes.filter((entry) => entry.includes("parks nothing"));
  const output = deliverableReportLines(parseLedger(text), ".", () => ({ status: 0, stdout: Buffer.from("scripts/make.mjs\0"), stderr: Buffer.alloc(0) }));
  if (stale.length !== 1 || !stale[0].includes("R-001") || !stale[0].includes(`Parked: line ${firstLine}`) || report.madeAndReadByCode !== 1 || report.parkedDeliverables !== 0 || JSON.stringify(output) !== JSON.stringify(["deliverables: 1 of 1 made and read by code", stale[0]]))
    staleParkFailures.push(`${label}: counts=${report.madeAndReadByCode}/${report.parkedDeliverables}; output=${output.join(" | ")}`);
}
// req: R-2641
check("R-2641: a parked deliverable that code makes and reads counts as live with one note naming its Parked line", staleParkFailures.length === 0, staleParkFailures.join("\n"));

const repositoryPath = fileURLToPath(new URL("../../../REQUIREMENTS.md", import.meta.url));
const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const repositoryLedger = readFileSync(repositoryPath, "utf8");
const repositoryParsed = parseLedger(repositoryLedger);
const repositoryFields = deliverableFieldLinesByRow(repositoryParsed);

const expectedAgeTable = {
  [`<git common dir>/${DATA_SUBPATH}`]: { run: "land", writer: "scripts/runtime-measure.mjs" },
  [`<git common dir>/${STORE_SUBPATH}`]: { run: "suite", writer: "packages/nana-pack/lib/suite-records.mjs" },
  [`<git common dir>/${BUILD_RECORDS_SUBPATH}`]: { run: "build", writer: "packages/nana-pack/lib/build-records.mjs" },
};
const ageTable = deliverablesModule.ARTIFACT_AGE_TABLE;
const mismatchLedger = registryTree(
  `Artifact: A-001 · wrong suite · clone store: <git common dir>/${STORE_SUBPATH} · land: scripts/product-report.mjs`,
  "Made by: R-001 · land: scripts/product-report.mjs · A-001\nRead by: R-001 · person: owner",
);
const mismatchNotes = checkDeliverables(parseLedger(mismatchLedger), ["scripts/product-report.mjs"]).notes;
const multipleWriterSuiteLedger = registryTree(
  `Artifact: A-002 · shared suite records · clone store: <git common dir>/${STORE_SUBPATH} · suite: packages/nana-pack/lib/suite-records.mjs, scripts/test-locked.mjs`,
);
const multipleWriterSuiteEntry = artifactRegistry(parseLedger(multipleWriterSuiteLedger), ["packages/nana-pack/lib/suite-records.mjs", "scripts/test-locked.mjs"]).byId.get("A-002");
const multipleWriterSuiteNotes = checkDeliverables(parseLedger(multipleWriterSuiteLedger), ["packages/nana-pack/lib/suite-records.mjs", "scripts/test-locked.mjs"]).notes;
const repositoryRegistry = artifactRegistry(repositoryParsed, git(repositoryRoot, "ls-files", "-z").stdout.split("\0").filter(Boolean));
const repositoryBindings = ["A-006", "A-032", "A-033"].map((id) => {
  const entry = repositoryRegistry.byId.get(id);
  return [id, entry, deliverablesModule.artifactAgeTableKey?.(entry)];
});
const expectedKeys = Object.keys(expectedAgeTable).sort();
const readerKeys = Object.keys(productReportModule.STORE_READERS_BY_KEY ?? {}).sort();
const ageTablePinned = ageTable && Object.isFrozen(ageTable) && Object.values(ageTable).every(Object.isFrozen)
  && JSON.stringify(ageTable) === JSON.stringify(expectedAgeTable);
// req: R-2793
check("R-2793: a clone-store entry is bound to the age table's run and writer, and the table keys come from the store constants",
  ageTablePinned && mismatchNotes.some((entry) => entry.includes("A-001") && entry.includes("age table"))
    && multipleWriterSuiteNotes.some((entry) => entry.includes("A-002") && entry.includes("age table"))
    && deliverablesModule.artifactAgeTableKey?.(multipleWriterSuiteEntry) === null
    && repositoryBindings.every(([, entry, key]) => key === entry.location && expectedKeys.includes(key))
    && JSON.stringify(readerKeys) === JSON.stringify(expectedKeys),
  JSON.stringify({ ageTable, mismatchNotes, multipleWriterSuiteNotes, multipleWriterSuiteKey: deliverablesModule.artifactAgeTableKey?.(multipleWriterSuiteEntry), repositoryBindings, readerKeys, expectedKeys }));
const repositoryArtifactClaimFailures = [];
for (const claims of [...repositoryParsed.headings.filter((heading) => heading.id.startsWith("CAP-")).map((capability) => deliverableClaims(repositoryParsed, capability).values()).flatMap((values) => [...values])]) {
  const parked = claims.some((claim) => claim.label === PARKED_LABEL);
  const makers = claims.filter((claim) => claim.label === "Made by");
  for (const maker of makers) {
    const third = maker.thirdPart;
    if (third && !/^A-[0-9]{3}(?:,\s*A-[0-9]{3})*$/.test(third) && !/^built from:\s*A-[0-9]{3}(?:,\s*A-[0-9]{3})*$/.test(third)) repositoryArtifactClaimFailures.push(`${maker.row}: plain third part ${third}`);
  }
  if (!parked && !makers.some((maker) => maker.registryIds?.length)) repositoryArtifactClaimFailures.push(`${makers[0]?.row ?? "unknown"}: no registry reference`);
}
// req: R-2784
check("R-2784: this repository's ledger names every unparked deliverable's artifact or what it is built from, and keeps no plain-path artifact", repositoryArtifactClaimFailures.length === 0, repositoryArtifactClaimFailures.join("\n"));

const repositoryGaps = [];
for (const capability of repositoryParsed.headings.filter((heading) => heading.id.startsWith("CAP-"))) {
  const fields = capability.capabilityFields ?? {};
  if (fields.Kind?.[0]?.value !== "product" || (fields.Retired?.length ?? 0) > 0) continue;
  for (const row of (fields.Deliverables ?? []).flatMap((entry) => entry.value.split(/,\s*/).filter(Boolean))) {
    const lines = repositoryFields.get(row) ?? [];
    for (const label of DELIVERABLE_FIELD_LABELS) {
      if (!lines.some((line) => line.startsWith(`${label}: ${row} · `))) repositoryGaps.push(`${capability.id} ${row}: missing ${label}: line`);
    }
  }
}
// req: R-2539
check("every deliverable in this repository's ledger has a Made by and a Read by line", repositoryGaps.length === 0, repositoryGaps.join("\n"));

const repositoryGitRunner = (_args, _options) => spawnSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
  cwd: repositoryRoot,
  encoding: "buffer",
  maxBuffer: LIMIT * 1024,
});
const registryControlLedger = registryTree("Artifact: A-001 · broken\nReads: A-999 · scripts/x.mjs", "Made by: R-001 · manual: owner · A-999\nRead by: R-001 · person: owner");
const registryControlGitRunner = (args, options) => {
  const result = repositoryGitRunner(args, options);
  return result.status === 0 ? { ...result, stdout: Buffer.concat([result.stdout, Buffer.from("scripts/x.mjs\0")]) } : result;
};
const registryControlLines = deliverableReportLines(parseLedger(registryControlLedger), repositoryRoot, registryControlGitRunner);
const repositoryReportLines = deliverableReportLines(repositoryParsed, repositoryRoot, repositoryGitRunner);
// req: R-2730
check("R-2730: this repository's ledger gets no deliverable note against its tracked and untracked files",
  /^deliverables: \d+ of \d+ made and read by code/.test(repositoryReportLines[0] ?? "")
    && !repositoryReportLines.some((line) => line.startsWith("deliverable note:"))
    && registryControlLines.filter((line) => line.startsWith("deliverable note:")).length === 3
    && registryControlLines.some((line) => line.includes("malformed Artifact:"))
    && registryControlLines.filter((line) => line.includes("A-999")).length === 2,
  `${repositoryReportLines.join("\n")}\ncontrol: ${registryControlLines.join("\n")}`);

console.log(fails ? `${fails} check(s) failed` : "all checks passed");
process.exit(fails ? 1 : 0);
