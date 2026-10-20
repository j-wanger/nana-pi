/**
 * @module packages/nana-pack/tests/lane-write-guard.test.mjs
 * @purpose Pins the opt-in lane write boundary across traversal, symlink, missing-target, and unset-root cases.
 * @inputs nana-gate, temporary worktree and outside directories
 * @outputs named PASS/FAIL/SKIP checks
 * @effects disk (fixtures under home, OS temp or /var/tmp), process (environment)
 * @errors failed assertions exit nonzero
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
const worktree = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "lane-root-")));
const homeFixture = fs.realpathSync(tmpDir(path.join(os.homedir(), "lane-guard-home-")));
const contained = (parent, child) => { const rel = path.relative(parent, child); return rel === "" || (!rel.startsWith(`..${path.sep}`) && rel !== ".." && !path.isAbsolute(rel)); };
const tempRoot = fs.realpathSync(os.tmpdir()), tmpAlias = process.platform === "win32" ? tempRoot : fs.realpathSync("/tmp");
// chosen: the runner's HOME sits under /tmp on Linux, and /var/tmp is outside both permitted temp roots.
const OUTSIDE_FIXTURE_PARENTS = process.platform === "win32" ? [os.homedir()] : [os.homedir(), "/var/tmp"];
const outsideSkipReason = "no writable fixture parent outside the lane and both permitted temp roots";
let outside = null;
for (const parent of OUTSIDE_FIXTURE_PARENTS) {
	let real;
	try { real = fs.realpathSync(parent); } catch { continue; }
	if ([worktree, tempRoot, tmpAlias].some((root) => contained(root, real))) continue;
	try {
		const base = tmpDir(path.join(real, "lane-guard-outside-"));
		const candidate = path.join(base, "outside");
		fs.mkdirSync(candidate);
		outside = candidate;
		break;
	} catch { continue; }
}
const outsideAvailable = outside !== null;
if (!outsideAvailable) outside = path.join(os.homedir(), "lane-guard-missing", "outside");
const link = path.join(worktree, "escape"); fs.symlinkSync(outside, link, "dir");
const dangling = path.join(worktree, "dangling-outside"); fs.symlinkSync(path.join(outside, "missing-file"), dangling);
const loopA = path.join(worktree, "loop-a"), loopB = path.join(worktree, "loop-b");
fs.symlinkSync(loopB, loopA); fs.symlinkSync(loopA, loopB);
process.env.HOME = homeFixture; process.env.USERPROFILE = homeFixture;
const ext = (await import("../extensions/nana-gate.ts")).default;
let handler; ext({ on: (event, fn) => { if (event === "tool_call") handler = fn; } });
const ctx = { cwd: worktree, hasUI: false };
const call = async (toolName, target) => (await handler({ toolName, input: toolName === "bash" ? { command: target } : { path: target } }, ctx))?.block === true;
const check = (title, ok, skip = null) => {
	if (skip !== null) { console.log(`SKIP ${title}: ${skip}`); return; }
	console.log(ok ? "PASS" : "FAIL", title);
	if (!ok) process.exitCode = 1;
};
process.env.NANA_WORKTREE_ROOT = worktree;
// req: R-962
check("parent traversal outside lane is blocked", outsideAvailable && await call("write", path.relative(worktree, path.join(outside, "not-created/deep/file.txt"))), outsideAvailable ? null : outsideSkipReason);
// req: R-962
check("symlink escape outside lane is blocked", outsideAvailable && await call("edit", "escape/not-created/deep/file.txt"), outsideAvailable ? null : outsideSkipReason);
// req: R-962
check("dangling in-lane symlink to missing outside target is blocked", await call("write", "dangling-outside"));
// req: R-962
check("symlink loop is blocked", await call("edit", "loop-a"));
// req: R-962
check("temporary output remains allowed", !(await call("write", path.join(os.tmpdir(), "nana-lane-safe.txt"))));
// req: R-962
check("bash writes stay explicitly outside this gate guard", !(await call("bash", "printf x > ../outside.txt")));

// --- R-1430 to R-1433: real temp roots, alternate spellings and pi's own path forms (NANA_WORKTREE_ROOT stays set) ---
const pid = process.pid;
const TEMP_VARS = process.platform === "win32" ? ["TEMP", "TMP"] : ["TMPDIR"];
const savedTempVars = TEMP_VARS.map((name) => process.env[name]);
const setTempVars = (value) => { for (const name of TEMP_VARS) process.env[name] = value; };
const restoreTempVars = () => { TEMP_VARS.forEach((name, i) => { if (savedTempVars[i] === undefined) delete process.env[name]; else process.env[name] = savedTempVars[i]; }); };
const toggleCase = (s) => s.replace(/[a-zA-Z]/g, (c) => (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()));
const swapLastSegmentCase = (p) => path.join(path.dirname(p), toggleCase(path.basename(p)));
const sameCanonical = (a, b) => { try { const sa = fs.statSync(a), sb = fs.statSync(b); return sa.dev === sb.dev && sa.ino === sb.ino; } catch { return false; } };
const callWithCwd = async (toolName, target, cwd) => (await handler({ toolName, input: { path: target } }, { cwd, hasUI: false }))?.block === true;
// Non-vacuity control: a sibling of the fixtures below, under the suite's own HOME, must still
// be refused. If it is allowed (this environment's permitted roots already cover it — the
// suite's Linux HOME/TMPDIR sit under the real /tmp), the spelling check that follows would
// pass no matter what the code does, so it prints SKIP and is never counted as PASS.
const nonVacuityControl = async (label) => {
	const refused = await call("write", path.join(homeFixture, `sibling-${label}-${pid}`, "x.txt"));
	if (!refused) console.log(`SKIP ${label}: the sibling-folder control was allowed (this environment's permitted roots mask the result)`);
	return refused;
};

{
	const r1430Joined = path.join(path.resolve("/tmp"), `nana-lane-${pid}`, "x.txt");
	const r1430Literal = `/tmp/nana-lane-${pid}/x.txt`;
	if (process.platform === "win32") {
		const r1430WinTmp = path.win32.resolve(process.cwd(), "/tmp");
		if ([worktree, tempRoot].some((root) => contained(root, r1430WinTmp))) {
			console.log("SKIP /tmp is a temporary root on macOS and Linux and not on Windows: \\tmp on the current drive lies inside the lane or OS temp root");
		} else {
			// req: R-1430
			check("/tmp is a temporary root on macOS and Linux and not on Windows", await call("write", r1430Joined) && await call("write", r1430Literal));
		}
	} else {
		// req: R-1430
		check("/tmp is a temporary root on macOS and Linux and not on Windows", !(await call("write", r1430Joined)) && !(await call("write", r1430Literal)));
	}
}

{
	const r1431SwapDir = path.join(homeFixture, `TempCase-${pid}`);
	fs.mkdirSync(r1431SwapDir);
	const r1431SwapAlt = swapLastSegmentCase(r1431SwapDir);
	const r1431CasePairOk = r1431SwapAlt !== r1431SwapDir && sameCanonical(r1431SwapDir, r1431SwapAlt);
	const r1431RawTemp = os.tmpdir();
	const r1431NativeTemp = fs.realpathSync.native(r1431RawTemp);
	const r1431OsSpellingOk = r1431RawTemp !== r1431NativeTemp;
	const r1431LinkDir = path.join(homeFixture, `TempLink-${pid}`);
	fs.mkdirSync(r1431LinkDir);
	const r1431LinkAlias = path.join(homeFixture, `TempLinkAlias-${pid}`);
	fs.symlinkSync(r1431LinkDir, r1431LinkAlias, process.platform === "win32" ? "junction" : "dir");
	try {
		if (await nonVacuityControl("a temp file named through another spelling of the temp folder is allowed")) {
			const results = [];
			if (r1431CasePairOk) {
				setTempVars(r1431SwapDir);
				results.push(!(await call("write", path.join(r1431SwapAlt, "case-file-a.txt"))));
				setTempVars(r1431SwapAlt);
				results.push(!(await call("write", path.join(r1431SwapDir, "case-file-b.txt"))));
			} else {
				console.log("SKIP a temp file named through another spelling of the temp folder is allowed (case pair): swapped path is not the same file on this volume");
			}
			if (r1431OsSpellingOk) {
				setTempVars(r1431RawTemp);
				results.push(!(await call("write", path.join(r1431NativeTemp, "os-spelling-file-a.txt"))));
				setTempVars(r1431NativeTemp);
				results.push(!(await call("write", path.join(r1431RawTemp, "os-spelling-file-b.txt"))));
			} else {
				console.log("SKIP a temp file named through another spelling of the temp folder is allowed (OS spelling pair): as-given and native spellings are equal strings");
			}
			setTempVars(r1431LinkDir);
			results.push(!(await call("write", path.join(r1431LinkAlias, "link-file-a.txt"))));
			setTempVars(r1431LinkAlias);
			results.push(!(await call("write", path.join(r1431LinkDir, "link-file-b.txt"))));
			// req: R-1431
			check("a temp file named through another spelling of the temp folder is allowed", results.length > 0 && results.every(Boolean));
		}
	} finally {
		restoreTempVars();
	}
}

{
	const r1432TempSibling = path.join(homeFixture, `r1432-temp-sibling-${pid}`);
	const r1432SwapRoot = swapLastSegmentCase(worktree);
	const r1432CasePairOk = r1432SwapRoot !== worktree && sameCanonical(worktree, r1432SwapRoot);
	const r1432LinkAlias = path.join(homeFixture, `LaneAlias-${pid}`);
	fs.symlinkSync(worktree, r1432LinkAlias, process.platform === "win32" ? "junction" : "dir");
	const r1432NativeRoot = fs.realpathSync.native(worktree);
	const r1432OsSpellingOk = r1432NativeRoot !== worktree;
	setTempVars(r1432TempSibling); // keep the broad temp allowance off the lane fixtures
	try {
		if (await nonVacuityControl("a lane file named through another spelling of the lane folder is allowed")) {
			const results = [];
			if (r1432CasePairOk) {
				process.env.NANA_WORKTREE_ROOT = worktree;
				results.push(!(await call("write", path.join(r1432SwapRoot, "case-file-a.txt"))));
				process.env.NANA_WORKTREE_ROOT = r1432SwapRoot;
				results.push(!(await call("write", path.join(worktree, "case-file-b.txt"))));
				process.env.NANA_WORKTREE_ROOT = r1432SwapRoot;
				results.push(!(await callWithCwd("write", "relative-case-file-a.txt", worktree)));
				process.env.NANA_WORKTREE_ROOT = worktree;
				results.push(!(await callWithCwd("write", "relative-case-file-b.txt", r1432SwapRoot)));
			} else {
				console.log("SKIP a lane file named through another spelling of the lane folder is allowed (case and relative-target pairs): swapped path is not the same file on this volume");
			}
			process.env.NANA_WORKTREE_ROOT = worktree;
			results.push(!(await call("write", path.join(r1432LinkAlias, "link-file-a.txt"))));
			process.env.NANA_WORKTREE_ROOT = r1432LinkAlias;
			results.push(!(await call("write", path.join(worktree, "link-file-b.txt"))));
			if (r1432OsSpellingOk) {
				process.env.NANA_WORKTREE_ROOT = worktree;
				results.push(!(await call("write", path.join(r1432NativeRoot, "os-spelling-file-a.txt"))));
				process.env.NANA_WORKTREE_ROOT = r1432NativeRoot;
				results.push(!(await call("write", path.join(worktree, "os-spelling-file-b.txt"))));
			} else {
				console.log("SKIP a lane file named through another spelling of the lane folder is allowed (OS spelling pair): as-given and native spellings are equal strings");
			}
			// req: R-1432
			check("a lane file named through another spelling of the lane folder is allowed", results.length > 0 && results.every(Boolean));
		}
	} finally {
		process.env.NANA_WORKTREE_ROOT = worktree;
		restoreTempVars();
	}
}

{
	const fsRoot = path.parse(worktree).root;
	const outsideDir = path.join(fsRoot, `nana-lane-guard-missing-${pid}`);
	const outsideTarget = path.join(outsideDir, "x.txt");
	const laneTarget = path.join(worktree, `r1433-lane-file-${pid}.txt`);
	const savedHome = process.env.HOME, savedUserProfile = process.env.USERPROFILE;
	try {
		const results = [];
		process.env.HOME = outsideDir; process.env.USERPROFILE = outsideDir;
		results.push(await call("write", `~/x.txt`));
		process.env.HOME = worktree; process.env.USERPROFILE = worktree;
		results.push(!(await call("write", `~/r1433-lane-file-${pid}.txt`)));
		results.push(await call("write", `@${outsideTarget}`));
		results.push(!(await call("write", `@${laneTarget}`)));
		results.push(await call("write", pathToFileURL(outsideTarget).href));
		results.push(!(await call("write", pathToFileURL(laneTarget).href)));
		results.push(!fs.existsSync(outsideDir));
		// req: R-1433
		check("home, at-sign and file URL targets are judged where pi writes them", results.every(Boolean));
	} finally {
		process.env.HOME = savedHome; process.env.USERPROFILE = savedUserProfile;
	}
}

// --- R-2270 to R-2273: a temp variable naming a drive root, home, or a folder above home ---
const reasonOf = async (target, toolName = "write", cwd = worktree) =>
	(await handler({ toolName, input: toolName === "bash" ? { command: target } : { path: target } }, { cwd, hasUI: false }))?.reason ?? "";
const refused = async (target, toolName = "write", cwd = worktree) => (await reasonOf(target, toolName, cwd)).includes("lane write boundary");
const allowed = async (target, toolName = "write", cwd = worktree) => (await reasonOf(target, toolName, cwd)) === "";
const laneFile = path.join(worktree, `lane-ok-${pid}.txt`);

{
	const title = "a temp variable naming a drive root opens nothing outside the lane";
	const results = [];
	const fsRoot = path.parse(worktree).root;
	const r2270Target = path.join(fsRoot, `nana-lane-guard-root-${pid}`, "x.txt");
	setTempVars(fsRoot);
	try {
		results.push(await refused(r2270Target));
		results.push(!fs.existsSync(path.dirname(r2270Target)));
		results.push(await allowed(laneFile));
	} finally {
		restoreTempVars();
	}
	if (process.platform === "win32") {
		let secondDrive = null;
		for (let code = "D".charCodeAt(0); code <= "Z".charCodeAt(0); code++) {
			const candidate = `${String.fromCharCode(code)}:\\`;
			if (candidate[0].toUpperCase() === fsRoot[0].toUpperCase() || candidate[0].toUpperCase() === homeFixture[0].toUpperCase()) continue;
			try {
				fs.accessSync(candidate);
				secondDrive = candidate;
				break;
			} catch {
				continue;
			}
		}
		if (secondDrive === null) {
			console.log(`SKIP ${title} (second drive): no second drive root`);
		} else {
			setTempVars(secondDrive);
			try {
				results.push(await refused(path.join(secondDrive, `nana-lane-guard-root2-${pid}`, "x.txt")));
				results.push(await allowed(laneFile));
			} finally {
				restoreTempVars();
			}
		}
	}
	// req: R-2270
	check("a temp variable naming a drive root opens nothing outside the lane", results.length > 0 && results.every(Boolean));
}

{
	let ok = false;
	if (outsideAvailable) {
		const savedHome = process.env.HOME, savedUserProfile = process.env.USERPROFILE;
		const r2271Link = path.join(homeFixture, `R2271HomeAlias-${pid}`);
		fs.symlinkSync(outside, r2271Link, process.platform === "win32" ? "junction" : "dir");
		process.env.HOME = outside; process.env.USERPROFILE = outside;
		try {
			const results = [];
			const target = path.join(outside, `r2271-home-${pid}`, "x.txt");
			for (const value of [outside, path.dirname(outside), r2271Link]) {
				setTempVars(value);
				try {
					results.push(await refused(target));
					results.push(await allowed(laneFile));
				} finally {
					restoreTempVars();
				}
			}
			ok = results.length > 0 && results.every(Boolean);
		} finally {
			process.env.HOME = savedHome; process.env.USERPROFILE = savedUserProfile;
		}
	}
	// req: R-2271
	check("a temp variable naming the home folder or a folder above it opens no home file", ok, outsideAvailable ? null : outsideSkipReason);
}

{
	let ok = false;
	if (outsideAvailable) {
		const savedHome = process.env.HOME, savedUserProfile = process.env.USERPROFILE;
		process.env.HOME = outside; process.env.USERPROFILE = outside;
		const r2272Temp = path.join(outside, "AppData", "Local", "Temp");
		fs.mkdirSync(r2272Temp, { recursive: true });
		setTempVars(r2272Temp);
		try {
			const results = [];
			results.push(await allowed(path.join(r2272Temp, `r2272-file-${pid}.txt`)));
			results.push(await refused(path.join(outside, `r2272-sibling-${pid}`, "x.txt")));
			results.push(await allowed(laneFile));
			ok = results.length > 0 && results.every(Boolean);
		} finally {
			restoreTempVars();
			process.env.HOME = savedHome; process.env.USERPROFILE = savedUserProfile;
		}
	}
	// req: R-2272
	check("a temp folder inside the home folder still takes temp output", ok, outsideAvailable ? null : outsideSkipReason);
}

{
	// req-candidate: R-2273 (Windows only; becomes req: when the Windows CI leg passes it)
	if (process.platform !== "win32") {
		check("on Windows a differing TMP counts as a temp folder under the same rule as TEMP", false, "the differing-TMP case is a Windows one: on macOS and Linux Node reads TMPDIR first");
	} else {
		const folderA = path.join(homeFixture, `R2273A-${pid}`);
		const folderB = path.join(homeFixture, `R2273B-${pid}`);
		fs.mkdirSync(folderA, { recursive: true });
		fs.mkdirSync(folderB, { recursive: true });
		const fsRoot = path.parse(worktree).root;
		const rootTarget = path.join(fsRoot, `nana-lane-guard-root-${pid}`, "x.txt");
		const savedTemp = process.env.TEMP, savedTmp = process.env.TMP;
		const setBoth = (temp, tmp) => { process.env.TEMP = temp; process.env.TMP = tmp; };
		try {
			const results = [];
			// (a) TEMP=A, TMP=B: files in A and B allowed
			setBoth(folderA, folderB);
			results.push(await allowed(path.join(folderA, `r2273a-${pid}.txt`)));
			results.push(await allowed(path.join(folderB, `r2273b-${pid}.txt`)));
			results.push(await allowed(laneFile));
			// (b) TEMP=R, TMP=B: the B file allowed, rootT refused
			setBoth(fsRoot, folderB);
			results.push(await allowed(path.join(folderB, `r2273b2-${pid}.txt`)));
			results.push(await refused(rootTarget));
			// (c) TEMP=A, TMP=R: rootT refused
			setBoth(folderA, fsRoot);
			results.push(await refused(rootTarget));
			// (d) TEMP=A, TMP=homeFixture: homeFixture/r2273-home-<pid>/x.txt refused
			setBoth(folderA, homeFixture);
			results.push(await refused(path.join(homeFixture, `r2273-home-${pid}`, "x.txt")));
			check("on Windows a differing TMP counts as a temp folder under the same rule as TEMP", results.length > 0 && results.every(Boolean));
		} finally {
			if (savedTemp === undefined) delete process.env.TEMP; else process.env.TEMP = savedTemp;
			if (savedTmp === undefined) delete process.env.TMP; else process.env.TMP = savedTmp;
		}
	}
}

process.env.NANA_WORKTREE_ROOT = "";
// req: R-962
check("empty worktree root changes no existing path decision", !(await call("write", "../outside-unset.txt")));
delete process.env.NANA_WORKTREE_ROOT;
// req: R-962
check("unset worktree root leaves outside edit behavior unchanged", !(await call("edit", "../outside-unset-again.txt")));
// req: R-962
check("ordinary sessions leave an unresolvable symlink target unchanged", !(await call("edit", "dangling-outside")));
