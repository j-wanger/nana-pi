#!/usr/bin/env node
// Seat wrong-code pairs for lane cap-kinds (ordinary lane), written by the seat 2026-10-21 after build 1, on the shared
// runner. Each pair puts one product site the lane changed into its wrong form: main's behaviour or the obvious wrong
// implementation, mostly from the adversary's list in plan-attack.md (its pair numbers in each name where one applies).
// P pairs break the field parser, K the Kind and duplicate checks, D the Deliverables check, B the Binds check, N the Needs
// check, R the Retired check, L the lift, O the outline and M the movement report. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/cap-kinds-2026-10-21/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const CK = "packages/nana-pack/tests/requirements-cap-kinds.test.mjs";
const MV = "packages/nana-pack/tests/requirements-moved.test.mjs";
const TREE = "scripts/requirements-tree.mjs";
const LIFT = "scripts/requirements-lift.mjs";
const MOVED = "scripts/requirements-moved.mjs";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const R2440 = /^R-2440: /;
const R2441 = /^R-2441: /;
const R2442 = /^R-2442: /;
const R2443 = /^R-2443: /;
const R2444 = /^R-2444: /;
const R2445 = /^R-2445: /;
const R2446 = /^R-2446: /;
const R2447 = /^R-2447: /;

const RENDER_FIELD = "        if (!entries.length) continue;\n        const values = entries.flatMap((entry) => CAPABILITY_LIST_FIELDS.has(label) ? splitCapabilityList(entry.value) : [entry.value]);\n        out.push(";

const DECLARED = [
	"(build 1, c97ddc66) 41 pairs over the five checker rules, the parser span and kind gate, the lift's refusal and field block, the outline renderer and its field check, and the movement report",
	"(a) P2 and B6 probe test gaps the must-meet rows claim but no case may exercise: Retired: read on a capability with no Kind:, and a retired constraint capability that carries no Binds:",
];

const PAIRS = [
	// Parser: the span and the kind gate.
	{ n: "P1", name: "(1) read the labels on every heading, and check every heading", edits: [
		one(TREE, "        if (heading.id.startsWith(\"CAP-\")) {\n          const label = CAPABILITY_FIELD_LABELS", "        if (true) {\n          const label = CAPABILITY_FIELD_LABELS"),
		one(TREE, "      if (heading.id.startsWith(\"CAP-\")) {\n        const candidates", "      if (true) {\n        const candidates"),
		one(TREE, "const capabilities = parsed.headings.filter((heading) => heading.id.startsWith(\"CAP-\"));", "const capabilities = parsed.headings;"),
	], tests: [CK], expectRed: [R2441] },
	{ n: "P2", name: "Retired: is read only on a capability with Kind:", edits: [
		one(TREE, "(label === \"Kind\" || label === \"Retired\" || hasKind)", "(label === \"Kind\" || hasKind)"),
	], tests: [CK], expectRed: [R2445] },
	{ n: "P3", name: "Deliverables:, Needs: and Binds: are read on a capability with no Kind:", edits: [
		one(TREE, "(label === \"Kind\" || label === \"Retired\" || hasKind)", "(true)"),
	], tests: [CK], expectRed: [R2441] },

	// Kind and duplicate lines.
	{ n: "K1", name: "(2) a prefix, case-insensitive Kind test", edits: [
		one(TREE, "if (entry.value !== \"product\" && entry.value !== \"constraint\")", "if (!/^(?:product|constraint)/i.test(entry.value))"),
	], tests: [CK], expectRed: [R2441] },
	{ n: "K2", name: "(3) a duplicate field line is not reported (first wins)", edits: [
		one(TREE, "if (entries.length > 1) for (const entry of entries)", "if (false) for (const entry of entries)"),
	], tests: [CK], expectRed: [R2441] },

	// Deliverables.
	{ n: "D1", name: "(4) compare the row's direct parent heading with the capability", edits: [
		one(TREE, "else if (capabilityOf(item.heading) !== capability) detail", "else if (item.heading.parent !== capability) detail"),
	], tests: [CK], expectRed: [R2442], alsoRed: [R2440] },
	{ n: "D2", name: "(5) a retired deliverable is accepted", edits: [
		one(TREE, "else if (item.status === \"retired\") detail = \"is retired\";", "else if (false) detail = \"is retired\";"),
	], tests: [CK], expectRed: [R2442] },
	{ n: "D3", name: "(6) an untested deliverable is a problem", edits: [
		one(TREE, "else if (item.status === \"retired\") detail = \"is retired\";", "else if (item.status === \"retired\") detail = \"is retired\";\n        else if (item.status === \"untested\") detail = \"is untested\";"),
	], tests: [CK], expectRed: [R2442], alsoRed: [R2440] },
	{ n: "D4", name: "(7) Deliverables: parsed with expandRowIds", edits: [
		one(TREE, "for (const token of splitCapabilityList(entry.value)) {\n        const item", "for (const token of expandRowIds(entry.value)) {\n        const item"),
	], tests: [CK], expectRed: [R2442] },
	{ n: "D5", name: "(8) Deliverables: accepted on a constraint capability", edits: [
		one(TREE, "if (deliverables.length && kind !== \"product\") for", "if (false) for"),
	], tests: [CK], expectRed: [R2442] },
	{ n: "D6", name: "a deliverable listed twice is not reported", edits: [
		one(TREE, "        if (seen.has(token)) fieldProblem(capability, entry, \"Deliverables\"", "        if (false) fieldProblem(capability, entry, \"Deliverables\""),
	], tests: [CK], expectRed: [R2442] },
	{ n: "D7", name: "a deliverable homed under another capability is accepted", edits: [
		one(TREE, "else if (capabilityOf(item.heading) !== capability) detail", "else if (false) detail"),
	], tests: [CK], expectRed: [R2442] },

	// Binds.
	{ n: "B1", name: "(9) Binds: all is skipped", edits: [
		one(TREE, "      const target = /^CAP-\\d{2}$/.test(token) ? capabilitiesById.get(token) : null;", "      if (token === \"all\") continue;\n      const target = /^CAP-\\d{2}$/.test(token) ? capabilitiesById.get(token) : null;"),
	], tests: [CK], expectRed: [R2443] },
	{ n: "B2", name: "(9) a Binds target is checked for existence only, not its kind or retirement", edits: [
		one(TREE, "(target) => capabilityKind(target) === \"product\" && !isRetiredCapability(target),\n      \"must name a live Kind: product capability\",", "(target) => true,\n      \"must name a live Kind: product capability\","),
	], tests: [CK], expectRed: [R2443] },
	{ n: "B3", name: "a retired Binds target is accepted", edits: [
		one(TREE, "(target) => capabilityKind(target) === \"product\" && !isRetiredCapability(target),\n      \"must name a live Kind: product capability\",", "(target) => capabilityKind(target) === \"product\",\n      \"must name a live Kind: product capability\","),
	], tests: [CK], expectRed: [R2443] },
	{ n: "B4", name: "(10) Binds: checked only when the line is present", edits: [
		one(TREE, "binds.length !== 1)", "binds.length > 1)"),
	], tests: [CK], expectRed: [R2443] },
	{ n: "B5", name: "Binds: accepted on a product capability", edits: [
		one(TREE, "if (binds.length && kind !== \"constraint\") for", "if (false) for"),
	], tests: [CK], expectRed: [R2443] },
	{ n: "B6", name: "a retired constraint capability must still carry Binds:", edits: [
		one(TREE, "if (kind === \"constraint\" && !isRetiredCapability(capability) && binds.length !== 1)", "if (kind === \"constraint\" && binds.length !== 1)"),
	], tests: [CK], expectRed: [R2443, R2445] },
	{ n: "B7", name: "a target that does not exist is accepted", edits: [
		one(TREE, "if (!target || !predicate(target, token))", "if (target && !predicate(target, token))"),
	], tests: [CK], expectRed: [R2443, R2445] },

	// Needs.
	{ n: "N1", name: "(11) a later capability is accepted in Needs:", edits: [
		one(TREE, "(target) => target.line < capability.line && capabilityKind(target)", "(target) => target !== capability && capabilityKind(target)"),
	], tests: [CK], expectRed: [R2444] },
	{ n: "N2", name: "(12) a Needs target's kind is not checked", edits: [
		one(TREE, "(target) => target.line < capability.line && capabilityKind(target) === \"product\" && !isRetiredCapability(target),", "(target) => target.line < capability.line && !isRetiredCapability(target),"),
	], tests: [CK], expectRed: [R2444] },
	{ n: "N3", name: "a retired Needs target is accepted", edits: [
		one(TREE, "(target) => target.line < capability.line && capabilityKind(target) === \"product\" && !isRetiredCapability(target),", "(target) => target.line < capability.line && capabilityKind(target) === \"product\","),
	], tests: [CK], expectRed: [R2444] },
	{ n: "N4", name: "Needs: accepted on a constraint capability", edits: [
		one(TREE, "if (needs.length && kind !== \"product\") for", "if (false) for"),
	], tests: [CK], expectRed: [R2444] },

	// Retired.
	{ n: "R1", name: "(13) Retired: successors are not validated", edits: [
		one(TREE, "      validateCapabilityTargets(\n        capability,\n        \"Retired\",", "      false && validateCapabilityTargets(\n        capability,\n        \"Retired\","),
	], tests: [CK], expectRed: [R2445] },
	{ n: "R2", name: "a retired successor is accepted", edits: [
		one(TREE, "(target) => target !== capability && !isRetiredCapability(target),", "(target) => target !== capability,"),
	], tests: [CK], expectRed: [R2445] },
	{ n: "R3", name: "a capability may name itself as its successor", edits: [
		one(TREE, "(target) => target !== capability && !isRetiredCapability(target),", "(target) => target === capability || !isRetiredCapability(target),"),
	], tests: [CK], expectRed: [R2445] },
	{ n: "R4", name: "(13) a retired capability may carry stage fields", edits: [
		one(TREE, "for (const stageEntry of capabilityEntries(capability, label))", "for (const stageEntry of [])"),
	], tests: [CK], expectRed: [R2445] },
	{ n: "R5", name: "(13) a retired capability may hold a live feature", edits: [
		one(TREE, "if (!feature.status?.startsWith(\"retired (\")) fieldProblem", "if (false) fieldProblem"),
	], tests: [CK], expectRed: [R2445] },

	// Lift.
	{ n: "L1", name: "(14) the lift refuses carried Kind: and Retired: lines", edits: [
		one(LIFT, "if (!/^(Purpose|Outcome|Status):/.test(bareLines[i])) continue;", "if (!/^(Purpose|Outcome|Status|Kind|Retired):/.test(bareLines[i])) continue;"),
	], tests: [CK], expectRed: [R2440] },
	{ n: "L2", name: "(14) the lift's field block takes Kind: and regenerates it away", edits: [
		one(LIFT, "    if (id.startsWith(\"CAP-\") && !outcomeFound", "    if (id.startsWith(\"CAP-\") && /^Kind:/.test(l)) { set.add(i); continue; }\n    if (id.startsWith(\"CAP-\") && !outcomeFound"),
	], tests: [CK], expectRed: [R2440] },

	// Outline.
	{ n: "O1", name: "(15) a Kind: — placeholder on every capability", edits: [
		one(TREE, RENDER_FIELD, "        if (!entries.length) { if (label === \"Kind\") out.push(`${prefix}  Kind: —`); continue; }\n        const values = entries.flatMap((entry) => CAPABILITY_LIST_FIELDS.has(label) ? splitCapabilityList(entry.value) : [entry.value]);\n        out.push("),
	], tests: [CK], expectRed: [R2446] },
	{ n: "O2", name: "(15) the field lines go before the Parent line", edits: [
		one(TREE, "out.push(`${prefix}  ${label}: ${values.join(\", \")}`);", "out.splice(out.length - 1, 0, `${prefix}  ${label}: ${values.join(\", \")}`);"),
	], tests: [CK], expectRed: [R2446] },
	{ n: "O3", name: "(16) checkOutlineFields ignores the field lines", edits: [
		one(TREE, "    if (h.id.startsWith(\"CAP-\")) {\n      let fieldOffset", "    if (false) {\n      let fieldOffset"),
	], tests: [CK], expectRed: [R2446] },
	{ n: "O4", name: "the renderer drops Needs: (no outline line)", edits: [
		one(TREE, RENDER_FIELD, "        if (!entries.length || label === \"Needs\") continue;\n        const values = entries.flatMap((entry) => CAPABILITY_LIST_FIELDS.has(label) ? splitCapabilityList(entry.value) : [entry.value]);\n        out.push("),
	], tests: [CK], expectRed: [R2446] },

	// Movement report.
	{ n: "M1", name: "(17) the early return stays ahead of the capability section", edits: [
		one(MOVED, "if (rowCount === 0 && capabilityChanges.length === 0) return \"tree movement: none\";", "if (rowCount === 0) return \"tree movement: none\";"),
	], tests: [MV], expectRed: [R2447] },
	{ n: "M2", name: "(18) Needs, Binds and Deliverables compared in order", edits: [
		one(MOVED, "if (!SET_FIELDS.has(label)) return left.length", "if (true) return left.length"),
	], tests: [MV], expectRed: [R2447] },
	{ n: "M3", name: "(18) fields compared as raw text", edits: [
		one(MOVED, "entry.value.split(\",\").map((token) => token.trim())", "[entry.value]"),
	], tests: [MV], expectRed: [R2447] },
	{ n: "M4", name: "a feature move between capabilities is not reported", edits: [
		one(MOVED, "if (before !== after) capabilityChanges.push(", "if (false) capabilityChanges.push("),
	], tests: [MV], expectRed: [R2447] },
	{ n: "M5", name: "a new or removed capability is not reported", edits: [
		one(MOVED, "for (const capability of baseCaps.values()) if (!headCaps.has(capability.id))", "for (const capability of baseCaps.values()) if (false)"),
		one(MOVED, "for (const capability of headCaps.values()) if (!baseCaps.has(capability.id))", "for (const capability of headCaps.values()) if (false)"),
	], tests: [MV], expectRed: [R2447] },
	{ n: "M6", name: "only Kind changes are reported", edits: [
		one(MOVED, "if (!equalCapabilityValues(label, before.fields[label], after.fields[label]))", "if (label === \"Kind\" && !equalCapabilityValues(label, before.fields[label], after.fields[label]))"),
	], tests: [MV], expectRed: [R2447] },
	{ n: "M7", name: "the summary line names no capability count", edits: [
		one(MOVED, "const suffix = capabilityChanges.length ? ", "const suffix = false ? "),
	], tests: [MV], expectRed: [R2447] },
];

process.exitCode = await runMutations({ lane: "cap-kinds", self: import.meta.url, tip: "c97ddc66", declared: DECLARED, pairs: PAIRS });
