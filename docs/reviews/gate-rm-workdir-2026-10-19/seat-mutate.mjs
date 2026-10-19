#!/usr/bin/env node
// Seat wrong-code pairs for lane gate-rm-workdir (gate lane), written by the seat 2026-10-19 on the shared runner,
// against tip d6f0613. Pairs P0 to P33 cover every site the lane changed: the builder's wrong code (a) to (n) from
// build-brief-1.md, main's behaviour (P0), and the harm-relevant forms the builder's list missed (anchors and single
// characters of the plain-rm pattern, flags, absolute and dash targets, the caller's tool name, the home spelling,
// the agent-folder direction, last-target-only, and `inside` excluding the folder itself). Run unsplit from the
// worktree root, since land suites and other lanes share this machine:
//   SEAT_MUTATE_SHARDS=1 SEAT_MUTATE_OUT=<file> node docs/reviews/gate-rm-workdir-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const RI = "packages/nana-pack/lib/gate-rm-inside.ts";
const NG = "packages/nana-pack/extensions/nana-gate.ts";
const T = "packages/nana-pack/tests/gate-rm-inside.test.mjs";
const R1490 = "plain rm -r or -rf of literal paths inside the working directory runs unasked";
const R1491 = "rm of an absolute path, the working directory itself or a path outside it still asks";
const R1492 = "rm of a dot-named path, a folder holding .git or anything overlapping the pi agent folder still asks";
const R1493 = "rm through a symbolic link or junction still asks";
const R1494 = "rm with globs, variables, quotes, escapes, --, prefixes, a second command or the powershell tool still asks";
const R1495 = "rm in a home, home-ancestor, root or dot-named working directory still asks";
const R1496 = "configured deny and protected patterns and named policy files still stop an exempt-shaped rm";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const LINE = `if (tool === "bash" && segmentable && det.length === 1 && rmInsideCwd(command, cwd)) dangers.set(det[0], null);`;
const PLAIN = String.raw`const PLAIN_RM = /^rm([ \t]+[A-Za-z0-9._@/-]+)+$/;`;
const plainWith = (cls) => String.raw`const PLAIN_RM = /^rm([ \t]+[` + cls + String.raw`]+)+$/;`;
const AGENT = "if (inside(targetReal, agentReal) || inside(agentReal, targetReal)) return false;";
const CWD_GUARD = "if (isFsRoot(cwdReal) || inside(homeReal, cwdReal) || hasDotPart(cwdReal)) return false;";
const DOT_RULE = 'parts.some((p) => p.startsWith("."))';

const DECLARED = [
	"(a) every pair runs on macOS; the R-1492 case-folded agent spelling (P32) exists only on a case-folding volume, and junctions, drive letters and 8.3 names exist only on the Windows leg",
	"(b) no pair for the root guard alone: wherever home sits on the cwd's filesystem root, the root is an ancestor of home and the home guard returns false first, so dropping only isFsRoot is equivalent on this machine and on CI",
	"(c) no pair for `det.length === 1` or `segmentable` alone, or the empty-cwd test: the plain-rm pattern admits no separator, a command over 64 KB holds a name over 255 bytes that lstat refuses, and pi always passes a cwd, so each drop is equivalent under the must-meet cases",
	"(d) no pair for the outer catch, the ENOTDIR acceptance in step 7 or a naive `..` prefix in `inside`: no must-meet case makes the module throw, and the other two only ask more often or need a folder named with two leading dots",
];

const PAIRS = [
	{ n: "P0", name: "main's behaviour: the exemption line is removed", edits: [
		one(NG, LINE, "/* exemption removed */"),
	], tests: [T], expectRed: [R1490] },
	{ n: "P1", name: "(a) the link check is dropped", edits: [
		one(RI, "if (st.isSymbolicLink()) return false;", "void st;"),
	], tests: [T], expectRed: [R1493] },
	{ n: "P2", name: "the link walk lstats only the whole target, not each part", edits: [
		one(RI, "cur = path.join(cur, part);", "cur = path.join(cwd, target);"),
	], tests: [T], expectRed: [R1493] },
	{ n: "P3", name: "(b) the per-target loop checks only the first target", edits: [
		one(RI, "for (const target of targets) {", "for (const target of targets.slice(0, 1)) {"),
	], tests: [T], expectRed: [R1491] },
	{ n: "P4", name: "the per-target loop checks only the last target", edits: [
		one(RI, "for (const target of targets) {", "for (const target of targets.slice(-1)) {"),
	], tests: [T], expectRed: [R1491] },
	{ n: "P5", name: "(c) the plain-rm pattern accepts any non-space word", edits: [
		one(RI, PLAIN, String.raw`const PLAIN_RM = /^rm([ \t]+\S+)+$/;`),
	], tests: [T], expectRed: [R1494] },
	{ n: "P6", name: "the plain-rm pattern loses its end anchor", edits: [
		one(RI, PLAIN, String.raw`const PLAIN_RM = /^rm([ \t]+[A-Za-z0-9._@/-]+)+/;`),
	], tests: [T], expectRed: [R1494] },
	{ n: "P7", name: "the plain-rm pattern loses its start anchor (sudo, /bin/rm, command, VAR=)", edits: [
		one(RI, PLAIN, String.raw`const PLAIN_RM = /rm([ \t]+[A-Za-z0-9._@/-]+)+$/;`),
	], tests: [T], expectRed: [R1494] },
	{ n: "P8", name: "the target characters admit glob * and ?", edits: [one(RI, PLAIN, plainWith("A-Za-z0-9._@/*?-"))], tests: [T], expectRed: [R1494] },
	{ n: "P9", name: "the target characters admit $", edits: [one(RI, PLAIN, plainWith("A-Za-z0-9._@/$-"))], tests: [T], expectRed: [R1494] },
	{ n: "P10", name: "the target characters admit a backslash", edits: [one(RI, PLAIN, plainWith(String.raw`A-Za-z0-9._@/\\-`))], tests: [T], expectRed: [R1494] },
	{ n: "P11", name: "the target characters admit ~ (home, 8.3 names)", edits: [one(RI, PLAIN, plainWith("A-Za-z0-9._@/~-"))], tests: [T], expectRed: [R1494] },
	{ n: "P12", name: "the target characters admit : (drive letters)", edits: [one(RI, PLAIN, plainWith("A-Za-z0-9._@/:-"))], tests: [T], expectRed: [R1494] },
	{ n: "P13", name: "the target characters admit quotes", edits: [one(RI, PLAIN, plainWith(`A-Za-z0-9._@/"'-`))], tests: [T], expectRed: [R1494] },
	{ n: "P14", name: "every dash word counts as a flag (--, -i, any option)", edits: [
		one(RI, "const RM_FLAG = /^(-[rRfv]+|--recursive|--force|--verbose)$/;", "const RM_FLAG = /^-/;"),
	], tests: [T], expectRed: [R1494] },
	{ n: "P15", name: "a target starting with - is accepted", edits: [
		one(RI, 't.startsWith("-") || t.startsWith("/")', 't.startsWith("/")'),
	], tests: [T], expectRed: [R1494] },
	{ n: "P16", name: "an absolute target is accepted", edits: [
		one(RI, 't.startsWith("-") || t.startsWith("/")', 't.startsWith("-")'),
	], tests: [T], expectRed: [R1491] },
	{ n: "P17", name: "(d) each segment of a compound is exempted on its own", edits: [
		one(NG, LINE, `if (tool === "bash" && segmentable) for (const s of det) if (rmInsideCwd(s.text.trim(), cwd)) dangers.set(s, null);`),
	], tests: [T], expectRed: [R1494] },
	{ n: "P18", name: "(e) the exemption returns null instead of clearing the danger", edits: [
		one(NG, LINE, `if (tool === "bash" && segmentable && det.length === 1 && rmInsideCwd(command, cwd)) return null;`),
	], tests: [T], expectRed: [R1496] },
	{ n: "P19", name: "(f) the exemption ignores the tool", edits: [
		one(NG, `tool === "bash" && segmentable && det.length === 1`, "segmentable && det.length === 1"),
	], tests: [T], expectRed: [R1494] },
	{ n: "P20", name: "the caller passes bash as the tool for every command", edits: [
		one(NG, "commandHit(subject, gate, cwd, event.toolName)", `commandHit(subject, gate, cwd, "bash")`),
	], tests: [T], expectRed: [R1494] },
	{ n: "P21", name: "(g) the home and root guard is dropped", edits: [
		one(RI, CWD_GUARD, "if (hasDotPart(cwdReal)) return false;"),
	], tests: [T], expectRed: [R1495] },
	{ n: "P22", name: "the home guard matches home itself, not its ancestors", edits: [
		one(RI, "inside(homeReal, cwdReal)", "homeReal === cwdReal"),
	], tests: [T], expectRed: [R1495] },
	{ n: "P23", name: "(k) the dot-named cwd guard is dropped", edits: [
		one(RI, CWD_GUARD, "if (isFsRoot(cwdReal) || inside(homeReal, cwdReal)) return false;"),
	], tests: [T], expectRed: [R1495] },
	{ n: "P24", name: "the cwd and home are compared by their typed spelling", edits: [
		one(RI, "const cwdReal = realPath(cwd);", "const cwdReal = path.resolve(cwd);"),
		one(RI, "const homeReal = realPath(home);", "const homeReal = path.resolve(home);"),
	], tests: [T], expectRed: [R1495] },
	{ n: "P25", name: "(h) the dot rule matches .git exactly", edits: [
		one(RI, DOT_RULE, 'parts.some((p) => p === ".git")'),
	], tests: [T], expectRed: [R1491, R1492] },
	{ n: "P26", name: "the dot rule checks only the first part", edits: [
		one(RI, DOT_RULE, 'parts[0].startsWith(".")'),
	], tests: [T], expectRed: [R1491, R1492] },
	{ n: "P27", name: "(i) an empty target (. or ./) is let through", edits: [
		one(RI, "if (!parts.length || parts.some(", "if (parts.some("),
	], tests: [T], expectRed: [R1491] },
	{ n: "P28", name: "(j) the .git holder check is dropped", edits: [
		one(RI, 'fs.lstatSync(path.join(cwd, target, ".git"));', 'throw Object.assign(new Error("no .git check"), { code: "ENOENT" });'),
	], tests: [T], expectRed: [R1492] },
	{ n: "P29", name: "(l) the agent-folder check is dropped", edits: [
		one(RI, AGENT, "void targetReal; void agentReal;"),
	], tests: [T], expectRed: [R1492] },
	{ n: "P30", name: "(m) the agent check asks only when the target holds the agent folder", edits: [
		one(RI, AGENT, "if (inside(agentReal, targetReal)) return false;"),
	], tests: [T], expectRed: [R1492] },
	{ n: "P31", name: "the agent check asks only when the target lies inside the agent folder", edits: [
		one(RI, AGENT, "if (inside(targetReal, agentReal)) return false;"),
	], tests: [T], expectRed: [R1492] },
	{ n: "P32", name: "(n) the target and agent folder are compared by their typed spelling", edits: [
		one(RI, "const agentReal = realPath(piAgentDir());", "const agentReal = path.resolve(piAgentDir());"),
		one(RI, "const targetReal = realPath(path.resolve(cwd, target));", "const targetReal = path.resolve(cwd, target);"),
	], tests: [T], expectRed: [R1492] },
	{ n: "P33", name: "inside() excludes the folder itself", edits: [
		one(RI, 'return relative === "" || (', 'return relative !== "" && ('),
	], tests: [T], expectRed: [R1492, R1495] },
];

process.exitCode = await runMutations({ lane: "gate-rm-workdir", self: import.meta.url, tip: "0862220", declared: DECLARED, pairs: PAIRS });
