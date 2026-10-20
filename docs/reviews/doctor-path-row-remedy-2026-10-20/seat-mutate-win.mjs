#!/usr/bin/env node
// Seat wrong-code pairs for lane doctor-path-row-remedy that only the Windows leg can judge: the four win32 sites of
// doctor.mjs's PATH section that the macOS table's declared item (a) names (the earlier-entry lookup, its env with no
// spread of process.env, the found === null form of that lookup, and the win32 detail text). Under forced win32 on a
// Mac findOnPath never finds a file; natively it does, so R-2320, R-2324 and R-2325 run the win32 branch only here.
// Written by the seat 2026-10-20 on 3005686b; run on a scratch CI branch whose Windows job runs this table instead of
// the suite. Never merged.
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const DR = "packages/nana-setup/lib/doctor.mjs";
const FL = "packages/nana-setup/tests/doctor-fix-line.test.mjs";
const R2320 = "R-2320: with the bin folder on PATH and its pi-review launcher removed, the PATH resolves pi-review row names nana-setup install instead of the PATH fix";
const R2324 = "R-2324: with another pi-review on PATH before the bin folder and the launcher removed, the summary lists PATH resolves pi-review by hand";
const R2325 = "R-2325: with another pi-review on PATH after the bin folder and the launcher removed, the summary gives PATH resolves pi-review to install";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// The win32 earlier-entry lookup: findOnPath over the Path entries before the bin folder, env with PATH and PATHEXT only.
const WIN_LOOKUP = "findOnPath(\"pi-review\", { env: { PATH: entries.slice(0, binAt).join(\";\"), PATHEXT: process.env.PATHEXT } }) === null;";
const WIN_ENV = "findOnPath(\"pi-review\", { env: { PATH: entries.slice(0, binAt).join(\";\"),";

const DECLARED = [
	"(a) Windows leg only: R-2320, R-2324 and R-2325 run doctor's win32 branch only natively; the macOS table (M1-M12) holds every other pair",
	"(b) W2 assumes the doctor child's environment names Windows' own \"Path\" key, as the build brief says; if that key is spelled PATH, the spread overwrites it in place and W2 reads GREEN as an equivalent mutant",
	"(c) no pair for dropping PATHEXT from the lookup's env: findOnPath then falls back to DEFAULT_PATHEXT, which also holds .CMD, so no fixture can tell the forms apart",
	"(d) unpinned on every leg, so no pair, as the macOS table's (b): win32's trim and quote strip of Path entries (no quoted or padded entry in the fixtures)",
	"(e) the file's closing tally, FAIL summary: <n> failures, reads as an unnamed red on every red pair; it is not a check",
];

export const PAIRS = [
	{ n: "W1", name: "win32: the bin folder on the Path is enough (no earlier-entry lookup)", edits: [
		one(DR, `binAt >= 0 && ${WIN_LOOKUP}`, "binAt >= 0;"),
	], tests: [FL], expectRed: [R2324] },
	{ n: "W2", name: "win32's earlier-entry lookup spreads process.env, so Windows' Path key outranks the injected PATH", edits: [
		one(DR, WIN_ENV, WIN_ENV.replace("{ env: { PATH:", "{ env: { ...process.env, PATH:")),
	], tests: [FL], expectRed: [R2325] },
	{ n: "W3", name: "win32 asks for no pi-review anywhere on the Path instead of none before the bin folder", edits: [
		one(DR, WIN_LOOKUP, "found === null;"),
	], tests: [FL], expectRed: [R2325] },
	{ n: "W4", name: "win32 sets the install label but keeps today's add-to-Path detail", edits: [
		one(DR, "? `${found} is this checkout's .cmd shim`\n\t\t\t: installFixes", "? `${found} is this checkout's .cmd shim`\n\t\t\t: false"),
	], tests: [FL], expectRed: [R2320] },
];

if (!process.env.SEAT_PAIRS_IMPORT) process.exitCode = await runMutations({ lane: "doctor-path-row-remedy", self: import.meta.url, tip: "3005686b", declared: DECLARED, pairs: PAIRS });
