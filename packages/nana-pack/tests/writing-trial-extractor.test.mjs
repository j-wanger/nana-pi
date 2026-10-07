/**
 * @module packages/nana-pack/tests/writing-trial-extractor.test.mjs
 * @purpose Pins the writing-trial extractor's scope, units, rule treatment, scoring, and private manifest.
 * @inputs Synthetic transcript directories and extractor pure functions.
 * @outputs PASS/FAIL checks for each extractor contract.
 * @effects disk (temporary transcript fixtures only)
 * @errors Failed checks are counted and make the test process exit nonzero.
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { collect, preserve, score, transcriptFiles } from "../lib/writing-trial-extractor.mjs";

let failures = 0;
function check(title, run) {
	try { run(); console.log("PASS", title); }
	catch (error) { failures++; console.log("FAIL", title, error.message); }
}
const long = (start) => `${start} ${Array.from({ length: 85 }, (_, index) => `word${index}`).join(" ")}.`;
function entry(type, timestamp, content, extra = {}) {
	return { type, timestamp, isSidechain: false, sessionId: "session-a", message: { role: type, content }, ...extra };
}
function fixture() {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "writing-trial-"));
	const add = (project, id, entries) => {
		const dir = path.join(root, project);
		fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(path.join(dir, `${id}.jsonl`), entries.map((item) => JSON.stringify({ ...item, sessionId: id })).join("\n"));
	};
	return { root, add, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
const attachment = { type: "attachment", timestamp: "2026-10-04T13:00:00Z", attachment: "# Nana — Writing for Jake\nPut the verdict in the first sentence. Use one of:" };

{
	const f = fixture();
	f.add("-Users-seat-home", "inside", [entry("user", "2026-09-20T12:00:00Z", "start"), entry("assistant", "2026-10-05T12:00:00Z", long("DONE."))]);
	f.add("-Users-seat-wt-topic", "worktree", [entry("user", "2026-09-20T12:00:00Z", "start")]);
	f.add("-Users-seat-private-tmp-x", "private", [entry("user", "2026-09-20T12:00:00Z", "start")]);
	f.add("-Users-seat-other", "outside", [entry("user", "2026-09-21T12:00:00Z", "start"), entry("assistant", "2026-09-20T12:00:00Z", long("DONE."))]);
	const files = transcriptFiles(f.root);
	const sessions = collect(f.root, "2026-09-20", "2026-09-20", "baseline");
	// req: R-691
	check("scope excludes worktree/private projects and windows by first entry", () => {
		assert.equal(files.length, 2);
		assert.deepEqual(sessions.map((session) => session.sessionId), ["inside"]);
	});
	f.cleanup();
}
{
	const f = fixture();
	f.add("-Users-seat", "unit", [
		entry("user", "2026-09-20T10:00:00Z", "start"),
		entry("assistant", "2026-09-20T10:01:00Z", long("OPEN."), { isSidechain: true }),
		entry("assistant", "2026-09-20T10:02:00Z", long("OPEN.")),
		entry("assistant", "2026-10-07T10:00:00Z", long("DONE.")),
	]);
	const sessions = collect(f.root, "2026-09-20", "2026-09-20", "baseline");
	// req: R-692
	check("baseline chooses last qualifying main-thread assistant message", () => {
		assert.equal(sessions.length, 1);
		assert.equal(sessions[0].last.timestamp, "2026-10-07T10:00:00Z");
	});
	f.cleanup();
}
{
	const f = fixture();
	f.add("-Users-seat", "treated", [entry("user", "2026-10-04T12:00:00Z", "start"), attachment, entry("assistant", "2026-10-05T12:00:00Z", long("DONE."))]);
	f.add("-Users-seat", "untreated", [entry("user", "2026-10-04T12:00:00Z", "start"), entry("assistant", "2026-10-05T12:00:00Z", long("DONE."))]);
	const sessions = collect(f.root, "2026-10-04", "2026-10-05", "after");
	// req: R-693
	check("after includes only report-sized messages after canonical rule attachment", () => {
		assert.equal(sessions.length, 1);
		assert.equal(sessions[0].sessionId, "treated");
	});
	// req: R-694
	check("scoring reports strict and lenient verdict totals together", () => {
		const result = score(sessions, "after");
		assert.equal(result.reports, 1);
		assert.equal(result.strictPasses, 1);
		assert.equal(result.lenientPasses, 1);
	});
	f.cleanup();
}
{
	const f = fixture();
	f.add("-Users-seat", "hashed", [entry("user", "2026-09-20T12:00:00Z", "start"), entry("assistant", "2026-09-20T13:00:00Z", long("DONE."))]);
	const sessions = collect(f.root, "2026-09-20", "2026-09-20", "baseline");
	const destination = path.join(f.root, "private-output");
	const manifest = preserve(sessions, destination);
	const normalized = `${sessions[0].last.body}\n`;
	// req: R-695
	check("preservation writes normalized private text and matching session hash manifest", () => {
		assert.equal(manifest.length, 1);
		assert.equal(manifest[0].sessionId, "hashed");
		assert.equal(manifest[0].timestamp, sessions[0].last.timestamp);
		assert.equal(manifest[0].sha256, crypto.createHash("sha256").update(normalized).digest("hex"));
		assert.equal(fs.readFileSync(path.join(destination, "hashed.txt"), "utf8"), normalized);
	});
	f.cleanup();
}
if (failures) process.exitCode = 1;
