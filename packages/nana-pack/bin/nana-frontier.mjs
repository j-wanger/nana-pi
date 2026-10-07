#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-frontier.mjs
 * @purpose Reports structural drift in a HANDOFF frontier without changing the document.
 * @inputs a HANDOFF path, optional --today YYYY-MM-DD clock and optional --strict flag
 * @outputs one file:line finding per issue followed by a summary; strict mode sets failure status
 * @effects disk (reads the named HANDOFF)
 * @errors unreadable input is reported; malformed options or dates exit nonzero
 */
import * as fs from "node:fs";
import { HANDOFF_WORD_BUDGET } from "../lib/frontier-config.mjs";

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
		process.exit(2);
	}
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || Number.isNaN(Date.parse(`${today}T00:00:00Z`))) {
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
const findings = [];
const add = (line, kind, detail) => findings.push({ line, kind, detail });
const headings = [];
for (let i = 0; i < lines.length; i++) {
	const match = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(lines[i]);
	if (match) headings.push({ index: i, level: match[1].length, title: match[2] });
}
const sectionFor = (index) => {
	let section = null;
	for (const heading of headings) {
		if (heading.index > index) break;
		section = heading.title.toLowerCase();
	}
	return section;
};
const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
if (wordCount > HANDOFF_WORD_BUDGET) add(1, "word-budget", `words=${wordCount} budget=${HANDOFF_WORD_BUDGET}`);

for (const heading of headings.filter((h) => /landed/i.test(h.title))) {
	const nextHeading = headings.find((h) => h.index > heading.index && h.level <= heading.level);
	const end = nextHeading?.index ?? lines.length;
	let currentEntry = null;
	for (let i = heading.index + 1; i < end; i++) {
		if (/^\s*(?:[-*+] |\d+[.)]\s+)/.test(lines[i])) {
			if (currentEntry && currentEntry.extraLines > 0) add(currentEntry.line, "landed-entry", `entry spans ${currentEntry.extraLines + 1} lines`);
			currentEntry = { line: i + 1, extraLines: 0 };
		} else if (currentEntry && /^\s+\S/.test(lines[i])) currentEntry.extraLines++;
		else if (!/^\s*$/.test(lines[i])) currentEntry = null;
	}
	if (currentEntry && currentEntry.extraLines > 0) add(currentEntry.line, "landed-entry", `entry spans ${currentEntry.extraLines + 1} lines`);
}

const nextHeading = headings.find((h) => /^next$/i.test(h.title.trim()));
const nextEndHeading = nextHeading && headings.find((h) => h.index > nextHeading.index && h.level <= nextHeading.level);
const nextEnd = nextEndHeading?.index ?? lines.length;
const nextItems = [];
if (nextHeading) {
	for (let i = nextHeading.index + 1; i < nextEnd; i++) {
		const item = /^\s*(\d+)[.)]\s+/.exec(lines[i]);
		if (item) nextItems.push(Number(item[1]));
	}
}
const inTargetSections = (i) => /^(?:next|open for jake)$/i.test(sectionFor(i) ?? "");
for (let i = 0; i < lines.length; i++) {
	for (const ref of lines[i].matchAll(/\bitem\s+(\d+)\s+of\s+Next\b/gi)) {
		const number = Number(ref[1]);
		if (!nextItems.includes(number)) add(i + 1, "broken-reference", `item ${number} of Next does not resolve`);
	}
	if (!inTargetSections(i)) continue;
	if (/\bLANDED\b/i.test(lines[i])) add(i + 1, "misplaced-landed", "LANDED appears under Next or Open for Jake");
	for (const date of lines[i].matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)) {
		if (date[1] < today && !Number.isNaN(Date.parse(`${date[1]}T00:00:00Z`))) add(i + 1, "overdue-date", `${date[1]} precedes ${today}`);
	}
	if (/^open for jake$/i.test(sectionFor(i) ?? "") && /^\s*(?:[-*+]|\d+[.)])\s+/.test(lines[i]) && !/\[(?:blocking|optional|parked),\s*since\s+\d{4}-\d{2}-\d{2}\]/i.test(lines[i])) {
		add(i + 1, "open-tag", "Open for Jake entry needs [blocking|optional|parked, since YYYY-MM-DD]");
	}
}

for (const finding of findings) console.log(`${file}:${finding.line}: ${finding.kind}: ${finding.detail}`);
console.log(`summary words=${wordCount} budget=${HANDOFF_WORD_BUDGET} findings=${findings.length}`);
process.exitCode = strict && findings.length > 0 ? 1 : 0;
