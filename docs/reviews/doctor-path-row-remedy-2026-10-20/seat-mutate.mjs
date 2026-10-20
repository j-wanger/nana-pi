#!/usr/bin/env node
// Seat wrong-code pairs for lane doctor-path-row-remedy (install lane: nana-setup doctor's PATH resolves pi-review row
// and its last line), written by the seat 2026-10-20 on build 1 (452cd604), on the shared runner. Each pair reverts one
// site of doctor.mjs's PATH section to today's main behaviour or to the obvious wrong implementation (must-meet.md,
// Design). M1-M7 break the POSIX branch, M8-M12 the win32 branch. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/doctor-path-row-remedy-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const DR = "packages/nana-setup/lib/doctor.mjs";
const FL = "packages/nana-setup/tests/doctor-fix-line.test.mjs";
const R1993 = "R-1993: on win32's real home with its bin folder off the Path, the summary lists PATH resolves pi-review as a fix by hand";
const R2320 = "R-2320: with the bin folder on PATH and its pi-review launcher removed, the PATH resolves pi-review row names nana-setup install instead of the PATH fix";
const R2321 = "R-2321: with the bin folder on PATH and its pi-review launcher removed, the summary gives PATH resolves pi-review to install";
const R2322 = "R-2322: with the bin folder off PATH and its pi-review launcher removed, the summary lists PATH resolves pi-review by hand";
const R2323 = "R-2323: as win32 with the bin folder on the Path in another letter case and its .cmd shim removed, the summary gives PATH resolves pi-review to install";
const R2324 = "R-2324: with another pi-review on PATH before the bin folder and the launcher removed, the summary lists PATH resolves pi-review by hand";
const R2325 = "R-2325: with another pi-review on PATH after the bin folder and the launcher removed, the summary gives PATH resolves pi-review to install";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// The two branches share the detail and add() lines; these anchors carry the text that follows each branch's add().
const WIN_LABEL = "installFixes ? \"PATH pi-review\" : undefined);\n\t} else {";
const POSIX_LABEL = "installFixes ? \"PATH pi-review\" : undefined);\n\t}\n\n\t// --- pi package registration ---";
const POSIX_LOOKUP = "firstOnPath(\"pi-review\", entries.slice(0, binAt).join(path.delimiter)) === null;";

const DECLARED = [
	"(a) every pair runs on macOS; the win32 pairs run under forced win32 (NANA_SETUP_PLATFORM=win32), where findOnPath never finds a file, so the win32 earlier-entry lookup, its env with no spread of process.env, and the win32 detail text have no pair here: R-2320, R-2324 and R-2325 pin them only natively on the Windows CI leg",
	"(b) unpinned on every leg, so no pair: win32's trim and quote strip of Path entries (no quoted or padded entry in the fixtures) and POSIX's path.resolve compare of the bin folder (the plan's trailing-slash known limit)",
	"(c) the file's closing tally, FAIL summary: <n> failures, reads as an unnamed red on every red pair; it is not a check",
];

const PAIRS = [
	{ n: "M1", name: "POSIX gives the row to install whenever it is wrong", edits: [
		one(DR, POSIX_LABEL, POSIX_LABEL.replace("installFixes ? \"PATH pi-review\" : undefined", "\"PATH pi-review\"")),
	], tests: [FL], expectRed: [R2322, R2324] },
	{ n: "M2", name: "POSIX: the bin folder on PATH is enough (no earlier-entry lookup)", edits: [
		one(DR, `binAt >= 0 && ${POSIX_LOOKUP}`, "binAt >= 0;"),
	], tests: [FL], expectRed: [R2324] },
	{ n: "M3", name: "POSIX drops the bin-folder-on-PATH guard", edits: [
		one(DR, `!matches && binAt >= 0 && firstOnPath(`, "!matches && firstOnPath("),
	], tests: [FL], expectRed: [R2322] },
	{ n: "M4", name: "POSIX asks for no pi-review anywhere on PATH instead of none before the bin folder", edits: [
		one(DR, POSIX_LOOKUP, "found === null;"),
	], tests: [FL], expectRed: [R2325] },
	{ n: "M5", name: "POSIX sets the install label but keeps today's add-to-PATH detail", edits: [
		one(DR, "? `${found} resolves to this checkout`\n\t\t\t: installFixes", "? `${found} resolves to this checkout`\n\t\t\t: false"),
	], tests: [FL], expectRed: [R2320] },
	{ n: "M6", name: "POSIX names the row's own label, which install's dry run never reports", edits: [
		one(DR, POSIX_LABEL, POSIX_LABEL.replace("\"PATH pi-review\"", "\"PATH resolves pi-review\"")),
	], tests: [FL], expectRed: [R2320, R2321, R2325] },
	{ n: "M7", name: "POSIX splits PATH on the win32 separator", edits: [
		one(DR, "const entries = String(process.env.PATH ?? \"\").split(path.delimiter).filter(Boolean);", "const entries = String(process.env.PATH ?? \"\").split(\";\").filter(Boolean);"),
	], tests: [FL], expectRed: [R2320, R2321, R2325] },
	{ n: "M8", name: "win32 compares the bin folder in exact letter case", edits: [
		one(DR, "path.win32.resolve(dir).toLowerCase() === path.win32.resolve(layout.binDir).toLowerCase()", "path.win32.resolve(dir) === path.win32.resolve(layout.binDir)"),
	], tests: [FL], expectRed: [R2323] },
	{ n: "M9", name: "win32 drops the bin-folder-on-Path guard", edits: [
		one(DR, "!matches && binAt >= 0 && findOnPath(", "!matches && findOnPath("),
	], tests: [FL], expectRed: [R1993] },
	{ n: "M10", name: "win32 gives the row to install whenever it is wrong", edits: [
		one(DR, WIN_LABEL, WIN_LABEL.replace("installFixes ? \"PATH pi-review\" : undefined", "\"PATH pi-review\"")),
	], tests: [FL], expectRed: [R1993] },
	{ n: "M11", name: "win32 names the row's own label, which install's dry run never reports", edits: [
		one(DR, WIN_LABEL, WIN_LABEL.replace("\"PATH pi-review\"", "\"PATH resolves pi-review\"")),
	], tests: [FL], expectRed: [R2323] },
	{ n: "M12", name: "win32 splits the Path on the host's separator", edits: [
		one(DR, "const entries = String(process.env.PATH ?? \"\").split(\";\").map(", "const entries = String(process.env.PATH ?? \"\").split(path.delimiter).map("),
	], tests: [FL], expectRed: [R2323] },
];

process.exitCode = await runMutations({ lane: "doctor-path-row-remedy", self: import.meta.url, tip: "452cd604", declared: DECLARED, pairs: PAIRS });
