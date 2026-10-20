#!/usr/bin/env node
// Seat wrong-code pairs for lane install-dry-run-pi-packages (install lane), written by the seat 2026-10-19 after
// build 1 (30a5baf9), on the shared runner. W1 reverts stepPiRegister's three changed lines to main d4423eff; W2 to W10
// are must-meet.md's wrong code, each applied alone on the tip. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/install-dry-run-pi-packages-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const ST = "packages/nana-setup/lib/steps.mjs";
const PRT = "packages/nana-setup/tests/pi-registration.test.mjs";
const R391 = "R-391: under --home with an unregistered extension directory, install and install --dry-run both report the pi packages step skipped (--home override in play)";
const R358 = "R-358: under --home, install and install --dry-run start no pi install while a working pi is first on PATH";
const R1930 = "R-1930: with pi not on PATH, the dry-run pi packages step reports skipped with the pi install hint, as install does, on darwin and win32";
const R1931 = "R-1931: when install would report the pi packages step ✗ before any pi install, the dry run reports the same ✗ and exits 1";
const R1932 = "R-1932: with a working pi on PATH and an unregistered extension directory, the dry-run pi packages step reports would add and starts no pi install";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const HOME_LINE = 'if (!layout.isRealHome) return [{ label: "pi packages", status: SKIPPED, detail: "not registered (--home override in play)" }];';
const WOULD_ADD = 'if (o.dryRun) return [{ label: "pi packages", status: CREATED, detail: `would add per-package entries for ${state.missing.join(", ")}` }];';
const GUARD_LINES = "\t\t// the dry run stops here, before the first pi install, after every check install runs.\n\t\tif (install && o.dryRun) return { status: 0 };\n";
const GUARD = "if (install && o.dryRun) return { status: 0 };";
const REFUSAL = "if (command.refused) return { refused: command.refused };";
const LAUNCH = "const launch = (args, install = false) => {";
const DRY_DETAIL = 'detail: o.dryRun ? `would add per-package entries for ${state.missing.join(", ")}` : ';

const DECLARED = [
	"(a) every pair runs on macOS; the win32 cases run injected, and W8 spawns pi by its bare name, a POSIX PATH lookup",
	"(b) the README Idempotence sentence has no pair: the readme check is its test, and it is not product code",
];

const PAIRS = [
	{ n: "W1", name: "today's main: the dry-run return above the --home check, no launch guard, the added detail", edits: [
		one(ST, HOME_LINE, `${WOULD_ADD}\n\t${HOME_LINE}`),
		one(ST, GUARD_LINES, ""),
		one(ST, DRY_DETAIL, "detail: "),
	], tests: [PRT], expectRed: [R391, R1930, R1931] },
	{ n: "W2", name: "delete the --home check", edits: [
		one(ST, HOME_LINE, "/* W2: no --home check */"),
	], tests: [PRT], expectRed: [R391, R358] },
	{ n: "W3", name: "drop the dry-run guard in launch", edits: [
		one(ST, GUARD, "/* W3: no dry-run guard */"),
	], tests: [PRT], expectRed: [R1932] },
	{ n: "W4", name: "dry-run would-add return right after the --home check", edits: [
		one(ST, HOME_LINE, `${HOME_LINE}\n\t${WOULD_ADD}`),
	], tests: [PRT], expectRed: [R1930, R1931] },
	{ n: "W5", name: "dry-run would-add return right after the pi lookup", edits: [
		one(ST, LAUNCH, `${WOULD_ADD}\n\t${LAUNCH}`),
	], tests: [PRT], expectRed: [R1930, R1931] },
	{ n: "W6", name: "the dry-run guard above the launch refusal check", edits: [
		one(ST, GUARD, "/* W6: guard moved above the refusal check */"),
		one(ST, REFUSAL, `${GUARD}\n\t\t${REFUSAL}`),
	], tests: [PRT], expectRed: [R1931] },
	{ n: "W7", name: "the --home check only under --dry-run", edits: [
		one(ST, HOME_LINE, HOME_LINE.replace("if (!layout.isRealHome)", "if (!layout.isRealHome && o.dryRun)")),
	], tests: [PRT], expectRed: [R391, R358] },
	{ n: "W8", name: "under --home spawn pi install, then report skipped", edits: [
		one(ST, HOME_LINE, `if (!layout.isRealHome) { spawn("pi", ["install", ...state.packageRoots], { encoding: "utf8", env: { ...env, PI_CODING_AGENT_DIR: layout.piHome } }); return [{ label: "pi packages", status: SKIPPED, detail: "not registered (--home override in play)" }]; }`),
	], tests: [PRT], expectRed: [R358] },
	{ n: "W9", name: "the launch guard on o.dryRun alone, so the dry run spawns nothing", edits: [
		one(ST, GUARD, "if (o.dryRun) return { status: 0 };"),
	], tests: [PRT], expectRed: [R1930, R1931] },
	{ n: "W10", name: "the dry-run detail says added", edits: [
		one(ST, DRY_DETAIL, "detail: "),
	], tests: [PRT], expectRed: [R1932] },
];

process.exitCode = await runMutations({ lane: "install-dry-run-pi-packages", self: import.meta.url, tip: "30a5baf9", declared: DECLARED, pairs: PAIRS });
