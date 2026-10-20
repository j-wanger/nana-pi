/**
 * @module packages/nana-knowledge/tests/recover.test.mjs
 * @purpose Prove damaged knowledge indexes are rebuilt safely, reported without stacks, or preserved when sources cannot be parsed.
 * @inputs Temporary profiles, article roots and indexes damaged as bytes, pages or incomplete SQLite schemas.
 * @outputs Ten PASS/FAIL lines for R-2400 through R-2409, with exit 1 when any check fails.
 * @effects disk (temporary sources and indexes), database (SQLite fixtures), process (spawns the CLI and a detached hook rebuild).
 * @errors A failed or timed-out case prints FAIL; fixture and child-process errors are contained by that case.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as buildLib from "../lib/build.ts";
import { loadSqlite, openDb, setMeta } from "../lib/db.ts";
import { runHook, STALE_MS } from "../lib/hook.ts";
import { paths } from "../lib/paths.ts";
import { search } from "../lib/query.ts";

const suiteRoot = tmpDir(path.join(os.tmpdir(), "nk-recover-"));
const suiteProfile = path.join(suiteRoot, "profile");
fs.mkdirSync(suiteProfile, { recursive: true });
process.env.HOME = suiteProfile;
process.env.USERPROFILE = suiteProfile;
delete process.env.NANA_ROLE;

const { build, BuildLockedError } = buildLib;
const cli = fileURLToPath(new URL("../bin/nana-knowledge.ts", import.meta.url));
const PHRASE = "recovery orchid lighthouse";
const FILLER_ARTICLES = 40;
const PAGE_FILL = 0xa5;
const REBUILD_DEADLINE_MS = 20_000; // chosen: cold Windows CI slack, as hook.test.mjs
const CASE_DEADLINE_MS = 30_000; // chosen: bounds every case while allowing its detached rebuild deadline

let fixtureNumber = 0;
function fixture(label) {
	const base = path.join(suiteRoot, `${++fixtureNumber}-${label}`);
	const profile = path.join(base, "profile");
	const home = path.join(base, "knowledge-home");
	const root = path.join(base, "articles");
	fs.mkdirSync(profile, { recursive: true });
	fs.mkdirSync(home, { recursive: true });
	fs.mkdirSync(root, { recursive: true });
	fs.writeFileSync(path.join(root, "known.md"), `# Recovery article\n${PHRASE}\n`);
	for (let i = 0; i < FILLER_ARTICLES; i++) {
		fs.writeFileSync(path.join(root, `filler-${String(i).padStart(2, "0")}.md`), `# Filler ${i}\nordinary text number ${i}\n`);
	}
	fs.writeFileSync(path.join(home, "sources.json"), JSON.stringify({ roots: [{ path: root, kind: "articles" }] }));
	return { base, profile, home, root, db: path.join(home, "index.db"), sources: path.join(home, "sources.json") };
}

function activate(f) {
	process.env.HOME = f.profile;
	process.env.USERPROFILE = f.profile;
	process.env.NANA_KNOWLEDGE_HOME = f.home;
	delete process.env.NANA_ROLE;
}

function removeSidecars(f) {
	for (const suffix of ["-wal", "-shm"]) fs.rmSync(f.db + suffix, { force: true });
}

async function goodFixture(label) {
	const f = fixture(label);
	activate(f);
	await build();
	removeSidecars(f);
	return f;
}

async function tablePage(f, table) {
	activate(f);
	const db = await openDb(f.db, {});
	try {
		const rootpage = db.prepare("SELECT rootpage FROM sqlite_schema WHERE type = 'table' AND name = ?").get(table)?.rootpage;
		const pageSize = db.prepare("PRAGMA page_size").get()?.page_size;
		if (!Number.isInteger(rootpage) || rootpage < 1 || !Number.isInteger(pageSize) || pageSize < 1) throw new Error(`missing ${table} page`);
		return { offset: (rootpage - 1) * pageSize, pageSize };
	} finally {
		db.close();
	}
}

async function applyDamage(f, kind) {
	activate(f);
	if (kind === "random") {
		fs.writeFileSync(f.db, crypto.randomBytes(4096));
	} else if (kind === "half") {
		const bytes = fs.readFileSync(f.db);
		fs.writeFileSync(f.db, bytes.subarray(0, Math.floor(bytes.length / 2)));
	} else if (kind === "docs-page" || kind === "files-page") {
		const { offset, pageSize } = await tablePage(f, kind === "docs-page" ? "docs" : "files");
		const fd = fs.openSync(f.db, "r+");
		try { fs.writeSync(fd, Buffer.alloc(pageSize, PAGE_FILL), 0, pageSize, offset); }
		finally { fs.closeSync(fd); }
	} else if (kind === "docs-shape" || kind === "files-shape") {
		fs.rmSync(f.db, { force: true });
		removeSidecars(f);
		const { DatabaseSync } = await loadSqlite();
		const db = new DatabaseSync(f.db);
		try { db.exec(kind === "docs-shape" ? "CREATE TABLE docs(id, txt)" : "CREATE TABLE files(path)"); }
		finally { db.close(); }
	}
	removeSidecars(f);
}

async function queryHits(f) {
	activate(f);
	let db;
	try {
		db = await openDb(f.db, {});
		return search(db, PHRASE, 5).some((hit) => hit.title === "Recovery article" || hit.snippet.includes("orchid"));
	} finally {
		try { db?.close(); } catch {}
	}
}

function runCli(f, ...args) {
	return spawnSync(process.execPath, [cli, ...args], {
		encoding: "utf8",
		env: { ...process.env, HOME: f.profile, USERPROFILE: f.profile, NANA_KNOWLEDGE_HOME: f.home, NODE_NO_WARNINGS: "1", NANA_ROLE: "" },
		timeout: CASE_DEADLINE_MS,
	});
}

function damageLines(stdout) {
	return stdout.split(/\r?\n/).filter((line) => line.includes("damaged"));
}

function cleanCli(result) {
	return result.status === 0 && result.stderr === "" && !/^\s+at /m.test(result.stdout + result.stderr);
}

function expectedReason(kind) {
	return kind === "random" ? "file is not a database" : "malformed";
}

function hashFile(file) {
	return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

async function rowCount(f) {
	activate(f);
	let db;
	try {
		db = await openDb(f.db, {});
		return db.prepare("SELECT COUNT(*) AS n FROM docs").get().n;
	} finally {
		try { db?.close(); } catch {}
	}
}

async function caseWithin(run) {
	let timer;
	try {
		return await Promise.race([
			Promise.resolve().then(run).then(Boolean).catch(() => false),
			new Promise((resolve) => { timer = setTimeout(() => resolve(false), CASE_DEADLINE_MS); }),
		]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}

async function recoveryCase(kinds, label) {
	for (const kind of kinds) {
		const f = await goodFixture(`${label}-${kind}`);
		await applyDamage(f, kind);
		activate(f);
		await build();
		if (!(await queryHits(f))) return false;
	}
	return true;
}

const r2400 = await caseWithin(() => recoveryCase(["random", "half", "docs-page", "files-page"], "recover"));
const r2401 = await caseWithin(() => recoveryCase(["docs-shape", "files-shape"], "shape"));

const r2402 = await caseWithin(async () => {
	const f = await goodFixture("hook-page");
	await applyDamage(f, "docs-page");
	const staleMtime = Date.now() - 2 * STALE_MS;
	fs.utimesSync(f.db, staleMtime / 1000, staleMtime / 1000);
	activate(f);
	const first = await runHook(JSON.stringify({ prompt: PHRASE, session_id: "before-heal", cwd: f.base }));
	if (first.reason !== "query-failed") return false;
	const deadline = Date.now() + REBUILD_DEADLINE_MS;
	let healed = false;
	while (Date.now() < deadline) {
		try {
			healed = fs.statSync(f.db).mtimeMs > staleMtime + 60_000 && !fs.existsSync(paths.buildLock);
		} catch { healed = false; }
		if (healed) break;
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	if (!healed) return false;
	const later = await runHook(JSON.stringify({ prompt: PHRASE, session_id: "after-heal", cwd: f.base }));
	return later.reason === "ok" && later.hits.length > 0 && later.output?.includes("orchid");
});

const r2403 = await caseWithin(async () => {
	for (const damage of [false, true]) {
		const f = await goodFixture(damage ? "damaged-write-lock" : "write-lock");
		activate(f);
		let committed;
		try {
			committed = await openDb(f.db, {});
			setMeta(committed, "sentinel", "committed-value");
		} finally {
			try { committed?.close(); } catch {}
		}
		if (damage) await applyDamage(f, "docs-page");
		const { DatabaseSync } = await loadSqlite();
		const writer = new DatabaseSync(f.db);
		let rejected = false;
		let beforeBytes;
		let beforeInode;
		try {
			writer.exec("BEGIN IMMEDIATE");
			writer.prepare("INSERT INTO meta(key, value) VALUES (?, ?)").run("uncommitted", "held-value");
			beforeBytes = fs.readFileSync(f.db);
			beforeInode = fs.statSync(f.db).ino;
			try { await build(); } catch { rejected = true; }
			if (!rejected || fs.statSync(f.db).ino !== beforeInode || !beforeBytes.equals(fs.readFileSync(f.db))) return false;
		} finally {
			try { writer.exec("ROLLBACK"); } catch {}
			writer.close();
		}
		let fresh;
		try {
			fresh = await openDb(f.db, {});
			if (fresh.prepare("SELECT value FROM meta WHERE key = ?").get("sentinel")?.value !== "committed-value") return false;
		} finally {
			try { fresh?.close(); } catch {}
		}
	}
	return true;
});

const r2404 = await caseWithin(async () => {
	const f = await goodFixture("build-lock");
	await applyDamage(f, "random");
	const before = fs.readFileSync(f.db);
	fs.writeFileSync(path.join(f.home, "build.lock"), JSON.stringify({ pid: process.pid, at: Date.now() }));
	let locked = false;
	try {
		activate(f);
		try { await build(); } catch (err) { locked = err instanceof BuildLockedError; }
		return locked && before.equals(fs.readFileSync(f.db));
	} finally {
		fs.rmSync(path.join(f.home, "build.lock"), { force: true });
	}
});

const r2405 = await caseWithin(async () => {
	for (const kind of ["random", "half", "docs-page"]) {
		const f = await goodFixture(`status-${kind}`);
		await applyDamage(f, kind);
		const result = runCli(f, "status");
		const lines = damageLines(result.stdout);
		if (!cleanCli(result) || lines.length !== 1 || !lines[0].includes(expectedReason(kind)) || !lines[0].includes("nana-knowledge build --rebuild")) return false;
	}
	return true;
});

const r2406 = await caseWithin(async () => {
	for (const kind of ["random", "half", "docs-page"]) {
		const f = await goodFixture(`build-cli-${kind}`);
		await applyDamage(f, kind);
		const result = runCli(f, "build");
		const lines = damageLines(result.stdout);
		if (!cleanCli(result) || lines.length !== 1 || !lines[0].includes(expectedReason(kind))) return false;
	}
	return true;
});

const r2407 = await caseWithin(async () => {
	for (const kind of ["random", "half", "docs-page"]) {
		const f = await goodFixture(`kept-${kind}`);
		await applyDamage(f, kind);
		fs.writeFileSync(f.sources, '{\n  "roots": [\n    { "path": "/one", "kind": "articles" },\n  ]\n}\n');
		const before = hashFile(f.db);
		for (const args of [["build"], ["build", "--rebuild"]]) {
			const result = runCli(f, ...args);
			const lines = damageLines(result.stdout);
			if (!cleanCli(result) || lines.length !== 1 || !lines[0].includes(expectedReason(kind)) || !lines[0].includes("not rebuilt") || hashFile(f.db) !== before) return false;
		}
	}
	return true;
});

const r2408 = await caseWithin(async () => {
	const f = await goodFixture("healthy-sources-problem");
	const rowsBefore = await rowCount(f);
	fs.writeFileSync(f.sources, '{\n  "roots": [],\n}\n');
	fs.mkdirSync(path.join(f.home, "shown"), { recursive: true });
	const oldShown = path.join(f.home, "shown", "old.json");
	fs.writeFileSync(oldShown, "{}");
	const oldTime = Date.now() - 2 * buildLib.SHOWN_TTL_MS;
	fs.utimesSync(oldShown, oldTime / 1000, oldTime / 1000);
	let db;
	try {
		db = await openDb(f.db, {});
		setMeta(db, "built_at", String(Date.now() - 2 * STALE_MS));
	} finally {
		try { db?.close(); } catch {}
	}
	const staleTime = Date.now() - 2 * STALE_MS;
	fs.utimesSync(f.db, staleTime / 1000, staleTime / 1000);
	const built = runCli(f, "build");
	const status = runCli(f, "status");
	const ageHours = Number(/built ([0-9.]+)h ago/.exec(status.stdout)?.[1]);
	return cleanCli(built) && cleanCli(status) && await rowCount(f) === rowsBefore &&
		ageHours * 60 * 60 * 1000 < STALE_MS && !fs.existsSync(oldShown);
});

const r2409 = await caseWithin(async () => {
	const f = fixture("missing-index-sources-problem");
	fs.writeFileSync(f.sources, '{\n  "roots": [],\n}\n');
	const result = runCli(f, "build");
	return cleanCli(result) && result.stdout.split(/\r?\n/).some((line) => line.includes("UNPARSEABLE")) &&
		fs.existsSync(f.db) && await rowCount(f) === 0;
});

let fails = 0;
function check(name, ok) {
	console.log(ok ? "PASS" : "FAIL", name);
	if (!ok) fails++;
}

// req: R-2400
check("R-2400: a build over a random-bytes, a half-truncated or a page-overwritten index.db resolves and a query then hits", r2400);
// req: R-2401
check("R-2401: a build over a SQLite file whose docs or files table lacks a used column resolves and a query then hits", r2401);
// req: R-2402
check("R-2402: a pull over a page-overwritten index older than one hour starts a build that heals it, and a later pull hits", r2402);
// req: R-2403
check("R-2403: builds over healthy or page-damaged write-locked indexes fail, keep index.db's inode and bytes, and a fresh handle reads the committed sentinel", r2403);
// req: R-2404
check("R-2404: a build that loses the build lock leaves a damaged index.db byte for byte", r2404);
// req: R-2405
check("R-2405: status on a random-bytes, half-truncated or page-overwritten index exits 0 with one line naming the damage and build --rebuild, no stack", r2405);
// req: R-2406
check("R-2406: build on a random-bytes, half-truncated or page-overwritten index exits 0 with one line naming the damage, no stack", r2406);
// req: R-2407
check("R-2407: build and build --rebuild with an unparseable sources.json over a random-bytes, half-truncated or page-overwritten index exit 0, keep index.db byte for byte and print one line naming the damage as not rebuilt", r2407);
// req: R-2408
check("R-2408: an unparseable sources.json over a stale healthy index keeps every row, refreshes its age and prunes an old shown file", r2408);
// req: R-2409
check("R-2409: an unparseable sources.json with no index exits 0, prints UNPARSEABLE and creates an empty index", r2409);

process.exitCode = fails ? 1 : 0;
