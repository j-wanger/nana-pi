#!/usr/bin/env node
// Seat wrong-code pairs for lane page-overview (ordinary class), written by the seat 2026-10-25 at build tip ccf3ad60.
// They follow the must-meet's "Seat wrong-code pairs" list (items 1 to 46; item 31 splits into a and b because the build counts and lists unassessed features in two places).
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/page-overview-2026-10-25/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const PRM = "scripts/product-report.mjs";
const DM = "scripts/deliverables.mjs";
const PO = "packages/nana-pack/tests/product-overview.test.mjs";
const PR = "packages/nana-pack/tests/product-report.test.mjs";
const RT = "packages/nana-pack/tests/requirements-tree.test.mjs";
const R_2920 = /^R-2920: /; // R-2920
const R_2921 = /^R-2921: /; // R-2921
const R_2922 = /^R-2922: /; // R-2922
const R_2923 = /^R-2923: /; // R-2923
const R_2924 = /^R-2924: /; // R-2924
const R_2925 = /^R-2925: /; // R-2925
const R_2927 = /^R-2927: /; // R-2927
const R_2794_NEW = /^R-2794: a capability card whose list has no item /; // R-2794 (the new product-overview test, not product-report's)
const R_1019_ROUTE = /^unknown prototype hashes render the Overview/; // R-1019 (product-report.test.mjs, the renamed routing check)
const R_1019_TEXT = /^renderer inserts all dynamic strings only through text nodes/; // R-1019 (product-report.test.mjs)
const R_1570 = /^R-1570: /; // R-1570 (product-report.test.mjs)
const R_2642 = /^R-2642: /; // R-2642 (product-report.test.mjs)
const R_2639 = /^R-2639: /; // R-2639 (requirements-tree.test.mjs)
const SEAL = /^seal: the overview's stale age is 30 days/; // the seal (R-2924)
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// The source text at ccf3ad60 (plain strings, so `${...}` here is the product code's own template text).
// Broken's not-passed count line, with its trailing separator before the items line.
const NOT_PASSED_LINE = 'line(`${labels.notPassed}: ${runtimeData ? `${notPassed.length} · ${labels.failed}: ${failed} · ${labels.skippedOnly}: ${notPassed.length - failed} · ${labels.noRun}: ${noRun} · ${ages.get("overview:runtime")}` : `${labels.runtimeMissing}${runtimeReason}`}`), ';
const NOT_PASSED_ITEMS = "...idsLine(notPassed)]";
const FAIL_TEST = "uniqueFilesOf(row.evidence).some((file) => runStateOf(file)?.label === FAIL_LABEL)";
const FAILED_COUNT = `const failed = notPassed.filter((row) => ${FAIL_TEST}).length;`;
const ARTIFACT_GAPS = "const artifactGaps = consumers.filter(([, consumer]) => consumer.kinds.size === 0 && !consumer.park).map(([id]) => ({ id }));";
const STALE_FILTER = "const staleEntries = liveEntries.filter((entry) => ageDays.get(`registry:${entry.id}`) > STALE_AGE_DAYS);";
const STALE_BESIDE = " · ${labels.notMeasured}: ${notMeasured} · ${labels.unknown}: ${unmeasured.length - notMeasured}";
const WHAT_IT_DOES = "    hasDeliverables ? [line(deliverableLines[0]), ...check.byCapability.map((capability) => line(`${capability.id} · ${capabilityById.get(capability.id).label}: ${capability.countText}`))] : [line(labels.noDeliverables)],";
const STAGE_LINES = "...check.byCapability.map((capability) => line(`${capability.id} · ${capabilityById.get(capability.id).label}: ${capability.countText}`))";
const EMPTY_LIST = 'if (!cap.artifactFeatures.items.length) paragraph(card, cap.artifactFeatures.label, "none");';
// deliverables.mjs: the per-capability push the overview's Gaps and What it does read, and the non-product skip.
const BYCAP_PUSH = [
	"    byCapability.push({ id: capability.id, listed: listed.length, parked, madeAndRead,",
	"      gapRows: listed.filter((row) => !parkedRows.has(row) && !madeRows.has(row)),",
	"      countText: deliverableCountText(madeAndRead, listed.length - parked, parked) });",
].join("\n");
const BYCAP_PUSH_FIELD_PARKED = [
	"    const fieldParked = new Set(fields.filter((field) => field.label === PARKED_LABEL).map((field) => parkClaim(field.body).id).filter((row) => listedSet.has(row)));",
	"    byCapability.push({ id: capability.id, listed: listed.length, parked: fieldParked.size, madeAndRead,",
	"      gapRows: listed.filter((row) => !fieldParked.has(row) && !madeRows.has(row)),",
	"      countText: deliverableCountText(madeAndRead, listed.length - fieldParked.size, fieldParked.size) });",
].join("\n");
const NON_PRODUCT_SKIP = "      for (const field of fields) notes.push(note(`line ${field.line}: ${field.text} is outside a live Kind: product capability`));\n      continue;";
const CONSTRAINT_STAGE = "      if (capabilityKind(capability) === \"constraint\") byCapability.push({ id: capability.id, listed: 0, parked: 0, madeAndRead: 0, gapRows: [], countText: deliverableCountText(0, 0, 0) });\n";

const DECLARED = [
	"(seat) pairs 1 to 46 follow the must-meet's seat wrong-code list in order, one pair per item, except item 31, which splits; each names the rows the must-meet says it turns red",
	"(seat) item 31 splits: 31a drops the unassessed count from the assessment count line; 31b drops unassessed features from the linked list under it. The build counts them in one place and lists them in another, so the item's 'left out of the assessment count' has two one-place forms",
	"(seat) pair 7 names every overview check (R-2920 to R-2925 and R-2927), as the must-meet's 'and every overview check' says; R-2794's check renders #product and the seal renders nothing, so neither is named",
	"(seat) pair 8: the renderer draws every overview line through one loop with no notion of which line is the blocking ask, so the pair draws every overview line, the blocking-ask line among them, with innerHTML; it runs product-report.test.mjs only, where R-1019's text-node check lives",
	"(seat) pair 27 computes days from Date.now() in the tracked formatter, the one the fixture's boundary entry (A-002) reaches; pair 28 is one edit in the shared setAge helper, which records days only for text that starts with the tracked prefix, so the runtime and record formatters lose their days together",
	"(seat) pairs 37 to 42 replace a guard's condition with `true`, so the guarded form always prints; pair 41 moves the stage lines outside the field-line guard in one edit",
	"(seat) pair 21 is one contiguous edit in deliverables.mjs: the per-capability push takes its parked set from the listed rows any Parked: line names, in place of parkedRows, so a code-made and read row with a Parked: line (R-2641) counts parked on the stage and gap lines only; the checker's count line keeps parkedRows",
	"(seat) pair 35 gives a constraint capability a stage line by pushing a zero byCapability entry in the non-product skip of checkDeliverables",
	"(expected survivor, run) pair 11: run green end to end at ccf3ad60 (SURVIVED, product-overview.test.mjs 9 PASS); R-2921's fixture has one optional ask and one parked ask, so swapping their counts prints the same line; the must-meet's red 'kinds ... swapped' is unpinned for equal counts",
	"(macOS) none is Windows-only, as the must-meet says",
	"(product code) every pair edits product code: scripts/product-report.mjs or scripts/deliverables.mjs; no pair edits a test file or the ledger",
	"(not expressible) none of the 46 items; as the must-meet says, the closed-question move is ledger text and pair 12 covers the parse it relies on",
	"(seat) no alsoRed is declared: the table was written before any full run. Expected UNNAMED reds (inferred, not run): pair 1 also R-2921 to R-2925 and R-2927 (an empty hash renders Decisions, so their block lines read empty); pair 13 also R-2927 (its not-passed line is gone); pair 21 none beyond its two; pair 45 none in its two files",
];

const PAIRS = [
	{ n: "1", name: "views[\"\"] back to \"decisions\"", edits: [one(PRM, 'const views = { "": "overview",', 'const views = { "": "decisions",')], tests: [PO], expectRed: [R_2920] },
	{ n: "2", name: "the unknown-hash fallback back to \"decisions\"", edits: [one(PRM, '? "detail" : "overview";', '? "detail" : "decisions";')], tests: [PO, PR], expectRed: [R_2920, R_1019_ROUTE] },
	{ n: "3", name: "a \"#shared\": \"shared\" entry put back in views", edits: [one(PRM, '"#features": "features", "#issues": "issues"', '"#features": "features", "#shared": "shared", "#issues": "issues"')], tests: [PO], expectRed: [R_2920] },
	{ n: "4", name: "nav lists Decisions before Overview", edits: [one(PRM, '[["Overview", "#overview", "overview"], ["Decisions", "#decisions", "decisions"],', '[["Decisions", "#decisions", "decisions"], ["Overview", "#overview", "overview"],')], tests: [PO], expectRed: [R_2920] },
	{ n: "5", name: "two OVERVIEW_BLOCKS entries swapped", edits: [one(PRM, 'Object.freeze(["Needs you", "#decisions"]), Object.freeze(["Broken", "#issues"]),', 'Object.freeze(["Broken", "#issues"]), Object.freeze(["Needs you", "#decisions"]),')], tests: [PO], expectRed: [R_2920] },
	{ n: "6", name: "one block's href changed to #product", edits: [one(PRM, 'Object.freeze(["Broken", "#issues"])', 'Object.freeze(["Broken", "#product"])')], tests: [PO], expectRed: [R_2920] },
	{ n: "7", name: "the renderer reads OVERVIEW_BLOCKS from module scope in place of the model", edits: [one(PRM, "    for (const block of model.overview) {", "    for (const block of OVERVIEW_BLOCKS.map(([heading, href], index) => ({ heading, href, lines: model.overview[index].lines }))) {")], tests: [PO], expectRed: [R_2920, R_2921, R_2922, R_2923, R_2924, R_2925, R_2927] },
	{ n: "8", name: "the overview's lines, the blocking-ask line among them, drawn with innerHTML", edits: [one(PRM, '      for (const line of block.lines) renderSegments(el("li", undefined, list), line);', '      for (const line of block.lines) el("li", undefined, list).innerHTML = line.map((segment) => segment.text ?? segment.feature.label).join("");')], tests: [PR], expectRed: [R_1019_TEXT] },
	{ n: "9", name: "Needs you lists every ask's title", edits: [one(PRM, "...blocking.map((ask) =>", "...asks.map((ask) =>")], tests: [PO], expectRed: [R_2921] },
	{ n: "10", name: "Needs you sorts blocking asks by since-date", edits: [one(PRM, "...blocking.map((ask) =>", "...[...blocking].sort((left, right) => left.tag.since.localeCompare(right.tag.since)).map((ask) =>")], tests: [PO], expectRed: [R_2921] },
	{ n: "11", name: "optional and parked counts swapped in the count line", edits: [one(PRM, '${labels.optional}: ${kindCount("optional")} · ${labels.parked}: ${kindCount("parked")}', '${labels.optional}: ${kindCount("parked")} · ${labels.parked}: ${kindCount("optional")}')], tests: [PO], expectRed: [R_2921] },
	{ n: "12", name: "parseOpenQuestions breaks only on `# ` (level one)", edits: [one(PRM, '    if (line.startsWith("#")) break;', '    if (line.startsWith("# ")) break;')], tests: [PO, PR], expectRed: [R_2921, R_1570] },
	{ n: "13", name: "Broken drops the not-passed line", edits: [one(PRM, NOT_PASSED_LINE, "")], tests: [PO], expectRed: [R_2922] },
	{ n: "14", name: "the overview's not-passed list filters on didNotPass without the implemented status test", edits: [one(PRM, NOT_PASSED_ITEMS, "...idsLine(rows.filter((row) => didNotPass(uniqueFilesOf(row.evidence).map(runStateOf))))]")], tests: [PO], expectRed: [R_2922] },
	{ n: "15", name: "the not-passed items line left out", edits: [one(PRM, `, ${NOT_PASSED_ITEMS}`, "]")], tests: [PO], expectRed: [R_2922] },
	{ n: "16", name: "the overview's not-passed list keeps only rows with a FAIL label", edits: [one(PRM, NOT_PASSED_ITEMS, `...idsLine(notPassed.filter((row) => ${FAIL_TEST}))]`)], tests: [PO], expectRed: [R_2922] },
	{ n: "17", name: "the split counts every row as skipped only", edits: [one(PRM, FAILED_COUNT, "const failed = 0;")], tests: [PO], expectRed: [R_2922] },
	{ n: "18", name: "the no-recorded-run count drops the implemented status test", edits: [one(PRM, '    if (row.status !== "implemented") return false;\n', "")], tests: [PO], expectRed: [R_2922] },
	{ n: "19", name: "the runtime age text left off the not-passed line", edits: [one(PRM, ' · ${ages.get("overview:runtime")}', "")], tests: [PO], expectRed: [R_2922] },
	{ n: "20", name: "deliverable gaps taken as listed rows not made and read, ignoring parkedRows", edits: [one(DM, "gapRows: listed.filter((row) => !parkedRows.has(row) && !madeRows.has(row)),", "gapRows: listed.filter((row) => !madeRows.has(row)),")], tests: [PO], expectRed: [R_2923] },
	{ n: "21", name: "stage and gap parked rows taken from the presence of a Parked: field line", edits: [one(DM, BYCAP_PUSH, BYCAP_PUSH_FIELD_PARKED)], tests: [PO], expectRed: [R_2923, R_2925] },
	{ n: "22", name: "artifact gaps from the page's readIds and referencesFor join", edits: [one(PRM, ARTIFACT_GAPS, "const artifactGaps = registry.entries.filter((entry) => entry.live && !reads.reads.some((read) => read.id === entry.id) && referencesFor(entry.id).length === 0).sort((left, right) => left.id.localeCompare(right.id)).map((entry) => ({ id: entry.id }));")], tests: [PO], expectRed: [R_2923] },
	{ n: "23", name: "the parked entry count dropped from Gaps", edits: [one(PRM, "${artifactGaps.length} · ${labels.parked}: ${artifactParked}", "${artifactGaps.length}")], tests: [PO], expectRed: [R_2923] },
	{ n: "24", name: "the deliverable note count dropped", edits: [one(PRM, " · ${labels.notes}: ${check.notes.length}", "")], tests: [PO], expectRed: [R_2923] },
	{ n: "25", name: "artifact gaps in registry order (no sort)", edits: [one(PRM, "const consumers = [...check.artifactConsumers].sort(([left], [right]) => left.localeCompare(right));", "const consumers = [...check.artifactConsumers];")], tests: [PO], expectRed: [R_2923] },
	{ n: "26", name: "Stale compares with >=", edits: [one(PRM, "ageDays.get(`registry:${entry.id}`) > STALE_AGE_DAYS", "ageDays.get(`registry:${entry.id}`) >= STALE_AGE_DAYS")], tests: [PO], expectRed: [R_2924] },
	{ n: "27", name: "stale days computed from Date.now() (the tracked formatter)", edits: [one(PRM, "const days = wholeDays(headEpoch, record.epoch);", "const days = wholeDays(Date.now() / 1000, record.epoch);")], tests: [PO], expectRed: [R_2924] },
	{ n: "28", name: "days recorded only for the tracked formatter's ages", edits: [one(PRM, "else { ages.set(key, age.text); ageDays.set(key, age.days); }", "else { ages.set(key, age.text); if (age.text.startsWith(LAST_CHANGED_PREFIX)) ageDays.set(key, age.days); }")], tests: [PO], expectRed: [R_2924] },
	{ n: "29", name: "the not-measured and unknown counts merged into one", edits: [one(PRM, STALE_BESIDE, " · ${labels.notMeasured}: ${unmeasured.length}")], tests: [PO], expectRed: [R_2924] },
	{ n: "30", name: "the beside counts printed only when the stale count is not 0", edits: [one(PRM, "`${staleEntries.length}" + STALE_BESIDE + "`", "`${staleEntries.length}${staleEntries.length ? `" + STALE_BESIDE + "` : ''}`")], tests: [PO], expectRed: [R_2924] },
	{ n: "31a", name: "unassessed features left out of the assessment count line", edits: [one(PRM, " · ${labels.unassessed}: ${unassessed.length}", "")], tests: [PO], expectRed: [R_2924] },
	{ n: "31b", name: "unassessed features left out of the assessment list", edits: [one(PRM, 'const assessmentItems = liveFeatures.filter((feature) => feature.assessmentState === "out of date" || feature.assessmentState === "unassessed");', "const assessmentItems = outdated;")], tests: [PO], expectRed: [R_2924] },
	{ n: "32", name: "the liveFeature filter dropped", edits: [one(PRM, "const liveFeatures = features.filter(liveFeature);", "const liveFeatures = features;")], tests: [PO], expectRed: [R_2924] },
	{ n: "33", name: "feature IDs printed as text, not links", edits: [one(PRM, "featureIds.push(featureSegment(feature.id));", "featureIds.push({ text: feature.id });")], tests: [PO], expectRed: [R_2924] },
	{ n: "34", name: "stale entries sorted by days", edits: [one(PRM, STALE_FILTER, STALE_FILTER.replace(/;$/, ".sort((left, right) => ageDays.get(`registry:${right.id}`) - ageDays.get(`registry:${left.id}`));"))], tests: [PO], expectRed: [R_2924] },
	{ n: "35", name: "a constraint capability gets a stage line", edits: [one(DM, NON_PRODUCT_SKIP, NON_PRODUCT_SKIP.replace("      continue;", `${CONSTRAINT_STAGE}      continue;`))], tests: [PO], expectRed: [R_2925] },
	{ n: "36", name: "the checker count line left out of What it does", edits: [one(PRM, "hasDeliverables ? [line(deliverableLines[0]), ...check.byCapability", "hasDeliverables ? [...check.byCapability")], tests: [PO], expectRed: [R_2925] },
	{ n: "37", name: "the runtime guard dropped from the not-passed line", edits: [one(PRM, "${runtimeData ? `${notPassed.length} · ", "${true ? `${notPassed.length} · ")], tests: [PO], expectRed: [R_2927] },
	{ n: "38", name: "the registry guard dropped from the artifact gap line", edits: [one(PRM, "artifacts.hasRegistry ? `${artifactGaps.length}", "true ? `${artifactGaps.length}")], tests: [PO], expectRed: [R_2927] },
	{ n: "39", name: "the registry guard dropped from the stale artifact line", edits: [one(PRM, "artifacts.hasRegistry ? `${staleEntries.length}", "true ? `${staleEntries.length}")], tests: [PO], expectRed: [R_2927] },
	{ n: "40", name: "What it does takes deliverableLines[0] without the field-line guard", edits: [one(PRM, "    hasDeliverables ? [line(deliverableLines[0])", "    true ? [line(deliverableLines[0])")], tests: [PO], expectRed: [R_2927] },
	{ n: "41", name: "stage lines printed when the count line is absent", edits: [one(PRM, WHAT_IT_DOES, `    [...(hasDeliverables ? [line(deliverableLines[0])] : [line(labels.noDeliverables)]), ${STAGE_LINES}],`)], tests: [PO], expectRed: [R_2927] },
	{ n: "42", name: "the deliverable gap line's guard dropped", edits: [one(PRM, "hasDeliverables ? `${deliverableGaps.length}", "true ? `${deliverableGaps.length}")], tests: [PO], expectRed: [R_2927] },
	{ n: "43", name: "an empty list renders its label over an empty list", edits: [one(PRM, EMPTY_LIST, 'if (false) paragraph(card, cap.artifactFeatures.label, "none");')], tests: [PO], expectRed: [R_2794_NEW] },
	{ n: "44", name: "an empty list renders nothing", edits: [one(PRM, EMPTY_LIST, "if (!cap.artifactFeatures.items.length) { /* nothing */ }")], tests: [PO], expectRed: [R_2794_NEW] },
	{ n: "45", name: "the suffix back to `, <n> parked`", edits: [one(DM, '${parked ? `, ${parked} more parked` : ""}', '${parked ? `, ${parked} parked` : ""}')], tests: [RT, PR], expectRed: [R_2639, R_2642] },
	{ n: "46", name: "STALE_AGE_DAYS retuned to 31", edits: [one(PRM, "export const STALE_AGE_DAYS = 30;", "export const STALE_AGE_DAYS = 31;")], tests: [PO], expectRed: [SEAL, R_2924] },
];

process.exitCode = await runMutations({ lane: "page-overview", self: import.meta.url, tip: "ccf3ad60", declared: DECLARED, pairs: PAIRS });
