#!/usr/bin/env node
// Seat wrong-code pairs for lane report-names-artifacts (ordinary), written by the seat 2026-10-24 after build 1 at 809d0571, re-run after builds 2 and 3.
// They follow the must-meet rows' red cases (R-2790 to R-2794), the renamed R-2542 note and the old store names as plain paths.
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/report-names-artifacts-2026-10-24/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const PR = "scripts/product-report.mjs";
const DL = "scripts/deliverables.mjs";
const SR = "packages/nana-pack/lib/suite-records-config.mjs";
const LEDGER = "REQUIREMENTS.md";
const T_PR = "packages/nana-pack/tests/product-report.test.mjs";
const T_DEL = "packages/nana-pack/tests/requirements-deliverables.test.mjs";
const R_2790 = /^R-2790: /; // R-2790
const R_2791 = /^R-2791: /; // R-2791
const R_2792 = /^R-2792: /; // R-2792
const R_2793 = /^R-2793: /; // R-2793
const R_2794 = /^R-2794: /; // R-2794
const R_2542 = /^R-2542: /; // R-2542, the not-written-down note's literal
const R_2536 = /^a maker or reader path not tracked at HEAD gets one note naming the row and the path/; // R-2536, the old store names are plain paths
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// scripts/product-report.mjs
const BUILT_LINE = 'lines.push(`${directIds.length ? "" : "output only, "}built from ${parts.join(", ")}`);';
const DEDUPE = "for (const id of [...claim.registryIds].sort()) if (!seen.has(id)) { seen.add(id); ids.push(id); }";
const DIRECT_MAP = "const lines = directIds.map((id) => {";
const DIRECT_AGE = "return entry?.live ? `artifact ${id} · ${entry.name} · ${ages.get(`registry:${id}`) ?? unknownAge(GIT_HISTORY_FAILURE_REASON)}` : `artifact ${id} · no live entry`;";
const KIND = 'for (const claim of claims) if (claim.label === "Made by" && claim.registryKind === kind) {';
const NO_ARTIFACT = 'export const NO_ARTIFACT_NAMED = "artifact not written down";';
const TABLE_KEY = "const tableKey = artifactAgeTableKey(artifact);";
const TRACKED_ONLY = 'if (artifact.className === "tracked") ageable.push(artifact);';
const UNMEASURED = "} else ages.set(artifact.key, `${AGE_NOT_MEASURED_PREFIX}${artifact.className}`);";
const GLOB = "if (!artifact.plain && /[*?]/.test(location)) return globMatch(location, file);";
const FILE_MATCH = "return file === location || file.startsWith(`${location}/`);";
const LIVE_FEATURE = 'const liveFeature = (feature) => feature.status === "active" || feature.status.startsWith("frozen (");';
const HOME_FILTER = "&& !feature.ownRowIds.some((id) => deliverableSet.has(id))";
const LIVE_ENTRY = "registry.entries.filter((entry) => entry.live && entry.featureId === feature.id)";
const NO_REGISTRY = 'registry.fieldLineCount === 0 ? "no artifact registry" : ';
const CONSTRAINT = '} else if (!retired && kind === "constraint") {';
const PRODUCT = 'if (!retired && kind === "product") {';
const READER_KEYS = "export const STORE_READERS_BY_KEY = Object.freeze(Object.fromEntries(Object.entries(ARTIFACT_AGE_TABLE).map(([key, binding]) => [key, STORE_READERS_BY_WRITER[binding.writer]])));";

// scripts/deliverables.mjs
const BIND_NOTE = 'if (entry.live && entry.className === "clone store" && Object.hasOwn(ARTIFACT_AGE_TABLE, entry.location) && artifactAgeTableKey(entry) === null) {';
const PREDICATE = "return binding && entry.run === binding.run && entry.writers.length === 1 && entry.writers[0] === binding.writer ? entry.location : null;";
const PLAIN_PATH = 'addPath(row, thirdPart, field.line, "artifact");';

// packages/nana-pack/lib/suite-records-config.mjs
const SUITE_SUBPATH = 'export const STORE_SUBPATH = "nana/suite-runs";';

// REQUIREMENTS.md
const A033 = "Artifact: A-033 · suite run records · clone store: <git common dir>/nana/suite-runs · suite: packages/nana-pack/lib/suite-records.mjs";

const DECLARED = [
	"(seat) pairs 1 to 8 follow R-2790's red cases and the renamed R-2542 literal; 9 to 12 R-2791's; 13 to 16 R-2792's; 17 to 22 R-2793's, one a ledger edit and one a store-constant change; 23 to 28 R-2794's; 29 the old store names as plain paths (R-2536)",
	"(seat) after build 1 at 809d0571: pair 2 survived (the R-2790 test read only the start of the built-from line, so a repeated ID passed) and went to build 2; shard 4 never judged its six pairs because pair 29 named R-2536 by its row ID, while its test title carries no ID (seat slip, fixed here); pair 5 is red by a crash, which is the red case itself",
	"(seat) after build 2 at dd038e0b: 28 of 29 red; pair 19 survived (no case puts a two-writer entry at a table location, so R-2793's 'exactly one writer' clause was unpinned) and went to build 3",
	"(seat) declared non-pairs: 'a reader of tag dates changes the page' (no tag reader exists to break; the R-2791 test adds a tag between its two runs), 'the registry is parsed once per ledger' (a speed rule with no behaviour to pin), and 'ages move off the claim lines' (R-2790's test asserts no claim line carries an age; the build removed the age field from claims, so no one-line mutation restores it)",
];

const PAIRS = [
	{ n: "1", name: "a deliverable that names an entry hides its built-from line", edits: [one(PR, BUILT_LINE, 'if (!directIds.length) lines.push(`output only, built from ${parts.join(", ")}`);')], tests: [T_PR], expectRed: [R_2790] },
	{ n: "2", name: "an ID repeated across claims is listed twice", edits: [one(PR, DEDUPE, "for (const id of [...claim.registryIds].sort()) ids.push(id);")], tests: [T_PR], expectRed: [R_2790] },
	{ n: "3", name: "a two-entry claim shows one artifact line", edits: [one(PR, DIRECT_MAP, "const lines = directIds.slice(0, 1).map((id) => {")], tests: [T_PR], expectRed: [R_2790] },
	{ n: "4", name: "every named entry shows the first entry's age", edits: [one(PR, DIRECT_AGE, "return entry?.live ? `artifact ${id} · ${entry.name} · ${ages.get(`registry:${directIds[0]}`) ?? unknownAge(GIT_HISTORY_FAILURE_REASON)}` : `artifact ${id} · no live entry`;")], tests: [T_PR], expectRed: [R_2790] },
	{ n: "5", name: "a claim naming an unknown ID stops the page", edits: [one(PR, DIRECT_AGE, "return `artifact ${id} · ${entry.name} · ${ages.get(`registry:${id}`) ?? unknownAge(GIT_HISTORY_FAILURE_REASON)}`;")], tests: [T_PR], expectRed: [R_2790] },
	{ n: "6", name: "a built-from list shows as named artifacts", edits: [one(PR, KIND, 'for (const claim of claims) if (claim.label === "Made by" && (claim.registryKind === kind || kind === "artifact")) {')], tests: [T_PR], expectRed: [R_2790] },
	{ n: "7", name: "an output-only deliverable loses its output-only prefix", edits: [one(PR, BUILT_LINE, 'lines.push(`built from ${parts.join(", ")}`);')], tests: [T_PR], expectRed: [R_2790] },
	{ n: "8", name: "the not-written-down note keeps the old wording", edits: [one(PR, NO_ARTIFACT, 'export const NO_ARTIFACT_NAMED = "no artifact named";')], tests: [T_PR], expectRed: [R_2542] },
	{ n: "9", name: "a clone store at a table location earns its age whatever its run and writer", edits: [one(PR, TABLE_KEY, "const tableKey = Object.hasOwn(ARTIFACT_AGE_TABLE, artifact.location) ? artifact.location : null;")], tests: [T_PR], expectRed: [R_2791] },
	{ n: "10", name: "a home store is aged like a tracked path", edits: [one(PR, TRACKED_ONLY, 'if (artifact.className === "tracked" || artifact.className === "user-home store") ageable.push(artifact);')], tests: [T_PR], expectRed: [R_2791] },
	{ n: "11", name: "an unageable entry shows what its home file holds", edits: [one(PR, UNMEASURED, '} else ages.set(artifact.key, `${AGE_NOT_MEASURED_PREFIX}${artifact.className}${(() => { try { return " " + readFileSync(path.join(process.env.HOME ?? "", String(artifact.location).slice(2)), "utf8").trim(); } catch { return ""; } })()}`);')], tests: [T_PR], expectRed: [R_2791] },
	{ n: "12", name: "an unageable entry drops its class from the reason", edits: [one(PR, UNMEASURED, '} else ages.set(artifact.key, "age not measured");')], tests: [T_PR], expectRed: [R_2791] },
	{ n: "13", name: "a tracked glob is never matched as a glob", edits: [one(PR, GLOB, "void globMatch;")], tests: [T_PR], expectRed: [R_2792] },
	{ n: "14", name: "a tracked glob matches across path segments by prefix", edits: [one(PR, GLOB, 'if (!artifact.plain && /[*?]/.test(location)) return file.startsWith(location.split("*")[0]);')], tests: [T_PR], expectRed: [R_2792] },
	{ n: "15", name: "a plain-path third part is read as a glob", edits: [one(PR, GLOB, "if (/[*?]/.test(location)) return globMatch(location, file);")], tests: [T_PR], expectRed: [R_2792] },
	{ n: "16", name: "a single-file tracked entry matches nothing", edits: [one(PR, FILE_MATCH, "return file.startsWith(`${location}/`);")], tests: [T_PR], expectRed: [R_2792] },
	{ n: "17", name: "the checker gives no note for a clone store at a table location under another run or writer", edits: [one(DL, BIND_NOTE, "if (false) {")], tests: [T_DEL], expectRed: [R_2793] },
	{ n: "18", name: "the binding ignores run and writer", edits: [one(DL, PREDICATE, "return binding ? entry.location : null;")], tests: [T_DEL, T_PR], expectRed: [R_2793, R_2791] },
	{ n: "19", name: "the binding accepts any writer list that starts with the table's writer", edits: [one(DL, PREDICATE, "return binding && entry.run === binding.run && entry.writers[0] === binding.writer ? entry.location : null;")], tests: [T_DEL], expectRed: [R_2793] },
	{ n: "20", name: "the suite store's subpath changes and the ledger keeps the old location", edits: [one(SR, SUITE_SUBPATH, 'export const STORE_SUBPATH = "nana/suite-runs-moved";')], tests: [T_DEL], expectRed: [R_2793] },
	{ n: "21", name: "A-033 moves off its table key", edits: [one(LEDGER, A033, "Artifact: A-033 · suite run records · clone store: <git common dir>/nana/suite-run · suite: packages/nana-pack/lib/suite-records.mjs")], tests: [T_DEL], expectRed: [R_2793] },
	{ n: "22", name: "the page keeps a reader at a location the table lacks", edits: [one(PR, READER_KEYS, 'export const STORE_READERS_BY_KEY = Object.freeze({ ...Object.fromEntries(Object.entries(ARTIFACT_AGE_TABLE).map(([key, binding]) => [key, STORE_READERS_BY_WRITER[binding.writer]])), "<git common dir>/nana/product-report.html": () => ({ records: [] }) });')], tests: [T_DEL], expectRed: [R_2793] },
	{ n: "23", name: "frozen features drop out of the card lists", edits: [one(PR, LIVE_FEATURE, 'const liveFeature = (feature) => feature.status === "active";')], tests: [T_PR], expectRed: [R_2794] },
	{ n: "24", name: "a feature that is home to a deliverable is listed as having none", edits: [one(PR, HOME_FILTER, "")], tests: [T_PR], expectRed: [R_2794] },
	{ n: "25", name: "a retired entry is listed under its feature", edits: [one(PR, LIVE_ENTRY, "registry.entries.filter((entry) => entry.featureId === feature.id)")], tests: [T_PR], expectRed: [R_2794] },
	{ n: "26", name: "a ledger with no registry says makes no registered artifact", edits: [one(PR, NO_REGISTRY, "")], tests: [T_PR], expectRed: [R_2794] },
	{ n: "27", name: "a constraint card shows no artifact list", edits: [one(PR, CONSTRAINT, "} else if (false) {")], tests: [T_PR], expectRed: [R_2794] },
	{ n: "28", name: "a kindless card shows the product list", edits: [one(PR, PRODUCT, 'if (!retired && kind !== "constraint") {')], tests: [T_PR], expectRed: [R_2794] },
	{ n: "29", name: "the old store names stay exempt from the path check in a ledger with no registry", edits: [one(DL, PLAIN_PATH, 'if (!["runtime-map", "suite-runs", "build-records"].includes(thirdPart)) addPath(row, thirdPart, field.line, "artifact");')], tests: [T_DEL], expectRed: [R_2536] },
];

process.exitCode = await runMutations({ lane: "report-names-artifacts", self: import.meta.url, tip: "dd038e0b", declared: DECLARED, pairs: PAIRS });
