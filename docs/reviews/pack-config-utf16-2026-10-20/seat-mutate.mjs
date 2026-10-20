#!/usr/bin/env node
// Seat wrong-code pairs for lane pack-config-utf16 (install, hook or gate lane: json-text.mjs's parseJsonBytes feeds
// config.ts, adoption.mjs, nana-roster, roster-set, doctor, steps and project), written by the seat 2026-10-20 after
// build 1 and the merge of main c203f485, on the shared runner. C1, A1, N1, S1, D1, T1 and P1 revert each of the seven
// readers to its main decode; J1 to J11 put parseJsonBytes in the plan's and the attack's wrong forms (plan-attack.md
// P7, amendment 3); K1 swaps the two contract marks. Every edit is product code, never a test. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/pack-config-utf16-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const JT = "packages/nana-pack/lib/json-text.mjs";
const CF = "packages/nana-pack/lib/config.ts";
const AD = "packages/nana-pack/lib/adoption.mjs";
const NR = "packages/nana-pack/bin/nana-roster.mjs";
const RS = "packages/nana-pack/lib/roster-set.mjs";
const DR = "packages/nana-setup/lib/doctor.mjs";
const ST = "packages/nana-setup/lib/steps.mjs";
const PM = "packages/nana-setup/lib/project.mjs";
const PU = "packages/nana-pack/tests/pack-config-utf16.test.mjs";
const AR = "packages/nana-pack/tests/adoption-reader.test.mjs";
const DD = "packages/nana-setup/tests/doctor-detail.test.mjs";
const PJ = "packages/nana-setup/tests/project.test.mjs";
const R2230 = "R-2230: the gate applies a UTF-16LE or UTF-16BE user nana-pack.json's extraPatterns with no stop reason";
const R2231 = "R-2231: the objective producer prints nothing for a UTF-16LE user nana-pack.json with objective.enabled false";
const R2232 = "R-2232: nana-roster --json and set give byte-identical output and file for a UTF-16LE and a UTF-8 nana-pack.json";
const R2233 = "doctor reads a UTF-16LE nana-pack.json as it reads the same JSON saved as UTF-8";
const R2234 = "--check counts post-edit commands from a UTF-16LE project or user nana-pack.json as from UTF-8";
const R2235 = "hook: a UTF-16LE nana-pack.json keeps its absolute journal.path";
const R2236 = "R-2236: UTF-16 with no mark, two marks or an odd byte count, LE or BE, stays unparseable for the objective producer";
const R1586 = "two leading marks, a mark inside the object or malformed text after one mark stay unparseable for doctor and adoption";
const AR_MARK = "hook: a nana-pack.json saved with a byte-order mark keeps its absolute journal.path";
const DD_MARK = "doctor reads a nana-pack.json saved with a byte-order mark and CRLF as it reads the same file without one";
const PJ_MARK_CHECK = "--check counts post-edit commands from a .pi/nana-pack.json saved with a byte-order mark";
const PJ_MARK_SKIP = "project skips .pi/nana-pack.json when a user nana-pack.json saved with a byte-order mark has postEdit.commands";
const DD_MARK_PLACE = "doctor names an unparseable nana-pack.json's file and the error-kind repair, never the file's text";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const ODD = 'if (buffer.length % 2 !== 0) throw new SyntaxError("UTF-16 JSON has an odd byte count");';
const LE_IF = "if (buffer.subarray(0, 2).equals(UTF16_LE_MARK)) {";
const BE_IF = "} else if (buffer.subarray(0, 2).equals(UTF16_BE_MARK)) {";
const LE_DECODE = 'text = buffer.toString("utf16le");';
const BE_DECODE = 'text = Buffer.from(buffer).swap16().toString("utf16le");';
const UTF8_DECODE = 'text = buffer.toString("utf8");';
const PARSE = "return parseJsonText(text);";

const DECLARED = [
	"(a) every pair runs on macOS; R-2237 (Windows PowerShell 5.1 writes the file) prints SKIP off Windows, so no pair names it",
	"(b) no pair drops the UTF-16BE odd-count check alone: swap16 throws RangeError 'Buffer size must be a multiple of 16-bits' on an odd length (one-off node probe), which every reader's catch takes as it takes the SyntaxError, so the pair would be an equivalent mutant (plan-attack.md P7)",
	"(c) no pair for nana-pack.json.bak: roster-set's copyFileSync is unchanged by the lane; a one-off probe in a temporary home saw set write UTF-8 (first byte '{') from a UTF-16LE file and leave .bak byte-identical to the original FF FE file; R-1407 pins .bak bytes for UTF-8 only",
	"(d) no pair for install's objective seed: steps.mjs's only lane change is readPiPackConfig, which T1 reaches through project --check; seedFile's never-overwrite path is unchanged by the lane",
	"(e) N1 leaves nana-roster.mjs's new parseJsonBytes import in place, unused",
];

const PAIRS = [
	{ n: "C1", name: "config.ts readConfigFile decodes UTF-8 and calls parseJsonText, as on main", edits: [
		one(CF, 'import { jsonParseFailure, parseJsonBytes } from "./json-text.mjs";', 'import { jsonParseFailure, parseJsonText } from "./json-text.mjs";'),
		one(CF, "let bytes: Buffer;", "let text: string;"),
		one(CF, "bytes = readBounded(p);", 'text = readBounded(p).toString("utf-8");'),
		one(CF, "raw = parseJsonBytes(bytes);", "raw = parseJsonText(text);"),
	], tests: [PU], expectRed: [R2230, R2231] },
	{ n: "A1", name: "adoptionSettings decodes UTF-8 and calls parseJsonText, as on main", edits: [
		one(AD, 'import { parseJsonBytes } from "./json-text.mjs";', 'import { parseJsonText } from "./json-text.mjs";'),
		one(AD, 'u = parseJsonBytes(readBounded(path.join(agent, "nana-pack.json"))) ?? {};', 'u = parseJsonText(readBounded(path.join(agent, "nana-pack.json")).toString("utf8")) ?? {};'),
	], tests: [AR], expectRed: [R2235] },
	{ n: "N1", name: "nana-roster readRosterFile and resolveRoster decode UTF-8 and strip one U+FEFF, as on main", edits: [
		one(NR, "return { kind: 'read', bytes: buf };", "return { kind: 'read', text: buf.toString('utf8') };"),
		one(NR, "raw = parseJsonBytes(state.bytes);", String.raw`raw = JSON.parse(state.text.replace(/^\uFEFF/, ''));`),
	], tests: [PU], expectRed: [R2232] },
	{ n: "S1", name: "roster-set decodes UTF-8 and strips one U+FEFF, as on main", edits: [
		one(RS, "raw = parseJsonBytes(buf);", String.raw`raw = JSON.parse(buf.toString('utf8').replace(/^\uFEFF/, ''));`),
	], tests: [PU], expectRed: [R2232] },
	{ n: "D1", name: "doctor piPackConfigState reads the file as UTF-8 and calls parseJsonText, as on main", edits: [
		one(DR, "let bytes;", "let text;"),
		one(DR, "bytes = fs.readFileSync(file);", 'text = fs.readFileSync(file, "utf8");'),
		one(DR, "return { cfg: parseJsonBytes(bytes), parseDetail: null };", "return { cfg: parseJsonText(text), parseDetail: null };"),
	], tests: [DD], expectRed: [R2233] },
	{ n: "T1", name: "steps readPiPackConfig reads the user file as UTF-8 and calls parseJsonText, as on main", edits: [
		one(ST, "return parseJsonBytes(fs.readFileSync(layout.piPackConfig));", 'return parseJsonText(fs.readFileSync(layout.piPackConfig, "utf8"));'),
	], tests: [PJ], expectRed: [R2234] },
	{ n: "P1", name: "project --check reads .pi/nana-pack.json as UTF-8 and calls parseJsonText, as on main", edits: [
		one(PM, 'import { parseJsonBytes } from "../../nana-pack/lib/json-text.mjs";', 'import { parseJsonText } from "../../nana-pack/lib/json-text.mjs";'),
		one(PM, 'projectConfig = parseJsonBytes(fs.readFileSync(path.join(dir, ".pi", "nana-pack.json")));', 'projectConfig = parseJsonText(fs.readFileSync(path.join(dir, ".pi", "nana-pack.json"), "utf8"));'),
	], tests: [PJ], expectRed: [R2234] },
	{ n: "J1", name: "an odd byte count after the UTF-16LE mark is allowed", edits: [
		one(JT, `${LE_IF}\n\t\t${ODD}`, LE_IF),
	], tests: [PU], expectRed: [R2236] },
	{ n: "J2", name: "the UTF-16LE mark bytes are sliced off before decoding", edits: [
		one(JT, LE_DECODE, 'text = buffer.subarray(2).toString("utf16le");'),
	], tests: [PU], expectRed: [R2236] },
	{ n: "J3", name: "the UTF-16BE mark bytes are sliced off before the swap", edits: [
		one(JT, BE_DECODE, 'text = Buffer.from(buffer.subarray(2)).swap16().toString("utf16le");'),
	], tests: [PU], expectRed: [R2236] },
	{ n: "J4", name: "UTF-16LE decodes through TextDecoder with its default ignoreBOM", edits: [
		one(JT, LE_DECODE, 'text = new TextDecoder("utf-16le").decode(buffer);'),
	], tests: [PU], expectRed: [R2236] },
	{ n: "J5", name: "UTF-16BE decodes through TextDecoder with its default ignoreBOM", edits: [
		one(JT, BE_DECODE, 'text = new TextDecoder("utf-16be").decode(buffer);'),
	], tests: [PU], expectRed: [R2236] },
	{ n: "J6", name: "every leading U+FEFF is stripped before JSON.parse", edits: [
		one(JT, PARSE, String.raw`return JSON.parse(text.replace(/^\uFEFF+/, ""));`),
	], tests: [PU, DD], expectRed: [R2236, R1586] },
	{ n: "J7", name: "UTF-16BE decodes as UTF-16LE with no byte swap", edits: [
		one(JT, BE_DECODE, LE_DECODE),
	], tests: [PU], expectRed: [R2230] },
	{ n: "J8", name: "no UTF-16BE branch: a FE FF file decodes as UTF-8, as on main", edits: [
		one(JT, BE_IF, "} else if (false) {"),
	], tests: [PU], expectRed: [R2230] },
	{ n: "J9", name: "a buffer with no mark that holds a NUL byte decodes as UTF-16LE", edits: [
		one(JT, UTF8_DECODE, 'text = buffer.includes(0) ? buffer.toString("utf16le") : buffer.toString("utf8");'),
	], tests: [PU], expectRed: [R2236] },
	{ n: "J10", name: "the UTF-8 path parses without removing its one leading U+FEFF", edits: [
		one(JT, UTF8_DECODE, 'return JSON.parse(buffer.toString("utf8"));'),
	], tests: [AR, DD, PJ], expectRed: [AR_MARK, DD_MARK, DD_MARK_PLACE, PJ_MARK_CHECK, PJ_MARK_SKIP] },
	{ n: "J11", name: "UTF-8 decodes through TextDecoder with its default ignoreBOM", edits: [
		one(JT, UTF8_DECODE, "text = new TextDecoder().decode(buffer);"),
	], tests: [DD], expectRed: [R1586] },
	{ n: "K1", name: "the two contract marks are swapped: FE FF selects UTF-16LE and FF FE selects UTF-16BE", edits: [
		one(JT, "const UTF16_LE_MARK = Buffer.from([0xff, 0xfe]);", "const UTF16_LE_MARK = Buffer.from([0xfe, 0xff]);"),
		one(JT, "const UTF16_BE_MARK = Buffer.from([0xfe, 0xff]);", "const UTF16_BE_MARK = Buffer.from([0xff, 0xfe]);"),
	], tests: [PU], expectRed: [R2230, R2231, R2232] },
];

process.exitCode = await runMutations({ lane: "pack-config-utf16", self: import.meta.url, tip: "961f76d1", declared: DECLARED, pairs: PAIRS });
