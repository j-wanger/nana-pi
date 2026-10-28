/**
 * @module packages/nana-pack/lib/frontier-summary.mjs
 * @purpose Read a project's HANDOFF at session start and summarize next items and open questions for the owner in a bounded block shared by the Claude Code hook and pi extension.
 * @inputs Session cwd, injected date/environment and issue reader, launcher limit, filesystem state and frontier configuration.
 * @outputs The frontier block with Next titles, ordered asks and checker summary, an unavailable block, or null.
 * @effects disk (bounded HANDOFF read), process and network (budget-bounded gh calls for opted-in projects).
 * @errors none; missing input is silent and every other read or decode failure becomes one marker line.
 */
import * as path from "node:path";
import { issuesPointer, readHandoffIssues } from "./handoff-issues.mjs";
import { canonicalCwd, repoRootOf } from "./adoption.mjs";
import { BOUNDED_READ_CAP, readBounded, readFailureCause } from "./bounded-read.mjs";
import { checkFrontier, frontierSummaryLine } from "./frontier-check.mjs";
import { TAG, splitOpenSection } from "./handoff-asks.mjs";
import { promptPath, promptText } from "./display.mjs";
import { ASK_KIND_ORDER, FRONTIER_DATA_NOTE, FRONTIER_ISSUES_DATA_NOTE, FRONTIER_HEADING, FRONTIER_OUTPUT_CAP, FRONTIER_TITLE_CAP, FRONTIER_UNAVAILABLE, HANDOFF_FILE, LAUNCHER_ROLES } from "./frontier-summary-config.mjs";

const listLead = /^(?:[-*+]\s+|\d+[.)]\s+)/;
const nextTitle = (line) => {
	const content = line.replace(listLead, "");
	const bold = /^\*\*(.+?)\*\*/.exec(content)?.[1];
	return (bold ?? content).trim().replace(/[.:]$/, "").trim();
};
const askTitle = (entry) => {
	if (entry.title) return entry.title.title.trim().replace(/[.:]$/, "").trim();
	return entry.lines[0].replace(listLead, "").replace(TAG, "").trim();
};
const findingCounts = (findings) => {
	const counts = [];
	for (const finding of findings) {
		const found = counts.find((entry) => entry.kind === finding.kind);
		if (found) found.count++;
		else counts.push({ kind: finding.kind, count: 1 });
	}
	return counts;
};
const askCounts = (asks) => [...ASK_KIND_ORDER, "untagged"].flatMap((kind) => {
	const count = asks.filter((ask) => (ask.tag?.kind ?? "untagged") === kind).length;
	return count ? [{ kind, count }] : [];
});
const cleanTitle = (title) => promptText(title, FRONTIER_TITLE_CAP);

function renderBlock(file, result, next, asks, selected, issues) {
	const selectedNext = next.filter((item) => selected.has(item));
	const selectedAsks = asks.filter((item) => selected.has(item));
	const omittedNext = next.length - selectedNext.length;
	const omittedAsks = asks.length - selectedAsks.length;
	const omitted = omittedNext + omittedAsks;
	const out = [FRONTIER_HEADING, "", `Read from ${promptPath(file)} at session start. ${FRONTIER_DATA_NOTE}`, ""];
	if (issues) {
		out[2] = `Read from ${promptPath(file)} and its issues pointer at session start. ${FRONTIER_ISSUES_DATA_NOTE}`;
		if (issues.failure) out.push(issues.failure, "");
		else {
			out.push(`Open issues: ${issues.url}`, "");
			const blocking = selectedAsks.filter((item) => item.tag?.kind === "blocking");
			if (asks.some((item) => item.tag?.kind === "blocking")) out.push("Blocking:", ...blocking.map((item) => `- [blocking] ${item.rendered}`), "");
		}
	}
	if (next.length === 0) { if (!issues?.failure) out.push("Next: none found."); }
	else out.push(`Next (${next.length}):`, ...selectedNext.map((item) => `- ${item.rendered}`));
	if (!issues?.failure || next.length) out.push("");
	if (issues && !issues.failure) {
		const ownerAsks = asks.filter((item) => item.tag?.kind !== "blocking");
		out.push(ownerAsks.length ? `Open for the owner (${ownerAsks.length}):` : "Open for the owner: none found.");
		out.push(...selectedAsks.filter((item) => item.tag?.kind !== "blocking").map((item) => `- [${item.tag?.kind ?? "no tag"}] ${item.rendered}`));
	} else if (asks.length === 0) { if (!issues?.failure) out.push("Open for the owner: none found."); }
	else {
		const counts = askCounts(asks);
		out.push(`Open for the owner (${asks.length}: ${counts.map(({ count, kind }) => `${count} ${kind}`).join(", ")}):`);
		out.push(...selectedAsks.map((item) => `- [${item.tag ? `${item.tag.kind}, since ${item.tag.since}` : "no tag"}] ${item.rendered}`));
	}
	if (omitted) out.push(`…and ${omitted} more titles not shown (${omittedNext} Next, ${omittedAsks} asks).`);
	if (issues?.truncated) out.push("Open issues: list may be longer (fetch cap reached).");
	const counts = findingCounts(result.findings);
	out.push(`Frontier check: ${frontierSummaryLine(result)}${counts.length ? ` (${counts.map(({ kind, count }) => `${kind} ${count}`).join(", ")})` : ""}`);
	return `${out.join("\n")}\n`;
}

export function frontierSummary({ cwd = process.cwd(), today = new Date().toISOString().slice(0, 10), env = process.env, max = FRONTIER_OUTPUT_CAP, limitMs, readIssues = readHandoffIssues } = {}) {
	if (LAUNCHER_ROLES.includes(env?.NANA_ROLE)) return null;
	const canonical = canonicalCwd(cwd);
	const root = repoRootOf(canonical) ?? canonical;
	const file = path.join(root, HANDOFF_FILE);
	let bytes;
	try {
		bytes = readBounded(file, BOUNDED_READ_CAP);
	} catch (error) {
		if (error?.code === "ENOENT") return null;
		return `${FRONTIER_HEADING}\n${FRONTIER_UNAVAILABLE} ${readFailureCause(error, BOUNDED_READ_CAP)} (${promptPath(file)}).\n`;
	}
	let text;
	try {
		text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		return `${FRONTIER_HEADING}\n${FRONTIER_UNAVAILABLE} not valid UTF-8 (${promptPath(file)}).\n`;
	}
	const result = checkFrontier(text, today);
	const next = (result.nextSection?.entries ?? [])
		.filter((entry) => listLead.test(entry.text[0]) && !/^\s/.test(entry.text[0]))
		.map((entry, index) => ({ type: "next", index, rendered: cleanTitle(nextTitle(entry.text[0])) }));
	const rawAsks = splitOpenSection(text).map((entry, index) => ({ type: "ask", index, tag: entry.tag, rendered: cleanTitle(askTitle(entry)) }));
	const asks = [...ASK_KIND_ORDER, null].flatMap((kind) => rawAsks.filter((ask) => kind === null ? ask.tag === null : ask.tag?.kind === kind));
	const pointer = issuesPointer(text);
	const issues = pointer ? pointer.failure ? pointer : readIssues({ pointer, text, cwd: root, env, limitMs }) : null;
	if (issues?.items) {
		const ordered = ["next", ...ASK_KIND_ORDER, null].flatMap((kind) => issues.items.filter((item) => item.kind === kind));
		for (const item of ordered) {
			const rendered = `#${item.number} ${cleanTitle(item.title)}`;
			if (item.kind === "next") next.push({ type: "next", rendered });
			else asks.push({ type: "ask", tag: item.kind ? { kind: item.kind } : null, rendered });
		}
	}
	const numericMax = Number.isFinite(Number(max)) ? Number(max) : FRONTIER_OUTPUT_CAP;
	const limit = Math.min(FRONTIER_OUTPUT_CAP, Math.max(0, Math.trunc(numericMax)));
	const chosen = new Set();
	const priority = [
		...asks.filter((ask) => ask.tag?.kind === "blocking"),
		...next,
		...asks.filter((ask) => ask.tag?.kind !== "blocking"),
	];
	for (const item of priority) {
		chosen.add(item);
		if (renderBlock(file, result, next, asks, chosen, issues).length > limit) chosen.delete(item);
	}
	const rendered = renderBlock(file, result, next, asks, chosen, issues);
	if (rendered.length > limit) return `frontier block omitted: ${numericMax} characters left after the objective\n`;
	return rendered;
}
