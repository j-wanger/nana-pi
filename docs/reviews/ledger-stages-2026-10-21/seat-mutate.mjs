#!/usr/bin/env node
// Seat wrong-code pairs for lane ledger-stages (ordinary lane), written by the seat 2026-10-21 after build 1, on the
// shared runner. Each pair puts one product-report site the lane changed into its wrong form, mostly from the
// adversary's list in the plan (attack B, section 6). O pairs break the card order, B the constraint coverage, D the
// deliverables, T the detail line, R the retired card and P the renderer's page rules. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/ledger-stages-2026-10-21/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-pack/tests/product-report.test.mjs";
const PR = "scripts/product-report.mjs";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const R2450 = /^R-2450: /;
const R2451 = /^R-2451: /;
const R2452 = /^R-2452: /;
const R2453 = /^R-2453: /;
const R2454 = /^R-2454: /;

const GROUP = "const group = (capability) => capability.retired ? 3 : capability.kind === \"product\" ? 0 : capability.kind === null ? 1 : 2;";
const RECEIVING = "featureCapability(feature) === boundCapability && (feature.status === \"active\" || feature.status.startsWith(\"frozen (\"))";

const DECLARED = [
	"(a5fbba37, after the run) 18 of 19 red. D3 and P1 turn the file red by a throw (a missing home feature; a ReferenceError in the page renderer, as the browser would throw). P2 survives as declared in (a); the seat carries it rather than spending a build: once this repo's ledger carries kinds (lane C), R-1014's bar check on the real ledger pins it. O3 and O5 also turn unnamed checks red (R-2454; R-2452)",
	"(build 1, a5fbba37) 19 pairs over the card order, constraint coverage, deliverables, the detail line, the retired card and the page rules",
	"(a) P2 probes a test gap: no kinded fixture asserts that each feature line is still followed by its count bar (R-1014 checks that only on the real ledger, which has no kind until lane C)",
];

const PAIRS = [
	// Card order.
	{ n: "O1", name: "(1) ignore Kind: plain document order", edits: [one(PR, GROUP, "const group = () => 0;")], tests: [T], expectRed: [R2450, R2454] },
	{ n: "O2", name: "(4) constraint capabilities before kindless ones", edits: [
		one(PR, GROUP, "const group = (capability) => capability.retired ? 3 : capability.kind === \"product\" ? 0 : capability.kind === null ? 2 : 1;"),
	], tests: [T], expectRed: [R2450, R2454] },
	{ n: "O3", name: "(2) order within a group by reverse ID, not document order", edits: [
		one(PR, "return group(left) - group(right);", "return group(left) - group(right) || right.id.localeCompare(left.id);"),
	], tests: [T], expectRed: [R2450] },
	{ n: "O4", name: "a product card does not name its needs", edits: [one(PR, "if (cap.needs.length) paragraph(card, \"Needs\"", "if (false) paragraph(card, \"Needs\"")], tests: [T], expectRed: [R2450] },
	{ n: "O5", name: "(14) a kind badge in the capability h3", edits: [
		one(PR, "el(\"h3\", `${cap.id} · ${cap.label}`, card);", "el(\"h3\", `${cap.id} · ${cap.label}${cap.kind ? ` [${cap.kind}]` : \"\"}`, card);"),
	], tests: [T], expectRed: [R2450, R2451, R2453, R2454] },

	// Constraint coverage.
	{ n: "B1", name: "(8) a share of an untested constraint row counts as covered", edits: [
		one(PR, "row.status === \"implemented\" && receivingFeatures", "receivingFeatures"),
	], tests: [T], expectRed: [R2451] },
	{ n: "B2", name: "(9) a share by a feature outside the bound capability counts", edits: [
		one(PR, RECEIVING, "(feature.status === \"active\" || feature.status.startsWith(\"frozen (\"))"),
	], tests: [T], expectRed: [R2451] },
	{ n: "B3", name: "(10) a shared implemented row homed outside the constraint capability counts", edits: [
		one(PR, "const constraintRows = rows.filter((row) => descendants(parsed, capability).includes(row.heading));", "const constraintRows = rows;"),
	], tests: [T], expectRed: [R2451] },
	{ n: "B4", name: "a proposed feature's share counts", edits: [
		one(PR, RECEIVING, "featureCapability(feature) === boundCapability && feature.status !== \"retired\""),
	], tests: [T], expectRed: [R2451] },

	// Deliverables.
	{ n: "D1", name: "(5) violated is not a gap", edits: [one(PR, "gap: row.status !== \"implemented\"", "gap: row.status === \"untested\" || row.status === \"planned\"")], tests: [T], expectRed: [R2452] },
	{ n: "D2", name: "deliverables sorted by ID, not in line order", edits: [
		one(PR, "const deliverables = fieldValues(capability, \"Deliverables\").map(", "const deliverables = fieldValues(capability, \"Deliverables\").sort().map("),
	], tests: [T], expectRed: [R2452] },
	{ n: "D3", name: "a subgroup-homed deliverable's home is the subgroup", edits: [
		one(PR, "while (homeHeading && !homeHeading.id.startsWith(\"FEAT-\")) homeHeading = homeHeading.parent;", ""),
	], tests: [T], expectRed: [R2452] },
	{ n: "D4", name: "a deliverable lists no consumers", edits: [
		one(PR, "const consumers = featureHeadings.filter((feature) => feature.alsoApplies.includes(id))", "const consumers = featureHeadings.filter(() => false)"),
	], tests: [T], expectRed: [R2452] },

	// Detail line.
	{ n: "T1", name: "(15) a kindless capability's detail line prints the empty kind", edits: [
		one(PR, "${feature.capability.kind ? ` · ${feature.capability.kind}` : \"\"}", " · ${feature.capability.kind}"),
	], tests: [T], expectRed: [R2453] },
	{ n: "T2", name: "the detail line names the label but not the capability ID", edits: [
		one(PR, "paragraph(root, \"Capability\", `${feature.capability.id}", "paragraph(root, \"Capability\", `${feature.capability.label}"),
	], tests: [T], expectRed: [R2453] },

	// Retired card.
	{ n: "R1", name: "a retired card names no successors", edits: [one(PR, "if (cap.retired) paragraph(card, \"Retired\"", "if (false) paragraph(card, \"Retired\"")], tests: [T], expectRed: [R2454] },
	{ n: "R2", name: "(15) a retired capability stays in its kind group", edits: [
		one(PR, GROUP, "const group = (capability) => capability.kind === \"product\" ? 0 : capability.kind === null ? 1 : 2;"),
	], tests: [T], expectRed: [R2454] },

	// Page rules.
	{ n: "P1", name: "(7) a module-scope constant referenced from renderInto", edits: [
		one(PR, "const DEFAULT_OUT = \"docs/product-report/out/nana-pi-product-ledger.html\";", "const DEFAULT_OUT = \"docs/product-report/out/nana-pi-product-ledger.html\";\nconst GAP_WORD = \"gap\";"),
		one(PR, "${deliverable.gap ? \" · gap\" : \"\"}", "${deliverable.gap ? ` · ${GAP_WORD}` : \"\"}"),
	], tests: [T], expectRed: [R2452] },
	{ n: "P2", name: "(13) a paragraph between a kinded card's feature line and its bar", edits: [
		one(PR, "featureLink(line, item.id, `${item.id} · ${item.label}`); countBar(card, item);", "featureLink(line, item.id, `${item.id} · ${item.label}`); if (cap.kind) paragraph(card, \"Kind\", cap.kind); countBar(card, item);"),
	], tests: [T], expectRed: [R2450] },
];

process.exitCode = await runMutations({ lane: "ledger-stages", self: import.meta.url, tip: "a5fbba37", declared: DECLARED, pairs: PAIRS });
