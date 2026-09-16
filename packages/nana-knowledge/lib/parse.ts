// Markdown -> indexable rows. Two shapes:
//   articles — one row per *.md file
//   ledger   — one row per entry in a line-oriented ledger (loops/DOCTRINE.md)
import * as path from "node:path";

export interface Row {
	/** Unique key within the index: the file path, plus #L<line> for ledger entries. */
	key: string;
	path: string;
	/** 1-based line of a ledger entry; null for whole-file articles. */
	loc: number | null;
	title: string;
	body: string;
}

const FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function splitFrontmatter(content: string): { meta: Record<string, string>; body: string } {
	const m = FM.exec(content);
	if (!m) return { meta: {}, body: content };
	const meta: Record<string, string> = {};
	for (const line of m[1].split(/\r?\n/)) {
		const i = line.indexOf(":");
		if (i <= 0 || /^\s/.test(line)) continue;
		meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
	}
	return { meta, body: content.slice(m[0].length) };
}

/** Frontmatter `title:` > first H1 > filename. */
export function articleTitle(filePath: string, meta: Record<string, string>, body: string): string {
	if (meta.title) return meta.title.slice(0, 200);
	const h1 = /^#[ \t]+(.+)$/m.exec(body);
	if (h1) return h1[1].trim().replace(/\s*#+\s*$/, "").slice(0, 200);
	return path.basename(filePath, path.extname(filePath)).replace(/[-_]+/g, " ");
}

export function parseArticle(filePath: string, content: string): Row[] {
	const { meta, body } = splitFrontmatter(content);
	return [{
		key: filePath,
		path: filePath,
		loc: null,
		title: articleTitle(filePath, meta, body),
		body: body.trim(),
	}];
}

/**
 * Ledger entries: a line starting with `- ` or a digit that contains `[uses:`, plus the
 * indented continuation lines beneath it (DOCTRINE allows up to 3 physical lines per
 * entry). Fenced code blocks are skipped — the entry contract in DOCTRINE's header is a
 * template, not doctrine.
 */
export function parseLedger(filePath: string, content: string): Row[] {
	const lines = content.split(/\r?\n/);
	const rows: Row[] = [];
	let fenced = false;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; continue; }
		if (fenced) continue;
		if (!isEntryLine(line)) continue;
		const startLine = i + 1;
		const parts = [line.trim()];
		for (let j = i + 1; j < lines.length; j++) {
			const next = lines[j];
			if (!/^\s+\S/.test(next)) break;       // blank, or a new left-aligned block
			if (isEntryLine(next)) break;          // an indented sub-entry starts its own row
			parts.push(next.trim());
			i = j;
		}
		const body = parts.join(" ");
		rows.push({
			key: `${filePath}#L${startLine}`,
			path: filePath,
			loc: startLine,
			title: ledgerTitle(body),
			body,
		});
	}
	return rows;
}

export function isEntryLine(line: string): boolean {
	const t = line.trim();
	return (t.startsWith("- ") || /^\d/.test(t)) && t.includes("[uses:");
}

/** A readable handle for a doctrine line: drop the bookkeeping prefix, keep the claim. */
function ledgerTitle(body: string): string {
	const stripped = body
		.replace(/^[-*]\s+/, "")
		.replace(/^\[uses:\d+\]\s*/, "")
		.replace(/^\[pinned\]\s*/, "")
		.trim();
	const m = /^\(([a-z]+)\)\s*([\s\S]*)$/.exec(stripped);
	const tag = m ? m[1] : null;
	const claim = (m ? m[2] : stripped).replace(/\s+/g, " ");
	const short = claim.length > 110 ? claim.slice(0, 107).replace(/\s+\S*$/, "") + "…" : claim;
	return tag ? `doctrine(${tag}): ${short}` : `doctrine: ${short}`;
}
