/**
 * @module packages/nana-pack/tests/gate-rm-inside.test.mjs
 * @purpose Pin the one rm exemption (R-1490) and its six guard rows (R-1491 to R-1496) over the REAL registered gate handler
 * @inputs extensions/nana-gate.ts with lib/gate-rm-inside.ts, lib/gate-shell.ts, lib/gate-paths.ts and lib/real-path.mjs, a temp HOME, a temp cwd fixture tree and env PI_CODING_AGENT_DIR
 * @outputs PASS/FAIL lines per row on stdout, a SKIP line when the case-changed HOME spelling does not exist on this filesystem, and exit 1 when any row fails
 * @effects disk (temp HOME, cwd fixtures incl. three symlinks, config files), process (sets HOME, USERPROFILE and PI_CODING_AGENT_DIR)
 * @errors a failed row prints FAIL with the cases that got the wrong verdict and the run exits 1; an unexpected throw propagates and fails the run
 */
// L2 (2026-10-19): the one exemption a plain, literal, in-cwd rm gets (Jake's 2026-10-10 ruling)
// and every guard that keeps today's verdict otherwise. Real registered handler, headless
// fail-closed, one interactive variant pins zero dialogs for the exempt form (gate-corpus's
// harness: lib gate-shell.ts, gate-paths.ts, real-path.mjs, gate-rm-inside.ts).
// Run: node --experimental-strip-types <this file>
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const HOME = tmpDir(path.join(os.tmpdir(), "gate-rm-inside-home-"));
process.env.HOME = HOME;
process.env.USERPROFILE = HOME;
delete process.env.PI_CODING_AGENT_DIR;
const USER_CFG = path.join(HOME, ".pi", "agent", "nana-pack.json");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
const CWD = tmpDir(path.join(os.tmpdir(), "gate-rm-inside-cwd-"));
const OUTSIDE = tmpDir(path.join(os.tmpdir(), "gate-rm-inside-outside-"));
const ext = (await import(new URL("../extensions/nana-gate.ts", import.meta.url).href)).default;

// Fixtures. No `.git` at the cwd top: it would hide wrong code (i) (the dot-named cwd it sits
// under would never be reached, since a top-level `.git` is not one of the probed targets).
fs.mkdirSync(path.join(CWD, "build"), { recursive: true });
fs.mkdirSync(path.join(CWD, "sub", "deep"), { recursive: true });
fs.mkdirSync(path.join(CWD, "nested", ".git"), { recursive: true });
fs.mkdirSync(path.join(CWD, ".pi", "extensions"), { recursive: true });
fs.mkdirSync(path.join(CWD, "node_modules", "@types"), { recursive: true });
fs.mkdirSync(path.join(CWD, "secrets"), { recursive: true });
fs.symlinkSync(OUTSIDE, path.join(CWD, "linkout"), process.platform === "win32" ? "junction" : "dir");
fs.symlinkSync(path.join(CWD, "build"), path.join(CWD, "linkin"), process.platform === "win32" ? "junction" : "dir");
fs.mkdirSync(path.join(CWD, "agentdir", "extensions"), { recursive: true });
fs.mkdirSync(path.join(CWD, "agentdir", "sessions", "s"), { recursive: true });
fs.mkdirSync(path.join(CWD, "parent", "agentdir2"), { recursive: true });

// A second spelling of HOME, for R-1495 (seat P24): a symlink to it, and a case-changed path
// to it that exists only on a case-folding filesystem.
const HOME_LINK = path.join(CWD, "home-link");
fs.symlinkSync(HOME, HOME_LINK, process.platform === "win32" ? "junction" : "dir");
const HOME_CASE_CHANGED = path.join(path.dirname(HOME), path.basename(HOME).toUpperCase());

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra); if (!ok) fails++; };

function register(gateCfg = {}) {
	fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: false }, gate: gateCfg }));
	const h = {};
	ext({ on: (name, fn) => { h[name] = fn; } });
	return h;
}

async function verdict(h, cwd, command, toolName = "bash", ui = null) {
	const ctx = { cwd, hasUI: !!ui, isProjectTrusted: () => false, ...(ui ? { ui } : {}) };
	const r = await h.tool_call({ toolName, input: { command } }, ctx);
	return r?.block ? "BLOCK" : "ALLOW";
}

/** Runs every [cwd, command, toolName?] case and returns the ones whose verdict is not `want`. */
async function wrongVerdicts(h, want, cases, ui = null) {
	const bad = [];
	for (const [cwd, command, toolName = "bash"] of cases) {
		const got = await verdict(h, cwd, command, toolName, ui);
		if (got !== want) bad.push({ cwd, command, toolName, want, got });
	}
	return bad;
}

// ---- R-1490: the exemption itself (headless ALLOW, interactive ALLOW with zero dialogs)
{
	const h = register({});
	const dialogs = [];
	const ui = { select: async (m, o) => { dialogs.push({ m, o }); return "Allow once"; }, setStatus() {}, notify() {}, theme: { fg: (_c, t) => t } };
	const commands = [
		"rm -r build", "rm -rf build", "rm -fr ./build sub/deep", "rm -Rf build/",
		"rm --recursive --force build", "rm -rfv node_modules/@types", "rm -rf not-there/yet", "rm --force build",
	];
	const headlessBad = await wrongVerdicts(h, "ALLOW", commands.map((c) => [CWD, c]));
	const interactiveBad = await wrongVerdicts(h, "ALLOW", commands.map((c) => [CWD, c]), ui);
	// req: R-1490
	check("plain rm -r or -rf of literal paths inside the working directory runs unasked",
		headlessBad.length === 0 && interactiveBad.length === 0 && dialogs.length === 0,
		JSON.stringify({ headlessBad, interactiveBad, dialogShown: dialogs.length }));
}

// ---- R-1491: absolute, the cwd itself, or outside it still asks
{
	const h = register({});
	const absBuild = path.join(CWD, "build").split(path.sep).join("/");
	const cases = [
		"rm -rf ../x", "rm -rf /tmp/x", `rm -rf ${absBuild}`, "rm -rf .", "rm -rf ./",
		"rm -rf sub/..", "rm -rf build/../..", "rm -rf build ../x", "rm -rf ../x build",
	].map((c) => [CWD, c]);
	const bad = await wrongVerdicts(h, "BLOCK", cases);
	// req: R-1491
	check("rm of an absolute path, the working directory itself or a path outside it still asks", bad.length === 0, JSON.stringify(bad));
}

// ---- R-1492: a dot-named part, a folder holding .git, or overlapping the pi agent folder
{
	const h = register({});
	const dotGit = [
		".git", ".GIT", ".git/objects", ".pi", ".claude", "sub/.git", "nested", "node_modules/.cache",
	].map((t) => [CWD, `rm -rf ${t}`]);

	process.env.PI_CODING_AGENT_DIR = path.join(CWD, "agentdir");
	const agentCases = [
		[CWD, "rm -rf agentdir"], [CWD, "rm -rf agentdir/extensions"], [CWD, "rm -rf agentdir/sessions"],
		[path.join(CWD, "agentdir"), "rm -rf extensions"], [path.join(CWD, "agentdir"), "rm -rf sessions"], [path.join(CWD, "agentdir"), "rm -rf x"],
	];
	// A case-folding filesystem only (APFS/NTFS default): on a case-sensitive one "AGENTDIR"
	// is a different, missing folder, so the case cannot exist and these cases do not apply.
	const caseVariant = fs.existsSync(path.join(CWD, "AGENTDIR"))
		? [[CWD, "rm -rf AgentDir"], [CWD, "rm -rf AGENTDIR/extensions"]]
		: [];
	const agentBad = await wrongVerdicts(h, "BLOCK", [...agentCases, ...caseVariant]);
	delete process.env.PI_CODING_AGENT_DIR;

	process.env.PI_CODING_AGENT_DIR = path.join(CWD, "parent", "agentdir2");
	const parentBad = await wrongVerdicts(h, "BLOCK", [[CWD, "rm -rf parent"]]);
	delete process.env.PI_CODING_AGENT_DIR;

	const dotBad = await wrongVerdicts(h, "BLOCK", dotGit);
	const bad = [...dotBad, ...agentBad, ...parentBad];
	// req: R-1492
	check("rm of a dot-named path, a folder holding .git or anything overlapping the pi agent folder still asks", bad.length === 0, JSON.stringify(bad));
}

// ---- R-1493: a symbolic link or junction anywhere on the way still asks
{
	const h = register({});
	const cases = ["linkout", "linkout/", "linkout/x", "linkin", "linkin/sub"].map((t) => [CWD, `rm -rf ${t}`]);
	const bad = await wrongVerdicts(h, "BLOCK", cases);
	// req: R-1493
	check("rm through a symbolic link or junction still asks", bad.length === 0, JSON.stringify(bad));
}

// ---- R-1494: anything beyond the narrow form, or the powershell tool, still asks
{
	const h = register({});
	const bashCases = [
		"rm -rf *", "rm -rf build/*", "rm -rf build?", "rm -rf [ab]", "rm -rf {a,b}", "rm -rf $X", "rm -rf ${X}/y",
		"rm -rf $(pwd)/x", "rm -rf `a`", `rm -rf "build"`, "rm -rf 'build'", "rm -rf b\\uild", "rm -rf ~/x",
		"rm -rf -- build", "rm -rf -x", "rm -rf build; ls", "rm -rf build && ls", "cd .. && rm -rf x",
		"\nrm -rf ../x", "sudo rm -rf build", "/bin/rm -rf build", "command rm -rf build", "X=1 rm -rf build",
		" rm -rf build", "rm -rf build ", "rm -rfi build", "rm -rf C:x", "rm -rf café",
	].map((c) => [CWD, c]);
	const psCases = [
		"rm -r build", "rm -rf build", "Remove-Item -Recurse -Force build", "ri -r -fo build",
	].map((c) => [CWD, c, "powershell"]);
	const bad = await wrongVerdicts(h, "BLOCK", [...bashCases, ...psCases]);
	// req: R-1494
	check("rm with globs, variables, quotes, escapes, --, prefixes, a second command or the powershell tool still asks", bad.length === 0, JSON.stringify(bad));
}

// ---- R-1495: a home, home-ancestor, root or dot-named working directory still asks
{
	const h = register({});
	const cwds = [
		HOME, path.dirname(HOME), path.parse(CWD).root,
		path.join(HOME, ".pi", "agent"), path.join(HOME, ".pi"), path.join(CWD, ".pi"),
		HOME_LINK, // a symlink to HOME: home reached through a second spelling (seat P24)
	];
	if (fs.existsSync(HOME_CASE_CHANGED)) {
		cwds.push(HOME_CASE_CHANGED); // a case-folding filesystem only: home reached by a case-changed spelling
	} else {
		console.log("SKIP: case-changed HOME spelling does not exist on this filesystem (case-sensitive)");
	}
	const cmds = ["rm -rf x", "rm -rf extensions", "rm -rf agent"];
	const cases = cwds.flatMap((cwd) => cmds.map((c) => [cwd, c]));
	const bad = await wrongVerdicts(h, "BLOCK", cases);
	// req: R-1495
	check("rm in a home, home-ancestor, root or dot-named working directory still asks", bad.length === 0, JSON.stringify(bad));
}

// ---- R-1496: a configured deny, a protected path or a named policy file still stops it
{
	const hA = register({ extraPatterns: ["^rm "] });
	const badA = await wrongVerdicts(hA, "BLOCK", [[CWD, "rm -rf build"]]);

	const hB = register({ protectedPaths: ["secrets"] });
	const badB = await wrongVerdicts(hB, "BLOCK", [[CWD, "rm -rf secrets"]]);

	process.env.PI_CODING_AGENT_DIR = path.join(CWD, "agentdir");
	const hC = register({});
	const badC = await wrongVerdicts(hC, "BLOCK", [[CWD, "rm -rf agentdir/auth.json"]]);
	delete process.env.PI_CODING_AGENT_DIR;

	const bad = [...badA, ...badB, ...badC];
	// req: R-1496
	check("configured deny and protected patterns and named policy files still stop an exempt-shaped rm", bad.length === 0, JSON.stringify(bad));
}

fs.rmSync(HOME, { recursive: true, force: true });
fs.rmSync(CWD, { recursive: true, force: true });
fs.rmSync(OUTSIDE, { recursive: true, force: true });
console.log(fails ? `FAILED ${fails}` : "all PASS");
process.exit(fails ? 1 : 0);
