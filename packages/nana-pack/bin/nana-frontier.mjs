#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-frontier.mjs
 * @purpose Reports structural drift in a HANDOFF frontier without changing the document.
 * @inputs a HANDOFF path, optional --today YYYY-MM-DD clock and optional --strict flag
 * @outputs one file:line finding per issue followed by a summary; strict mode sets failure status
 * @effects disk (reads the named HANDOFF)
 * @errors unreadable input and malformed options or dates are reported; errors exit nonzero only in strict mode
 */
import * as fs from "node:fs";
import { HANDOFF_WORD_BUDGET } from "../lib/frontier-config.mjs";

const isDate = (value) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};
const isHeading = (line) => /^\s{0,3}#{1,6}\s+/.test(line);
const isListItem = (line) => /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line);
const args = process.argv.slice(2);
let strict = args.includes("--strict");
let today = new Date().toISOString().slice(0, 10);
let file = null;
for (let i = 0; i < args.length; i++) {
	if (args[i] === "--strict") strict = true;
	else if (args[i] === "--today" && args[i + 1]) today = args[++i];
	else if (args[i].startsWith("--today=")) today = args[i].slice(8);
	else if (args[i].startsWith("-")) {
		console.error(`unknown option: ${args[i]}`);
		process.exit(strict ? 1 : 0);
	} else if (file === null) file = args[i];
	else {
		console.error("expected one HANDOFF path");
		process.exit(strict ? 1 : 0);
	}
}
if (!isDate(today)) {
	console.error(`invalid --today date: ${today}`);
	process.exit(strict ? 1 : 0);
}
if (!file) {
	console.error("usage: nana-frontier.mjs [--strict] [--today YYYY-MM-DD] <HANDOFF.md>");
	process.exit(strict ? 1 : 0);
}
let text;
try {
	text = fs.readFileSync(file, "utf8");
} catch (error) {
	console.log(`${file}:0: error: ${error.message}`);
	console.log("summary findings=1");
	process.exit(strict ? 1 : 0);
}

const lines = text.split(/\r\n|\r|\n/);
const outsideFence = [];
let fence = null;
for (let i = 0; i < lines.length; i++) {
	const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(lines[i]);
	outsideFence[i] = fence === null;
	if (marker && (fence === null || (marker[1][0] === fence[0] && marker[1].length >= fence[1]))) {
		fence = fence === null ? [marker[1][0], marker[1].length] : null;
	}
}
const findings = [];
const add = (line, kind, detail) => findings.push({ line, kind, detail });
const headings = [];
for (let i = 0; i < lines.length; i++) {
	const match = outsideFence[i] && /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(lines[i]);
	if (match) headings.push({ index: i, level: match[1].length, title: match[2] });
}
const headingStackAt = (index) => {
	const stack = [];
	for (const heading of headings) {
		if (heading.index > index) break;
		while (stack.length && stack.at(-1).level >= heading.level) stack.pop();
		stack.push(heading);
	}
	return stack;
};
const inSection = (index, title) => headingStackAt(index).some((heading) => {
	const actual = heading.title.trim().toLowerCase();
	return actual === title || new RegExp(`^${title}(?:\\s|\\(|—)`).test(actual);
});
const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
if (wordCount > HANDOFF_WORD_BUDGET) add(1, "word-budget", `words=${wordCount} budget=${HANDOFF_WORD_BUDGET}`);
const entriesBetween = (start, end) => {
	const entries = [];
	for (let i = start; i < end; i++) {
		if (!outsideFence[i] || !isListItem(lines[i])) continue;
		const entry = { line: i + 1, text: [lines[i]] };
		for (let j = i + 1; j < end && !/^\s*$/.test(lines[j]) && !isListItem(lines[j]) && !isHeading(lines[j]); j++) entry.text.push(lines[j]);
		entries.push(entry);
	}
	return entries;
};
for (const heading of headings.filter((h) => /landed/i.test(h.title))) {
	const nextHeading = headings.find((h) => h.index > heading.index && h.level <= heading.level);
	for (const entry of entriesBetween(heading.index + 1, nextHeading?.index ?? lines.length)) {
		if (entry.text.length > 1) add(entry.line, "landed-entry", `entry spans ${entry.text.length} lines`);
	}
}
const nextHeading = headings.find((h) => inSection(h.index, "next"));
const nextEndHeading = nextHeading && headings.find((h) => h.index > nextHeading.index && h.level <= nextHeading.level);
const nextEnd = nextEndHeading?.index ?? lines.length;
const nextItems = nextHeading ? entriesBetween(nextHeading.index + 1, nextEnd).flatMap((e) => {
	const match = /^(\d+)[.)]\s+/.exec(e.text[0]);
	return match ? [Number(match[1])] : [];
}) : [];
for (let i = 0; i < lines.length; i++) {
	if (!outsideFence[i]) continue;
	for (const ref of lines[i].matchAll(/\bitem\s+(\d+)\s+of\s+Next\b/gi)) {
		const number = Number(ref[1]);
		if (!nextItems.includes(number)) add(i + 1, "broken-reference", `item ${number} of Next does not resolve`);
	}
	if ((inSection(i, "next") || inSection(i, "open for jake")) && /\bLANDED\b/i.test(lines[i])) {
		add(i + 1, "misplaced-landed", "LANDED appears under Next or Open for Jake");
	}
	if (inSection(i, "next") || inSection(i, "open for jake")) {
		const dateCue = /\b(?:due|deadline|by|until|verdict\s+on|review\s+on)\b[^;().\n]*?(\d{4}-\d{2}-\d{2})(?:\s*(?:to|through|[-–—])\s*(\d{4}-\d{2}-\d{2}))?/gi;
		for (const due of lines[i].matchAll(dateCue)) {
			const date = due[2] ?? due[1];
			if (isDate(date) && date < today) add(i + 1, "overdue-date", `${date} precedes ${today}`);
		}
	}
	if ((inSection(i, "next") || inSection(i, "open for jake")) && isListItem(lines[i])) {
		const entry = entriesBetween(i, (() => {
			let end = i + 1;
			while (end < lines.length && !/^\s*$/.test(lines[end]) && !isListItem(lines[end]) && !isHeading(lines[end])) end++;
			return end;
		})())[0];
		if (!entry) continue;
		if (inSection(i, "open for jake")) {
			const tag = /\[(?:blocking|optional|parked),\s*since\s+(\d{4}-\d{2}-\d{2})\]/i.exec(entry.text.join(" "));
			if (!tag || !isDate(tag[1]) || tag[1] > today) add(i + 1, "open-tag", "Open for Jake entry needs [blocking|optional|parked, since YYYY-MM-DD] with a valid non-future date");
		}
	}
}

for (const finding of findings) console.log(`${file}:${finding.line}: ${finding.kind}: ${finding.detail}`);
console.log(`summary words=${wordCount} budget=${HANDOFF_WORD_BUDGET} findings=${findings.length}`);
process.exitCode = strict && findings.length > 0 ? 1 : 0;
