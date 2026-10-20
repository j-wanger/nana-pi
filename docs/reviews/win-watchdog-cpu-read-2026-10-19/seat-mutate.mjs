#!/usr/bin/env node
// Seat wrong-code pairs for lane win-watchdog-cpu-read (gate lane: pi-watchdog sits behind pi-review and pi-worker),
// written by the seat 2026-10-19 after build 1 and the merge of main, on the shared runner. Every pair edits product code
// only — packages/nana-pack/bin/pi-watchdog.mjs or the sealed constant in packages/nana-pack/bin/worker-config.mjs —
// never a test. P1 to P4 revert a site to main's form; W2 to W10 are build-brief-1.md's wrong-code table (W7 split into
// the parser literal and the sealed value K1, W9 split into the missing yield and the missing re-check); D1, H1, T1 and
// U1 are the obvious wrong forms of the parser's guard, hours field and trim and of the unreadable line. Run from the
// worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-watchdog-cpu-read-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const WD = "packages/nana-pack/bin/pi-watchdog.mjs";
const WC = "packages/nana-pack/bin/worker-config.mjs";
const CT = "packages/nana-pack/tests/watchdog-cpu.test.mjs";
const M2 = "R-1891: the CPU sample parser reads whole Windows ticks and ps times, and no number from comma, point or empty text";
const SEAL = "R-1891 seal: WIN_CPU_TICKS_PER_SECOND is 10,000,000";
const M3 = "R-1892: unreadable CPU samples print unreadable and count as flat against the last readable time";
const M4 = "R-1893: a pi that exits during a CPU read ends by its own exit status, whether the read fails or repeats the last time";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const WIN_GUARD = String.raw`    if (!/^\d+$/.test(text)) return null;`;
const WIN_TICKS = "    const ticks = Number(text);";
const WIN_RETURN = "    return Number.isFinite(ticks) ? ticks / WIN_CPU_TICKS_PER_SECOND : null;";
const PS_PARSE = [
	String.raw`  const match = /^(?:(\d+)-)?(?:(\d+):)?(\d+):([0-5]\d(?:\.\d+)?)$/.exec(text);`,
	"  if (!match) return null;",
	"  const days = Number(match[1] ?? 0);",
	"  const hours = Number(match[2] ?? 0);",
	"  const minutes = Number(match[3]);",
	"  const seconds = Number(match[4]);",
	"  const total = days * 86400 + hours * 3600 + minutes * 60 + seconds;",
	"  return Number.isFinite(total) ? total : null;",
].join("\n");
const NULL_OPEN = "    if (cpu === null) {\n      flatPolls++;\n";
const NULL_LINE = "      process.stderr.write(`  [${tag} a${attempt}] cpu=unreadable flat=${flatPolls}/${maxFlat}\\n`);\n";
const YIELD = "    await new Promise((r) => setImmediate(r));\n";
const RECHECK = "    if (child.exitCode !== null || child.signalCode !== null) break;\n";

const DECLARED = [
	"(a) every pair runs on macOS; R-1890 (M1) prints SKIP here, so no pair names it",
	"(b) no pair for the win32 read expression (W1: TotalProcessorTime.Ticks back to .CPU): only M1 reaches it, and M1 runs Windows PowerShell 5.1, which exists only on Windows; the seat runs W1 on the lane's Windows CI leg",
	"(c) no pair for the immutable-review stall fold (a test fixture, not product code) or for the pack README's two sentences",
	"(d) no pair for parseCpuSample's typeof guard or its two Number.isFinite checks: cpuSeconds always passes execSync's utf8 string, and the two patterns admit only digit text short of Infinity in practice, so a mutant there is equivalent on every input a reader prints (inferred, not run)",
	"(e) H1 is expected to survive: every ps case in M2 carries a zero hours field (00:01:05, 1-00:00:01), so a parser that drops the hours reads them all right",
];

const PAIRS = [
	{ n: "P1", name: "main's win32 parse: any finite number is seconds, any other text 0", edits: [
		one(WD, `${WIN_GUARD}\n${WIN_TICKS}\n${WIN_RETURN}`, "    const seconds = Number(text);\n    return Number.isFinite(seconds) ? seconds : 0;"),
	], tests: [CT], expectRed: [M2] },
	{ n: "P2", name: "main's ps parse: colon fields folded by 60, empty text 0, no day prefix", edits: [
		one(WD, PS_PARSE, "  if (!text) return 0;\n  return text.split(':').map(Number).reduce((acc, n) => acc * 60 + n, 0);"),
	], tests: [CT], expectRed: [M2, M3] },
	{ n: "P3", name: "main's poll: an unreadable sample is compared and stored like a number", edits: [
		one(WD, `${NULL_OPEN}${NULL_LINE}    } else {\n`, "    {\n"),
	], tests: [CT], expectRed: [M3] },
	{ n: "P4", name: "main's catch: a failed read gives 0 (W6)", edits: [
		one(WD, "    return parseCpuSample(raw);\n  } catch {\n    return null;", "    return parseCpuSample(raw);\n  } catch {\n    return 0;"),
	], tests: [CT], expectRed: [M3] },
	{ n: "W2", name: "the win32 parser reads a decimal comma as a point", edits: [
		one(WD, `${WIN_GUARD}\n${WIN_TICKS}`, String.raw`    if (!/^\d+(?:[.,]\d+)?$/.test(text)) return null;` + "\n    const ticks = Number(text.replace(',', '.'));"),
	], tests: [CT], expectRed: [M2] },
	{ n: "W3", name: "the ps parser gives 0 for unreadable text", edits: [
		one(WD, "  if (!match) return null;", "  if (!match) return 0;"),
	], tests: [CT], expectRed: [M2, M3] },
	{ n: "W4", name: "an unreadable poll leaves the flat count unchanged", edits: [
		one(WD, NULL_OPEN, "    if (cpu === null) {\n"),
	], tests: [CT], expectRed: [M3] },
	{ n: "W5", name: "an unreadable poll overwrites the last readable time", edits: [
		one(WD, NULL_OPEN, `${NULL_OPEN}      lastCpu = cpu;\n`),
	], tests: [CT], expectRed: [M3] },
	{ n: "W7", name: "the win32 parser divides by a literal 1e6", edits: [
		one(WD, "ticks / WIN_CPU_TICKS_PER_SECOND", "ticks / 1e6"),
	], tests: [CT], expectRed: [M2] },
	{ n: "K1", name: "the sealed tick scale is 1,000,000", edits: [
		one(WC, "export const WIN_CPU_TICKS_PER_SECOND = 10_000_000;", "export const WIN_CPU_TICKS_PER_SECOND = 1_000_000;"),
	], tests: [CT], expectRed: [SEAL] },
	{ n: "W8", name: "the ps parser ignores the day prefix", edits: [
		one(WD, "  const days = Number(match[1] ?? 0);", "  const days = 0;"),
	], tests: [CT], expectRed: [M2] },
	{ n: "W9a", name: "no yield between the read and the exit re-check", edits: [
		one(WD, YIELD, ""),
	], tests: [CT], expectRed: [M4] },
	{ n: "W9b", name: "no exit re-check after the read", edits: [
		one(WD, `${YIELD}${RECHECK}`, YIELD),
	], tests: [CT], expectRed: [M4] },
	{ n: "W10", name: "the exit re-check runs only after an unreadable read", edits: [
		one(WD, `${YIELD}${RECHECK}`, `${YIELD}    if (cpu === null && (child.exitCode !== null || child.signalCode !== null)) break;\n`),
	], tests: [CT], expectRed: [M4] },
	{ n: "D1", name: "the win32 parser takes any finite number as ticks (digits-only guard dropped)", edits: [
		one(WD, `${WIN_GUARD}\n`, ""),
	], tests: [CT], expectRed: [M2] },
	{ n: "H1", name: "the ps parser ignores the hours field", edits: [
		one(WD, "  const hours = Number(match[2] ?? 0);", "  const hours = 0;"),
	], tests: [CT], expectRed: [M2] },
	{ n: "T1", name: "the parser does not trim the reader's output", edits: [
		one(WD, "  const text = raw.trim();", "  const text = raw;"),
	], tests: [CT], expectRed: [M2, M3, M4] },
	{ n: "U1", name: "an unreadable poll prints the raw sample instead of cpu=unreadable", edits: [
		one(WD, "cpu=unreadable flat=", "cpu=${cpu}s flat="),
	], tests: [CT], expectRed: [M3] },
];

process.exitCode = await runMutations({ lane: "win-watchdog-cpu-read", self: import.meta.url, tip: "62627846", declared: DECLARED, pairs: PAIRS });
