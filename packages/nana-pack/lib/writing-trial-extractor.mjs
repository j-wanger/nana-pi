/**
 * @module packages/nana-pack/lib/writing-trial-extractor.mjs
 * @purpose Recomputes baseline seat-session units and rule-attached after reports from Claude Code transcripts.
 * @inputs Transcript JSONL files, a date window, mode, and optionally a private output directory.
 * @outputs Corpus summaries, per-day verdict counts, optional private text corpus and hash manifest.
 * @effects disk (reads transcripts and writes only to the explicitly selected output directory)
 * @errors Invalid transcript lines are skipped; invalid arguments or output failures exit nonzero.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { checkText } from "./writing-check.mjs";

const RULE_TITLE = "# Nana — Writing for Jake";
const RULE_ANCHOR = "Put the verdict in the first sentence. Use one of:";
const DEFAULT_ROOT = path.join(process.env.HOME ?? "~", ".claude", "projects");
const WORDS = (text) => text.trim().split(/\s+/u).filter(Boolean).length;
const LENIENT = /\b(?:LANDED|DONE|BLOCKED|OPEN|FAILED|CARRIED)\b|\bYOUR CALL\b/i;
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
		if (!project.isDirectory() || project.name.includes("-wt-") || project.name.includes("-private-tmp-")) continue;
		const dir = path.join(root, project.name);
		for (const name of fs.readdirSync(dir)) if (name.endsWith(".jsonl")) found.push({ project: project.name, file: path.join(dir, name) });
	}
	return found.sort((a, b) => a.file.localeCompare(b.file));
}
function dateInRange(day, from, to) { return day && day >= from && day <= to; }
function collect(root, from, to, mode = "baseline") {
	const sessions = [];
	for (const { project, file } of transcriptFiles(root)) {
		const entries = entriesIn(file);
		const first = entries.find((entry) => entry.timestamp ?? entry.message?.timestamp);
		const firstTimestamp = first?.timestamp ?? first?.message?.timestamp;
		const startDay = edtDay(firstTimestamp);
		if (!dateInRange(startDay, from, to)) continue;
		const sessionId = entries.find((entry) => entry.sessionId)?.sessionId ?? path.basename(file, ".jsonl");
		let ruleLoaded = false;
		const messages = [];
		let checked = 0;
		for (const entry of entries) {
			if (isRuleAttachment(entry)) ruleLoaded = true;
			const timestamp = entry.timestamp ?? entry.message?.timestamp;
			const day = edtDay(timestamp);
			const body = assistantText(entry).replace(/\r\n?/gu, "\n").trim();
			if (entry.isSidechain === false && body && WORDS(body) >= 80) messages.push({ body, timestamp, day, treated: ruleLoaded });
			const command = textFrom(entry.message?.content ?? entry.content ?? "");
			if (entry.type === "assistant" && command.includes("nana-writing.mjs") && command.includes("--report")) checked++;
		}
		if (mode === "baseline") {
			if (messages.length) sessions.push({ project, sessionId, checked, last: messages.at(-1) });
		} else {
			const reports = messages.filter((message) => message.treated);
			if (reports.length) sessions.push({ project, sessionId, checked, reports });
		}
	}
	return sessions;
}
function score(sessions, mode) {
	const reports = mode === "baseline" ? sessions.map((session) => ({ ...session.last, sessionId: session.sessionId })) : sessions.flatMap((session) => session.reports.map((message) => ({ ...message, sessionId: session.sessionId })));
	const days = new Map();
	for (const report of reports) {
		const row = days.get(report.day) ?? { day: report.day, reports: 0, strictPasses: 0, lenientPasses: 0 };
		row.reports++;
		row.strictPasses += Number(checkText("-", report.body, { report: true }).stats.verdict);
		row.lenientPasses += Number(LENIENT.test(report.body));
		days.set(report.day, row);
	}
	const strictPasses = reports.filter((report) => checkText("-", report.body, { report: true }).stats.verdict).length;
	const lenientPasses = reports.filter((report) => LENIENT.test(report.body)).length;
	const sentences = reports.reduce((sum, report) => sum + checkText("-", report.body).stats.sentences, 0);
	const over = reports.reduce((sum, report) => sum + checkText("-", report.body).stats.over, 0);
	return { reports: reports.length, sentences, over25: over, over25Percent: sentences ? Math.round(over / sentences * 100) : 0, strictPasses, lenientPasses, days: [...days.values()].sort((a, b) => a.day.localeCompare(b.day)), reportsDetail: reports.map(({ sessionId, timestamp, day, body }) => ({ sessionId, timestamp, day, body })) };
}
function scoreDecisions(reports) {
	const rules = [/\b(?:tested|test|checked|ran|measured)\b/iu, /\b\d+(?:\.\d+)?%?\b/u, /\b(?:trade|trade-off|risk|cost|but|while|versus|vs\.?)\b/iu, /\b(?:recommend|recommendation|should|choose|prefer|propose)\b/iu, /\b(?:your call|Jake|you decide|your decision)\b/iu];
	return reports.flatMap((report) => report.body.split(/\n\s*\n/u).filter((block) => /\bYOUR CALL\b/iu.test(block)).map((block, index) => {
		const parts = rules.map((rule) => rule.test(block));
		return { sessionId: report.sessionId, timestamp: report.timestamp, decision: index + 1, parts, score: parts.filter(Boolean).length };
	}));
}
function preserve(sessions, output) {
	const destination = path.resolve(output);
	fs.mkdirSync(destination, { recursive: true, mode: 0o700 });
	const manifest = [];
	for (const session of sessions) {
		const normalized = `${session.last.body}\n`;
		const filename = `${String(session.sessionId).replace(/[^a-zA-Z0-9_-]/gu, "_")}.txt`;
		fs.writeFileSync(path.join(destination, filename), normalized, { mode: 0o600 });
		manifest.push({ sessionId: session.sessionId, timestamp: session.last.timestamp, sha256: crypto.createHash("sha256").update(normalized).digest("hex") });
	}
	return manifest;
}
function argumentsFrom(argv) {
	const args = Object.fromEntries(argv.slice(2).map((arg, index, all) => arg.startsWith("--") ? [arg.slice(2), all[index + 1]?.startsWith("--") ? "" : all[index + 1]] : null).filter(Boolean));
	if (!args.from || !args.to || !["baseline", "after"].includes(args.mode ?? "baseline")) throw new Error("usage: node extract.mjs --from YYYY-MM-DD --to YYYY-MM-DD [--mode baseline|after] [--root DIR] [--preserve DIR]");
	return args;
}
function runExtractor(argv) {
	const args = argumentsFrom(argv);
	const mode = args.mode ?? "baseline";
	const sessions = collect(args.root || DEFAULT_ROOT, args.from, args.to, mode);
	const result = score(sessions, mode);
	if (args.preserve) {
		if (mode !== "baseline") throw new Error("private preservation is baseline-only");
		const manifest = preserve(sessions, args.preserve);
		process.stdout.write(`${JSON.stringify({ preserved: manifest.length, manifest }, null, 2)}\n`);
	} else {
		process.stdout.write(`${JSON.stringify({ mode, sessionCount: sessions.length, checkedReports: sessions.reduce((sum, session) => sum + session.checked, 0), summary: Object.fromEntries(Object.entries(result).filter(([key]) => key !== "days" && key !== "reportsDetail")), days: result.days, rubric: { parts: ["tested", "numeric result", "trade", "recommendation", "why Jake decides"], decisions: scoreDecisions(result.reportsDetail) }, ...(mode === "after" ? { reportIds: result.reportsDetail.map(({ sessionId, timestamp, day }) => ({ sessionId, timestamp, day })) } : {}) }, null, 2)}\n`);
	}
}
export { collect, preserve, runExtractor, score, scoreDecisions, transcriptFiles };
