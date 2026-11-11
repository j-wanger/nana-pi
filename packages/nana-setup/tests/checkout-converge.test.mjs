#!/usr/bin/env node
/**
 * @module packages/nana-setup/tests/checkout-converge.test.mjs
 * @purpose Prove install converges same-checkout POSIX skill spellings without claiming foreign links.
 * @inputs Copied checkout fixtures, linked and case spellings, nana-setup install, and temporary homes and projects.
 * @outputs PASS/FAIL/SKIP lines and a summary; a nonzero exit when any check fails.
 * @effects disk (OS temporary fixtures only), process (bounded nana-setup child processes).
 * @errors Fixture, child-process or assertion failures fail their awaited case within the chosen per-case limit.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { realPath } from "../../nana-pack/lib/real-path.mjs";
import { tmpDir } from "./tmp-dir.mjs";

// chosen: copied-checkout install can build the temporary knowledge index on slower CI hosts.
const CASE_LIMIT_MS = 20_000;
const checkout = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const copied = tmpDir(path.join(os.tmpdir(), "nana-converge-checkout-"));
const cliRelative = path.join("packages", "nana-setup", "bin", "nana-setup.mjs");
const skillNames = ["spec", "py-lint", "py-review", "py-test"];
let passes = 0;
let fails = 0;
let skips = 0;

function copyFixture() {
	fs.copyFileSync(path.join(checkout, "package.json"), path.join(copied, "package.json"));
	fs.mkdirSync(path.join(copied, "packages"), { recursive: true });
	for (const name of ["nana-setup", "nana-pack", "nana-knowledge"])
		fs.cpSync(path.join(checkout, "packages", name), path.join(copied, "packages", name), { recursive: true });
}
copyFixture();

const canonical = realPath(copied, { mustExist: true });
const spellings = [];
const linkedParent = tmpDir(path.join(os.tmpdir(), "nana-converge-spelling-"));
const linkedSpelling = path.join(linkedParent, "checkout-link");
if (process.platform !== "win32") {
	fs.symlinkSync(canonical, linkedSpelling, "dir");
	spellings.push({ kind: "link", path: linkedSpelling });
}
const swapCase = (value) => [...value].map((char) => char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase()).join("");
const caseSpelling = path.join(path.dirname(canonical), swapCase(path.basename(canonical)));
if (caseSpelling !== canonical && fs.existsSync(caseSpelling)) spellings.push({ kind: "case", path: caseSpelling });
else if (process.platform !== "win32") console.log("SKIP spelling case — this volume is case-sensitive");

const otherCopy = tmpDir(path.join(os.tmpdir(), "nana-converge-other-"));
for (const name of skillNames) {
	const folder = path.join(otherCopy, "packages", "nana-pack", "skills", name);
	fs.mkdirSync(folder, { recursive: true });
	fs.writeFileSync(path.join(folder, "SKILL.md"), `---\nname: ${name}\ndescription: foreign fixture\n---\n`);
}

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

function childEnv(home) {
	const env = {
		...process.env,
		HOME: home,
		USERPROFILE: home,
		PATH: `${path.join(home, ".local", "bin")}${path.delimiter}${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ""}`,
	};
	delete env.PI_CODING_AGENT_DIR;
	delete env.NANA_SETUP_PLATFORM;
	return env;
}

function run(root, args, fixture) {
	return spawnSync(process.execPath, [path.join(root, cliRelative), ...args, "--home", fixture.home], {
		cwd: fixture.project,
		env: childEnv(fixture.home),
		encoding: "utf8",
		timeout: CASE_LIMIT_MS,
	});
}

function assertFinished(result, label) {
	assert(!result.error, `${label} did not finish: ${result.error?.message}`);
	assert(result.signal === null, `${label} ended by ${result.signal}`);
}
function noProblemRow(result) { return !String(result.stdout).split(/\r?\n/u).some((line) => /^\s*✗\s/u.test(line)); }
function rewrite(value, from, to) {
	return value
		.replaceAll(from, to)
		.replaceAll(from.replaceAll(path.sep, "/"), to.replaceAll(path.sep, "/"))
		.replaceAll(from.replaceAll(path.sep, "\\"), to.replaceAll(path.sep, "\\"));
}

function earlierHome(spelling, label) {
	const fixture = { home: fresh(`nana-converge-${label}-home-`), project: fresh(`nana-converge-${label}-project-`) };
	const installed = run(canonical, ["install"], fixture);
	assertFinished(installed, "initial install");
	assert(installed.status === 0, `initial install exited ${installed.status}\n${installed.stdout}\n${installed.stderr}`);
	const links = [];
	const walk = (folder) => {
		for (const name of fs.readdirSync(folder)) {
			const absolute = path.join(folder, name);
			const stat = fs.lstatSync(absolute);
			if (stat.isSymbolicLink()) {
				const before = fs.readlinkSync(absolute);
				const after = rewrite(before, canonical, spelling.path);
				if (after !== before) {
					fs.unlinkSync(absolute);
					fs.symlinkSync(after, absolute, "dir");
					links.push({ path: absolute, before, after });
				}
			} else if (stat.isDirectory()) walk(absolute);
		}
	};
	walk(fixture.home);
	const skillLinks = links.filter((item) => item.path.startsWith(path.join(fixture.home, ".claude", "skills") + path.sep));
	assert(skillLinks.length > 0, `${spelling.kind}: no skill link changed`);
	return { fixture, links, skillLinks };
}

function eachSpelling(body) {
	const errors = [];
	for (const spelling of spellings) {
		try { body(spelling); }
		catch (error) { errors.push(`${spelling.kind}: ${error?.message ?? String(error)}`); }
	}
	if (errors.length) throw new Error(errors.join("\n"));
}

// req: R-2200
process.platform !== "win32" ? check("R-2200: install converges same-checkout skill links to the on-disk spelling", () => {
	eachSpelling((spelling) => {
		const { fixture, links } = earlierHome(spelling, `2200-${spelling.kind}`);
		const result = run(canonical, ["install"], fixture);
		assertFinished(result, "converging install");
		assert(result.status === 0 && noProblemRow(result), `${spelling.kind}: exit=${result.status}\n${result.stdout}\n${result.stderr}`);
		for (const item of links) {
			const actual = fs.readlinkSync(item.path);
			assert(actual.includes(canonical), `${spelling.kind}: ${item.path} did not name ${canonical}: ${actual}`);
			assert(!actual.includes(spelling.path), `${spelling.kind}: ${item.path} kept ${spelling.path}: ${actual}`);
		}
	});
}) : skip("R-2200 — POSIX-only: skill links are copies on win32");

// req: R-2201
process.platform !== "win32" ? check("R-2201: install preserves skill links to another checkout copy as foreign", () => {
	eachSpelling((spelling) => {
		const { fixture } = earlierHome(spelling, `2201-${spelling.kind}`);
		const before = new Map();
		for (const name of skillNames) {
			const link = path.join(fixture.home, ".claude", "skills", name);
			fs.unlinkSync(link);
			fs.symlinkSync(path.join(otherCopy, "packages", "nana-pack", "skills", name), link, "dir");
			before.set(name, fs.readlinkSync(link));
		}
		const result = run(canonical, ["install"], fixture);
		assertFinished(result, "foreign-link install");
		assert(result.status === 1, `${spelling.kind}: expected exit 1, got ${result.status}\n${result.stdout}\n${result.stderr}`);
		for (const name of skillNames) {
			const link = path.join(fixture.home, ".claude", "skills", name);
			assert(fs.readlinkSync(link) === before.get(name), `${spelling.kind}/${name}: foreign link text changed`);
			const row = String(result.stdout).split(/\r?\n/u).find((line) => line.includes(`skill ${name}`));
			assert(row?.includes("foreign link"), `${spelling.kind}/${name}: no foreign link row\n${result.stdout}`);
		}
	});
}) : skip("R-2201 — POSIX-only: skill links are copies on win32");

console.log(`SUMMARY  PASS=${passes} FAIL=${fails} SKIP=${skips}`);
if (fails) process.exitCode = 1;
