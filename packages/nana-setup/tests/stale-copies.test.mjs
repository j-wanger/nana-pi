/**
 * @module packages/nana-setup/tests/stale-copies.test.mjs
 * @purpose Pin stale installed-copy notices for Claude Code and pi on POSIX and win32.
 * @inputs nana-setup install, in-process doctor, the adoption hook, the rulings extension, and temporary homes.
 * @outputs PASS/FAIL/SKIP lines and a summary; a nonzero exit when any check fails.
 * @effects disk (temporary homes only), process (spawns installer and hook CLIs; temporarily sets NANA_SETUP_PLATFORM).
 * @errors unexpected fixture errors fail the test process; timed-out async handlers fail their case.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { withPiStub } from "./stub-pi.mjs";
import { diagnose } from "../lib/doctor.mjs";
import { hookProducerConfig, runHookProducer } from "../lib/hook-producer.mjs";
import { pkgRoot, resolveLayout } from "../lib/paths.mjs";
import { ruleSource } from "../lib/steps.mjs";
import { STALE_PREFIX, STALE_SECTION, STALE_UNAVAILABLE_PREFIX } from "../lib/stale-copies-config.mjs";
import rulingsExtension from "../../nana-pack/extensions/nana-rulings.ts";
import { RULINGS_FILE, RULINGS_SECTION } from "../../nana-pack/lib/rulings-config.mjs";

let passes = 0;
let fails = 0;
let skips = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
	if (ok) passes++;
	else fails++;
};
const skip = (reason) => { console.log("SKIP", reason); skips++; };
const tmps = [];
const cli = path.join(pkgRoot, "bin", "nana-setup.mjs");
const adoptionSource = path.join(pkgRoot, "claude", "hooks", "nana-adoption.mjs");
const expectedCommand = `node "${path.join(fs.realpathSync(pkgRoot), "bin", "nana-setup.mjs")}" install`;
const CASE_LIMIT_MS = 5000;

function temp(prefix) {
	const dir = tmpDir(path.join(os.tmpdir(), prefix));
	tmps.push(dir);
	return dir;
}

async function withPlatform(value, fn) {
	const saved = process.env.NANA_SETUP_PLATFORM;
	try {
		if (value === undefined) delete process.env.NANA_SETUP_PLATFORM;
		else process.env.NANA_SETUP_PLATFORM = value;
		return await fn();
	} finally {
		if (saved === undefined) delete process.env.NANA_SETUP_PLATFORM;
		else process.env.NANA_SETUP_PLATFORM = saved;
	}
}

async function within(label, fn) {
	let timer;
	try {
		return await Promise.race([
			Promise.resolve().then(fn),
			new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} exceeded ${CASE_LIMIT_MS}ms`)), CASE_LIMIT_MS); }),
		]);
	} finally {
		clearTimeout(timer);
	}
}

function installHome(platformName) {
	const home = temp(`nana-stale-${platformName}-home-`);
	const project = temp(`nana-stale-${platformName}-project-`);
	const result = spawnSync(process.execPath, [cli, "install", "--home", home], {
		cwd: project,
		encoding: "utf8",
		env: { ...process.env, HOME: home, USERPROFILE: home },
		timeout: CASE_LIMIT_MS,
	});
	if (result.status !== 0) throw new Error(`install failed for ${platformName}: ${result.status}\n${result.stdout}\n${result.stderr}`);
	return { home, project, layout: resolveLayout({ home }) };
}

function doctorRows(fixture) {
	return withPiStub(() => diagnose(fixture.layout, { projectDir: fixture.project }));
}

function hookResult(fixture, platformName) {
	const hook = platformName === "posix" ? path.join(fixture.layout.hooksDir, "nana-adoption.mjs") : adoptionSource;
	const env = { ...process.env, HOME: fixture.home, USERPROFILE: fixture.home, CLAUDE_PROJECT_DIR: fixture.project };
	delete env.PI_CODING_AGENT_DIR;
	return spawnSync(process.execPath, [hook], { cwd: fixture.project, encoding: "utf8", env, timeout: CASE_LIMIT_MS });
}

function staleLines(result) {
	return String(result.stdout ?? "").split(/\r?\n/).filter((line) => line.startsWith(STALE_PREFIX));
}

function unavailableLines(result) {
	return String(result.stdout ?? "").split(/\r?\n/).filter((line) => line.startsWith(STALE_UNAVAILABLE_PREFIX));
}

function labelsFrom(line) {
	const body = line.slice(STALE_PREFIX.length).trimStart();
	const labelText = body.split(" — tell the user; they fix it with")[0];
	return labelText ? labelText.split(", ") : [];
}

async function extensionSections(fixture) {
	const handlers = {};
	rulingsExtension({ on: (name, handler) => { handlers[name] = handler; } }, { agentDir: fixture.layout.piHome });
	await within("rulings session_start", () => handlers.session_start({ reason: "startup" }, { cwd: fixture.project }));
	const event = { systemPromptOptions: { sections: {} } };
	await within("rulings before_agent_start", () => handlers.before_agent_start(event, { cwd: fixture.project }));
	return event.systemPromptOptions.sections;
}

function breakPosix(fixture) {
	const elsewhereFile = path.join(fixture.home, "elsewhere.md");
	fs.writeFileSync(elsewhereFile, "elsewhere\n");
	fs.unlinkSync(path.join(fixture.layout.rulesDir, "nana-seat.md"));
	fs.unlinkSync(path.join(fixture.layout.rulesDir, "nana-soul.md"));
	fs.symlinkSync(elsewhereFile, path.join(fixture.layout.rulesDir, "nana-soul.md"));
	fs.unlinkSync(path.join(fixture.layout.rulesDir, "nana-writing.md"));
	fs.copyFileSync(ruleSource("nana-writing.md"), path.join(fixture.layout.rulesDir, "nana-writing.md"));
	const elsewhereSkill = path.join(fixture.home, "elsewhere-skill");
	fs.mkdirSync(elsewhereSkill);
	fs.unlinkSync(path.join(fixture.layout.skillsDir, "requirements"));
	fs.symlinkSync(elsewhereSkill, path.join(fixture.layout.skillsDir, "requirements"));
	fs.unlinkSync(fixture.layout.piRulings);
	fs.copyFileSync(ruleSource(RULINGS_FILE), fixture.layout.piRulings);
}

function breakWin32(fixture) {
	fs.writeFileSync(path.join(fixture.layout.rulesDir, "nana-standards.md"), "changed standards\n");
	fs.rmSync(path.join(fixture.layout.rulesDir, "nana-seat.md"), { force: true });
	fs.writeFileSync(path.join(fixture.layout.skillsDir, "requirements", "SKILL.md"), "changed requirements\n");
	fs.writeFileSync(fixture.layout.piRulings, "changed rulings\n");
}

async function platformFixtures(platformName) {
	const forced = platformName === "win32" ? "win32" : undefined;
	return withPlatform(forced, async () => {
		const current = installHome(platformName);
		const currentDoctor = doctorRows(current);
		const currentHook = hookResult(current, platformName);
		const currentSections = await extensionSections(current);
		const broken = installHome(platformName);
		if (platformName === "win32") breakWin32(broken);
		else breakPosix(broken);
		const brokenDoctor = doctorRows(broken);
		const brokenHook = hookResult(broken, platformName);
		const brokenSections = await extensionSections(broken);
		return { current: { fixture: current, doctor: currentDoctor, hook: currentHook, sections: currentSections }, broken: { fixture: broken, doctor: brokenDoctor, hook: brokenHook, sections: brokenSections } };
	});
}

check("seal: stale-copy prefixes and pi section key are pinned", STALE_PREFIX === "[nana:install] INSTALL STALE:" && STALE_UNAVAILABLE_PREFIX === "[nana:install] STALE-COPY CHECK UNAVAILABLE:" && STALE_SECTION === "nana-install-stale");

const cases = [];
if (process.platform === "win32") {
	skip("POSIX stale-copy fixtures require symlinks; native win32 installs copies");
} else {
	cases.push({ platform: "posix", ...(await platformFixtures("posix")) });
}
cases.push({ platform: "win32", ...(await platformFixtures("win32")) });

const brokenHookFacts = cases.map(({ platform, broken }) => {
	const lines = staleLines(broken.hook);
	return { platform, result: broken.hook, lines, labels: lines.length === 1 ? labelsFrom(lines[0]) : [] };
});
const r1600 = brokenHookFacts.every(({ result, lines }) => result.status === 0 && lines.length === 1 && lines[0].includes(STALE_PREFIX) && lines[0].includes(`\`${expectedCommand}\``));
// req: R-1600
check("R-1600: a missing, misdirected or changed rule or skill puts one stale line in the adoption hook output", r1600, JSON.stringify(brokenHookFacts.map(({ platform, result, lines }) => ({ platform, status: result.status, lines, stderr: result.stderr }))));

const currentHookFacts = cases.map(({ platform, current }) => ({ platform, status: current.hook.status, stale: staleLines(current.hook), unavailable: unavailableLines(current.hook), stderr: current.hook.stderr }));
const r1601 = currentHookFacts.every(({ status, stale, unavailable }) => status === 0 && stale.length === 0 && unavailable.length === 0);
// req: R-1601
check("R-1601: a current install adds no stale or unavailable line to the adoption hook output", r1601, JSON.stringify(currentHookFacts));

const labelFacts = cases.map(({ platform, broken }) => {
	const expected = broken.doctor.filter((row) => row.status === "fail" && (/^(rule|skill) /.test(row.label)) && row.label !== "rule nana-personal.md").map((row) => row.label).sort();
	const line = staleLines(broken.hook)[0] ?? "";
	const actual = labelsFrom(line).sort();
	return { platform, expected, actual, nonempty: expected.length > 0 };
});
const r1602 = labelFacts.every(({ expected, actual, nonempty }) => nonempty && JSON.stringify(actual) === JSON.stringify(expected));
// req: R-1602
check("R-1602: the stale line names exactly the rule and skill rows doctor marks failed", r1602, JSON.stringify(labelFacts));

const producerConfig = hookProducerConfig("stale-copies", fs.realpathSync(path.resolve(pkgRoot, "..", "..")));
const producerOutcomes = [
	{ name: "spawn error", result: { status: null, signal: null, error: new Error("spawn failed"), stdout: "" } },
	{ name: "signal", result: { status: null, signal: "SIGTERM", stdout: "" } },
	{ name: "exit 1", result: { status: 1, signal: null, stdout: "wrong output\n" } },
].map(({ name, result }) => {
	let output = "";
	runHookProducer({ ...producerConfig, cwd: os.tmpdir(), env: {}, run: () => result, stdout: { write: (text) => { output += text; } } });
	return { name, output };
});
const r1603 = producerOutcomes.every(({ output }) => output === producerConfig.marker && output.split("\n").filter(Boolean).length === 1 && output.startsWith(STALE_UNAVAILABLE_PREFIX) && !output.includes("ADOPTION UNAVAILABLE"));
// req: R-1603
check("R-1603: a failed stale-copies checker writes only the unavailable line", r1603, JSON.stringify(producerOutcomes));

const staleSectionFacts = cases.map(({ platform, broken }) => ({ platform, doctor: broken.doctor.find((row) => row.label === `pi ${RULINGS_FILE}`), stale: broken.sections[STALE_SECTION], rulings: broken.sections[RULINGS_SECTION] }));
const r1604 = staleSectionFacts.every(({ doctor, stale, rulings }) => doctor?.status === "fail" && typeof rulings === "string" && typeof stale === "string" && !stale.includes("\n") && stale.startsWith(STALE_PREFIX) && stale.includes(`pi ${RULINGS_FILE}`) && stale.includes(`\`${expectedCommand}\``));
// req: R-1604
check("R-1604: a rulings copy doctor marks failed sets one stale line in its own section", r1604, JSON.stringify(staleSectionFacts));

const currentSectionFacts = cases.map(({ platform, current }) => ({ platform, doctor: current.doctor.find((row) => row.label === `pi ${RULINGS_FILE}`), hasStale: Object.hasOwn(current.sections, STALE_SECTION), rulings: current.sections[RULINGS_SECTION] }));
const r1605 = currentSectionFacts.every(({ doctor, hasStale, rulings }) => doctor?.status === "ok" && !hasStale && typeof rulings === "string");
// req: R-1605
check("R-1605: a rulings copy doctor marks current sets no stale section", r1605, JSON.stringify(currentSectionFacts));

for (const dir of tmps) fs.rmSync(dir, { recursive: true, force: true });
console.log(`SUMMARY  PASS=${passes} FAIL=${fails} SKIP=${skips}`);
process.exitCode = fails ? 1 : 0;
