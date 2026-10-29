/**
 * @module packages/nana-pack/lib/issue-watch.mjs
 * @purpose Watch an opted-in project's newly created GitHub issue comments without blocking the session.
 * @inputs Project root, optional ISO cursor, injected clock, asynchronous gh seam, environment and output callbacks.
 * @outputs One-line quoted owner comments, outsider notices, bounded failure/recovery notices and an exact restart command.
 * @effects disk (bounded HANDOFF read), process (timers and asynchronous gh), network (read-only gh API).
 * @errors Missing or invalid pointers are silent to gh; read and process failures become status lines; stop cancels pending work.
 */
import path from "node:path";
import { canonicalCwd, repoRootOf } from "./adoption.mjs";
import { BOUNDED_READ_CAP, readBounded } from "./bounded-read.mjs";
import { issuesPointer } from "./handoff-issues.mjs";
import { ghAsyncFromEnvironment } from "./gh-runner-async.mjs";
import { ghResult } from "./gh-runner.mjs";
import { promptText } from "./display.mjs";
import { HANDOFF_FILE, ISSUES_FETCH_CAP, ISSUES_READ_LIMIT_MS, WATCH_COMMAND_PREFIX, WATCH_EXCERPT_CAP, WATCH_INTERVAL_MS, WATCH_OVERLAP_MS, WATCH_QUOTE_LABEL, WATCH_RUN_MS, WATCH_SEAT_MARKER } from "./frontier-summary-config.mjs";

/** Shell arguments retain native Windows backslashes and quote paths containing spaces. */
export function watchCommand(root, since, seen) {
	const quote = (value) => `"${String(value).replace(/[$`"\\]/g, (ch) => ch === "\\" ? ch : `\\${ch}`)}"`;
	return `${WATCH_COMMAND_PREFIX} --root ${quote(root)}${since ? ` --since ${quote(since)}` : ""}${seen ? ` --seen ${quote(seen)}` : ""}`;
}

export function issueWatchProject(cwd) {
	const canonical = canonicalCwd(cwd);
	const root = repoRootOf(canonical) ?? canonical;
	try {
		const text = new TextDecoder("utf-8", { fatal: true }).decode(readBounded(path.join(root, HANDOFF_FILE), BOUNDED_READ_CAP));
		const pointer = issuesPointer(text);
		return { root, pointer: pointer?.failure ? null : pointer };
	} catch { return { root, pointer: null }; }
}

export function watchIssues({ root: cwd, since, seen = "", env = process.env, clock = { now: Date.now, setTimeout, clearTimeout }, runGh = ghAsyncFromEnvironment(env, { clock }), emit = () => {}, onOwner = () => {}, continuous = false } = {}) {
	const { root, pointer } = issueWatchProject(cwd);
	// The local clock schedules polls only; GitHub alone supplies cursor time.
	let cursor = since === undefined ? undefined : new Date(since).toISOString();
	let floor = cursor === undefined ? undefined : Date.parse(cursor);
	let githubTime = -Infinity;
	const delivered = new Map();
	if (seen && !/^\d+@-?\d+(,\d+@-?\d+)*$/.test(seen)) throw new Error("invalid --seen cursor ids");
	for (const entry of seen.split(",").filter(Boolean)) {
		const [id, created] = entry.split("@").map(Number);
		if (!Number.isSafeInteger(id) || !Number.isFinite(new Date(created).getTime())) throw new Error("invalid --seen cursor ids");
		delivered.set(id, created);
	}
	const seenToken = () => [...delivered].map(([id, created]) => `${id}@${created}`).join(",");
	let stopped = false, pollTimer, endTimer, ownerType, failed = false, resolveDone;
	const done = new Promise((resolve) => { resolveDone = resolve; });
	const controller = new AbortController();
	const stop = () => {
		if (stopped) return;
		stopped = true;
		clock.clearTimeout(pollTimer); clock.clearTimeout(endTimer);
		controller.abort(); resolveDone();
	};
	const handle = { done, stop, get cursor() { return cursor; }, get seen() { return seenToken(); } };
	if (!pointer) { emit("Issue watch: no issues pointer; not watching."); stop(); return handle; }
	const later = (fn, delay) => { const timer = clock.setTimeout(fn, delay); if (continuous) timer?.unref?.(); return timer; };
	const call = async (args) => {
		const options = { env, timeoutMs: ISSUES_READ_LIMIT_MS, signal: controller.signal };
		let raw;
		try { raw = await runGh(root, ["api", "--hostname", "github.com", ...args], options); }
		catch (error) { raw = { error }; }
		const result = ghResult(() => raw, root, args, options);
		if (!result.ok) throw new Error(result.kind === "timeout" ? "timeout" : result.kind === "missing" ? "cannot start gh" : "gh failed");
		// gh --include writes HTTP headers followed by the (possibly jq-filtered) body.
		const match = /^HTTP\/[^\r\n]+\r?\n([\s\S]*?)\r?\n\r?\n/.exec(result.stdout);
		return { body: match ? result.stdout.slice(match[0].length) : result.stdout,
			date: match ? Date.parse(/^date:[ \t]*(.*)$/im.exec(match[1])?.[1]?.trim()) : NaN };
	};
	const poll = async () => {
		try {
			if (!ownerType) {
				const probe = await call([`users/${pointer.owner}`, "--jq", ".type", "--include"]);
				const type = probe.body.trim();
				if (!["User", "Organization"].includes(type)) throw new Error("unreadable output");
				if (cursor === undefined) {
					if (!Number.isFinite(probe.date)) throw new Error("unreadable output");
					cursor = new Date(probe.date - WATCH_OVERLAP_MS).toISOString();
					floor = Date.parse(cursor);
				}
				ownerType = type;
			}
			if (stopped) return;
			const output = await call([`repos/${pointer.owner}/${pointer.repo}/issues/comments?since=${cursor}&per_page=${ISSUES_FETCH_CAP}`, "--include"]);
			if (stopped) return;
			let rows;
			try {
				rows = JSON.parse(output.body);
				if (!Array.isArray(rows) || rows.some((row) => !Number.isSafeInteger(row?.id) || typeof row.body !== "string" || typeof row.user?.login !== "string" || typeof row.author_association !== "string" || !Number.isFinite(Date.parse(row.created_at)) || !/\/issues\/\d+$/.test(row.issue_url))) throw new Error();
			} catch { throw new Error("unreadable output"); }
			const newest = rows.length ? Math.max(...rows.map((row) => Date.parse(row.created_at))) : output.date;
			if (!Number.isFinite(newest)) throw new Error("unreadable output");
			if (failed) { emit("Issue watch: recovered."); failed = false; }
			for (const row of rows) {
				const created = Date.parse(row.created_at);
				// since filters updated_at at GitHub; creation time excludes old edits.
				if (created <= Math.max(floor, Date.parse(cursor)) || delivered.has(row.id)) continue;
				const number = row.issue_url.match(/\d+$/)[0];
				const owner = ownerType === "Organization" ? ["OWNER", "MEMBER"].includes(row.author_association) : row.user.login.toLowerCase() === pointer.owner.toLowerCase();
				if (row.body.startsWith(WATCH_SEAT_MARKER)) { emit(`issue #${number}: a seat comment`); delivered.set(row.id, created); continue; }
				if (!owner) { emit(`issue #${number}: a comment by someone else`); delivered.set(row.id, created); continue; }
				const line = `issue #${number} comment by ${promptText(row.user.login)}: ${WATCH_QUOTE_LABEL}: ${promptText(row.body, WATCH_EXCERPT_CAP)}`;
				emit(line); onOwner(line);
				// A throwing receiver must leave this id available to the next poll.
				delivered.set(row.id, created);
			}
			if (rows.length >= ISSUES_FETCH_CAP) emit("Issue watch: more comments than shown (fetch cap reached).");
			githubTime = Math.max(githubTime, newest);
			// GitHub since uses updated_at: an old edit must not lower the restart floor.
			cursor = new Date(Math.max(floor, Date.parse(cursor), githubTime - WATCH_OVERLAP_MS)).toISOString();
			for (const [id, created] of delivered) if (created <= Date.parse(cursor)) delivered.delete(id);
		} catch (error) {
			if (!stopped && !failed) { emit(`Issue watch: ${error.message}.`); failed = true; }
		} finally {
			if (!stopped) pollTimer = later(() => { void poll(); }, WATCH_INTERVAL_MS);
		}
	};
	if (!continuous) endTimer = later(() => { emit(`Issue watch restart: ${watchCommand(root, cursor, seenToken())}`); stop(); }, WATCH_RUN_MS);
	void poll();
	return handle;
}
