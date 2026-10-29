/**
 * @module docs/reviews/issue-watch-2026-10-28/watch-sample.mjs
 * @purpose Record ten simulated minutes of the real watch against a repeatable read-only gh seam.
 * @inputs Real watch, temporary HANDOFF, synthetic owner, older edited and outsider comments, injected clock.
 * @outputs Timestamped watch output and gh argv for the requested ten-minute sample.
 * @effects disk (OS temporary project), process (stdout only; no network or time waits).
 * @errors Unexpected watch failures propagate as nonzero process exit.
 */
import * as fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { watchIssues } from "../../../packages/nana-pack/lib/issue-watch.mjs";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "issue-watch-sample-"));
const start = Date.parse("2026-10-28T00:00:00Z");
let now = start;
const pending = new Map();
const clock = { now: () => now, setTimeout(fn, delay) { const token = {}; pending.set(token, { fn, at: now + delay }); return token; }, clearTimeout(token) { pending.delete(token); } };
const stamp = () => new Date(now).toISOString();
const flush = async () => { for (let n = 0; n < 30; n++) await Promise.resolve(); };
const comment = (id, seconds, body, login) => ({ id, created_at: new Date(start + seconds * 1000).toISOString(), updated_at: new Date(start + 1000).toISOString(), body, user: { login }, author_association: login === "example" ? "OWNER" : "NONE", issue_url: "https://api.github.com/repos/example/project/issues/7" });
try {
	fs.mkdirSync(path.join(root, ".git"));
	fs.writeFileSync(path.join(root, "HANDOFF.md"), "## Open for the owner\nhttps://github.com/example/project/issues\n");
	console.log("Ten minutes of injected clock; no wall-clock waits or network calls.");
	const rows = [comment(1, 1, "Use the second option.\nKeep the smaller scope.", "example"), comment(2, -60, "An older edited comment must stay hidden.", "example"), comment(3, 2, "Another person's words must stay hidden.", "someone-else")];
	let polls = 0, owners = 0;
	const watch = watchIssues({ root, clock, env: {}, emit: (line) => console.log(`${stamp()} ${line}`), onOwner: () => { owners++; }, runGh: async (_cwd, args) => {
		console.log(`${stamp()} gh ${args.join(" ")}`);
		if (args.includes("users/example")) return { status: 0, stdout: "User" };
		polls++; return { status: 0, stdout: JSON.stringify(rows) };
	} });
	await flush();
	const end = start + 10 * 60 * 1000;
	for (;;) {
		const next = [...pending].sort((a, b) => a[1].at - b[1].at)[0];
		if (!next || next[1].at > end) break;
		now = next[1].at; pending.delete(next[0]); next[1].fn(); await flush();
	}
	now = end; watch.stop(); await watch.done;
	console.log(`${stamp()} sample complete: ${polls} polls; ${owners} owner comment; cursor=${watch.cursor}`);
} finally { fs.rmSync(root, { recursive: true, force: true }); }
