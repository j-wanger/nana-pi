#!/usr/bin/env node
// Seat wrong-code pairs for lane artifact-readers (ordinary), written by the seat 2026-10-25 after build 1 at 9dae642b.
// Pairs 1, 5b and 41b take the pair checker's fixes (wf_4d21505b-cad).
// They follow the must-meet rows' red cases (R-2830 to R-2834, R-2837) and the seal.
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/artifact-readers-2026-10-25/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const D = "scripts/deliverables.mjs";
const M = "scripts/requirements-moved.mjs";
const TD = "packages/nana-pack/tests/requirements-deliverables.test.mjs";
const TM = "packages/nana-pack/tests/requirements-moved.test.mjs";
const R_2830 = /^R-2830: /; // R-2830
const R_2831 = /^R-2831: /; // R-2831
const R_2832 = /^R-2832: /; // R-2832
const R_2833 = /^R-2833: /; // R-2833
const R_2834 = /^R-2834: /; // R-2834
const R_2837 = /^R-2837: /; // R-2837
const SEAL = /^seal: the test-reader glob/; // R-2833 R-2834
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// Shared anchors (each must appear exactly once in the committed file).
const SPAN_GUARD = "    if (!capability || !capabilityKind(capability) || capability.id === heading.id) continue;\n    const fields = ownFieldLines(parsed, heading, ARTIFACT_CONSUMER_LABELS);\n    fieldLineCount += fields.length;\n    for (const field of fields) {\n      if (!heading.id?.startsWith(\"FEAT-\")) {";
const CONSUMER_SKIP = "if (!capability || !capabilityKind(capability) || capability.id === heading.id) continue;";
const DELIVERABLE_SPANS = "  for (const capability of parsed.headings.filter((heading) => heading.id?.startsWith(\"CAP-\"))) {\n    const fields = ownFieldLines(parsed, capability, DELIVERABLE_LABELS);\n    fieldLineCount += fields.length;";
const FOREIGN_READER = "else if (entry.featureId !== heading.id) problem = `Read by: ${id} is registered in another feature, not ${heading.id}`;";
const REASON_CHECK = "else if (claim.needsReason && !claim.detail) problem = `Read by: ${id} needs a reason`;";
const READER_KEY = "const readerKey = `${heading.id}\\0${id}\\0${claim.kind}`;";
const TEST_PROBLEM = "return globMatch(TEST_READER_GLOB, lastSegment) ? `reader path \"${path}\" is a test file` : null;";
const READS_TEST = "if (globMatch(TEST_READER_GLOB, lastSegment)) {";
const COVERAGE = "if (consumer.kinds.size === 0 && !consumer.park) addNote(id, `${id} ${NO_DECLARED_READER_NOTE}`);";

const DECLARED = [
	"(seat) pairs 1 to 14 follow R-2830's red cases; 15 to 19 R-2831's; 20 to 25 R-2832's; 26 to 33 R-2833's; 34 to 42 R-2834's; 43 and 44 R-2837's; 45 and 46 the seal",
	"(seat) shared pairs: pair 1 also stands for R-2837's 'a capability-span deliverable Read by: line listed twice' (the same edit puts capability-span deliverable Read by lines into the consumer lines the movement report reads); pair 2 also stands for R-2832's 'or the reverse' (a feature-span Parked: A-nnn read as a deliverable park)",
	"(seat) declared non-pair: R-2830's 'a CRLF or trailing-space copy giving a different note set' (parseLedger in scripts/requirements-tree.mjs strips the CR, and ownFieldLines strips trailing spaces and tabs for every field form before either script parses a line; the test compares two trailing-space copies, LF and CRLF, so no one-place edit in scripts/deliverables.mjs or scripts/requirements-moved.mjs makes them differ)",
];

const PAIRS = [
	// R-2830
	{ n: "1", name: "a capability-span deliverable Read by line is read as an artifact reader", edits: [one(D, SPAN_GUARD, "    if (!capability || !capabilityKind(capability)) continue;\n    const fields = ownFieldLines(parsed, heading, ARTIFACT_CONSUMER_LABELS);\n    fieldLineCount += fields.length;\n    for (const field of fields) {\n      if (!heading.id?.startsWith(\"FEAT-\") && !(field.label === \"Read by\" && heading.id === capability.id)) {")], tests: [TD, TM], expectRed: [R_2830, R_2837] },
	{ n: "2", name: "a feature-span line is read as a deliverable claim", edits: [one(D, DELIVERABLE_SPANS, "  for (const capability of parsed.headings.filter((heading) => heading.id?.startsWith(\"CAP-\") || heading.id?.startsWith(\"FEAT-\"))) {\n    const fields = ownFieldLines(parsed, capability, DELIVERABLE_LABELS);\n    fieldLineCount += fields.length;")], tests: [TD], expectRed: [R_2830, R_2832] },
	{ n: "3", name: "a reader of another feature's entry is accepted", edits: [one(D, FOREIGN_READER, "else if (!entry.featureId) problem = `Read by: ${id} is registered in another feature, not ${heading.id}`;")], tests: [TD], expectRed: [R_2830] },
	{ n: "4", name: "a reasonless person or runtime reader is accepted", edits: [one(D, REASON_CHECK, "else if (claim.needsReason && claim.detail === undefined) problem = `Read by: ${id} needs a reason`;")], tests: [TD], expectRed: [R_2830] },
	{ n: "5", name: "a folder reader path counts as tracked", edits: [one(D, "const badReaderPath = (path) => testReaderProblem(path) ?? (tracked && (hasGlob(path) || path.endsWith(\"/\") || !tracked.has(path)) ? ", "const badReaderPath = (path) => testReaderProblem(path) ?? (tracked && !trackedAtHead(path, tracked) ? ")], tests: [TD], expectRed: [R_2830] },
	{ n: "5b", name: "a glob that matches a tracked file counts as tracked", edits: [one(D, "const badReaderPath = (path) => testReaderProblem(path) ?? (tracked && (hasGlob(path) || path.endsWith(\"/\") || !tracked.has(path)) ? ", "const badReaderPath = (path) => testReaderProblem(path) ?? (tracked && (hasGlob(path) ? ![...tracked].some((value) => globMatch(path, value)) : path.endsWith(\"/\") || !tracked.has(path)) ? ")], tests: [TD], expectRed: [R_2830] },
	{ n: "6", name: "a repeated ID and kind goes unnoted", edits: [one(D, READER_KEY, "const readerKey = `${heading.id}\\0${id}\\0${claim.kind}\\0${field.line}`;")], tests: [TD], expectRed: [R_2830] },
	{ n: "7", name: "the same ID with a second kind is noted", edits: [one(D, READER_KEY, "const readerKey = `${heading.id}\\0${id}`;")], tests: [TD], expectRed: [R_2830] },
	{ n: "8", name: "a line under a kindless capability is noted", edits: [one(D, CONSUMER_SKIP, "if (!capability || capability.id === heading.id) continue;")], tests: [TD], expectRed: [R_2830] },
	{ n: "9", name: "a line in a frozen feature is noted", edits: [one(D, "else if (/^(?:proposed|retired\\b)/.test(heading.status ?? \"\")) problem = `Read by:", "else if (/^(?:proposed|retired\\b|frozen)/.test(heading.status ?? \"\")) problem = `Read by:")], tests: [TD], expectRed: [R_2830] },
	{ n: "10", name: "a line above its entry is noted", edits: [one(D, FOREIGN_READER, "else if (entry.featureId !== heading.id || entry.line > field.line) problem = `Read by: ${id} is registered in another feature, not ${heading.id}`;")], tests: [TD], expectRed: [R_2830] },
	{ n: "11", name: "a comma list is read as one path", edits: [one(D, "paths: kind === \"code\" || kind === \"prompt\" ? detail.split(\",\").map((value) => value.trim()).filter(Boolean) : [],", "paths: kind === \"code\" || kind === \"prompt\" ? [detail] : [],")], tests: [TD], expectRed: [R_2830] },
	{ n: "12", name: "artifact Read by lines change artifactReads' notes", edits: [one(D, "const READS_LABEL_SET = new Set([READS_LABEL]);", "const READS_LABEL_SET = new Set([READS_LABEL, \"Read by\"]);")], tests: [TD], expectRed: [R_2830] },
	{ n: "13", name: "an artifact reader code path does not ask for the HEAD tree", edits: [one(D, "            needsTrackedPaths = true;\n", "")], tests: [TD], expectRed: [R_2830] },
	{ n: "14", name: "artifact reader and park lines do not count toward the field lines", edits: [one(D, "let fieldLineCount = registry.fieldLineCount + featureReads.fieldLineCount + consumers.fieldLineCount;", "let fieldLineCount = registry.fieldLineCount + featureReads.fieldLineCount;")], tests: [TD], expectRed: [R_2830] },
	// R-2831
	{ n: "15", name: "runtime is an unknown reader kind", edits: [one(D, "export const READER_KINDS = Object.freeze([\"code\", \"prompt\", \"person\", \"rule\", \"runtime\"]);", "export const READER_KINDS = Object.freeze([\"code\", \"prompt\", \"person\", \"rule\"]);")], tests: [TD], expectRed: [R_2831] },
	{ n: "16", name: "a reasonless runtime reader is accepted", edits: [one(D, "export const REASON_REQUIRED = Object.freeze([\"manual\", \"rule\", \"person\", \"runtime\"]);", "export const REASON_REQUIRED = Object.freeze([\"manual\", \"rule\", \"person\"]);")], tests: [TD], expectRed: [R_2831] },
	{ n: "17", name: "a runtime detail is checked as a tracked path", edits: [one(D, "    needsPath: kind === \"code\" || kind === \"prompt\",\n    paths: kind === \"code\" || kind === \"prompt\" ?", "    needsPath: kind !== \"person\" && kind !== \"rule\",\n    paths: kind !== \"person\" && kind !== \"rule\" ?")], tests: [TD], expectRed: [R_2831] },
	{ n: "18", name: "a row read only by a runtime is counted as made and read by code", edits: [one(D, "    madeAndReadByCode += listed.filter((row) => isMadeAndReadByCode(claimsByRow.get(row) ?? [])).length;", "    madeAndReadByCode += listed.filter((row) => deliverableCodeState(claimsByRow.get(row) ?? []).madeByCode && (claimsByRow.get(row) ?? []).some((claim) => claim.label === \"Read by\")).length;")], tests: [TD], expectRed: [R_2831] },
	{ n: "19", name: "a runtime reader sets readByCode", edits: [one(D, "const readByCode = field.label === \"Read by\" && parts.length === 2 && READER_SET.has(kind) && !REASON_SET.has(kind) && detail.length > 0;", "const readByCode = field.label === \"Read by\" && parts.length === 2 && READER_SET.has(kind) && kind !== \"person\" && kind !== \"rule\" && detail.length > 0;")], tests: [TD], expectRed: [R_2831] },
	// R-2832
	{ n: "20", name: "a capability-span deliverable park is read as an artifact park", edits: [one(D, CONSUMER_SKIP, "if (!capability || !capabilityKind(capability)) continue;")], tests: [TD], expectRed: [R_2832] },
	{ n: "21", name: "a park of another feature's entry is accepted", edits: [one(D, "if (!entry?.live || entry.featureId !== heading.id) problem = `${claim.id} ${PARKED_LABEL}", "if (!entry?.live) problem = `${claim.id} ${PARKED_LABEL}")], tests: [TD], expectRed: [R_2832] },
	{ n: "22", name: "a dateless park is counted", edits: [one(D, "        else if (!claim.date) problem = `${claim.id} ${PARKED_LABEL}: line ${field.line} needs a ${PARKED_SINCE} date`;\n", "")], tests: [TD], expectRed: [R_2832] },
	{ n: "23", name: "a reasonless park is counted", edits: [one(D, "        else if (!claim.reason) problem = `${claim.id} ${PARKED_LABEL}: line ${field.line} needs a reason`;\n", "")], tests: [TD], expectRed: [R_2832] },
	{ n: "24", name: "a park of an entry a Reads line names is counted", edits: [one(D, "    if (consumer.kinds.size > 0) addNote(park.id,", "    if ([...seenArtifactReaders].some((key) => key.split(\"\\0\")[1] === park.id)) addNote(park.id,")], tests: [TD], expectRed: [R_2832] },
	{ n: "25", name: "a parked entry still gets the coverage note", edits: [one(D, COVERAGE, "if (consumer.kinds.size === 0) addNote(id, `${id} ${NO_DECLARED_READER_NOTE}`);")], tests: [TD], expectRed: [R_2832] },
	// R-2833
	{ n: "26", name: "the artifact Read by form skips the test-file check", edits: [one(D, "const badReaderPath = (path) => testReaderProblem(path) ?? (", "const badReaderPath = (path) => (")], tests: [TD], expectRed: [R_2833] },
	{ n: "27", name: "the Reads form skips the test-file check", edits: [one(D, READS_TEST, "if (false) {")], tests: [TD], expectRed: [R_2833] },
	{ n: "28", name: "the artifact Read by form matches the glob against the whole path", edits: [one(D, TEST_PROBLEM, "return globMatch(TEST_READER_GLOB, path) ? `reader path \"${path}\" is a test file` : null;")], tests: [TD], expectRed: [R_2833] },
	{ n: "29", name: "the Reads form matches the glob against the whole path", edits: [one(D, READS_TEST, "if (globMatch(TEST_READER_GLOB, reader)) {")], tests: [TD], expectRed: [R_2833] },
	{ n: "30", name: "the deliverable form matches the glob against the whole path", edits: [one(D, "if (globMatch(TEST_READER_GLOB, lastSegment)) notes.push(note(`${row} Read by:", "if (globMatch(TEST_READER_GLOB, path)) notes.push(note(`${row} Read by:")], tests: [TD], expectRed: [R_2833] },
	{ n: "31", name: "a folder segment matches the test glob", edits: [one(D, TEST_PROBLEM, "return path.split(/[\\\\/]/).some((segment) => globMatch(TEST_READER_GLOB, segment)) ? `reader path \"${path}\" is a test file` : null;")], tests: [TD], expectRed: [R_2833] },
	{ n: "32", name: "a harness file in a tests folder is caught", edits: [one(D, TEST_PROBLEM, "return globMatch(TEST_READER_GLOB, lastSegment) || path.split(/[\\\\/]/).includes(\"tests\") ? `reader path \"${path}\" is a test file` : null;")], tests: [TD], expectRed: [R_2833] },
	{ n: "33", name: "a person reason that names a test file is caught", edits: [one(D, REASON_CHECK, "else if (claim.needsReason && !claim.detail) problem = `Read by: ${id} needs a reason`;\n          else if (claim.needsReason && testReaderProblem(claim.detail)) problem = `Read by: ${id} ${testReaderProblem(claim.detail)}`;")], tests: [TD], expectRed: [R_2833] },
	// R-2834
	{ n: "34", name: "a manual built-from list counts as code", edits: [one(D, "consumers.get(id).kinds.add(run === \"manual\" ? \"person\" : \"code\");", "consumers.get(id).kinds.add(\"code\");")], tests: [TD], expectRed: [R_2834] },
	{ n: "35", name: "a direct reference gets only code", edits: [one(D, "if (bindingValid) for (const kind of readerKinds.get(row)) consumers.get(id).kinds.add(kind);", "if (bindingValid && readerKinds.get(row).size) consumers.get(id).kinds.add(\"code\");")], tests: [TD], expectRed: [R_2834] },
	{ n: "36", name: "a retired entry is noted", edits: [one(D, "new Map(registry.entries.filter((entry) => entry.live).map((entry) => [entry.id,", "new Map(registry.entries.map((entry) => [entry.id,")], tests: [TD], expectRed: [R_2834] },
	{ n: "37", name: "a parked entry is noted", edits: [one(D, "    else if (!consumer.park) consumer.park = park;", "    else if (consumer.park) consumer.park = park;")], tests: [TD], expectRed: [R_2834] },
	{ n: "38", name: "an entry reached only through a parked deliverable is noted", edits: [one(D, "      if (!listed.has(row)) continue;\n      const makerText", "      if (!listed.has(row) || fields.some((value) => value.label === PARKED_LABEL && value.body.startsWith(row))) continue;\n      const makerText")], tests: [TD], expectRed: [R_2834] },
	{ n: "39", name: "a Reads line in another capability is not counted", edits: [one(D, "for (const read of reads.reads) if (read.valid && consumers.has(read.id)) consumers.get(read.id).kinds.add(\"code\");", "for (const read of reads.reads) if (read.valid && consumers.has(read.id) && read.capabilityId === registry.byId.get(read.id).capabilityId) consumers.get(read.id).kinds.add(\"code\");")], tests: [TD], expectRed: [R_2834] },
	{ n: "40", name: "a malformed park clears the coverage note", edits: [one(D, "      if (problem) addNote(claim.id, problem);\n      else parkCandidates.push(", "      if (problem) addNote(claim.id, problem);\n      parkCandidates.push(")], tests: [TD], expectRed: [R_2834] },
	{ n: "41", name: "a noted reader line still gives its kind", edits: [one(D, "        if (problem) addNote(id, `line ${field.line}: ${problem}`);\n        else {", "        if (problem) addNote(id, `line ${field.line}: ${problem}`);\n        {")], tests: [TD], expectRed: [R_2834] },
	{ n: "41b", name: "a test-file deliverable reader on a direct reference still gives a kind", edits: [one(D, "const badDeliverableReaderPath = (path) => testReaderProblem(path) ?? (", "const badDeliverableReaderPath = (path) => (")], tests: [TD], expectRed: [R_2834] },
	{ n: "42", name: "the coverage note is added to artifactRegistry's notes", edits: [one(D, COVERAGE, "if (consumer.kinds.size === 0 && !consumer.park) { addNote(id, `${id} ${NO_DECLARED_READER_NOTE}`); registry.notes.push(note(`${id} ${NO_DECLARED_READER_NOTE}`)); }")], tests: [TD], expectRed: [R_2834] },
	// R-2837
	{ n: "43", name: "a reader or park change alone prints tree movement: none", edits: [one(M, "&& readChanges.length === 0 && consumerChanges.length === 0) return \"tree movement: none\";", "&& readChanges.length === 0) return \"tree movement: none\";")], tests: [TM], expectRed: [R_2837] },
	{ n: "44", name: "a park reason edit goes unreported", edits: [one(M, "      if (before?.text === after?.text) continue;", "      if (before?.text === after?.text || (before && after && before.label === \"Parked\" && before.date === after.date)) continue;")], tests: [TM], expectRed: [R_2837] },
	// seal
	{ n: "45", name: "the test-reader glob changes", edits: [one(D, "export const TEST_READER_GLOB = \"*.test.*\";", "export const TEST_READER_GLOB = \"*.test.mjs\";")], tests: [TD], expectRed: [SEAL] },
	{ n: "46", name: "the coverage note text changes", edits: [one(D, "export const NO_DECLARED_READER_NOTE = \"has no declared reader\";", "export const NO_DECLARED_READER_NOTE = \"has no reader\";")], tests: [TD], expectRed: [SEAL] },
];

process.exitCode = await runMutations({ lane: "artifact-readers", self: import.meta.url, tip: "9dae642b", declared: DECLARED, pairs: PAIRS });
