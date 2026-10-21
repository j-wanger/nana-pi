/**
 * @module packages/nana-pack/lib/pipe-guard.mjs
 * @purpose Detect when a later git commit reads a masking pipeline's exit status.
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

const QUOTED_GIT_PATH = /^(?:git(?:\.exe)?|.+[\\/]git(?:\.exe)?)$/iu;
const QUOTED_WORD_BOUNDARY = /[\s;&|(){}]/u;
const COMMIT_LEFT_NEIGHBOURS = /[\s;&|(){}\\/`]/u;
const COMMIT_COMMAND = /git(?:\.exe)?\s+(?:(?:-[\w-]+(?:=[^\s;&|()]+)?)(?:\s+[^\s;&|()]+)?\s+)*commit\b/iyu;
const BRACKET_OPENERS = new Set(["(", "{"]);
const BRACKET_CLOSERS = new Set([")", "}"]);
const STATUS_SEPARATORS = new Set([";", "\n", "\r"]);
const REDIRECTION_NEIGHBOURS = new Set(["<", ">"]);
const BASH_ESCAPED_HIDDEN = /[\s|&;(){}<>$`#'"\\]/u;
// contract: R-2351 — shell words and spellings whose grammar consumes pipeline status.
const BASH_STATUS_READER_WORDS = new Set(["then", "do"]);
const BASH_STATUS_CLOSER_WORDS = new Set(["fi", "done", "esac"]);
const BASH_STATUS_EXPANSION = /^(?:\$\?|\$\{\?\})/u;
const POWERSHELL_STATUS_EXPANSION = /^(?:\$\?|\$\{\?\}|\$LASTEXITCODE\b)/iu;
const BASH_BACKGROUND_WAIT = /(?:^|[;&\r\n])\s*wait\b/iu;
const BASH_ERREXIT_TEXT = /errexit/iu;
const BASH_SET_WORD = /\bset\b/giu;
const BASH_ERREXIT_OPTION = /(?:^|\s)-[a-z]*e[a-z]*(?![\w-])/iu;
const BASH_SIMPLE_COMMAND_END = /[;&|\r\n)\]}]/u;
const POWERSHELL_LAST_EXIT_CODE = /^\$LASTEXITCODE\b/iu;
const POWERSHELL_CMDLET_NAME = /^[a-z]+-[a-z][\w]*$/iu;

function quotedGitExposure(content) {
	if (content.includes("$(") || content.includes("`") || /[\r\n]/u.test(content)) return "";
	const value = content.match(QUOTED_GIT_PATH)?.[0] ?? "";
	return value.match(/git(?:\.exe)?$/iu)?.[0] ?? "";
}

function isQuotedWord(source, start, end) {
	const left = start === 0 || QUOTED_WORD_BOUNDARY.test(source[start - 1]);
	const right = end >= source.length || QUOTED_WORD_BOUNDARY.test(source[end]);
	return left && right;
}

function escapedLineBreakEnd(source, index, escape) {
	if (source[index] !== escape) return -1;
	if (source[index + 1] === "\n") return index + 2;
	if (source[index + 1] === "\r" && source[index + 2] === "\n") return index + 3;
	return -1;
}

function escapedByOddBackslashes(source, index) {
	let count = 0;
	for (let i = index - 1; i >= 0 && source[i] === "\\"; i--) count++;
	return count % 2 === 1;
}

function liveText(command, dialect = "bash") {
	if (dialect === "powershell") return scanPowerShell(String(command ?? "")).live;
	const source = String(command ?? "");
	let text = "";
	let quote = "";
	let quoteStart = -1;
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
			if (quote === '"' && ch === "$" && BASH_STATUS_EXPANSION.test(source.slice(i))) {
				const expansion = source[i + 1] === "{" ? "${?}" : "$?";
				text += expansion;
				line += expansion;
				i += expansion.length - 1;
				continue;
			}
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
						if (nestedChar === nestedQuote && (nestedQuote !== '"' || !escapedByOddBackslashes(source, end))) nestedQuote = "";
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
			if (ch === quote && (quote !== '"' || !escapedByOddBackslashes(source, i))) {
				const exposure = isQuotedWord(source, quoteStart, i + 1) ? quotedGitExposure(source.slice(quoteStart + 1, i)) : "";
				quote = "";
				if (exposure) text += ` ${exposure} `;
			}
			text += " ";
			line += ch;
			continue;
		}
		const continued = escapedLineBreakEnd(source, i, "\\");
		if (continued >= 0) {
			const width = continued - i;
			text += " ".repeat(width);
			line += " ".repeat(width);
			i = continued - 1;
			continue;
		}
		if (ch === "\\" && i + 1 < source.length) {
			text += " ";
			line += ch;
			if (BASH_ESCAPED_HIDDEN.test(source[i + 1])) {
				text += " ";
				line += source[i + 1];
				i++;
			}
			continue;
		}
		if (ch === "'" || ch === '"') {
			quote = ch; quoteStart = i; text += " "; line += ch; continue;
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
const hidden = () => " ";
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
	const lastParenClose = source.lastIndexOf(")");
	const result = scanPowerShellRange(source, 0, false, spans, lastParenClose);
	spans.sort((a, b) => a.start - b.start || a.end - b.end || a.kind.localeCompare(b.kind));
	return { live: result.live, spans };
}

/**
 * The tokenizer probes of 2026-10-19 replaced the earlier §2.2.3/§2.3.3 boundary union.
 * One stateful pass now decides token starts, masks inactive text, records spans, and recurses
 * through subexpressions. Stopping that same pass at `)` supplies every subexpression bound.
 */
function scanPowerShellRange(source, start, stopAtClose, spans, lastParenClose) {
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
		if (ch === "`") {
			const continued = escapedLineBreakEnd(source, i, "`");
			if (continued >= 0) {
				live += " ".repeat(continued - i);
				i = continued;
				continue;
			}
			if (i + 1 < source.length) {
				live += hidden(ch) + hidden(source[i + 1]);
				tokenStart = source[i + 1] === "\n" || source[i + 1] === "\r";
				i += 2;
				continue;
			}
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
			const result = scanPowerShellHereString(source, i, quoteKind(source[i + 1]), spans, lastParenClose);
			live += result.live;
			i = result.end;
			tokenStart = true;
			wordStart = i;
			continue;
		}
		if (kind) {
			const standalone = tokenStart;
			const result = scanPowerShellString(source, i, kind, spans, standalone, lastParenClose);
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
		if (ch === "$" && source[i + 1] === "(" && i + 1 < lastParenClose) {
			const standalone = tokenStart;
			const nested = scanPowerShellRange(source, i + 2, true, spans, lastParenClose);
			live += `$(${nested.live}${nested.closed ? ")" : ""}`;
			i = nested.end;
			tokenStart = standalone && nested.closed;
			if (tokenStart) wordStart = i;
			continue;
		}
		if (ch === "(" && i < lastParenClose) {
			const nested = scanPowerShellRange(source, i + 1, true, spans, lastParenClose);
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

function scanPowerShellString(source, start, kind, spans, report, lastParenClose) {
	let live = " ";
	let i = start + 1;
	let closed = false;
	const quotes = quoteSet(kind);
	for (; i < source.length;) {
		const ch = source[i];
		if (kind === "double" && ch === "`") {
			if (i + 1 < source.length) {
				live += hidden(ch) + hidden(source[i + 1]);
				i += 2;
				continue;
			}
		}
		if (kind === "double" && ch === "$" && source[i + 1] === "(" && i + 1 < lastParenClose) {
			const nested = scanPowerShellRange(source, i + 2, true, spans, lastParenClose);
			live += ` (${nested.live}) `;
			i = nested.end;
			continue;
		}
		if (kind === "double" && ch === "$") {
			const status = source.slice(i).match(POWERSHELL_STATUS_EXPANSION)?.[0] ?? "";
			if (status) {
				live += status;
				i += status.length;
				continue;
			}
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
	if (report && closed) {
		const exposure = quotedGitExposure(source.slice(start + 1, i - 1));
		if (exposure) live += ` ${exposure} `;
	}
	return { live, end: i, closed };
}

function scanPowerShellHereString(source, start, kind, spans, lastParenClose) {
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
		if (kind === "double" && ch === "`" && i + 1 < source.length) {
			live += hidden(ch) + hidden(source[i + 1]);
			i += 2;
			lineStart = false;
			continue;
		}
		if (kind === "double" && ch === "$" && source[i + 1] === "(" && i + 1 < lastParenClose) {
			const nested = scanPowerShellRange(source, i + 2, true, spans, lastParenClose);
			live += ` (${nested.live}) `;
			i = nested.end;
			lineStart = false;
			continue;
		}
		if (kind === "double" && ch === "$") {
			const status = source.slice(i).match(POWERSHELL_STATUS_EXPANSION)?.[0] ?? "";
			if (status) {
				live += status;
				i += status.length;
				lineStart = false;
				continue;
			}
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

function commitIndexes(live) {
	const commits = [];
	for (const match of live.matchAll(/git(?:\.exe)?/giu)) {
		const at = match.index ?? 0;
		if (at > 0 && !COMMIT_LEFT_NEIGHBOURS.test(live[at - 1])) continue;
		COMMIT_COMMAND.lastIndex = at;
		if (COMMIT_COMMAND.test(live)) commits.push(at);
	}
	return commits;
}

function pipelineStarts(live) {
	const starts = [];
	let pipelineOpen = false;
	let expectingCommand = false;
	for (let i = 0; i < live.length; i++) {
		const ch = live[i];
		if (ch === "|" && live[i - 1] !== "|" && live[i + 1] !== "|") {
			if (!pipelineOpen) starts.push(i);
			pipelineOpen = true;
			expectingCommand = true;
			if (live[i + 1] === "&") i++;
			continue;
		}
		if ((ch === "\n" || ch === "\r") && expectingCommand) continue;
		if (ch === " " || ch === "\t") continue;
		if (STATUS_SEPARATORS.has(ch) || (ch === "&" && live[i + 1] === "&") || (ch === "|" && live[i + 1] === "|")) {
			pipelineOpen = false;
			expectingCommand = false;
			if ((ch === "&" || ch === "|") && live[i + 1] === ch) i++;
		} else if (ch === "&" && !REDIRECTION_NEIGHBOURS.has(live[i - 1]) && !REDIRECTION_NEIGHBOURS.has(live[i + 1])) {
			pipelineOpen = false;
			expectingCommand = false;
		} else if (pipelineOpen) expectingCommand = false;
	}
	return starts;
}

function bracketClosers(live) {
	const closers = new Map();
	const stack = [];
	for (let i = 0; i < live.length; i++) {
		if (BRACKET_OPENERS.has(live[i])) stack.push(i);
		else if (BRACKET_CLOSERS.has(live[i]) && stack.length > 0) closers.set(stack.pop(), i);
	}
	return closers;
}

function bashErrexitActive(text) {
	if (BASH_ERREXIT_TEXT.test(text)) return true;
	for (const match of text.matchAll(BASH_SET_WORD)) {
		const remainder = text.slice((match.index ?? 0) + match[0].length);
		const command = remainder.split(BASH_SIMPLE_COMMAND_END, 1)[0];
		if (BASH_ERREXIT_OPTION.test(command)) return true;
	}
	return false;
}

function bashErrexitStates(live, pipes) {
	return pipes.map((pipe) => bashErrexitActive(live.slice(0, pipe)));
}

function wordAt(text, at) {
	const match = text.slice(at).match(/^[a-z]+\b/iu);
	return match?.[0].toLowerCase() ?? "";
}

function nextCommandReadsStatus(live, start, dialect, powershellNativeStatus) {
	let depth = 0;
	for (let i = start; i < live.length; i++) {
		const ch = live[i];
		if (dialect !== "powershell" && ch === "$" && BASH_STATUS_EXPANSION.test(live.slice(i))) return true;
		if (dialect === "powershell" && ch === "$" && BASH_STATUS_EXPANSION.test(live.slice(i))) return true;
		if (dialect === "powershell" && powershellNativeStatus && POWERSHELL_LAST_EXIT_CODE.test(live.slice(i))) return true;
		if (BRACKET_OPENERS.has(ch)) { depth++; continue; }
		if (BRACKET_CLOSERS.has(ch)) { if (depth > 0) depth--; continue; }
		if (depth > 0) continue;
		if ((ch === "&" && live[i + 1] === "&") || (ch === "|" && live[i + 1] === "|") || STATUS_SEPARATORS.has(ch)) break;
	}
	return false;
}

function powershellPipelineEndsInCmdlet(live, pipe, end) {
	let command = pipe + (live[pipe + 1] === "&" ? 2 : 1);
	for (let i = command; i < end; i++) {
		if (live[i] === "|" && live[i - 1] !== "|" && live[i + 1] !== "|") {
			command = i + (live[i + 1] === "&" ? 2 : 1);
		}
	}
	while (command < end && isWhitespace(live[command])) command++;
	if (live[command] === "&") {
		command++;
		while (command < end && isWhitespace(live[command])) command++;
	}
	const name = live.slice(command, end).match(/^[a-z][\w-]*/iu)?.[0] ?? "";
	return POWERSHELL_CMDLET_NAME.test(name);
}

function statusReadAfterPipeline(live, pipe, dialect, errexitActive, closers) {
	if (dialect !== "powershell" && errexitActive) return pipe;
	let start = pipe + (live[pipe + 1] === "&" ? 2 : 1);
	while (start < live.length && isWhitespace(live[start])) start++;
	let awaitingPipelineCommand = false;
	for (let i = start; i < live.length; i++) {
		const ch = live[i];
		if (BRACKET_OPENERS.has(ch)) {
			const close = closers.get(i);
			if (close === undefined) return -1;
			i = close;
			awaitingPipelineCommand = false;
			continue;
		}
		if (BRACKET_CLOSERS.has(ch)) continue;
		if (ch === "|" && live[i - 1] !== "|" && live[i + 1] !== "|") {
			awaitingPipelineCommand = true;
			if (live[i + 1] === "&") i++;
			continue;
		}
		if (isWhitespace(ch)) {
			if (awaitingPipelineCommand) continue;
		} else awaitingPipelineCommand = false;
		if ((ch === "&" && live[i + 1] === "&") || (ch === "|" && live[i + 1] === "|")) return i;
		if (dialect !== "powershell" && ch === "&" && !REDIRECTION_NEIGHBOURS.has(live[i - 1]) && !REDIRECTION_NEIGHBOURS.has(live[i + 1])) {
			const wait = live.slice(i + 1).match(BASH_BACKGROUND_WAIT);
			return wait ? i + 1 + (wait.index ?? 0) : -1;
		}
		if (!STATUS_SEPARATORS.has(ch)) continue;

		let next = i;
		while (next < live.length && (STATUS_SEPARATORS.has(live[next]) || live[next] === " " || live[next] === "\t")) next++;
		if ((live[next] === "&" && live[next + 1] === "&") || (live[next] === "|" && live[next + 1] === "|")) return next;
		const word = wordAt(live, next);
		if (dialect !== "powershell" && BASH_STATUS_READER_WORDS.has(word)) return next;
		if (BRACKET_CLOSERS.has(live[next]) || (dialect !== "powershell" && BASH_STATUS_CLOSER_WORDS.has(word))) {
			i = next + (word ? word.length : 1) - 1;
			continue;
		}
		const powershellNativeStatus = dialect === "powershell" && !powershellPipelineEndsInCmdlet(live, pipe, i);
		return nextCommandReadsStatus(live, next, dialect, powershellNativeStatus) ? next : -1;
	}
	return -1;
}

/** Return a reason if a later commit reads an unprotected pipeline's status. */
export function verifierPipeReason(command, dialect = "bash") {
	const live = liveText(command, dialect);
	const commits = commitIndexes(live);
	if (commits.length === 0) return null;
	const initialPipefail = dialect !== "powershell"
		&& /^\s*set\s+-(?:o|[a-z]*o)\s+pipefail(?:;|&&|\n)/i.test(live)
		&& !/\bset\s+\+o\s+pipefail\b/i.test(live);
	if (initialPipefail) return null;
	const pipes = pipelineStarts(live);
	const closers = bracketClosers(live);
	const errexitStates = dialect === "powershell" ? [] : bashErrexitStates(live, pipes);
	for (let i = 0; i < pipes.length; i++) {
		const pipe = pipes[i];
		const read = statusReadAfterPipeline(live, pipe, dialect, errexitStates[i] ?? false, closers);
		if (read >= 0 && commits[commits.length - 1] > read) {
			return "A pipeline runs before git commit without active pipefail; rerun the verifier without a masking pipe or enable pipefail first.";
		}
	}
	return null;
}
