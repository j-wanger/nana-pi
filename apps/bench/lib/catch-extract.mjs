/**
 * @module apps/bench/lib/catch-extract.mjs
 * @purpose Structurally extract reviewer findings from the markdown review corpus into rows,
 *  recording a reason for every item it does not turn into a row.
 * @inputs a reviews root directory of tranche<N>-2026-09-28 dirs holding reviewer reports and fix
 *  briefs
 * @outputs exports
 *  REPORT_RE/FIX_RE/listCorpus/answeredReport/splitOutsideTicks/refsOf/firstSentence/parseReport/extractCorpus;
 *  returns {rows, skipped, stats, fixBriefs} in memory
 * @effects disk (reads the review markdown only)
 * @errors none — unparsable items are returned in `skipped` with a reason; a missing reviews root
 *  surfaces as the underlying fs error
 */
// catch-extract.mjs — STRUCTURAL extraction of reviewer findings from the markdown review corpus.
// No model is used here. Every top-level list item / bold-led paragraph that does not become a row
// is returned in `skipped` with a reason, so nothing is dropped silently.
import fs from "node:fs";
import path from "node:path";

export const REPORT_RE = /^([a-z0-9]+)-(sol-r(\d)|astra-land|astra-r(\d))\.md$/;
export const FIX_RE = /^([a-z0-9]+)-fix(\d*)-brief\.md$/;
const SEV = "CRITICAL|HIGH|MEDIUM|MED|LOW|P0|P1|P2|P3";
const STATUS_RE = /\b(NOT FIXED|FIXED|PARTIAL|RULED|CONFIRMED)\b|\bnot (?:fully )?fixed\b/;
const ROLE_RE = /\[([^\]]*\b(?:adversarial|scope|compat(?:ibility)?)\b[^\]]*)\]/gi;
const REF_RE = /([\w.~@/-]*[\w-]+\.(?:jsonl|json|mjs|js|ts|md|sh|txt)(?![\w]))(?::(\d+)(?:\s*[-–]\s*(\d+))?)?/g;

/** Enumerate the corpus: reviewer reports and fix briefs, sorted by path (deterministic). */
export function listCorpus(reviewsRoot) {
	const dirs = fs.readdirSync(reviewsRoot).filter((d) => /^tranche\d-2026-09-28$/.test(d)).sort();
	const reports = [];
	const fixBriefs = [];
	for (const d of dirs) {
		for (const f of fs.readdirSync(path.join(reviewsRoot, d)).sort()) {
			const m = f.match(REPORT_RE);
			if (m) {
				const model = m[2].startsWith("sol") ? "sol" : "astra";
				const round = model === "sol" ? Number(m[3]) : m[2] === "astra-land" ? 1 : Number(m[4]);
				reports.push({ id: `${m[1]}/${model}-r${round}`, lane: m[1], model, round, file: `${d}/${f}`, name: f.replace(/\.md$/, "") });
			}
			const fm = f.match(FIX_RE);
			if (fm) fixBriefs.push({ lane: fm[1], n: fm[2] ? Number(fm[2]) : 1, file: `${d}/${f}` });
		}
	}
	return { reports, fixBriefs };
}

/** Which review report a fix brief answers: the first `<lane>-(sol-rN|astra-*)` it tells the worker to read. */
export function answeredReport(fixText, lane) {
	const head = fixText.split("\n").slice(0, 4).join("\n");
	const re = new RegExp(`\\b${lane}-(sol-r\\d|astra-land|astra-r\\d)(?:\\.md)?\\b`, "g");
	const readIdx = head.search(/\bRead\b/);
	const scope = readIdx >= 0 ? head.slice(readIdx) : "";
	const m = re.exec(scope);
	return m ? `${lane}-${m[1]}` : null;
}

/** Split on "; " that is not inside a `code span`. */
export function splitOutsideTicks(s) {
	const out = [];
	let cur = "";
	let tick = false;
	for (let i = 0; i < s.length; i++) {
		const ch = s[i];
		if (ch === "`") tick = !tick;
		if (ch === ";" && !tick && /\s/.test(s[i + 1] ?? "")) {
			out.push(cur.trim());
			cur = "";
			continue;
		}
		cur += ch;
	}
	out.push(cur.trim());
	return out.filter(Boolean);
}

const strip = (s) => s.replace(/\*\*/g, "").replace(/`/g, "").trim();
const normSev = (s) => (s ? (s.toUpperCase() === "MED" ? "MEDIUM" : s.toUpperCase()) : null);

function classifyHeading(t) {
	const s = strip(t);
	if (new RegExp(`^(${SEV})$`).test(s)) return { kind: "findings", sev: normSev(s), headingOnly: true };
	if (new RegExp(`^(${SEV})\\s*[—–-]`).test(s)) return { item: true };
	if (/^R\d+\b|round-?\d+ findings/i.test(s)) return { kind: "verify" };
	if (/\bnew\b|findings|blocker|defect/i.test(s)) return { kind: "findings" };
	if (/carry|residual/i.test(s)) return { kind: "carry" };
	return { kind: "other" };
}

// A bold/plain label line: MUST / CARRY / NEW / residuals. Returns {kind, inline} or null.
function labelOf(line) {
	const m = line.match(/^\*\*([^*]+?)\*\*\s*(.*)$/) || line.match(/^((?:MUST|CARRY|UPSTREAM[- ]CONTRACT[^:]*)):\s*(.*)$/);
	if (!m) return null;
	const lab = m[1].replace(/:$/, "").trim();
	let inline = m[2].trim();
	if (/^:/.test(inline)) inline = inline.slice(1).trim();
	if (/^MUST\b(?!\s*\d)/.test(lab) && !STATUS_RE.test(lab)) return { kind: "must", inline };
	if (/^(CARRY|land residuals|residuals?)\b/i.test(lab)) return { kind: "carry", inline, split: true };
	if (/^new\b[^—–]*$/i.test(lab) || /^new[- ]defect/i.test(lab)) return { kind: "findings", inline };
	if (/^(UPSTREAM|SCORE|VERDICT)/i.test(lab)) return { kind: "other", inline: "" };
	return null;
}

function leadInfo(text) {
	const lead = strip(text).slice(0, 90);
	const sevM = lead.match(new RegExp(`^(?:\\d+\\.\\s*)?(?:R\\d+\\s+)?(?:#\\d+\\s+)?(?:NEW\\s+)?(?:r\\d\\s+)?(${SEV})\\b`)) || lead.match(/^(high|medium|low)(?=\s*[:—–/-]|\s+cost)/i);
	const isVerify = STATUS_RE.test(lead.slice(0, 60)) && !/^NEW\b/.test(lead);
	const isNew = /^NEW\b/.test(lead);
	const isCarry = /^(CARRY|Other residuals|Land residuals)\b/i.test(lead);
	const isMustStatus = /^MUST\s*\d*\s*[—–-]/.test(lead) && STATUS_RE.test(lead);
	return { sev: sevM ? normSev(sevM[1]) : null, isVerify: isVerify || isMustStatus, isNew, isCarry };
}

export function refsOf(text) {
	const out = [];
	for (const m of text.matchAll(REF_RE)) {
		const file = m[1];
		if (/^\d/.test(path.basename(file))) continue;
		out.push({ file, base: path.basename(file), from: m[2] ? Number(m[2]) : null, to: m[3] ? Number(m[3]) : m[2] ? Number(m[2]) : null });
	}
	return out;
}

export function firstSentence(text) {
	const t = text.replace(/\s*\n\s*/g, " ").trim();
	const m = t.match(/^(.{8,}?[.!?])(?:\*\*|`)?(?=\s|$)/);
	return (m ? m[1] : t).slice(0, 400);
}

/**
 * Parse one report into rows. Blocks: headings, list items (indent 0), bold-led paragraphs,
 * label lines. Continuation lines attach to the open item.
 */
export function parseReport(text, meta) {
	const lines = text.replace(/\r\n/g, "\n").split("\n");
	const rows = [];
	const skipped = [];
	let section = { kind: "none", sev: null };
	let open = null; // {rowIndex | skipIndex, lines}
	let sectionFreshHeading = false; // findings heading whose first block is prose → one item
	const verdict = (text.match(/VERDICT:?\s*\**\s*(LAND|BLOCK)/) || [])[1] || null;
	const score = (text.match(/SCORE:?\**\s*(\d+)\s*\/\s*10/) || [])[1];

	const close = () => {
		if (!open) return;
		open.target.body = open.lines.join("\n").trim();
		open = null;
	};
	const startRow = (kind, textFirst, extra = {}) => {
		close();
		const li = leadInfo(textFirst);
		const row = { kind, severity: li.sev ?? extra.sev ?? null, item_no: extra.item_no ?? null, section: section.kind, _first: textFirst };
		rows.push(row);
		open = { target: row, lines: [textFirst] };
		return row;
	};
	const startSkip = (reason, textFirst) => {
		close();
		// In an un-headed report, an unlabeled item elaborates the previous row.
		if (section.kind === "none" && rows.length && reason === "unlabeled") {
			const prev = rows[rows.length - 1];
			skipped.push({ reason: "attached_as_body", section: "none", text: textFirst.slice(0, 160) });
			open = { target: prev, lines: [prev.body ?? prev._first, textFirst] };
			prev.body = undefined;
			return;
		}
		const s = { reason, section: section.kind, text: textFirst.slice(0, 160) };
		skipped.push(s);
		open = { target: s, lines: [textFirst] };
	};
	const itemFrom = (textFirst, item_no, isParagraph) => {
		const li = leadInfo(textFirst);
		if (li.isVerify) return startRow("verification", textFirst, { item_no });
		if (li.isCarry) return startRow("carry", textFirst, { item_no });
		const inSec = ["findings", "carry", "must", "verify"].includes(section.kind);
		if (li.sev || li.isNew || (inSec && !isParagraph)) {
			const kind = section.kind === "carry" ? "carry" : section.kind === "verify" ? "verification" : "finding";
			const sev = section.kind === "must" ? "MUST" : section.sev;
			return startRow(kind, textFirst, { item_no, sev });
		}
		if (isParagraph) {
			close();
			section = { kind: section.kind === "none" ? "none" : "other", sev: null };
			return startSkip("unlabeled_paragraph", textFirst);
		}
		return startSkip(section.kind === "other" ? "notes_section" : "unlabeled", textFirst);
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const t = line.trim();
		if (!t) {
			if (open) open.lines.push("");
			continue;
		}
		if (/^\**VERDICT:?/.test(t) || /^\**SCORE:?/.test(t)) {
			close();
			section = { kind: "other", sev: null };
			continue;
		}
		const h = line.match(/^#{1,6}\s+(.*)$/);
		if (h) {
			close();
			const c = classifyHeading(h[1]);
			if (c.item) {
				section = { kind: "findings", sev: null };
				startRow("finding", h[1]);
				open.absorb = true; // a heading item owns everything up to the next heading
				continue;
			}
			section = { kind: c.kind, sev: c.sev ?? null };
			sectionFreshHeading = c.kind === "findings" && !c.headingOnly;
			continue;
		}
		const lab = /^\S/.test(line) ? labelOf(t) : null;
		if (lab && !/^\s*([-*]|\d+\.)\s/.test(line)) {
			close();
			section = { kind: lab.kind, sev: null };
			sectionFreshHeading = false;
			skipped.push({ reason: lab.kind === "other" ? "label_other" : "label", section: lab.kind, text: t.slice(0, 160) });
			const inl = lab.inline.replace(/^\[\]$/, "").trim();
			if (inl) {
				const parts = lab.split ? splitOutsideTicks(inl) : [inl];
				for (const p of parts) {
					if (/^(none\.?|\[\])$/i.test(p)) continue;
					const kind = lab.kind === "carry" ? "carry" : "finding";
					startRow(kind, p, { sev: lab.kind === "must" ? "MUST" : null });
					close();
				}
			}
			continue;
		}
		const li = line.match(/^(\s*)([-*]|(\d+)\.)\s+(.*)$/);
		if (open?.absorb) {
			open.lines.push(line);
			continue;
		}
		if (li && li[1].length <= 1) {
			sectionFreshHeading = false;
			itemFrom(li[4], li[3] ? Number(li[3]) : null, false);
			continue;
		}
		if (li || /^\s{2,}\S/.test(line) || /^\|/.test(t) || /^```/.test(t)) {
			// nested list / indented continuation / table / code: body of the open block
			if (open) open.lines.push(line);
			else skipped.push({ reason: "orphan_continuation", section: section.kind, text: t.slice(0, 160) });
			if (/^```/.test(t)) {
				// swallow the fenced block
				for (i++; i < lines.length; i++) {
					if (open) open.lines.push(lines[i]);
					if (/^\s*```/.test(lines[i])) break;
				}
			}
			continue;
		}
		// plain paragraph line at column 0
		if (/^\*\*/.test(t)) {
			sectionFreshHeading = false;
			itemFrom(t, null, true);
			continue;
		}
		if (sectionFreshHeading && !open) {
			startRow("finding", t, { sev: section.sev });
			open.absorb = true;
			sectionFreshHeading = false;
			continue;
		}
		if (open && open.target && (section.kind !== "none" || rows.includes(open.target))) {
			open.lines.push(line);
			continue;
		}
		startSkip("prose", t);
	}
	close();

	const out = rows.map((r, n) => {
		const body = r.body ?? r._first;
		const roles = [...body.matchAll(ROLE_RE)].flatMap((m) => m[1].toLowerCase().match(/adversarial|scope|compat/g) ?? []);
		const refs = refsOf(body);
		const first = refs.find((x) => x.from != null) ?? refs[0];
		return {
			id: `${meta.id}#${n + 1}`,
			lane: meta.lane,
			reviewer_model: meta.model,
			round: meta.round,
			rung: `${meta.model}-r${meta.round}`,
			report: meta.name,
			kind: r.kind,
			section: r.section,
			item_no: r.item_no,
			role_tag: roles.length ? [...new Set(roles)].sort().join("+") : null,
			severity: r.severity,
			surface: first ? `${first.file}${first.from != null ? `:${first.from}${first.to !== first.from ? `-${first.to}` : ""}` : ""}` : null,
			refs,
			claim: firstSentence(strip(r._first.replace(ROLE_RE, "")).replace(/^\d+\.\s*/, "")),
			body,
		};
	});
	return { rows: out, skipped: skipped.map((s) => ({ report: meta.name, reason: s.reason, section: s.section, text: s.text })), verdict, score: score ? Number(score) : null };
}

/** Extract the whole corpus. Returns rows, skipped, per-report stats; deterministic order. */
export function extractCorpus(reviewsRoot) {
	const { reports, fixBriefs } = listCorpus(reviewsRoot);
	const answers = {};
	for (const fb of fixBriefs) {
		const txt = fs.readFileSync(path.join(reviewsRoot, fb.file), "utf8");
		const rep = answeredReport(txt, fb.lane);
		fb.answers = rep;
		if (rep) (answers[rep] ??= []).push(fb.file);
	}
	const rows = [];
	const skipped = [];
	const stats = [];
	for (const r of reports) {
		const txt = fs.readFileSync(path.join(reviewsRoot, r.file), "utf8");
		const p = parseReport(txt, r);
		rows.push(...p.rows);
		skipped.push(...p.skipped);
		const byKind = p.rows.reduce((a, x) => ((a[x.kind] = (a[x.kind] ?? 0) + 1), a), {});
		stats.push({ report: r.name, lane: r.lane, rung: `${r.model}-r${r.round}`, verdict: p.verdict, score: p.score, rows: p.rows.length, ...byKind, answered_by: answers[r.name] ?? [], parsed: p.rows.length > 0 });
	}
	return { reports, fixBriefs, rows, skipped, stats };
}
