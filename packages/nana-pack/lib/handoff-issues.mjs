/**
 * @module packages/nana-pack/lib/handoff-issues.mjs
 * @purpose Read a HANDOFF's opted-in GitHub issues through one bounded command.
 * @inputs HANDOFF text, cwd, environment, launcher limit, process clock and injected gh runner.
 * @outputs Null for legacy projects, or a pointer, filtered issue titles, cap warning and named read failure.
 * @effects process (bounded gh), network (through gh).
 * @errors Missing gh, timeout, nonzero exit, organization authors and unreadable data become one status line.
 */
import { performance } from "node:perf_hooks";
import { OPEN_SECTION_PREFIX, isNamed } from "./frontier-config.mjs";
import { ISSUES_FETCH_CAP, ISSUES_READ_LIMIT_MS, ISSUES_WRITE_RESERVE_MS } from "./frontier-summary-config.mjs";
import { ghFromEnvironment, ghResult } from "./gh-runner.mjs";
import { scanListSections } from "./markdown-list-sections.mjs";

/** List entries always win over a pointer; fenced examples never opt a project in. */
export function issuesPointer(text) {
	const sections = scanListSections(text, { headingMatches: (title) => isNamed(title, OPEN_SECTION_PREFIX) });
	if (!sections.length || sections.some((section) => section.entries.length)) return null;
	const body = sections.map((section) => section.body).join("\n");
	if (!body.includes("github.com")) return null;
	const match = /https:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9_.-]+)\/issues(?=$|[\s?#<>).])/m.exec(body);
	if (!match) return { failure: "Open issues: issues pointer unreadable." };
	return { owner: match[1], repo: match[2], url: `https://github.com/${match[1]}/${match[2]}/issues` };
}

export function readHandoffIssues({ text, pointer = issuesPointer(text), cwd, env = process.env, limitMs, clock = () => performance.now(), runGh = ghFromEnvironment(env) }) {
	if (!pointer || pointer.failure) return pointer;
	const started = clock();
	// performance.now includes Node startup/imports, not just the time spent inside this reader.
	const budget = Math.floor(Math.min(ISSUES_READ_LIMIT_MS, limitMs === undefined ? ISSUES_READ_LIMIT_MS : limitMs - started - ISSUES_WRITE_RESERVE_MS));
	const result = budget > 0 ? ghResult(runGh, cwd, ["issue", "list", "-R", `github.com/${pointer.owner}/${pointer.repo}`, "--state", "open", "--author", pointer.owner, "--json", "number,title,labels,author,createdAt", "--limit", String(ISSUES_FETCH_CAP)], { env, timeoutMs: budget }) : { ok: false, kind: "timeout", reason: "timeout" };
	const elapsed = Math.max(0, Math.round(clock() - started));
	const fail = (cause) => ({ ...pointer, failure: `Open issues: unavailable (${cause}, after ${elapsed} ms); see ${pointer.url}` });
	if (!result.ok) {
		// gh's author-only query refuses organization logins instead of returning an empty list.
		if (/Could not resolve to a User|(?:organization|organisation)/i.test(result.reason)) return fail("author filter cannot apply");
		return fail(result.kind === "timeout" ? "timeout" : result.kind === "missing" ? "cannot start gh" : "gh failed");
	}
	let rows;
	try {
		rows = JSON.parse(result.stdout);
		if (!Array.isArray(rows) || rows.some((row) => !Number.isInteger(row?.number) || typeof row.title !== "string" || !Array.isArray(row.labels) || typeof row.author?.login !== "string")) return fail("unreadable output");
	} catch { return fail("unreadable output"); }
	const seen = new Set();
	const items = [];
	for (const row of rows) {
		const labels = new Set(row.labels.map((label) => label?.name));
		if (row.author.login.toLowerCase() !== pointer.owner.toLowerCase() || (!labels.has("ask") && !labels.has("next")) || seen.has(row.number)) continue;
		seen.add(row.number);
		const kind = labels.has("ask") && labels.has("blocking") ? "blocking" : labels.has("next") ? "next" : labels.has("parked") ? "parked" : "optional";
		items.push({ number: row.number, title: row.title, kind });
	}
	return { ...pointer, items, truncated: rows.length >= ISSUES_FETCH_CAP };
}
