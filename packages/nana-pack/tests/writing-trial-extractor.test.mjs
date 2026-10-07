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
import { checksByDay, collect, loadPrivateCorpus, preserve, score, scoreDecisions, transcriptFiles } from "../lib/writing-trial-extractor.mjs";

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
	check("scoring reports strict and former first-sentence lenient totals together", () => {
		const body = `${long("A routine introduction.")}\n\n${long("DONE.")}`;
		const result = score([{ sessionId: "later-verdict", reports: [{ body, timestamp: "2026-10-05T12:00:00Z", day: "2026-10-05" }] }], "after");
		assert.equal(result.reports, 1);
		assert.equal(result.strictPasses, 0);
		assert.equal(result.lenientPasses, 0);
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
{
	const f = fixture();
	const outside = path.join(f.root, "outside.txt");
	fs.writeFileSync(outside, "sentinel");
	const destination = path.join(f.root, "private-output");
	fs.mkdirSync(destination);
	fs.symlinkSync(outside, path.join(destination, "trap.txt"));
	const session = { sessionId: "trap", last: { body: "private", timestamp: "2026-09-20T12:00:00Z" } };
	// req: R-695
	check("preservation refuses a symlink destination without changing its target", () => {
		assert.throws(() => preserve([session], destination), { code: "EEXIST" });
		assert.equal(fs.readFileSync(outside, "utf8"), "sentinel");
	});
	f.cleanup();
}
{
	const f = fixture();
	const body = "Baseline words stay private and deterministic.";
	const normalized = `${body}\n`;
	const directory = path.join(f.root, "corpus");
	fs.mkdirSync(directory);
	fs.writeFileSync(path.join(directory, "saved.txt"), normalized);
	const manifest = [{ sessionId: "saved", timestamp: "2026-09-21T12:00:00Z", sha256: crypto.createHash("sha256").update(normalized).digest("hex") }];
	fs.writeFileSync(path.join(directory, "manifest.json"), JSON.stringify(manifest));
	// req: R-696
	check("private corpus input verifies hashes and scores the exact preserved text", () => {
		const sessions = loadPrivateCorpus(path.join(directory, "manifest.json"));
		assert.equal(sessions.length, 1);
		assert.equal(score(sessions, "baseline").reports, 1);
		fs.writeFileSync(path.join(directory, "saved.txt"), "changed");
		assert.throws(() => loadPrivateCorpus(path.join(directory, "manifest.json")), /hash mismatch/u);
	});
	f.cleanup();
}
{
	const f = fixture();
	const early = "2026-10-05T13:00:00Z";
	const after = "2026-10-05T15:00:00Z";
	const call = { type: "tool_use", name: "Bash", input: { command: "node /tmp/nana-writing.mjs --report" } };
	const treatmentAttachment = { ...attachment, timestamp: "2026-10-05T14:00:00Z" };
	f.add("-Users-seat", "bounded", [entry("user", "2026-10-04T12:00:00Z", "start"), { type: "assistant", timestamp: early, isSidechain: false, message: { role: "assistant", content: [call] } }, treatmentAttachment, { type: "assistant", timestamp: early, isSidechain: false, message: { role: "assistant", content: [call] } }, { type: "assistant", timestamp: after, isSidechain: false, message: { role: "assistant", content: [call] } }, entry("assistant", after, long("DONE.")), entry("assistant", "2026-10-06T13:00:00Z", long("DONE.")), { type: "assistant", timestamp: "2026-10-06T13:00:00Z", isSidechain: false, message: { role: "assistant", content: [call] } }]);
	const sessions = collect(f.root, "2026-10-04", "2026-10-05", "after");
	// req: R-697
	check("after reports obey their own date boundary and checker calls are per-day post-attachment", () => {
		assert.equal(sessions[0].reports.length, 1);
		assert.equal(sessions[0].checked, 1);
		assert.deepEqual(checksByDay(sessions), [{ day: "2026-10-05", count: 1 }]);
	});
	f.cleanup();
}
{
	const reports = [{ sessionId: "gold", timestamp: "2026-10-05T12:00:00Z", body: ["YOUR CALL — decision one", "1. What I tested", "2. Result: 3 passed", "3. Trade: speed versus safety", "4. Recommendation: choose A", "5. Why this is Jake's call", "", "YOUR CALL — decision two", "1. What I measured", "2. Result: 2 failures", "3. Risk is lower, but slower", "4. I recommend B", "5. Jake decides"].join("\n\n") }];
	// req: R-698
	check("redacted decision golden corpus groups boundaries and preserves ordered rubric parts", () => {
		const decisions = scoreDecisions(reports);
		assert.equal(decisions.length, 2);
		assert.deepEqual(decisions[0].orderedParts, [true, true, true, true, true]);
		assert.deepEqual(decisions[1].orderedParts, [true, true, true, true, true]);
		assert.equal(decisions[0].score, 5);
		assert.equal(decisions[1].score, 5);
	});
}
if (failures) process.exitCode = 1;
