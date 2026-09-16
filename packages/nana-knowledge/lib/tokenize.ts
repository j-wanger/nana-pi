// Prompt -> FTS5 query. Deliberately dumb: alnum runs, a short stopword list, and
// an OR-join. No stemming here (the FTS5 table carries the porter tokenizer).

export const STOPWORDS: ReadonlySet<string> = new Set([
	"the", "and", "for", "are", "but", "not", "you", "your", "with", "that", "this", "from",
	"have", "has", "had", "was", "were", "will", "would", "can", "could", "should", "what",
	"when", "where", "which", "who", "why", "how", "all", "any", "its", "our", "out", "get",
	"got", "let", "lets", "please", "just", "now", "then", "than", "them", "they", "there",
	"here", "into", "onto", "about", "over", "under", "make", "made", "does", "did", "done",
	"use", "using", "used", "need", "want", "like", "some", "more", "most", "one", "two",
	"also", "been", "being", "each", "very", "much", "may", "might", "must", "shall",
	"add", "added", "run", "ran", "see", "saw", "look", "take", "put", "set", "new", "old",
	"yes", "not", "dont", "cant", "wont", "isnt", "were", "weve", "ive", "thats",
]);

/** Lowercased alnum runs. Keeps digits (version numbers matter). */
export function tokenize(text: string): string[] {
	return (text.toLowerCase().match(/[a-z0-9_]+/g) || []);
}

/** Tokens worth searching on: length > 2 and not a stopword. Order preserved, deduped. */
export function meaningfulTokens(text: string): string[] {
	const out: string[] = [];
	const seen = new Set<string>();
	for (const t of tokenize(text)) {
		if (t.length <= 2) continue;
		if (STOPWORDS.has(t)) continue;
		if (seen.has(t)) continue;
		seen.add(t);
		out.push(t);
	}
	return out;
}

const NOTIFICATION_PREFIXES = ["<system-reminder>", "[SYSTEM NOTIFICATION", "<task-notification>"];

/**
 * Reasons a prompt is not worth a pull. Returns null when the prompt should be queried.
 * Order matters only for the reported reason.
 */
export function skipReason(prompt: unknown): string | null {
	if (typeof prompt !== "string") return "not-a-string";
	const p = prompt.trim();
	if (p.length < 12) return "too-short";
	if (p.startsWith("/")) return "slash-command";
	// Harness notifications arrive on the same channel as the owner's own typing.
	// They are machine text about the session, not a question — the first live run
	// pulled pointers for a task-completion notice.
	if (NOTIFICATION_PREFIXES.some((x) => p.startsWith(x))) return "harness-notification";
	if (meaningfulTokens(p).length < 2) return "too-few-tokens";
	return null;
}

/** FTS5 MATCH string. Tokens are alnum-only but quote anyway — FTS5 has keywords. */
export function ftsQuery(tokens: string[]): string {
	return tokens.map((t) => `"${t}"`).join(" OR ");
}
