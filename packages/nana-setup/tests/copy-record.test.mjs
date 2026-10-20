#!/usr/bin/env node
/**
 * @module packages/nana-setup/tests/copy-record.test.mjs
 * @purpose Prove Windows managed copies refresh without backup noise while owner edits still get one backup.
 * @inputs One temporary checkout copy, fresh temporary homes, the nana-setup install CLI, mutable rule and skill sources, and copy-record failure shapes.
 * @outputs Eight PASS/FAIL requirement checks, optional read-only SKIP output under POSIX root, and a nonzero exit for failures.
 * @effects disk (one copied checkout and temporary homes only), process (bounded nana-setup install children).
 * @errors A failed assertion fails its requirement check; a child timeout or launch error is reported as that check's failure.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";

const CASE_LIMIT_MS = 20_000;
const checkout = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const copied = tmpDir(path.join(os.tmpdir(), "nana-copy-record-checkout-"));
const cli = path.join(copied, "packages", "nana-setup", "bin", "nana-setup.mjs");
const readonlyRenameShim = path.join(copied, "readonly-rename-shim.mjs");
const sourcePaths = {
	rule: path.join(copied, "packages", "nana-setup", "claude", "rules", "nana-soul.md"),
	rulings: path.join(copied, "packages", "nana-pack", "rules", "nana-rulings.md"),
	skill: path.join(copied, "packages", "nana-pack", "skills", "spec", "SKILL.md"),
};
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
fs.writeFileSync(readonlyRenameShim, `
import fs from "node:fs";
import path from "node:path";
import { syncBuiltinESMExports } from "node:module";
const renameSync = fs.renameSync;
fs.renameSync = (source, target) => {
	const readonlyTarget = process.env.NANA_TEST_READONLY_RENAME_TARGET;
	if (readonlyTarget && path.resolve(target) === path.resolve(readonlyTarget) && path.basename(source).includes(".nana-refresh-") && (fs.statSync(target).mode & 0o222) === 0) {
		const error = new Error(\`EACCES: simulated Windows read-only replacement, rename '\${source}' -> '\${target}'\`);
		error.code = "EACCES";
		throw error;
	}
	return renameSync(source, target);
};
syncBuiltinESMExports();
`);

const originalSources = Object.fromEntries(Object.entries(sourcePaths).map(([name, file]) => [name, fs.readFileSync(file)]));

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

function resetSources() {
	for (const [name, bytes] of Object.entries(originalSources)) fs.writeFileSync(sourcePaths[name], bytes);
}

function freshFixture(label) {
	resetSources();
	const home = tmpDir(path.join(os.tmpdir(), `nana-copy-record-${label}-`));
	const knowledge = path.join(home, ".pi", "agent", "nana-knowledge");
	fs.mkdirSync(knowledge, { recursive: true });
	fs.writeFileSync(path.join(knowledge, "sources.json"), JSON.stringify({ roots: [] }));
	fs.writeFileSync(path.join(knowledge, "index.db"), "test fixture: presence skips the build\n");
	return {
		home,
		record: path.join(home, ".claude", "nana-setup-copies.json"),
		targets: {
			rule: path.join(home, ".claude", "rules", "nana-soul.md"),
			claudeRulings: path.join(home, ".claude", "rules", "nana-rulings.md"),
			skill: path.join(home, ".claude", "skills", "spec", "SKILL.md"),
			piRulings: path.join(home, ".pi", "agent", "nana-rulings.md"),
		},
	};
}

function runInstall(fixture, args = [], extraEnv = {}) {
	const env = {
		...process.env,
		...extraEnv,
		HOME: fixture.home,
		USERPROFILE: fixture.home,
		PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ""}`,
	};
	delete env.PI_CODING_AGENT_DIR;
	if (process.platform !== "win32") env.NANA_SETUP_PLATFORM = "win32";
	else delete env.NANA_SETUP_PLATFORM;
	const result = spawnSync(process.execPath, [cli, "install", ...args, "--home", fixture.home], {
		cwd: copied,
		env,
		encoding: "utf8",
		timeout: CASE_LIMIT_MS,
	});
	assert(!result.error, `install did not finish: ${result.error?.message}`);
	assert(result.signal === null, `install ended by ${result.signal}`);
	return result;
}

function installOk(fixture, args = [], extraEnv = {}) {
	const result = runInstall(fixture, args, extraEnv);
	assert(result.status === 0, `install exited ${result.status}\n${result.stdout}\n${result.stderr}`);
	return result;
}

function appendSources(suffix) {
	for (const file of Object.values(sourcePaths)) fs.appendFileSync(file, `\ncopy-record fixture ${suffix}\n`);
}

function backupsFor(target) {
	const prefix = `${path.basename(target)}.bak-`;
	return fs.readdirSync(path.dirname(target)).filter((name) => name.startsWith(prefix)).map((name) => path.join(path.dirname(target), name));
}

function backupsUnder(root) {
	const found = [];
	const walk = (folder) => {
		for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
			const file = path.join(folder, entry.name);
			if (entry.isDirectory()) walk(file);
			else if (entry.name.includes(".bak-")) found.push(file);
		}
	};
	walk(root);
	return found;
}

function assertCopiesMatch(fixture) {
	const pairs = [
		[fixture.targets.rule, sourcePaths.rule],
		[fixture.targets.claudeRulings, sourcePaths.rulings],
		[fixture.targets.skill, sourcePaths.skill],
		[fixture.targets.piRulings, sourcePaths.rulings],
	];
	for (const [target, source] of pairs)
		assert(fs.readFileSync(target).equals(fs.readFileSync(source)), `${target} does not equal ${source}`);
}

function snapshot(root) {
	const rows = [];
	const walk = (folder) => {
		for (const name of fs.readdirSync(folder).sort()) {
			const file = path.join(folder, name);
			const relative = path.relative(root, file);
			const stat = fs.lstatSync(file);
			if (stat.isSymbolicLink()) rows.push([relative, "link", stat.mode, stat.mtimeMs, fs.readlinkSync(file)]);
			else if (stat.isFile()) rows.push([relative, "file", stat.mode, stat.mtimeMs, createHash("sha256").update(fs.readFileSync(file)).digest("hex")]);
			else if (stat.isDirectory()) { rows.push([relative, "dir", stat.mode, stat.mtimeMs]); walk(file); }
			else rows.push([relative, "other", stat.mode, stat.mtimeMs]);
		}
	};
	walk(root);
	return JSON.stringify(rows);
}

function outputRows(stdout) {
	return String(stdout).split(/\r?\n/u).flatMap((line) => {
		const match = line.match(/^\s*[+·–✗]\s+(.+?)\s{2,}(created|updated|unchanged|skipped|problem)\s*(.*)$/u);
		return match ? [{ label: match[1].trim(), status: match[2], detail: match[3] }] : [];
	});
}

// req: R-2310
check("R-2310: two source changes refresh unedited rule, skill and pi rulings copies with no dated backup", () => {
	const fixture = freshFixture("2310");
	installOk(fixture);
	const firstRecord = JSON.parse(fs.readFileSync(fixture.record, "utf8"));
	const sealedHash = createHash("sha256").update(fs.readFileSync(fixture.targets.rule)).digest("hex");
	assert(firstRecord[fixture.targets.rule] === sealedHash, "the chosen sha256 copy-record hash changed");
	appendSources("first");
	installOk(fixture);
	appendSources("second");
	installOk(fixture);
	assertCopiesMatch(fixture);
	const backups = backupsUnder(fixture.home);
	assert(backups.length === 0, `found backups: ${backups.join(", ")}`);
});

// req: R-2311
check("R-2311: owner-edited rule, skill and pi rulings copies each get exactly one dated backup holding the owner's bytes", () => {
	const fixture = freshFixture("2311");
	installOk(fixture);
	const ownerBytes = new Map([
		[fixture.targets.rule, "owner rule bytes\n"],
		[fixture.targets.skill, "owner skill bytes\n"],
		[fixture.targets.piRulings, "owner pi rulings bytes\n"],
	]);
	for (const [target, bytes] of ownerBytes) fs.writeFileSync(target, bytes);
	appendSources("owner-edit");
	installOk(fixture);
	for (const [target, bytes] of ownerBytes) {
		const backups = backupsFor(target);
		assert(backups.length === 1, `${target} has ${backups.length} backups`);
		assert(fs.readFileSync(backups[0], "utf8") === bytes, `${backups[0]} did not preserve owner bytes`);
	}
});

// req: R-2312
check("R-2312: an absent, unparseable or non-object copy record falls back to one dated backup per changed copy", () => {
	for (const [label, record] of [["absent", null], ["unparseable", "{not json"], ["non-object", '["x"]']]) {
		const fixture = freshFixture(`2312-${label}`);
		installOk(fixture);
		if (record === null) fs.rmSync(fixture.record, { force: true });
		else fs.writeFileSync(fixture.record, record);
		appendSources(label);
		installOk(fixture);
		for (const target of Object.values(fixture.targets)) {
			const backups = backupsFor(target);
			assert(backups.length === 1, `${label}: ${target} has ${backups.length} backups`);
		}
	}
});

// req: R-2313
check("R-2313: a home installed before the record existed refreshes with no dated backup after one install", () => {
	const fixture = freshFixture("2313");
	installOk(fixture);
	fs.rmSync(fixture.record, { force: true });
	installOk(fixture);
	appendSources("adopted-home");
	installOk(fixture);
	assertCopiesMatch(fixture);
	const backups = backupsUnder(fixture.home);
	assert(backups.length === 0, `found backups: ${backups.join(", ")}`);
});

// req: R-2315
check("R-2315: dry run reports an unedited copy's refresh with no backup and changes nothing", () => {
	const fixture = freshFixture("2315");
	installOk(fixture);
	fs.appendFileSync(sourcePaths.rule, "\ndry-run rule change\n");
	fs.appendFileSync(sourcePaths.rulings, "\ndry-run rulings change\n");
	const before = snapshot(fixture.home);
	const result = installOk(fixture, ["--dry-run"]);
	const rows = outputRows(result.stdout);
	for (const label of ["rule nana-soul.md", "pi nana-rulings.md"]) {
		const row = rows.find((candidate) => candidate.label === label);
		assert(row?.status === "updated", `${label} row missing or not updated\n${result.stdout}`);
		assert(/refresh/u.test(row.detail) && !/backup|\.bak-/u.test(row.detail), `${label}: ${row.detail}`);
	}
	assert(snapshot(fixture.home) === before, "dry run changed the home snapshot");
});

// req: R-2317
check("R-2317: a read-only unedited managed copy refreshes without stopping install", () => {
	if (process.platform !== "win32" && typeof process.getuid === "function" && process.getuid() === 0) {
		skip("R-2317: read-only unedited managed copy — POSIX root writes through file modes");
		return;
	}
	const fixture = freshFixture("2317-read-only");
	installOk(fixture);
	const oldBytes = fs.readFileSync(fixture.targets.rule);
	fs.appendFileSync(sourcePaths.rule, "\nread-only refresh\n");
	fs.chmodSync(fixture.targets.rule, 0o444);
	let result;
	try {
		const priorNodeOptions = process.env.NODE_OPTIONS?.trim();
		result = runInstall(fixture, [], {
			NANA_TEST_READONLY_RENAME_TARGET: fixture.targets.rule,
			NODE_OPTIONS: `${priorNodeOptions ? `${priorNodeOptions} ` : ""}--import=${pathToFileURL(readonlyRenameShim).href}`,
		});
	} finally {
		if (fs.existsSync(fixture.targets.rule)) fs.chmodSync(fixture.targets.rule, 0o644);
		for (const backup of backupsFor(fixture.targets.rule)) fs.chmodSync(backup, 0o644);
	}
	assert(result.status === 0, `install exited ${result.status}\n${result.stdout}\n${result.stderr}`);
	assert(fs.readFileSync(fixture.targets.rule).equals(fs.readFileSync(sourcePaths.rule)), "the managed copy does not hold the new source bytes");
	const backups = backupsFor(fixture.targets.rule);
	assert(backups.length <= 1, `the managed copy has ${backups.length} backups`);
	if (backups.length === 1) assert(fs.readFileSync(backups[0]).equals(oldBytes), "the backup does not hold the old managed bytes");
});

// req: R-2318
check("R-2318: refreshing an unedited managed copy does not write through its second hard-linked name", () => {
	const fixture = freshFixture("2318-hard-link");
	installOk(fixture);
	const oldBytes = fs.readFileSync(fixture.targets.rule);
	const otherName = path.join(fixture.home, "keep.md");
	fs.linkSync(fixture.targets.rule, otherName);
	fs.appendFileSync(sourcePaths.rule, "\nhard-link refresh\n");
	installOk(fixture);
	assert(fs.readFileSync(fixture.targets.rule).equals(fs.readFileSync(sourcePaths.rule)), "the managed copy does not hold the new source bytes");
	assert(fs.readFileSync(otherName).equals(oldBytes), "the second hard-linked name did not keep its old bytes");
});

// req: R-2316
check("R-2316: a directory or read-only file at the copy-record path leaves install finishing with one skipped copy-record row", () => {
	const cases = ["directory", "read-only"];
	for (const kind of cases) {
		if (kind === "read-only" && process.platform !== "win32" && typeof process.getuid === "function" && process.getuid() === 0) {
			skip("R-2316 read-only copy record — POSIX root writes through file modes");
			continue;
		}
		const fixture = freshFixture(`2316-${kind}`);
		fs.mkdirSync(path.dirname(fixture.record), { recursive: true });
		if (kind === "directory") fs.mkdirSync(fixture.record);
		else { fs.writeFileSync(fixture.record, "{}\n"); fs.chmodSync(fixture.record, 0o444); }
		let result;
		try {
			result = runInstall(fixture);
		} finally {
			if (kind === "read-only") fs.chmodSync(fixture.record, 0o644);
		}
		const rows = outputRows(result.stdout);
		const recordRows = rows.filter((row) => row.label === "copy record" && row.status === "skipped");
		assert(result.status === 0, `${kind}: exit ${result.status}\n${result.stdout}\n${result.stderr}`);
		assert(recordRows.length === 1 && recordRows[0].detail.includes(fixture.record), `${kind}: copy-record rows=${JSON.stringify(recordRows)}\n${result.stdout}`);
		assert(/next update backs up each changed copy/u.test(recordRows[0].detail), `${kind}: ${recordRows[0].detail}`);
		assert(rows.some((row) => row.label === "knowledge index") && rows.some((row) => row.label === "pi packages"), `${kind}: later rows missing\n${result.stdout}`);
	}
});

resetSources();
console.log(`\n${passes} passed, ${fails} failed, ${skips} skipped`);
process.exit(fails);
