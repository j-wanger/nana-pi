#!/usr/bin/env node
// Seat wrong-code pairs for lane win-leg-blocking (gate lane: scripts/test.mjs, the suite runner), written by the seat
// 2026-10-19 after build 1, on the shared runner. Each pair reverts one site the lane changed to its wrong form:
// today's main runner (M1), or the obvious wrong fallback or list (M2-M6). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-leg-blocking-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const TR = "packages/nana-pack/tests/test-runner.test.mjs";
const RUNNER = "scripts/test.mjs";
const WS = "packages/nana-pack/lib/windows-skips-config.mjs";
const R1380 = "R-1380: win32 SKIPs each file on the declared Windows skip list with its reason and never starts it";
const R1381 = "R-1381: off win32 each file on the declared Windows skip list runs";
const R1382 = "R-1382: win32 still runs each desk and bench file off the declared Windows skip list";
const R1383 = "R-1383: the declared Windows skip list names only collected desk and bench test files";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const FALLBACK = "process.platform === \"win32\" && Object.hasOwn(WINDOWS_SKIPS, rel(file)) ? WINDOWS_SKIPS[rel(file)] : null";
const LAST_ENTRY = "\t\"apps/bench/test/catch-ledger.test.mjs\": reason(\"bench\", SHEBANG_JUDGE),\n});";

const DECLARED = [
	"(a) every pair runs on macOS, where the test forces the runner's platform with an --import preload; path and fileURLToPath stay on the host flavour, so the Windows leg on the tip is the platform evidence",
	"(b) the list's membership (which 20 files) is pinned by no must-meet check: dropping a listed file or adding another collected desk or bench file stays green by design; the seat's Windows-leg run is that evidence; no pair",
	"(c) the SKIP branch (tally, SKIP line, coverage record, continue) is shared and unchanged by the lane, and the WINDOWS_SKIPS import has no wrong form of its own; no pair",
];

const PAIRS = [
	{ n: "M1", name: "the runner reads no Windows skip list (main's skipReason)", edits: [
		one(RUNNER, `const skipReason = SKIPS[rel(file)]?.() ?? (${FALLBACK});`, "const skipReason = SKIPS[rel(file)]?.();"),
	], tests: [TR], expectRed: [R1380] },
	{ n: "M2", name: "the Windows skip fallback ignores the platform", edits: [
		one(RUNNER, "process.platform === \"win32\" && Object.hasOwn(WINDOWS_SKIPS, rel(file))", "Object.hasOwn(WINDOWS_SKIPS, rel(file))"),
	], tests: [TR], expectRed: [R1381] },
	{ n: "M3", name: "on win32 the runner skips every desk and bench test file, listed or not", edits: [
		one(RUNNER, "Object.hasOwn(WINDOWS_SKIPS, rel(file)) ? WINDOWS_SKIPS[rel(file)] : null",
			"(rel(file).startsWith(\"apps/desk/test/\") || rel(file).startsWith(\"apps/bench/test/\")) ? (WINDOWS_SKIPS[rel(file)] ?? \"win32: desk|bench not supported on Windows\") : null"),
	], tests: [TR], expectRed: [R1382] },
	{ n: "M4", name: "the runner prints one generic reason, not the file's declared reason", edits: [
		one(RUNNER, "? WINDOWS_SKIPS[rel(file)] : null", "? \"win32: desk|bench not supported on Windows\" : null"),
	], tests: [TR], expectRed: [R1380] },
	{ n: "M5", name: "the declared list names a pack test file", edits: [
		one(WS, LAST_ENTRY, "\t\"apps/bench/test/catch-ledger.test.mjs\": reason(\"bench\", SHEBANG_JUDGE),\n\t\"packages/nana-pack/tests/review-ledger.test.mjs\": reason(\"desk\", RESOLVER_CANNOT_START),\n});"),
	], tests: [TR], expectRed: [R1383] },
	{ n: "M6", name: "a listed desk path is misspelled", edits: [
		one(WS, "\"apps/desk/test/app-listener.test.mjs\":", "\"apps/desk/test/app-listner.test.mjs\":"),
	], tests: [TR], expectRed: [R1383] },
];

process.exitCode = await runMutations({ lane: "win-leg-blocking", self: import.meta.url, tip: "f74ab32", declared: DECLARED, pairs: PAIRS });
