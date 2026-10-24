#!/usr/bin/env node
// Seat wrong-code pairs for lane feature-artifact-lines (ordinary), written by the seat 2026-10-24 after build 1 at c8a228bb, re-run after build 2.
// They follow the must-meet rows' red cases (R-2795 to R-2798), the R-2538 print gate, the R-2730 control ledger and the R-2787 lift.
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/feature-artifact-lines-2026-10-24/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const DL = "scripts/deliverables.mjs";
const TREE = "scripts/requirements-tree.mjs";
const MOVED = "scripts/requirements-moved.mjs";
const LIFT = "scripts/requirements-lift.mjs";
const LEDGER = "REQUIREMENTS.md";
const T_DEL = "packages/nana-pack/tests/requirements-deliverables.test.mjs";
const T_TREE = "packages/nana-pack/tests/requirements-tree.test.mjs";
const T_MOVED = "packages/nana-pack/tests/requirements-moved.test.mjs";
const T_CAPK = "packages/nana-pack/tests/requirements-cap-kinds.test.mjs";
const R_2795 = /^R-2795: /; // R-2795
const R_2796 = /^R-2796: /; // R-2796
const R_2797 = /^R-2797: /; // R-2797
const R_2798 = /^R-2798: /; // R-2798
const R_2787 = /^R-2787: /; // R-2787
const R_2730 = /^R-2730: /; // R-2730, the repository ledger and the control ledger
const R_2538 = /^the tree checker prints deliverable notes in every mode/; // R-2538
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// scripts/deliverables.mjs
const OUTSIDE = "notes.push(note(`line ${field.line}: ${READS_LABEL}: line is outside a feature span`));";
const MALFORMED = "if (parts.length !== 2 || !ARTIFACT_ID_PATTERN.test(id) || readerParts.length === 0 || readerParts.some((value) => !value)) {";
const REPEAT = "if (featureReads.some((value) => value.id === id)) notes.push(";
const NO_LIVE_NOTE = "notes.push(note(`line ${field.line}: ${READS_LABEL}: ${id} has no live entry`));";
const NO_LIVE_TEST = "if (!artifact?.live) notes.push(";
const OWN = "else if (artifact.featureId === heading.id) notes.push(";
const DEAD_SPAN = 'if (/^(?:proposed|retired\\b)/.test(heading.status ?? "")) notes.push(note(`line ${field.line}: ${READS_LABEL}: ${id} is in a proposed';
const UNTRACKED = 'if (hasGlob(reader) || reader.endsWith("/") || !tracked.has(reader)) notes.push(note(`line ${field.line}: ${READS_LABEL}:';
const KINDLESS = "if (!capability || !capabilityKind(capability)) continue;\n    const fields = ownFieldLines(parsed, heading, READS_LABEL_SET);";
const NEEDS_TRACKED = "return { reads, byFeature, notes, fieldLineCount, needsTrackedPaths: reads.length > 0 };";
const PRINT_GATE = "let fieldLineCount = registry.fieldLineCount + featureReads.fieldLineCount;";
const REGISTRY_SWITCH = "} else if (registry.fieldLineCount > 0) {";
const TIE_NOTE = "for (const id of missing) notes.push(note(`${row} built-from entry ${id} is neither registered nor read in home feature ${homeFeatureId}`));";
const TIE_TEST = "if (registry.byId.get(id)?.live && !registeredAtHome.has(id) && !readAtHome.has(id)) missing.add(id);";
const READ_AT_HOME = "const readAtHome = new Set((featureReads.byFeature.get(homeFeatureId) ?? []).map((entry) => entry.id));";
const ROW_HOME = "const home = featureOf(table.heading);\n    if (home) for (const row of table.rows) rowHomeFeature.set(row, home.id);";
const MISSING_SET = "const missing = new Set();";
const BUILT_ONLY = 'if (claim.registryKind !== "built from") continue;';

// scripts/requirements-tree.mjs
const OUTLINE_LINE = 'if (h.id.startsWith("FEAT-") && featureReads.byFeature.has(h.id)) out.push(`${prefix}  Reads: ${featureReads.byFeature.get(h.id).map((entry) => entry.id).join(", ")}`);';
const OUTLINE_CHECK = "if (lines[titleIndex + featureFieldOffset] !== expectedReads) problems.push(`${h.id}: outline Reads: is missing or altered`);";

// scripts/requirements-moved.mjs
const READER_CHANGE = "if (JSON.stringify(before?.readers ?? null) === JSON.stringify(after?.readers ?? null)) continue;";
const NONE_GATE = 'if (rowCount === 0 && capabilityChanges.length === 0 && artifactChanges.length === 0 && readChanges.length === 0) return "tree movement: none";';
const SUMMARY = "if (readChanges.length) suffixes.push(`${readChanges.length} read change(s)`);";

// scripts/requirements-lift.mjs
const LIFT_LABELS = "if (!/^(Purpose|Outcome|Status):/.test(bareLines[i])) continue;";

// REQUIREMENTS.md
const FEAT001_A010 = "Reads: A-010 · packages/nana-pack/lib/objective.ts\n";

const DECLARED = [
	"(seat) pairs 1 to 12 follow R-2795's red cases and the reads-are-not-registry rule; 13 to 19 R-2798's, one a ledger edit; 20 and 21 R-2796's; 22 to 24 R-2797's; 25 the lift (R-2787)",
	"(seat) after build 1 at c8a228bb: 23 of 25 red; pairs 5 (a read of a retired entry) and 15 (a built-from entry read only in another feature) survived, both must-meet red cases with no case, and went to build 2",
	"(seat) declared non-pairs: 'the 0943299b outline changes' (the outline renderer is shared, so any change to it that alters an old outline also alters today's; R-2796's history check covers it with pairs 20 and 21's renderer), and 'reads keep the page unchanged' (lane 2's page reads only the registry; no reads code reaches product-report.mjs)",
];

const PAIRS = [
	{ n: "1", name: "a Reads line outside a feature span gets no note", edits: [one(DL, OUTSIDE, "void 0;")], tests: [T_DEL], expectRed: [R_2795] },
	{ n: "2", name: "a Reads line with a bad ID or an empty reader is well formed", edits: [one(DL, MALFORMED, "if (parts.length !== 2) {")], tests: [T_DEL], expectRed: [R_2795] },
	{ n: "3", name: "a second Reads line for one ID in one span gets no note", edits: [one(DL, REPEAT, "if (false) notes.push(")], tests: [T_DEL], expectRed: [R_2795] },
	{ n: "4", name: "a Reads line naming an unknown ID gets no note", edits: [one(DL, NO_LIVE_NOTE, "void 0;")], tests: [T_DEL], expectRed: [R_2795], alsoRed: [R_2730] },
	{ n: "5", name: "a Reads line naming a retired entry passes", edits: [one(DL, NO_LIVE_TEST, "if (!artifact) notes.push(")], tests: [T_DEL], expectRed: [R_2795] },
	{ n: "6", name: "a feature reading its own entry passes", edits: [one(DL, OWN, "else if (false) notes.push(")], tests: [T_DEL], expectRed: [R_2795] },
	{ n: "7", name: "a Reads line in a retired feature's span passes", edits: [one(DL, DEAD_SPAN, "if (false) notes.push(note(`line ${field.line}: ${READS_LABEL}: ${id} is in a proposed")], tests: [T_DEL], expectRed: [R_2795] },
	{ n: "8", name: "an untracked or folder reader passes", edits: [one(DL, UNTRACKED, "if (false) notes.push(note(`line ${field.line}: ${READS_LABEL}:")], tests: [T_DEL], expectRed: [R_2795] },
	{ n: "9", name: "Reads lines under a kindless capability are read and noted", edits: [one(DL, KINDLESS, "if (!capability) continue;\n    const fields = ownFieldLines(parsed, heading, READS_LABEL_SET);")], tests: [T_DEL, T_TREE], expectRed: [R_2795] },
	{ n: "10", name: "a ledger whose only path is a reader never reads the HEAD tree", edits: [one(DL, NEEDS_TRACKED, "return { reads, byFeature, notes, fieldLineCount, needsTrackedPaths: false };")], tests: [T_DEL], expectRed: [R_2795] },
	{ n: "11", name: "a ledger whose only field line is a Reads line prints nothing", edits: [one(DL, PRINT_GATE, "let fieldLineCount = registry.fieldLineCount;")], tests: [T_DEL, T_TREE], expectRed: [R_2538] },
	{ n: "12", name: "a Reads line switches on the registry's plain-path rule", edits: [one(DL, REGISTRY_SWITCH, "} else if (registry.fieldLineCount + featureReads.fieldLineCount > 0) {")], tests: [T_DEL], expectRed: [R_2795] },
	{ n: "13", name: "a built-from entry neither registered nor read at home gets no note", edits: [one(DL, TIE_NOTE, "void missing;")], tests: [T_DEL], expectRed: [R_2798] },
	{ n: "14", name: "a built-from entry registered in the home feature gets a note", edits: [one(DL, TIE_TEST, "if (registry.byId.get(id)?.live && !readAtHome.has(id)) missing.add(id);")], tests: [T_DEL], expectRed: [R_2798], alsoRed: [R_2730] },
	{ n: "15", name: "a built-from entry read in any feature passes", edits: [one(DL, READ_AT_HOME, "const readAtHome = new Set(featureReads.reads.map((entry) => entry.id));")], tests: [T_DEL], expectRed: [R_2798] },
	{ n: "16", name: "a subgroup-homed row takes the subgroup as its home", edits: [one(DL, ROW_HOME, "const home = table.heading;\n    if (home) for (const row of table.rows) rowHomeFeature.set(row, home.id);")], tests: [T_DEL], expectRed: [R_2798] },
	{ n: "17", name: "two claims naming one missing entry give two notes", edits: [one(DL, MISSING_SET, "const missing = [];"), one(DL, TIE_TEST, "if (registry.byId.get(id)?.live && !registeredAtHome.has(id) && !readAtHome.has(id)) missing.push(id);")], tests: [T_DEL], expectRed: [R_2798] },
	{ n: "18", name: "a direct reference to another feature's entry gets a tie note", edits: [one(DL, BUILT_ONLY, "if (!claim.registryKind) continue;")], tests: [T_DEL], expectRed: [R_2798] },
	{ n: "19", name: "the repository ledger drops FEAT-001's read of the trust store", edits: [one(LEDGER, FEAT001_A010, "")], tests: [T_DEL], expectRed: [R_2730] },
	{ n: "20", name: "the outline drops each feature's Reads line", edits: [one(TREE, OUTLINE_LINE, "void 0;")], tests: [T_TREE], expectRed: [R_2796] },
	{ n: "21", name: "the outline field check ignores a dropped Reads line", edits: [one(TREE, OUTLINE_CHECK, "void expectedReads;")], tests: [T_TREE], expectRed: [R_2796] },
	{ n: "22", name: "the movement report ignores a reader path change", edits: [one(MOVED, READER_CHANGE, "if ((before === undefined) === (after === undefined)) continue;")], tests: [T_MOVED], expectRed: [R_2797] },
	{ n: "23", name: "a reads-only change prints tree movement: none", edits: [one(MOVED, NONE_GATE, 'if (rowCount === 0 && capabilityChanges.length === 0 && artifactChanges.length === 0) return "tree movement: none";')], tests: [T_MOVED], expectRed: [R_2797] },
	{ n: "24", name: "the summary leaves out the read change count", edits: [one(MOVED, SUMMARY, "void 0;")], tests: [T_MOVED], expectRed: [R_2797] },
	{ n: "25", name: "the lift refuses carried Reads lines as field prose", edits: [one(LIFT, LIFT_LABELS, "if (!/^(Purpose|Outcome|Status|Reads):/.test(bareLines[i])) continue;")], tests: [T_CAPK], expectRed: [R_2787] },
];

process.exitCode = await runMutations({ lane: "feature-artifact-lines", self: import.meta.url, tip: "3d0bdccc", declared: DECLARED, pairs: PAIRS });
