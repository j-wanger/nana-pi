#!/usr/bin/env node
/**
 * @module packages/nana-setup/tests/checkout-spelling.test.mjs
 * @purpose Prove setup treats honest second spellings of its checkout as the same checkout.
 * @inputs A copied checkout fixture, nana-setup install/doctor/uninstall and stale-copies CLIs, native path spellings, and temporary homes.
 * @outputs PASS/FAIL/SKIP lines and a summary; a nonzero exit when any check fails.
 * @effects disk (temporary checkout, homes and projects only), process (spawns setup and spelling probes).
 * @errors Fixture or assertion failures fail their case; every child process has a per-case timeout.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { realPath } from "../../nana-pack/lib/real-path.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const CASE_LIMIT_MS = 20_000;
const checkout = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const copied = tmpDir(path.join(os.tmpdir(), "nana-spelling-"));
const canonical = realPath(copied, { mustExist: true });
const cliRelative = path.join("packages", "nana-setup", "bin", "nana-setup.mjs");
const staleRelative = path.join("packages", "nana-setup", "bin", "stale-copies.mjs");
let passes = 0;
let fails = 0;
let skips = 0;

function copyFixture() {
	fs.copyFileSync(path.join(checkout, "package.json"), path.join(copied, "package.json"));
	fs.mkdirSync(path.join(copied, "apps", "desk"), { recursive: true });
	fs.copyFileSync(path.join(checkout, "apps", "desk", "server.mjs"), path.join(copied, "apps", "desk", "server.mjs"));
	fs.mkdirSync(path.join(copied, "packages"), { recursive: true });
	for (const name of ["nana-setup", "nana-pack", "nana-knowledge"])
		fs.cpSync(path.join(checkout, "packages", name), path.join(copied, "packages", name), { recursive: true });
}
copyFixture();

const swapCase = (value) => [...value].map((char) => char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase()).join("");
const spellings = [];
const caseSpelling = path.join(path.dirname(canonical), swapCase(path.basename(canonical)));
if (caseSpelling !== canonical && fs.existsSync(caseSpelling)) spellings.push({ kind: "case", path: caseSpelling });
else console.log("SKIP spelling case — this volume is case-sensitive");
if (process.platform === "win32") {
	const driveSpelling = canonical.replace(/^([A-Z]):/, (_match, drive) => `${drive.toLowerCase()}:`);
	if (driveSpelling !== canonical) spellings.push({ kind: "lowercase drive", path: driveSpelling });
	else console.log("SKIP spelling lowercase drive — the canonical drive is already lowercase or absent");
	let shortSpelling = copied.toLowerCase() !== canonical.toLowerCase() ? copied : null;
	if (!shortSpelling) {
		const escaped = canonical.replaceAll("'", "''");
		const probe = spawnSync("powershell", ["-NoProfile", "-Command", `(New-Object -ComObject Scripting.FileSystemObject).GetFolder('${escaped}').ShortPath`], { encoding: "utf8", timeout: CASE_LIMIT_MS });
		const candidate = probe.status === 0 ? probe.stdout.trim() : "";
		if (candidate && candidate.toLowerCase() !== canonical.toLowerCase()) shortSpelling = candidate;
	}
	if (shortSpelling) spellings.push({ kind: "8.3 short", path: shortSpelling });
	else console.log("SKIP spelling 8.3 short — no distinct short path is available");
}
const uniqueSpellings = [...new Map(spellings.map((item) => [item.path, item])).values()];
for (const spelling of uniqueSpellings) console.log(`SPELLING ${spelling.kind} — canonical=${canonical} spelled=${spelling.path}`);

const forms = process.platform === "win32"
	? [{ name: "native", platform: undefined }]
	: [{ name: "POSIX", platform: undefined }, { name: "forced win32", platform: "win32" }];

function check(title, body) {
	try {
		body();
		console.log("PASS", title);
		passes++;
	} catch (error) {
		console.log("FAIL", title, error?.message ?? String(error));
		fails++;
	}
}
function skip(reason) { console.log("SKIP", reason); skips++; }
function assert(condition, detail) { if (!condition) throw new Error(detail); }
function fresh(prefix) { return tmpDir(path.join(os.tmpdir(), prefix)); }

function childEnv(home, form) {
	const env = {
		...process.env,
		HOME: home,
		USERPROFILE: home,
		PATH: `${path.join(home, ".local", "bin")}${path.delimiter}${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ""}`,
	};
	delete env.PI_CODING_AGENT_DIR;
	if (form.platform) env.NANA_SETUP_PLATFORM = form.platform;
	else delete env.NANA_SETUP_PLATFORM;
	return env;
}

function run(root, args, { home, project, form }) {
	return spawnSync(process.execPath, [path.join(root, cliRelative), ...args, "--home", home], {
		cwd: project,
		env: childEnv(home, form),
		encoding: "utf8",
		timeout: CASE_LIMIT_MS,
	});
}

function runStale(root, { home, project, form }) {
	return spawnSync(process.execPath, [path.join(root, staleRelative)], {
		cwd: project,
		env: childEnv(home, form),
		encoding: "utf8",
		timeout: CASE_LIMIT_MS,
	});
}

function assertFinished(result, label) {
	assert(!result.error, `${label} did not finish: ${result.error?.message}`);
	assert(result.signal === null, `${label} ended by ${result.signal}`);
}

function installCanonical(fixture) {
	const result = run(canonical, ["install"], fixture);
	assertFinished(result, "canonical install");
	assert(result.status === 0, `canonical install exited ${result.status}\n${result.stdout}\n${result.stderr}`);
	return result;
}

function doctorRows(result) {
	assertFinished(result, "doctor");
	return String(result.stdout).split(/\r?\n/u).flatMap((line) => {
		const match = line.match(/^\s*([✓✗!·])\s+(.+?)\s{2,}/u);
		return match ? [[match[1], match[2]]] : [];
	});
}

function homeSnapshot(home) {
	const rows = [];
	const walk = (folder) => {
		for (const name of fs.readdirSync(folder).sort()) {
			const absolute = path.join(folder, name);
			const relative = path.relative(home, absolute);
			const stat = fs.lstatSync(absolute);
			if (stat.isSymbolicLink()) rows.push([relative, "link", fs.readlinkSync(absolute)]);
			else if (stat.isFile()) rows.push([relative, "file", createHash("sha256").update(fs.readFileSync(absolute)).digest("hex")]);
			else if (stat.isDirectory()) { rows.push([relative, "folder", name]); walk(absolute); }
			else rows.push([relative, "other", name]);
		}
	};
	walk(home);
	return rows;
}

function fixture(form, label) {
	return { home: fresh(`nana-spelling-${label}-home-`), project: fresh(`nana-spelling-${label}-project-`), form };
}

function eachSpelling(runCase) {
	for (const form of forms) for (const spelling of uniqueSpellings) runCase(form, spelling);
}

function noProblemRow(result) { return !String(result.stdout).split(/\r?\n/u).some((line) => /^\s*✗\s/u.test(line)); }

// req: R-1980
uniqueSpellings.length ? check("R-1980: doctor through a second spelling of the checkout gives the same rows as through its on-disk spelling", () => {
	eachSpelling((form, spelling) => {
		const item = fixture(form, `1980-${form.name}-${spelling.kind}`);
		installCanonical(item);
		const expected = doctorRows(run(canonical, ["doctor"], item));
		const actual = doctorRows(run(spelling.path, ["doctor"], item));
		assert(JSON.stringify(actual) === JSON.stringify(expected), `${form.name}/${spelling.kind}: rows differ\nexpected=${JSON.stringify(expected)}\nactual=${JSON.stringify(actual)}`);
	});
}) : skip("R-1980 — no second spelling is available on this volume");

// req: R-1981
uniqueSpellings.length ? check("R-1981: install through a second spelling of the checkout exits 0 and refuses none of its own links", () => {
	eachSpelling((form, spelling) => {
		const item = fixture(form, `1981-${form.name}-${spelling.kind}`);
		installCanonical(item);
		const result = run(spelling.path, ["install"], item);
		assertFinished(result, "second-spelling install");
		assert(result.status === 0 && noProblemRow(result), `${form.name}/${spelling.kind}: exit=${result.status}\n${result.stdout}\n${result.stderr}`);
	});
}) : skip("R-1981 — no second spelling is available on this volume");

// req: R-1982
uniqueSpellings.length ? check("R-1982: install through a second spelling of the checkout leaves the home byte-identical", () => {
	eachSpelling((form, spelling) => {
		const item = fixture(form, `1982-${form.name}-${spelling.kind}`);
		installCanonical(item);
		const before = homeSnapshot(item.home);
		const result = run(spelling.path, ["install"], item);
		assertFinished(result, "second-spelling install");
		const after = homeSnapshot(item.home);
		assert(JSON.stringify(after) === JSON.stringify(before), `${form.name}/${spelling.kind}: home changed\nbefore=${JSON.stringify(before)}\nafter=${JSON.stringify(after)}`);
	});
}) : skip("R-1982 — no second spelling is available on this volume");

// req: R-1983
uniqueSpellings.length ? check("R-1983: after installs through both spellings the stale-copy producer prints nothing through either", () => {
	eachSpelling((form, spelling) => {
		const item = fixture(form, `1983-${form.name}-${spelling.kind}`);
		installCanonical(item);
		const second = run(spelling.path, ["install"], item);
		assertFinished(second, "second-spelling install");
		for (const root of [canonical, spelling.path]) {
			const stale = runStale(root, item);
			assertFinished(stale, "stale-copy producer");
			assert(stale.status === 0 && stale.stdout === "", `${form.name}/${spelling.kind}/${root === canonical ? "canonical" : "spelled"}: ${JSON.stringify(stale.stdout)} ${stale.stderr}`);
		}
	});
}) : skip("R-1983 — no second spelling is available on this volume");

function rewritePathText(value, from, to) {
	return value
		.replaceAll(from, to)
		.replaceAll(from.replaceAll(path.sep, "/"), to.replaceAll(path.sep, "/"))
		.replaceAll(from.replaceAll(path.sep, "\\"), to.replaceAll(path.sep, "\\"));
}

function repointEarlierHome(item, spelling) {
	let links = 0;
	const walk = (folder) => {
		for (const name of fs.readdirSync(folder)) {
			const absolute = path.join(folder, name);
			const stat = fs.lstatSync(absolute);
			if (stat.isSymbolicLink()) {
				const target = fs.readlinkSync(absolute);
				if (target.startsWith(canonical)) {
					fs.unlinkSync(absolute);
					fs.symlinkSync(rewritePathText(target, canonical, spelling.path), absolute, stat.isDirectory() ? "dir" : "file");
					links++;
				}
			} else if (stat.isDirectory()) walk(absolute);
		}
	};
	walk(item.home);
	const settingsPath = path.join(item.home, ".claude", "settings.json");
	const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
	let hooks = 0;
	for (const groups of Object.values(settings.hooks ?? {})) for (const group of groups ?? []) for (const hook of group.hooks ?? []) {
		if (typeof hook.command === "string") {
			const next = rewritePathText(hook.command, canonical, spelling.path);
			if (next !== hook.command) { hook.command = next; hooks++; }
		}
		if (Array.isArray(hook.args)) hook.args = hook.args.map((arg) => {
			if (typeof arg !== "string") return arg;
			const next = rewritePathText(arg, canonical, spelling.path);
			if (next !== arg) hooks++;
			return next;
		});
	}
	fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
	const piSettingsPath = path.join(item.home, ".pi", "agent", "settings.json");
	const piSettings = JSON.parse(fs.readFileSync(piSettingsPath, "utf8"));
	piSettings.packages = (piSettings.packages ?? []).map((entry) => typeof entry === "string" ? rewritePathText(entry, canonical, spelling.path) : entry);
	fs.writeFileSync(piSettingsPath, `${JSON.stringify(piSettings, null, 2)}\n`);
	return { links, hooks };
}

function earlierHome(form, spelling, label) {
	const item = fixture(form, label);
	installCanonical(item);
	const piSettingsPath = path.join(item.home, ".pi", "agent", "settings.json");
	const piSettings = fs.existsSync(piSettingsPath) ? JSON.parse(fs.readFileSync(piSettingsPath, "utf8")) : {};
	piSettings.packages = [path.join(canonical, "packages", "nana-pack"), path.join(canonical, "packages", "nana-knowledge")];
	fs.writeFileSync(piSettingsPath, `${JSON.stringify(piSettings, null, 2)}\n`);
	const beforeRows = doctorRows(run(canonical, ["doctor"], item));
	const changed = repointEarlierHome(item, spelling);
	assert(changed.hooks > 0, `${form.name}/${spelling.kind}: no hook entry changed`);
	if (form.name === "POSIX") assert(changed.links > 0, `${form.name}/${spelling.kind}: no link changed`);
	return { item, beforeRows, changed };
}

// req: R-1984
uniqueSpellings.length ? check("R-1984: links, hook entries and pi entries written through another spelling of the checkout still read as this checkout's", () => {
	eachSpelling((form, spelling) => {
		const { item, beforeRows } = earlierHome(form, spelling, `1984-${form.name}-${spelling.kind}`);
		const afterRows = doctorRows(run(canonical, ["doctor"], item));
		assert(JSON.stringify(afterRows) === JSON.stringify(beforeRows), `${form.name}/${spelling.kind}: doctor rows changed\nbefore=${JSON.stringify(beforeRows)}\nafter=${JSON.stringify(afterRows)}`);
		const installed = run(canonical, ["install"], item);
		assertFinished(installed, "install over earlier spelling");
		assert(installed.status === 0 && noProblemRow(installed), `${form.name}/${spelling.kind}: exit=${installed.status}\n${installed.stdout}\n${installed.stderr}`);
	});
}) : skip("R-1984 — no second spelling is available on this volume");

// req: R-1985
uniqueSpellings.length && process.platform !== "win32" ? check("R-1985: uninstall --dry-run would unlink every link written through another spelling of the checkout", () => {
	for (const spelling of uniqueSpellings) {
		const form = { name: "POSIX", platform: undefined };
		const { item, changed } = earlierHome(form, spelling, `1985-${spelling.kind}`);
		const result = run(canonical, ["uninstall", "--dry-run"], item);
		assertFinished(result, "uninstall dry run");
		const wouldUnlink = String(result.stdout).split(/\r?\n/u).filter((line) => line.includes("would unlink")).length;
		assert(result.status === 0, `${spelling.kind}: exit=${result.status}\n${result.stdout}\n${result.stderr}`);
		assert(!result.stdout.includes("resolves outside repository"), `${spelling.kind}: outside-repository row\n${result.stdout}`);
		assert(wouldUnlink === changed.links, `${spelling.kind}: expected ${changed.links} would-unlink rows, got ${wouldUnlink}\n${result.stdout}`);
	}
}) : skip(process.platform === "win32" ? "R-1985 — uninstall is POSIX-only" : "R-1985 — no second spelling is available on this volume");

console.log(`\n${passes} passed, ${fails} failed, ${skips} skipped`);
if (fails) process.exitCode = 1;
