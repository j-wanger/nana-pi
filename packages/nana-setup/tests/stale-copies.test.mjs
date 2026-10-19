/**
 * @module packages/nana-setup/tests/stale-copies.test.mjs
 * @purpose Pin stale installed-copy notices for Claude Code and pi on POSIX and win32.
 * @inputs nana-setup install and dry-run skill steps, in-process doctor, the adoption hook, the rulings extension, and temporary homes.
 * @outputs PASS/FAIL/SKIP lines and a summary; a nonzero exit when any check fails.
 * @effects disk (temporary homes only), process (spawns installer and hook CLIs; temporarily sets NANA_SETUP_PLATFORM).
 * @errors unexpected fixture errors fail the test process; timed-out async handlers fail their case.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { tmpDir } from "./tmp-dir.mjs";
import { withPiStub } from "./stub-pi.mjs";
import { diagnose } from "../lib/doctor.mjs";
import { hookProducerConfig, runHookProducer } from "../lib/hook-producer.mjs";
import { pkgRoot, resolveLayout } from "../lib/paths.mjs";
import { PACK_SKILLS_DIR, ruleSource, stepSkills } from "../lib/steps.mjs";
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

function installHome(platformName, name) {
	const home = temp(`nana-stale-${platformName}-${name}-home-`);
	const project = temp(`nana-stale-${platformName}-${name}-project-`);
	const result = spawnSync(process.execPath, [cli, "install", "--home", home], {
		cwd: project,
		encoding: "utf8",
		env: { ...process.env, HOME: home, USERPROFILE: home },
		timeout: CASE_LIMIT_MS,
	});
	if (result.status !== 0) throw new Error(`install failed for ${platformName}/${name}: ${result.status}\n${result.stdout}\n${result.stderr}`);
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
	const labelText = body.split(" — tell the user;")[0];
	return labelText ? labelText.split(", ") : [];
}

function codeSpans(line) {
	return [...line.matchAll(/`([^`]*)`/g)].map((match) => match[1]);
}

function homeSnapshot(home) {
	const rows = [];
	const visit = (dir) => {
		for (const name of fs.readdirSync(dir).sort()) {
			const absolute = path.join(dir, name);
			const relative = path.relative(home, absolute);
			const stat = fs.lstatSync(absolute);
			const type = stat.isSymbolicLink() ? "link" : stat.isDirectory() ? "directory" : stat.isFile() ? "file" : "other";
			const target = stat.isSymbolicLink() ? fs.readlinkSync(absolute) : "";
			const contents = stat.isFile() ? createHash("sha256").update(fs.readFileSync(absolute)).digest("hex") : "";
			rows.push([relative, type, target, contents]);
			if (stat.isDirectory()) visit(absolute);
		}
	};
	visit(home);
	return rows;
}

async function extensionSections(fixture) {
	const handlers = {};
	rulingsExtension({ on: (name, handler) => { handlers[name] = handler; } }, { agentDir: fixture.layout.piHome });
	await within("rulings session_start", () => handlers.session_start({ reason: "startup" }, { cwd: fixture.project }));
	const event = { systemPromptOptions: { sections: {} } };
	await within("rulings before_agent_start", () => handlers.before_agent_start(event, { cwd: fixture.project }));
	return event.systemPromptOptions.sections;
}

function editSettings(fixture, edit) {
	const settings = JSON.parse(fs.readFileSync(fixture.layout.claudeSettings, "utf8"));
	edit(settings.hooks);
	fs.writeFileSync(fixture.layout.claudeSettings, `${JSON.stringify(settings, null, 2)}\n`);
}

function breakLegacyPosix(fixture) {
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

function breakLegacyWin32(fixture) {
	fs.writeFileSync(path.join(fixture.layout.rulesDir, "nana-standards.md"), "changed standards\n");
	fs.rmSync(path.join(fixture.layout.rulesDir, "nana-seat.md"), { force: true });
	fs.writeFileSync(path.join(fixture.layout.skillsDir, "requirements", "SKILL.md"), "changed requirements\n");
	fs.writeFileSync(fixture.layout.piRulings, "changed rulings\n");
}

function breakPosixLinkOnly(fixture) {
	fs.unlinkSync(path.join(fixture.layout.hooksDir, "nana-roster-notice.mjs"));
	const verifier = path.join(fixture.layout.hooksDir, "verifier-pipe.mjs");
	fs.unlinkSync(verifier);
	fs.writeFileSync(verifier, "regular file instead of hook link\n");
}

function breakPosixOccupied(fixture) {
	const pyLint = path.join(fixture.layout.skillsDir, "py-lint");
	fs.unlinkSync(pyLint);
	fs.mkdirSync(pyLint);
	fs.writeFileSync(path.join(pyLint, "mine.txt"), "owner file\n");
	const outside = temp("nana-stale-posix-spec-outside-");
	fs.writeFileSync(path.join(outside, "mine.txt"), "outside owner file\n");
	const spec = path.join(fixture.layout.skillsDir, "spec");
	fs.unlinkSync(spec);
	fs.symlinkSync(outside, spec);
	const requirements = path.join(fixture.layout.skillsDir, "requirements");
	fs.unlinkSync(requirements);
	fs.symlinkSync(outside, requirements);
	editSettings(fixture, (hooks) => { delete hooks.PreToolUse; delete hooks.UserPromptSubmit; });
}

function breakWin32HookOnly(fixture) {
	editSettings(fixture, (hooks) => {
		for (const group of hooks.PreToolUse ?? []) group.matcher = "Bash";
		delete hooks.UserPromptSubmit;
	});
}

function breakWin32Occupied(fixture) {
	const requirements = path.join(fixture.layout.skillsDir, "requirements");
	fs.rmSync(requirements, { recursive: true, force: true });
	fs.mkdirSync(requirements);
	fs.writeFileSync(path.join(requirements, "SKILL.md"), "owner requirements\n");
	editSettings(fixture, (hooks) => { delete hooks.UserPromptSubmit; });
}

function expectedMovePaths(item) {
	const doctorFails = new Set(item.doctor.filter((row) => row.status === "fail" && row.label.startsWith("skill ")).map((row) => row.label));
	return item.skillDryRun.filter((row) => row.status === "problem" && doctorFails.has(row.label)).map((row) => path.join(item.fixture.layout.skillsDir, row.label.slice("skill ".length)));
}

async function buildBroken(platformName, name, breaker) {
	const fixture = installHome(platformName, name);
	breaker(fixture);
	const doctor = doctorRows(fixture);
	const skillDryRun = stepSkills(fixture.layout, { dryRun: true });
	const before = homeSnapshot(fixture.home);
	const hook = hookResult(fixture, platformName);
	const after = homeSnapshot(fixture.home);
	const sections = name === "legacy" ? await extensionSections(fixture) : null;
	return { platform: platformName, name, fixture, doctor, skillDryRun, before, hook, after, sections };
}

async function platformFixtures(platformName) {
	const forced = platformName === "win32" ? "win32" : undefined;
	return withPlatform(forced, () => within(`${platformName} fixtures`, async () => {
		const currentFixture = installHome(platformName, "current");
		const current = {
			fixture: currentFixture,
			doctor: doctorRows(currentFixture),
			hook: hookResult(currentFixture, platformName),
			sections: await extensionSections(currentFixture),
		};
		const broken = [];
		if (platformName === "posix") {
			broken.push(await buildBroken(platformName, "legacy", breakLegacyPosix));
			broken.push(await buildBroken(platformName, "link-only", breakPosixLinkOnly));
			broken.push(await buildBroken(platformName, "occupied", breakPosixOccupied));
		} else {
			broken.push(await buildBroken(platformName, "legacy", breakLegacyWin32));
			broken.push(await buildBroken(platformName, "hook-only", breakWin32HookOnly));
			broken.push(await buildBroken(platformName, "occupied", breakWin32Occupied));
		}
		return { platform: platformName, current, broken };
	}));
}

check("seal: stale-copy prefixes and pi section key are pinned", STALE_PREFIX === "[nana:install] INSTALL STALE:" && STALE_UNAVAILABLE_PREFIX === "[nana:install] STALE-COPY CHECK UNAVAILABLE:" && STALE_SECTION === "nana-install-stale");

const uninstalled = { home: temp("nana-stale-uninstalled-home-"), project: temp("nana-stale-uninstalled-project-") };
const uninstalledEnv = { ...process.env, HOME: uninstalled.home, USERPROFILE: uninstalled.home, CLAUDE_PROJECT_DIR: uninstalled.project };
delete uninstalledEnv.PI_CODING_AGENT_DIR;
const uninstalledHook = spawnSync(process.execPath, [adoptionSource], { cwd: uninstalled.project, encoding: "utf8", env: uninstalledEnv, timeout: CASE_LIMIT_MS });
const uninstalledFacts = { status: uninstalledHook.status, stale: staleLines(uninstalledHook), unavailable: unavailableLines(uninstalledHook), stderr: uninstalledHook.stderr };
// req: R-1606
check("R-1606: a home where nana-setup never installed adds no stale or unavailable line", uninstalledFacts.status === 0 && uninstalledFacts.stale.length === 0 && uninstalledFacts.unavailable.length === 0, JSON.stringify(uninstalledFacts));

const cases = [];
if (process.platform === "win32") skip("POSIX stale-copy fixtures require symlinks; native win32 installs copies");
else cases.push(await platformFixtures("posix"));
cases.push(await platformFixtures("win32"));
const brokenCases = cases.flatMap((item) => item.broken);
const legacyCases = brokenCases.filter((item) => item.name === "legacy");

const r1600Facts = legacyCases.map((item) => ({ platform: item.platform, result: item.hook, lines: staleLines(item.hook) }));
const r1600 = r1600Facts.every(({ result, lines }) => result.status === 0 && lines.length === 1 && lines[0].includes(STALE_PREFIX) && lines[0].includes(`\`${expectedCommand}\``));
// req: R-1600
check("R-1600: a missing, misdirected or changed rule or skill puts one stale line in the adoption hook output", r1600, JSON.stringify(r1600Facts.map(({ platform, result, lines }) => ({ platform, status: result.status, lines, stderr: result.stderr }))));

const hookFailureCases = brokenCases.filter((item) => item.doctor.some((row) => row.status === "fail" && /^(hook|settings) /.test(row.label)));
const r1760Facts = hookFailureCases.map((item) => ({ platform: item.platform, name: item.name, status: item.hook.status, lines: staleLines(item.hook) }));
const r1760 = r1760Facts.every(({ status, lines }) => status === 0 && lines.length === 1 && lines[0].includes(`\`${expectedCommand}\``));
// req: R-1760
check("R-1760: a missing hook link or hook settings entry puts one stale line in the adoption hook output", r1760, JSON.stringify(r1760Facts));

const labelFacts = brokenCases.map((item) => {
	const expected = item.doctor.filter((row) => row.status === "fail" && /^(hook|rule|skill|settings) /.test(row.label) && row.label !== "rule nana-personal.md").map((row) => row.label);
	const line = staleLines(item.hook)[0] ?? "";
	return { platform: item.platform, name: item.name, expected, actual: labelsFrom(line), nonempty: expected.length > 0 };
});
const r1761 = labelFacts.every(({ expected, actual, nonempty }) => nonempty && JSON.stringify(actual) === JSON.stringify(expected));
// req: R-1761
check("R-1761: the stale line names exactly the rule, skill and hook rows doctor marks failed", r1761, JSON.stringify(labelFacts));

const moveFacts = brokenCases.map((item) => {
	const line = staleLines(item.hook)[0] ?? "";
	const spans = codeSpans(line);
	return { platform: item.platform, name: item.name, expected: expectedMovePaths(item), actual: spans.slice(0, -1), install: spans.at(-1) };
});
const r1762 = moveFacts.every(({ expected, actual, install }) => JSON.stringify(actual) === JSON.stringify(expected) && install === expectedCommand);
// req: R-1762
check("R-1762: the stale line names as paths to move exactly the skill paths install refuses", r1762, JSON.stringify(moveFacts));

const currentHookFacts = cases.map(({ platform, current }) => ({ platform, status: current.hook.status, stale: staleLines(current.hook), unavailable: unavailableLines(current.hook), stderr: current.hook.stderr }));
const r1764 = currentHookFacts.every(({ status, stale, unavailable }) => status === 0 && stale.length === 0 && unavailable.length === 0);
// req: R-1764
check("R-1764: a current install adds no stale or unavailable line to the adoption hook output", r1764, JSON.stringify(currentHookFacts));

const unchangedFacts = brokenCases.map((item) => ({ platform: item.platform, name: item.name, unchanged: JSON.stringify(item.before) === JSON.stringify(item.after) }));
const r1765 = unchangedFacts.every((item) => item.unchanged);
// req: R-1765
check("R-1765: the adoption hook leaves every file, folder and link in the home unchanged", r1765, JSON.stringify(unchangedFacts));

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

const staleSectionFacts = legacyCases.map((item) => ({ platform: item.platform, doctor: item.doctor.find((row) => row.label === `pi ${RULINGS_FILE}`), stale: item.sections[STALE_SECTION], rulings: item.sections[RULINGS_SECTION] }));
const r1604 = staleSectionFacts.every(({ doctor, stale, rulings }) => doctor?.status === "fail" && typeof rulings === "string" && typeof stale === "string" && !stale.includes("\n") && stale.startsWith(STALE_PREFIX) && stale.includes(`pi ${RULINGS_FILE}`) && stale.includes(`\`${expectedCommand}\``));
// req: R-1604
check("R-1604: a rulings copy doctor marks failed sets one stale line in its own section", r1604, JSON.stringify(staleSectionFacts));

const currentSectionFacts = cases.map(({ platform, current }) => ({ platform, doctor: current.doctor.find((row) => row.label === `pi ${RULINGS_FILE}`), hasStale: Object.hasOwn(current.sections, STALE_SECTION), rulings: current.sections[RULINGS_SECTION] }));
const r1605 = currentSectionFacts.every(({ doctor, hasStale, rulings }) => doctor?.status === "ok" && !hasStale && typeof rulings === "string");
// req: R-1605
check("R-1605: a rulings copy doctor marks current sets no stale section", r1605, JSON.stringify(currentSectionFacts));

async function repairCase(item) {
	const line = staleLines(item.hook)[0] ?? "";
	const spans = codeSpans(line);
	const movePaths = spans.slice(0, -1);
	const namedAsExpected = JSON.stringify(movePaths) === JSON.stringify(expectedMovePaths(item));
	const safe = movePaths.every((movePath) => {
		const relative = path.relative(item.fixture.home, movePath);
		return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
	});
	if (!namedAsExpected || !safe) return { platform: item.platform, name: item.name, command: spans.at(-1), namedAsExpected, safe, installStatus: null, staleAfter: null };
	const scratch = temp(`nana-stale-${item.platform}-${item.name}-moved-`);
	for (const [index, movePath] of movePaths.entries()) fs.renameSync(movePath, path.join(scratch, `${index}-${path.basename(movePath)}`));
	const env = { ...process.env, HOME: item.fixture.home, USERPROFILE: item.fixture.home };
	const install = spawnSync(process.execPath, [cli, "install", "--home", item.fixture.home], { cwd: item.fixture.project, encoding: "utf8", env, timeout: CASE_LIMIT_MS });
	const after = hookResult(item.fixture, item.platform);
	return { platform: item.platform, name: item.name, command: spans.at(-1), namedAsExpected, safe, installStatus: install.status, installStdout: install.stdout, installStderr: install.stderr, hookStatus: after.status, staleAfter: staleLines(after) };
}

const repairFacts = [];
for (const platformCase of cases) {
	const forced = platformCase.platform === "win32" ? "win32" : undefined;
	await withPlatform(forced, async () => {
		for (const item of platformCase.broken) repairFacts.push(await within(`${item.platform}/${item.name} repair`, () => repairCase(item)));
	});
}
const r1763 = repairFacts.every((item) => item.command === expectedCommand && item.namedAsExpected && item.safe && item.installStatus === 0 && item.hookStatus === 0 && item.staleAfter.length === 0);
// req: R-1763
check("R-1763: moving the named paths and running the named install clears the stale line", r1763, JSON.stringify(repairFacts));

for (const dir of tmps) fs.rmSync(dir, { recursive: true, force: true });
console.log(`SUMMARY  PASS=${passes} FAIL=${fails} SKIP=${skips}`);
process.exitCode = fails ? 1 : 0;
