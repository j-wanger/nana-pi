#!/usr/bin/env node
// Seat wrong-code pairs for lane artifact-flow (ordinary), written by the seat 2026-10-24 after build 1 at e7f69c02.
// They follow the must-meet rows' red cases (R-2799 to R-2802).
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/artifact-flow-2026-10-24/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const PR = "scripts/product-report.mjs";
const T_PR = "packages/nana-pack/tests/product-report.test.mjs";
const R_2799 = /^R-2799: /; // R-2799
const R_2800 = /^R-2800: /; // R-2800
const R_2801 = /^R-2801: /; // R-2801
const R_2802 = /^R-2802: /; // R-2802
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const ENTRY_READS = "const entryReads = reads.reads.filter((read) => read.id === entry.id);";
const LIVE_ENTRIES = "const liveEntries = registry.entries.filter((entry) => entry.live).sort(";
const REFERENCE_KINDS = 'if (claim.label !== "Made by" || !claim.registryKind) continue;';
const ALL_AGED = "const artifactDescriptors = new Map(registry.entries.filter((entry) => entry.live).map(";
const NO_REGISTRY = 'emptyText: "no artifact registry"';
const CROSS_ONLY = "&& item.capabilityId !== entry.capabilityId)";
const ONE_PER_CAPABILITY = "flowEntries.push({ entry, makerCapabilityId: entry.capabilityId, readerCapabilityId, readerFeatureIds: [...readerFeatureIds].sort(";
const EACH_CAPABILITY = "for (const [readerCapabilityId, readerFeatureIds] of byReaderCapability) {";
const FLOW_RUN = "const segments = [{ text: `${flow.entry.run} · ${flow.entry.id} · ${flow.entry.name} · ` }";
const UNREFERENCED = "referencesFor(entry.id).length === 0)";
const UNREAD = "!readIds.has(entry.id) && ";
const MANUAL_ONLY = 'entry.run === "manual" && (';
const CODE_READ = "readIds.has(entry.id) || referencesFor(entry.id).some((reference) => reference.readByCode)";
const REASON = " · manual: ${entry.reason}`";
const DETAIL_LINES = "return [{ segments: [{ text: `Registers: ${registerText}` }] }, { segments: readSegments }];";
const REGISTERED_LIVE = "const registered = registry.entries.filter((entry) => entry.live && entry.featureId === feature.id)";
const DETAIL_DEAD = "if (!entry?.live) readSegments.push({ text: `${item.id} · no live entry` });";
const DETAIL_MAKER = "readSegments.push(featureSegment(entry.featureId));";

const DECLARED = [
	"(seat) pairs 1 to 6 follow R-2799's red cases and its no-registry text; 7 to 10 R-2800's; 11 to 16 R-2801's; 17 to 20 R-2802's",
	"(seat) declared non-pairs: 'a Reads line naming A-999 stops the page, or one naming a retired entry draws a line' for the flow (the flow iterates live entries only, so no one-line mutation reaches a dead ID there; pair 19 covers A-999 in the feature detail), and 'a read toward an earlier capability raises a tree problem' (this lane changes no tree code, and R-2444's own check is untouched)",
];

const PAIRS = [
	{ n: "1", name: "a card shows only its first reading feature", edits: [one(PR, ENTRY_READS, "const entryReads = reads.reads.filter((read) => read.id === entry.id).slice(0, 1);")], tests: [T_PR], expectRed: [R_2799] },
	{ n: "2", name: "a retired entry gets a card", edits: [one(PR, LIVE_ENTRIES, "const liveEntries = registry.entries.filter((entry) => true).sort(")], tests: [T_PR], expectRed: [R_2799] },
	{ n: "3", name: "a card leaves out deliverables built from the entry", edits: [one(PR, REFERENCE_KINDS, 'if (claim.label !== "Made by" || claim.registryKind !== "artifact") continue;')], tests: [T_PR], expectRed: [R_2799] },
	{ n: "4", name: "a card leaves out deliverables that name the entry", edits: [one(PR, REFERENCE_KINDS, 'if (claim.label !== "Made by" || claim.registryKind !== "built from") continue;')], tests: [T_PR], expectRed: [R_2799] },
	{ n: "5", name: "an entry no claim names shows no age", edits: [one(PR, ALL_AGED, "const artifactDescriptors = new Map(registry.entries.filter((entry) => entry.live && [...claimsByCapability.values()].some((claims) => [...claims.values()].some((rowClaims) => rowClaims.some((claim) => claim.registryIds.includes(entry.id))))).map(")], tests: [T_PR], expectRed: [R_2799] },
	{ n: "6", name: "a ledger with no registry shows other text", edits: [one(PR, NO_REGISTRY, 'emptyText: "no artifacts"')], tests: [T_PR], expectRed: [R_2799] },
	{ n: "7", name: "a read inside one capability is a flow line", edits: [one(PR, CROSS_ONLY, ")")], tests: [T_PR], expectRed: [R_2800] },
	{ n: "8", name: "two reading features under one capability give two lines", edits: [one(PR, ONE_PER_CAPABILITY, "for (const one of readerFeatureIds) flowEntries.push({ entry, makerCapabilityId: entry.capabilityId, readerCapabilityId, readerFeatureIds: [one].sort(")], tests: [T_PR], expectRed: [R_2800] },
	{ n: "9", name: "an entry read under two other capabilities gives one line", edits: [one(PR, EACH_CAPABILITY, "for (const [readerCapabilityId, readerFeatureIds] of [...byReaderCapability].slice(0, 1)) {")], tests: [T_PR], expectRed: [R_2800] },
	{ n: "10", name: "a flow line leaves out the entry's run", edits: [one(PR, FLOW_RUN, "const segments = [{ text: `${flow.entry.id} · ${flow.entry.name} · ` }")], tests: [T_PR], expectRed: [R_2800] },
	{ n: "11", name: "an entry a deliverable is built from is in the first list", edits: [one(PR, UNREFERENCED, 'referencesFor(entry.id).filter((reference) => reference.kind === "names it").length === 0)')], tests: [T_PR], expectRed: [R_2801] },
	{ n: "12", name: "an entry that only a Reads line names is in the first list", edits: [one(PR, UNREAD, "")], tests: [T_PR], expectRed: [R_2801] },
	{ n: "13", name: "an automatic entry is in the second list", edits: [one(PR, MANUAL_ONLY, "true && (")], tests: [T_PR], expectRed: [R_2801] },
	{ n: "14", name: "a manual entry a Reads line names is missing from the second list", edits: [one(PR, CODE_READ, "referencesFor(entry.id).some((reference) => reference.readByCode)")], tests: [T_PR], expectRed: [R_2801] },
	{ n: "15", name: "a manual entry named only by a person-read deliverable is in the second list", edits: [one(PR, CODE_READ, "readIds.has(entry.id) || referencesFor(entry.id).length > 0")], tests: [T_PR], expectRed: [R_2801] },
	{ n: "16", name: "a second-list item shows no manual reason", edits: [one(PR, REASON, "`")], tests: [T_PR], expectRed: [R_2801] },
	{ n: "17", name: "the feature detail leaves out its reads", edits: [one(PR, DETAIL_LINES, "return [{ segments: [{ text: `Registers: ${registerText}` }] }];")], tests: [T_PR], expectRed: [R_2802] },
	{ n: "18", name: "a retired entry shows under Registers", edits: [one(PR, REGISTERED_LIVE, "const registered = registry.entries.filter((entry) => entry.featureId === feature.id)")], tests: [T_PR], expectRed: [R_2802] },
	{ n: "19", name: "a read of A-999 stops the page", edits: [one(PR, DETAIL_DEAD, "if (false) readSegments.push({ text: `${item.id} · no live entry` });")], tests: [T_PR], expectRed: [R_2802] },
	{ n: "20", name: "a read of a live entry shows no maker", edits: [one(PR, DETAIL_MAKER, "void 0;")], tests: [T_PR], expectRed: [R_2802] },
];

process.exitCode = await runMutations({ lane: "artifact-flow", self: import.meta.url, tip: "e7f69c02", declared: DECLARED, pairs: PAIRS });
