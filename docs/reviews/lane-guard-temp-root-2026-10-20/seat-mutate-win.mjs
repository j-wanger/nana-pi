#!/usr/bin/env node
// Seat wrong-code pairs for lane lane-guard-temp-root that only the Windows leg can judge: the plan's P6 and P7 change
// only the win32 TMP branch of lib/gate-temp-roots.ts, P2 is caught only by R-2270's Windows second-drive sub-case, and
// P9 (a macOS survivor) can go red only where home is typed as an 8.3 short name. Written by the seat 2026-10-20 on tip
// 61684fb3; run on a scratch CI branch whose Windows job runs this table instead of the suite. Never merged.
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LWG = "packages/nana-pack/tests/lane-write-guard.test.mjs";
const TR = "packages/nana-pack/lib/gate-temp-roots.ts";
const R2270 = "a temp variable naming a drive root opens nothing outside the lane";
const R2271 = "a temp variable naming the home folder or a folder above it opens no home file";
const R2273 = "on Windows a differing TMP counts as a temp folder under the same rule as TEMP";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const EXCLUDE = "return path.parse(t).root === t || within(t, home);";
const TMP_READ = "if (platform === \"win32\" && env.TMP) candidates.push(env.TMP);";
const ACCEPT = "return candidates.map(resolve).filter((t) => !isExcludedTempRoot(t, resolvedHome));";

const DECLARED = [
	"(a) Windows leg only: R-2273 prints SKIP off Windows and R-2270's second-drive sub-case runs only on Windows; the macOS table (seat-mutate.mjs) holds every other pair, and its survivor P11 survives here too by code reading (both sides of the compare are native-resolved, so a string-prefix within changes no decision)",
	"(b) P2 needs a second drive: the hosted windows-latest checkout sits on D:\\ (main's Windows suite log, run 39432113035) while the worktree and home fixtures sit under C:\\, so R-2270 picks D:\\; on a one-drive runner that sub-case prints SKIP and P2 survives, as on macOS",
	"(c) P7 also names R-2270 and R-2271: on Windows the test sets TEMP and TMP to one value in those checks, so an unjudged TMP opens the drive root and home there too; R-2273's case (b) stays green under P7 (TEMP names the root and is still judged), and cases (c) and (d) carry it (inferred, by code reading)",
	"(d) P9 is added beyond the plan's list, to measure the macOS table's declared gap (d) on the leg that can: the suite runner's home and temp folders are typed under C:\\Users\\RUNNER~1 (8.3), JS realpathSync keeps that spelling (lib/real-path.mjs), and realPath expands it, so home compared as typed no longer contains the resolved candidates (inferred, not probed); a GREEN P9 means the gap holds on Windows too",
	"(e) no pair for laneWriteHit's win32 branch that leaves out /tmp: its behavior is main's, R-1430's Windows branch already pins it, and the plan names no pair for it",
	"(f) no pair for acceptedTempRoots' catch returning []: the macOS table's (c) holds on Windows, an equivalent mutant on string inputs",
];

export const PAIRS = [
	{ n: "P2", name: "the root clause is dropped: only home or a folder above it is excluded", edits: [
		one(TR, EXCLUDE, "return within(t, home);"),
	], tests: [LWG], expectRed: [R2270] },
	{ n: "P6", name: "on win32 TMP is never read: only os.tmpdir() (TEMP) counts", edits: [
		one(TR, TMP_READ, ""),
	], tests: [LWG], expectRed: [R2273] },
	{ n: "P7", name: "TMP is added on win32 without the root and home exclusions: only os.tmpdir() is judged", edits: [
		one(TR, ACCEPT, "return candidates.map(resolve).filter((t, i) => i > 0 || !isExcludedTempRoot(t, resolvedHome));"),
	], tests: [LWG], expectRed: [R2270, R2271, R2273] },
	{ n: "P9", name: "home is compared as typed, not resolved to its on-disk spelling", edits: [
		one(TR, "const resolvedHome = resolve(home);", "const resolvedHome = home;"),
	], tests: [LWG], expectRed: [R2271, R2273] },
];

if (!process.env.SEAT_PAIRS_IMPORT) process.exitCode = await runMutations({ lane: "lane-guard-temp-root", self: import.meta.url, tip: "61684fb3", declared: DECLARED, pairs: PAIRS });
