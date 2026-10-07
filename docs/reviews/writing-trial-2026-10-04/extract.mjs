/**
 * @module docs/reviews/writing-trial-2026-10-04/extract.mjs
 * @purpose Recomputes treated seat-session writing-trial units and checked-report counts from Claude Code transcripts.
 * @inputs Transcript JSONL files, a date window, and optionally a private output directory.
 * @outputs Per-EDT-day JSON rows and an optional private text corpus with a hash manifest.
 * @effects disk (reads transcripts and writes only to the explicitly selected output directory)
 * @errors Invalid transcript lines are skipped; invalid arguments or output failures exit nonzero.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkText } from "../../../packages/nana-pack/lib/writing-check.mjs";

const RULE_TITLE = "# Nana — Writing for Jake";
const RULE_ANCHOR = "Put the verdict in the first sentence. Use one of:";
const DEFAULT_ROOT = path.join(process.env.HOME ?? "~", ".claude", "projects");
const WORDS = (text) => text.trim().split(/\s+/u).filter(Boolean).length;

function textFrom(value) {
	if (typeof value === "string") return value;
	if (Array.isArray(value)) return value.map(textFrom).filter(Boolean).join("\n");
	if (!value || typeof value !== "object") return "";
	if (typeof value.text === "string") return value.text;
	return Object.values(value).map(textFrom).filter(Boolean).join("\n");
}

function entriesIn(file) {
	const entries = [];
	for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/u)) {
		if (!line.trim()) continue;
		try { entries.push(JSON.parse(line)); } catch { /* torn transcript line */ }
	}
	return entries;
}

function isRuleAttachment(entry) {
	const type = String(entry.type ?? "").toLowerCase();
	if (type !== "attachment" && entry.isAttachment !== true && !entry.attachment) return false;
	const source = textFrom(entry.attachment ?? entry.message ?? entry.content ?? entry);
	return source.includes(RULE_TITLE) && source.includes(RULE_ANCHOR);
}

function assistantText(entry) {
	if (entry.type !== "assistant" || entry.isSidechain !== false) return "";
	const message = entry.message ?? entry;
	if (message.role && message.role !== "assistant") return "";
	const content = message.content ?? entry.content;
	return Array.isArray(content)
		? content.filter((part) => part?.type === "text" || typeof part === "string").map(textFrom).join("\n")
		: textFrom(content);
}

function edtDay(timestamp) {
	const date = new Date(timestamp);
	if (Number.isNaN(date.valueOf())) return null;
	return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function transcriptFiles(root) {
	const found = [];
	for (const project of fs.readdirSync(root, { withFileTypes: true })) {
		if (!project.isDirectory() || project.name.includes("-wt-")) continue;
		const dir = path.join(root, project.name);
		for (const name of fs.readdirSync(dir)) {
			if (name.endsWith(".jsonl")) found.push({ project: project.name, file: path.join(dir, name) });
		}
	}
	return found.sort((a, b) => a.file.localeCompare(b.file));
}

function collect(root, from, to) {
	const sessions = [];
	for (const { project, file } of transcriptFiles(root)) {
		const entries = entriesIn(file);
		let treated = false;
		const assistant = [];
		let checked = 0;
		for (const entry of entries) {
			if (isRuleAttachment(entry)) treated = true;
			if (!treated) continue;
			const timestamp = entry.timestamp ?? entry.message?.timestamp;
			const day = edtDay(timestamp);
			if (!day || day < from || day > to || entry.isSidechain !== false) continue;
			const body = assistantText(entry);
			if (body && WORDS(body) >= 80) assistant.push({ body: body.replace(/\r\n?/gu, "\n").trim(), timestamp, day });
			const command = textFrom(entry.message?.content ?? entry.content ?? "");
			if (entry.type === "assistant" && command.includes("nana-writing.mjs") && command.includes("--report")) checked++;
		}
		if (!treated || assistant.length === 0) continue;
		const sessionId = entries.find((entry) => entry.sessionId)?.sessionId ?? path.basename(file, ".jsonl");
		sessions.push({ project, sessionId, checked, last: assistant.at(-1) });
	}
	return sessions;
}

function scoreDecisions(sessions) {
	const rules = [
		/\b(?:tested|test|checked|ran|measured)\b/iu,
		/\b\d+(?:\.\d+)?%?\b/u,
		/\b(?:trade|trade-off|risk|cost|but|while|versus|vs\.?)\b/iu,
		/\b(?:recommend|recommendation|should|choose|prefer|propose)\b/iu,
		/\b(?:your call|Jake|you decide|your decision)\b/iu,
	];
	return sessions.flatMap((session) => session.last.body.split(/\n\s*\n/u).filter((block) => /\bYOUR CALL\b/iu.test(block)).map((block, index) => {
		const parts = rules.map((rule) => rule.test(block));
		return { sessionId: session.sessionId, timestamp: session.last.timestamp, decision: index + 1, parts, score: parts.filter(Boolean).length };
	}));
}

function summarize(sessions) {
	const days = new Map();
	for (const session of sessions) {
		const row = days.get(session.last.day) ?? { day: session.last.day, sessions: 0, reports: 0, strictPasses: 0, lenientPasses: 0, checkedReports: 0 };
		row.sessions++;
		row.reports++;
		row.strictPasses += Number(checkText("-", session.last.body, { report: true }).stats.verdict);
		row.lenientPasses += Number(/\b(?:LANDED|DONE|BLOCKED|OPEN|FAILED|CARRIED)\b|\bYOUR CALL\b/i.test(session.last.body));
		row.checkedReports += session.checked;
		days.set(session.last.day, row);
	}
	return [...days.values()].sort((a, b) => a.day.localeCompare(b.day));
}

function preserve(sessions, output) {
	const destination = path.resolve(output);
	fs.mkdirSync(destination, { recursive: true, mode: 0o700 });
	const manifest = [];
	for (const session of sessions) {
		const normalized = `${session.last.body}\n`;
		const filename = `${String(session.sessionId).replace(/[^a-zA-Z0-9_-]/gu, "_")}.txt`;
		fs.writeFileSync(path.join(destination, filename), normalized, { mode: 0o600 });
		manifest.push({ sessionId: session.sessionId, timestamp: session.last.timestamp, sha256: crypto.createHash("sha256").update(normalized).digest("hex"), file: filename });
	}
	return manifest;
}

function argumentsFrom(argv) {
	const args = Object.fromEntries(argv.slice(2).map((arg, index, all) => arg.startsWith("--") ? [arg.slice(2), all[index + 1]?.startsWith("--") ? "" : all[index + 1]] : null).filter(Boolean));
	if (!args.from || !args.to) throw new Error("usage: node extract.mjs --from YYYY-MM-DD --to YYYY-MM-DD [--root DIR] [--preserve DIR]");
	return args;
}

export function diagnose(root) {
	const totals = { files: 0, entries: 0, assistantFalse: 0, assistantMissingSidechain: 0, titleMatches: 0, anchorMatches: 0, attachmentMatches: 0, dateRange: {} };
	for (const { file } of transcriptFiles(root)) {
		totals.files++;
		for (const entry of entriesIn(file)) {
			totals.entries++;
			if (entry.type === "assistant" && entry.isSidechain === false) totals.assistantFalse++;
			if (entry.type === "assistant" && entry.isSidechain === undefined) totals.assistantMissingSidechain++;
			const encoded = JSON.stringify(entry);
			if (encoded.includes(RULE_TITLE)) totals.titleMatches++;
			if (encoded.includes(RULE_ANCHOR)) totals.anchorMatches++;
			if (isRuleAttachment(entry)) totals.attachmentMatches++;
			const day = edtDay(entry.timestamp ?? entry.message?.timestamp);
			if (day) totals.dateRange[day.slice(0, 4)] = (totals.dateRange[day.slice(0, 4)] ?? 0) + 1;
		}
	}
	return totals;
}

export { collect, scoreDecisions, summarize };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
	try {
		const args = argumentsFrom(process.argv);
		const sessions = collect(args.root || DEFAULT_ROOT, args.from, args.to);
		if (args.preserve) {
			const manifest = preserve(sessions, args.preserve);
			process.stdout.write(`${JSON.stringify({ preserved: manifest.length, manifest }, null, 2)}\n`);
		} else {
			process.stdout.write(`${JSON.stringify({ treatedSessions: sessions.length, days: summarize(sessions), rubric: { parts: ["tested", "numeric result", "trade", "recommendation", "why Jake decides"], decisions: scoreDecisions(sessions) } }, null, 2)}\n`);
		}
	} catch (error) {
		console.error(error.message);
		process.exitCode = 1;
	}
}
