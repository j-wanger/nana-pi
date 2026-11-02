// Usage: node --no-warnings docs/reviews/windows-first-try-2-2026-11-02/m1-state.mjs .
// One-off evidence: real CLI builds; all fixtures stay in the OS temp directory.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describeKnowledgeHome } from "../../../packages/nana-setup/tests/knowledge-state.mjs";

const repo = path.resolve(process.argv[2] ?? ".");
const cli = path.join(repo, "packages", "nana-knowledge", "bin", "nana-knowledge.ts");
const homes = [];
function homeFor(label) {
	const home = fs.mkdtempSync(path.join(os.tmpdir(), `m1-${label}-`));
	homes.push(home);
	const src = path.join(home, "src");
	fs.mkdirSync(src);
	fs.writeFileSync(path.join(src, "a.md"), "# Quasar notes\nnebula telescope.\n");
	fs.writeFileSync(path.join(home, "sources.json"), JSON.stringify({ roots: [{ path: src, kind: "articles" }] }));
	return home;
}
function build(home, label, expected = 0) {
	const result = spawnSync(process.execPath, ["--experimental-strip-types", cli, "build"], {
		env: { ...process.env, NANA_KNOWLEDGE_HOME: home, NODE_NO_WARNINGS: "1" },
		encoding: "utf8", timeout: 30000,
	});
	console.log(`${label}: build exit=${result.status}`);
	assert.ifError(result.error);
	assert.equal(result.status, expected);
	return result;
}
try {
	console.log(`platform=${process.platform}; node=${process.version}`);
	console.log("build command: NANA_KNOWLEDGE_HOME=<temp> node --experimental-strip-types packages/nana-knowledge/bin/nana-knowledge.ts build");
	const completed = homeFor("completed");
	build(completed, "(a) completed");
	const a = describeKnowledgeHome(completed);
	assert.ok(a.builtAt);
	console.log(`(a) completed: ${JSON.stringify(a)}`);

	const failed = homeFor("failed");
	build(failed, "(b) baseline");
	const dbPath = path.join(failed, "index.db");
	// Like wal-probe, make the old index's modified time visibly stale.
	const stale = Date.now() / 1000 - 7200;
	fs.utimesSync(dbPath, stale, stale);
	const before = describeKnowledgeHome(failed);
	console.log(`(b) before locked build: ${JSON.stringify(before)}`);
	const holder = new DatabaseSync(dbPath);
	try {
		holder.exec("BEGIN EXCLUSIVE");
		const result = build(failed, "(b) exclusive lock held", 1);
		assert.match(result.stderr, /database is locked/);
		console.log("(b) build stderr contains: database is locked");
	} finally {
		try { holder.exec("ROLLBACK"); } finally { holder.close(); }
	}
	const b = describeKnowledgeHome(failed);
	assert.equal(b.builtAt, before.builtAt);
	console.log(`(b) failed, lock released: ${JSON.stringify(b)}`);
	console.log(`(b) built_at unchanged=${b.builtAt === before.builtAt}`);

	const held = homeFor("held");
	build(held, "(c) baseline");
	fs.writeFileSync(path.join(held, "build.lock"), JSON.stringify({ pid: process.pid, at: Date.now() }));
	const c = describeKnowledgeHome(held);
	assert.equal(c.buildLockPresent, true);
	console.log(`(c) build.lock present: ${JSON.stringify(c)}`);
} finally {
	for (const home of homes) fs.rmSync(home, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
	console.log(`cleanup: ${homes.length} temp homes removed; remaining=${homes.filter(home => fs.existsSync(home)).length}`);
}
