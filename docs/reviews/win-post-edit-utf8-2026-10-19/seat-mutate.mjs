#!/usr/bin/env node
// Seat wrong-code pairs for lane win-post-edit-utf8 (hook lane: the nana-post-edit pi extension), written by the seat
// 2026-10-19 after build 1, on the shared runner. Every pair edits packages/nana-pack/extensions/nana-post-edit.ts, the
// only product file the lane changed, never a test. P1 reverts the check's env to main's form; S1 to S6 put the
// switch line in must-meet.md's wrong forms; K1 and K2 put the named contract value in its wrong forms. Run from the
// worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-post-edit-utf8-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const PE = "packages/nana-pack/extensions/nana-post-edit.ts";
const U8 = "packages/nana-pack/tests/post-edit-utf8.test.mjs";
const R1740 = "a failing Python check with PYTHONUTF8 unset or empty shows the model its non-ASCII output as printed";
const R1741 = "a failing Python check shows the model its own Python child's non-ASCII output as printed";
const R1742 = "PYTHONUTF8, PYTHONIOENCODING, LANG, LC_ALL and LC_CTYPE values from pi reach the check unchanged";
const R1743 = "PYTHONIOENCODING, LANG, LC_ALL and LC_CTYPE that pi leaves unset stay unset for the check";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const ENV_NAME = 'const PYTHON_UTF8_ENV = "PYTHONUTF8";';
const ENV_VALUE = 'const PYTHON_UTF8_VALUE = "1";';
const ENV_COPY = "const env = { ...process.env };";
const SWITCH = "if (!process.env[PYTHON_UTF8_ENV]) env[PYTHON_UTF8_ENV] = PYTHON_UTF8_VALUE;";
const WIN_FILE = "if (win) env.NANA_PI_FILE = abs;";

const DECLARED = [
	"(a) every pair runs on macOS, where the test forces en_US.ISO8859-1 and finds Python 3.7 or later; on a host whose control already writes UTF-8 (no Latin-1 locale, or Python 3.15 or later) R-1740 and R-1741 SKIP and the pairs naming them read MISSING at baseline",
	"(b) no pair for the NANA_PI_FILE line: dropping it reaches only the hardening path checks d, e, g, h and i, which run on the Windows leg; must-meet.md lists it for the seat's Windows CI run",
	"(c) no pair for reading the switch from the spread copy instead of process.env: the two differ only in key case on Windows, and no must-meet check sets a differently cased PYTHONUTF8",
	"(d) no pair for using pi's own process.env as the check's env (no copy): the switch would then write PYTHONUTF8 into pi's environment, and no must-meet check reads pi's environment after a check, so it would survive (inferred, not run)",
];

const PAIRS = [
	{ n: "P1", name: "main's env: undefined on POSIX, NANA_PI_FILE only on win32, no UTF-8 mode switch", edits: [
		one(PE, ENV_COPY, "const env = win ? { ...process.env, NANA_PI_FILE: abs } : undefined;"),
		one(PE, SWITCH, "/* no UTF-8 mode switch */"),
		one(PE, WIN_FILE, "/* NANA_PI_FILE set above */"),
	], tests: [U8], expectRed: [R1740, R1741] },
	{ n: "S1", name: "the switch on win32 only", edits: [
		one(PE, SWITCH, "if (win && !process.env[PYTHON_UTF8_ENV]) env[PYTHON_UTF8_ENV] = PYTHON_UTF8_VALUE;"),
	], tests: [U8], expectRed: [R1740, R1741] },
	{ n: "S2", name: "the switch only when PYTHONUTF8 is undefined, so an empty value counts as set", edits: [
		one(PE, SWITCH, "if (process.env[PYTHON_UTF8_ENV] === undefined) env[PYTHON_UTF8_ENV] = PYTHON_UTF8_VALUE;"),
	], tests: [U8], expectRed: [R1740] },
	{ n: "S3", name: "the switch always overrides the owner's PYTHONUTF8", edits: [
		one(PE, SWITCH, "env[PYTHON_UTF8_ENV] = PYTHON_UTF8_VALUE;"),
	], tests: [U8], expectRed: [R1742] },
	{ n: "S4", name: "PYTHONIOENCODING=utf-8 beside the switch, only when pi leaves it unset", edits: [
		one(PE, SWITCH, `${SWITCH} if (!process.env.PYTHONIOENCODING) env.PYTHONIOENCODING = "utf-8";`),
	], tests: [U8], expectRed: [R1743] },
	{ n: "S5", name: "LC_ALL=en_US.UTF-8 beside the switch, only when pi leaves it unset", edits: [
		one(PE, SWITCH, `${SWITCH} if (!process.env.LC_ALL) env.LC_ALL = "en_US.UTF-8";`),
	], tests: [U8], expectRed: [R1743] },
	{ n: "S6", name: "LANG=C.UTF-8 beside the switch, only when pi leaves it unset", edits: [
		one(PE, SWITCH, `${SWITCH} if (!process.env.LANG) env.LANG = "C.UTF-8";`),
	], tests: [U8], expectRed: [R1743] },
	{ n: "K1", name: "the named value is PYTHONIOENCODING=utf-8 in place of the UTF-8 mode switch", edits: [
		one(PE, ENV_NAME, 'const PYTHON_UTF8_ENV = "PYTHONIOENCODING";'),
		one(PE, ENV_VALUE, 'const PYTHON_UTF8_VALUE = "utf-8";'),
	], tests: [U8], expectRed: [R1741, R1743] },
	{ n: "K2", name: "the named value turns UTF-8 mode off (PYTHONUTF8=0)", edits: [
		one(PE, ENV_VALUE, 'const PYTHON_UTF8_VALUE = "0";'),
	], tests: [U8], expectRed: [R1740, R1741] },
];

process.exitCode = await runMutations({ lane: "win-post-edit-utf8", self: import.meta.url, tip: "a05d269", declared: DECLARED, pairs: PAIRS });
