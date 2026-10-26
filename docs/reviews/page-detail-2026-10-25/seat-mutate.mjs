#!/usr/bin/env node
// Seat wrong-code pairs for lane page-detail (ordinary class), written for the seat 2026-10-26 at build tip 00c171ae.
// They follow the must-meet's "Seat wrong-code pairs" list (items 1 to 49; item 45 splits into a and b because the Overview builds its gap IDs and its stale items in two places).
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/page-detail-2026-10-25/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const PRM = "scripts/product-report.mjs";
const DM = "scripts/deliverables.mjs";
const RTM = "scripts/requirements-tree.mjs";
const PD = "packages/nana-pack/tests/product-detail.test.mjs";
const PO = "packages/nana-pack/tests/product-overview.test.mjs";
const PR = "packages/nana-pack/tests/product-report.test.mjs";
const R_2930 = /^R-2930: /; // R-2930
const R_2931 = /^R-2931: /; // R-2931
const R_2932 = /^R-2932: /; // R-2932
const R_2933 = /^R-2933: /; // R-2933
const R_2923 = /^R-2923: /; // R-2923 (product-overview.test.mjs)
const R_2924 = /^R-2924: /; // R-2924 (product-overview.test.mjs)
const R_2542 = /^R-2542: /; // R-2542 (product-report.test.mjs)
const R_2543 = /^R-2543: /; // R-2543 (product-report.test.mjs)
const R_2544 = /^R-2544: /; // R-2544 (product-report.test.mjs)
const R_2545 = /^R-2545: /; // R-2545 (product-report.test.mjs)
const R_2642 = /^R-2642: /; // R-2642 (product-report.test.mjs)
const R_2744 = /^R-2744: /; // R-2744 (product-report.test.mjs)
const R_2745 = /^R-2745: /; // R-2745 (product-report.test.mjs)
const R_2790 = /^R-2790: /; // R-2790 (product-report.test.mjs)
const R_2791 = /^R-2791: /; // R-2791 (product-report.test.mjs)
const R_2792 = /^R-2792: /; // R-2792 (product-report.test.mjs)
const R_2799 = /^R-2799: /; // R-2799 (product-report.test.mjs)
const R_2801 = /^R-2801: /; // R-2801 (product-report.test.mjs)
const R_1019_TEXT = /^renderer inserts all dynamic strings only through text nodes/; // R-1019 (product-report.test.mjs)
const AGE_ROWS = [R_2544, R_2545, R_2744, R_2745, R_2791, R_2792];
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// The source text at 00c171ae (plain strings, so `${...}` here is the product code's own template text).
// Product view item and the home feature's block, looked up inside the Product branch (pairs 1 and 2).
const PRODUCT_ITEM = "renderSegments(item, deliverable.segments);";
const HOME_BLOCK = 'const block = model.features.find((owner) => owner.id === deliverable.home.id)?.detailSections?.flatMap((section) => section.blocks ?? []).find((candidate) => candidate.heading.startsWith(`${deliverable.id} · `));';
// Reader part (pairs 3 to 5).
const READERS_SET = "[...new Set(rowClaims.map((claim) => claim.readerKind).filter((kind) => kind !== null))]";
const READERS_LIST = "rowClaims.map((claim) => claim.readerKind).filter((kind) => kind !== null)";
const IMPORT_DELIVERABLES = 'deliverableClaims, deliverableCodeState, deliverableReport } from "./deliverables.mjs";';
// deliverables.mjs readerKind (pairs 6 and 7).
const READER_KIND_DETAIL = "READER_SET.has(kind) && detail.length > 0 ? kind : null;";
const READER_KIND_PARTS = 'const readerKind = field.label === "Read by" && parts.length === 2 && ';
// Parked part and marks (pairs 8 to 11).
const PARKED = "const parked = !(codeState.madeByCode && codeState.readByCode) && !gapRows.includes(id);";
const PARKED_PART = '${parked ? ` · ${OVERVIEW_LABELS.parked}` : ""}';
const MARKS_PART = '${marks.map((mark) => ` · ${mark}`).join("")}';
// Age part (pairs 12 to 19).
const DAYS_RETURN = 'if (days.length) return plural(Math.max(...days), "day");';
const NAMED_REGISTRY = '...(claim.registryKind === "artifact" ? claim.registryIds.map((id) => `registry:${id}`) : []),';
const NAMED_PATH = "      ...(claim.artifact ? [`path:${claim.artifact}`] : []),\n";
const DAYS_FILTER = "const days = named.filter((key) => ageDays.has(key)).map((key) => ageDays.get(key));";
const UNMEASURED_PICK = "? OVERVIEW_LABELS.notMeasured : OVERVIEW_LABELS.unknown;";
// Detail sections (pairs 20 to 28, 30, 31, 36, 46 to 48).
const BLOCK_PUSH = "section.blocks.push({ heading, claims: rowClaims.map(({ label, text }) => ({ label, text })), artifactLines: artifactLinesFor(rowClaims, homeFeature.id) });";
const READS_LINE_END = 'cls(p, "feature-artifact-line"); renderSegments(p, line.segments); }';
const SECTIONS_LOOP = "for (const section of feature.detailSections ?? []) {";
const SECTIONS_COPY = [
	"for (const section of feature.detailSections ?? []) { el(\"h3\", section.heading, root);",
	" for (const block of section.blocks ?? []) { const article = el(\"article\", undefined, root); cls(article, \"deliverable-block\"); el(\"h3\", block.heading, article);",
	" if (block.claims.length) { const claims = el(\"ul\", undefined, article); cls(claims, \"deliverable-claims\"); for (const claim of block.claims) { const item = el(\"li\", undefined, claims); text(item, `${claim.label}: ${claim.text}`); } }",
	" for (const line of block.artifactLines) { const p = el(\"p\", undefined, article); cls(p, \"deliverable-artifact\"); renderSegments(p, line); } }",
	" for (const entry of section.cards ?? []) { const card = el(\"article\", undefined, root); cls(card, \"artifact-entry-card\"); el(\"h3\", entry.heading, card); for (const line of entry.lines) { const p = el(\"p\", undefined, card); renderSegments(p, line.segments); } } }",
].join("");
const HOME_WALK = '      while (homeHeading && !homeHeading.id.startsWith("FEAT-")) homeHeading = homeHeading.parent;\n';
const CARD_PUSH = "section.cards.push({ heading: `${entry.id} · ${entry.name}`, lines });";
const CARDS_END = "    }\n    artifacts = {\n      hasRegistry: true,";
const CARD_LINE = 'for (const line of entry.lines) { const p = el("p", undefined, card); renderSegments(p, line.segments); }';
const CARD_MADE_BY = "{ segments: [{ text: `Made by: ${entry.run}: ${makerDetail}` }] },";
const CARD_MADE_IN = "{ segments: [{ text: \"Made in: \" }, featureSegment(entry.featureId, `${entry.featureId} · ${featureHeadingById.get(entry.featureId).label}`), { text: ` · ${entry.run}: ${makerDetail}` }] },";
// Block artifact lines (pairs 32 to 34).
const BLOCK_MAKER = "...(entry.featureId !== homeId ? makerSegments(entry) : [])";
// Artifacts view (pairs 35, 39 to 42).
const LIST_ITEMS_END = 'renderSegments(item, value); }\n      }\n';
const CARDS_ON_ARTIFACTS = "      for (const owner of model.features) for (const section of owner.detailSections ?? []) for (const entry of section.cards ?? []) { const card = el(\"article\", undefined, root); cls(card, \"artifact-entry-card\"); el(\"h3\", entry.heading, card); for (const line of entry.lines) { const p = el(\"p\", undefined, card); renderSegments(p, line.segments); } }\n";
const LIST_ITEM = 'for (const value of listModel.items) { const item = el("li", undefined, list); renderSegments(item, value); }';
const MANUAL_ITEM_END = "· manual: ${entry.reason}` }, ...makerSegments(entry)]);";
const MANUAL_REASON = " · manual: ${entry.reason}`";
const LISTS_LOOP = "      for (const listModel of model.artifacts.lists) {";
const FLOW_RENDER = "      for (const group of model.artifacts.flowGroups ?? []) { const heading = el(\"h3\", group.heading, root); cls(heading, \"artifact-flow-pair\"); const list = el(\"ul\", undefined, root); for (const flow of group.lines) { const item = el(\"li\", undefined, list); cls(item, \"artifact-flow-line\"); renderSegments(item, flow.segments); } }\n";
const EMPTY_TEXT_NULL = "      emptyText: null,\n";
const FLOW_MODEL = "      flowGroups: (() => { const groups = new Map(); for (const entry of liveEntries) for (const read of reads.reads.filter((item) => item.id === entry.id && item.capabilityId !== entry.capabilityId)) { const key = `${entry.capabilityId} → ${read.capabilityId}`; if (!groups.has(key)) groups.set(key, { heading: key, lines: [] }); groups.get(key).lines.push({ segments: [{ text: `${entry.run} · ${entry.id} · ${entry.name} · ` }, featureSegment(entry.featureId), { text: \" → \" }, featureSegment(read.featureId)] }); } return [...groups.values()]; })(),\n";
// Overview maker links (pairs 43 to 45b).
const GAP_ID = "{ text: id }, ...makerSegments(registry.byId.get(id))]";
const STALE_ITEM_END = "days` }, ...makerSegments(entry)])";
// requirements-tree.mjs deliverable lines (pair 49).
const CHECKER_LINES = "for (const line of deliverableReportLines(parsed, ledgerFolder)) console.log(line);";
// deliverables.mjs claim gathering (pair 29): the deliverableClaims loop, two-space indented, with its next line so the four-space loop in deliverableFieldLinesByRow does not match.
const CLAIMS_LOOP = "  for (const field of ownFieldLines(parsed, capability, DELIVERABLE_LABELS)) {\n    const row = ROW_AT_START";
const CLAIMS_LOOP_ALL = "  for (const field of parsed.headings.filter((heading) => heading.id?.startsWith(\"CAP-\")).flatMap((heading) => ownFieldLines(parsed, heading, DELIVERABLE_LABELS))) {\n    const row = ROW_AT_START";

const DECLARED = [
	"(seat) pairs 1 to 49 follow the must-meet's seat wrong-code list in order, one pair per item, except item 45, which splits; each names the rows the must-meet says it turns red",
	"(seat) item 45 splits: 45a links each Overview artifact gap ID to its entry's capability; 45b links each Overview stale item to its entry's capability. The build appends the maker link in two places, so the item has two one-place forms",
	"(seat) three pairs make one wrong behaviour with two text edits, applied in order: pair 5 adds readerClaim to the deliverables.mjs import and uses it (product-report.mjs does not import it at this tip); pair 21 first empties the detail sections loop, then inserts a copy of it right after the Reads: line loop (a move needs both, and the copy's text would make the original loop's anchor occur twice if inserted first); pair 41 puts a flow-group model back in the artifacts object and its h3/ul loop back in the Artifacts renderer",
	"(expected survivor, run) pair 7: run green end to end at 00c171ae (SURVIVED, product-detail.test.mjs green after a 4 PASS baseline); R-006's `Read by: R-006 ·code: read.mjs` has no space after the separator, so the ` · ` split gives one part, parts[1] is empty and kind is \"\" with or without the two-part test; no R-2930 claim has three or more parts, so R-2930 is expected to stay green; the must-meet's red 'R-006' is unpinned for this mutation",
	"(expected named-green, inferred) pair 28: artifactFlowLedger registers FEAT-120's live entries in A-ID order (A-001, A-002, A-005 to A-011), so registration order equals A-ID order there and R-2799 is expected to stay green; R-2932 (FEAT-001 registers A-002 then A-001) carries the pair",
	"(seat) pair 38 runs product-report.test.mjs only: R-2932's entries are named after their IDs, so name order equals A-ID order there",
	"(seat) pair 25 deletes the feature-ancestor walk, so R-002 under SUB-001 finds no home feature and buildReport throws a TypeError; R-2932 goes red on that throw, not on 'R-002 missing'",
	"(seat) pairs 1 and 2 look up the home feature's block from model.features inside the Product branch and nest its claims (pair 1) or its artifact paragraphs (pair 2) under the item, the shape the item had before this lane",
	"(seat) pair 29 is one edit in deliverables.mjs: deliverableClaims reads every capability's own field lines in place of the listing capability's. A page-only flatMap over the capabilities' claim maps would not reach CAP-51's stray R-5000 line, since deliverableClaims keeps only rows its capability lists. The edit also changes the checker's counts",
	"(seat) pair 32 is one edit: a default `ages` parameter with an empty getter shadows the outer ages map inside artifactLinesFor, so every block line (direct, built-from and plain path) loses its age text and keeps its trailing separator",
	"(seat) pair 39 drops the maker segments in the Artifacts renderer (value.slice(0, 1)), so both lists lose them in one edit",
	"(seat) pairs 22 to 24 edit the model: the renderer draws one h3 per section the model holds, so 'always drawn' means a section with nothing under it in the model (pair 22 seeds every feature with an empty Deliverables section; pair 23 adds one when the first card section is made; pair 24 adds an empty Registered artifacts section to every feature after the card loop)",
	"(seat) pair 46 names R-2931 and R-2932, the two checks in product-detail.test.mjs that render a detail view through the shipped renderer; product-report.test.mjs is not run for it because that file runs every check inside one try block, and its first vm render of a detail view with a section (R-1510's #FEAT-039 view, where R-1014's block sits) throws and ends the file, so its later detail checks (R-2542, R-2642, R-2790, R-2799 and the age rows) would print neither PASS nor FAIL and read as not reached",
	"(seat) pair 49 is the one pair outside product-report.mjs and deliverables.mjs, in requirements-tree.mjs, as the must-meet names",
	"(macOS) none is Windows-only, as the must-meet says",
	"(product code) every pair edits product code: scripts/product-report.mjs, scripts/deliverables.mjs or, for pair 49, scripts/requirements-tree.mjs; no pair edits a test file or the ledger",
	"(not expressible) none of the 49 items",
	"(seat) no alsoRed is declared: the table was written before any full run. Expected UNNAMED reds (inferred, not run): pair 34 also R-2799 (A-001's card age is compared with the block line's text after its prefix, which now ends with a maker link) and R-2791 (its FEAT-091 lines must end with their age text, and now end with a maker link to FEAT-091); pair 47 also R-2542, R-2642, R-2790 and R-2799 (they find blocks by the h3's text, which innerHTML leaves empty in the stub); pair 48 also R-2799 (its card lines read text nodes); pairs 6, 7, 29 and 49 also change the tree checker, whose own test files are not run here",
];

const PAIRS = [
	{ n: "1", name: "the Product item still nests ul.deliverable-claims", edits: [one(PRM, PRODUCT_ITEM, `${PRODUCT_ITEM} { ${HOME_BLOCK} if (block?.claims.length) { const claims = el("ul", undefined, item); cls(claims, "deliverable-claims"); for (const claim of block.claims) { const line = el("li", undefined, claims); text(line, \`\${claim.label}: \${claim.text}\`); } } }`)], tests: [PD], expectRed: [R_2930] },
	{ n: "2", name: "the Product item keeps its artifact paragraphs", edits: [one(PRM, PRODUCT_ITEM, `${PRODUCT_ITEM} { ${HOME_BLOCK} for (const line of block?.artifactLines ?? []) { const p = el("p", undefined, item); cls(p, "deliverable-artifact"); renderSegments(p, line); } }`)], tests: [PD], expectRed: [R_2930] },
	{ n: "3", name: "reader kinds sorted", edits: [one(PRM, `${READERS_SET};`, `${READERS_SET}.sort();`)], tests: [PD], expectRed: [R_2930] },
	{ n: "4", name: "reader kinds not deduplicated", edits: [one(PRM, READERS_SET, READERS_LIST)], tests: [PD], expectRed: [R_2930] },
	{ n: "5", name: "the page builds reader kinds with readerClaim(claim.text) in place of claim.readerKind", edits: [one(PRM, IMPORT_DELIVERABLES, IMPORT_DELIVERABLES.replace("deliverableReport }", "deliverableReport, readerClaim }")), one(PRM, READERS_LIST, 'rowClaims.filter((claim) => claim.label === "Read by").map((claim) => readerClaim(claim.text)).filter((reader) => reader.known && reader.detail).map((reader) => reader.kind)')], tests: [PD], expectRed: [R_2930] },
	{ n: "6", name: "readerKind set without the non-empty detail test", edits: [one(DM, READER_KIND_DETAIL, "READER_SET.has(kind) ? kind : null;")], tests: [PD, PR], expectRed: [R_2930, R_2542] },
	{ n: "7", name: "readerKind set without the two-part test", edits: [one(DM, READER_KIND_PARTS, 'const readerKind = field.label === "Read by" && ')], tests: [PD], expectRed: [R_2930] },
	{ n: "8", name: "parked from the presence of a Parked: line", edits: [one(PRM, PARKED, 'const parked = rowClaims.some((claim) => claim.label === "Parked");')], tests: [PD], expectRed: [R_2930] },
	{ n: "9", name: "parked from any Parked: line on a row code does not make and read", edits: [one(PRM, PARKED, 'const parked = !(codeState.madeByCode && codeState.readByCode) && rowClaims.some((claim) => claim.label === "Parked");')], tests: [PD], expectRed: [R_2930] },
	{ n: "10", name: "parked never printed", edits: [one(PRM, PARKED_PART, "")], tests: [PD], expectRed: [R_2930] },
	{ n: "11", name: "marks dropped from the Product line", edits: [one(PRM, MARKS_PART, "")], tests: [PD, PR], expectRed: [R_2930, R_2542] },
	{ n: "12", name: "the smallest day count in place of the largest", edits: [one(PRM, "Math.max(...days)", "Math.min(...days)")], tests: [PD], expectRed: [R_2931] },
	{ n: "13", name: "built-from entries counted as named", edits: [one(PRM, NAMED_REGISTRY, NAMED_REGISTRY.replace('claim.registryKind === "artifact" ?', "claim.registryKind ?"))], tests: [PD], expectRed: [R_2931] },
	{ n: "14", name: "plural replaced by `${days} days`", edits: [one(PRM, 'plural(Math.max(...days), "day")', "`${Math.max(...days)} days`")], tests: [PD], expectRed: [R_2931] },
	{ n: "15", name: "age not measured and age unknown swapped", edits: [one(PRM, UNMEASURED_PICK, "? OVERVIEW_LABELS.unknown : OVERVIEW_LABELS.notMeasured;")], tests: [PD], expectRed: [R_2931] },
	{ n: "16", name: "plain paths left out of the named set", edits: [one(PRM, NAMED_PATH, "")], tests: [PD], expectRed: [R_2931] },
	{ n: "17", name: "any unmeasured named artifact gives age unknown even with days", edits: [one(PRM, DAYS_RETURN, `if (named.some((key) => !ageDays.has(key))) return OVERVIEW_LABELS.unknown; ${DAYS_RETURN}`)], tests: [PD], expectRed: [R_2931] },
	{ n: "18", name: "the day test written as truthiness, so 0 days reads as no day count", edits: [one(PRM, DAYS_FILTER, "const days = named.filter((key) => ageDays.get(key)).map((key) => ageDays.get(key));")], tests: [PD], expectRed: [R_2931] },
	{ n: "19", name: "dead IDs skipped from the named set", edits: [one(PRM, NAMED_REGISTRY, NAMED_REGISTRY.replace("claim.registryIds.map(", "claim.registryIds.filter((id) => registry.byId.get(id)?.live).map("))], tests: [PD], expectRed: [R_2931] },
	{ n: "20", name: "blocks in row-table order", edits: [one(PRM, BLOCK_PUSH, `${BLOCK_PUSH} section.blocks.sort((left, right) => rows.findIndex((item) => left.heading.startsWith(\`\${item.id} · \`)) - rows.findIndex((item) => right.heading.startsWith(\`\${item.id} · \`)));`)], tests: [PD], expectRed: [R_2932] },
	{ n: "21", name: "the sections rendered right after the Reads: line", edits: [one(PRM, SECTIONS_LOOP, "for (const section of []) {"), one(PRM, READS_LINE_END, `${READS_LINE_END} ${SECTIONS_COPY}`)], tests: [PD], expectRed: [R_2932] },
	{ n: "22", name: "the Deliverables heading always drawn", edits: [one(PRM, "detailSections: [], ", "detailSections: [{ heading: DETAIL_HEADINGS.deliverables, blocks: [] }], ")], tests: [PD], expectRed: [R_2932] },
	{ n: "23", name: "the Deliverables heading drawn when the feature has blocks or cards", edits: [one(PRM, "if (!section) { section = { heading: DETAIL_HEADINGS.artifacts, cards: [] }; maker.detailSections.push(section); }", "if (!section) { if (!maker.detailSections.some((item) => item.blocks)) maker.detailSections.push({ heading: DETAIL_HEADINGS.deliverables, blocks: [] }); section = { heading: DETAIL_HEADINGS.artifacts, cards: [] }; maker.detailSections.push(section); }")], tests: [PD], expectRed: [R_2932] },
	{ n: "24", name: "the Registered artifacts heading always drawn", edits: [one(PRM, CARDS_END, CARDS_END.replace("    artifacts = {", "    for (const item of features) if (!item.detailSections.some((candidate) => candidate.cards)) item.detailSections.push({ heading: DETAIL_HEADINGS.artifacts, cards: [] });\n    artifacts = {"))], tests: [PD], expectRed: [R_2932] },
	{ n: "25", name: "home taken from the row's own heading, not its feature ancestor", edits: [one(PRM, HOME_WALK, "")], tests: [PD], expectRed: [R_2932] },
	{ n: "26", name: "blocks also drawn on features that share the row", edits: [one(PRM, BLOCK_PUSH, `${BLOCK_PUSH} for (const sharer of features.filter((item) => item.shared.includes(id))) { let shared = sharer.detailSections.find((item) => item.blocks); if (!shared) { shared = { heading: DETAIL_HEADINGS.deliverables, blocks: [] }; sharer.detailSections.push(shared); } shared.blocks.push({ heading, claims: rowClaims.map(({ label, text }) => ({ label, text })), artifactLines: artifactLinesFor(rowClaims, homeFeature.id) }); }`)], tests: [PD, PR], expectRed: [R_2932, R_2542] },
	{ n: "27", name: "cards rendered before the blocks", edits: [one(PRM, SECTIONS_LOOP, "for (const section of [...(feature.detailSections ?? [])].reverse()) {")], tests: [PD], expectRed: [R_2932] },
	{ n: "28", name: "cards in registration order", edits: [one(PRM, "    for (const entry of liveEntries) {", "    for (const entry of registry.entries.filter((item) => item.live)) {")], tests: [PD, PR], expectRed: [R_2932, R_2799] },
	{ n: "29", name: "claims gathered from every capability span", edits: [one(DM, CLAIMS_LOOP, CLAIMS_LOOP_ALL)], tests: [PR], expectRed: [R_2542] },
	{ n: "30", name: "Parked: claims dropped from the block", edits: [one(PRM, "section.blocks.push({ heading, claims: rowClaims.map(", 'section.blocks.push({ heading, claims: rowClaims.filter((claim) => claim.label !== "Parked").map(')], tests: [PR], expectRed: [R_2642] },
	{ n: "31", name: "block artifact lines dropped", edits: [one(PRM, "artifactLines: artifactLinesFor(rowClaims, homeFeature.id) });", "artifactLines: [] });")], tests: [PD, PR], expectRed: [R_2931, R_2790, R_2799, ...AGE_ROWS] },
	{ n: "32", name: "block artifact lines drop their age", edits: [one(PRM, "const artifactLinesFor = (claims, homeId) => {", 'const artifactLinesFor = (claims, homeId, ages = { get: () => "" }) => {')], tests: [PD, PR], expectRed: [R_2931, R_2790, R_2799, ...AGE_ROWS] },
	{ n: "33", name: "the block line drops the maker link", edits: [one(PRM, `, ${BLOCK_MAKER}`, "")], tests: [PR], expectRed: [R_2790] },
	{ n: "34", name: "the maker link added to every direct block line, own entries included", edits: [one(PRM, BLOCK_MAKER, "...makerSegments(entry)")], tests: [PR], expectRed: [R_2790] },
	{ n: "35", name: "cards still drawn on the Artifacts view", edits: [one(PRM, LIST_ITEMS_END, `${LIST_ITEMS_END}${CARDS_ON_ARTIFACTS}`)], tests: [PR], expectRed: [R_2799, R_2801] },
	{ n: "36", name: "cards drawn on every feature's page", edits: [one(PRM, CARD_PUSH, `${CARD_PUSH} for (const other of features) { let own = other.detailSections.find((item) => item.cards); if (!own) { own = { heading: DETAIL_HEADINGS.artifacts, cards: [] }; other.detailSections.push(own); } if (own !== section) own.cards.push({ heading: \`\${entry.id} · \${entry.name}\`, lines }); }`)], tests: [PD, PR], expectRed: [R_2799, R_2932] },
	{ n: "37", name: "the card keeps its Made in self link", edits: [one(PRM, CARD_MADE_BY, CARD_MADE_IN)], tests: [PR], expectRed: [R_2799] },
	{ n: "38", name: "cards sorted by name", edits: [one(PRM, "    for (const entry of liveEntries) {", "    for (const entry of [...liveEntries].sort((left, right) => left.name.localeCompare(right.name))) {")], tests: [PR], expectRed: [R_2799] },
	{ n: "39", name: "Artifacts list items without the maker link", edits: [one(PRM, LIST_ITEM, LIST_ITEM.replace("renderSegments(item, value);", "renderSegments(item, value.slice(0, 1));"))], tests: [PR], expectRed: [R_2801] },
	{ n: "40", name: "Artifacts list items link the first reading feature in place of the maker", edits: [one(PRM, MANUAL_ITEM_END, '· manual: ${entry.reason}` }, { text: " · made in " }, featureSegment(reads.reads.find((read) => read.id === entry.id)?.featureId ?? entry.featureId)]);')], tests: [PR], expectRed: [R_2801] },
	{ n: "41", name: "flow groups kept in the model and drawn", edits: [one(PRM, EMPTY_TEXT_NULL, `${EMPTY_TEXT_NULL}${FLOW_MODEL}`), one(PRM, LISTS_LOOP, `${FLOW_RENDER}${LISTS_LOOP}`)], tests: [PR], expectRed: [R_2801] },
	{ n: "42", name: "the second list drops the manual reason", edits: [one(PRM, MANUAL_REASON, "`")], tests: [PR], expectRed: [R_2801] },
	{ n: "43", name: "Overview artifact gap IDs without the maker link", edits: [one(PRM, GAP_ID, "{ text: id }]")], tests: [PO], expectRed: [R_2923] },
	{ n: "44", name: "Overview stale items without the maker link", edits: [one(PRM, STALE_ITEM_END, "days` }])")], tests: [PO], expectRed: [R_2924] },
	{ n: "45a", name: "Overview gap IDs link the entry's capability in place of its maker feature", edits: [one(PRM, GAP_ID, '{ text: id }, { text: " · made in " }, featureSegment(registry.byId.get(id).capabilityId)]')], tests: [PO], expectRed: [R_2923] },
	{ n: "45b", name: "Overview stale items link the entry's capability in place of its maker feature", edits: [one(PRM, STALE_ITEM_END, 'days` }, { text: " · made in " }, featureSegment(entry.capabilityId)])')], tests: [PO], expectRed: [R_2924] },
	{ n: "46", name: "renderInto reads DETAIL_HEADINGS from module scope", edits: [one(PRM, 'el("h3", section.heading, root);', 'el("h3", section.blocks ? DETAIL_HEADINGS.deliverables : DETAIL_HEADINGS.artifacts, root);')], tests: [PD], expectRed: [R_2931, R_2932] },
	{ n: "47", name: "a block heading drawn with innerHTML", edits: [one(PRM, 'cls(article, "deliverable-block"); el("h3", block.heading, article);', 'cls(article, "deliverable-block"); el("h3", undefined, article).innerHTML = block.heading;')], tests: [PR], expectRed: [R_1019_TEXT] },
	{ n: "48", name: "a card line drawn with innerHTML", edits: [one(PRM, CARD_LINE, 'for (const line of entry.lines) { const p = el("p", undefined, card); p.innerHTML = line.segments.map((segment) => segment.text ?? segment.feature.label).join(""); }')], tests: [PR], expectRed: [R_1019_TEXT] },
	{ n: "49", name: "the tree checker prints its deliverable lines with console.error", edits: [one(RTM, CHECKER_LINES, CHECKER_LINES.replace("console.log(line)", "console.error(line)"))], tests: [PD, PR], expectRed: [R_2933, R_2543] },
];

process.exitCode = await runMutations({ lane: "page-detail", self: import.meta.url, tip: "00c171ae", declared: DECLARED, pairs: PAIRS });
