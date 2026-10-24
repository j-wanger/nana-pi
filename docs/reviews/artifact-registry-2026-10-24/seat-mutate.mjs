#!/usr/bin/env node
// Seat wrong-code pairs for lane artifact-registry (ordinary), written by the seat 2026-10-24 after build 1, at tip af5dc49f.
// They follow the must-meet rows' red cases (R-2780 to R-2787), the binding, the shim, the gate and the no-plain-path rule.
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/artifact-registry-2026-10-24/seat-mutate.mjs
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
const R_2780 = /^R-2780: /; // R-2780
const R_2781 = /^R-2781: /; // R-2781
const R_2782 = /^R-2782: /; // R-2782
const R_2783 = /^R-2783: /; // R-2783
const R_2784 = /^R-2784: /; // R-2784
const R_2785 = /^R-2785: /; // R-2785
const R_2786 = /^R-2786: /; // R-2786
const R_2787 = /^R-2787: /; // R-2787
const R_2730 = /^R-2730: /; // R-2730, the repository ledger gets no note
const R_2743 = /^R-2743: /; // R-2743, the machine-local binding
const R_2538 = /^the tree checker prints deliverable notes in every mode/; // R-2538
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// scripts/deliverables.mjs
const REUSED = "if (byId.has(id)) {";
const OUTSIDE = "notes.push(note(`line ${field.line}: Artifact: line is outside a feature span`));";
const KINDLESS = "if (!capability || !capabilityKind(capability)) continue;\n    const fields = ownFieldLines(parsed, heading, ARTIFACT_LABELS);";
const DEAD_SPAN = 'if (!retired && /^(?:proposed|retired\\b)/.test(feature?.status ?? ""))';
const MALFORMED = "malformed = !ARTIFACT_CLASSES.includes(className) || !location || !MAKER_SET.has(run);";
const HOME_SHAPE = 'if (className === "user-home store") return /^(?:~|<pi agent dir>)\\/.+/.test(location)';
const CI_SHAPE = "return Boolean(match && (tracked === null || tracked.has(match[1])));";
const FIRST_SEGMENT = 'if (segments.includes("..") || /[*?]/.test(segments[0])) return false;';
const MATCHES_NOTHING = "if (!matches) notes.push(";
const GLOB_MATCH = "[...tracked].some((path) => globMatch(location, path))";
const WRITER_TRACKED = 'for (const writer of writers) if (hasGlob(writer) || writer.endsWith("/") || !tracked.has(writer))';
const DUPLICATE = "if (locations.has(key)) notes.push(";
const REASON = 'if (!reason) notes.push(artifactNote(entry, "manual maker needs a reason"));';
const RUN_BIND = "if (entry.run !== run) problems.push(";
const EVERY_WRITER = "const missingWriters = entry.writers.filter((writer) => !codePaths.includes(writer));";
const NAMED_ONLY = 'if (reference.kind === "artifact") {';
const REFERENCE_BRANCH = "if (reference) {\n            for (const id of reference.ids) {";
const PLAIN_PATH = "} else if (registry.fieldLineCount > 0) {";
const SHIM = "if (!store || entry.run !== store.run || entry.writers.length !== 1 || entry.writers[0] !== store.entryWriter || run !== store.run || !codePaths.includes(store.claimWriter)) return entry.location;";
const GATE = "let fieldLineCount = registry.fieldLineCount;";

// scripts/requirements-tree.mjs
const OUTLINE_LINE = "if (h.id.startsWith(\"FEAT-\") && artifactsByFeature.has(h.id)) out.push(`${prefix}  Artifacts: ${artifactsByFeature.get(h.id).join(\", \")}`);";
const OUTLINE_CHECK = "if (lines[titleIndex + detailOffset + 1] !== expectedArtifacts) problems.push(`${h.id}: outline Artifacts: is missing or altered`);";

// scripts/requirements-moved.mjs
const WRITER_CHANGE = 'if (JSON.stringify(before.writers) !== JSON.stringify(after.writers) && before.live && after.live) parts.push("writer changed");';
const NONE_GATE = 'if (rowCount === 0 && capabilityChanges.length === 0 && artifactChanges.length === 0) return "tree movement: none";';
const MOVED_FEATURE = "if (before.featureId !== after.featureId) parts.push(`moved ${before.featureId} → ${after.featureId}`);";

// scripts/requirements-lift.mjs
const LIFT_LABELS = "if (!/^(Purpose|Outcome|Status):/.test(bareLines[i])) continue;";

// REQUIREMENTS.md
const R509_CLAIM = "Made by: R-509 · manual: someone starts a paid study, or a free dry run, with node apps/bench/run.mjs by hand · A-039";
const R873_SESSION = "Made by: R-873 · session start: packages/nana-setup/claude/hooks/nana-objective.mjs, packages/nana-pack/bin/nana-frontier-summary.mjs · built from: A-003, A-046";
const R873_EXTENSION = "Made by: R-873 · extension: packages/nana-pack/extensions/nana-frontier-summary.ts, packages/nana-pack/lib/frontier-summary.mjs · built from: A-003, A-046";

const DECLARED = [
	"(seat) pairs 1 to 8 follow R-2780 and R-2781's red cases; 9 to 13 R-2782's; 14 to 18 R-2783's (the binding and the built-from rule); 19 to 21 R-2784's, two of them ledger edits; 22 and 23 R-2785's; 24 to 26 R-2786's; 27 R-2787's",
	"(seat) S1 drops the shim's claim-writer clause; it is the lane-1 bridge that keeps today's R-2743 exactness on the page, so a survivor means no test pins the bridge",
	"(seat) S2 empties the gate's registry count, R-2538's every-mode rule for a ledger whose only field lines are registry lines",
	"(seat) the backslash clause of the tracked shape is a declared non-pair: writing its anchor through this table's string escapes is error-prone, and R-2781's other shape cases cover the shape function",
];

const PAIRS = [
	{ n: "1", name: "a reused artifact ID is accepted as a second entry", edits: [one(DL, REUSED, "if (false) {")], tests: [T_DEL], expectRed: [R_2780] },
	{ n: "2", name: "an Artifact line outside a feature span gets no note", edits: [one(DL, OUTSIDE, "void 0;")], tests: [T_DEL], expectRed: [R_2780] },
	{ n: "3", name: "Artifact lines under a kindless capability are read and noted", edits: [one(DL, KINDLESS, "if (!capability) continue;\n    const fields = ownFieldLines(parsed, heading, ARTIFACT_LABELS);")], tests: [T_DEL], expectRed: [R_2780] },
	{ n: "4", name: "a live entry in a proposed or retired feature gets no note", edits: [one(DL, DEAD_SPAN, "if (false)")], tests: [T_DEL], expectRed: [R_2780] },
	{ n: "5", name: "an unknown class is not malformed", edits: [one(DL, MALFORMED, "malformed = !location || !MAKER_SET.has(run);")], tests: [T_DEL], expectRed: [R_2781] },
	{ n: "6", name: "a user-home location may be any path", edits: [one(DL, HOME_SHAPE, 'if (className === "user-home store") return /.+/.test(location)')], tests: [T_DEL], expectRed: [R_2781] },
	{ n: "7", name: "a CI record location may be anything", edits: [one(DL, CI_SHAPE, "return true;")], tests: [T_DEL], expectRed: [R_2781] },
	{ n: "8", name: "a tracked location may start with a wildcard segment", edits: [one(DL, FIRST_SEGMENT, 'if (segments.includes("..")) return false;')], tests: [T_DEL], expectRed: [R_2781] },
	{ n: "9", name: "a tracked entry matching nothing at HEAD gets no note", edits: [one(DL, MATCHES_NOTHING, "if (false) notes.push(")], tests: [T_DEL], expectRed: [R_2782] },
	{ n: "10", name: "a tracked glob matches across path segments by prefix", edits: [one(DL, GLOB_MATCH, '[...tracked].some((path) => path.startsWith(location.split("*")[0]))')], tests: [T_DEL], expectRed: [R_2782] },
	{ n: "11", name: "an untracked or folder writer gets no note", edits: [one(DL, WRITER_TRACKED, "for (const writer of writers) if (false)")], tests: [T_DEL], expectRed: [R_2782] },
	{ n: "12", name: "a second entry at the same class and location gets no note", edits: [one(DL, DUPLICATE, "if (false) notes.push(")], tests: [T_DEL], expectRed: [R_2782] },
	{ n: "13", name: "a manual entry with no reason gets no note", edits: [one(DL, REASON, "void 0;")], tests: [T_DEL], expectRed: [R_2782] },
	{ n: "14", name: "a named reference ignores the entry's run", edits: [one(DL, RUN_BIND, "if (false) problems.push(")], tests: [T_DEL], expectRed: [R_2783] },
	{ n: "15", name: "a named reference needs only one shared writer, not every writer", edits: [one(DL, EVERY_WRITER, "const missingWriters = entry.writers.some((writer) => codePaths.includes(writer)) ? [] : entry.writers;")], tests: [T_DEL], expectRed: [R_2783] },
	{ n: "16", name: "a named reference ignores the writers entirely", edits: [one(DL, EVERY_WRITER, "const missingWriters = [];")], tests: [T_DEL], expectRed: [R_2783] },
	{ n: "17", name: "a built-from list is bound by run and writer like a named reference", edits: [one(DL, NAMED_ONLY, "if (true) {")], tests: [T_DEL], expectRed: [R_2783] },
	{ n: "18", name: "a valid registry reference also goes through the not-tracked path check", edits: [one(DL, REFERENCE_BRANCH, 'if (reference) {\n            addPath(row, thirdPart, field.line, "artifact");\n            for (const id of reference.ids) {')], tests: [T_DEL], expectRed: [R_2783] },
	{ n: "19", name: "a plain-path third part in a ledger with a registry falls back to the path check", edits: [one(DL, PLAIN_PATH, "} else if (false) {")], tests: [T_DEL], expectRed: [R_2784] },
	{ n: "20", name: "the repository ledger keeps a plain path on parked R-509", edits: [one(LEDGER, R509_CLAIM, "Made by: R-509 · manual: someone starts a paid study, or a free dry run, with node apps/bench/run.mjs by hand · apps/bench/studies/tool-profiles-2026-09-08/schedule.json")], tests: [T_DEL], expectRed: [R_2784], alsoRed: [R_2730] },
	{ n: "21", name: "unparked R-873 names neither an artifact nor what it is built from", edits: [
		one(LEDGER, R873_SESSION, "Made by: R-873 · session start: packages/nana-setup/claude/hooks/nana-objective.mjs, packages/nana-pack/bin/nana-frontier-summary.mjs"),
		one(LEDGER, R873_EXTENSION, "Made by: R-873 · extension: packages/nana-pack/extensions/nana-frontier-summary.ts, packages/nana-pack/lib/frontier-summary.mjs"),
	], tests: [T_DEL], expectRed: [R_2784] },
	{ n: "22", name: "the outline drops each feature's Artifacts line", edits: [one(TREE, OUTLINE_LINE, "void artifactsByFeature;")], tests: [T_TREE], expectRed: [R_2785] },
	{ n: "23", name: "the outline field check ignores a dropped Artifacts line", edits: [one(TREE, OUTLINE_CHECK, "void expectedArtifacts;")], tests: [T_TREE], expectRed: [R_2785] },
	{ n: "24", name: "the movement report ignores a writer change", edits: [one(MOVED, WRITER_CHANGE, "void 0;")], tests: [T_MOVED], expectRed: [R_2786] },
	{ n: "25", name: "an artifact-only change prints tree movement: none", edits: [one(MOVED, NONE_GATE, 'if (rowCount === 0 && capabilityChanges.length === 0) return "tree movement: none";')], tests: [T_MOVED], expectRed: [R_2786] },
	{ n: "26", name: "the movement report ignores an entry moved to another feature", edits: [one(MOVED, MOVED_FEATURE, "void 0;")], tests: [T_MOVED], expectRed: [R_2786] },
	{ n: "27", name: "the lift refuses carried Artifact lines as field prose", edits: [one(LIFT, LIFT_LABELS, "if (!/^(Purpose|Outcome|Status|Artifact):/.test(bareLines[i])) continue;")], tests: [T_CAPK], expectRed: [R_2787] },
	{ n: "S1", name: "the lane-1 shim maps a store entry back to its old name whatever the claim's writers", edits: [one(DL, SHIM, "if (!store || entry.run !== store.run || entry.writers.length !== 1 || entry.writers[0] !== store.entryWriter || run !== store.run) return entry.location;")], tests: [T_DEL], expectRed: [R_2743] },
	{ n: "S2", name: "the gate counts no registry lines, so a registry-only ledger prints nothing", edits: [one(DL, GATE, "let fieldLineCount = 0;")], tests: [T_TREE, T_DEL], expectRed: [R_2538] },
];

process.exitCode = await runMutations({ lane: "artifact-registry", self: import.meta.url, tip: "af5dc49f", declared: DECLARED, pairs: PAIRS });
