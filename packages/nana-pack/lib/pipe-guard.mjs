/**
 * @module packages/nana-pack/lib/pipe-guard.mjs
 * @purpose Detect pipeline exit masking before a git commit when pipefail is not active.
 * @inputs a shell command string from bash, PowerShell, or another shell-like tool.
 * @outputs a human-readable reason for a risky command, or null.
 * @effects none
 * @errors none; non-string input is treated as an empty command.
 */

function liveText(command, dialect = "bash") {
	if (dialect === "powershell") return liveTextPowerShell(String(command ?? ""));
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

/**
 * True when nothing but optional trailing spaces/CR and a newline (or the end of the command)
 * follows `pos` — a PowerShell here-string opener (`@'` / `@"`) must be the last thing on its
 * line (R-1062).
 */
function lineEndsAfter(source, pos) {
	let i = pos;
	while (source[i] === " " || source[i] === "\t" || source[i] === "\r") i++;
	return i >= source.length || source[i] === "\n";
}

/**
 * True when `#` at `source[i]` starts a PowerShell line comment rather than being literal inside
 * a bareword or URL — only at a token boundary: the start of the text, or right after whitespace
 * or one of the statement/pipe/brace/paren separators `; | & ( { } )` (R-1062, sol/astra final
 * review r1 MUST 1). Windows PowerShell Language Specification 3.0 §2.2.3 Comments: "A character
 * sequence is only recognized as a comment if that sequence begins with `#` or `<#`. For example,
 * hello#there is considered a single token whereas hello #there is considered the token hello
 * followed by a single-line comment. As well as following white space, the comment start
 * sequence can also be preceded by any expression-terminating or statement-terminating character
 * (such as `)`, `}`, `]`, `'`, `"`, or `;`)." — and §2.3.3 generic-token-char, whose exclusion set
 * (the characters that end a bareword token) includes the same separators: `{ } ( ) ; , | & $`.
 * (learn.microsoft.com/en-us/powershell/scripting/lang-spec/chapter-02, read 2026-10-12.)
 */
function startsPowerShellComment(source, i) {
	return source[i] === "#" && (i === 0 || /[\s;|&(){}]/.test(source[i - 1]));
}

/**
 * Find the index just past the matching close paren for a PowerShell `$(` opened at `start` (the
 * index right after the `(`), honouring the SAME lexical rules liveTextPowerShell's default state
 * applies — single- and double-quoted strings (with their own doubled-quote and backtick escapes),
 * here-strings, a backtick escaping the next character, a `#` line comment (only at a token
 * boundary, startsPowerShellComment) and a `<# … #>` block comment — so a `)` found inside any of
 * those can never close the subexpression early (R-1062, sol r1 MUST 1 / astra r1 MUST 1: sol's
 * repro puts a `)` inside a `# …` line comment). A nested `$( … )` recurses through this same
 * function, so its own close is found the same way. Returns -1 when unterminated.
 */
function matchPowerShellParen(source, start) {
	let depth = 1;
	let quote = "";
	let hereString = null;
	let comment = false;
	let block = false;
	let atLineStart = true;
	for (let i = start; i < source.length; i++) {
		const c = source[i];
		const nextAtLineStart = c === "\n";

		if (hereString) {
			if (atLineStart && c === hereString && source[i + 1] === "@") { i++; hereString = null; atLineStart = false; continue; }
			if (hereString === '"' && c === "$" && source[i + 1] === "(") {
				const end = matchPowerShellParen(source, i + 2);
				if (end === -1) return -1;
				i = end - 1;
				atLineStart = false;
				continue;
			}
			atLineStart = nextAtLineStart;
			continue;
		}
		if (block) {
			if (c === "#" && source[i + 1] === ">") { i++; block = false; atLineStart = false; continue; }
			atLineStart = nextAtLineStart;
			continue;
		}
		if (comment) {
			if (c === "\n") { comment = false; atLineStart = true; continue; }
			atLineStart = false;
			continue;
		}
		if (quote === "'") {
			if (c === "'" && source[i + 1] === "'") { i++; atLineStart = false; continue; }
			if (c === "'") { quote = ""; atLineStart = false; continue; }
			atLineStart = nextAtLineStart;
			continue;
		}
		if (quote === '"') {
			if (c === "`" && i + 1 < source.length) { i++; atLineStart = false; continue; }
			if (c === '"' && source[i + 1] === '"') { i++; atLineStart = false; continue; }
			if (c === "$" && source[i + 1] === "(") {
				const end = matchPowerShellParen(source, i + 2);
				if (end === -1) return -1;
				i = end - 1;
				atLineStart = false;
				continue;
			}
			if (c === '"') { quote = ""; atLineStart = false; continue; }
			atLineStart = nextAtLineStart;
			continue;
		}
		// default / live state
		if (c === "`" && i + 1 < source.length) { i++; atLineStart = false; continue; }
		if (startsPowerShellComment(source, i)) { comment = true; atLineStart = false; continue; }
		if (c === "<" && source[i + 1] === "#") { block = true; i++; atLineStart = false; continue; }
		if (c === "'") { quote = "'"; atLineStart = false; continue; }
		if (c === '"') { quote = '"'; atLineStart = false; continue; }
		if (c === "@" && (source[i + 1] === "'" || source[i + 1] === '"') && lineEndsAfter(source, i + 2)) {
			// advance past the `@` first, THEN read the quote character at the new `i` — the
			// same net effect as reading `source[i + 1]` and incrementing, written differently so
			// it is not a byte-for-byte duplicate of liveTextPowerShell's here-string-open line.
			i++;
			hereString = source[i];
			atLineStart = false;
			continue;
		}
		if (c === "(") { depth++; atLineStart = false; continue; }
		if (c === ")") { depth--; if (depth === 0) return i + 1; atLineStart = false; continue; }
		atLineStart = nextAtLineStart;
	}
	return -1;
}

/**
 * The PowerShell dialect of liveText (R-1062, sol plan r1 MUST 1 / r2 MUST 1; final review r1
 * MUST 1). Bash's lexer never ran this: in PowerShell a backtick escapes the next character (so
 * a backtick-escaped pipe or quote is never live), `"..."` honours a backtick escape and a
 * doubled `""` as a literal quote rather than closing the string, a `#` starts a line comment
 * only at a token boundary — startsPowerShellComment — so `issue#123` or a URL's `/#fragment`
 * stays literal, `<# … #>` is a block comment, and a here-string (`@'` / `@"` at the end of a
 * line, closed by a line that BEGINS with `'@` / `"@`) is never live except for a `$( … )`
 * subexpression inside the expandable (`@"`) form — the same exception a plain double-quoted
 * string gets. A subexpression's bound is found by matchPowerShellParen, which honours the same
 * rules (so a `)` inside a nested comment or here-string never ends it early), and its content is
 * then lexed again as live PowerShell (nesting counted the same way).
 */
function liveTextPowerShell(source) {
	let text = "";
	let quote = "";
	let hereString = null;
	let comment = false;
	let block = false;
	let atLineStart = true;
	for (let i = 0; i < source.length; i++) {
		const ch = source[i];
		const nextAtLineStart = ch === "\n";

		if (hereString) {
			if (atLineStart && ch === hereString && source[i + 1] === "@") {
				text += "  ";
				i++;
				hereString = null;
				atLineStart = false;
				continue;
			}
			if (hereString === '"' && ch === "$" && source[i + 1] === "(") {
				const end = matchPowerShellParen(source, i + 2);
				if (end !== -1) {
					text += ` (${liveTextPowerShell(source.slice(i + 2, end - 1))}) `;
					i = end - 1;
					atLineStart = false;
					continue;
				}
			}
			text += ch === "\n" ? "\n" : " ";
			atLineStart = nextAtLineStart;
			continue;
		}
		if (block) {
			if (ch === "#" && source[i + 1] === ">") { text += "  "; i++; atLineStart = false; block = false; continue; }
			text += ch === "\n" ? "\n" : " ";
			atLineStart = nextAtLineStart;
			continue;
		}
		if (comment) {
			if (ch === "\n") { comment = false; text += "\n"; atLineStart = true; continue; }
			text += " ";
			atLineStart = false;
			continue;
		}
		if (quote === "'") {
			if (ch === "'" && source[i + 1] === "'") { text += "  "; i++; atLineStart = false; continue; }
			if (ch === "'") { quote = ""; text += " "; atLineStart = false; continue; }
			text += ch === "\n" ? "\n" : " ";
			atLineStart = nextAtLineStart;
			continue;
		}
		if (quote === '"') {
			if (ch === "`" && i + 1 < source.length) { text += "  "; i++; atLineStart = false; continue; }
			if (ch === '"' && source[i + 1] === '"') { text += "  "; i++; atLineStart = false; continue; }
			if (ch === "$" && source[i + 1] === "(") {
				const end = matchPowerShellParen(source, i + 2);
				if (end !== -1) {
					text += ` (${liveTextPowerShell(source.slice(i + 2, end - 1))}) `;
					i = end - 1;
					atLineStart = false;
					continue;
				}
			}
			if (ch === '"') { quote = ""; text += " "; atLineStart = false; continue; }
			text += ch === "\n" ? "\n" : " ";
			atLineStart = nextAtLineStart;
			continue;
		}
		// default / live state
		if (ch === "`" && i + 1 < source.length) { text += "  "; i++; atLineStart = false; continue; }
		if (startsPowerShellComment(source, i)) { comment = true; text += " "; atLineStart = false; continue; }
		if (ch === "<" && source[i + 1] === "#") { block = true; text += "  "; i++; atLineStart = false; continue; }
		if (ch === "'") { quote = "'"; text += " "; atLineStart = false; continue; }
		if (ch === '"') { quote = '"'; text += " "; atLineStart = false; continue; }
		if (ch === "@" && (source[i + 1] === "'" || source[i + 1] === '"') && lineEndsAfter(source, i + 2)) {
			hereString = source[i + 1];
			text += "  ";
			i++;
			atLineStart = false;
			continue;
		}
		text += ch;
		atLineStart = nextAtLineStart;
	}
	return text;
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
