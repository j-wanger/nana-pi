#!/usr/bin/env node
// Seat wrong-code pairs for lane lane-guard-temp-root (install, hook or gate lane: nana-gate's lane write guard and
// the new lib/gate-temp-roots.ts), written by the seat 2026-10-20 on build 1 (tip 350f9ce0), on the shared runner.
// P1-P8 are the plan's pairs (must-meet.md, "Seat wrong-code pairs"); P3b and P5b are the plan's inverted test and the
// builder's P5 form; P9-P14 revert the other sites the lane changed to today's main form or the obvious wrong
// implementation. Every edit is product code, never a test. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/lane-guard-temp-root-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LWG = "packages/nana-pack/tests/lane-write-guard.test.mjs";
const TR = "packages/nana-pack/lib/gate-temp-roots.ts";
const GT = "packages/nana-pack/extensions/nana-gate.ts";
const R962_TEMP = "temporary output remains allowed";
const R1430 = "/tmp is a temporary root on macOS and Linux and not on Windows";
const R1431 = "a temp file named through another spelling of the temp folder is allowed";
const R2270 = "a temp variable naming a drive root opens nothing outside the lane";
const R2271 = "a temp variable naming the home folder or a folder above it opens no home file";
const R2272 = "a temp folder inside the home folder still takes temp output";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// build 3 (1d9ba683): the exclusion body compares filesystem identity first; pairs P1-P4 replace the whole body
const EXCLUDE = "\tif (path.parse(t).root === t) return true;\n\tconst chain = homeChain(home);\n\tconst tId = identityOf(t);\n\tif (tId !== null && chain.some(({ id }) => id !== null && id.dev === tId.dev && id.ino === tId.ino)) return true;\n\tconst statIncomplete = tId === null || chain.some(({ id }) => id === null);\n\treturn statIncomplete && within(t, home);";
const ACCEPT = "return candidates.map(resolve).filter((t) => !isExcludedTempRoot(t, resolvedHome));";
const WITHIN = "return relative === \"\" || (!relative.startsWith(`..${path.sep}`) && relative !== \"..\" && !path.isAbsolute(relative));";
const KEPT = "const kept = acceptedTempRoots({ platform: process.platform, env: process.env, home: os.homedir(), tmpdir: os.tmpdir() });";
const ALLOWED = "const allowed = [root, ...kept, ...(process.platform === \"win32\" ? [] : [resolve(\"/tmp\")])];";
const MAIN_FORM = "const tempRoots = process.platform === \"win32\" ? [os.tmpdir()] : [os.tmpdir(), \"/tmp\"];\n\t\tconst allowed = [root, ...tempRoots.map((p) => { try { return real(p); } catch { return path.resolve(p); } })];";

const DECLARED = [
	"(a) every pair runs on macOS; R-2273 prints SKIP off Windows, so no pair names it. The plan's P6 (never read TMP) and P7 (TMP without the root and home rule) change only the win32 branch, so they stay out of this table: the plan's macOS simulation and the Windows leg's R-2273 cover them",
	"(b) P2 is red on build 3 only through R-2271's firmlink sub-case, which any text-only home test fails; on macOS and Linux `/` always contains home, so dropping the root clause alone changes no decision here; only R-2270's Windows second-drive sub-case catches that (must-meet.md, Known limits)",
	"(c) no pair for acceptedTempRoots' catch returning []: its try body cannot throw on string inputs (resolve catches, path.parse and path.relative do not throw on strings), so any catch result is an equivalent mutant (inferred, by code reading)",
	"(d) P9 is an expected survivor and a test gap: every check sets HOME to an already-resolved spelling (homeFixture and the outside fixture come from realpathSync), so comparing home as typed changes no decision here; with HOME spelled through a link, a temp variable naming that home would keep home writable (inferred, not probed)",
	"(e) P11 is an expected survivor: a string-prefix within differs only for a temp folder whose path is a string prefix of home without containing it (TMPDIR=/home/al with home /home/alice), which it wrongly excludes, a wrong refusal; no check sets one",
	"(f) build 3 (1d9ba683) compares filesystem identity, which a stat reads the same through any spelling: P5 (red on build 2) is now an expected survivor, because unresolved strings change a decision only when a stat fails and the text fallback runs; no check makes a stat fail (inferred, by code reading)",
	"(g) P17 is an expected survivor and a test gap: the text fallback runs only when a stat of the temp folder or of a folder in home's chain fails, and no check makes one fail; with the fallback dropped, a temp variable naming an unreadable folder above home would keep it as a temp root (inferred, not probed)",
];

const PAIRS = [
	{ n: "P1", name: "the home clause is dropped: only a filesystem root is excluded", edits: [
		one(TR, EXCLUDE, "\treturn path.parse(t).root === t;"),
	], tests: [LWG], expectRed: [R2271, R2272] },
	{ n: "P2", name: "the root clause is dropped: only home or a folder above it is excluded", edits: [
		one(TR, EXCLUDE, "\treturn within(t, home);"),
	], tests: [LWG], expectRed: [R2271] },
	{ n: "P3", name: "home is tested in both directions: a temp folder inside home is excluded too", edits: [
		one(TR, EXCLUDE, "\treturn path.parse(t).root === t || within(t, home) || within(home, t);"),
	], tests: [LWG], expectRed: [R2271, R2272, R1431] },
	{ n: "P3b", name: "the home test is inverted: a temp folder inside home is excluded, one above it is kept", edits: [
		one(TR, EXCLUDE, "\treturn path.parse(t).root === t || within(home, t);"),
	], tests: [LWG], expectRed: [R2271, R2272, R1431] },
	{ n: "P4", name: "home is compared by equality only: a folder above home is kept", edits: [
		one(TR, EXCLUDE, "\treturn path.parse(t).root === t || t === home;"),
	], tests: [LWG], expectRed: [R2271] },
	{ n: "P5", name: "the exclusion is judged on the unresolved strings, then the kept candidates are resolved", edits: [
		one(TR, ACCEPT, "return candidates.filter((t) => !isExcludedTempRoot(path.resolve(t), path.resolve(home))).map(resolve);"),
	], tests: [LWG], expectRed: [] },
	{ n: "P5b", name: "the candidates are never resolved: the kept temp roots stay as typed", edits: [
		one(TR, ACCEPT, "return candidates.filter((t) => !isExcludedTempRoot(t, resolvedHome));"),
	], tests: [LWG], expectRed: [R962_TEMP, R1431] },
	{ n: "P8", name: "the gate also drops a temp root that contains the lane folder (the worktree-ancestor clause)", edits: [
		one(GT, KEPT, KEPT.replace(/;$/, ".filter((t) => !within(root, t));")),
	], tests: [LWG], expectRed: [R962_TEMP, R1431] },
	{ n: "P9", name: "home is compared as typed, not resolved to its on-disk spelling", edits: [
		one(TR, "const resolvedHome = resolve(home);", "const resolvedHome = home;"),
	], tests: [LWG], expectRed: [] },
	{ n: "P10", name: "acceptedTempRoots applies no exclusion: every resolved candidate is kept", edits: [
		one(TR, ACCEPT, "return candidates.map(resolve);"),
	], tests: [LWG], expectRed: [R2270, R2271, R2272] },
	{ n: "P11", name: "the module's within is a string-prefix test", edits: [
		one(TR, WITHIN, "return child.startsWith(parent);"),
	], tests: [LWG], expectRed: [] },
	{ n: "P12", name: "laneWriteHit counts os.tmpdir() and /tmp with no exclusion (main's form)", edits: [
		one(GT, `${KEPT}\n\t\t${ALLOWED}`, MAIN_FORM),
	], tests: [LWG], expectRed: [R2270, R2271] },
	{ n: "P13", name: "laneWriteHit drops /tmp on macOS and Linux", edits: [
		one(GT, ALLOWED, "const allowed = [root, ...kept];"),
	], tests: [LWG], expectRed: [R1430] },
	{ n: "P14", name: "laneWriteHit counts /tmp as typed, not resolved to its on-disk spelling", edits: [
		one(GT, ALLOWED, "const allowed = [root, ...kept, ...(process.platform === \"win32\" ? [] : [\"/tmp\"])];"),
	], tests: [LWG], expectRed: [R1430] },
	{ n: "P15", name: "build 2's text-only home test: no filesystem identity (the land reviewer's firmlink MUST)", edits: [
		one(TR, EXCLUDE, "\treturn path.parse(t).root === t || within(t, home);"),
	], tests: [LWG], expectRed: [R2271] },
	{ n: "P16", name: "identity compared against home only, not the folders above it", edits: [
		one(TR, "chain.some(({ id }) => id !== null && id.dev === tId.dev && id.ino === tId.ino)", "chain.slice(0, 1).some(({ id }) => id !== null && id.dev === tId.dev && id.ino === tId.ino)"),
	], tests: [LWG], expectRed: [R2271] },
	{ n: "P17", name: "the text fallback for a failed stat is dropped", edits: [
		one(TR, "\treturn statIncomplete && within(t, home);", "\treturn false;"),
	], tests: [LWG], expectRed: [] },
];

process.exitCode = await runMutations({ lane: "lane-guard-temp-root", self: import.meta.url, tip: "1d9ba683", declared: DECLARED, pairs: PAIRS });
