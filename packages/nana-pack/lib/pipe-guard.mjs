/**
 * @module packages/nana-pack/lib/pipe-guard.mjs
 * @purpose Detect pipeline exit masking before a git commit when pipefail is not active.
 * @inputs a shell command string from bash, PowerShell, or another shell-like tool.
 * @outputs verifierPipeReason and PowerShell comment/string spans.
 * @effects none
 * @errors none; non-string input is treated as an empty command.
 */
import {
	POWERSHELL_DOUBLE_QUOTES,
	POWERSHELL_SINGLE_QUOTES,
	POWERSHELL_TOKEN_ENDERS,
} from "./pwsh-lexer-config.mjs";

function liveText(command, dialect = "bash") {
	if (dialect === "powershell") return scanPowerShell(String(command ?? "")).live;
	const source = String(command ?? "");
	let text = "";
	let quote = "";
	let comment = false;
	let heredoc = null;
	let line = "";
	for (let i = 0; i < source.length; i++) {
		const ch = source[i];
		if (heredoc !== null) {
			if (ch === "\n") {
				if (line.trim() === heredoc) heredoc = null;
				line = "";
				text += "\n";
			} else line += ch;
			continue;
		}
		if (comment) {
			if (ch === "\n") { comment = false; text += ch; line = ""; }
			else line += " ";
			continue;
		}
		if (quote) {
			if (quote === '"' && ch === '`') {
				let end = i + 1;
				while (end < source.length && (source[end] !== '`' || source[end - 1] === "\\")) end++;
				if (end < source.length) {
					text += ` (${liveText(source.slice(i + 1, end))}) `;
					line += " ";
					i = end;
					continue;
				}
			}
			if (quote === '"' && ch === "$" && source[i + 1] === "(") {
				let depth = 1, nestedQuote = "", end = i + 2;
				for (; end < source.length && depth > 0; end++) {
					const nestedChar = source[end];
					if (nestedQuote) {
						if (nestedChar === nestedQuote && source[end - 1] !== "\\") nestedQuote = "";
						continue;
					}
					if (nestedChar === "'" || nestedChar === '"') nestedQuote = nestedChar;
					else if (nestedChar === "(") depth++;
					else if (nestedChar === ")") depth--;
				}
				if (depth === 0) {
					text += ` (${liveText(source.slice(i + 2, end - 1))}) `;
					line += " ";
					i = end - 1;
					continue;
				}
			}
			if (quote === "'" && ch === "'" && source[i + 1] === "'") { text += "  "; line += "  "; i++; continue; }
			if (ch === quote && (quote !== '"' || source[i - 1] !== "\\")) quote = "";
			text += ch === "\n" ? "\n" : " ";
			line += ch;
			continue;
		}
		if ((ch === "'" || ch === '"') && source[i - 1] !== "\\") {
			quote = ch; text += " "; line += ch; continue;
		}
		if (ch === "#" && (i === 0 || /[\s;&|]/.test(source[i - 1]))) {
			comment = true; text += " "; line += " "; continue;
		}
		if (ch === "\n") {
			const marker = line.match(/(?:^|[^<])<<-?(?!<)\s*(?:'([\w.-]+)'|"([\w.-]+)"|\\([\w.-]+))\s*$/);
			if (marker) heredoc = marker[1] ?? marker[2] ?? marker[3];
			line = "";
		} else line += ch;
		text += ch;
	}
	return text;
}

const isWhitespace = (ch) => ch !== undefined && /\s/u.test(ch);
const hidden = (ch) => ch === "\n" || ch === "\r" ? ch : " ";
const quoteKind = (ch) => POWERSHELL_SINGLE_QUOTES.has(ch) ? "single" : POWERSHELL_DOUBLE_QUOTES.has(ch) ? "double" : null;
const quoteSet = (kind) => kind === "single" ? POWERSHELL_SINGLE_QUOTES : POWERSHELL_DOUBLE_QUOTES;

function lineEndsAfter(source, index) {
	while (source[index] === " " || source[index] === "\t") index++;
	return index >= source.length || source[index] === "\r" || source[index] === "\n";
}

function isGluedVariableAssignment(source, start, wordStart) {
	return /^\$(?:[\w:]+|\{[^}\r\n]+\})\+?=$/u.test(source.slice(wordStart, start));
}

function scanPowerShell(source) {
	const spans = [];
	const result = scanPowerShellRange(source, 0, false, spans);
	spans.sort((a, b) => a.start - b.start || a.end - b.end || a.kind.localeCompare(b.kind));
	return { live: result.live, spans };
}

/**
 * The tokenizer probes of 2026-10-19 replaced the earlier §2.2.3/§2.3.3 boundary union.
 * One stateful pass now decides token starts, masks inactive text, records spans, and recurses
 * through subexpressions. Stopping that same pass at `)` supplies every subexpression bound.
 */
function scanPowerShellRange(source, start, stopAtClose, spans) {
	let live = "";
	let tokenStart = true;
	let wordStart = start;
	let variableIndexDepth = 0;
	for (let i = start; i < source.length;) {
		const ch = source[i];
		if (stopAtClose && ch === ")") return { live, end: i + 1, closed: true };

		if (isWhitespace(ch)) {
			live += ch;
			tokenStart = true;
			wordStart = i + 1;
			i++;
			continue;
		}
		if (ch === "`" && i + 1 < source.length) {
			live += hidden(ch) + hidden(source[i + 1]);
			tokenStart = source[i + 1] === "\n" || source[i + 1] === "\r";
			i += 2;
			continue;
		}
		if (tokenStart && ch === "#") {
			const end = (() => { let at = i; while (at < source.length && source[at] !== "\r" && source[at] !== "\n") at++; return at; })();
			spans.push({ kind: "comment", start: i, end });
			for (let at = i; at < end; at++) live += hidden(source[at]);
			i = end;
			continue;
		}
		if (tokenStart && ch === "<" && source[i + 1] === "#") {
			const close = source.indexOf("#>", i + 2);
			const end = close === -1 ? source.length : close + 2;
			spans.push({ kind: "comment", start: i, end });
			for (let at = i; at < end; at++) live += hidden(source[at]);
			i = end;
			tokenStart = true;
			wordStart = i;
			continue;
		}

		const kind = quoteKind(ch);
		const hereStringStart = tokenStart || isGluedVariableAssignment(source, i, wordStart);
		if (hereStringStart && ch === "@" && quoteKind(source[i + 1]) && lineEndsAfter(source, i + 2)) {
			const result = scanPowerShellHereString(source, i, quoteKind(source[i + 1]), spans);
			live += result.live;
			i = result.end;
			tokenStart = true;
			wordStart = i;
			continue;
		}
		if (kind) {
			const standalone = tokenStart;
			const result = scanPowerShellString(source, i, kind, spans, standalone);
			live += result.live;
			i = result.end;
			tokenStart = standalone && result.closed;
			if (tokenStart) wordStart = i;
			continue;
		}

		if (ch === "$" && source[i + 1] === "{") {
			const close = source.indexOf("}", i + 2);
			const end = close === -1 ? source.length : close + 1;
			live += source.slice(i, end);
			i = end;
			tokenStart = false;
			continue;
		}
		if (ch === "$" && source[i + 1] === "(") {
			const standalone = tokenStart;
			const nested = scanPowerShellRange(source, i + 2, true, spans);
			live += `$(${nested.live}${nested.closed ? ")" : ""}`;
			i = nested.end;
			tokenStart = standalone && nested.closed;
			if (tokenStart) wordStart = i;
			continue;
		}
		if (ch === "(") {
			const nested = scanPowerShellRange(source, i + 1, true, spans);
			live += `(${nested.live}${nested.closed ? ")" : ""}`;
			i = nested.end;
			tokenStart = nested.closed;
			if (tokenStart) wordStart = i;
			continue;
		}
		if (ch === "[" && (variableIndexDepth > 0
			|| /^\$(?:[\w:]+|\{[^}]+\})$/u.test(source.slice(wordStart, i))
			|| (tokenStart && source[i - 1] === "]"))) variableIndexDepth++;
		if (ch === "]" && variableIndexDepth > 0) {
			variableIndexDepth--;
			live += ch;
			i++;
			if (variableIndexDepth === 0) { tokenStart = true; wordStart = i; }
			continue;
		}
		live += ch;
		i++;
		if (POWERSHELL_TOKEN_ENDERS.has(ch)) {
			tokenStart = true;
			wordStart = i;
		} else tokenStart = false;
	}
	return { live, end: source.length, closed: false };
}

function scanPowerShellString(source, start, kind, spans, report) {
	let live = " ";
	let i = start + 1;
	let closed = false;
	const quotes = quoteSet(kind);
	for (; i < source.length;) {
		const ch = source[i];
		if (kind === "double" && ch === "`" && i + 1 < source.length) {
			live += hidden(ch) + hidden(source[i + 1]);
			i += 2;
			continue;
		}
		if (kind === "double" && ch === "$" && source[i + 1] === "(") {
			const nested = scanPowerShellRange(source, i + 2, true, spans);
			live += ` (${nested.live}) `;
			i = nested.end;
			continue;
		}
		if (quotes.has(ch)) {
			if (quotes.has(source[i + 1])) {
				live += "  ";
				i += 2;
				continue;
			}
			live += " ";
			i++;
			closed = true;
			break;
		}
		live += hidden(ch);
		i++;
	}
	if (report) spans.push({ kind: "string", start, end: i });
	return { live, end: i, closed };
}

function scanPowerShellHereString(source, start, kind, spans) {
	let live = "  ";
	let i = start + 2;
	let lineStart = false;
	const quotes = quoteSet(kind);
	for (; i < source.length;) {
		const ch = source[i];
		if (lineStart && quotes.has(ch) && source[i + 1] === "@") {
			live += "  ";
			i += 2;
			spans.push({ kind: "string", start, end: i });
			return { live, end: i, closed: true };
		}
		if (kind === "double" && ch === "$" && source[i + 1] === "(") {
			const nested = scanPowerShellRange(source, i + 2, true, spans);
			live += ` (${nested.live}) `;
			i = nested.end;
			lineStart = false;
			continue;
		}
		live += hidden(ch);
		lineStart = ch === "\n" || ch === "\r";
		i++;
	}
	spans.push({ kind: "string", start, end: i });
	return { live, end: i, closed: false };
}

/** Return the PowerShell tokenizer-style comment and standalone-string spans. */
export function powerShellSpans(command) {
	return scanPowerShell(String(command ?? "")).spans;
}

/** Return a reason if an unprotected pipeline occurs before a commit command. */
export function verifierPipeReason(command, dialect = "bash") {
	const live = liveText(command, dialect);
	const commits = [...live.matchAll(/\bgit\s+(?:(?:-[\w-]+(?:=[^\s;&|()]+)?)(?:\s+[^\s;&|()]+)?\s+)*commit\b/gi)].map((m) => m.index ?? 0);
	if (commits.length === 0) return null;
	const events = [];
	for (let i = 0; i < live.length; i++) {
		if (live[i] === "|" && live[i - 1] !== "|" && live[i + 1] !== "|") events.push({ at: i, kind: "pipe" });
	}
	const initialPipefail = dialect !== "powershell"
		&& /^\s*set\s+-(?:o|[a-z]*o)\s+pipefail(?:;|&&|\n)/i.test(live)
		&& !/\bset\s+\+o\s+pipefail\b/i.test(live);
	for (const commit of commits) {
		if (events.some((event) => event.kind === "pipe" && event.at < commit) && !initialPipefail) {
			return "A pipeline runs before git commit without active pipefail; rerun the verifier without a masking pipe or enable pipefail first.";
		}
	}
	return null;
}
