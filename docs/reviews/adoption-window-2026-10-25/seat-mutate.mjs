#!/usr/bin/env node
// Seat wrong-code pairs for lane adoption-window (hook), written by the seat 2026-10-25 after build 2 at f3927f37.
// They follow the must-meet rows' red cases (R-2850 to R-2852) and the seal, with TAIL_BYTES retuned to the cap as the must-meet's ladder names.
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/adoption-window-2026-10-25/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const AD = "packages/nana-pack/lib/adoption.mjs";
const BIN = "packages/nana-pack/bin/nana-adoption.mjs";
const CF = "packages/nana-pack/lib/adoption-config.mjs";
const TR = "packages/nana-pack/tests/adoption-reader.test.mjs";
const TP = "packages/nana-pack/tests/adoption-producer.test.mjs";
const R_2850 = /^R-2850: /; // R-2850
const R_2851 = /^R-2851: /; // R-2851
const R_2852 = /^R-2852: /; // R-2852
const SEAL = /^seal: the adoption reader reads at most 4 MiB/; // R-146 R-151 R-2850 R-2851 R-2852
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const READ = "const { lines, start } = readTail(file, maxBytes);";
const CUT_RETURN = "return Object.assign(lines, { cut: start === 0 ? null : { oldest } });";
const CUT_PUSH = "if (cut) out.push(...(out.length ? [\"\"] : []), ";
const WRITE = "process.stdout.write(`${TAG}\\n${out.join(\"\\n\")}\\n`);";

const DECLARED = [
	"(seat) pairs 1 to 4 follow R-2850's red cases; 5 to 15 R-2851's; 16 to 18 R-2852's; 19 to 22 the seal (TAIL_BYTES retuned to the cap, then each sealed config value)",
	"(seat) pair 8 (coverage and time from the journal's first line) also stands for R-2852's third red case; R-2852's own fixture cannot show it, because its journal's first dated line is the 8-day line, so only R-2851 is named",
	"(seat) declared non-pair: R-2851's 'time from the straddling line' and 'the straddling fragment dated by a pattern read of ts'. readTail drops the read's first segment, so the fragment never reaches windowLines; showing it takes two faults (keep the torn segment in readTail, which also breaks R-146's producer tail, and a pattern read of ts). A pattern read alone changes nothing on these fixtures",
];

const PAIRS = [
	{ n: "1", name: "the window read uses today's 256 KiB tail", edits: [one(AD, READ, "const { lines, start } = readTail(file, TAIL_BYTES);")], tests: [TR, TP], expectRed: [R_2850, R_2851] },
	{ n: "2", name: "the window read stops one byte short of the cap", edits: [one(AD, READ, "const { lines, start } = readTail(file, maxBytes - 1);")], tests: [TR, TP], expectRed: [R_2850] },
	{ n: "3", name: "coverage is judged by time only, so a read from the first byte prints a cut line", edits: [one(AD, CUT_RETURN, "return Object.assign(lines, { cut: { oldest } });")], tests: [TR, TP], expectRed: [R_2850] },
	{ n: "4", name: "a read that fills the cap counts as over the cap", edits: [one(AD, CUT_RETURN, "return Object.assign(lines, { cut: lines.join(\"\\n\").length + 1 < maxBytes ? null : { oldest } });")], tests: [TR, TP], expectRed: [R_2850, R_2851] },
	{ n: "5", name: "the cut line is silent when nothing is open", edits: [one(BIN, CUT_PUSH, "if (cut && out.length) out.push(...(out.length ? [\"\"] : []), ")], tests: [TR, TP], expectRed: [R_2851] },
	{ n: "6", name: "the cut line prints before the block", edits: [one(BIN, CUT_PUSH, "if (cut) out.unshift(")], tests: [TR, TP], expectRed: [R_2851] },
	{ n: "7", name: "the cut line prints twice", edits: [one(BIN, WRITE, "process.stdout.write(`${TAG}\\n${out.join(\"\\n\")}\\n${cut ? `${out.at(-1)}\\n` : \"\"}`);")], tests: [TR, TP], expectRed: [R_2851] },
	{ n: "8", name: "coverage and the oldest time come from the journal's first line", edits: [one(AD, "for (const line of lines) {", "for (const line of readTail(file, Infinity).lines) {")], tests: [TR, TP], expectRed: [R_2851] },
	{ n: "9", name: "the oldest time comes from the read's last line", edits: [one(AD, "for (const line of lines) {", "for (const line of [...lines].reverse()) {")], tests: [TR, TP], expectRed: [R_2851, R_2852] },
	{ n: "10", name: "no dated line leaves Invalid Date in the cut line", edits: [one(AD, "let oldest = null;", "let oldest = String(new Date(NaN));")], tests: [TR, TP], expectRed: [R_2851] },
	{ n: "11", name: "the cut line names the journal's size, not the cap", edits: [one(BIN, "${JOURNAL_WINDOW_READ_MAX_BYTES} bytes were read, back to", "${fs.statSync(journal).size} bytes were read, back to")], tests: [TR, TP], expectRed: [R_2851] },
	{ n: "12", name: "the no-dated-line form names TAIL_BYTES, not the cap", edits: [one(BIN, "${JOURNAL_WINDOW_READ_MAX_BYTES} bytes were read, and they hold", "${256 * 1024} bytes were read, and they hold")], tests: [TR, TP], expectRed: [R_2851] },
	{ n: "13", name: "a cut with no dated line throws into ADOPTION UNAVAILABLE", edits: [one(BIN, "cut.oldest === null ?", "cut.oldest.length === 0 ?")], tests: [TR, TP], expectRed: [R_2851] },
	{ n: "14", name: "a cut exits 1", edits: [one(BIN, WRITE, "process.stdout.write(`${TAG}\\n${out.join(\"\\n\")}\\n`, () => process.exit(cut ? 1 : 0));")], tests: [TR, TP], expectRed: [R_2851] },
	{ n: "15", name: "the cap is ignored and the whole journal read", edits: [one(AD, READ, "const { lines, start } = readTail(file, Infinity);")], tests: [TR, TP], expectRed: [R_2851] },
	{ n: "16", name: "a cut line prints whenever the journal exceeds the cap", edits: [one(AD, "if (time <= sinceMs) return", "if (time <= sinceMs && start === 0) return")], tests: [TR, TP], expectRed: [R_2852] },
	{ n: "17", name: "a non-JSON first line ends the coverage scan", edits: [one(AD, "} catch {}", "} catch { break; }")], tests: [TR, TP], expectRed: [R_2852] },
	{ n: "18", name: "a JSON line with no ts ends the coverage scan", edits: [one(AD, "\t\t\t\tbreak;\n\t\t\t}\n\t\t} catch {}", "\t\t\t\tbreak;\n\t\t\t} else break;\n\t\t} catch {}")], tests: [TR, TP], expectRed: [R_2852] },
	{ n: "19", name: "the producer's tail is retuned to the cap", edits: [one(AD, "export const TAIL_BYTES = 256 * 1024;", "export const TAIL_BYTES = 4 * 1024 * 1024;")], tests: [TR, TP], expectRed: [SEAL] },
	{ n: "20", name: "the read cap is retuned", edits: [one(CF, "export const JOURNAL_WINDOW_READ_MAX_BYTES = 4 * 1024 * 1024;", "export const JOURNAL_WINDOW_READ_MAX_BYTES = 2 * 1024 * 1024;")], tests: [TR, TP], expectRed: [SEAL] },
	{ n: "21", name: "the window is retuned", edits: [one(CF, "export const ADOPTION_WINDOW_MS = 7 * 86_400_000;", "export const ADOPTION_WINDOW_MS = 8 * 86_400_000;")], tests: [TR, TP], expectRed: [SEAL] },
	{ n: "22", name: "the cut prefix is retuned", edits: [one(CF, "export const ADOPTION_WINDOW_CUT_PREFIX = \"ADOPTION WINDOW CUT:\";", "export const ADOPTION_WINDOW_CUT_PREFIX = \"ADOPTION WINDOW CUT -\";")], tests: [TR, TP], expectRed: [SEAL] },
];

process.exitCode = await runMutations({ lane: "adoption-window", self: import.meta.url, tip: "f3927f37", declared: DECLARED, pairs: PAIRS });
