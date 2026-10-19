#!/usr/bin/env node
// Seat wrong-code pairs for lane pi-settings-bom (install, hook or gate lane: doctor and install), written by the seat
// 2026-10-19 after build 1, on the shared runner. The lane changed two product sites, each a read of pi's settings.json:
// packageSourceState in doctor.mjs and packageCoverage in steps.mjs. Per site, one pair reverts the read to main's plain
// JSON.parse (R-1810, R-1811) and one pair swaps it for an over-eager mark strip (R-1812). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/pi-settings-bom-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const DPS = "packages/nana-setup/tests/doctor-package-source.test.mjs";
const PR = "packages/nana-setup/tests/pi-registration.test.mjs";
const DOC = "packages/nana-setup/lib/doctor.mjs";
const STEPS = "packages/nana-setup/lib/steps.mjs";
const R1810 = "doctor prints the pi packages and pi package source rows for a pi settings.json saved with a byte-order mark as for the same file without one";
const R1811 = "install reports a pi settings.json saved with a byte-order mark as registered and starts no pi";
const R1812 = "two leading marks, a mark inside the object or malformed text after one mark leave pi's settings with no package entries for doctor and install";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const READ = 'fs.readFileSync(layout.piSettings, "utf8")';
const DOC_SITE = `try { settings = parseJsonText(${READ}); } catch { return null; }`;
const STEPS_SITE = `try { settings = parseJsonText(${READ}); } catch { /* no settings */ }`;

const DECLARED = [
	"(a) two pairs per product site: M1 and M2 restore main's plain JSON.parse; M3 and M4 strip more than one leading mark, the wrong forms the plan's probe A4 names, so R-1812 has a pair",
	"(b) doctor.mjs's added import line is not a pair of its own; M1 leaves it in place, unused",
	"(c) the live-machine check's reader in pi-registration.test.mjs is test code and has no pair",
];

const PAIRS = [
	{ n: "M1", name: "packageSourceState parses pi's settings with plain JSON.parse (main)", edits: [
		one(DOC, DOC_SITE, `try { settings = JSON.parse(${READ}); } catch { return null; }`),
	], tests: [DPS], expectRed: [R1810] },
	{ n: "M2", name: "packageCoverage parses pi's settings with plain JSON.parse (main)", edits: [
		one(STEPS, STEPS_SITE, `try { settings = JSON.parse(${READ}); } catch { /* no settings */ }`),
	], tests: [DPS, PR], expectRed: [R1810, R1811] },
	{ n: "M3", name: "packageSourceState removes every mark in pi's settings before parsing", edits: [
		one(DOC, DOC_SITE, `try { settings = JSON.parse(${READ}.replace(/\\uFEFF/g, "")); } catch { return null; }`),
	], tests: [DPS], expectRed: [R1812] },
	{ n: "M4", name: "packageCoverage removes a leading run of marks in pi's settings before parsing", edits: [
		one(STEPS, STEPS_SITE, `try { settings = JSON.parse(${READ}.replace(/^\\uFEFF+/, "")); } catch { /* no settings */ }`),
	], tests: [DPS, PR], expectRed: [R1812] },
];

process.exitCode = await runMutations({ lane: "pi-settings-bom", self: import.meta.url, tip: "cb1e0ba2", declared: DECLARED, pairs: PAIRS });
