/**
 * @module packages/nana-pack/lib/frontier-summary.mjs
 * @purpose Read a project's HANDOFF and render its bounded session-start frontier block.
 * @inputs Session cwd, injected date and environment, repository/root filesystem state, and frontier configuration.
 * @outputs The frontier block with Next titles, ordered asks and checker summary, an unavailable block, or null.
 * @effects disk (resolves the cwd and bounded-reads HANDOFF.md)
 * @errors none; missing input is silent and every other read or decode failure becomes one marker line.
 */
import * as path from "node:path";
import { canonicalCwd, repoRootOf } from "./adoption.mjs";
import { BOUNDED_READ_CAP, readBounded, readFailureCause } from "./bounded-read.mjs";
import { checkFrontier, frontierSummaryLine } from "./frontier-check.mjs";
import { TAG, splitOpenSection } from "./handoff-asks.mjs";
import { promptPath, promptText } from "./display.mjs";
import { ASK_KIND_ORDER, FRONTIER_DATA_NOTE, FRONTIER_HEADING, FRONTIER_OUTPUT_CAP, FRONTIER_TITLE_CAP, FRONTIER_UNAVAILABLE, HANDOFF_FILE, LAUNCHER_ROLES } from "./frontier-summary-config.mjs";

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

function renderBlock(file, result, next, asks, selected) {
	const selectedNext = next.filter((item) => selected.has(item));
	const selectedAsks = asks.filter((item) => selected.has(item));
	const omittedNext = next.length - selectedNext.length;
	const omittedAsks = asks.length - selectedAsks.length;
	const omitted = omittedNext + omittedAsks;
	const out = [FRONTIER_HEADING, "", `Read from ${promptPath(file)} at session start. ${FRONTIER_DATA_NOTE}`, ""];
	if (next.length === 0) out.push("Next: none found.");
	else out.push(`Next (${next.length}):`, ...selectedNext.map((item) => `- ${item.rendered}`));
	out.push("");
	if (asks.length === 0) out.push("Open for the owner: none found.");
	else {
		const counts = askCounts(asks);
		out.push(`Open for the owner (${asks.length}: ${counts.map(({ count, kind }) => `${count} ${kind}`).join(", ")}):`);
		out.push(...selectedAsks.map((item) => `- [${item.tag ? `${item.tag.kind}, since ${item.tag.since}` : "no tag"}] ${item.rendered}`));
	}
	if (omitted) out.push(`…and ${omitted} more titles not shown (${omittedNext} Next, ${omittedAsks} asks).`);
	const counts = findingCounts(result.findings);
	out.push(`Frontier check: ${frontierSummaryLine(result)}${counts.length ? ` (${counts.map(({ kind, count }) => `${kind} ${count}`).join(", ")})` : ""}`);
	return `${out.join("\n")}\n`;
}

export function frontierSummary({ cwd = process.cwd(), today = new Date().toISOString().slice(0, 10), env = process.env, max = FRONTIER_OUTPUT_CAP } = {}) {
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
		if (renderBlock(file, result, next, asks, chosen).length > limit) chosen.delete(item);
	}
	const rendered = renderBlock(file, result, next, asks, chosen);
	if (rendered.length > limit) return `frontier block omitted: ${numericMax} characters left after the objective\n`;
	return rendered;
}
