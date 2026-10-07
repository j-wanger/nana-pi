/**
 * @module packages/nana-pack/lib/pipe-guard.mjs
 * @purpose Detect pipeline exit masking before a git commit when pipefail is not active.
 * @inputs a shell command string from bash, PowerShell, or another shell-like tool.
 * @outputs a human-readable reason for a risky command, or null.
 * @effects none
 * @errors none; non-string input is treated as an empty command.
 */

function liveText(command) {
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
			const marker = line.match(/(?:^|[^<])<<-?(?!<)\s*['"]?([\w.-]+)['"]?\s*$/);
			if (marker) heredoc = marker[1];
			line = "";
		} else line += ch;
		text += ch;
	}
	return text;
}

/** Return a reason if an unprotected pipeline occurs before a commit command. */
export function verifierPipeReason(command, dialect = "bash") {
	const live = liveText(command);
	const commits = [...live.matchAll(/\bgit\s+(?:(?:-[\w-]+(?:=[^\s;&|()]+)?)(?:\s+[^\s;&|()]+)?\s+)*commit\b/gi)].map((m) => m.index ?? 0);
	if (commits.length === 0) return null;
	const events = [];
	for (let i = 0; i < live.length; i++) {
		if (live[i] === "|" && live[i - 1] !== "|" && live[i + 1] !== "|") events.push({ at: i, kind: "pipe" });
	}
	if (dialect !== "powershell") {
		const topLevel = new Uint8Array(live.length + 1);
		let depth = 0;
		for (let i = 0; i < live.length; i++) {
			topLevel[i] = depth === 0 ? 1 : 0;
			if (live[i] === "(" || live[i] === "{") depth++;
			else if ((live[i] === ")" || live[i] === "}") && depth > 0) depth--;
		}
		for (const m of live.matchAll(/(?:^|[;&|\n])\s*set\s+(-[^\s;&|]+)\s+pipefail\b/gi)) {
			const at = m.index ?? 0;
			if (topLevel[at] && !m[1].startsWith("+")) events.push({ at, kind: "enable" });
		}
		for (const m of live.matchAll(/(?:^|[;&|\n])\s*set\s+\+[^\s;&|]*o\s+pipefail\b/gi)) {
			const at = m.index ?? 0;
			if (topLevel[at]) events.push({ at, kind: "disable" });
		}
	}
	events.sort((a, b) => a.at - b.at);
	for (const commit of commits) {
		let enabled = false;
		for (const event of events) {
			if (event.at >= commit) break;
			if (event.kind === "enable") enabled = true;
			if (event.kind === "disable") enabled = false;
			if (event.kind === "pipe" && !enabled) return "A pipeline runs before git commit without active pipefail; rerun the verifier without a masking pipe or enable pipefail first.";
		}
	}
	return null;
}
