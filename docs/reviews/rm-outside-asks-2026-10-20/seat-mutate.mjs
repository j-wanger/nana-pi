#!/usr/bin/env node
// Seat wrong-code pairs for lane rm-outside-asks (gate lane), written by the seat 2026-10-20 after build 1, on the shared
// runner. Each pair puts one product site the lane changed into its wrong form: the G pairs revert commandHit's wiring in
// extensions/nana-gate.ts toward main (no outside check) or to an obvious wrong wiring; the M pairs put one decision in the
// new lib/gate-rm-outside.ts into the obvious wrong implementation (build brief letters a-r in each name where one applies,
// plus the within() argument swap the seat note asks for). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/rm-outside-asks-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-pack/tests/gate-rm-outside.test.mjs";
const CORPUS = "packages/nana-pack/tests/gate-corpus.test.mjs";
const INSIDE = "packages/nana-pack/tests/gate-rm-inside.test.mjs";
const GATE = "packages/nana-pack/extensions/nana-gate.ts";
const RMO = "packages/nana-pack/lib/gate-rm-outside.ts";
const R2330 = "plain rm and rm -f outside the working and temp folders ask and name the target";
const R2331 = "every honest spelling of an outside rm target asks";
const R2332 = "plain rm inside the working folder stays unasked";
const R2333 = "plain rm inside a temp folder stays unasked";
const R2334 = "rm through a linked folder that leads outside asks";
const R2335 = "a cd earlier in the command line moves where relative targets are judged";
const R2336 = "PowerShell Remove-Item and its aliases outside the working folder ask";
const R2337 = "rm of a variable-led target such as the builder's message-file cleanup runs unasked";
const R2338 = "plain rm under /tmp stays unasked on macOS and Linux";
const LWG = "packages/nana-pack/tests/lane-write-guard.test.mjs";
const R1430 = "/tmp is a temporary root on macOS and Linux and not on Windows";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const COMPARE = "roots.every((root) => !strictWithin(root, placed.compared))";
const PARENT_REAL = "return { full, compared: path.join(realPath(path.dirname(full)), path.basename(full)) };";
const CD_FOLDER = 'return args.find((word) => !word.startsWith("-")) ?? home;';

const DECLARED = [
	"(build 3, 22a49d27) the table moved again: build 3 changed only the three handler fixtures and gateTempRoots' platform test (every platform but win32 now gets /tmp); no anchor moved",
	"(build 2, b19438f5) the table moved from 3d8e2d22: G2, G5 and G6 now name the handler cases build 2 added (R-2330, R-2331, R-2335); G4 re-anchored on gateTempRoots(); G7 added for the /tmp root. No pair adds /tmp on win32: that branch changes nothing off Windows, and R-2338 prints SKIP there",
	"(a) every pair runs on macOS, where the test's temp folder is the unresolved /var spelling; M4, M5 and M6 bite only where a folder's typed spelling differs from its real path (macOS /var, Windows 8.3)",
	"(b) no pair: gate-shell's three new exports (interface only; a reverted export fails the import, not a check); markOutside's `=== null` guard (it keeps only the recursive/forced reason text, which no row pins: known limit 6); strictWithin's `child !== parent` (no check targets the working or a temp folder itself); PowerShell parameter prefixes, comma lists and -Filter/-Include/-Exclude values; popd and a cd to a variable-led folder (known limit 1); the re-anchoring of an absolute target or absolute cd to the cwd after an unreadable cd; placedTarget's glob/variable-part branch (no test spelling separates it from the parent realPath); the catch fallbacks (no input reaches them)",
	"(c) G2, G5 and G6 break the gate's wiring of the detection pass, home and the segmentable flag; the eight checks reach those inputs only through the test's own moduleHits, so they also run gate-corpus and gate-rm-inside",
];

const PAIRS = [
	// extensions/nana-gate.ts commandHit
	{ n: "G1", name: "(a) commandHit runs no outside check over the exec segments", edits: [
		one(GATE, "markOutside(rmOutsideTargets(segments, cwd, tool, outsideOptions));", "void markOutside;"),
	], tests: [T], expectRed: [R2330, R2336] },
	{ n: "G2", name: "commandHit runs no outside check over the detection segments of an unsegmentable command", edits: [
		one(GATE, "if (!segmentable) markOutside(rmOutsideTargets(detection, cwd, tool, outsideOptions));", "void detection;"),
	], tests: [T, CORPUS, INSIDE], expectRed: [R2330] },
	{ n: "G3", name: "(l) the outside reason omits the target's path", edits: [
		one(GATE, "{ reason: `rm outside the working folder: ${target}`, floor: false }", '{ reason: "rm outside the working folder", floor: false }'),
	], tests: [T], expectRed: [R2330, R2336] },
	{ n: "G4", name: "(c) commandHit passes no temp roots", edits: [
		one(GATE, "tempRoots: gateTempRoots(),", "tempRoots: [],"),
	], tests: [T], expectRed: [R2333, R2338] },
	{ n: "G5", name: "commandHit passes the working folder as home", edits: [
		one(GATE, "\t\thome: os.homedir(),\n\t\ttempRoots:", "\t\thome: cwd,\n\t\ttempRoots:"),
	], tests: [T, CORPUS, INSIDE], expectRed: [R2331] },
	{ n: "G6", name: "commandHit tells the module every command is segmentable", edits: [
		one(GATE, "\t\tsegmentable,\n\t};", "\t\tsegmentable: true,\n\t};"),
	], tests: [T, CORPUS, INSIDE], expectRed: [R2335] },

	// lib/gate-rm-outside.ts containment and placement
	{ n: "M1", name: "strictWithin passes within() its arguments swapped (child, parent)", edits: [
		one(RMO, "return child !== parent && within(parent, child);", "return child !== parent && within(child, parent);"),
	], tests: [T], expectRed: [R2330, R2332, R2333, R2335, R2336] },
	{ n: "M2", name: "(k) containment by string prefix", edits: [
		one(RMO, "return child !== parent && within(parent, child);", "return child !== parent && child.startsWith(parent);"),
	], tests: [T], expectRed: [R2331] },
	{ n: "M3", name: "the comparison checks the working folder only, not the temp roots", edits: [
		one(RMO, COMPARE, "[cwdReal].every((root) => !strictWithin(root, placed.compared))"),
	], tests: [T], expectRed: [R2333, R2335, R2336] },
	{ n: "M4", name: "the working folder is compared as typed, with no realPath", edits: [
		one(RMO, "const cwdReal = realPath(cwd);", "const cwdReal = path.resolve(cwd);"),
	], tests: [T], expectRed: [R2330, R2332, R2335, R2336] },
	{ n: "M5", name: "(q) temp roots compared as typed, with no realPath", edits: [
		one(RMO, "const roots = [cwdReal, ...tempRoots.map((root) => realPath(root))];", "const roots = [cwdReal, ...tempRoots.map((root) => path.resolve(root))];"),
	], tests: [T], expectRed: [R2333, R2335, R2336] },
	{ n: "M6", name: "(e) lexical everywhere: no realPath on the cwd, the temp roots or the target's parent", edits: [
		one(RMO, "const cwdReal = realPath(cwd);", "const cwdReal = path.resolve(cwd);"),
		one(RMO, "const roots = [cwdReal, ...tempRoots.map((root) => realPath(root))];", "const roots = [cwdReal, ...tempRoots.map((root) => path.resolve(root))];"),
		one(RMO, "return { full, compared: path.resolve(realPath(literal), ...relativeParts.slice(dynamicAt)) };", "return { full, compared: full };"),
		one(RMO, PARENT_REAL, "return { full, compared: full };"),
	], tests: [T], expectRed: [R2333, R2334] },
	{ n: "M7", name: "(d) realPath of the whole target, following a last-part link", edits: [
		one(RMO, PARENT_REAL, "return { full, compared: realPath(full) };"),
	], tests: [T], expectRed: [R2332] },

	// target reading
	{ n: "M8", name: "(g) a target that begins with another variable asks", edits: [
		one(RMO, `if (placed !== null && ${COMPARE}) {`, `if (placed === null || ${COMPARE}) {`),
	], tests: [T], expectRed: [R2337] },
	{ n: "M9", name: "(h) only the first target of an rm is judged", edits: [
		one(RMO, "for (const target of targets) {", "for (const target of targets.slice(0, 1)) {"),
	], tests: [T], expectRed: [R2331] },
	{ n: "M10", name: "(i) words after -- are read as flags and dropped", edits: [
		one(RMO, 'return args.filter((word, index) => (marker >= 0 && index > marker) || (index !== marker && !word.startsWith("-")));', 'return args.filter((word, index) => (marker < 0 || index < marker) && !word.startsWith("-"));'),
	], tests: [T], expectRed: [R2331] },
	{ n: "M11", name: "(j) bash rm only; PowerShell removes are never judged", edits: [
		one(RMO, 'if ((powershell && !PS_REMOVE.has(command)) || (!powershell && command !== "rm")) continue;', 'if (powershell || command !== "rm") continue;'),
	], tests: [T], expectRed: [R2335, R2336] },
	{ n: "M12", name: "a PowerShell backslash is not read as a folder separator", edits: [
		one(RMO, String.raw`const spelling = powershell ? expanded.replaceAll("\\", path.sep) : expanded;`, "const spelling = expanded;"),
	], tests: [T], expectRed: [R2336] },
	{ n: "M13", name: "(o) the -Path and -LiteralPath value is consumed but never read as a target", edits: [
		one(RMO, 'if (kind === "path" && value !== undefined) out.push(...value.split(",").filter(Boolean));', "void value;"),
	], tests: [T], expectRed: [R2336] },
	{ n: "M14", name: "(m) PowerShell $env:USERPROFILE and $env:HOME are left unjudged", edits: [
		one(RMO, "for (const spelling of PS_HOME_SPELLINGS) {", "for (const spelling of []) {"),
	], tests: [T], expectRed: [R2336] },
	{ n: "M15", name: "(m) a leading ~ is left unjudged", edits: [
		one(RMO, 'if (target === "~") return home;', 'if (target === "~") return null;'),
		one(RMO, String.raw`if (/^~[/\\]/.test(target)) return path.join(home, target.slice(2));`, String.raw`if (/^~[/\\]/.test(target)) return null;`),
	], tests: [T], expectRed: [R2331, R2335, R2336] },
	{ n: "M16", name: "(m) a leading $HOME or ${HOME} is left unjudged", edits: [
		one(RMO, "for (const spelling of HOME_SPELLINGS) {", "for (const spelling of []) {"),
	], tests: [T], expectRed: [R2331, R2336] },
	{ n: "M17", name: "(n) redirection operands are judged as targets", edits: [
		one(RMO, "const protectedBraces = withoutRedirections(text).replace(", "const protectedBraces = text.replace("),
	], tests: [T], expectRed: [R2332] },
	{ n: "M18", name: "a brace list is split into separate words", edits: [
		one(RMO, String.raw`const protectedBraces = withoutRedirections(text).replace(/\{[^{}\s]+\}/g,`, "const protectedBraces = withoutRedirections(text).replace(/(?!)/g,"),
	], tests: [T], expectRed: [R2331] },

	// cd handling
	{ n: "M19", name: "(f) a cd never moves where relative targets are judged", edits: [
		one(RMO, "if (cdWords.has(command)) {", "if (false) {"),
	], tests: [T], expectRed: [R2335, R2336] },
	{ n: "M20", name: "(p) a cd in an unsegmentable command replaces the folder instead of adding one", edits: [
		one(RMO, "folders = segmentable ? next : [", "folders = true ? next : ["),
	], tests: [T], expectRed: [R2335] },
	{ n: "M21", name: "(r) a cd's flag word is read as its folder", edits: [
		one(RMO, CD_FOLDER, "return args[0] ?? home;"),
	], tests: [T], expectRed: [R2335] },
	{ n: "M22", name: "a bare cd leaves later relative targets unjudged instead of meaning home", edits: [
		one(RMO, CD_FOLDER, 'return args.find((word) => !word.startsWith("-")) ?? null;'),
	], tests: [T], expectRed: [R2335] },
	{ n: "M23", name: "pushd is not read as a cd", edits: [
		one(RMO, 'const CD_WORDS = new Set(["cd", "pushd"]);', 'const CD_WORDS = new Set(["cd"]);'),
	], tests: [T], expectRed: [R2335] },
	{ n: "M24", name: "PowerShell reads only the bash cd words (Set-Location ignored)", edits: [
		one(RMO, "const cdWords = powershell ? PS_CD_WORDS : CD_WORDS;", "const cdWords = CD_WORDS;"),
	], tests: [T], expectRed: [R2335] },
	{ n: "G7", name: "build 1's form: the gate's temp roots leave out /tmp on macOS and Linux (the independent check's MUST)", edits: [
		one(GATE, "return [...roots, real(\"/tmp\")];", "return roots;"),
	], tests: [T, LWG], expectRed: [R2338, R1430] },
];

process.exitCode = await runMutations({ lane: "rm-outside-asks", self: import.meta.url, tip: "22a49d27", declared: DECLARED, pairs: PAIRS });
