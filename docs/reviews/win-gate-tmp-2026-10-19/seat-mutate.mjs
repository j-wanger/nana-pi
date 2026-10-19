#!/usr/bin/env node
// Seat wrong-code pairs for lane win-gate-tmp (gate lane), written by the seat 2026-10-19 on the build tip 297ce13,
// on the shared runner. Each pair reverts one product site the lane changed in nana-gate.ts to its pre-lane form
// (main b3f6ec2) or to the obvious wrong implementation, and names the must-meet checks it must turn red.
// Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-gate-tmp-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LG = "packages/nana-pack/tests/lane-write-guard.test.mjs";
const GT = "packages/nana-pack/extensions/nana-gate.ts";
const R1430 = "/tmp is a temporary root on macOS and Linux and not on Windows";
const R1431 = "a temp file named through another spelling of the temp folder is allowed";
const R1432 = "a lane file named through another spelling of the lane folder is allowed";
const R1433 = "home, at-sign and file URL targets are judged where pi writes them";
const LOOP = "symlink loop is blocked";
const DANGLING = "dangling in-lane symlink to missing outside target is blocked";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(a) every pair runs on macOS; the 8.3 halves of R-1431 and R-1432 and the Windows half of R-1430 exist only on the Windows leg",
	"(b) main's temp-root form (/tmp on every platform) is red only on the Windows leg, so M5 inverts the platform test instead: on macOS it drops /tmp (the POSIX half goes red), on Windows it keeps \\tmp (the Windows half goes red)",
	"(c) real()'s native-to-plain fallback has no test (must-meet known limit): dropping it changes nothing where native works, so M6 tries the fail-open fallback (the typed path) instead",
];

const PAIRS = [
	{ n: "M1", name: "realOut judges the typed target instead of where pi's tools write it", edits: [
		one(GT, "let candidate = path.resolve(cwd, resolveToolPath(target, cwd));", "let candidate = path.resolve(cwd, target);"),
	], tests: [LG], expectRed: [R1433] },
	{ n: "M2", name: "realOut resolves the target's deepest existing ancestor by plain JS realpath", edits: [
		one(GT, "return path.resolve(real(candidate), ...suffix.reverse());", "return path.resolve(fs.realpathSync(candidate), ...suffix.reverse());"),
	], tests: [LG], expectRed: [R1431, R1432] },
	{ n: "M3", name: "the lane root resolves by plain JS realpath", edits: [
		one(GT, "const root = real(configured);", "const root = fs.realpathSync(configured);"),
	], tests: [LG], expectRed: [R1432] },
	{ n: "M4", name: "the temp roots resolve by plain JS realpath", edits: [
		one(GT, "tempRoots.map((p) => { try { return real(p); } catch { return path.resolve(p); } })", "tempRoots.map((p) => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } })"),
	], tests: [LG], expectRed: [R1431] },
	{ n: "M5", name: "the /tmp root's platform test is inverted (kept on Windows, dropped elsewhere)", edits: [
		one(GT, `const tempRoots = process.platform === "win32" ? [os.tmpdir()] : [os.tmpdir(), "/tmp"];`, `const tempRoots = process.platform !== "win32" ? [os.tmpdir()] : [os.tmpdir(), "/tmp"];`),
	], tests: [LG], expectRed: [R1430] },
	{ n: "M6", name: "real() falls back to the typed path when both realpaths throw (fail-open)", edits: [
		one(GT, "\t} catch {\n\t\treturn fs.realpathSync(p);\n\t}", "\t} catch {\n\t\treturn p;\n\t}"),
	], tests: [LG], expectRed: [DANGLING, LOOP] },
];

process.exitCode = await runMutations({ lane: "win-gate-tmp", self: import.meta.url, tip: "297ce13", declared: DECLARED, pairs: PAIRS });
