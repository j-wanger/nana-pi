#!/usr/bin/env node
// Seat wrong-code pairs for lane bom-pack-config (install and hook lane), written by the seat 2026-10-19 on tip 208ffcd,
// on the shared runner. Each pair reverts one product site the lane changed to its main form (a plain JSON.parse) or
// sets the shared parser to an obvious wrong implementation (must-meet.md P6; the builder's own wrong-code tries).
// Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/bom-pack-config-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const DD = "packages/nana-setup/tests/doctor-detail.test.mjs";
const IN = "packages/nana-setup/tests/install.test.mjs";
const PJ = "packages/nana-setup/tests/project.test.mjs";
const AR = "packages/nana-pack/tests/adoption-reader.test.mjs";
const AP = "packages/nana-pack/tests/adoption-producer.test.mjs";
const JT = "packages/nana-pack/lib/json-text.mjs";
const ST = "packages/nana-setup/lib/steps.mjs";
const AD = "packages/nana-pack/lib/adoption.mjs";
const PO = "packages/nana-setup/lib/project.mjs";
const R1580 = "doctor reads a nana-pack.json saved with a byte-order mark and CRLF as it reads the same file without one";
const R1581 = "objective seed: not created when a nana-pack.json saved with a byte-order mark points elsewhere";
const R1582 = "project skips .pi/nana-pack.json when a user nana-pack.json saved with a byte-order mark has postEdit.commands";
const R1583 = "--check counts post-edit commands from a .pi/nana-pack.json saved with a byte-order mark";
const R1584 = "hook: a nana-pack.json saved with a byte-order mark keeps its absolute journal.path";
const R1585 = "adoption: a nana-pack.json saved with a byte-order mark keeps journal.enabled false, journal.path and objective.projectFile";
const R1586 = "two leading marks, a mark inside the object or malformed text after one mark stay unparseable for doctor and adoption";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const PARSE = 'return JSON.parse(text.startsWith("\\uFEFF") ? text.slice(1) : text);';

const DECLARED = [
	"(a) every pair runs on macOS; a byte-order mark is file bytes on every platform, and the Windows run is CI's Windows leg",
	"(b) no pair for the six inline one-mark strips, pi's settings.json readers or the frozen desk: the lane leaves them unchanged (must-meet.md known limits 1, 4 and 5)",
];

const PAIRS = [
	{ n: "M1", name: "parseJsonText removes no mark (main's plain JSON.parse at all three sites)", edits: [
		one(JT, PARSE, "return JSON.parse(text);"),
	], tests: [DD, IN, PJ, AR, AP], expectRed: [R1580, R1581, R1582, R1583, R1584, R1585] },
	{ n: "M2", name: "parseJsonText removes every leading mark", edits: [
		one(JT, PARSE, 'return JSON.parse(text.replace(/^\\uFEFF+/, ""));'),
	], tests: [DD], expectRed: [R1586] },
	{ n: "M3", name: "parseJsonText trims the text instead of removing one mark", edits: [
		one(JT, PARSE, "return JSON.parse(text.trim());"),
	], tests: [DD], expectRed: [R1586] },
	{ n: "M4", name: "parseJsonText removes every mark anywhere in the text", edits: [
		one(JT, PARSE, 'return JSON.parse(text.replace(/\\uFEFF/g, ""));'),
	], tests: [DD], expectRed: [R1586] },
	{ n: "M5", name: "parseJsonText returns an empty object for text it cannot parse", edits: [
		one(JT, PARSE, `try { ${PARSE} } catch { return {}; }`),
	], tests: [DD], expectRed: [R1586] },
	{ n: "M6", name: "readPiPackConfig keeps main's plain JSON.parse (doctor, install, project seeding)", edits: [
		one(ST, 'return parseJsonText(fs.readFileSync(layout.piPackConfig, "utf8"));', 'return JSON.parse(fs.readFileSync(layout.piPackConfig, "utf8"));'),
	], tests: [DD, IN, PJ], expectRed: [R1580, R1581, R1582] },
	{ n: "M7", name: "adoptionSettings keeps main's plain JSON.parse (hook and producer)", edits: [
		one(AD, 'u = parseJsonText(readBounded(path.join(agent, "nana-pack.json")).toString("utf8")) ?? {};', 'u = JSON.parse(readBounded(path.join(agent, "nana-pack.json")).toString("utf8")) ?? {};'),
	], tests: [AR, AP], expectRed: [R1584, R1585] },
	{ n: "M8", name: "checkProject keeps main's plain JSON.parse of .pi/nana-pack.json", edits: [
		one(PO, 'projectConfig = parseJsonText(fs.readFileSync(path.join(dir, ".pi", "nana-pack.json"), "utf8"));', 'projectConfig = JSON.parse(fs.readFileSync(path.join(dir, ".pi", "nana-pack.json"), "utf8"));'),
	], tests: [PJ], expectRed: [R1583] },
];

process.exitCode = await runMutations({ lane: "bom-pack-config", self: import.meta.url, tip: "208ffcd", declared: DECLARED, pairs: PAIRS });
