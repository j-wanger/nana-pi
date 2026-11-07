/**
 * @module apps/bench/lib/jsonl.mjs
 * @purpose Read anatomy's append logs with optional torn-tail repair.
 * @inputs A file path and optional repair flag (default true).
 * @outputs readJsonl returns rows and the quarantined tail count.
 * @effects disk (reads the log; repair may quarantine a torn tail and restore the newline boundary)
 * @errors Unreadable input returns no rows; repair write errors propagate.
 */
import fs from "node:fs/promises";

/** Read an append log, quarantining torn bytes before another writer can append. */
export async function readJsonl(file, { repair = true } = {}) {
	let raw;
	try {
		raw = await fs.readFile(file, "utf8");
	} catch {
		return { rows: [], quarantined: 0 };
	}
	let body = raw;
	let torn = "";
	if (body.length && !body.endsWith("\n")) {
		const cut = body.lastIndexOf("\n");
		torn = cut < 0 ? body : body.slice(cut + 1);
		try {
			JSON.parse(torn); // complete, just missing its newline
			body = `${body}\n`;
			torn = "";
		} catch {
			body = cut < 0 ? "" : body.slice(0, cut + 1);
		}
	}
	if (repair && (torn || body !== raw)) {
		if (torn) await fs.appendFile(`${file}.quarantine`, `${new Date().toISOString()} torn-tail ${JSON.stringify(torn)}\n`);
		await fs.writeFile(file, body);
	}
	const rows = [];
	for (const line of body.split("\n")) {
		if (!line.trim()) continue;
		try {
			rows.push(JSON.parse(line));
		} catch {
			/* a mid-file corruption: skip the line, keep the rest */
		}
	}
	return { rows, quarantined: torn ? 1 : 0 };
}
