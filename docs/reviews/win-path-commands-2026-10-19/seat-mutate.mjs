#!/usr/bin/env node
// Seat wrong-code pairs for lane win-path-commands (install lane: install and doctor), written by the seat 2026-10-19
// after build 1 (tip f7c5db53), on the shared runner. Each pair reverts one product site the lane changed to today's
// main form or to the obvious wrong implementation (must-meet.md; the builder's report). Windows-only wrong code is
// DECLARED, not tabled: the seat runs it on the Windows leg. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-path-commands-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const WS = "packages/nana-setup/tests/win-shims.test.mjs";
const WD = "packages/nana-setup/tests/win32-degrade.test.mjs";
const IC = "packages/nana-setup/tests/install-check.test.mjs";
const SM = "packages/nana-setup/tests/state-manifest.test.mjs";
const SHIMS = "packages/nana-setup/lib/win-shims.mjs";
const FSOPS = "packages/nana-setup/lib/fsops.mjs";
const STEPS = "packages/nana-setup/lib/steps.mjs";
const DOCTOR = "packages/nana-setup/lib/doctor.mjs";
const CHECK = "packages/nana-setup/lib/install-check.mjs";
const CHECK_CONFIG = "packages/nana-setup/lib/install-check-config.mjs";
const MANIFEST = "packages/nana-setup/lib/state-manifest.mjs";
const R1610 = "win32 install leaves an sh and a .cmd shim for each PATH command, rewriting only what differs and backing up a hand-written file";
const R1611 = "sh shim hands node every argument unchanged and returns the bin's exit status";
const R1615 = "win32 doctor reads each PATH command ✓ only when both its shims are this checkout's";
const R1617 = "an sh shim rewritten by its own bin runs none of the new text";
const R1072 = "checklist: the check writes only the objective lines and one MEMORY.md line, and puts the bin folder first on PATH";
const R1081 = "pin R-1081: the doctor note list";
const R954 = "every path created by install maps to a nana-setup-owned manifest row";
const R937_EXIT = "win32 doctor exits 0";
const R937_NO_X = "win32 doctor prints no ✗";
const R350_BACKUP = "win32 collision: a backup is written";
const R350_UNTOUCHED = "win32 symlink: the link's target is untouched";
const R350_REGULAR = "win32 symlink: the target is now a regular file";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(a) Windows-only wrong code, run by the seat on the Windows leg, not in this table: unquoted SET dp0=%~dp0 (R-1612); SET \"_prog=node\" (R-1612, exit 42); no endLocal & goto #_undefined_# 2>NUL || (R-1614); a % in the relative bin path not doubled (R-1612); an absolute bin path where %dp0% fits (R-1612); doctor's PATH resolves pi-review match on the bin directory's .cmd (R-1616)",
	"(b) on macOS the .cmd text is only byte-compared against the same renderer (R-1610, R-1615), so a .cmd-only mutation survives here by construction",
	"(c) no test pins these, so no pair: doctor's symlink refusal in winShimState (a symlinked shim with the right bytes); install's win32 PATH-check line (must-meet Known limits); install-check's Path key fallback when the environment holds no path key",
];

const PAIRS = [
	{ n: "M1", name: "stepPath keeps main's four win32 PATH skips", edits: [
		one(STEPS, "export function stepPath(layout, o) {", 'export function stepPath(layout, o) {\n\tif (win()) return [skip("PATH pi-review"), skip("PATH pi-worker"), skip("PATH nana-land"), skip("PATH nana-setup")];'),
	], tests: [WD], expectRed: [R1610, R1615, R937_EXIT, R937_NO_X] },
	{ n: "M2", name: "writeBytesWithBackup overwrites a differing regular file with no backup", edits: [
		one(FSOPS, "\t\tfs.renameSync(target, bak);\n\t\tdetail = `backed up ${path.basename(target)} -> ${path.basename(bak)}, then ${action", "\t\tdetail = `backed up ${path.basename(target)} -> ${path.basename(bak)}, then ${action"),
	], tests: [WD], expectRed: [R1610, R350_BACKUP] },
	{ n: "M3", name: "writeBytesWithBackup rewrites a byte-equal file", edits: [
		one(FSOPS, "if (st?.isFile() && !st.isSymbolicLink() && fs.readFileSync(target).equals(want)) return { status: UNCHANGED, detail: action };", ""),
	], tests: [WD], expectRed: [R1610] },
	{ n: "M4", name: "writeBytesWithBackup writes through a symlink", edits: [
		one(FSOPS, '\t\tfs.unlinkSync(target);\n\t\tdetail = action === "copy"', '\t\tdetail = action === "copy"'),
	], tests: [WD], expectRed: [R350_UNTOUCHED, R350_REGULAR] },
	{ n: "M5", name: "stepPath's win32 row never reads unchanged", edits: [
		one(STEPS, "writes.every((result) => result.status === UNCHANGED)", "writes.every((result) => result.status === UNCHANGED && false)"),
	], tests: [WD], expectRed: [R1610] },
	{ n: "M6", name: "sh shim text with CRLF line ends", edits: [
		one(SHIMS, '""].join(WIN_SHIM_LINE_ENDINGS.sh);', '""].join("\\r\\n");'),
	], tests: [WS], expectRed: [R1611, R1617] },
	{ n: "M7", name: "sh shim passes $* for \"$@\"", edits: [
		one(SHIMS, '} "$@"`', "} $*`"),
	], tests: [WS], expectRed: [R1611] },
	{ n: "M8", name: "sh shim puts the bin path in double quotes", edits: [
		one(SHIMS, "exec node ${shellQuote(binFile)}", 'exec node "${binFile}"'),
	], tests: [WS], expectRed: [R1611, R1617] },
	{ n: "M9", name: "sh shim leaves a ' in the bin path unescaped", edits: [
		one(SHIMS, ".replaceAll(\"'\", `'\\\\''`)", ""),
	], tests: [WS], expectRed: [R1611, R1617] },
	{ n: "M10", name: "sh shim runs node without exec", edits: [
		one(SHIMS, "`exec node ", "`node "),
	], tests: [WS], expectRed: [R1617] },
	{ n: "M11", name: "doctor checks that each shim exists, not its bytes", edits: [
		one(DOCTOR, " || !fs.readFileSync(file).equals(Buffer.from(wanted));", ";"),
	], tests: [WD], expectRed: [R1615] },
	{ n: "M12", name: "doctor checks only the .cmd shim", edits: [
		one(DOCTOR, "[path.join(binDir, `${name}${WIN_SHIM_SUFFIXES.sh}`), rendered.sh],", ""),
	], tests: [WD], expectRed: [R1615] },
	{ n: "M13", name: "doctor reads a stale shim as a note, not a failure", edits: [
		one(DOCTOR, "add(state.ok ? OK : FAIL, `PATH ${name}`", "add(state.ok ? OK : NOTE, `PATH ${name}`"),
	], tests: [WD], expectRed: [R1615] },
	{ n: "M14", name: "doctor keeps main's skipped (win32) PATH notes", edits: [
		one(DOCTOR, "const state = winShimState(name, source, layout.binDir);\n\t\t\tadd(state.ok ? OK : FAIL, `PATH ${name}`, state.detail);", "add(NOTE, `PATH ${name}`, \"skipped (win32)\");"),
	], tests: [WD], expectRed: [R1615] },
	{ n: "M15", name: "doctor fails PATH resolves pi-review under --home too", edits: [
		one(DOCTOR, "`${found} is this checkout's .cmd shim` : `${found ? `pi-review resolves to ${found}` : \"pi-review not found on PATH\"}; ${remedy}`;\n\t\tadd(matches ? OK : layout.isRealHome ? FAIL : NOTE, \"PATH resolves pi-review\"", "`${found} is this checkout's .cmd shim` : `${found ? `pi-review resolves to ${found}` : \"pi-review not found on PATH\"}; ${remedy}`;\n\t\tadd(matches ? OK : FAIL, \"PATH resolves pi-review\""),
	], tests: [WD], expectRed: [R937_EXIT, R937_NO_X] },
	{ n: "M16", name: "install-check keeps main's !== win32 guard around the PATH prepend", edits: [
		one(CHECK, 'childEnv[pathKey] = `${path.join(home, ".local", "bin")}${pathSeparator}', 'if (platformName !== "win32") childEnv[pathKey] = `${path.join(home, ".local", "bin")}${pathSeparator}'),
	], tests: [IC], expectRed: [R1072] },
	{ n: "M17", name: "install-check joins the win32 PATH with the host delimiter", edits: [
		one(CHECK, 'const pathSeparator = platformName === "win32" ? ";" : path.delimiter;', "const pathSeparator = path.delimiter;"),
	], tests: [IC], expectRed: [R1072] },
	{ n: "M18", name: "DOCTOR_NOTES.win32 keeps main's four PATH labels", edits: [
		one(CHECK_CONFIG, '"release status", "hook nana-objective.mjs"', '"release status", "PATH pi-review", "PATH pi-worker", "PATH nana-land", "PATH nana-setup", "hook nana-objective.mjs"'),
	], tests: [IC], expectRed: [R1081] },
	{ n: "M19", name: "the state manifest drops the four .cmd shim rows", edits: [
		one(MANIFEST, 'for (const name of ["pi-review.cmd", "pi-worker.cmd", "nana-land.cmd", "nana-setup.cmd"]) rebuild(`bin shim ${name}`, p(layout.binDir, name), "shim");', ""),
	], tests: [SM], expectRed: [R954] },
];

process.exitCode = await runMutations({ lane: "win-path-commands", self: import.meta.url, tip: "f7c5db53", declared: DECLARED, pairs: PAIRS });
