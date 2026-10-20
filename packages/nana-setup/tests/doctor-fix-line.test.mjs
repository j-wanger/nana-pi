/**
 * @module packages/nana-setup/tests/doctor-fix-line.test.mjs
 * @purpose Pin doctor's final repair line to the changes install's dry run can actually make.
 * @inputs The nana-setup CLI, scratch homes and working folders, a pi stub, and PI_SUBAGENTS_FLOOR.
 * @outputs PASS/FAIL lines for M1 through M7 and a final failure-count summary.
 * @effects disk (temporary fixtures), process (runs install and doctor with sanitized environments).
 * @errors Failed assertions print their observed output and make the test process exit nonzero.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { PI_SUBAGENTS_FLOOR } from "../lib/doctor.mjs";
import { withPiStub } from "./stub-pi.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const cli = fileURLToPath(new URL("../bin/nana-setup.mjs", import.meta.url));
const root = tmpDir(path.join(os.tmpdir(), "nana-doctor-fix-line-"));
let failures = 0;
const check = (title, pass, detail = "") => {
	console.log(pass ? "PASS" : "FAIL", title, pass ? "" : detail);
	if (!pass) failures++;
};

function fixtureHome(name, { subagents = true } = {}) {
	const home = path.join(root, name);
	fs.mkdirSync(path.join(home, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(home, ".pi", "agent", "nana-knowledge", "sources.json"), '{"roots":[]}');
	if (subagents) {
		const packageDir = path.join(home, ".pi", "agent", "npm", "node_modules", "pi-subagents");
		fs.mkdirSync(packageDir, { recursive: true });
		fs.writeFileSync(path.join(packageDir, "package.json"), JSON.stringify({ name: "pi-subagents", version: PI_SUBAGENTS_FLOOR }));
	}
	return home;
}

function freshCwd(name, projectConfig = false) {
	const cwd = path.join(root, name);
	fs.mkdirSync(cwd, { recursive: true });
	if (projectConfig) {
		fs.mkdirSync(path.join(cwd, ".pi"), { recursive: true });
		fs.writeFileSync(path.join(cwd, ".pi", "nana-pack.json"), "{}\n");
	}
	return cwd;
}

function cleanEnv(home, extra = {}) {
	const env = { ...process.env, HOME: home, USERPROFILE: home, ...extra };
	for (const name of ["PI_CODING_AGENT_DIR", "CLAUDE_CONFIG_DIR", "NANA_SHARED_MEMORY_DIR", "NANA_KNOWLEDGE_HOME", "NANA_SETUP_PLATFORM"]) delete env[name];
	return { ...env, ...extra };
}

function run(args, { home, cwd, extraEnv = {} }) {
	return withPiStub(() => spawnSync(process.execPath, [cli, ...args], {
		cwd,
		env: cleanEnv(home, extraEnv),
		encoding: "utf8",
	}));
}

function summary(result) {
	return result.stdout.split(/\r?\n/).filter((line) => line.trim()).at(-1)?.trim() ?? "";
}

function failedLabels(result) {
	return result.stdout.split(/\r?\n/).flatMap((line) => {
		const match = /^\s*✗ (.*?)(?: {2}|$)/u.exec(line);
		return match ? [match[1].trimEnd()] : [];
	});
}

function walk(home) {
	const entries = [];
	const visit = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
			const absolute = path.join(dir, entry.name);
			const relative = path.relative(home, absolute).split(path.sep).join("/");
			const stat = fs.lstatSync(absolute);
			if (stat.isSymbolicLink()) entries.push(["link", relative, fs.readlinkSync(absolute)]);
			else if (stat.isDirectory()) { entries.push(["directory", relative]); visit(absolute); }
			else if (stat.isFile()) entries.push(["file", relative, fs.readFileSync(absolute).toString("base64")]);
			else entries.push(["other", relative]);
		}
	};
	visit(home);
	return entries;
}

const emptyHome = fixtureHome("empty-home");
const emptyCwd = freshCwd("empty-cwd");
const emptyBefore = JSON.stringify(walk(emptyHome));
const allInstallable = run(["doctor", "--home", emptyHome], { home: emptyHome, cwd: emptyCwd });
const allInstallableLabels = failedLabels(allInstallable);
// req: R-1990
check("R-1990: when install repairs every ✗ row, the summary reads n missing — run: nana-setup install", allInstallable.status === 1 && allInstallableLabels.length > 0 && summary(allInstallable) === `${allInstallableLabels.length} missing — run: nana-setup install`, `${allInstallable.status}\n${allInstallable.stdout}\n${allInstallable.stderr}`);
const emptyAfter = JSON.stringify(walk(emptyHome));
// req: R-1995
check("R-1995: doctor on a home install would change leaves every file, folder and link unchanged", allInstallable.status === 1 && emptyAfter === emptyBefore, `${allInstallable.status}\nbefore ${emptyBefore}\nafter ${emptyAfter}\n${allInstallable.stdout}\n${allInstallable.stderr}`);

const handHome = fixtureHome("hand-home", { subagents: false });
const handCwd = freshCwd("hand-cwd");
const handInstall = run(["install", "--home", handHome], { home: handHome, cwd: handCwd });
const handDoctor = run(["doctor", "--home", handHome], { home: handHome, cwd: handCwd });
// req: R-1991
check("R-1991: when no ✗ row is install's, the summary lists each as a fix by hand and never names install", handInstall.status === 0 && handDoctor.status === 1 && summary(handDoctor) === "1 missing — fix by hand as each ✗ line says: pi pi-subagents", `install ${handInstall.status}\n${handInstall.stdout}\n${handInstall.stderr}\ndoctor ${handDoctor.status}\n${handDoctor.stdout}\n${handDoctor.stderr}`);

const mixedHome = fixtureHome("mixed-home");
const mixedCwd = freshCwd("mixed-cwd");
const foreignSkill = path.join(mixedHome, ".claude", "skills", "spec");
fs.mkdirSync(foreignSkill, { recursive: true });
fs.writeFileSync(path.join(foreignSkill, "SKILL.md"), "owner's skill\n");
const mixedInstall = run(["install", "--home", mixedHome], { home: mixedHome, cwd: mixedCwd });
for (const name of ["nana-soul.md", "nana-standards.md"]) fs.rmSync(path.join(mixedHome, ".claude", "rules", name));
const mixedDoctor = run(["doctor", "--home", mixedHome], { home: mixedHome, cwd: mixedCwd });
// req: R-1992
check("R-1992: a refused skill and two missing rules: the summary lists only the skill by hand and gives install the other 2", mixedInstall.status === 1 && mixedDoctor.status === 1 && summary(mixedDoctor) === "3 missing — fix by hand as each ✗ line says: skill spec; then run: nana-setup install for the other 2", `install ${mixedInstall.status}\n${mixedInstall.stdout}\n${mixedInstall.stderr}\ndoctor ${mixedDoctor.status}\n${mixedDoctor.stdout}\n${mixedDoctor.stderr}`);

const winHome = fixtureHome("win-home");
const winCwd = freshCwd("win-cwd");
const winEnv = { NANA_SETUP_PLATFORM: "win32" };
const winPathEntries = String(process.env.PATH ?? "").split(path.delimiter).map((entry) => path.resolve(entry));
if (winPathEntries.includes(path.resolve(path.join(winHome, ".local", "bin")))) throw new Error("M4 fixture's home bin unexpectedly appears on PATH");
const winDoctor = run(["doctor"], { home: winHome, cwd: winCwd, extraEnv: winEnv });
const winByHand = summary(winDoctor).match(/fix by hand as each ✗ line says: (.*?)(?:; then run:| \(and see|$)/)?.[1]?.split(", ") ?? [];
// req: R-1993
check("R-1993: on win32's real home with its bin folder off the Path, the summary lists PATH resolves pi-review as a fix by hand", winDoctor.status === 1 && failedLabels(winDoctor).includes("PATH resolves pi-review") && winByHand.includes("PATH resolves pi-review"), `doctor ${winDoctor.status}\n${winDoctor.stdout}\n${winDoctor.stderr}`);

const refusedHome = fixtureHome("refused-home");
const refusedCwd = freshCwd("refused-cwd");
const refusedInstall = run(["install", "--home", refusedHome], { home: refusedHome, cwd: refusedCwd });
fs.writeFileSync(path.join(refusedHome, ".claude", "settings.json"), '{"hooks": {},}');
const refusedDoctor = run(["doctor", "--home", refusedHome], { home: refusedHome, cwd: refusedCwd });
// req: R-1994
check("R-1994: when install refuses the home, the summary names the refusal instead of telling the user to run install", refusedInstall.status === 0 && refusedDoctor.status === 1 && /^\d+ missing — nana-setup install will not run until this is fixed: .*settings\.json is not valid JSON/.test(summary(refusedDoctor)), `install ${refusedInstall.status}\n${refusedInstall.stdout}\n${refusedInstall.stderr}\ndoctor ${refusedDoctor.status}\n${refusedDoctor.stdout}\n${refusedDoctor.stderr}`);

const handWarnCwd = freshCwd("hand-warn-cwd", true);
const mixedWarnCwd = freshCwd("mixed-warn-cwd", true);
const handWarn = run(["doctor", "--home", handHome], { home: handHome, cwd: handWarnCwd });
const mixedWarn = run(["doctor", "--home", mixedHome], { home: mixedHome, cwd: mixedWarnCwd });
// req: R-1996
check("R-1996: with a ! row, both by-hand summary forms still end with the ! count", handWarn.status === 1 && mixedWarn.status === 1 && summary(handWarn) === "1 missing — fix by hand as each ✗ line says: pi pi-subagents (and see the 1 ! above)" && summary(mixedWarn) === "3 missing — fix by hand as each ✗ line says: skill spec; then run: nana-setup install for the other 2 (and see the 1 ! above)", `hand ${handWarn.status}\n${handWarn.stdout}\n${handWarn.stderr}\nmixed ${mixedWarn.status}\n${mixedWarn.stdout}\n${mixedWarn.stderr}`);

console.log(`${failures ? "FAIL" : "PASS"} summary: ${failures} failures`);
process.exit(failures ? 1 : 0);
